import { Extensions } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import Underline from '@tiptap/extension-underline';
import { TableKit } from '@tiptap/extension-table';
import TextAlign from '@tiptap/extension-text-align';
import { Gapcursor } from '@tiptap/extensions';
import { BaseHeadingWithSEOTag } from '../extensions/Heading';
import { StrapiImage } from '../extensions/Image';
import { TiptapPresetConfig, isFeatureEnabled, getFeatureOptions } from '../../../shared/types';

// Helper: converts a preset feature value to StarterKit's expected format
// false = disable the sub-extension, {} = enable with defaults
const starterKitFeatureValue = (
  value: TiptapPresetConfig[keyof TiptapPresetConfig]
): false | Record<string, unknown> => {
  if (!isFeatureEnabled(value)) {
    return false;
  }
  return getFeatureOptions(value, {}) ?? {};
};

export function buildExtensions(config: TiptapPresetConfig): Extensions {
  const starterKitConfig: Record<string, unknown> = {
    heading: false as const, // ALWAYS false — heading handled separately via BaseHeadingWithSEOTag
    bold: starterKitFeatureValue(config.bold),
    italic: starterKitFeatureValue(config.italic),
    strike: starterKitFeatureValue(config.strike),
    code: starterKitFeatureValue(config.code),
    codeBlock: starterKitFeatureValue(config.codeBlock),
    blockquote: starterKitFeatureValue(config.blockquote),
    bulletList: starterKitFeatureValue(config.bulletList),
    orderedList: starterKitFeatureValue(config.orderedList),
    hardBreak: starterKitFeatureValue(config.hardBreak),
    horizontalRule: starterKitFeatureValue(config.horizontalRule),
    history: starterKitFeatureValue(config.history),
    link: !isFeatureEnabled(config.link)
      ? false
      : {
          openOnClick: false,
          ...getFeatureOptions(config.link, {}),
        },
  };

  const extensions: Extensions = [StarterKit.configure(starterKitConfig)];

  if (isFeatureEnabled(config.heading)) {
    const headingConfig = getFeatureOptions(config.heading, {
      levels: [1, 2, 3, 4, 5, 6] as const,
    });
    const levels = headingConfig?.levels || [1, 2, 3, 4, 5, 6];
    extensions.push(BaseHeadingWithSEOTag.configure({ levels }));
  }

  if (isFeatureEnabled(config.underline)) {
    extensions.push(Underline);
  }

  if (isFeatureEnabled(config.superscript)) {
    extensions.push(Superscript);
  }

  if (isFeatureEnabled(config.subscript)) {
    extensions.push(Subscript);
  }

  if (isFeatureEnabled(config.table)) {
    extensions.push(
      TableKit.configure({
        table: {
          resizable: true,
          ...getFeatureOptions(config.table, {}),
        },
      })
    );
  }

  if (isFeatureEnabled(config.textAlign)) {
    const textAlignConfig = getFeatureOptions(config.textAlign, {
      types: ['heading', 'paragraph'],
      alignments: ['left', 'center', 'right', 'justify'],
    });
    extensions.push(
      TextAlign.configure({
        types: textAlignConfig?.types || ['heading', 'paragraph'],
        alignments: textAlignConfig?.alignments || ['left', 'center', 'right', 'justify'],
      })
    );
  }

  if (isFeatureEnabled(config.mediaLibrary)) {
    extensions.push(StrapiImage);
  } else {
    extensions.push(StrapiImage.configure({ enableContentCheck: true }));
  }

  extensions.push(Gapcursor);

  return extensions;
}
