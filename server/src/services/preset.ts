import type { Core } from '@strapi/strapi';
import {
  BUILT_IN_PRESETS,
  TiptapPluginConfig,
  TiptapPresetConfig,
} from '../../../shared/types';

const DEFAULT_CONFIG: TiptapPluginConfig = { presets: {} };

/**
 * Creates the preset configuration service for resolving built-in, file-configured,
 * and runtime-overridden Tiptap editor presets.
 */
const createPresetService = ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Returns the raw plugin configuration from Strapi config.
   */
  getConfig(): TiptapPluginConfig {
    return strapi.config.get('plugin::tiptap-editor', DEFAULT_CONFIG) as TiptapPluginConfig;
  },

  /**
   * Lists preset names explicitly defined in the plugin configuration file.
   */
  listPresetNames(): string[] {
    return Object.keys(this.getConfig().presets || {});
  },

  /**
   * Lists all available preset names combining custom presets and built-in presets.
   */
  listAvailablePresets(): string[] {
    const configured = Object.keys(this.getConfig().presets || {});
    const builtIn = Object.keys(BUILT_IN_PRESETS);
    return Array.from(new Set([...configured, ...builtIn]));
  },

  /**
   * Returns a file-configured preset by name, or `null` if not found.
   */
  getPreset(name: string): TiptapPresetConfig | null {
    const presets = this.getConfig().presets || {};
    return Object.prototype.hasOwnProperty.call(presets, name) ? presets[name] : null;
  },

  /**
   * Resolves the effective preset configuration by merging the base preset
   * with runtime overrides and `allowedIframeDomains` from the Strapi core-store.
   */
  async getEffectivePreset(name: string): Promise<TiptapPresetConfig | null> {
    const presets = this.getConfig().presets || {};
    const configuredPreset = Object.prototype.hasOwnProperty.call(presets, name)
      ? presets[name]
      : null;
    const basePreset =
      configuredPreset ??
      (Object.prototype.hasOwnProperty.call(BUILT_IN_PRESETS, name)
        ? BUILT_IN_PRESETS[name]
        : null);
    if (!basePreset) return null;

    try {
      const settingsService = strapi.plugin?.('tiptap-editor')?.service?.('settings') as
        | {
            getSettings?: () => Promise<{
              presetOverrides?: Record<string, Partial<TiptapPresetConfig>>;
              allowedIframeDomains?: string[];
            }>;
          }
        | undefined;
      if (settingsService && typeof settingsService.getSettings === 'function') {
        const runtime = await settingsService.getSettings();
        const overridesMap = runtime?.presetOverrides;
        const override =
          overridesMap && Object.prototype.hasOwnProperty.call(overridesMap, name)
            ? overridesMap[name]
            : undefined;
        const merged: TiptapPresetConfig =
          override && typeof override === 'object' ? { ...basePreset, ...override } : { ...basePreset };

        if (merged.iframe && Array.isArray(runtime?.allowedIframeDomains)) {
          const existingIframeOpts =
            typeof merged.iframe === 'object' && merged.iframe !== null ? merged.iframe : {};
          merged.iframe = {
            ...existingIframeOpts,
            allowedDomains: existingIframeOpts.allowedDomains ?? runtime.allowedIframeDomains,
          };
        }

        return merged;
      }
    } catch (error) {
      strapi?.log?.warn?.(
        `[tiptap-editor] Failed to apply runtime settings to preset "${name}": ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }

    return basePreset;
  },
});

export default createPresetService;
