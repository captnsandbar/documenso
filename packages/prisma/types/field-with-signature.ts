import type { DocumentData, Field, FieldUpload, Signature } from '@prisma/client';

export type FieldWithSignature = Field & {
  signature?: Signature | null;
  fieldUpload?: (FieldUpload & { documentData?: DocumentData | null }) | null;
};
