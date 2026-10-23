import React, { useState } from 'react';
import { Editor, Mark, Node, mergeAttributes } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';
import {
  Button,
  Dialog,
  Field,
  SingleSelect,
  SingleSelectOption,
  TextInput,
} from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { ToolbarButton } from '../components/ToolbarButton';

/**
 * Frameless LeadParagraph Extension:
 * Introductory lead paragraph (<p class="lead-paragraph" data-lead="true">)
 */
export const LeadParagraph = Node.create({
  name: 'leadParagraph',
  group: 'block',
  content: 'inline*',
  defining: true,

  parseHTML() {
    return [
      { tag: 'p.lead-paragraph', priority: 60 },
      { tag: 'p[data-lead="true"]', priority: 60 },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'p',
      mergeAttributes(HTMLAttributes, { class: 'lead-paragraph', 'data-lead': 'true' }),
      0,
    ];
  },
});

/**
 * Frameless WCAG 3.1.2 Language of Parts Mark:
 * Wraps inline text in <span lang="..." dir="ltr|rtl">
 */
export const LanguageMark = Mark.create({
  name: 'language',

  addAttributes() {
    return {
      lang: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('lang') ?? null,
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs.lang ? { lang: String(attrs.lang) } : {},
      },
      dir: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('dir') ?? null,
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs.dir ? { dir: String(attrs.dir) } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[lang]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), 0];
  },
});

/**
 * Edifice IO & SalahAdDin Abbreviation Mark (<abbr title="...">)
 */
