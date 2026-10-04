import { Linking } from 'react-native';
import type {
  IPaymentGateway,
  PaymentCardRequest,
  PaymentCardResult,
  WebpayQrCheckoutPayload,
} from '../../types/paymentGateway';
import {
  getWebpayProxyBaseUrl,
  isWebpayProxyConfigured,
} from './webpayProxyConfig';
import {
  WEBPAY_CHECKOUT_TIMEOUT_MS,
  webpayCheckoutTimeoutErrorDetail,
} from './webpayCheckoutConstants';

type ProxyPayment = {
  payment_id: string;
  status: string;
  amount: number;
  redirect_url?: string | null;
  auth_code?: string | null;
  last4?: string | null;
  token?: string | null;
  buy_order?: string | null;
  provider?: string | null;
  qr_page_url?: string | null;
  qr_checkout_url?: string | null;
};

function gatewaySnapshot(payment: ProxyPayment) {
  return {
    provider: 'webpay',
    gatewayToken: payment.token || undefined,
    buyOrder: payment.buy_order || undefined,
    gatewayStatus: payment.status,
  };
}

function paymentError(message: string, payment: ProxyPayment) {
  return Object.assign(new Error(message), {
    gatewayAttempt: {
      ...gatewaySnapshot(payment),
      paymentId: payment.payment_id,
      amount: payment.amount,
    },
  });
}

const POLL_MS = 1200;

const PROXY_FETCH_TIMEOUT_MS = 8000;

