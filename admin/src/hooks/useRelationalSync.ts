import { useCallback, useEffect, useRef } from 'react';
import { getFetchClient } from '@strapi/strapi/admin';
import { extractRelationsFromJSON, ExtractedRelationsResult } from '../../../shared/relations';

export interface ContentManagerRelationPosition {
  end: true;
}

export interface ContentManagerConnectRelation {
  id: number | string;
  documentId: string;
  locale?: string | null;
  status?: string;
  label: string;
  href: string;
  position: ContentManagerRelationPosition;
  __temp_key__: string;
  apiData: {
    id: number | string;
    documentId: string;
    locale?: string | null;
    position: ContentManagerRelationPosition;
    isTemporary: true;
  };
}

export interface ContentManagerRelationValue {
  connect: ContentManagerConnectRelation[];
  disconnect: Array<{ id: number | string }>;
}

export interface RelationalSyncCallbacks {
  /**
   * Optional callback or Strapi form onChange handler:
   * onChange(fieldName, value)
   */
  onSyncField?: (fieldName: string, value: unknown) => void;
  /**
   * Available field names on the current Content-Type form (if known).
   * When provided, sync only dispatches for companion fields that exist on the schema.
   */
  availableFields?: string[];
  /**
   * Maps target collection UIDs (e.g. "api::article.article") to relation attribute names
   * on the companion `links.links` component (e.g. "articles").
   */
  targetUidToAttribute?: Record<string, string>;
  /**
   * Component UID for the companion `<FieldName>Links` field (defaults to `"links.links"`).
   */
  linksComponentUid?: string;
  /**
   * Whether the companion `<FieldName>Links` component field is repeatable.
   */
  linksFieldIsRepeatable?: boolean;
  /**
   * Initial document value used to seed the relation signature on mount so the first unchanged
   * update after mount does not mark the form as dirty.
   */
  initialDocument?: unknown;
  enabled?: boolean;
}

const LABEL_CANDIDATE_KEYS = ['label', 'title', 'name', 'headline', 'subject', 'slug'];

function resolveRelationLabel(
  row: Record<string, unknown>,
  fallbackLabel: string | undefined,
  documentId: string
): string {
  for (const key of LABEL_CANDIDATE_KEYS) {
    const val = row[key];
    if (typeof val === 'string' && val.trim().length > 0) {
      return val.trim();
    }
  }
  if (fallbackLabel && fallbackLabel.trim().length > 0) {
    return fallbackLabel.trim();
  }
  return documentId;
}

function parseDocInput(doc: unknown): unknown {
  if (typeof doc === 'string' && doc.trim().startsWith('{')) {
    try {
      return JSON.parse(doc);
    } catch {
      return null;
    }
  }
  return doc;
}

function extractDocIdsByCollection(doc: unknown): Record<string, string[]> {
  const extracted = extractRelationsFromJSON(parseDocInput(doc));
  const result: Record<string, string[]> = {};
  for (const [uid, items] of Object.entries(extracted.linksByCollection)) {
    result[uid] = items.map((item) => item.documentId);
  }
  return result;
}

/**
 * Computes a deterministic JSON signature for extracted media and internal link relations.
 */
function buildRelationSignature(doc: unknown): string {
  const extracted = extractRelationsFromJSON(parseDocInput(doc));
  const validMediaAssets = extracted.mediaAssets.filter((asset) => asset.assetId !== null);
  return JSON.stringify({
    mediaIds: validMediaAssets.map((a) => a.assetId),
    mediaDocumentIds: extracted.mediaDocumentIds,
    links: extracted.linksByCollection,
  });
}

/**
 * Synchronizes embedded media assets (Image, Video, Audio, Attachment) with `<FieldName>Media`
 * and internal links (`strapi://collectionName/documentId`) with `<FieldName>Links`
 * following the Hashbite Lexical relational sync pattern, expanded for all Edifice IO media types.
 */
