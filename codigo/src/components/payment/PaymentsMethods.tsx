import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useAlertStore } from '../../stores/alertStore';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSalesStore } from '../../stores/salesStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useAuthStore } from '../../stores/authStore';
import { formatCurrency } from '../../utils/format';
import { useThemeColors } from '../../hooks/useThemeColors';
import { CashInput } from './CashInput';
import { TipModal } from './TipModal';
import AppModal from '../base/AppModal';
import { tuuPaymentService, TuuPaymentRequest, parseTuuError, classifyTuuError } from '../../services/tuuPayment';
import { calculateTotalsByDocType, mapTuuMethodToMedioPago, calcularComisionDpay, registrarTransaccionTuu } from '../../services/api';
import { mapDocTypeToTuu } from '../../constants/dte';
import { APP_VERSION } from '../../constants/appVersion';
import { getTerminalSerial } from '../../utils/deviceInfo';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import type { Sale } from '../../types';

const { width: screenWidth } = Dimensions.get('window');

// Color para bordes (no depende del tema)
const silverColor = '#cccccc';

// Métodos de pago con sus iconos y tipos Tuu
const paymentsMethods = [
  {
    id: 1,
    name: 'Efectivo',
    icon: require('../../../assets/icons/cash.png'),
    tuuMethod: null, // Efectivo no usa Tuu
  },
  {
    id: 2,
    name: 'Tarjeta de crédito',
    icon: require('../../../assets/icons/credit-card.png'),
    tuuMethod: 1, // Tuu: 1 = Crédito
  },
  {
    id: 3,
    name: 'Tarjeta de débito',
    icon: require('../../../assets/icons/debit-card.png'),
    tuuMethod: 2, // Tuu: 2 = Débito
  },
];

interface PaymentsMethodsProps {
  scrollToShowInputCentered: () => void;
  autoExecute?: boolean;
  onAutoPaymentFailed?: () => void;
}

/**
 * Componente de métodos de pago con integración Tuu
 * FLUJO:
 * - Efectivo: Se expande, NO navega hasta presionar "Continuar"
 * - Tarjetas (Crédito/Débito): Invoca app Tuu → Espera respuesta → Continúa si exitoso
 * - autoExecute: Ejecuta automáticamente sin mostrar UI (solo 1 método configurado)
 */
