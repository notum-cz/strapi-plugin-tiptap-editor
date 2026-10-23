import { Extensions } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import Underline from '@tiptap/extension-underline';
import { TableKit, TableCell, TableHeader } from '@tiptap/extension-table';
import TextAlign from '@tiptap/extension-text-align';
import { CharacterCount, Gapcursor, Placeholder } from '@tiptap/extensions';
import {
  TextStyle,
  Color,
  FontFamily,
  FontSize,
  LineHeight,
} from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import { BaseHeadingWithSEOTag } from '../extensions/Heading';
import { PasteStripper } from '../extensions/PasteStripper';
import { StrapiImage } from '../extensions/Image';
import { StrapiVideo } from '../extensions/Video';
import { StrapiAudio } from '../extensions/Audio';
import { StrapiAttachment } from '../extensions/Attachment';
import { StrapiIframe } from '../extensions/Iframe';
import { StrapiLinker } from '../extensions/Linker';
import { InformationPane } from '../extensions/InformationPane';
import {
  DetailsNode,
  DetailsSummaryNode,
  DetailsContentNode,
  ConversationHistoryNode,
  LayoutContainerNode,
  LayoutColumnNode,
  TaskListNode,
  TaskItemNode,
  PageBreakNode,
  TableOfContentsNode,
} from '../extensions/StructuredBlocks';
import { MathematicsNode } from '../extensions/Mathematics';
import { EmojiShortcodeExtension } from '../extensions/EmojiPicker';
import { SmartTypographyExtension } from '../extensions/TypographyControls';
import { LeadParagraph, LanguageMark, AbbrMark } from '../extensions/SemanticMarks';
import { TiptapPresetConfig, isFeatureEnabled, getFeatureOptions } from '../../../shared/types';

// Custom TableCell & TableHeader with Edifice IO backgroundColor support
const CustomTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...(this as any).parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: (el: HTMLElement) =>
          el.getAttribute('data-background-color') || el.style?.backgroundColor || null,
        renderHTML: (attrs: Record<string, unknown>) => {
          if (!attrs.backgroundColor) return {};
          return {
            'data-background-color': String(attrs.backgroundColor),
            style: `background-color: ${String(attrs.backgroundColor)}`,
          };
        },
      },
    };
  },
});

const CustomTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...(this as any).parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: (el: HTMLElement) =>
          el.getAttribute('data-background-color') || el.style?.backgroundColor || null,
        renderHTML: (attrs: Record<string, unknown>) => {
          if (!attrs.backgroundColor) return {};
          return {
            'data-background-color': String(attrs.backgroundColor),
            style: `background-color: ${String(attrs.backgroundColor)}`,
          };
        },
      },
    };
  },
});

/**
 * Converts a preset feature value to StarterKit's expected configuration format
 * (`false` to disable the sub-extension, or an options object to enable with defaults).
 */
const starterKitFeatureValue = (
  value: TiptapPresetConfig[keyof TiptapPresetConfig]
): false | Record<string, unknown> => {
  if (!isFeatureEnabled(value)) {
    return false;
  }
  return getFeatureOptions(value, {}) ?? {};
};

export interface BuildExtensionsOptions {
  characterLimit?: number;
  placeholder?: string;
}

/**
 * Builds the array of TipTap extensions for a given preset configuration and field options.
 * Ensures Zero-Data-Loss schema preservation for custom blocks, media nodes, and semantic marks.
 */