export function useRelationalSync(
  fieldName: string,
  options: RelationalSyncCallbacks = {}
) {
  const {
    onSyncField,
    availableFields,
    targetUidToAttribute = {},
    linksComponentUid = 'links.links',
    linksFieldIsRepeatable = false,
    initialDocument,
    enabled = true,
  } = options;
  const lastSignatureRef = useRef<string>(buildRelationSignature(initialDocument));
  const seededDocIdsByUidRef = useRef<Record<string, string[]>>(
    extractDocIdsByCollection(initialDocument)
  );
  const lastSyncedIdsRef = useRef<Record<string, Map<string, number | string>>>({});
  const hasSyncedUpdateRef = useRef<boolean>(false);
  const onSyncFieldRef = useRef(onSyncField);
  const availableFieldsRef = useRef(availableFields);
  const targetUidToAttributeRef = useRef(targetUidToAttribute);
  const linksComponentUidRef = useRef(linksComponentUid);
  const linksFieldIsRepeatableRef = useRef(linksFieldIsRepeatable);
  const relationRowCacheRef = useRef<Map<string, Record<string, unknown>>>(new Map());
  const latestLinksRequestIdRef = useRef<number>(0);

  useEffect(() => {
    onSyncFieldRef.current = onSyncField;
    availableFieldsRef.current = availableFields;
    targetUidToAttributeRef.current = targetUidToAttribute;
    linksComponentUidRef.current = linksComponentUid;
    linksFieldIsRepeatableRef.current = linksFieldIsRepeatable;
  }, [
    onSyncField,
    availableFields,
    targetUidToAttribute,
    linksComponentUid,
    linksFieldIsRepeatable,
  ]);

  const syncRelationsFromDoc = useCallback(
    (doc: unknown): ExtractedRelationsResult => {
      const extracted = extractRelationsFromJSON(doc);
      const syncHandler = onSyncFieldRef.current;
      if (!enabled || !syncHandler || !fieldName) {
        return extracted;
      }

      const validMediaAssets = extracted.mediaAssets.filter((asset) => asset.assetId !== null);

      const signature = JSON.stringify({
        mediaIds: validMediaAssets.map((a) => a.assetId),
        mediaDocumentIds: extracted.mediaDocumentIds,
        links: extracted.linksByCollection,
      });

      // Zero side effects: do not trigger form updates if relations have not changed
      if (signature === lastSignatureRef.current) {
        return extracted;
      }
      hasSyncedUpdateRef.current = true;
      lastSignatureRef.current = signature;

      const mediaFieldName = `${fieldName}Media`;
      const linksFieldName = `${fieldName}Links`;

      const currentAvailableFields = availableFieldsRef.current;
      const canSyncMedia =
        !currentAvailableFields || currentAvailableFields.includes(mediaFieldName);
      const canSyncLinks =
        !currentAvailableFields || currentAvailableFields.includes(linksFieldName);

      if (canSyncMedia) {
        const seen = new Set<number>();
        const mediaPayload = validMediaAssets
          .filter((asset) => {
            if (seen.has(asset.assetId as number)) return false;
            seen.add(asset.assetId as number);
            return true;
          })
          .map((asset) => ({
            id: asset.assetId,
            documentId: asset.documentId,
            url: asset.src,
            type: asset.nodeType,
          }));
        syncHandler(mediaFieldName, mediaPayload);
      }

      if (canSyncLinks) {
        const uidMap = targetUidToAttributeRef.current;
        const componentUid = linksComponentUidRef.current || 'links.links';
        const isRepeatable = linksFieldIsRepeatableRef.current;
        const requestId = ++latestLinksRequestIdRef.current;

        const labelByCollectionAndDoc = new Map<string, string>();
        for (const link of extracted.internalLinks) {
          if (link.label) {
            labelByCollectionAndDoc.set(`${link.collectionName}::${link.documentId}`, link.label);
          }
        }

        void (async () => {
          const uidEntries = Object.entries(uidMap).filter(([, attributeName]) =>
            Boolean(attributeName)
          );

          const resolvedEntries: Array<[string, ContentManagerRelationValue]> = [];
          const nextSyncedByAttr: Record<string, Map<string, number | string>> = {};
          const fetchClient =
            typeof getFetchClient === 'function' ? getFetchClient() : undefined;
          const cache = relationRowCacheRef.current;

          for (const [targetUid, attributeName] of uidEntries) {
            const items = extracted.linksByCollection[targetUid] ?? [];
            const hasInitializedPrev = Object.prototype.hasOwnProperty.call(
              lastSyncedIdsRef.current,
              attributeName
            );
            const seededDocIds = hasInitializedPrev
              ? []
              : (seededDocIdsByUidRef.current[targetUid] ?? []);

            const requiredDocIds = Array.from(
              new Set([...items.map((item) => item.documentId), ...seededDocIds])
            );
            const missingDocIds = requiredDocIds.filter(
              (docId) => !cache.has(`${componentUid}::${attributeName}::${docId}`)
            );

            if (missingDocIds.length > 0 && fetchClient && typeof fetchClient.get === 'function') {
              try {
                const params = new URLSearchParams();
                params.set('pageSize', String(missingDocIds.length));
                for (const docId of missingDocIds) {
                  params.append('idsToInclude', docId);
                }
                const res = (await fetchClient.get(
                  `/content-manager/relations/${encodeURIComponent(componentUid)}/${encodeURIComponent(attributeName)}?${params.toString()}`
                )) as
                  | {
                      data?: { results?: Array<Record<string, unknown>> };
                      results?: Array<Record<string, unknown>>;
                    }
                  | undefined;
                const results = res?.data?.results ?? res?.results ?? [];
                if (Array.isArray(results)) {
                  for (const row of results) {
                    if (
                      row &&
                      typeof row === 'object' &&
                      typeof row.documentId === 'string' &&
                      (typeof row.id === 'number' || typeof row.id === 'string')
                    ) {
                      cache.set(`${componentUid}::${attributeName}::${row.documentId}`, row);
                    }
                  }
                }
              } catch {
                // Ignore network errors when resolving relation metadata
              }
            }

            // Baseline = relations persisted when the editor loaded (or last saved)
            const prev = new Map<string, number | string>(
              lastSyncedIdsRef.current[attributeName] ?? []
            );
            if (!hasInitializedPrev) {
              for (const seededDocId of seededDocIds) {
                const row = cache.get(`${componentUid}::${attributeName}::${seededDocId}`);
                if (row && (typeof row.id === 'number' || typeof row.id === 'string')) {
                  prev.set(String(row.documentId ?? seededDocId), row.id);
                }
              }
            }

            const connectRows: ContentManagerConnectRelation[] = [];
            items.forEach((item, idx) => {
              const row = cache.get(`${componentUid}::${attributeName}::${item.documentId}`);
              if (!row || (typeof row.id !== 'number' && typeof row.id !== 'string')) {
                return;
              }
              const docId = String(row.documentId ?? item.documentId);
              const locale =
                typeof row.locale === 'string' || row.locale === null ? row.locale : undefined;
              const status = typeof row.status === 'string' ? row.status : undefined;
              const fallbackLabel = labelByCollectionAndDoc.get(`${targetUid}::${item.documentId}`);
              const label = resolveRelationLabel(row, fallbackLabel, docId);
              const href = `../collection-types/${targetUid}/${docId}${
                locale ? `?plugins[i18n][locale]=${encodeURIComponent(locale)}` : ''
              }`;
              const position: ContentManagerRelationPosition = { end: true };
              const tempKey = `a${idx.toString(36).padStart(4, '0')}`;

              connectRows.push({
                id: row.id,
                documentId: docId,
                ...(locale !== undefined ? { locale } : {}),
                ...(status !== undefined ? { status } : {}),
                label,
                href,
                position,
                __temp_key__: tempKey,
                apiData: {
                  id: row.id,
                  documentId: docId,
                  ...(locale !== undefined ? { locale } : {}),
                  position,
                  isTemporary: true,
                },
              });
            });

            const nextDocIds = new Set(items.map((i) => i.documentId));
            const connect = connectRows.filter((r) => !prev.has(r.documentId));
            const disconnect = [...prev.entries()]
              .filter(([docId]) => !nextDocIds.has(docId))
              .map(([, id]) => ({ id }));

            resolvedEntries.push([
              attributeName,
              {
                connect,
                disconnect,
              },
            ]);

            // Persist the baseline unchanged; never fold unsaved connects into it
            nextSyncedByAttr[attributeName] = prev;
          }

          if (requestId !== latestLinksRequestIdRef.current) {
            return;
          }

          lastSyncedIdsRef.current = {
            ...lastSyncedIdsRef.current,
            ...nextSyncedByAttr,
          };

          const componentValue = Object.fromEntries(resolvedEntries);
          onSyncFieldRef.current?.(
            linksFieldName,
            isRepeatable ? [componentValue] : componentValue
          );
        })();
      }

      return extracted;
    },
    [enabled, fieldName]
  );

  const seedSignature = useCallback((doc: unknown) => {
    lastSignatureRef.current = buildRelationSignature(doc);
    seededDocIdsByUidRef.current = extractDocIdsByCollection(doc);
    lastSyncedIdsRef.current = {};
  }, []);

  return {
    syncRelationsFromDoc,
    seedSignature,
  };
}
