import React, { useState, useRef, useEffect } from 'react';
import { Node, mergeAttributes, type Editor } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, useEditorState } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import {
  Popover,
  TextInput,
  IconButton,
  Dialog,
  Button,
  Field,
  Flex,
  Typography,
} from '@strapi/design-system';
import { Trash, VolumeUp, Microphone } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { ToolbarButton } from '../components/ToolbarButton';
import { MediaLibraryWrapper, type StrapiFile } from '../components/MediaLibraryWrapper';
import { uploadFileToStrapi } from '../utils/strapiApp';
import { isSafeUrl } from '../../../shared/contentSerializer';

export interface StrapiAudioOptions {
  HTMLAttributes: Record<string, unknown>;
  enableContentCheck: boolean;
}

function AudioPreview({ node }: Pick<NodeViewProps, 'node'>) {
  const src = String(node.attrs.src || '');
  const safeSrc = isSafeUrl(src) ? src : '';

  return (
    <figure style={{ margin: '0.75em 0' }}>
      {safeSrc && (
        <audio
          src={safeSrc}
          controls
          style={{ width: '100%', maxWidth: '480px', display: 'block' }}
        />
      )}
      {node.attrs.caption && (
        <figcaption style={{ fontSize: '1.2rem', color: '#666687', marginTop: '4px' }}>
          {node.attrs.caption}
        </figcaption>
      )}
    </figure>
  );
}

/**
 * Read-only NodeView for audio players when the feature is disabled in the active preset.
 */
export function AudioNodeViewReadOnly({ node }: NodeViewProps) {
  return (
    <NodeViewWrapper data-drag-handle data-align={node.attrs['data-align'] ?? undefined}>
      <AudioPreview node={node} />
    </NodeViewWrapper>
  );
}

/**
 * Interactive NodeView for audio players with caption editing and delete action.
 */
export function AudioNodeView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const { formatMessage } = useIntl();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [caption, setCaption] = useState<string>(node.attrs.caption ?? '');

  useEffect(() => {
    setCaption(node.attrs.caption ?? '');
  }, [node.attrs.caption]);

  return (
    <NodeViewWrapper data-drag-handle data-align={node.attrs['data-align'] ?? undefined}>
      <Popover.Root open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <Popover.Anchor>
          <div
            role="button"
            tabIndex={0}
            aria-haspopup="dialog"
            aria-expanded={isPopoverOpen}
            aria-label={formatMessage({
              id: 'tiptap-editor.audio.edit',
              defaultMessage: 'Edit audio',
            })}
            onClick={() => setIsPopoverOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsPopoverOpen(true);
              }
            }}
            style={{
              outline: selected ? '2px solid #4945ff' : undefined,
              borderRadius: '6px',
              padding: '4px',
              cursor: 'pointer',
            }}
          >
            <AudioPreview node={node} />
          </div>
        </Popover.Anchor>
        <Popover.Content side="bottom">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px' }}>
            <TextInput
              placeholder={formatMessage({
                id: 'tiptap-editor.audio.captionPlaceholder',
                defaultMessage: 'Audio caption',
              })}
              value={caption}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCaption(e.target.value)}
              onBlur={() => updateAttributes({ caption: caption || null })}
              aria-label={formatMessage({
                id: 'tiptap-editor.audio.captionPlaceholder',
                defaultMessage: 'Audio caption',
              })}
            />
            <IconButton
              onClick={deleteNode}
              label={formatMessage({
                id: 'tiptap-editor.audio.delete',
                defaultMessage: 'Delete audio',
              })}
            >
              <Trash />
            </IconButton>
          </div>
        </Popover.Content>
      </Popover.Root>
    </NodeViewWrapper>
  );
}

export const StrapiAudio = Node.create<StrapiAudioOptions>({
  name: 'audio',
  group: 'block',
  atom: true,
  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
      enableContentCheck: false,
    };
  },

  addAttributes() {
    return {
      src: { default: null },
      title: { default: null },
      caption: { default: null },
      mime: { default: null },
      'data-asset-id': {
        default: null,
        parseHTML: (el: HTMLElement) => {
          const raw = el.getAttribute('data-asset-id');
          if (!raw) return null;
          const num = parseInt(raw, 10);
          return Number.isNaN(num) ? null : num;
        },
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs['data-asset-id'] != null ? { 'data-asset-id': String(attrs['data-asset-id']) } : {},
      },
      'data-document-id': {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('data-document-id') ?? null,
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs['data-document-id']
            ? { 'data-document-id': String(attrs['data-document-id']) }
            : {},
      },
      'data-align': {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('data-align') ?? null,
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs['data-align'] ? { 'data-align': String(attrs['data-align']) } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: 'audio' }];
  },

  renderHTML({ HTMLAttributes }) {
    const src = String(HTMLAttributes.src || '');
    return [
      'audio',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        src: isSafeUrl(src) ? src : '',
        controls: 'true',
        'data-type': 'audio',
      }),
    ];
  },

  addNodeView() {
    if (this.options.enableContentCheck) {
      return ReactNodeViewRenderer(AudioNodeViewReadOnly);
    }
    return ReactNodeViewRenderer(AudioNodeView);
  },
});

