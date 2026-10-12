/**
 * Copiar a `webpayProxyConfig.overrides.ts` (gitignored) y ajustar IPs/túnel.
 * En webpayProxyConfig.ts importar overrides si el archivo existe.
 *
 * WLAN / LAN: QR con WEBPAY_PROXY_DEV_LAN_URL (IP de la red local).
 * WWAN: QR solo con WEBPAY_PROXY_PUBLIC_URL en HTTPS (túnel). Sin IP privada.
 */

export const WEBPAY_PROXY_DEV_LAN_URL = 'http://192.168.1.4:8787';

/** HTTPS público (ngrok, cloudflared). Debe coincidir con PUBLIC_BASE_URL del proxy. */
export const WEBPAY_PROXY_PUBLIC_URL = '';

/**
 * Mismo valor que PROXY_API_TOKEN del proxy.
 * Obligatorio si PUBLIC_BASE_URL es un túnel público. No commitear el valor real.
 */
export const WEBPAY_PROXY_API_TOKEN = '';
