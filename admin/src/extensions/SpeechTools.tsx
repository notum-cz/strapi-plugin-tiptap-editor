import React, { useState, useRef, useEffect } from 'react';
import type { Editor } from '@tiptap/core';
import { Microphone, VolumeUp } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { ToolbarButton } from '../components/ToolbarButton';

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

/**
 * Provides Speech-to-Text (`SpeechRecognition`) and Text-to-Speech (`speechSynthesis`) toolbar controls
 * with an `aria-live="polite"` status announcer.
 */
export function useSpeechTools(
  editor: Editor | null,
  props: { disabled?: boolean } = { disabled: false }
) {
  const { formatMessage } = useIntl();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [liveStatus, setLiveStatus] = useState('');
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleSpeechToText = () => {
    if (!editor) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      setLiveStatus(
        formatMessage({
          id: 'tiptap-editor.speech.dictationStopped',
          defaultMessage: 'Voice dictation stopped.',
        })
      );
      return;
    }

    const SpeechRecognitionCtor =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRecognitionCtor) {
      setLiveStatus(
        formatMessage({
          id: 'tiptap-editor.speech.notSupported',
          defaultMessage: 'Speech recognition is not supported in this browser.',
        })
      );
      return;
    }

    try {
      const recognition: SpeechRecognitionInstance = new SpeechRecognitionCtor();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang =
        (typeof document !== 'undefined' && document.documentElement.lang) || 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript;
          }
        }
        const trimmed = transcript.trim();
        if (trimmed) {
          const { from } = editor.state.selection;
          const prevChar = from > 1 ? editor.state.doc.textBetween(from - 1, from, '') : '';
          const needsLeadingSpace = Boolean(prevChar && !/\s/.test(prevChar));
          editor
            .chain()
            .focus()
            .insertContent(`${needsLeadingSpace ? ' ' : ''}${trimmed}`)
            .run();
        }
      };

      recognition.onerror = () => {
        if (recognitionRef.current !== recognition) return;
        recognitionRef.current = null;
        setIsListening(false);
        setLiveStatus(
          formatMessage({
            id: 'tiptap-editor.speech.dictationError',
            defaultMessage: 'Voice dictation encountered an error.',
          })
        );
      };

      recognition.onend = () => {
        if (recognitionRef.current !== recognition) return;
        recognitionRef.current = null;
        setIsListening(false);
        setLiveStatus(
          formatMessage({
            id: 'tiptap-editor.speech.dictationStopped',
            defaultMessage: 'Voice dictation stopped.',
          })
        );
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
      setLiveStatus(
        formatMessage({
          id: 'tiptap-editor.speech.dictationStarted',
          defaultMessage: 'Voice dictation started. Speak now.',
        })
      );
    } catch {
      setIsListening(false);
    }
  };

  const toggleTextToSpeech = () => {
    if (!editor || typeof window === 'undefined' || !window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setLiveStatus(
        formatMessage({
          id: 'tiptap-editor.speech.readAloudStopped',
          defaultMessage: 'Read aloud stopped.',
        })
      );
      return;
    }

    const { from, to } = editor.state.selection;
    const selectedText =
      from !== to ? editor.state.doc.textBetween(from, to, ' ') : editor.getText();

    if (!selectedText.trim()) return;

    const utterance = new SpeechSynthesisUtterance(selectedText);
    utterance.onend = () => {
      setIsSpeaking(false);
      setLiveStatus(
        formatMessage({
          id: 'tiptap-editor.speech.readAloudCompleted',
          defaultMessage: 'Read aloud completed.',
        })
      );
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    setLiveStatus(
      formatMessage({
        id: 'tiptap-editor.speech.readingAloud',
        defaultMessage: 'Reading content aloud.',
      })
    );
  };

  const speechToTextButton = (
    <ToolbarButton
      onClick={toggleSpeechToText}
      icon={<Microphone />}
      active={isListening}
      toggle
      disabled={props.disabled || !editor}
      tooltip={
        isListening
          ? formatMessage({
              id: 'tiptap-editor.toolbar.speechToText.stop',
              defaultMessage: 'Stop voice dictation',
            })
          : formatMessage({
              id: 'tiptap-editor.toolbar.speechToText.start',
              defaultMessage: 'Voice dictation (Speech-to-Text)',
            })
      }
    />
  );

  const textToSpeechButton = (
    <ToolbarButton
      onClick={toggleTextToSpeech}
      icon={<VolumeUp />}
      active={isSpeaking}
      toggle
      disabled={props.disabled || !editor}
      tooltip={
        isSpeaking
          ? formatMessage({
              id: 'tiptap-editor.toolbar.textToSpeech.stop',
              defaultMessage: 'Stop reading aloud',
            })
          : formatMessage({
              id: 'tiptap-editor.toolbar.textToSpeech.start',
              defaultMessage: 'Read aloud (Text-to-Speech)',
            })
      }
    />
  );

  const speechLiveRegion = (
    <span
      role="status"
      aria-live="polite"
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      {liveStatus}
    </span>
  );

  return { speechToTextButton, textToSpeechButton, speechLiveRegion };
}
