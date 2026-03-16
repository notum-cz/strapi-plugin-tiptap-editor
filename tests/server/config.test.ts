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
