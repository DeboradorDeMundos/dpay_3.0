import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { config } from './config.js';
import { checkoutTargetUrl } from './qrCheckoutPage.js';

let db;

export function getDb() {
  if (db) return db;

  fs.mkdirSync(path.dirname(config.sqlitePath), { recursive: true });
  db = new DatabaseSync(config.sqlitePath);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS payment_transactions (
      id TEXT PRIMARY KEY,
      sale_id TEXT,
      amount INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'CLP',
      status TEXT NOT NULL,
      provider TEXT NOT NULL,
      method TEXT,
      tip INTEGER DEFAULT 0,
      token TEXT,
      redirect_url TEXT,
      return_url TEXT,
      auth_code TEXT,
      last4 TEXT,
      response_code TEXT,
      idempotency_key TEXT UNIQUE,
      request_json TEXT,
      response_json TEXT,
      buy_order TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      committed_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_payments_sale ON payment_transactions(sale_id);
    CREATE INDEX IF NOT EXISTS idx_payments_status ON payment_transactions(status);
  `);
  const columns = db.prepare('PRAGMA table_info(payment_transactions)').all();
  if (!columns.some(column => column.name === 'buy_order')) {
    db.exec('ALTER TABLE payment_transactions ADD COLUMN buy_order TEXT');
  }
  return db;
}

export function createPayment(row) {
  const database = getDb();
  database
    .prepare(
      `INSERT INTO payment_transactions (
        id, sale_id, amount, currency, status, provider, method, tip,
        token, redirect_url, return_url, idempotency_key, request_json, buy_order,
        created_at, updated_at
      ) VALUES (
        @id, @sale_id, @amount, @currency, @status, @provider, @method, @tip,
        @token, @redirect_url, @return_url, @idempotency_key, @request_json, @buy_order,
        @created_at, @updated_at
      )`,
    )
    .run({ ...row, buy_order: row.buy_order ?? null });
  return getPayment(row.id);
}

export function getPayment(id) {
  return getDb().prepare('SELECT * FROM payment_transactions WHERE id = ?').get(id) ?? null;
}

export function getPaymentByIdempotency(key) {
  if (!key) return null;
  return (
    getDb().prepare('SELECT * FROM payment_transactions WHERE idempotency_key = ?').get(key) ??
    null
  );
}

export function updatePayment(id, patch) {
  const current = getPayment(id);
  if (!current) return null;

  const next = {
    ...current,
    ...patch,
    updated_at: new Date().toISOString(),
  };

  getDb()
    .prepare(
      `UPDATE payment_transactions SET
        status = @status,
        token = @token,
        redirect_url = @redirect_url,
        auth_code = @auth_code,
        last4 = @last4,
        response_code = @response_code,
        response_json = @response_json,
        buy_order = @buy_order,
        committed_at = @committed_at,
        updated_at = @updated_at
      WHERE id = @id`,
    )
    .run({
      id,
      status: next.status,
      token: next.token ?? null,
      redirect_url: next.redirect_url ?? null,
      auth_code: next.auth_code ?? null,
      last4: next.last4 ?? null,
      response_code: next.response_code ?? null,
      response_json: next.response_json ?? null,
      buy_order: next.buy_order ?? null,
      committed_at: next.committed_at ?? null,
      updated_at: next.updated_at,
    });

  return getPayment(id);
}

export function toPublicPayment(row, options = {}) {
  if (!row) return null;
  const includeToken = options.includeToken !== false;
  return {
    payment_id: row.id,
    sale_id: row.sale_id,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    provider: row.provider,
    method: row.method,
    tip: row.tip ?? 0,
    redirect_url: row.redirect_url,
    qr_page_url: `${config.publicBaseUrl}/payments/webpay/${row.id}/qr`,
    qr_checkout_url: checkoutTargetUrl(row, config.publicBaseUrl),
    ...(includeToken ? { token: row.token } : {}),
    buy_order: row.buy_order,
    auth_code: row.auth_code,
    last4: row.last4,
    response_code: row.response_code,
    created_at: row.created_at,
    updated_at: row.updated_at,
    committed_at: row.committed_at,
  };
}
