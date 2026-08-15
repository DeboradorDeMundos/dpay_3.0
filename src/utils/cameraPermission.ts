import { Platform, PermissionsAndroid } from 'react-native';

export async function requestCameraPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.CAMERA,
    {
      title: 'Permiso de cámara',
      message: 'D-PAY necesita acceso a la cámara para escanear productos.',
      buttonNeutral: 'Preguntar después',
      buttonNegative: 'Cancelar',
      buttonPositive: 'OK',
    },
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}
