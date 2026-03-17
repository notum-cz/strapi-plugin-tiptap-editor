import type { ComponentType } from 'react';
import type { StrapiFile } from '../components/MediaLibraryWrapper';

export interface MediaLibraryDialogProps {
  onClose: () => void;
  onSelectAssets: (assets: StrapiFile[]) => void;
  allowedTypes?: Array<'files' | 'images' | 'videos' | 'audios'>;
  multiple?: boolean;
}

interface AppBridge {
  library: {
    components: {
      'media-library'?: ComponentType<MediaLibraryDialogProps>;
    };
  };
}

/**
 * Module-level reference to the StrapiApp instance, captured during register().
 * Used to access the component registry (e.g. media-library dialog) at render time
 * without relying on useStrapiApp — which fails due to use-context-selector
 * context isolation between the plugin bundle and the host app.
 */
let appRef: AppBridge | null = null;

export function captureApp(app: AppBridge) {
  appRef = app;
}

export function getMediaLibraryComponent(): ComponentType<MediaLibraryDialogProps> | null {
  return appRef?.library?.components?.['media-library'] ?? null;
}
