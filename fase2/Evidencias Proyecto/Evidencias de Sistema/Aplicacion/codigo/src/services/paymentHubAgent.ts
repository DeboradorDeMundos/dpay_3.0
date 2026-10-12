import { AppState } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { usePaymentHubStore } from '../stores/paymentHubStore';
import {
  getTerminalSerial,
  getDeviceFingerprint,
  setCachedTerminalSerial,
} from '../utils/deviceInfo';
import {
  fetchPendingIntent,
  registerTerminal,
  sendHeartbeat,
  type PaymentIntent,
} from './paymentHubService';

let lastHeartbeatMs = 0;
let lastPollMs = 0;
let handlingIntentId: number | null = null;

const HEARTBEAT_INTERVAL_MS = 30000;
const POLL_INTERVAL_MS = 5000;

async function getDeviceKey(): Promise<string> {
  const { deviceFingerprint } = usePaymentHubStore.getState();
  if (deviceFingerprint) {
    return deviceFingerprint;
  }
  const fp = await getDeviceFingerprint();
  usePaymentHubStore.getState().setDeviceFingerprint(fp);
  return fp;
}

function resolveIntentFlowType(raw: PaymentIntent): string {
  const meta = raw.metadata && typeof raw.metadata === 'object'
    ? raw.metadata as Record<string, unknown>
    : {};
  const value =
    raw.flow_type ||
    meta.flow_type ||
    raw.display_summary?.flow_type ||
    'payment_only';
  return String(value).trim().toLowerCase();
}

function normalizeIntent(raw: PaymentIntent | null | undefined): PaymentIntent | null {
  if (!raw?.id) return null;
  const amount = Number(raw.amount);
  const flowType = resolveIntentFlowType(raw);

  if (flowType === 'print_only') {
    if (!Number.isFinite(amount) || amount < 0) return null;
  } else if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  let metadata = raw.metadata;
  if (typeof metadata === 'string') {
    try {
      metadata = JSON.parse(metadata) as Record<string, unknown>;
    } catch {
      metadata = {};
    }
  }

  return {
    ...raw,
    amount,
    metadata: metadata && typeof metadata === 'object' ? metadata : {},
    description: raw.description || (metadata as Record<string, unknown>)?.description as string | undefined,
  };
}

function applyTerminalServerFlags(terminal?: { external_payment_enabled?: boolean }) {
  if (!terminal || typeof terminal.external_payment_enabled !== 'boolean') {
    return;
  }
  usePaymentHubStore.getState().setServerExternalPaymentEnabled(terminal.external_payment_enabled);
}

async function pulseTerminalHeartbeat(): Promise<boolean> {
  const { activeIntent, setConnectionStatus, setLastHeartbeatAt } = usePaymentHubStore.getState();

  try {
    const deviceKey = await getDeviceKey();
    const connectionStatus = activeIntent ? 'busy' : 'online';
    const hb = await sendHeartbeat(deviceKey, connectionStatus);

    if (hb?.success && hb.terminal) {
      applyTerminalServerFlags(hb.terminal);
      if (hb.terminal.external_payment_enabled === false) {
        setConnectionStatus('offline');
        return false;
      }
      setConnectionStatus('online');
      setLastHeartbeatAt(new Date().toISOString());
      return true;
    }
  } catch {
    setConnectionStatus('offline');
  }

  return false;
}

