import type { TuuPaymentResponse } from '../services/tuuPayment';

/** Perfil de hardware para routing de pasarelas (HU-01). */
export type DevicePaymentProfile = 'TUU_KOZEN' | 'GENERIC_MOBILE';

/** Identificadores de pasarela registradas en factory (HU-02). */
export type GatewayProviderId = 'tuu' | 'webpay' | 'mock';

export type CardPaymentMethod = 'credit' | 'debit';

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
}

/** Contrato común de pasarela (adapter/strategy). */
export interface IPaymentGateway {
  readonly id: GatewayProviderId;
  readonly displayName: string;
  isAvailable(): Promise<boolean>;
  startCardPayment(request: PaymentCardRequest): Promise<PaymentCardResult>;
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
