import DeviceInfo from 'react-native-device-info';
import {
  detectWebpayAccessNetwork,
  webpayAccessNetworkLabel,
} from './webpayProxyNetwork';

/**
 * Perfil de red para routing del proxy Webpay.
 * - wlan: Wi‑Fi (misma LAN que el PC de desarrollo)
 * - lan: ethernet
 * - wwan: 4G/5G (túnel HTTPS si no hay USB/LAN)
 */
export type WebpayAccessNetwork =
  | 'emulator'
  | 'wlan'
  | 'lan'
  | 'wwan'
  | 'offline'
  | 'unknown';

export type WebpayProxyUrlOverrides = {
  publicUrl?: string;
  lanUrl?: string;
};

type WebpayProxyFileOverrides = {
  WEBPAY_PROXY_PUBLIC_URL?: string;
  WEBPAY_PROXY_DEV_LAN_URL?: string;
  WEBPAY_PROXY_API_TOKEN?: string;
};

function loadWebpayProxyOverrides(): WebpayProxyFileOverrides {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('./webpayProxyConfig.overrides') as WebpayProxyFileOverrides;
  } catch {
    return {};
  }
}

const webpayProxyOverrides = loadWebpayProxyOverrides();

export const WEBPAY_PROXY_PUBLIC_URL =
  webpayProxyOverrides.WEBPAY_PROXY_PUBLIC_URL?.trim() ?? '';

export const WEBPAY_PROXY_DEV_LAN_URL =
  webpayProxyOverrides.WEBPAY_PROXY_DEV_LAN_URL?.trim() ?? '';

/** Mismo valor que PROXY_API_TOKEN del proxy. Vacío en LAN de QA; obligatorio con túnel público. */
export const WEBPAY_PROXY_API_TOKEN =
  webpayProxyOverrides.WEBPAY_PROXY_API_TOKEN?.trim() ?? '';

export const WEBPAY_PROXY_PORT = 8787;

export const WEBPAY_RETURN_DEEP_LINK = 'dtemitepos://payments/webpay/return';

const LOOPBACK_URL = `http://127.0.0.1:${WEBPAY_PROXY_PORT}`;
const EMULATOR_URL = `http://10.0.2.2:${WEBPAY_PROXY_PORT}`;
const PROXY_HEALTH_TIMEOUT_MS = 2500;

function trimBaseUrl(url: string): string {
  return url.trim().replace(/\/$/, '');
}

function configuredUrls(extra?: WebpayProxyUrlOverrides): {
  pub: string;
  lan: string;
} {
  return {
    pub: trimBaseUrl(extra?.publicUrl ?? WEBPAY_PROXY_PUBLIC_URL),
    lan: trimBaseUrl(extra?.lanUrl ?? WEBPAY_PROXY_DEV_LAN_URL),
  };
}

