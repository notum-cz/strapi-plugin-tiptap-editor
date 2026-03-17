import {
  PRESET_FEATURE_KEYS,
  TiptapPluginConfig,
  TiptapPresetConfig,
} from '../../../shared/types';

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const FEATURE_KEYS = new Set(PRESET_FEATURE_KEYS);

const THEME_KEYS = new Set<string>(['colors', 'css', 'stylesheet']);

const COLOR_VALUE_RE =
  /^(#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})|rgba?\([^)]+\)|hsla?\([^)]+\)|var\(--[^)]+\))$/;

const isValidColorValue = (value: string): boolean => COLOR_VALUE_RE.test(value.trim());

const getInvalidKeys = (presetConfig: unknown): string[] => {
  if (!isPlainObject(presetConfig)) return [];
  return Object.keys(presetConfig).filter(
    (key) => !FEATURE_KEYS.has(key as keyof TiptapPresetConfig)
  );
};

const config = {
  default: {
    presets: {} as Record<string, TiptapPresetConfig>,
  },
  validator(pluginConfig: unknown): void {
    if (!isPlainObject(pluginConfig)) {
      throw new Error('tiptap-editor plugin config must be a plain object');
    }

    const typedConfig = pluginConfig as { presets?: unknown; theme?: unknown };
    const { presets, theme } = typedConfig;

    if (presets !== undefined) {
      if (!isPlainObject(presets)) {
        throw new Error('tiptap-editor config.presets must be a plain object');
      }

      const allInvalidKeys: string[] = [];
      for (const [presetName, presetConfig] of Object.entries(
        presets as Record<string, unknown>
      )) {
        if (!isPlainObject(presetConfig)) {
          throw new Error(
            `tiptap-editor config.presets.${presetName} must be a plain object, got ${typeof presetConfig}`
          );
        }
        const invalidKeys = getInvalidKeys(presetConfig);
        if (invalidKeys.length > 0) {
          allInvalidKeys.push(...invalidKeys);
        }
      }

      if (allInvalidKeys.length > 0) {
        throw new Error(
          `tiptap-editor config.presets contains invalid feature keys: ${allInvalidKeys.join(', ')}. ` +
            `Allowed keys: ${PRESET_FEATURE_KEYS.join(', ')}`
        );
      }
    }

    if (theme !== undefined) {
      if (!isPlainObject(theme)) {
        throw new Error('tiptap-editor config.theme must be a plain object');
      }

      for (const key of Object.keys(theme)) {
        if (!THEME_KEYS.has(key)) {
          throw new Error(
            `tiptap-editor config.theme has unknown key: "${key}". Allowed keys: colors, stylesheet`
          );
        }
      }

      const { stylesheet, css, colors } = theme as { stylesheet?: unknown; css?: unknown; colors?: unknown };

      if (stylesheet !== undefined && typeof stylesheet !== 'string') {
        throw new Error('tiptap-editor config.theme.stylesheet must be a string');
      }

      if (css !== undefined && typeof css !== 'string') {
        throw new Error('tiptap-editor config.theme.css must be a string');
      }

      if (stylesheet !== undefined && css !== undefined) {
        throw new Error('tiptap-editor config.theme: provide either "stylesheet" or "css", not both');
      }

      if (colors !== undefined) {
        if (!Array.isArray(colors)) {
          throw new Error('tiptap-editor config.theme.colors must be an array');
        }

        for (let i = 0; i < colors.length; i++) {
          const entry = colors[i];

          if (!isPlainObject(entry)) {
            throw new Error(
              `tiptap-editor config.theme.colors[${i}] must be a plain object`
            );
          }

          for (const key of Object.keys(entry)) {
            if (key !== 'label' && key !== 'color') {
              throw new Error(
                `tiptap-editor config.theme.colors[${i}] has unknown key: "${key}". Allowed keys: label, color`
              );
            }
          }

          if (typeof entry.label !== 'string') {
            throw new Error(
              `tiptap-editor config.theme.colors[${i}].label must be a string`
            );
          }

          if (typeof entry.color !== 'string') {
            throw new Error(
              `tiptap-editor config.theme.colors[${i}].color must be a string`
            );
          }

          if (!isValidColorValue(entry.color)) {
            throw new Error(
              `tiptap-editor config.theme.colors[${i}] has invalid color value: "${entry.color}". ` +
                `Accepted formats: hex (#rgb, #rrggbb, #rrggbbaa), rgb(), rgba(), hsl(), hsla(), var(--name)`
            );
          }
        }
      }
    }
  },
} satisfies { default: TiptapPluginConfig; validator: (config: unknown) => void };

export default config;
