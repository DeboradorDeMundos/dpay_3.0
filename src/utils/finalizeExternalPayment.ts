import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import type { PaymentIntent, CompleteIntentPayload } from '../services/paymentHubService';
import { completeIntent } from '../services/paymentHubService';
import type { Sale } from '../types/common';
import { calculateTotalsByDocType } from '../services/api';
import { mapDocTypeToTuu } from '../constants/dte';
import {
  buildExternalPaymentSale,
  extractDpayTransactionId,
  parseExternalDocumentTypeId,
  buildExternalSaleItems,
} from './buildExternalPaymentSale';
import { resolveIntentFlowType } from './externalPaymentSummary';
import { runExternalExtraPrintOnly } from './externalPaymentPrinting';
import { useMySalesStore } from '../stores/mySalesStore';
import { APP_VERSION } from '../constants/appVersion';

interface PrinterOpts {
  printExtraTicket: (data: {
    showLogo: boolean;
    systemName: string;
    lines: string[];
  }) => Promise<void>;
  selectedPrinter: { address: string } | null;
}

interface FinalizeExternalPaymentParams {
  intent: PaymentIntent;
  deviceKey: string;
  tuuPaymentData: NonNullable<Sale['tuuPaymentData']>;
  completePayload: Omit<CompleteIntentPayload, 'serial_number' | 'transaction_status' | 'monto'>;
  emitirDocumento: boolean;
  autoSync: boolean;
  automaticPrinting: boolean;
  user: {
    usuario?: string;
    user?: string;
    nombre?: string;
    empresa?: { rut?: string };
  } | null;
  navigation: NativeStackNavigationProp<RootStackParamList, 'ExternalPayment'>;
  printer: PrinterOpts;
  onPrintStatus?: (status: string | null) => void;
  onCompleted?: () => void;
}

export const computeExternalPaymentContext = (
  intent: PaymentIntent,
  emitirDocumento: boolean,
) => {
  const flowType = resolveIntentFlowType(intent);
  const rawDocType = parseExternalDocumentTypeId(intent, flowType);
  const documentType =
    flowType === 'with_document' && emitirDocumento && rawDocType > 0 ? rawDocType : 0;
  const saleItems = buildExternalSaleItems(intent);
  const amount = Number(intent.amount) || saleItems.reduce((sum, item) => sum + item.total, 0);
  const [neto, exento, iva, total] = calculateTotalsByDocType(saleItems, documentType);
  const shouldEmitDte =
    flowType === 'with_document' && emitirDocumento && rawDocType > 0;

  return {
    flowType,
    documentType,
    rawDocType,
    saleItems,
    amount,
    neto,
    exento,
    iva,
    total,
    shouldEmitDte,
    tuuDteType: documentType > 0 ? mapDocTypeToTuu(documentType) : 99,
  };
};

export async function finalizeExternalPayment({
  intent,
  deviceKey,
  tuuPaymentData,
  completePayload,
  emitirDocumento,
  autoSync,
  automaticPrinting,
  user,
  navigation,
  printer,
  onPrintStatus,
  onCompleted,
}: FinalizeExternalPaymentParams): Promise<void> {
  const ctx = computeExternalPaymentContext(intent, emitirDocumento);
  const shouldSyncDte = ctx.shouldEmitDte && autoSync;

  let sale = buildExternalPaymentSale({
    intent,
    tuuPaymentData: { ...tuuPaymentData, syncedToBackend: false },
    user,
    documentTypeOverride: ctx.documentType,
    syncStatus: shouldSyncDte ? 'pending' : 'synced',
  });

  useMySalesStore.getState().addSale(sale);

  if (shouldSyncDte) {
    try {
      await useMySalesStore.getState().syncSale(sale.id);
      sale = useMySalesStore.getState().getSaleById(sale.id) || sale;
    } catch (syncError) {
      console.error('[ExternalPayment] Error sincronizando DTE externo:', syncError);
    }
  }

  const completeResult = await completeIntent(intent.id, {
    serial_number: deviceKey,
    transaction_status: true,
    monto: ctx.amount,
    ...completePayload,
    net_amount: ctx.neto,
    exempt_amount: ctx.exento,
    propina: tuuPaymentData.response.transactionTip || 0,
    cashback: tuuPaymentData.response.transactionCashback || 0,
    cuotas: tuuPaymentData.request.installmentsQuantity ?? 0,
    folio_dte: sale.folio,
    tipo_dte: sale.documentType && sale.documentType > 0 ? sale.documentType : undefined,
    source_name: 'D-PAY',
    source_version: APP_VERSION,
    usuario: user?.usuario || user?.user || 'D-PAY',
    request_json: {
      payment_intent_id: intent.id,
      external_id: intent.external_id,
      flow_type: ctx.flowType,
      ...(typeof completePayload.request_json === 'object' && completePayload.request_json
        ? completePayload.request_json
        : {}),
    },
  });

  const dpayTransactionId = extractDpayTransactionId(completeResult);
  const refreshedSale = useMySalesStore.getState().getSaleById(sale.id) || sale;
  useMySalesStore.getState().updateSale(sale.id, {
    dpayTransactionId,
    folio: refreshedSale.folio,
    id_documento: refreshedSale.id_documento,
    ted: refreshedSale.ted,
    tuuPaymentData: { ...tuuPaymentData, syncedToBackend: true },
    syncStatus: refreshedSale.folio ? 'synced' : refreshedSale.syncStatus,
    syncedAt: refreshedSale.folio ? new Date().toISOString() : refreshedSale.syncedAt,
  });

  onPrintStatus?.('Imprimiendo ticket adicional...');
  await runExternalExtraPrintOnly({ intent, printer });
  onPrintStatus?.(null);

  onCompleted?.();
  navigation.replace('ViewInvoice', {
    saleId: sale.id,
    printInvoice: automaticPrinting,
    blockBackPress: true,
  });
}
