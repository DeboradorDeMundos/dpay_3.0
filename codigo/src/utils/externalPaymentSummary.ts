import type { PaymentIntent, PaymentIntentDocumentLine, PaymentIntentDisplaySummary } from '../services/paymentHubService';
import { extraPrintLines } from './extraPrint';
import { formatCurrency } from './format';

export const INTEGRATED_CLOUD_LABEL = 'Integrado Cloud';

export interface ExternalPaymentLine {
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export type ExternalFlowType = 'payment_only' | 'with_document' | 'print_only';
export type ExternalPaymentMethod = 'card' | 'cash';

export interface ExternalPaymentDisplay {
  title: string;
  subtitle: string;
  amount: number;
  description: string;
  flowType: ExternalFlowType;
  paymentMethod: ExternalPaymentMethod;
  initiatedBy?: string;
  fromPartner: boolean;
  externalId?: string;
  terminalCode?: string;
  customerRut?: string;
  customerName?: string;
  documentTypeLabel?: string;
  documentReference?: string;
  lines: ExternalPaymentLine[];
  documentTotal?: number;
  lineCount: number;
  extraPrintLines?: string[];
}

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const asString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

export const resolveIntentFlowType = (intent: PaymentIntent): ExternalFlowType => {
  const meta = asRecord(intent.metadata);
  const raw =
    asString(intent.flow_type) ||
    asString(meta.flow_type) ||
    asString((intent.display_summary as Record<string, unknown> | undefined)?.flow_type) ||
    'payment_only';
  if (raw === 'print_only') return 'print_only';
  if (raw === 'with_document') return 'with_document';
  return 'payment_only';
};

export const resolveIntentPaymentMethod = (intent: PaymentIntent): ExternalPaymentMethod => {
  const meta = asRecord(intent.metadata);
  const raw =
    asString(intent.payment_method) ||
    asString(meta.payment_method) ||
    asString((intent.display_summary as Record<string, unknown> | undefined)?.payment_method) ||
    'card';
  return raw.toLowerCase() === 'cash' ? 'cash' : 'card';
};

export const resolveInitiatedByLabel = (
  metadata?: Record<string, unknown> | null,
  summary?: PaymentIntentDisplaySummary | null,
): string | undefined => {
  const meta = asRecord(metadata);
  const summaryRecord = asRecord(summary);
  const initiatedByType =
    asString(meta.initiated_by_type) || asString(summaryRecord.initiated_by_type);

  if (initiatedByType === 'partner') {
    return INTEGRATED_CLOUD_LABEL;
  }

  const raw = asString(meta.initiated_by) || asString(summary?.initiated_by);
  return raw || undefined;
};

export const isPartnerInitiatedIntent = (
  metadata?: Record<string, unknown> | null,
  summary?: PaymentIntentDisplaySummary | null,
): boolean => {
  const meta = asRecord(metadata);
  const summaryRecord = asRecord(summary);
  return (
    asString(meta.initiated_by_type) === 'partner' ||
    asString(summaryRecord.initiated_by_type) === 'partner'
  );
};

const normalizeLines = (raw: unknown): ExternalPaymentLine[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const line = asRecord(item);
      const description = asString(line.description) || asString(line.desc);
      const quantity = Number(line.quantity ?? line.qty ?? 1);
      const unitPrice = Number(line.unit_price ?? line.price ?? 0);
      const subtotal = Number(line.subtotal ?? Math.round(quantity * unitPrice));
      if (!description && unitPrice <= 0) return null;
      return {
        description: description || 'Ítem',
        quantity: quantity > 0 ? quantity : 1,
        unitPrice: unitPrice > 0 ? Math.round(unitPrice) : 0,
        subtotal: subtotal > 0 ? Math.round(subtotal) : Math.round((quantity > 0 ? quantity : 1) * unitPrice),
      };
    })
    .filter((line): line is ExternalPaymentLine => line !== null);
};

export const buildExternalPaymentDisplay = (intent: PaymentIntent): ExternalPaymentDisplay => {
  const meta = asRecord(intent.metadata);
  const summary = (intent.display_summary || intent.document_summary) as PaymentIntentDisplaySummary | null | undefined;

  const flowType = resolveIntentFlowType(intent);
  const paymentMethod = resolveIntentPaymentMethod(intent);

  const description =
    asString(intent.description) ||
    asString(meta.description) ||
    asString(summary?.description) ||
    '';

  const initiatedBy = resolveInitiatedByLabel(meta, summary);
  const fromPartner = isPartnerInitiatedIntent(meta, summary);

  const customerRut =
    asString(intent.customer_rut) ||
    asString(meta.customer_rut) ||
    asString(summary?.customer?.rut) ||
    undefined;

  const customerName =
    asString(intent.customer_name) ||
    asString(meta.customer_name) ||
    asString(summary?.customer?.name) ||
    undefined;

  const documentTypeLabel =
    asString(intent.document_type_label) ||
    asString(meta.document_type_label) ||
    asString(summary?.document_type_label) ||
    undefined;

  const documentReference =
    asString(intent.document_reference) ||
    asString(meta.document_reference) ||
    asString(summary?.document_reference) ||
    undefined;

  const lines = normalizeLines(
    intent.document_lines ?? summary?.lines ?? meta.document_lines,
  );

  const documentTotalRaw =
    Number(intent.document_total ?? summary?.document_total ?? meta.document_total ?? 0) || 0;
  const documentTotal = documentTotalRaw > 0
    ? documentTotalRaw
    : lines.reduce((sum, line) => sum + line.subtotal, 0);

  const amount = Number(intent.amount) || documentTotal || 0;

  const title =
    flowType === 'print_only'
      ? 'Impresión externa'
      : flowType === 'with_document'
        ? paymentMethod === 'cash'
          ? 'Cobro con documento (efectivo)'
          : 'Cobro con documento'
        : paymentMethod === 'cash'
          ? 'Cobro externo (efectivo)'
          : 'Cobro externo';

  let subtitle = description;
  if (!subtitle && flowType === 'with_document') {
    subtitle = [documentTypeLabel, customerName].filter(Boolean).join(' · ');
  }
  if (!subtitle) {
    subtitle = intent.external_id || (fromPartner ? `Solicitud ${INTEGRATED_CLOUD_LABEL}` : 'Solicitud desde ERP');
  }

  const epLines = extraPrintLines(intent);

  return {
    title,
    subtitle,
    amount,
    description,
    flowType,
    paymentMethod,
    initiatedBy,
    fromPartner,
    externalId: intent.external_id,
    terminalCode: intent.terminal_code,
    customerRut,
    customerName,
    documentTypeLabel,
    documentReference,
    lines,
    documentTotal: documentTotal > 0 ? documentTotal : undefined,
    lineCount: lines.length,
    extraPrintLines: epLines.length > 0 ? epLines : undefined,
  };
};

export const formatExternalPaymentBanner = (intent: PaymentIntent): { title: string; detail: string } => {
  const display = buildExternalPaymentDisplay(intent);
  const parts: string[] = [formatCurrency(display.amount)];

  if (display.flowType === 'with_document' && display.customerName) {
    parts.push(display.customerName);
  } else if (display.description) {
    parts.push(display.description);
  }

  if (display.lineCount > 0) {
    parts.push(`${display.lineCount} ítem${display.lineCount === 1 ? '' : 's'}`);
  }

  if (display.terminalCode) {
    parts.push(display.terminalCode);
  }

  return {
    title: display.title,
    detail: parts.join(' · '),
  };
};
