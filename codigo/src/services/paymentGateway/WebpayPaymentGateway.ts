import type {
  IPaymentGateway,
  PaymentCardRequest,
  PaymentCardResult,
} from '../../types/paymentGateway';

/**
 * COD-04 / HU-03 — stub Webpay (sandbox vía backend Dtemite).
 * Sin credenciales Transbank en app. isAvailable() = false hasta backend listo.
 */
export class WebpayPaymentGateway implements IPaymentGateway {
  readonly id = 'webpay' as const;
  readonly displayName = 'Webpay';

  async isAvailable(): Promise<boolean> {
    // Activar cuando exista POST /payments/webpay/create en API Dtemite + flag de entorno
    return false;
  }

  async startCardPayment(_request: PaymentCardRequest): Promise<PaymentCardResult> {
    throw new Error(
      'Webpay sandbox pendiente (COD-04): requiere backend proxy Dtemite. Use mock en __DEV__.',
    );
  }

  async cancelCardPayment(): Promise<void> {
    // WebView / redirect cancel — implementar con HU-03
  }
}

export const webpayPaymentGateway = new WebpayPaymentGateway();
