import { forwardRef, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { Box } from '@strapi/design-system';
import BaseTiptapInput from './BaseTiptapInput';
import { EditorErrorBoundary } from './EditorErrorBoundary';
import { Spacer } from './Spacer';
import { TiptapInputProps, useTiptapEditor } from '../utils/tiptapUtils';
import { ResponsiveToolbar } from './ResponsiveToolbar';
import { useStarterKit } from '../extensions/StarterKit';
import { useLink } from '../extensions/Link';
import { useHeading } from '../extensions/Heading';
import { useImage } from '../extensions/Image';
import { useScript } from '../extensions/Script';
import { useTable } from '../extensions/Table';
import { useTextAlign } from '../extensions/TextAlign';
import { useTextColor } from '../extensions/TextColor';
import { useHighlightColor } from '../extensions/HighlightColor';
import { usePresetConfig } from '../hooks/usePresetConfig';
import { buildExtensions } from '../utils/buildExtensions';
import { TiptapPresetConfig, MINIMAL_PRESET_CONFIG, getFeatureOptions } from '../../../shared/types';
import type { ToolbarItem } from './ResponsiveToolbar';

// ─── Inner editor ────────────────────────────────────────────────────────────
// Mounted only AFTER preset config is resolved, so useEditor receives the
// correct extensions on first render and never needs to swap them.

type InnerEditorProps = TiptapInputProps & {
  config: TiptapPresetConfig;
  presetName: string | undefined;
};

/**
 * Type guard to check if a toolbar item is valid.
 * @param item - The toolbar item to check.
 * @returns True if the item is a valid ToolbarItem, false otherwise.
 */
const isToolbarItem = (item: ToolbarItem | false | undefined): item is ToolbarItem => Boolean(item);

const InnerEditor = forwardRef<HTMLDivElement, InnerEditorProps>(
  ({ config, presetName, ...props }, forwardedRef) => {
    // Memoize on presetName string — stable across parent re-renders
    const extensions = useMemo(() => {
      return buildExtensions(config);
    }, [presetName]); // eslint-disable-line react-hooks/exhaustive-deps

    const { editor, field } = useTiptapEditor(props.name, '', extensions);

    const starterKit = useStarterKit(editor, { disabled: props.disabled });
    const headingOptions = getFeatureOptions(config.heading, { levels: [1, 2, 3, 4, 5, 6] });
    const heading = useHeading(editor, { disabled: props.disabled, levels: headingOptions?.levels });
    const link = useLink(editor, { disabled: props.disabled });
    const image = useImage(editor, { disabled: props.disabled });
    const script = useScript(editor, { disabled: props.disabled });
    const table = useTable(editor, { disabled: props.disabled });
    const textAlign = useTextAlign(editor, { disabled: props.disabled });
    const textColor = useTextColor(editor, { disabled: props.disabled });
    const highlightColor = useHighlightColor(editor, { disabled: props.disabled });

    const toolbarItemCandidates: Array<ToolbarItem | false | undefined> = [
      config.heading && {
        id: 'heading',
        content: (
          <>
            {heading.headingSelect}
            {heading.headingTagSelect}
          </>
        ),
      },
      config.bold && { id: 'bold', content: starterKit.boldButton },
      config.italic && { id: 'italic', content: starterKit.italicButton },
      config.underline && { id: 'underline', content: starterKit.underlineButton },
      (config.bold || config.italic || config.underline) && {
        id: 'basicTextSpacer',
        content: <Spacer margin={1} />,
      },
      config.strike && { id: 'strike', content: starterKit.strikeButton },
      config.superscript && { id: 'superscript', content: script.superscriptButton },
      config.subscript && { id: 'subscript', content: script.subscriptButton },
      config.textColor && { id: 'textColor', content: textColor.textColorButton },
      config.highlightColor && { id: 'highlightColor', content: highlightColor.highlightColorButton },
      (config.strike || config.superscript || config.subscript || config.textColor || config.highlightColor) && {
        id: 'textDecorationSpacer',
        content: <Spacer margin={1} />,
      },
      config.textAlign && {
        id: 'textAlign',
        content: (
          <>
            {textAlign.textAlignLeftButton}
            {textAlign.textAlignCenterButton}
            {textAlign.textAlignRightButton}
            {textAlign.textAlignJustifyButton}
          </>
        ),
      },
      config.textAlign && { id: 'textAlignSpacer', content: <Spacer margin={1} /> },
      config.bulletList && { id: 'bullet', content: starterKit.bulletButton },
      config.orderedList && { id: 'ordered', content: starterKit.orderedButton },
      (config.bulletList || config.orderedList) && {
        id: 'listSpacer',
        content: <Spacer margin={1} />,
      },
      config.code && { id: 'code', content: starterKit.codeButton },
      config.blockquote && { id: 'blockquote', content: starterKit.blockquoteButton },
      config.link && {
        id: 'link',
        content: (
          <>
            {link.linkButton}
            {link.linkDialog}
          </>
        ),
      },
      config.mediaLibrary && {
        id: 'mediaLibrary',
        content: (
          <>
            {image.imageButton}
            {image.imageDialog}
          </>
        ),
      },
      (config.code || config.blockquote || config.link || config.mediaLibrary) && {
        id: 'insertSpacer',
        content: <Spacer margin={1} />,
      },
      config.table && {
        id: 'table',
        content: (
          <>
            {table.tableButton}
            {table.addColumnButton}
            {table.removeColumnButton}
            {table.addRowButton}
            {table.removeRowButton}
            {table.tableDialog}
          </>
        ),
      },
    ];

    const toolbarItems = toolbarItemCandidates.filter(isToolbarItem);

    if (!editor) return null;

    return (
      <EditorErrorBoundary>
        <BaseTiptapInput
          editor={editor}
          field={field}
          {...props}
          ref={forwardedRef}
          noPresetConfigured={!presetName}
        >
          <ResponsiveToolbar items={toolbarItems} />
        </BaseTiptapInput>
      </EditorErrorBoundary>
    );
  }
);

// ─── Outer wrapper ───────────────────────────────────────────────────────────
// Handles async preset fetching; renders loading state until config is ready.

type RichTextInputProps = TiptapInputProps & {
  attribute?: { options?: { preset?: string } };
};

const RichTextInput = forwardRef<HTMLDivElement, RichTextInputProps>((props, forwardedRef) => {
  const { formatMessage } = useIntl();
  const rawPresetName = props.attribute?.options?.preset;
  const normalizedPresetName = rawPresetName?.trim() || undefined;

  const { config, isLoading } = usePresetConfig(normalizedPresetName);

  if (isLoading) {
    return (
      <Box padding={4}>
        {formatMessage({ id: 'tiptap-editor.loading', defaultMessage: 'Loading editor...' })}
      </Box>
    );
  }

  return (
    <InnerEditor
      ref={forwardedRef}
      config={config ?? MINIMAL_PRESET_CONFIG}
      presetName={normalizedPresetName}
      {...props}
    />
  );
});

export default RichTextInput;
