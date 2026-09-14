import { randomUUID } from 'node:crypto';
import { config } from '../config.js';

/**
 * Provider Capstone: simula Transbank sin credenciales.
 * Sirve checkout HTML + commit local.
 */
export async function createTransaction({ paymentId, amount, tip, method }) {
  const token = `sim_${randomUUID().replace(/-/g, '')}`;
  const redirectUrl = `${config.publicBaseUrl}/sandbox/checkout/${paymentId}`;
  return {
    token,
    redirect_url: redirectUrl,
    provider: 'sim',
    meta: { amount, tip, method },
  };
}

export async function commitTransaction(payment, outcome) {
  const status = outcome?.status || 'approved';
  if (status === 'declined') {
    return {
      status: 'declined',
      auth_code: null,
      last4: '0000',
      response_code: 'FAILED',
      response_json: JSON.stringify({ provider: 'sim', status: 'declined' }),
    };
  }
  if (status === 'cancelled') {
    return {
      status: 'cancelled',
      auth_code: null,
      last4: null,
      response_code: 'CANCELLED',
      response_json: JSON.stringify({ provider: 'sim', status: 'cancelled' }),
    };
  }
  return {
    status: 'approved',
    auth_code: `WP${String(Date.now()).slice(-6)}`,
    last4: '4242',
    response_code: '0',
    response_json: JSON.stringify({
      provider: 'sim',
      status: 'approved',
      token: payment.token,
      amount: payment.amount,
    }),
  };
}
