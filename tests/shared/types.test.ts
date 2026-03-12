import { describe, it, expect } from 'vitest';
import {
  PRESET_FEATURE_KEYS,
  MINIMAL_PRESET_CONFIG,
  isFeatureEnabled,
  getFeatureOptions,
} from '../../shared/types';

describe('PRESET_FEATURE_KEYS (TYPES-03)', () => {
  it('contains exactly 18 keys', () => {
    expect(PRESET_FEATURE_KEYS).toHaveLength(18);
  });
  it('contains all expected feature names', () => {
    expect(PRESET_FEATURE_KEYS).toContain('bold');
    expect(PRESET_FEATURE_KEYS).toContain('italic');
    expect(PRESET_FEATURE_KEYS).toContain('underline');
    expect(PRESET_FEATURE_KEYS).toContain('heading');
    expect(PRESET_FEATURE_KEYS).toContain('table');
    expect(PRESET_FEATURE_KEYS).toContain('textAlign');
    expect(PRESET_FEATURE_KEYS).toContain('superscript');
    expect(PRESET_FEATURE_KEYS).toContain('subscript');
  });
});

describe('MINIMAL_PRESET_CONFIG', () => {
  it('equals { bold: true, italic: true }', () => {
    expect(MINIMAL_PRESET_CONFIG).toStrictEqual({ bold: true, italic: true });
  });
});

describe('isFeatureEnabled (TYPES-04)', () => {
  it('returns false for undefined (absent key = disabled)', () => {
    expect(isFeatureEnabled(undefined)).toBe(false);
  });
  it('returns true for true', () => {
    expect(isFeatureEnabled(true)).toBe(true);
  });
  it('returns false for false', () => {
    expect(isFeatureEnabled(false)).toBe(false);
  });
  it('returns true for an options object (feature enabled with config)', () => {
    expect(isFeatureEnabled({ levels: [1, 2] })).toBe(true);
  });
  it('returns false for an object with enabled: false', () => {
    expect(isFeatureEnabled({ enabled: false })).toBe(false);
  });
  it('returns false for an object with disabled: true', () => {
    expect(isFeatureEnabled({ disabled: true })).toBe(false);
  });
  it('returns true for an object with disabled: false', () => {
    expect(isFeatureEnabled({ disabled: false })).toBe(true);
  });
});

describe('getFeatureOptions (TYPES-05)', () => {
  it('returns null when value is false (explicitly disabled)', () => {
    expect(getFeatureOptions(false, { x: 1 })).toBeNull();
  });
  it('returns defaults when value is true', () => {
    expect(getFeatureOptions(true, { x: 1 })).toStrictEqual({ x: 1 });
  });
  it('returns defaults when value is undefined', () => {
    expect(getFeatureOptions(undefined, { x: 1 })).toStrictEqual({ x: 1 });
  });
  it('merges options object with defaults (options override defaults)', () => {
    expect(getFeatureOptions({ a: 2 }, { a: 1, b: 3 })).toStrictEqual({ a: 2, b: 3 });
  });
});
