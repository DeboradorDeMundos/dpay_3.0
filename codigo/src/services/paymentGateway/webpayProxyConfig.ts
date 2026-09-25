import DeviceInfo from 'react-native-device-info';

/**
 * URL del proxy Webpay.
 *
 * - Emulador (prueba compartida, sin cable): 10.0.2.2 alcanza el proxy del PC.
 * - Celular en depuración por USB: 127.0.0.1 con adb reverse tcp:8787.
 * - Datos móviles: definir WEBPAY_PROXY_PUBLIC_URL con un HTTPS público.
 *   127.0.0.1 y 192.168.x no existen en la red del operador.
 * - Release sin URL pública: Webpay queda desactivado. Efectivo y DTE siguen.
 */
export const WEBPAY_PROXY_PUBLIC_URL = '';

export const WEBPAY_PROXY_PORT = 8787;

/** Deep link registrado en AndroidManifest (intent-filter). */
export const WEBPAY_RETURN_DEEP_LINK = 'dtemitepos://payments/webpay/return';

export function proxyBaseUrlForRuntime(isEmulator: boolean): string {
  const pub = WEBPAY_PROXY_PUBLIC_URL.trim().replace(/\/$/, '');
  if (pub) return pub;
  if (!__DEV__) return '';
  return isEmulator
    ? `http://10.0.2.2:${WEBPAY_PROXY_PORT}`
    : `http://127.0.0.1:${WEBPAY_PROXY_PORT}`;
}

export async function getWebpayProxyBaseUrl(): Promise<string> {
  try {
    const emulator = await DeviceInfo.isEmulator();
    return proxyBaseUrlForRuntime(Boolean(emulator));
  } catch {
    return proxyBaseUrlForRuntime(false);
  }
}

export async function isWebpayProxyConfigured(): Promise<boolean> {
  const url = await getWebpayProxyBaseUrl();
  return url.length > 0;
}
