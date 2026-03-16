import { describe, it, expect } from 'vitest';
import { FeatureGuard } from '../../admin/src/components/FeatureGuard';

describe('FeatureGuard', () => {
  it('is exported as a function', () => {
    expect(typeof FeatureGuard).toBe('function');
  });

  it('renders children when featureValue is true', () => {
    const result = FeatureGuard({ featureValue: true, children: 'test-child' });
    expect(result).toBe('test-child');
  });

  it('renders null when featureValue is false', () => {
    const result = FeatureGuard({ featureValue: false, children: 'test-child' });
    expect(result).toBeNull();
  });

  it('renders null when featureValue is undefined (absent key = disabled)', () => {
    const result = FeatureGuard({ featureValue: undefined, children: 'test-child' });
    expect(result).toBeNull();
  });

  it('renders children when featureValue is an object config', () => {
    const result = FeatureGuard({ featureValue: { levels: [1, 2] }, children: 'test-child' });
    expect(result).toBe('test-child');
  });

  it('renders null when featureValue is an object with enabled: false', () => {
    const result = FeatureGuard({ featureValue: { enabled: false }, children: 'test-child' });
    expect(result).toBeNull();
  });
});
