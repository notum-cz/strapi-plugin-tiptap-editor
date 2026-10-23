import { EXPLORER_READ_PERMISSION, SETTINGS_UPDATE_PERMISSION } from '../bootstrap';

const explorerReadPolicy = {
  name: 'admin::hasPermissions',
  config: { actions: [EXPLORER_READ_PERMISSION] },
};

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
  'settings-routes': {
    type: 'admin' as const,
    routes: [
      {
        method: 'GET',
        path: '/settings',
        handler: 'settings.find',
        config: { policies: [], middlewares: [] },
      },
      {
        method: 'PUT',
        path: '/settings',
        handler: 'settings.update',
        config: {
          policies: [
            {
              name: 'admin::hasPermissions',
              config: { actions: [SETTINGS_UPDATE_PERMISSION] },
            },
          ],
          middlewares: [],
        },
      },
    ],
  },
  'search-routes': {
    type: 'admin' as const,
    routes: [
      {
        method: 'GET',
        path: '/search',
        handler: 'search.search',
        config: { policies: [explorerReadPolicy], middlewares: [] },
      },
      {
        method: 'GET',
        path: '/get/:collectionName/:documentId',
        handler: 'search.getDocument',
        config: { policies: [explorerReadPolicy], middlewares: [] },
      },
      {
        method: 'GET',
        path: '/identify/:collectionName',
        handler: 'search.identify',
        config: { policies: [explorerReadPolicy], middlewares: [] },
      },
    ],
  },
  'media-routes': {
    type: 'admin' as const,
    routes: [
      {
        method: 'GET',
        path: '/link-preview',
        handler: 'media.linkPreview',
        config: { policies: [], middlewares: [] },
      },
      {
        method: 'POST',
        path: '/upload-by-url',
        handler: 'media.uploadByUrl',
        config: {
          policies: [
            {
              name: 'admin::hasPermissions',
              config: { actions: ['plugin::upload.assets.create'] },
            },
          ],
          middlewares: [],
        },
      },
    ],
  },
};
