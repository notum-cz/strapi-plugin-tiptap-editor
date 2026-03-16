import { forwardRef, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { Box } from '@strapi/design-system';
import BaseTiptapInput from './BaseTiptapInput';
import { EditorErrorBoundary } from './EditorErrorBoundary';
import { FeatureGuard } from './FeatureGuard';
import { TiptapInputProps, useTiptapEditor } from '../utils/tiptapUtils';
import { Spacer } from './Spacer';
import { useStarterKit } from '../extensions/StarterKit';
import { useLink } from '../extensions/Link';
import { useHeading } from '../extensions/Heading';
import { useScript } from '../extensions/Script';
import { useTable } from '../extensions/Table';
import { useTextAlign } from '../extensions/TextAlign';
import { usePresetConfig } from '../hooks/usePresetConfig';
import { buildExtensions } from '../utils/buildExtensions';
import { TiptapPresetConfig, MINIMAL_PRESET_CONFIG, getFeatureOptions } from '../../../shared/types';

// ─── Inner editor ────────────────────────────────────────────────────────────
// Mounted only AFTER preset config is resolved, so useEditor receives the
// correct extensions on first render and never needs to swap them.

type InnerEditorProps = TiptapInputProps & {
  config: TiptapPresetConfig;
  presetName: string | undefined;
};

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
    const script = useScript(editor, { disabled: props.disabled });
    const table = useTable(editor, { disabled: props.disabled });
    const textAlign = useTextAlign(editor, { disabled: props.disabled });

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
          <FeatureGuard featureValue={config?.heading}>
            {heading.headingSelect}
            {heading.headingTagSelect}
            <Spacer width={8} />
          </FeatureGuard>
          <FeatureGuard featureValue={config?.bold}>
            {starterKit.boldButton}
          </FeatureGuard>
          <FeatureGuard featureValue={config?.italic}>
            {starterKit.italicButton}
          </FeatureGuard>
          <FeatureGuard featureValue={config?.underline}>
            {starterKit.underlineButton}
          </FeatureGuard>
          <FeatureGuard featureValue={config?.strike}>
            {starterKit.strikeButton}
          </FeatureGuard>
          <FeatureGuard featureValue={config?.superscript}>
            {script.superscriptButton}
          </FeatureGuard>
          <FeatureGuard featureValue={config?.subscript}>
            {script.subscriptButton}
          </FeatureGuard>
          <Spacer width={8} />
          <FeatureGuard featureValue={config?.textAlign}>
            {textAlign.textAlignLeftButton}
            {textAlign.textAlignCenterButton}
            {textAlign.textAlignRightButton}
            {textAlign.textAlignJustifyButton}
            <Spacer width={8} />
          </FeatureGuard>
          <FeatureGuard featureValue={config?.bulletList}>
            {starterKit.bulletButton}
          </FeatureGuard>
          <FeatureGuard featureValue={config?.orderedList}>
            {starterKit.orderedButton}
          </FeatureGuard>
          <Spacer width={8} />
          <FeatureGuard featureValue={config?.code}>
            {starterKit.codeButton}
          </FeatureGuard>
          <FeatureGuard featureValue={config?.blockquote}>
            {starterKit.blockquoteButton}
          </FeatureGuard>
          <FeatureGuard featureValue={config?.link}>
            {link.linkButton}
            {link.linkDialog}
          </FeatureGuard>
          <FeatureGuard featureValue={config?.table}>
            <Spacer width={8} />
            {table.tableButton}
            {table.addColumnButton}
            {table.removeColumnButton}
            {table.addRowButton}
            {table.removeRowButton}
            {table.tableDialog}
          </FeatureGuard>
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
