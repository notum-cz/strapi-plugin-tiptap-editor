import dns from 'node:dns';
import fs from 'node:fs';
import { fetch as undiciFetch } from 'undici';
import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('undici', async () => {
  const actual = await vi.importActual<typeof import('undici')>('undici');
  return {
    ...actual,
    fetch: vi.fn((...args: any[]) => (globalThis.fetch as any)(...args)),
  };
});

import createSettingsService from '../../server/src/services/settings';
import createSearchService from '../../server/src/services/search';
import createMediaService, {
  isPrivateIpAddress,
  isSsrfSafeUrl,
  assertSafeResolvedHost,
} from '../../server/src/services/media';
import createMediaController from '../../server/src/controllers/media';
import createSearchController from '../../server/src/controllers/search';
import bootstrap from '../../server/src/bootstrap';

describe('server/services/settings', () => {
  it('returns default runtime settings merged with store values', async () => {
    let storedValue: any = null;
    const mockStore = {
      get: vi.fn(async () => storedValue),
      set: vi.fn(async ({ value }) => {
        storedValue = value;
      }),
    };
    const mockStrapi = {
      config: { get: vi.fn(() => ({})) },
      store: vi.fn(() => mockStore),
    } as any;

    const service = createSettingsService({ strapi: mockStrapi });
    const initial = await service.getSettings();
    expect(initial.defaultPreset).toBe('default');
    expect(initial.defaultOutputFormat).toBe('json');
    expect(initial.enableRelationalSync).toBe(true);

    const updated = await service.updateSettings({
      defaultPreset: 'edifice',
      defaultOutputFormat: 'markdown',
      allowedIframeDomains: ['YouTube.com', 'vimeo.com'],
      presetOverrides: {
        edifice: { bold: true, mathematics: true },
      },
    });
    expect(updated.defaultPreset).toBe('edifice');
    expect(updated.defaultOutputFormat).toBe('markdown');
    expect(updated.allowedIframeDomains).toEqual(['youtube.com', 'vimeo.com']);
    expect(updated.presetOverrides.edifice?.mathematics).toBe(true);
    expect(storedValue).toEqual({
      defaultPreset: 'edifice',
      defaultOutputFormat: 'markdown',
      allowedIframeDomains: ['youtube.com', 'vimeo.com'],
      presetOverrides: {
        edifice: { bold: true, mathematics: true },
      },
    });
  });

  it('preserves config/plugins.ts settings and only persists admin-changed overrides', async () => {
    let storedValue: any = null;
    const mockStore = {
      get: vi.fn(async () => storedValue),
      set: vi.fn(async ({ value }) => {
        storedValue = value;
      }),
    };
    const mockStrapi = {
      config: {
        get: vi.fn(() => ({
          defaultPreset: 'blog',
          enableRelationalSync: false,
        })),
      },
      store: vi.fn(() => mockStore),
    } as any;

    const service = createSettingsService({ strapi: mockStrapi });
    const initial = await service.getSettings();
    expect(initial.defaultPreset).toBe('blog');
    expect(initial.enableRelationalSync).toBe(false);

    // Updating only defaultOutputFormat should not freeze defaultPreset or enableRelationalSync in store
    const afterUpdate = await service.updateSettings({
      defaultOutputFormat: 'html',
    });
    expect(afterUpdate.defaultPreset).toBe('blog');
    expect(afterUpdate.enableRelationalSync).toBe(false);
    expect(afterUpdate.defaultOutputFormat).toBe('html');
    expect(storedValue).toEqual({ defaultOutputFormat: 'html' });
  });

  it('rejects invalid output formats or unknown feature keys', async () => {
    const mockStrapi = {
      config: { get: vi.fn(() => ({})) },
      store: vi.fn(() => ({ get: vi.fn(), set: vi.fn() })),
    } as any;
    const service = createSettingsService({ strapi: mockStrapi });

    await expect(
      service.updateSettings({ defaultOutputFormat: 'xml' })
    ).rejects.toThrow('Invalid defaultOutputFormat');

    await expect(
      service.updateSettings({
        presetOverrides: { default: { unknownFeatureXYZ: true } },
      })
    ).rejects.toThrow('Unknown feature key');

    await expect(
      service.updateSettings({
        presetOverrides: { default: { bold: 'invalid-string' as any } },
      })
    ).rejects.toThrow('Invalid value for "bold"');
  });
});

