import type { DocumentData, Field, FieldUpload, Signature } from '@prisma/client';

export type FieldWithSignature = Field & {
  signature?: Signature | null;
  // Recipient-facing queries intentionally select only the display columns of the
  // upload so storage keys (documentDataId) are never exposed to signers.
  fieldUpload?:
    | (Pick<FieldUpload, 'id' | 'fileName' | 'mimeType' | 'fileSize' | 'previewImageAsBase64'> &
        Partial<Pick<FieldUpload, 'documentDataId' | 'createdAt' | 'fieldId'>> & {
          documentData?: DocumentData | null;
        })
    | null;
};
