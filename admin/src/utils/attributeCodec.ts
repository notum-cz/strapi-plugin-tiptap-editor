/** ProseMirror attribute key → clipboard data attribute, e.g. `openInNewTab` → `data-open-in-new-tab`. */
export const dataAttributeName = (key: string): string =>
  `data-${key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)}`;

/** Strings stay raw so clipboard HTML reads naturally; everything else round-trips through JSON. */
export const encodeAttribute = (value: unknown): string =>
  typeof value === 'string' ? value : JSON.stringify(value);

/** Mirrors encodeAttribute, using the schema default's type to tell a raw string from JSON; the default is the fallback for unparseable JSON. */
export const decodeAttribute = (raw: string | null, defaultValue: unknown): unknown => {
  if (raw === null) return defaultValue;
  if (typeof defaultValue === 'string') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    // A null default declares no type, so an unparseable value was written by a string attribute and
    // must be kept verbatim; a typed default tells us the written value is corrupt, so it wins.
    return defaultValue === null ? raw : defaultValue;
  }
};
