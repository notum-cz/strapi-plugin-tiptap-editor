import { Editor } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { useEditorState } from '@tiptap/react';
import Heading from '@tiptap/extension-heading';
import { SingleSelect, SingleSelectOption } from '@strapi/design-system';
import { useIntl } from 'react-intl';

/**
 * Generates a URL-safe slug identifier from heading text for anchor links and Table of Contents.
 */
export function slugifyHeadingText(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const headingIdPluginKey = new PluginKey('headingAutoId');

// Base extension class (un-configured) — used by buildExtensions for dynamic levels
export const BaseHeadingWithSEOTag = Heading.extend({
  addOptions() {
    return {
      ...(typeof (this as any).parent === 'function' ? (this as any).parent() : {}),
      autoSlugId: true,
    };
  },

  addAttributes() {
    return {
      ...(typeof (this as any).parent === 'function' ? (this as any).parent() : {}), // must cast to any to avoid TS error
      tag: { default: null },
      id: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('id') ?? null,
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs.id ? { id: String(attrs.id) } : {},
      },
    };
  },

  addProseMirrorPlugins() {
    const parentPlugins =
      typeof (this as any).parent === 'function' ? ((this as any).parent() ?? []) : [];
    if (!(this.options as { autoSlugId?: boolean }).autoSlugId) {
      return parentPlugins;
    }
    return [
      ...parentPlugins,
      new Plugin({
        key: headingIdPluginKey,
        appendTransaction(transactions, _oldState, newState) {
          if (!transactions.some((tr) => tr.docChanged)) return null;
          const tr = newState.tr;
          let modified = false;
          const slugCounts = new Map<string, number>();
          const usedSlugs = new Set<string>();

          newState.doc.descendants((node, pos) => {
            if (node.type.name === 'heading') {
              const baseSlug = slugifyHeadingText(node.textContent);
              let nextId: string | null = null;
              if (baseSlug) {
                const count = (slugCounts.get(baseSlug) ?? 0) + 1;
                slugCounts.set(baseSlug, count);
                if (count === 1 && !usedSlugs.has(baseSlug)) {
                  nextId = baseSlug;
                } else {
                  let suffix = Math.max(2, count);
                  while (usedSlugs.has(`${baseSlug}-${suffix}`)) {
                    suffix += 1;
                  }
                  nextId = `${baseSlug}-${suffix}`;
                }
                usedSlugs.add(nextId);
              }
              if (node.attrs.id !== nextId) {
                tr.setNodeMarkup(pos, undefined, { ...node.attrs, id: nextId });
                modified = true;
              }
            }
          });

          return modified ? tr : null;
        },
      }),
    ];
  },
});

// Pre-configured instance with all heading levels
export const HeadingWithSEOTag = BaseHeadingWithSEOTag.configure({ levels: [1, 2, 3, 4, 5, 6] });

/**
 * React hook providing the heading style and SEO tag selector dropdowns for the toolbar.
 */
export function useHeading(
  editor: Editor | null,
  props: { disabled?: boolean; levels?: number[] } = { disabled: false }
) {
  const { formatMessage } = useIntl();
  const levels = props.levels ?? [1, 2, 3, 4, 5, 6];
  const editorState = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) {
        return { headingLevel: undefined, headingTag: undefined, isParagraph: false };
      }
      return {
        headingLevel: ctx.editor.getAttributes('heading').level as number | undefined,
        headingTag: ctx.editor.getAttributes('heading').tag as string | undefined,
        isParagraph: ctx.editor.isActive('paragraph') ?? false,
      };
    },
  });

  const onChangeHeading = (value: string) => {
    if (!editor) return;

    if (value === 'p') {
      editor.chain().focus().setParagraph().run();
      return;
    }

    const parsed = Number(value.slice(1));
    if (isNaN(parsed) || parsed < 1 || parsed > 6) return;
    const level = parsed as 1 | 2 | 3 | 4 | 5 | 6;
    editor.chain().focus().setHeading({ level }).run();

    // automatically set the 'tag' attribute to match the heading level if not already set
    if (!editorState?.headingTag) {
      editor
        .chain()
        .focus()
        .updateAttributes('heading', { tag: `h${level}` })
        .run();
    }
  };

  const onChangeHeadingTag = (value: string) => {
    if (!editor) return;
    if (!editorState?.headingLevel) return;
    editor.chain().focus().updateAttributes('heading', { tag: value }).run();
  };

  return {
    headingSelect: (
      <SingleSelect
        placeholder={formatMessage({ id: 'tiptap-editor.heading.style', defaultMessage: 'Style' })}
        aria-label={formatMessage({
          id: 'tiptap-editor.heading.textStyle',
          defaultMessage: 'Text style',
        })}
        value={editorState?.headingLevel ? `h${editorState.headingLevel}` : 'p'}
        onChange={(v: string | number) => v != null && onChangeHeading(String(v))}
        disabled={!editor || props.disabled}
        size="S"
      >
        <SingleSelectOption value="p">
          {formatMessage({ id: 'tiptap-editor.heading.paragraph', defaultMessage: 'Paragraph' })}
        </SingleSelectOption>
        {levels.map((level) => (
          <SingleSelectOption key={`h${level}`} value={`h${level}`}>
            {formatMessage(
              { id: 'tiptap-editor.heading.heading', defaultMessage: 'Heading {level}' },
              { level }
            )}
          </SingleSelectOption>
        ))}
      </SingleSelect>
    ),
    headingTagSelect: (
      <SingleSelect
        placeholder={formatMessage({
          id: 'tiptap-editor.heading.seoTag',
          defaultMessage: 'SEO Tag',
        })}
        aria-label={formatMessage({
          id: 'tiptap-editor.heading.seoTagAriaLabel',
          defaultMessage: "Heading's HTML tag for SEO purposes",
        })}
        value={editorState?.headingTag}
        onChange={(v: string | number) => v != null && onChangeHeadingTag(String(v))}
        disabled={!editor || props.disabled || !editorState?.headingLevel}
        size="S"
      >
        <SingleSelectOption value="h1">h1</SingleSelectOption>
        <SingleSelectOption value="h2">h2</SingleSelectOption>
        <SingleSelectOption value="h3">h3</SingleSelectOption>
        <SingleSelectOption value="h4">h4</SingleSelectOption>
        <SingleSelectOption value="h5">h5</SingleSelectOption>
        <SingleSelectOption value="h6">h6</SingleSelectOption>
      </SingleSelect>
    ),
  };
}
