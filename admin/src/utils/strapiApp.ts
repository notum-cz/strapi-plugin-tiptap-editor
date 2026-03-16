import type { ComponentType } from 'react';

/**
 * Module-level reference to the StrapiApp instance, captured during register().
 * Used to access the component registry (e.g. media-library dialog) at render time
 * without relying on useStrapiApp — which fails due to use-context-selector
 * context isolation between the plugin bundle and the host app.
 */
let appRef: Record<string, any> | null = null;

export function captureApp(app: Record<string, any>) {
  appRef = app;
}

export function getMediaLibraryComponent(): ComponentType<any> | null {
  return appRef?.library?.components?.['media-library'] ?? null;
}
