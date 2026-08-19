import Konva from 'konva';

import type { TAttachmentFieldMeta } from '../../types/field-meta';
import { DEFAULT_FIELD_FONT_SIZE } from '../../types/field-meta';
import { createFieldHoverInteraction, upsertFieldGroup, upsertFieldRect } from './field-generic-items';
import type { FieldToRender, RenderFieldElementOptions } from './field-renderer';
import { calculateFieldPosition } from './field-renderer';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let SkiaImage: any;

void (async () => {
  if (typeof window === 'undefined') {
    const mod = await import('@documenso/skia-canvas');
    SkiaImage = mod.Image;
  }
})();

const getImageDimensions = (img: HTMLImageElement, fieldWidth: number, fieldHeight: number) => {
  let imageWidth = img.width;
  let imageHeight = img.height;

  const scalingFactor = Math.min(fieldWidth / imageWidth, fieldHeight / imageHeight, 1);

  imageWidth = imageWidth * scalingFactor;
  imageHeight = imageHeight * scalingFactor;

  const imageX = (fieldWidth - imageWidth) / 2;
  const imageY = (fieldHeight - imageHeight) / 2;

  return {
    width: imageWidth,
    height: imageHeight,
    x: imageX,
    y: imageY,
  };
};

const ATTACHMENT_IMAGE_CACHE_PIXEL_RATIO = 2;

/**
 * Build a Konva.Image for an uploaded image preview, sized to fit within the
 * given field dimensions. Works in both browser and Node.js (via skia-canvas).
 */
const createPreviewImage = (previewImageAsBase64: string, fieldWidth: number, fieldHeight: number): Konva.Image => {
  if (typeof window !== 'undefined') {
    const img = new Image();

    const image = new Konva.Image({
      image: img,
      x: 0,
      y: 0,
      width: fieldWidth,
      height: fieldHeight,
      listening: false,
    });

    img.onload = () => {
      image.setAttrs({
        image: img,
        ...getImageDimensions(img, fieldWidth, fieldHeight),
      });

      image.cache({
        pixelRatio: ATTACHMENT_IMAGE_CACHE_PIXEL_RATIO * (window.devicePixelRatio || 1),
      });
    };

    img.src = previewImageAsBase64;

    return image;
  }

  // Node.js with skia-canvas
  if (!SkiaImage) {
    throw new Error('Skia image not found');
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const img = new SkiaImage(previewImageAsBase64) as unknown as HTMLImageElement;

  return new Konva.Image({
    image: img,
    ...getImageDimensions(img, fieldWidth, fieldHeight),
    listening: false,
  });
};

const createFieldAttachmentNode = (
  field: FieldToRender,
  options: RenderFieldElementOptions,
): { node: Konva.Text | Konva.Image; isImage: boolean } => {
  const { pageWidth, pageHeight, mode = 'edit', translations } = options;

  const { fieldWidth, fieldHeight } = calculateFieldPosition(field, pageWidth, pageHeight);

  const fieldMeta = field.fieldMeta as TAttachmentFieldMeta | undefined;
  const fontSize = fieldMeta?.fontSize || DEFAULT_FIELD_FONT_SIZE;

  const fieldUpload = field.fieldUpload;

  if (field.inserted && fieldUpload?.previewImageAsBase64) {
    return {
      node: createPreviewImage(fieldUpload.previewImageAsBase64, fieldWidth, fieldHeight),
      isImage: true,
    };
  }

  let textToRender = fieldMeta?.label || translations?.[field.type] || 'Attachment';

  if (field.inserted && fieldUpload) {
    textToRender = fieldUpload.fileName;
  }

  // Never render the placeholder label into the sealed PDF.
  if (mode === 'export' && !field.inserted) {
    textToRender = '';
  }

  const fieldText = new Konva.Text({
    id: `${field.renderId}-text`,
    name: 'field-text',
    listening: false,
    x: 0,
    y: 0,
    width: fieldWidth,
    height: fieldHeight,
    text: textToRender,
    fontSize,
    fontFamily: 'Noto Sans',
    align: 'center',
    verticalAlign: 'middle',
    wrap: 'word',
    ellipsis: true,
  });

  return { node: fieldText, isImage: false };
};

export const renderAttachmentFieldElement = (field: FieldToRender, options: RenderFieldElementOptions) => {
  const { mode = 'edit', pageLayer, color } = options;

  const isFirstRender = !pageLayer.findOne(`#${field.renderId}`);

  const fieldGroup = upsertFieldGroup(field, options);

  // Clear previous children and listeners to re-render fresh.
  fieldGroup.removeChildren();
  fieldGroup.off('transform');

  if (isFirstRender) {
    pageLayer.add(fieldGroup);
  }

  const fieldRect = upsertFieldRect(field, options);
  const { node: fieldNode } = createFieldAttachmentNode(field, options);

  fieldGroup.add(fieldRect);
  fieldGroup.add(fieldNode);

  fieldGroup.on('transform', () => {
    const groupScaleX = fieldGroup.scaleX();
    const groupScaleY = fieldGroup.scaleY();

    // Adjust node scale so it doesn't change while group is resized.
    fieldNode.scaleX(1 / groupScaleX);
    fieldNode.scaleY(1 / groupScaleY);

    fieldNode.width(fieldRect.width() * groupScaleX);
    fieldNode.height(fieldRect.height() * groupScaleY);

    fieldGroup.getLayer()?.batchDraw();
  });

  fieldGroup.on('transformend', () => {
    fieldNode.scaleX(1);
    fieldNode.scaleY(1);

    fieldNode.width(fieldRect.width());
    fieldNode.height(fieldRect.height());

    fieldGroup.getLayer()?.batchDraw();
  });

  // Handle export mode.
  if (mode === 'export') {
    // Hide the rectangle.
    fieldRect.opacity(0);
  }

  if (color !== 'readOnly' && mode !== 'export') {
    createFieldHoverInteraction({ fieldGroup, fieldRect, options });
  }

  return {
    fieldGroup,
    isFirstRender,
  };
};
