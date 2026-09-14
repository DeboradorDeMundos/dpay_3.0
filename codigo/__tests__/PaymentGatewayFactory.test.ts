import { PaymentGatewayFactory } from '../src/services/paymentGateway/PaymentGatewayFactory';

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

  it('retorna null en celular genérico sin pasarelas', async () => {
    const gateway = await PaymentGatewayFactory.getDefaultCardGateway('GENERIC_MOBILE', []);
    expect(gateway).toBeNull();
  });

  it('expone registry por id', () => {
    expect(PaymentGatewayFactory.getGateway('tuu')?.displayName).toBe('TUU / Kozen');
    expect(PaymentGatewayFactory.getGateway('webpay')).not.toBeNull();
  });
});
