export default {
  'preset-routes': {
    type: 'admin' as const,
    routes: [
      {
        method: 'GET',
        path: '/presets',
        handler: 'preset.find',
        config: { auth: false, policies: [], middlewares: [] },
      },
      {
        method: 'GET',
        path: '/presets/:name',
        handler: 'preset.findOne',
        config: { auth: false, policies: [], middlewares: [] },
      },
    ],
  },
};
