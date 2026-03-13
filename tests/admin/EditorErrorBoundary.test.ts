import { describe, it, expect, vi } from 'vitest';

// Mock @strapi/design-system since EditorErrorBoundary imports it
vi.mock('@strapi/design-system', () => ({
  Box: 'Box',
  Typography: 'Typography',
  Button: 'Button',
}));

import { EditorErrorBoundary } from '../../admin/src/components/EditorErrorBoundary';

describe('EditorErrorBoundary', () => {
  it('is exported as a class (function)', () => {
    expect(typeof EditorErrorBoundary).toBe('function');
  });

  it('has getDerivedStateFromError static method', () => {
    expect(typeof EditorErrorBoundary.getDerivedStateFromError).toBe('function');
  });

  it('getDerivedStateFromError returns hasError: true with the error', () => {
    const error = new Error('test error');
    const result = EditorErrorBoundary.getDerivedStateFromError(error);
    expect(result).toEqual({ hasError: true, error });
  });

  it('prototype has componentDidCatch method', () => {
    expect(typeof EditorErrorBoundary.prototype.componentDidCatch).toBe('function');
  });

  it('componentDidCatch logs with [TiptapEditor] prefix', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const instance = new EditorErrorBoundary({ children: null });
      const error = new Error('render crash');
      const errorInfo = { componentStack: 'at Foo' } as any;
      instance.componentDidCatch(error, errorInfo);
      expect(consoleSpy).toHaveBeenCalledWith('[TiptapEditor] Editor crashed:', error, errorInfo);
    } finally {
      consoleSpy.mockRestore();
    }
  });

  it('has initial state with hasError: false and error: null', () => {
    const instance = new EditorErrorBoundary({ children: null });
    expect(instance.state).toEqual({ hasError: false, error: null });
  });

  it('handleRetry resets state to hasError: false and error: null', () => {
    const instance = new EditorErrorBoundary({ children: null });
    // Simulate error state
    instance.state = { hasError: true, error: new Error('crash') };
    // Mock setState to capture the state update
    const setStateCalls: any[] = [];
    instance.setState = ((update: any) => {
      setStateCalls.push(update);
      Object.assign(instance.state, update);
    }) as any;
    instance.handleRetry();
    expect(setStateCalls[0]).toEqual({ hasError: false, error: null });
    expect(instance.state.hasError).toBe(false);
    expect(instance.state.error).toBeNull();
  });
});
