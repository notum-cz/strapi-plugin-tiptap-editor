import type {
  RichTextAttributeFormField,
  RichTextAttributeSpec,
} from '../../../shared/src/components/types';
import type { AnyRichTextComponentDefinition } from '../registry/types';

export type AttributeValues = Record<string, unknown>;
export type AttributeErrors = Record<string, string>;
export interface ValidationMessages {
  required: string;
  invalidJson: string;
  invalidNumber: string;
}

export const isContainerComponent = (definition: AnyRichTextComponentDefinition): boolean =>
  Boolean(definition.content);

/** Attribute values a freshly inserted node starts with: schema defaults overridden by definition.defaultAttrs. */
export function initialAttrs(definition: AnyRichTextComponentDefinition): AttributeValues {
  const defaults = Object.fromEntries(
    Object.entries(definition.attributes).map(([key, spec]) => [key, spec.default])
  );
  return { ...defaults, ...(definition.defaultAttrs ?? {}) };
}

/** Dialog state for stored attrs: json fields become editable strings, everything else is unchanged. */
export function toFormValues(
  definition: AnyRichTextComponentDefinition,
  attrs: AttributeValues
): AttributeValues {
  const values: AttributeValues = { ...attrs };
  for (const [key, spec] of Object.entries(definition.attributes)) {
    if (spec.form?.type === 'json' && values[key] !== null && typeof values[key] !== 'string') {
      values[key] = JSON.stringify(values[key], null, 2);
    }
  }
  return values;
}

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

/** "Label: value" pairs for form-visible attributes, joined with " · "; empty values are skipped. */
export function attributeSummary(
  definition: AnyRichTextComponentDefinition,
  attrs: AttributeValues
): string {
  return Object.entries(definition.attributes)
    .filter(
      (entry): entry is [string, RichTextAttributeSpec & { form: RichTextAttributeFormField }] =>
        Boolean(entry[1].form)
    )
    .map(([key, spec]) => [spec.form.label, formatValue(attrs[key])])
    .filter(([, value]) => value !== '')
    .map(([label, value]) => `${label}: ${value}`)
    .join(' · ');
}

const isBlank = (value: unknown): boolean =>
  value === null || value === undefined || (typeof value === 'string' && value.trim() === '');

/** Coerces dialog input per field type; `values` is only meaningful when `errors` is empty. */
export function validateAttrs(
  definition: AnyRichTextComponentDefinition,
  attrs: AttributeValues,
  messages: ValidationMessages
): { values: AttributeValues; errors: AttributeErrors } {
  const values: AttributeValues = { ...attrs };
  const errors: AttributeErrors = {};

  for (const [key, spec] of Object.entries(definition.attributes)) {
    const field = spec.form;
    if (!field) continue;
    const raw = attrs[key];

    switch (field.type) {
      case 'text':
      case 'url':
      case 'textarea':
      case 'select':
        if (field.required && isBlank(raw)) errors[key] = messages.required;
        break;
      case 'number': {
        if (isBlank(raw)) {
          if (field.required) errors[key] = messages.required;
          else values[key] = null;
          break;
        }
        const parsed = typeof raw === 'number' ? raw : Number(raw);
        if (Number.isNaN(parsed)) errors[key] = messages.invalidNumber;
        else values[key] = parsed;
        break;
      }
      case 'boolean':
        values[key] = Boolean(raw);
        break;
      case 'json': {
        // The required check comes before the string guard: an unset json attribute is stored as
        // null, which toFormValues leaves alone, so it would otherwise skip validation entirely.
        if (field.required && isBlank(raw)) {
          errors[key] = messages.required;
          break;
        }
        if (typeof raw !== 'string') break;
        if (isBlank(raw)) {
          values[key] = null;
          break;
        }
        try {
          values[key] = JSON.parse(raw);
        } catch {
          errors[key] = messages.invalidJson;
        }
        break;
      }
    }
  }

  if (Object.keys(errors).length === 0 && definition.validate) {
    Object.assign(errors, definition.validate(values) ?? {});
  }
  return { values, errors };
}
