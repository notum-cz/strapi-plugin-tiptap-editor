import type { Core } from '@strapi/strapi';
import {
  TiptapPluginConfig,
  TiptapPresetConfig,
} from '../../../shared/types';

const DEFAULT_CONFIG: TiptapPluginConfig = { presets: {} };

const createPresetService = ({ strapi }: { strapi: Core.Strapi }) => ({
  getConfig(): TiptapPluginConfig {
    return strapi.config.get('plugin::tiptap-editor', DEFAULT_CONFIG) as TiptapPluginConfig;
  },

  listPresetNames(): string[] {
    return Object.keys(this.getConfig().presets || {});
  },

  getPreset(name: string): TiptapPresetConfig | null {
    const presets = this.getConfig().presets || {};
    return presets[name] ?? null;
  },
});

export default createPresetService;