describe('server/services/search', () => {
  const mockStrapi = {
    contentTypes: {
      'api::article.article': {
        kind: 'collectionType',
        info: { pluralName: 'articles' },
        attributes: {
          title: { type: 'string' },
          body: { type: 'richtext' },
        },
      },
    },
    components: {},
    documents: vi.fn(() => ({
      findMany: vi.fn(async () => [
        {
          documentId: 'doc-101',
          id: 1,
          title: 'Getting Started with Tiptap',
          publishedAt: '2026-10-09T00:00:00Z',
          locale: 'en',
        },
      ]),
      findOne: vi.fn(async ({ documentId }: { documentId: string }) =>
        documentId === 'doc-101'
          ? {
              documentId: 'doc-101',
              id: 1,
              title: 'Getting Started with Tiptap',
              publishedAt: null,
              locale: 'en',
            }
          : null
      ),
    })),
  } as any;

  const allowAllAbility = {
    can: () => true,
    cannot: () => false,
  };

  it('identifies collection title field and searches across linkable collections', async () => {
    const service = createSearchService({ strapi: mockStrapi });
    expect(service.identifyCollectionTitleField('api::article.article')).toBe('title');

    const results = await service.search('Tiptap', 'en', allowAllAbility);
    expect(results['api::article.article']).toHaveLength(1);
    expect(results['api::article.article'][0]).toEqual({
      documentId: 'doc-101',
      id: 1,
      label: 'Getting Started with Tiptap',
      collectionName: 'api::article.article',
      status: 'published',
      locale: 'en',
    });
  });

  it('resolves a single document by collection UID and documentId', async () => {
    const service = createSearchService({ strapi: mockStrapi });
    const doc = await service.getDocument(
      'api::article.article',
      'doc-101',
      undefined,
      allowAllAbility
    );
    expect(doc?.label).toBe('Getting Started with Tiptap');
    expect(doc?.status).toBe('draft');
  });

  it('rejects invalid collectionName or documentId formats', async () => {
    const service = createSearchService({ strapi: mockStrapi });
    expect(() => service.identifyCollectionTitleField('invalid-uid')).toThrow(
      'Invalid collectionName format'
    );
    await expect(
      service.getDocument('api::article.article', '../traversal', undefined, allowAllAbility)
    ).rejects.toThrow('Invalid documentId format');
  });

  it('fails closed when userAbility is missing or denies read access', async () => {
    const service = createSearchService({ strapi: mockStrapi });

    // Missing userAbility fails closed
    expect(await service.search('Tiptap', 'en')).toEqual({});
    await expect(service.getDocument('api::article.article', 'doc-101')).rejects.toThrow(
      'Forbidden'
    );

    const restrictedAbility = {
      cannot: (action: string, subject: string) =>
        action === 'plugin::content-manager.explorer.read' && subject === 'api::article.article',
    };
    const results = await service.search('Tiptap', 'en', restrictedAbility);
    expect(results['api::article.article']).toBeUndefined();
    await expect(
      service.getDocument('api::article.article', 'doc-101', undefined, restrictedAbility)
    ).rejects.toThrow('Forbidden');
  });

  it('skips private attributes when selecting collection title field', () => {
    const strapiWithPrivateAttrs = {
      contentTypes: {
        'api::account.account': {
          kind: 'collectionType',
          attributes: {
            title: { type: 'string', private: true },
            secretToken: { type: 'string', private: true },
            displayName: { type: 'string', private: false },
          },
        },
        'api::vault.vault': {
          kind: 'collectionType',
          attributes: {
            secretKey: { type: 'string', private: true },
          },
        },
      },
    } as any;

    const service = createSearchService({ strapi: strapiWithPrivateAttrs });
    expect(service.identifyCollectionTitleField('api::account.account')).toBe('displayName');
    expect(service.identifyCollectionTitleField('api::vault.vault')).toBe('documentId');
  });

  it('does not fall back to unrelated api::* collections when links.links defines targets that userAbility cannot read', () => {
    const strapiWithConfiguredLinks = {
      contentTypes: {
        'api::article.article': {
          kind: 'collectionType',
          info: { pluralName: 'articles' },
        },
        'api::public-note.public-note': {
          kind: 'collectionType',
          info: { pluralName: 'public-notes' },
        },
      },
      components: {
        'links.links': {
          attributes: {
            articles: { type: 'relation', target: 'api::article.article' },
          },
        },
      },
    } as any;

    const abilityDenyingArticlesOnly = {
      cannot: (action: string, subject: string) =>
        action === 'plugin::content-manager.explorer.read' && subject === 'api::article.article',
    };

    const service = createSearchService({ strapi: strapiWithConfiguredLinks });
    expect(service.getLinkableCollections(abilityDenyingArticlesOnly)).toEqual([]);
  });

  it('enforces field-level read permission on titleField in search and getDocument', async () => {
    const service = createSearchService({ strapi: mockStrapi });
    const denyTitleFieldAbility = {
      cannot: (action: string, subject: string, field?: string) =>
        action === 'plugin::content-manager.explorer.read' &&
        subject === 'api::article.article' &&
        field === 'title',
    };

    const results = await service.search('Tiptap', 'en', denyTitleFieldAbility);
    expect(results['api::article.article']).toBeUndefined();

    await expect(
      service.getDocument('api::article.article', 'doc-101', undefined, denyTitleFieldAbility)
    ).rejects.toThrow('Forbidden');
  });
});

