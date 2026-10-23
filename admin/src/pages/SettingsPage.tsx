import { useState, useEffect } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';
import {
  Box,
  Flex,
  Typography,
  Button,
  Field,
  SingleSelect,
  SingleSelectOption,
  Checkbox,
  TextInput,
} from '@strapi/design-system';
import { useIntl } from 'react-intl';
import {
  PRESET_FEATURE_KEYS,
  DEFAULT_RUNTIME_SETTINGS,
  BUILT_IN_PRESETS,
  isFeatureEnabled,
  type TiptapRuntimeSettings,
  type TiptapOutputFormat,
} from '../../../shared/types';

/**
 * Global Administration Settings page for the Tiptap Editor plugin.
 * Allows authorized administrators to configure default preset, output format,
 * allowed iframe domains, relational sync, and per-preset feature overrides.
 */
export function SettingsPage() {
  const { formatMessage } = useIntl();
  const { get, put } = useFetchClient();
  const [settings, setSettings] = useState<TiptapRuntimeSettings>(DEFAULT_RUNTIME_SETTINGS);
  const [selectedPreset, setSelectedPreset] = useState<string>('default');
  const [iframeDomainsInput, setIframeDomainsInput] = useState<string>(
    DEFAULT_RUNTIME_SETTINGS.allowedIframeDomains.join(', ')
  );
  const [availablePresets, setAvailablePresets] = useState<string[]>(Object.keys(BUILT_IN_PRESETS));
  const [basePreset, setBasePreset] = useState<Record<string, unknown>>(
    (BUILT_IN_PRESETS.default ?? {}) as Record<string, unknown>
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    get('/tiptap-editor/settings')
      .then((res: { data?: TiptapRuntimeSettings }) => {
        if (!mounted || !res?.data) return;
        const loaded: TiptapRuntimeSettings = {
          ...DEFAULT_RUNTIME_SETTINGS,
          ...res.data,
          presetOverrides: res.data.presetOverrides || {},
        };
        setSettings(loaded);
        setIframeDomainsInput((loaded.allowedIframeDomains || []).join(', '));
      })
      .catch(() => {
        if (mounted) setLoadError(true);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [get]);

  useEffect(() => {
    let mounted = true;
    get('/tiptap-editor/presets?includeBuiltIn=true')
      .then((res: { data?: { presets?: string[] } }) => {
        if (mounted && Array.isArray(res?.data?.presets)) {
          setAvailablePresets(res.data.presets);
        }
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, [get]);

  useEffect(() => {
    let mounted = true;
    get(`/tiptap-editor/presets/${encodeURIComponent(selectedPreset)}`)
      .then((res: { data?: Record<string, unknown> }) => {
        if (mounted) {
          setBasePreset(
            res?.data ?? ((BUILT_IN_PRESETS[selectedPreset] ?? {}) as Record<string, unknown>)
          );
        }
      })
      .catch(() => {
        if (mounted) {
          setBasePreset((BUILT_IN_PRESETS[selectedPreset] ?? {}) as Record<string, unknown>);
        }
      });
    return () => {
      mounted = false;
    };
  }, [get, selectedPreset]);

  const currentPresetConfig = {
    ...(BUILT_IN_PRESETS[selectedPreset] ?? {}),
    ...basePreset,
    ...(settings.presetOverrides?.[selectedPreset] ?? {}),
  };

  const handleToggleFeature = (featureKey: keyof typeof currentPresetConfig, enabled: boolean) => {
    const baseValue = (basePreset as Record<string, unknown>)[featureKey as string];
    const nextValue =
      enabled && baseValue && typeof baseValue === 'object'
        ? { ...(baseValue as Record<string, unknown>), enabled: true }
        : enabled;
    setSettings((prev) => ({
      ...prev,
      presetOverrides: {
        ...prev.presetOverrides,
        [selectedPreset]: {
          ...(prev.presetOverrides?.[selectedPreset] ?? {}),
          [featureKey]: nextValue,
        },
      },
    }));
  };

  const handleSave = async () => {
    if (loadError) return;
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const domains = iframeDomainsInput
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean);
      const payload: TiptapRuntimeSettings = {
        ...settings,
        allowedIframeDomains: domains,
      };
      const res = await put('/tiptap-editor/settings', payload);
      if (res?.data) {
        setSettings({
          ...DEFAULT_RUNTIME_SETTINGS,
          ...res.data,
          presetOverrides: res.data.presetOverrides || {},
        });
      }
      setSaveMessage(
        formatMessage({
          id: 'tiptap-editor.settings.saveSuccess',
          defaultMessage: 'Settings saved successfully.',
        })
      );
    } catch {
      setSaveMessage(
        formatMessage({
          id: 'tiptap-editor.settings.saveError',
          defaultMessage: 'Failed to save settings.',
        })
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Box padding={8}>
        <Typography>
          {formatMessage({
            id: 'tiptap-editor.settings.loading',
            defaultMessage: 'Loading Tiptap Editor settings...',
          })}
        </Typography>
      </Box>
    );
  }

  const presetNames = Array.from(
    new Set([...availablePresets, ...Object.keys(settings.presetOverrides || {})])
  );

  return (
    <Box padding={8} background="neutral100">
      <Flex justifyContent="space-between" alignItems="center" marginBottom={6}>
        <Box>
          <Typography variant="alpha" tag="h1">
            {formatMessage({
              id: 'tiptap-editor.settings.pageTitle',
              defaultMessage: 'Tiptap Editor Settings',
            })}
          </Typography>
          <Typography variant="epsilon" textColor="neutral600">
            {formatMessage({
              id: 'tiptap-editor.settings.pageDescription',
              defaultMessage:
                'Configure global defaults, relational sync, iframe security, and toolbar presets.',
            })}
          </Typography>
        </Box>
        <Button onClick={handleSave} loading={isSaving} disabled={loadError}>
          {formatMessage({
            id: 'tiptap-editor.settings.saveButton',
            defaultMessage: 'Save Settings',
          })}
        </Button>
      </Flex>

      {loadError && (
        <Box
          role="alert"
          padding={3}
          marginBottom={4}
          background="danger100"
          borderColor="danger200"
          hasRadius
        >
          <Typography textColor="danger700">
            {formatMessage({
              id: 'tiptap-editor.settings.loadError',
              defaultMessage: 'Failed to load settings. Saving is disabled to prevent overwriting existing configuration.',
            })}
          </Typography>
        </Box>
      )}

      {saveMessage && (
        <Box
          role="status"
          padding={3}
          marginBottom={4}
          background="primary100"
          borderColor="primary200"
          hasRadius
        >
          <Typography textColor="primary700">{saveMessage}</Typography>
        </Box>
      )}

      <Box
        padding={6}
        marginBottom={6}
        background="neutral0"
        shadow="filterShadow"
        hasRadius
      >
        <Typography variant="delta" tag="h2">
          {formatMessage({
            id: 'tiptap-editor.settings.globalSectionTitle',
            defaultMessage: 'Global Configuration',
          })}
        </Typography>

        <Flex gap={6} wrap="wrap" marginTop={4}>
          <Box style={{ minWidth: '220px' }}>
            <Field.Root name="defaultPreset">
              <Field.Label>
                {formatMessage({
                  id: 'tiptap-editor.settings.defaultPresetLabel',
                  defaultMessage: 'Default Preset',
                })}
              </Field.Label>
              <SingleSelect
                value={settings.defaultPreset}
                onChange={(val: string | number) =>
                  setSettings((prev) => ({ ...prev, defaultPreset: String(val) }))
                }
              >
                {presetNames.map((name) => (
                  <SingleSelectOption key={name} value={name}>
                    {name}
                  </SingleSelectOption>
                ))}
              </SingleSelect>
            </Field.Root>
          </Box>

          <Box style={{ minWidth: '220px' }}>
            <Field.Root
              name="defaultOutputFormat"
              hint={formatMessage({
                id: 'tiptap-editor.settings.defaultOutputFormatWarning',
                defaultMessage:
                  'Warning: Changing this default changes the storage format of fields without an explicit outputFormat.',
              })}
            >
              <Field.Label>
                {formatMessage({
                  id: 'tiptap-editor.settings.defaultOutputFormatLabel',
                  defaultMessage: 'Default Output Format',
                })}
              </Field.Label>
              <SingleSelect
                value={settings.defaultOutputFormat}
                onChange={(val: string | number) =>
                  setSettings((prev) => ({
                    ...prev,
                    defaultOutputFormat: String(val) as TiptapOutputFormat,
                  }))
                }
              >
                <SingleSelectOption value="json">
                  {formatMessage({
                    id: 'tiptap-editor.settings.outputFormatJson',
                    defaultMessage: 'JSON (ProseMirror Document)',
                  })}
                </SingleSelectOption>
                <SingleSelectOption value="html">
                  {formatMessage({
                    id: 'tiptap-editor.settings.outputFormatHtml',
                    defaultMessage: 'HTML String',
                  })}
                </SingleSelectOption>
                <SingleSelectOption value="markdown">
                  {formatMessage({
                    id: 'tiptap-editor.settings.outputFormatMarkdown',
                    defaultMessage: 'Markdown String',
                  })}
                </SingleSelectOption>
              </SingleSelect>
              <Field.Hint />
            </Field.Root>
          </Box>

          <Box style={{ minWidth: '320px', flex: 1 }}>
            <Field.Root name="allowedIframeDomains">
              <Field.Label>
                {formatMessage({
                  id: 'tiptap-editor.settings.allowedIframeDomainsLabel',
                  defaultMessage: 'Allowed Iframe Domains (comma-separated)',
                })}
              </Field.Label>
              <TextInput
                name="allowedIframeDomains"
                value={iframeDomainsInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setIframeDomainsInput(e.target.value)
                }
              />
            </Field.Root>
          </Box>
        </Flex>

        <Box marginTop={4}>
          <Checkbox
            checked={settings.enableRelationalSync}
            onCheckedChange={(checked: boolean) =>
              setSettings((prev) => ({ ...prev, enableRelationalSync: Boolean(checked) }))
            }
          >
            {formatMessage({
              id: 'tiptap-editor.settings.enableRelationalSyncLabel',
              defaultMessage:
                "Automatically sync embedded Media ('<FieldName>'Media) and Internal Links ('<FieldName>'Links)",
            })}
          </Checkbox>
        </Box>
      </Box>

      <Box padding={6} background="neutral0" shadow="filterShadow" hasRadius>
        <Flex justifyContent="space-between" alignItems="center" marginBottom={4}>
          <Typography variant="delta" tag="h2">
            {formatMessage({
              id: 'tiptap-editor.settings.presetMatrixTitle',
              defaultMessage: 'Preset Feature Matrix',
            })}
          </Typography>
          <Box style={{ minWidth: '220px' }}>
            <SingleSelect
              aria-label={formatMessage({
                id: 'tiptap-editor.settings.presetMatrixSelectLabel',
                defaultMessage: 'Preset to edit',
              })}
              value={selectedPreset}
              onChange={(val: string | number) => setSelectedPreset(String(val))}
            >
              {presetNames.map((name) => (
                <SingleSelectOption key={name} value={name}>
                  {name}
                </SingleSelectOption>
              ))}
            </SingleSelect>
          </Box>
        </Flex>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            gap: '12px',
          }}
        >
          {PRESET_FEATURE_KEYS.map((featureKey) => {
            const isChecked = isFeatureEnabled(currentPresetConfig[featureKey]);
            return (
              <Box
                key={featureKey}
                padding={2}
                background="neutral100"
                hasRadius
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={(checked: boolean) =>
                    handleToggleFeature(featureKey, Boolean(checked))
                  }
                >
                  {featureKey}
                </Checkbox>
              </Box>
            );
          })}
        </div>
      </Box>
    </Box>
  );
}

export default SettingsPage;
