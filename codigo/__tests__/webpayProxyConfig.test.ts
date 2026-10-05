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
  isCardPaymentNetwork,
  isCashOnlyPaymentNetwork,
  listProxyBaseUrlCandidates,
  resolveProxyBaseUrlForAccessNetwork,
  resolveWebpayQrBaseUrl,
  webpayQrJsonPath,
} from '../src/services/paymentGateway/webpayProxyConfig';
import { mapNetInfoToWebpayAccess } from '../src/services/paymentGateway/webpayProxyNetwork';

declare const global: { URL?: typeof URL };

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

describe('resolveWebpayQrBaseUrl', () => {
  const lan = 'http://192.168.1.4:8787';
  const tunnel = 'https://tunnel.example';

  it('wwan codifica solo el túnel HTTPS', () => {
    const qr = resolveWebpayQrBaseUrl('wwan', { publicUrl: tunnel, lanUrl: lan });
    expect(qr).toBe(tunnel);
    expect(qr).not.toMatch(/192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.|localhost|127\.0\.0\.1/);
  });

  it('wwan sin túnel HTTPS no cae a IP privada ni localhost', () => {
    expect(resolveWebpayQrBaseUrl('wwan', { publicUrl: '', lanUrl: lan })).toBe('');
    expect(
      resolveWebpayQrBaseUrl('wwan', {
        publicUrl: 'http://tunnel.example',
        lanUrl: lan,
      }),
    ).toBe('');
    expect(
      resolveWebpayQrBaseUrl('wwan', {
        publicUrl: 'https://192.168.1.4:8787',
        lanUrl: lan,
      }),
    ).toBe('');
    expect(
      resolveWebpayQrBaseUrl('wwan', {
        publicUrl: 'https://10.0.0.5:8787',
        lanUrl: lan,
      }),
    ).toBe('');
    expect(
      resolveWebpayQrBaseUrl('wwan', {
        publicUrl: 'https://172.16.0.4:8787',
        lanUrl: lan,
      }),
    ).toBe('');
  });

  it('wlan arma el QR aunque el motor no tenga el constructor URL', () => {
    const previous = global.URL;
    delete global.URL;
    try {
      expect(resolveWebpayQrBaseUrl('wlan', { publicUrl: '', lanUrl: lan })).toBe(lan);
    } finally {
      global.URL = previous;
    }
  });

  it('wlan usa la IP de la Wi-Fi, no el túnel', () => {
    expect(
      resolveWebpayQrBaseUrl('wlan', { publicUrl: tunnel, lanUrl: lan }),
    ).toBe(lan);
  });

  it('lan y emulador usan la URL LAN correspondiente', () => {
    expect(resolveWebpayQrBaseUrl('lan', { publicUrl: tunnel, lanUrl: lan })).toBe(lan);
    expect(
      resolveWebpayQrBaseUrl('emulator', { publicUrl: tunnel, lanUrl: lan }),
    ).toBe(lan);
  });

  it('lan sin IP configurada usa loopback de desarrollo', () => {
    expect(resolveWebpayQrBaseUrl('lan', { publicUrl: tunnel, lanUrl: '' })).toBe(
      'http://127.0.0.1:8787',
    );
  });

  it('emulador sin IP LAN usa 10.0.2.2', () => {
    expect(resolveWebpayQrBaseUrl('emulator', { publicUrl: '', lanUrl: '' })).toBe(
      'http://10.0.2.2:8787',
    );
  });

  it('offline no arma QR', () => {
    expect(resolveWebpayQrBaseUrl('offline', { publicUrl: tunnel, lanUrl: lan })).toBe('');
  });

  it('el path del QR lleva la base de esa red', () => {
    expect(webpayQrJsonPath('pay-1', 'wwan', { publicUrl: tunnel, lanUrl: lan })).toBe(
      `/payments/webpay/pay-1/qr.json?qr_base=${encodeURIComponent(tunnel)}`,
    );
    expect(webpayQrJsonPath('pay-1', 'wlan', { publicUrl: tunnel, lanUrl: lan })).toContain(
      encodeURIComponent(lan),
    );
  });
});

describe('efectivo solo sin red', () => {
  it('wwan, wlan y lan mantienen la pasarela de tarjeta', () => {
    expect(isCashOnlyPaymentNetwork('wwan')).toBe(false);
    expect(isCashOnlyPaymentNetwork('wlan')).toBe(false);
    expect(isCashOnlyPaymentNetwork('lan')).toBe(false);
    expect(isCardPaymentNetwork('wwan')).toBe(true);
    expect(isCardPaymentNetwork('wlan')).toBe(true);
    expect(isCardPaymentNetwork('lan')).toBe(true);
  });

  it('offline es el único caso de solo efectivo', () => {
    expect(isCashOnlyPaymentNetwork('offline')).toBe(true);
    expect(isCardPaymentNetwork('offline')).toBe(false);
    expect(isCashOnlyPaymentNetwork('unknown')).toBe(false);
  });
});
