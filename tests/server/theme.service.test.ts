import { describe, it, expect, vi } from 'vitest';
import services from '../../server/src/services';

const makeStrapi = (config: Record<string, unknown>) => ({
  config: {
    get: vi.fn().mockReturnValue(config),
  },
  plugin: vi.fn().mockReturnValue(undefined),
});

describe('theme service (THEME-02)', () => {
  it('getTheme() returns the theme when configured', () => {
    const theme = { colors: [{ label: 'Brand', color: '#0052cc' }] };
    const strapi = makeStrapi({ presets: {}, theme }) as any;
    const service = services.theme({ strapi });
    expect(service.getTheme()).toStrictEqual(theme);
  });

  it('getTheme() returns undefined when no theme key in config', () => {
    const strapi = makeStrapi({ presets: {} }) as any;
    const service = services.theme({ strapi });
    expect(service.getTheme()).toBeUndefined();
  });

  it('getTheme() returns theme with only stylesheet', () => {
    const theme = { stylesheet: '/uploads/theme.css' };
    const strapi = makeStrapi({ presets: {}, theme }) as any;
    const service = services.theme({ strapi });
    expect(service.getTheme()).toStrictEqual(theme);
  });

  it('getTheme() returns theme with only colors', () => {
    const theme = { colors: [{ label: 'Primary', color: 'rgb(0, 82, 204)' }] };
    const strapi = makeStrapi({ presets: {}, theme }) as any;
    const service = services.theme({ strapi });
    expect(service.getTheme()).toStrictEqual(theme);
  });
});
