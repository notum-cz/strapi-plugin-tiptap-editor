import { describe, it, expect } from 'vitest';
import config from '../../server/src/config';

describe('config validator (SERVER-01)', () => {
  it('passes when presets key is absent', () => {
    expect(() => config.validator({})).not.toThrow();
  });

  it('passes for valid preset', () => {
    expect(() =>
      config.validator({ presets: { rich: { bold: true, heading: { levels: [1, 2] } } } })
    ).not.toThrow();
  });

  it('throws for preset with invalid feature key — names the bad key', () => {
    expect(() =>
      config.validator({ presets: { rich: { unknownFeature: true } } })
    ).toThrowError(/unknownFeature/);
  });

  it('throws for preset with invalid feature key — shows allowed keys', () => {
    expect(() =>
      config.validator({ presets: { rich: { badKey: true } } })
    ).toThrowError(/Allowed keys:/);
  });

  it('throws when config is not a plain object', () => {
    expect(() => config.validator('not-an-object')).toThrow();
  });

  it('throws when a preset value is a boolean instead of a plain object', () => {
    expect(() =>
      config.validator({ presets: { basic: true } })
    ).toThrowError(/presets\.basic must be a plain object, got boolean/);
  });

  it('throws when a preset value is an array instead of a plain object', () => {
    expect(() =>
      config.validator({ presets: { basic: ['bold'] } })
    ).toThrowError(/presets\.basic must be a plain object, got object/);
  });

  it('throws when a preset value is a string instead of a plain object', () => {
    expect(() =>
      config.validator({ presets: { basic: 'minimal' } })
    ).toThrowError(/presets\.basic must be a plain object, got string/);
  });
});

describe('config validator — theme (THEME-04)', () => {
  it('passes when theme key is absent', () => {
    expect(() => config.validator({})).not.toThrow();
  });

  it('passes for valid theme with colors and stylesheet', () => {
    expect(() =>
      config.validator({
        theme: {
          colors: [{ label: 'Brand', color: '#0052cc' }],
          stylesheet: '/path/to/theme.css',
        },
      })
    ).not.toThrow();
  });

  it('passes for theme with only colors (no stylesheet)', () => {
    expect(() =>
      config.validator({ theme: { colors: [{ label: 'Red', color: '#ff0000' }] } })
    ).not.toThrow();
  });

  it('passes for theme with only stylesheet (no colors)', () => {
    expect(() => config.validator({ theme: { stylesheet: '/my/theme.css' } })).not.toThrow();
  });

  it('passes for empty theme object', () => {
    expect(() => config.validator({ theme: {} })).not.toThrow();
  });

  it('rejects when theme is a string (not a plain object)', () => {
    expect(() => config.validator({ theme: 'light' })).toThrow(/theme must be a plain object/);
  });

  it('rejects when theme is an array', () => {
    expect(() => config.validator({ theme: [] })).toThrow(/theme must be a plain object/);
  });

  it('rejects unknown keys in theme', () => {
    expect(() => config.validator({ theme: { palette: [] } })).toThrow(/theme.*unknown key/i);
  });

  it('rejects when theme.colors is not an array', () => {
    expect(() => config.validator({ theme: { colors: 'red' } })).toThrow(
      /theme\.colors must be an array/
    );
  });

  it('rejects when a color entry is missing label', () => {
    expect(() =>
      config.validator({ theme: { colors: [{ color: '#fff' }] } })
    ).toThrow(/theme\.colors\[0\].*label/);
  });

  it('rejects when a color entry is missing color', () => {
    expect(() =>
      config.validator({ theme: { colors: [{ label: 'White' }] } })
    ).toThrow(/theme\.colors\[0\].*color/);
  });

  it('rejects unknown keys in a color entry', () => {
    expect(() =>
      config.validator({ theme: { colors: [{ label: 'X', color: '#fff', extra: true }] } })
    ).toThrow(/theme\.colors\[0\].*unknown key/i);
  });

  it('rejects named colors like "red"', () => {
    expect(() =>
      config.validator({ theme: { colors: [{ label: 'Red', color: 'red' }] } })
    ).toThrow(/theme\.colors\[0\].*invalid color/i);
  });

  it('rejects invalid color format like "not-a-color"', () => {
    expect(() =>
      config.validator({ theme: { colors: [{ label: 'X', color: 'not-a-color' }] } })
    ).toThrow(/theme\.colors\[0\].*invalid color/i);
  });

  it('accepts hex formats: #fff, #ffffff, #ffffffaa, #ffff', () => {
    expect(() =>
      config.validator({
        theme: {
          colors: [
            { label: 'A', color: '#fff' },
            { label: 'B', color: '#ffffff' },
            { label: 'C', color: '#ffffffaa' },
            { label: 'D', color: '#ffff' },
          ],
        },
      })
    ).not.toThrow();
  });

  it('accepts rgb/rgba formats', () => {
    expect(() =>
      config.validator({
        theme: {
          colors: [
            { label: 'A', color: 'rgb(0,0,0)' },
            { label: 'B', color: 'rgba(0,0,0,0.5)' },
          ],
        },
      })
    ).not.toThrow();
  });

  it('accepts hsl/hsla formats', () => {
    expect(() =>
      config.validator({
        theme: {
          colors: [
            { label: 'A', color: 'hsl(0,50%,50%)' },
            { label: 'B', color: 'hsla(0,50%,50%,0.5)' },
          ],
        },
      })
    ).not.toThrow();
  });

  it('accepts var() format', () => {
    expect(() =>
      config.validator({ theme: { colors: [{ label: 'Yellow', color: 'var(--color-yellow-200)' }] } })
    ).not.toThrow();
  });

  it('rejects when stylesheet is not a string', () => {
    expect(() => config.validator({ theme: { stylesheet: 42 } })).toThrow(
      /theme\.stylesheet must be a string/
    );
  });
});
