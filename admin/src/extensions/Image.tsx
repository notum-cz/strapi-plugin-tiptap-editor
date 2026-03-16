import React, { useState } from 'react';
import Image, { type ImageOptions } from '@tiptap/extension-image';

interface StrapiImageOptions extends ImageOptions {
  enableContentCheck: boolean;
}
import { ReactNodeViewRenderer, NodeViewWrapper, useEditorState } from '@tiptap/react';
import type { NodeViewProps, Editor } from '@tiptap/react';
import { useIntl } from 'react-intl';
import { Image as ImageIcon } from '@strapi/icons';
import { ToolbarButton } from '../components/ToolbarButton';
import { MediaLibraryWrapper, StrapiFile } from '../components/MediaLibraryWrapper';
import { ImageNodeView } from '../components/ImageAltPopover';

export function ImageNodeViewReadOnly({ node }: NodeViewProps) {
  return (
    <NodeViewWrapper data-drag-handle data-align={node.attrs['data-align'] ?? undefined}>
      <img
        src={node.attrs.src}
        alt={node.attrs.alt ?? ''}
        style={{ maxWidth: '100%', display: 'block' }}
        draggable={false}
      />
    </NodeViewWrapper>
  );
}

export const StrapiImage = Image.extend<StrapiImageOptions>({
  addOptions() {
    return {
      ...(this as any).parent?.(),
      enableContentCheck: false,
    };
  },

  addAttributes() {
    return {
      ...(this as any).parent?.(),
      'data-asset-id': {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const raw = element.getAttribute('data-asset-id');
          if (raw === null) return null;
          const parsed = parseInt(raw, 10);
          return isNaN(parsed) ? null : parsed;
        },
        renderHTML: (attributes: Record<string, unknown>) => {
          const id = attributes['data-asset-id'];
          if (id === null || id === undefined) return {};
          return { 'data-asset-id': String(id) };
        },
      },
      'data-align': {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-align') ?? null,
        renderHTML: (attributes: Record<string, unknown>) => {
          const align = attributes['data-align'];
          if (!align) return {};
          return { 'data-align': align };
        },
      },
    };
  },

  addNodeView() {
    if (this.options.enableContentCheck) {
      return ReactNodeViewRenderer(ImageNodeViewReadOnly);
    }
    return ReactNodeViewRenderer(ImageNodeView);
  },
});

export function useImage(
  editor: Editor | null,
  props: { disabled?: boolean } = { disabled: false }
) {
  const [showPicker, setShowPicker] = useState(false);
  const { formatMessage } = useIntl();

  const editorState = useEditorState({
    editor,
    selector: (ctx) => ({
      isInCodeBlock: ctx.editor?.isActive('codeBlock') ?? false,
    }),
  });

  function handleSelectAssets(assets: StrapiFile[]) {
    const asset = assets[0];
    if (!asset || !editor) return;

    // Alt text fallback chain (IMG-03)
    const altText = asset.alternativeText ?? asset.name ?? '';

    // Insert image and ensure a paragraph follows (research pitfall 2: cursor trapped at end of doc)
    editor
      .chain()
      .focus()
      .setImage({ src: asset.url ?? '', alt: altText, 'data-asset-id': asset.id } as any)
      .createParagraphNear()
      .run();

    setShowPicker(false);
  }

  const imageButton = (
    <ToolbarButton
      onClick={() => setShowPicker(true)}
      icon={<ImageIcon />}
      active={false}
      disabled={props.disabled || !editor || (editorState?.isInCodeBlock ?? false)}
      tooltip={formatMessage({
        id: 'tiptap-editor.toolbar.insertImage',
        defaultMessage: 'Insert image',
      })}
    />
  );

  const imageDialog = (
    <MediaLibraryWrapper
      open={showPicker}
      onClose={() => setShowPicker(false)}
      onSelectAssets={handleSelectAssets}
    />
  );

  return { imageButton, imageDialog };
}
