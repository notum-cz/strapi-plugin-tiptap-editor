import { Link as LinkIcon } from '@strapi/icons';
import { buttonSchema, type ButtonVariant } from '../../../shared/src/components/button';
import { defineRichTextComponent } from '../registry/richTextComponents';

export type ButtonAttrs = {
  label: string;
  href: string;
  variant: ButtonVariant;
  openInNewTab: boolean;
};

export const buttonComponent = defineRichTextComponent<ButtonAttrs>({
  ...buttonSchema,
  label: { id: 'tiptap-editor.components.button.label', defaultMessage: 'Button' },
  icon: <LinkIcon />,
});
