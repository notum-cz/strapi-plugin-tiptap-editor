import type { RichTextComponentSchema } from './types';

export const BUTTON_VARIANTS = ['primary', 'secondary', 'link'] as const;
export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];

const VARIANT_LABELS: Record<ButtonVariant, string> = {
  primary: 'Primary',
  secondary: 'Secondary',
  link: 'Link',
};

export const buttonSchema: RichTextComponentSchema = {
  name: 'button',
  label: 'Button',
  attributes: {
    label: { default: '', form: { type: 'text', label: 'Label', required: true } },
    href: {
      default: '',
      form: { type: 'url', label: 'URL', required: true, placeholder: 'https://example.com' },
    },
    variant: {
      default: 'primary',
      form: {
        type: 'select',
        label: 'Variant',
        options: BUTTON_VARIANTS.map((value) => ({ value, label: VARIANT_LABELS[value] })),
      },
    },
    openInNewTab: { default: false, form: { type: 'boolean', label: 'Open in new tab' } },
  },
};
