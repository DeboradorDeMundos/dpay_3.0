import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';
import type { PaymentIntent } from '../services/paymentHubService';

const storage = new MMKV({ id: 'payment-hub-storage' });

interface PaymentHubState {
  gatewayModeEnabled: boolean;
  serverExternalPaymentEnabled: boolean;
  terminalSerial: string;
  deviceFingerprint: string;
  terminalCode: string;
  activeIntent: PaymentIntent | null;
  incomingIntent: PaymentIntent | null;
  connectionStatus: 'online' | 'offline';
  lastHeartbeatAt: string | null;
  setGatewayModeEnabled: (enabled: boolean) => void;
  setServerExternalPaymentEnabled: (enabled: boolean) => void;
  setTerminalSerial: (serial: string) => void;
  setDeviceFingerprint: (fingerprint: string) => void;
  setTerminalCode: (code: string) => void;
  setActiveIntent: (intent: PaymentIntent | null) => void;
  setIncomingIntent: (intent: PaymentIntent | null) => void;
  setConnectionStatus: (status: 'online' | 'offline') => void;
  setLastHeartbeatAt: (value: string | null) => void;
  loadFromStorage: () => void;
  resetTerminalBinding: () => void;
  clear: () => void;
}

export const usePaymentHubStore = create<PaymentHubState>((set) => ({
  gatewayModeEnabled: false,
  serverExternalPaymentEnabled: false,
  terminalSerial: '',
  deviceFingerprint: '',
  terminalCode: '',
  activeIntent: null,
  incomingIntent: null,
  connectionStatus: 'offline',
  lastHeartbeatAt: null,

  setGatewayModeEnabled: (enabled) => {
    storage.set('gatewayModeEnabled', enabled);
    set({ gatewayModeEnabled: enabled });
  },

  setServerExternalPaymentEnabled: (enabled) => {
    storage.set('serverExternalPaymentEnabled', enabled);
    set({ serverExternalPaymentEnabled: enabled });
  },

  setTerminalSerial: (serial) => {
    storage.set('terminalSerial', serial);
    set({ terminalSerial: serial });
  },

  setDeviceFingerprint: (fingerprint) => {
    storage.set('deviceFingerprint', fingerprint);
    set({ deviceFingerprint: fingerprint });
  },

  setTerminalCode: (code) => {
    storage.set('terminalCode', code);
    set({ terminalCode: code });
  },

  setActiveIntent: (intent) => {
    set({ activeIntent: intent });
  },

  setIncomingIntent: (intent) => {
    set({ incomingIntent: intent });
  },

  setConnectionStatus: (status) => {
    set({ connectionStatus: status });
  },

  setLastHeartbeatAt: (value) => {
    set({ lastHeartbeatAt: value });
  },

  loadFromStorage: () => {
    set({
      gatewayModeEnabled: storage.getBoolean('gatewayModeEnabled') ?? false,
      serverExternalPaymentEnabled: storage.getBoolean('serverExternalPaymentEnabled') ?? false,
      terminalSerial: storage.getString('terminalSerial') ?? '',
      deviceFingerprint: storage.getString('deviceFingerprint') ?? '',
      terminalCode: storage.getString('terminalCode') ?? '',
    });
  },

  resetTerminalBinding: () => {
    storage.delete('terminalSerial');
    storage.delete('deviceFingerprint');
    storage.delete('terminalCode');
    storage.delete('serverExternalPaymentEnabled');
    set({
      terminalSerial: '',
      deviceFingerprint: '',
      terminalCode: '',
      connectionStatus: 'offline',
      lastHeartbeatAt: null,
      serverExternalPaymentEnabled: false,
      activeIntent: null,
      incomingIntent: null,
    });
  },

  clear: () => {
    storage.delete('gatewayModeEnabled');
    storage.delete('serverExternalPaymentEnabled');
    storage.delete('terminalSerial');
    storage.delete('deviceFingerprint');
    storage.delete('terminalCode');
    set({
      gatewayModeEnabled: false,
      serverExternalPaymentEnabled: false,
      terminalSerial: '',
      deviceFingerprint: '',
      terminalCode: '',
      activeIntent: null,
      incomingIntent: null,
      connectionStatus: 'offline',
      lastHeartbeatAt: null,
    });
  },
}));
