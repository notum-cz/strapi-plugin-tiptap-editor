import React, { useState, useEffect } from 'react';
import { Node, mergeAttributes, type Editor } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, useEditorState } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import {
  Dialog,
  Button,
  Field,
  Flex,
  TextInput,
  Typography,
  Box,
  IconButton,
} from '@strapi/design-system';
import { Link as LinkIcon, Trash } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { ToolbarButton } from '../components/ToolbarButton';
import { PLUGIN_ID } from '../../../shared/pluginId';
import { formatStrapiLinkUri } from '../../../shared/relations';
import { isSafeUrl } from '../../../shared/contentSerializer';

export interface StrapiLinkerOptions {
  HTMLAttributes: Record<string, unknown>;
  enableContentCheck: boolean;
}

export interface SearchHit {
  documentId: string;
  id?: string | number;
  label: string;
  collectionName: string;
  status: string;
  locale?: string;
}

/**
 * Read-only NodeView for internal Strapi content links when disabled in the active preset.
 */
export function LinkerNodeViewReadOnly({ node }: NodeViewProps) {
  const collectionName = String(node.attrs.collectionName || '');
  const documentId = String(node.attrs.documentId || '');
  const label = String(node.attrs.label || documentId || 'Internal Link');
  const shortCollection = collectionName.split('.')[1] || collectionName || 'content';

  return (
    <NodeViewWrapper as="span" style={{ display: 'inline' }}>
      <span
        data-type="linker"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '1px 8px',
          borderRadius: '12px',
          background: '#f0f0ff',
          border: '1px solid #d9d8ff',
          color: '#4945ff',
          fontSize: '0.92em',
          fontWeight: 600,
          verticalAlign: 'baseline',
        }}
      >
        <span
          style={{
            fontSize: '0.8em',
            textTransform: 'uppercase',
            background: '#4945ff',
            color: '#fff',
            borderRadius: '8px',
            padding: '0 5px',
          }}
        >
          {shortCollection}
        </span>
        <span>{label}</span>
      </span>
    </NodeViewWrapper>
  );
}

/**
 * Interactive NodeView for internal Strapi content links with live document title resolution and removal.
 */
export function LinkerNodeView(props: NodeViewProps) {
  const { node, deleteNode } = props;
  const { formatMessage } = useIntl();
  const collectionName = String(node.attrs.collectionName || '');
  const documentId = String(node.attrs.documentId || '');
  const currentLabel = String(node.attrs.label || '');
  const [resolvedLabel, setResolvedLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!collectionName || !documentId) return;
    let cancelled = false;
    import('@strapi/strapi/admin')
      .then(({ getFetchClient }) => {
        if (typeof getFetchClient !== 'function') return undefined;
        return getFetchClient().get(
          `/${PLUGIN_ID}/get/${encodeURIComponent(collectionName)}/${encodeURIComponent(documentId)}`
        );
      })
      .then((res: { data?: SearchHit } | undefined) => {
        if (!cancelled && res?.data?.label) {
          setResolvedLabel(res.data.label);
        }
      })
      .catch(() => {
        // Ignore resolution errors in offline/test mode
      });
    return () => {
      cancelled = true;
    };
  }, [collectionName, documentId]);

  const displayNode = {
    ...node,
    attrs: {
      ...node.attrs,
      label: resolvedLabel ?? currentLabel,
    },
  } as unknown as NodeViewProps['node'];

  return (
    <NodeViewWrapper as="span" style={{ display: 'inline' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
        <LinkerNodeViewReadOnly {...props} node={displayNode} />
        <IconButton
          onClick={deleteNode}
          label={formatMessage({
            id: 'tiptap-editor.linker.remove',
            defaultMessage: 'Remove internal link',
          })}
          style={{ width: '20px', height: '20px', minWidth: '20px' }}
        >
          <Trash />
        </IconButton>
      </span>
    </NodeViewWrapper>
  );
}

export const StrapiLinker = Node.create<StrapiLinkerOptions>({
  name: 'linker',
  group: 'inline',
  inline: true,
  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
      enableContentCheck: false,
    };
  },

  addAttributes() {
    return {
      collectionName: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('data-collection') ?? null,
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs.collectionName ? { 'data-collection': String(attrs.collectionName) } : {},
      },
      documentId: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('data-document-id') ?? null,
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs.documentId ? { 'data-document-id': String(attrs.documentId) } : {},
      },
      label: {
        default: null,
        parseHTML: (el: HTMLElement) =>
          el.getAttribute('data-label') ?? el.textContent ?? null,
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs.label ? { 'data-label': String(attrs.label) } : {},
      },
      href: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('href') ?? null,
        renderHTML: (attrs: Record<string, unknown>) => {
          if (attrs.href && isSafeUrl(String(attrs.href))) return { href: String(attrs.href) };
          if (attrs.collectionName && attrs.documentId) {
            return {
              href: formatStrapiLinkUri(String(attrs.collectionName), String(attrs.documentId)),
            };
          }
          return {};
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'a[data-type="linker"]' }, { tag: 'span[data-type="linker"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const label = String(HTMLAttributes['data-label'] || HTMLAttributes.label || 'Internal Link');
    return [
      'a',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'linker',
      }),
      label,
    ];
  },

  addNodeView() {
    if (this.options.enableContentCheck) {
      return ReactNodeViewRenderer(LinkerNodeViewReadOnly);
    }
    return ReactNodeViewRenderer(LinkerNodeView);
  },
});

