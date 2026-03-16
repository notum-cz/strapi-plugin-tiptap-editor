import { useEffect, useRef } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';

import { PLUGIN_ID } from '../../../shared/pluginId';
import { TiptapThemeConfig } from '../../../shared/types';
import { setThemeCache } from '../utils/themeCache';

type InitializerProps = {
  setPlugin: (id: string) => void;
};

const Initializer = ({ setPlugin }: InitializerProps) => {
  const ref = useRef(setPlugin);
  const { get } = useFetchClient();

  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const { data } = await get('/tiptap-editor/theme');
        if (data && typeof data === 'object' && Object.keys(data).length > 0) {
          setThemeCache(data as TiptapThemeConfig);

          if (typeof data.stylesheet === 'string' && data.stylesheet) {
            if (!document.getElementById('tiptap-theme-stylesheet')) {
              const link = document.createElement('link');
              link.id = 'tiptap-theme-stylesheet';
              link.rel = 'stylesheet';
              link.href = data.stylesheet;
              document.head.appendChild(link);
            }
          }
        }
      } catch (error) {
        console.warn('[TiptapEditor] Failed to fetch theme config:', error);
      }

      ref.current(PLUGIN_ID);
    };

    fetchTheme();
  }, []);

  return null;
};

export { Initializer };
