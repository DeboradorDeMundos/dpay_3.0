import type {
  IPaymentGateway,
  PaymentCardRequest,
  PaymentCardResult,
} from '../../types/paymentGateway';

export type MockPaymentScenario = 'approved' | 'declined' | 'timeout';

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

/**
 * COD-03: gateway simulado para celular genérico en desarrollo (__DEV__).
 * Escenarios: aprobado, rechazado, timeout.
 */
export class MockPaymentGateway implements IPaymentGateway {
  readonly id = 'mock' as const;
  readonly displayName = 'Mock (dev)';

  /** Cambiar en runtime para pruebas QA (TC aprobado/rechazado/timeout). */
  scenario: MockPaymentScenario = 'approved';

  async isAvailable(): Promise<boolean> {
    return __DEV__;
  }

  async startCardPayment(request: PaymentCardRequest): Promise<PaymentCardResult> {
    if (!__DEV__) {
      throw new Error('MockPaymentGateway solo disponible en builds de desarrollo');
    }

    if (this.scenario === 'timeout') {
      await delay(3500);
      throw new Error('MOCK_TIMEOUT: tiempo de espera agotado');
    }

    if (this.scenario === 'declined') {
      await delay(800);
      return {
        success: false,
        transactionStatus: false,
        sequenceNumber: `MOCK-REJ-${Date.now()}`,
        authCode: undefined,
        last4: '0000',
        transactionTip: request.tip ?? 0,
        transactionCashback: 0,
        printerVoucherCommerce: false,
        rawTuuRequest: { provider: 'mock', scenario: 'declined', amount: request.amount },
      };
    }

    await delay(600);
    const sequenceNumber = `MOCK-OK-${Date.now()}`;
    return {
      success: true,
      transactionStatus: true,
      sequenceNumber,
      authCode: 'MOCK01',
      last4: '4242',
      transactionTip: request.tip ?? 0,
      transactionCashback: 0,
      printerVoucherCommerce: false,
      rawTuuRequest: { provider: 'mock', scenario: 'approved', amount: request.amount },
    };
  }

  async cancelCardPayment(): Promise<void> {
    // Mock no requiere cancelación externa
  }
}

export const mockPaymentGateway = new MockPaymentGateway();