export const AbbrMark = Mark.create({
  name: 'abbr',

  addAttributes() {
    return {
      title: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('title') ?? null,
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs.title ? { title: String(attrs.title) } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: 'abbr[title]' }, { tag: 'abbr' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['abbr', mergeAttributes(HTMLAttributes), 0];
  },
});

/**
 * React hook providing toolbar buttons and dialogs for semantic marks:
 * lead paragraph, abbreviation (`<abbr>`), and WCAG 3.1.2 passage language (`<span lang dir>`).
 */
export function useSemanticMarks(
  editor: Editor | null,
  props: { disabled?: boolean } = { disabled: false }
) {
  const { formatMessage } = useIntl();
  const [showAbbrDialog, setShowAbbrDialog] = useState(false);
  const [abbrTitle, setAbbrTitle] = useState('');
  const [showLangDialog, setShowLangDialog] = useState(false);
  const [langCode, setLangCode] = useState('en');
  const [langDir, setLangDir] = useState<'ltr' | 'rtl'>('ltr');

  const editorState = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) {
        return { isLead: false, isAbbr: false, isLang: false };
      }
      return {
        isLead: ctx.editor.isActive('leadParagraph') ?? false,
        isAbbr: ctx.editor.isActive('abbr') ?? false,
        isLang: ctx.editor.isActive('language') ?? false,
      };
    },
  });

  const toggleLeadParagraph = () => {
    if (!editor) return;
    if (editor.isActive('leadParagraph')) {
      editor.chain().focus().setNode('paragraph').run();
    } else {
      editor.chain().focus().setNode('leadParagraph').run();
    }
  };

  const openAbbrModal = () => {
    if (!editor) return;
    const existing = (editor.getAttributes('abbr')?.title as string | undefined) || '';
    setAbbrTitle(existing);
    setShowAbbrDialog(true);
  };

  const handleSaveAbbr = () => {
    if (!editor) return;
    if (!abbrTitle.trim()) {
      editor.chain().focus().unsetMark('abbr').run();
    } else {
      editor.chain().focus().setMark('abbr', { title: abbrTitle.trim() }).run();
    }
    setShowAbbrDialog(false);
  };

  const openLangModal = () => {
    if (!editor) return;
    const attrs = editor.getAttributes('language') || {};
    setLangCode((attrs.lang as string | undefined) || 'en');
    setLangDir((attrs.dir as 'ltr' | 'rtl' | undefined) || 'ltr');
    setShowLangDialog(true);
  };

  const handleSaveLang = () => {
    if (!editor) return;
    if (!langCode.trim()) {
      editor.chain().focus().unsetMark('language').run();
    } else {
      editor
        .chain()
        .focus()
        .setMark('language', { lang: langCode.trim(), dir: langDir })
        .run();
    }
    setShowLangDialog(false);
  };

  const handleRemoveLang = () => {
    if (!editor) return;
    editor.chain().focus().unsetMark('language').run();
    setShowLangDialog(false);
  };

  return {
    leadParagraphButton: (
      <ToolbarButton
        onClick={toggleLeadParagraph}
        icon={
          <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>
            {formatMessage({
              id: 'tiptap-editor.toolbar.leadParagraph.short',
              defaultMessage: 'Lead',
            })}
          </span>
        }
        active={editorState?.isLead ?? false}
        toggle
        disabled={!editor || props.disabled}
        tooltip={formatMessage({
          id: 'tiptap-editor.toolbar.leadParagraph',
          defaultMessage: 'Lead paragraph',
        })}
      />
    ),
    abbrButton: (
      <ToolbarButton
        onClick={openAbbrModal}
        icon={
          <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>
            {formatMessage({
              id: 'tiptap-editor.toolbar.abbreviation.short',
              defaultMessage: 'Abbr',
            })}
          </span>
        }
        active={editorState?.isAbbr ?? false}
        toggle
        disabled={!editor || props.disabled}
        tooltip={formatMessage({
          id: 'tiptap-editor.toolbar.abbreviation',
          defaultMessage: "Abbreviation ('<abbr>')",
        })}
      />
    ),
    abbrDialog: (
      <Dialog.Root
        open={showAbbrDialog}
        onOpenChange={(v: boolean) => {
          if (!v) setShowAbbrDialog(false);
        }}
      >
        {showAbbrDialog && (
          <Dialog.Content>
            <Dialog.Header>
              {formatMessage({
                id: 'tiptap-editor.abbr.dialogHeader',
                defaultMessage: "Abbreviation Expansion ('<abbr>')",
              })}
            </Dialog.Header>
            <Dialog.Body>
              <Field.Root width="100%">
                <Field.Label>
                  {formatMessage({
                    id: 'tiptap-editor.abbr.titleLabel',
                    defaultMessage: 'Full Expansion (title attribute)',
                  })}
                </Field.Label>
                <TextInput
                  name="abbr-title"
                  placeholder={formatMessage({
                    id: 'tiptap-editor.abbr.placeholder',
                    defaultMessage: 'Web Content Accessibility Guidelines',
                  })}
                  value={abbrTitle}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setAbbrTitle(e.target.value)
                  }
                />
              </Field.Root>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.Cancel>
                <Button variant="tertiary" fullWidth onClick={() => setShowAbbrDialog(false)}>
                  {formatMessage({ id: 'tiptap-editor.common.cancel', defaultMessage: 'Cancel' })}
                </Button>
              </Dialog.Cancel>
              {editorState?.isAbbr && (
                <Button
                  variant="danger-light"
                  fullWidth
                  onClick={() => {
                    editor?.chain().focus().unsetMark('abbr').run();
                    setShowAbbrDialog(false);
                  }}
                >
                  {formatMessage({ id: 'tiptap-editor.common.remove', defaultMessage: 'Remove' })}
                </Button>
              )}
              <Dialog.Action>
                <Button variant="success-light" fullWidth onClick={handleSaveAbbr}>
                  {formatMessage({ id: 'tiptap-editor.common.save', defaultMessage: 'Save' })}
                </Button>
              </Dialog.Action>
            </Dialog.Footer>
          </Dialog.Content>
        )}
      </Dialog.Root>
    ),
    languageButton: (
      <ToolbarButton
        onClick={openLangModal}
        icon={
          <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>
            {formatMessage({
              id: 'tiptap-editor.toolbar.languageMark.short',
              defaultMessage: '🌐 Lang',
            })}
          </span>
        }
        active={editorState?.isLang ?? false}
        toggle
        disabled={!editor || props.disabled}
        tooltip={formatMessage({
          id: 'tiptap-editor.toolbar.languageMark',
          defaultMessage: 'Language & Text Direction (WCAG 3.1.2)',
        })}
      />
    ),
    languageDialog: (
      <Dialog.Root
        open={showLangDialog}
        onOpenChange={(v: boolean) => {
          if (!v) setShowLangDialog(false);
        }}
      >
        {showLangDialog && (
          <Dialog.Content>
            <Dialog.Header>
              {formatMessage({
                id: 'tiptap-editor.language.dialogHeader',
                defaultMessage: 'Passage Language & Direction (WCAG 3.1.2)',
              })}
            </Dialog.Header>
            <Dialog.Body>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                <Field.Root width="100%">
                  <Field.Label>
                    {formatMessage({
                      id: 'tiptap-editor.language.codeLabel',
                      defaultMessage: 'BCP-47 Language Code (e.g. en, es, fr, de, ar, he, ja)',
                    })}
                  </Field.Label>
                  <TextInput
                    name="lang-code"
                    placeholder="es"
                    value={langCode}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setLangCode(e.target.value)
                    }
                  />
                </Field.Root>
                <Field.Root width="100%">
                  <Field.Label>
                    {formatMessage({
                      id: 'tiptap-editor.language.dirLabel',
                      defaultMessage: 'Text Direction',
                    })}
                  </Field.Label>
                  <SingleSelect
                    value={langDir}
                    onChange={(v: string | number) =>
                      setLangDir(String(v) === 'rtl' ? 'rtl' : 'ltr')
                    }
                  >
                    <SingleSelectOption value="ltr">
                      {formatMessage({
                        id: 'tiptap-editor.language.dirLtr',
                        defaultMessage: 'Left-to-Right (LTR)',
                      })}
                    </SingleSelectOption>
                    <SingleSelectOption value="rtl">
                      {formatMessage({
                        id: 'tiptap-editor.language.dirRtl',
                        defaultMessage: 'Right-to-Left (RTL)',
                      })}
                    </SingleSelectOption>
                  </SingleSelect>
                </Field.Root>
              </div>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.Cancel>
                <Button variant="tertiary" fullWidth onClick={() => setShowLangDialog(false)}>
                  {formatMessage({ id: 'tiptap-editor.common.cancel', defaultMessage: 'Cancel' })}
                </Button>
              </Dialog.Cancel>
              {editorState?.isLang && (
                <Button variant="danger-light" fullWidth onClick={handleRemoveLang}>
                  {formatMessage({ id: 'tiptap-editor.common.remove', defaultMessage: 'Remove' })}
                </Button>
              )}
              <Dialog.Action>
                <Button variant="success-light" fullWidth onClick={handleSaveLang}>
                  {formatMessage({ id: 'tiptap-editor.common.save', defaultMessage: 'Save' })}
                </Button>
              </Dialog.Action>
            </Dialog.Footer>
          </Dialog.Content>
        )}
      </Dialog.Root>
    ),
  };
}
