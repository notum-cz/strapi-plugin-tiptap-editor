import React from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { TextSelection } from '@tiptap/pm/state';
import type { ResolvedPos } from '@tiptap/pm/model';
import type { NodeViewProps } from '@tiptap/react';
import { useIntl } from 'react-intl';

interface FigureOptions {
  // True when the `figure` preset feature is administratively disabled. The node stays
  // registered in the schema either way (so existing content always parses safely) but
  // becomes inert: read-only render, no drag, and the wrap/unwrap commands refuse to run.
  enableContentCheck: boolean;
}

// Walks up from a resolved position to the nearest ancestor of the given node type,
// returning its depth (or null if there is no such ancestor).
function findAncestorDepth($pos: ResolvedPos, typeName: string): number | null {
  for (let depth = $pos.depth; depth >= 0; depth--) {
    if ($pos.node(depth).type.name === typeName) return depth;
  }
  return null;
}

// ─── Figcaption node view ────────────────────────────────────────────────────
// Content is plain `paragraph+`, same as blockquote — Enter/typing/marks all work via
// ProseMirror's normal paragraph behavior. We only need a wrapper for the <figcaption>
// tag itself, selection styling, and a placeholder shown while the caption is empty.

function FigcaptionNodeView({ node }: NodeViewProps) {
  const { formatMessage } = useIntl();
  const isEmpty = node.textContent.length === 0;

  return (
    <NodeViewWrapper
      as="figcaption"
      className={isEmpty ? 'is-empty' : undefined}
      data-placeholder={formatMessage({
        id: 'tiptap-editor.image.captionPlaceholder',
        defaultMessage: 'Add a caption…',
      })}
    >
      <NodeViewContent />
    </NodeViewWrapper>
  );
}

// ─── Figcaption extension ────────────────────────────────────────────────────

