import { useState, useEffect } from 'react';
import { Platform, PermissionsAndroid, Linking } from 'react-native';
import { useAlertStore } from '../stores/alertStore';

/**
 * Hook para manejar permisos de Bluetooth
 * Verifica y solicita permisos cada vez que se requieren
 */
export const useBluetoothPermissions = () => {
  const [hasPermissions, setHasPermissions] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const { showAlert } = useAlertStore();

  /**
   * Verifica si ya se tienen los permisos actualmente
   */
  const checkPermissions = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      setHasPermissions(true);
      return true;
    }

    try {
      const androidVersion = Platform.Version as number;
      
      if (androidVersion >= 31) {
        // Android 12+ requiere BLUETOOTH_CONNECT y BLUETOOTH_SCAN
        const bluetoothConnect = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
        );
        const bluetoothScan = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN
        );
        
        const granted = bluetoothConnect && bluetoothScan;
        setHasPermissions(granted);
        return granted;
      } else {
        // Android 11 y anteriores requieren ubicación para escaneo Bluetooth
        const location = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        
        setHasPermissions(location);
        return location;
      }
    } catch (error) {
      console.error('Error al verificar permisos Bluetooth:', error);
      setHasPermissions(false);
      return false;
    }
  };

  /**
   * Abre la configuración de la aplicación para que el usuario otorgue permisos manualmente
   */
  const openAppSettings = () => {
    Linking.openSettings();
  };

  /**
   * Solicita los permisos necesarios - Si fueron denegados permanentemente, abre configuración
   */
  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      setHasPermissions(true);
      return true;
    }

    setIsChecking(true);

    try {
      const androidVersion = Platform.Version as number;
      let granted = false;

      if (androidVersion >= 31) {
        // Android 12+ solicita BLUETOOTH_CONNECT, BLUETOOTH_SCAN y ubicación
        // La ubicación es necesaria para startDiscovery() a menos que el manifest
        // tenga neverForLocation en BLUETOOTH_SCAN (lo tenemos, pero se pide igual
        // como fallback para dispositivos con ROMs personalizadas)
        const results = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        granted =
          results['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
          results['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED;
        // La ubicación no es bloqueante (por neverForLocation), pero ayuda en ROMs custom

        // Si fue denegado permanentemente, mostrar opción de ir a configuración
        const deniedPermanently =
          results['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ||
          results['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN;

        if (!granted && deniedPermanently) {
          showAlert(
            'Permisos Bloqueados',
            'Los permisos de Bluetooth fueron denegados permanentemente. Ve a Configuración → Aplicaciones → D-PAY → Permisos para habilitarlos.',
            [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Ir a Configuración', onPress: openAppSettings },
            ]
          );
        }
      } else {
        // Android 11 y anteriores solicitan ubicación
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Permiso de Ubicación',
            message:
              'Esta aplicación necesita acceso a la ubicación para escanear impresoras Bluetooth cercanas.',
            buttonNeutral: 'Preguntar luego',
            buttonNegative: 'Cancelar',
            buttonPositive: 'Aceptar',
          }
        );

        granted = result === PermissionsAndroid.RESULTS.GRANTED;

        // Si fue denegado permanentemente
        if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          showAlert(
            'Permisos Bloqueados',
            'El permiso de ubicación fue denegado permanentemente. Ve a Configuración → Aplicaciones → D-PAY → Permisos para habilitarlo.',
            [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Ir a Configuración', onPress: openAppSettings },
            ]
          );
        }
      }

      setHasPermissions(granted);
      setIsChecking(false);

      return granted;
    } catch (error) {
      console.error('Error al solicitar permisos Bluetooth:', error);
      setIsChecking(false);
      setHasPermissions(false);
      return false;
    }
  };

  /**
   * Verifica permisos al montar el componente
   */
  useEffect(() => {
    checkPermissions();
  }, []);

  return {
    hasPermissions,
    isChecking,
    checkPermissions,
    requestPermissions,
    openAppSettings,
  };
};
