import { NEXT_PUBLIC_WEBAPP_URL } from '@documenso/lib/constants/app';
import { Button } from '@documenso/ui/primitives/button';
import { Trans } from '@lingui/react/macro';
import { DownloadIcon } from 'lucide-react';

export type DocumentPageViewUploadedFile = {
  fieldId: number;
  recipientName: string;
  label: string | null;
  fileName: string;
  fileSize: number;
};

export type DocumentPageViewUploadedFilesProps = {
  envelopeId: string;
  uploadedFiles: DocumentPageViewUploadedFile[];
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const DocumentPageViewUploadedFiles = ({ envelopeId, uploadedFiles }: DocumentPageViewUploadedFilesProps) => {
  if (uploadedFiles.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col rounded-xl border border-border bg-widget text-foreground dark:bg-background">
      <h1 className="px-4 py-3 font-medium">
        <Trans>Uploaded files</Trans>
      </h1>

      <ul className="divide-y border-t">
        {uploadedFiles.map((file) => (
          <li key={file.fieldId} className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm last:border-b">
            <div className="min-w-0">
              <p className="truncate" title={file.fileName}>
                {file.fileName}
              </p>

              <p className="truncate text-muted-foreground text-xs">
                {file.recipientName}
                {' / '}
                {file.label ?? <Trans>File Upload</Trans>}
                {' / '}
                {formatFileSize(file.fileSize)}
              </p>
            </div>

            <Button asChild variant="outline" size="sm">
              <a
                href={`${NEXT_PUBLIC_WEBAPP_URL()}/api/files/envelope/${envelopeId}/field/${file.fieldId}/upload`}
                download={file.fileName}
              >
                <DownloadIcon className="mr-2 h-4 w-4" />
                <Trans>Download</Trans>
              </a>
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
};
