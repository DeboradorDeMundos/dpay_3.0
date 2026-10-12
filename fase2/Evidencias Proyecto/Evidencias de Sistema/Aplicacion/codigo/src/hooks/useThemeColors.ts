import { useMemo } from 'react';
import { lightColors, darkColors } from '../theme/colors';
import { useThemeStore } from '../stores/themeStore';

export const useThemeColors = () => {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  
  return useMemo(() => {
    const colors = isDarkMode ? darkColors : lightColors;
    return {
      ...colors,
      isDark: isDarkMode,
    };
  }, [isDarkMode]);
};
