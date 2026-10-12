import { detectDevicePaymentProfile } from '../src/services/devicePaymentProfileService';
import DeviceInfo from 'react-native-device-info';
import {
  getDetectedTerminalSerial,
  isKozenPosDevice,
} from '../src/utils/deviceInfo';
import { tuuPaymentService } from '../src/services/tuuPayment';

jest.mock('react-native-device-info', () => ({
  getBrand: jest.fn(),
  getModel: jest.fn(),
}));

jest.mock('../src/utils/deviceInfo', () => ({
  getDetectedTerminalSerial: jest.fn(),
  isKozenPosDevice: jest.fn(),
}));

jest.mock('../src/services/tuuPayment', () => ({
  tuuPaymentService: {
    isTuuAppInstalled: jest.fn(),
  },
}));

const mockGetBrand = DeviceInfo.getBrand as jest.Mock;
const mockGetModel = DeviceInfo.getModel as jest.Mock;
const mockGetSerial = getDetectedTerminalSerial as jest.Mock;
const mockIsKozen = isKozenPosDevice as jest.Mock;
const mockTuuInstalled = tuuPaymentService.isTuuAppInstalled as jest.Mock;

describe('detectDevicePaymentProfile', () => {
  it('clasifica Kozen con TUU como TUU_KOZEN', async () => {
    mockGetBrand.mockResolvedValue('HUAWEI');
    mockGetModel.mockResolvedValue('NLA-LX3');
    mockGetSerial.mockResolvedValue('AFMGBB6413102097');
    mockIsKozen.mockResolvedValue(true);
    mockTuuInstalled.mockResolvedValue(true);

    const result = await detectDevicePaymentProfile();

    expect(result.profile).toBe('TUU_KOZEN');
    expect(result.availableGatewayIds).toEqual(['tuu']);
    expect(result.hardwareSerial).toBe('AFMGBB6413102097');
    expect(result.tuuAppInstalled).toBe(true);
  });

  it('clasifica celular genérico sin TUU como GENERIC_MOBILE', async () => {
    mockGetBrand.mockResolvedValue('HONOR');
    mockGetModel.mockResolvedValue('X5c');
    mockGetSerial.mockResolvedValue('');
    mockIsKozen.mockResolvedValue(false);
    mockTuuInstalled.mockResolvedValue(false);

    const result = await detectDevicePaymentProfile();

    expect(result.profile).toBe('GENERIC_MOBILE');
    expect(result.availableGatewayIds).toEqual(['webpay', 'mock']);
    expect(result.tuuAppInstalled).toBe(false);
    expect(result.hardwareSerial).toBe('');
  });

  it('Honor NLA-LX3 con serial POS pero sin TUU → GENERIC_MOBILE (Webpay)', async () => {
    mockGetBrand.mockResolvedValue('HONOR');
    mockGetModel.mockResolvedValue('NLA-LX3');
    mockGetSerial.mockResolvedValue('AFMGBB6413102097');
    mockIsKozen.mockResolvedValue(true);
    mockTuuInstalled.mockResolvedValue(false);

    const result = await detectDevicePaymentProfile();

    expect(result.profile).toBe('GENERIC_MOBILE');
    expect(result.availableGatewayIds).toEqual(['webpay', 'mock']);
    expect(result.tuuAppInstalled).toBe(false);
  });
});
