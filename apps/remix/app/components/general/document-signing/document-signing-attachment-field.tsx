import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import { ZAttachmentFieldMeta } from '@documenso/lib/types/field-meta';
import type { FieldWithSignature } from '@documenso/prisma/types/field-with-signature';
import { trpc } from '@documenso/trpc/react';
import type { TRemovedSignedFieldWithTokenMutationSchema } from '@documenso/trpc/server/field-router/schema';
import { useToast } from '@documenso/ui/primitives/use-toast';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { PaperclipIcon } from 'lucide-react';
import { useRef } from 'react';
import { useRevalidator } from 'react-router';

import {
  SignFieldAttachmentDialog,
  type SignFieldAttachmentDialogResult,
} from '~/components/dialogs/sign-field-attachment-dialog';

import { DocumentSigningFieldContainer } from './document-signing-field-container';
import { DocumentSigningFieldsLoader, DocumentSigningFieldsUninserted } from './document-signing-fields';
import { useDocumentSigningRecipientContext } from './document-signing-recipient-provider';

export type DocumentSigningAttachmentFieldProps = {
  field: FieldWithSignature;
};

/**
 * Legacy (internalVersion 1) signing field for FieldType.ATTACHMENT ("File Upload").
 *
 * Uploads go through the multipart `envelope.field.signAttachment` procedure, removal
 * goes through the regular `field.removeSignedFieldWithToken` procedure. Requires
 * `<SignFieldAttachmentDialog.Root />` to be mounted once on the page.
 *
 * The mutations deliberately keep the default query invalidation: routes that load
 * fields via a react-router loader are refreshed by `revalidate()`, while the multisign
 * embed sources its fields from a tRPC query and relies on the invalidation to refetch.
 */
export const DocumentSigningAttachmentField = ({ field }: DocumentSigningAttachmentFieldProps) => {
  const { _ } = useLingui();
  const { toast } = useToast();
  const { revalidate } = useRevalidator();

  const { recipient, isAssistantMode } = useDocumentSigningRecipientContext();

  const { mutateAsync: signFieldAttachment, isPending: isSignFieldAttachmentLoading } =
    trpc.envelope.field.signAttachment.useMutation();

  const { mutateAsync: removeSignedFieldWithToken, isPending: isRemoveSignedFieldWithTokenLoading } =
    trpc.field.removeSignedFieldWithToken.useMutation();

  const safeFieldMeta = ZAttachmentFieldMeta.safeParse(field.fieldMeta);
  const parsedFieldMeta = safeFieldMeta.success ? safeFieldMeta.data : undefined;

  const isLoading = isSignFieldAttachmentLoading || isRemoveSignedFieldWithTokenLoading;

  // Holds the dialog result between onPreSign and onSign.
  const pendingUploadRef = useRef<SignFieldAttachmentDialogResult>(null);

  const onPreSign = async () => {
    // Guard against a second click opening another upload dialog while an
    // upload is still in flight (the field only reads as inserted after revalidation).
    if (isLoading) {
      return false;
    }

    const result = await SignFieldAttachmentDialog.call({ fieldMeta: parsedFieldMeta });

    if (!result) {
      return false;
    }

    pendingUploadRef.current = result;

    return true;
  };

  const onSign = async () => {
    const upload = pendingUploadRef.current;

    pendingUploadRef.current = null;

    if (!upload) {
      return;
    }

    try {
      const formData = new FormData();

      formData.append(
        'payload',
        JSON.stringify({
          token: recipient.token,
          fieldId: field.id,
          previewImageAsBase64: upload.previewImageAsBase64,
        }),
      );

      formData.append('file', upload.file);

      await signFieldAttachment(formData);

      await revalidate();
    } catch (err) {
      const error = AppError.parseError(err);

      if (error.code === AppErrorCode.UNAUTHORIZED) {
        throw error;
      }

      console.error(err);

      toast({
        title: _(msg`Error`),
        description: isAssistantMode
          ? _(msg`An error occurred while signing as assistant.`)
          : _(msg`An error occurred while uploading the file.`),
        variant: 'destructive',
      });
    }
  };

  const onRemove = async () => {
    try {
      const payload: TRemovedSignedFieldWithTokenMutationSchema = {
        token: recipient.token,
        fieldId: field.id,
      };

      await removeSignedFieldWithToken(payload);

      await revalidate();
    } catch (err) {
      console.error(err);

      toast({
        title: _(msg`Error`),
        description: _(msg`An error occurred while removing the field.`),
        variant: 'destructive',
      });
    }
  };

  const fileName = field.fieldUpload?.fileName || field.customText;
  const previewImageAsBase64 = field.fieldUpload?.previewImageAsBase64;

  return (
    <DocumentSigningFieldContainer
      field={field}
      loading={isLoading}
      onPreSign={onPreSign}
      onSign={onSign}
      onRemove={onRemove}
      type="Attachment"
      tooltipText={fileName}
    >
      {isLoading && <DocumentSigningFieldsLoader />}

      {!field.inserted && (
        <DocumentSigningFieldsUninserted>
          <span className="block text-center">
            {parsedFieldMeta?.label || <Trans>File Upload</Trans>}
            {parsedFieldMeta?.required && <span className="text-destructive"> *</span>}
          </span>
          <span className="block text-center text-muted-foreground">
            <Trans>Upload file</Trans>
          </span>
        </DocumentSigningFieldsUninserted>
      )}

      {field.inserted && previewImageAsBase64 && (
        <img src={previewImageAsBase64} alt={fileName} className="h-full w-full object-contain" />
      )}

      {field.inserted && !previewImageAsBase64 && (
        <div className="flex h-full w-full items-center gap-x-1 overflow-hidden">
          <PaperclipIcon className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
          <p className="truncate text-[clamp(0.425rem,25cqw,0.825rem)] text-foreground">{fileName}</p>
        </div>
      )}
    </DocumentSigningFieldContainer>
  );
};
