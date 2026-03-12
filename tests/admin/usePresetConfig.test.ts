import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock React hooks
const mockSetState = vi.fn();
let useStateCallIndex = 0;
let useEffectCallback: (() => void | (() => void)) | null = null;

vi.mock('react', () => ({
  useState: (initial: any) => {
    useStateCallIndex++;
    return [initial, mockSetState];
  },
  useEffect: (cb: () => void | (() => void)) => {
    useEffectCallback = cb;
  },
  useMemo: (fn: () => any) => fn(),
}));

// Mock useFetchClient
const mockGet = vi.fn();
vi.mock('@strapi/strapi/admin', () => ({
  useFetchClient: () => ({ get: mockGet }),
}));

import { usePresetConfig } from '../../admin/src/hooks/usePresetConfig';
import { MINIMAL_PRESET_CONFIG } from '../../shared/types';

describe('usePresetConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useStateCallIndex = 0;
    useEffectCallback = null;
  });

  it('exports usePresetConfig as a function', () => {
    expect(typeof usePresetConfig).toBe('function');
  });

  it('returns config and isLoading properties', () => {
    const result = usePresetConfig(undefined);
    expect(result).toHaveProperty('config');
    expect(result).toHaveProperty('isLoading');
  });

  it('returns MINIMAL_PRESET_CONFIG immediately when presetName is undefined', () => {
    const result = usePresetConfig(undefined);
    expect(result.config).toEqual(MINIMAL_PRESET_CONFIG);
    expect(result.isLoading).toBe(false);
  });

  it('returns MINIMAL_PRESET_CONFIG immediately when presetName is empty string', () => {
    const result = usePresetConfig('');
    expect(result.config).toEqual(MINIMAL_PRESET_CONFIG);
    expect(result.isLoading).toBe(false);
  });

  it('returns MINIMAL_PRESET_CONFIG immediately when presetName is whitespace only', () => {
    const result = usePresetConfig('   ');
    expect(result.config).toEqual(MINIMAL_PRESET_CONFIG);
    expect(result.isLoading).toBe(false);
  });

  it('returns null config and isLoading=true when preset name is provided', () => {
    const result = usePresetConfig('my-preset');
    expect(result.config).toBeNull();
    expect(result.isLoading).toBe(true);
  });

  it('calls get with correct URL when preset name is provided', async () => {
    mockGet.mockResolvedValue({ data: { bold: true, italic: true, strike: true } });
    usePresetConfig('my-preset');

    // Execute the effect callback
    if (useEffectCallback) {
      useEffectCallback();
    }

    // Wait for async operations
    await vi.waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/tiptap-editor/presets/my-preset');
    });
  });

  it('does not call get when preset name is undefined', () => {
    usePresetConfig(undefined);

    if (useEffectCallback) {
      useEffectCallback();
    }

    expect(mockGet).not.toHaveBeenCalled();
  });
});
