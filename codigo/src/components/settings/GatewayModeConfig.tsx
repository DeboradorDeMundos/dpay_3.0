import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  View, Text, Switch, ActivityIndicator, Alert, TextInput, TouchableOpacity,
} from 'react-native';
import { EnrollmentConfirmModal, AppModal, type EnrollmentTerminalInfo } from '../base';
import { useThemeColors } from '../../hooks/useThemeColors';
import { usePaymentHubStore } from '../../stores/paymentHubStore';
import { PaymentHubAgent } from '../../services/paymentHubAgent';
import {
  clearCachedTerminalSerial,
  clearManualTerminalSerial,
  getTerminalSerial,
  getDetectedTerminalSerial,
  getDeviceFingerprint,
  setCachedTerminalSerial,
  ensurePhoneStatePermission,
  setManualTerminalSerial,
  getManualTerminalSerial,
} from '../../utils/deviceInfo';

function extractErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as { mensaje?: string };
      if (parsed.mensaje) return parsed.mensaje;
    }
  } catch {
    // usar raw
  }
  return raw;
}

async function buildSerialModalPrefill(): Promise<string> {
  await ensurePhoneStatePermission();
  const detected = (await getDetectedTerminalSerial()).trim();
  const manual = getManualTerminalSerial();
  return manual || detected;
}

type GatewayModeApi = ReturnType<typeof useGatewayModeToggleImpl>;

const GatewayModeContext = createContext<GatewayModeApi | null>(null);

function useGatewayModeToggleImpl() {
  const {
    gatewayModeEnabled,
    setGatewayModeEnabled,
    setServerExternalPaymentEnabled,
    setTerminalSerial,
    setDeviceFingerprint,
    setTerminalCode,
    setConnectionStatus,
    resetTerminalBinding,
  } = usePaymentHubStore();

  const [loading, setLoading] = useState(false);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [pendingTerminal, setPendingTerminal] = useState<EnrollmentTerminalInfo | null>(null);
  const [showManualSerialModal, setShowManualSerialModal] = useState(false);
  const [manualSerialInput, setManualSerialInput] = useState('');
  const [serialModalError, setSerialModalError] = useState('');

  const openSerialModal = async (errorMessage = '') => {
    setSerialModalError(errorMessage);
    setManualSerialInput(await buildSerialModalPrefill());
    setShowManualSerialModal(true);
  };

  const completeEnrollment = async (hardwareSerial: string) => {
    const serial = hardwareSerial.trim();
    setManualTerminalSerial(serial);

    const result = await PaymentHubAgent.ensureRegistered('Terminal D-PAY', undefined, serial);
    if (result?.terminal) {
      const canonicalSerial = result.terminal.serial_number;
      const extEnabled = result.terminal.external_payment_enabled === true;
      setCachedTerminalSerial(canonicalSerial);
      setTerminalSerial(canonicalSerial);
      const fp = await getDeviceFingerprint();
      setDeviceFingerprint(fp);
      setTerminalCode(result.terminal.terminal_code);
      setServerExternalPaymentEnabled(extEnabled);

      if (!extEnabled) {
        setGatewayModeEnabled(false);
        setConnectionStatus('offline');
        Alert.alert(
          'Cobro externo no habilitado',
          'Este terminal está enrolado pero no tiene habilitados los cobros externos. '
          + 'Solicite al administrador que active la opción en Panel Admin POS → Terminales.',
        );
        return;
      }

      setPendingTerminal({
        terminal_code: result.terminal.terminal_code,
        serial_number: canonicalSerial,
        display_name: result.terminal.display_name,
      });
      setShowEnrollmentModal(true);
      return;
    }

    const msg = result && typeof result === 'object' && 'mensaje' in result
      ? String((result as { mensaje?: string }).mensaje || '')
      : '';

    setGatewayModeEnabled(false);
    resetTerminalBinding();
    clearCachedTerminalSerial();

    const detail = msg || (
      `No hay un terminal pendiente en DTemite con el serial ${serial}. `
      + 'Verifique el serial en Panel Admin POS e intente de nuevo.'
    );
    await openSerialModal(detail);
  };

  const handleEnrollmentConfirm = () => {
    setShowEnrollmentModal(false);
    setPendingTerminal(null);
    setConnectionStatus('online');
    setGatewayModeEnabled(true);
  };

  const handleEnrollmentCancel = () => {
    setShowEnrollmentModal(false);
    setPendingTerminal(null);
    setGatewayModeEnabled(false);
    setConnectionStatus('offline');
    resetTerminalBinding();
    clearCachedTerminalSerial();
    clearManualTerminalSerial();
    void openSerialModal(
      'Enrolamiento cancelado. Verifique el serial correcto del POS '
      + 'y que exista en Panel Admin POS antes de volver a intentar.',
    );
  };

  const handleToggle = async (value: boolean) => {
    if (value) {
      setGatewayModeEnabled(false);
      setConnectionStatus('offline');
      resetTerminalBinding();
      clearCachedTerminalSerial();
      await openSerialModal();
      return;
    }

    setGatewayModeEnabled(false);
    setConnectionStatus('offline');
    resetTerminalBinding();
    clearCachedTerminalSerial();
    clearManualTerminalSerial();
  };

  const retryWithNewSerial = async (errorMessage = '') => {
    setGatewayModeEnabled(false);
    setConnectionStatus('offline');
    resetTerminalBinding();
    clearCachedTerminalSerial();
    clearManualTerminalSerial();
    await openSerialModal(
      errorMessage || 'Corrija el serial del POS e intente enlazar de nuevo.',
    );
  };

  return {
    gatewayModeEnabled,
    loading,
    handleToggle,
    showEnrollmentModal,
    pendingTerminal,
    handleEnrollmentConfirm,
    handleEnrollmentCancel,
    showManualSerialModal,
    manualSerialInput,
    setManualSerialInput,
    setShowManualSerialModal,
    serialModalError,
    completeEnrollment,
    setLoading,
    openSerialModal,
    retryWithNewSerial,
  };
}

