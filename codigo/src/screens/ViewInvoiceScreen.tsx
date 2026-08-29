import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar, SafeAreaView, ScrollView, ActivityIndicator, Image, Linking, Modal, Platform } from 'react-native';
import { Button, BackButton, EmptyState, AppModal } from '../components/base';
import { formatCurrency, formatDate } from '../utils/format';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useThemeColors } from '../hooks/useThemeColors';
import { useSettingsStore } from '../stores/settingsStore';
import { useMySalesStore } from '../stores/mySalesStore';
import { useAuthStore } from '../stores/authStore';
import { usePrinterStore } from '../stores/printerStore';
import { usePrinter } from '../hooks/usePrinter';
import { useAlertStore } from '../stores/alertStore';
import { generateTEDForSale } from '../services/ted';
import { generateBoletaPDF } from '../services/pdf';
import { TED_PRINT_MAX_HEIGHT, TED_PRINT_WIDTH } from '../constants/tedPrint';
import PDF417Generator from '../utils/PDF417Generator';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import type { Sale, SaleItem } from '../types/common';
import { listarDocumentosDpay } from '../services/api';
import type { DpayDocumentDetail } from '../services/api';
import md5 from 'md5';
import moment from 'moment';
import Pdf from 'react-native-pdf';
import ReactNativeBlobUtil from 'react-native-blob-util';

type Props = NativeStackScreenProps<RootStackParamList, 'ViewInvoice'>;

// Función para convertir nombre de documento DPay a ID numérico
const getDocTypeIdFromName = (typeName: string): number | undefined => {
  const typeMap: Record<string, number> = {
    'Boleta Electrónica': 39,
    'Boleta Electronica': 39,
    'Boleta Exenta': 41,
    'Boleta Exenta Electrónica': 41,
    'Boleta Exenta Electronica': 41,
    'Boleta No afecta o Exenta Electronica': 41,
    'Boleta No afecta o Exenta Electrónica': 41,
    'Factura Electrónica': 33,
    'Factura Electronica': 33,
    'Factura Afecta Electrónica': 33,
    'Factura Afecta Electronica': 33,
    'Factura Exenta': 34,
    'Factura Exenta Electrónica': 34,
    'Factura Exenta Electronica': 34,
    'Factura No afecta o Exenta Electronica': 34,
    'Factura No afecta o Exenta Electrónica': 34,
    'Nota de Crédito': 61,
    'Nota de Credito': 61,
    'Nota de Crédito Electrónica': 61,
    'Nota de Credito Electronica': 61,
  };
  return typeMap[typeName];
};

const DTE_DOC_TYPES = [33, 34, 39, 41, 61] as const;

const getSaleDocTypeId = (documentType: Sale['documentType']): number | undefined => {
  if (documentType === undefined || documentType === null) return undefined;
  return typeof documentType === 'number' ? documentType : (documentType as { id?: number })?.id;
};

const isDteWithFolio = (s: Sale): boolean => {
  const docType = getSaleDocTypeId(s.documentType);
  return !!s.folio && !!docType && docType !== 0 && (DTE_DOC_TYPES as readonly number[]).includes(docType);
};

const AUTO_PRINT_VOUCHER_DELAY_MS = 2000;

