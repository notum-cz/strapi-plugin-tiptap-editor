import React from 'react';
import { Node, mergeAttributes, type Editor } from '@tiptap/core';
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  NodeViewContent,
  useEditorState,
} from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { Information } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { ToolbarButton } from '../components/ToolbarButton';

export type InfoPaneVariant = 'info' | 'success' | 'warning' | 'danger' | 'neutral' | 'tip';

export interface InformationPaneOptions {
  HTMLAttributes: Record<string, unknown>;
  enableContentCheck: boolean;
}

const VARIANT_STYLES: Record<
  InfoPaneVariant,
  { border: string; bg: string; badgeBg: string; labelId: string; defaultLabel: string }
> = {
  info: {
    border: '#4945ff',
    bg: '#f0f0ff',
    badgeBg: '#4945ff',
    labelId: 'tiptap-editor.infoPane.variant.info',
    defaultLabel: 'Info',
  },
  success: {
    border: '#328048',
    bg: '#eafbe7',
    badgeBg: '#328048',
    labelId: 'tiptap-editor.infoPane.variant.success',
    defaultLabel: 'Success',
  },
  warning: {
    border: '#d9822f',
    bg: '#fdf4dc',
    badgeBg: '#d9822f',
    labelId: 'tiptap-editor.infoPane.variant.warning',
    defaultLabel: 'Warning',
  },
  danger: {
    border: '#d02b20',
    bg: '#fcecea',
    badgeBg: '#d02b20',
    labelId: 'tiptap-editor.infoPane.variant.danger',
    defaultLabel: 'Danger',
  },
  neutral: {
    border: '#666687',
    bg: '#f6f6f9',
    badgeBg: '#666687',
    labelId: 'tiptap-editor.infoPane.variant.neutral',
    defaultLabel: 'Neutral',
  },
  tip: {
    border: '#0c75af',
    bg: '#eaf5ff',
    badgeBg: '#0c75af',
    labelId: 'tiptap-editor.infoPane.variant.tip',
    defaultLabel: 'Tip',
  },
};

/**
 * Validates and normalizes an `InfoPaneVariant` attribute against `VARIANT_STYLES`.
 */
function resolveSafeVariant(raw: unknown): InfoPaneVariant {
  return typeof raw === 'string' && Object.prototype.hasOwnProperty.call(VARIANT_STYLES, raw)
    ? (raw as InfoPaneVariant)
    : 'info';
}

/**
 * Read-only NodeView for InformationPane callout blocks when disabled in the active preset.
 */
export function InformationPaneNodeViewReadOnly({ node }: NodeViewProps) {
  const { formatMessage } = useIntl();
  const variant = resolveSafeVariant(node.attrs.variant);
  const style = VARIANT_STYLES[variant];
  const title = String(
    node.attrs.title ||
      formatMessage({ id: style.labelId, defaultMessage: style.defaultLabel })
  );

  return (
    <NodeViewWrapper data-type="information-pane" data-variant={variant}>
      <aside
        role="note"
        style={{
          borderLeft: `4px solid ${style.border}`,
          background: style.bg,
          borderRadius: '0 6px 6px 0',
          padding: '12px 16px',
          margin: '0.75em 0',
        }}
      >
        <div
          contentEditable={false}
          style={{
            fontWeight: 700,
            fontSize: '1.2rem',
            color: style.border,
            marginBottom: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {title}
        </div>
        <NodeViewContent className="info-pane-content" />
      </aside>
    </NodeViewWrapper>
  );
}

/**
 * Interactive NodeView for InformationPane callout blocks with variant selector and editable title.
 */
export function InformationPaneNodeView({ node, updateAttributes }: NodeViewProps) {
  const { formatMessage } = useIntl();
  const variant = resolveSafeVariant(node.attrs.variant);
  const style = VARIANT_STYLES[variant];
  const defaultTitle = formatMessage({
    id: style.labelId,
    defaultMessage: style.defaultLabel,
  });
  const title = String(node.attrs.title ?? defaultTitle);

  return (
    <NodeViewWrapper data-type="information-pane" data-variant={variant}>
      <aside
        role="note"
        style={{
          borderLeft: `4px solid ${style.border}`,
          background: style.bg,
          borderRadius: '0 6px 6px 0',
          padding: '12px 16px',
          margin: '0.75em 0',
        }}
      >
        <div
          contentEditable={false}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            marginBottom: '8px',
          }}
        >
          <input
            type="text"
            value={title}
            onChange={(e) => updateAttributes({ title: e.target.value })}
            aria-label={formatMessage({
              id: 'tiptap-editor.infoPane.titleAriaLabel',
              defaultMessage: 'Information pane title',
            })}
            style={{
              fontWeight: 700,
              fontSize: '1.25rem',
              color: style.border,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              flexGrow: 1,
            }}
          />
          <select
            value={variant}
            onChange={(e) => {
              const nextVar = resolveSafeVariant(e.target.value);
              const nextStyle = VARIANT_STYLES[nextVar];
              const nextDefaultTitle = formatMessage({
                id: nextStyle.labelId,
                defaultMessage: nextStyle.defaultLabel,
              });
              updateAttributes({
                variant: nextVar,
                title: title === defaultTitle ? nextDefaultTitle : title,
              });
            }}
            aria-label={formatMessage({
              id: 'tiptap-editor.infoPane.variantAriaLabel',
              defaultMessage: 'Information pane variant',
            })}
            style={{
              fontSize: '1.1rem',
              padding: '2px 6px',
              borderRadius: '4px',
              border: `1px solid ${style.border}`,
              background: '#fff',
              color: '#212134',
              cursor: 'pointer',
            }}
          >
            <option value="info">
              {formatMessage({
                id: 'tiptap-editor.infoPane.variant.info',
                defaultMessage: 'Info',
              })}
            </option>
            <option value="success">
              {formatMessage({
                id: 'tiptap-editor.infoPane.variant.success',
                defaultMessage: 'Success',
              })}
            </option>
            <option value="warning">
              {formatMessage({
                id: 'tiptap-editor.infoPane.variant.warning',
                defaultMessage: 'Warning',
              })}
            </option>
            <option value="danger">
              {formatMessage({
                id: 'tiptap-editor.infoPane.variant.danger',
                defaultMessage: 'Danger',
              })}
            </option>
            <option value="neutral">
              {formatMessage({
                id: 'tiptap-editor.infoPane.variant.neutral',
                defaultMessage: 'Neutral',
              })}
            </option>
            <option value="tip">
              {formatMessage({
                id: 'tiptap-editor.infoPane.variant.tip',
                defaultMessage: 'Tip',
              })}
            </option>
          </select>
        </div>
        <NodeViewContent className="info-pane-content" />
      </aside>
    </NodeViewWrapper>
  );
}

