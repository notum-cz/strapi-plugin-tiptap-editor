import Image from '@tiptap/extension-image';

export const StrapiImage = Image.extend({
  addAttributes() {
    return {
      ...(this as any).parent?.(),
      'data-asset-id': {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const raw = element.getAttribute('data-asset-id');
          if (raw === null) return null;
          const parsed = parseInt(raw, 10);
          return isNaN(parsed) ? null : parsed;
        },
        renderHTML: (attributes: Record<string, unknown>) => {
          const id = attributes['data-asset-id'];
          if (id === null || id === undefined) return {};
          return { 'data-asset-id': String(id) };
        },
      },
      'data-align': {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-align') ?? null,
        renderHTML: (attributes: Record<string, unknown>) => {
          const align = attributes['data-align'];
          if (!align) return {};
          return { 'data-align': align };
        },
      },
    };
  },
});
