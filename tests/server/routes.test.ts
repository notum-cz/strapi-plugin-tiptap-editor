import { describe, it, expect } from 'vitest';
import routes from '../../server/src/routes';

describe('routes (SERVER-04)', () => {
  it('exports preset-routes group', () => {
    expect(routes).toHaveProperty('preset-routes');
  });

  it('preset-routes has type: admin', () => {
    expect((routes as any)['preset-routes'].type).toBe('admin');
  });

  it('includes GET /presets route', () => {
    const routeList = (routes as any)['preset-routes'].routes as any[];
    const listRoute = routeList.find(
      (r) => r.method === 'GET' && r.path === '/presets'
    );
    expect(listRoute).toBeDefined();
    expect(listRoute.config.auth).toBeUndefined();
  });

  it('includes GET /presets/:name route', () => {
    const routeList = (routes as any)['preset-routes'].routes as any[];
    const detailRoute = routeList.find(
      (r) => r.method === 'GET' && r.path === '/presets/:name'
    );
    expect(detailRoute).toBeDefined();
    expect(detailRoute.config.auth).toBeUndefined();
  });
});

describe('theme routes (THEME-03)', () => {
  it('exports theme-routes group', () => {
    expect(routes).toHaveProperty('theme-routes');
  });

  it('theme-routes has type: admin', () => {
    expect((routes as any)['theme-routes'].type).toBe('admin');
  });

  it('includes GET /theme route with handler theme.find', () => {
    const routeList = (routes as any)['theme-routes'].routes as any[];
    const themeRoute = routeList.find(
      (r) => r.method === 'GET' && r.path === '/theme'
    );
    expect(themeRoute).toBeDefined();
    expect(themeRoute.handler).toBe('theme.find');
  });

  it('enforces admin::hasPermissions policy on PUT /settings', () => {
    const routeList = (routes as any)['settings-routes'].routes as any[];
    const putSettingsRoute = routeList.find(
      (r) => r.method === 'PUT' && r.path === '/settings'
    );
    expect(putSettingsRoute).toBeDefined();
    expect(putSettingsRoute.config.policies).toEqual([
      {
        name: 'admin::hasPermissions',
        config: {
          actions: ['plugin::tiptap-editor.settings.update'],
        },
      },
    ]);
  });

  it('enforces admin::hasPermissions policy on POST /upload-by-url', () => {
    const routeList = (routes as any)['media-routes'].routes as any[];
    const uploadByUrlRoute = routeList.find(
      (r) => r.method === 'POST' && r.path === '/upload-by-url'
    );
    expect(uploadByUrlRoute).toBeDefined();
    expect(uploadByUrlRoute.config.policies).toEqual([
      {
        name: 'admin::hasPermissions',
        config: {
          actions: ['plugin::upload.assets.create'],
        },
      },
    ]);
  });

  it('enforces admin::hasPermissions policy on search-routes', () => {
    const routeList = (routes as any)['search-routes'].routes as any[];
    expect(routeList).toHaveLength(3);
    for (const route of routeList) {
      expect(route.config.policies).toEqual([
        {
          name: 'admin::hasPermissions',
          config: {
            actions: ['plugin::tiptap-editor.explorer.read'],
          },
        },
      ]);
    }
  });
});
