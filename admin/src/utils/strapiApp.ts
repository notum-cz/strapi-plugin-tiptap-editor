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

/**
 * Captures the host Strapi admin application reference during plugin registration.
 */
export function captureApp(app: AppBridge) {
  appRef = app;
}

/**
 * Returns the host Strapi Media Library dialog component registered in `app.library.components`,
 * or `null` if unavailable.
 */
export function getMediaLibraryComponent(): ComponentType<MediaLibraryDialogProps> | null {
  return appRef?.library?.components?.['media-library'] ?? null;
}

export interface UploadedStrapiAsset {
  id?: number;
  documentId?: string;
  url?: string;
  name?: string;
  alternativeText?: string;
  caption?: string;
  mime?: string;
  width?: number;
  height?: number;
}

/**
 * Uploads a `FormData` payload to Strapi's `/upload` endpoint using Strapi's
 * authenticated fetch client (`getFetchClient`) so both localStorage and
 * cookie-backed sessions send the required authorization header.
 */
export async function uploadFileToStrapi(
  formData: FormData
): Promise<UploadedStrapiAsset | null> {
  try {
    const { getFetchClient } = await import('@strapi/strapi/admin');
    const { post } = getFetchClient();
    const { data: payload } = await post('/upload', formData);

    const uploaded = Array.isArray(payload)
      ? payload[0]
      : Array.isArray(payload?.data)
        ? payload.data[0]
        : payload?.data;

    return uploaded && typeof uploaded === 'object' ? (uploaded as UploadedStrapiAsset) : null;
  } catch {
    return null;
  }
}
