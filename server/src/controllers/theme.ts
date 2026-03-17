import type { Core } from '@strapi/strapi';
import type { Context } from 'koa';
import { TiptapThemeConfig } from '../../../shared/types';

interface ThemeService {
  getTheme(): TiptapThemeConfig | undefined;
}

const createThemeController = ({ strapi }: { strapi: Core.Strapi }) => ({
  async find(ctx: Context): Promise<void> {
    const themeService = strapi.plugin('tiptap-editor').service('theme') as ThemeService;
    ctx.body = themeService.getTheme() ?? {};
  },
});

export default createThemeController;
