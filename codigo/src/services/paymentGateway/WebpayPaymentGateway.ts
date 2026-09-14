import { Linking } from 'react-native';
import type {
  IPaymentGateway,
  PaymentCardRequest,
  PaymentCardResult,
} from '../../types/paymentGateway';
import {
  WEBPAY_PROXY_BASE_URL,
  isWebpayProxyConfigured,
} from './webpayProxyConfig';

type ProxyPayment = {
  payment_id: string;
  status: string;
  amount: number;
  redirect_url?: string | null;
  auth_code?: string | null;
  last4?: string | null;
  token?: string | null;
};

const POLL_MS = 1200;
const POLL_TIMEOUT_MS = 180_000;

async function proxyFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = `${WEBPAY_PROXY_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  return response;
}

function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

function isFinalStatus(status: string) {
  return status === 'approved' || status === 'declined' || status === 'cancelled';
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
    if (!isWebpayProxyConfigured()) {
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
    if (!isWebpayProxyConfigured()) {
      throw new Error('Webpay proxy no configurado (WEBPAY_PROXY_BASE_URL)');
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
      if (created.redirect_url) {
        const canOpen = await Linking.canOpenURL(created.redirect_url);
        if (!canOpen) {
          throw new Error(`No se puede abrir checkout Webpay: ${created.redirect_url}`);
        }
        await Linking.openURL(created.redirect_url);
      }
      finalPayment = await this.waitForFinalStatus(created.payment_id);
    }

    if (finalPayment.status === 'cancelled') {
      throw new Error('WEBPAY_CANCELLED: pago cancelado por el usuario');
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
        rawTuuRequest: {
          provider: 'webpay',
          amount: request.amount,
          payment_id: finalPayment.payment_id,
        },
      };
    }

    if (finalPayment.status !== 'approved') {
      throw new Error(`WEBPAY_TIMEOUT: estado final inesperado (${finalPayment.status})`);
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
      rawTuuRequest: {
        provider: 'webpay',
        amount: request.amount,
        payment_id: finalPayment.payment_id,
        token: finalPayment.token,
      },
    };
  }

  private async waitForFinalStatus(paymentId: string): Promise<ProxyPayment> {
    const started = Date.now();
    while (Date.now() - started < POLL_TIMEOUT_MS) {
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
    throw new Error('WEBPAY_TIMEOUT: tiempo de espera agotado');
  }

  async cancelCardPayment(): Promise<void> {
    // El usuario cancela en el checkout sandbox / Transbank; el poll recibe cancelled.
  }
}

export const webpayPaymentGateway = new WebpayPaymentGateway();
