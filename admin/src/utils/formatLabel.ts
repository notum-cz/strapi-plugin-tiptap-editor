import type { IntlLabel } from '../registry/types';

type FormatMessage = (descriptor: { id: string; defaultMessage: string }) => string;

/** Host definitions carry plain strings, plugin built-ins carry intl descriptors; both become text here. */
export const formatLabel = (label: IntlLabel, formatMessage: FormatMessage): string =>
  typeof label === 'string' ? label : formatMessage(label);
