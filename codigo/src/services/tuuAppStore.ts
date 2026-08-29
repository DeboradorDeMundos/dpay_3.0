import { Linking, NativeModules, Platform } from 'react-native';

const DEFAULT_PACKAGE = 'com.dtemitepos';

/**
 * URI de detalle en App Store Xcheng/TUU (P8 Neo).
 * P8 Neo / com.xcheng.store: query {@code linkAppPackage} en MainActivity.
 */
export const TUU_STORE_DETAILS_URI = `tms://xcheng.appstore.app/details?linkAppPackage=${DEFAULT_PACKAGE}`;

type OpenStoreResult = {
  method: string;
  uri?: string;
};

/**
 * Abre la tienda TUU del POS en el detalle de D-PAY.
 * Si `overrideUrl` viene del panel (download_url), se usa primero.
 */
function shouldOpenCustomUrl(url: string): boolean {
  const lower = url.toLowerCase();
  if (lower.startsWith('market://') || lower.startsWith('intent://')) {
    return false;
  }
  return (
    lower.startsWith('tms://') ||
    lower.startsWith('http://') ||
    lower.startsWith('https://') ||
    lower.endsWith('.apk')
  );
}

export async function openTuuAppStore(overrideUrl?: string): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }

  const native = NativeModules.PosDeviceInfo;
  if (native?.openTuuAppStore) {
    try {
      const result: OpenStoreResult = await native.openTuuAppStore(DEFAULT_PACKAGE);
      console.log('[AppUpdate] Tienda TUU abierta:', result);
      return true;
    } catch (error) {
      console.warn('[AppUpdate] Native openTuuAppStore falló, intentando Linking:', error);
    }
  }

  const custom = (overrideUrl || '').trim();
  if (custom && shouldOpenCustomUrl(custom)) {
    try {
      await Linking.openURL(custom);
      return true;
    } catch (error) {
      console.warn('[AppUpdate] No se pudo abrir download_url custom:', error);
    }
  }

  try {
    await Linking.openURL(TUU_STORE_DETAILS_URI);
    return true;
  } catch (error) {
    console.warn('[AppUpdate] Linking tms:// falló:', error);
  }

  return false;
}
