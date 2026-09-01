import { Trans } from '@lingui/react/macro';

import { Button, Section, Text } from '../components';
import { TemplateDocumentImage } from './template-document-image';

export interface TemplateDocumentCompletedProps {
  downloadLink: string;
  documentName: string;
  assetBaseUrl: string;
  customBody?: string;
}

export const TemplateDocumentCompleted = ({
  downloadLink,
  documentName,
  assetBaseUrl,
  customBody,
}: TemplateDocumentCompletedProps) => {
  return (
    <>
      <TemplateDocumentImage className="mt-6" assetBaseUrl={assetBaseUrl} />

      <Section>
        <Text
          className="text-left"
          style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#111827',
            lineHeight: '1.3',
            margin: '32px 0 0',
          }}
        >
          {customBody || <Trans>“{documentName}” was signed by all signers</Trans>}
        </Text>

        <Text
          className="text-left"
          style={{
            fontSize: '16px',
            lineHeight: '1.6',
            color: '#374151',
            margin: '16px 0 0',
          }}
        >
          <Trans>Continue by downloading the document.</Trans>
        </Text>

        <Section className="text-left" style={{ margin: '24px 0' }}>
          <Button
            className="no-underline"
            style={{
              display: 'inline-block',
              backgroundColor: '#00b271',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '14px',
              textDecoration: 'none',
            }}
            href={downloadLink}
          >
            <Trans>Download</Trans>
          </Button>
        </Section>
      </Section>
    </>
  );
};

export default TemplateDocumentCompleted;
