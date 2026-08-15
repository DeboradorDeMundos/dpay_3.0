import { apiClient, PAYMENT_HUB_API_BASE_URL } from './apiClient';

const hub = (endpoint: string, options: Parameters<typeof apiClient>[1] = {}) =>
  apiClient(endpoint, { ...options, baseUrl: PAYMENT_HUB_API_BASE_URL });

export interface PaymentIntentDocumentLine {
  description: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface PaymentIntentExtraPrintLine {
  index: number;
  text: string;
}

export interface PaymentIntentExtraPrint {
  enabled: boolean;
  show_logo: boolean;
  system_name: string;
  lines: PaymentIntentExtraPrintLine[];
}

export interface PaymentIntentDisplaySummary {
  flow_type?: 'payment_only' | 'with_document' | 'print_only';
  payment_method?: 'card' | 'cash';
  description?: string;
  initiated_by?: string | null;
  document_type?: string;
  document_type_label?: string;
  document_reference?: string;
  document_total?: number;
  amount?: number;
  line_count?: number;
  customer?: {
    rut?: string;
    name?: string;
  };
  lines?: PaymentIntentDocumentLine[];
}

export interface PaymentIntent {
  id: number;
  status: string;
  external_id: string;
  amount: number;
  currency: string;
  terminal_code: string;
  serial_number: string;
  rut_empresa: string;
  description?: string;
  flow_type?: 'payment_only' | 'with_document' | 'print_only';
  payment_method?: 'card' | 'cash' | null;
  metadata?: Record<string, unknown>;
  document_summary?: PaymentIntentDisplaySummary | null;
  display_summary?: PaymentIntentDisplaySummary | null;
  customer_rut?: string;
  customer_name?: string;
  document_type?: string;
  document_type_label?: string;
  document_reference?: string;
  document_lines?: PaymentIntentDocumentLine[];
  document_total?: number;
  extra_print?: PaymentIntentExtraPrint | null;
  dpay_transaccion_id?: number | null;
  expires_at?: string;
  created_at?: string;
  completed_at?: string;
}

export interface CompleteIntentPayload {
  serial_number: string;
  transaction_status: boolean;
  monto: number;
  id_mediopago?: number;
  sequence_number?: string;
  codigo_autorizacion?: string;
  ultimos_digitos?: string;
  tipo_tarjeta?: string;
  propina?: number;
  cashback?: number;
  net_amount?: number;
  exempt_amount?: number;
  folio_dte?: number;
  tipo_dte?: number;
  cuotas?: number;
  response_code?: string;
  detalle_error?: string;
  request_json?: object;
  response_json?: object;
  source_name?: string;
  source_version?: string;
  usuario?: string;
}

export async function registerTerminal(data: {
  serial_number?: string;
  device_fingerprint?: string;
  display_name?: string;
  terminal_code?: string;
  branch_name?: string;
}): Promise<{ success: boolean; terminal?: { id: number; terminal_code: string; serial_number: string; display_name?: string; external_payment_enabled: boolean }; mensaje?: string }> {
  const response = await hub('/paymenthub/terminals/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function sendHeartbeat(serialNumber: string, connectionStatus: 'online' | 'offline' | 'busy' = 'online') {
  const response = await hub('/paymenthub/terminal/heartbeat', {
    method: 'POST',
    body: JSON.stringify({ serial_number: serialNumber, connection_status: connectionStatus }),
  });
  return response.json();
}

export async function fetchPendingIntent(serialNumber: string): Promise<{ success: boolean; intent: PaymentIntent | null; external_payment_enabled?: boolean }> {
  const response = await hub(
    `/paymenthub/intents/pending?serial_number=${encodeURIComponent(serialNumber)}`,
    { method: 'GET' },
  );
  return response.json();
}

export async function fetchIntentStatus(intentId: number): Promise<{ success: boolean; intent: PaymentIntent }> {
  const response = await hub(`/paymenthub/intents/${intentId}`, { method: 'GET' });
  return response.json();
}

export async function claimIntent(intentId: number, serialNumber: string) {
  const response = await hub(`/paymenthub/intents/${intentId}/claim`, {
    method: 'PUT',
    body: JSON.stringify({ serial_number: serialNumber }),
  });
  return response.json();
}

export async function setProcessing(intentId: number, serialNumber: string) {
  const response = await hub(`/paymenthub/intents/${intentId}/processing`, {
    method: 'PUT',
    body: JSON.stringify({ serial_number: serialNumber }),
  });
  return response.json();
}

export async function completeIntent(intentId: number, payload: CompleteIntentPayload) {
  const response = await hub(`/paymenthub/intents/${intentId}/complete`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return response.json();
}

export async function cancelIntent(
  intentId: number,
  serialNumber: string,
  extra?: { detalle_error?: string; response_code?: string; monto?: number },
) {
  const response = await hub(`/paymenthub/intents/${intentId}/cancel`, {
    method: 'PUT',
    body: JSON.stringify({ serial_number: serialNumber, ...extra }),
  });
  return response.json();
}
