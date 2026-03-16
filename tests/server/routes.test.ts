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
});
