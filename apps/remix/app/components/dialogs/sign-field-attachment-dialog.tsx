import { APP_DOCUMENT_UPLOAD_SIZE_LIMIT } from '@documenso/lib/constants/app';
import {
  ATTACHMENT_FIELD_ALLOWED_FILE_TYPES,
  ATTACHMENT_FIELD_IMAGE_TYPES,
  ATTACHMENT_FIELD_PREVIEW_MAX_DIMENSION,
} from '@documenso/lib/constants/field-attachments';
import type { TAttachmentFieldMeta } from '@documenso/lib/types/field-meta';
import { megabytesToBytes } from '@documenso/lib/universal/unit-convertions';
import { Button } from '@documenso/ui/primitives/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@documenso/ui/primitives/dialog';
import { Input } from '@documenso/ui/primitives/input';
import { Trans, useLingui } from '@lingui/react/macro';
import { PaperclipIcon } from 'lucide-react';
import { useState } from 'react';
import { createCallable } from 'react-call';

export type SignFieldAttachmentDialogProps = {
  fieldMeta?: TAttachmentFieldMeta;
};

export type SignFieldAttachmentDialogResult = {
  file: File;
  previewImageAsBase64?: string;
} | null;

/**
 * Generate a downscaled data-URI preview for image uploads. The preview is
 * drawn into the field box on the signing page and burned into the sealed PDF.
 */
const generateImagePreview = async (file: File): Promise<string | undefined> => {
  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });

    const img = new Image();

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = dataUrl;
    });

    const scale = Math.min(
      ATTACHMENT_FIELD_PREVIEW_MAX_DIMENSION / img.width,
      ATTACHMENT_FIELD_PREVIEW_MAX_DIMENSION / img.height,
      1,
    );

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return undefined;
    }

    // Fill white so transparent PNGs don't end up with a black background
    // after JPEG encoding.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', 0.85);
  } catch {
    return undefined;
  }
};

export const SignFieldAttachmentDialog = createCallable<
  SignFieldAttachmentDialogProps,
  SignFieldAttachmentDialogResult
>(({ call, fieldMeta }) => {
  const { t } = useLingui();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const imagesOnly = fieldMeta?.fileTypes === 'images';

  const allowedTypes = imagesOnly ? ATTACHMENT_FIELD_IMAGE_TYPES : ATTACHMENT_FIELD_ALLOWED_FILE_TYPES;

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);

    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setSelectedFile(null);
      setError(imagesOnly ? t`Only images can be uploaded into this field` : t`This file type is not allowed`);
      return;
    }

    if (file.size > megabytesToBytes(APP_DOCUMENT_UPLOAD_SIZE_LIMIT)) {
      setSelectedFile(null);
      setError(t`File cannot be larger than ${APP_DOCUMENT_UPLOAD_SIZE_LIMIT}MB`);
      return;
    }

    setSelectedFile(file);
  };

  const onConfirm = async () => {
    if (!selectedFile) {
      return;
    }

    setIsProcessing(true);

    const previewImageAsBase64 = ATTACHMENT_FIELD_IMAGE_TYPES.includes(selectedFile.type)
      ? await generateImagePreview(selectedFile)
      : undefined;

    call.end({
      file: selectedFile,
      previewImageAsBase64,
    });
  };

  return (
    <Dialog open={true} onOpenChange={(value) => (!value ? call.end(null) : null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{fieldMeta?.label || <Trans>Upload Attachment</Trans>}</DialogTitle>

          <DialogDescription className="mt-4">
            {imagesOnly ? (
              <Trans>Please upload an image (max {APP_DOCUMENT_UPLOAD_SIZE_LIMIT}MB)</Trans>
            ) : (
              <Trans>Please upload a file (max {APP_DOCUMENT_UPLOAD_SIZE_LIMIT}MB)</Trans>
            )}
          </DialogDescription>
        </DialogHeader>

        <fieldset className="flex flex-col gap-2" disabled={isProcessing}>
          <Input type="file" accept={allowedTypes.join(',')} onChange={onFileChange} />

          {selectedFile && (
            <p className="flex items-center gap-2 text-muted-foreground text-sm">
              <PaperclipIcon className="h-4 w-4" />
              <span className="truncate">{selectedFile.name}</span>
              <span>({(selectedFile.size / 1024 / 1024).toFixed(2)}MB)</span>
            </p>
          )}

          {error && <p className="text-destructive text-sm">{error}</p>}
        </fieldset>

        <DialogFooter>
          <Button type="button" variant="secondary" disabled={isProcessing} onClick={() => call.end(null)}>
            <Trans>Cancel</Trans>
          </Button>

          <Button type="button" disabled={!selectedFile} loading={isProcessing} onClick={() => void onConfirm()}>
            <Trans>Upload</Trans>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
