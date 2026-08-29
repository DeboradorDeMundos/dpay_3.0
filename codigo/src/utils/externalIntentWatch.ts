import { fetchIntentStatus, type PaymentIntent } from '../services/paymentHubService';
import { resolveIntentFlowType } from './externalPaymentSummary';

export const OPEN_INTENT_STATUSES = ['pending', 'claimed', 'processing'] as const;

export type ClosedIntentStatus = 'cancelled' | 'expired' | 'succeeded' | 'failed';

export function isIntentOpen(status: string): boolean {
  return (OPEN_INTENT_STATUSES as readonly string[]).includes(status);
}

export function isIntentClosedExternally(status: string): status is ClosedIntentStatus {
  return status === 'cancelled' || status === 'expired' || status === 'succeeded' || status === 'failed';
}

export function buildExternalIntentClosureCopy(
  intent: PaymentIntent,
  status: ClosedIntentStatus,
): { title: string; message: string } {
  const flowType = resolveIntentFlowType(intent);
  const isPrintOnly = flowType === 'print_only';
  const noun = isPrintOnly ? 'impresión' : 'cobro';
  const ref = intent.external_id ? ` (${intent.external_id})` : '';

  if (status === 'cancelled') {
    return {
      title: isPrintOnly ? 'Impresión cancelada' : 'Cobro cancelado',
      message: `La solicitud de ${noun}${ref} fue cancelada desde la integración cloud. No es necesario realizar ninguna acción en el POS.`,
    };
  }

  if (status === 'expired') {
    return {
      title: isPrintOnly ? 'Impresión expirada' : 'Cobro expirado',
      message: `La solicitud de ${noun}${ref} expiró antes de ser atendida en el terminal.`,
    };
  }

  if (status === 'succeeded') {
    return {
      title: isPrintOnly ? 'Impresión finalizada' : 'Cobro finalizado',
      message: `La solicitud de ${noun}${ref} ya fue cerrada en el servidor.`,
    };
  }

  return {
    title: isPrintOnly ? 'Impresión no disponible' : 'Cobro no disponible',
    message: `La solicitud de ${noun}${ref} ya no está disponible en el terminal.`,
  };
}

export function startIntentStatusPolling(options: {
  intentId: number;
  intervalMs?: number;
  onClosed: (intent: PaymentIntent, status: ClosedIntentStatus) => void;
}): () => void {
  const { intentId, intervalMs = 3000, onClosed } = options;
  let stopped = false;

  const tick = async () => {
    if (stopped) return;
    try {
      const result = await fetchIntentStatus(intentId);
      const intent = result?.intent;
      if (!intent?.status || stopped) return;

      if (isIntentClosedExternally(intent.status)) {
        stopped = true;
        onClosed(intent, intent.status);
      }
    } catch {
      // polling silencioso; el operador puede seguir con la acción manual
    }
  };

  void tick();
  const timer = setInterval(() => {
    void tick();
  }, intervalMs);

  return () => {
    stopped = true;
    clearInterval(timer);
  };
}
