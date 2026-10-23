import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  Field,
  Flex,
  SingleSelect,
  SingleSelectOption,
  TextInput,
  Typography,
} from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { getPluginId } from '../utils/getTranslation';
import { uploadFileToStrapi } from '../utils/strapiApp';

export type AspectRatioPreset = 'free' | '16:9' | '4:3' | '1:1';

export interface ImageEditorSavePayload {
  src: string;
  alt: string;
  caption: string;
  width?: number;
  height?: number;
  assetId?: number | null;
  documentId?: string | null;
}

export interface ImageEditorModalProps {
  open: boolean;
  src: string;
  initialAlt?: string;
  initialCaption?: string;
  onClose: () => void;
  onSave: (payload: ImageEditorSavePayload) => void;
}

const ASPECT_RATIO_VALUES: Record<AspectRatioPreset, number | null> = {
  free: null,
  '16:9': 16 / 9,
  '4:3': 4 / 3,
  '1:1': 1,
};

/**
 * Renders the transformations onto a canvas (either preview or full-resolution export).
 */
function renderTransformedImageToCanvas(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  options: {
    rotation: number;
    flipH: boolean;
    flipV: boolean;
    zoom: number;
    aspectPreset: AspectRatioPreset;
    maxDimension?: number;
  }
): { width: number; height: number } {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { width: 0, height: 0 };

  const isRotated90 = Math.abs(options.rotation % 180) === 90;
  const baseW = isRotated90 ? img.naturalHeight || 400 : img.naturalWidth || 600;
  const baseH = isRotated90 ? img.naturalWidth || 600 : img.naturalHeight || 400;

  const ratio = ASPECT_RATIO_VALUES[options.aspectPreset];
  let targetW = baseW;
  let targetH = baseH;

  if (ratio) {
    if (baseW / baseH > ratio) {
      targetW = Math.round(baseH * ratio);
    } else {
      targetH = Math.round(baseW / ratio);
    }
  }

  const scale = options.maxDimension
    ? Math.min(options.maxDimension / Math.max(targetW, targetH, 1), 1)
    : 1;
  canvas.width = Math.max(Math.round(targetW * scale), 1);
  canvas.height = Math.max(Math.round(targetH * scale), 1);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(
    options.flipH ? -options.zoom : options.zoom,
    options.flipV ? -options.zoom : options.zoom
  );
  ctx.rotate((options.rotation * Math.PI) / 180);

  const drawW = (img.naturalWidth || 600) * scale;
  const drawH = (img.naturalHeight || 400) * scale;
  ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();

  return { width: Math.round(targetW), height: Math.round(targetH) };
}

/**
 * Converts a canvas to a PNG Blob.
 */
function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    if (typeof canvas.toBlob === 'function') {
      canvas.toBlob((blob) => resolve(blob), 'image/png', 0.92);
    } else {
      resolve(null);
    }
  });
}

/**
 * In-editor HTML5 Canvas Image Crop/Rotate/Flip/Zoom modal using Strapi Design System Dialog.
 * Exports at full resolution and uploads the edited image to the Strapi Media Library (`/upload`).
 */
