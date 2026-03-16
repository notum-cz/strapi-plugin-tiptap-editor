import { Editor } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';
import { useRef, useState } from 'react';
import { Popover } from '@strapi/design-system';
import { ToolbarButton } from '../components/ToolbarButton';
import { ColorPickerPopover } from '../components/ColorPickerPopover';
import { useThemeConfig } from '../hooks/useThemeConfig';

// ─── Icon ─────────────────────────────────────────────────────────────────────

function HighlightColorIcon({ underColor }: { underColor: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      {/* Simplified highlighter pen body */}
      <polygon points="3,10 6,2 10,2 13,10" fill="currentColor" opacity="0.7" />
      <rect x="5" y="10" width="6" height="1.5" fill="currentColor" />
      {/* Colored underbar showing active highlight color */}
      <rect x="2" y="13" width="12" height="2" fill={underColor} rx="1" />
    </svg>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useHighlightColor(editor: Editor | null, props: { disabled?: boolean } = {}) {
  const themeConfig = useThemeConfig();
  const colors = themeConfig?.colors ?? [];

  const editorState = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) return { activeColor: undefined };
      return {
        activeColor: ctx.editor.getAttributes('highlight').color as string | undefined,
      };
    },
  });

  const selectionRef = useRef<{ from: number; to: number } | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  if (colors.length === 0) {
    return { highlightColorButton: null };
  }

  const openPicker = () => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    selectionRef.current = { from, to };
    setShowPicker(true);
  };

  const restoreSelection = () => {
    if (!editor || !selectionRef.current) return;
    const sel = selectionRef.current;
    editor.chain().setTextSelection({ from: sel.from, to: sel.to }).run();
  };

  const handleSelect = (color: string) => {
    if (!editor) return;
    restoreSelection();
    editor.chain().focus().setHighlight({ color }).run();
    setShowPicker(false);
  };

  const handleRemove = () => {
    if (!editor) return;
    restoreSelection();
    editor.chain().focus().unsetHighlight().run();
    setShowPicker(false);
  };

  const handleInteractOutside = () => {
    restoreSelection();
    setShowPicker(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      openPicker();
    } else {
      handleInteractOutside();
    }
  };

  const activeColor = editorState?.activeColor;
  const underColor = activeColor ?? '#999999';

  return {
    highlightColorButton: (
      <Popover.Root open={showPicker} onOpenChange={handleOpenChange}>
        <Popover.Anchor>
          <ToolbarButton
            onClick={() => setShowPicker((v) => !v)}
            icon={<HighlightColorIcon underColor={underColor} />}
            active={showPicker}
            disabled={props.disabled || !editor}
            tooltip="Highlight color"
          />
        </Popover.Anchor>
        <Popover.Content
          side="bottom"
          align="start"
          sideOffset={4}
          onInteractOutside={handleInteractOutside}
        >
          <ColorPickerPopover
            colors={colors}
            activeColor={activeColor}
            onSelect={handleSelect}
            onRemove={handleRemove}
          />
        </Popover.Content>
      </Popover.Root>
    ),
  };
}
