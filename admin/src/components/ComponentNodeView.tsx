import { useState } from 'react';
import { useIntl } from 'react-intl';
import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { Flex, IconButton, Status, Typography } from '@strapi/design-system';
import { Pencil, Trash } from '@strapi/icons';
import ComponentDialog from './ComponentDialog';
import { getRichTextComponent } from '../registry/richTextComponents';
import { attributeSummary, isContainerComponent } from '../utils/componentAttrs';
import { formatLabel } from '../utils/formatLabel';

/** Card rendered for every generated component node: header with drag handle and actions, body with preview or attribute summary. */
export function GenericComponentNodeView(props: NodeViewProps) {
  const { formatMessage } = useIntl();
  const [editing, setEditing] = useState(false);
  const name = props.node.type.name;
  const definition = getRichTextComponent(name);
  const enabled = Boolean(props.extension.options.enabled);
  const options = (props.extension.options.component ?? {}) as Record<string, unknown>;
  const attrs = props.node.attrs as Record<string, unknown>;
  const isContainer = definition ? isContainerComponent(definition) : false;
  const Preview = definition?.preview;
  const content = isContainer ? (
    <NodeViewContent className="rich-text-component__content" />
  ) : undefined;

  return (
    <NodeViewWrapper
      className="rich-text-component"
      data-type={name}
      data-selected={props.selected || undefined}
    >
      <div className="rich-text-component__header" contentEditable={false} data-drag-handle>
        {definition?.icon}
        <Typography variant="pi" fontWeight="bold">
          {definition ? formatLabel(definition.label, formatMessage) : name}
        </Typography>
        {!enabled && (
          <Status variant="secondary" size="S">
            {formatMessage({
              id: 'tiptap-editor.components.nodeView.readOnly',
              defaultMessage: 'Read-only in this preset',
            })}
          </Status>
        )}
        <Flex gap={1} marginLeft="auto">
          {enabled && definition && (
            <IconButton
              onClick={() => setEditing(true)}
              label={formatMessage({
                id: 'tiptap-editor.components.nodeView.edit',
                defaultMessage: 'Edit component',
              })}
              variant="ghost"
            >
              <Pencil />
            </IconButton>
          )}
          <IconButton
            onClick={() => props.deleteNode()}
            label={formatMessage({
              id: 'tiptap-editor.components.nodeView.delete',
              defaultMessage: 'Delete component',
            })}
            variant="ghost"
          >
            <Trash />
          </IconButton>
        </Flex>
      </div>
      <div className="rich-text-component__body">
        {Preview ? (
          <Preview attrs={attrs} options={options} enabled={enabled} selected={props.selected}>
            {content}
          </Preview>
        ) : (
          <>
            {definition && !isContainer && (
              <Typography variant="pi" textColor="neutral600">
                {attributeSummary(definition, attrs)}
              </Typography>
            )}
            {content}
          </>
        )}
      </div>
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
