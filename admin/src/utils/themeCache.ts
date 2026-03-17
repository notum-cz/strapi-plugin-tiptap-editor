import { TiptapThemeConfig } from '../../../shared/types';

let cache: TiptapThemeConfig | null = null;

export function setThemeCache(theme: TiptapThemeConfig | null): void {
  cache = theme;
}

export function getThemeCache(): TiptapThemeConfig | null {
  return cache;
}
