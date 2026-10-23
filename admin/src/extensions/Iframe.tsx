import React, { useState, useEffect } from 'react';
import { Node, mergeAttributes, type Editor } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, useEditorState } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import {
  Popover,
  TextInput,
  IconButton,
  Dialog,
  Button,
  Field,
  Flex,
  Typography,
} from '@strapi/design-system';
import { Trash, CodeBlock } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { ToolbarButton } from '../components/ToolbarButton';
import { TextAlignLeft } from '../icons/TextAlignLeft';
import { TextAlignCenter } from '../icons/TextAlignCenter';
import { TextAlignRight } from '../icons/TextAlignRight';
import { isSafeIframeUrl } from '../../../shared/contentSerializer';

export const DEFAULT_ALLOWED_IFRAME_DOMAINS = [
  'youtube.com',
  'youtube-nocookie.com',
  'vimeo.com',
  'player.vimeo.com',
  'codepen.io',
  'codesandbox.io',
  'figma.com',
  'google.com',
  'spotify.com',
  'soundcloud.com',
];

export interface StrapiIframeOptions {
  HTMLAttributes: Record<string, unknown>;
  enableContentCheck: boolean;
  allowedDomains: string[];
  sandbox: string;
}

/**
 * Resolves the effective domain allowlist (falling back to `DEFAULT_ALLOWED_IFRAME_DOMAINS`
 * when an empty array is configured).
 */
function resolveEffectiveDomains(domains?: string[]): string[] {
  return Array.isArray(domains) && domains.length > 0 ? domains : DEFAULT_ALLOWED_IFRAME_DOMAINS;
}

/**
 * Read-only NodeView for sandboxed HTTPS iframes when the feature is disabled in the active preset.
 */
