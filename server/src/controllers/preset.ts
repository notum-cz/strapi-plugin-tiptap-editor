import type { Core } from '@strapi/strapi';
import type { Context } from 'koa';
import { MINIMAL_PRESET_CONFIG } from '../../../shared/types';

interface PresetService {
  listPresetNames(): string[];
  getPreset(name: string): Record<string, unknown> | null;
}

const createPresetController = ({ strapi }: { strapi: Core.Strapi }) => ({
  async find(ctx: Context): Promise<void> {
    const presetService = strapi.plugin('tiptap-editor').service('preset') as PresetService;
    ctx.body = { presets: presetService.listPresetNames() };
  },

  async findOne(ctx: Context): Promise<void> {
    const presetService = strapi.plugin('tiptap-editor').service('preset') as PresetService;
    const presetName: string = ctx.params?.name;
    const preset = presetService.getPreset(presetName);
    ctx.body = preset ?? MINIMAL_PRESET_CONFIG;
  },
});

export default createPresetController;
