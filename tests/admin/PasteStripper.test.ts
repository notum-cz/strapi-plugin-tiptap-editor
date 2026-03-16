import { describe, it, expect } from 'vitest';

import { PasteStripper } from '../../admin/src/extensions/PasteStripper';

describe('PasteStripper', () => {
  it('PasteStripper.name is "pasteStripper"', () => {
    expect(PasteStripper.name).toBe('pasteStripper');
  });

  it('strips double-quoted style attributes from span elements', () => {
    const strip = (PasteStripper.config as any).transformPastedHTML;
    const input = '<span style="color: red">text</span>';
    const output = strip(input);
    expect(output).toBe('<span>text</span>');
  });

  it('strips style from div elements', () => {
    const strip = (PasteStripper.config as any).transformPastedHTML;
    const input = '<div style="background: blue">content</div>';
    const output = strip(input);
    expect(output).toBe('<div>content</div>');
  });

  it('strips style from p elements', () => {
    const strip = (PasteStripper.config as any).transformPastedHTML;
    const input = '<p style="font-size: 14px">paragraph</p>';
    const output = strip(input);
    expect(output).toBe('<p>paragraph</p>');
  });

  it('strips style from td elements', () => {
    const strip = (PasteStripper.config as any).transformPastedHTML;
    const input = '<td style="border: 1px solid black">cell</td>';
    const output = strip(input);
    expect(output).toBe('<td>cell</td>');
  });

  it('preserves class attribute when stripping style', () => {
    const strip = (PasteStripper.config as any).transformPastedHTML;
    const input = '<span class="highlight" style="color: red">text</span>';
    const output = strip(input);
    expect(output).toBe('<span class="highlight">text</span>');
  });

  it('preserves id attribute when stripping style', () => {
    const strip = (PasteStripper.config as any).transformPastedHTML;
    const input = '<div id="main" style="margin: 0">content</div>';
    const output = strip(input);
    expect(output).toBe('<div id="main">content</div>');
  });

  it('returns unchanged HTML when no style attributes present', () => {
    const strip = (PasteStripper.config as any).transformPastedHTML;
    const input = '<p class="intro">Hello <strong>world</strong></p>';
    const output = strip(input);
    expect(output).toBe('<p class="intro">Hello <strong>world</strong></p>');
  });

  it('strips multiple style attributes in one HTML string', () => {
    const strip = (PasteStripper.config as any).transformPastedHTML;
    const input = '<div style="color: red"><p style="margin: 0">text</p></div>';
    const output = strip(input);
    expect(output).toBe('<div><p>text</p></div>');
  });

  it('handles empty string input', () => {
    const strip = (PasteStripper.config as any).transformPastedHTML;
    expect(strip('')).toBe('');
  });
});
