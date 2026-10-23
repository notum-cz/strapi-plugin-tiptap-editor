import { useState } from 'react';
import { useIntl } from 'react-intl';
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { Typography } from '@strapi/design-system';
import ComponentDialog from './ComponentDialog';
import { useThemeConfig } from '../hooks/useThemeConfig';
import { getRichTextComponent } from '../registry/richTextComponents';
import { attributeSummary } from '../utils/componentAttrs';
import { formatLabel } from '../utils/formatLabel';

/**
 * Chip rendered for an inline component node: the definition's preview, or its icon and label.
 * The chip is a button because the node sits inside running text where the block card's header
 * and drag handle have no room, and a button gives click, Enter and Space for free. Tiptap lets
 * clicks on buttons inside a node view reach React instead of ProseMirror.
 */
export function InlineComponentNodeView(props: NodeViewProps) {
  const { formatMessage } = useIntl();
  const [editing, setEditing] = useState(false);
  const name = props.node.type.name;
  const definition = getRichTextComponent(name);
  const enabled = Boolean(props.extension.options.enabled);
  const options = (props.extension.options.component ?? {}) as Record<string, unknown>;
  const attrs = props.node.attrs as Record<string, unknown>;
  const label = definition ? formatLabel(definition.label, formatMessage) : name;
  const summary = definition ? attributeSummary(definition, attrs) : '';
  const colors = useThemeConfig()?.colors ?? [];
  const Preview = definition?.preview;

  return (
    <NodeViewWrapper
      as="span"
      className="rich-text-component rich-text-component--inline"
      data-type={name}
      data-selected={props.selected || undefined}
      contentEditable={false}
    >
      <button
        type="button"
        className="rich-text-component__chip"
        aria-label={formatMessage(
          { id: 'tiptap-editor.components.nodeView.editInline', defaultMessage: 'Edit {label}' },
          { label }
        )}
        title={summary ? `${label} · ${summary}` : label}
        disabled={!enabled || !definition}
        onClick={() => setEditing(true)}
      >
        {Preview ? (
          <Preview
            attrs={attrs}
            options={options}
            enabled={enabled}
            selected={props.selected}
            colors={colors}
          />
        ) : (
          <>
            {definition?.icon}
            <Typography variant="pi">{label}</Typography>
          </>
        )}
      </button>
      {definition && (
        <ComponentDialog
          open={editing}
          mode="edit"
          definition={definition}
          options={options}
          initialAttrs={attrs}
          onClose={() => setEditing(false)}
          onSubmit={(next) => {
            props.updateAttributes(next);
            setEditing(false);
          }}
        />
      )}
    </NodeViewWrapper>
  );
}
