import type { Core } from '@strapi/strapi';
import { MINIMAL_PRESET_CONFIG } from '../../../shared/types';

const createPresetController = ({ strapi }: { strapi: Core.Strapi }) => ({
  async find(ctx: any): Promise<void> {
    const presetService = strapi.plugin('tiptap-editor').service('preset') as any;
    ctx.body = { presets: presetService.listPresetNames() };
  },

  async findOne(ctx: any): Promise<void> {
    const presetService = strapi.plugin('tiptap-editor').service('preset') as any;
    const presetName: string = ctx.params?.name;
    const preset = presetService.getPreset(presetName);
    // Return MINIMAL_PRESET_CONFIG for unknown presets (never 404) — SERVER-03
    ctx.body = preset ?? MINIMAL_PRESET_CONFIG;
  },
});

export default createPresetController;
