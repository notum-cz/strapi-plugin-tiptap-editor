import type { ComponentType, ReactNode } from 'react';
import type { AnyExtension, Extension, Mark, Node, mergeAttributes } from '@tiptap/core';
import type { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import type { RichTextComponentSchema } from '../../../shared/src/components/types';

export type IntlLabel = string | { id: string; defaultMessage: string };

export interface RichTextComponentContext {
  /** Whether the current preset lets editors insert and edit this component. */
  enabled: boolean;
  /** The preset's options object for this component (`{}` when enabled with `true`). */
  options: Record<string, unknown>;
}

export interface RichTextComponentPreviewProps<
  A extends Record<string, unknown> = Record<string, unknown>,
> {
  attrs: A;
  options: Record<string, unknown>;
  enabled: boolean;
  selected: boolean;
  /** Editable content slot; only passed for container components. */
  children?: ReactNode;
}

export interface RichTextComponentFormProps<
  A extends Record<string, unknown> = Record<string, unknown>,
> {
  attrs: A;
  onChange: (next: A) => void;
  errors: Partial<Record<keyof A, string>>;
  mode: 'insert' | 'edit';
  options: Record<string, unknown>;
}

/** The bundled Tiptap primitives, handed to escape-hatch extensions so hosts never import @tiptap themselves. */
export interface RichTextComponentHelpers {
  Node: typeof Node;
  Mark: typeof Mark;
  Extension: typeof Extension;
  mergeAttributes: typeof mergeAttributes;
  ReactNodeViewRenderer: typeof ReactNodeViewRenderer;
  NodeViewWrapper: typeof NodeViewWrapper;
  NodeViewContent: typeof NodeViewContent;
}

export interface RichTextComponentDefinition<
  A extends Record<string, unknown> = Record<string, unknown>,
> extends Omit<RichTextComponentSchema, 'label'> {
  label: IntlLabel;
  icon?: ReactNode;
  defaultAttrs?: Partial<A>;
  /** Extra validation after the generated field checks; return a map of attribute → message, or null. */
  validate?: (attrs: A) => Partial<Record<keyof A, string>> | null;
  /** Rendered inside the generic node-view card instead of the attribute summary. */
  preview?: ComponentType<RichTextComponentPreviewProps<A>>;
  /** Replaces the generated dialog body. */
  form?: ComponentType<RichTextComponentFormProps<A>>;
  dialog?: {
    /**
     * CSS width for the insert/edit dialog, for forms wider than the default Strapi Dialog
     * (e.g. `"min(80rem, 95vw)"`). Only honoured when the definition has its own `form`.
     */
    width?: string;
  };
  /** Full escape hatch: build the Tiptap extension yourself; name/label/icon still drive the menu. */
  extension?: (helpers: RichTextComponentHelpers, ctx: RichTextComponentContext) => AnyExtension;
}

// The registry erases the attribute generic; React component props are contravariant, so `any` is the
// only type that lets a definition typed for its own attrs be stored next to others.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyRichTextComponentDefinition = RichTextComponentDefinition<any>;

export interface ResolvedRichTextComponent {
  definition: AnyRichTextComponentDefinition;
  enabled: boolean;
  options: Record<string, unknown>;
}
