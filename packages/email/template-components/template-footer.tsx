import { Fragment } from 'react';

import { Link, Section, Text } from '../components';
import { useBranding } from '../providers/branding';
import { getSafeBrandingUrl } from '../utils/branding-url';

export type TemplateFooterProps = {
  isDocument?: boolean;
  reportUrl?: string;
};

const footerTextStyle = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '1.6',
  margin: '32px 0 0',
} as const;

const footerLinkStyle = { color: '#00b271', textDecoration: 'none' } as const;

// Glass Casa instance: one small muted company line matching the
// carts-site emails, pixel-styled so Outlook (which ignores rem units)
// renders it identically. The text comes from the team's Branding →
// Company details setting (editable in the Documenso UI, one line per
// row); the hardcoded line is the fallback when that field is empty.
export const TemplateFooter = (_props: TemplateFooterProps) => {
  const branding = useBranding();

  const companyDetails =
    branding.brandingEnabled && branding.brandingCompanyDetails ? branding.brandingCompanyDetails : null;

  const safeBrandingUrl = branding.brandingEnabled ? getSafeBrandingUrl(branding.brandingUrl) : null;

  if (companyDetails) {
    const lines = companyDetails.split('\n').filter((line) => line.trim());

    return (
      <Section>
        <Text style={footerTextStyle}>
          {lines.map((line, idx) => (
            <Fragment key={idx}>
              {idx > 0 && <br />}
              {line}
            </Fragment>
          ))}
          {safeBrandingUrl && (
            <Fragment>
              {' · '}
              <Link href={safeBrandingUrl} style={footerLinkStyle}>
                {safeBrandingUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </Link>
            </Fragment>
          )}
        </Text>
      </Section>
    );
  }

  return (
    <Section>
      <Text style={footerTextStyle}>
        Glass Casa Carts &amp; Bikes · 1200 Scenic Gulf Drive Unit B, Miramar Beach FL 32550 · 850-964-1200 ·{' '}
        <Link href="https://glasscasacarts.com" style={footerLinkStyle}>
          glasscasacarts.com
        </Link>
      </Text>
    </Section>
  );
};

export default TemplateFooter;
