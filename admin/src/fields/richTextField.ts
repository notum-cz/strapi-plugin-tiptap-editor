import { Paragraph } from '@strapi/icons';
import { RICH_TEXT_FIELD_NAME } from '../../../shared/fields';
import { PLUGIN_ID } from '../../../shared/pluginId';

export const richTextField = {
  name: RICH_TEXT_FIELD_NAME,
  pluginId: PLUGIN_ID,
  type: 'string',
  intlLabel: {
    id: 'tiptap-editor.richText.label',
    defaultMessage: 'Rich Text (Tiptap)',
  },
  intlDescription: {
    id: 'tiptap-editor.richText.description',
    defaultMessage: 'Use this field to create formatted text via Tiptap editor.',
  },
  icon: Paragraph as any,
  components: {
    Input: async () => import('../components/RichTextInput').then((m) => ({ default: m.default })),
  },
  options: {
    advanced: [
      {
        sectionTitle: {
          id: 'tiptap-editor.section.preset.label',
          defaultMessage: 'Preset',
        },
        items: [
          {
            name: 'options.preset',
            type: 'preset-select',
            intlLabel: {
              id: 'tiptap-editor.preset.label',
              defaultMessage: 'Editor Preset',
            },
            description: {
              id: 'tiptap-editor.preset.description',
              defaultMessage: 'Select the preset that configures available editing tools.',
            },
          },
        ],
      },
    ],
  },
} as const;
