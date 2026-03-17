import { TiptapThemeConfig } from '../../../shared/types';
import { getThemeCache } from '../utils/themeCache';

export function useThemeConfig(): TiptapThemeConfig | null {
  return getThemeCache();
}
