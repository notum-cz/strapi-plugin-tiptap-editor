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

describe('preset controller (SERVER-03)', () => {
  it('find sets ctx.body to array of preset names', async () => {
    const strapi = makeStrapi({ rich: { bold: true }, minimal: { italic: true } }) as any;
    const controller = controllers.preset({ strapi });
    const ctx: any = {};
    await controller.find(ctx);
    expect(ctx.body).toStrictEqual({ presets: ['rich', 'minimal'] });
  });

  it('findOne sets ctx.body to config for known preset', async () => {
    const richConfig = { bold: true };
    const strapi = makeStrapi({ rich: richConfig }) as any;
    const controller = controllers.preset({ strapi });
    const ctx: any = { params: { name: 'rich' } };
    await controller.findOne(ctx);
    expect(ctx.body).toStrictEqual(richConfig);
  });

  it('findOne sets ctx.body to MINIMAL_PRESET_CONFIG for unknown preset (not 404)', async () => {
    const strapi = makeStrapi({ rich: { bold: true } }) as any;
    const controller = controllers.preset({ strapi });
    const ctx: any = { params: { name: 'does-not-exist' } };
    await controller.findOne(ctx);
    expect(ctx.body).toStrictEqual(MINIMAL_PRESET_CONFIG);
  });
});
