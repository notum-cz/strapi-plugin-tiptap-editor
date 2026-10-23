import React from 'react';
import { getMediaLibraryComponent } from '../utils/strapiApp';

export type StrapiAllowedMediaType = 'images' | 'videos' | 'audios' | 'files';

export interface StrapiFile {
  id: number;
  documentId?: string;
  name: string;
  alternativeText?: string | null;
  caption?: string | null;
  url?: string;
  mime?: string;
  size?: number;
  ext?: string;
  width?: number;
  height?: number;
}

interface MediaLibraryWrapperProps {
  open: boolean;
  onClose: () => void;
  onSelectAssets: (assets: StrapiFile[]) => void;
  allowedTypes?: StrapiAllowedMediaType[];
  multiple?: boolean;
}

export function MediaLibraryWrapper({
  open,
  onClose,
  onSelectAssets,
  allowedTypes = ['images'],
  multiple = false,
}: MediaLibraryWrapperProps) {
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
      allowedTypes={allowedTypes}
      multiple={multiple}
    />
  );
}
