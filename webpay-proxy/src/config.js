import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function loadEnvFile() {
  const file = path.join(root, '.env');
  if (!fs.existsSync(file)) return;
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const index = line.indexOf('=');
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile();

function env(name, fallback = '') {
  const v = process.env[name];
  return v === undefined || v === '' ? fallback : v;
}

export const config = {
  port: Number(env('PORT', '8787')),
  host: env('HOST', '0.0.0.0'),
  publicBaseUrl: env('PUBLIC_BASE_URL', 'http://127.0.0.1:8787').replace(/\/$/, ''),
  appReturnScheme: env('APP_RETURN_SCHEME', 'dtemitepos://payments/webpay/return'),
  provider: env('PROVIDER', 'sim'),
  tbkHost: env('TBK_HOST', 'https://webpay3gint.transbank.cl').replace(/\/$/, ''),
  tbkApiKeyId: env('TBK_API_KEY_ID', '597055555532'),
  tbkApiKeySecret: env(
    'TBK_API_KEY_SECRET',
    '579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C',
  ),
  chimueloBaseUrl: env('CHIMUELO_BASE_URL', 'https://chimuelo.dtemite.cl').replace(/\/$/, ''),
  chimueloToken: env('CHIMUELO_TOKEN', ''),
  chimueloEnv: env('CHIMUELO_ENV', 'development'),
  proxyApiToken: env('PROXY_API_TOKEN', ''),
  sqlitePath: path.resolve(root, env('SQLITE_PATH', './data/webpay_payments.sqlite')),
  root,
};