export const PaymentHubAgent = {
  /** Fuerza consulta al servidor (p. ej. al reabrir la app). */
  async refreshTerminalState(): Promise<boolean> {
    const { token, gatewayModeEnabled } = usePaymentHubStore.getState();
    if (!token || !gatewayModeEnabled) {
      return false;
    }

    lastHeartbeatMs = Date.now();
    return pulseTerminalHeartbeat();
  },

  async runIfNeeded() {
    const { token } = useAuthStore.getState();
    const {
      gatewayModeEnabled,
      serverExternalPaymentEnabled,
      activeIntent,
      incomingIntent,
      setConnectionStatus,
      setLastHeartbeatAt,
      setIncomingIntent,
    } = usePaymentHubStore.getState();

    if (!token || !gatewayModeEnabled) {
      return;
    }

    const now = Date.now();
    const shouldPulseHeartbeat =
      !serverExternalPaymentEnabled || now - lastHeartbeatMs >= HEARTBEAT_INTERVAL_MS;

    if (shouldPulseHeartbeat) {
      lastHeartbeatMs = now;
      try {
        const deviceKey = await getDeviceKey();
        const connectionStatus = activeIntent ? 'busy' : 'online';
        const hb = await sendHeartbeat(deviceKey, connectionStatus);
        if (hb?.success && hb.terminal) {
          applyTerminalServerFlags(hb.terminal);
          if (hb.terminal.external_payment_enabled === false) {
            setConnectionStatus('offline');
            return;
          }
          setConnectionStatus('online');
          setLastHeartbeatAt(new Date().toISOString());
        }
      } catch {
        setConnectionStatus('offline');
      }
    }

    if (!usePaymentHubStore.getState().serverExternalPaymentEnabled) {
      return;
    }

    if (activeIntent || incomingIntent || handlingIntentId) {
      return;
    }

    if (now - lastPollMs < POLL_INTERVAL_MS) {
      return;
    }
    lastPollMs = now;

    try {
      const deviceKey = await getDeviceKey();
      const pending = await fetchPendingIntent(deviceKey);

      if (pending && typeof pending.external_payment_enabled === 'boolean') {
        applyTerminalServerFlags({ external_payment_enabled: pending.external_payment_enabled });
        if (!pending.external_payment_enabled) {
          setConnectionStatus('offline');
          return;
        }
      }

      const intent = normalizeIntent(pending?.intent);
      if (!intent) {
        return;
      }

      handlingIntentId = intent.id;
      setIncomingIntent(intent);

      if (AppState.currentState !== 'active') {
        console.log('[PaymentHubAgent] Cobro en cola (app en background/bloqueada):', intent.id);
      }
    } catch (error) {
      console.error('[PaymentHubAgent] Error polling pending intents:', error);
    }
  },

  clearHandlingIntent() {
    handlingIntentId = null;
    const store = usePaymentHubStore.getState();
    store.setActiveIntent(null);
    store.setIncomingIntent(null);
  },

  releaseHandlingLock() {
    handlingIntentId = null;
  },

  async ensureRegistered(displayName?: string, terminalCodeOverride?: string, hardwareSerialOverride?: string) {
    const hardwareSerial = (hardwareSerialOverride || (await getTerminalSerial())).trim();
    const fingerprint = await getDeviceFingerprint();

    if (fingerprint === 'DPAY-UNKNOWN') {
      throw new Error(
        'No se pudo leer el identificador del dispositivo. '
        + 'Verifique que la app tenga los permisos necesarios e intente de nuevo.',
      );
    }

    const storedCode = (terminalCodeOverride || usePaymentHubStore.getState().terminalCode || '').trim();

    usePaymentHubStore.getState().setDeviceFingerprint(fingerprint);

    const payload: Parameters<typeof registerTerminal>[0] = {
      device_fingerprint: fingerprint,
      display_name: displayName || 'Terminal D-PAY',
      ...(storedCode ? { terminal_code: storedCode } : {}),
    };
    if (hardwareSerial) {
      payload.serial_number = hardwareSerial;
    }

    console.log('[PaymentHubAgent] registerTerminal', {
      terminal_code: storedCode || '(sin código)',
      serial_number: hardwareSerial || '(sin serial hardware)',
      device_fingerprint: fingerprint,
    });

    const result = await registerTerminal(payload);

    if (result?.terminal) {
      const canonicalSerial = result.terminal.serial_number;
      setCachedTerminalSerial(canonicalSerial);
      usePaymentHubStore.getState().setTerminalSerial(canonicalSerial);
      usePaymentHubStore.getState().setTerminalCode(result.terminal.terminal_code);
      applyTerminalServerFlags(result.terminal);

      try {
        await sendHeartbeat(fingerprint, 'online');
        usePaymentHubStore.getState().setConnectionStatus('online');
      } catch {
        // registerTerminal ya puede haber marcado online en el servidor
      }
    }
    return result;
  },
};

export type { PaymentIntent };
