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

// resize/figure are validated below; inline/allowBase64/HTMLAttributes are passed
// straight through to @tiptap/extension-image's own options, same as before this
// validator existed — kept permissive so existing configs don't start failing to boot.
const MEDIA_LIBRARY_KEYS = new Set<string>([
  'resize',
  'figure',
  'inline',
  'allowBase64',
  'HTMLAttributes',
]);

const RESIZE_KEYS = new Set<string>([
  'enabled',
  'alwaysPreserveAspectRatio',
  'minWidth',
  'minHeight',
]);

const validateMediaLibraryConfig = (value: unknown, path: string): void => {
  if (typeof value === 'boolean' || value === undefined) return;
  if (!isPlainObject(value)) {
    throw new Error(`tiptap-editor ${path} must be a boolean or a plain object`);
  }

  for (const key of Object.keys(value)) {
    if (!MEDIA_LIBRARY_KEYS.has(key)) {
      throw new Error(
        `tiptap-editor ${path} has unknown key: "${key}". Allowed keys: ${[...MEDIA_LIBRARY_KEYS].join(', ')}`
      );
    }
  }

  const { figure, resize } = value as { figure?: unknown; resize?: unknown };

  if (figure !== undefined && typeof figure !== 'boolean') {
    throw new Error(`tiptap-editor ${path}.figure must be a boolean`);
  }

  if (resize !== undefined && typeof resize !== 'boolean') {
    if (!isPlainObject(resize)) {
      throw new Error(`tiptap-editor ${path}.resize must be a boolean or a plain object`);
    }
    for (const key of Object.keys(resize)) {
      if (!RESIZE_KEYS.has(key)) {
        throw new Error(
          `tiptap-editor ${path}.resize has unknown key: "${key}". Allowed keys: ${[...RESIZE_KEYS].join(', ')}`
        );
      }
    }
    const { enabled, alwaysPreserveAspectRatio, minWidth, minHeight } = resize as Record<
      string,
      unknown
    >;
    if (enabled !== undefined && typeof enabled !== 'boolean') {
      throw new Error(`tiptap-editor ${path}.resize.enabled must be a boolean`);
    }
    if (alwaysPreserveAspectRatio !== undefined && typeof alwaysPreserveAspectRatio !== 'boolean') {
      throw new Error(`tiptap-editor ${path}.resize.alwaysPreserveAspectRatio must be a boolean`);
    }
    if (minWidth !== undefined && typeof minWidth !== 'number') {
      throw new Error(`tiptap-editor ${path}.resize.minWidth must be a number`);
    }
    if (minHeight !== undefined && typeof minHeight !== 'number') {
      throw new Error(`tiptap-editor ${path}.resize.minHeight must be a number`);
    }
  }
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

        validateMediaLibraryConfig(
          presetConfig.mediaLibrary,
          `config.presets.${presetName}.mediaLibrary`
        );
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
