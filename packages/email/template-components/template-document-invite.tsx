import { RECIPIENT_ROLES_DESCRIPTION } from '@documenso/lib/constants/recipient-roles';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { OrganisationType, RecipientRole } from '@prisma/client';
import { match, P } from 'ts-pattern';

import { Button, Section, Text } from '../components';
import { TemplateDocumentImage } from './template-document-image';

export interface TemplateDocumentInviteProps {
  inviterName: string;
  inviterEmail: string;
  documentName: string;
  signDocumentLink: string;
  assetBaseUrl: string;
  role: RecipientRole;
  selfSigner: boolean;
  teamName?: string;
  includeSenderDetails?: boolean;
  organisationType?: OrganisationType;
  customBody?: string;
}

export const TemplateDocumentInvite = ({
  inviterName,
  documentName,
  signDocumentLink,
  assetBaseUrl,
  role,
  selfSigner,
  teamName,
  includeSenderDetails,
  organisationType,
  customBody,
}: TemplateDocumentInviteProps) => {
  const { _ } = useLingui();

  const { actionVerb } = RECIPIENT_ROLES_DESCRIPTION[role];

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
          {match({ selfSigner, organisationType, includeSenderDetails, teamName })
            .with({ selfSigner: true }, () => (
              <Trans>
                Please {_(actionVerb).toLowerCase()} your document
                <br />"{documentName}"
              </Trans>
            ))
            .with(
              {
                organisationType: OrganisationType.ORGANISATION,
                includeSenderDetails: true,
                teamName: P.string,
              },
              () => (
                <Trans>
                  {inviterName} on behalf of "{teamName}" has invited you to {_(actionVerb).toLowerCase()}
                  <br />"{documentName}"
                </Trans>
              ),
            )
            .with({ organisationType: OrganisationType.ORGANISATION, teamName: P.string }, () => (
              <Trans>
                {teamName} has invited you to {_(actionVerb).toLowerCase()}
                <br />"{documentName}"
              </Trans>
            ))
            .otherwise(() => (
              <Trans>
                {inviterName} has invited you to {_(actionVerb).toLowerCase()}
                <br />"{documentName}"
              </Trans>
            ))}
        </Text>

        {customBody ? (
          customBody
            .trim()
            .replace(/\r\n?/g, '\n')
            .split(/\n{2,}/)
            .map((paragraph, i) => (
              <Text
                key={`custom-body-${i}`}
                className="text-left"
                style={{
                  fontSize: '16px',
                  lineHeight: '1.6',
                  color: '#374151',
                  margin: '16px 0 0',
                }}
              >
                {paragraph}
              </Text>
            ))
        ) : (
          <Text
            className="text-left"
            style={{
              fontSize: '16px',
              lineHeight: '1.6',
              color: '#374151',
              margin: '16px 0 0',
            }}
          >
            {match(role)
              .with(RecipientRole.SIGNER, () => <Trans>Continue by signing the document.</Trans>)
              .with(RecipientRole.VIEWER, () => <Trans>Continue by viewing the document.</Trans>)
              .with(RecipientRole.APPROVER, () => <Trans>Continue by approving the document.</Trans>)
              .with(RecipientRole.CC, () => '')
              .with(RecipientRole.ASSISTANT, () => <Trans>Continue by assisting with the document.</Trans>)
              .exhaustive()}
          </Text>
        )}

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
            href={signDocumentLink}
          >
            {match(role)
              .with(RecipientRole.SIGNER, () => <Trans>View Document to sign</Trans>)
              .with(RecipientRole.VIEWER, () => <Trans>View Document</Trans>)
              .with(RecipientRole.APPROVER, () => <Trans>View Document to approve</Trans>)
              .with(RecipientRole.CC, () => '')
              .with(RecipientRole.ASSISTANT, () => <Trans>View Document to assist</Trans>)
              .exhaustive()}
          </Button>
        </Section>
      </Section>
    </>
  );
};

export default TemplateDocumentInvite;
