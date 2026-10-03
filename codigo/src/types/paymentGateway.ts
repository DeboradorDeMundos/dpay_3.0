import type { TuuPaymentResponse } from '../services/tuuPayment';

/** Perfil de hardware para routing de pasarelas (HU-01). */
export type DevicePaymentProfile = 'TUU_KOZEN' | 'GENERIC_MOBILE';

/** Identificadores de pasarela registradas en factory (HU-02). */
export type GatewayProviderId = 'tuu' | 'webpay' | 'mock';

export type CardPaymentMethod = 'credit' | 'debit';

/** Payload GET /payments/webpay/:id/qr.json (checkout QR Capstone). */
export interface WebpayQrCheckoutPayload {
  payment_id: string;
  provider: string;
  amount: number;
  buy_order?: string;
  checkout_url: string;
  qr_page_url: string;
  qr_data_url: string;
  test_cards: Array<{ label: string; pan: string; cvv: string; exp: string }>;
  instructions: string;
}

/** Payload agnóstico de cobro con tarjeta hacia cualquier gateway. */
export interface PaymentCardRequest {
  amount: number;
  tip?: number;
  method: CardPaymentMethod;
  dteType: number;
  netAmount: number;
  exemptAmount: number;
  sourceName?: string;
  sourceVersion?: string;
  /** Webpay: muestra QR en la app; si no se define, abre qr_page_url en el navegador. */
  presentWebpayQrCheckout?: (payload: WebpayQrCheckoutPayload) => void;
  /** Webpay: cancelar espera (botón cancelar o timeout 5 min en UI). */
  signal?: AbortSignal;
}

export interface PaymentCardResult {
  success: boolean;
  transactionStatus: boolean;
  sequenceNumber: string;
  authCode?: string;
  last4?: string;
  transactionTip?: number;
  transactionCashback?: number;
  printerVoucherCommerce?: boolean;
  /** Respuesta cruda TUU para persistencia en `Sale.tuuPaymentData`. */
  rawTuuResponse?: TuuPaymentResponse;
  rawTuuRequest?: Record<string, unknown>;
  /** COD-06: datos de pasarela para persistir en la venta o en el registro de fallos. */
  provider?: string;
  gatewayToken?: string;
  buyOrder?: string;
  gatewayStatus?: string;
}

/** Contrato común de pasarela (adapter/strategy). */
export interface IPaymentGateway {
  readonly id: GatewayProviderId;
  readonly displayName: string;
  isAvailable(): Promise<boolean>;
  startCardPayment(request: PaymentCardRequest): Promise<PaymentCardResult>;
  /** Opcional — TUU/Webpay pueden implementar cancelación externa. */
  cancelCardPayment?(): Promise<void>;
}

export interface DeviceProfileDetectionResult {
  profile: DevicePaymentProfile;
  availableGatewayIds: GatewayProviderId[];
  tuuAppInstalled: boolean;
  hardwareSerial: string;
  brand: string;
  model: string;
  detectedAt: string;
}
