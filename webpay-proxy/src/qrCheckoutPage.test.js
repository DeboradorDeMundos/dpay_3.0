import assert from 'node:assert/strict';
import test from 'node:test';
import {
  checkoutTargetUrl,
  buildQrCheckoutPayload,
  TRANSBANK_TEST_CARDS,
} from './qrCheckoutPage.js';

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
