/**
 * Copiar a `webpayProxyConfig.overrides.ts` (gitignored) y ajustar IPs/túnel.
 * En webpayProxyConfig.ts importar overrides si el archivo existe.
 *
 * WLAN: misma Wi‑Fi que el PC (QR escaneable desde otro celular en LAN).
 * WWAN: túnel HTTPS hacia el proxy del PC (pruebas con datos móviles).
 */

export const WEBPAY_PROXY_DEV_LAN_URL = 'http://192.168.1.4:8787';

/** HTTPS público (ngrok, cloudflared). Debe coincidir con PUBLIC_BASE_URL del proxy. */
export const WEBPAY_PROXY_PUBLIC_URL = '';
