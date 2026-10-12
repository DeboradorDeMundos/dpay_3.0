import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { BackButton } from '../components/base';
import { useThemeColors } from '../hooks/useThemeColors';
import { useAuthStore } from '../stores/authStore';
import { useAlertStore } from '../stores/alertStore';
import { tuuPaymentService } from '../services/tuuPayment';
import {
  claimIntent,
  setProcessing,
  completeIntent,
  cancelIntent,
  sendHeartbeat,
  type PaymentIntent,
} from '../services/paymentHubService';
import { PaymentHubAgent } from '../services/paymentHubAgent';
import { getDeviceFingerprint } from '../utils/deviceInfo';
import { usePaymentHubStore } from '../stores/paymentHubStore';
import { mapTuuMethodToMedioPago } from '../services/api';
import { classifyTuuError, parseTuuError } from '../services/tuuPayment';
import { APP_VERSION } from '../constants/appVersion';
import { buildExternalPaymentDisplay, resolveIntentFlowType, resolveIntentPaymentMethod } from '../utils/externalPaymentSummary';
import { ExternalPaymentSummaryCard } from '../components/paymentHub/ExternalPaymentSummaryCard';
import { usePrinter } from '../hooks/usePrinter';
import { useSettingsStore } from '../stores/settingsStore';
import { usePrinterStore } from '../stores/printerStore';
import { runExternalExtraPrintOnly } from '../utils/externalPaymentPrinting';
import { computeExternalPaymentContext, finalizeExternalPayment } from '../utils/finalizeExternalPayment';
import type { Sale } from '../types/common';
import {
  buildExternalIntentClosureCopy,
  startIntentStatusPolling,
  type ClosedIntentStatus,
} from '../utils/externalIntentWatch';

const CASH_MEDIO_PAGO_ID = 1;

type Props = NativeStackScreenProps<RootStackParamList, 'ExternalPayment'>;

