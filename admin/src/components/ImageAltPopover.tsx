import React, { useState, useEffect } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { Popover, TextInput, IconButton } from '@strapi/design-system';
import { Trash } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { ToolbarButton } from './ToolbarButton';
import { TextAlignLeft } from '../icons/TextAlignLeft';
import { TextAlignCenter } from '../icons/TextAlignCenter';
import { TextAlignRight } from '../icons/TextAlignRight';

export function ImageNodeView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const { formatMessage } = useIntl();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [altText, setAltText] = useState<string>(node.attrs.alt ?? '');

  // Sync local alt text state when node attrs change externally (undo/redo safety)
  useEffect(() => {
    setAltText(node.attrs.alt ?? '');
  }, [node.attrs.alt]);

  // Close popover when any ancestor scrolls so it doesn't float over other components
  useEffect(() => {
    if (!isPopoverOpen) return;
    const handleScroll = () => setIsPopoverOpen(false);
    document.addEventListener('scroll', handleScroll, true);
    return () => document.removeEventListener('scroll', handleScroll, true);
  }, [isPopoverOpen]);

  const currentAlign = node.attrs['data-align'] as 'left' | 'center' | 'right' | null;

  function handleAlign(value: 'left' | 'center' | 'right') {
    const current = node.attrs['data-align'] as string | null;
    updateAttributes({ 'data-align': current === value ? null : value });
  }

  function handleCommit() {
    updateAttributes({ alt: altText });
    // Do not close popover — user may want to continue editing
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  }

  return (
    <NodeViewWrapper data-drag-handle data-align={node.attrs['data-align'] ?? undefined}>
      <Popover.Root open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <Popover.Anchor>
          <img
            src={node.attrs.src}
            alt={node.attrs.alt ?? ''}
            style={{ maxWidth: '100%', display: 'block' }}
            draggable={false}
            onClick={() => setIsPopoverOpen(true)}
          />
        </Popover.Anchor>
        <Popover.Content side="bottom">
          <div style={{ display: 'flex', gap: '4px', padding: '8px', paddingBottom: '0' }}>
            <ToolbarButton
              onClick={() => handleAlign('left')}
              icon={<TextAlignLeft />}
              active={currentAlign === 'left'}
              disabled={false}
              tooltip={formatMessage({ id: 'tiptap-editor.image.alignLeft', defaultMessage: 'Align left' })}
              marginLeft={0}
            />
            <ToolbarButton
              onClick={() => handleAlign('center')}
              icon={<TextAlignCenter />}
              active={currentAlign === 'center'}
              disabled={false}
              tooltip={formatMessage({ id: 'tiptap-editor.image.alignCenter', defaultMessage: 'Align center' })}
              marginLeft={0}
            />
            <ToolbarButton
              onClick={() => handleAlign('right')}
              icon={<TextAlignRight />}
              active={currentAlign === 'right'}
              disabled={false}
              tooltip={formatMessage({ id: 'tiptap-editor.image.alignRight', defaultMessage: 'Align right' })}
              marginLeft={0}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px' }}>
            <TextInput
              placeholder={formatMessage({ id: 'tiptap-editor.image.altText', defaultMessage: 'Alt text' })}
              value={altText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAltText(e.target.value)}
              onBlur={handleCommit}
              onKeyDown={handleKeyDown}
              aria-label={formatMessage({ id: 'tiptap-editor.image.altText', defaultMessage: 'Alt text' })}
            />
            <IconButton
              onClick={deleteNode}
              label={formatMessage({ id: 'tiptap-editor.image.deleteImage', defaultMessage: 'Delete image' })}
            >
              <Trash />
            </IconButton>
          </div>
        </Popover.Content>
      </Popover.Root>
    </NodeViewWrapper>
  );
}

export default ImageNodeView;
