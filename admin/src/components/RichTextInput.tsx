import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import {
  getFetchClient,
  unstable_useContentManagerContext,
  useField,
} from '@strapi/strapi/admin';
import { Box } from '@strapi/design-system';
import BaseTiptapInput from './BaseTiptapInput';
import { EditorErrorBoundary } from './EditorErrorBoundary';
import { Spacer } from './Spacer';
import { TiptapInputProps, useTiptapEditor } from '../utils/tiptapUtils';
import { ResponsiveToolbar, type ToolbarItem } from './ResponsiveToolbar';
import { useStarterKit } from '../extensions/StarterKit';
import { useLink } from '../extensions/Link';
import { useHeading } from '../extensions/Heading';
import { useImage } from '../extensions/Image';
import { useVideo } from '../extensions/Video';
import { useAudio } from '../extensions/Audio';
import { useAttachment } from '../extensions/Attachment';
import { useIframe } from '../extensions/Iframe';
import { useLinker } from '../extensions/Linker';
import { useScript } from '../extensions/Script';
import { useTable } from '../extensions/Table';
import { useTextAlign } from '../extensions/TextAlign';
import { useTextColor } from '../extensions/TextColor';
import { useHighlightColor } from '../extensions/HighlightColor';
import { useTypographyControls } from '../extensions/TypographyControls';
import { useSemanticMarks } from '../extensions/SemanticMarks';
import { useInformationPane } from '../extensions/InformationPane';
import { useStructuredBlocks } from '../extensions/StructuredBlocks';
import { useMathematics } from '../extensions/Mathematics';
import { useEmojiPicker } from '../extensions/EmojiPicker';
import { useSlashCommand } from '../extensions/SlashCommand';
import { useSpeechTools } from '../extensions/SpeechTools';
import { useEditorModes } from './EditorFooterAndModes';
import { usePresetConfig } from '../hooks/usePresetConfig';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { useRelationalSync } from '../hooks/useRelationalSync';
import { buildExtensions } from '../utils/buildExtensions';
import {
  TiptapPresetConfig,
  MINIMAL_PRESET_CONFIG,
  DEFAULT_RUNTIME_SETTINGS,
  getFeatureOptions,
  isFeatureEnabled,
  type FontFamilyConfig,
  type FontSizeConfig,
  type LineHeightConfig,
  type TiptapOutputFormat,
  type TiptapRuntimeSettings,
} from '../../../shared/types';

// ─── Inner editor ────────────────────────────────────────────────────────────
// Mounted only AFTER preset config and runtime settings are resolved, so
// useEditor receives the correct extensions and outputFormat on first render.

type InnerEditorProps = TiptapInputProps & {
  config: TiptapPresetConfig;
  presetName: string | undefined;
  outputFormat?: TiptapOutputFormat;
  relationalSyncEnabled?: boolean;
  characterLimit?: number;
  placeholder?: string;
};

/**
 * Type guard to check if a toolbar item is valid.
 * @param item - The toolbar item to check.
 * @returns True if the item is a valid ToolbarItem, false otherwise.
 */
const isToolbarItem = (item: ToolbarItem | false | undefined): item is ToolbarItem => Boolean(item);

/**
 * Inner TipTap editor component rendered once the preset configuration and runtime settings are loaded.
 */
