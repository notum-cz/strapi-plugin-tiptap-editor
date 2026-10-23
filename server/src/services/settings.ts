import type { Core } from '@strapi/strapi';
import {
  DEFAULT_RUNTIME_SETTINGS,
  PRESET_FEATURE_KEYS,
  TiptapOutputFormat,
  TiptapPresetConfig,
  TiptapRuntimeSettings,
} from '../../../shared/types';
import { SETTINGS_STORE_KEY } from '../bootstrap';

const VALID_OUTPUT_FORMATS = new Set<TiptapOutputFormat>(['json', 'html', 'markdown']);
const VALID_FEATURE_KEYS = new Set<string>(PRESET_FEATURE_KEYS);

/**
 * Checks whether a value is a non-null plain object.
 */
const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

/**
 * Creates the Tiptap runtime settings service backed by Strapi core-store.
 */
const createSettingsService = ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Returns the plugin-scoped Strapi core-store instance if available.
   */
  getStore() {
    if (typeof strapi?.store !== 'function') return null;
    return strapi.store({
      type: 'plugin',
      name: 'tiptap-editor',
    });
  },

  /**
   * Retrieves merged runtime settings (defaults + config/plugins.ts + core-store).
   */
  async getSettings(): Promise<Required<TiptapRuntimeSettings>> {
    const configSettings =
      (strapi?.config?.get?.('plugin::tiptap-editor.settings', {}) as TiptapRuntimeSettings) || {};
    const store = this.getStore();
    let stored: TiptapRuntimeSettings | null = null;
    if (store) {
      try {
        stored = (await store.get({ key: SETTINGS_STORE_KEY })) as TiptapRuntimeSettings | null;
      } catch {
        stored = null;
      }
    }

    return {
      ...DEFAULT_RUNTIME_SETTINGS,
      ...configSettings,
      ...(stored && isPlainObject(stored) ? stored : {}),
    };
  },

  /**
   * Validates and persists updated runtime settings in Strapi core-store.
   */
  async updateSettings(input: unknown): Promise<Required<TiptapRuntimeSettings>> {
    if (!isPlainObject(input)) {
      throw new Error('Settings payload must be a plain object');
    }

    const configSettings =
      (strapi?.config?.get?.('plugin::tiptap-editor.settings', {}) as TiptapRuntimeSettings) || {};
    const baseSettings: Required<TiptapRuntimeSettings> = {
      ...DEFAULT_RUNTIME_SETTINGS,
      ...configSettings,
    };

    const store = this.getStore();
    let existingStored: TiptapRuntimeSettings | null = null;
    if (store) {
      try {
        existingStored = (await store.get({
          key: SETTINGS_STORE_KEY,
        })) as TiptapRuntimeSettings | null;
      } catch {
        existingStored = null;
      }
    }

    const storedOverrides: TiptapRuntimeSettings =
      existingStored && isPlainObject(existingStored) ? { ...existingStored } : {};

    if (input.defaultPreset !== undefined) {
      if (typeof input.defaultPreset !== 'string' || !/^[\w-]+$/.test(input.defaultPreset.trim())) {
        throw new Error('Invalid defaultPreset value');
      }
      const nextPreset = input.defaultPreset.trim();
      if (nextPreset === baseSettings.defaultPreset) {
        delete storedOverrides.defaultPreset;
      } else {
        storedOverrides.defaultPreset = nextPreset;
      }
    }

    if (input.defaultOutputFormat !== undefined) {
      if (
        typeof input.defaultOutputFormat !== 'string' ||
        !VALID_OUTPUT_FORMATS.has(input.defaultOutputFormat as TiptapOutputFormat)
      ) {
        throw new Error('Invalid defaultOutputFormat value. Must be json, html, or markdown');
      }
      const nextFormat = input.defaultOutputFormat as TiptapOutputFormat;
      if (nextFormat === baseSettings.defaultOutputFormat) {
        delete storedOverrides.defaultOutputFormat;
      } else {
        storedOverrides.defaultOutputFormat = nextFormat;
      }
    }

    if (input.enableRelationalSync !== undefined) {
      if (typeof input.enableRelationalSync !== 'boolean') {
        throw new Error('enableRelationalSync must be a boolean');
      }
      if (input.enableRelationalSync === baseSettings.enableRelationalSync) {
        delete storedOverrides.enableRelationalSync;
      } else {
        storedOverrides.enableRelationalSync = input.enableRelationalSync;
      }
    }

    if (input.allowedIframeDomains !== undefined) {
      if (
        !Array.isArray(input.allowedIframeDomains) ||
        !input.allowedIframeDomains.every(
          (d) => typeof d === 'string' && /^[a-zA-Z0-9.-]+$/.test(d.trim())
        )
      ) {
        throw new Error('allowedIframeDomains must be an array of valid domain names');
      }
      const nextDomains = input.allowedIframeDomains.map((d) => d.trim().toLowerCase());
      if (JSON.stringify(nextDomains) === JSON.stringify(baseSettings.allowedIframeDomains)) {
        delete storedOverrides.allowedIframeDomains;
      } else {
        storedOverrides.allowedIframeDomains = nextDomains;
      }
    }

    if (input.presetOverrides !== undefined) {
      if (!isPlainObject(input.presetOverrides)) {
        throw new Error('presetOverrides must be a plain object');
      }
      const sanitizedOverrides: Record<string, Partial<TiptapPresetConfig>> = {};
      for (const [presetName, override] of Object.entries(input.presetOverrides)) {
        if (!/^[\w-]+$/.test(presetName) || !isPlainObject(override)) {
          throw new Error(`Invalid preset override for "${presetName}"`);
        }
        const cleanPreset: Partial<TiptapPresetConfig> = {};
        for (const [fKey, fVal] of Object.entries(override)) {
          if (!VALID_FEATURE_KEYS.has(fKey)) {
            throw new Error(`Unknown feature key "${fKey}" in presetOverrides.${presetName}`);
          }
          if (typeof fVal !== 'boolean' && !isPlainObject(fVal)) {
            throw new Error(`Invalid value for "${fKey}" in presetOverrides.${presetName}`);
          }
          (cleanPreset as Record<string, unknown>)[fKey] = fVal;
        }
        sanitizedOverrides[presetName] = cleanPreset;
      }
      if (JSON.stringify(sanitizedOverrides) === JSON.stringify(baseSettings.presetOverrides)) {
        delete storedOverrides.presetOverrides;
      } else {
        storedOverrides.presetOverrides = sanitizedOverrides;
      }
    }

    if (store) {
      await store.set({
        key: SETTINGS_STORE_KEY,
        value: storedOverrides,
      });
    }

    return {
      ...baseSettings,
      ...storedOverrides,
    };
  },
});

export default createSettingsService;
