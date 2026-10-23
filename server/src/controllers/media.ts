import type { Core } from '@strapi/strapi';
import type { Context } from 'koa';
import type { LinkPreviewMetadata, UploadedRemoteAsset } from '../services/media';

interface MediaService {
  isSsrfSafeUrl(url: string): boolean;
  getLinkPreview(url: string): Promise<LinkPreviewMetadata>;
  uploadByUrl(url: string, alt?: string, user?: unknown): Promise<UploadedRemoteAsset>;
}

interface UploadUserAbility {
  cannot?: (action: string, subject?: string) => boolean;
  can?: (action: string, subject?: string) => boolean;
}

function canCreateUploadAsset(userAbility?: UploadUserAbility): boolean {
  if (!userAbility) return false;
  if (typeof userAbility.cannot === 'function') {
    return !userAbility.cannot('plugin::upload.assets.create');
  }
  if (typeof userAbility.can === 'function') {
    return Boolean(userAbility.can('plugin::upload.assets.create'));
  }
  return false;
}

/**
 * Controller for SSRF-safe external link previews and remote media imports.
 */
const createMediaController = ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Handles `GET /link-preview?url=...` and returns OpenGraph metadata.
   */
  async linkPreview(ctx: Context): Promise<void> {
    const queryObj = (ctx.query || {}) as Record<string, unknown>;
    const url = typeof queryObj.url === 'string' ? queryObj.url.trim() : '';

    if (!url) {
      ctx.throw(400, 'Query parameter "url" is required');
      return;
    }

    const mediaService = strapi.plugin('tiptap-editor').service('media') as MediaService;
    if (!mediaService.isSsrfSafeUrl(url)) {
      ctx.throw(400, 'Provided URL is not allowed');
      return;
    }

    try {
      ctx.body = await mediaService.getLinkPreview(url);
    } catch (error) {
      strapi?.log?.warn?.(
        `[tiptap-editor] Link preview failed: ${error instanceof Error ? error.message : String(error)}`
      );
      ctx.throw(400, 'Failed to fetch link preview');
    }
  },

  /**
   * Handles `POST /upload-by-url` and imports or registers a remote media asset.
   */
  async uploadByUrl(ctx: Context): Promise<void> {
    const userAbility = (ctx.state as { userAbility?: UploadUserAbility })?.userAbility;
    if (!canCreateUploadAsset(userAbility)) {
      ctx.throw(403, 'Forbidden');
      return;
    }

    const body = ((ctx.request as { body?: Record<string, unknown> })?.body || {}) as Record<
      string,
      unknown
    >;
    const url = typeof body.url === 'string' ? body.url.trim() : '';
    const alt = typeof body.alt === 'string' ? body.alt.trim() : undefined;

    if (!url) {
      ctx.throw(400, 'Body parameter "url" is required');
      return;
    }

    const mediaService = strapi.plugin('tiptap-editor').service('media') as MediaService;
    if (!mediaService.isSsrfSafeUrl(url)) {
      ctx.throw(400, 'Provided URL is not allowed');
      return;
    }

    try {
      const user = (ctx.state as { user?: unknown })?.user;
      ctx.body = await mediaService.uploadByUrl(url, alt, user);
    } catch (error) {
      strapi?.log?.warn?.(
        `[tiptap-editor] Remote upload failed: ${error instanceof Error ? error.message : String(error)}`
      );
      ctx.throw(400, 'Failed to process remote media URL');
    }
  },
});

export default createMediaController;