export const ViewInvoiceScreen: React.FC<Props> = ({ navigation, route }) => {
  const { saleId, dpayDocument, dpayIdDocumento, printInvoice = false, blockBackPress = false, showNewSaleButton = false } = route.params;
  const { isDark, ...themeColors } = useThemeColors();
  const settings = useSettingsStore();
  const getSaleById = useMySalesStore((state) => state.getSaleById);
  const updateSale = useMySalesStore((state) => state.updateSale);
  const syncTuuPayment = useMySalesStore((state) => state.syncTuuPayment);
  const user = useAuthStore((state) => state.user);
  const { printReceipt, printPaymentVoucher } = usePrinter();
  const { showAlert } = useAlertStore();
  const selectedPrinter = usePrinterStore((state) => state.selectedPrinter);
  
  const isDpayDocument = !!dpayDocument;
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [printingVoucher, setPrintingVoucher] = useState(false);
  const [autoPrintPending, setAutoPrintPending] = useState(printInvoice);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [showNoPrinterModal, setShowNoPrinterModal] = useState(false);
  const [syncingTuu, setSyncingTuu] = useState(false);
  const [detailExpanded, setDetailExpanded] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfFilePath, setPdfFilePath] = useState<string | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingVoucherPdf, setDownloadingVoucherPdf] = useState(false);
  const [regeneratingTed, setRegeneratingTed] = useState(false);

  // URL del PDF: funciona para documentos DPay (directo) y ventas locales sincronizadas (via id_documento guardado)
  const pdfSistema = dpayDocument?.dpay_sistema || dpayDocument?.sistema || user?.sistema;
  const pdfIdDocumento = isDpayDocument
    ? dpayDocument?.id_documento
    : (dpayIdDocumento || sale?.id_documento); // dpayIdDocumento viene de MySalesScreen al navegar
  const pdfFolio = isDpayDocument ? dpayDocument?.folio : sale?.folio;

  // Usar el proxy /api/pdfview/ que genera el PDF via WebService y hace redirect 301 al PDF real.
  // Tanto el sistema como el id_documento deben pasarse como MD5 (así lo requiere el endpoint).
  const pdfProxyUrl = (pdfSistema && pdfIdDocumento)
    ? `https://pro.dtemite.cl/api/pdfview/O/${md5(pdfSistema)}/${md5(String(pdfIdDocumento))}`
    : null;

  // DEBUG: eliminar después de confirmar que funciona
  console.log('[ViewInvoice] PDF DEBUG:', {
    isDpayDocument,
    dpay_sistema: dpayDocument?.dpay_sistema,
    doc_sistema: dpayDocument?.sistema,
    user_sistema: user?.sistema,
    dpayIdDocumento,
    pdfSistema,
    pdfIdDocumento,
    pdfFolio,
    pdfProxyUrl,
    sale_id_documento: sale?.id_documento,
    sale_folio: sale?.folio,
  });

  // Cargar la venta al montar el componente
  useEffect(() => {
    const loadSale = async () => {
      if (isDpayDocument && dpayDocument) {
        // Parsear fechas de forma segura desde múltiples formatos posibles
        const parseFechaSegura = (fecha: string): string => {
          if (!fecha) return new Date().toISOString();
          
          // Intentar parsear con diferentes formatos
          const formatos = [
            'YYYY-MM-DD HH:mm:ss',
            'YYYY-MM-DDTHH:mm:ss',
            'DD-MM-YYYY HH:mm:ss',
            'DD-MM-YYYY',
            'YYYY-MM-DD',
          ];
          
          for (const formato of formatos) {
            const parsed = moment(fecha, formato, true);
            if (parsed.isValid()) {
              return parsed.toISOString();
            }
          }
          
          // Último intento: dejar que moment lo parsee automáticamente
          const parsed = moment(fecha);
          return parsed.isValid() ? parsed.toISOString() : new Date().toISOString();
        };
        
        const fechaEmision = parseFechaSegura(dpayDocument.fecha_emision);
        const fechaCreacion = parseFechaSegura(dpayDocument.fecha_creacion);
        
        // Crear tuuPaymentData si hay datos dpay_* y es tarjeta (crédito/débito)
        let tuuPaymentData = undefined;
        if (dpayDocument.dpay_tipo_tarjeta && 
            (dpayDocument.dpay_tipo_tarjeta === 'CREDITO' || dpayDocument.dpay_tipo_tarjeta === 'DEBITO') &&
            dpayDocument.dpay_sequence_number) {
          
          const paymentMethod = dpayDocument.dpay_tipo_tarjeta === 'CREDITO' ? 1 : 
                               dpayDocument.dpay_tipo_tarjeta === 'DEBITO' ? 2 : 10;
          
          tuuPaymentData = {
            request: {
              amount: dpayDocument.dpay_monto || dpayDocument.montototal,
              method: paymentMethod,
              dteType: getDocTypeIdFromName(dpayDocument.tipo_documento) || 39,
              tip: dpayDocument.dpay_propina || undefined,
              cashback: dpayDocument.dpay_cashback || undefined,
              installmentsQuantity: dpayDocument.dpay_cuotas || undefined,
            },
            response: {
              sequenceNumber: dpayDocument.dpay_sequence_number,
              transactionStatus: dpayDocument.dpay_transaction_status ?? true,
              transactionTip: dpayDocument.dpay_propina || undefined,
              transactionCashback: dpayDocument.dpay_cashback || undefined,
              printerVoucherCommerce: true,
              authCode: dpayDocument.dpay_codigo_autorizacion || undefined,
              last4: dpayDocument.dpay_ultimos_digitos || undefined,
            },
            tipoTarjeta: dpayDocument.dpay_tipo_tarjeta as 'CREDITO' | 'DEBITO',
            idMedioPago: paymentMethod,
            montoNeto: dpayDocument.dpay_net_amount || dpayDocument.monto_neto,
            montoExento: dpayDocument.dpay_exempt_amount || dpayDocument.monto_exento,
            tipo_comision: dpayDocument.dpay_tipo_comision === 'fija' || dpayDocument.dpay_tipo_comision === 'mixta' 
              ? dpayDocument.dpay_tipo_comision as 'fija' | 'mixta'
              : undefined,
            comision_porcentaje: dpayDocument.dpay_comision_porcentaje || undefined,
            comision_monto_fijo: dpayDocument.dpay_comision_monto_fijo || undefined,
            comision_monto: dpayDocument.dpay_comision_monto || undefined,
            syncedToBackend: true,
          };}
        
        // Crear referencia si es NC con información de documento anulado
        let referencia = undefined;
        const docTypeId = getDocTypeIdFromName(dpayDocument.tipo_documento);
        if (docTypeId === 61 && dpayDocument.folio_documento_anulado && dpayDocument.tipo_documento_anulado) {
          const tipoDocAnuladoId = getDocTypeIdFromName(dpayDocument.tipo_documento_anulado);
          if (tipoDocAnuladoId) {
            referencia = {
              tipoDocRef: tipoDocAnuladoId,
              nombreDocRef: dpayDocument.tipo_documento_anulado,
              folioRef: dpayDocument.folio_documento_anulado,
              fechaRef: fechaEmision,
              razonRef: dpayDocument.razon_anulacion_nc || 'Nota de Crédito',
              codigoRef: (dpayDocument.razon_anulacion_nc && dpayDocument.razon_anulacion_nc.toLowerCase().includes('corrige')) ? 2 : 1,
            };
          }
        }
        
        // Convertir documento DPay a formato Sale
        const convertedSale: Sale = {
          id: `dpay-${dpayDocument.id_documento}`,
          results: dpayDocument.detalle.map((item): SaleItem => ({
            id: `item-${item.numero_linea}`,
            productId: item.cod_producto,
            code: item.cod_producto,
            name: item.descripcion_prod,
            count: item.cantidad,
            value: item.precio_unitario,
            total: item.total,
          })),
          documentType: getDocTypeIdFromName(dpayDocument.tipo_documento),
          folio: dpayDocument.folio,
          ted: dpayDocument.ted || undefined,
          client: dpayDocument.rut_cliente ? {
            id: `dpay-client-${dpayDocument.rut_cliente}`,
            rut: dpayDocument.rut_cliente,
            name: dpayDocument.razon_social,
            email: dpayDocument.email || undefined,
            phone: dpayDocument.telefono || undefined,
            address: dpayDocument.direccion || undefined,
            isActive: true,
            createdAt: fechaCreacion,
            updatedAt: fechaCreacion,
          } : undefined,
          paymentMethod: dpayDocument.dpay_medio_pago || dpayDocument.medio_pago,
          subtotal: dpayDocument.monto_neto + dpayDocument.monto_exento,
          neto: dpayDocument.monto_neto,
          exento: dpayDocument.monto_exento,
          iva: dpayDocument.montoiva,
          total: dpayDocument.montototal,
          createdAt: fechaCreacion,
          completedAt: fechaEmision,
          status: 'completed',
          syncStatus: 'synced',
          syncedAt: fechaCreacion,
          tuuPaymentData,
          referencia,
        };
        
        // Generar TED si no viene del servidor
        if (!convertedSale.ted && convertedSale.folio && convertedSale.documentType) {
          console.log('[ViewInvoice] Generando TED para documento DPay (folio:', convertedSale.folio, ')');
          try {
            const generatedTed = await generateTEDForSale(convertedSale);
            if (generatedTed) {
              convertedSale.ted = generatedTed;
              console.log('[ViewInvoice] TED generado exitosamente para documento DPay');
            } else {
              console.log('[ViewInvoice] No se pudo generar TED (puede faltar CAF)');
            }
          } catch (error) {
            console.error('[ViewInvoice] Error generando TED para documento DPay:', error);
          }
        }
        
        console.log('[ViewInvoice] Documento DPay convertido:', convertedSale);
        setSale(convertedSale);
        setLoading(false);
      } else if (saleId) {
        const foundSale = getSaleById(saleId);
        console.log('[ViewInvoice] Venta local cargada:', {
          id: foundSale?.id,
          folio: foundSale?.folio,
          hasTed: !!foundSale?.ted,
          tedLength: foundSale?.ted?.length || 0,
        });
        setSale(foundSale || null);
        setLoading(false);
      } else {
        setLoading(false);
      }
    };

    loadSale();
  }, [saleId, dpayDocument, isDpayDocument, getSaleById]);

  // Recargar la venta si se actualiza (solo para ventas locales)
  useEffect(() => {
    if (isDpayDocument) return; // No aplica para documentos DPay
    
    const checkForUpdates = () => {
      if (!saleId) return;
      const currentSale = getSaleById(saleId);
      if (currentSale && sale) {
        // Si la venta se actualizó (por ej. ahora tiene TED), actualizar estado
        if (currentSale.ted && !sale.ted) {
          console.log('[ViewInvoice] TED detectado, actualizando vista');
          setSale(currentSale);
        }
      }
    };

    // Verificar cada segundo por si se genera el TED
    const interval = setInterval(checkForUpdates, 1000);
    return () => clearInterval(interval);
  }, [saleId, sale, getSaleById, isDpayDocument]);

  // Función para obtener el nombre del tipo de documento
  const getDocumentTypeName = (documentType?: number): string => {
    if (documentType === 0) return 'Comprobante Electrónico';
    if (!documentType) return 'Pago recibido';

    switch (documentType) {
      case 33: return 'Factura electrónica';
      case 34: return 'Factura exenta';
      case 39: return 'Boleta electrónica';
      case 41: return 'Boleta exenta';
      case 61: return 'Nota de crédito';
      default: return `Documento ${documentType}`;
    }
  };

  const persistTed = (ted: string) => {
    setSale((prev) => (prev ? { ...prev, ted } : prev));
    if (saleId && !isDpayDocument) {
      updateSale(saleId, { ted });
    }
  };

  const resolveTedForSale = async (
    currentSale: Sale,
    options: { force?: boolean } = {},
  ): Promise<{ ted: string; generated: boolean; failedReason?: 'no_caf' | 'error' }> => {
    if (!isDteWithFolio(currentSale)) {
      return { ted: currentSale.ted || '', generated: false };
    }

    if (currentSale.ted && !options.force) {
      return { ted: currentSale.ted, generated: false };
    }

    console.log('[ViewInvoice] Generando TED para venta sin timbre...', {
      folio: currentSale.folio,
      force: !!options.force,
    });

    try {
      const generatedTed = await generateTEDForSale(currentSale);
      if (generatedTed) {
        persistTed(generatedTed);
        console.log('[ViewInvoice] TED generado y guardado exitosamente');
        return { ted: generatedTed, generated: true };
      }
      console.log('[ViewInvoice] No se pudo generar TED (puede faltar CAF)');
      return { ted: '', generated: false, failedReason: 'no_caf' };
    } catch (error) {
      console.error('[ViewInvoice] Error generando TED:', error);
      return { ted: '', generated: false, failedReason: 'error' };
    }
  };

  // Preparar datos para impresión (reutilizable)
  const getPrintData = async (tedOverride?: string) => {
    if (!sale) return null;

    let tedData = tedOverride ?? sale.ted ?? '';
    if (!tedData && isDteWithFolio(sale)) {
      const resolved = await resolveTedForSale(sale);
      tedData = resolved.ted;
    }

    return {
      empresa: {
        razon: user?.empresa?.razon || 'Empresa',
        rut: user?.empresa?.rut || '',
        giro: user?.empresa?.giro || '',
        direccion: user?.empresa?.direccion || '',
        comuna: user?.empresa?.comuna || '',
        telefono: '',
        email: '',
      },
      cliente: sale.client ? {
        rut: sale.client.rut || '66666666-6',
        nombre: (sale.client as any).razon || (sale.client as any).nombre || sale.client.name || 'Cliente',
      } : undefined,
      documentType: {
        name: typeof sale.documentType === 'number'
          ? getDocumentTypeName(sale.documentType)
          : getDocumentTypeName((sale.documentType as any)?.id),
        id: typeof sale.documentType === 'number' ? sale.documentType : (sale.documentType as any)?.id,
      },
      folio: sale.folio || 0,
      purchaseDate: sale.completedAt || sale.createdAt,
      items: sale.results.map(item => ({
        name: item.name,
        code: item.code || '',
        count: item.count,
        value: item.value,
        total: item.total,
      })),
      neto: sale.neto,
      exento: sale.exento,
      iva: sale.iva,
      total: sale.total,
      propina: sale.tuuPaymentData?.response?.transactionTip,
      ted: tedData,
      // Incluir información de referencia si existe (para NC)
      referencia: sale.referencia,
    };
  };

  const buildPaymentVoucherFromSale = (currentSale: Sale) => {
    if (!currentSale.tuuPaymentData || !user?.empresa) return null;
    const tuu = currentSale.tuuPaymentData;
    return {
      empresa: {
        razon: user.empresa.razon || 'Empresa',
        rut: user.empresa.rut || '',
        direccion: user.empresa.direccion || '',
        comuna: user.empresa.comuna || '',
      },
      tipoTarjeta: (tuu.tipoTarjeta === 'DEBITO' ? 'DEBITO' : 'CREDITO') as 'CREDITO' | 'DEBITO',
      sequenceNumber: tuu.response.sequenceNumber,
      monto: tuu.request.amount,
      montoNeto: tuu.montoNeto,
      montoExento: tuu.montoExento,
      iva: currentSale.iva ?? 0,
      propina: tuu.response.transactionTip,
      cuotas: tuu.request.installmentsQuantity,
      authCode: tuu.response.authCode,
      last4: tuu.response.last4,
      fecha: currentSale.completedAt || currentSale.createdAt,
      estado: tuu.response.transactionStatus,
    };
  };

  // Impresión automática: ejecutar cuando la venta esté cargada (solo para ventas locales)
  useEffect(() => {
    if (isDpayDocument) return; // No aplica para documentos DPay
    if (!autoPrintPending || !sale || loading || printing) return;

    setAutoPrintPending(false);

    const executeAutoPrint = async () => {
      setPrinting(true);
      try {
        if (!settings.automaticPrinting) return;

        const mode = settings.autoPrintMode;
        const voucherData = buildPaymentVoucherFromSale(sale);

        if (mode === 'document' || mode === 'both') {
          const printData = await getPrintData();
          if (printData) {
            await printReceipt(printData);
            console.log('[ViewInvoice] Impresión automática de documento completada');
          }
        }

        if ((mode === 'voucher' || mode === 'both') && voucherData) {
          if (mode === 'both') {
            await new Promise((resolve) => setTimeout(resolve, AUTO_PRINT_VOUCHER_DELAY_MS));
          }
          await printPaymentVoucher(voucherData);
          console.log('[ViewInvoice] Impresión automática de comprobante D-PAY completada');
        }
      } catch (error) {
        console.error('[ViewInvoice] Error en impresión automática:', error);
      } finally {
        setPrinting(false);
      }
    };

    executeAutoPrint();
  }, [autoPrintPending, sale, loading, isDpayDocument]);

  const handleRegenerateTedAndPrint = async () => {
    if (!sale || printing || regeneratingTed) return;

    if (!selectedPrinter) {
      setShowNoPrinterModal(true);
      return;
    }

    setRegeneratingTed(true);
    try {
      const result = await resolveTedForSale(sale, { force: true });
      if (!result.ted) {
        showAlert(
          'No se pudo generar el timbre',
          result.failedReason === 'no_caf'
            ? 'No hay CAF disponible para este tipo de documento. Cierre sesión y vuelva a entrar para descargarlo.'
            : 'No fue posible generar el timbre. Verifique conexión a internet y CAF.',
        );
        return;
      }

      const printData = await getPrintData(result.ted);
      if (!printData) return;

      setPrinting(true);
      await printReceipt(printData);
      showAlert(
        'Éxito',
        result.generated
          ? 'Timbre generado e impreso correctamente'
          : 'Documento reimpreso con timbre correctamente',
      );
    } catch (error) {
      console.error('[ViewInvoice] Error regenerando timbre e imprimiendo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showAlert('Error de impresión', `No se pudo completar la operación: ${errorMessage}`);
    } finally {
      setRegeneratingTed(false);
      setPrinting(false);
    }
  };

  // Función para manejar impresión manual
  const handlePrint = async () => {
    if (!sale || printing || regeneratingTed) return;

    // Sin impresora configurada: mostrar modal amigable
    if (!selectedPrinter) {
      setShowNoPrinterModal(true);
      return;
    }

    const printData = await getPrintData();
    if (!printData) return;

    setPrinting(true);
    try {
      await printReceipt(printData);
      if (isDteWithFolio(sale) && !printData.ted) {
        showAlert(
          'Impreso sin timbre',
          'El documento se imprimió pero no se pudo generar el código TED. Use "Generar timbre e imprimir" o verifique el CAF.',
        );
      } else if (isDteWithFolio(sale) && printData.ted && !settings.printTED) {
        showAlert(
          'Impreso sin código de barras',
          'El timbre existe pero "Imprimir código de barras" está desactivado en Ajustes.',
        );
      } else {
        showAlert('Éxito', 'Documento impreso correctamente');
      }
    } catch (error) {
      console.error('Error al imprimir:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

      // Sin impresora conectada o error de comando bluetooth
      const isNoPrinterError = 
        errorMessage.includes('no conectada') ||
        errorMessage.includes('COMMAND_NOT_SEND') ||
        errorMessage.includes('COMMAND_NOT_SUPPORT') ||
        errorMessage.toLowerCase().includes('bluetooth');

      if (isNoPrinterError) {
        setShowNoPrinterModal(true);
      } else {
        showAlert(
          'Error de impresión',
          `No se pudo imprimir el documento: ${errorMessage}`
        );
      }
    } finally {
      setPrinting(false);
    }
  };

  // Determinar tipo de documento para rutear PDF correctamente
  const isBoleta = sale?.documentType === 39 || sale?.documentType === 41;
  const isPagoRecibido = sale?.documentType === 0 || !sale?.documentType;
  const isNC = sale?.documentType === 61;
  const missingTed = !!sale && isDteWithFolio(sale) && !sale.ted;
  const tedReadyNoBarcode = !!sale?.ted && isDteWithFolio(sale) && !settings.printTED;
  // Facturas sincronizadas (con folio): siempre mostrar botón PDF, usando servidor si hay URL o local como fallback
  const isFactura = (sale?.documentType === 33 || sale?.documentType === 34) && !!sale?.folio;

  // Función para generar PDF local estilo recibo POS para boletas
  const generateVoucherPdfLocal = async (): Promise<{ filePath: string; base64: string } | null> => {
    if (!sale?.tuuPaymentData) return null;
    try {
      const tuu = sale.tuuPaymentData;
      const fecha = formatDate(sale.completedAt || sale.createdAt, 'DD/MM/YYYY');
      const hora = formatDate(sale.completedAt || sale.createdAt, 'HH:mm');
      const empresa = user?.empresa;
      const totalConPropina = tuu.request.amount + (tuu.response.transactionTip || 0);

      const row = (label: string, value: string) =>
        `<tr><td style="padding:4px 6px;color:#555;font-size:11px;">${label}</td><td style="padding:4px 6px;text-align:right;font-size:11px;">${value}</td></tr>`;

      const separador = `<tr><td colspan="2"><hr style="border:none;border-top:1px dashed #ccc;margin:4px 0;"/></td></tr>`;

      const html = `
        <!DOCTYPE html><html><head><meta charset="utf-8"/>
        <style>
          body { font-family: monospace; margin: 0; padding: 8px; font-size: 11px; }
          h2 { font-size: 13px; text-align: center; margin: 0 0 4px; }
          p { margin: 2px 0; text-align: center; font-size: 10px; color: #444; }
          table { width: 100%; border-collapse: collapse; }
          .total-row td { font-weight: bold; font-size: 13px; }
          .aprobado { color: #000000; font-weight: bold; text-align: right; }
          .rechazado { color: #000000; font-weight: bold; text-align: right; }
        </style></head><body>
        ${empresa?.razon ? `<h2>${empresa.razon}</h2>` : ''}
        ${empresa?.rut ? `<p>RUT: ${empresa.rut}</p>` : ''}
        ${empresa?.direccion ? `<p>${empresa.direccion}${empresa?.comuna ? `, ${empresa.comuna}` : ''}</p>` : ''}
        <hr style="border:none;border-top:2px solid #000;margin:6px 0;"/>
        <h2>COMPROBANTE DE PAGO</h2>
        <hr style="border:none;border-top:1px dashed #000;margin:6px 0;"/>
        <table>
          ${row('Fecha:', fecha)}
          ${row('Hora:', hora)}
          ${separador}
          ${row('Tipo tarjeta:', tuu.tipoTarjeta)}
          ${row('N° Transacción:', String(tuu.response.sequenceNumber))}
          ${tuu.response.authCode ? row('Cód. autorización:', tuu.response.authCode) : ''}
          ${tuu.response.last4 ? row('Tarjeta:', `****${tuu.response.last4}`) : ''}
          ${(tuu.request.installmentsQuantity ?? 0) > 1 ? row('Cuotas:', String(tuu.request.installmentsQuantity)) : ''}
          ${separador}
          ${row('Monto neto:', formatCurrency(tuu.montoNeto))}
          ${tuu.montoExento > 0 ? row('Monto exento:', formatCurrency(tuu.montoExento)) : ''}
          ${row('IVA (19%):', formatCurrency(sale.iva))}
          ${separador}
          <tr class="total-row">${`<td style="padding:4px 6px;font-size:13px;font-weight:bold;">Total:</td><td style="padding:4px 6px;text-align:right;font-size:13px;font-weight:bold;">${formatCurrency(tuu.request.amount)}</td>`}</tr>
          ${(tuu.response.transactionTip || 0) > 0 ? row('Propina:', formatCurrency(tuu.response.transactionTip || 0)) : ''}
          ${(tuu.response.transactionTip || 0) > 0 ? `<tr class="total-row"><td style="padding:4px 6px;font-size:13px;font-weight:bold;">A PAGAR:</td><td style="padding:4px 6px;text-align:right;font-size:13px;font-weight:bold;">${formatCurrency(totalConPropina)}</td></tr>` : ''}
          ${separador}
          <tr><td style="padding:4px 6px;font-size:11px;color:#555;">Estado:</td><td class="${tuu.response.transactionStatus ? 'aprobado' : 'rechazado'}" style="padding:4px 6px;">${tuu.response.transactionStatus ? 'APROBADO' : 'RECHAZADO'}</td></tr>
        </table>
        <hr style="border:none;border-top:2px solid #000;margin:8px 0 4px;"/>
        </body></html>`;

      const hasPropina = (tuu.response.transactionTip || 0) > 0;

      // Contar filas reales para calcular altura exacta
      let filas = 0;
      filas += 2; // fecha + hora
      filas += 1; // separador
      filas += 2; // tipo tarjeta + n° transacción
      if (tuu.response.authCode) filas += 1;
      if (tuu.response.last4) filas += 1;
      if ((tuu.request.installmentsQuantity ?? 0) > 1) filas += 1;
      filas += 1; // separador
      filas += 2; // neto + iva
      if (tuu.montoExento > 0) filas += 1;
      filas += 1; // separador
      filas += 1; // total
      if (hasPropina) filas += 2; // propina + a pagar
      filas += 1; // separador
      filas += 1; // estado

      const empresaLines =
        (empresa?.razon ? 22 : 0) +
        (empresa?.rut ? 16 : 0) +
        (empresa?.direccion ? 16 : 0);

      const estimatedHeight =
        16 +           // padding body
        empresaLines +
        8 +            // hr separador superior
        22 +           // h2 COMPROBANTE DE PAGO
        8 +            // hr dashed
        filas * 22 +   // cada fila de la tabla (padding 4px top+bottom + font 11px + espacio extra)
        20 +           // hr separador inferior
        20;            // margen seguridad

      const file = await RNHTMLtoPDF.convert({
        html,
        fileName: `comprobante_${tuu.response.sequenceNumber}_${Date.now()}`,
        directory: Platform.OS === 'android' ? 'Cache' : 'Documents',
        base64: true,
        width: 227,
        height: estimatedHeight,
        padding: 0,
      });

      if (file?.filePath && file?.base64) {
        return { filePath: file.filePath, base64: file.base64 };
      }
      return null;
    } catch (error) {
      console.error('[ViewInvoice] Error generando PDF de comprobante:', error);
      return null;
    }
  };

  const generateBoletaPdfLocal = async (): Promise<{ filePath: string; base64: string } | null> => {
    if (!sale) return null;

    try {
      console.log('[ViewInvoice] Generando PDF local estilo POS para boleta...');

      // Generar imagen del timbre PDF417 solo si está habilitado en ajustes
      let barcodeImage: string | undefined;
      if (sale.ted && sale.ted.length > 0 && settings.printTED) {
        try {
          barcodeImage = await PDF417Generator.generate(
            sale.ted,
            TED_PRINT_WIDTH,
            TED_PRINT_MAX_HEIGHT,
          );
          console.log('[ViewInvoice] PDF417 generado para boleta PDF');
        } catch (tedError) {
          console.log('[ViewInvoice] No se pudo generar PDF417:', tedError);
        }
      }

      // Construir datos para el generador de PDF
      const invoiceData = {
        sale: {
          results: sale.results.map((item) => ({
            name: item.name,
            code: item.code || '',
            count: item.count,
            value: item.value,
            total: item.total,
          })),
        },
        ted: sale.ted || '',
        information: {
          empresa: {
            razon: user?.empresa?.razon || 'Empresa',
            rut: user?.empresa?.rut || '',
            giro: user?.empresa?.giro || '',
            direccion: user?.empresa?.direccion || '',
            comuna: user?.empresa?.comuna || '',
            telefono: '',
            email: '',
          },
        },
        documentType: {
          id: sale.documentType || 39,
          name: getDocumentTypeName(sale.documentType),
        },
        folio: sale.folio || 0,
        purchaseDate: sale.completedAt || sale.createdAt,
        neto: sale.neto,
        exento: sale.exento,
        iva: sale.iva,
        total: sale.total,
        propina: sale.tuuPaymentData?.response?.transactionTip,
        cliente: sale.client ? {
          rut: sale.client.rut || '66666666-6',
          nombre: (sale.client as any).razon || (sale.client as any).nombre || sale.client.name || 'Cliente',
        } : undefined,
      };

      const pdfSettings = {
        systemImage: settings.systemImage,
        showLogo: settings.showLogo,
        header1: settings.header1 || '',
        header2: settings.header2 || '',
        header3: settings.header3 || '',
        header4: settings.header4 || '',
        header5: settings.header5 || '',
        header6: settings.header6 || '',
        footer1: settings.footer1 || '',
        footer2: settings.footer2 || '',
        footer3: settings.footer3 || '',
        footer4: settings.footer4 || '',
        footer5: settings.footer5 || '',
        footer6: settings.footer6 || '',
        commentInvoice: settings.commentInvoice || '',
      };

      const html = generateBoletaPDF(invoiceData, pdfSettings, barcodeImage);

      // Calcular altura estimada según contenido para que el PDF sea del tamaño exacto del ticket
      const itemCount = invoiceData.sale.results.length;
      const hasLogo = !!pdfSettings.systemImage;
      const hasClient = !!invoiceData.cliente;
      const hasTedText = !!(sale.ted && sale.ted.length > 0); // textos SII siempre visibles si hay TED
      const hasTedBarcode = !!barcodeImage;                   // barcode solo si printTED está activo
      const hasPropina = !!(invoiceData.propina && invoiceData.propina > 0);
      const headerLines = [pdfSettings.header1, pdfSettings.header2, pdfSettings.header3, pdfSettings.header4, pdfSettings.header5, pdfSettings.header6].filter(Boolean).length;
      const footerLines = [pdfSettings.footer1, pdfSettings.footer2, pdfSettings.footer3, pdfSettings.footer4, pdfSettings.footer5, pdfSettings.footer6].filter(Boolean).length;

      const estimatedHeight =
        20 +                         // padding body (10px top + 10px bottom)
        (hasLogo ? 110 : 0) +        // Logo
        70 +                         // Info empresa (razón, rut, giro)
        50 +                         // Dirección, teléfono, email
        58 +                         // Tipo doc + folio + separadores
        24 +                         // Fecha emisión
        (hasClient ? 60 : 0) +       // Datos receptor
        headerLines * 20 +           // Headers personalizables
        32 +                         // Encabezado tabla items
        itemCount * 32 +             // Items
        80 +                         // Totales (neto, exento, iva, total)
        (hasPropina ? 40 : 0) +      // Propina + a pagar
        footerLines * 20 +           // Footers personalizables
        (hasTedBarcode ? 120 : 0) +  // Barcode PDF417
        (hasTedText ? 48 : 0) +      // Textos SII (Res. 80, Verifique...)
        15;                          // Margen inferior mínimo

      // Convertir HTML a PDF
      const fileName = `boleta_${sale.folio}_${Date.now()}`;
      const file = await RNHTMLtoPDF.convert({
        html,
        fileName,
        directory: Platform.OS === 'android' ? 'Cache' : 'Documents',
        base64: true,
        width: 227,      // 80mm en puntos - ancho ticket térmico
        height: estimatedHeight,
        padding: 0,
      });

      if (file?.filePath && file?.base64) {
        console.log('[ViewInvoice] PDF boleta generado en:', file.filePath);
        return { filePath: file.filePath, base64: file.base64 };
      }

      return null;
    } catch (error) {
      console.error('[ViewInvoice] Error generando PDF de boleta:', error);
      return null;
    }
  };

  // Función para descargar y mostrar el PDF
  const handleViewPdf = async () => {
    if (downloadingPdf) return;

    setDownloadingPdf(true);
    try {
      // PDF local: solo boletas, pagos recibidos y NC. Facturas siempre van al servidor DTEmite.
      if (isBoleta || isPagoRecibido || isNC) {
        console.log('[ViewInvoice] Generando PDF local tipo POS para:', isBoleta ? 'boleta' : isNC ? 'nota de crédito' : 'pago recibido');
        const result = await generateBoletaPdfLocal();
        if (result) {
          setPdfFilePath(result.filePath);
          setPdfBase64(result.base64);
          setShowPdfModal(true);
        } else {
          showAlert('Error', 'No se pudo generar el PDF del documento.');
        }
        setDownloadingPdf(false);
        return;
      }

      // Facturas sin id_documento: buscarlo en el servidor por folio
      let resolvedPdfUrl = pdfProxyUrl;
      if (!resolvedPdfUrl && sale?.folio && pdfSistema) {
        try {
          const saleDate = moment(sale.completedAt || sale.createdAt);
          const documents = await listarDocumentosDpay({
            fecha_desde: saleDate.format('DD-MM-YYYY'),
            fecha_hasta: saleDate.format('DD-MM-YYYY'),
          });
          const match = documents.find(d => d.folio === sale.folio);
          if (match?.id_documento) {
            updateSale(sale.id, { id_documento: match.id_documento });
            resolvedPdfUrl = `https://pro.dtemite.cl/api/pdfview/O/${md5(pdfSistema)}/${md5(String(match.id_documento))}`;
          }
        } catch (lookupError) {
          console.error('[ViewInvoice] Error buscando id_documento por folio:', lookupError);
        }
      }

      if (!resolvedPdfUrl) {
        showAlert('Error', 'No se encontró el PDF del documento en el servidor.');
        setDownloadingPdf(false);
        return;
      }

      console.log('[ViewInvoice] URL proxy PDF:', resolvedPdfUrl);

      // Descargar siguiendo el redirect 301 y mostrar en visor integrado
      console.log('[ViewInvoice] Descargando PDF (siguiendo redirect)...');

      const dirs = ReactNativeBlobUtil.fs.dirs;
      const fileName = `documento_${pdfFolio}_${Date.now()}.pdf`;
      const downloadPath = `${dirs.CacheDir}/${fileName}`;

      // ReactNativeBlobUtil sigue redirects 301 automáticamente
      const response = await ReactNativeBlobUtil.config({
        fileCache: true,
        path: downloadPath,
      }).fetch('GET', resolvedPdfUrl);

      const statusCode = response.info().status;
      const finalUrl = response.info().redirects
        ? response.info().redirects[response.info().redirects.length - 1]
        : resolvedPdfUrl;
      console.log('[ViewInvoice] Respuesta descarga:', statusCode, '| URL final:', finalUrl);

      if (statusCode === 200) {
        const filePath = response.path();
        console.log('[ViewInvoice] PDF descargado en:', filePath);
        const base64Content = await ReactNativeBlobUtil.fs.readFile(filePath, 'base64');
        setPdfFilePath(filePath);
        setPdfBase64(base64Content);
        setShowPdfModal(true);
      } else {
        showAlert('Error', `No se pudo descargar el PDF (código ${statusCode}).`);
      }
    } catch (error) {
      console.error('[ViewInvoice] Error al abrir/descargar PDF:', error);
      showAlert('Error', 'No se pudo abrir el documento PDF.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Función para manejar compartir documento - OCULTO (funcionalidad futura)
  /* const handleShare = () => {
    if (!sale) return;

    // Convertir la estructura de Sale a la estructura esperada por el PDF
    const invoiceData = {
      sale: {
        results: sale.results.map((item) => ({
          name: item.name,
          code: item.code || '',
          count: item.count,
          value: item.value,
          total: item.total,
        })),
      },
      ted: sale.ted || '', // TED generado en SaleCompletedScreen
      information: {
        empresa: {
          razon: user?.empresa?.razon || 'Empresa',
          rut: user?.empresa?.rut || '',
          giro: user?.empresa?.giro || '',
          direccion: user?.empresa?.direccion || '',
          comuna: user?.empresa?.comuna || '',
          telefono: '',
          email: '',
        },
      },
      documentType: {
        id: sale.documentType || 39,
        name: getDocumentTypeName(sale.documentType),
      },
      folio: sale.folio || 0,
      purchaseDate: sale.completedAt || sale.createdAt,
      neto: sale.neto,
      exento: sale.exento,
      iva: sale.iva,
      total: sale.total,
      propina: sale.tuuPaymentData?.response?.transactionTip,
    };

    const shareSettings = {
      systemImage: settings.systemImage,
      showLogo: settings.showLogo,
      header1: settings.header1 || '',
      header2: settings.header2 || '',
      header3: settings.header3 || '',
      header4: settings.header4 || '',
      footer1: settings.footer1 || '',
      footer2: settings.footer2 || '',
      footer3: settings.footer3 || '',
      footer4: settings.footer4 || '',
      commentInvoice: settings.commentInvoice || '',
    };

    navigation.navigate('Share', {
      invoiceData,
      settings: shareSettings,
    });
  }; */

  // Mostrar loading
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: themeColors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Image
          source={require('../../assets/logos/logo_dpay_cargando.gif')}
          style={{ width: 140, height: 140 }}
          resizeMode="contain"
        />
      </View>
    );
  }

  // Mostrar error si no se encuentra la venta
  if (!sale) {
    return (
      <View style={{ flex: 1, backgroundColor: themeColors.background, padding: 20 }}>
        <StatusBar
          barStyle={themeColors.background === '#FFFFFF' ? 'dark-content' : 'light-content'}
          backgroundColor={themeColors.background}
        />
        <SafeAreaView />
        <BackButton onPress={() => navigation.goBack()} />
        <EmptyState
          icon="❌"
          title="Venta no encontrada"
          message="No se pudo encontrar la venta solicitada"
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.background, padding: 20 }}>
      <StatusBar
        barStyle={themeColors.background === '#FFFFFF' ? 'dark-content' : 'light-content'}
        backgroundColor={themeColors.background}
      />
      <SafeAreaView />

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={{
          fontSize: 20,
          fontWeight: 'bold',
          color: '#03C0C3',
          textTransform: 'uppercase',
        }}>
          {getDocumentTypeName(typeof sale.documentType === 'number' ? sale.documentType : (sale.documentType as any)?.id)}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
      >
        {/* Card principal con toda la información */}
        <View style={{
          backgroundColor: isDark ? '#FFFFFF' : '#052CCE',
          borderRadius: 16,
          padding: 20,
          marginBottom: 20,
        }}>
          {/* Estado de sincronización - Solo para ventas locales que son DTE con folio */}
          {!isDpayDocument && !isPagoRecibido && !!sale.folio && sale.syncStatus === 'synced' && (
            <View style={{
              backgroundColor: '#03C0C3',
              padding: 12,
              borderRadius: 8,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <Text style={{ fontSize: 14, color: '#FFFFFF', fontWeight: 'bold' }}>
                DTE sincronizado correctamente
              </Text>
              <Text style={{ fontSize: 18, color: '#FFFFFF' }}>✓</Text>
            </View>
          )}

          {!isDpayDocument && !isPagoRecibido && !sale.folio && sale.syncStatus !== 'syncing' && (
            <View style={{
              backgroundColor: '#DC3545',
              padding: 12,
              borderRadius: 8,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <Text style={{ fontSize: 14, color: '#FFFFFF', fontWeight: 'bold' }}>
                DTE no sincronizado
              </Text>
              <Text style={{ fontSize: 20, color: '#FFFFFF', fontWeight: 'bold' }}>✕</Text>
            </View>
          )}

          {missingTed && (
            <View style={{
              backgroundColor: '#FF9800',
              padding: 14,
              borderRadius: 8,
              marginBottom: 16,
            }}>
              <Text style={{ fontSize: 14, color: '#FFFFFF', fontWeight: 'bold', marginBottom: 6 }}>
                Documento con folio sin timbre electrónico
              </Text>
              <Text style={{ fontSize: 12, color: '#FFFFFF', lineHeight: 18, marginBottom: 12 }}>
                El DTE está emitido pero falta el código TED en este equipo. Puede generarlo e imprimir de nuevo.
                Si persiste, cierre sesión y vuelva a entrar para actualizar el CAF.
              </Text>
              <TouchableOpacity
                onPress={handleRegenerateTedAndPrint}
                disabled={regeneratingTed || printing}
                style={{
                  backgroundColor: '#FFFFFF',
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 8,
                  alignItems: 'center',
                  opacity: regeneratingTed || printing ? 0.6 : 1,
                }}>
                <Text style={{ fontSize: 13, color: '#E65100', fontWeight: 'bold' }}>
                  {regeneratingTed ? 'Generando timbre...' : 'Generar timbre e imprimir'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {tedReadyNoBarcode && (
            <View style={{
              backgroundColor: '#FFC107',
              padding: 12,
              borderRadius: 8,
              marginBottom: 16,
            }}>
              <Text style={{ fontSize: 13, color: '#5D4037', fontWeight: 'bold' }}>
                Timbre disponible — código de barras desactivado
              </Text>
              <Text style={{ fontSize: 12, color: '#5D4037', marginTop: 4, lineHeight: 17 }}>
                Active &quot;Imprimir código de barras&quot; en Ajustes para incluir el PDF417 en el ticket.
              </Text>
            </View>
          )}

          {/* Tipo de Documento */}
          <View style={{
            backgroundColor: isDark ? '#E3F2FD' : 'rgba(255, 255, 255, 0.15)',
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
          }}>
            <Text style={{ 
              fontSize: 15, 
              color: isDark ? '#052CCE' : '#FFFFFF', 
              fontWeight: 'bold',
              textAlign: 'center'
            }}>
              {getDocumentTypeName(typeof sale.documentType === 'number' ? sale.documentType : (sale.documentType as any)?.id)}
            </Text>
            {/* Mostrar si es afecta o exenta */}
            {(sale.neto > 0 || sale.exento > 0) && (
              <Text style={{ 
                fontSize: 12, 
                color: isDark ? '#666' : 'rgba(255, 255, 255, 0.8)', 
                textAlign: 'center',
                marginTop: 4
              }}>
                {sale.neto > 0 && sale.exento > 0 ? 'Afecta y Exenta' : sale.neto > 0 ? 'Afecta' : 'Exenta'}
              </Text>
            )}
          </View>

          {/* Información de Referencia (para NC) */}
          {sale.referencia && (
            <View style={{
              backgroundColor: isDark ? '#FFF3E0' : 'rgba(255, 193, 7, 0.2)',
              padding: 12,
              borderRadius: 8,
              marginBottom: 16,
              borderLeftWidth: 4,
              borderLeftColor: '#FF9800',
            }}>
              <Text style={{ 
                fontSize: 13, 
                color: isDark ? '#E65100' : '#FFE0B2', 
                fontWeight: 'bold',
                marginBottom: 6
              }}>
                {sale.referencia.razonRef}
              </Text>
              <Text style={{ 
                fontSize: 12, 
                color: isDark ? '#666' : 'rgba(255, 255, 255, 0.9)'
              }}>
                Documento referenciado: {sale.referencia.nombreDocRef} Folio {sale.referencia.folioRef}
              </Text>
            </View>
          )}

          {/* Botón para expandir/contraer detalle */}
          <Text style={{ fontSize: 16, color: isDark ? '#052CCE' : '#FFFFFF', fontWeight: 'bold', marginBottom: 8 }}>
            {sale.folio ? `Folio: ${sale.folio}` : 'Detalle de compra'}
          </Text>

          <Text style={{ fontSize: 14, color: isDark ? '#052CCE' : '#FFFFFF', marginBottom: sale.client || sale.paymentMethod ? 8 : 20 }}>
            Fecha: {formatDate(sale.completedAt || sale.createdAt, 'DD-MM-YYYY')}
          </Text>

          {/* Información del Cliente */}
          {sale.client && (
            <View style={{
              backgroundColor: isDark ? '#F5F5F5' : 'rgba(255, 255, 255, 0.1)',
              padding: 10,
              borderRadius: 6,
              marginBottom: 8,
            }}>
              <Text style={{ fontSize: 13, color: isDark ? '#052CCE' : '#FFFFFF', fontWeight: 'bold', marginBottom: 4 }}>
                Cliente:
              </Text>
              <Text style={{ fontSize: 13, color: isDark ? '#052CCE' : '#FFFFFF' }}>
                {sale.client.name}
              </Text>
              {sale.client.rut && (
                <Text style={{ fontSize: 12, color: isDark ? '#666' : 'rgba(255, 255, 255, 0.8)' }}>
                  RUT: {sale.client.rut}
                </Text>
              )}
            </View>
          )}

          {/* Medio de Pago */}
          {sale.paymentMethod && (
            <View style={{
              backgroundColor: isDark ? '#F5F5F5' : 'rgba(255, 255, 255, 0.1)',
              padding: 10,
              borderRadius: 6,
              marginBottom: 20,
            }}>
              <Text style={{ fontSize: 13, color: isDark ? '#052CCE' : '#FFFFFF' }}>
                Medio de pago: <Text style={{ fontWeight: 'bold' }}>{sale.paymentMethod}</Text>
              </Text>
            </View>
          )}

          {detailExpanded && (
            <>
              {/* Detalle de Productos - con flecha para colapsar */}
              <TouchableOpacity
                onPress={() => setDetailExpanded(false)}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: isDark ? '#052CCE' : '#FFFFFF' }}>
                  Detalle de productos
                </Text>
                <Text style={{ fontSize: 18, color: isDark ? '#052CCE' : '#FFFFFF' }}>▼</Text>
              </TouchableOpacity>

              {sale.results.map((item, index) => (
                <View
                  key={item.id}
                  style={{
                    marginBottom: index < sale.results.length - 1 ? 12 : 0,
                  }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 15, color: isDark ? '#052CCE' : '#FFFFFF', flex: 1 }}>
                      {item.name}
                    </Text>
                    <Text style={{ fontSize: 15, color: isDark ? '#052CCE' : '#FFFFFF', fontWeight: 'bold', marginLeft: 10 }}>
                      {formatCurrency(item.total)}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 13, color: isDark ? '#052CCE' : '#FFFFFF' }}>
                      {item.count} x {formatCurrency(item.value)}
                    </Text>
                    {item.code && (
                      <Text style={{ fontSize: 13, color: isDark ? '#052CCE' : '#FFFFFF' }}>
                        Código: {item.code}
                      </Text>
                    )}
                  </View>
                </View>
              ))}

              {/* Línea separadora */}
              <View style={{ height: 2, backgroundColor: isDark ? '#052CCE' : '#FFFFFF', marginVertical: 20 }} />
            </>
          )}

          {/* Resumen - con flecha para expandir cuando está colapsado */}
          <TouchableOpacity
            onPress={() => setDetailExpanded(!detailExpanded)}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: isDark ? '#052CCE' : '#FFFFFF' }}>
              Resumen
            </Text>
            {!detailExpanded && (
              <Text style={{ fontSize: 18, color: isDark ? '#052CCE' : '#FFFFFF' }}>▶</Text>
            )}
          </TouchableOpacity>

          {sale.neto > 0 && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 14, color: isDark ? '#052CCE' : '#FFFFFF' }}>Neto</Text>
              <Text style={{ fontSize: 14, color: isDark ? '#052CCE' : '#FFFFFF' }}>{formatCurrency(sale.neto)}</Text>
            </View>
          )}

          {sale.exento > 0 && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 14, color: isDark ? '#052CCE' : '#FFFFFF' }}>Exento</Text>
              <Text style={{ fontSize: 14, color: isDark ? '#052CCE' : '#FFFFFF' }}>{formatCurrency(sale.exento)}</Text>
            </View>
          )}

          {sale.iva > 0 && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 14, color: isDark ? '#052CCE' : '#FFFFFF' }}>IVA (19%)</Text>
              <Text style={{ fontSize: 14, color: isDark ? '#052CCE' : '#FFFFFF' }}>{formatCurrency(sale.iva)}</Text>
            </View>
          )}

          {/* TOTAL (del documento) */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: (sale.tuuPaymentData?.response?.transactionTip ?? 0) > 0 ? 8 : 20 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: isDark ? '#052CCE' : '#FFFFFF' }}>Total</Text>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: isDark ? '#052CCE' : '#FFFFFF' }}>
              {formatCurrency(sale.total)}
            </Text>
          </View>

          {/* PROPINA + A PAGAR (solo si hay propina) */}
          {(sale.tuuPaymentData?.response?.transactionTip ?? 0) > 0 && (
            <>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 14, color: isDark ? '#052CCE' : '#FFFFFF' }}>Propina</Text>
                <Text style={{ fontSize: 14, color: isDark ? '#052CCE' : '#FFFFFF' }}>{formatCurrency(sale.tuuPaymentData!.response.transactionTip!)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: isDark ? '#052CCE' : '#FFFFFF' }}>A PAGAR:</Text>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: isDark ? '#052CCE' : '#FFFFFF' }}>
                  {formatCurrency(sale.total + sale.tuuPaymentData!.response.transactionTip!)}
                </Text>
              </View>
            </>
          )}

          {/* Botones de acción */}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 16 }}>
            <View style={{ alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Sale')}
                style={{
                  width: 60,
                  height: 60,
                  backgroundColor: '#d4186e',
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Image
                  source={require('../../assets/icons_new/nueva_compra_blanco.png')}
                  style={{ width: 40, height: 40, tintColor: '#FFFFFF' }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <Text style={{ fontSize: 11, color: isDark ? '#052CCE' : '#FFFFFF', fontWeight: 'bold', marginTop: 6, textAlign: 'center' }}>
                Nueva Vta.
              </Text>
            </View>

            {/* Botón Ver Recibo - comprobante TUU */}
            {sale.tuuPaymentData && sale.tuuPaymentData.tipoTarjeta !== 'EFECTIVO' && (
              <View style={{ alignItems: 'center' }}>
                <TouchableOpacity
                  onPress={() => setShowVoucherModal(true)}
                  style={{
                    width: 60,
                    height: 60,
                    backgroundColor: isDark ? '#052CCE' : '#FFFFFF',
                    borderRadius: 8,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Image
                    source={require('../../assets/icons_new/documento_blanco.png')}
                    style={{ width: 35, height: 35, tintColor: isDark ? '#FFFFFF' : '#052CCE' }}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
                <Text style={{ fontSize: 11, color: isDark ? '#052CCE' : '#FFFFFF', fontWeight: 'bold', marginTop: 6, textAlign: 'center' }}>
                  Ver Recibo
                </Text>
              </View>
            )}

            {/* Botón Ver PDF */}
            {(isBoleta || isPagoRecibido || isNC || isFactura || pdfProxyUrl) && (
              <View style={{ alignItems: 'center' }}>
                <TouchableOpacity
                  onPress={handleViewPdf}
                  disabled={downloadingPdf}
                  style={{
                    width: 60,
                    height: 60,
                    backgroundColor: isDark ? '#052CCE' : '#FFFFFF',
                    borderRadius: 8,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: downloadingPdf ? 0.6 : 1,
                  }}>
                  {downloadingPdf ? (
                    <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#052CCE'} />
                  ) : (
                    <Image
                      source={require('../../assets/icons_new/compartir_documento_blanco.png')}
                      style={{ width: 35, height: 35, tintColor: isDark ? '#FFFFFF' : '#052CCE' }}
                      resizeMode="contain"
                    />
                  )}
                </TouchableOpacity>
                <Text style={{ fontSize: 11, color: isDark ? '#052CCE' : '#FFFFFF', fontWeight: 'bold', marginTop: 6, textAlign: 'center' }}>
                  {downloadingPdf ? 'Cargando...' : 'Ver PDF'}
                </Text>
              </View>
            )}

            {/* Botón Compartir - OCULTO (funcionalidad futura) */}
            {/* <View style={{ alignItems: 'center' }}>
              <TouchableOpacity
                onPress={handleShare}
                style={{
                  width: 60,
                  height: 60,
                  backgroundColor: isDark ? '#052CCE' : '#FFFFFF',
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Image
                  source={require('../../assets/icons_new/compartir_documento_azul.png')}
                  style={{ width: 40, height: 40, tintColor: isDark ? '#FFFFFF' : '#052CCE' }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <Text style={{ fontSize: 11, color: isDark ? '#052CCE' : '#FFFFFF', fontWeight: 'bold', marginTop: 6, textAlign: 'center' }}>
                Compartir{'\n'}Documento
              </Text>
            </View> */}

            <View style={{ alignItems: 'center' }}>
              <TouchableOpacity
                onPress={handlePrint}
                disabled={printing || regeneratingTed}
                style={{
                  width: 60,
                  height: 60,
                  backgroundColor: isDark ? '#052CCE' : '#FFFFFF',
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: printing || regeneratingTed ? 0.5 : 1,
                }}>
                <Image
                  source={require('../../assets/icons_new/imprimir_azul.png')}
                  style={{ width: 40, height: 40, tintColor: isDark ? '#FFFFFF' : '#052CCE' }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <Text style={{ fontSize: 11, color: isDark ? '#052CCE' : '#FFFFFF', fontWeight: 'bold', marginTop: 6, textAlign: 'center' }}>
                {printing ? 'Imprimiendo...' : 'Imprimir'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modal para ver el comprobante de pago TUU */}
      <AppModal
        visible={showVoucherModal}
        title="Comprobante de Pago"
        onClose={() => setShowVoucherModal(false)}
        maxWidth={450}
      >
        <ScrollView style={{ maxHeight: 450, marginBottom: 16 }}>
          {sale?.tuuPaymentData && (
            <View>
              {/* Fecha */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: themeColors.textSecondary, fontFamily: 'Montserrat-Bold_0' }}>Fecha:</Text>
                <Text style={{ color: themeColors.text, fontFamily: 'Montserrat-Bold_0' }}>
                  {formatDate(sale.completedAt || sale.createdAt, 'DD/MM/YYYY')}
                </Text>
              </View>

              {/* Hora */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: themeColors.textSecondary, fontFamily: 'Montserrat-Bold_0' }}>Hora:</Text>
                <Text style={{ color: themeColors.text, fontFamily: 'Montserrat-Bold_0' }}>
                  {formatDate(sale.completedAt || sale.createdAt, 'HH:mm')}
                </Text>
              </View>

              {/* Separador */}
              <View style={{ height: 1, backgroundColor: '#E0E0E0', marginVertical: 8 }} />

              {/* Tipo de tarjeta */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: themeColors.textSecondary, fontFamily: 'Montserrat-Bold_0' }}>Tipo de tarjeta:</Text>
                <Text style={{ color: themeColors.text, fontFamily: 'Montserrat-Bold_0' }}>
                  {sale.tuuPaymentData.tipoTarjeta}
                </Text>
              </View>

              {/* Número de transacción */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: themeColors.textSecondary, fontFamily: 'Montserrat-Bold_0' }}>N° Transacción:</Text>
                <Text style={{ color: themeColors.text, fontFamily: 'Montserrat-Bold_0' }}>
                  {sale.tuuPaymentData.response.sequenceNumber}
                </Text>
              </View>

              {/* Código de autorización */}
              {sale.tuuPaymentData.response.authCode && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ color: themeColors.textSecondary, fontFamily: 'Montserrat-Bold_0' }}>Código autorización:</Text>
                  <Text style={{ color: themeColors.text, fontFamily: 'Montserrat-Bold_0' }}>
                    {sale.tuuPaymentData.response.authCode}
                  </Text>
                </View>
              )}

              {/* Últimos 4 dígitos */}
              {sale.tuuPaymentData.response.last4 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ color: themeColors.textSecondary, fontFamily: 'Montserrat-Bold_0' }}>Tarjeta:</Text>
                  <Text style={{ color: themeColors.text, fontFamily: 'Montserrat-Bold_0' }}>
                    ****{sale.tuuPaymentData.response.last4}
                  </Text>
                </View>
              )}

              {/* Cuotas */}
              {(sale.tuuPaymentData.request.installmentsQuantity ?? 0) > 1 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ color: themeColors.textSecondary, fontFamily: 'Montserrat-Bold_0' }}>Cuotas:</Text>
                  <Text style={{ color: themeColors.text, fontFamily: 'Montserrat-Bold_0' }}>
                    {sale.tuuPaymentData.request.installmentsQuantity}
                  </Text>
                </View>
              )}

              {/* Separador */}
              <View style={{ height: 1, backgroundColor: '#E0E0E0', marginVertical: 8 }} />

              {/* Monto Neto */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: themeColors.textSecondary, fontFamily: 'Montserrat-Bold_0' }}>Monto neto:</Text>
                <Text style={{ color: themeColors.text, fontFamily: 'Montserrat-Bold_0' }}>
                  {formatCurrency(sale.tuuPaymentData.montoNeto)}
                </Text>
              </View>

              {/* Monto Exento */}
              {sale.tuuPaymentData.montoExento > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ color: themeColors.textSecondary, fontFamily: 'Montserrat-Bold_0' }}>Monto exento:</Text>
                  <Text style={{ color: themeColors.text, fontFamily: 'Montserrat-Bold_0' }}>
                    {formatCurrency(sale.tuuPaymentData.montoExento)}
                  </Text>
                </View>
              )}

              {/* IVA */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: themeColors.textSecondary, fontFamily: 'Montserrat-Bold_0' }}>IVA (19%):</Text>
                <Text style={{ color: themeColors.text, fontFamily: 'Montserrat-Bold_0' }}>
                  {formatCurrency(sale.iva)}
                </Text>
              </View>

              {/* Separador */}
              <View style={{ height: 1, backgroundColor: '#E0E0E0', marginVertical: 8 }} />

              {/* TOTAL (del documento) */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: themeColors.textSecondary, fontFamily: 'Montserrat-Bold_0', fontSize: 16 }}>Total:</Text>
                <Text style={{ color: themeColors.text, fontFamily: 'Montserrat-Bold_0', fontSize: 16 }}>
                  {formatCurrency(sale.tuuPaymentData.request.amount)}
                </Text>
              </View>

              {/* PROPINA + A PAGAR (solo si hay propina) */}
              {(sale.tuuPaymentData.response.transactionTip || 0) > 0 && (
                <>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ color: themeColors.textSecondary, fontFamily: 'Montserrat-Bold_0' }}>Propina:</Text>
                    <Text style={{ color: themeColors.text, fontFamily: 'Montserrat-Bold_0' }}>
                      {formatCurrency(sale.tuuPaymentData.response.transactionTip || 0)}
                    </Text>
                  </View>

                  <View style={{ height: 1, backgroundColor: '#E0E0E0', marginVertical: 8 }} />

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ color: themeColors.textSecondary, fontFamily: 'Montserrat-Bold_0', fontSize: 16 }}>A PAGAR:</Text>
                    <Text style={{ color: themeColors.text, fontFamily: 'Montserrat-Bold_0', fontSize: 16 }}>
                      {formatCurrency(sale.tuuPaymentData.request.amount + (sale.tuuPaymentData.response.transactionTip || 0))}
                    </Text>
                  </View>
                </>
              )}

              {/* Estado */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 8,
                marginTop: 8,
                paddingTop: 8,
                borderTopWidth: 1,
                borderTopColor: '#75bebf',
              }}>
                <Text style={{ color: themeColors.textSecondary, fontFamily: 'Montserrat-Bold_0' }}>Estado:</Text>
                <Text style={{
                  color: sale.tuuPaymentData.response.transactionStatus
                    ? '#4caf50'
                    : '#f44336',
                  fontFamily: 'Montserrat-Bold_0',
                }}>
                  {sale.tuuPaymentData.response.transactionStatus ? 'APROBADO' : 'RECHAZADO'}
                </Text>
              </View>

              {/* Estado de sincronización con backend - solo para ventas locales no sincronizadas */}
              {!isDpayDocument && !sale.tuuPaymentData.syncedToBackend && (
                <View style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: '#75bebf'
                }}>
                  {!sale.folio && sale.documentType !== undefined && sale.documentType !== 0 ? (
                    <Text style={{
                      color: '#ff9800',
                      fontSize: 12,
                      textAlign: 'center',
                      fontFamily: 'Montserrat-Bold_0',
                    }}>
                      Documento pendiente de sincronización. El pago se registrará automáticamente al sincronizar.
                    </Text>
                  ) : (
                    <View>
                      {sale.tuuPaymentData.backendSyncError && (
                        <Text style={{
                          color: '#f44336',
                          fontSize: 12,
                          textAlign: 'center',
                          marginBottom: 8,
                          fontFamily: 'Montserrat-Bold_0',
                        }}>
                          Error: {sale.tuuPaymentData.backendSyncError}
                        </Text>
                      )}
                      <TouchableOpacity
                        onPress={async () => {
                          setSyncingTuu(true);
                          try {
                            const success = await syncTuuPayment(sale.id);
                            if (success) {
                              showAlert('Éxito', 'Pago sincronizado correctamente');
                              const updatedSale = saleId ? getSaleById(saleId) : null;
                              if (updatedSale) setSale(updatedSale);
                              setShowVoucherModal(false);
                            } else {
                              showAlert('Error', 'No se pudo sincronizar el pago');
                            }
                          } catch (error) {
                            showAlert('Error', 'Ocurrió un error al sincronizar');
                          } finally {
                            setSyncingTuu(false);
                          }
                        }}
                        disabled={syncingTuu}
                        style={{
                          backgroundColor: '#75bebf',
                          paddingVertical: 12,
                          paddingHorizontal: 20,
                          borderRadius: 25,
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ color: '#FFFFFF', fontFamily: 'Montserrat-Bold_0' }}>
                          {syncingTuu ? 'Sincronizando...' : 'Reintentar sincronización'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
        </ScrollView>

        <View style={{ gap: 8 }}>
          <TouchableOpacity
            onPress={async () => {
              if (downloadingVoucherPdf) return;
              setDownloadingVoucherPdf(true);
              try {
                const result = await generateVoucherPdfLocal();
                if (result) {
                  setShowVoucherModal(false);
                  setPdfFilePath(result.filePath);
                  setPdfBase64(result.base64);
                  setShowPdfModal(true);
                } else {
                  showAlert('Error', 'No se pudo generar el PDF del comprobante.');
                }
              } finally {
                setDownloadingVoucherPdf(false);
              }
            }}
            disabled={downloadingVoucherPdf}
            style={{
              backgroundColor: '#052CCE',
              paddingVertical: 14,
              paddingHorizontal: 20,
              borderRadius: 25,
              alignItems: 'center',
              opacity: downloadingVoucherPdf ? 0.6 : 1,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontFamily: 'Montserrat-Bold_0', fontSize: 16 }}>
              {downloadingVoucherPdf ? 'Generando PDF...' : 'Ver PDF'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={async () => {
              if (!sale?.tuuPaymentData) return;
              setPrintingVoucher(true);
              try {
                await printPaymentVoucher({
                  empresa: {
                    razon: user?.empresa?.razon || 'Empresa',
                    rut: user?.empresa?.rut || '',
                    direccion: user?.empresa?.direccion || '',
                    comuna: user?.empresa?.comuna || '',
                  },
                  tipoTarjeta: sale.tuuPaymentData.tipoTarjeta as 'CREDITO' | 'DEBITO',
                  sequenceNumber: sale.tuuPaymentData.response.sequenceNumber,
                  monto: sale.tuuPaymentData.request.amount,
                  montoNeto: sale.tuuPaymentData.montoNeto,
                  montoExento: sale.tuuPaymentData.montoExento,
                  iva: sale.iva,
                  propina: sale.tuuPaymentData.response.transactionTip,
                  cuotas: sale.tuuPaymentData.request.installmentsQuantity,
                  authCode: sale.tuuPaymentData.response.authCode,
                  last4: sale.tuuPaymentData.response.last4,
                  fecha: sale.completedAt || sale.createdAt,
                  estado: sale.tuuPaymentData.response.transactionStatus,
                });
                showAlert('Éxito', 'Comprobante impreso correctamente');
              } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
                showAlert('Error', errorMessage);
              } finally {
                setPrintingVoucher(false);
              }
            }}
            disabled={printingVoucher}
            style={{
              backgroundColor: '#75bebf',
              paddingVertical: 14,
              paddingHorizontal: 20,
              borderRadius: 25,
              alignItems: 'center',
              opacity: printingVoucher ? 0.6 : 1,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontFamily: 'Montserrat-Bold_0', fontSize: 16 }}>
              {printingVoucher ? 'Imprimiendo...' : 'Imprimir comprobante'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowVoucherModal(false)}
            style={{
              backgroundColor: '#d4186e',
              paddingVertical: 14,
              paddingHorizontal: 20,
              borderRadius: 25,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontFamily: 'Montserrat-Bold_0', fontSize: 16 }}>
              Cerrar
            </Text>
          </TouchableOpacity>
        </View>
      </AppModal>

      {/* Modal: sin impresora conectada */}
      <AppModal
        visible={showNoPrinterModal}
        title="Sin impresora conectada"
        message="No tienes una impresora conectada. ¿Quieres conectar una?"
        buttons={[
          { text: 'No', onPress: () => setShowNoPrinterModal(false), variant: 'primary' },
          {
            text: 'Sí',
            onPress: () => {
              setShowNoPrinterModal(false);
              navigation.navigate('PrinterSettings', { returnToSettings: true });
            },
            variant: 'secondary',
          },
        ]}
        onClose={() => setShowNoPrinterModal(false)}
      />

      {/* Modal visor de PDF */}
      <Modal
        visible={showPdfModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowPdfModal(false);
          setPdfFilePath(null);
        }}
      >
        <View style={{ flex: 1, backgroundColor: '#000000' }}>
          {/* Header del modal */}
          <View style={{
            backgroundColor: '#052CCE',
            paddingTop: 40,
            paddingBottom: 16,
            paddingHorizontal: 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' }}>
              Documento PDF
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowPdfModal(false);
                setPdfFilePath(null);
                setPdfBase64(null);
              }}
              style={{
                width: 40,
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' }}>×</Text>
            </TouchableOpacity>
          </View>

          {/* Visor de PDF */}
          {pdfBase64 ? (
            <Pdf
              source={{ uri: `data:application/pdf;base64,${pdfBase64}` }}
              style={{ flex: 1, backgroundColor: '#000000' }}
              onLoadComplete={(numberOfPages) => {
                console.log(`[ViewInvoice] PDF cargado con ${numberOfPages} páginas`);
              }}
              onError={(error) => {
                console.error('[ViewInvoice] Error al cargar PDF:', error);
                showAlert('Error', 'No se pudo cargar el documento PDF.');
                setShowPdfModal(false);
                setPdfFilePath(null);
                setPdfBase64(null);
              }}
              trustAllCerts={false}
            />
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Image
                source={require('../../assets/logos/logo_dpay_cargando.gif')}
                style={{ width: 120, height: 120 }}
                resizeMode="contain"
              />
            </View>
          )}

          {/* Botones de acción dentro del visor PDF */}
          <View style={{
            backgroundColor: '#052CCE',
            paddingVertical: 16,
            paddingHorizontal: 30,
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'center',
          }}>
            {/* Nueva Vta. */}
            <View style={{ alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => {
                  setShowPdfModal(false);
                  setPdfFilePath(null);
                  navigation.navigate('Sale');
                }}
                style={{
                  width: 60,
                  height: 60,
                  backgroundColor: '#d4186e',
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Image
                  source={require('../../assets/icons_new/nueva_compra_blanco.png')}
                  style={{ width: 40, height: 40, tintColor: '#FFFFFF' }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <Text style={{ fontSize: 11, color: '#FFFFFF', fontWeight: 'bold', marginTop: 6, textAlign: 'center' }}>
                Nueva Vta.
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => {
                  setShowPdfModal(false);
                  setPdfFilePath(null);
                  handlePrint();
                }}
                disabled={printing}
                style={{
                  width: 60,
                  height: 60,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: printing ? 0.5 : 1,
                }}>
                <Image
                  source={require('../../assets/icons_new/imprimir_azul.png')}
                  style={{ width: 40, height: 40, tintColor: '#052CCE' }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <Text style={{ fontSize: 11, color: '#FFFFFF', fontWeight: 'bold', marginTop: 6, textAlign: 'center' }}>
                {printing ? 'Imprimiendo...' : 'Imprimir'}
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Overlay de carga para impresión y generación de PDF */}
      <Modal
        visible={printing || downloadingPdf || regeneratingTed}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.55)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Image
            source={require('../../assets/logos/logo_dpay_cargando.gif')}
            style={{ width: 150, height: 150 }}
            resizeMode="contain"
          />
          <Text style={{ color: '#FFFFFF', marginTop: 8, fontSize: 14, fontFamily: 'Montserrat-Bold' }}>
            {regeneratingTed ? 'Generando timbre...' : printing ? 'Imprimiendo...' : 'Generando documento...'}
          </Text>
        </View>
      </Modal>
    </View>
  );
};