import { describe, it, expect } from 'vitest';
import {
  attributeSummary,
  initialAttrs,
  isContainerComponent,
  toFormValues,
  validateAttrs,
} from '../../admin/src/utils/componentAttrs';
import type { AnyRichTextComponentDefinition } from '../../admin/src/registry/types';

const messages = { required: 'REQ', invalidJson: 'JSON', invalidNumber: 'NUM' };

const definition: AnyRichTextComponentDefinition = {
  name: 'widget',
  label: 'Widget',
  attributes: {
    title: { default: '', form: { type: 'text', label: 'Title', required: true } },
    size: { default: null, form: { type: 'number', label: 'Size' } },
    rows: { default: [], form: { type: 'json', label: 'Rows' } },
    open: { default: false, form: { type: 'boolean', label: 'Open' } },
    internalId: { default: 'hidden' },
  },
  defaultAttrs: { open: true },
};

describe('initialAttrs', () => {
  it('merges schema defaults with definition.defaultAttrs', () => {
    expect(initialAttrs(definition)).toStrictEqual({
      title: '',
      size: null,
      rows: [],
      open: true,
      internalId: 'hidden',
    });
  });
});

describe('toFormValues', () => {
  it('serialises json fields to pretty strings and leaves other values alone', () => {
    const values = toFormValues(definition, { ...initialAttrs(definition), rows: [{ a: 1 }] });
    expect(values.rows).toBe(JSON.stringify([{ a: 1 }], null, 2));
    expect(values.open).toBe(true);
  });
});

describe('attributeSummary', () => {
  it('lists form-visible attributes with labels and skips empty and hidden ones', () => {
    expect(
      attributeSummary(definition, {
        title: 'Hi',
        size: 3,
        rows: [1],
        open: false,
        internalId: 'x',
      })
    ).toBe('Title: Hi · Size: 3 · Rows: [1] · Open: no');
    expect(attributeSummary(definition, { title: '', size: null, rows: null, open: true })).toBe(
      'Open: yes'
    );
  });
});

describe('validateAttrs', () => {
  it('flags required text fields that are blank', () => {
    const { errors } = validateAttrs(definition, { title: '   ' }, messages);
    expect(errors).toStrictEqual({ title: 'REQ' });
  });

  it('coerces numbers and rejects non-numeric input', () => {
    expect(validateAttrs(definition, { title: 'x', size: '12' }, messages).values.size).toBe(12);
    expect(validateAttrs(definition, { title: 'x', size: 'abc' }, messages).errors).toStrictEqual({
      size: 'NUM',
    });
    expect(validateAttrs(definition, { title: 'x', size: '' }, messages).values.size).toBeNull();
  });

  it('parses json strings, keeps already-parsed values and reports invalid json', () => {
    expect(
      validateAttrs(definition, { title: 'x', rows: '[1, 2]' }, messages).values.rows
    ).toStrictEqual([1, 2]);
    expect(
      validateAttrs(definition, { title: 'x', rows: [3] }, messages).values.rows
    ).toStrictEqual([3]);
    expect(validateAttrs(definition, { title: 'x', rows: '{oops' }, messages).errors).toStrictEqual(
      {
        rows: 'JSON',
      }
    );
  });

  it('flags a required json field left empty', () => {
    const withRequiredJson: AnyRichTextComponentDefinition = {
      ...definition,
      attributes: {
        ...definition.attributes,
        rows: { default: null, form: { type: 'json', label: 'Rows', required: true } },
      },
    };
    expect(
      validateAttrs(withRequiredJson, { title: 'x', rows: null }, messages).errors
    ).toStrictEqual({ rows: 'REQ' });
    expect(
      validateAttrs(withRequiredJson, { title: 'x', rows: '' }, messages).errors
    ).toStrictEqual({ rows: 'REQ' });
    expect(
      validateAttrs(withRequiredJson, { title: 'x', rows: [1] }, messages).errors
    ).toStrictEqual({});
  });

  it('runs definition.validate only when the generated checks pass and merges its errors', () => {
    const withValidate = {
      ...definition,
      validate: (attrs: Record<string, unknown>) =>
        attrs.title === 'bad' ? { title: 'custom' } : null,
    };
    expect(validateAttrs(withValidate, { title: 'bad' }, messages).errors).toStrictEqual({
      title: 'custom',
    });
    expect(validateAttrs(withValidate, { title: '' }, messages).errors).toStrictEqual({
      title: 'REQ',
    });
  });
});

describe('isContainerComponent', () => {
  it('is true only when the definition has a content expression', () => {
    expect(isContainerComponent(definition)).toBe(false);
    expect(isContainerComponent({ ...definition, content: 'block+' })).toBe(true);
  });
});
