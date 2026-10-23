import { TiptapThemeConfig } from '../../../shared/src/types';
import { getThemeCache } from '../utils/themeCache';

export function useThemeConfig(): TiptapThemeConfig | null {
  return getThemeCache();
}
