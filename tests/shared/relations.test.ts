import { describe, it, expect } from 'vitest';
import {
  parseStrapiLinkUri,
  formatStrapiLinkUri,
  extractRelationsFromJSON,
} from '../../shared/relations';
import allFeaturesPayload from '../../fixtures/all-features-payload.json';

describe('shared/relations', () => {
  describe('parseStrapiLinkUri & formatStrapiLinkUri', () => {
    it('formats and parses valid strapi:// URIs', () => {
      const uri = formatStrapiLinkUri('api::article.article', 'doc-123');
      expect(uri).toBe('strapi://api::article.article/doc-123');
      expect(parseStrapiLinkUri(uri)).toEqual({
        collectionName: 'api::article.article',
        documentId: 'doc-123',
      });
    });

    it('returns null for external or invalid URIs', () => {
      expect(parseStrapiLinkUri('https://example.com/page')).toBeNull();
      expect(parseStrapiLinkUri('strapi://missing-slash')).toBeNull();
      expect(parseStrapiLinkUri('')).toBeNull();
      expect(parseStrapiLinkUri(null)).toBeNull();
    });
  });

  describe('extractRelationsFromJSON', () => {
    it('extracts image, video, audio, attachment, linker, and strapi:// link marks', () => {
      const doc = {
        type: 'doc',
        content: [
          {
            type: 'image',
            attrs: {
              src: '/uploads/photo.jpg',
              'data-asset-id': 10,
              'data-document-id': 'doc-img-10',
            },
          },
          {
            type: 'video',
            attrs: {
              src: '/uploads/clip.mp4',
              'data-asset-id': '20',
              'data-document-id': 'doc-vid-20',
            },
          },
          {
            type: 'audio',
            attrs: {
              src: '/uploads/voice.webm',
              'data-asset-id': 30,
              'data-document-id': 'doc-aud-30',
            },
          },
          {
            type: 'attachment',
            attrs: {
              href: '/uploads/report.pdf',
              'data-asset-id': 40,
              'data-document-id': 'doc-att-40',
            },
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'linker',
                attrs: {
                  collectionName: 'api::article.article',
                  documentId: 'art-1',
                  label: 'Article 1',
                },
              },
              {
                type: 'text',
                text: 'Inline internal link',
                marks: [
                  {
                    type: 'link',
                    attrs: {
                      href: 'strapi://api::page.page/page-99',
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      const res = extractRelationsFromJSON(doc);
      expect(res.mediaIds).toEqual([10, 20, 30, 40]);
      expect(res.mediaDocumentIds).toEqual([
        'doc-img-10',
        'doc-vid-20',
        'doc-aud-30',
        'doc-att-40',
      ]);
      expect(res.mediaAssets).toHaveLength(4);
      expect(res.internalLinks).toHaveLength(2);
      expect(res.linksByCollection['api::article.article']).toHaveLength(1);
      expect(res.linksByCollection['api::page.page']).toHaveLength(1);
    });

    it('extracts relations from fixtures/all-features-payload.json without duplicates', () => {
      const res = extractRelationsFromJSON(allFeaturesPayload);
      expect(new Set(res.mediaIds).size).toBe(res.mediaIds.length);
      expect(new Set(res.mediaDocumentIds).size).toBe(res.mediaDocumentIds.length);
      expect(res.mediaIds).toContain(42);
      expect(res.mediaIds).toContain(201);
      expect(res.mediaIds).toContain(202);
      expect(res.mediaIds).toContain(203);
      expect(res.mediaDocumentIds).toContain('doc-video-201');
      expect(res.mediaDocumentIds).toContain('doc-audio-202');
      expect(res.mediaDocumentIds).toContain('doc-file-203');
      expect(res.linksByCollection['api::article.article']?.[0]?.documentId).toBe(
        'doc-article-99'
      );
    });

    it('handles null or primitive inputs safely', () => {
      expect(extractRelationsFromJSON(null)).toEqual({
        mediaAssets: [],
        mediaIds: [],
        mediaDocumentIds: [],
        internalLinks: [],
        linksByCollection: {},
      });
    });
  });
});
