import { config } from '../config.js';

/**
 * Adapter opcional hacia Chimuelo (mismo patrón que repositories/webpay.class.php).
 * Requiere CHIMUELO_TOKEN. No guarda PAN/CVV.
 */
export async function createTransaction({ paymentId, amount }) {
  if (!config.chimueloToken) {
    throw Object.assign(new Error('CHIMUELO_TOKEN no configurado'), { status: 503 });
  }

  const returnUrl = `${config.publicBaseUrl}/payments/webpay/return-http/${paymentId}`;
  const body = {
    price: amount,
    description: paymentId,
    returnUrl,
    sistema: 'dpay',
    env: config.chimueloEnv,
  };

  const res = await fetch(`${config.chimueloBaseUrl}/tbk-payment-new/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `bearer ${config.chimueloToken}`,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw Object.assign(new Error(`Chimuelo respuesta inválida: ${text.slice(0, 200)}`), {
      status: 502,
    });
  }

  if (!res.ok || data.error || !data.url || !data.token) {
    throw Object.assign(
      new Error(data.error || data.message || 'Error creando transacción Chimuelo'),
      { status: 502 },
    );
  }

  return {
    token: data.token,
    redirect_url: data.url,
    provider: 'chimuelo',
    meta: data,
  };
}

export async function commitTransaction(payment) {
  if (!config.chimueloToken) {
    throw Object.assign(new Error('CHIMUELO_TOKEN no configurado'), { status: 503 });
  }

  const body = {
    token: payment.token,
    sistema: 'dpay',
    env: config.chimueloEnv,
  };

  const res = await fetch(`${config.chimueloBaseUrl}/tbk-payment-new/finish/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `bearer ${config.chimueloToken}`,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw Object.assign(new Error(`Chimuelo finish inválido: ${text.slice(0, 200)}`), {
      status: 502,
    });
  }

  const approved = data.response_code === 0 || data.response_code === '0';
  return {
    status: approved ? 'approved' : 'declined',
    auth_code: data.authorization_code || data.auth_code || null,
    last4: data.card_number ? String(data.card_number).slice(-4) : null,
    response_code: String(data.response_code ?? 'FAILED'),
    response_json: JSON.stringify(data),
  };
}
