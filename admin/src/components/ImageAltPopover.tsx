import React, { useState, useEffect } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { Popover, TextInput, IconButton } from '@strapi/design-system';
import { Trash } from '@strapi/icons';
import { useIntl } from 'react-intl';

export function ImageNodeView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const { formatMessage } = useIntl();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [altText, setAltText] = useState<string>(node.attrs.alt ?? '');

  // Sync local alt text state when node attrs change externally (undo/redo safety)
  useEffect(() => {
    setAltText(node.attrs.alt ?? '');
  }, [node.attrs.alt]);

  function handleCommit() {
    updateAttributes({ alt: altText });
    // Do not close popover — user may want to continue editing
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      handleCommit();
      e.currentTarget.blur();
    }
  }

  return (
    <NodeViewWrapper data-drag-handle>
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