describe('server/services/media (SSRF Protection & Metadata)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('blocks localhost, private IPs, metadata IPs, IPv4-mapped IPv6, CGNAT, 0.0.0.0, trailing dots, and non-http protocols', () => {
    expect(isSsrfSafeUrl('http://localhost:1337/admin')).toBe(false);
    expect(isSsrfSafeUrl('http://localhost./admin')).toBe(false);
    expect(isSsrfSafeUrl('http://127.0.0.1:8080/secret')).toBe(false);
    expect(isSsrfSafeUrl('http://0.0.0.0:1337/admin')).toBe(false);
    expect(isSsrfSafeUrl('http://100.64.0.1/cgnat')).toBe(false);
    expect(isSsrfSafeUrl('http://[::ffff:127.0.0.1]:1337/')).toBe(false);
    expect(isSsrfSafeUrl('http://[0:0:0:0:0:ffff:7f00:1]/')).toBe(false);
    expect(isSsrfSafeUrl('http://2130706433/')).toBe(false);
    expect(isSsrfSafeUrl('http://169.254.169.254/latest/meta-data')).toBe(false);
    expect(isSsrfSafeUrl('http://10.0.0.1/internal')).toBe(false);
    expect(isSsrfSafeUrl('http://192.168.1.50/router')).toBe(false);
    expect(isSsrfSafeUrl('http://172.16.0.5/cluster')).toBe(false);
    expect(isSsrfSafeUrl('file:///etc/passwd')).toBe(false);
    expect(isSsrfSafeUrl('https://user:pass@example.com/image.jpg')).toBe(false);
    expect(isSsrfSafeUrl('https://strapi.io/assets/logo.png')).toBe(true);
  });

  it('enforces IPv6 BlockList boundaries for special-use CIDRs and fails closed for non-IPv6 values', () => {
    // ::/96 (IPv4-compatible, loopback, unspecified)
    expect(isPrivateIpAddress('::')).toBe(true);
    expect(isPrivateIpAddress('::1')).toBe(true);
    expect(isPrivateIpAddress('::7f00:1')).toBe(true);
    expect(isPrivateIpAddress('::ffff:ffff')).toBe(true);

    // 64:ff9b::/96 and 64:ff9b:1::/48 (NAT64)
    expect(isPrivateIpAddress('64:ff9b::a00:1')).toBe(true);
    expect(isPrivateIpAddress('64:ff9b::ffff:ffff')).toBe(true);
    expect(isPrivateIpAddress('64:ff9b:1::1')).toBe(true);
    expect(isPrivateIpAddress('64:ff9b:1:ffff:ffff:ffff:ffff:ffff')).toBe(true);
    expect(isPrivateIpAddress('64:ff9b:2::1')).toBe(false);

    // 2001::/32 (Teredo) and 2001:db8::/32 (documentation)
    expect(isPrivateIpAddress('2001::1')).toBe(true);
    expect(isPrivateIpAddress('2001:0:ffff:ffff:ffff:ffff:ffff:ffff')).toBe(true);
    expect(isPrivateIpAddress('2001:db8::1')).toBe(true);
    expect(isPrivateIpAddress('2001:db8:ffff:ffff:ffff:ffff:ffff:ffff')).toBe(true);
    expect(isPrivateIpAddress('2001:4860:4860::8888')).toBe(false);

    // 2002::/16 (6to4)
    expect(isPrivateIpAddress('2002::1')).toBe(true);
    expect(isPrivateIpAddress('2002:7f00:1::')).toBe(true);
    expect(isPrivateIpAddress('2003::1')).toBe(false);

    // fc00::/7 (unique-local), fe80::/10 (link-local), ff00::/8 (multicast)
    expect(isPrivateIpAddress('fc00::1')).toBe(true);
    expect(isPrivateIpAddress('fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff')).toBe(true);
    expect(isPrivateIpAddress('fe7f:ffff:ffff:ffff:ffff:ffff:ffff:ffff')).toBe(false);
    expect(isPrivateIpAddress('fe80::1')).toBe(true);
    expect(isPrivateIpAddress('febf:ffff:ffff:ffff:ffff:ffff:ffff:ffff')).toBe(true);
    expect(isPrivateIpAddress('fec0::1')).toBe(false);
    expect(isPrivateIpAddress('ff00::1')).toBe(true);
    expect(isPrivateIpAddress('ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff')).toBe(true);

    // Public IPv4-mapped IPv6 and public IPv6
    expect(isPrivateIpAddress('::ffff:93.184.216.34')).toBe(false);
    expect(isPrivateIpAddress('2606:4700:4700::1111')).toBe(false);

    // Invalid IP string fails closed
    expect(isPrivateIpAddress('not-an-ip')).toBe(true);
  });

  it('extracts HTML title and OpenGraph meta tags accurately when non-ASCII characters like İ precede tags', async () => {
    vi.spyOn(dns.promises, 'lookup').mockResolvedValueOnce([
      { address: '93.184.216.34', family: 4 },
    ] as any);

    const html = [
      '<!doctype html><html><head>',
      '<!-- İstanbul İİİ -->',
      '<TITLE>İstanbul Rehberi</TITLE>',
      '<META property="og:description" content="İstanbul — Boğaziçi" />',
      '</head><body></body></html>',
    ].join('');

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => html,
    } as unknown as Response);

    const service = createMediaService({ strapi: {} as any });
    const preview = await service.getLinkPreview('https://example.com/istanbul');
    expect(preview.title).toBe('İstanbul Rehberi');
    expect(preview.description).toBe('İstanbul — Boğaziçi');
  });

  it('blocks getLinkPreview 301 redirects to private or metadata endpoints before following the redirect', async () => {
    vi.spyOn(dns.promises, 'lookup').mockResolvedValueOnce([
      { address: '93.184.216.34', family: 4 },
    ] as any);

    const cancelSpy = vi.fn().mockResolvedValue(undefined);
    const fetchMock = vi.mocked(undiciFetch);
    fetchMock.mockClear();

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 301,
      headers: new Headers({ location: 'http://169.254.169.254/latest/meta-data' }),
      body: { cancel: cancelSpy },
    } as unknown as Response);

    const service = createMediaService({ strapi: {} as any });
    await expect(service.getLinkPreview('https://example.com/redirect-ssrf')).rejects.toThrow(
      'Remote preview URL redirects. Provide the final URL.'
    );

    expect(cancelSpy).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://example.com/redirect-ssrf');
    expect((fetchMock.mock.calls[0]?.[1] as { redirect?: string })?.redirect).toBe('manual');
  });

  it('fails closed on DNS lookup errors and blocks private resolved IPs', async () => {
    vi.spyOn(dns.promises, 'lookup').mockRejectedValueOnce(new Error('ENOTFOUND'));
    await expect(assertSafeResolvedHost('nonexistent.example.invalid')).rejects.toThrow(
      'Failed to resolve URL host'
    );

    vi.spyOn(dns.promises, 'lookup').mockResolvedValueOnce([
      { address: '10.0.0.42', family: 4 },
    ] as any);
    await expect(assertSafeResolvedHost('rebind.example.com')).rejects.toThrow(
      'disallowed private'
    );
  });

  it('validates uploadByUrl, downloads bounded bytes, and persists through Strapi Upload service', async () => {
    vi.spyOn(dns.promises, 'lookup').mockResolvedValue([
      { address: '93.184.216.34', family: 4 },
    ] as any);

    const mockBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => ({
      ok: true,
      status: 200,
      headers: {
        get: (name: string) => (name.toLowerCase() === 'content-length' ? '4' : null),
      },
      arrayBuffer: async () => mockBytes.buffer,
    }) as unknown as Response);

    const capturedUploads: any[] = [];
    const mockUpload = vi.fn(async (payload: any) => {
      expect(fs.existsSync(payload.files.filepath)).toBe(true);
      capturedUploads.push(payload);
      return [
        {
          id: 42,
          documentId: 'asset-doc-42',
          name: payload.data.fileInfo.name,
          url: `/uploads/${payload.data.fileInfo.name}`,
          mime: payload.files.mimetype,
          size: payload.files.size,
          alternativeText: payload.data.fileInfo.alternativeText,
        },
      ];
    });

    const mockStrapi = {
      plugin: vi.fn((name: string) =>
        name === 'upload'
          ? {
              service: vi.fn((svc: string) => (svc === 'upload' ? { upload: mockUpload } : null)),
            }
          : null
      ),
    } as any;

    const service = createMediaService({ strapi: mockStrapi });
    await expect(service.uploadByUrl('http://127.0.0.1/test.jpg')).rejects.toThrow(
      'SSRF safety validation'
    );

    // Rejects SVG / active content extensions
    await expect(service.uploadByUrl('https://cdn.example.com/vector.svg')).rejects.toThrow(
      'Unsupported or unsafe remote media file type'
    );

    const asset = await service.uploadByUrl(
      'https://cdn.example.com/photos/banner.jpg',
      'Hero Banner'
    );
    const call = vi.mocked(undiciFetch).mock.calls.at(-1)!;
    expect((call[1] as any).dispatcher).toBeDefined();
    expect((call[1] as any).redirect).toBe('manual');
    expect(asset.id).toBe(42);
    expect(asset.documentId).toBe('asset-doc-42');
    expect(asset.name).toBe('banner.jpg');
    expect(asset.url).toBe('/uploads/banner.jpg');
    expect(asset.alternativeText).toBe('Hero Banner');
    expect(asset.mime).toBe('image/jpeg');
    expect(fs.existsSync(capturedUploads[0].files.filepath)).toBe(false);

    const videoAsset = await service.uploadByUrl('https://cdn.example.com/media/clip.mp4');
    expect(videoAsset.mime).toBe('video/mp4');

    const pdfAsset = await service.uploadByUrl('https://cdn.example.com/docs/report.pdf');
    expect(pdfAsset.mime).toBe('application/pdf');

    // Accepts known MIME aliases (e.g. audio/x-wav for .wav) while storing canonical inferredMime
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: {
        get: (name: string) =>
          name.toLowerCase() === 'content-type'
            ? 'audio/x-wav'
            : name.toLowerCase() === 'content-length'
              ? '4'
              : null,
      },
      arrayBuffer: async () => mockBytes.buffer,
    } as unknown as Response);
    const wavAsset = await service.uploadByUrl('https://cdn.example.com/audio/clip.wav');
    expect(wavAsset.mime).toBe('audio/wav');

    // Rejects mismatched Content-Type header (e.g. text/html served for .jpg)
    const cancelMismatchMock = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: {
        get: (name: string) => (name.toLowerCase() === 'content-type' ? 'text/html' : null),
      },
      body: { cancel: cancelMismatchMock },
    } as unknown as Response);
    await expect(
      service.uploadByUrl('https://cdn.example.com/photos/spoofed.jpg')
    ).rejects.toThrow('does not match expected type');
    expect(cancelMismatchMock).toHaveBeenCalledTimes(1);

    // Cancels response body and throws clear error on 3xx redirects
    const cancelMock = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 301,
      body: { cancel: cancelMock },
    } as unknown as Response);
    await expect(
      service.uploadByUrl('https://cdn.example.com/photos/redirect.jpg')
    ).rejects.toThrow('Remote media URL redirects. Provide the final URL.');
    expect(cancelMock).toHaveBeenCalledTimes(1);

    // Propagates failure when Upload service is unavailable
    const brokenService = createMediaService({ strapi: {} as any });
    await expect(
      brokenService.uploadByUrl('https://cdn.example.com/photos/banner.jpg')
    ).rejects.toThrow('Strapi upload service is unavailable');
  });
});

