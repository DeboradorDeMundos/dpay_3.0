import assert from 'node:assert/strict';
import test from 'node:test';
import { buyOrderFromPaymentId, classifyReturn, mapCommitResponse } from './providers/webpayplus.js';

test('buy_order cabe en 26 caracteres alfanuméricos', () => {
  const order = buyOrderFromPaymentId('550e8400-e29b-41d4-a716-446655440000');
  assert.equal(order.length <= 26, true);
  assert.match(order, /^[a-zA-Z0-9]+$/);
  assert.equal(order.startsWith('DP'), true);
});

test('retorno normal pide commit; anulación y timeout no', () => {
  const commit = classifyReturn(new URLSearchParams('token_ws=abc'));
  assert.deepEqual(commit, { action: 'commit', token: 'abc' });

  const abort = classifyReturn(new URLSearchParams('TBK_TOKEN=abc&TBK_ORDEN_COMPRA=1&TBK_ID_SESION=s'));
  assert.equal(abort.action, 'cancel');
  assert.equal(abort.reason, 'aborted');

  const timeout = classifyReturn(new URLSearchParams('TBK_ID_SESION=s&TBK_ORDEN_COMPRA=1'));
  assert.equal(timeout.reason, 'timeout');

  const errorForm = classifyReturn(new URLSearchParams('token_ws=abc&TBK_TOKEN=abc'));
  assert.equal(errorForm.reason, 'error_form');
});

test('commit AUTHORIZED guarda autorización y últimos 4, no el PAN', () => {
  const mapped = mapCommitResponse({
    status: 'AUTHORIZED',
    response_code: 0,
    authorization_code: '1213',
    card_detail: { card_number: '6623' },
    payment_type_code: 'VN',
    vci: 'TSY',
  });
  assert.equal(mapped.status, 'approved');
  assert.equal(mapped.auth_code, '1213');
  assert.equal(mapped.last4, '6623');
  assert.equal(mapped.response_json.includes('4051'), false);
});

test('commit FAILED queda declined', () => {
  const mapped = mapCommitResponse({
    status: 'FAILED',
    response_code: -1,
    card_detail: { card_number: '7763' },
  });
  assert.equal(mapped.status, 'declined');
  assert.equal(mapped.auth_code, null);
});
