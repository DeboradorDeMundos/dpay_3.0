import { randomUUID } from 'node:crypto';
import { config } from './config.js';
import {
  createPayment,
  getPayment,
  getPaymentByIdempotency,
  toPublicPayment,
  updatePayment,
} from './db.js';
import * as sim from './providers/sim.js';
import * as chimuelo from './providers/chimuelo.js';

function providerApi() {
  return config.provider === 'chimuelo' ? chimuelo : sim;
}

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Proxy-Token',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(Object.assign(new Error('JSON inválido'), { status: 400 }));
      }
    });
    req.on('error', reject);
  });
}

function requireProxyAuth(req) {
  if (!config.proxyApiToken) return;
  const header = req.headers['x-proxy-token'] || req.headers.authorization || '';
  const token = String(header).replace(/^bearer\s+/i, '').trim();
  if (token !== config.proxyApiToken) {
    throw Object.assign(new Error('No autorizado'), { status: 401 });
  }
}

function deepLink(paymentId, status) {
  const base = config.appReturnScheme;
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}payment_id=${encodeURIComponent(paymentId)}&status=${encodeURIComponent(status)}`;
}

function sandboxHtml(payment) {
  const amount = Number(payment.amount).toLocaleString('es-CL');
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Webpay Sandbox D-PAY</title>
  <style>
    body{font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0}
    .card{background:#1e293b;border-radius:16px;padding:28px;max-width:420px;width:92%;box-shadow:0 20px 50px rgba(0,0,0,.35)}
    h1{font-size:1.25rem;margin:0 0 8px}
    p{opacity:.85;line-height:1.45}
    .amt{font-size:2rem;font-weight:700;margin:16px 0}
    button{width:100%;border:0;border-radius:10px;padding:14px;margin:8px 0;font-weight:600;cursor:pointer}
    .ok{background:#16a34a;color:#fff}
    .no{background:#dc2626;color:#fff}
    .ca{background:#334155;color:#fff}
    .meta{font-size:.8rem;opacity:.6;margin-top:12px}
  </style>
</head>
<body>
  <div class="card">
    <h1>Webpay Sandbox — D-PAY</h1>
    <p>Simulación Capstone (sin Transbank). Confirma el cobro para volver a la app.</p>
    <div class="amt">$${amount} CLP</div>
    <form method="POST" action="/sandbox/checkout/${payment.id}/decide">
      <input type="hidden" name="status" value="approved" />
      <button class="ok" type="submit">Aprobar pago</button>
    </form>
    <form method="POST" action="/sandbox/checkout/${payment.id}/decide">
      <input type="hidden" name="status" value="declined" />
      <button class="no" type="submit">Rechazar pago</button>
    </form>
    <form method="POST" action="/sandbox/checkout/${payment.id}/decide">
      <input type="hidden" name="status" value="cancelled" />
      <button class="ca" type="submit">Cancelar</button>
    </form>
    <div class="meta">payment_id: ${payment.id}<br/>provider: ${payment.provider}</div>
  </div>
</body>
</html>`;
}

async function handleCreate(req, res) {
  requireProxyAuth(req);
  const body = await readBody(req);
  const amount = Number(body.amount);
  const tip = Number(body.tip ?? 0);
  const saleId = body.sale_id ? String(body.sale_id) : null;
  const method = body.method === 'debit' ? 'debit' : 'credit';
  const idempotencyKey = body.idempotency_key ? String(body.idempotency_key) : null;
  const simulate = body.simulate; // approved|declined|cancelled — atajo tests sin UI

  if (!Number.isFinite(amount) || amount <= 0) {
    return json(res, 400, {
      error: { code: 'INVALID_AMOUNT', message: 'amount debe ser entero CLP > 0' },
    });
  }

  if (idempotencyKey) {
    const existing = getPaymentByIdempotency(idempotencyKey);
    if (existing) {
      return json(res, 200, {
        ...toPublicPayment(existing),
        reuse: true,
      });
    }
  }

  const now = new Date().toISOString();
  const paymentId = randomUUID();
  const created = createPayment({
    id: paymentId,
    sale_id: saleId,
    amount: Math.round(amount),
    currency: 'CLP',
    status: 'pending',
    provider: config.provider,
    method,
    tip: Number.isFinite(tip) ? Math.round(tip) : 0,
    token: null,
    redirect_url: null,
    return_url: deepLink(paymentId, 'pending'),
    idempotency_key: idempotencyKey,
    request_json: JSON.stringify(body),
    created_at: now,
    updated_at: now,
  });

  const upstream = await providerApi().createTransaction({
    paymentId,
    amount: created.amount,
    tip: created.tip,
    method,
  });

  let payment = updatePayment(paymentId, {
    status: 'redirected',
    token: upstream.token,
    redirect_url: upstream.redirect_url,
    response_json: JSON.stringify(upstream.meta || {}),
  });

  // Atajo Capstone/tests: simular resultado sin abrir browser
  if (simulate && config.provider === 'sim') {
    const committed = await sim.commitTransaction(payment, { status: simulate });
    payment = updatePayment(paymentId, {
      ...committed,
      committed_at: new Date().toISOString(),
    });
  }

  return json(res, 201, {
    ...toPublicPayment(payment),
    deep_link_template: deepLink(paymentId, '{status}'),
  });
}

