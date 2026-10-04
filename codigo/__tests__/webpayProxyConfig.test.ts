jest.mock('react-native-device-info', () => ({
  isEmulator: jest.fn(async () => false),
}));

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { fetch: jest.fn(async () => ({ type: 'wifi', isConnected: true })) },
  NetInfoStateType: {
    none: 'none',
    wifi: 'wifi',
    ethernet: 'ethernet',
    cellular: 'cellular',
    unknown: 'unknown',
  },
}));

import {
  listProxyBaseUrlCandidates,
  resolveProxyBaseUrlForAccessNetwork,
} from '../src/services/paymentGateway/webpayProxyConfig';
import { mapNetInfoToWebpayAccess } from '../src/services/paymentGateway/webpayProxyNetwork';

describe('mapNetInfoToWebpayAccess', () => {
  it('mapea wifi → wlan, ethernet → lan y cellular → wwan', () => {
    expect(mapNetInfoToWebpayAccess('wifi', true)).toBe('wlan');
    expect(mapNetInfoToWebpayAccess('ethernet', true)).toBe('lan');
    expect(mapNetInfoToWebpayAccess('cellular', true)).toBe('wwan');
  });

  it('WWAN sigue siendo wwan aunque isConnected sea false', () => {
    expect(mapNetInfoToWebpayAccess('cellular', false)).toBe('wwan');
  });

  it('Wi‑Fi local sin Internet público no es offline', () => {
    expect(mapNetInfoToWebpayAccess('wifi', false)).toBe('wlan');
  });

  it('offline solo cuando el SO reporta type none', () => {
    expect(mapNetInfoToWebpayAccess('none', false)).toBe('offline');
  });
});

describe('resolveProxyBaseUrlForAccessNetwork', () => {
  const urls = {
    publicUrl: '',
    lanUrl: 'http://192.168.1.4:8787',
  };

  it('emulador usa 10.0.2.2 en __DEV__', () => {
    expect(resolveProxyBaseUrlForAccessNetwork('emulator', urls)).toBe(
      'http://10.0.2.2:8787',
    );
  });

  it('wwan sin túnel cae a LAN en __DEV__ (no se apaga el cobro)', () => {
    expect(resolveProxyBaseUrlForAccessNetwork('wwan', urls)).toBe(
      'http://192.168.1.4:8787',
    );
  });

  it('wwan con túnel usa HTTPS público', () => {
    expect(
      resolveProxyBaseUrlForAccessNetwork('wwan', {
        publicUrl: 'https://tunnel.example',
        lanUrl: 'http://192.168.1.4:8787',
      }),
    ).toBe('https://tunnel.example');
  });

  it('wlan usa URL LAN', () => {
    expect(resolveProxyBaseUrlForAccessNetwork('wlan', urls)).toBe(
      'http://192.168.1.4:8787',
    );
  });

  it('offline en __DEV__ sigue ofreciendo USB loopback', () => {
    expect(listProxyBaseUrlCandidates('offline', urls)[0]).toBe(
      'http://127.0.0.1:8787',
    );
  });
});
