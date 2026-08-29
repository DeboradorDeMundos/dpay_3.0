// @ts-expect-error - TypeScript no detecta Platform pero existe en react-native
import { Platform, PermissionsAndroid, NativeModules } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import ReactNativeBiometrics from 'react-native-biometrics';
import { MMKV } from 'react-native-mmkv';

const serialStorage = new MMKV({ id: 'device-info-storage' });

/**
 * Verifica si la autenticación biométrica debe estar habilitada para este dispositivo.
 * 
 * MÉTODO MEJORADO: En lugar de adivinar por modelo/fabricante, verificamos directamente
 * si el dispositivo tiene hardware biométrico disponible (sensor de huella, Face ID, etc.)
 * 
 * Esto es más confiable porque:
 * - No depende de listas de modelos que pueden quedar desactualizadas
 * - Verifica el hardware real del dispositivo
 * - Los dispositivos POS típicamente NO tienen sensores biométricos
 * - Los celulares modernos SÍ tienen sensores biométricos
 * 
 * @returns {Promise<boolean>} true si se debe habilitar biometría, false si no
 */
export const shouldEnableBiometrics = async (): Promise<boolean> => {
  // En iOS siempre verificamos el sensor (puede ser Touch ID o Face ID)
  if (Platform.OS === 'ios') {
    try {
      const rnBiometrics = new ReactNativeBiometrics();
      const { available } = await rnBiometrics.isSensorAvailable();
      console.log('[DeviceInfo] iOS - Sensor biométrico disponible:', available);
      return available;
    } catch (error) {
      console.error('[DeviceInfo] Error verificando sensor iOS:', error);
      return false;
    }
  }

  // En Android, verificamos el sensor biométrico real
  try {
    const rnBiometrics = new ReactNativeBiometrics();
    const { available, biometryType } = await rnBiometrics.isSensorAvailable();

    // Obtener información del dispositivo para logs
    const brand = await DeviceInfo.getBrand();
    const model = await DeviceInfo.getModel();
    const manufacturer = await DeviceInfo.getManufacturer();
    const isTablet = DeviceInfo.isTablet();

    console.log('[DeviceInfo] Verificación de biometría:', {
      available,
      biometryType,
      brand,
      model,
      manufacturer,
      isTablet,
    });

    // Si NO hay sensor biométrico disponible, NO habilitar
    // Esto detectará automáticamente dispositivos POS que no tienen sensor de huella
    if (!available) {
      console.log('[DeviceInfo] ❌ Sensor biométrico NO disponible - Biometría DESHABILITADA');
      return false;
    }

    // Si hay sensor disponible, habilitar biometría
    console.log('[DeviceInfo] ✅ Sensor biométrico disponible - Biometría HABILITADA');
    return true;

  } catch (error) {
    console.error('[DeviceInfo] Error verificando sensor biométrico:', error);
    
    // En caso de error, por seguridad NO habilitamos biometría
    // Esto evita problemas en dispositivos POS
    console.log('[DeviceInfo] ⚠️ Error en verificación - Biometría DESHABILITADA por seguridad');
    return false;
  }
};

/**
 * Detecta si el dispositivo actual es un dispositivo POS basándose en características
 * Esta función es útil para otros propósitos además de biometría
 * 
 * @returns {Promise<boolean>} true si es un dispositivo POS, false si es un celular/smartphone
 */
export const isPOSDevice = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    return false;
  }

  try {
    const brand = await DeviceInfo.getBrand();
    const model = await DeviceInfo.getModel();
    const manufacturer = await DeviceInfo.getManufacturer();

    const brandLower = brand.toLowerCase();
    const modelLower = model.toLowerCase();
    const manufacturerLower = manufacturer.toLowerCase();

    // Lista de fabricantes conocidos de dispositivos POS
    const posManufacturers = [
      'sunmi',
      'hulmet',
      'pax',
      'verifone',
      'ingenico',
      'newland',
      'urovo',
      'chainway',
      'zebra',
      'honeywell',
    ];

    // Lista de modelos conocidos de dispositivos POS
    const posModels = [
      'pro2', // Hulmet Pro2
      't2',   // Sunmi T2
      'p2',   // Sunmi P2
      'v2',   // Sunmi V2
      'a920', // PAX A920
      's900', // PAX S900
    ];

    const isPOSManufacturer = posManufacturers.some(
      pos => brandLower.includes(pos) || manufacturerLower.includes(pos)
    );

    const isPOSModel = posModels.some(pos => modelLower.includes(pos));

    const isPOS = isPOSModel || isPOSManufacturer;

    console.log('[DeviceInfo] Detección POS por características:', {
      brand,
      model,
      manufacturer,
      isPOSManufacturer,
      isPOSModel,
      isPOS,
    });

    return isPOS;
  } catch (error) {
    console.error('[DeviceInfo] Error detectando tipo de dispositivo:', error);
    return false;
  }
};

let cachedSerial: string | null = null;
let cachedFingerprint: string | null = null;

export const isLikelyDeviceFingerprint = (value: string | null | undefined): boolean => {
  if (!value) return false;
  const s = value.trim();
  return /^[0-9a-f]{16}$/i.test(s);
};

const isValidHardwareSerial = (value: string | null | undefined): boolean => {
  if (!value) return false;
  const s = value.trim();
  if (!s || s.toLowerCase() === 'unknown') return false;
  if (isLikelyDeviceFingerprint(s)) return false;
  if (s === 'DPAY-UNKNOWN') return false;
  return true;
};

