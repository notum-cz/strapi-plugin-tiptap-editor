export type RichTextAttributeValue =
  | string
  | number
  | boolean
  | null
  | Record<string, unknown>
  | unknown[];

export type RichTextAttributeFormField =
  | { type: 'text' | 'url' | 'textarea'; label: string; placeholder?: string; required?: boolean }
  | { type: 'number'; label: string; min?: number; max?: number; required?: boolean }
  | { type: 'boolean'; label: string }
  | {
      type: 'select';
      label: string;
      options: Array<{ value: string; label: string }>;
      required?: boolean;
    }
  | { type: 'json'; label: string; required?: boolean };

export interface RichTextAttributeSpec {
  /** Value stored on insert; null means unset. */
  default: RichTextAttributeValue;
  /** How the editor dialog edits the attribute; omit to keep it out of the dialog. */
  form?: RichTextAttributeFormField;
}

export interface RichTextComponentSchema {
  /** ProseMirror node type name; also the key under `components` in a preset. */
  name: string;
  /** Human label shown in the editor menu. */
  label: string;
  /** ProseMirror content expression, e.g. 'block+'. Present means container, absent means atom. */
  content?: string;
  attributes: Record<string, RichTextAttributeSpec>;
}

/** Framework-neutral node description both the editor and a renderer turn into a Tiptap Node. */
export interface RichTextNodeSpec {
  name: string;
  group: 'block';
  atom: boolean;
  content?: string;
  attributes: Record<string, { default: RichTextAttributeValue }>;
}
