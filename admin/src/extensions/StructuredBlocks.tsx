import React from 'react';
import { Node, mergeAttributes, type Editor } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  useEditorState,
  type NodeViewProps,
} from '@tiptap/react';
import { Check } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { ToolbarButton } from '../components/ToolbarButton';
import { slugifyHeadingText } from './Heading';

// ─── 1. Accordion / Collapsible (<details> + <summary>) ─────────────────────

export const DetailsSummaryNode = Node.create({
  name: 'detailsSummary',
  content: 'inline*',
  defining: true,

  parseHTML() {
    return [{ tag: 'summary' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['summary', mergeAttributes(HTMLAttributes, { class: 'tiptap-details-summary' }), 0];
  },
});

export const DetailsContentNode = Node.create({
  name: 'detailsContent',
  content: 'block+',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-type="details-content"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'details-content',
        class: 'tiptap-details-content',
      }),
      0,
    ];
  },
});

export const DetailsNode = Node.create({
  name: 'details',
  group: 'block',
  content: 'detailsSummary detailsContent',
  defining: true,

  addAttributes() {
    return {
      open: {
        default: true,
        parseHTML: (el: HTMLElement) => el.hasAttribute('open'),
        renderHTML: (attrs: Record<string, unknown>) => (attrs.open ? { open: 'open' } : {}),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'details' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['details', mergeAttributes(HTMLAttributes, { class: 'tiptap-details' }), 0];
  },
});

// ─── 2. Edifice IO Conversation History Block ────────────────────────────────

export const ConversationHistoryNode = Node.create({
  name: 'conversationHistory',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      author: { default: null },
      timestamp: { default: null },
    };
  },

  parseHTML() {
    return [
      { tag: 'div[data-type="conversation-history"]' },
      { tag: 'blockquote[data-type="conversation-history"]' },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'conversation-history',
        class: 'tiptap-conversation-history',
      }),
      0,
    ];
  },
});

// ─── 3. Hashbite Multi-Column Grid Layout (2-Col / 3-Col) ───────────────────

export const LayoutColumnNode = Node.create({
  name: 'layoutColumn',
  content: 'block+',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-type="layout-column"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'layout-column',
        class: 'tiptap-layout-column',
      }),
      0,
    ];
  },
});

export const LayoutContainerNode = Node.create({
  name: 'layoutContainer',
  group: 'block',
  content: 'layoutColumn+',
  defining: true,

  addAttributes() {
    return {
      columns: {
        default: '1:1',
        parseHTML: (el: HTMLElement) => el.getAttribute('data-columns') ?? '1:1',
        renderHTML: (attrs: Record<string, unknown>) => ({
          'data-columns': String(attrs.columns || '1:1'),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="layout-container"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'layout-container',
        class: 'tiptap-layout-container',
      }),
      0,
    ];
  },
});

// ─── 4. Interactive Task List / Checklist ───────────────────────────────────

/**
 * Interactive checklist item node view with accessible checkbox control.
 */
export function TaskItemNodeView({ node, updateAttributes, editor }: NodeViewProps) {
  const { formatMessage } = useIntl();
  const checked = Boolean(node.attrs.checked);
  const isEditable = editor?.isEditable ?? true;
  return (
    <NodeViewWrapper
      as="li"
      data-type="taskItem"
      data-checked={checked ? 'true' : 'false'}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
        listStyle: 'none',
        margin: '4px 0',
      }}
    >
      <label contentEditable={false} style={{ display: 'flex', alignItems: 'center', marginTop: '3px' }}>
        <input
          type="checkbox"
          checked={checked}
          disabled={!isEditable}
          onChange={(e) => updateAttributes({ checked: e.target.checked })}
          aria-label={formatMessage({
            id: 'tiptap-editor.taskList.checkboxAria',
            defaultMessage: 'Task item checkbox',
          })}
        />
      </label>
      <NodeViewContent style={{ flexGrow: 1 }} />
    </NodeViewWrapper>
  );
}

