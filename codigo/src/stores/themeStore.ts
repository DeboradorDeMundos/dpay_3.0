import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'theme-storage' });

interface ThemeState {
  isDarkMode: boolean;
  toggleTheme: () => void;
  initializeTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDarkMode: true, // Tema oscuro por defecto
  
  toggleTheme: () => {
    set((state) => {
      const newMode = !state.isDarkMode;
      storage.set('isDarkMode', newMode ? 'true' : 'false');
      return { isDarkMode: newMode };
    });
  },
  
  initializeTheme: () => {
    // Si no hay valor guardado, usar tema oscuro (true)
    const savedMode = storage.getString('isDarkMode');
    const isDark = savedMode === 'true' ? true : (savedMode === 'false' ? false : true);
    set({ isDarkMode: isDark });
  },
}));
