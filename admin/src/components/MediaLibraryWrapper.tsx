import React from 'react';
import { getMediaLibraryComponent } from '../utils/strapiApp';

export interface StrapiFile {
  id: number;
  name: string;
  alternativeText?: string | null;
  url?: string;
}

interface MediaLibraryWrapperProps {
  open: boolean;
  onClose: () => void;
  onSelectAssets: (assets: StrapiFile[]) => void;
}

export function MediaLibraryWrapper({ open, onClose, onSelectAssets }: MediaLibraryWrapperProps) {
  if (!open) return null;

  const MediaLibraryDialogComp = getMediaLibraryComponent();
  if (!MediaLibraryDialogComp) {
    onClose();
    return null;
  }

  return (
    <MediaLibraryDialogComp
      onClose={onClose}
      onSelectAssets={onSelectAssets}
      allowedTypes={['images']}
      multiple={false}
    />
  );
}
