import React, { useEffect, useState, useRef } from 'react';
import { View, StatusBar, Animated, Easing, Image } from 'react-native';
import moment from 'moment';
import { decode as atob } from 'base-64';
import { useSalesStore } from '../stores/salesStore';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useMySalesStore } from '../stores/mySalesStore';
import { useCAFStore } from '../stores/cafStore';
import { useAlertStore } from '../stores/alertStore';
import { Loading } from '../components/base';
import { DD_XML, TED_XML } from '../constants/dte';
import { signDDXML } from '../services/signDD';
import { calculateTotalsByDocType, registrarTransaccionTuu, mapTuuMethodToMedioPago } from '../services/api';
import { removeAccents } from '../utils/format';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import type { Sale } from '../types/common';
import { useThemeColors } from '../hooks/useThemeColors';
import { getTerminalSerial } from '../utils/deviceInfo';
import { APP_VERSION } from '../constants/appVersion';

type Props = NativeStackScreenProps<RootStackParamList, 'SaleCompleted'>;

export const SaleCompletedScreen: React.FC<Props> = ({ navigation, route }) => {
  const { getCurrentSale, getTotal, paymentMethod, documentType, client, clearCart } = useSalesStore();
  const { user } = useAuthStore();
  const { automaticPrinting, autoSync, emitirDocumento } = useSettingsStore();
  const { addSale, syncSale, updateSale } = useMySalesStore();
  const cafStore = useCAFStore();
  const themeColors = useThemeColors();
  const { showAlert } = useAlertStore();
  const currentSale = getCurrentSale();
  const total = getTotal();

  const [loadingMessage, setLoadingMessage] = useState('Procesando venta...');
  
  // Ref para evitar doble ejecución del efecto
  const hasProcessedRef = useRef(false);

  const tuuTransactionId = route.params?.tuuTransactionId;
  const tuuPaymentData = route.params?.tuuPaymentData;

  /**
   * Genera el TED (Timbre Electrónico DTE) para una venta con folio asignado
   */
  const generateTED = async (sale: Sale, folio: number): Promise<string | undefined> => {
    try {
      if (!documentType) return undefined;

      // Obtener CAF activo para el tipo de documento
      const activeCaf = cafStore.getActiveCaf(documentType.id);
      if (!activeCaf) {
        console.log('[SaleCompleted] No hay CAF disponible para generar TED');
        return undefined;
      }

      const purchaseDate = moment().format('YYYY-MM-DDTHH:mm:ss');
      const purchaseDateShort = moment().format('YYYY-MM-DD');

      // Preparar datos
      const clientRut = client?.rut || '66666666-6';
      const clientName = ((client as any)?.razon || (client as any)?.nombre || client?.name || 'PUBLICO GENERAL').slice(0, 40);
      const firstItemName = removeAccents(sale.results[0].name).slice(0, 40);
      const totalAmount = sale.results.reduce((sum, item) => sum + item.total, 0);

      // Generar DD (Documento Descriptor)
      const ddXML = DD_XML
        .replace('_RE_', user?.empresa?.rut || '')
        .replace('_TD_', documentType.id.toString())
        .replace('_F_', folio.toString())
        .replace('_FE_', purchaseDateShort)
        .replace('_RR_', clientRut)
        .replace('_RSR_', clientName)
        .replace('_MNT_', totalAmount.toString())
        .replace('_IT1_', firstItemName)
        .replace('_TSTED_', purchaseDate)
        .replace('_CAF_', atob(activeCaf.nom_archivocaf).replace(/(\r\n|\n|\r)/gm, ''));

      // Firmar DD con la clave privada RSA
      const signatureBase64 = signDDXML(ddXML, activeCaf.rsask);

      // Generar TED completo
      const tedXML = TED_XML
        .replace('_DD_', ddXML)
        .replace('_FRMT_', signatureBase64);

      console.log('[SaleCompleted] TED generado exitosamente para folio:', folio);
      return tedXML;
    } catch (error) {
      console.error('[SaleCompleted] Error generando TED:', error);
      return undefined;
    }
  };

  // Efecto para guardar venta, sincronizar si autoSync está activo, y navegar
  useEffect(() => {
    // Guard para evitar doble ejecución (React StrictMode o re-renders)
    if (hasProcessedRef.current) {
      console.log('[SaleCompleted] Efecto ya ejecutado, saltando...');
      return;
    }
    hasProcessedRef.current = true;
    
    const processAndNavigate = async () => {
      if (!currentSale || currentSale.results.length === 0) {
        showAlert('Error', 'No hay items en la venta');
        navigation.navigate('Sale');
        return;
      }

      // Solo requerir documentType si emitirDocumento está activado
      if (emitirDocumento && !documentType) {
        showAlert('Error', 'No se ha seleccionado un tipo de documento');
        navigation.navigate('Sale');
        return;
      }

      // Calcular totales según el tipo de documento
      // Usa la función común que considera si es afecto o exento
      // Si no hay documentType (pagos recibidos), usar 0 para no calcular IVA
      const docTypeId = documentType?.id || 0;
      const [neto, exento, iva, calculatedTotal] = calculateTotalsByDocType(
        currentSale.results,
        docTypeId
      );
      const subtotal = currentSale.results.reduce((sum, item) => sum + item.total, 0);

      // Convertir CartItems a SaleItems
      const saleItems = currentSale.results.map((item, index) => ({
        id: `item-${Date.now()}-${index}`,
        productId: undefined,
        code: item.code,
        name: item.name,
        count: item.count,
        value: item.value,
        total: item.total,
        ...(item.bodega ? { bodega: item.bodega } : {}),
        ...(item.nombreBodega ? { nombreBodega: item.nombreBodega } : {}),
      }));

      // Crear objeto de venta SIN folio (se asignará al sincronizar)
      const sale: Sale = {
        id: `sale-${Date.now()}`,
        results: saleItems,
        documentType: documentType ? documentType.id : undefined,
        folio: undefined, // Se asignará al sincronizar
        ted: undefined,   // Se generará después de sincronizar
        client: client || undefined,
        paymentMethod: paymentMethod || undefined,
        change: 0,
        subtotal,
        neto,
        exento,
        iva,
        total: subtotal,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        status: 'completed',
        syncStatus: 'pending',
        tuuTransactionId: tuuTransactionId || undefined,
        // Guardar datos completos de pago TUU localmente
        tuuPaymentData: tuuPaymentData || undefined,

        // Información del emisor para filtrar historial
        issuerUserId: user?.usuario || undefined,
        issuerUser: user?.nombre || user?.usuario || undefined,
        issuerCompany: user?.empresa?.rut || undefined,
      };

      // Guardar en mySalesStore
      addSale(sale);
      console.log('[SaleCompleted] Venta guardada (pendiente de sincronización)');
      console.log('[SaleCompleted] Datos TUU guardados localmente:', !!tuuPaymentData);

      const isComprobanteElectronico = docTypeId === 0;
      const shouldEmitDte = emitirDocumento && autoSync && !isComprobanteElectronico;

      // Emitir DTE solo para tipos tributarios (no comprobante electrónico / solo cobro)
      if (shouldEmitDte) {
        setLoadingMessage('Sincronizando con SII...');

        console.log('[SaleCompleted] AutoSync activado, sincronizando...');
        try {
          await syncSale(sale.id);
          console.log('[SaleCompleted] Venta sincronizada exitosamente');

          setLoadingMessage('Generando timbre...');

          // Obtener la venta actualizada con el folio del servidor
          const syncedSale = useMySalesStore.getState().getSaleById(sale.id);

          if (syncedSale?.folio) {
            console.log('[SaleCompleted] Folio asignado:', syncedSale.folio);

            // Si hay datos de pago TUU, registrar la transacción completa en el backend
            // AHORA que tenemos el folio, podemos enviar todos los datos de una vez
            if (tuuPaymentData && documentType) {
              console.log('[SaleCompleted] Registrando transacción TUU en backend con folio...', {
                sequenceNumber: tuuPaymentData.response.sequenceNumber,
                tipoDte: documentType.id,
                folioDte: syncedSale.folio,
              });

              try {
                // Verificar si ya fue sincronizado (por el servicio de background)
                const currentSaleState = useMySalesStore.getState().getSaleById(sale.id);
                if (currentSaleState?.tuuPaymentData?.syncedToBackend === true) {
                  console.log('[SaleCompleted] TUU ya sincronizado por otro proceso, saltando...');
                } else {
                  const dispositivo = await getTerminalSerial();
                  // ⚠️ IMPORTANTE: Ahora esperamos la sincronización (await) en lugar de .then()
                  const tuuResult = await registrarTransaccionTuu({
                    monto: tuuPaymentData.request.amount,
                    id_cliente: client?.id ? Number(client.id) : 0,
                    rut_cliente: client?.rut || '66666666-6',
                    nombre_cliente: (client?.name || (client as any)?.razon || 'PUBLICO GENERAL').substring(0, 100),
                    email_cliente: client?.email || undefined,
                    telefono_cliente: (client as any)?.telefono || (client as any)?.phone || undefined,
                    tipo_cliente: client?.id ? 'registrado' : 'natural',
                    usuario: (user?.usuario || user?.user || 'sistema').substring(0, 50),
                    tipo_comision: tuuPaymentData.tipo_comision,
                    comision_porcentaje: tuuPaymentData.comision_porcentaje,
                    comision_monto_fijo: tuuPaymentData.comision_monto_fijo,
                    comision_monto: tuuPaymentData.comision_monto,
                    id_mediopago: tuuPaymentData.idMedioPago,
                    tipo_tarjeta: tuuPaymentData.tipoTarjeta?.substring(0, 20),
                    cuotas: tuuPaymentData.request.method === 1 ? 0 : 1,
                    propina: tuuPaymentData.response.transactionTip || 0,
                    cashback: tuuPaymentData.response.transactionCashback || 0,
                    transaction_status: tuuPaymentData.response.transactionStatus,
                    sequence_number: (tuuPaymentData.response.sequenceNumber || '').substring(0, 50),
                    codigo_autorizacion: (tuuPaymentData.response.authCode || '').substring(0, 20),
                    ultimos_digitos: (tuuPaymentData.response.last4 || '').replace(/\*/g, '').slice(-4),
                    printer_voucher_commerce: tuuPaymentData.response.printerVoucherCommerce || false,
                    exempt_amount: tuuPaymentData.montoExento,
                    net_amount: tuuPaymentData.montoNeto,
                    dispositivo,
                    source_name: 'Dpay',
                    source_version: APP_VERSION,
                    // Ahora SÍ tenemos el folio y tipo de DTE
                    tipo_dte: documentType.id,
                    folio_dte: Number(syncedSale.folio),
                    detalle: syncedSale.results.map(item => `${item.count}x ${item.name}`).join(', ').substring(0, 200),
                    request_json: tuuPaymentData.request,
                    response_json: tuuPaymentData.response,
                  });

                  if (tuuResult.success) {
                    console.log('[SaleCompleted] ✅ Transacción TUU registrada en backend exitosamente');
                    // Marcar como sincronizado con backend y guardar ID de tbl_dpay
                    updateSale(sale.id, {
                      dpayTransactionId: tuuResult.id,
                      tuuPaymentData: { ...tuuPaymentData, syncedToBackend: true, backendSyncError: undefined }
                    });
                  } else {
                    console.warn('[SaleCompleted] ⚠️ Error registrando TUU en backend:', tuuResult.message);
                    updateSale(sale.id, {
                      tuuPaymentData: { ...tuuPaymentData, syncedToBackend: false, backendSyncError: tuuResult.message }
                    });
                  }
                }
              } catch (tuuError: any) {
                console.error('[SaleCompleted] ❌ Error crítico registrando TUU:', tuuError);
                updateSale(sale.id, {
                  tuuPaymentData: { ...tuuPaymentData, syncedToBackend: false, backendSyncError: tuuError.message }
                });
              }
            }

            // Generar TED con el folio del servidor
            const ted = await generateTED(syncedSale, syncedSale.folio);
            if (ted) {
              updateSale(sale.id, { ted });
              console.log('[SaleCompleted] TED generado y guardado');
            }
          }

        } catch (syncError) {
          console.error('[SaleCompleted] Error en sincronización automática:', syncError);
          // Continuar aunque falle la sincronización - se puede sincronizar manualmente después
        }
      } else if (tuuPaymentData) {
        // Solo cobro: comprobante electrónico o emitirDocumento desactivado — registrar en tbl_dpay sin DTE
        setLoadingMessage('Registrando pago...');
        console.log('[SaleCompleted] Registrando pago en tbl_dpay (sin DTE)...');
        try {
          const dispositivo = await getTerminalSerial();
          const tuuResult = await registrarTransaccionTuu({
            monto: tuuPaymentData.request.amount,
            id_cliente: client?.id ? Number(client.id) : 0,
            rut_cliente: client?.rut || '66666666-6',
            nombre_cliente: (client?.name || (client as any)?.razon || 'PUBLICO GENERAL').substring(0, 100),
            email_cliente: client?.email || undefined,
            telefono_cliente: (client as any)?.telefono || (client as any)?.phone || undefined,
            tipo_cliente: client?.id ? 'registrado' : 'natural',
            usuario: (user?.usuario || user?.user || 'sistema').substring(0, 50),
            tipo_comision: tuuPaymentData.tipo_comision,
            comision_porcentaje: tuuPaymentData.comision_porcentaje,
            comision_monto_fijo: tuuPaymentData.comision_monto_fijo,
            comision_monto: tuuPaymentData.comision_monto,
            id_mediopago: tuuPaymentData.idMedioPago,
            tipo_tarjeta: tuuPaymentData.tipoTarjeta?.substring(0, 20),
            cuotas: tuuPaymentData.request.method === 1 ? 0 : 1,
            propina: tuuPaymentData.response.transactionTip || 0,
            cashback: tuuPaymentData.response.transactionCashback || 0,
            transaction_status: tuuPaymentData.response.transactionStatus,
            sequence_number: (tuuPaymentData.response.sequenceNumber || '').substring(0, 50),
            codigo_autorizacion: (tuuPaymentData.response.authCode || '').substring(0, 20),
            ultimos_digitos: (tuuPaymentData.response.last4 || '').replace(/\*/g, '').slice(-4),
            printer_voucher_commerce: tuuPaymentData.response.printerVoucherCommerce || false,
            exempt_amount: tuuPaymentData.montoExento,
            net_amount: tuuPaymentData.montoNeto,
            dispositivo,
            source_name: 'Dpay',
            source_version: APP_VERSION,
            // Sin tipo_dte ni folio_dte: no se emitió documento electrónico
            detalle: sale.results.map(item => `${item.count}x ${item.name}`).join(', ').substring(0, 200),
            request_json: tuuPaymentData.request,
            response_json: tuuPaymentData.response,
          });

          if (tuuResult.success) {
            console.log('[SaleCompleted] ✅ Pago registrado en tbl_dpay (sin DTE)');
            updateSale(sale.id, {
              dpayTransactionId: tuuResult.id,
              tuuPaymentData: { ...tuuPaymentData, syncedToBackend: true, backendSyncError: undefined }
            });
          } else {
            console.warn('[SaleCompleted] ⚠️ Error registrando pago en tbl_dpay:', tuuResult.message);
            updateSale(sale.id, {
              tuuPaymentData: { ...tuuPaymentData, syncedToBackend: false, backendSyncError: tuuResult.message }
            });
          }
        } catch (tuuError: any) {
          console.error('[SaleCompleted] ❌ Error registrando pago en tbl_dpay:', tuuError);
          updateSale(sale.id, {
            tuuPaymentData: { ...tuuPaymentData, syncedToBackend: false, backendSyncError: tuuError.message }
          });
        }
      }

      // Navegar a ViewInvoice
      clearCart();
      navigation.replace('ViewInvoice', {
        saleId: sale.id,
        printInvoice: automaticPrinting,
        blockBackPress: true,
      });
    };

    processAndNavigate();
  }, []);

  // Solo mostrar pantalla de carga mientras procesa
  return (
    <View style={{ flex: 1, backgroundColor: themeColors.background, justifyContent: 'center', alignItems: 'center' }}>
      <StatusBar
        barStyle={themeColors.background === '#FFFFFF' ? 'dark-content' : 'light-content'}
        backgroundColor={themeColors.background}
      />
      <Image
        source={require('../../assets/logos/logo_dpay_cargando.gif')}
        style={{ width: 150, height: 150 }}
        resizeMode="contain"
      />
    </View>
  );
};
