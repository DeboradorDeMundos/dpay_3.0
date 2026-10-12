import { useAlertStore } from '../stores/alertStore';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

/**
 * Hook personalizado para mostrar alertas con el diseño de la aplicación
 * 
 * @example
 * const showAlert = useCustomAlert();
 * 
 * // Alerta simple
 * showAlert('Título', 'Mensaje');
 * 
 * // Alerta con botones personalizados
 * showAlert('Confirmar', '¿Está seguro?', [
 *   { text: 'Cancelar', style: 'cancel' },
 *   { text: 'Eliminar', style: 'destructive', onPress: () => console.log('Eliminado') }
 * ]);
 */
export const useCustomAlert = () => {
  const showAlert = useAlertStore((state) => state.showAlert);
  return showAlert;
};
