import { describe, it, expect } from 'vitest';
import {
  toNodeSpec,
  isInlineComponent,
  isValidComponentName,
  isReservedNodeName,
  RESERVED_NODE_NAMES,
  buttonSchema,
  BUILT_IN_COMPONENT_SCHEMAS,
} from '../../shared/src/components';
import type { RichTextComponentSchema } from '../../shared/src/components';

const atom: RichTextComponentSchema = {
  name: 'cta',
  label: 'CTA',
  attributes: {
    href: { default: '', form: { type: 'url', label: 'URL', required: true } },
    count: { default: 0 },
  },
};

const container: RichTextComponentSchema = {
  name: 'callout',
  label: 'Callout',
  content: 'block+',
  attributes: { tone: { default: 'info' } },
};

describe('toNodeSpec', () => {
  it('marks a schema without content as an atom block with no content expression', () => {
    const spec = toNodeSpec(atom);
    expect(spec.name).toBe('cta');
    expect(spec.group).toBe('block');
    expect(spec.atom).toBe(true);
    expect(spec).not.toHaveProperty('content');
  });

  it('keeps the content expression and marks containers as non-atomic', () => {
    const spec = toNodeSpec(container);
    expect(spec.atom).toBe(false);
    expect(spec.content).toBe('block+');
  });

  it('copies attribute defaults and drops form metadata', () => {
    expect(toNodeSpec(atom).attributes).toStrictEqual({
      href: { default: '' },
      count: { default: 0 },
    });
  });
});

const inline: RichTextComponentSchema = {
  name: 'badge',
  label: 'Badge',
  inline: true,
  attributes: { tone: { default: 'info' } },
};

describe('toNodeSpec inline', () => {
  it('maps the inline flag to an inline atom with no marks', () => {
    const spec = toNodeSpec(inline);
    expect(spec.group).toBe('inline');
    expect(spec.inline).toBe(true);
    expect(spec.atom).toBe(true);
    expect(spec.marks).toBe('');
    expect(spec.content).toBeUndefined();
  });

  it('keeps block components as they were', () => {
    const spec = toNodeSpec(atom);
    expect(spec.group).toBe('block');
    expect(spec.inline).toBe(false);
    expect(spec).not.toHaveProperty('marks');
  });

  it('rejects an inline component with content', () => {
    expect(() => toNodeSpec({ ...inline, content: 'inline*' })).toThrow(
      'Component "badge" cannot be both inline and a container'
    );
  });

  it('isInlineComponent reads the flag', () => {
    expect(isInlineComponent(inline)).toBe(true);
    expect(isInlineComponent(atom)).toBe(false);
  });
});

describe('isValidComponentName', () => {
  it.each(['button', 'pricingTable', 'pricing-table', 'a1'])('accepts %s', (name) => {
    expect(isValidComponentName(name)).toBe(true);
  });

  it.each(['1abc', 'with space', '', 'my.node', '-lead'])('rejects %s', (name) => {
    expect(isValidComponentName(name)).toBe(false);
  });

  it('rejects every reserved node name', () => {
    for (const name of RESERVED_NODE_NAMES) {
      expect(isValidComponentName(name)).toBe(false);
      expect(isReservedNodeName(name)).toBe(true);
    }
    expect(isReservedNodeName('button')).toBe(false);
  });
});

describe('built-in schemas', () => {
  it('ships the button schema with its four attributes', () => {
    expect(buttonSchema.name).toBe('button');
    expect(buttonSchema.content).toBeUndefined();
    expect(Object.keys(buttonSchema.attributes)).toStrictEqual([
      'label',
      'href',
      'variant',
      'openInNewTab',
    ]);
    expect(buttonSchema.attributes.variant.default).toBe('primary');
    expect(buttonSchema.attributes.openInNewTab.default).toBe(false);
  });

  it('uses unique, valid names for every built-in', () => {
    const names = BUILT_IN_COMPONENT_SCHEMAS.map((schema) => schema.name);
    expect(new Set(names).size).toBe(names.length);
    for (const name of names) expect(isValidComponentName(name)).toBe(true);
  });
});
