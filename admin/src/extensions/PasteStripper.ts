import { Extension } from '@tiptap/core';

export const PasteStripper = Extension.create({
  name: 'pasteStripper',

  transformPastedHTML(html: string): string {
    return html.replace(/ style="[^"]*"/g, '');
  },
});
