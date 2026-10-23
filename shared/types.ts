// shared/types.ts

// ─── Option types ───────────────────────────────────────────────────────────

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type TiptapOutputFormat = 'json' | 'html' | 'markdown';

export type LinkConfig = {
  openOnClick?: boolean;
  HTMLAttributes?: Record<string, string>;
  allowInternalLinks?: boolean;
};

export type TableConfig = {
  resizable?: boolean;
  allowCellBackgroundColor?: boolean;
  allowCaption?: boolean;
};

export type TextAlignConfig = {
  types?: string[];
  alignments?: Array<'left' | 'center' | 'right' | 'justify'>;
};

export type HeadingConfig = {
  levels?: HeadingLevel[];
  autoSlugId?: boolean;
};

export type FontFamilyConfig = {
  fonts?: Array<{ label: string; value: string }>;
};

export type FontSizeConfig = {
  sizes?: string[];
};

export type LineHeightConfig = {
  heights?: string[];
};

export type CharacterCountConfig = {
  limit?: number | null;
  wordsPerMinute?: number;
};

export type IframeConfig = {
  allowedDomains?: string[];
  allowFullscreen?: boolean;
};

export type InformationPaneConfig = {
  variants?: Array<'info' | 'warning' | 'success' | 'danger' | 'neutral' | 'tip'>;
};

// ─── Theme types ─────────────────────────────────────────────────────────────

export type ThemeColorEntry = {
  label: string;
  color: string;
};

type ThemeStyleSource =
  | {
      /** A browser-fetchable URL for an external stylesheet */
      stylesheet?: string;
      css?: never;
    }
  | {
      stylesheet?: never;
      /** Inline CSS content to inject via a <style> tag */
      css?: string;
    };

export type TiptapThemeConfig = {
  colors?: ThemeColorEntry[];
} & ThemeStyleSource;

// ─── Core types ──────────────────────────────────────────────────────────────

export interface TiptapPresetConfig {
  bold?: boolean | Record<string, unknown>;
  italic?: boolean | Record<string, unknown>;
  strike?: boolean | Record<string, unknown>;
  underline?: boolean | Record<string, unknown>;
  code?: boolean | Record<string, unknown>;
  codeBlock?: boolean | Record<string, unknown>;
  blockquote?: boolean | Record<string, unknown>;
  bulletList?: boolean | Record<string, unknown>;
  orderedList?: boolean | Record<string, unknown>;
  hardBreak?: boolean | Record<string, unknown>;
  horizontalRule?: boolean | Record<string, unknown>;
  history?: boolean | Record<string, unknown>;
  heading?: boolean | HeadingConfig;
  link?: boolean | LinkConfig;
  table?: boolean | TableConfig;
  textAlign?: boolean | TextAlignConfig;
  superscript?: boolean | Record<string, unknown>;
  subscript?: boolean | Record<string, unknown>;
  textColor?: boolean;
  highlightColor?: boolean;
  mediaLibrary?: boolean | Record<string, unknown>;
  // Edifice IO & Advanced Typography
  fontFamily?: boolean | FontFamilyConfig;
  fontSize?: boolean | FontSizeConfig;
  lineHeight?: boolean | LineHeightConfig;
  clearFormatting?: boolean | Record<string, unknown>;
  typography?: boolean | Record<string, unknown>;
  leadParagraph?: boolean | Record<string, unknown>;
  language?: boolean | Record<string, unknown>;
  abbr?: boolean | Record<string, unknown>;
  // Edifice IO Multimedia & Embeds
  video?: boolean | Record<string, unknown>;
  audio?: boolean | Record<string, unknown>;
  attachment?: boolean | Record<string, unknown>;
  iframe?: boolean | IframeConfig;
  // Internal Content Linker & Bookmarks
  linker?: boolean | Record<string, unknown>;
  // Rich Callouts, Structured Panes & Layouts
  informationPane?: boolean | InformationPaneConfig;
  accordion?: boolean | Record<string, unknown>;
  conversationHistory?: boolean | Record<string, unknown>;
  columns?: boolean | Record<string, unknown>;
  taskList?: boolean | Record<string, unknown>;
  mathematics?: boolean | Record<string, unknown>;
  emoji?: boolean | Record<string, unknown>;
  slashCommands?: boolean | Record<string, unknown>;
  pageBreak?: boolean | Record<string, unknown>;
  tableOfContents?: boolean | Record<string, unknown>;
  // Assistive & Accessibility Tools (Edifice IO + WCAG)
  speechToText?: boolean | Record<string, unknown>;
  textToSpeech?: boolean | Record<string, unknown>;
  characterCount?: boolean | CharacterCountConfig;
  fullscreen?: boolean | Record<string, unknown>;
}

