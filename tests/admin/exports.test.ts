import { describe, it, expect, vi } from 'vitest';

// The admin entry pulls in the field and its editor, so the same stubs as register.test.ts apply.
vi.mock('../../admin/src/utils/themeCache', () => ({
  setThemeCache: vi.fn(),
  getThemeCache: vi.fn(() => null),
}));
vi.mock('@strapi/design-system', () => ({
  SingleSelect: 'SingleSelect',
  SingleSelectOption: 'SingleSelectOption',
  Tooltip: 'Tooltip',
  Button: 'Button',
}));
vi.mock('@strapi/strapi/admin', () => ({
  useNotification: vi.fn(),
  useFetchClient: vi.fn(() => ({ get: vi.fn() })),
}));
vi.mock('@strapi/icons', () => ({
  Paragraph: 'Paragraph',
  Link: 'Link',
}));
vi.mock('../../admin/src/components/Initializer', () => ({ Initializer: 'Initializer' }));
vi.mock('../../admin/src/components/PresetSelect', () => ({ PresetSelect: 'PresetSelect' }));
vi.mock('react', () => ({
  default: { createElement: vi.fn() },
  useState: vi.fn(() => [null, vi.fn()]),
  useEffect: vi.fn(),
  useRef: vi.fn((val: any) => ({ current: val })),
  forwardRef: vi.fn((fn: any) => fn),
}));

import * as admin from '../../admin/src/index';

describe('strapi-admin exports', () => {
  it('exposes the colour picker so host forms can offer the theme palette', () => {
    expect(typeof admin.ColorPickerPopover).toBe('function');
  });
});
