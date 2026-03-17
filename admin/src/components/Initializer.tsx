import { useEffect, useRef } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';

import { PLUGIN_ID } from '../../../shared/pluginId';
import { TiptapThemeConfig } from '../../../shared/types';
import { setThemeCache } from '../utils/themeCache';

type InitializerProps = {
  setPlugin: (id: string) => void;
};

const THEME_STYLE_ID = 'tiptap-theme-styles';

function reconcileThemeStyles(theme: { stylesheet?: string; css?: string }): Promise<void> {
  const existing = document.getElementById(THEME_STYLE_ID);

  const { stylesheet, css } = theme;

  // No styles needed — remove stale element if present
  if (!stylesheet && !css) {
    existing?.remove();
    return Promise.resolve();
  }

  // Inline CSS via <style> tag
  if (css) {
    if (existing && existing.tagName === 'STYLE' && existing.textContent === css) {
      return Promise.resolve();
    }
    existing?.remove();
    const style = document.createElement('style');
    style.id = THEME_STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
    return Promise.resolve();
  }

  // External stylesheet via <link> tag
  let resolved: string;
  try {
    resolved = new URL(stylesheet!, document.baseURI).href;
  } catch {
    console.warn('[TiptapEditor] Invalid stylesheet URL:', stylesheet);
    return Promise.resolve();
  }
  if (
    existing &&
    existing.tagName === 'LINK' &&
    (existing as HTMLLinkElement).href === resolved &&
    (existing as HTMLLinkElement).sheet
  ) {
    return Promise.resolve();
  }

  existing?.remove();

  return new Promise<void>((resolve) => {
    const link = document.createElement('link');
    link.id = THEME_STYLE_ID;
    link.rel = 'stylesheet';
    link.href = stylesheet!;
    link.onload = () => resolve();
    link.onerror = () => {
      console.warn('[TiptapEditor] Failed to load theme stylesheet:', stylesheet);
      resolve();
    };
    document.head.appendChild(link);
  });
}

const Initializer = ({ setPlugin }: InitializerProps) => {
  const ref = useRef(setPlugin);
  const { get } = useFetchClient();

  useEffect(() => {
    const fetchTheme = async () => {
      let themeStyles: { stylesheet?: string; css?: string } = {};

      try {
        const { data } = await get('/tiptap-editor/theme');
        if (data && typeof data === 'object' && Object.keys(data).length > 0) {
          setThemeCache(data as TiptapThemeConfig);

          if (typeof data.css === 'string' && data.css) {
            themeStyles = { css: data.css };
          } else if (typeof data.stylesheet === 'string' && data.stylesheet) {
            themeStyles = { stylesheet: data.stylesheet };
          }
        }
      } catch (error) {
        console.warn('[TiptapEditor] Failed to fetch theme config:', error);
      }

      try {
        await reconcileThemeStyles(themeStyles);
      } catch (error) {
        console.warn('[TiptapEditor] Failed to reconcile theme styles:', error);
      } finally {
        ref.current(PLUGIN_ID);
      }
    };

    fetchTheme();
  }, []);

  return null;
};

export { Initializer };
