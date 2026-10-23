import { useCallback, useRef } from 'react';
import type { Editor } from '@tiptap/core';

/**
 * WCAG 2.1 AA Roving TabIndex & Keyboard Navigation Hook for the Editor Toolbar.
 * - ArrowRight / ArrowDown: Move focus to next enabled toolbar control (wraps around)
 * - ArrowLeft / ArrowUp: Move focus to previous enabled toolbar control (wraps around)
 * - Home: Move focus to first enabled toolbar control
 * - End: Move focus to last enabled toolbar control
 * - Escape: Return focus to the Tiptap ProseMirror editor canvas
 */
export function useKeyboardNavigation(editor: Editor | null) {
  const toolbarRef = useRef<HTMLDivElement | null>(null);

  const getFocusableControls = useCallback((): HTMLElement[] => {
    const container = toolbarRef.current;
    if (!container) return [];
    const selector =
      'button:not([disabled]):not([style*="display: none"]), [role="combobox"]:not([aria-disabled="true"]), input:not([disabled])';
    return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
      (el) => el.offsetParent !== null && el.closest?.('[data-measure]') === null
    );
  }, []);

  const handleToolbarKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement | null;
      const container = toolbarRef.current;
      // Ignore keyboard events originating from portaled dialogs/popovers outside the toolbar DOM container
      if (!container || !target || !container.contains(target)) {
        return;
      }
      // Allow native text cursor navigation and Escape inside input/textarea fields
      const tagName = target.tagName?.toUpperCase();
      if (tagName === 'INPUT' || tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        editor?.commands.focus();
        return;
      }

      const isCombobox = Boolean(target.closest?.('[role="combobox"]'));
      // Do not hijack ArrowUp/ArrowDown/Home/End inside a combobox select trigger
      if (
        isCombobox &&
        (event.key === 'ArrowUp' ||
          event.key === 'ArrowDown' ||
          event.key === 'Home' ||
          event.key === 'End')
      ) {
        return;
      }

      const isNext = event.key === 'ArrowRight' || event.key === 'ArrowDown';
      const isPrev = event.key === 'ArrowLeft' || event.key === 'ArrowUp';
      const isHome = event.key === 'Home';
      const isEnd = event.key === 'End';

      if (!isNext && !isPrev && !isHome && !isEnd) {
        return;
      }

      const controls = getFocusableControls();
      if (controls.length === 0) return;

      const activeEl = document.activeElement as HTMLElement | null;
      const currentIndex = activeEl ? controls.indexOf(activeEl) : -1;

      let targetIndex = 0;
      if (isHome) {
        targetIndex = 0;
      } else if (isEnd) {
        targetIndex = controls.length - 1;
      } else if (isNext) {
        targetIndex = currentIndex >= 0 ? (currentIndex + 1) % controls.length : 0;
      } else if (isPrev) {
        targetIndex = currentIndex > 0 ? currentIndex - 1 : controls.length - 1;
      }

      const nextTarget = controls[targetIndex];
      if (nextTarget) {
        event.preventDefault();
        nextTarget.focus();
      }
    },
    [editor, getFocusableControls]
  );

  return {
    toolbarRef,
    handleToolbarKeyDown,
  };
}
