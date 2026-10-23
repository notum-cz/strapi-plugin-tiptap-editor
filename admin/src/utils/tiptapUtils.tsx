import { useState } from 'react';
import { Extensions, JSONContent } from '@tiptap/core';
import { useEditor } from '@tiptap/react';
import { type InputProps, useField } from '@strapi/strapi/admin';
import type { TiptapOutputFormat } from '../../../shared/types';
import {
  markdownToJson,
  sanitizeHtmlString,
  serializeEditorContent,
} from '../../../shared/contentSerializer';

export type { FieldValue } from '@strapi/strapi/admin';

export type TiptapInputProps = InputProps & {
  labelAction?: React.ReactNode;
};

export interface UseTiptapEditorOptions {
  outputFormat?: TiptapOutputFormat;
  onDocUpdate?: (json: JSONContent) => void;
}

/**
 * Wraps a plain text string into a basic ProseMirror document JSON structure.
 */
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

/**
 * Parses a stored field value (JSON object, JSON string, HTML string, or Markdown string)
 * into a TipTap-compatible `JSONContent` or sanitized HTML string.
 */
export function parseJSONContent(
  value: string | JSONContent | null | undefined,
  defaultValue: string,
  outputFormat: TiptapOutputFormat = 'json'
): JSONContent | string {
  if (!value) {
    return tiptapContent(defaultValue);
  }

  if (typeof value === 'object') {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return tiptapContent(defaultValue);
  }

  // Try JSON first if it looks like JSON and either outputFormat is json or it is a ProseMirror doc
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed) as JSONContent;
      if (outputFormat === 'json' || parsed?.type === 'doc') {
        return parsed;
      }
    } catch {
      // fall through
    }
  }

  if (outputFormat === 'markdown') {
    const parsedDoc = markdownToJson(trimmed) as JSONContent;
    return parsedDoc?.type === 'doc' ? parsedDoc : tiptapContent(defaultValue);
  }

  if (outputFormat === 'html' || (trimmed.startsWith('<') && trimmed.endsWith('>'))) {
    return sanitizeHtmlString(trimmed);
  }

  try {
    return JSON.parse(value) as JSONContent;
  } catch (e) {
    console.error('Failed to parse JSON content:', e);
    return tiptapContent(`
          This component's content is malformed. Please change it or remove this component.
          Original content: ${JSON.stringify(value)}
        `);
  }
}

/**
 * React hook that initializes a TipTap editor bound to a Strapi Content-Manager field.
 */
export function useTiptapEditor(
  name: string,
  defaultValue: string = '',
  extensions: Extensions = [],
  options?: UseTiptapEditorOptions
) {
  const field = useField(name);
  const outputFormat = options?.outputFormat ?? 'json';
  const [initialContent] = useState(() =>
    parseJSONContent(field.value, defaultValue, outputFormat)
  );

  const editor = useEditor({
    extensions: extensions,
    content: initialContent,
    onUpdate: ({ editor: ed }) => {
      const json = ed.getJSON();
      const serialized = serializeEditorContent(ed, outputFormat);
      field.onChange(name, serialized);
      options?.onDocUpdate?.(json);
    },
  });

  return { editor, field };
}
