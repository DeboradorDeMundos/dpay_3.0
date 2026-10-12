import { PaymentGatewayFactory } from '../src/services/paymentGateway/PaymentGatewayFactory';
import { resolveCurrentWebpayAccess } from '../src/services/paymentGateway/webpayProxyConfig';

jest.mock('../src/services/paymentGateway/webpayProxyConfig', () => ({
  WEBPAY_PROXY_PUBLIC_URL: '',
  WEBPAY_RETURN_DEEP_LINK: 'dtemitepos://payments/webpay/return',
  getWebpayProxyBaseUrl: async () => 'http://127.0.0.1:8787',
  isWebpayProxyConfigured: async () => true,
  resolveCurrentWebpayAccess: jest.fn(async () => 'wlan'),
  isCashOnlyPaymentNetwork: (access: string) => access === 'offline',
  isCardPaymentNetwork: (access: string) =>
    access === 'wwan' || access === 'wlan' || access === 'lan' || access === 'emulator',
}));

jest.mock('../src/services/tuuPayment', () => ({
  tuuPaymentService: {
    isTuuAppInstalled: jest.fn().mockResolvedValue(true),
    startPayment: jest.fn(),
    setDevMode: jest.fn(),
  },
}));

describe('PaymentGatewayFactory', () => {
  it('retorna gateway TUU cuando perfil es TUU_KOZEN y TUU está instalado', async () => {
    const gateway = await PaymentGatewayFactory.getDefaultCardGateway('TUU_KOZEN', ['tuu']);
    expect(gateway?.id).toBe('tuu');
  });

  it('prioriza webpay sobre mock en celular genérico cuando ambos están permitidos', async () => {
    const webpay = PaymentGatewayFactory.getGateway('webpay');
    const mock = PaymentGatewayFactory.getGateway('mock');
    const webpaySpy = jest.spyOn(webpay!, 'isAvailable').mockResolvedValue(true);
    const mockSpy = jest.spyOn(mock!, 'isAvailable').mockResolvedValue(true);

    const gateway = await PaymentGatewayFactory.getDefaultCardGateway('GENERIC_MOBILE', [
      'mock',
      'webpay',
    ]);
    expect(gateway?.id).toBe('webpay');

    webpaySpy.mockRestore();
    mockSpy.mockRestore();
  });

  it('usa mock si webpay no está disponible', async () => {
    const webpay = PaymentGatewayFactory.getGateway('webpay');
    const mock = PaymentGatewayFactory.getGateway('mock');
    const webpaySpy = jest.spyOn(webpay!, 'isAvailable').mockResolvedValue(false);
    const mockSpy = jest.spyOn(mock!, 'isAvailable').mockResolvedValue(true);

    const gateway = await PaymentGatewayFactory.getDefaultCardGateway('GENERIC_MOBILE', [
      'mock',
      'webpay',
    ]);
    expect(gateway?.id).toBe('mock');

    webpaySpy.mockRestore();
    mockSpy.mockRestore();
  });

  it('celular genérico offline queda sin pasarela de tarjeta', async () => {
    (resolveCurrentWebpayAccess as jest.Mock).mockResolvedValueOnce('offline');
    const gateway = await PaymentGatewayFactory.getDefaultCardGateway('GENERIC_MOBILE', [
      'webpay',
      'mock',
    ]);
    expect(gateway).toBeNull();
  });

  it('Kozen sigue pudiendo usar TUU aunque la red del celular esté offline', async () => {
    (resolveCurrentWebpayAccess as jest.Mock).mockResolvedValue('offline');
    const gateway = await PaymentGatewayFactory.getDefaultCardGateway('TUU_KOZEN', ['tuu']);
    expect(gateway?.id).toBe('tuu');
    (resolveCurrentWebpayAccess as jest.Mock).mockResolvedValue('wlan');
  });

  it('retorna null en celular genérico sin pasarelas', async () => {
    const gateway = await PaymentGatewayFactory.getDefaultCardGateway('GENERIC_MOBILE', []);
    expect(gateway).toBeNull();
  });

  it('conserva la pasarela elegida si sigue disponible', () => {
    expect(
      PaymentGatewayFactory.keepUserSelection(['webpay', 'mock'], 'mock', 'webpay'),
    ).toBe('mock');
  });

  it('vuelve a la preselección si la elegida ya no está', () => {
    expect(
      PaymentGatewayFactory.keepUserSelection(['webpay'], 'mock', 'webpay'),
    ).toBe('webpay');
  });

  it('expone registry por id', () => {
    expect(PaymentGatewayFactory.getGateway('tuu')?.displayName).toBe('TUU / Kozen');
    expect(PaymentGatewayFactory.getGateway('webpay')).not.toBeNull();
  });
});
