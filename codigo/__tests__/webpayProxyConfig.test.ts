jest.mock('react-native-device-info', () => ({
  isEmulator: jest.fn(async () => false),
}));

import { proxyBaseUrlForRuntime } from '../src/services/paymentGateway/webpayProxyConfig';

describe('proxyBaseUrlForRuntime', () => {
  it('en desarrollo el emulador habla con el PC por 10.0.2.2', () => {
    expect(proxyBaseUrlForRuntime(true)).toBe('http://10.0.2.2:8787');
  });

  it('en desarrollo el celular físico usa el loopback del cable', () => {
    expect(proxyBaseUrlForRuntime(false)).toBe('http://127.0.0.1:8787');
  });
});