export interface TiptapRuntimeSettings {
  defaultPreset?: string;
  defaultOutputFormat?: TiptapOutputFormat;
  allowedIframeDomains?: string[];
  enableRelationalSync?: boolean;
  presetOverrides?: Record<string, Partial<TiptapPresetConfig>>;
}

export interface TiptapPluginConfig {
  presets: Record<string, TiptapPresetConfig>;
  theme?: TiptapThemeConfig;
  settings?: TiptapRuntimeSettings;
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const PRESET_FEATURE_KEYS: Array<keyof TiptapPresetConfig> = [
  'bold',
  'italic',
  'strike',
  'underline',
  'code',
  'codeBlock',
  'blockquote',
  'bulletList',
  'orderedList',
  'hardBreak',
  'horizontalRule',
  'history',
  'heading',
  'link',
  'table',
  'textAlign',
  'superscript',
  'subscript',
  'textColor',
  'highlightColor',
  'mediaLibrary',
  'fontFamily',
  'fontSize',
  'lineHeight',
  'clearFormatting',
  'typography',
  'leadParagraph',
  'language',
  'abbr',
  'video',
  'audio',
  'attachment',
  'iframe',
  'linker',
  'informationPane',
  'accordion',
  'conversationHistory',
  'columns',
  'taskList',
  'mathematics',
  'emoji',
  'slashCommands',
  'pageBreak',
  'tableOfContents',
  'speechToText',
  'textToSpeech',
  'characterCount',
  'fullscreen',
];

// Fallback for unconfigured fields — deliberately minimal to prompt developers to configure
export const MINIMAL_PRESET_CONFIG: TiptapPresetConfig = {
  bold: true,
  italic: true,
};

export const DEFAULT_PRESET_CONFIG: TiptapPresetConfig = {
  bold: true,
  italic: true,
  underline: true,
  strike: true,
  code: true,
  codeBlock: true,
  blockquote: true,
  bulletList: true,
  orderedList: true,
  hardBreak: true,
  horizontalRule: true,
  history: true,
  heading: { levels: [1, 2, 3, 4, 5, 6], autoSlugId: true },
  link: { openOnClick: false, allowInternalLinks: true },
  table: { resizable: true, allowCellBackgroundColor: true, allowCaption: true },
  textAlign: { types: ['heading', 'paragraph'], alignments: ['left', 'center', 'right', 'justify'] },
  superscript: true,
  subscript: true,
  textColor: true,
  highlightColor: true,
  mediaLibrary: true,
  clearFormatting: true,
  characterCount: true,
  fullscreen: true,
};

export const FULL_PRESET_CONFIG: TiptapPresetConfig = PRESET_FEATURE_KEYS.reduce(
  (acc, key) => {
    acc[key] = true;
    return acc;
  },
  {} as Record<keyof TiptapPresetConfig, boolean>
);

export const BUILT_IN_PRESETS: Record<string, TiptapPresetConfig> = {
  minimal: MINIMAL_PRESET_CONFIG,
  default: DEFAULT_PRESET_CONFIG,
  full: FULL_PRESET_CONFIG,
  edifice: { ...FULL_PRESET_CONFIG },
};

export const DEFAULT_RUNTIME_SETTINGS: Required<TiptapRuntimeSettings> = {
  defaultPreset: 'default',
  defaultOutputFormat: 'json',
  allowedIframeDomains: [],
  enableRelationalSync: true,
  presetOverrides: {},
};

// ─── Internal helpers ────────────────────────────────────────────────────────

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

// ─── Utility functions ───────────────────────────────────────────────────────

/**
 * Returns true when a preset feature value is enabled.
 * undefined (absent key) returns false — a preset defines what's ON, everything else is OFF.
 */
export const isFeatureEnabled = (value: TiptapPresetConfig[keyof TiptapPresetConfig]): boolean => {
  if (value === undefined) {
    return false; // absent key = disabled
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (!isPlainObject(value)) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  if (typeof obj.enabled === 'boolean') {
    return obj.enabled;
  }
  if (typeof obj.disabled === 'boolean') {
    return !obj.disabled;
  }
  return true;
};

/**
 * Returns the effective options for a feature.
 * - false → null (feature explicitly disabled, no options)
 * - true | undefined → defaults (feature enabled with default options)
 * - object → merged with defaults (feature enabled with custom options)
 *
 * NOTE: false returns null — DIVERGES from dist where false returns defaults.
 */
export const getFeatureOptions = <T extends Record<string, unknown>>(
  value: boolean | T | undefined,
  defaults: T
): T | null => {
  if (value === false) {
    return null; // TYPES-05: explicitly disabled
  }
  if (!isPlainObject(value)) {
    return defaults; // true or undefined: return defaults
  }
  const { enabled: _e, disabled: _d, ...rest } = value as Record<string, unknown>;
  return { ...defaults, ...rest } as T;
};
