import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock React hooks: the hook is called as a plain function ─────────────────
vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    useState: (init: any) => [typeof init === 'function' ? init() : init, vi.fn()],
    useMemo: (fn: () => any) => fn(),
    useEffect: vi.fn(),
    useRef: (value: any) => ({ current: value }),
  };
});

// ─── Mock @tiptap/react: capture the options and let the test drive the events ─
const mockUseEditor = vi.fn();
vi.mock('@tiptap/react', () => ({ useEditor: (options: any) => mockUseEditor(options) }));

// ─── Mock Strapi's form field ─────────────────────────────────────────────────
const onChange = vi.fn();
vi.mock('@strapi/strapi/admin', () => ({
  useField: () => ({ value: '', onChange }),
}));

import StarterKit from '@tiptap/starter-kit';
import { useTiptapEditor } from '../../admin/src/utils/tiptapUtils';

const fakeEditor = { getJSON: () => ({ type: 'doc', content: [] }) };

describe('useTiptapEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseEditor.mockImplementation(() => fakeEditor);
  });

  it('reports no content error when the editor mounts cleanly', () => {
    const result = useTiptapEditor('body', '', [StarterKit]);
    expect(result.editor).toBe(fakeEditor);
    expect(result.contentError).toBe(false);
  });

  it('flags a content error raised while the editor is created', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockUseEditor.mockImplementation((options: any) => {
      options.onContentError({
        editor: fakeEditor,
        error: new Error('[tiptap error]: Invalid JSON content'),
      });
      return fakeEditor;
    });

    const result = useTiptapEditor('body', '', [StarterKit]);

    expect(result.contentError).toBe(true);
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid content in field "body"'),
      expect.any(Error)
    );
    spy.mockRestore();
  });

  it('still persists edits after a content error', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockUseEditor.mockImplementation((options: any) => {
      options.onContentError({ editor: fakeEditor, error: new Error('x') });
      options.onUpdate({ editor: fakeEditor });
      return fakeEditor;
    });

    useTiptapEditor('body', '', [StarterKit]);

    expect(onChange).toHaveBeenCalledWith('body', JSON.stringify({ type: 'doc', content: [] }));
  });
});
