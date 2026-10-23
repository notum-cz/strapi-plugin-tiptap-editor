import type { Core } from '@strapi/strapi';
import type { Context } from 'koa';
import type { TiptapRuntimeSettings } from '../../../shared/types';
import { SETTINGS_UPDATE_PERMISSION } from '../bootstrap';

interface SettingsService {
  getSettings(): Promise<Required<TiptapRuntimeSettings>>;
  updateSettings(input: unknown): Promise<Required<TiptapRuntimeSettings>>;
}

/**
 * Controller for reading and updating Tiptap runtime settings.
 */
const createSettingsController = ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Returns current Tiptap runtime settings.
   */
  async find(ctx: Context): Promise<void> {
    const settingsService = strapi.plugin('tiptap-editor').service('settings') as SettingsService;
    ctx.body = await settingsService.getSettings();
  },

  /**
   * Updates Tiptap runtime settings after verifying admin permission and payload schema.
   */
  async update(ctx: Context): Promise<void> {
    const userAbility = (ctx.state as { userAbility?: { cannot?: (action: string) => boolean } })
      ?.userAbility;
    if (
      !userAbility ||
      typeof userAbility.cannot !== 'function' ||
      userAbility.cannot(SETTINGS_UPDATE_PERMISSION)
    ) {
      ctx.throw(403, 'You do not have permission to update Tiptap Editor settings');
      return;
    }

    const settingsService = strapi.plugin('tiptap-editor').service('settings') as SettingsService;
    const body = (ctx.request as { body?: unknown })?.body;
    try {
      ctx.body = await settingsService.updateSettings(body);
    } catch (error) {
      ctx.throw(400, error instanceof Error ? error.message : 'Invalid settings payload');
    }
  },
});

export default createSettingsController;