describe('server/bootstrap', () => {
  it('registers RBAC permissions without seeding default settings in core-store or mutating schema components', async () => {
    const mockSet = vi.fn();
    const mockRegisterMany = vi.fn();
    const mockCreateComponent = vi.fn();
    const mockStrapi = {
      admin: {
        services: {
          permission: {
            actionProvider: {
              registerMany: mockRegisterMany,
            },
          },
        },
      },
      store: vi.fn(() => ({
        get: vi.fn(async () => null),
        set: mockSet,
      })),
      components: {},
      plugin: vi.fn(() => ({
        service: vi.fn(() => ({
          createComponent: mockCreateComponent,
        })),
      })),
      log: { info: vi.fn(), warn: vi.fn() },
    } as any;

    await bootstrap({ strapi: mockStrapi });
    expect(mockRegisterMany).toHaveBeenCalledTimes(1);
    expect(mockSet).not.toHaveBeenCalled();
    expect(mockCreateComponent).not.toHaveBeenCalled();

    const mockErrorLog = vi.fn();
    const failingStrapi = {
      admin: {
        services: {
          permission: {
            actionProvider: {
              registerMany: vi.fn(async () => {
                throw new Error('RBAC registration failed');
              }),
            },
          },
        },
      },
      log: { error: mockErrorLog },
    } as any;
    await expect(bootstrap({ strapi: failingStrapi })).rejects.toThrow('RBAC registration failed');
    expect(mockErrorLog).toHaveBeenCalledTimes(1);
  });
});

