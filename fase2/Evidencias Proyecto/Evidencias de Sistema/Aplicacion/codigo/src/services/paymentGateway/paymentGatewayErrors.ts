import { classifyTuuError, parseTuuError } from '../tuuPayment';
import type { GatewayProviderId } from '../../types/paymentGateway';
import { webpayCheckoutTimeoutUserMessage } from './webpayCheckoutConstants';

export function classifyCardPaymentError(error: unknown, gatewayId: GatewayProviderId) {
  if (gatewayId === 'tuu') {
    return classifyTuuError(error);
  }
  const message = error instanceof Error ? error.message : String(error);

  if (gatewayId === 'webpay') {
    if (message.includes('WEBPAY_TIMEOUT')) {
      return {
        category: 'ERROR_RED' as const,
        code: 'WEBPAY_TIMEOUT',
        title: 'Tiempo agotado',
        message: webpayCheckoutTimeoutUserMessage(),
        isRetryable: true,
      };
    }
    if (message.includes('WEBPAY_CANCELLED')) {
      return {
        category: 'CANCELADO_USUARIO' as const,
        code: 'WEBPAY_CANCELLED',
        title: 'Cobro cancelado',
        message: 'El cobro con Webpay fue cancelado. Puede intentar de nuevo o elegir otro medio de pago.',
        isRetryable: true,
      };
    }
    if (message.includes('declined') || message.includes('rechaz')) {
      return {
        category: 'RECHAZADO_BANCO' as const,
        code: 'WEBPAY_DECLINED',
        title: 'Pago rechazado',
        message: 'El banco o Transbank rechazó la transacción.',
        isRetryable: true,
      };
    }
  }
  if (message.includes('MOCK_TIMEOUT') || message.includes('timeout')) {
    return {
      category: 'ERROR_RED' as const,
      code: 'MOCK_TIMEOUT',
      title: 'Tiempo agotado',
      message: 'La pasarela simulada no respondió a tiempo.',
      isRetryable: true,
    };
  }
  if (message.includes('MOCK') || message.includes('rechaz')) {
    return {
      category: 'RECHAZADO_BANCO' as const,
      code: 'MOCK_DECLINED',
      title: 'Pago rechazado',
      message: message,
      isRetryable: false,
    };
  }
  return {
    category: 'ERROR_DESCONOCIDO' as const,
    code: 'GATEWAY_ERROR',
    title: 'Error de pago',
    message,
    isRetryable: false,
  };
}

export function parseCardPaymentError(error: unknown, gatewayId: GatewayProviderId) {
  if (gatewayId === 'tuu') {
    return parseTuuError(error);
  }
  const classified = classifyCardPaymentError(error, gatewayId);
  const message = error instanceof Error ? error.message : String(error);
  const webpayReturnToCheckout =
    gatewayId === 'webpay' &&
    (message.includes('WEBPAY_TIMEOUT') || message.includes('WEBPAY_CANCELLED'));
  return {
    title: classified.title,
    message: classified.message,
    isCancellable: webpayReturnToCheckout || classified.isRetryable === true,
  };
}
