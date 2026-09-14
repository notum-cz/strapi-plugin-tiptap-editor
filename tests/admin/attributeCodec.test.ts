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

  it('keeps strings raw and json-encodes everything else', () => {
    expect(encodeAttribute('a "quoted" value')).toBe('a "quoted" value');
    expect(encodeAttribute(false)).toBe('false');
    expect(encodeAttribute([1, { a: 2 }])).toBe('[1,{"a":2}]');
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
