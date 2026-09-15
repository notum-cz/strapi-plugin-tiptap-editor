/** ProseMirror attribute key → clipboard data attribute, e.g. `openInNewTab` → `data-open-in-new-tab`. */
export const dataAttributeName = (key: string): string =>
  `data-${key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)}`;

/**
 * Strings under a string default stay raw so clipboard HTML reads naturally; everything else
 * round-trips through JSON. A null default declares no type, so a string there is JSON-quoted too:
 * written raw, "12" or "true" would decode as a number or boolean.
 */
export const encodeAttribute = (value: unknown, defaultValue: unknown): string =>
  typeof value === 'string' && typeof defaultValue === 'string' ? value : JSON.stringify(value);

/** Mirrors encodeAttribute, using the schema default's type to tell a raw string from JSON; the default is the fallback for unparseable JSON. */
export const decodeAttribute = (raw: string | null, defaultValue: unknown): unknown => {
  if (raw === null) return defaultValue;
  if (typeof defaultValue === 'string') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    // A null default declares no type, so an unparseable value is a raw string (older clipboard
    // HTML) and must be kept verbatim; a typed default tells us the written value is corrupt, so it wins.
    return defaultValue === null ? raw : defaultValue;
  }
};
