// shared/table.ts

/** Node attribute holding a table cell's background color, on both `tableCell` and `tableHeader`. */
export const CELL_BACKGROUND_ATTRIBUTE = 'backgroundColor';

/**
 * Tiptap attribute spec for the cell background. Kept free of Tiptap imports so a host renderer
 * can extend its own `TableCell`/`TableHeader` with the exact same parse and render rules.
 */
export const cellBackgroundAttribute = {
  default: null as string | null,
  // Read through the CSSOM so only a value the browser accepted as a color survives a paste.
  parseHTML: (element: { style: { backgroundColor: string } }): string | null =>
    element.style.backgroundColor || null,
  renderHTML: (attributes: Record<string, unknown>): Record<string, string> => {
    const color = attributes[CELL_BACKGROUND_ATTRIBUTE];
    return typeof color === 'string' && color ? { style: `background-color: ${color}` } : {};
  },
};