/** Hermes del APK de depuración no trae el constructor URL. */
function parseHttpUrl(url: string): { protocol: string; hostname: string } | null {
  const match = /^([a-z][a-z0-9+.-]*):\/\/([^/?#]*)/i.exec(url.trim());
  if (!match) return null;
  const protocol = `${match[1].toLowerCase()}:`;
  let authority = match[2];
  const at = authority.lastIndexOf('@');
  if (at >= 0) authority = authority.slice(at + 1);
  let hostname = authority;
  if (hostname.startsWith('[')) {
    const end = hostname.indexOf(']');
    if (end < 1) return null;
    hostname = hostname.slice(1, end);
  } else {
    const colon = hostname.indexOf(':');
    if (colon >= 0) hostname = hostname.slice(0, colon);
  }
  if (!hostname) return null;
  return { protocol, hostname: hostname.toLowerCase() };
}

function proxyHostname(url: string): string | null {
  return parseHttpUrl(url)?.hostname ?? null;
}

/** localhost, USB/adb (127.0.0.1) y alias del emulador. No es escaneable desde otro celular. */
export function isLoopbackProxyHostname(host: string): boolean {
  return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '10.0.2.2';
}

/** RFC1918 (192.168/10/172.16-31), sin loopback ni 10.0.2.2. */
export function isPrivateLanProxyHostname(host: string): boolean {
  if (isLoopbackProxyHostname(host)) return false;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  const match = /^172\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/.exec(host);
  if (!match) return false;
  const second = Number(match[1]);
  return second >= 16 && second <= 31;
}

/** Túnel público. Rechaza HTTP y cualquier IP privada o loopback. */
export function isPublicHttpsProxyUrl(url: string): boolean {
  const parsed = parseHttpUrl(url);
  if (!parsed || parsed.protocol !== 'https:') return false;
  return !isLoopbackProxyHostname(parsed.hostname) && !isPrivateLanProxyHostname(parsed.hostname);
}

function scannableLanUrl(lan: string): string {
  const host = lan ? proxyHostname(lan) : null;
  return host && isPrivateLanProxyHostname(host) ? lan : '';
}

/**
 * URL que se codifica en el QR (la abre el celular que escanea).
 * No es la URL con la que el POS llama al proxy (health/create/poll).
 * - wwan: solo HTTPS público (túnel). Nunca 192.168/10/172 ni localhost.
 * - wlan: IP de la Wi-Fi (misma WLAN).
 * - lan / emulator: URL LAN; si no hay IP, loopback o 10.0.2.2 de desarrollo.
 * - offline: vacío (solo efectivo).
 */
export function resolveWebpayQrBaseUrl(
  access: WebpayAccessNetwork,
  extra?: WebpayProxyUrlOverrides,
): string {
  const { pub, lan } = configuredUrls(extra);
  const lanQr = scannableLanUrl(lan);

  if (access === 'wwan') {
    return isPublicHttpsProxyUrl(pub) ? pub : '';
  }
  if (access === 'wlan') {
    return lanQr;
  }
  if (access === 'lan' || access === 'emulator') {
    if (lanQr) return lanQr;
    if (access === 'emulator' && __DEV__) return EMULATOR_URL;
    if (access === 'lan' && __DEV__) return LOOPBACK_URL;
    return '';
  }
  return '';
}

/** Efectivo solo sin WWAN, WLAN ni LAN. Red desconocida no fuerza efectivo. */
export function isCashOnlyPaymentNetwork(access: WebpayAccessNetwork): boolean {
  return access === 'offline';
}

/** Hay interfaz usable para Webpay en celular genérico. */
export function isCardPaymentNetwork(access: WebpayAccessNetwork): boolean {
  return access === 'wwan' || access === 'wlan' || access === 'lan' || access === 'emulator';
}

export function webpayQrJsonPath(
  paymentId: string,
  access: WebpayAccessNetwork,
  extra?: WebpayProxyUrlOverrides,
): string {
  const path = `/payments/webpay/${paymentId}/qr.json`;
  const qrBase = resolveWebpayQrBaseUrl(access, extra);
  if (!qrBase) return path;
  return `${path}?qr_base=${encodeURIComponent(qrBase)}`;
}

/**
 * Candidatos en orden: no vaciar WWAN (es conectividad).
 * En __DEV__ siempre queda LAN y/o USB loopback, como antes de NetInfo.
 */
export function listProxyBaseUrlCandidates(
  access: WebpayAccessNetwork,
  extra?: WebpayProxyUrlOverrides,
): string[] {
  const { pub, lan } = configuredUrls(extra);
  const out: string[] = [];
  const add = (url: string) => {
    if (url && !out.includes(url)) {
      out.push(url);
    }
  };

  if (access === 'emulator') {
    if (__DEV__) {
      add(EMULATOR_URL);
    }
    add(pub);
    return out;
  }

  if (access === 'wwan') {
    // El POS puede intentar LAN/USB en __DEV__ para llegar al proxy.
    // El QR no usa esos candidatos: ver resolveWebpayQrBaseUrl.
    add(pub);
    if (__DEV__) {
      add(lan);
      add(LOOPBACK_URL);
    }
    return out;
  }

  if (access === 'wlan' || access === 'lan') {
    add(lan);
    if (__DEV__) {
      add(LOOPBACK_URL);
    }
    add(pub);
    return out;
  }

  if (access === 'offline') {
    if (__DEV__) {
      add(LOOPBACK_URL);
      add(lan);
    }
    return out;
  }

  add(pub);
  if (__DEV__) {
    add(lan);
    add(LOOPBACK_URL);
  }
  return out;
}

export function resolveProxyBaseUrlForAccessNetwork(
  access: WebpayAccessNetwork,
  extra?: WebpayProxyUrlOverrides,
): string {
  return listProxyBaseUrlCandidates(access, extra)[0] ?? '';
}

/** @deprecated Usar resolveProxyBaseUrlForAccessNetwork + detectWebpayAccessNetwork */
export function proxyBaseUrlForRuntime(isEmulator: boolean): string {
  return resolveProxyBaseUrlForAccessNetwork(isEmulator ? 'emulator' : 'unknown');
}

async function probeProxyHealth(base: string): Promise<boolean> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), PROXY_HEALTH_TIMEOUT_MS);
  try {
    const res = await fetch(`${base}/health`, { signal: ctrl.signal });
    if (!res.ok) {
      return false;
    }
    const body = await res.json();
    return Boolean(body?.ok);
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

let resolvedAccess: WebpayAccessNetwork = 'unknown';
let lastHealthyProxyUrl = '';

export function getLastWebpayAccessNetwork(): WebpayAccessNetwork {
  return resolvedAccess;
}

export async function resolveCurrentWebpayAccess(): Promise<WebpayAccessNetwork> {
  try {
    if (await DeviceInfo.isEmulator()) return 'emulator';
    return await detectWebpayAccessNetwork();
  } catch {
    return 'unknown';
  }
}

export async function getWebpayProxyBaseUrl(): Promise<string> {
  resolvedAccess = await resolveCurrentWebpayAccess();

  const candidates = listProxyBaseUrlCandidates(resolvedAccess);
  lastHealthyProxyUrl = '';
  for (const candidate of candidates) {
    if (await probeProxyHealth(candidate)) {
      lastHealthyProxyUrl = candidate;
      break;
    }
  }
  const url = lastHealthyProxyUrl || candidates[0] || '';

  if (__DEV__) {
    console.log(
      `[WebpayProxy] red=${webpayAccessNetworkLabel(resolvedAccess)} (${resolvedAccess}) → ${url || '(sin URL)'}`,
    );
  }

  return url;
}

export async function isWebpayProxyConfigured(): Promise<boolean> {
  await getWebpayProxyBaseUrl();
  return lastHealthyProxyUrl.length > 0;
}
