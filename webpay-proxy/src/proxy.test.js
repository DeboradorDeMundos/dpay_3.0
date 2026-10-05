import assert from 'node:assert/strict';
import test from 'node:test';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import net from 'node:net';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function getAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      server.close(err => (err ? reject(err) : resolve(port)));
    });
    server.on('error', reject);
  });
}

async function startTestServer(extraEnv = {}) {
  const port = await getAvailablePort();
  const dbPath = path.join(root, 'data', `test-${Date.now()}-${port}.sqlite`);
  const child = spawn(process.execPath, ['src/server.js'], {
    cwd: root,
    env: {
      ...process.env,
      PORT: String(port),
      HOST: '127.0.0.1',
      PUBLIC_BASE_URL: `http://127.0.0.1:${port}`,
      PROVIDER: 'sim',
      SQLITE_PATH: dbPath,
      PROXY_API_TOKEN: '',
      ...extraEnv,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const base = `http://127.0.0.1:${port}`;
  await waitHealth(base);
  return { child, base, dbPath, port };
}

async function waitHealth(base, attempts = 40) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(`${base}/health`);
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error('server did not start');
}

test('create + simulate approved + status', async () => {
  const { child, base, dbPath } = await startTestServer();
  try {

    const createRes = await fetch(`${base}/payments/webpay/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 1500,
        sale_id: 'sale-test-1',
        method: 'credit',
        simulate: 'approved',
        idempotency_key: 'idem-1',
      }),
    });
    assert.equal(createRes.status, 201);
    const created = await createRes.json();
    assert.equal(created.status, 'approved');
    assert.ok(created.payment_id);
    assert.ok(created.auth_code);
    assert.equal(created.provider, 'sim');
    assert.ok(created.token);
    assert.match(created.buy_order, /^DP[A-Za-z0-9]+$/);
    assert.ok(created.buy_order.length <= 26);

    const reuseRes = await fetch(`${base}/payments/webpay/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 1500,
        sale_id: 'sale-test-1',
        simulate: 'approved',
        idempotency_key: 'idem-1',
      }),
    });
    const reused = await reuseRes.json();
    assert.equal(reused.reuse, true);
    assert.equal(reused.payment_id, created.payment_id);

    const statusRes = await fetch(`${base}/payments/webpay/${created.payment_id}/status`);
    const status = await statusRes.json();
    assert.equal(status.status, 'approved');
    assert.equal(status.amount, 1500);
    assert.equal(status.token, undefined);
  } finally {
    child.kill('SIGTERM');
    try {
      fs.unlinkSync(dbPath);
    } catch {
      // ignore
    }
  }
});

test('qr.json y página HTML para pago pendiente (sim)', async () => {
  const { child, base, dbPath } = await startTestServer();
  try {
    const createRes = await fetch(`${base}/payments/webpay/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 990,
        sale_id: 'sale-qr-1',
        method: 'credit',
        idempotency_key: 'idem-qr-1',
      }),
    });
    assert.equal(createRes.status, 201);
    const created = await createRes.json();
    assert.ok(['pending', 'redirected'].includes(created.status));
    assert.ok(created.qr_page_url.includes('/qr'));
    assert.ok(created.qr_checkout_url);

    const qrJsonRes = await fetch(`${base}/payments/webpay/${created.payment_id}/qr.json`);
    assert.equal(qrJsonRes.status, 200);
    const qrPayload = await qrJsonRes.json();
    assert.match(qrPayload.qr_data_url, /^data:image\/png;base64,/);
    assert.equal(qrPayload.amount, 990);

    const qrHtmlRes = await fetch(`${base}/payments/webpay/${created.payment_id}/qr`);
    assert.equal(qrHtmlRes.status, 200);
    const html = await qrHtmlRes.text();
    assert.match(html, /Pagar con Webpay/);

    const cancelRes = await fetch(`${base}/payments/webpay/${created.payment_id}/cancel`, {
      method: 'POST',
    });
    assert.equal(cancelRes.status, 200);
    const cancelled = await cancelRes.json();
    assert.equal(cancelled.status, 'cancelled');

    const statusAfter = await fetch(`${base}/payments/webpay/${created.payment_id}/status`);
    const st = await statusAfter.json();
    assert.equal(st.status, 'cancelled');
  } finally {
    child.kill('SIGTERM');
    try {
      fs.unlinkSync(dbPath);
    } catch {
      // ignore
    }
  }
});
