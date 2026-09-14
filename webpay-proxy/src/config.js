import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

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
  chimueloBaseUrl: env('CHIMUELO_BASE_URL', 'https://chimuelo.dtemite.cl').replace(/\/$/, ''),
  chimueloToken: env('CHIMUELO_TOKEN', ''),
  chimueloEnv: env('CHIMUELO_ENV', 'development'),
  proxyApiToken: env('PROXY_API_TOKEN', ''),
  sqlitePath: path.resolve(root, env('SQLITE_PATH', './data/webpay_payments.sqlite')),
  root,
};
