export default {
  'preset-routes': {
    type: 'admin' as const,
    routes: [
      {
        method: 'GET',
        path: '/presets',
        handler: 'preset.find',
        config: { policies: [], middlewares: [] },
      },
      {
        method: 'GET',
        path: '/presets/:name',
        handler: 'preset.findOne',
        config: { policies: [], middlewares: [] },
      },
    ],
  },
  'theme-routes': {
    type: 'admin' as const,
    routes: [
      {
        method: 'GET',
        path: '/theme',
        handler: 'theme.find',
        config: { policies: [], middlewares: [] },
      },
    ],
  },
};
