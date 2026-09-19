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

  // Celular consumidor (Honor NLA-LX3, etc.) → siempre Webpay/mock; nunca TUU nativo.
  if (isConsumerMobileBrand(brand)) {
    const result: DeviceProfileDetectionResult = {
      profile: 'GENERIC_MOBILE',
      availableGatewayIds: __DEV__ ? ['webpay', 'mock'] : ['webpay'],
      tuuAppInstalled,
      hardwareSerial,
      brand,
      model,
      detectedAt: new Date().toISOString(),
    };
    if (__DEV__) {
      console.log('[DeviceProfile] consumer mobile → Capstone gateways', result);
    }
    return result;
  }

  let isTuuKozen =
    isKozen ||
    (hasPosSerial && tuuAppInstalled) ||
    (hasPosSerial && matchesKozenModel(model, brand));

  let profile: DevicePaymentProfile = isTuuKozen ? 'TUU_KOZEN' : 'GENERIC_MOBILE';

  if (profile === 'TUU_KOZEN' && !tuuAppInstalled) {
    profile = 'GENERIC_MOBILE';
  }

  let availableGatewayIds: GatewayProviderId[] = [];
  if (profile === 'TUU_KOZEN' && tuuAppInstalled) {
    availableGatewayIds = ['tuu'];
  } else if (profile === 'GENERIC_MOBILE') {
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

/** Marcas de celular consumidor — no confundir con terminal Kozen por modelo NLA/P8. */
function isConsumerMobileBrand(brand: string): boolean {
  const brandLower = brand.toLowerCase();
  const consumerTokens = [
    'honor',
    'samsung',
    'xiaomi',
    'redmi',
    'oppo',
    'vivo',
    'realme',
    'motorola',
    'google',
    'oneplus',
  ];
  return consumerTokens.some(token => brandLower.includes(token));
}