export const InformationPane = Node.create<InformationPaneOptions>({
  name: 'informationPane',
  group: 'block',
  content: 'block+',
  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {},
      enableContentCheck: false,
    };
  },

  addAttributes() {
    return {
      variant: {
        default: 'info',
        parseHTML: (el: HTMLElement) => resolveSafeVariant(el.getAttribute('data-variant')),
        renderHTML: (attrs: Record<string, unknown>) => ({
          'data-variant': resolveSafeVariant(attrs.variant),
        }),
      },
      title: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('data-title') || null,
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs.title ? { 'data-title': String(attrs.title) } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: 'aside[data-type="information-pane"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'aside',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'information-pane',
        role: 'note',
      }),
      0,
    ];
  },

  addNodeView() {
    if (this.options.enableContentCheck) {
      return ReactNodeViewRenderer(InformationPaneNodeViewReadOnly);
    }
    return ReactNodeViewRenderer(InformationPaneNodeView);
  },
});

/**
 * Provides toolbar toggle button for inserting or removing an InformationPane callout block.
 */
export function useInformationPane(
  editor: Editor | null,
  props: { disabled?: boolean } = { disabled: false }
) {
  const { formatMessage } = useIntl();

  const editorState = useEditorState({
    editor,
    selector: (ctx) => ({
      isActive: ctx.editor?.isActive('informationPane') ?? false,
      isInCodeBlock: ctx.editor?.isActive('codeBlock') ?? false,
    }),
  });

  const handleInsert = () => {
    if (!editor) return;
    if (editor.isActive('informationPane')) {
      editor.chain().focus().lift('informationPane').run();
      return;
    }
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'informationPane',
        attrs: {
          variant: 'info',
          title: formatMessage({
            id: 'tiptap-editor.infoPane.defaultTitle',
            defaultMessage: 'Information',
          }),
        },
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: formatMessage({
                  id: 'tiptap-editor.infoPane.defaultContent',
                  defaultMessage: 'Enter callout details here...',
                }),
              },
            ],
          },
        ],
      })
      .run();
  };

  const informationPaneButton = (
    <ToolbarButton
      onClick={handleInsert}
      icon={<Information />}
      active={editorState?.isActive ?? false}
      toggle
      disabled={props.disabled || !editor || (editorState?.isInCodeBlock ?? false)}
      tooltip={formatMessage({
        id: 'tiptap-editor.toolbar.informationPane',
        defaultMessage: 'Information pane / callout',
      })}
    />
  );

  return { informationPaneButton };
}