async function handleCommit(req, res, paymentId) {
  requireProxyAuth(req);
  const body = await readBody(req);
  const payment = getPayment(paymentId);
  if (!payment) {
    return json(res, 404, {
      error: { code: 'PAYMENT_NOT_FOUND', message: 'Transacción no encontrada' },
    });
  }

  if (payment.status === 'approved' || payment.status === 'declined' || payment.status === 'cancelled') {
    return json(res, 200, { ...toPublicPayment(payment), reuse: true });
  }

  const outcome = {
    status: body.status || undefined,
  };

  const committed = await providerApi().commitTransaction(payment, outcome);
  const updated = updatePayment(paymentId, {
    ...committed,
    committed_at: new Date().toISOString(),
  });

  return json(res, 200, toPublicPayment(updated));
}

async function handleStatus(_req, res, paymentId) {
  const payment = getPayment(paymentId);
  if (!payment) {
    return json(res, 404, {
      error: { code: 'PAYMENT_NOT_FOUND', message: 'Transacción no encontrada' },
    });
  }
  return json(res, 200, toPublicPayment(payment));
}

async function handleSandboxDecide(req, res, paymentId) {
  const payment = getPayment(paymentId);
  if (!payment) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Pago no encontrado');
    return;
  }

  const body = await new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
  const params = new URLSearchParams(body);
  const status = params.get('status') || 'approved';

  if (payment.status === 'redirected' || payment.status === 'pending') {
    const committed = await sim.commitTransaction(payment, { status });
    updatePayment(paymentId, {
      ...committed,
      committed_at: new Date().toISOString(),
    });
  }

  const finalStatus = getPayment(paymentId)?.status || status;
  const target = deepLink(paymentId, finalStatus);
  res.writeHead(302, { Location: target });
  res.end();
}

export async function handleRequest(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const { pathname } = url;

    if (req.method === 'OPTIONS') {
      return json(res, 204, {});
    }

    if (req.method === 'GET' && pathname === '/health') {
      return json(res, 200, {
        ok: true,
        service: 'dpay-webpay-proxy',
        provider: config.provider,
        sqlite: true,
      });
    }

    if (req.method === 'POST' && pathname === '/payments/webpay/create') {
      return await handleCreate(req, res);
    }

    const commitMatch = pathname.match(/^\/payments\/webpay\/([^/]+)\/commit$/);
    if (req.method === 'POST' && commitMatch) {
      return await handleCommit(req, res, commitMatch[1]);
    }

    const statusMatch = pathname.match(/^\/payments\/webpay\/([^/]+)\/status$/);
    if (req.method === 'GET' && statusMatch) {
      return await handleStatus(req, res, statusMatch[1]);
    }

    const checkoutMatch = pathname.match(/^\/sandbox\/checkout\/([^/]+)$/);
    if (req.method === 'GET' && checkoutMatch) {
      const payment = getPayment(checkoutMatch[1]);
      if (!payment) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Pago no encontrado');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(sandboxHtml(payment));
      return;
    }

    const decideMatch = pathname.match(/^\/sandbox\/checkout\/([^/]+)\/decide$/);
    if (req.method === 'POST' && decideMatch) {
      return await handleSandboxDecide(req, res, decideMatch[1]);
    }

    // Retorno HTTP Chimuelo → deep link app
    const returnHttp = pathname.match(/^\/payments\/webpay\/return-http\/([^/]+)$/);
    if (req.method === 'GET' && returnHttp) {
      const paymentId = returnHttp[1];
      const payment = getPayment(paymentId);
      if (!payment) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Pago no encontrado');
        return;
      }
      if (payment.status === 'redirected' || payment.status === 'pending') {
        const committed = await providerApi().commitTransaction(payment, {});
        updatePayment(paymentId, {
          ...committed,
          committed_at: new Date().toISOString(),
        });
      }
      const final = getPayment(paymentId);
      res.writeHead(302, { Location: deepLink(paymentId, final.status) });
      res.end();
      return;
    }

    return json(res, 404, {
      error: { code: 'NOT_FOUND', message: `Ruta no encontrada: ${pathname}` },
    });
  } catch (error) {
    const status = error.status || 500;
    return json(res, status, {
      error: {
        code: status === 401 ? 'UNAUTHORIZED' : 'PROXY_ERROR',
        message: error.message || 'Error interno',
      },
    });
  }
}
