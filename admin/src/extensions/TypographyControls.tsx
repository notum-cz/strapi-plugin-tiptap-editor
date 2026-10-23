import React from 'react';
import { Editor, Extension, textInputRule } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';
import { SingleSelect, SingleSelectOption } from '@strapi/design-system';
import { Cross } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { ToolbarButton } from '../components/ToolbarButton';

export const DEFAULT_FONT_FAMILIES = [
  { label: 'Default Font', value: 'default' },
  { label: 'Sans Serif (Inter / System)', value: 'Inter, system-ui, sans-serif' },
  { label: 'Serif (Georgia)', value: 'Georgia, Cambria, serif' },
  { label: 'Monospace (Fira Code)', value: 'ui-monospace, SFMono-Regular, monospace' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
];

export const DEFAULT_FONT_SIZES = [
  'default',
  '12px',
  '14px',
  '16px',
  '18px',
  '20px',
  '24px',
  '28px',
  '32px',
  '40px',
];

export const DEFAULT_LINE_HEIGHTS = ['default', '1.0', '1.15', '1.35', '1.5', '1.75', '2.0'];

/**
 * Edifice IO Smart Typography Extension:
 * Replaces common ASCII sequences with typographic symbols while typing.
 */
export const SmartTypographyExtension = Extension.create({
  name: 'smartTypography',

  addInputRules() {
    return [
      textInputRule({ find: /--$/, replace: '—' }),
      textInputRule({ find: /\.\.\.$/, replace: '…' }),
      textInputRule({ find: /->$/, replace: '→' }),
      textInputRule({ find: /<-$/, replace: '←' }),
      textInputRule({ find: /\(c\)$/i, replace: '©' }),
      textInputRule({ find: /\(r\)$/i, replace: '®' }),
      textInputRule({ find: /\(tm\)$/i, replace: '™' }),
    ];
  },
});

/**
 * React hook providing toolbar selectors for font family, font size, line height, and clear formatting.
 */
export function useTypographyControls(
  editor: Editor | null,
  props: {
    disabled?: boolean;
    fonts?: Array<{ label: string; value: string }>;
    sizes?: string[];
    heights?: string[];
  } = { disabled: false }
) {
  const { formatMessage } = useIntl();
  const fonts = props.fonts ?? DEFAULT_FONT_FAMILIES;
  const sizes = props.sizes ?? DEFAULT_FONT_SIZES;
  const heights = props.heights ?? DEFAULT_LINE_HEIGHTS;

  const editorState = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) {
        return {
          fontFamily: 'default',
          fontSize: 'default',
          lineHeight: 'default',
        };
      }
      const attrs = ctx.editor.getAttributes('textStyle') || {};
      return {
        fontFamily: (attrs.fontFamily as string | undefined) || 'default',
        fontSize: (attrs.fontSize as string | undefined) || 'default',
        lineHeight: (attrs.lineHeight as string | undefined) || 'default',
      };
    },
  });

  const handleFontFamilyChange = (val: string) => {
    if (!editor) return;
    const chain = editor.chain().focus() as Record<string, any>;
    if (val === 'default') {
      if (typeof chain.unsetFontFamily === 'function') {
        chain.unsetFontFamily().run();
      } else {
        editor.chain().focus().setMark('textStyle', { fontFamily: null }).run();
      }
    } else if (typeof chain.setFontFamily === 'function') {
      chain.setFontFamily(val).run();
    } else {
      editor.chain().focus().setMark('textStyle', { fontFamily: val }).run();
    }
  };

  const handleFontSizeChange = (val: string) => {
    if (!editor) return;
    const chain = editor.chain().focus() as Record<string, any>;
    if (val === 'default') {
      if (typeof chain.unsetFontSize === 'function') {
        chain.unsetFontSize().run();
      } else {
        editor.chain().focus().setMark('textStyle', { fontSize: null }).run();
      }
    } else if (typeof chain.setFontSize === 'function') {
      chain.setFontSize(val).run();
    } else {
      editor.chain().focus().setMark('textStyle', { fontSize: val }).run();
    }
  };

  const handleLineHeightChange = (val: string) => {
    if (!editor) return;
    const chain = editor.chain().focus() as Record<string, any>;
    if (val === 'default') {
      if (typeof chain.unsetLineHeight === 'function') {
        chain.unsetLineHeight().run();
      } else {
        editor.chain().focus().setMark('textStyle', { lineHeight: null }).run();
      }
    } else if (typeof chain.setLineHeight === 'function') {
      chain.setLineHeight(val).run();
    } else {
      editor.chain().focus().setMark('textStyle', { lineHeight: val }).run();
    }
  };

  const handleClearFormatting = () => {
    if (!editor) return;
    editor.chain().focus().clearNodes().unsetAllMarks().run();
  };

  return {
    fontFamilySelect: (
      <SingleSelect
        placeholder={formatMessage({
          id: 'tiptap-editor.typography.fontFamily',
          defaultMessage: 'Font Family',
        })}
        aria-label={formatMessage({
          id: 'tiptap-editor.typography.fontFamily',
          defaultMessage: 'Font Family',
        })}
        value={editorState?.fontFamily ?? 'default'}
        onChange={(v: string | number) => v != null && handleFontFamilyChange(String(v))}
        disabled={!editor || props.disabled}
        size="S"
      >
        {fonts.map((f) => (
          <SingleSelectOption key={f.value} value={f.value}>
            {f.value === 'default'
              ? formatMessage({
                  id: 'tiptap-editor.typography.defaultFont',
                  defaultMessage: 'Default Font',
                })
              : f.label}
          </SingleSelectOption>
        ))}
      </SingleSelect>
    ),
    fontSizeSelect: (
      <SingleSelect
        placeholder={formatMessage({
          id: 'tiptap-editor.typography.fontSize',
          defaultMessage: 'Font Size',
        })}
        aria-label={formatMessage({
          id: 'tiptap-editor.typography.fontSize',
          defaultMessage: 'Font Size',
        })}
        value={editorState?.fontSize ?? 'default'}
        onChange={(v: string | number) => v != null && handleFontSizeChange(String(v))}
        disabled={!editor || props.disabled}
        size="S"
      >
        {sizes.map((s) => (
          <SingleSelectOption key={s} value={s}>
            {s === 'default'
              ? formatMessage({
                  id: 'tiptap-editor.typography.sizeAuto',
                  defaultMessage: 'Size: Auto',
                })
              : s}
          </SingleSelectOption>
        ))}
      </SingleSelect>
    ),
    lineHeightSelect: (
      <SingleSelect
        placeholder={formatMessage({
          id: 'tiptap-editor.typography.lineHeight',
          defaultMessage: 'Line Height',
        })}
        aria-label={formatMessage({
          id: 'tiptap-editor.typography.lineHeight',
          defaultMessage: 'Line Height',
        })}
        value={editorState?.lineHeight ?? 'default'}
        onChange={(v: string | number) => v != null && handleLineHeightChange(String(v))}
        disabled={!editor || props.disabled}
        size="S"
      >
        {heights.map((h) => (
          <SingleSelectOption key={h} value={h}>
            {h === 'default'
              ? formatMessage({
                  id: 'tiptap-editor.typography.lineAuto',
                  defaultMessage: 'Line: Auto',
                })
              : formatMessage(
                  {
                    id: 'tiptap-editor.typography.lineValue',
                    defaultMessage: 'Line: {height}',
                  },
                  { height: h }
                )}
          </SingleSelectOption>
        ))}
      </SingleSelect>
    ),
    clearFormattingButton: (
      <ToolbarButton
        onClick={handleClearFormatting}
        icon={<Cross />}
        active={false}
        disabled={!editor || props.disabled}
        tooltip={formatMessage({
          id: 'tiptap-editor.toolbar.clearFormatting',
          defaultMessage: 'Clear formatting',
        })}
      />
    ),
  };
}
