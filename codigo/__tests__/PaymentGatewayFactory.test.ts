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

  it('retorna mock en celular genérico con mock disponible (dev)', async () => {
    const gateway = await PaymentGatewayFactory.getDefaultCardGateway('GENERIC_MOBILE', [
      'mock',
      'webpay',
    ]);
    expect(gateway?.id).toBe('mock');
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
