import type { Core } from '@strapi/strapi';
import type { Context } from 'koa';
import {
  BUILT_IN_PRESETS,
  MINIMAL_PRESET_CONFIG,
  TiptapPresetConfig,
} from '../../../shared/types';

interface PresetService {
  listPresetNames(): string[];
  listAvailablePresets?(): string[];
  getPreset(name: string): TiptapPresetConfig | null;
  getEffectivePreset?(name: string): Promise<TiptapPresetConfig | null>;
}

const createPresetController = ({ strapi }: { strapi: Core.Strapi }) => ({
  async find(ctx: Context): Promise<void> {
    const presetService = strapi.plugin('tiptap-editor').service('preset') as PresetService;
    const includeBuiltIn = (ctx as { query?: Record<string, unknown> }).query?.includeBuiltIn === 'true';
    const presets =
      includeBuiltIn && typeof presetService.listAvailablePresets === 'function'
        ? presetService.listAvailablePresets()
        : presetService.listPresetNames();
    ctx.body = { presets };
  },

  async findOne(ctx: Context): Promise<void> {
    const raw = ctx.params?.name;
    if (typeof raw !== 'string') {
      ctx.throw(400, 'Preset name is required');
      return;
    }

    const presetName = raw.trim();
    if (presetName.length === 0 || !/^[\w-]+$/.test(presetName)) {
      ctx.throw(400, 'Invalid preset name');
      return;
    }

    const presetService = strapi.plugin('tiptap-editor').service('preset') as PresetService;
    const preset =
      typeof presetService.getEffectivePreset === 'function'
        ? await presetService.getEffectivePreset(presetName)
        : presetService.getPreset(presetName) ??
          (Object.prototype.hasOwnProperty.call(BUILT_IN_PRESETS, presetName)
            ? BUILT_IN_PRESETS[presetName]
            : null);
    ctx.body = preset ?? MINIMAL_PRESET_CONFIG;
  },
});

export default createPresetController;
