import React, { useState } from 'react';
import { mergeAttributes } from '@tiptap/core';
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
  const rawWidth = node.attrs.width;
  const rawHeight = node.attrs.height;
  const width = typeof rawWidth === 'number' ? rawWidth : null;
  const height = typeof rawHeight === 'number' ? rawHeight : null;

  return (
    <NodeViewWrapper data-drag-handle data-align={node.attrs['data-align'] ?? undefined}>
      <figure style={{ margin: 0 }}>
        <img
          src={node.attrs.src}
          alt={node.attrs.alt ?? ''}
          style={{
            maxWidth: width ? undefined : '100%',
            display: 'block',
            width: width ? `${width}px` : undefined,
            height: height ? `${height}px` : undefined,
          }}
          draggable={false}
        />
        {node.attrs.caption && (
          <figcaption style={{ fontSize: '1.2rem', color: '#666687', marginTop: '4px' }}>
            {node.attrs.caption}
          </figcaption>
        )}
      </figure>
    </NodeViewWrapper>
  );
}

const resolveImageElement = (element: HTMLElement): HTMLElement =>
  element.tagName === 'FIGURE' ? (element.querySelector?.('img') ?? element) : element;

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
          const raw = resolveImageElement(element).getAttribute('data-asset-id');
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
      'data-document-id': {
        default: null,
        parseHTML: (element: HTMLElement) =>
          resolveImageElement(element).getAttribute('data-document-id') ?? null,
        renderHTML: (attributes: Record<string, unknown>) => {
          const docId = attributes['data-document-id'];
          if (!docId) return {};
          return { 'data-document-id': String(docId) };
        },
      },
      'data-align': {
        default: null,
        parseHTML: (element: HTMLElement) =>
          resolveImageElement(element).getAttribute('data-align') ?? null,
        renderHTML: (attributes: Record<string, unknown>) => {
          const align = attributes['data-align'];
          if (!align) return {};
          return { 'data-align': align };
        },
      },
      caption: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const img = resolveImageElement(element);
          const dataCaption =
            img.getAttribute('data-caption') ?? element.getAttribute('data-caption');
          if (dataCaption !== null) return dataCaption;
          if (element.tagName === 'FIGURE') {
            return element.querySelector?.('figcaption')?.textContent ?? null;
          }
          return null;
        },
        renderHTML: (attributes: Record<string, unknown>) => {
          const cap = attributes.caption;
          if (!cap) return {};
          return { 'data-caption': String(cap) };
        },
      },
    };
  },

  parseHTML() {
    const imgSelector = this.options.allowBase64 ? 'img[src]' : 'img[src]:not([src^="data:"])';
    return [
      {
        tag: 'figure',
        getAttrs: (node: HTMLElement) => {
          const img = node.querySelector?.(imgSelector);
          if (!img) return false;
          const rawWidth = img.getAttribute('width');
          const rawHeight = img.getAttribute('height');
          const parsedWidth = rawWidth !== null ? parseInt(rawWidth, 10) : null;
          const parsedHeight = rawHeight !== null ? parseInt(rawHeight, 10) : null;
          return {
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt'),
            title: img.getAttribute('title'),
            width: parsedWidth !== null && !isNaN(parsedWidth) ? parsedWidth : rawWidth,
            height: parsedHeight !== null && !isNaN(parsedHeight) ? parsedHeight : rawHeight,
          };
        },
      },
      {
        tag: imgSelector,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const mergedAttributes = mergeAttributes(this.options.HTMLAttributes, HTMLAttributes);
    const caption = mergedAttributes['data-caption'];
    if (caption) {
      return [
        'figure',
        { class: 'strapi-image-figure' },
        ['img', mergedAttributes],
        ['figcaption', {}, String(caption)],
      ];
    }
    return ['img', mergedAttributes];
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
    const src = asset?.url?.trim();
    if (!asset || !editor || !src) {
      setShowPicker(false);
      return;
    }

    // Alt text fallback chain (IMG-03)
    const altText = asset.alternativeText ?? asset.name ?? '';

    editor
      .chain()
      .focus()
      .setImage({
        src,
        alt: altText,
        'data-asset-id': asset.id,
        'data-document-id': asset.documentId ?? null,
        caption: asset.caption ?? null,
      } as any)
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
      allowedTypes={['images']}
    />
  );

  return { imageButton, imageDialog };
}
