import { Paragraph } from '@strapi/icons';
import { RICH_TEXT_FIELD_NAME } from '../../../shared/fields';
import { PLUGIN_ID } from '../../../shared/pluginId';
import { ComponentType } from 'react';

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
  icon: Paragraph as ComponentType<any>,
  components: {
    Input: async () => import('../components/RichTextInput').then((m) => ({ default: m.default })),
  },
  options: {
    base: [
      {
        sectionTitle: {
          id: 'tiptap-editor.section.format.label',
          defaultMessage: 'Output & Content Format',
        },
        items: [
          {
            name: 'options.outputFormat',
            type: 'select',
            intlLabel: {
              id: 'tiptap-editor.outputFormat.label',
              defaultMessage: 'Output Format',
            },
            description: {
              id: 'tiptap-editor.outputFormat.description',
              defaultMessage: 'Select how editor content is serialized (ProseMirror JSON recommended).',
            },
            options: [
              {
                key: 'json',
                value: 'json',
                metadatas: {
                  intlLabel: {
                    id: 'tiptap-editor.outputFormat.json',
                    defaultMessage: 'ProseMirror JSON (Recommended)',
                  },
                },
              },
              {
                key: 'html',
                value: 'html',
                metadatas: {
                  intlLabel: {
                    id: 'tiptap-editor.outputFormat.html',
                    defaultMessage: 'HTML',
                  },
                },
              },
              {
                key: 'markdown',
                value: 'markdown',
                metadatas: {
                  intlLabel: {
                    id: 'tiptap-editor.outputFormat.markdown',
                    defaultMessage: 'Markdown',
                  },
                },
              },
            ],
          },
        ],
      },
    ],
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
          {
            name: 'options.characterLimit',
            type: 'number',
            intlLabel: {
              id: 'tiptap-editor.characterLimit.label',
              defaultMessage: 'Character Limit',
            },
            description: {
              id: 'tiptap-editor.characterLimit.description',
              defaultMessage: 'Optional maximum number of characters allowed in this field.',
            },
          },
          {
            name: 'options.placeholder',
            type: 'text',
            intlLabel: {
              id: 'tiptap-editor.placeholder.label',
              defaultMessage: 'Placeholder Text',
            },
            description: {
              id: 'tiptap-editor.placeholder.description',
              defaultMessage: 'Optional placeholder displayed when the editor is empty.',
            },
          },
        ],
      },
    ],
  },
} as const;
