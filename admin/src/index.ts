import { PLUGIN_ID } from '../../shared/pluginId';
import { Initializer } from './components/Initializer';
import { PresetSelect } from './components/PresetSelect';

import { richTextField } from './fields/richTextField';

export default {
  register(app: any) {
    app.registerPlugin({
      id: PLUGIN_ID,
      initializer: Initializer,
      isReady: false,
      name: PLUGIN_ID,
    });

    app.customFields.register(richTextField);
  },

  bootstrap(app: any) {
    const ctbPlugin = app.getPlugin('content-type-builder');
    if (ctbPlugin) {
      const ctbFormsAPI = ctbPlugin.apis.forms;
      ctbFormsAPI.components.add({
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
