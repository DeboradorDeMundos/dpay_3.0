/**
 * URL del proxy Webpay Capstone (COD-04).
 *
 * Emulador Android → 10.0.2.2
 * Honor físico en la misma WiFi → IP LAN del PC (ej. http://192.168.1.20:8787)
 *
 * En release queda vacío: Webpay solo se activa si hay proxy configurado.
 */
export const WEBPAY_PROXY_BASE_URL = __DEV__ ? 'http://192.168.1.7:8787' : '';

/** Deep link registrado en AndroidManifest (intent-filter). */
export const WEBPAY_RETURN_DEEP_LINK = 'dtemitepos://payments/webpay/return';

export const isWebpayProxyConfigured = (): boolean =>
  typeof WEBPAY_PROXY_BASE_URL === 'string' && WEBPAY_PROXY_BASE_URL.length > 0;
