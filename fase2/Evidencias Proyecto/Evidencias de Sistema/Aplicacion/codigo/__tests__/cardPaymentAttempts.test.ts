import { prependCardPaymentAttempt } from '../src/services/paymentGateway/cardPaymentAttempts';

describe('cardPaymentAttempts', () => {
  it('deja el intento más reciente primero y recorta el historial', () => {
    const older = {
      at: '2026-09-26T00:00:00.000Z',
      provider: 'webpay',
      status: 'approved',
      paymentId: 'old',
    };
    const newer = {
      at: '2026-09-26T01:00:00.000Z',
      provider: 'webpay',
      status: 'declined',
      paymentId: 'new',
      token: 'sim_tok',
      buyOrder: 'DPabc',
    };
    const stored = prependCardPaymentAttempt([older], newer, 1);
    expect(stored).toEqual([newer]);
  });
});
