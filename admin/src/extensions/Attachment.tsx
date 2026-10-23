import React, { useState } from 'react';
import { Node, mergeAttributes, type Editor } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, useEditorState } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { IconButton } from '@strapi/design-system';
import { Trash, Paperclip } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { ToolbarButton } from '../components/ToolbarButton';
import { MediaLibraryWrapper, type StrapiFile } from '../components/MediaLibraryWrapper';
import { isSafeUrl } from '../../../shared/contentSerializer';

export interface StrapiAttachmentOptions {
  HTMLAttributes: Record<string, unknown>;
  enableContentCheck: boolean;
}

/**
 * Formats a file size in KB into a human-readable string (`KB` or `MB`).
 */
export function formatFileSize(sizeInKb?: number | string | null): string {
  const num = typeof sizeInKb === 'string' ? parseFloat(sizeInKb) : sizeInKb;
  if (typeof num !== 'number' || Number.isNaN(num) || num <= 0) return '';
  if (num >= 1024) {
    return `${(num / 1024).toFixed(1)} MB`;
  }
  return `${Math.round(num)} KB`;
}

/**
 * Read-only NodeView for attachment cards when the feature is disabled in the active preset.
 */
export function AttachmentNodeViewReadOnly({ node }: NodeViewProps) {
  const { formatMessage } = useIntl();
  const href = String(node.attrs.href || node.attrs.src || '');
  const safeHref = isSafeUrl(href) ? href : '#';
  const filename = String(
    node.attrs.filename ||
      node.attrs.title ||
      formatMessage({ id: 'tiptap-editor.attachment.defaultName', defaultMessage: 'Attachment' })
  );
  const ext = String(node.attrs.ext || '')
    .replace(/^\./, '')
    .toUpperCase();
  const sizeFormatted = formatFileSize(node.attrs.size);

  return (
    <NodeViewWrapper data-drag-handle data-type="attachment">
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 14px',
          border: '1px solid #dcdce4',
          borderRadius: '6px',
          background: '#f6f6f9',
          maxWidth: '100%',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px 8px',
            borderRadius: '4px',
            background: '#4945ff',
            color: '#fff',
            fontSize: '1.1rem',
            fontWeight: 700,
          }}
        >
          {ext || 'FILE'}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <a
            href={safeHref}
            target="_blank"
            rel="noopener noreferrer"
            download={filename}
            style={{ fontWeight: 600, fontSize: '1.3rem', color: '#212134' }}
          >
            {filename}
          </a>
          {sizeFormatted && (
            <span style={{ fontSize: '1.1rem', color: '#666687' }}>{sizeFormatted}</span>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );
}

/**
 * Interactive NodeView for attachment cards with delete action.
 */
export function AttachmentNodeView(props: NodeViewProps) {
  const { formatMessage } = useIntl();
  const { deleteNode } = props;

  return (
    <NodeViewWrapper data-drag-handle data-type="attachment">
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', maxWidth: '100%' }}>
        <AttachmentNodeViewReadOnly {...props} />
        <IconButton
          onClick={deleteNode}
          label={formatMessage({
            id: 'tiptap-editor.attachment.delete',
            defaultMessage: 'Remove attachment',
          })}
        >
          <Trash />
        </IconButton>
      </div>
    </NodeViewWrapper>
  );
}

export const StrapiAttachment = Node.create<StrapiAttachmentOptions>({
  name: 'attachment',
  group: 'block',
  atom: true,
  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
      enableContentCheck: false,
    };
  },

  addAttributes() {
    return {
      href: { default: null },
      src: { default: null },
      filename: { default: null },
      title: { default: null },
      mime: { default: null },
      size: { default: null },
      ext: { default: null },
      'data-asset-id': {
        default: null,
        parseHTML: (el: HTMLElement) => {
          const raw = el.getAttribute('data-asset-id');
          if (!raw) return null;
          const num = parseInt(raw, 10);
          return Number.isNaN(num) ? null : num;
        },
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs['data-asset-id'] != null ? { 'data-asset-id': String(attrs['data-asset-id']) } : {},
      },
      'data-document-id': {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('data-document-id') ?? null,
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs['data-document-id']
            ? { 'data-document-id': String(attrs['data-document-id']) }
            : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="attachment"]' }, { tag: 'a[data-attachment="true"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const href = String(HTMLAttributes.href || HTMLAttributes.src || '#');
    const safeHref = isSafeUrl(href) ? href : '#';
    const label = String(HTMLAttributes.filename || HTMLAttributes.title || 'Attachment');
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'attachment',
      }),
      [
        'a',
        {
          href: safeHref,
          download: String(HTMLAttributes.filename || ''),
          'data-attachment': 'true',
          rel: 'noopener noreferrer',
        },
        label,
      ],
    ];
  },

  addNodeView() {
    if (this.options.enableContentCheck) {
      return ReactNodeViewRenderer(AttachmentNodeViewReadOnly);
    }
    return ReactNodeViewRenderer(AttachmentNodeView);
  },
});

/**
 * Provides toolbar button and Strapi Media Library dialog for inserting file attachments.
 */
export function useAttachment(
  editor: Editor | null,
  props: { disabled?: boolean } = { disabled: false }
) {
  const { formatMessage } = useIntl();
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);

  const editorState = useEditorState({
    editor,
    selector: (ctx) => ({
      isInCodeBlock: ctx.editor?.isActive('codeBlock') ?? false,
    }),
  });

  const handleSelectAssets = (assets: StrapiFile[]) => {
    const asset = assets[0];
    const url = asset?.url?.trim();
    if (!asset || !editor || !url) {
      setShowMediaLibrary(false);
      return;
    }

    editor
      .chain()
      .focus()
      .insertContent({
        type: 'attachment',
        attrs: {
          href: url,
          src: url,
          filename: asset.name ?? 'file',
          title: asset.alternativeText ?? asset.name ?? 'file',
          mime: asset.mime ?? null,
          size: asset.size ?? null,
          ext: asset.ext ?? null,
          'data-asset-id': asset.id ?? null,
          'data-document-id': asset.documentId ?? null,
        },
      })
      .createParagraphNear()
      .run();

    setShowMediaLibrary(false);
  };

  const attachmentButton = (
    <ToolbarButton
      onClick={() => setShowMediaLibrary(true)}
      icon={<Paperclip />}
      active={false}
      disabled={props.disabled || !editor || (editorState?.isInCodeBlock ?? false)}
      tooltip={formatMessage({
        id: 'tiptap-editor.toolbar.insertAttachment',
        defaultMessage: 'Insert attachment file',
      })}
    />
  );

  const attachmentDialog = (
    <MediaLibraryWrapper
      open={showMediaLibrary}
      onClose={() => setShowMediaLibrary(false)}
      onSelectAssets={handleSelectAssets}
      allowedTypes={['files', 'images', 'videos', 'audios']}
    />
  );

  return { attachmentButton, attachmentDialog };
}