export const useGatewayModeToggle = () => {
  const ctx = useContext(GatewayModeContext);
  if (!ctx) {
    throw new Error('useGatewayModeToggle debe usarse dentro de GatewayModeProvider');
  }
  return ctx;
};

/** Envuelve toggle + config para compartir un solo estado de enrolamiento */
export const GatewayModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const api = useGatewayModeToggleImpl();
  return (
    <GatewayModeContext.Provider value={api}>
      {children}
      <GatewayModeModals api={api} />
    </GatewayModeContext.Provider>
  );
};

const GatewayModeModals: React.FC<{ api: GatewayModeApi }> = ({ api }) => {
  const themeColors = useThemeColors();
  const {
    showEnrollmentModal,
    pendingTerminal,
    handleEnrollmentConfirm,
    handleEnrollmentCancel,
    showManualSerialModal,
    manualSerialInput,
    setManualSerialInput,
    setShowManualSerialModal,
    serialModalError,
    completeEnrollment,
    setLoading,
    openSerialModal,
  } = api;

  const { setGatewayModeEnabled } = usePaymentHubStore();

  const submitManualSerial = async () => {
    const serial = manualSerialInput.trim();
    if (serial.length < 8) {
      Alert.alert('Serial inválido', 'Ingrese el número de serie completo del POS (pegatina trasera del equipo).');
      return;
    }
    setShowManualSerialModal(false);
    setLoading(true);
    try {
      await completeEnrollment(serial);
    } catch (err) {
      setGatewayModeEnabled(false);
      await openSerialModal(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <EnrollmentConfirmModal
        visible={showEnrollmentModal}
        terminal={pendingTerminal}
        onConfirm={handleEnrollmentConfirm}
        onCancel={handleEnrollmentCancel}
      />
      <AppModal
        visible={showManualSerialModal}
        title="Serial del POS"
        message={
          'Ingrese el serial de la pegatina trasera del equipo. '
          + 'Debe coincidir exactamente con el terminal creado en Panel Admin POS '
          + '(ej. 6010B232561701920).'
        }
        onClose={() => setShowManualSerialModal(false)}
        maxWidth={440}
      >
        {serialModalError ? (
          <Text style={{ color: '#c0392b', fontSize: 13, marginBottom: 10, lineHeight: 18 }}>
            {serialModalError}
          </Text>
        ) : null}
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: '#03C0C3',
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: themeColors.text,
            marginBottom: 12,
          }}
          value={manualSerialInput}
          onChangeText={setManualSerialInput}
          placeholder="6010B232561701920"
          placeholderTextColor="#64748B"
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <TouchableOpacity
          onPress={submitManualSerial}
          style={{
            backgroundColor: '#03C0C3',
            borderRadius: 10,
            paddingVertical: 12,
            alignItems: 'center',
            marginBottom: 8,
          }}
          activeOpacity={0.85}
        >
          <Text style={{ color: '#021735', fontWeight: '700' }}>Enlazar con este serial</Text>
        </TouchableOpacity>
      </AppModal>
    </>
  );
};

