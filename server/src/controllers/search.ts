import type { Core } from '@strapi/strapi';
import type { Context } from 'koa';
import {
  canReadCollection,
  type AdminUserAbility,
  type SearchDocumentHit,
} from '../services/search';

interface SearchService {
  identifyCollectionTitleField(collectionName: string): string;
  getLinkableCollections(
    userAbility?: AdminUserAbility
  ): Array<{ attributeName: string; targetUid: string }>;
  search(
    query: string,
    locale?: string,
    userAbility?: AdminUserAbility
  ): Promise<Record<string, SearchDocumentHit[]>>;
  getDocument(
    collectionName: string,
    documentId: string,
    locale?: string,
    userAbility?: AdminUserAbility
  ): Promise<SearchDocumentHit | null>;
}

function hasUsableAbility(userAbility?: AdminUserAbility): userAbility is AdminUserAbility {
  return Boolean(
    userAbility &&
      (typeof userAbility.can === 'function' || typeof userAbility.cannot === 'function')
  );
}

/**
 * Controller for searching and resolving internal Strapi content documents.
 */
const createSearchController = ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Handles `GET /search?q=<query>&locale=<locale>` with collection-level permission filtering.
   */
  async search(ctx: Context): Promise<void> {
    const queryObj = (ctx.query || {}) as Record<string, unknown>;
    const q = typeof queryObj.q === 'string' ? queryObj.q.trim() : '';
    const locale = typeof queryObj.locale === 'string' ? queryObj.locale.trim() : undefined;
    const userAbility = (ctx.state as { userAbility?: AdminUserAbility })?.userAbility;

    if (!hasUsableAbility(userAbility)) {
      ctx.throw(403, 'Forbidden');
      return;
    }

    if (!q) {
      ctx.body = { results: {}, collections: [] };
      return;
    }

    const searchService = strapi.plugin('tiptap-editor').service('search') as SearchService;
    const results = await searchService.search(q, locale, userAbility);
    const collections = searchService.getLinkableCollections(userAbility);
    ctx.body = { results, collections };
  },

  /**
   * Handles `GET /get/:collectionName/:documentId` with collection-level permission enforcement.
   */
  async getDocument(ctx: Context): Promise<void> {
    const collectionName = ctx.params?.collectionName;
    const documentId = ctx.params?.documentId;
    const queryObj = (ctx.query || {}) as Record<string, unknown>;
    const locale = typeof queryObj.locale === 'string' ? queryObj.locale.trim() : undefined;
    const userAbility = (ctx.state as { userAbility?: AdminUserAbility })?.userAbility;

    if (!hasUsableAbility(userAbility)) {
      ctx.throw(403, 'Forbidden');
      return;
    }

    if (typeof collectionName !== 'string' || typeof documentId !== 'string') {
      ctx.throw(400, 'collectionName and documentId are required');
      return;
    }

    const searchService = strapi.plugin('tiptap-editor').service('search') as SearchService;
    try {
      const doc = await searchService.getDocument(collectionName, documentId, locale, userAbility);
      if (!doc) {
        ctx.throw(404, 'Document not found');
        return;
      }
      ctx.body = doc;
    } catch (error) {
      const status = (error as { status?: number })?.status;
      if (status === 404 || status === 403) {
        ctx.throw(status, error instanceof Error ? error.message : 'Access denied');
        return;
      }
      strapi?.log?.warn?.(
        `[tiptap-editor] Document lookup failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      ctx.throw(400, 'Invalid document lookup parameters');
    }
  },

  /**
   * Handles `GET /identify/:collectionName` to return the human-readable title attribute name.
   */
  async identify(ctx: Context): Promise<void> {
    const collectionName = ctx.params?.collectionName;
    if (typeof collectionName !== 'string') {
      ctx.throw(400, 'collectionName is required');
      return;
    }

    const userAbility = (ctx.state as { userAbility?: AdminUserAbility })?.userAbility;
    if (!canReadCollection(collectionName, userAbility)) {
      ctx.throw(403, 'Forbidden');
      return;
    }

    const searchService = strapi.plugin('tiptap-editor').service('search') as SearchService;
    try {
      const titleField = searchService.identifyCollectionTitleField(collectionName);
      ctx.body = { collectionName, titleField };
    } catch (error) {
      ctx.throw(400, error instanceof Error ? error.message : 'Invalid collectionName');
    }
  },
});

export default createSearchController;