export function buildExtensions(
  config: TiptapPresetConfig,
  options?: BuildExtensionsOptions
): Extensions {
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
      : (() => {
          const { allowInternalLinks, ...rest } =
            (getFeatureOptions(config.link, { allowInternalLinks: true }) as {
              allowInternalLinks?: boolean;
              [key: string]: unknown;
            }) ?? {};
          return {
            openOnClick: false,
            ...rest,
            ...(allowInternalLinks
              ? { protocols: [{ scheme: 'strapi', optionalSlashes: false }] }
              : {}),
          };
        })(),
  };

  const extensions: Extensions = [StarterKit.configure(starterKitConfig)];

  if (isFeatureEnabled(config.heading)) {
    const headingConfig = getFeatureOptions(config.heading, {
      levels: [1, 2, 3, 4, 5, 6] as const,
      autoSlugId: true,
    });
    const levels = headingConfig?.levels || [1, 2, 3, 4, 5, 6];
    extensions.push(
      BaseHeadingWithSEOTag.configure({
        levels,
        autoSlugId: (headingConfig as { autoSlugId?: boolean })?.autoSlugId ?? true,
      } as any)
    );
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

  // Zero-Data-Loss Table schema (always registered so existing tables and cell colors are preserved)
  const tableOptions = isFeatureEnabled(config.table) ? getFeatureOptions(config.table, {}) : {};
  extensions.push(
    TableKit.configure({
      table: {
        resizable: isFeatureEnabled(config.table),
        ...tableOptions,
      },
      tableCell: false,
      tableHeader: false,
    }),
    CustomTableCell,
    CustomTableHeader
  );

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

  const needsTextStyle =
    isFeatureEnabled(config.textColor) ||
    isFeatureEnabled(config.highlightColor) ||
    isFeatureEnabled(config.fontFamily) ||
    isFeatureEnabled(config.fontSize) ||
    isFeatureEnabled(config.lineHeight);

  if (needsTextStyle) {
    extensions.push(TextStyle);
    extensions.push(PasteStripper);
  }
  if (isFeatureEnabled(config.textColor)) {
    extensions.push(Color);
  }
  if (isFeatureEnabled(config.highlightColor)) {
    extensions.push(Highlight.configure({ multicolor: true }));
  }
  if (isFeatureEnabled(config.fontFamily)) {
    extensions.push(FontFamily);
  }
  if (isFeatureEnabled(config.fontSize)) {
    extensions.push(FontSize);
  }
  if (isFeatureEnabled(config.lineHeight)) {
    extensions.push(LineHeight);
  }

  // Zero-Data-Loss Media Library Image extension
  if (isFeatureEnabled(config.mediaLibrary)) {
    const mediaOpts = getFeatureOptions(config.mediaLibrary, {});
    extensions.push(StrapiImage.configure(mediaOpts ?? {}));
  } else {
    extensions.push(StrapiImage.configure({ enableContentCheck: true }));
  }

  // Zero-Data-Loss Edifice IO Multimedia & Rich Nodes
  if (isFeatureEnabled(config.video)) {
    extensions.push(StrapiVideo.configure({ enableContentCheck: false }));
  } else {
    extensions.push(StrapiVideo.configure({ enableContentCheck: true }));
  }

  if (isFeatureEnabled(config.audio)) {
    extensions.push(StrapiAudio.configure({ enableContentCheck: false }));
  } else {
    extensions.push(StrapiAudio.configure({ enableContentCheck: true }));
  }

  if (isFeatureEnabled(config.attachment)) {
    extensions.push(StrapiAttachment.configure({ enableContentCheck: false }));
  } else {
    extensions.push(StrapiAttachment.configure({ enableContentCheck: true }));
  }

  if (isFeatureEnabled(config.iframe)) {
    const iframeOpts = getFeatureOptions(config.iframe, { allowedDomains: [] });
    extensions.push(
      StrapiIframe.configure({
        enableContentCheck: false,
        allowedDomains: iframeOpts?.allowedDomains,
      })
    );
  } else {
    extensions.push(StrapiIframe.configure({ enableContentCheck: true }));
  }

  if (isFeatureEnabled(config.linker)) {
    extensions.push(StrapiLinker.configure({ enableContentCheck: false }));
  } else {
    extensions.push(StrapiLinker.configure({ enableContentCheck: true }));
  }

  if (isFeatureEnabled(config.informationPane)) {
    extensions.push(InformationPane.configure({ enableContentCheck: false }));
  } else {
    extensions.push(InformationPane.configure({ enableContentCheck: true }));
  }

  if (isFeatureEnabled(config.mathematics)) {
    extensions.push(MathematicsNode.configure({ enableContentCheck: false }));
  } else {
    extensions.push(MathematicsNode.configure({ enableContentCheck: true }));
  }

  // Schema-only: always registered so stored content round-trips without data loss
  extensions.push(
    LeadParagraph,
    LanguageMark,
    AbbrMark,
    DetailsNode,
    DetailsSummaryNode,
    DetailsContentNode,
    ConversationHistoryNode,
    LayoutContainerNode,
    LayoutColumnNode,
    TaskListNode,
    TaskItemNode,
    PageBreakNode,
    TableOfContentsNode
  );

  // Input-rule extensions: gated by preset config
  if (isFeatureEnabled(config.typography)) {
    extensions.push(SmartTypographyExtension);
  }
  if (isFeatureEnabled(config.emoji)) {
    extensions.push(EmojiShortcodeExtension);
  }

  const ccEnabled =
    config.characterCount === undefined || isFeatureEnabled(config.characterCount);
  const ccOpts = ccEnabled ? getFeatureOptions(config.characterCount, { limit: null }) : null;
  const effectiveCharLimit =
    options?.characterLimit && options.characterLimit > 0
      ? options.characterLimit
      : ccOpts?.limit ?? null;

  if (ccEnabled || (effectiveCharLimit && effectiveCharLimit > 0)) {
    extensions.push(CharacterCount.configure({ limit: effectiveCharLimit }));
  }

  if (options?.placeholder && options.placeholder.trim()) {
    extensions.push(Placeholder.configure({ placeholder: options.placeholder.trim() }));
  }

  extensions.push(Gapcursor);

  return extensions;
}
