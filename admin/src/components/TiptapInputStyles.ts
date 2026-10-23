import styled from 'styled-components';

export const TiptapInputStyles = styled.div`
  .tiptap-editor-wrapper.is-fullscreen {
    position: fixed;
    inset: 16px;
    z-index: 250;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
    background: ${({ theme }) => theme.colors.neutral100};
  }

  .tiptap-editor-wrapper.is-fullscreen .editor-content {
    flex-grow: 1;
    overflow-y: auto;
  }

  .tiptap-editor-wrapper.is-fullscreen .ProseMirror {
    max-height: none;
    min-height: 70vh;
  }

  .editor-toolbar {
    margin-bottom: 0.25rem;
    padding-bottom: 0.25rem;
  }

  .ProseMirror {
    font-size: 1.4rem; /* Increase editor font size to match Strapi default */
    outline: none;
    max-height: 60vh;
    min-height: 15vh;
    overflow-y: auto;
    padding: 1rem;
  }

  .ProseMirror p.is-editor-empty:first-child::before {
    color: ${({ theme }) => theme.colors.neutral500};
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }

  .ProseMirror:focus-visible {
    box-shadow: inset 0 0 0 2px ${({ theme }) => theme.colors.primary600};
    border-radius: 4px;
  }

  /* Remove unnecessary margin at the top of the editor */
  .ProseMirror *:first-child {
    margin-top: 0;
  }

  /* --- Basic text styles --- */

  .ProseMirror p {
    margin: 0 0 12px;
  }

  .ProseMirror p.lead-paragraph,
  .ProseMirror p[data-lead="true"] {
    font-size: 1.75rem;
    line-height: 1.55;
    color: ${({ theme }) => theme.colors.neutral700};
    font-weight: 400;
  }

  .ProseMirror p:last-child {
    margin-bottom: 0;
  }

  .ProseMirror h1,
  .ProseMirror h2,
  .ProseMirror h3,
  .ProseMirror h4 {
    font-weight: 600;
    line-height: 1.25;
    margin: 1em 0 0.5em;
  }

  .ProseMirror h1 {
    font-size: 4rem;
  }

  .ProseMirror h2 {
    font-size: 3.2rem;
  }

  .ProseMirror h3 {
    font-size: 2.5rem;
  }

  .ProseMirror h4 {
    font-size: 2rem;
  }

  .ProseMirror ul,
  .ProseMirror ol {
    margin: 0.75em 0 1em;
    padding-left: 1.5rem;
  }

  .ProseMirror ul {
    list-style: disc;
  }

  .ProseMirror ol {
    list-style: decimal;
  }

  .ProseMirror li {
    margin: 0.25em 0;
  }

  .ProseMirror ul.tiptap-task-list {
    list-style: none;
    padding-left: 0.25rem;
  }

  .ProseMirror blockquote {
    border-left: 3px solid ${({ theme }) => theme.colors.neutral500};
    margin: 1em 0;
    padding: 0.25em 1rem;
    font-style: italic;
    background: ${({ theme }) => theme.colors.neutral150};
    color: ${({ theme }) => theme.colors.neutral800};
  }

  .ProseMirror code {
    background: ${({ theme }) => theme.colors.neutral150};
    color: ${({ theme }) => theme.colors.neutral800};
    padding: 2px 4px;
    border-radius: 4px;
    font-family:
      ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
    font-size: 0.9em;
  }

  .ProseMirror pre {
    background: ${({ theme }) => theme.colors.neutral800};
    color: ${({ theme }) => theme.colors.neutral100};
    padding: 12px 16px;
    border-radius: 6px;
    overflow-x: auto;
    margin: 0.75em 0;
  }

  .ProseMirror pre code {
    background: transparent;
    color: inherit;
    padding: 0;
  }

  .ProseMirror a {
    color: ${({ theme }) => theme.colors.primary600};
    text-decoration: underline;
  }

  .ProseMirror abbr[title] {
    text-decoration: underline dotted ${({ theme }) => theme.colors.primary600};
    cursor: help;
  }

  .ProseMirror [dir="rtl"] {
    direction: rtl;
    unicode-bidi: isolate;
  }

  .ProseMirror strong {
    font-weight: 600;
  }

  .ProseMirror em {
    font-style: italic;
  }

  .ProseMirror u {
    text-decoration: underline;
  }

  .ProseMirror s {
    text-decoration: line-through;
  }

  /* --- Accordion (<details> / <summary>) --- */
  .ProseMirror details.tiptap-details {
    border: 1px solid ${({ theme }) => theme.colors.neutral200};
    border-radius: 6px;
    padding: 8px 12px;
    margin: 0.75em 0;
    background: ${({ theme }) => theme.colors.neutral0};
  }

  .ProseMirror summary.tiptap-details-summary {
    font-weight: 600;
    cursor: pointer;
    padding: 4px 0;
  }

  .ProseMirror .tiptap-details-content {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid ${({ theme }) => theme.colors.neutral200};
  }

  /* --- Conversation History --- */
  .ProseMirror .tiptap-conversation-history {
    border-left: 3px solid ${({ theme }) => theme.colors.primary600};
    background: ${({ theme }) => theme.colors.neutral100};
    padding: 10px 14px;
    border-radius: 0 6px 6px 0;
    margin: 0.75em 0;
  }

  /* --- Multi-Column Layout --- */
  .ProseMirror .tiptap-layout-container {
    display: grid;
    gap: 16px;
    margin: 0.75em 0;
    grid-template-columns: repeat(2, 1fr);
  }

  .ProseMirror .tiptap-layout-container[data-columns="1:1:1"] {
    grid-template-columns: repeat(3, 1fr);
  }

  .ProseMirror .tiptap-layout-container[data-columns="1:2"] {
    grid-template-columns: 1fr 2fr;
  }

  .ProseMirror .tiptap-layout-container[data-columns="2:1"] {
    grid-template-columns: 2fr 1fr;
  }

  .ProseMirror .tiptap-layout-column {
    border: 1px dashed ${({ theme }) => theme.colors.neutral200};
    border-radius: 6px;
    padding: 10px;
    min-width: 0;
  }

  /* --- Page Break --- */
  .ProseMirror .tiptap-page-break {
    text-align: center;
    font-size: 1.1rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.neutral600};
    border-top: 2px dashed ${({ theme }) => theme.colors.neutral200};
    border-bottom: 2px dashed ${({ theme }) => theme.colors.neutral200};
    padding: 4px 0;
    margin: 1em 0;
    user-select: none;
  }

  /* --- Images --- */

  .ProseMirror img {
    max-width: 100%;
    display: block;
    height: auto;
  }

  /* Selection ring for selected image node */
  .ProseMirror .ProseMirror-selectednode img {
    outline: 2px solid ${({ theme }) => theme.colors.primary600};
    outline-offset: 2px;
  }

  /* NodeView wrapper for images — ensure block display */
  [data-type="image"] {
    margin: 0.75em 0;
  }

  /* Image alignment — text-align on the node wrapper centres the inline-block image container */
  [data-align="center"] {
    text-align: center;
  }

  [data-align="right"] {
    text-align: right;
  }

  /* Inline-block wrapper for positioning the resize handle relative to the image */
  .image-wrapper {
    position: relative;
    display: inline-block;
    max-width: 100%;
    line-height: 0;
  }

  .image-wrapper img {
    display: block;
    max-width: 100%;
    height: auto;
  }

  /* Resize handle — bottom-right corner */
  .image-resize-handle {
    position: absolute;
    right: -4px;
    bottom: -4px;
    width: 12px;
    height: 12px;
    background: ${({ theme }) => theme.colors.primary600};
    border: 2px solid ${({ theme }) => theme.colors.neutral0};
    border-radius: 50%;
    cursor: nwse-resize;
    opacity: 0;
    transition: opacity 0.15s;
    z-index: 1;
  }

  .image-wrapper:hover .image-resize-handle,
  .image-wrapper[data-selected] .image-resize-handle,
  .ProseMirror-selectednode .image-resize-handle {
    opacity: 1;
  }

  .ProseMirror {
    table {
      border-collapse: collapse;
      margin: 0;
      overflow: hidden;
      table-layout: fixed;
      width: 100%;

      td,
      th {
        border: 1px solid ${({ theme }) => theme.colors.neutral200};
        box-sizing: border-box;
        min-width: 1em;
        padding: 6px 8px;
        position: relative;
        vertical-align: top;

        > * {
          margin-bottom: 0;
        }
      }

      th {
        background-color: inherit;
        font-weight: normal;
        text-align: left;
      }

      .selectedCell:after {
        background: rgba(0, 37, 159, 0.32);
        content: '';
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        pointer-events: none;
        position: absolute;
        z-index: 2;
      }

      .column-resize-handle {
        background-color: purple;
        bottom: -2px;
        pointer-events: none;
        position: absolute;
        right: -2px;
        top: 0;
        width: 4px;
      }
    }

    .tableWrapper {
      margin: 1.5rem 0;
      overflow-x: auto;
    }

    &.resize-cursor {
      cursor: ew-resize;
      cursor: col-resize;
    }
  }

  .only-cursive {
    font-style: italic;
    font-weight: bold;
  }
`;
