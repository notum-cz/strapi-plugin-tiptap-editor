import { describe, it, expect, vi } from 'vitest';
import { MINIMAL_PRESET_CONFIG } from '../../shared/types';
import controllers from '../../server/src/controllers';

const makeStrapi = (presets: Record<string, unknown>) => ({
  config: {
    get: vi.fn().mockReturnValue({ presets }),
  },
  plugin: vi.fn().mockReturnValue({
    service: vi.fn().mockImplementation(() => {
      // Inline the service logic so controller tests are self-contained
      return {
        listPresetNames: () => Object.keys(presets),
        getPreset: (name: string) => (presets as any)[name] ?? null,
      };
    }),
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

describe('preset controller (SERVER-03)', () => {
  it('find sets ctx.body to array of preset names', async () => {
    const strapi = makeStrapi({ rich: { bold: true }, minimal: { italic: true } }) as any;
    const controller = controllers.preset({ strapi });
    const ctx: any = makeCtx();
    await controller.find(ctx);
    expect(ctx.body).toStrictEqual({ presets: ['rich', 'minimal'] });
  });

  it('findOne sets ctx.body to config for known preset', async () => {
    const richConfig = { bold: true };
    const strapi = makeStrapi({ rich: richConfig }) as any;
    const controller = controllers.preset({ strapi });
    const ctx: any = makeCtx({ params: { name: 'rich' } });
    await controller.findOne(ctx);
    expect(ctx.body).toStrictEqual(richConfig);
  });

  it('findOne sets ctx.body to MINIMAL_PRESET_CONFIG for unknown preset (not 404)', async () => {
    const strapi = makeStrapi({ rich: { bold: true } }) as any;
    const controller = controllers.preset({ strapi });
    const ctx: any = makeCtx({ params: { name: 'does-not-exist' } });
    await controller.findOne(ctx);
    expect(ctx.body).toStrictEqual(MINIMAL_PRESET_CONFIG);
  });

  it('findOne throws 400 when name param is missing', async () => {
    const strapi = makeStrapi({}) as any;
    const controller = controllers.preset({ strapi });
    const ctx: any = makeCtx({ params: {} });
    await expect(controller.findOne(ctx)).rejects.toThrow('Preset name is required');
  });

  it('findOne throws 400 when name is empty after trimming', async () => {
    const strapi = makeStrapi({}) as any;
    const controller = controllers.preset({ strapi });
    const ctx: any = makeCtx({ params: { name: '   ' } });
    await expect(controller.findOne(ctx)).rejects.toThrow('Invalid preset name');
  });

  it('findOne throws 400 when name contains invalid characters', async () => {
    const strapi = makeStrapi({}) as any;
    const controller = controllers.preset({ strapi });
    const ctx: any = makeCtx({ params: { name: '../etc/passwd' } });
    await expect(controller.findOne(ctx)).rejects.toThrow('Invalid preset name');
  });

  it('findOne accepts names with word characters and hyphens', async () => {
    const config = { bold: true };
    const strapi = makeStrapi({ 'my_preset-1': config }) as any;
    const controller = controllers.preset({ strapi });
    const ctx: any = makeCtx({ params: { name: 'my_preset-1' } });
    await controller.findOne(ctx);
    expect(ctx.body).toStrictEqual(config);
  });
});
