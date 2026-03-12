import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock React - capture useState/useEffect for inspection
const mockSetState = vi.fn();
let useEffectCallback: (() => void | (() => void)) | null = null;
let useStateCallIndex = 0;

vi.mock('react', () => ({
  useState: (initial: any) => {
    useStateCallIndex++;
    return [initial, mockSetState];
  },
  useEffect: (cb: () => void | (() => void)) => {
    useEffectCallback = cb;
  },
}));

// Mock useFetchClient
const mockGet = vi.fn();
vi.mock('@strapi/strapi/admin', () => ({
  useFetchClient: () => ({ get: mockGet }),
}));

// Mock @strapi/design-system with string identifiers so we can inspect JSX structure
vi.mock('@strapi/design-system', () => ({
  SingleSelect: 'SingleSelect',
  SingleSelectOption: 'SingleSelectOption',
}));

import { PresetSelect } from '../../admin/src/components/PresetSelect';

describe('PresetSelect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useEffectCallback = null;
    useStateCallIndex = 0;
  });

  it('exports PresetSelect as a function', () => {
    expect(typeof PresetSelect).toBe('function');
  });

  it('registers a useEffect that calls get("/tiptap-editor/presets") on mount', async () => {
    mockGet.mockResolvedValue({ data: { presets: ['blog', 'minimal'] } });

    const onChange = vi.fn();
    PresetSelect({ value: undefined, onChange });

    expect(useEffectCallback).not.toBeNull();

    // Execute the effect callback (simulates mount)
    useEffectCallback!();

    await vi.waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/tiptap-editor/presets');
    });
  });

  it('renders SingleSelect with disabled=true when in initial loading state (isLoading=true)', () => {
    mockGet.mockReturnValue(new Promise(() => {})); // never resolves
    const onChange = vi.fn();
    const result: any = PresetSelect({ value: undefined, onChange });
    // The JSX element for SingleSelect should have disabled prop = true (initial isLoading=true)
    expect(result).not.toBeNull();
    expect(result.type).toBe('SingleSelect');
    expect(result.props.disabled).toBe(true);
  });

  it('renders with the provided value prop as the selected value', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    const onChange = vi.fn();
    const result: any = PresetSelect({ value: 'blog', onChange });
    expect(result.type).toBe('SingleSelect');
    expect(result.props.value).toBe('blog');
  });

  it('shows "No presets available" placeholder when presets is empty (initial state)', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    const onChange = vi.fn();
    const result: any = PresetSelect({ value: undefined, onChange });
    expect(result.type).toBe('SingleSelect');
    expect(result.props.placeholder).toBe('No presets available');
  });

  it('onChange prop on SingleSelect calls the provided onChange with CTB-compatible payload', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    const onChange = vi.fn();
    const result: any = PresetSelect({ value: undefined, onChange, name: 'options.preset' });
    // Invoke the onChange prop of the rendered SingleSelect element
    result.props.onChange('blog');
    expect(onChange).toHaveBeenCalledWith({
      target: { name: 'options.preset', value: 'blog', type: 'select' },
    });
  });

  it('calls setPresets with fetch response data on successful fetch', async () => {
    mockGet.mockResolvedValue({ data: { presets: ['blog', 'minimal'] } });
    const onChange = vi.fn();

    PresetSelect({ value: undefined, onChange });

    if (useEffectCallback) {
      useEffectCallback();
    }

    await vi.waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/tiptap-editor/presets');
    });

    // setPresets should have been called with ['blog', 'minimal']
    await vi.waitFor(() => {
      expect(mockSetState).toHaveBeenCalledWith(['blog', 'minimal']);
    });
  });

  it('calls setPresets with empty array when fetch fails', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));
    const onChange = vi.fn();

    PresetSelect({ value: undefined, onChange });

    if (useEffectCallback) {
      useEffectCallback();
    }

    await vi.waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/tiptap-editor/presets');
    });

    // On error, setPresets([]) should be called
    await vi.waitFor(() => {
      expect(mockSetState).toHaveBeenCalledWith([]);
    });
  });
});
