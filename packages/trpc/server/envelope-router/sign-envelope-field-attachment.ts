import {
  ATTACHMENT_FIELD_ALLOWED_FILE_TYPES,
  ATTACHMENT_FIELD_IMAGE_TYPES,
} from '@documenso/lib/constants/field-attachments';
import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import { validateFieldAuth } from '@documenso/lib/server-only/document/validate-field-auth';
import { createDocumentData } from '@documenso/lib/server-only/document-data/create-document-data';
import { DOCUMENT_AUDIT_LOG_TYPE } from '@documenso/lib/types/document-audit-logs';
import { ZAttachmentFieldMeta } from '@documenso/lib/types/field-meta';
import { putFileServerSide } from '@documenso/lib/universal/upload/put-file.server';
import { createDocumentAuditLogData } from '@documenso/lib/utils/document-audit-logs';
import { assertRecipientNotExpired } from '@documenso/lib/utils/recipients';
import { prisma } from '@documenso/prisma';
import { DocumentStatus, FieldType, RecipientRole, SigningStatus } from '@prisma/client';

import { procedure } from '../trpc';
import {
  ZSignEnvelopeFieldAttachmentRequestSchema,
  ZSignEnvelopeFieldAttachmentResponseSchema,
} from './sign-envelope-field-attachment.types';

/**
 * Strip any path components a client may have smuggled into the file name and
 * keep it within a sane length.
 */
const sanitizeFileName = (fileName: string) => {
  const baseName = fileName.replace(/^.*[\\/]/, '').trim();

  return (baseName || 'attachment').slice(0, 255);
};

// Note that this is an unauthenticated public procedure route, guarded by the recipient token.
export const signEnvelopeFieldAttachmentRoute = procedure
  .input(ZSignEnvelopeFieldAttachmentRequestSchema)
  .output(ZSignEnvelopeFieldAttachmentResponseSchema)
  .mutation(async ({ input, ctx }) => {
    const { user, metadata } = ctx;
    const { payload, file } = input;
    const { token, fieldId, authOptions, previewImageAsBase64 } = payload;

    ctx.logger.info({
      input: {
        fieldId,
      },
    });

    const recipient = await prisma.recipient.findFirst({
      where: {
        token,
      },
    });

    if (!recipient) {
      throw new AppError(AppErrorCode.NOT_FOUND);
    }

    const field = await prisma.field.findFirst({
      where: {
        id: fieldId,
        recipient: {
          ...(recipient.role === RecipientRole.ASSISTANT
            ? {
                signingStatus: {
                  not: SigningStatus.SIGNED,
                },
                signingOrder: {
                  gte: recipient.signingOrder ?? 0,
                },
                envelopeId: recipient.envelopeId,
              }
            : {
                id: recipient.id,
              }),
        },
      },
      include: {
        envelope: {
          include: {
            recipients: true,
            documentMeta: true,
          },
        },
        recipient: true,
      },
    });

    if (!field) {
      throw new AppError(AppErrorCode.NOT_FOUND, {
        message: `Field ${fieldId} not found`,
      });
    }

    const { envelope } = field;

    if (envelope.internalVersion !== 2) {
      throw new AppError(AppErrorCode.NOT_FOUND, {
        message: `Envelope ${envelope.id} is not a version 2 envelope`,
      });
    }

    if (field.type !== FieldType.ATTACHMENT) {
      throw new AppError(AppErrorCode.INVALID_REQUEST, {
        message: `Field ${fieldId} is not an attachment field`,
      });
    }

    if (envelope.deletedAt) {
      throw new AppError(AppErrorCode.INVALID_REQUEST, {
        message: `Document ${envelope.id} has been deleted`,
      });
    }

    if (envelope.status !== DocumentStatus.PENDING) {
      throw new AppError(AppErrorCode.INVALID_REQUEST, {
        message: `Document ${envelope.id} must be pending for signing`,
      });
    }

    assertRecipientNotExpired(recipient);
    assertRecipientNotExpired(field.recipient);

    if (recipient.signingStatus === SigningStatus.SIGNED || field.recipient.signingStatus === SigningStatus.SIGNED) {
      throw new AppError(AppErrorCode.INVALID_REQUEST, {
        message: `Recipient ${recipient.id} has already signed`,
      });
    }

    if (field.fieldMeta?.readOnly) {
      throw new AppError(AppErrorCode.INVALID_REQUEST, {
        message: `Field ${fieldId} is read only`,
      });
    }

    if (!ATTACHMENT_FIELD_ALLOWED_FILE_TYPES.includes(file.type)) {
      throw new AppError(AppErrorCode.INVALID_BODY, {
        message: 'This file type is not allowed',
      });
    }

    const fieldMeta = ZAttachmentFieldMeta.safeParse(field.fieldMeta);

    if (
      fieldMeta.success &&
      fieldMeta.data.fileTypes === 'images' &&
      !ATTACHMENT_FIELD_IMAGE_TYPES.includes(file.type)
    ) {
      throw new AppError(AppErrorCode.INVALID_BODY, {
        message: 'Only images can be uploaded into this field',
      });
    }

    const derivedRecipientActionAuth = await validateFieldAuth({
      documentAuthOptions: envelope.authOptions,
      recipient,
      field,
      userId: user?.id,
      authOptions,
    });

    const assistant = recipient.role === RecipientRole.ASSISTANT ? recipient : undefined;

    const fileName = sanitizeFileName(file.name);

    // Store the file outside the transaction since object storage uploads are not transactional.
    const { type, data } = await putFileServerSide({
      name: fileName,
      type: file.type,
      arrayBuffer: async () => file.arrayBuffer(),
    });

    const documentData = await createDocumentData({ type, data });

    return await prisma.$transaction(async (tx) => {
      // Replace any previous upload. The old DocumentData row is intentionally
      // left orphaned, matching how resealing handles superseded rows.
      await tx.fieldUpload.deleteMany({
        where: {
          fieldId: field.id,
        },
      });

      const updatedField = await tx.field.update({
        where: {
          id: field.id,
        },
        data: {
          customText: fileName,
          inserted: true,
          fieldUpload: {
            create: {
              fileName,
              mimeType: file.type,
              fileSize: file.size,
              previewImageAsBase64: ATTACHMENT_FIELD_IMAGE_TYPES.includes(file.type)
                ? (previewImageAsBase64 ?? null)
                : null,
              documentDataId: documentData.id,
            },
          },
        },
        include: {
          fieldUpload: true,
        },
      });

      await tx.documentAuditLog.create({
        data: createDocumentAuditLogData({
          type:
            assistant && field.recipientId !== assistant.id
              ? DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_FIELD_PREFILLED
              : DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_FIELD_INSERTED,
          envelopeId: envelope.id,
          user: {
            email: assistant?.email ?? recipient.email,
            name: assistant?.name ?? recipient.name,
          },
          requestMetadata: metadata.requestMetadata,
          data: {
            recipientEmail: recipient.email,
            recipientId: recipient.id,
            recipientName: recipient.name,
            recipientRole: recipient.role,
            fieldId: updatedField.secondaryId,
            field: {
              type: FieldType.ATTACHMENT,
              data: fileName,
            },
            fieldSecurity: derivedRecipientActionAuth
              ? {
                  type: derivedRecipientActionAuth,
                }
              : undefined,
          },
        }),
      });

      return {
        signedField: updatedField,
      };
    });
  });
