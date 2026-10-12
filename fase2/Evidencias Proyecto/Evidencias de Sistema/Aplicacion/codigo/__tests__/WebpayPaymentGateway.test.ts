import { Linking } from 'react-native';
import { webpayPaymentGateway } from '../src/services/paymentGateway/WebpayPaymentGateway';

declare const global: { fetch: typeof fetch };

jest.mock('react-native/Libraries/Linking/Linking', () => ({
  canOpenURL: jest.fn(),
  openURL: jest.fn(),
}));

jest.mock('../src/services/paymentGateway/webpayProxyConfig', () => ({
  WEBPAY_PROXY_PUBLIC_URL: '',
  WEBPAY_PROXY_API_TOKEN: '',
  WEBPAY_RETURN_DEEP_LINK: 'dtemitepos://payments/webpay/return',
  getWebpayProxyBaseUrl: async () => 'http://proxy.test',
  isWebpayProxyConfigured: async () => true,
  resolveCurrentWebpayAccess: async () => 'unknown',
  resolveWebpayQrBaseUrl: () => '',
  webpayQrJsonPath: (paymentId: string) => `/payments/webpay/${paymentId}/qr.json`,
  isCashOnlyPaymentNetwork: (access: string) => access === 'offline',
  isCardPaymentNetwork: (access: string) =>
    access === 'wwan' || access === 'wlan' || access === 'lan' || access === 'emulator',
}));

describe('WebpayPaymentGateway', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('isAvailable es true cuando /health responde ok', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    }) as unknown as typeof fetch;

    await expect(webpayPaymentGateway.isAvailable()).resolves.toBe(true);
  });

  it('startCardPayment con simulate approved retorna éxito', async () => {
    const paymentId = 'pay-123';
    global.fetch = jest.fn().mockImplementation(async (url: string) => {
      if (String(url).endsWith('/payments/webpay/create')) {
        return {
          ok: true,
          status: 201,
          text: async () =>
            JSON.stringify({
              payment_id: paymentId,
              status: 'approved',
              amount: 1000,
              auth_code: 'WP123',
              last4: '4242',
              token: 'tok',
              buy_order: 'DPpay123',
              provider: 'webpay',
            }),
        };
      }
      throw new Error(`unexpected url ${url}`);
    }) as unknown as typeof fetch;

    const result = await webpayPaymentGateway.startCardPayment({
      amount: 1000,
      method: 'credit',
      dteType: 39,
      netAmount: 840,
      exemptAmount: 0,
    });

    expect(result.success).toBe(true);
    expect(result.sequenceNumber).toBe(paymentId);
    expect(result.authCode).toBe('WP123');
    expect(result.provider).toBe('webpay');
    expect(result.gatewayToken).toBe('tok');
    expect(result.buyOrder).toBe('DPpay123');
    expect(result.gatewayStatus).toBe('approved');
  });

  it('startCardPayment pending webpayplus usa presentWebpayQrCheckout en lugar del browser', async () => {
    const paymentId = 'pay-qr-1';
    const present = jest.fn();
    (Linking.openURL as jest.Mock).mockResolvedValue(undefined);

    global.fetch = jest.fn().mockImplementation(async (url: string) => {
      const u = String(url);
      if (u.endsWith('/payments/webpay/create')) {
        return {
          ok: true,
          status: 201,
          text: async () =>
            JSON.stringify({
              payment_id: paymentId,
              status: 'pending',
              amount: 2000,
              provider: 'webpayplus',
              qr_page_url: 'http://proxy.test/payments/webpay/pay-qr-1/qr',
              redirect_url: 'http://proxy.test/payments/webpay/pay-qr-1/go',
              token: 'tok-ws',
              buy_order: 'DPpayqr1',
            }),
        };
      }
      if (u.endsWith('/qr.json')) {
        return {
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({
              payment_id: paymentId,
              provider: 'webpayplus',
              amount: 2000,
              qr_data_url: 'data:image/png;base64,abc',
              checkout_url: 'http://proxy.test/go',
              qr_page_url: 'http://proxy.test/qr',
              test_cards: [],
              instructions: 'test',
            }),
        };
      }
      if (u.endsWith('/status')) {
        return {
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({
              payment_id: paymentId,
              status: 'approved',
              amount: 2000,
              auth_code: 'AUTH1',
              last4: '6623',
              token: 'tok-ws',
              buy_order: 'DPpayqr1',
              provider: 'webpayplus',
            }),
        };
      }
      throw new Error(`unexpected url ${url}`);
    }) as unknown as typeof fetch;

    const result = await webpayPaymentGateway.startCardPayment({
      amount: 2000,
      method: 'credit',
      dteType: 39,
      netAmount: 1680,
      exemptAmount: 0,
      presentWebpayQrCheckout: present,
    });

    expect(present).toHaveBeenCalledWith(
      expect.objectContaining({ qr_data_url: 'data:image/png;base64,abc' }),
    );
    expect(Linking.openURL).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.last4).toBe('6623');
  });

  it('abort cancel marca cancelled vía proxy', async () => {
    const paymentId = 'pay-abort-1';
    const controller = new AbortController();

    global.fetch = jest.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      const u = String(url);
      if (u.endsWith('/payments/webpay/create')) {
        controller.abort();
        return {
          ok: true,
          status: 201,
          text: async () =>
            JSON.stringify({
              payment_id: paymentId,
              status: 'pending',
              amount: 500,
              provider: 'sim',
            }),
        };
      }
      if (u.endsWith('/cancel') && init?.method === 'POST') {
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ payment_id: paymentId, status: 'cancelled' }),
        };
      }
      if (u.endsWith('/status')) {
        return {
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({ payment_id: paymentId, status: 'pending', amount: 500 }),
        };
      }
      throw new Error(`unexpected url ${url}`);
    }) as unknown as typeof fetch;

    await expect(
      webpayPaymentGateway.startCardPayment({
        amount: 500,
        method: 'credit',
        dteType: 39,
        netAmount: 420,
        exemptAmount: 0,
        signal: controller.signal,
      }),
    ).rejects.toThrow('WEBPAY_CANCELLED');
  });
});
