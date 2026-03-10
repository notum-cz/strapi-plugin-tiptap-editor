import { useFetchClient } from '@strapi/strapi/admin';
import { useState, useEffect, useMemo } from 'react';
import {
  TiptapPresetConfig,
  MINIMAL_PRESET_CONFIG,
} from '../../../shared/types';

export type PresetConfigResult = {
  config: TiptapPresetConfig | null;
  isLoading: boolean;
};

export function usePresetConfig(presetName?: string): PresetConfigResult {
  const { get } = useFetchClient();
  const normalizedPresetName = useMemo(
    () => presetName?.trim() || undefined,
    [presetName]
  );

  const [config, setConfig] = useState<TiptapPresetConfig | null>(
    normalizedPresetName ? null : MINIMAL_PRESET_CONFIG
  );
  const [isLoading, setIsLoading] = useState(Boolean(normalizedPresetName));

  useEffect(() => {
    let mounted = true;

    if (!normalizedPresetName) {
      setConfig(MINIMAL_PRESET_CONFIG);
      setIsLoading(false);
      return;
    }

    const fetchPreset = async () => {
      setIsLoading(true);
      try {
        const response = await get(
          `/api/tiptap-editor/presets/${normalizedPresetName}`
        );
        if (!mounted) return;
        setConfig(response.data || MINIMAL_PRESET_CONFIG);
      } catch (error) {
        console.warn(
          '[TiptapEditor] Failed to fetch preset config:',
          error
        );
        if (!mounted) return;
        setConfig(MINIMAL_PRESET_CONFIG);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchPreset();
    return () => {
      mounted = false;
    };
  }, [get, normalizedPresetName]);

  return { config, isLoading };
}
