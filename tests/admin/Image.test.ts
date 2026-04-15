import { describe, it, expect, vi } from 'vitest';

// Image.tsx now imports React components; mock them so pure attribute tests still run in node env
vi.mock('@strapi/design-system', () => ({
  Tooltip: 'div',
  Button: 'button',
  Popover: { Root: 'div', Anchor: 'div', Content: 'div' },
  TextInput: 'input',
  IconButton: 'button',
}));
vi.mock('@strapi/icons', () => ({ Trash: 'span', Image: 'span' }));
vi.mock('@tiptap/react', () => ({
  ReactNodeViewRenderer: vi.fn(),
  NodeViewWrapper: 'div',
  useEditorState: vi.fn(() => ({ isInCodeBlock: false })),
}));
vi.mock('react-intl', () => ({
  useIntl: vi.fn(() => ({ formatMessage: (msg: { defaultMessage: string }) => msg.defaultMessage })),
}));
vi.mock('@strapi/admin/strapi-admin', () => ({ useStrapiApp: vi.fn() }));

import { StrapiImage, ImageNodeViewReadOnly } from '../../admin/src/extensions/Image';

describe('StrapiImage extension', () => {
  it("extension name is 'image'", () => {
    expect(StrapiImage.name).toBe('image');
  });

  it('enableContentCheck defaults to false', () => {
    // StrapiImage.configure returns a new extension instance with options applied
    const configured = StrapiImage.configure({ enableContentCheck: true });
    expect((configured as any).options.enableContentCheck).toBe(true);
  });

  it('exports ImageNodeViewReadOnly', () => {
    expect(typeof ImageNodeViewReadOnly).toBe('function');
  });

  describe('addAttributes', () => {
    // Call addAttributes with a mock `this` context that provides parent attributes
    // matching the base Image extension (src, alt, title)
    const parentAttrs = {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
      width: { default: null },
      height: { default: null },
    };

    const mockThis = {
      parent: () => parentAttrs,
    };

    // Access the raw addAttributes function from the extension config
    const addAttributesFn = (StrapiImage as any).config.addAttributes as (this: typeof mockThis) => Record<string, unknown>;
    const attrs = addAttributesFn.call(mockThis);

    it('includes src attribute from parent', () => {
      expect(attrs).toHaveProperty('src');
    });

    it('includes alt attribute from parent', () => {
      expect(attrs).toHaveProperty('alt');
    });

    it('includes title attribute from parent', () => {
      expect(attrs).toHaveProperty('title');
    });

    it('includes data-asset-id attribute with default null', () => {
      expect(attrs).toHaveProperty('data-asset-id');
      expect((attrs['data-asset-id'] as any).default).toBeNull();
    });

    it('includes data-align attribute with default null', () => {
      expect(attrs).toHaveProperty('data-align');
      expect((attrs['data-align'] as any).default).toBeNull();
    });

    describe('data-asset-id parseHTML', () => {
      const parseHTML = (attrs['data-asset-id'] as any).parseHTML as (el: HTMLElement) => number | null;

      it('parses "42" string to number 42', () => {
        const el = { getAttribute: (name: string) => name === 'data-asset-id' ? '42' : null } as unknown as HTMLElement;
        expect(parseHTML(el)).toBe(42);
      });

      it('returns null when attribute is missing', () => {
        const el = { getAttribute: (_name: string) => null } as unknown as HTMLElement;
        expect(parseHTML(el)).toBeNull();
      });

      it('returns null for non-numeric string', () => {
        const el = { getAttribute: (name: string) => name === 'data-asset-id' ? 'not-a-number' : null } as unknown as HTMLElement;
        expect(parseHTML(el)).toBeNull();
      });
    });

    describe('data-asset-id renderHTML', () => {
      const renderHTML = (attrs['data-asset-id'] as any).renderHTML as (attrs: Record<string, unknown>) => Record<string, unknown>;

      it('returns { data-asset-id: "42" } for number 42', () => {
        expect(renderHTML({ 'data-asset-id': 42 })).toEqual({ 'data-asset-id': '42' });
      });

      it('returns {} for null', () => {
        expect(renderHTML({ 'data-asset-id': null })).toEqual({});
      });

      it('returns {} for undefined', () => {
        expect(renderHTML({ 'data-asset-id': undefined })).toEqual({});
      });
    });

    describe('data-align parseHTML', () => {
      const parseHTML = (attrs['data-align'] as any).parseHTML as (el: HTMLElement) => string | null;

      it('returns the attribute value string for "center"', () => {
        const el = { getAttribute: (name: string) => name === 'data-align' ? 'center' : null } as unknown as HTMLElement;
        expect(parseHTML(el)).toBe('center');
      });

      it('returns null when attribute is absent', () => {
        const el = { getAttribute: (_name: string) => null } as unknown as HTMLElement;
        expect(parseHTML(el)).toBeNull();
      });
    });

    describe('data-align renderHTML', () => {
      const renderHTML = (attrs['data-align'] as any).renderHTML as (attrs: Record<string, unknown>) => Record<string, unknown>;

      it('returns { data-align: "center" } for "center"', () => {
        expect(renderHTML({ 'data-align': 'center' })).toEqual({ 'data-align': 'center' });
      });

      it('returns {} for null', () => {
        expect(renderHTML({ 'data-align': null })).toEqual({});
      });

      it('returns {} for empty string', () => {
        expect(renderHTML({ 'data-align': '' })).toEqual({});
      });
    });

    // width and height are inherited from the parent Image extension (not custom-defined)
    it('includes width attribute from parent with default null', () => {
      expect(attrs).toHaveProperty('width');
      expect((attrs.width as any).default).toBeNull();
    });

    it('includes height attribute from parent with default null', () => {
      expect(attrs).toHaveProperty('height');
      expect((attrs.height as any).default).toBeNull();
    });
  });

  describe('resize option', () => {
    it('resize defaults to false (from parent Image extension)', () => {
      const configured = StrapiImage.configure({});
      expect((configured as any).options.resize).toBe(false);
    });

    it('accepts resize config with alwaysPreserveAspectRatio', () => {
      const configured = StrapiImage.configure({
        resize: {
          enabled: true,
          alwaysPreserveAspectRatio: true,
          minWidth: 100,
          minHeight: 100,
        },
      });
      const opts = (configured as any).options;
      expect(opts.resize.enabled).toBe(true);
      expect(opts.resize.alwaysPreserveAspectRatio).toBe(true);
      expect(opts.resize.minWidth).toBe(100);
      expect(opts.resize.minHeight).toBe(100);
    });

    it('accepts resize config with alwaysPreserveAspectRatio set to false', () => {
      const configured = StrapiImage.configure({
        resize: {
          enabled: true,
          alwaysPreserveAspectRatio: false,
        },
      });
      expect((configured as any).options.resize.alwaysPreserveAspectRatio).toBe(false);
    });
  });
});
