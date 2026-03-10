import { useState, useEffect } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';
import { SingleSelect, SingleSelectOption } from '@strapi/design-system';

interface PresetSelectProps {
  value?: string;
  onChange: (value: string) => void;
  name?: string;
}

export function PresetSelect({ value, onChange, name }: PresetSelectProps) {
  const { get } = useFetchClient();
  const [presets, setPresets] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    get('/api/tiptap-editor/presets')
      .then((res: any) => setPresets(res.data ?? []))
      .catch(() => setPresets([]))
      .finally(() => setIsLoading(false));
  }, [get]);

  return (
    <SingleSelect
      name={name}
      value={value || ''}
      onChange={(val: string) => onChange(val)}
      placeholder={presets.length === 0 ? 'No presets available' : 'Select a preset'}
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
