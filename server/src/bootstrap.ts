import type { Core } from '@strapi/strapi';

export const LINKS_COMPONENT_UID = 'links.links';
export const SETTINGS_STORE_KEY = 'settings';
export const SETTINGS_UPDATE_PERMISSION = 'plugin::tiptap-editor.settings.update';
export const EXPLORER_READ_PERMISSION = 'plugin::tiptap-editor.explorer.read';

/**
 * Registers admin RBAC permissions for settings & content linker search.
 */
const bootstrap = async ({ strapi }: { strapi: Core.Strapi }) => {
  try {
    // Register admin RBAC permissions for settings & content linker search
    const actionProvider = (
      strapi as unknown as {
        admin?: {
          services?: {
            permission?: {
              actionProvider?: {
                registerMany?: (actions: Array<Record<string, unknown>>) => Promise<void> | void;
              };
            };
          };
        };
      }
    )?.admin?.services?.permission?.actionProvider;

    if (actionProvider && typeof actionProvider.registerMany === 'function') {
      await actionProvider.registerMany([
        {
          section: 'plugins',
          displayName: 'Update settings',
          uid: 'settings.update',
          pluginName: 'tiptap-editor',
        },
        {
          section: 'plugins',
          displayName: 'Search linkable content',
          uid: 'explorer.read',
          pluginName: 'tiptap-editor',
        },
      ]);
    }
  } catch (error) {
    strapi?.log?.error?.(
      `[tiptap-editor] Failed to register RBAC actions: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    throw error;
  }
};

export default bootstrap;
