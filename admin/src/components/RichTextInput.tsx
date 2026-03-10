import { forwardRef, useMemo } from 'react';
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
import { MINIMAL_PRESET_CONFIG } from '../../../shared/types';

const RichTextInput = forwardRef<HTMLDivElement, TiptapInputProps>((props, forwardedRef) => {
  // Extract preset name from Strapi attribute options
  const attribute = (props as any).attribute as { options?: { preset?: string } } | undefined;
  const presetName = attribute?.options?.preset;

  // Fetch preset config (shows loading state while fetching)
  const { config, isLoading } = usePresetConfig(presetName);

  // Memoize extensions on presetName (string) — NOT on config (object reference) — EDITOR-02
  // This prevents re-creating extensions (and losing content) when parent re-renders with same preset
  const extensions = useMemo(() => {
    if (!config) return [];
    return buildExtensions(config);
  }, [presetName]); // eslint-disable-line react-hooks/exhaustive-deps

  // All hooks MUST be called unconditionally (React rules — no hooks after early return)
  const { editor, field } = useTiptapEditor(props.name, '', extensions);

  const starterKit = useStarterKit(editor!, { disabled: props.disabled });
  const heading = useHeading(editor!, { disabled: props.disabled });
  const link = useLink(editor!, { disabled: props.disabled });
  const script = useScript(editor!, { disabled: props.disabled });
  const table = useTable(editor!, { disabled: props.disabled });
  const textAlign = useTextAlign(editor!, { disabled: props.disabled });

  // Early return for loading state — EDITOR-03
  // (after all hooks above, which must run unconditionally)
  if (isLoading) {
    return (
      <Box padding={4}>
        Loading editor...
      </Box>
    );
  }

  return (
    <EditorErrorBoundary>
      <BaseTiptapInput
        editor={editor!}
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
        {starterKit.boldButton}
        {starterKit.italicButton}
        {starterKit.underlineButton}
        {starterKit.strikeButton}
        {script.superscriptButton}
        {script.subscriptButton}
        <Spacer width={8} />
        <FeatureGuard featureValue={config?.textAlign}>
          {textAlign.textAlignLeftButton}
          {textAlign.textAlignCenterButton}
          {textAlign.textAlignRightButton}
          {textAlign.textAlignJustifyButton}
          <Spacer width={8} />
        </FeatureGuard>
        {starterKit.bulletButton}
        {starterKit.orderedButton}
        <Spacer width={8} />
        {starterKit.codeButton}
        {starterKit.blockquoteButton}
        {link.linkButton}
        {link.linkDialog}
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
});

export default RichTextInput;
