import { useEffect, useRef } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';

import { PLUGIN_ID } from '../../../shared/pluginId';
import { TiptapThemeConfig } from '../../../shared/types';
import { setThemeCache } from '../utils/themeCache';

type InitializerProps = {
  setPlugin: (id: string) => void;
};

const LINK_ID = 'tiptap-theme-stylesheet';

function reconcileThemeStylesheet(href: string | undefined): Promise<void> {
  const existing = document.getElementById(LINK_ID) as HTMLLinkElement | null;

  // No stylesheet needed — remove stale link if present
  if (!href) {
    existing?.remove();
    return Promise.resolve();
  }

  // Existing link already matches and is loaded
  if (existing && existing.href === href && existing.sheet) {
    return Promise.resolve();
  }

  // Remove outdated link before inserting the new one
  existing?.remove();

  return new Promise<void>((resolve) => {
    const link = document.createElement('link');
    link.id = LINK_ID;
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => resolve();
    link.onerror = () => {
      console.warn('[TiptapEditor] Failed to load theme stylesheet:', href);
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
      let stylesheetHref: string | undefined;

      try {
        const { data } = await get('/tiptap-editor/theme');
        if (data && typeof data === 'object' && Object.keys(data).length > 0) {
          setThemeCache(data as TiptapThemeConfig);

          if (typeof data.stylesheet === 'string' && data.stylesheet) {
            stylesheetHref = data.stylesheet;
          }
        }
      } catch (error) {
        console.warn('[TiptapEditor] Failed to fetch theme config:', error);
      }

      await reconcileThemeStylesheet(stylesheetHref);
      ref.current(PLUGIN_ID);
    };

    fetchTheme();
  }, []);

  return null;
};

export { Initializer };