/** Android 10+: READ_PHONE_STATE en runtime para getSerialNumber() */
export async function ensurePhoneStatePermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }
  try {
    const apiLevel = typeof Platform.Version === 'number' ? Platform.Version : parseInt(String(Platform.Version), 10);
    if (Number.isFinite(apiLevel) && apiLevel < 23) {
      return true;
    }
    const already = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE);
    if (already) {
      return true;
    }
    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE, {
      title: 'Serial del terminal POS',
      message: 'D-PAY necesita leer el número de serie del hardware para enrolarse correctamente con DTemite.',
      buttonPositive: 'Permitir',
      buttonNegative: 'Cancelar',
    });
    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch (error) {
    console.warn('[DeviceInfo] No se pudo solicitar READ_PHONE_STATE:', error);
    return false;
  }
}

export async function getTerminalSerial(): Promise<string> {
  if (cachedSerial && isValidHardwareSerial(cachedSerial)) {
    return cachedSerial;
  }

  if (Platform.OS === 'android') {
    await ensurePhoneStatePermission();

    const nativeSerial = await getNativePosSerial();
    if (isValidHardwareSerial(nativeSerial)) {
      cachedSerial = nativeSerial;
      console.log('[DeviceInfo] Serial POS (nativo):', cachedSerial);
      return cachedSerial;
    }
  }

  const candidates: string[] = [];

  try {
    const serial = await DeviceInfo.getSerialNumber();
    if (isValidHardwareSerial(serial)) candidates.push(serial.trim());
  } catch {
    // continue
  }

  try {
    const syncSerial = DeviceInfo.getSerialNumberSync?.();
    if (isValidHardwareSerial(syncSerial)) candidates.push(String(syncSerial).trim());
  } catch {
    // continue
  }

  if (candidates.length > 0) {
    cachedSerial = candidates[0];
    console.log('[DeviceInfo] Serial POS (hardware):', cachedSerial);
    return cachedSerial;
  }

  const manual = getManualTerminalSerial();
  if (isValidHardwareSerial(manual)) {
    cachedSerial = manual;
    console.log('[DeviceInfo] Serial POS (manual):', cachedSerial);
    return cachedSerial;
  }

  console.log('[DeviceInfo] Serial hardware no disponible; verifique permisos o reinicie D-PAY');
  return '';
}

/** Serial detectado (nativo/SDK), sin usar el guardado manual en MMKV */
export async function getDetectedTerminalSerial(): Promise<string> {
  if (Platform.OS === 'android') {
    await ensurePhoneStatePermission();
    const nativeSerial = await getNativePosSerial();
    if (isValidHardwareSerial(nativeSerial)) {
      return nativeSerial;
    }
  }

  const candidates: string[] = [];
  try {
    const serial = await DeviceInfo.getSerialNumber();
    if (isValidHardwareSerial(serial)) candidates.push(serial.trim());
  } catch {
    // continue
  }
  try {
    const syncSerial = DeviceInfo.getSerialNumberSync?.();
    if (isValidHardwareSerial(syncSerial)) candidates.push(String(syncSerial).trim());
  } catch {
    // continue
  }

  return candidates[0] ?? '';
}

export function getManualTerminalSerial(): string {
  return (serialStorage.getString('manualHardwareSerial') ?? '').trim();
}

export function setManualTerminalSerial(serial: string) {
  const value = serial.trim();
  if (!isValidHardwareSerial(value)) {
    return;
  }
  serialStorage.set('manualHardwareSerial', value);
  cachedSerial = value;
}

export function clearManualTerminalSerial() {
  const manual = getManualTerminalSerial();
  serialStorage.delete('manualHardwareSerial');
  if (cachedSerial && cachedSerial === manual) {
    cachedSerial = null;
  }
}

async function getNativePosSerial(): Promise<string> {
  try {
    const mod = NativeModules.PosDeviceInfo as {
      getHardwareSerial?: () => Promise<{ serial?: string; source?: string }>;
    } | undefined;
    if (!mod?.getHardwareSerial) {
      console.warn('[DeviceInfo] PosDeviceInfo native module no disponible');
      return '';
    }
    const result = await mod.getHardwareSerial();
    const serial = (result?.serial || '').trim();
    console.log('[DeviceInfo] PosDeviceInfo:', { serial: serial || '(vacío)', source: result?.source || '' });
    return serial;
  } catch (error) {
    console.warn('[DeviceInfo] PosDeviceInfo.getHardwareSerial failed:', error);
    return '';
  }
}

/** Usar serial devuelto por el servidor (enrolamiento manual) sobre lectura local */
export function setCachedTerminalSerial(serial: string) {
  if (isValidHardwareSerial(serial)) {
    cachedSerial = serial;
  }
}

export function clearCachedTerminalSerial() {
  cachedSerial = null;
  cachedFingerprint = null;
}

/** ID que reporta el dispositivo (Android ID / uniqueId) — usado en heartbeat/poll hacia el Hub */
export async function getDeviceFingerprint(): Promise<string> {
  if (cachedFingerprint) {
    return cachedFingerprint;
  }
  try {
    const uniqueId = await DeviceInfo.getUniqueId();
    cachedFingerprint = uniqueId || 'DPAY-UNKNOWN';
    return cachedFingerprint;
  } catch {
    cachedFingerprint = 'DPAY-UNKNOWN';
    return cachedFingerprint;
  }
}
