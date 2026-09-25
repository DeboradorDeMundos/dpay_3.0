import { config } from '../config.js';

const CREATE_PATH = '/rswebpaytransaction/api/webpay/v1.2/transactions';

/**
 * Webpay Plus integración (API REST). Credenciales públicas de Transbank Developers.
 * El formulario de tarjeta lo muestra Transbank. Este módulo no recibe PAN ni CVV.
 */
export function buyOrderFromPaymentId(paymentId) {
  const compact = String(paymentId).replace(/[^a-zA-Z0-9]/g, '');
  return (`DP${compact}`).slice(0, 26);
}

export function classifyReturn(params) {
  const tokenWs = String(params.get('token_ws') || '').trim();
  const tbkToken = String(params.get('TBK_TOKEN') || '').trim();
  if (tokenWs && tbkToken) {
    return { action: 'cancel', reason: 'error_form' };
  }
  if (tokenWs) {
    return { action: 'commit', token: tokenWs };
  }
  return { action: 'cancel', reason: tbkToken ? 'aborted' : 'timeout' };
}

function tbkHeaders() {
  return {
    'Content-Type': 'application/json',
    'Tbk-Api-Key-Id': config.tbkApiKeyId,
    'Tbk-Api-Key-Secret': config.tbkApiKeySecret,
  };
}

export async function createTransaction({ paymentId, amount, fetchImpl = fetch }) {
  const returnUrl = `${config.publicBaseUrl}/payments/webpay/tbk-return/${paymentId}`;
  const body = {
    buy_order: buyOrderFromPaymentId(paymentId),
    session_id: String(paymentId).slice(0, 61),
    amount: Math.round(amount),
    return_url: returnUrl,
  };
  const res = await fetchImpl(`${config.tbkHost}${CREATE_PATH}`, {
    method: 'POST',
    headers: tbkHeaders(),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw Object.assign(new Error(`Webpay Plus create inválido: ${text.slice(0, 180)}`), { status: 502 });
  }
  if (!res.ok || !data?.token || !data?.url) {
    throw Object.assign(
      new Error(data?.error_message || `Webpay Plus create HTTP ${res.status}`),
      { status: 502 },
    );
  }
  return {
    token: data.token,
    redirect_url: `${config.publicBaseUrl}/payments/webpay/${paymentId}/go`,
    provider: 'webpayplus',
    meta: {
      tbk_url: data.url,
      buy_order: body.buy_order,
      return_url: returnUrl,
    },
  };
}

export function mapCommitResponse(data) {
  const status = String(data?.status || '').toUpperCase();
  const approved = status === 'AUTHORIZED' && Number(data?.response_code) === 0;
  const last4 = data?.card_detail?.card_number
    ? String(data.card_detail.card_number).slice(-4)
    : null;
  return {
    status: approved ? 'approved' : 'declined',
    auth_code: approved ? String(data.authorization_code || '') : null,
    last4,
    response_code: data?.response_code == null ? null : String(data.response_code),
    response_json: JSON.stringify({
      provider: 'webpayplus',
      status: data?.status || null,
      vci: data?.vci || null,
      payment_type_code: data?.payment_type_code || null,
      buy_order: data?.buy_order || null,
    }),
  };
}

export async function commitTransaction(payment, _outcome, fetchImpl = fetch) {
  const token = payment?.token;
  if (!token) {
    return {
      status: 'declined',
      auth_code: null,
      last4: null,
      response_code: 'NO_TOKEN',
      response_json: JSON.stringify({ provider: 'webpayplus', status: 'NO_TOKEN' }),
    };
  }
  const res = await fetchImpl(`${config.tbkHost}${CREATE_PATH}/${token}`, {
    method: 'PUT',
    headers: tbkHeaders(),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw Object.assign(new Error(`Webpay Plus commit inválido: ${text.slice(0, 180)}`), { status: 502 });
  }
  if (!res.ok) {
    throw Object.assign(
      new Error(data?.error_message || `Webpay Plus commit HTTP ${res.status}`),
      { status: 502 },
    );
  }
  return mapCommitResponse(data);
}

export function goFormHtml({ tbkUrl, token, amount }) {
  const safeUrl = String(tbkUrl);
  const safeToken = String(token);
  const shown = Number(amount).toLocaleString('es-CL');
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Webpay Plus</title>
</head>
<body>
  <p>Redirigiendo a Webpay Plus ($${shown} CLP). Los datos de la tarjeta se ingresan en Transbank.</p>
  <form id="tbk" method="POST" action="${escapeHtml(safeUrl)}">
    <input type="hidden" name="token_ws" value="${escapeHtml(safeToken)}" />
    <button type="submit">Continuar a Webpay</button>
  </form>
  <script>document.getElementById('tbk').submit();</script>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