export const TaskItemNode = Node.create({
  name: 'taskItem',
  content: 'paragraph block*',
  defining: true,

  addAttributes() {
    return {
      checked: {
        default: false,
        parseHTML: (el: HTMLElement) => el.getAttribute('data-checked') === 'true',
        renderHTML: (attrs: Record<string, unknown>) => ({
          'data-checked': attrs.checked ? 'true' : 'false',
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'li[data-type="taskItem"]', priority: 51 }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['li', mergeAttributes(HTMLAttributes, { 'data-type': 'taskItem' }), 0];
  },

  addKeyboardShortcuts() {
    return {
      Enter: () => this.editor.commands.splitListItem(this.name, { checked: false }),
      Tab: () => this.editor.commands.sinkListItem(this.name),
      'Shift-Tab': () => this.editor.commands.liftListItem(this.name),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(TaskItemNodeView);
  },
});

export const TaskListNode = Node.create({
  name: 'taskList',
  group: 'block list',
  content: 'taskItem+',

  parseHTML() {
    return [{ tag: 'ul[data-type="taskList"]', priority: 51 }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'ul',
      mergeAttributes(HTMLAttributes, { 'data-type': 'taskList', class: 'tiptap-task-list' }),
      0,
    ];
  },
});

// ─── 5. Page Break & Live Table of Contents ─────────────────────────────────

export const PageBreakNode = Node.create({
  name: 'pageBreak',
  group: 'block',
  atom: true,

  parseHTML() {
    return [{ tag: 'div[data-type="page-break"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'page-break',
        class: 'tiptap-page-break',
        role: 'separator',
        'aria-label': 'Page break',
      }),
      '--- Page Break ---',
    ];
  },
});

export interface TocHeadingEntry {
  level: number;
  text: string;
  id: string;
}

/**
 * Live Table of Contents node view that subscribes to editor document updates via `useEditorState`.
 */
export function TableOfContentsNodeView({ editor }: NodeViewProps) {
  const { formatMessage } = useIntl();
  const untitledLabel = formatMessage({
    id: 'tiptap-editor.toc.untitled',
    defaultMessage: 'Untitled heading',
  });

  const headings =
    useEditorState({
      editor,
      selector: ({ editor: ed }) => {
        const out: TocHeadingEntry[] = [];
        ed?.state?.doc?.descendants((n) => {
          if (n.type.name === 'heading') {
            const text = n.textContent || untitledLabel;
            out.push({
              level: Number(n.attrs.level) || 1,
              text,
              id: (n.attrs.id as string) || slugifyHeadingText(text),
            });
          }
        });
        return out;
      },
    }) ?? [];

  return (
    <NodeViewWrapper data-type="table-of-contents">
      <nav
        aria-label={formatMessage({
          id: 'tiptap-editor.toc.ariaLabel',
          defaultMessage: 'Table of Contents',
        })}
        contentEditable={false}
        style={{
          padding: '12px 16px',
          margin: '0.75em 0',
          backgroundColor: '#f6f6f9',
          border: '1px solid #dcdce4',
          borderRadius: '6px',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: '1.3rem', marginBottom: '6px', color: '#32324d' }}>
          📑{' '}
          {formatMessage({
            id: 'tiptap-editor.toc.title',
            defaultMessage: 'Table of Contents',
          })}
        </div>
        {headings.length === 0 ? (
          <div style={{ fontSize: '1.2rem', color: '#666687', fontStyle: 'italic' }}>
            {formatMessage({
              id: 'tiptap-editor.toc.emptyHint',
              defaultMessage: 'Add headings (H1–H6) to populate the Table of Contents automatically.',
            })}
          </div>
        ) : (
          <ul style={{ margin: 0, paddingLeft: '16px', listStyle: 'none' }}>
            {headings.map((h, i) => (
              <li
                key={`${h.id}-${i}`}
                style={{
                  marginLeft: `${(h.level - 1) * 14}px`,
                  fontSize: '1.25rem',
                  padding: '2px 0',
                }}
              >
                <a href={`#${h.id}`} style={{ color: '#4945ff', textDecoration: 'none' }}>
                  {h.text}
                </a>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </NodeViewWrapper>
  );
}

const tocSyncPluginKey = new PluginKey('tableOfContentsSync');

export const TableOfContentsNode = Node.create({
  name: 'tableOfContents',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      headings: {
        default: [],
        parseHTML: (el: HTMLElement) => {
          const items: TocHeadingEntry[] = [];
          el.querySelectorAll('li').forEach((li) => {
            const link = li.querySelector('a');
            const text = (link?.textContent || li.textContent || '').trim();
            const href = link?.getAttribute('href') || '';
            const id = href.startsWith('#') ? href.slice(1) : slugifyHeadingText(text);
            const level = Number(li.getAttribute('data-level')) || 1;
            if (text) {
              items.push({ level, text, id });
            }
          });
          return items;
        },
        renderHTML: () => ({}),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'nav[data-type="table-of-contents"]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const rawHeadings = Array.isArray(node?.attrs?.headings)
      ? (node.attrs.headings as TocHeadingEntry[])
      : [];
    const listChildren = rawHeadings
      .filter((h) => h && typeof h.text === 'string' && h.text.trim().length > 0)
      .map((h) => {
        const id = h.id || slugifyHeadingText(h.text);
        return [
          'li',
          { 'data-level': String(Number(h.level) || 1) },
          ['a', { href: `#${id}` }, h.text],
        ];
      });

    return [
      'nav',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'table-of-contents',
        'aria-label': 'Table of Contents',
      }),
      listChildren.length > 0
        ? ['ul', { class: 'tiptap-toc-list' }, ...listChildren]
        : 'Table of Contents',
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TableOfContentsNodeView);
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: tocSyncPluginKey,
        appendTransaction(transactions, _oldState, newState) {
          if (!transactions.some((tr) => tr.docChanged)) return null;

          const currentHeadings: TocHeadingEntry[] = [];
          const tocPositions: Array<{ pos: number; attrs: Record<string, unknown> }> = [];

          newState.doc.descendants((node, pos) => {
            if (node.type.name === 'heading') {
              const text = node.textContent;
              if (!text.trim()) return;
              const id = (node.attrs.id as string) || slugifyHeadingText(text);
              currentHeadings.push({
                level: Number(node.attrs.level) || 1,
                text,
                id,
              });
            } else if (node.type.name === 'tableOfContents') {
              tocPositions.push({ pos, attrs: node.attrs });
            }
          });

          if (tocPositions.length === 0) return null;

          const nextSignature = JSON.stringify(currentHeadings);
          const tr = newState.tr;
          let modified = false;

          for (const toc of tocPositions) {
            const prevSignature = JSON.stringify(toc.attrs.headings ?? []);
            if (prevSignature !== nextSignature) {
              tr.setNodeMarkup(toc.pos, undefined, {
                ...toc.attrs,
                headings: currentHeadings,
              });
              modified = true;
            }
          }

          return modified ? tr : null;
        },
      }),
    ];
  },
});

/**
 * React hook providing toolbar buttons for inserting structured content blocks
 * (accordion, multi-column grid, checklist, conversation history, page break, and TOC).
 */
export function useStructuredBlocks(
  editor: Editor | null,
  props: { disabled?: boolean } = { disabled: false }
) {
  const { formatMessage } = useIntl();
  const editorState = useEditorState({
    editor,
    selector: (ctx) => ({
      isTaskList: ctx.editor?.isActive('taskList') ?? false,
      isAccordion: ctx.editor?.isActive('details') ?? false,
      isColumns: ctx.editor?.isActive('layoutContainer') ?? false,
      isConversation: ctx.editor?.isActive('conversationHistory') ?? false,
      isInCodeBlock: ctx.editor?.isActive('codeBlock') ?? false,
    }),
  });

  const isDisabled = props.disabled || !editor || (editorState?.isInCodeBlock ?? false);

  const insertAccordion = () => {
    editor
      ?.chain()
      .focus()
      .insertContent({
        type: 'details',
        attrs: { open: true },
        content: [
          {
            type: 'detailsSummary',
            content: [
              {
                type: 'text',
                text: formatMessage({
                  id: 'tiptap-editor.structured.accordionSummaryDefault',
                  defaultMessage: 'Accordion Summary',
                }),
              },
            ],
          },
          {
            type: 'detailsContent',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: formatMessage({
                      id: 'tiptap-editor.structured.accordionContentDefault',
                      defaultMessage: 'Collapsible content goes here...',
                    }),
                  },
                ],
              },
            ],
          },
        ],
      })
      .run();
  };

  const insertColumns = (cols: '1:1' | '1:1:1' = '1:1') => {
    const count = cols === '1:1:1' ? 3 : 2;
    editor
      ?.chain()
      .focus()
      .insertContent({
        type: 'layoutContainer',
        attrs: { columns: cols },
        content: Array.from({ length: count }, (_, idx) => ({
          type: 'layoutColumn',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: formatMessage(
                    {
                      id: 'tiptap-editor.structured.columnDefault',
                      defaultMessage: 'Column {index}',
                    },
                    { index: idx + 1 }
                  ),
                },
              ],
            },
          ],
        })),
      })
      .run();
  };

  const insertTaskList = () => {
    editor
      ?.chain()
      .focus()
      .insertContent({
        type: 'taskList',
        content: [
          {
            type: 'taskItem',
            attrs: { checked: false },
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: formatMessage({
                      id: 'tiptap-editor.structured.taskItemDefault',
                      defaultMessage: 'To-do item',
                    }),
                  },
                ],
              },
            ],
          },
        ],
      })
      .run();
  };

  const insertConversationHistory = () => {
    editor
      ?.chain()
      .focus()
      .insertContent({
        type: 'conversationHistory',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: formatMessage({
                  id: 'tiptap-editor.structured.conversationDefault',
                  defaultMessage: 'Previous message in thread...',
                }),
              },
            ],
          },
        ],
      })
      .run();
  };

  const insertPageBreak = () => {
    editor?.chain().focus().insertContent({ type: 'pageBreak' }).createParagraphNear().run();
  };

  const insertTableOfContents = () => {
    editor?.chain().focus().insertContent({ type: 'tableOfContents' }).createParagraphNear().run();
  };

  return {
    accordionButton: (
      <ToolbarButton
        onClick={insertAccordion}
        icon={<span style={{ fontSize: '1.1rem', fontWeight: 700 }}>▸ Details</span>}
        active={editorState?.isAccordion ?? false}
        toggle
        disabled={isDisabled}
        tooltip={formatMessage({
          id: 'tiptap-editor.toolbar.accordion',
          defaultMessage: "Insert collapsible accordion ('<details>')",
        })}
      />
    ),
    columnsButton: (
      <ToolbarButton
        onClick={() => insertColumns('1:1')}
        icon={<span style={{ fontSize: '1.1rem', fontWeight: 700 }}>▥ 2-Col</span>}
        active={editorState?.isColumns ?? false}
        toggle
        disabled={isDisabled}
        tooltip={formatMessage({
          id: 'tiptap-editor.toolbar.columns',
          defaultMessage: 'Insert multi-column layout',
        })}
      />
    ),
    taskListButton: (
      <ToolbarButton
        onClick={insertTaskList}
        icon={<Check />}
        active={editorState?.isTaskList ?? false}
        toggle
        disabled={isDisabled}
        tooltip={formatMessage({
          id: 'tiptap-editor.toolbar.taskList',
          defaultMessage: 'Insert interactive checklist',
        })}
      />
    ),
    conversationHistoryButton: (
      <ToolbarButton
        onClick={insertConversationHistory}
        icon={<span style={{ fontSize: '1.1rem', fontWeight: 700 }}>💬 Thread</span>}
        active={editorState?.isConversation ?? false}
        toggle
        disabled={isDisabled}
        tooltip={formatMessage({
          id: 'tiptap-editor.toolbar.conversationHistory',
          defaultMessage: 'Insert conversation history block',
        })}
      />
    ),
    pageBreakButton: (
      <ToolbarButton
        onClick={insertPageBreak}
        icon={<span style={{ fontSize: '1.1rem', fontWeight: 700 }}>⎯ Page</span>}
        active={false}
        disabled={isDisabled}
        tooltip={formatMessage({
          id: 'tiptap-editor.toolbar.pageBreak',
          defaultMessage: 'Insert page break',
        })}
      />
    ),
    tableOfContentsButton: (
      <ToolbarButton
        onClick={insertTableOfContents}
        icon={<span style={{ fontSize: '1.1rem', fontWeight: 700 }}>📑 TOC</span>}
        active={false}
        disabled={isDisabled}
        tooltip={formatMessage({
          id: 'tiptap-editor.toolbar.tableOfContents',
          defaultMessage: 'Insert Table of Contents',
        })}
      />
    ),
  };
}
