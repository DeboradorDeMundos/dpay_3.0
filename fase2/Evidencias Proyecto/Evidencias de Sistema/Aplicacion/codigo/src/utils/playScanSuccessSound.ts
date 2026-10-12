import { NativeModules, Platform, Vibration } from 'react-native';
import { useAlertStore } from '../stores/alertStore';

type ScanBeepNative = {
  preload: () => Promise<string | boolean>;
  play: () => Promise<boolean>;
  test: () => Promise<boolean>;
};

const ScanBeep = NativeModules.ScanBeep as ScanBeepNative | undefined;

let preloadStarted = false;
let moduleChecked = false;

function logScanSoundState(): void {
  if (moduleChecked || Platform.OS !== 'android') {
    return;
  }
  moduleChecked = true;
  if (ScanBeep?.play) {
    console.log('[ScanSound] Módulo nativo ScanBeep OK');
  } else {
    console.warn(
      '[ScanSound] ScanBeep NO disponible — hace falta rebuild nativo: npm run android:dev',
    );
  }
}

function vibrateScanSuccess(): void {
  try {
    Vibration.vibrate([0, 60]);
  } catch {
    // noop
  }
}

function preloadNativeScanSound(): void {
  logScanSoundState();
  if (preloadStarted || Platform.OS !== 'android' || !ScanBeep?.preload) {
    return;
  }
  preloadStarted = true;
  ScanBeep.preload()
    .then((mode) => console.log('[ScanSound] Precarga:', mode))
    .catch((error) => {
      console.warn('[ScanSound] Precarga falló:', error);
      preloadStarted = false;
    });
}

/** Precarga el beep para que suene al instante al escanear. */
export function preloadScanSuccessSound(): void {
  preloadNativeScanSound();
}

/** Beep corto cuando un producto se agrega al carrito por scan. */
export async function playScanSuccessSound(): Promise<void> {
  vibrateScanSuccess();
  logScanSoundState();

  if (Platform.OS !== 'android') {
    return;
  }

  if (!ScanBeep?.play) {
    console.warn('[ScanSound] Sin módulo nativo — rebuild requerido');
    return;
  }

  try {
    await ScanBeep.play();
    console.log('[ScanSound] play() OK');
  } catch (error) {
    console.warn('[ScanSound] play() falló:', error);
  }
}

/** Solo para prueba manual (p. ej. desde ajustes). */
export async function testScanSuccessSound(): Promise<boolean> {
  logScanSoundState();

  if (Platform.OS !== 'android') {
    return false;
  }

  if (!ScanBeep?.test) {
    useAlertStore.getState().showAlert(
      'Sonido no disponible',
      'Falta instalar la versión nueva de la app (npm run android:dev). El módulo ScanBeep no está en este APK.',
    );
    return false;
  }

  vibrateScanSuccess();
  try {
    await ScanBeep.test();
    console.log('[ScanSound] test() OK');
    return true;
  } catch (error) {
    console.warn('[ScanSound] test() falló:', error);
    useAlertStore.getState().showAlert('Error de sonido', String(error));
    return false;
  }
}
