import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';

import { Body, Container, Head, Html, Preview, Section } from '../components';
import { TemplateBrandingLogo } from '../template-components/template-branding-logo';
import { TemplateDocumentRejected } from '../template-components/template-document-rejected';
import { TemplateFooter } from '../template-components/template-footer';

type DocumentRejectedEmailProps = {
  recipientName: string;
  documentName: string;
  documentUrl: string;
  rejectionReason: string;
  assetBaseUrl?: string;
};

export function DocumentRejectedEmail({
  recipientName,
  documentName,
  documentUrl,
  rejectionReason,
  assetBaseUrl = 'http://localhost:3002',
}: DocumentRejectedEmailProps) {
  const { _ } = useLingui();

  const previewText = _(msg`${recipientName} has rejected the document '${documentName}'`);

  return (
    <Html>
      <Head />

      <Body className="mx-auto my-auto bg-background font-sans">
        <Preview>{previewText}</Preview>

        <Section>
          <Container className="mx-auto my-5 max-w-xl px-4 py-5">
            <Section>
              <TemplateBrandingLogo assetBaseUrl={assetBaseUrl} className="mb-4" />

              <TemplateDocumentRejected
                recipientName={recipientName}
                documentName={documentName}
                documentUrl={documentUrl}
                rejectionReason={rejectionReason}
              />
            </Section>
          </Container>

          <Container className="mx-auto max-w-xl">
            <TemplateFooter />
          </Container>
        </Section>
      </Body>
    </Html>
  );
}

export default DocumentRejectedEmail;
