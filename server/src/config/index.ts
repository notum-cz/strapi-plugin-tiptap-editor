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

    const typedConfig = pluginConfig as { presets?: unknown };
    const { presets } = typedConfig;

    if (presets === undefined) {
      return; // presets key is optional
    }

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
  },
} satisfies { default: TiptapPluginConfig; validator: (config: unknown) => void };

export default config;
