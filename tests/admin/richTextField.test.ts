import { describe, it, expect, vi } from 'vitest';

// Mock @strapi/icons since richTextField imports Paragraph icon
vi.mock('@strapi/icons', () => ({
  Paragraph: 'Paragraph',
}));

import { richTextField } from '../../admin/src/fields/richTextField';

// Strapi reserved CTB option names (must not be used for custom fields)
const STRAPI_RESERVED_NAMES = [
  'min',
  'minLength',
  'max',
  'maxLength',
  'required',
  'regex',
  'enum',
  'unique',
  'private',
  'default',
];

describe('richTextField', () => {
  it('is exported as an object', () => {
    expect(typeof richTextField).toBe('object');
    expect(richTextField).not.toBeNull();
  });

  it('preserves existing properties (name, pluginId, type, intlLabel, intlDescription, icon)', () => {
    expect(richTextField).toHaveProperty('name');
    expect(richTextField).toHaveProperty('pluginId');
    expect(richTextField).toHaveProperty('type');
    expect(richTextField).toHaveProperty('intlLabel');
    expect(richTextField).toHaveProperty('intlDescription');
    expect(richTextField).toHaveProperty('icon');
  });

  it('preserves components.Input (existing behavior)', () => {
    expect(richTextField).toHaveProperty('components');
    expect(richTextField.components).toHaveProperty('Input');
    expect(typeof richTextField.components.Input).toBe('function');
  });

  it('has an options property with an advanced array', () => {
    expect(richTextField).toHaveProperty('options');
    expect((richTextField as any).options).toHaveProperty('advanced');
    expect(Array.isArray((richTextField as any).options.advanced)).toBe(true);
  });

  it('advanced array contains at least one section', () => {
    const advanced = (richTextField as any).options.advanced;
    expect(advanced.length).toBeGreaterThan(0);
  });

  it('advanced section contains an item named "preset"', () => {
    const advanced = (richTextField as any).options.advanced;
    // Find the item named 'preset' anywhere in sections
    const presetItem = advanced
      .flatMap((section: any) => (section.items || [section]))
      .find((item: any) => item.name === 'preset');

    expect(presetItem).toBeDefined();
  });

  it('"preset" item has correct intlLabel id and defaultMessage', () => {
    const advanced = (richTextField as any).options.advanced;
    const presetItem = advanced
      .flatMap((section: any) => (section.items || [section]))
      .find((item: any) => item.name === 'preset');

    expect(presetItem.intlLabel).toEqual({
      id: 'tiptap-editor.preset.label',
      defaultMessage: 'Editor Preset',
    });
  });

  it('"preset" item has a description with correct id', () => {
    const advanced = (richTextField as any).options.advanced;
    const presetItem = advanced
      .flatMap((section: any) => (section.items || [section]))
      .find((item: any) => item.name === 'preset');

    expect(presetItem.description).toHaveProperty('id', 'tiptap-editor.preset.description');
  });

  it('"preset" name is NOT in the Strapi reserved names list', () => {
    expect(STRAPI_RESERVED_NAMES).not.toContain('preset');
  });

  it('richTextField.name matches the RICH_TEXT_FIELD_NAME constant', () => {
    expect(richTextField.name).toBe('RichText');
  });

  it('richTextField.pluginId is "tiptap-editor"', () => {
    expect(richTextField.pluginId).toBe('tiptap-editor');
  });
});
