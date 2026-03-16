import type { StrapiApp } from '@strapi/strapi/admin';
import type { TiptapThemeConfig } from '../../shared/types';
import { PLUGIN_ID } from '../../shared/pluginId';
import { Initializer } from './components/Initializer';
import { PresetSelect } from './components/PresetSelect';
import { setThemeCache } from './utils/themeCache';

import { richTextField } from './fields/richTextField';

export default {
  register(app: StrapiApp) {
    app.registerPlugin({
      id: PLUGIN_ID,
      initializer: Initializer,
      isReady: false,
      name: PLUGIN_ID,
    });

    app.customFields.register(
      richTextField as unknown as Parameters<typeof app.customFields.register>[0]
    );
  },

  async bootstrap(app: StrapiApp) {
    const ctbPlugin = app.getPlugin('content-type-builder') as Record<string, any> | undefined;
    const components = ctbPlugin?.apis?.forms?.components;
    if (components && typeof components.add === 'function') {
      components.add({
        id: 'preset-select',
        component: PresetSelect,
      });
    }

    try {
      const response = await fetch('/tiptap-editor/theme');
      if (response.ok) {
        const data = await response.json();
        if (data && typeof data === 'object' && Object.keys(data).length > 0) {
          setThemeCache(data as TiptapThemeConfig);

          if (typeof data.stylesheet === 'string' && data.stylesheet) {
            if (!document.getElementById('tiptap-theme-stylesheet')) {
              const link = document.createElement('link');
              link.id = 'tiptap-theme-stylesheet';
              link.rel = 'stylesheet';
              link.href = data.stylesheet;
              document.head.appendChild(link);
            }
          }
        }
      }
    } catch (error) {
      console.warn('[TiptapEditor] Failed to fetch theme config:', error);
    }
  },

  async registerTrads({ locales }: { locales: string[] }) {
    return Promise.all(
      locales.map(async (locale) => {
        try {
          const { default: data } = await import(`./translations/${locale}.json`);

          return { data, locale };
        } catch {
          return { data: {}, locale };
        }
      })
    );
  },
};