export const Figcaption = Node.create<FigureOptions>({
  name: 'figcaption',
  content: 'paragraph+',
  group: 'block',
  selectable: false,
  draggable: false,

  addOptions() {
    return { enableContentCheck: false };
  },

  parseHTML() {
    return [{ tag: 'figcaption' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['figcaption', mergeAttributes(HTMLAttributes), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FigcaptionNodeView);
  },

  addKeyboardShortcuts() {
    return {
      // Enter inside a caption behaves like Enter in a blockquote: on a non-empty line it
      // just starts a new paragraph (ProseMirror's default splitBlock — we don't need to
      // do anything, just return false). Only the "exit" case needs custom handling: a
      // bare splitBlock+liftEmptyBlock can't lift an empty paragraph out of a figure (its
      // content is strictly 'image figcaption', it won't accept a stray paragraph), so we
      // detect that case ourselves and hop to a new paragraph after the figure instead.
      Enter: ({ editor }) => {
        if (this.options.enableContentCheck) return false;

        const { state, view } = editor;
        const { $from, empty } = state.selection;
        if (!empty) return false;

        const figcaptionDepth = findAncestorDepth($from, 'figcaption');
        if (figcaptionDepth === null) return false;

        const figureDepth = figcaptionDepth - 1;
        if (figureDepth < 0 || $from.node(figureDepth).type.name !== 'figure') return false;

        const figcaptionNode = $from.node(figcaptionDepth);
        const currentParagraph = $from.parent;
        const isEmptyParagraph =
          currentParagraph.type.name === 'paragraph' && currentParagraph.content.size === 0;
        const isLastParagraph = figcaptionNode.lastChild === currentParagraph;

        if (!isEmptyParagraph || !isLastParagraph) {
          return false;
        }

        // Exit the figure. With more than one paragraph, drop this empty trailing one
        // (mirrors liftEmptyBlock's cleanup); a lone empty paragraph stays behind so the
        // caption node itself remains valid (figcaption requires at least one paragraph).
        let tr = state.tr;
        if (figcaptionNode.childCount > 1) {
          const paragraphStart = $from.before(figcaptionDepth + 1);
          tr = tr.delete(paragraphStart, paragraphStart + currentParagraph.nodeSize);
        }

        const paragraphType = state.schema.nodes.paragraph;
        if (!paragraphType) return false;

        const figureAfter = tr.mapping.map($from.end(figureDepth)) + 1;
        tr.insert(figureAfter, paragraphType.create());
        tr.setSelection(TextSelection.near(tr.doc.resolve(figureAfter + 1)));
        view.dispatch(tr);
        return true;
      },

      // Backspace at the very start of an entirely empty caption: lift the image out and
      // delete the figure wrapper. Backspace anywhere else (e.g. start of a later, empty
      // paragraph with text above it) falls through to the default joinBackward, same as
      // it would for any other multi-paragraph block.
      Backspace: ({ editor }) => {
        if (this.options.enableContentCheck) return false;

        const { state } = editor;
        const { $from, empty } = state.selection;
        if (!empty) return false;

        const figcaptionDepth = findAncestorDepth($from, 'figcaption');
        if (figcaptionDepth === null) return false;

        const figcaptionNode = $from.node(figcaptionDepth);
        const isFirstParagraph = figcaptionNode.firstChild === $from.parent;

        if (!isFirstParagraph || $from.parentOffset > 0 || figcaptionNode.textContent.length > 0) {
          return false;
        }

        return editor.commands.removeFigureCaption();
      },
    };
  },
});

// ─── Figure node view ────────────────────────────────────────────────────────

function FigureNodeView({ selected, extension }: NodeViewProps) {
  const readOnly = (extension.options as FigureOptions).enableContentCheck;
  return (
    <NodeViewWrapper
      as="figure"
      data-selected={selected || undefined}
      className="tiptap-figure"
      contentEditable={readOnly ? false : undefined}
    >
      <NodeViewContent />
    </NodeViewWrapper>
  );
}

// ─── Figure extension ────────────────────────────────────────────────────────

export const Figure = Node.create<FigureOptions>({
  name: 'figure',
  content: 'image figcaption',
  group: 'block',
  isolating: true,

  addOptions() {
    return { enableContentCheck: false };
  },

  draggable() {
    return !this.options.enableContentCheck;
  },

  parseHTML() {
    return [{ tag: 'figure' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['figure', mergeAttributes(HTMLAttributes), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FigureNodeView);
  },

  addCommands() {
    return {
      /**
       * Wrap the image at the current selection inside a figure+figcaption structure.
       * Assumes the cursor is on or inside an image node.
       */
      wrapImageInFigure:
        () =>
        ({ state, dispatch }) => {
          if (this.options.enableContentCheck) return false;

          const { $from } = state.selection;

          // image is a leaf node, never an ancestor of $from — check the adjacent node instead
          const imageNode =
            $from.nodeAfter?.type.name === 'image' ? $from.nodeAfter : $from.nodeBefore;
          if (!imageNode || imageNode.type.name !== 'image') return false;
          const imagePos =
            imageNode === $from.nodeAfter ? $from.pos : $from.pos - imageNode.nodeSize;

          const figcaptionType = state.schema.nodes.figcaption;
          const figureType = state.schema.nodes.figure;
          const paragraphType = state.schema.nodes.paragraph;
          if (!figcaptionType || !figureType || !paragraphType) return false;

          const figureNode = figureType.create(null, [
            imageNode,
            figcaptionType.create(null, paragraphType.create()),
          ]);

          if (dispatch) {
            const tr = state.tr.replaceWith(imagePos, imagePos + imageNode.nodeSize, figureNode);
            const figcaptionPos = imagePos + imageNode.nodeSize + 1;
            tr.setSelection(TextSelection.near(tr.doc.resolve(figcaptionPos)));
            dispatch(tr);
          }
          return true;
        },

      /**
       * Unwrap the figure at the current selection: remove the figcaption and
       * replace the entire figure with the bare image node.
       */
      removeFigureCaption:
        () =>
        ({ state, dispatch }) => {
          if (this.options.enableContentCheck) return false;

          const { $from } = state.selection;

          const figureDepth = findAncestorDepth($from, 'figure');
          if (figureDepth === null) return false;

          const figurePos = $from.before(figureDepth);
          const figureNode = $from.node(figureDepth);

          const imageChild = figureNode.firstChild;
          if (!imageChild || imageChild.type.name !== 'image') return false;

          if (dispatch) {
            const tr = state.tr.replaceWith(figurePos, figurePos + figureNode.nodeSize, imageChild);
            tr.setSelection(
              TextSelection.near(tr.doc.resolve(figurePos + imageChild.nodeSize)) as any
            );
            dispatch(tr);
          }
          return true;
        },
    };
  },
});

// ─── Type augmentation ───────────────────────────────────────────────────────

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    figure: {
      /** Wrap the image at the current selection in a <figure> with an empty <figcaption> */
      wrapImageInFigure: () => ReturnType;
      /** Remove the <figcaption> and unwrap the <figure>, leaving a bare <image> */
      removeFigureCaption: () => ReturnType;
    };
  }
}