/**
 * Provides toolbar button and live search dialog for linking internal Strapi documents.
 */
export function useLinker(
  editor: Editor | null,
  props: { disabled?: boolean } = { disabled: false }
) {
  const { formatMessage } = useIntl();
  const [showDialog, setShowDialog] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Record<string, SearchHit[]>>({});
  const [isSearching, setIsSearching] = useState(false);

  const editorState = useEditorState({
    editor,
    selector: (ctx) => ({
      isInCodeBlock: ctx.editor?.isActive('codeBlock') ?? false,
    }),
  });

  useEffect(() => {
    if (!showDialog) return;
    const trimmed = query.trim();
    if (!trimmed) {
      setResults({});
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      setIsSearching(true);
      import('@strapi/strapi/admin')
        .then(({ getFetchClient }) => {
          if (typeof getFetchClient !== 'function') return undefined;
          return getFetchClient().get(`/${PLUGIN_ID}/search?q=${encodeURIComponent(trimmed)}`);
        })
        .then((res: { data?: { results?: Record<string, SearchHit[]> } } | undefined) => {
          if (!cancelled) {
            setResults(res?.data?.results || {});
          }
        })
        .catch(() => {
          if (!cancelled) setResults({});
        })
        .finally(() => {
          if (!cancelled) setIsSearching(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      setIsSearching(false);
    };
  }, [query, showDialog]);

  const handleSelectHit = (hit: SearchHit) => {
    if (!editor) return;
    const href = formatStrapiLinkUri(hit.collectionName, hit.documentId);
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'linker',
        attrs: {
          collectionName: hit.collectionName,
          documentId: hit.documentId,
          label: hit.label,
          href,
        },
      })
      .run();

    setShowDialog(false);
    setQuery('');
    setResults({});
  };

  const linkerButton = (
    <ToolbarButton
      onClick={() => setShowDialog(true)}
      icon={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '1.1rem', fontWeight: 700 }}>
          <LinkIcon />
          <span>
            {formatMessage({
              id: 'tiptap-editor.toolbar.linkerBadge',
              defaultMessage: 'Strapi',
            })}
          </span>
        </span>
      }
      active={false}
      disabled={props.disabled || !editor || (editorState?.isInCodeBlock ?? false)}
      tooltip={formatMessage({
        id: 'tiptap-editor.toolbar.linker',
        defaultMessage: 'Link internal Strapi entry',
      })}
    />
  );

  const collectionEntries = Object.entries(results);

  const linkerDialog = (
    <Dialog.Root open={showDialog} onOpenChange={setShowDialog}>
      <Dialog.Content>
        <Dialog.Header>
          {formatMessage({
            id: 'tiptap-editor.linker.dialogTitle',
            defaultMessage: 'Link Internal Strapi Content',
          })}
        </Dialog.Header>
        <Dialog.Body>
          <Flex direction="column" alignItems="stretch" gap={4}>
            <Field.Root name="linkerSearch">
              <Field.Label>
                {formatMessage({
                  id: 'tiptap-editor.linker.searchLabel',
                  defaultMessage: 'Search across collections',
                })}
              </Field.Label>
              <TextInput
                placeholder={formatMessage({
                  id: 'tiptap-editor.linker.searchPlaceholder',
                  defaultMessage: 'Type document title or documentId...',
                })}
                value={query}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
              />
            </Field.Root>

            {isSearching && (
              <Typography variant="pi" textColor="neutral600">
                {formatMessage({
                  id: 'tiptap-editor.linker.searching',
                  defaultMessage: 'Searching...',
                })}
              </Typography>
            )}

            {!isSearching && query.trim() && collectionEntries.length === 0 && (
              <Typography variant="pi" textColor="neutral600">
                {formatMessage({
                  id: 'tiptap-editor.linker.noResults',
                  defaultMessage: 'No matching entries found.',
                })}
              </Typography>
            )}

            <Box style={{ maxHeight: '260px', overflowY: 'auto' }}>
              <Flex direction="column" alignItems="stretch" gap={3}>
                {collectionEntries.map(([collectionUid, hits]) => (
                  <Box key={collectionUid}>
                    <Typography variant="sigma" textColor="neutral600">
                      {collectionUid}
                    </Typography>
                    <Flex direction="column" alignItems="stretch" gap={1} marginTop={1}>
                      {hits.map((hit) => (
                        <Button
                          key={`${collectionUid}-${hit.documentId}`}
                          variant="tertiary"
                          onClick={() => handleSelectHit(hit)}
                          style={{ justifyContent: 'space-between', width: '100%' }}
                        >
                          <span>{hit.label}</span>
                          <span style={{ fontSize: '1.1rem', color: '#666687' }}>
                            ({hit.status})
                          </span>
                        </Button>
                      ))}
                    </Flex>
                  </Box>
                ))}
              </Flex>
            </Box>
          </Flex>
        </Dialog.Body>
        <Dialog.Footer>
          <Dialog.Cancel>
            <Button variant="tertiary" onClick={() => setShowDialog(false)}>
              {formatMessage({
                id: 'tiptap-editor.linker.close',
                defaultMessage: 'Close',
              })}
            </Button>
          </Dialog.Cancel>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  );

  return { linkerButton, linkerDialog };
}
