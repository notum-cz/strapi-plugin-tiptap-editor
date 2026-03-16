import { describe, it, expect, vi } from 'vitest';
import controllers from '../../server/src/controllers';
import { TiptapThemeConfig } from '../../shared/types';

const makeStrapi = (theme: TiptapThemeConfig | undefined) => ({
  config: {
    get: vi.fn().mockReturnValue({ presets: {}, theme }),
  },
  plugin: vi.fn().mockReturnValue({
    service: vi.fn().mockImplementation(() => ({
      // Inline the service logic so controller tests are self-contained
      getTheme: () => theme,
    })),
  }),
});

const makeCtx = (overrides: Record<string, unknown> = {}) => ({
  throw: (status: number, message: string) => {
    const err = new Error(message) as any;
    err.status = status;
    throw err;
  },
  ...overrides,
});

describe('theme controller (THEME-03)', () => {
  it('find sets ctx.body to theme object when configured', async () => {
    const theme: TiptapThemeConfig = { colors: [{ label: 'Brand', color: '#0052cc' }] };
    const strapi = makeStrapi(theme) as any;
    const controller = controllers.theme({ strapi });
    const ctx: any = makeCtx();
    await controller.find(ctx);
    expect(ctx.body).toStrictEqual(theme);
  });

  it('find sets ctx.body to {} when no theme configured', async () => {
    const strapi = makeStrapi(undefined) as any;
    const controller = controllers.theme({ strapi });
    const ctx: any = makeCtx();
    await controller.find(ctx);
    expect(ctx.body).toStrictEqual({});
  });
});
