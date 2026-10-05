import http from 'node:http';
import { config } from './config.js';
import { getDb } from './db.js';
import { handleRequest } from './routes.js';
import { publicTunnelWithoutToken } from './qrCheckoutPage.js';

if (publicTunnelWithoutToken(config.publicBaseUrl, config.proxyApiToken)) {
  console.error(
    '[webpay-proxy] PUBLIC_BASE_URL es un host público y PROXY_API_TOKEN está vacío. No se abre el túnel.',
  );
  process.exit(1);
}

getDb();

const server = http.createServer((req, res) => {
  handleRequest(req, res);
});

server.listen(config.port, config.host, () => {
  console.log(`[webpay-proxy] listening on http://${config.host}:${config.port}`);
  console.log(`[webpay-proxy] provider=${config.provider} sqlite=${config.sqlitePath}`);
  console.log(`[webpay-proxy] publicBaseUrl=${config.publicBaseUrl}`);
  console.log('[webpay-proxy] endpoints:');
  console.log('  GET  /health');
  console.log('  POST /payments/webpay/create');
  console.log('  POST /payments/webpay/:id/commit');
  console.log('  GET  /payments/webpay/:id/status');
  console.log('  GET  /sandbox/checkout/:id');
});
