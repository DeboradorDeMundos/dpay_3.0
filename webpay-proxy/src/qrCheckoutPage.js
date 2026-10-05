import QRCode from 'qrcode';

/** Tarjetas públicas de integración Transbank Developers (Webpay Plus CLP). */
export const TRANSBANK_TEST_CARDS = [
  {
    label: 'VISA — aprobada',
    pan: '4051 8856 0044 6623',
    cvv: '123',
    exp: 'cualquier fecha futura',
  },
  {
    label: 'MASTERCARD — rechazada',
    pan: '5186 0595 5959 0568',
    cvv: '123',
    exp: 'cualquier fecha futura',
  },
  {
    label: 'Autenticación banco (si la pide)',
    pan: 'RUT 11.111.111-1',
    cvv: 'clave 123',
    exp: '—',
  },
];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function isLoopbackHost(host) {
  return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '10.0.2.2';
}

export function isPrivateLanHost(host) {
  if (isLoopbackHost(host)) return false;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  const match = /^172\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/.exec(host);
  if (!match) return false;
  const second = Number(match[1]);
  return second >= 16 && second <= 31;
}

/** Host público (túnel). Loopback y RFC1918 pueden quedar sin token en QA de LAN. */
export function publicTunnelWithoutToken(publicBaseUrl, proxyApiToken) {
  let host = '';
  try {
    host = new URL(String(publicBaseUrl || '')).hostname.toLowerCase();
  } catch {
    return false;
  }
  if (!host || isLoopbackHost(host) || isPrivateLanHost(host)) return false;
  return !String(proxyApiToken || '').trim();
}

/**
 * Base pedida por la app para el QR.
 * Acepta IP LAN/loopback o el mismo origen que PUBLIC_BASE_URL.
 * Rechaza un HTTPS arbitrario (no abrir el QR hacia otro host).
 */
export function selectQrBaseUrl(requested, fallbackPublic) {
  const fallback = String(fallbackPublic || '').replace(/\/$/, '');
  const raw = String(requested || '').trim().replace(/\/$/, '');
  if (!raw) return fallback;
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return fallback;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return fallback;
  if (parsed.username || parsed.password || parsed.search || parsed.hash) return fallback;
  if (parsed.pathname !== '/' && parsed.pathname !== '') return fallback;
  const host = parsed.hostname.toLowerCase();
  if (isPrivateLanHost(host) || isLoopbackHost(host)) return raw;
  try {
    if (fallback && parsed.origin === new URL(fallback).origin) return raw;
  } catch {
    // PUBLIC_BASE_URL inválido: no usar el host pedido.
  }
  return fallback;
}

export function checkoutTargetUrl(payment, publicBaseUrl) {
  if (payment.provider === 'webpayplus') {
    return `${publicBaseUrl}/payments/webpay/${payment.id}/go`;
  }
  if (payment.redirect_url) {
    try {
      const redirected = new URL(payment.redirect_url);
      const base = new URL(publicBaseUrl);
      if (redirected.origin !== base.origin) {
        return `${publicBaseUrl}${redirected.pathname}${redirected.search}`;
      }
      return payment.redirect_url;
    } catch {
      return payment.redirect_url;
    }
  }
  return `${publicBaseUrl}/sandbox/checkout/${payment.id}`;
}

export async function buildQrCheckoutPayload(payment, publicBaseUrl) {
  const checkoutUrl = checkoutTargetUrl(payment, publicBaseUrl);
  const qrDataUrl = await QRCode.toDataURL(checkoutUrl, { margin: 2, width: 280 });
  return {
    payment_id: payment.id,
    provider: payment.provider,
    amount: payment.amount,
    buy_order: payment.buy_order,
    checkout_url: checkoutUrl,
    qr_page_url: `${publicBaseUrl}/payments/webpay/${payment.id}/qr`,
    qr_data_url: qrDataUrl,
    test_cards: payment.provider === 'webpayplus' ? TRANSBANK_TEST_CARDS : [],
    instructions:
      payment.provider === 'webpayplus'
        ? 'Escanea el QR con el celular del cliente. En Transbank ingresa una tarjeta de prueba de Developers.'
        : 'Escanea el QR (misma red que el PC). Sandbox Capstone sin Transbank.',
  };
}

export async function qrCheckoutHtml(payment, publicBaseUrl) {
  const payload = await buildQrCheckoutPayload(payment, publicBaseUrl);
  const amount = Number(payload.amount).toLocaleString('es-CL');
  const cards =
    payload.test_cards.length === 0
      ? '<p>Sandbox <strong>sim</strong>: usa los botones Aprobar / Rechazar / Cancelar.</p>'
      : `<table>
  <thead><tr><th>Caso</th><th>Dato</th></tr></thead>
  <tbody>
  ${payload.test_cards
    .map(
      c => `<tr><td>${escapeHtml(c.label)}</td><td>${escapeHtml(c.pan)} · CVV ${escapeHtml(c.cvv)} · ${escapeHtml(c.exp)}</td></tr>`,
    )
    .join('')}
  </tbody></table>`;

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>D-PAY · Pago con QR</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 420px; margin: 0 auto; padding: 16px; background: #0f172a; color: #e2e8f0; }
    .card { background: #1e293b; border-radius: 12px; padding: 16px; margin-bottom: 12px; }
    h1 { font-size: 1.1rem; color: #22d3ee; margin: 0 0 8px; }
    img { display: block; margin: 12px auto; background: #fff; padding: 8px; border-radius: 8px; }
    a { color: #f472b6; word-break: break-all; }
    table { width: 100%; font-size: 0.85rem; border-collapse: collapse; }
    td, th { border-bottom: 1px solid #334155; padding: 6px 4px; vertical-align: top; }
    .meta { font-size: 0.8rem; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Pagar con Webpay</h1>
    <p>Monto: <strong>$${amount} CLP</strong></p>
    <p class="meta">Provider: ${escapeHtml(payload.provider)} · buy_order: ${escapeHtml(payload.buy_order || '—')}</p>
    <p>${escapeHtml(payload.instructions)}</p>
    <img src="${payload.qr_data_url}" width="280" height="280" alt="QR checkout" />
    <p class="meta">Enlace directo: <a href="${escapeHtml(payload.checkout_url)}">${escapeHtml(payload.checkout_url)}</a></p>
  </div>
  <div class="card">
    <h1>Tarjetas de prueba (integración)</h1>
    ${cards}
    <p class="meta">Fuente: <a href="https://transbankdevelopers.cl/documentacion/como_empezar">Transbank Developers</a></p>
  </div>
</body>
</html>`;
}
