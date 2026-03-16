import type { Core } from '@strapi/strapi';
import { TiptapPluginConfig, TiptapThemeConfig } from '../../../shared/types';

const DEFAULT_CONFIG: TiptapPluginConfig = { presets: {} };

const createThemeService = ({ strapi }: { strapi: Core.Strapi }) => ({
  getTheme(): TiptapThemeConfig | undefined {
    const cfg = strapi.config.get('plugin::tiptap-editor', DEFAULT_CONFIG) as TiptapPluginConfig;
    return cfg.theme;
  },
});

export default createThemeService;
