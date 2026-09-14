import { webpayPaymentGateway } from '../src/services/paymentGateway/WebpayPaymentGateway';

jest.mock('../src/services/paymentGateway/webpayProxyConfig', () => ({
  WEBPAY_PROXY_BASE_URL: 'http://proxy.test',
  WEBPAY_RETURN_DEEP_LINK: 'dtemitepos://payments/webpay/return',
  isWebpayProxyConfigured: () => true,
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
  });
});