/** Switch para la fila de cabecera "Cobros externos" */
export const GatewayModeToggle: React.FC = () => {
  const { gatewayModeEnabled, loading, handleToggle } = useGatewayModeToggle();

  if (loading) {
    return <ActivityIndicator color="#03C0C3" />;
  }

  return (
    <Switch
      value={gatewayModeEnabled}
      onValueChange={handleToggle}
      trackColor={{ false: '#767577', true: '#03C0C3' }}
      thumbColor="#f4f3f4"
      ios_backgroundColor="#3e3e3e"
    />
  );
};

/** Detalle de cobros externos (serial, estado, descripción) */
export const GatewayModeConfig: React.FC = () => {
  const themeColors = useThemeColors();
  const {
    gatewayModeEnabled,
    serverExternalPaymentEnabled,
    terminalSerial,
    deviceFingerprint,
    terminalCode,
    connectionStatus,
  } = usePaymentHubStore();

  const { retryWithNewSerial } = useGatewayModeToggle();

  const [hardwareSerial, setHardwareSerial] = useState('');
  const [localFingerprint, setLocalFingerprint] = useState('');

  useEffect(() => {
    ensurePhoneStatePermission().then(() => {
      getTerminalSerial().then(setHardwareSerial);
    });
    getDeviceFingerprint().then(setLocalFingerprint);
  }, [gatewayModeEnabled, terminalSerial]);

  const shownSerial = terminalSerial || hardwareSerial || getManualTerminalSerial();
  const shownFingerprint = deviceFingerprint || localFingerprint;

  const handleChangeSerial = async () => {
    if (gatewayModeEnabled) {
      Alert.alert(
        'Desactive cobros externos primero',
        'Apague el interruptor de Cobros externos y vuelva a activarlo para ingresar otro serial.',
      );
      return;
    }
    await retryWithNewSerial();
  };

  return (
    <View>
      <Text style={{
        fontSize: 14,
        color: themeColors.textSecondary,
        marginTop: 10,
        lineHeight: 20,
      }}>
        Recibe solicitudes de cobro enviadas desde DTemite u otros sistemas conectados al Payment Hub.
        Al activar, D-PAY se enlaza al terminal de Panel Admin POS con el mismo serial.
      </Text>
      {gatewayModeEnabled && !serverExternalPaymentEnabled ? (
        <Text style={{ fontSize: 13, color: '#c0392b', marginTop: 8, lineHeight: 18 }}>
          Este terminal ya no tiene cobros externos habilitados en el servidor. Desactive el modo pasarela o contacte al administrador.
        </Text>
      ) : null}
      {shownSerial ? (
        <Text style={{ fontSize: 13, color: themeColors.textSecondary, marginTop: 8 }}>
          Serial: {shownSerial}
          {terminalCode ? ` · Código: ${terminalCode}` : ''}
          {gatewayModeEnabled ? ` · ${connectionStatus === 'online' ? 'En línea' : 'Sin conexión'}` : ''}
        </Text>
      ) : (
        <Text style={{ fontSize: 13, color: '#c0392b', marginTop: 8 }}>
          Al activar Cobros externos podrá ingresar el serial del POS (pegatina del equipo).
        </Text>
      )}
      {!gatewayModeEnabled ? (
        <TouchableOpacity onPress={handleChangeSerial} activeOpacity={0.85} style={{ marginTop: 8 }}>
          <Text style={{ fontSize: 13, color: '#03C0C3', fontWeight: '700' }}>
            Cambiar serial / reintentar enlace
          </Text>
        </TouchableOpacity>
      ) : null}
      {shownFingerprint && shownFingerprint !== shownSerial ? (
        <Text style={{ fontSize: 12, color: themeColors.textSecondary, marginTop: 4 }}>
          ID interno Android (no es el serial): {shownFingerprint}
        </Text>
      ) : null}
    </View>
  );
};
