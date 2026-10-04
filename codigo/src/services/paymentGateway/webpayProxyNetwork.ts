import NetInfo, { NetInfoStateType } from '@react-native-community/netinfo';
import type { WebpayAccessNetwork } from './webpayProxyConfig';

/**
 * WWAN (cellular) y WLAN/LAN nunca son "offline": hay interfaz de red.
 * Offline solo cuando el SO reporta type none (sin conectividad).
 * No usar isConnected === false: en Android suele ser false si no hay
 * Internet público, aunque el proxy LAN/USB sí sea alcanzable.
 */
export function mapNetInfoToWebpayAccess(
  type: NetInfoStateType | string | undefined,
  isConnected?: boolean | null,
): WebpayAccessNetwork {
  if (type === NetInfoStateType.none || type === 'none') {
    return 'offline';
  }
  if (type === NetInfoStateType.wifi || type === 'wifi') {
    return 'wlan';
  }
  if (type === NetInfoStateType.ethernet || type === 'ethernet') {
    return 'lan';
  }
  if (type === NetInfoStateType.cellular || type === 'cellular') {
    return 'wwan';
  }
  if (isConnected === false && !type) {
    return 'offline';
  }
  return 'unknown';
}

/** Detecta WLAN (Wi‑Fi), LAN (ethernet) o WWAN (4G/5G) para elegir URL del proxy. */
export async function detectWebpayAccessNetwork(): Promise<WebpayAccessNetwork> {
  try {
    const state = await NetInfo.fetch();
    return mapNetInfoToWebpayAccess(state.type, state.isConnected);
  } catch {
    return 'unknown';
  }
}

export function webpayAccessNetworkLabel(access: WebpayAccessNetwork): string {
  switch (access) {
    case 'emulator':
      return 'Emulador';
    case 'wlan':
      return 'Wi‑Fi (WLAN)';
    case 'lan':
      return 'LAN';
    case 'wwan':
      return 'Datos móviles (4G/5G)';
    case 'offline':
      return 'Sin conexión';
    default:
      return 'Red desconocida';
  }
}
