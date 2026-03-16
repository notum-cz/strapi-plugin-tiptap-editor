import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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
}));

// Mock react
vi.mock('react', () => ({
  default: {
    createElement: vi.fn(),
  },
  useState: vi.fn(() => [null, vi.fn()]),
  useEffect: vi.fn(),
  forwardRef: vi.fn((fn: any) => fn),
}));

// Import the plugin default export
import pluginExport from '../../admin/src/index';

const bootstrap = (pluginExport as any).bootstrap;

describe('bootstrap', () => {
  let mockGetElementById: ReturnType<typeof vi.fn>;
  let mockCreateElement: ReturnType<typeof vi.fn>;
  let mockAppendChild: ReturnType<typeof vi.fn>;
  let mockLink: { id: string; rel: string; href: string };
  let mockFetch: ReturnType<typeof vi.fn>;
  let mockConsoleWarn: ReturnType<typeof vi.fn>;

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
    mockSetThemeCache.mockReset();
    mockConsoleWarn = vi.fn();
    vi.stubGlobal('console', { ...console, warn: mockConsoleWarn });

    mockLink = { id: '', rel: '', href: '' };
    mockCreateElement = vi.fn(() => mockLink);
    mockAppendChild = vi.fn();
    mockGetElementById = vi.fn(() => null);

    vi.stubGlobal('document', {
      getElementById: mockGetElementById,
      createElement: mockCreateElement,
      head: { appendChild: mockAppendChild },
    });

    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('existing CTB plugin registration still works', async () => {
    const app = makeApp();
    mockFetch.mockResolvedValue({
      ok: false,
    });

    await bootstrap(app);

    expect(app.getPlugin).toHaveBeenCalledWith('content-type-builder');
  });

  it('populates themeCache when theme fetch succeeds', async () => {
    const themeData = {
      colors: [{ label: 'Brand Blue', value: '#0052cc' }],
      stylesheet: '/uploads/theme.css',
    };
    mockFetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(themeData),
    });
    mockGetElementById.mockReturnValue(null);

    await bootstrap(makeApp());

    expect(mockSetThemeCache).toHaveBeenCalledWith(themeData);
  });

  it('injects link tag when stylesheet is configured', async () => {
    const themeData = { colors: [], stylesheet: '/uploads/theme.css' };
    mockFetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(themeData),
    });
    mockGetElementById.mockReturnValue(null);

    await bootstrap(makeApp());

    expect(mockCreateElement).toHaveBeenCalledWith('link');
    expect(mockLink.id).toBe('tiptap-theme-stylesheet');
    expect(mockLink.rel).toBe('stylesheet');
    expect(mockLink.href).toBe('/uploads/theme.css');
    expect(mockAppendChild).toHaveBeenCalledWith(mockLink);
  });

  it('does not duplicate link tag when element already exists', async () => {
    const themeData = { colors: [], stylesheet: '/uploads/theme.css' };
    mockFetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(themeData),
    });
    // Simulate link tag already present
    mockGetElementById.mockReturnValue({ id: 'tiptap-theme-stylesheet' });

    await bootstrap(makeApp());

    expect(mockAppendChild).not.toHaveBeenCalled();
  });

  it('does not inject link tag when no stylesheet in theme', async () => {
    const themeData = { colors: [{ label: 'Red', value: '#ff0000' }] };
    mockFetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(themeData),
    });
    mockGetElementById.mockReturnValue(null);

    await bootstrap(makeApp());

    expect(mockCreateElement).not.toHaveBeenCalled();
    expect(mockAppendChild).not.toHaveBeenCalled();
  });

  it('logs warning and does not throw when fetch fails', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    // Should not throw — bootstrap handles errors gracefully
    await bootstrap(makeApp());

    expect(mockConsoleWarn).toHaveBeenCalledWith(
      '[TiptapEditor] Failed to fetch theme config:',
      expect.any(Error)
    );
  });

  it('does not call setThemeCache when fetch response is not ok', async () => {
    mockFetch.mockResolvedValue({ ok: false });

    await bootstrap(makeApp());

    expect(mockSetThemeCache).not.toHaveBeenCalled();
  });

  it('does not call setThemeCache when theme response is empty object', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
    });

    await bootstrap(makeApp());

    expect(mockSetThemeCache).not.toHaveBeenCalled();
  });
});
