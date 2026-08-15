import { useEffect } from 'react';
import { Platform, StatusBar, AppState } from 'react-native';
import ImmersiveMode from 'react-native-immersive-mode';

export const useImmersiveMode = () => {
  useEffect(() => {
    if (Platform.OS === 'android') {
      const enableImmersiveMode = () => {
        try {
          // Ocultar status bar
          StatusBar.setHidden(true, 'none');
          StatusBar.setBackgroundColor('transparent', false);
          StatusBar.setTranslucent(true);

          // Activar modo inmersivo sticky con react-native-immersive-mode
          ImmersiveMode.setBarMode('FullSticky');
          ImmersiveMode.fullLayout(true);
        } catch (error) {
          console.warn('Error activando modo inmersivo:', error);
        }
      };

      // Activar modo inmersivo inmediatamente
      enableImmersiveMode();

      // Re-activar cuando la app vuelve a primer plano
      const subscription = AppState.addEventListener('change', (nextAppState) => {
        if (nextAppState === 'active') {
          setTimeout(enableImmersiveMode, 100);
        }
      });

      // Re-activar periódicamente para mantener el modo inmersivo
      // Esto asegura que incluso si el drawer lo desactiva, se vuelva a activar
      const interval = setInterval(enableImmersiveMode, 500);

      // Cleanup
      return () => {
        clearInterval(interval);
        subscription?.remove();
        // No restaurar StatusBar al desmontar, mantener inmersivo
      };
    }
  }, []);
};
