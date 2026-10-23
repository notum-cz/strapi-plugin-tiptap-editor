import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import type { ImageOptions } from '@tiptap/extension-image';
import { Popover, TextInput, IconButton } from '@strapi/design-system';
import { Trash, Cross } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { ToolbarButton } from './ToolbarButton';
import { TextAlignLeft } from '../icons/TextAlignLeft';
import { TextAlignCenter } from '../icons/TextAlignCenter';
import { TextAlignRight } from '../icons/TextAlignRight';
import { ImageEditorModal } from './ImageEditorModal';

/**
 * Interactive NodeView for images with alignment, dimensions, alt text, caption,
 * drag-resize handle, and HTML5 Canvas Image Studio integration.
 */
export function ImageNodeView({
  node,
  updateAttributes,
  deleteNode,
  selected,
  extension,
}: NodeViewProps) {
  const { formatMessage } = useIntl();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [altText, setAltText] = useState<string>(node.attrs.alt ?? '');
  const [captionText, setCaptionText] = useState<string>(node.attrs.caption ?? '');
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

  // Sync local alt & caption text state when node attrs change externally (undo/redo safety)
  useEffect(() => {
    setAltText(node.attrs.alt ?? '');
  }, [node.attrs.alt]);

  useEffect(() => {
    setCaptionText(node.attrs.caption ?? '');
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

  function handleCaptionCommit() {
    updateAttributes({ caption: captionText || null });
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

      function onMouseUp(upEvent: MouseEvent) {
        cleanup();
        const diff = upEvent.clientX - startX;
        const finalWidth = Math.max(minWidth, startWidth + diff);
        const attrs: Record<string, unknown> = { width: finalWidth };
        if (preserveAspectRatio && ratio) {
          attrs.height = Math.round(finalWidth / ratio);
        }
        updateAttributes(attrs);
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
          <figure
            className="image-wrapper"
            data-selected={selected || isPopoverOpen || undefined}
            style={{ margin: 0 }}
          >
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
            {node.attrs.caption && (
              <figcaption
                style={{
                  fontSize: '1.2rem',
                  color: '#666687',
                  marginTop: '4px',
                  lineHeight: 1.4,
                  textAlign: 'center',
                }}
              >
                {node.attrs.caption}
              </figcaption>
            )}
            {resizeEnabled && (
              <div className="image-resize-handle" onMouseDown={handleResizeStart} />
            )}
          </figure>
        </Popover.Anchor>
        <Popover.Content side="bottom">
          <div style={{ display: 'flex', gap: '4px', padding: '8px', paddingBottom: '0' }}>
            <ToolbarButton
              onClick={() => handleAlign('left')}
              icon={<TextAlignLeft />}
              active={currentAlign === 'left'}
              toggle
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
              toggle
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
              toggle
              disabled={false}
              tooltip={formatMessage({
                id: 'tiptap-editor.image.alignRight',
                defaultMessage: 'Align right',
              })}
              marginLeft={0}
            />
            <ToolbarButton
              onClick={() => {
                setIsPopoverOpen(false);
                setIsEditorOpen(true);
              }}
              icon={
                <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                  {formatMessage({
                    id: 'tiptap-editor.image.cropEditLabel',
                    defaultMessage: 'Crop/Edit',
                  })}
                </span>
              }
              active={false}
              disabled={false}
              tooltip={formatMessage({
                id: 'tiptap-editor.image.openEditor',
                defaultMessage: 'Crop, rotate & edit image',
              })}
              marginLeft={0}
            />
          </div>
          {resizeEnabled && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '8px',
                paddingBottom: '0',
              }}
            >
              <TextInput
                type="number"
                placeholder="W"
                value={widthInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWidthInput(e.target.value)}
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
          )}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              padding: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TextInput
                placeholder={formatMessage({
                  id: 'tiptap-editor.image.altText',
                  defaultMessage: 'Alt text',
                })}
                value={altText}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAltText(e.target.value)}
                onBlur={handleCommit}
                onKeyDown={handleKeyDown}
                aria-label={formatMessage({
                  id: 'tiptap-editor.image.altText',
                  defaultMessage: 'Alt text',
                })}
              />
              <IconButton
                onClick={deleteNode}
                label={formatMessage({
                  id: 'tiptap-editor.image.deleteImage',
                  defaultMessage: 'Delete image',
                })}
              >
                <Trash />
              </IconButton>
            </div>
            <TextInput
              placeholder={formatMessage({
                id: 'tiptap-editor.image.caption',
                defaultMessage: "Caption ('<figcaption>')",
              })}
              value={captionText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setCaptionText(e.target.value)
              }
              onBlur={handleCaptionCommit}
              onKeyDown={handleKeyDown}
              aria-label={formatMessage({
                id: 'tiptap-editor.image.caption',
                defaultMessage: 'Caption',
              })}
            />
          </div>
        </Popover.Content>
      </Popover.Root>
      <ImageEditorModal
        open={isEditorOpen}
        src={node.attrs.src ?? ''}
        initialAlt={node.attrs.alt ?? ''}
        initialCaption={node.attrs.caption ?? ''}
        onClose={() => setIsEditorOpen(false)}
        onSave={(edited) => {
          const srcChanged = edited.src !== node.attrs.src;
          updateAttributes({
            src: edited.src,
            alt: edited.alt,
            caption: edited.caption || null,
            ...(edited.width !== undefined ? { width: edited.width } : {}),
            ...(edited.height !== undefined ? { height: edited.height } : {}),
            ...(srcChanged
              ? {
                  'data-asset-id': edited.assetId ?? null,
                  'data-document-id': edited.documentId ?? null,
                }
              : {}),
          });
        }}
      />
    </NodeViewWrapper>
  );
}

export default ImageNodeView;
