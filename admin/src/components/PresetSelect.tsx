import { useState, useEffect } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';
import { SingleSelect, SingleSelectOption } from '@strapi/design-system';
import { useIntl } from 'react-intl';

interface PresetSelectProps {
  value?: string;
  onChange: (payload: { target: { name: string; value: string; type?: string } }) => void;
  name: string;
  intlLabel?: { id: string; defaultMessage: string };
  description?: { id: string; defaultMessage: string };
}

export function PresetSelect({ value, onChange, name }: PresetSelectProps) {
  const { formatMessage } = useIntl();
  const { get } = useFetchClient();
  const [presets, setPresets] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    get('/tiptap-editor/presets')
      .then((res: { data?: { presets?: string[] } }) => setPresets(res.data?.presets ?? []))
      .catch(() => setPresets([]))
      .finally(() => setIsLoading(false));
  }, [get]);

  return (
    <SingleSelect
      name={name}
      value={value || ''}
      onChange={(val: string) => {
        onChange({ target: { name, value: val, type: 'select' } });
      }}
      placeholder={presets.length === 0
        ? formatMessage({ id: 'tiptap-editor.preset.noPresetsAvailable', defaultMessage: 'No presets available' })
        : formatMessage({ id: 'tiptap-editor.preset.selectPreset', defaultMessage: 'Select a preset' })
      }
      disabled={isLoading || presets.length === 0}
    >
      {presets.map((presetName) => (
        <SingleSelectOption key={presetName} value={presetName}>
          {presetName}
        </SingleSelectOption>
      ))}
    </SingleSelect>
  );
}