export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
  open,
  src,
  initialAlt = '',
  initialCaption = '',
  onClose,
  onSave,
}) => {
  const { formatMessage } = useIntl();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageObjRef = useRef<HTMLImageElement | null>(null);

  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const [aspectPreset, setAspectPreset] = useState<AspectRatioPreset>('free');
  const [alt, setAlt] = useState<string>(initialAlt);
  const [caption, setCaption] = useState<string>(initialCaption);
  const [canvasReady, setCanvasReady] = useState<boolean>(false);
  const [canvasError, setCanvasError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  useEffect(() => {
    if (!open) return;
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setZoom(1);
    setAspectPreset('free');
    setAlt(initialAlt);
    setCaption(initialCaption);
    setCanvasError(null);
    setUploadError(null);
    setCanvasReady(false);

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageObjRef.current = img;
      setCanvasReady(true);
    };
    img.onerror = () => {
      setCanvasError(
        formatMessage({
          id: `${getPluginId()}.imageEditor.corsWarning`,
          defaultMessage:
            'Unable to load image into canvas (CORS policy). You can still edit metadata.',
        })
      );
    };
    img.src = src;
  }, [open, src, initialAlt, initialCaption, formatMessage]);

  useEffect(() => {
    if (!open || !canvasReady || !canvasRef.current || !imageObjRef.current) return;
    renderTransformedImageToCanvas(canvasRef.current, imageObjRef.current, {
      rotation,
      flipH,
      flipV,
      zoom,
      aspectPreset,
      maxDimension: 480,
    });
  }, [open, canvasReady, rotation, flipH, flipV, zoom, aspectPreset]);

  const hasTransformations =
    rotation !== 0 || flipH || flipV || zoom !== 1 || aspectPreset !== 'free';

  const handleApply = async () => {
    setUploadError(null);
    if (canvasReady && imageObjRef.current && hasTransformations) {
      try {
        setIsUploading(true);
        const exportCanvas = document.createElement('canvas');
        const fullDims = renderTransformedImageToCanvas(exportCanvas, imageObjRef.current, {
          rotation,
          flipH,
          flipV,
          zoom,
          aspectPreset,
        });

        const blob = await canvasToBlob(exportCanvas);
        if (!blob || typeof FormData === 'undefined') {
          setUploadError(
            formatMessage({
              id: `${getPluginId()}.imageEditor.uploadError`,
              defaultMessage: 'Failed to export or upload edited image. Please try again.',
            })
          );
          return;
        }

        const formData = new FormData();
        formData.append('files', blob, `edited-image-${Date.now()}.png`);
        const uploadedFile = await uploadFileToStrapi(formData);
        if (!uploadedFile?.url) {
          setUploadError(
            formatMessage({
              id: `${getPluginId()}.imageEditor.uploadError`,
              defaultMessage: 'Failed to upload edited image. Please try again.',
            })
          );
          return;
        }

        onSave({
          src: uploadedFile.url,
          alt,
          caption,
          width: uploadedFile.width || fullDims.width,
          height: uploadedFile.height || fullDims.height,
          assetId: typeof uploadedFile.id === 'number' ? uploadedFile.id : undefined,
          documentId:
            typeof uploadedFile.documentId === 'string' ? uploadedFile.documentId : undefined,
        });
        onClose();
        return;
      } catch {
        setUploadError(
          formatMessage({
            id: `${getPluginId()}.imageEditor.uploadError`,
            defaultMessage: 'Failed to upload edited image. Please try again.',
          })
        );
        return;
      } finally {
        setIsUploading(false);
      }
    }

    onSave({ src, alt, caption });
    onClose();
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(isOpen: boolean) => {
        if (!isOpen) onClose();
      }}
    >
      <Dialog.Content style={{ maxWidth: '680px', width: '100%' }}>
        <Dialog.Header>
          {formatMessage({
            id: `${getPluginId()}.imageEditor.title`,
            defaultMessage: 'Image Studio — Crop, Rotate & Metadata',
          })}
        </Dialog.Header>
        <Dialog.Body>
          <Flex direction="column" alignItems="stretch" gap={4}>
            {uploadError && (
              <Typography variant="pi" textColor="danger600" role="alert">
                {uploadError}
              </Typography>
            )}
            <Box
              padding={3}
              background="neutral150"
              hasRadius
              style={{ textAlign: 'center', minHeight: '220px' }}
            >
              {canvasError ? (
                <Flex direction="column" gap={2} alignItems="center">
                  <img
                    src={src}
                    alt={alt}
                    style={{ maxWidth: '100%', maxHeight: '240px', objectFit: 'contain' }}
                  />
                  <Typography variant="pi" textColor="warning600">
                    {canvasError}
                  </Typography>
                </Flex>
              ) : (
                <canvas
                  ref={canvasRef}
                  aria-label={formatMessage({
                    id: `${getPluginId()}.imageEditor.canvasAriaLabel`,
                    defaultMessage: 'Image transformation preview canvas',
                  })}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '300px',
                    borderRadius: '4px',
                    border: '1px solid #dcdce4',
                    background: '#fff',
                  }}
                />
              )}
            </Box>

            <Flex gap={2} wrap="wrap" alignItems="flex-end">
              <Box style={{ minWidth: '140px' }}>
                <Field.Root>
                  <Field.Label>
                    {formatMessage({
                      id: `${getPluginId()}.imageEditor.aspectRatio`,
                      defaultMessage: 'Aspect Ratio',
                    })}
                  </Field.Label>
                  <SingleSelect
                    size="S"
                    value={aspectPreset}
                    onChange={(val: string | number) => setAspectPreset(val as AspectRatioPreset)}
                  >
                    <SingleSelectOption value="free">
                      {formatMessage({
                        id: `${getPluginId()}.imageEditor.aspectFree`,
                        defaultMessage: 'Freeform',
                      })}
                    </SingleSelectOption>
                    <SingleSelectOption value="16:9">16:9</SingleSelectOption>
                    <SingleSelectOption value="4:3">4:3</SingleSelectOption>
                    <SingleSelectOption value="1:1">1:1</SingleSelectOption>
                  </SingleSelect>
                </Field.Root>
              </Box>

              <Button
                variant="tertiary"
                size="S"
                onClick={() => setRotation((r) => (r - 90) % 360)}
              >
                {formatMessage({
                  id: `${getPluginId()}.imageEditor.rotateLeft`,
                  defaultMessage: 'Rotate -90°',
                })}
              </Button>
              <Button
                variant="tertiary"
                size="S"
                onClick={() => setRotation((r) => (r + 90) % 360)}
              >
                {formatMessage({
                  id: `${getPluginId()}.imageEditor.rotateRight`,
                  defaultMessage: 'Rotate +90°',
                })}
              </Button>
              <Button
                variant={flipH ? 'secondary' : 'tertiary'}
                size="S"
                onClick={() => setFlipH((v) => !v)}
              >
                {formatMessage({
                  id: `${getPluginId()}.imageEditor.flipH`,
                  defaultMessage: 'Flip H',
                })}
              </Button>
              <Button
                variant={flipV ? 'secondary' : 'tertiary'}
                size="S"
                onClick={() => setFlipV((v) => !v)}
              >
                {formatMessage({
                  id: `${getPluginId()}.imageEditor.flipV`,
                  defaultMessage: 'Flip V',
                })}
              </Button>

              <Box style={{ minWidth: '130px' }}>
                <Field.Root>
                  <Field.Label>
                    {formatMessage(
                      {
                        id: `${getPluginId()}.imageEditor.zoom`,
                        defaultMessage: 'Zoom ({percent}%)',
                      },
                      { percent: Math.round(zoom * 100) }
                    )}
                  </Field.Label>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.1"
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    aria-label={formatMessage({
                      id: `${getPluginId()}.imageEditor.zoomAriaLabel`,
                      defaultMessage: 'Image zoom level',
                    })}
                    style={{ width: '100%' }}
                  />
                </Field.Root>
              </Box>
            </Flex>

            <Field.Root>
              <Field.Label>
                {formatMessage({
                  id: `${getPluginId()}.imageEditor.altLabel`,
                  defaultMessage: 'Alternative Text (Alt)',
                })}
              </Field.Label>
              <TextInput
                value={alt}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAlt(e.target.value)}
                placeholder={formatMessage({
                  id: `${getPluginId()}.imageEditor.altPlaceholder`,
                  defaultMessage: 'Describe the image for screen readers',
                })}
              />
            </Field.Root>

            <Field.Root>
              <Field.Label>
                {formatMessage({
                  id: `${getPluginId()}.imageEditor.captionLabel`,
                  defaultMessage: 'Caption (displayed below image)',
                })}
              </Field.Label>
              <TextInput
                value={caption}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCaption(e.target.value)}
                placeholder={formatMessage({
                  id: `${getPluginId()}.imageEditor.captionPlaceholder`,
                  defaultMessage: 'Optional figure caption',
                })}
              />
            </Field.Root>
          </Flex>
        </Dialog.Body>
        <Dialog.Footer>
          <Dialog.Cancel>
            <Button variant="tertiary" onClick={onClose}>
              {formatMessage({
                id: `${getPluginId()}.imageEditor.cancel`,
                defaultMessage: 'Cancel',
              })}
            </Button>
          </Dialog.Cancel>
          <Button onClick={handleApply} loading={isUploading} disabled={isUploading}>
            {formatMessage({
              id: `${getPluginId()}.imageEditor.apply`,
              defaultMessage: 'Apply Changes',
            })}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  );
};
