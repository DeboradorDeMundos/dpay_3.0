import assert from 'node:assert/strict';
import test from 'node:test';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dbPath = path.join(root, 'data', `test-${Date.now()}.sqlite`);
const port = 8791;

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
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const base = `http://127.0.0.1:${port}`;
  try {
    await waitHealth(base);

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
  } finally {
    child.kill('SIGTERM');
    try {
      fs.unlinkSync(dbPath);
    } catch {
      // ignore
    }
  }
});
