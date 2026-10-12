import fs from 'node:fs';
import path from 'node:path';

declare const __dirname: string;
import { NativeModules } from 'react-native';
import { mapTuuMethodToMedioPago } from '../src/services/api';
import { classifyTuuError } from '../src/services/tuuPayment';
import { tuuPaymentGateway } from '../src/services/paymentGateway/TuuPaymentGateway';
import { PaymentGatewayFactory } from '../src/services/paymentGateway/PaymentGatewayFactory';

jest.mock('react-native', () => ({
  NativeModules: { TuuPaymentModule: {} },
  Linking: { canOpenURL: jest.fn(), openURL: jest.fn() },
}));

jest.mock('../src/services/tuuPayment', () => {
  const actual = jest.requireActual('../src/services/tuuPayment');
  return {
    ...actual,
    tuuPaymentService: {
      isTuuAppInstalled: jest.fn(),
      startPayment: jest.fn(),
      setDevMode: jest.fn(),
    },
  };
});

jest.mock('../src/services/paymentGateway/webpayProxyConfig', () => ({
  WEBPAY_PROXY_PUBLIC_URL: '',
  WEBPAY_RETURN_DEEP_LINK: 'dtemitepos://payments/webpay/return',
  getWebpayProxyBaseUrl: async () => 'http://127.0.0.1:8787',
  isWebpayProxyConfigured: async () => true,
  resolveCurrentWebpayAccess: async () => 'wlan',
  isCashOnlyPaymentNetwork: (access: string) => access === 'offline',
  isCardPaymentNetwork: (access: string) =>
    access === 'wwan' || access === 'wlan' || access === 'lan' || access === 'emulator',
}));

describe('HU-06 TUU', () => {
  it('CA-06.1 el módulo nativo abre com.haulmer.paymentapp y deja .dev solo para pruebas', () => {
    const javaPath = path.resolve(
      __dirname,
      '../android/app/src/main/java/com/dtemitepos/TuuPaymentModule.java',
    );
    const source = fs.readFileSync(javaPath, 'utf8');
    expect(source).toContain('com.haulmer.paymentapp');
    expect(source).toContain('private static final String TUU_PACKAGE_PROD = "com.haulmer.paymentapp"');
    expect(source).toContain('private static final String TUU_PACKAGE_DEV = "com.haulmer.paymentapp.dev"');
    expect(NativeModules.TuuPaymentModule).toBeDefined();
  });

  it('CA-06.2 crédito es 101 y débito es 104', () => {
    expect(mapTuuMethodToMedioPago(1)).toBe(101);
    expect(mapTuuMethodToMedioPago(2)).toBe(104);
    expect(mapTuuMethodToMedioPago(9)).toBe(0);
  });

  it('CA-06.3 el adapter conserva authCode y last4', async () => {
    const { tuuPaymentService } = jest.requireMock('../src/services/tuuPayment');
    tuuPaymentService.startPayment.mockResolvedValue({
      transactionStatus: true,
      sequenceNumber: 'SEQ-1',
      authCode: 'A12345',
      last4: '4242',
      printerVoucherCommerce: false,
      transactionTip: 0,
      transactionCashback: 0,
    });

    const result = await tuuPaymentGateway.startCardPayment({
      amount: 1000,
      method: 'credit',
      dteType: 48,
      netAmount: 840,
      exemptAmount: 0,
    });

    expect(result.success).toBe(true);
    expect(result.authCode).toBe('A12345');
    expect(result.last4).toBe('4242');
    expect(tuuPaymentService.startPayment).toHaveBeenCalledWith(
      expect.objectContaining({ method: 1, amount: 1000 }),
    );
  });

  it('CA-06.4 un rechazo HP y una cancelación ICE quedan clasificados para detalle_error', () => {
    const declined = classifyTuuError({ errorCodeOnApp: 'HP-05' });
    expect(declined.code).toBe('HP-05');
    expect(declined.category).toBe('RECHAZADO_BANCO');

    const cancelled = classifyTuuError({ errorCode: 10 });
    expect(cancelled.code).toBe('ICE-10');
    expect(cancelled.category).toBe('CANCELADO_USUARIO');
  });

  it('CA-06.5 un celular genérico no recibe la pasarela TUU', async () => {
    const gateway = await PaymentGatewayFactory.getDefaultCardGateway('GENERIC_MOBILE', ['tuu']);
    expect(gateway).toBeNull();
  });
});
