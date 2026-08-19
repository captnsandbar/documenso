/**
 * MIME types a recipient may upload into an ATTACHMENT field.
 */
export const ATTACHMENT_FIELD_IMAGE_TYPES: string[] = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

export const ATTACHMENT_FIELD_DOCUMENT_TYPES: string[] = [
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export const ATTACHMENT_FIELD_ALLOWED_FILE_TYPES: string[] = [
  ...ATTACHMENT_FIELD_IMAGE_TYPES,
  ...ATTACHMENT_FIELD_DOCUMENT_TYPES,
];

/**
 * The maximum dimension (px) of the client-generated preview drawn into the
 * field box for image uploads.
 */
export const ATTACHMENT_FIELD_PREVIEW_MAX_DIMENSION = 800;

/**
 * Upper bound for the preview data-URI length. A 800px JPEG preview is far
 * below this; the cap only exists to stop oversized payloads.
 */
export const ATTACHMENT_FIELD_PREVIEW_MAX_LENGTH = 1_500_000;
