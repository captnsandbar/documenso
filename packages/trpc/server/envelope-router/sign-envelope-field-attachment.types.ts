import { ATTACHMENT_FIELD_PREVIEW_MAX_LENGTH } from '@documenso/lib/constants/field-attachments';
import { ZRecipientActionAuthSchema } from '@documenso/lib/types/document-auth';
import { ZFieldSchema } from '@documenso/lib/types/field';
import FieldUploadSchema from '@documenso/prisma/generated/zod/modelSchema/FieldUploadSchema';
import { z } from 'zod';
import { zfd } from 'zod-form-data';

import { zfdFile, zodFormData } from '../../utils/zod-form-data';

export const ZSignEnvelopeFieldAttachmentPayloadSchema = z.object({
  token: z.string(),
  fieldId: z.number(),
  authOptions: ZRecipientActionAuthSchema.optional(),
  previewImageAsBase64: z
    .string()
    .regex(/^data:image\/(png|jpeg|webp);base64,/, 'Preview must be a png, jpeg or webp data URI')
    .max(ATTACHMENT_FIELD_PREVIEW_MAX_LENGTH, 'Preview image is too large')
    .optional(),
});

export const ZSignEnvelopeFieldAttachmentRequestSchema = zodFormData({
  payload: zfd.json(ZSignEnvelopeFieldAttachmentPayloadSchema),
  file: zfdFile(),
});

export const ZSignEnvelopeFieldAttachmentResponseSchema = z.object({
  signedField: ZFieldSchema.omit({
    templateId: true,
    documentId: true,
  }).extend({
    fieldUpload: FieldUploadSchema.pick({
      id: true,
      fileName: true,
      mimeType: true,
      fileSize: true,
      previewImageAsBase64: true,
    }).nullish(),
  }),
});

export type TSignEnvelopeFieldAttachmentPayload = z.infer<typeof ZSignEnvelopeFieldAttachmentPayloadSchema>;
export type TSignEnvelopeFieldAttachmentRequest = z.infer<typeof ZSignEnvelopeFieldAttachmentRequestSchema>;
export type TSignEnvelopeFieldAttachmentResponse = z.infer<typeof ZSignEnvelopeFieldAttachmentResponseSchema>;
