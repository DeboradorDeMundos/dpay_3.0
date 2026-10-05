import assert from 'node:assert/strict';
import test from 'node:test';
import {
  checkoutTargetUrl,
  buildQrCheckoutPayload,
  publicTunnelWithoutToken,
  selectQrBaseUrl,
  TRANSBANK_TEST_CARDS,
} from './qrCheckoutPage.js';

test('túnel público sin token no se considera seguro para arrancar', () => {
  assert.equal(publicTunnelWithoutToken('https://tunnel.example', ''), true);
  assert.equal(publicTunnelWithoutToken('https://tunnel.example', 'local-token'), false);
  assert.equal(publicTunnelWithoutToken('http://192.168.1.4:8787', ''), false);
  assert.equal(publicTunnelWithoutToken('http://127.0.0.1:8787', ''), false);
});

test('selectQrBaseUrl acepta LAN y el túnel configurado, no un host ajeno', () => {
  const tunnel = 'https://tunnel.example';
  assert.equal(selectQrBaseUrl(tunnel, tunnel), tunnel);
  assert.equal(selectQrBaseUrl('http://192.168.1.4:8787', tunnel), 'http://192.168.1.4:8787');
  assert.equal(selectQrBaseUrl('http://127.0.0.1:8787', tunnel), 'http://127.0.0.1:8787');
  assert.equal(selectQrBaseUrl('https://evil.example', tunnel), tunnel);
  assert.equal(selectQrBaseUrl('https://10.1.2.3:8787', tunnel), 'https://10.1.2.3:8787');
});

test('checkoutTargetUrl reescribe el sandbox a la base LAN del QR', () => {
  const url = checkoutTargetUrl(
    {
      id: 'abc',
      provider: 'sim',
      redirect_url: 'https://tunnel.example/sandbox/checkout/abc',
    },
    'http://192.168.1.4:8787',
  );
  assert.equal(url, 'http://192.168.1.4:8787/sandbox/checkout/abc');
});

test('checkoutTargetUrl webpayplus apunta a /go', () => {
  const url = checkoutTargetUrl(
    { id: 'abc', provider: 'webpayplus', redirect_url: 'http://x/go' },
    'http://127.0.0.1:8787',
  );
  assert.equal(url, 'http://127.0.0.1:8787/payments/webpay/abc/go');
});

test('buildQrCheckoutPayload incluye QR y tarjetas Transbank', async () => {
  const payload = await buildQrCheckoutPayload(
    {
      id: 'pay-1',
      provider: 'webpayplus',
      amount: 1500,
      buy_order: 'DPpay1',
      redirect_url: 'http://127.0.0.1:8787/payments/webpay/pay-1/go',
    },
    'http://127.0.0.1:8787',
  );
  assert.equal(payload.payment_id, 'pay-1');
  assert.match(payload.qr_data_url, /^data:image\/png;base64,/);
  assert.equal(payload.test_cards.length, TRANSBANK_TEST_CARDS.length);
});