export function IframeNodeViewReadOnly({ node, extension }: NodeViewProps) {
  const { formatMessage } = useIntl();
  const rawSrc = String(node.attrs.src || '');
  const allowedDomains = resolveEffectiveDomains(
    (extension?.options as StrapiIframeOptions | undefined)?.allowedDomains
  );
  const sandbox =
    (extension?.options as StrapiIframeOptions | undefined)?.sandbox ||
    'allow-scripts allow-popups';
  const isSafe = isSafeIframeUrl(rawSrc, allowedDomains);

  const width = node.attrs.width ? `${node.attrs.width}px` : '100%';
  const height = node.attrs.height ? `${node.attrs.height}px` : '360px';

  return (
    <NodeViewWrapper data-drag-handle data-align={node.attrs['data-align'] ?? undefined}>
      <div style={{ margin: '0.75em 0' }}>
        {isSafe ? (
          <iframe
            src={rawSrc}
            title={
              node.attrs.title ||
              formatMessage({
                id: 'tiptap-editor.iframe.embeddedTitle',
                defaultMessage: 'Embedded content',
              })
            }
            style={{
              width,
              maxWidth: '100%',
              height,
              border: '1px solid #dcdce4',
              borderRadius: '6px',
            }}
            sandbox={sandbox}
            loading="lazy"
          />
        ) : (
          <div
            style={{
              padding: '12px',
              border: '1px dashed #d02b20',
              borderRadius: '6px',
              color: '#d02b20',
              fontSize: '1.2rem',
            }}
          >
            {formatMessage({
              id: 'tiptap-editor.iframe.blockedUrl',
              defaultMessage: 'Blocked unsafe or non-HTTPS iframe URL.',
            })}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}

/**
 * Interactive NodeView for sandboxed HTTPS iframes with alignment, title, height, and delete controls.
 */
export function IframeNodeView(props: NodeViewProps) {
  const { node, updateAttributes, deleteNode, selected } = props;
  const { formatMessage } = useIntl();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [title, setTitle] = useState<string>(node.attrs.title ?? '');
  const [heightInput, setHeightInput] = useState<string>(
    node.attrs.height ? String(node.attrs.height) : '360'
  );
  const currentAlign = node.attrs['data-align'] as 'left' | 'center' | 'right' | null;

  useEffect(() => {
    setTitle(node.attrs.title ?? '');
  }, [node.attrs.title]);

  const handleAlign = (val: 'left' | 'center' | 'right') => {
    updateAttributes({ 'data-align': currentAlign === val ? null : val });
  };

  const handleHeightCommit = () => {
    const parsed = parseInt(heightInput, 10);
    if (!Number.isNaN(parsed) && parsed >= 100 && parsed <= 1600) {
      updateAttributes({ height: parsed });
    }
  };

  return (
    <NodeViewWrapper data-drag-handle data-align={node.attrs['data-align'] ?? undefined}>
      <Popover.Root open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <Popover.Anchor>
          <div
            role="button"
            tabIndex={0}
            aria-haspopup="dialog"
            aria-expanded={isPopoverOpen}
            aria-label={formatMessage({
              id: 'tiptap-editor.iframe.edit',
              defaultMessage: 'Edit iframe',
            })}
            onClick={() => setIsPopoverOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsPopoverOpen(true);
              }
            }}
            style={{
              outline: selected ? '2px solid #4945ff' : undefined,
              borderRadius: '6px',
              padding: '4px',
              cursor: 'pointer',
            }}
          >
            <IframeNodeViewReadOnly {...props} />
          </div>
        </Popover.Anchor>
        <Popover.Content side="bottom">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px' }}>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <ToolbarButton
                onClick={() => handleAlign('left')}
                icon={<TextAlignLeft />}
                active={currentAlign === 'left'}
                toggle
                tooltip={formatMessage({
                  id: 'tiptap-editor.iframe.alignLeft',
                  defaultMessage: 'Align left',
                })}
              />
              <ToolbarButton
                onClick={() => handleAlign('center')}
                icon={<TextAlignCenter />}
                active={currentAlign === 'center'}
                toggle
                tooltip={formatMessage({
                  id: 'tiptap-editor.iframe.alignCenter',
                  defaultMessage: 'Align center',
                })}
              />
              <ToolbarButton
                onClick={() => handleAlign('right')}
                icon={<TextAlignRight />}
                active={currentAlign === 'right'}
                toggle
                tooltip={formatMessage({
                  id: 'tiptap-editor.iframe.alignRight',
                  defaultMessage: 'Align right',
                })}
              />
              <TextInput
                type="number"
                placeholder={formatMessage({
                  id: 'tiptap-editor.iframe.heightPlaceholder',
                  defaultMessage: 'Height (px)',
                })}
                value={heightInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setHeightInput(e.target.value)
                }
                onBlur={handleHeightCommit}
                aria-label={formatMessage({
                  id: 'tiptap-editor.iframe.heightAriaLabel',
                  defaultMessage: 'Iframe height',
                })}
                style={{ width: '90px' }}
              />
              <IconButton
                onClick={deleteNode}
                label={formatMessage({
                  id: 'tiptap-editor.iframe.delete',
                  defaultMessage: 'Delete iframe',
                })}
              >
                <Trash />
              </IconButton>
            </div>
            <TextInput
              placeholder={formatMessage({
                id: 'tiptap-editor.iframe.titlePlaceholder',
                defaultMessage: 'Accessible title (for screen readers)',
              })}
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              onBlur={() => updateAttributes({ title: title || null })}
              aria-label={formatMessage({
                id: 'tiptap-editor.iframe.titleAriaLabel',
                defaultMessage: 'Iframe title',
              })}
            />
          </div>
        </Popover.Content>
      </Popover.Root>
    </NodeViewWrapper>
  );
}

export const StrapiIframe = Node.create<StrapiIframeOptions>({
  name: 'iframe',
  group: 'block',
  atom: true,
  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
      enableContentCheck: false,
      allowedDomains: DEFAULT_ALLOWED_IFRAME_DOMAINS,
      sandbox: 'allow-scripts allow-popups',
    };
  },

  addAttributes() {
    return {
      src: { default: null },
      title: { default: null },
      width: { default: null },
      height: { default: 360 },
      'data-align': {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('data-align') ?? null,
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs['data-align'] ? { 'data-align': String(attrs['data-align']) } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: 'iframe[data-type="iframe"]' }, { tag: 'iframe:not([data-type="video"])' }];
  },

  renderHTML({ HTMLAttributes }) {
    const rawSrc = String(HTMLAttributes.src || '');
    const allowedDomains = resolveEffectiveDomains(this.options.allowedDomains);
    const safeSrc = isSafeIframeUrl(rawSrc, allowedDomains) ? rawSrc : 'about:blank';

    return [
      'iframe',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        src: safeSrc,
        'data-type': 'iframe',
        sandbox: this.options.sandbox,
        loading: 'lazy',
      }),
    ];
  },

  addNodeView() {
    if (this.options.enableContentCheck) {
      return ReactNodeViewRenderer(IframeNodeViewReadOnly);
    }
    return ReactNodeViewRenderer(IframeNodeView);
  },
});

/**
 * Provides toolbar button and dialog for embedding sandboxed HTTPS iframes from allowed domains.
 */
