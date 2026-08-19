import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import type { TFieldAttachment } from '@documenso/lib/types/field';
import { FieldType } from '@prisma/client';

import { SignFieldAttachmentDialog } from '~/components/dialogs/sign-field-attachment-dialog';

type HandleAttachmentFieldClickOptions = {
  field: TFieldAttachment;
};

export type AttachmentFieldClickResult =
  | { action: 'clear' }
  | { action: 'upload'; file: File; previewImageAsBase64?: string }
  | null;

export const handleAttachmentFieldClick = async (
  options: HandleAttachmentFieldClickOptions,
): Promise<AttachmentFieldClickResult> => {
  const { field } = options;

  if (field.type !== FieldType.ATTACHMENT) {
    throw new AppError(AppErrorCode.INVALID_REQUEST, {
      message: 'Invalid field type',
    });
  }

  // Clicking an already uploaded field clears it.
  if (field.inserted) {
    return { action: 'clear' };
  }

  const result = await SignFieldAttachmentDialog.call({
    fieldMeta: field.fieldMeta,
  });

  if (!result) {
    return null;
  }

  return {
    action: 'upload',
    file: result.file,
    previewImageAsBase64: result.previewImageAsBase64,
  };
};
