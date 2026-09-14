import { classifyTuuError, parseTuuError } from '../tuuPayment';
import type { GatewayProviderId } from '../../types/paymentGateway';

export function classifyCardPaymentError(error: unknown, gatewayId: GatewayProviderId) {
  if (gatewayId === 'tuu') {
    return classifyTuuError(error);
  }
  const message = error instanceof Error ? error.message : String(error);
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
  return {
    title: classified.title,
    message: classified.message,
    isCancellable: false,
  };
}
