import React from 'react';
import {
  Field,
  Flex,
  NumberInput,
  SingleSelect,
  SingleSelectOption,
  Textarea,
  TextInput,
  Toggle,
} from '@strapi/design-system';
import type { RichTextAttributeFormField } from '../../../shared/src/components/types';
import type { AnyRichTextComponentDefinition } from '../registry/types';
import type { AttributeErrors, AttributeValues } from '../utils/componentAttrs';

interface ComponentAttributeFormProps {
  definition: AnyRichTextComponentDefinition;
  attrs: AttributeValues;
  errors: AttributeErrors;
  onChange: (next: AttributeValues) => void;
}

const asText = (value: unknown): string =>
  value === null || value === undefined ? '' : String(value);

/** The input matching one attribute's declared form field; `json` and `textarea` share the multiline control. */
function renderControl(
  name: string,
  field: RichTextAttributeFormField,
  value: unknown,
  set: (next: unknown) => void
): React.ReactNode {
  switch (field.type) {
    case 'text':
    case 'url':
      return (
        <TextInput
          name={name}
          type={field.type === 'url' ? 'url' : 'text'}
          placeholder={field.placeholder}
          value={asText(value)}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => set(event.target.value)}
        />
      );
    case 'textarea':
    case 'json':
      return (
        <Textarea
          name={name}
          placeholder={field.type === 'textarea' ? field.placeholder : undefined}
          value={asText(value)}
          onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => set(event.target.value)}
        />
      );
    case 'number':
      return (
        <NumberInput
          name={name}
          min={field.min}
          max={field.max}
          value={typeof value === 'number' ? value : undefined}
          onValueChange={(next: number | undefined) => set(next ?? null)}
        />
      );
    case 'boolean':
      return (
        <Toggle
          name={name}
          onLabel="On"
          offLabel="Off"
          checked={Boolean(value)}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => set(event.target.checked)}
        />
      );
    case 'select':
      return (
        <SingleSelect
          name={name}
          value={asText(value) || undefined}
          onChange={(next: string | number) => set(String(next))}
        >
          {field.options.map((option) => (
            <SingleSelectOption key={option.value} value={option.value}>
              {option.label}
            </SingleSelectOption>
          ))}
        </SingleSelect>
      );
  }
}

/** Dialog body generated from the definition's attribute schema; replaced wholesale when a definition brings its own form. */
export const ComponentAttributeForm: React.FC<ComponentAttributeFormProps> = ({
  definition,
  attrs,
  errors,
  onChange,
}) => (
  <Flex direction="column" alignItems="stretch" gap={4} width="100%">
    {Object.entries(definition.attributes)
      .filter(([, spec]) => Boolean(spec.form))
      .map(([key, spec]) => {
        const field = spec.form as RichTextAttributeFormField;
        return (
          <Field.Root
            key={key}
            name={key}
            error={errors[key]}
            required={'required' in field && Boolean(field.required)}
            width="100%"
          >
            <Field.Label>{field.label}</Field.Label>
            {renderControl(key, field, attrs[key], (next) => onChange({ ...attrs, [key]: next }))}
            <Field.Error />
          </Field.Root>
        );
      })}
  </Flex>
);

export default ComponentAttributeForm;
