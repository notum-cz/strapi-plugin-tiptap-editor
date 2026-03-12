// shared/types.ts

// ─── Option types ───────────────────────────────────────────────────────────

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type LinkConfig = {
  openOnClick?: boolean;
  HTMLAttributes?: Record<string, string>;
};

export type TableConfig = {
  resizable?: boolean;
};

export type TextAlignConfig = {
  types?: string[];
  alignments?: Array<'left' | 'center' | 'right' | 'justify'>;
};

export type HeadingConfig = {
  levels?: HeadingLevel[];
};

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
}

export interface TiptapPluginConfig {
  presets: Record<string, TiptapPresetConfig>;
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
];

// Fallback for unconfigured fields — deliberately minimal to prompt developers to configure
export const MINIMAL_PRESET_CONFIG: TiptapPresetConfig = {
  bold: true,
  italic: true,
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
