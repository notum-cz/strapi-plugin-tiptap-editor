import { describe, it, expect } from 'vitest';
import { cellBackgroundAttribute } from '../../shared/table';

describe('cellBackgroundAttribute', () => {
  it('defaults to no background', () => {
    expect(cellBackgroundAttribute.default).toBeNull();
  });

  it('parses the background from the inline style', () => {
    expect(cellBackgroundAttribute.parseHTML({ style: { backgroundColor: 'rgb(1, 2, 3)' } })).toBe(
      'rgb(1, 2, 3)'
    );
    expect(cellBackgroundAttribute.parseHTML({ style: { backgroundColor: '' } })).toBeNull();
  });

  it('renders a background-color style only when a color is set', () => {
    expect(cellBackgroundAttribute.renderHTML({ backgroundColor: '#ff0000' })).toEqual({
      style: 'background-color: #ff0000',
    });
    expect(cellBackgroundAttribute.renderHTML({ backgroundColor: null })).toEqual({});
    expect(cellBackgroundAttribute.renderHTML({})).toEqual({});
  });
});
