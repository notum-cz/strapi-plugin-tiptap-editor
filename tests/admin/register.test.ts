import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  clearRichTextComponents,
  defineRichTextComponent,
  listRichTextComponents,
  registerRichTextComponent,
} from '../../admin/src/registry/richTextComponents';

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

// Mock @strapi/icons (used by richTextField and the button built-in)
vi.mock('@strapi/icons', () => ({
  Paragraph: 'Paragraph',
  Link: 'Link',
}));

// Mock Initializer and PresetSelect as string components — their own deps are irrelevant here
vi.mock('../../admin/src/components/Initializer', () => ({
  Initializer: 'Initializer',
}));

vi.mock('../../admin/src/components/PresetSelect', () => ({
  PresetSelect: 'PresetSelect',
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
import admin from '../../admin/src/index';

describe('register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearRichTextComponents();
  });

  it('registers the built-in button before registering the plugin', () => {
    const app = {
      registerPlugin: vi.fn(),
      customFields: { register: vi.fn() },
      library: { components: {} },
    };
    admin.register(app as never);
    expect(listRichTextComponents().map((d) => d.name)).toStrictEqual(['button']);
  });

  it('exposes the registry through the plugin apis', () => {
    const app = {
      registerPlugin: vi.fn(),
      customFields: { register: vi.fn() },
      library: { components: {} },
    };
    admin.register(app as never);
    const apis = app.registerPlugin.mock.calls[0][0].apis;
    expect(apis.richTextComponents.register).toBe(registerRichTextComponent);
    expect(apis.richTextComponents.define).toBe(defineRichTextComponent);
    expect(apis.richTextComponents.list).toBe(listRichTextComponents);
  });

  it('still registers the custom field', () => {
    const app = {
      registerPlugin: vi.fn(),
      customFields: { register: vi.fn() },
      library: { components: {} },
    };
    admin.register(app as never);
    expect(app.customFields.register).toHaveBeenCalledTimes(1);
  });
});
