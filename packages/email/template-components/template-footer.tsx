import { Link, Section, Text } from '../components';

export type TemplateFooterProps = {
  isDocument?: boolean;
  reportUrl?: string;
};

// Glass Casa instance: the footer matches the carts-site emails exactly —
// one small muted company line, pixel-styled so Outlook (which ignores
// rem units) renders it identically.
export const TemplateFooter = (_props: TemplateFooterProps) => {
  return (
    <Section>
      <Text
        style={{
          color: '#9ca3af',
          fontSize: '12px',
          lineHeight: '1.6',
          margin: '32px 0 0',
        }}
      >
        Glass Casa Carts &amp; Bikes · 1200 Scenic Gulf Drive Unit B, Miramar Beach FL 32550 · 850-964-1200 ·{' '}
        <Link href="https://glasscasacarts.com" style={{ color: '#00b271', textDecoration: 'none' }}>
          glasscasacarts.com
        </Link>
      </Text>
    </Section>
  );
};

export default TemplateFooter;