/**
 * Provides toolbar button and dialog for inserting audio from the Strapi Media Library,
 * external URL, or in-browser MediaRecorder voice recording (uploaded to `/upload`).
 */
export function useAudio(
  editor: Editor | null,
  props: { disabled?: boolean } = { disabled: false }
) {
  const { formatMessage } = useIntl();
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [showAudioDialog, setShowAudioDialog] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [audioCaption, setAudioCaption] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedDataUrl, setRecordedDataUrl] = useState<string | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordedBlobRef = useRef<Blob | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const editorState = useEditorState({
    editor,
    selector: (ctx) => ({
      isInCodeBlock: ctx.editor?.isActive('codeBlock') ?? false,
    }),
  });

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const startRecording = async () => {
    setRecordingError(null);
    setRecordedDataUrl(null);
    recordedChunksRef.current = [];
    recordedBlobRef.current = null;

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setRecordingError(
        formatMessage({
          id: 'tiptap-editor.audio.notSupported',
          defaultMessage: 'Audio recording is not supported in this browser.',
        })
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(recordedChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        recordedBlobRef.current = blob;
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setRecordedDataUrl(reader.result);
          }
        };
        reader.readAsDataURL(blob);
      };

      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch {
      setRecordingError(
        formatMessage({
          id: 'tiptap-editor.audio.micDenied',
          defaultMessage: 'Microphone permission denied or unavailable.',
        })
      );
    }
  };

  const handleSelectAssets = (assets: StrapiFile[]) => {
    const asset = assets[0];
    const src = asset?.url?.trim();
    if (!asset || !editor || !src) {
      setShowMediaLibrary(false);
      return;
    }

    editor
      .chain()
      .focus()
      .insertContent({
        type: 'audio',
        attrs: {
          src,
          title: asset.name ?? asset.alternativeText ?? '',
          caption: asset.caption ?? null,
          mime: asset.mime ?? 'audio/mpeg',
          'data-asset-id': asset.id ?? null,
          'data-document-id': asset.documentId ?? null,
        },
      })
      .createParagraphNear()
      .run();

    setShowMediaLibrary(false);
  };

  const handleInsertUrlOrRecording = async () => {
    if (!editor) return;

      // Upload recorded Blob to Strapi Media Library (/upload) when available
    if (!audioUrl.trim() && recordedBlobRef.current && typeof FormData !== 'undefined') {
      try {
        setIsUploading(true);
        const ext = recordedBlobRef.current.type.includes('ogg') ? 'ogg' : 'webm';
        const filename = `voice-recording-${Date.now()}.${ext}`;
        const formData = new FormData();
        formData.append('files', recordedBlobRef.current, filename);
        const uploadedFile = await uploadFileToStrapi(formData);

        if (!uploadedFile?.url) {
          setRecordingError(
            formatMessage({
              id: 'tiptap-editor.audio.uploadError',
              defaultMessage: 'Failed to upload recording. Please try again.',
            })
          );
          return;
        }

        editor
          .chain()
          .focus()
          .insertContent({
            type: 'audio',
            attrs: {
              src: uploadedFile.url,
              title:
                audioCaption.trim() ||
                formatMessage({
                  id: 'tiptap-editor.audio.defaultTitle',
                  defaultMessage: 'Voice Recording',
                }),
              caption: audioCaption.trim() || null,
              mime: uploadedFile.mime || recordedBlobRef.current.type || 'audio/webm',
              'data-asset-id': typeof uploadedFile.id === 'number' ? uploadedFile.id : null,
              'data-document-id':
                typeof uploadedFile.documentId === 'string' ? uploadedFile.documentId : null,
            },
          })
          .createParagraphNear()
          .run();

        setAudioUrl('');
        setAudioCaption('');
        setRecordedDataUrl(null);
        recordedBlobRef.current = null;
        setShowAudioDialog(false);
        return;
      } catch {
        setRecordingError(
          formatMessage({
            id: 'tiptap-editor.audio.uploadError',
            defaultMessage: 'Failed to upload recording. Please try again.',
          })
        );
        return;
      } finally {
        setIsUploading(false);
      }
    }

    const finalSrc = audioUrl.trim();
    if (!finalSrc || !isSafeUrl(finalSrc)) return;

    editor
      .chain()
      .focus()
      .insertContent({
        type: 'audio',
        attrs: {
          src: finalSrc,
          title:
            audioCaption.trim() ||
            formatMessage({
              id: 'tiptap-editor.audio.defaultAudioTitle',
              defaultMessage: 'Audio',
            }),
          caption: audioCaption.trim() || null,
        },
      })
      .createParagraphNear()
      .run();

    setAudioUrl('');
    setAudioCaption('');
    setRecordedDataUrl(null);
    recordedBlobRef.current = null;
    setShowAudioDialog(false);
  };

  const audioButton = (
    <ToolbarButton
      onClick={() => setShowAudioDialog(true)}
      icon={<VolumeUp />}
      active={false}
      disabled={props.disabled || !editor || (editorState?.isInCodeBlock ?? false)}
      tooltip={formatMessage({
        id: 'tiptap-editor.toolbar.insertAudio',
        defaultMessage: 'Insert or record audio',
      })}
    />
  );

  const audioDialog = (
    <>
      <Dialog.Root
        open={showAudioDialog}
        onOpenChange={(open: boolean) => {
          if (!open) stopRecording();
          setShowAudioDialog(open);
        }}
      >
        <Dialog.Content>
          <Dialog.Header>
            {formatMessage({
              id: 'tiptap-editor.audio.dialogTitle',
              defaultMessage: 'Insert or Record Audio',
            })}
          </Dialog.Header>
          <Dialog.Body>
            <Flex direction="column" alignItems="stretch" gap={4}>
              <Button
                variant="secondary"
                onClick={() => {
                  stopRecording();
                  setShowAudioDialog(false);
                  setShowMediaLibrary(true);
                }}
              >
                {formatMessage({
                  id: 'tiptap-editor.audio.chooseFromLibrary',
                  defaultMessage: 'Choose Audio from Media Library',
                })}
              </Button>

              <Flex
                direction="column"
                gap={2}
                padding={3}
                background="neutral100"
                hasRadius
                alignItems="center"
              >
                <Typography variant="sigma">
                  {formatMessage({
                    id: 'tiptap-editor.audio.voiceRecorderTitle',
                    defaultMessage: 'In-Browser Voice Recorder',
                  })}
                </Typography>
                {isRecording ? (
                  <Flex gap={2} alignItems="center">
                    <Typography variant="omega" textColor="danger600">
                      ●{' '}
                      {formatMessage(
                        {
                          id: 'tiptap-editor.audio.recordingStatus',
                          defaultMessage: 'Recording... {time}',
                        },
                        {
                          time: `${Math.floor(recordingSeconds / 60)}:${String(
                            recordingSeconds % 60
                          ).padStart(2, '0')}`,
                        }
                      )}
                    </Typography>
                    <Button variant="danger" size="S" onClick={stopRecording}>
                      {formatMessage({
                        id: 'tiptap-editor.audio.stopRecording',
                        defaultMessage: 'Stop',
                      })}
                    </Button>
                  </Flex>
                ) : (
                  <Button
                    variant="tertiary"
                    size="S"
                    startIcon={<Microphone />}
                    onClick={startRecording}
                  >
                    {formatMessage({
                      id: 'tiptap-editor.audio.startRecording',
                      defaultMessage: 'Start Recording',
                    })}
                  </Button>
                )}
                {recordedDataUrl && (
                  <audio src={recordedDataUrl} controls style={{ width: '100%' }} />
                )}
                {recordingError && (
                  <Typography variant="pi" textColor="danger600">
                    {recordingError}
                  </Typography>
                )}
              </Flex>

              <Field.Root name="audioUrl">
                <Field.Label>
                  {formatMessage({
                    id: 'tiptap-editor.audio.urlLabel',
                    defaultMessage: 'Or External Audio URL (MP3, WAV, OGG)',
                  })}
                </Field.Label>
                <TextInput
                  placeholder="https://example.com/podcast.mp3"
                  value={audioUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setAudioUrl(e.target.value)
                  }
                />
              </Field.Root>

              <Field.Root name="audioCaption">
                <Field.Label>
                  {formatMessage({
                    id: 'tiptap-editor.audio.captionLabel',
                    defaultMessage: 'Caption (optional)',
                  })}
                </Field.Label>
                <TextInput
                  value={audioCaption}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setAudioCaption(e.target.value)
                  }
                />
              </Field.Root>
            </Flex>
          </Dialog.Body>
          <Dialog.Footer>
            <Dialog.Cancel>
              <Button
                variant="tertiary"
                onClick={() => {
                  stopRecording();
                  setShowAudioDialog(false);
                }}
              >
                {formatMessage({
                  id: 'tiptap-editor.audio.cancel',
                  defaultMessage: 'Cancel',
                })}
              </Button>
            </Dialog.Cancel>
            <Button
              onClick={handleInsertUrlOrRecording}
              disabled={(!recordedDataUrl && !audioUrl.trim()) || isUploading}
              loading={isUploading}
            >
              {formatMessage({
                id: 'tiptap-editor.audio.insert',
                defaultMessage: 'Insert Audio',
              })}
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Root>

      <MediaLibraryWrapper
        open={showMediaLibrary}
        onClose={() => setShowMediaLibrary(false)}
        onSelectAssets={handleSelectAssets}
        allowedTypes={['audios']}
      />
    </>
  );

  return { audioButton, audioDialog };
}