const InnerEditor = forwardRef<HTMLDivElement, InnerEditorProps>(
  (
    {
      config,
      presetName,
      outputFormat,
      relationalSyncEnabled,
      characterLimit,
      placeholder,
      ...props
    },
    forwardedRef
  ) => {
    const { contentType, components } = unstable_useContentManagerContext() as {
      contentType?: { attributes?: Record<string, Record<string, unknown>> };
      components?: Record<string, { attributes?: Record<string, Record<string, unknown>> }>;
    };
    const schemaAttributes = contentType?.attributes;
    const linksFieldName = `${props.name}Links`;
    const linksFieldSchema = schemaAttributes?.[linksFieldName];
    const linksFieldIsRepeatable = Boolean(linksFieldSchema?.repeatable);
    const linksField = useField<
      Record<string, unknown> | Array<Record<string, unknown>> | null
    >(linksFieldName);

    const { availableFields, targetUidToAttribute, linksComponentUid } = useMemo(() => {
      const fields = schemaAttributes ? Object.keys(schemaAttributes) : undefined;
      const componentUid =
        (typeof linksFieldSchema?.component === 'string' && linksFieldSchema.component) ||
        'links.links';
      const compAttrs = components?.[componentUid]?.attributes;
      const uidMap: Record<string, string> = {};
      if (compAttrs) {
        for (const [attrName, attrDef] of Object.entries(compAttrs)) {
          const targetUid = attrDef?.target ?? attrDef?.targetModel;
          if (attrDef?.type === 'relation' && typeof targetUid === 'string') {
            uidMap[targetUid] = attrName;
          }
        }
      }
      return {
        availableFields: fields,
        targetUidToAttribute: uidMap,
        linksComponentUid: componentUid,
      };
    }, [schemaAttributes, components, linksFieldSchema?.component]);

    // Memoize on [config, characterLimit, placeholder] with a fixed-length dependency array
    const extensions = useMemo(() => {
      if (characterLimit !== undefined || placeholder !== undefined) {
        return buildExtensions(config, { characterLimit, placeholder });
      }
      return buildExtensions(config);
    }, [config, characterLimit, placeholder]); // eslint-disable-line react-hooks/exhaustive-deps

    const onFormChangeRef = useRef<((fieldName: string, value: unknown) => void) | undefined>(
      undefined
    );

    const { syncRelationsFromDoc, seedSignature } = useRelationalSync(props.name, {
      enabled: relationalSyncEnabled ?? DEFAULT_RUNTIME_SETTINGS.enableRelationalSync,
      availableFields,
      targetUidToAttribute,
      linksComponentUid,
      linksFieldIsRepeatable,
      initialDocument: (props as { value?: unknown }).value,
      onSyncField: (fieldName, value) => {
        const currentLinksValue = linksField?.value;
        let nextValue = value;
        if (fieldName === linksFieldName && value !== null && typeof value === 'object') {
          if (linksFieldIsRepeatable && Array.isArray(value)) {
            const currentArr = Array.isArray(currentLinksValue) ? currentLinksValue : [];
            const firstExisting =
              currentArr[0] && typeof currentArr[0] === 'object' && !Array.isArray(currentArr[0])
                ? currentArr[0]
                : {};
            const firstIncoming =
              value[0] && typeof value[0] === 'object' && !Array.isArray(value[0])
                ? (value[0] as Record<string, unknown>)
                : {};
            nextValue = [{ ...firstExisting, ...firstIncoming }, ...currentArr.slice(1)];
          } else if (!linksFieldIsRepeatable && !Array.isArray(value)) {
            nextValue = {
              ...(currentLinksValue &&
              typeof currentLinksValue === 'object' &&
              !Array.isArray(currentLinksValue)
                ? currentLinksValue
                : {}),
              ...value,
            };
          }
        }

        onFormChangeRef.current?.(fieldName, nextValue);
      },
    });

    const { editor, field } = useTiptapEditor(props.name, '', extensions, {
      outputFormat: outputFormat ?? DEFAULT_RUNTIME_SETTINGS.defaultOutputFormat,
      onDocUpdate: syncRelationsFromDoc,
    });

    useEffect(() => {
      if (editor && typeof (editor as { getJSON?: () => unknown }).getJSON === 'function') {
        seedSignature?.((editor as { getJSON: () => unknown }).getJSON());
      }
    }, [editor, seedSignature, field?.initialValue]);

    useEffect(() => {
      onFormChangeRef.current = field?.onChange as
        | ((fieldName: string, value: unknown) => void)
        | undefined;
    }, [field?.onChange]);

    const { toolbarRef, handleToolbarKeyDown } = useKeyboardNavigation(editor);

    const starterKit = useStarterKit(editor, { disabled: props.disabled });
    const headingOptions = getFeatureOptions(config.heading, { levels: [1, 2, 3, 4, 5, 6] });
    const heading = useHeading(editor, { disabled: props.disabled, levels: headingOptions?.levels });
    const link = useLink(editor, { disabled: props.disabled });
    const image = useImage(editor, { disabled: props.disabled });
    const video = useVideo(editor, { disabled: props.disabled });
    const audio = useAudio(editor, { disabled: props.disabled });
    const attachment = useAttachment(editor, { disabled: props.disabled });
    const iframeOpts = getFeatureOptions(config.iframe, { allowedDomains: [] as string[] });
    const iframe = useIframe(editor, {
      disabled: props.disabled,
      allowedDomains: iframeOpts?.allowedDomains,
    });
    const linker = useLinker(editor, { disabled: props.disabled });
    const script = useScript(editor, { disabled: props.disabled });
    const table = useTable(editor, { disabled: props.disabled });
    const textAlign = useTextAlign(editor, { disabled: props.disabled });
    const textColor = useTextColor(editor, { disabled: props.disabled });
    const highlightColor = useHighlightColor(editor, { disabled: props.disabled });
    const typography = useTypographyControls(editor, {
      disabled: props.disabled,
      fonts: getFeatureOptions(config.fontFamily, {} as FontFamilyConfig)?.fonts,
      sizes: getFeatureOptions(config.fontSize, {} as FontSizeConfig)?.sizes,
      heights: getFeatureOptions(config.lineHeight, {} as LineHeightConfig)?.heights,
    });
    const semanticMarks = useSemanticMarks(editor, { disabled: props.disabled });
    const informationPane = useInformationPane(editor, { disabled: props.disabled });
    const structuredBlocks = useStructuredBlocks(editor, { disabled: props.disabled });
    const mathematics = useMathematics(editor, { disabled: props.disabled });
    const emoji = useEmojiPicker(editor, { disabled: props.disabled });
    const slashCommand = useSlashCommand(editor, { disabled: props.disabled, config });
    const speech = useSpeechTools(editor, { disabled: props.disabled });

    const charCountEnabled =
      config?.characterCount === undefined || isFeatureEnabled(config?.characterCount);
    const charCountOpts = charCountEnabled
      ? getFeatureOptions(config.characterCount, {
          limit: characterLimit,
          wordsPerMinute: 200,
        })
      : null;
    const editorModes = useEditorModes(editor, {
      disabled: props.disabled,
      characterLimit:
        characterLimit && characterLimit > 0 ? characterLimit : (charCountOpts?.limit ?? null),
      wordsPerMinute: charCountOpts?.wordsPerMinute,
      showCharacterCount:
        charCountEnabled || Boolean(characterLimit && characterLimit > 0),
    });

    const toolbarItemCandidates: Array<ToolbarItem | false | undefined> = [
      isFeatureEnabled(config?.heading) && {
        id: 'heading',
        content: (
          <>
            {heading.headingSelect}
            {heading.headingTagSelect}
          </>
        ),
      },
      isFeatureEnabled(config?.fontFamily) && {
        id: 'fontFamily',
        content: typography.fontFamilySelect,
      },
      isFeatureEnabled(config?.fontSize) && { id: 'fontSize', content: typography.fontSizeSelect },
      isFeatureEnabled(config?.lineHeight) && {
        id: 'lineHeight',
        content: typography.lineHeightSelect,
      },
      isFeatureEnabled(config?.clearFormatting) && {
        id: 'clearFormatting',
        content: typography.clearFormattingButton,
      },
      isFeatureEnabled(config?.leadParagraph) && {
        id: 'leadParagraph',
        content: semanticMarks.leadParagraphButton,
      },
      (isFeatureEnabled(config?.heading) ||
        isFeatureEnabled(config?.fontFamily) ||
        isFeatureEnabled(config?.fontSize) ||
        isFeatureEnabled(config?.lineHeight) ||
        isFeatureEnabled(config?.clearFormatting) ||
        isFeatureEnabled(config?.leadParagraph)) && {
        id: 'headingSpacer',
        content: <Spacer margin={1} />,
      },
      isFeatureEnabled(config?.bold) && { id: 'bold', content: starterKit.boldButton },
      isFeatureEnabled(config?.italic) && { id: 'italic', content: starterKit.italicButton },
      isFeatureEnabled(config?.underline) && {
        id: 'underline',
        content: starterKit.underlineButton,
      },
      (isFeatureEnabled(config?.bold) ||
        isFeatureEnabled(config?.italic) ||
        isFeatureEnabled(config?.underline)) && {
        id: 'basicTextSpacer',
        content: <Spacer margin={1} />,
      },
      isFeatureEnabled(config?.strike) && { id: 'strike', content: starterKit.strikeButton },
      isFeatureEnabled(config?.superscript) && {
        id: 'superscript',
        content: script.superscriptButton,
      },
      isFeatureEnabled(config?.subscript) && { id: 'subscript', content: script.subscriptButton },
      isFeatureEnabled(config?.textColor) && {
        id: 'textColor',
        content: textColor.textColorButton,
      },
      isFeatureEnabled(config?.highlightColor) && {
        id: 'highlightColor',
        content: highlightColor.highlightColorButton,
      },
      isFeatureEnabled(config?.abbr) && {
        id: 'abbr',
        content: semanticMarks.abbrButton,
        overlay: semanticMarks.abbrDialog,
      },
      isFeatureEnabled(config?.language) && {
        id: 'language',
        content: semanticMarks.languageButton,
        overlay: semanticMarks.languageDialog,
      },
      (isFeatureEnabled(config?.strike) ||
        isFeatureEnabled(config?.superscript) ||
        isFeatureEnabled(config?.subscript) ||
        isFeatureEnabled(config?.textColor) ||
        isFeatureEnabled(config?.highlightColor) ||
        isFeatureEnabled(config?.abbr) ||
        isFeatureEnabled(config?.language)) && {
        id: 'textDecorationSpacer',
        content: <Spacer margin={1} />,
      },
      isFeatureEnabled(config?.textAlign) && {
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
      isFeatureEnabled(config?.textAlign) && {
        id: 'textAlignSpacer',
        content: <Spacer margin={1} />,
      },
      isFeatureEnabled(config?.bulletList) && { id: 'bullet', content: starterKit.bulletButton },
      isFeatureEnabled(config?.orderedList) && { id: 'ordered', content: starterKit.orderedButton },
      isFeatureEnabled(config?.taskList) && {
        id: 'taskList',
        content: structuredBlocks.taskListButton,
      },
      (isFeatureEnabled(config?.bulletList) ||
        isFeatureEnabled(config?.orderedList) ||
        isFeatureEnabled(config?.taskList)) && {
        id: 'listSpacer',
        content: <Spacer margin={1} />,
      },
      isFeatureEnabled(config?.code) && { id: 'code', content: starterKit.codeButton },
      isFeatureEnabled(config?.blockquote) && {
        id: 'blockquote',
        content: starterKit.blockquoteButton,
      },
      isFeatureEnabled(config?.informationPane) && {
        id: 'informationPane',
        content: informationPane.informationPaneButton,
      },
      isFeatureEnabled(config?.conversationHistory) && {
        id: 'conversationHistory',
        content: structuredBlocks.conversationHistoryButton,
      },
      isFeatureEnabled(config?.accordion) && {
        id: 'accordion',
        content: structuredBlocks.accordionButton,
      },
      isFeatureEnabled(config?.columns) && {
        id: 'columns',
        content: structuredBlocks.columnsButton,
      },
      isFeatureEnabled(config?.mathematics) && {
        id: 'mathematics',
        content: mathematics.mathematicsButton,
        overlay: mathematics.mathematicsDialog,
      },
      isFeatureEnabled(config?.emoji) && {
        id: 'emoji',
        content: emoji.emojiButton,
        measureContent: emoji.emojiTrigger,
      },
      isFeatureEnabled(config?.slashCommands) && {
        id: 'slashCommands',
        content: slashCommand.slashCommandButton,
        measureContent: slashCommand.slashCommandTrigger,
      },
      isFeatureEnabled(config?.pageBreak) && {
        id: 'pageBreak',
        content: structuredBlocks.pageBreakButton,
      },
      isFeatureEnabled(config?.tableOfContents) && {
        id: 'tableOfContents',
        content: structuredBlocks.tableOfContentsButton,
      },
      isFeatureEnabled(config?.link) && {
        id: 'link',
        content: link.linkButton,
        overlay: link.linkDialog,
      },
      isFeatureEnabled(config?.linker) && {
        id: 'linker',
        content: linker.linkerButton,
        overlay: linker.linkerDialog,
      },
      isFeatureEnabled(config?.mediaLibrary) && {
        id: 'mediaLibrary',
        content: image.imageButton,
        overlay: image.imageDialog,
      },
      isFeatureEnabled(config?.video) && {
        id: 'video',
        content: video.videoButton,
        overlay: video.videoDialog,
      },
      isFeatureEnabled(config?.audio) && {
        id: 'audio',
        content: audio.audioButton,
        overlay: audio.audioDialog,
      },
      isFeatureEnabled(config?.attachment) && {
        id: 'attachment',
        content: attachment.attachmentButton,
        overlay: attachment.attachmentDialog,
      },
      isFeatureEnabled(config?.iframe) && {
        id: 'iframe',
        content: iframe.iframeButton,
        overlay: iframe.iframeDialog,
      },
      (isFeatureEnabled(config?.code) ||
        isFeatureEnabled(config?.blockquote) ||
        isFeatureEnabled(config?.informationPane) ||
        isFeatureEnabled(config?.conversationHistory) ||
        isFeatureEnabled(config?.accordion) ||
        isFeatureEnabled(config?.columns) ||
        isFeatureEnabled(config?.mathematics) ||
        isFeatureEnabled(config?.emoji) ||
        isFeatureEnabled(config?.slashCommands) ||
        isFeatureEnabled(config?.pageBreak) ||
        isFeatureEnabled(config?.tableOfContents) ||
        isFeatureEnabled(config?.link) ||
        isFeatureEnabled(config?.linker) ||
        isFeatureEnabled(config?.mediaLibrary) ||
        isFeatureEnabled(config?.video) ||
        isFeatureEnabled(config?.audio) ||
        isFeatureEnabled(config?.attachment) ||
        isFeatureEnabled(config?.iframe)) && {
        id: 'insertSpacer',
        content: <Spacer margin={1} />,
      },
      isFeatureEnabled(config?.table) && {
        id: 'table',
        content: (
          <>
            {table.tableButton}
            {table.addColumnButton}
            {table.removeColumnButton}
            {table.addRowButton}
            {table.removeRowButton}
            {table.cellColorButton}
            {table.mergeCellsButton}
            {table.splitCellButton}
          </>
        ),
        overlay: table.tableDialog,
      },
      isFeatureEnabled(config?.table) && { id: 'tableSpacer', content: <Spacer margin={1} /> },
      isFeatureEnabled(config?.speechToText) && {
        id: 'speechToText',
        content: speech.speechToTextButton,
      },
      isFeatureEnabled(config?.textToSpeech) && {
        id: 'textToSpeech',
        content: speech.textToSpeechButton,
      },
      (isFeatureEnabled(config?.speechToText) || isFeatureEnabled(config?.textToSpeech)) && {
        id: 'speechSpacer',
        content: <Spacer margin={1} />,
      },
      isFeatureEnabled(config?.fullscreen) && {
        id: 'fullscreen',
        content: (
          <>
            {editorModes.previewButton}
            {editorModes.sourceButton}
            {editorModes.fullscreenButton}
          </>
        ),
      },
    ];

    const rawToolbarItems = toolbarItemCandidates.filter(isToolbarItem);

    // Clean up consecutive, leading, or trailing spacers
    const toolbarItems = rawToolbarItems.filter((item, idx, arr) => {
      const isSpacer = item.id.toLowerCase().includes('spacer');
      if (!isSpacer) return true;

      if (idx === 0 || idx === arr.length - 1) return false;

      const prevIsSpacer = arr[idx - 1].id.toLowerCase().includes('spacer');
      return !prevIsSpacer;
    });

    if (!editor) return null;

    return (
      <EditorErrorBoundary>
        <BaseTiptapInput
          editor={editor}
          field={field}
          {...props}
          ref={forwardedRef}
          noPresetConfigured={!presetName}
          isFullscreen={editorModes.isFullscreen}
          toolbarRef={toolbarRef}
          onToolbarKeyDown={handleToolbarKeyDown}
          footer={
            <>
              {editorModes.inspectorDrawer}
              {editorModes.characterCountFooter}
              {speech.speechLiveRegion}
            </>
          }
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
  value?: unknown;
  attribute?: {
    options?: {
      preset?: string;
      outputFormat?: TiptapOutputFormat;
      characterLimit?: number;
      placeholder?: string;
    };
  };
};

/**
 * Top-level Strapi custom field wrapper that resolves the field's preset configuration
 * and runtime settings before mounting the inner TipTap editor.
 */
const RichTextInput = forwardRef<HTMLDivElement, RichTextInputProps>((props, forwardedRef) => {
  const { formatMessage } = useIntl();
  const rawPresetName = props.attribute?.options?.preset;
  const normalizedPresetName = rawPresetName?.trim() || undefined;
  const outputFormat = props.attribute?.options?.outputFormat;
  const characterLimit = props.attribute?.options?.characterLimit;
  const placeholder =
    props.attribute?.options?.placeholder ??
    (typeof (props as { placeholder?: unknown }).placeholder === 'string'
      ? (props as { placeholder?: string }).placeholder
      : undefined);

  const [runtimeSettings, setRuntimeSettings] = useState<TiptapRuntimeSettings>(
    DEFAULT_RUNTIME_SETTINGS
  );
  const [isSettingsLoading, setIsSettingsLoading] = useState<boolean>(true);
  const effectivePresetName = normalizedPresetName ?? runtimeSettings.defaultPreset;
  const { config, isLoading } = usePresetConfig(effectivePresetName);

  useEffect(() => {
    let mounted = true;
    Promise.resolve()
      .then(() => {
        if (typeof getFetchClient !== 'function') return undefined;
        return getFetchClient().get('/tiptap-editor/settings');
      })
      .then(
        (
          res:
            | {
                data?: {
                  defaultPreset?: string;
                  enableRelationalSync?: boolean;
                  defaultOutputFormat?: TiptapOutputFormat;
                };
              }
            | undefined
        ) => {
          if (!mounted) return;
          setRuntimeSettings({
            ...DEFAULT_RUNTIME_SETTINGS,
            ...(typeof res?.data?.defaultPreset === 'string' &&
            res.data.defaultPreset.trim().length > 0
              ? { defaultPreset: res.data.defaultPreset.trim() }
              : {}),
            ...(typeof res?.data?.enableRelationalSync === 'boolean'
              ? { enableRelationalSync: res.data.enableRelationalSync }
              : {}),
            ...(res?.data?.defaultOutputFormat === 'json' ||
            res?.data?.defaultOutputFormat === 'html' ||
            res?.data?.defaultOutputFormat === 'markdown'
              ? { defaultOutputFormat: res.data.defaultOutputFormat }
              : {}),
          });
          setIsSettingsLoading(false);
        }
      )
      .catch(() => {
        if (mounted) {
          setRuntimeSettings(DEFAULT_RUNTIME_SETTINGS);
          setIsSettingsLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (isLoading || isSettingsLoading) {
    return (
      <Box padding={4}>
        {formatMessage({ id: 'tiptap-editor.loading', defaultMessage: 'Loading editor...' })}
      </Box>
    );
  }

  const storedLooksJson =
    (props.value !== null && typeof props.value === 'object') ||
    (typeof props.value === 'string' && props.value.trim().startsWith('{"type":"doc"'));
  const resolvedFormat =
    outputFormat ?? (storedLooksJson ? 'json' : runtimeSettings.defaultOutputFormat);

  return (
    <InnerEditor
      {...props}
      ref={forwardedRef}
      config={config ?? MINIMAL_PRESET_CONFIG}
      presetName={effectivePresetName}
      outputFormat={resolvedFormat}
      relationalSyncEnabled={runtimeSettings.enableRelationalSync}
      characterLimit={characterLimit}
      placeholder={placeholder}
    />
  );
});

export default RichTextInput;