export const ExternalPaymentScreen: React.FC<Props> = ({ navigation, route }) => {
  const themeColors = useThemeColors();
  const { user } = useAuthStore();
  const { showAlert } = useAlertStore();
  const intent = route.params?.intent;

  const { printExtraTicket } = usePrinter();
  const { automaticPrinting, emitirDocumento, autoSync } = useSettingsStore();
  const { selectedPrinter } = usePrinterStore();

  const [loading, setLoading] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [deviceKey, setDeviceKey] = useState('');
  const [printStatus, setPrintStatus] = useState<string | null>(null);
  const [externallyClosed, setExternallyClosed] = useState<ClosedIntentStatus | null>(null);
  const intentId = intent?.id;

  const claimedRef = useRef(false);
  const completedRef = useRef(false);
  const deviceKeyRef = useRef('');

  const display = useMemo(
    () => (intent ? buildExternalPaymentDisplay(intent) : null),
    [intent],
  );

  const flowType = intent ? resolveIntentFlowType(intent) : 'payment_only';
  const paymentMethod = intent ? resolveIntentPaymentMethod(intent) : 'card';
  const isPrintOnly = flowType === 'print_only';
  const isCash = paymentMethod === 'cash' && !isPrintOnly;
  const screenTitle = isPrintOnly ? 'Impresión externa' : 'Cobro externo';

  const setTerminalOnline = async (key: string) => {
    try {
      await sendHeartbeat(key, 'online');
    } catch {
      // no bloqueante
    }
  };

  const setTerminalBusy = async (key: string) => {
    try {
      await sendHeartbeat(key, 'busy');
    } catch {
      // no bloqueante
    }
  };

  const handleExternalClosure = useCallback(async (status: ClosedIntentStatus) => {
    if (completedRef.current) return;
    completedRef.current = true;

    setExternallyClosed(status);
    setLoading(false);
    setPrintStatus(null);

    const copy = buildExternalIntentClosureCopy(intent, status);
    showAlert(copy.title, copy.message);

    if (deviceKeyRef.current) {
      await setTerminalOnline(deviceKeyRef.current);
    }
    PaymentHubAgent.clearHandlingIntent();
    navigation.goBack();
  }, [intent, navigation, showAlert]);

  useEffect(() => {
    if (!intentId) return;

    const stopPolling = startIntentStatusPolling({
      intentId,
      onClosed: (_updatedIntent, status) => {
        void handleExternalClosure(status);
      },
    });

    return stopPolling;
  }, [intentId, handleExternalClosure]);

  const externalClosureCopy = useMemo(
    () => (externallyClosed ? buildExternalIntentClosureCopy(intent, externallyClosed) : null),
    [externallyClosed, intent],
  );

  useEffect(() => {
    if (!intentId) {
      showAlert('Error', isPrintOnly ? 'Solicitud de impresión inválida.' : 'Solicitud de cobro inválida.');
      PaymentHubAgent.clearHandlingIntent();
      navigation.goBack();
      return;
    }

    let cancelled = false;

    const init = async () => {
      const storedKey = usePaymentHubStore.getState().deviceFingerprint;
      const key = storedKey || (await getDeviceFingerprint());
      if (cancelled) return;
      deviceKeyRef.current = key;
      setDeviceKey(key);
      try {
        await claimIntent(intentId, key);
        if (cancelled) return;
        claimedRef.current = true;
        setClaimed(true);
        usePaymentHubStore.getState().setActiveIntent(intent);
        usePaymentHubStore.getState().setIncomingIntent(null);
        await setTerminalBusy(key);
        PaymentHubAgent.releaseHandlingLock();
      } catch (error) {
        console.error('[ExternalPayment] Error claiming intent:', error);
        if (cancelled) return;
        showAlert('Error', isPrintOnly ? 'No se pudo tomar la solicitud de impresión.' : 'No se pudo tomar la solicitud de cobro.');
        PaymentHubAgent.clearHandlingIntent();
        navigation.goBack();
      }
    };
    init();

    return () => {
      cancelled = true;
      if (completedRef.current) {
        if (deviceKeyRef.current) {
          setTerminalOnline(deviceKeyRef.current).catch(() => {});
        }
        return;
      }
      if (claimedRef.current && intentId && deviceKeyRef.current) {
        cancelIntent(intentId, deviceKeyRef.current, {
          monto: intent?.amount || 0,
          detalle_error: isPrintOnly ? 'Operador abandonó la pantalla de impresión' : 'Operador abandonó la pantalla de cobro',
          response_code: 'ABANDONED',
        }).catch(() => {});
        setTerminalOnline(deviceKeyRef.current).catch(() => {});
        PaymentHubAgent.clearHandlingIntent();
      }
    };
  }, [intentId, isPrintOnly, navigation, showAlert, intent?.amount]);

  if (!intentId || !intent) {
    return (
      <View style={{ flex: 1, backgroundColor: themeColors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#03C0C3" />
      </View>
    );
  }

  const printerOpts = {
    printExtraTicket,
    selectedPrinter: selectedPrinter ?? null,
  };

  const markCompleted = async () => {
    completedRef.current = true;
    if (deviceKey) {
      await setTerminalOnline(deviceKey);
    }
    PaymentHubAgent.clearHandlingIntent();
  };

  const handleReject = async () => {
    if (!deviceKey || loading) return;
    setLoading(true);
    try {
      await cancelIntent(intent.id, deviceKey, {
        monto: intent.amount,
        detalle_error: isPrintOnly
          ? 'Impresión rechazada por el operador en el POS'
          : 'Cobro rechazado por el operador en el POS',
        response_code: 'REJECTED',
      });
      await markCompleted();
      showAlert(
        isPrintOnly ? 'Impresión rechazada' : 'Cobro rechazado',
        'La solicitud fue cancelada y registrada.',
      );
      navigation.goBack();
    } catch {
      showAlert('Error', 'No se pudo cancelar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintOnly = async () => {
    if (!deviceKey || !claimed || loading) return;

    setLoading(true);
    setPrintStatus('Imprimiendo ticket...');
    try {
      await setProcessing(intent.id, deviceKey);

      const printResult = await runExternalExtraPrintOnly({ intent, printer: printerOpts });

      if (!printResult.extraPrinted) {
        await cancelIntent(intent.id, deviceKey, {
          monto: 0,
          detalle_error: printResult.error || 'No se pudo imprimir el ticket',
          response_code: 'PRINT_FAILED',
        });
        await markCompleted();
        showAlert('Error de impresión', printResult.error || 'No se pudo imprimir el ticket.');
        navigation.goBack();
        return;
      }

      await completeIntent(intent.id, {
        serial_number: deviceKey,
        transaction_status: true,
        monto: 0,
        source_name: 'D-PAY',
        source_version: APP_VERSION,
        usuario: user?.usuario || user?.user || 'D-PAY',
        request_json: {
          payment_intent_id: intent.id,
          flow_type: 'print_only',
          external_id: intent.external_id,
        },
        response_json: { printed: true },
      });

      await markCompleted();
      showAlert('Impresión exitosa', 'El ticket fue impreso correctamente.');
      navigation.goBack();
    } catch (error) {
      console.error('[ExternalPayment] Error print_only:', error);
      showAlert('Error', 'No se pudo completar la impresión.');
      navigation.goBack();
    } finally {
      setPrintStatus(null);
      setLoading(false);
    }
  };

  const handleCashConfirm = async () => {
    if (!deviceKey || !claimed || loading) return;

    setLoading(true);
    try {
      await setProcessing(intent.id, deviceKey);

      const ctx = computeExternalPaymentContext(intent, emitirDocumento);

      const tuuPaymentData: NonNullable<Sale['tuuPaymentData']> = {
        request: {
          amount: ctx.amount,
          method: 10,
          dteType: ctx.tuuDteType,
          tip: 0,
          cashback: 0,
          installmentsQuantity: 0,
        },
        response: {
          sequenceNumber: `EFF-${Date.now()}`,
          transactionStatus: true,
          transactionTip: 0,
          transactionCashback: 0,
          printerVoucherCommerce: false,
        },
        tipoTarjeta: 'EFECTIVO',
        idMedioPago: CASH_MEDIO_PAGO_ID,
        montoNeto: ctx.neto,
        montoExento: ctx.exento,
        syncedToBackend: false,
      };

      await finalizeExternalPayment({
        intent,
        deviceKey,
        tuuPaymentData,
        completePayload: {
          id_mediopago: CASH_MEDIO_PAGO_ID,
          tipo_tarjeta: 'EFECTIVO',
          response_json: { payment_method: 'cash', confirmed_on_pos: true },
        },
        emitirDocumento,
        autoSync,
        automaticPrinting,
        user,
        navigation,
        printer: printerOpts,
        onPrintStatus: setPrintStatus,
        onCompleted: () => {
          completedRef.current = true;
        },
      });

      await markCompleted();
    } catch (error) {
      console.error('[ExternalPayment] Error efectivo:', error);
      showAlert('Error', 'No se pudo registrar el cobro en efectivo.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (tuuMethod: 1 | 2) => {
    if (!deviceKey || !claimed || loading) return;

    const isInstalled = await tuuPaymentService.isTuuAppInstalled();
    if (!isInstalled) {
      showAlert('App Tuu no encontrada', 'Instale Tuu Negocio para procesar pagos con tarjeta.');
      return;
    }

    setLoading(true);
    try {
      await setProcessing(intent.id, deviceKey);

      const ctx = computeExternalPaymentContext(intent, emitirDocumento);

      const result = await tuuPaymentService.startPayment({
        amount: ctx.amount,
        tip: -1,
        cashback: -1,
        method: tuuMethod,
        installmentsQuantity: tuuMethod === 1 ? 0 : -1,
        printVoucherOnApp: false,
        dteType: ctx.tuuDteType,
        extraData: {
          taxIdnValidation: '',
          exemptAmount: ctx.exento,
          netAmount: ctx.neto,
          sourceName: 'D-PAY',
          sourceVersion: APP_VERSION,
        },
      });

      const tuuPaymentData: NonNullable<Sale['tuuPaymentData']> = {
        request: {
          amount: ctx.amount,
          method: tuuMethod,
          dteType: ctx.tuuDteType,
          tip: result.transactionTip || 0,
          cashback: result.transactionCashback || 0,
          installmentsQuantity: tuuMethod === 1 ? 0 : 1,
        },
        response: {
          sequenceNumber: result.sequenceNumber,
          transactionStatus: result.transactionStatus,
          transactionTip: result.transactionTip,
          transactionCashback: result.transactionCashback,
          printerVoucherCommerce: result.printerVoucherCommerce,
          authCode: result.authCode,
          last4: result.last4,
        },
        tipoTarjeta: tuuMethod === 1 ? 'CREDITO' : 'DEBITO',
        idMedioPago: mapTuuMethodToMedioPago(tuuMethod),
        montoNeto: ctx.neto,
        montoExento: ctx.exento,
        syncedToBackend: false,
      };

      await finalizeExternalPayment({
        intent,
        deviceKey,
        tuuPaymentData,
        completePayload: {
          id_mediopago: mapTuuMethodToMedioPago(tuuMethod),
          sequence_number: result.sequenceNumber,
          codigo_autorizacion: result.authCode,
          ultimos_digitos: result.last4,
          tipo_tarjeta: tuuMethod === 1 ? 'CREDITO' : 'DEBITO',
          response_json: result as object,
        },
        emitirDocumento,
        autoSync,
        automaticPrinting,
        user,
        navigation,
        printer: printerOpts,
        onPrintStatus: setPrintStatus,
        onCompleted: () => {
          completedRef.current = true;
        },
      });

      await markCompleted();
    } catch (error: unknown) {
      const errorDetails = classifyTuuError(error);
      const { title, message } = parseTuuError(error);

      if (errorDetails.category === 'CANCELADO_USUARIO') {
        try {
          await cancelIntent(intent.id, deviceKey, {
            monto: intent.amount,
            detalle_error: errorDetails.message || 'Transacción cancelada en TUU',
            response_code: 'CANCELLED',
          });
        } catch (cancelError) {
          console.error('[ExternalPayment] Error cancelando intent TUU:', cancelError);
        }
      } else {
        try {
          await completeIntent(intent.id, {
            serial_number: deviceKey,
            transaction_status: false,
            monto: intent.amount,
            id_mediopago: mapTuuMethodToMedioPago(tuuMethod),
            response_code: (errorDetails.code || '').substring(0, 20),
            detalle_error: errorDetails.message,
            tipo_tarjeta: tuuMethod === 1 ? 'CREDITO' : 'DEBITO',
            source_name: 'D-PAY',
            source_version: APP_VERSION,
            usuario: user?.usuario || user?.user || 'D-PAY',
            request_json: {
              payment_intent_id: intent.id,
              external_id: intent.external_id,
            },
            response_json: { error: errorDetails },
          });
        } catch (completeError) {
          console.error('[ExternalPayment] Error registrando fallo:', completeError);
        }
      }

      await markCompleted();
      showAlert(title, message);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.background }}>
      <StatusBar
        barStyle={themeColors.background === '#FFFFFF' ? 'dark-content' : 'light-content'}
        backgroundColor={themeColors.background}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <BackButton onPress={() => { if (!loading) navigation.goBack(); }} />
            <Text style={{ flex: 1, textAlign: 'center', fontSize: 20, fontWeight: 'bold', color: '#03C0C3', marginRight: 40 }}>
              {screenTitle}
            </Text>
          </View>
          {!claimed && !loading ? (
            <Text style={{ textAlign: 'center', fontSize: 13, color: themeColors.textSecondary }}>
              Conectando con el terminal...
            </Text>
          ) : null}
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {externalClosureCopy ? (
            <View
              style={{
                backgroundColor: '#fff4f6',
                borderWidth: 1,
                borderColor: '#f1416c',
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <Text style={{ color: '#f1416c', fontWeight: '700', fontSize: 16, marginBottom: 6 }}>
                {externalClosureCopy.title}
              </Text>
              <Text style={{ color: '#7e8299', fontSize: 14, lineHeight: 20 }}>
                {externalClosureCopy.message}
              </Text>
            </View>
          ) : null}
          {display ? <ExternalPaymentSummaryCard display={display} /> : null}
        </ScrollView>

        {externallyClosed ? (
          <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
            <View
              style={{
                backgroundColor: '#f1416c',
                padding: 16,
                borderRadius: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '700', textAlign: 'center' }}>
                Solicitud cerrada desde la integración cloud
              </Text>
            </View>
          </View>
        ) : loading ? (
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <ActivityIndicator size="large" color="#03C0C3" />
            {printStatus ? (
              <Text style={{ marginTop: 10, fontSize: 13, color: themeColors.textSecondary }}>
                {printStatus}
              </Text>
            ) : null}
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
            {isPrintOnly ? (
              <TouchableOpacity
                onPress={handlePrintOnly}
                disabled={!claimed}
                style={{
                  backgroundColor: '#03C0C3',
                  padding: 18,
                  borderRadius: 12,
                  alignItems: 'center',
                  opacity: claimed ? 1 : 0.5,
                  marginBottom: 12,
                }}
              >
                <Text style={{ color: '#FFF', fontSize: 18, fontWeight: 'bold' }}>Imprimir ticket</Text>
              </TouchableOpacity>
            ) : isCash ? (
              <TouchableOpacity
                onPress={handleCashConfirm}
                disabled={!claimed}
                style={{
                  backgroundColor: '#50cd89',
                  padding: 18,
                  borderRadius: 12,
                  alignItems: 'center',
                  opacity: claimed ? 1 : 0.5,
                  marginBottom: 12,
                }}
              >
                <Text style={{ color: '#FFF', fontSize: 18, fontWeight: 'bold' }}>Confirmar efectivo</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => handlePay(2)}
                  disabled={!claimed}
                  style={{
                    backgroundColor: '#213d8b',
                    padding: 18,
                    borderRadius: 12,
                    alignItems: 'center',
                    opacity: claimed ? 1 : 0.5,
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ color: '#FFF', fontSize: 18, fontWeight: 'bold' }}>Cobrar con débito</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handlePay(1)}
                  disabled={!claimed}
                  style={{
                    backgroundColor: '#03C0C3',
                    padding: 18,
                    borderRadius: 12,
                    alignItems: 'center',
                    opacity: claimed ? 1 : 0.5,
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ color: '#FFF', fontSize: 18, fontWeight: 'bold' }}>Cobrar con crédito</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity
              onPress={handleReject}
              style={{
                backgroundColor: 'transparent',
                padding: 14,
                borderRadius: 12,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#f1416c',
              }}
            >
              <Text style={{ color: '#f1416c', fontSize: 16, fontWeight: '600' }}>
                {isPrintOnly ? 'Rechazar impresión' : 'Rechazar cobro'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
};