async function proxyFetch(path: string, init?: RequestInit): Promise<Response> {
  const base = await getWebpayProxyBaseUrl();
  if (!base) {
    throw new Error('Webpay proxy no configurado');
  }
  const url = `${base}${path}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), PROXY_FETCH_TIMEOUT_MS);
  if (init?.signal) {
    if (init.signal.aborted) {
      ctrl.abort(init.signal.reason);
    } else {
      init.signal.addEventListener('abort', () => ctrl.abort(init.signal?.reason), {
        once: true,
      });
    }
  }
  try {
    return await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

function isFinalStatus(status: string) {
  return status === 'approved' || status === 'declined' || status === 'cancelled';
}

async function cancelPaymentOnProxy(paymentId: string): Promise<void> {
  try {
    await proxyFetch(`/payments/webpay/${paymentId}/cancel`, { method: 'POST', body: '{}' });
  } catch {
    // El poll puede igualmente ver cancelled si el proxy respondió.
  }
}

function abortReason(signal: AbortSignal | undefined): string {
  if (!signal?.aborted) return '';
  const reason = signal.reason;
  if (reason === 'timeout' || reason === 'WEBPAY_TIMEOUT') return 'timeout';
  return 'cancel';
}

async function fetchQrCheckoutPayload(paymentId: string): Promise<WebpayQrCheckoutPayload> {
  const res = await proxyFetch(`/payments/webpay/${paymentId}/qr.json`);
  const text = await res.text();
  let payload: WebpayQrCheckoutPayload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(`Webpay qr.json inválido: ${text.slice(0, 180)}`);
  }
  if (!res.ok) {
    throw new Error(`Webpay qr.json HTTP ${res.status}`);
  }
  return payload;
}

/**
 * COD-04 / HU-03 — Webpay vía proxy Capstone (SQLite + sandbox o Chimuelo).
 * Sin credenciales Transbank en la app.
 */
export class WebpayPaymentGateway implements IPaymentGateway {
  readonly id = 'webpay' as const;
  readonly displayName = 'Webpay';

  /**
   * En __DEV__: si el proxy responde /health, se considera disponible.
   * En release: requiere WEBPAY_PROXY_BASE_URL configurado + health OK.
   */
  async isAvailable(): Promise<boolean> {
    if (!(await isWebpayProxyConfigured())) {
      return false;
    }
    try {
      const res = await proxyFetch('/health');
      if (!res.ok) return false;
      const body = await res.json();
      return Boolean(body?.ok);
    } catch {
      return false;
    }
  }

  async startCardPayment(request: PaymentCardRequest): Promise<PaymentCardResult> {
    if (!(await isWebpayProxyConfigured())) {
      throw new Error('Webpay proxy no configurado');
    }

    const createRes = await proxyFetch('/payments/webpay/create', {
      method: 'POST',
      body: JSON.stringify({
        amount: Math.round(request.amount),
        tip: Math.round(request.tip ?? 0),
        method: request.method,
        sale_id: `dpay-${Date.now()}`,
        source_name: request.sourceName || 'D-PAY',
        source_version: request.sourceVersion,
        idempotency_key: `dpay-${request.amount}-${request.method}-${Date.now()}`,
      }),
    });

    const createdText = await createRes.text();
    let created: ProxyPayment & { error?: { message?: string } };
    try {
      created = JSON.parse(createdText);
    } catch {
      throw new Error(`Webpay create inválido: ${createdText.slice(0, 180)}`);
    }

    if (!createRes.ok) {
      throw new Error(created?.error?.message || `Webpay create HTTP ${createRes.status}`);
    }

    // Si el proxy ya dejó el pago en estado final (simulate), no abrir browser
    let finalPayment: ProxyPayment = created;
    if (!isFinalStatus(created.status)) {
      if (request.presentWebpayQrCheckout) {
        const qrPayload = await fetchQrCheckoutPayload(created.payment_id);
        request.presentWebpayQrCheckout(qrPayload);
      } else {
        const checkoutUrl =
          created.provider === 'webpayplus' && created.qr_page_url
            ? created.qr_page_url
            : created.redirect_url;
        if (checkoutUrl) {
          const canOpen = await Linking.canOpenURL(checkoutUrl);
          if (!canOpen) {
            throw new Error(`No se puede abrir checkout Webpay: ${checkoutUrl}`);
          }
          await Linking.openURL(checkoutUrl);
        }
      }
      finalPayment = await this.waitForFinalStatus(created.payment_id, request.signal);
    }

    if (finalPayment.status === 'cancelled') {
      throw paymentError('WEBPAY_CANCELLED: pago cancelado por el usuario', finalPayment);
    }

    if (finalPayment.status === 'declined') {
      return {
        success: false,
        transactionStatus: false,
        sequenceNumber: finalPayment.payment_id,
        authCode: undefined,
        last4: finalPayment.last4 || '0000',
        transactionTip: request.tip ?? 0,
        transactionCashback: 0,
        printerVoucherCommerce: false,
        ...gatewaySnapshot(finalPayment),
        rawTuuRequest: {
          provider: 'webpay',
          amount: request.amount,
          payment_id: finalPayment.payment_id,
          token: finalPayment.token,
          buy_order: finalPayment.buy_order,
          status: finalPayment.status,
        },
      };
    }

    if (finalPayment.status !== 'approved') {
      throw paymentError(
        `WEBPAY_TIMEOUT: estado final inesperado (${finalPayment.status})`,
        finalPayment,
      );
    }

    return {
      success: true,
      transactionStatus: true,
      sequenceNumber: finalPayment.payment_id,
      authCode: finalPayment.auth_code || undefined,
      last4: finalPayment.last4 || undefined,
      transactionTip: request.tip ?? 0,
      transactionCashback: 0,
      printerVoucherCommerce: false,
      ...gatewaySnapshot(finalPayment),
      rawTuuRequest: {
        provider: 'webpay',
        amount: request.amount,
        payment_id: finalPayment.payment_id,
        token: finalPayment.token,
        buy_order: finalPayment.buy_order,
        status: finalPayment.status,
      },
    };
  }

  private async waitForFinalStatus(
    paymentId: string,
    signal?: AbortSignal,
  ): Promise<ProxyPayment> {
    const started = Date.now();
    while (Date.now() - started < WEBPAY_CHECKOUT_TIMEOUT_MS) {
      if (signal?.aborted) {
        await cancelPaymentOnProxy(paymentId);
        const reason = abortReason(signal);
        if (reason === 'timeout') {
          throw paymentError(
            `WEBPAY_TIMEOUT: ${webpayCheckoutTimeoutErrorDetail()}`,
            { payment_id: paymentId, status: 'timeout', amount: 0 },
          );
        }
        throw paymentError('WEBPAY_CANCELLED: pago cancelado por el usuario', {
          payment_id: paymentId,
          status: 'cancelled',
          amount: 0,
        });
      }

      const res = await proxyFetch(`/payments/webpay/${paymentId}/status`);
      const text = await res.text();
      let payment: ProxyPayment;
      try {
        payment = JSON.parse(text);
      } catch {
        throw new Error(`Webpay status inválido: ${text.slice(0, 180)}`);
      }
      if (!res.ok) {
        throw new Error(`Webpay status HTTP ${res.status}`);
      }
      if (isFinalStatus(payment.status)) {
        return payment;
      }
      await sleep(POLL_MS);
    }

    await cancelPaymentOnProxy(paymentId);
    throw paymentError(
      `WEBPAY_TIMEOUT: ${webpayCheckoutTimeoutErrorDetail()}`,
      { payment_id: paymentId, status: 'timeout', amount: 0 },
    );
  }

  async cancelCardPayment(): Promise<void> {
    // La UI aborta `request.signal`; el proxy marca la transacción cancelled.
  }
}

export const webpayPaymentGateway = new WebpayPaymentGateway();
