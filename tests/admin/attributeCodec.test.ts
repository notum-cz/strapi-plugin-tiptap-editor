import { describe, it, expect } from 'vitest';
import {
  dataAttributeName,
  decodeAttribute,
  encodeAttribute,
} from '../../admin/src/utils/attributeCodec';

describe('attributeCodec', () => {
  it('kebab-cases attribute keys into data attributes', () => {
    expect(dataAttributeName('openInNewTab')).toBe('data-open-in-new-tab');
    expect(dataAttributeName('href')).toBe('data-href');
  });

  it('keeps strings raw under a string default and json-encodes everything else', () => {
    expect(encodeAttribute('a "quoted" value', '')).toBe('a "quoted" value');
    expect(encodeAttribute(false, false)).toBe('false');
    expect(encodeAttribute([1, { a: 2 }], [])).toBe('[1,{"a":2}]');
  });

  it('json-quotes strings under a null default so they never decode as another type', () => {
    expect(encodeAttribute('12', null)).toBe('"12"');
    expect(encodeAttribute('true', null)).toBe('"true"');
    expect(encodeAttribute('/x', null)).toBe('"/x"');
    expect(encodeAttribute(12, null)).toBe('12');
    expect(encodeAttribute(null, null)).toBe('null');
  });

  it('round-trips every value type under a null default', () => {
    for (const value of ['12', 'true', 'null', '{"a":1}', '/x', 12, true, null, { a: 1 }]) {
      expect(decodeAttribute(encodeAttribute(value, null), null)).toStrictEqual(value);
    }
  });

  it('decodes according to the default value type', () => {
    expect(decodeAttribute(null, 'x')).toBe('x');
    expect(decodeAttribute('raw', '')).toBe('raw');
    expect(decodeAttribute('true', false)).toBe(true);
    expect(decodeAttribute('[1]', [])).toStrictEqual([1]);
    expect(decodeAttribute('{broken', [])).toStrictEqual([]);
    expect(decodeAttribute('12', null)).toBe(12);
    expect(decodeAttribute('/x', null)).toBe('/x');
    expect(decodeAttribute('null', null)).toBe(null);
  });
});
