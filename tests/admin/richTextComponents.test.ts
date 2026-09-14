import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  clearRichTextComponents,
  defineRichTextComponent,
  getRichTextComponent,
  listRichTextComponents,
  registerRichTextComponent,
  resolveRichTextComponents,
} from '../../admin/src/registry/richTextComponents';

const button = defineRichTextComponent({
  name: 'button',
  label: 'Button',
  attributes: { href: { default: '' } },
});
const callout = defineRichTextComponent({
  name: 'callout',
  label: { id: 'x.callout', defaultMessage: 'Callout' },
  content: 'block+',
  attributes: { tone: { default: 'info' } },
});

beforeEach(() => clearRichTextComponents());
afterEach(() => vi.restoreAllMocks());

describe('registry', () => {
  it('defineRichTextComponent returns its argument unchanged', () => {
    const def = { name: 'x', label: 'X', attributes: {} };
    expect(defineRichTextComponent(def)).toBe(def);
  });

  it('lists registered components in registration order', () => {
    registerRichTextComponent(callout);
    registerRichTextComponent(button);
    expect(listRichTextComponents().map((d) => d.name)).toStrictEqual(['callout', 'button']);
  });

  it('returns undefined for an unknown name', () => {
    expect(getRichTextComponent('nope')).toBeUndefined();
  });

  it('re-registering the same name replaces the definition and logs an info line', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    registerRichTextComponent(button);
    const replacement = defineRichTextComponent({ ...button, label: 'CTA' });
    registerRichTextComponent(replacement);
    expect(getRichTextComponent('button')).toBe(replacement);
    expect(listRichTextComponents()).toHaveLength(1);
    expect(info).toHaveBeenCalledTimes(1);
  });

  it('throws on an invalid or reserved name', () => {
    expect(() => registerRichTextComponent({ ...button, name: '1bad' })).toThrowError(/invalid/);
    expect(() => registerRichTextComponent({ ...button, name: 'paragraph' })).toThrowError(
      /reserved/
    );
  });
});

describe('resolveRichTextComponents', () => {
  it('returns every registered component, enabled only when the preset enables it', () => {
    registerRichTextComponent(button);
    registerRichTextComponent(callout);
    const resolved = resolveRichTextComponents({ components: { button: true } });
    expect(resolved.map((r) => [r.definition.name, r.enabled])).toStrictEqual([
      ['button', true],
      ['callout', false],
    ]);
  });

  it('passes the preset options object through', () => {
    registerRichTextComponent(callout);
    const [resolved] = resolveRichTextComponents({ components: { callout: { tones: ['info'] } } });
    expect(resolved.options).toStrictEqual({ tones: ['info'] });
  });

  it('uses empty options for disabled components', () => {
    registerRichTextComponent(button);
    const [resolved] = resolveRichTextComponents({});
    expect(resolved.enabled).toBe(false);
    expect(resolved.options).toStrictEqual({});
  });

  it('warns once per enabled-but-unregistered name', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    resolveRichTextComponents({ components: { pricingTable: true } });
    resolveRichTextComponents({ components: { pricingTable: true } });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch(/pricingTable/);
  });
});
