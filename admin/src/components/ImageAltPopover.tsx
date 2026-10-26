import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import type { ImageOptions } from '@tiptap/extension-image';
import { Popover, TextInput, IconButton, Field, Button } from '@strapi/design-system';
import { Trash, Cross, ArrowClockwise } from '@strapi/icons';
import { useFetchClient } from '@strapi/strapi/admin';
import { useIntl } from 'react-intl';
import { ToolbarButton } from './ToolbarButton';
import { TextAlignLeft } from '../icons/TextAlignLeft';
import { TextAlignCenter } from '../icons/TextAlignCenter';
import { TextAlignRight } from '../icons/TextAlignRight';

export function ImageNodeView({
  node,
  updateAttributes,
  deleteNode,
  selected,
  extension,
}: NodeViewProps) {
  const { formatMessage } = useIntl();
  const { get } = useFetchClient();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [altText, setAltText] = useState<string>(node.attrs.alt ?? '');
  const [title, setTitle] = useState<string>(String(node.attrs.title ?? ''));
  const [caption, setCaption] = useState<string>(node.attrs.caption ?? '');
  const imgRef = useRef<HTMLImageElement>(null);
  const isResizingRef = useRef(false);
  const resizeCleanupRef = useRef<(() => void) | null>(null);

  const rawResize = (extension.options as ImageOptions).resize;
  const resizeEnabled =
    typeof rawResize === 'object' && !!rawResize ? rawResize.enabled : !!rawResize;
  const resizeOpts = resizeEnabled && typeof rawResize === 'object' ? rawResize : undefined;
  const preserveAspectRatio = resizeOpts?.alwaysPreserveAspectRatio ?? true;
  const minWidth = resizeOpts?.minWidth ?? 50;
  const minHeight = resizeOpts?.minHeight ?? 50;

  const currentWidth = node.attrs.width;
  const currentHeight = node.attrs.height;
  const [widthInput, setWidthInput] = useState<string>(currentWidth ? String(currentWidth) : '');
  const [heightInput, setHeightInput] = useState<string>(
    currentHeight ? String(currentHeight) : ''
  );

  // Sync local alt text state when node attrs change externally (undo/redo safety)
  useEffect(() => {
    setAltText(node.attrs.alt ?? '');
  }, [node.attrs.alt]);

  useEffect(() => {
    setTitle(String(node.attrs.title ?? ''));
  }, [node.attrs.title]);

  useEffect(() => {
    setCaption(node.attrs.caption ?? '');
  }, [node.attrs.caption]);

  // Sync dimension inputs when node attrs change (undo/redo, resize handle)
  useEffect(() => {
    setWidthInput(node.attrs.width ? String(node.attrs.width) : '');
  }, [node.attrs.width]);

  useEffect(() => {
    setHeightInput(node.attrs.height ? String(node.attrs.height) : '');
  }, [node.attrs.height]);

  // Close popover when any ancestor scrolls so it doesn't float over other components
  useEffect(() => {
    if (!isPopoverOpen) return;
    const handleScroll = () => setIsPopoverOpen(false);
    document.addEventListener('scroll', handleScroll, true);
    return () => document.removeEventListener('scroll', handleScroll, true);
  }, [isPopoverOpen]);

  // Remove resize document listeners if component unmounts mid-drag
  useEffect(() => {
    return () => {
      resizeCleanupRef.current?.();
    };
  }, []);

  const currentAlign = node.attrs['data-align'] as 'left' | 'center' | 'right' | null;

  function handleAlign(value: 'left' | 'center' | 'right') {
    const current = node.attrs['data-align'] as string | null;
    updateAttributes({ 'data-align': current === value ? null : value });
  }

  function handleCommit() {
    updateAttributes({ alt: altText });
  }

  function handleTitleCommit() {
    updateAttributes({ title: title.trim() || null });
  }

  function handleCaptionCommit() {
    updateAttributes({ caption: caption.trim() || null });
  }

  const assetId = node.attrs['data-asset-id'] as number | null;
  const assetIdRef = useRef(assetId);
  // Bumped on each fill request, on alt/caption edits and on asset changes so stale responses are dropped
  const fillRequestRef = useRef(0);

  // Synced after commit, not during render, so an abandoned render can't affect pending fills
  useLayoutEffect(() => {
    if (assetIdRef.current === assetId) return;
    assetIdRef.current = assetId;
    fillRequestRef.current++;
  }, [assetId]);

  function handleFillFromMediaLibrary() {
    if (!assetId) return;
    const requestId = ++fillRequestRef.current;
    const requestedAssetId = assetId;
    get(`/upload/files/${requestedAssetId}`)
      .then(
        (res: {
          data?: { name?: string; alternativeText?: string | null; caption?: string | null };
        }) => {
          if (requestId !== fillRequestRef.current || requestedAssetId !== assetIdRef.current) {
            return;
          }
          const file = res.data;
          if (!file) return;
          updateAttributes({
            alt: file.alternativeText ?? file.name ?? '',
            caption: file.caption || null,
          });
        }
      )
      .catch(() => {});
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  }

  function getAspectRatio(): number | null {
    const img = imgRef.current;
    if (!img || !img.naturalWidth || !img.naturalHeight) return null;
    return img.naturalWidth / img.naturalHeight;
  }

  function handleWidthCommit() {
    if (widthInput === '') {
      updateAttributes({ width: null, height: null });
      return;
    }
    const num = parseInt(widthInput, 10);
    if (!isNaN(num) && num >= minWidth) {
      const ratio = getAspectRatio();
      if (preserveAspectRatio && ratio) {
        const newHeight = Math.round(num / ratio);
        updateAttributes({ width: num, height: newHeight });
      } else {
        updateAttributes({ width: num });
      }
    } else {
      setWidthInput(node.attrs.width ? String(node.attrs.width) : '');
    }
  }

  function handleHeightCommit() {
    if (heightInput === '') {
      updateAttributes({ height: null, width: null });
      return;
    }
    const num = parseInt(heightInput, 10);
    if (!isNaN(num) && num >= minHeight) {
      const ratio = getAspectRatio();
      if (preserveAspectRatio && ratio) {
        const newWidth = Math.round(num * ratio);
        updateAttributes({ width: newWidth, height: num });
      } else {
        updateAttributes({ height: num });
      }
    } else {
      setHeightInput(node.attrs.height ? String(node.attrs.height) : '');
    }
  }

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isResizingRef.current = true;

      const startX = e.clientX;
      const img = imgRef.current;
      if (!img) return;
      const startWidth = img.offsetWidth;
      const ratio =
        img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : null;

      function onMouseMove(moveEvent: MouseEvent) {
        const diff = moveEvent.clientX - startX;
        const newWidth = Math.max(minWidth, startWidth + diff);
        if (img) {
          img.style.width = `${newWidth}px`;
          if (preserveAspectRatio && ratio) {
            img.style.height = `${Math.round(newWidth / ratio)}px`;
          }
        }
      }

      function cleanup() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        resizeCleanupRef.current = null;
      }

      function onMouseUp() {
        cleanup();
        if (img) {
          updateAttributes({
            width: Math.round(img.offsetWidth),
            height: Math.round(img.offsetHeight),
          });
        }
        // Delay clearing so the click handler on img doesn't fire
        requestAnimationFrame(() => {
          isResizingRef.current = false;
        });
      }

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      resizeCleanupRef.current = cleanup;
    },
    [updateAttributes, preserveAspectRatio, minWidth]
  );

  return (
    <NodeViewWrapper data-drag-handle data-align={node.attrs['data-align'] ?? undefined}>
      <Popover.Root open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <Popover.Anchor>
          <div className="image-wrapper" data-selected={selected || isPopoverOpen || undefined}>
            <img
              ref={imgRef}
              src={node.attrs.src}
              alt={node.attrs.alt ?? ''}
              style={{
                display: 'block',
                maxWidth: '100%',
                width: currentWidth ? `${currentWidth}px` : undefined,
                height: currentHeight ? `${currentHeight}px` : 'auto',
              }}
              draggable={false}
              onClick={() => {
                if (!isResizingRef.current) setIsPopoverOpen(true);
              }}
            />
            {resizeEnabled && (
              <div className="image-resize-handle" onMouseDown={handleResizeStart} />
            )}
          </div>
        </Popover.Anchor>
        <Popover.Content side="bottom">
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '8px',
              paddingBottom: '0',
            }}
          >
            <Field.Root>
              <Field.Label>
                {formatMessage({
                  id: 'tiptap-editor.image.alignment',
                  defaultMessage: 'Alignment',
                })}
              </Field.Label>
              <div style={{ display: 'flex', gap: '4px' }}>
                <ToolbarButton
                  onClick={() => handleAlign('left')}
                  icon={<TextAlignLeft />}
                  active={currentAlign === 'left'}
                  disabled={false}
                  tooltip={formatMessage({
                    id: 'tiptap-editor.image.alignLeft',
                    defaultMessage: 'Align left',
                  })}
                  marginLeft={0}
                />
                <ToolbarButton
                  onClick={() => handleAlign('center')}
                  icon={<TextAlignCenter />}
                  active={currentAlign === 'center'}
                  disabled={false}
                  tooltip={formatMessage({
                    id: 'tiptap-editor.image.alignCenter',
                    defaultMessage: 'Align center',
                  })}
                  marginLeft={0}
                />
                <ToolbarButton
                  onClick={() => handleAlign('right')}
                  icon={<TextAlignRight />}
                  active={currentAlign === 'right'}
                  disabled={false}
                  tooltip={formatMessage({
                    id: 'tiptap-editor.image.alignRight',
                    defaultMessage: 'Align right',
                  })}
                  marginLeft={0}
                />
              </div>
            </Field.Root>
            {resizeEnabled && (
              <Field.Root>
                <Field.Label>
                  {formatMessage({ id: 'tiptap-editor.image.size', defaultMessage: 'Size (px)' })}
                </Field.Label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <TextInput
                    type="number"
                    placeholder="W"
                    value={widthInput}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setWidthInput(e.target.value)
                    }
                    onBlur={handleWidthCommit}
                    onKeyDown={handleKeyDown}
                    aria-label={formatMessage({
                      id: 'tiptap-editor.image.width',
                      defaultMessage: 'Width (px)',
                    })}
                    style={{ minWidth: '62px', flexGrow: 1 }}
                  />
                  <span style={{ fontSize: '1.1rem', color: '#999' }}>&times;</span>
                  <TextInput
                    type="number"
                    placeholder="H"
                    value={heightInput}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setHeightInput(e.target.value)
                    }
                    onBlur={handleHeightCommit}
                    onKeyDown={handleKeyDown}
                    aria-label={formatMessage({
                      id: 'tiptap-editor.image.height',
                      defaultMessage: 'Height (px)',
                    })}
                    style={{ minWidth: '62px', flexGrow: 1 }}
                  />
                  {(currentWidth || currentHeight) && (
                    <IconButton
                      onClick={() => updateAttributes({ width: null, height: null })}
                      label={formatMessage({
                        id: 'tiptap-editor.image.resetSize',
                        defaultMessage: 'Reset size',
                      })}
                    >
                      <Cross />
                    </IconButton>
                  )}
                </div>
              </Field.Root>
            )}
            <Field.Root>
              <Field.Label>
                {formatMessage({ id: 'tiptap-editor.image.altText', defaultMessage: 'Alt text' })}
              </Field.Label>
              <TextInput
                value={altText}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  fillRequestRef.current++;
                  setAltText(e.target.value);
                }}
                onBlur={handleCommit}
                onKeyDown={handleKeyDown}
              />
            </Field.Root>
            <Field.Root>
              <Field.Label>
                {formatMessage({ id: 'tiptap-editor.image.title', defaultMessage: 'Title' })}
              </Field.Label>
              <TextInput
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                onBlur={handleTitleCommit}
                onKeyDown={handleKeyDown}
              />
            </Field.Root>
            <Field.Root>
              <Field.Label>
                {formatMessage({ id: 'tiptap-editor.image.caption', defaultMessage: 'Caption' })}
              </Field.Label>
              <TextInput
                value={caption}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  fillRequestRef.current++;
                  setCaption(e.target.value);
                }}
                onBlur={handleCaptionCommit}
                onKeyDown={handleKeyDown}
              />
            </Field.Root>
          </div>
          <div
            style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', padding: '8px' }}
          >
            <Button
              variant="tertiary"
              size="S"
              startIcon={<ArrowClockwise />}
              disabled={!assetId}
              onClick={handleFillFromMediaLibrary}
            >
              {formatMessage({
                id: 'tiptap-editor.image.fillFromMediaLibrary',
                defaultMessage: 'Use Media Library data',
              })}
            </Button>
            <Button variant="danger-light" size="S" startIcon={<Trash />} onClick={deleteNode}>
              {formatMessage({
                id: 'tiptap-editor.image.deleteImage',
                defaultMessage: 'Delete image',
              })}
            </Button>
          </div>
        </Popover.Content>
      </Popover.Root>
    </NodeViewWrapper>
  );
}

export default ImageNodeView;
