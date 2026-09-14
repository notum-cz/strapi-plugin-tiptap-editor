import { describe, it, expect } from 'vitest';
import { stripUnknownContent } from '../../shared/src/sanitize';
import type { JSONContent } from '../../shared/src/sanitize';

const schema = {
  nodes: { doc: {}, paragraph: {}, text: {}, button: {} },
  marks: { bold: {} },
};

const text = (value: string, marks?: JSONContent['marks']): JSONContent =>
  marks ? { type: 'text', text: value, marks } : { type: 'text', text: value };
const paragraph = (...content: JSONContent[]): JSONContent => ({ type: 'paragraph', content });
const doc = (...content: JSONContent[]): JSONContent => ({ type: 'doc', content });

describe('stripUnknownContent', () => {
  it('removes an unknown leaf node and reports it', () => {
    const result = stripUnknownContent(
      doc(paragraph(text('a')), { type: 'cta', attrs: { href: '/' } }, paragraph(text('b'))),
      schema
    );
    expect(result.content).toEqual(doc(paragraph(text('a')), paragraph(text('b'))));
    expect(result.unknownNodeTypes).toEqual(['cta']);
    expect(result.unknownMarkTypes).toEqual([]);
  });

  it('replaces an unknown container with its children', () => {
    const result = stripUnknownContent(
      doc({ type: 'callout', attrs: { tone: 'info' }, content: [paragraph(text('inside'))] }),
      schema
    );
    expect(result.content).toEqual(doc(paragraph(text('inside'))));
    expect(result.unknownNodeTypes).toEqual(['callout']);
  });

  it('drops unknown marks but keeps the text', () => {
    const result = stripUnknownContent(
      doc(paragraph(text('hi', [{ type: 'bold' }, { type: 'sparkle' }]))),
      schema
    );
    expect(result.content).toEqual(doc(paragraph(text('hi', [{ type: 'bold' }]))));
    expect(result.unknownMarkTypes).toEqual(['sparkle']);
  });

  it('reports each unknown type once', () => {
    const result = stripUnknownContent(doc({ type: 'cta' }, { type: 'cta' }), schema);
    expect(result.unknownNodeTypes).toEqual(['cta']);
  });

  it('round-trips a fully known document unchanged', () => {
    const input = doc(
      paragraph(text('a', [{ type: 'bold' }])),
      { type: 'button', attrs: { label: 'Go', href: '/' } }
    );
    const result = stripUnknownContent(input, schema);
    expect(result.content).toEqual(input);
    expect(result.unknownNodeTypes).toEqual([]);
    expect(result.unknownMarkTypes).toEqual([]);
  });

  it('tolerates content and marks that are not arrays', () => {
    const result = stripUnknownContent(
      { type: 'doc', content: [{ type: 'text', text: 'x', marks: 'bold' }] } as unknown as JSONContent,
      schema
    );
    expect(result.content).toEqual({ type: 'doc', content: [{ type: 'text', text: 'x' }] });
  });

  it('drops non-object children and marks', () => {
    const result = stripUnknownContent(
      { type: 'doc', content: [null, 'x', paragraph(text('a', [null, { type: 'bold' }] as any))] } as any,
      schema
    );
    expect(result.content).toEqual(doc(paragraph(text('a', [{ type: 'bold' }]))));
  });

  it.each([
    ['empty object', {}],
    ['string content', { type: 'doc', content: 'nope' }],
    ['null', null],
    ['a number', 42],
    ['an unknown root', { type: 'mystery' }],
  ])('never throws on garbage input (%s)', (_label, input) => {
    expect(() => stripUnknownContent(input as JSONContent, schema)).not.toThrow();
  });

  it('falls back to an empty doc when nothing survives', () => {
    expect(stripUnknownContent({ type: 'mystery' }, schema).content).toEqual({
      type: 'doc',
      content: [],
    });
  });
});