export const PaymentsMethods: React.FC<PaymentsMethodsProps> = ({
  scrollToShowInputCentered,
  autoExecute = false,
  onAutoPaymentFailed,
}) => {
  const themeColors = useThemeColors();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [paymentMethod, setPaymentMethod] = useState('');
  const [cash, setCash] = useState('');
  const [isProcessingTuu, setIsProcessingTuu] = useState(false);
  const [autoPaymentTriggered, setAutoPaymentTriggered] = useState(false);
  
  // Ref para guard síncrono - evita llamadas duplicadas al SDK de TUU
  const isProcessingTuuRef = useRef(false);
  const { showAlert } = useAlertStore();

  // Selectores optimizados - solo extraer lo necesario
  const setPaymentMethodSale = useSalesStore(state => state.setPaymentMethodSale);
  const setChangeSale = useSalesStore(state => state.setChangeSale);
  const sales = useSalesStore(state => state.sales);
  const currentSale = useSalesStore(state => state.currentSale);
  const documentType = useSalesStore(state => state.documentType);
  const client = useSalesStore(state => state.client);
  
  // Settings store - extraer funciones individuales
  const getPaymentMethodsForDocType = useSettingsStore(state => state.getPaymentMethodsForDocType);
  const dpayComisiones = useSettingsStore(state => state.dpayComisiones);
  const enableTip = useSettingsStore(state => state.enableTip);
  
  // Auth store
  const user = useAuthStore(state => state.user);

  // Estado para el modal de propina
  const [tipModalVisible, setTipModalVisible] = useState(false);
  const [pendingTipAction, setPendingTipAction] = useState<{ method: typeof paymentsMethods[0] } | null>(null);
  const [currentTipAmount, setCurrentTipAmount] = useState(0);
  const [showClientRequiredModal, setShowClientRequiredModal] = useState(false);

  // Verificar instalación de Tuu al montar
  useEffect(() => {
    checkTuuInstallation();
  }, []);

  // Auto-ejecutar pago SOLO si autoExecute es true (controlado por PaymentMethodScreen)
  useEffect(() => {
    // Solo auto-ejecutar si el prop autoExecute es true y no se ha disparado ya
    if (!autoExecute || autoPaymentTriggered || !documentType) return;

    const configuredMethods = getPaymentMethodsForDocType(documentType.id);

    // Solo auto-ejecutar si hay exactamente 1 método configurado
    if (configuredMethods.length === 1) {
      const methodName = configuredMethods[0];
      const method = paymentsMethods.find(m => m.name === methodName);

      if (method) {
        console.log(`[PaymentsMethods] Auto-ejecutando método: ${methodName}`);
        setAutoPaymentTriggered(true);

        setTimeout(() => {
          handlePaymentMethodPress(method);
        }, 100);
      }
    }
  }, [autoExecute, autoPaymentTriggered, documentType, getPaymentMethodsForDocType]);

  const checkTuuInstallation = async () => {
    const isInstalled = await tuuPaymentService.isTuuAppInstalled();
    if (!isInstalled) {
      console.warn('[Tuu] App no instalada en el dispositivo');
    }
  };

  // Reset al entrar a la pantalla
  useFocusEffect(
    React.useCallback(() => {
      setPaymentMethod('');
      setPaymentMethodSale('');
    }, [setPaymentMethodSale])
  );

  // Calcula total de la venta actual
  const getTotal = () => {
    return sales[currentSale]?.results
      .map(item => item.total)
      .reduce((prev, curr) => prev + curr, 0) || 0;
  };

  /**
   * Procesa pago con Tuu para tarjetas
   * @param tipAmount Monto de propina (0 o positivo). -1 = no usar propina.
   */
  const processTuuPayment = async (method: typeof paymentsMethods[0], tipAmount: number = -1) => {
    if (!method.tuuMethod) return;
    
    // Guard síncrono para evitar llamadas duplicadas
    if (isProcessingTuuRef.current) {
      console.log('[Tuu] ⚠️ Pago ya en proceso, ignorando llamada duplicada');
      return;
    }
    
    if (!documentType) {
      showAlert('Error', 'Debe seleccionar un tipo de documento antes de pagar');
      return;
    }

    // Activar guards
    isProcessingTuuRef.current = true;
    setIsProcessingTuu(true);

    try {
      // Verificar que Tuu esté instalado
      const isInstalled = await tuuPaymentService.isTuuAppInstalled();
      if (!isInstalled) {
        showAlert(
          'App Tuu no encontrada',
          'Por favor, instale la aplicación Tuu Negocio para procesar pagos con tarjeta.'
        );
        return;
      }

      const total = getTotal();
      const [neto, exento, iva, totalWithIVA] = calculateTotalsByDocType(
        sales[currentSale].results,
        documentType.id
      );

      // Construir payload para Tuu
      // IMPORTANTE: Tuu solo acepta dteType: 0, 33, 34, 44, 48, 99
      // Para boletas (39, 41) enviamos 48 a Tuu, pero D-PAY usa el código real
      const tuuDteType = mapDocTypeToTuu(documentType.id);

      const tuuRequest: TuuPaymentRequest = {
        amount: totalWithIVA,
        tip: tipAmount > 0 ? tipAmount : -1,
        cashback: -1, // No usar cashback por defecto (-1 = no utilizado) para evitar errores en DEV
        method: method.tuuMethod as 1 | 2,
        installmentsQuantity: method.tuuMethod === 1 ? 0 : -1, // Crédito: 0 = solicitar en app | Débito: -1 = no utilizado
        printVoucherOnApp: false, // Nosotros imprimimos
        dteType: tuuDteType, // Mapeado: boletas (39,41) → 48 para Tuu
        extraData: {
          taxIdnValidation: '', // Vacío para evitar validación de RUT (si se envía debe coincidir exactamente con Tuu)
          exemptAmount: exento,
          netAmount: neto,
          sourceName: 'D-PAY',
          sourceVersion: APP_VERSION,
        },
      };

      console.log('[Tuu] Iniciando pago - D-PAY:', documentType.name, '(ID:', documentType.id, ') → Tuu dteType:', tuuDteType);
      console.log('[Tuu] Payload completo:', JSON.stringify(tuuRequest, null, 2));

      // Invocar Tuu
      const result = await tuuPaymentService.startPayment(tuuRequest);

      console.log('[Tuu] Pago exitoso:', result);

      // Calcular comisión DPay según configuración de la empresa
      let comisionData: {
        tipo_comision?: 'fija' | 'mixta';
        comision_porcentaje?: number;
        comision_monto_fijo?: number;
        comision_monto?: number;
      } = {};

      if (dpayComisiones?.habilitado) {
        const comision = calcularComisionDpay(
          totalWithIVA,
          dpayComisiones.tipo_comision,
          dpayComisiones.comision_porcentaje,
          dpayComisiones.comision_monto_fijo
        );

        comisionData = {
          tipo_comision: comision.tipo_comision,
          comision_porcentaje: comision.comision_porcentaje,
          comision_monto_fijo: comision.comision_monto_fijo,
          comision_monto: comision.comision_total, // Monto total con IVA
        };

        console.log('[Tuu] Comisión DPay calculada:', {
          tipo: comision.tipo_comision,
          porcentaje: comision.comision_porcentaje + '%',
          montoFijo: comision.comision_monto_fijo,
          comisionNeta: comision.comision_neta,
          comisionTotal: comision.comision_total,
          total: totalWithIVA,
        });
      }

      // Preparar datos de pago TUU para guardar localmente
      // Se enviarán al backend DESPUÉS de obtener el folio del DTE
      const tuuPaymentData: Sale['tuuPaymentData'] = {
        request: {
          amount: totalWithIVA,
          method: method.tuuMethod as 1 | 2,
          dteType: tuuDteType,
          tip: tipAmount > 0 ? tipAmount : -1,
          cashback: tuuRequest.cashback,
          installmentsQuantity: tuuRequest.installmentsQuantity,
        },
        response: {
          sequenceNumber: result.sequenceNumber,
          transactionStatus: result.transactionStatus,
          transactionTip: (result as any).transactionTip || 0,
          transactionCashback: (result as any).transactionCashback || 0,
          printerVoucherCommerce: result.printerVoucherCommerce,
          authCode: result.authCode,           // Código de autorización del banco
          last4: result.last4,                 // Últimos 4 dígitos de la tarjeta
        },
        tipoTarjeta: method.tuuMethod === 1 ? 'CREDITO' : 'DEBITO',
        idMedioPago: mapTuuMethodToMedioPago(method.tuuMethod as number),
        montoNeto: neto,
        montoExento: exento,
        ...comisionData, // Incluye tipo_comision, comision_porcentaje, comision_monto_fijo, comision_monto
        syncedToBackend: false, // Se marcará true cuando se envíe al backend con el folio
      };

      console.log('[Tuu] Datos de pago preparados para guardar localmente:', tuuPaymentData);

      // Guardar método de pago y continuar
      setPaymentMethodSale(method.name);
      setChangeSale(null);

      // Navegar a completar venta con datos de TUU
      // El registro en el backend se hará DESPUÉS de obtener el folio
      navigation.replace('SaleCompleted', {
        sale: sales[currentSale],
        tuuTransactionId: result.sequenceNumber,
        tuuPaymentData, // Pasar datos completos para guardar y sincronizar después
      });

    } catch (error: any) {
      console.error('[Tuu] Error en pago:', error);

      // Clasificar el error para mejor registro
      const errorDetails = classifyTuuError(error);
      const { title, message, isCancellable } = parseTuuError(error);

      console.log('[Tuu] Error clasificado:', {
        category: errorDetails.category,
        code: errorDetails.code,
        title: errorDetails.title,
        isRetryable: errorDetails.isRetryable,
      });

      // Registrar transacción fallida en la BD para auditoría
      try {
        const total = getTotal();
        const [neto, exento] = calculateTotalsByDocType(sales[currentSale].results, documentType?.id || 39);
        
        // Construir observaciones descriptivas según la categoría
        let observaciones = '';
        switch (errorDetails.category) {
          case 'CANCELADO_USUARIO':
            observaciones = `CANCELADO: El usuario canceló la transacción`;
            break;
          case 'RECHAZADO_BANCO':
            observaciones = `RECHAZADO BANCO [${errorDetails.code}]: ${errorDetails.message}`;
            break;
          case 'ERROR_TARJETA':
            observaciones = `ERROR TARJETA [${errorDetails.code}]: ${errorDetails.message}`;
            break;
          case 'ERROR_DISPOSITIVO':
            observaciones = `ERROR DISPOSITIVO TUU [${errorDetails.code}]: ${errorDetails.message}`;
            break;
          case 'ERROR_RED':
            observaciones = `ERROR RED/CONEXION [${errorDetails.code}]: ${errorDetails.message}`;
            break;
          case 'ERROR_CONFIGURACION':
            observaciones = `ERROR CONFIG [${errorDetails.code}]: ${errorDetails.message}`;
            break;
          default:
            observaciones = `ERROR [${errorDetails.code}]: ${errorDetails.message}`;
        }
        
        const dispositivo = await getTerminalSerial();
        await registrarTransaccionTuu({
          monto: total,
          transaction_status: false, // Fallida
          response_code: (errorDetails.code || '').substring(0, 20),
          observaciones: observaciones.substring(0, 200),
          detalle_error: observaciones, // Campo completo para tbl_dpay.detalle_error
          id_mediopago: mapTuuMethodToMedioPago(method.tuuMethod as number),
          tipo_tarjeta: method.tuuMethod === 1 ? 'CREDITO' : 'DEBITO',
          tipo_dte: documentType?.id,
          exempt_amount: exento,
          net_amount: neto,
          dispositivo,
          source_name: 'Dpay',
          source_version: APP_VERSION,
          usuario: (user?.usuario || user?.user || 'sistema').substring(0, 50),
          // Información del cliente (campos correctos)
          id_cliente: client?.id ? Number(client.id) : 0,
          rut_cliente: client?.rut || '66666666-6',
          nombre_cliente: (client?.name || (client as any)?.razon || 'PUBLICO GENERAL').substring(0, 100),
          email_cliente: client?.email || undefined,
          tipo_cliente: client?.id ? 'registrado' : 'natural',
          request_json: {
            amount: total,
            method: method.tuuMethod,
            dteType: documentType?.id,
            cliente: client ? {
              id: client.id,
              rut: client.rut,
              nombre: client.name || (client as any)?.razon,
              email: client.email
            } : null,
          },
          response_json: {
            error: error?.message || String(error),
            errorCode: errorDetails.code,
            errorCategory: errorDetails.category,
            errorTitle: errorDetails.title,
            errorMessage: errorDetails.message,
            isRetryable: errorDetails.isRetryable,
          },
        }).catch(err => {
          console.warn('[Tuu] No se pudo registrar error en BD (no crítico):', err);
        });

        console.log('[Tuu] Transacción fallida registrada en backend:', {
          category: errorDetails.category,
          observaciones: observaciones.substring(0, 50) + '...',
        });
      } catch (regError) {
        console.warn('[Tuu] Error al registrar transacción fallida:', regError);
      }

      if (isCancellable) {
        // Notificar a PaymentMethodScreen para que muestre la UI y no re-ejecute
        setPaymentMethod('');
        onAutoPaymentFailed?.();
      }

      showAlert(title, message);
    } finally {
      isProcessingTuuRef.current = false;
      setIsProcessingTuu(false);
    }
  };

  /**
   * Guarda método efectivo, vuelto y navega a SaleCompleted
   */
  const saveMethodAndGoToNextPage = (_paymentMethod: string) => {
    // Si enableTip está activo y aún no se ha mostrado el modal de propina
    if (enableTip && !tipModalVisible && _paymentMethod === 'Efectivo') {
      setPendingTipAction({ method: paymentsMethods[0] }); // Efectivo
      setTipModalVisible(true);
      return;
    }

    setPaymentMethodSale(_paymentMethod);

    // Calcular y guardar vuelto si es efectivo
    if (_paymentMethod === 'Efectivo') {
      const cashNumber = parseInt(cash.replace(/\./g, ''), 10);
      const change = cashNumber - getTotal();
      setChangeSale(formatCurrency(change));
    } else {
      setChangeSale(null);
    }

    // Preparar datos para tbl_dpay si hay documento seleccionado
    let tuuPaymentData: Sale['tuuPaymentData'] | undefined;

    if (documentType && sales[currentSale]) {
      const [neto, exento, iva, totalWithIVA] = calculateTotalsByDocType(
        sales[currentSale].results,
        documentType.id
      );

      // Si es Efectivo/Contado, preparamos los datos para que se registre en tbl_dpay
      if (_paymentMethod === 'Efectivo') {
        tuuPaymentData = {
          request: {
            amount: totalWithIVA,
            method: 10, // 10 = Efectivo (Interno)
            dteType: mapDocTypeToTuu(documentType.id),
            tip: currentTipAmount > 0 ? currentTipAmount : 0,
            cashback: 0,
            installmentsQuantity: 0,
          },
          response: {
            sequenceNumber: `EFF-${Date.now()}`,
            transactionStatus: true,
            transactionTip: currentTipAmount > 0 ? currentTipAmount : 0,
            transactionCashback: 0,
            printerVoucherCommerce: false,
          },
          tipoTarjeta: 'EFECTIVO',
          idMedioPago: 1, // 1 = Efectivo en BD
          montoNeto: neto,
          montoExento: exento,
          syncedToBackend: false,
        };

        console.log('[PaymentsMethods] Datos de pago Efectivo preparados para tbl_dpay:', tuuPaymentData);
      }
    }

    navigation.replace('SaleCompleted', {
      sale: sales[currentSale],
      tuuTransactionId: tuuPaymentData?.response.sequenceNumber,
      tuuPaymentData
    });
  };

  const handlePaymentMethodPress = async (method: typeof paymentsMethods[0]) => {
    // Validar cliente requerido para facturas (tipos 33 y 34)
    const isFactura = documentType?.id === 33 || documentType?.id === 34;
    if (isFactura && !client) {
      setShowClientRequiredModal(true);
      return;
    }

    const _paymentMethod = paymentMethod !== method.name ? method.name : '';
    setPaymentMethod(_paymentMethod);

    if (!_paymentMethod) return;

    // Si es Efectivo, solo expandir (limpiar vuelto hasta ingresar monto)
    if (_paymentMethod === 'Efectivo') {
      setChangeSale(null);
      scrollToShowInputCentered();
      return;
    }

    setChangeSale(null);

    // Si es Tarjeta (Crédito o Débito)
    if (method.tuuMethod) {
      // Si enableTip está activo, mostrar modal de propina antes de procesar
      if (enableTip) {
        setPendingTipAction({ method });
        setTipModalVisible(true);
        return;
      }
      await processTuuPayment(method);
    }
  };

  // Callbacks del TipModal
  const handleTipCancel = useCallback(() => {
    setTipModalVisible(false);
    setPendingTipAction(null);
    setCurrentTipAmount(0);
    // Deseleccionar método si era tarjeta
    if (pendingTipAction?.method.tuuMethod) {
      setPaymentMethod('');
    }
  }, [pendingTipAction]);

  const handleTipNoTip = useCallback(async () => {
    setTipModalVisible(false);
    setCurrentTipAmount(0);
    const method = pendingTipAction?.method;
    setPendingTipAction(null);
    if (!method) return;

    if (method.tuuMethod) {
      await processTuuPayment(method, -1);
    } else {
      // Efectivo: continuar sin propina
      setPaymentMethodSale('Efectivo');
      const cashNumber = parseInt(cash.replace(/\./g, ''), 10);
      const change = cashNumber - getTotal();
      setChangeSale(formatCurrency(change));

      let tuuPaymentData: Sale['tuuPaymentData'] | undefined;
      if (documentType && sales[currentSale]) {
        const [neto, exento] = calculateTotalsByDocType(sales[currentSale].results, documentType.id);
        tuuPaymentData = buildCashPaymentData(neto, exento, 0);
      }
      navigation.replace('SaleCompleted', {
        sale: sales[currentSale],
        tuuTransactionId: tuuPaymentData?.response.sequenceNumber,
        tuuPaymentData,
      });
    }
  }, [pendingTipAction, cash, documentType, sales, currentSale]);

  const handleTipAccept = useCallback(async (tipAmount: number) => {
    setTipModalVisible(false);
    setCurrentTipAmount(tipAmount);
    const method = pendingTipAction?.method;
    setPendingTipAction(null);
    if (!method) return;

    if (method.tuuMethod) {
      await processTuuPayment(method, tipAmount);
    } else {
      // Efectivo: sumar propina al vuelto
      setPaymentMethodSale('Efectivo');
      const cashNumber = parseInt(cash.replace(/\./g, ''), 10);
      const totalWithTip = getTotal() + tipAmount;
      const change = cashNumber - totalWithTip;
      setChangeSale(formatCurrency(change));

      let tuuPaymentData: Sale['tuuPaymentData'] | undefined;
      if (documentType && sales[currentSale]) {
        const [neto, exento] = calculateTotalsByDocType(sales[currentSale].results, documentType.id);
        tuuPaymentData = buildCashPaymentData(neto, exento, tipAmount);
      }
      navigation.replace('SaleCompleted', {
        sale: sales[currentSale],
        tuuTransactionId: tuuPaymentData?.response.sequenceNumber,
        tuuPaymentData,
      });
    }
  }, [pendingTipAction, cash, documentType, sales, currentSale]);

  // Helper para construir datos de pago efectivo
  const buildCashPaymentData = (neto: number, exento: number, tip: number): Sale['tuuPaymentData'] => {
    const totalWithIVA = neto + exento + (neto > 0 ? Math.round(neto * 0.19) : 0);
    return {
      request: {
        amount: totalWithIVA,
        method: 10,
        dteType: mapDocTypeToTuu(documentType!.id),
        tip: tip > 0 ? tip : 0,
        cashback: 0,
        installmentsQuantity: 0,
      },
      response: {
        sequenceNumber: `EFF-${Date.now()}`,
        transactionStatus: true,
        transactionTip: tip > 0 ? tip : 0,
        transactionCashback: 0,
        printerVoucherCommerce: false,
      },
      tipoTarjeta: 'EFECTIVO',
      idMedioPago: 1,
      montoNeto: neto,
      montoExento: exento,
      syncedToBackend: false,
    };
  };

  return (
    <View style={{
      marginTop: 10,
      marginBottom: 15,
    }}>
      <Text style={{
        fontSize: 15,
        color: themeColors.isDark ? '#FFFFFF' : '#d4186e',
        fontWeight: 'bold',
        marginLeft: 20,
        marginBottom: 10,
      }}>
        Métodos de pago
      </Text>

      <View style={{
        marginHorizontal: 20,
        gap: 10,
      }}>
        {paymentsMethods
          .filter(method => {
            // Filtrar métodos según configuración del documento
            if (!documentType) return true; // Sin documento, mostrar todos

            const configuredMethods = getPaymentMethodsForDocType(documentType.id);
            if (configuredMethods.length === 0) return true; // Sin configuración, mostrar todos

            return configuredMethods.includes(method.name); // Solo mostrar configurados
          })
          .map((item, index) => {
            const isSelected = paymentMethod === item.name;
            const getIcon = (id: number) => {
              if (id === 1) return require('../../../assets/icons_new/efectivo_rosa.png');
              if (id === 2) return require('../../../assets/icons_new/credito_rosa.png');
              if (id === 3) return require('../../../assets/icons_new/debto_rosa.png');
              return require('../../../assets/icons_new/efectivo_rosa.png');
            };

            return (
              <View key={index}>
                <TouchableOpacity
                  onPress={() => handlePaymentMethodPress(item)}
                  disabled={isProcessingTuu}
                  style={{
                    backgroundColor: isSelected ? '#d4186e' : '#FFFFFF',
                    borderRadius: 12,
                    padding: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderWidth: 2,
                    borderColor: '#d4186e',
                    opacity: isProcessingTuu && !isSelected ? 0.5 : 1,
                  }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Image
                      source={getIcon(item.id)}
                      style={{ width: 36, height: 36, tintColor: isSelected ? '#FFFFFF' : '#d4186e', marginRight: 12 }}
                      resizeMode="contain"
                    />
                    <Text style={{
                      fontSize: 16,
                      fontWeight: 'bold',
                      color: isSelected ? '#FFFFFF' : '#d4186e',
                    }}>
                      {item.name}
                    </Text>
                    {isProcessingTuu && isSelected && (
                      <Text style={{
                        fontSize: 13,
                        color: '#FFFFFF',
                        marginLeft: 10,
                      }}>
                        Procesando...
                      </Text>
                    )}
                  </View>

                  {/* Radio button */}
                  <View style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    borderWidth: 2,
                    borderColor: isSelected ? '#FFFFFF' : '#d4186e',
                    backgroundColor: isSelected ? '#FFFFFF' : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {isSelected && (
                      <View style={{
                        width: 11,
                        height: 11,
                        borderRadius: 5.5,
                        backgroundColor: '#d4186e',
                      }} />
                    )}
                  </View>
                </TouchableOpacity>

                {/* CashInput expandible (solo cuando se selecciona Efectivo) */}
                {paymentMethod === 'Efectivo' && item.id === 1 && (
                  <CashInput
                    cash={cash}
                    setCash={setCash}
                    total={getTotal()}
                    onContinue={() => saveMethodAndGoToNextPage('Efectivo')}
                    onFocus={scrollToShowInputCentered}
                  />
                )}
              </View>
            );
          })}
      </View>

      {/* Modal: cliente requerido para facturas */}
      <AppModal
        visible={showClientRequiredModal}
        title="Cliente requerido"
        message={`Para emitir una ${documentType?.name || 'Factura'} es obligatorio seleccionar un cliente.`}
        buttons={[
          {
            text: 'Seleccionar',
            onPress: () => {
              setShowClientRequiredModal(false);
              navigation.navigate('Clients');
            },
            variant: 'primary',
          },
          {
            text: 'Cancelar',
            onPress: () => setShowClientRequiredModal(false),
            variant: 'secondary',
          },
        ]}
        onClose={() => setShowClientRequiredModal(false)}
      />

      {/* Modal de propina */}
      <TipModal
        visible={tipModalVisible}
        totalAmount={getTotal()}
        onCancel={handleTipCancel}
        onNoTip={handleTipNoTip}
        onAcceptTip={handleTipAccept}
      />
    </View>
  );
};
