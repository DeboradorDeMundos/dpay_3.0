import type { PaymentIntent } from '../services/paymentHubService';
import type { Sale, SaleItem } from '../types/common';
import { calculateTotalsByDocType } from '../services/api';
import {
  buildExternalPaymentDisplay,
  resolveIntentFlowType,
} from './externalPaymentSummary';

interface BuildExternalPaymentSaleParams {
  intent: PaymentIntent;
  dpayTransactionId?: number | null;
  tuuPaymentData: NonNullable<Sale['tuuPaymentData']>;
  user: {
    usuario?: string;
    user?: string;
    nombre?: string;
    empresa?: { rut?: string };
  } | null;
  documentTypeOverride?: number;
  syncStatus?: Sale['syncStatus'];
  folio?: number;
  id_documento?: number;
  ted?: string;
}

export const parseExternalDocumentTypeId = (
  intent: PaymentIntent,
  flowType: ReturnType<typeof resolveIntentFlowType>,
): number => {
  if (flowType !== 'with_document') {
    return 0;
  }

  const meta = intent.metadata && typeof intent.metadata === 'object' ? intent.metadata : {};
  const raw =
    intent.document_type ??
    (meta as Record<string, unknown>).document_type ??
    intent.display_summary?.document_type;

  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

export const buildExternalSaleItems = (intent: PaymentIntent): SaleItem[] => {
  const display = buildExternalPaymentDisplay(intent);
  const now = Date.now();

  if (display.lines.length > 0) {
    return display.lines.map((line, index) => ({
      id: `ext-item-${now}-${index}`,
      name: line.description,
      count: line.quantity,
      value: line.unitPrice,
      total: line.subtotal,
    }));
  }

  const label =
    display.description ||
    display.subtitle ||
    `Cobro externo ${intent.external_id || ''}`.trim();

  return [{
    id: `ext-item-${now}-0`,
    name: label || 'Cobro externo',
    count: 1,
    value: display.amount,
    total: display.amount,
  }];
};

export const isExternalPaymentSale = (sale: Sale | null | undefined): boolean =>
  !!sale?.id?.startsWith('ext-');

export const buildExternalPaymentSale = ({
  intent,
  dpayTransactionId,
  tuuPaymentData,
  user,
  documentTypeOverride,
  syncStatus,
  folio,
  id_documento,
  ted,
}: BuildExternalPaymentSaleParams): Sale => {
  const flowType = resolveIntentFlowType(intent);
  const documentType = documentTypeOverride ?? parseExternalDocumentTypeId(intent, flowType);
  const display = buildExternalPaymentDisplay(intent);
  const saleItems = buildExternalSaleItems(intent);
  const amount = Number(intent.amount) || display.amount || 0;
  const [neto, exento, iva, total] = calculateTotalsByDocType(saleItems, documentType);
  const nowIso = new Date().toISOString();

  const customerRut = display.customerRut;
  const customerName = display.customerName;

  const paymentMethod =
    tuuPaymentData.tipoTarjeta === 'EFECTIVO'
      ? 'Efectivo'
      : tuuPaymentData.tipoTarjeta === 'CREDITO'
        ? 'Crédito'
        : 'Débito';

  const resolvedSyncStatus = syncStatus ?? (documentType > 0 ? 'pending' : 'synced');

  return {
    id: `ext-${intent.id}-${Date.now()}`,
    results: saleItems,
    documentType,
    folio,
    ted,
    id_documento,
    client: customerRut || customerName
      ? {
          id: `ext-client-${intent.id}`,
          rut: customerRut || '66666666-6',
          name: customerName || 'PUBLICO GENERAL',
          isActive: true,
          createdAt: nowIso,
          updatedAt: nowIso,
        }
      : undefined,
    paymentMethod,
    change: 0,
    subtotal: total,
    neto,
    exento,
    iva,
    total: amount || total,
    createdAt: nowIso,
    completedAt: nowIso,
    status: 'completed',
    syncStatus: resolvedSyncStatus,
    syncedAt: resolvedSyncStatus === 'synced' ? nowIso : undefined,
    tuuTransactionId: tuuPaymentData.response.sequenceNumber,
    dpayTransactionId: dpayTransactionId ?? undefined,
    tuuPaymentData,
    issuerUserId: user?.usuario || user?.user || undefined,
    issuerUser: user?.nombre || user?.usuario || user?.user || undefined,
    issuerCompany: user?.empresa?.rut || undefined,
  };
};

export const extractDpayTransactionId = (completeResult: unknown): number | undefined => {
  if (!completeResult || typeof completeResult !== 'object') {
    return undefined;
  }

  const result = completeResult as {
    dpay_transaccion_id?: number | null;
    intent?: { dpay_transaccion_id?: number | null };
  };

  const raw = result.dpay_transaccion_id ?? result.intent?.dpay_transaccion_id;
  return typeof raw === 'number' && raw > 0 ? raw : undefined;
};
