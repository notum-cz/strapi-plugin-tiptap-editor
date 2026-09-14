import { useMemo, useState, type ReactNode } from 'react';
import { useIntl } from 'react-intl';
import {
  Extension,
  Mark,
  Node,
  mergeAttributes,
  type AnyExtension,
  type Editor,
} from '@tiptap/core';
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import { MenuItem, SimpleMenu } from '@strapi/design-system';
import { PuzzlePiece } from '@strapi/icons';
import type { TiptapPresetConfig } from '../../../shared/src/types';
import ComponentDialog from '../components/ComponentDialog';
import { GenericComponentNodeView } from '../components/ComponentNodeView';
import { resolveRichTextComponents } from '../registry/richTextComponents';
import type {
  AnyRichTextComponentDefinition,
  ResolvedRichTextComponent,
  RichTextComponentContext,
  RichTextComponentHelpers,
} from '../registry/types';
import { dataAttributeName, decodeAttribute, encodeAttribute } from '../utils/attributeCodec';
import { initialAttrs, isContainerComponent, type AttributeValues } from '../utils/componentAttrs';
import { formatLabel } from '../utils/formatLabel';

/** The bundled Tiptap primitives handed to escape-hatch extensions. */
export const richTextHelpers: RichTextComponentHelpers = {
  Node,
  Mark,
  Extension,
  mergeAttributes,
  ReactNodeViewRenderer,
  NodeViewWrapper,
  NodeViewContent,
};

/** Builds the Tiptap node for a definition; closures (not `this`) so tests can call the config functions directly. */
export function createComponentExtension(
  definition: AnyRichTextComponentDefinition,
  ctx: RichTextComponentContext
): AnyExtension {
  if (definition.extension) {
    return definition.extension(richTextHelpers, ctx);
  }
  const { name, content, attributes } = definition;
  const isContainer = isContainerComponent(definition);

  return Node.create({
    name,
    group: 'block',
    content,
    atom: !isContainer,
    draggable: true,
    selectable: true,
    addOptions: () => ({ enabled: ctx.enabled, component: ctx.options }),
    addAttributes: () =>
      Object.fromEntries(
        Object.entries(attributes).map(([key, spec]) => [
          key,
          {
            default: spec.default,
            parseHTML: (element: HTMLElement) =>
              decodeAttribute(element.getAttribute(dataAttributeName(key)), spec.default),
            renderHTML: (attrs: Record<string, unknown>) => {
              const value = attrs[key];
              // A cleared value is written out as `data-x="null"`: dropping the attribute would make
              // the clipboard restore the schema default instead. String defaults are the exception,
              // since there an absent attribute already decodes back to the default.
              if (value === undefined || (value === null && typeof spec.default === 'string')) {
                return {};
              }
              return { [dataAttributeName(key)]: encodeAttribute(value) };
            },
          },
        ])
      ),
    parseHTML: () => [{ tag: `div[data-type="${name}"]` }],
    renderHTML: ({ HTMLAttributes }) =>
      isContainer
        ? ['div', mergeAttributes({ 'data-type': name }, HTMLAttributes), 0]
        : ['div', mergeAttributes({ 'data-type': name }, HTMLAttributes)],
    addNodeView: () => ReactNodeViewRenderer(GenericComponentNodeView),
  });
}

/** Inserts a node at the cursor; containers start with one empty paragraph so the cursor has somewhere to go. */
export function insertRichTextComponent(
  editor: Editor,
  definition: AnyRichTextComponentDefinition,
  attrs: AttributeValues
): boolean {
  const node = isContainerComponent(definition)
    ? { type: definition.name, attrs, content: [{ type: 'paragraph' }] }
    : { type: definition.name, attrs };
  return editor.chain().focus().insertContent(node).run();
}

/** Toolbar menu listing every component the preset enables, plus the insert dialog for the picked one. */
export function useRichTextComponents(
  editor: Editor | null,
  props: { config: TiptapPresetConfig; disabled?: boolean }
): { componentsMenu: ReactNode; componentDialog: ReactNode } {
  const { formatMessage } = useIntl();
  const [active, setActive] = useState<ResolvedRichTextComponent | null>(null);
  const enabled = useMemo(
    () => resolveRichTextComponents(props.config).filter((resolved) => resolved.enabled),
    [props.config]
  );

  if (enabled.length === 0) {
    return { componentsMenu: null, componentDialog: null };
  }

  return {
    componentsMenu: (
      <SimpleMenu
        label={formatMessage({
          id: 'tiptap-editor.components.insert',
          defaultMessage: 'Insert component',
        })}
        size="S"
        variant="tertiary"
        disabled={props.disabled || !editor}
        startIcon={<PuzzlePiece />}
      >
        {enabled.map((resolved) => (
          <MenuItem key={resolved.definition.name} onSelect={() => setActive(resolved)}>
            {resolved.definition.icon}
            {formatLabel(resolved.definition.label, formatMessage)}
          </MenuItem>
        ))}
      </SimpleMenu>
    ),
    componentDialog: active && (
      <ComponentDialog
        open
        mode="insert"
        definition={active.definition}
        options={active.options}
        initialAttrs={initialAttrs(active.definition)}
        onClose={() => setActive(null)}
        onSubmit={(attrs) => {
          if (editor) insertRichTextComponent(editor, active.definition, attrs);
          setActive(null);
        }}
      />
    ),
  };
}
