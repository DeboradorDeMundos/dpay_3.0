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

export async function getWebpayProxyBaseUrl(): Promise<string> {
  try {
    if (await DeviceInfo.isEmulator()) {
      resolvedAccess = 'emulator';
    } else {
      resolvedAccess = await detectWebpayAccessNetwork();
    }
  } catch {
    resolvedAccess = 'unknown';
  }

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
