import { Editor } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';
import Heading from '@tiptap/extension-heading';
import { SingleSelect, SingleSelectOption } from '@strapi/design-system';

// Base extension class (un-configured) — used by buildExtensions for dynamic levels
export const BaseHeadingWithSEOTag = Heading.extend({
  addAttributes() {
    return {
      ...(this as any).parent?.(), // must cast to any to avoid TS error
      tag: { default: null },
    };
  },
});

// Pre-configured instance with all heading levels
export const HeadingWithSEOTag = BaseHeadingWithSEOTag.configure({ levels: [1, 2, 3, 4, 5, 6] });

export function useHeading(editor: Editor | null, props: { disabled?: boolean; levels?: number[] } = { disabled: false }) {
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

    const level = Number(value[1]) as 1 | 2 | 3 | 4 | 5 | 6; // value format: h1–h6
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
        placeholder="Style"
        aria-label="Text style"
        value={editorState?.headingLevel ? `h${editorState.headingLevel}` : 'p'}
        onChange={(v: string | undefined) => v && onChangeHeading(v)}
        disabled={!editor || props.disabled}
        size="S"
      >
        <SingleSelectOption value="p">Paragraph</SingleSelectOption>
        {levels.map((level) => (
          <SingleSelectOption key={`h${level}`} value={`h${level}`}>
            Heading {level}
          </SingleSelectOption>
        ))}
      </SingleSelect>
    ),
    headingTagSelect: (
      <SingleSelect
        placeholder="SEO Tag"
        aria-label="Heading's HTML tag for SEO purposes"
        value={editorState?.headingTag}
        onChange={(v: string | undefined) => v && onChangeHeadingTag(v)}
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
