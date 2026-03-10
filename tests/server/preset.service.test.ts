import { describe, it, expect, vi } from 'vitest';
import services from '../../server/src/services';

const makeStrapi = (presets: Record<string, unknown>) => ({
  config: {
    get: vi.fn().mockReturnValue({ presets }),
  },
  plugin: vi.fn().mockReturnValue(undefined),
});

describe('preset service (SERVER-02, SERVER-03)', () => {
  it('listPresetNames() returns all preset keys', () => {
    const strapi = makeStrapi({ rich: { bold: true }, minimal: { italic: true } }) as any;
    const service = services.preset({ strapi });
    expect(service.listPresetNames()).toEqual(['rich', 'minimal']);
  });

  it('listPresetNames() returns empty array when no presets configured', () => {
    const strapi = makeStrapi({}) as any;
    const service = services.preset({ strapi });
    expect(service.listPresetNames()).toEqual([]);
  });

  it('getPreset() returns config for known name', () => {
    const richConfig = { bold: true, heading: { levels: [2] } };
    const strapi = makeStrapi({ rich: richConfig }) as any;
    const service = services.preset({ strapi });
    expect(service.getPreset('rich')).toStrictEqual(richConfig);
  });

  it('getPreset() returns null for unknown name', () => {
    const strapi = makeStrapi({ rich: { bold: true } }) as any;
    const service = services.preset({ strapi });
    expect(service.getPreset('unknown')).toBeNull();
  });
});
