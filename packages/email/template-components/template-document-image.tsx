export interface TemplateDocumentImageProps {
  assetBaseUrl: string;
  className?: string;
}

export const TemplateDocumentImage = (_props: TemplateDocumentImageProps) => {
  // Intentionally renders nothing: emails use a minimal open layout
  // (logo, headline, body, button) without the hero document graphic.
  return null;
};

export default TemplateDocumentImage;
