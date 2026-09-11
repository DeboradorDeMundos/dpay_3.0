import { MockPaymentGateway } from '../src/services/paymentGateway/MockPaymentGateway';

const baseRequest = {
  amount: 10000,
  method: 'debit' as const,
  dteType: 48,
  netAmount: 8403,
  exemptAmount: 0,
};

describe('MockPaymentGateway (COD-03)', () => {
  it('simula aprobado', async () => {
    const gw = new MockPaymentGateway();
    gw.scenario = 'approved';
    const result = await gw.startCardPayment(baseRequest);
    expect(result.success).toBe(true);
    expect(result.sequenceNumber).toMatch(/^MOCK-OK-/);
  });

  it('simula rechazado', async () => {
    const gw = new MockPaymentGateway();
    gw.scenario = 'declined';
    const result = await gw.startCardPayment(baseRequest);
    expect(result.success).toBe(false);
    expect(result.sequenceNumber).toMatch(/^MOCK-REJ-/);
  });

  it('simula timeout', async () => {
    const gw = new MockPaymentGateway();
    gw.scenario = 'timeout';
    await expect(gw.startCardPayment(baseRequest)).rejects.toThrow(/MOCK_TIMEOUT/);
  });
});