export function useIframe(
  editor: Editor | null,
  props: { disabled?: boolean; allowedDomains?: string[] } = { disabled: false }
) {
  const { formatMessage } = useIntl();
  const [showDialog, setShowDialog] = useState(false);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [height, setHeight] = useState('360');
  const [error, setError] = useState<string | null>(null);

  const effectiveAllowedDomains = resolveEffectiveDomains(props.allowedDomains);

  const editorState = useEditorState({
    editor,
    selector: (ctx) => ({
      isInCodeBlock: ctx.editor?.isActive('codeBlock') ?? false,
    }),
  });

  const handleInsert = () => {
    if (!editor) return;
    const trimmed = url.trim();
    if (!isSafeIframeUrl(trimmed, effectiveAllowedDomains)) {
      setError(
        formatMessage(
          {
            id: 'tiptap-editor.iframe.invalidUrlWithDomains',
            defaultMessage: 'URL must use https:// and match allowed domains: {domains}',
          },
          { domains: effectiveAllowedDomains.join(', ') }
        )
      );
      return;
    }

    const parsedHeight = parseInt(height, 10);
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'iframe',
        attrs: {
          src: trimmed,
          title:
            title.trim() ||
            formatMessage({
              id: 'tiptap-editor.iframe.embeddedTitle',
              defaultMessage: 'Embedded content',
            }),
          height: !Number.isNaN(parsedHeight) && parsedHeight >= 100 ? parsedHeight : 360,
        },
      })
      .createParagraphNear()
      .run();

    setUrl('');
    setTitle('');
    setHeight('360');
    setError(null);
    setShowDialog(false);
  };

  const iframeButton = (
    <ToolbarButton
      onClick={() => {
        setError(null);
        setShowDialog(true);
      }}
      icon={<CodeBlock />}
      active={false}
      disabled={props.disabled || !editor || (editorState?.isInCodeBlock ?? false)}
      tooltip={formatMessage({
        id: 'tiptap-editor.toolbar.insertIframe',
        defaultMessage: 'Embed iframe (HTTPS)',
      })}
    />
  );

  const iframeDialog = (
    <Dialog.Root open={showDialog} onOpenChange={setShowDialog}>
      <Dialog.Content>
        <Dialog.Header>
          {formatMessage({
            id: 'tiptap-editor.iframe.dialogTitle',
            defaultMessage: 'Embed HTTPS Iframe',
          })}
        </Dialog.Header>
        <Dialog.Body>
          <Flex direction="column" alignItems="stretch" gap={4}>
            <Field.Root name="iframeUrl" error={error ?? undefined}>
              <Field.Label>
                {formatMessage({
                  id: 'tiptap-editor.iframe.urlLabel',
                  defaultMessage: 'HTTPS Embed URL',
                })}
              </Field.Label>
              <TextInput
                placeholder="https://..."
                value={url}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setUrl(e.target.value);
                  setError(null);
                }}
              />
              <Field.Error />
            </Field.Root>
            <Field.Root name="iframeTitle">
              <Field.Label>
                {formatMessage({
                  id: 'tiptap-editor.iframe.titleLabel',
                  defaultMessage: 'Title (accessibility)',
                })}
              </Field.Label>
              <TextInput
                placeholder={formatMessage({
                  id: 'tiptap-editor.iframe.titleInputPlaceholder',
                  defaultMessage: 'Interactive map or widget description',
                })}
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              />
            </Field.Root>
            <Field.Root name="iframeHeight">
              <Field.Label>
                {formatMessage({
                  id: 'tiptap-editor.iframe.heightLabel',
                  defaultMessage: 'Height (px)',
                })}
              </Field.Label>
              <TextInput
                type="number"
                value={height}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHeight(e.target.value)}
              />
            </Field.Root>
            <Typography variant="pi" textColor="neutral600">
              {formatMessage({
                id: 'tiptap-editor.iframe.sandboxNotice',
                defaultMessage: 'Embedded iframes are automatically sandboxed and lazy-loaded.',
              })}
            </Typography>
          </Flex>
        </Dialog.Body>
        <Dialog.Footer>
          <Dialog.Cancel>
            <Button variant="tertiary" onClick={() => setShowDialog(false)}>
              {formatMessage({
                id: 'tiptap-editor.iframe.cancel',
                defaultMessage: 'Cancel',
              })}
            </Button>
          </Dialog.Cancel>
          <Button onClick={handleInsert} disabled={!url.trim()}>
            {formatMessage({
              id: 'tiptap-editor.iframe.insert',
              defaultMessage: 'Embed',
            })}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  );

  return { iframeButton, iframeDialog };
}
