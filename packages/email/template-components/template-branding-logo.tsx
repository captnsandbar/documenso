import { Img, Link } from '../components';
import { useBranding } from '../providers/branding';
import { getSafeBrandingUrl } from '../utils/branding-url';

export type TemplateBrandingLogoProps = {
  assetBaseUrl: string;
  className?: string;
};

/**
 * Renders the email logo.
 *
 * - When custom branding is enabled with a logo, the branding logo is shown.
 *   If a safe (http/https) Brand Website is configured, the logo links to it.
 * - Otherwise the Documenso logo is shown.
 */
// Pixel-based sizing (attribute + px styles): Outlook's Word renderer
// ignores rem units, so a rem height renders the image at natural size.
const LOGO_WIDTH_PX = 145;

const logoStyle = { width: `${LOGO_WIDTH_PX}px`, maxWidth: `${LOGO_WIDTH_PX}px`, height: 'auto' } as const;

export const TemplateBrandingLogo = ({ assetBaseUrl, className = 'mb-4' }: TemplateBrandingLogoProps) => {
  const branding = useBranding();

  const hasCustomBrandingLogo = branding.brandingEnabled && Boolean(branding.brandingLogo);

  if (!hasCustomBrandingLogo) {
    const documensoLogoUrl = new URL('/static/logo.png', assetBaseUrl).toString();

    return (
      <Img src={documensoLogoUrl} alt="Documenso Logo" width={LOGO_WIDTH_PX} className={className} style={logoStyle} />
    );
  }

  const brandingLogo = (
    <Img
      src={branding.brandingLogo}
      alt="Branding Logo"
      width={LOGO_WIDTH_PX}
      className={className}
      style={logoStyle}
    />
  );

  const safeBrandingUrl = getSafeBrandingUrl(branding.brandingUrl);

  if (!safeBrandingUrl) {
    return brandingLogo;
  }

  return (
    <Link href={safeBrandingUrl} target="_blank">
      {brandingLogo}
    </Link>
  );
};

export default TemplateBrandingLogo;
