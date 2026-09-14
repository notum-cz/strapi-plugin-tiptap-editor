import { useEffect, useMemo, useState } from 'react';
import { Extensions, JSONContent, getSchema } from '@tiptap/core';
import { useEditor } from '@tiptap/react';
import { type InputProps, useField } from '@strapi/strapi/admin';
import { stripUnknownContent, type SanitizeSchema } from '../../../shared/src/sanitize';

export type { FieldValue } from '@strapi/strapi/admin';

export type TiptapInputProps = InputProps & {
  labelAction?: React.ReactNode;
};

export type RemovedContent = {
  nodeTypes: string[];
  markTypes: string[];
};

export function tiptapContent(text: string): JSONContent {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: text,
          },
        ],
      },
    ],
  };
}

function parseJSONContent(value: string | JSONContent | null | undefined, defaultValue: string) {
  if (!value) {
    return tiptapContent(defaultValue);
  }

  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch (e) {
    console.error('Failed to parse JSON content:', e);
    return tiptapContent(`
          This component's content is malformed. Please change it or remove this component.
          Original content: ${JSON.stringify(value)}
        `);
  }
}

/**
 * Parses a stored field value and strips node/mark types the schema doesn't know. Without this,
 * Tiptap swallows the parse error and mounts an empty document, which the next save would persist.
 */
export function prepareEditorContent(
  value: string | JSONContent | null | undefined,
  schema: SanitizeSchema,
  defaultValue: string = ''
) {
  const { content, unknownNodeTypes, unknownMarkTypes } = stripUnknownContent(
    parseJSONContent(value, defaultValue),
    schema
  );
  return { content: content as JSONContent, unknownNodeTypes, unknownMarkTypes };
}

export function useTiptapEditor(
  name: string,
  defaultValue: string = '',
  extensions: Extensions = []
) {
  const field = useField(name);
  const schema = useMemo(() => getSchema(extensions), [extensions]);

  // Initial content only, like `useEditor` itself. Nothing is written back here: loading must not
  // dirty the form; the stripped nodes are only lost if the editor saves afterwards.
  const [prepared] = useState(() => prepareEditorContent(field.value, schema, defaultValue));
  const { unknownNodeTypes, unknownMarkTypes } = prepared;

  const removedContent = useMemo<RemovedContent | null>(
    () =>
      unknownNodeTypes.length || unknownMarkTypes.length
        ? { nodeTypes: unknownNodeTypes, markTypes: unknownMarkTypes }
        : null,
    [unknownNodeTypes, unknownMarkTypes]
  );

  useEffect(() => {
    if (!removedContent) return;
    console.warn(
      `[TiptapEditor] Removed unknown content from field "${name}": ` +
        `nodes=[${removedContent.nodeTypes.join(', ')}], marks=[${removedContent.markTypes.join(', ')}]`
    );
  }, [removedContent, name]);

  const editor = useEditor({
    extensions: extensions,
    content: prepared.content,
    // Safety net for shapes the sanitizer can't fix (invalid attrs, content expression mismatch).
    // `enableContentCheck` stays off so the editor still mounts.
    emitContentError: true,
    onContentError: ({ error }) => {
      console.error(`[TiptapEditor] Invalid content in field "${name}":`, error);
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      field.onChange(name, JSON.stringify(json));
    },
  });

  return { editor, field, removedContent };
}
