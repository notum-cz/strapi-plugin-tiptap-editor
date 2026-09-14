export * from './types';
export * from './names';
export * from './toNodeSpec';
export * from './button';
import { buttonSchema } from './button';
import type { RichTextComponentSchema } from './types';

export const BUILT_IN_COMPONENT_SCHEMAS: readonly RichTextComponentSchema[] = [buttonSchema];
