import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock themeCache module — use vi.hoisted to ensure variable is available before vi.mock hoisting
const { mockSetThemeCache } = vi.hoisted(() => ({
  mockSetThemeCache: vi.fn(),
}));

vi.mock('../../admin/src/utils/themeCache', () => ({
  setThemeCache: mockSetThemeCache,
  getThemeCache: vi.fn(() => null),
}));

// Mock Strapi design system (used by PresetSelect)
vi.mock('@strapi/design-system', () => ({
  SingleSelect: 'SingleSelect',
  SingleSelectOption: 'SingleSelectOption',
}));

// Mock @strapi/strapi/admin
vi.mock('@strapi/strapi/admin', () => ({
  useNotification: vi.fn(),
  useFetchClient: vi.fn(() => ({ get: vi.fn() })),
}));

// Mock react
vi.mock('react', () => ({
  default: {
    createElement: vi.fn(),
  },
  useState: vi.fn(() => [null, vi.fn()]),
  useEffect: vi.fn(),
  useRef: vi.fn((val: any) => ({ current: val })),
  forwardRef: vi.fn((fn: any) => fn),
}));

// Import the plugin default export
import pluginExport from '../../admin/src/index';

const bootstrap = (pluginExport as any).bootstrap;

describe('bootstrap', () => {
  const makeApp = () => {
    const mockCtbPlugin = {
      apis: {
        forms: {
          components: {
            add: vi.fn(),
          },
        },
      },
    };
    return {
      getPlugin: vi.fn((id: string) => (id === 'content-type-builder' ? mockCtbPlugin : undefined)),
    } as any;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers PresetSelect with CTB plugin', async () => {
    const app = makeApp();

    await bootstrap(app);

    expect(app.getPlugin).toHaveBeenCalledWith('content-type-builder');
    const ctb = app.getPlugin('content-type-builder');
    expect(ctb.apis.forms.components.add).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'preset-select' })
    );
  });

  it('does not throw when CTB plugin is missing', async () => {
    const app = {
      getPlugin: vi.fn(() => undefined),
    } as any;

    await expect(bootstrap(app)).resolves.toBeUndefined();
  });
});
