import { APP_VERSION } from '../../constants/appVersion';
import type {
  IPaymentGateway,
  PaymentCardRequest,
  PaymentCardResult,
} from '../../types/paymentGateway';
import {
  tuuPaymentService,
  type TuuPaymentRequest,
} from '../tuuPayment';

/** Adapter TUU sobre el servicio existente (HU-02). */
export class TuuPaymentGateway implements IPaymentGateway {
  readonly id = 'tuu' as const;
  readonly displayName = 'TUU / Kozen';

  async isAvailable(): Promise<boolean> {
    return tuuPaymentService.isTuuAppInstalled();
  }

  async startCardPayment(request: PaymentCardRequest): Promise<PaymentCardResult> {
    const tuuMethod = request.method === 'credit' ? 1 : 2;
    const tuuRequest: TuuPaymentRequest = {
      amount: request.amount,
      tip: request.tip != null && request.tip > 0 ? request.tip : -1,
      cashback: -1,
      method: tuuMethod,
      installmentsQuantity: tuuMethod === 1 ? 0 : -1,
      printVoucherOnApp: false,
      dteType: request.dteType,
      extraData: {
        taxIdnValidation: '',
        exemptAmount: request.exemptAmount,
        netAmount: request.netAmount,
        sourceName: request.sourceName ?? 'D-PAY',
        sourceVersion: request.sourceVersion ?? APP_VERSION,
      },
    };

    const response = await tuuPaymentService.startPayment(tuuRequest);

    return {
      success: response.transactionStatus,
      transactionStatus: response.transactionStatus,
      sequenceNumber: response.sequenceNumber,
      authCode: response.authCode,
      last4: response.last4,
      transactionTip: response.transactionTip,
      transactionCashback: response.transactionCashback,
      printerVoucherCommerce: response.printerVoucherCommerce,
      rawTuuResponse: response,
      rawTuuRequest: tuuRequest as unknown as Record<string, unknown>,
    };
  }
}

export const tuuPaymentGateway = new TuuPaymentGateway();
