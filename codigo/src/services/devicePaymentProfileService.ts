import DeviceInfo from 'react-native-device-info';
import { getDetectedTerminalSerial, isKozenPosDevice } from '../utils/deviceInfo';
import { tuuPaymentService } from './tuuPayment';
import type {
  DevicePaymentProfile,
  DeviceProfileDetectionResult,
  GatewayProviderId,
} from '../types/paymentGateway';

/**
 * HU-01: detecta Kozen/TUU vs celular genérico y deriva pasarelas disponibles.
 */
export async function detectDevicePaymentProfile(): Promise<DeviceProfileDetectionResult> {
  const brand = await DeviceInfo.getBrand();
  const model = await DeviceInfo.getModel();
  const hardwareSerial = await getDetectedTerminalSerial();
  const hasPosSerial = hardwareSerial.length > 0;
  const isKozen = await isKozenPosDevice();
  const tuuAppInstalled = await tuuPaymentService.isTuuAppInstalled();

  const isTuuKozen =
    isKozen ||
    (hasPosSerial && tuuAppInstalled) ||
    (hasPosSerial && matchesKozenModel(model, brand));

  const profile: DevicePaymentProfile = isTuuKozen ? 'TUU_KOZEN' : 'GENERIC_MOBILE';

  let availableGatewayIds: GatewayProviderId[] = [];
  if (profile === 'TUU_KOZEN' && tuuAppInstalled) {
    availableGatewayIds = ['tuu'];
  } else if (profile === 'GENERIC_MOBILE') {
    // COD-04: Webpay (proxy Capstone) tiene prioridad; COD-03 mock queda como fallback __DEV__.
    availableGatewayIds = __DEV__ ? ['webpay', 'mock'] : ['webpay'];
  }

  const result: DeviceProfileDetectionResult = {
    profile,
    availableGatewayIds,
    tuuAppInstalled,
    hardwareSerial,
    brand,
    model,
    detectedAt: new Date().toISOString(),
  };

  if (__DEV__) {
    console.log('[DeviceProfile]', result);
  }

  return result;
}

function matchesKozenModel(model: string, brand: string): boolean {
  const modelLower = model.toLowerCase();
  const brandLower = brand.toLowerCase();
  const kozenTokens = ['kozen', 'nla', 'p8', 'xcheng', 'hnnla'];
  return kozenTokens.some(
    token => modelLower.includes(token) || brandLower.includes(token),
  );
}
