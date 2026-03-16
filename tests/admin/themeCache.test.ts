import { describe, it, expect, beforeEach } from 'vitest';

import { getThemeCache, setThemeCache } from '../../admin/src/utils/themeCache';

describe('themeCache', () => {
  beforeEach(() => {
    setThemeCache(null);
  });

  it('getThemeCache returns null before any setThemeCache call', () => {
    expect(getThemeCache()).toBeNull();
  });

  it('setThemeCache followed by getThemeCache returns the same config object', () => {
    const config = { colors: [{ label: 'Red', color: '#ff0000' }] };
    setThemeCache(config);
    expect(getThemeCache()).toBe(config);
  });

  it('setThemeCache(null) resets cache to null', () => {
    setThemeCache({ stylesheet: 'theme.css' });
    setThemeCache(null);
    expect(getThemeCache()).toBeNull();
  });

  it('setThemeCache can be called multiple times — last value wins', () => {
    const first = { colors: [{ label: 'Blue', color: '#0000ff' }] };
    const second = { colors: [{ label: 'Green', color: '#00ff00' }], stylesheet: 'green.css' };
    setThemeCache(first);
    setThemeCache(second);
    expect(getThemeCache()).toBe(second);
  });

  it('stores and retrieves a config with only stylesheet', () => {
    const config = { stylesheet: '/css/theme.css' };
    setThemeCache(config);
    expect(getThemeCache()).toEqual({ stylesheet: '/css/theme.css' });
  });

  it('stores and retrieves a config with colors and stylesheet', () => {
    const config = {
      colors: [
        { label: 'Primary', color: '#123456' },
        { label: 'Secondary', color: 'rgb(100, 200, 50)' },
      ],
      stylesheet: '/theme.css',
    };
    setThemeCache(config);
    expect(getThemeCache()).toBe(config);
  });
});
