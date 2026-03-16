import React from 'react';
import { useStrapiApp } from '@strapi/admin/strapi-admin';

export interface StrapiFile {
  id: number;
  name: string;
  alternativeText?: string | null;
  url?: string;
}

interface MediaLibraryDialogProps {
  onClose: () => void;
  onSelectAssets: (assets: StrapiFile[]) => void;
  allowedTypes?: Array<'files' | 'images' | 'videos' | 'audios'>;
  multiple?: boolean;
}

interface MediaLibraryWrapperProps {
  open: boolean;
  onClose: () => void;
  onSelectAssets: (assets: StrapiFile[]) => void;
}

export function MediaLibraryWrapper({ open, onClose, onSelectAssets }: MediaLibraryWrapperProps) {
  const components = useStrapiApp('ImagePicker', (state) => state.components);

  if (!open) return null;
  if (!components || !components['media-library']) return null;

  const MediaLibraryDialogComp = components['media-library'] as React.ComponentType<MediaLibraryDialogProps>;

  return (
    <MediaLibraryDialogComp
      onClose={onClose}
      onSelectAssets={onSelectAssets}
      allowedTypes={['images']}
      multiple={false}
    />
  );
}
