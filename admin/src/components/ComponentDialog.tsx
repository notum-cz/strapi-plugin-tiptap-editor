import React from 'react';
import { Button, Dialog } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import ComponentAttributeForm from './ComponentAttributeForm';
import type { AnyRichTextComponentDefinition } from '../registry/types';
import {
  toFormValues,
  validateAttrs,
  type AttributeErrors,
  type AttributeValues,
} from '../utils/componentAttrs';
import { formatLabel } from '../utils/formatLabel';

interface ComponentDialogProps {
  open: boolean;
  mode: 'insert' | 'edit';
  definition: AnyRichTextComponentDefinition;
  options: Record<string, unknown>;
  initialAttrs: AttributeValues;
  onClose: () => void;
  onSubmit: (attrs: AttributeValues) => void;
}

/** Insert/edit dialog for one rich-text component: the definition's own form when it has one, the generated one otherwise. */
export const ComponentDialog: React.FC<ComponentDialogProps> = ({
  open,
  mode,
  definition,
  options,
  initialAttrs,
  onClose,
  onSubmit,
}) => {
  const { formatMessage } = useIntl();
  const [attrs, setAttrs] = React.useState<AttributeValues>(() =>
    toFormValues(definition, initialAttrs)
  );
  const [errors, setErrors] = React.useState<AttributeErrors>({});

  // Only `open` is a dependency: `initialAttrs` is a fresh object on every render of the node view,
  // so reacting to it would wipe the editor's in-progress input on each keystroke.
  React.useEffect(() => {
    if (open) {
      setAttrs(toFormValues(definition, initialAttrs));
      setErrors({});
    }
  }, [open]);

  const label = formatLabel(definition.label, formatMessage);
  const title =
    mode === 'insert'
      ? formatMessage(
          { id: 'tiptap-editor.components.dialog.insertTitle', defaultMessage: 'Insert {label}' },
          { label }
        )
      : formatMessage(
          { id: 'tiptap-editor.components.dialog.editTitle', defaultMessage: 'Edit {label}' },
          { label }
        );

  // Never hand `setAttrs` itself to a definition's own form: an attribute map that happens to be a
  // function would be taken for a state updater.
  const handleChange = (next: AttributeValues) => setAttrs(next);

  const handleSubmit = () => {
    const result = validateAttrs(definition, attrs, {
      required: formatMessage({
        id: 'tiptap-editor.components.dialog.required',
        defaultMessage: 'This field is required',
      }),
      invalidJson: formatMessage({
        id: 'tiptap-editor.components.dialog.invalidJson',
        defaultMessage: 'Enter valid JSON',
      }),
      invalidNumber: formatMessage({
        id: 'tiptap-editor.components.dialog.invalidNumber',
        defaultMessage: 'Enter a number',
      }),
      outOfRange: formatMessage({
        id: 'tiptap-editor.components.dialog.outOfRange',
        defaultMessage: 'Enter a number within the allowed range',
      }),
    });
    if (Object.keys(result.errors).length > 0) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    onSubmit(result.values);
  };

  const Form = definition.form;
  // A custom width only makes sense for a definition's own form; the generated one fits the default.
  const dialogWidth = Form ? definition.dialog?.width : undefined;
  const contentStyle = dialogWidth ? { width: dialogWidth, maxWidth: dialogWidth } : undefined;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v: boolean) => {
        if (!v) onClose();
      }}
    >
      {open && (
        <Dialog.Content style={contentStyle}>
          <Dialog.Header>{title}</Dialog.Header>
          {/* Dialog.Content clips overflow, so the body scrolls: tall forms vertically, wide ones horizontally. */}
          <Dialog.Body overflow="auto" maxHeight="calc(100vh - 16rem)">
            {Form ? (
              <Form
                attrs={attrs}
                onChange={handleChange}
                errors={errors}
                mode={mode}
                options={options}
              />
            ) : (
              <ComponentAttributeForm
                definition={definition}
                attrs={attrs}
                errors={errors}
                onChange={handleChange}
              />
            )}
          </Dialog.Body>
          <Dialog.Footer>
            <Dialog.Cancel>
              <Button variant="tertiary" fullWidth onClick={onClose}>
                {formatMessage({
                  id: 'tiptap-editor.components.dialog.cancel',
                  defaultMessage: 'Cancel',
                })}
              </Button>
            </Dialog.Cancel>
            {/* Deliberately not wrapped in Dialog.Action: that is a Radix Close, which would dismiss
                the dialog before the editor could see the validation errors. */}
            <Button fullWidth variant="success-light" onClick={handleSubmit}>
              {mode === 'insert'
                ? formatMessage({
                    id: 'tiptap-editor.components.dialog.insert',
                    defaultMessage: 'Insert',
                  })
                : formatMessage({
                    id: 'tiptap-editor.components.dialog.save',
                    defaultMessage: 'Save',
                  })}
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      )}
    </Dialog.Root>
  );
};

export default ComponentDialog;
