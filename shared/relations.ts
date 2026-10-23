// shared/relations.ts

export type MediaNodeType = 'image' | 'video' | 'audio' | 'attachment';

export interface ExtractedMediaReference {
  nodeType: MediaNodeType;
  assetId: number | null;
  documentId: string | null;
  src: string | null;
}

export interface ExtractedInternalLink {
  collectionName: string;
  documentId: string;
  href: string;
  label?: string;
}

export interface ExtractedRelationsResult {
  mediaIds: number[];
  mediaDocumentIds: string[];
  mediaAssets: ExtractedMediaReference[];
  internalLinks: ExtractedInternalLink[];
  linksByCollection: Record<string, Array<{ documentId: string }>>;
}

const MEDIA_NODE_TYPES = new Set<string>(['image', 'video', 'audio', 'attachment']);

const STRAPI_URI_RE = /^strapi:\/\/([a-zA-Z0-9_.:-]+)\/([a-zA-Z0-9_-]+)(?:\?.*)?$/;

export function parseStrapiLinkUri(
  href: string | null | undefined
): { collectionName: string; documentId: string } | null {
  if (!href || typeof href !== 'string') return null;
  const trimmed = href.trim();
  const match = STRAPI_URI_RE.exec(trimmed);
  if (!match) return null;
  return {
    collectionName: match[1],
    documentId: match[2],
  };
}

export function formatStrapiLinkUri(collectionName: string, documentId: string): string {
  return `strapi://${collectionName.trim()}/${documentId.trim()}`;
}

/**
 * Walks a ProseMirror/Tiptap JSON document and extracts all referenced
 * Strapi Media assets (image, video, audio, attachment) and internal content
 * links (linker nodes and link marks using strapi://collectionName/documentId).
 */
export function extractRelationsFromJSON(doc: unknown): ExtractedRelationsResult {
  const mediaIdsSet = new Set<number>();
  const mediaDocIdsSet = new Set<string>();
  const mediaAssets: ExtractedMediaReference[] = [];
  const internalLinksMap = new Map<string, ExtractedInternalLink>();

  const addInternalLink = (collectionName: string, documentId: string, label?: string) => {
    const cleanCollection = collectionName.trim();
    const cleanDocId = documentId.trim();
    if (!cleanCollection || !cleanDocId) return;
    const key = `${cleanCollection}::${cleanDocId}`;
    if (!internalLinksMap.has(key)) {
      internalLinksMap.set(key, {
        collectionName: cleanCollection,
        documentId: cleanDocId,
        href: formatStrapiLinkUri(cleanCollection, cleanDocId),
        ...(label ? { label } : {}),
      });
    }
  };

  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return;
    const n = node as {
      type?: string;
      text?: string;
      attrs?: Record<string, unknown>;
      marks?: Array<{ type?: string; attrs?: Record<string, unknown> }>;
      content?: unknown[];
    };

    if (typeof n.type === 'string' && MEDIA_NODE_TYPES.has(n.type)) {
      const attrs = n.attrs || {};
      const rawId = attrs['data-asset-id'] ?? attrs.assetId ?? attrs.id;
      const parsedId =
        typeof rawId === 'number'
          ? rawId
          : typeof rawId === 'string' && /^\d+$/.test(rawId)
            ? parseInt(rawId, 10)
            : null;
      const validAssetId =
        typeof parsedId === 'number' && !Number.isNaN(parsedId) ? parsedId : null;

      const rawDocId = attrs['data-document-id'] ?? attrs.documentId;
      const validDocId =
        typeof rawDocId === 'string' && rawDocId.trim().length > 0 ? rawDocId.trim() : null;

      const rawSrc = attrs.src ?? attrs.href;
      const validSrc = typeof rawSrc === 'string' && rawSrc.trim().length > 0 ? rawSrc.trim() : null;

      if (validAssetId !== null) {
        mediaIdsSet.add(validAssetId);
      }
      if (validDocId !== null) {
        mediaDocIdsSet.add(validDocId);
      }
      if (validAssetId !== null || validDocId !== null || validSrc !== null) {
        mediaAssets.push({
          nodeType: n.type as MediaNodeType,
          assetId: validAssetId,
          documentId: validDocId,
          src: validSrc,
        });
      }
    }

    if (n.type === 'linker') {
      const attrs = n.attrs || {};
      const col = typeof attrs.collectionName === 'string' ? attrs.collectionName : '';
      const docId = typeof attrs.documentId === 'string' ? attrs.documentId : '';
      const label = typeof attrs.label === 'string' ? attrs.label : undefined;
      if (col && docId) {
        addInternalLink(col, docId, label);
      } else if (typeof attrs.href === 'string') {
        const parsed = parseStrapiLinkUri(attrs.href);
        if (parsed) {
          addInternalLink(parsed.collectionName, parsed.documentId, label);
        }
      }
    }

    if (Array.isArray(n.marks)) {
      for (const mark of n.marks) {
        if (mark && mark.type === 'link' && mark.attrs) {
          const parsed = parseStrapiLinkUri(mark.attrs.href as string | undefined);
          if (parsed) {
            addInternalLink(
              parsed.collectionName,
              parsed.documentId,
              typeof n.text === 'string' ? n.text : undefined
            );
          }
        }
      }
    }

    if (Array.isArray(n.content)) {
      for (const child of n.content) {
        walk(child);
      }
    }
  };

  let parsedDoc = doc;
  if (typeof doc === 'string') {
    try {
      parsedDoc = JSON.parse(doc);
    } catch {
      parsedDoc = null;
    }
  }

  walk(parsedDoc);

  const internalLinks = Array.from(internalLinksMap.values());
  const linksByCollection: Record<string, Array<{ documentId: string }>> = {};
  for (const link of internalLinks) {
    if (!linksByCollection[link.collectionName]) {
      linksByCollection[link.collectionName] = [];
    }
    linksByCollection[link.collectionName].push({ documentId: link.documentId });
  }

  return {
    mediaIds: Array.from(mediaIdsSet),
    mediaDocumentIds: Array.from(mediaDocIdsSet),
    mediaAssets,
    internalLinks,
    linksByCollection,
  };
}
