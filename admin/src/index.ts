import type { StrapiApp } from '@strapi/strapi/admin';
import { PLUGIN_ID } from '../../shared/pluginId';
import { Initializer } from './components/Initializer';
import { PresetSelect } from './components/PresetSelect';
import { captureApp } from './utils/strapiApp';

import { richTextField } from './fields/richTextField';

export default {
  register(app: StrapiApp) {
    captureApp(app as never);

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

  bootstrap(app: StrapiApp) {
    const ctbPlugin = app.getPlugin('content-type-builder') as Record<string, any> | undefined;
    const components = ctbPlugin?.apis?.forms?.components;
    if (components && typeof components.add === 'function') {
      components.add({
        id: 'preset-select',
        component: PresetSelect,
      });
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