describe('server/controllers/media & search authorization', () => {
  it('enforces plugin::upload.assets.create ability in media.uploadByUrl controller', async () => {
    const uploadByUrlMock = vi.fn(async () => ({ id: 1, documentId: 'doc-1' }));
    const mockStrapi = {
      plugin: vi.fn(() => ({
        service: vi.fn(() => ({
          isSsrfSafeUrl: () => true,
          uploadByUrl: uploadByUrlMock,
        })),
      })),
    } as any;

    const controller = createMediaController({ strapi: mockStrapi });

    const throwMock = vi.fn((status: number, msg: string) => {
      const err = new Error(msg) as Error & { status?: number };
      err.status = status;
      throw err;
    });

    // Missing userAbility -> 403
    await expect(
      controller.uploadByUrl({
        state: {},
        request: { body: { url: 'https://example.com/a.jpg' } },
        throw: throwMock,
      } as any)
    ).rejects.toThrow('Forbidden');

    // Denied userAbility -> 403
    await expect(
      controller.uploadByUrl({
        state: {
          userAbility: {
            cannot: (action: string) => action === 'plugin::upload.assets.create',
          },
        },
        request: { body: { url: 'https://example.com/a.jpg' } },
        throw: throwMock,
      } as any)
    ).rejects.toThrow('Forbidden');

    expect(uploadByUrlMock).not.toHaveBeenCalled();

    // Permitted userAbility -> succeeds and forwards ctx.state.user
    const adminUser = { id: 7, email: 'editor@example.com' };
    const ctxAllowed: any = {
      state: {
        user: adminUser,
        userAbility: {
          cannot: () => false,
        },
      },
      request: { body: { url: 'https://example.com/a.jpg', alt: 'Alt' } },
      throw: throwMock,
    };
    await controller.uploadByUrl(ctxAllowed);
    expect(uploadByUrlMock).toHaveBeenCalledWith('https://example.com/a.jpg', 'Alt', adminUser);
    expect(ctxAllowed.body).toEqual({ id: 1, documentId: 'doc-1' });
  });

  it('requires usable userAbility in search controller handlers', async () => {
    const mockStrapi = {
      plugin: vi.fn(() => ({
        service: vi.fn(() => ({
          search: vi.fn(async () => ({})),
          getLinkableCollections: vi.fn(() => []),
          getDocument: vi.fn(async () => null),
          identifyCollectionTitleField: vi.fn(() => 'title'),
        })),
      })),
    } as any;

    const controller = createSearchController({ strapi: mockStrapi });
    const throwMock = vi.fn((status: number, msg: string) => {
      const err = new Error(msg) as Error & { status?: number };
      err.status = status;
      throw err;
    });

    await expect(
      controller.search({ query: { q: 'hello' }, state: {}, throw: throwMock } as any)
    ).rejects.toThrow('Forbidden');

    await expect(
      controller.getDocument({
        params: { collectionName: 'api::article.article', documentId: 'doc-1' },
        query: {},
        state: {},
        throw: throwMock,
      } as any)
    ).rejects.toThrow('Forbidden');

    await expect(
      controller.identify({
        params: { collectionName: 'api::article.article' },
        state: {},
        throw: throwMock,
      } as any)
    ).rejects.toThrow('Forbidden');
  });

  it('logs outbound fetch exceptions server-side and returns fixed sanitized messages in media controller', async () => {
    const warnMock = vi.fn();
    const mockStrapi = {
      log: { warn: warnMock },
      plugin: vi.fn(() => ({
        service: vi.fn(() => ({
          isSsrfSafeUrl: () => true,
          getLinkPreview: vi.fn(async () => {
            throw new Error('connect ECONNREFUSED 10.0.0.5:80');
          }),
          uploadByUrl: vi.fn(async () => {
            throw new Error('getaddrinfo ENOTFOUND internal.corp.local');
          }),
        })),
      })),
    } as any;

    const controller = createMediaController({ strapi: mockStrapi });
    const throwMock = vi.fn((status: number, msg: string) => {
      const err = new Error(msg) as Error & { status?: number };
      err.status = status;
      throw err;
    });

    await expect(
      controller.linkPreview({
        query: { url: 'https://example.com' },
        throw: throwMock,
      } as any)
    ).rejects.toThrow('Failed to fetch link preview');
    expect(warnMock).toHaveBeenCalledWith(
      expect.stringContaining('connect ECONNREFUSED 10.0.0.5:80')
    );

    await expect(
      controller.uploadByUrl({
        state: { userAbility: { cannot: () => false } },
        request: { body: { url: 'https://example.com/a.jpg' } },
        throw: throwMock,
      } as any)
    ).rejects.toThrow('Failed to process remote media URL');
    expect(warnMock).toHaveBeenCalledWith(
      expect.stringContaining('getaddrinfo ENOTFOUND internal.corp.local')
    );
  });

  it('scopes search and getDocument queries with Content Manager permission-checker and sanitizes unexpected getDocument errors in search controller', async () => {
    const findManyMock = vi.fn(async () => []);
    const findOneMock = vi.fn(async () => ({
      documentId: 'doc-101',
      id: 1,
      title: 'Restricted Doc',
      publishedAt: null,
      locale: 'en',
    }));
    const sanitizedReadMock = vi.fn(async (q: any) => ({
      ...q,
      filters: { $and: [q.filters, { createdBy: { id: 7 } }].filter(Boolean) },
    }));
    const cannotReadEntityMock = vi.fn(() => false);

    const strapiWithChecker = {
      contentTypes: {
        'api::article.article': {
          kind: 'collectionType',
          info: { pluralName: 'articles' },
          attributes: { title: { type: 'string' } },
        },
      },
      components: {},
      plugin: vi.fn((name: string) => {
        if (name === 'content-manager') {
          return {
            service: vi.fn(() => ({
              create: vi.fn(() => ({
                sanitizedQuery: { read: sanitizedReadMock },
                cannot: { read: cannotReadEntityMock },
              })),
            })),
          };
        }
        return {};
      }),
      documents: vi.fn(() => ({
        findMany: findManyMock,
        findOne: findOneMock,
      })),
    } as any;

    const searchService = createSearchService({ strapi: strapiWithChecker });
    const ability = { can: () => true, cannot: () => false };

    await searchService.search('Restricted', 'en', ability);
    expect(sanitizedReadMock).toHaveBeenCalledWith(
      expect.objectContaining({
        locale: 'en',
        limit: 10,
      })
    );
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({
          $and: expect.any(Array),
        }),
      })
    );

    const resolvedDoc = await searchService.getDocument(
      'api::article.article',
      'doc-101',
      'en',
      ability
    );
    expect(resolvedDoc?.documentId).toBe('doc-101');
    expect(findOneMock).toHaveBeenCalledWith(
      expect.objectContaining({
        documentId: 'doc-101',
        locale: 'en',
        filters: expect.objectContaining({
          $and: expect.any(Array),
        }),
      })
    );

    cannotReadEntityMock.mockReturnValueOnce(true);
    await expect(
      searchService.getDocument('api::article.article', 'doc-101', 'en', ability)
    ).rejects.toThrow('Forbidden');

    // Search controller getDocument logs unexpected DB errors and returns a fixed 400 message
    const warnMock = vi.fn();
    const controller = createSearchController({
      strapi: {
        log: { warn: warnMock },
        plugin: () => ({
          service: () => ({
            getDocument: async () => {
              throw new Error('SQLITE_ERROR: no such table: internal_secret_table');
            },
          }),
        }),
      } as any,
    });
    const throwMock = vi.fn((status: number, msg: string) => {
      const err = new Error(msg) as Error & { status?: number };
      err.status = status;
      throw err;
    });

    await expect(
      controller.getDocument({
        params: { collectionName: 'api::article.article', documentId: 'doc-101' },
        query: {},
        state: { userAbility: ability },
        throw: throwMock,
      } as any)
    ).rejects.toThrow('Invalid document lookup parameters');
    expect(warnMock).toHaveBeenCalledWith(
      expect.stringContaining('SQLITE_ERROR: no such table: internal_secret_table')
    );
  });
});

