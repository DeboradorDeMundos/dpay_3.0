import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import { View, Text, TouchableOpacity, StatusBar, SafeAreaView, FlatList, ScrollView, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../theme';
import { EmptyState, BackButton, AppModal, SuccessModal, SearchInput, Loading } from '../components/base';
import { formatCurrency, formatDate } from '../utils/format';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useThemeColors } from '../hooks/useThemeColors';
import { useMySalesStore } from '../stores/mySalesStore';
import { useAuthStore } from '../stores/authStore';
import { useAlertStore } from '../stores/alertStore';
import { useSettingsStore } from '../stores/settingsStore';
import { DateRangeFilter } from '../components/sales/DateRangeFilter';
import { DocumentCard } from '../components/sales/DocumentCard';
import type { Sale, SaleItem } from '../types/common';
import { emitCreditNote, listarDocumentosDpay, obtenerDocumentoDpay, eliminarBoletaDpay, anularTransaccionTuu, type DpayDocument } from '../services/api';
import moment from 'moment';

type Props = NativeStackScreenProps<RootStackParamList, 'MySales'>;

// Tipo unificado para ventas locales y documentos DPay
type UnifiedDocument = 
  | { type: 'local'; data: Sale }
  | { type: 'dpay'; data: DpayDocument };

// Tipos de documento para el filtro
const DOCUMENT_TYPE_OPTIONS = [
  { id: 0, name: 'Todos' },
  { id: 39, name: 'Boleta electrónica' },
  { id: 41, name: 'Boleta exenta' },
  { id: 33, name: 'Factura electrónica' },
  { id: 34, name: 'Factura exenta' },
  { id: 61, name: 'Nota de crédito' },
];

// Función helper para mapear nombre de documento DPay a ID numérico
const getDocTypeIdFromDpayName = (typeName: string): number | undefined => {
  const typeMap: Record<string, number> = {
    'Boleta Electrónica': 39,
    'Boleta Electronica': 39, // Sin tilde
    'Boleta Afecta Electrónica': 39,
    'Boleta Afecta Electronica': 39,
    'Boleta Exenta': 41,
    'Boleta Exenta Electrónica': 41,
    'Boleta Exenta Electronica': 41,
    'Boleta No afecta o Exenta Electronica': 41,
    'Boleta No afecta o Exenta Electrónica': 41,
    'Factura Electrónica': 33,
    'Factura Electronica': 33,
    'Factura Afecta': 33,
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
  const result = typeMap[typeName];
  if (!result) {
    console.warn(`[MySalesScreen] Tipo de documento NO mapeado: "${typeName}"`);
  }
  return result;
};

// Obtener inicio del día actual
const getTodayStart = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

// Obtener fin del día actual
const getTodayEnd = () => {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date;
};

const BOLETA_DOC_TYPES = [39, 41];

const isBoletaDocType = (docType?: number | null): boolean =>
  docType != null && BOLETA_DOC_TYPES.includes(docType);

export const MySalesScreen: React.FC<Props> = ({ navigation }) => {
  const themeColors = useThemeColors();
  const sales = useMySalesStore((state) => state.sales);
  const { syncSale, syncAllPending, removeSale } = useMySalesStore();
  const { user } = useAuthStore();
  const { showAlert } = useAlertStore();
  const emitirDocumento = useSettingsStore((state) => state.emitirDocumento);
  const ncCorreccionMonto = useSettingsStore((state) => state.ncCorreccionMonto);
  const permiteNotaCredito = user?.permiteNotaCredito === true;

  // Ref para rastrear si es la primera carga (para mantener filtros al volver de navegación)
  const isFirstLoad = useRef(true);

  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [showDetails, setShowDetails] = useState(true);
  const [isSearching, setIsSearching] = useState(true); // Inicia buscando
  const [syncing, setSyncing] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<number>(0);
  const [folioSearch, setFolioSearch] = useState<string>(''); // Búsqueda por folio
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: getTodayStart(), // Por defecto: hoy
    end: getTodayEnd(),
  });

  const [annulModalVisible, setAnnulModalVisible] = useState(false);
  const [selectedSaleToAnnul, setSelectedSaleToAnnul] = useState<Sale | null>(null);
  const [annulOption, setAnnulOption] = useState<'correction' | 'total'>('total');
  const [isAnulling, setIsAnulling] = useState(false);
  const [simpleAnnulModalVisible, setSimpleAnnulModalVisible] = useState(false);
  const [successModalData, setSuccessModalData] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: '',
  });

  // Estados para modales de sincronización
  const [syncSuccessModal, setSyncSuccessModal] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });
  const [syncPartialModal, setSyncPartialModal] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });
  const [syncErrorModal, setSyncErrorModal] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });

  // Estados para documentos DPay
  const [dpayDocuments, setDpayDocuments] = useState<DpayDocument[]>([]);
  const [loadingDpay, setLoadingDpay] = useState(false);
  const [loadingDpayDetail, setLoadingDpayDetail] = useState(false);

  // Función helper: verificar si un documento tiene una corrección parcial
  const hasPartialCreditNote = useCallback((folio: number, docType: number): boolean => {
    // 1. Buscar en ventas locales si hay una NC con código de referencia 3 (Corrección)
    const hasLocalPartialNC = sales.some(sale =>
      sale.documentType === 61 && // Es una NC
      sale.referencia?.folioRef === folio &&
      sale.referencia?.tipoDocRef === docType &&
      sale.referencia?.codigoRef === 3 // Código 3 = Corrección de monto
    );

    if (hasLocalPartialNC) return true;

    // 2. Buscar en documentos DPay si hay una NC que referencia este documento
    //    y su razón indica "Corrección" (ya que no tenemos codigoRef en la API)
    const hasApiPartialNC = dpayDocuments.some(doc => {
      const docTypeId = getDocTypeIdFromDpayName(doc.tipo_documento);
      return (
        docTypeId === 61 && // Es una NC
        doc.folio_documento_anulado === folio &&
        (doc.razon_anulacion_nc?.toLowerCase().includes('corrección') ||
         doc.razon_anulacion_nc?.toLowerCase().includes('correccion'))
      );
    });

    return hasApiPartialNC;
  }, [sales, dpayDocuments]);

  // Funciones para anular - aplicable a ventas locales
  const handleAnnulPress = (sale: Sale) => {
    // Verificar que NO sea una NC (Nota de Crédito)
    if ((sale.documentType as number) === 61) {
      showAlert('No se puede anular', 'Las Notas de Crédito no se pueden anular.');
      return;
    }
    
    // Pago recibido / comprobante electrónico (sin DTE)
    if (!sale.documentType || (sale.documentType as number) === 0) {
      showAlert(
        'Eliminar pago recibido',
        '¿Deseas eliminar este pago recibido del historial? Esta acción no se puede deshacer.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
              if (sale.dpayTransactionId) {
                const res = await anularTransaccionTuu(sale.dpayTransactionId, 'Eliminación desde D-PAY');
                if (!res.success) {
                  showAlert('Error', res.message || 'No se pudo anular el pago en el servidor.');
                  return;
                }
              }
              removeSale(sale.id);
            },
          },
        ]
      );
      return;
    }

    const docTypeId = sale.documentType as number;
    if (!permiteNotaCredito && isBoletaDocType(docTypeId)) {
      const idDoc = resolveIdDocumentoForSale(sale);
      if (!idDoc) {
        showAlert(
          'Boleta no sincronizada',
          'Esta boleta aún no está en el servidor. Solo puede eliminarse del historial local.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Eliminar local', style: 'destructive', onPress: () => removeSale(sale.id) },
          ]
        );
        return;
      }
      const emissionDate = sale.completedAt || sale.createdAt;
      confirmDeleteBoleta(idDoc, { localSaleId: sale.id, emissionDate });
      return;
    }
    
    setSelectedSaleToAnnul(sale);
    setAnnulOption('total'); // Por defecto 'total'
    if (ncCorreccionMonto) {
      setAnnulModalVisible(true);
    } else {
      setSimpleAnnulModalVisible(true);
    }
  };

  // Nueva función para anular documentos D-PAY
  const handleAnnulDtemitePress = async (doc: DpayDocument) => {
    // Verificar que NO sea una NC (Nota de Crédito)
    const docTypeId = getDocTypeIdFromDpayName(doc.tipo_documento);
    if (docTypeId === 61) {
      showAlert('No se puede anular', 'Las Notas de Crédito no se pueden anular.');
      return;
    }
    
    // Verificar que NO sea un Pago Recibido (docTypeId === 0 o undefined)
    if (!docTypeId || docTypeId === 0) {
      showAlert('No se puede anular', 'Los pagos recibidos no se pueden anular desde documentos tributarios.');
      return;
    }

    const localSale = sales.find(s => 
      s.folio && String(s.folio) === String(doc.folio) && s.documentType === docTypeId
    );

    if (!permiteNotaCredito && isBoletaDocType(docTypeId)) {
      confirmDeleteBoleta(doc.id_documento, {
        localSaleId: localSale?.id,
        emissionDate: doc.fecha_emision || doc.fecha_creacion,
      });
      return;
    }

    if (localSale && localSale.results && localSale.results.length > 0) {
      // Usar la venta local directamente (tiene los productos)
      setSelectedSaleToAnnul(localSale);
      setAnnulOption('total');
      if (ncCorreccionMonto) {
        setAnnulModalVisible(true);
      } else {
        setSimpleAnnulModalVisible(true);
      }
      return;
    }

    // Si no hay venta local, cargar el detalle desde la API
    try {
      setLoadingDpayDetail(true);
      const detail = await obtenerDocumentoDpay(doc.id_documento);
      
      // Convertir detalle DPay a formato SaleItem/results
      // El servidor devuelve precio_unitario NETO (sin IVA), pero SaleItem.value es precio bruto (con IVA)
      const isExento = docTypeId === 34 || docTypeId === 41;
      const results: SaleItem[] = (detail.detalle || []).map(item => {
        const precioNeto = Number(item.precio_unitario) || 0;
        const precioBruto = isExento ? precioNeto : Math.round(precioNeto * 1.19);
        const cantidad = Number(item.cantidad) || 1;
        return {
          id: String(item.numero_linea),
          name: item.descripcion_prod,
          code: item.cod_producto,
          value: precioBruto,
          count: cantidad,
          total: precioBruto * cantidad,
        };
      });

      const totalAmount = typeof doc.montototal === 'string' ? Number(doc.montototal) : doc.montototal;
      
      // Normalizar fechas a ISO 8601
      const normalizeDate = (dateStr: string): string => {
        if (!dateStr) return new Date().toISOString();
        // Intentar parsear diferentes formatos y convertir a ISO
        const parsed = moment(dateStr, [
          'YYYY-MM-DDTHH:mm:ss',
          'YYYY-MM-DD HH:mm:ss',
          'YYYY-MM-DD',
          'DD-MM-YYYY',
          moment.ISO_8601
        ], true);
        return parsed.isValid() ? parsed.toISOString() : new Date().toISOString();
      };

      const saleFromDtemite: Sale = {
        id: `dtemite-${doc.id_documento}`,
        results,
        folio: doc.folio,
        documentType: docTypeId || 39,
        ted: detail.ted || undefined,
        subtotal: totalAmount,
        total: totalAmount,
        createdAt: normalizeDate(doc.fecha_creacion),
        completedAt: normalizeDate(detail.fecha_emision || doc.fecha_creacion),
        status: 'completed',
        syncStatus: 'synced',
        syncedAt: normalizeDate(doc.fecha_creacion),
        neto: Number(detail.monto_neto) || 0,
        exento: Number(detail.monto_exento) || 0,
        iva: Number(detail.montoiva) || 0,
        client: detail.rut_cliente ? {
          id: `client-${detail.rut_cliente}`,
          rut: detail.rut_cliente,
          name: detail.razon_social || 'Cliente',
          email: detail.email,
          address: detail.direccion,
          isActive: true,
          createdAt: doc.fecha_creacion,
          updatedAt: doc.fecha_creacion,
        } : undefined,
      };

      // Generar TED si no viene del servidor
      if (!saleFromDtemite.ted && saleFromDtemite.folio && saleFromDtemite.documentType) {
        console.log('[MySalesScreen] Generando TED para documento DPay (folio:', saleFromDtemite.folio, ')');
        try {
          const { generateTEDForSale } = await import('../services/ted');
          const generatedTed = await generateTEDForSale(saleFromDtemite);
          if (generatedTed) {
            saleFromDtemite.ted = generatedTed;
            console.log('[MySalesScreen] TED generado exitosamente');
          }
        } catch (error) {
          console.error('[MySalesScreen] Error generando TED:', error);
        }
      }

      setSelectedSaleToAnnul(saleFromDtemite);
      setAnnulOption('total');
      if (ncCorreccionMonto) {
        setAnnulModalVisible(true);
      } else {
        setSimpleAnnulModalVisible(true);
      }
    } catch (error) {
      console.error('[MySalesScreen] Error cargando detalle para anular:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showAlert('Error', `No se pudo cargar el detalle del documento.\n\n${errorMessage}`);
    } finally {
      setLoadingDpayDetail(false);
    }
  };

  // Confirmar el modal simplificado (solo NC total)
  const handleConfirmSimpleAnnul = async () => {
    if (!selectedSaleToAnnul) return;
    setSimpleAnnulModalVisible(false);
    // Reutilizar la lógica de anulación total directamente
    if (selectedSaleToAnnul.folio && selectedSaleToAnnul.documentType && 
        hasPartialCreditNote(selectedSaleToAnnul.folio, selectedSaleToAnnul.documentType)) {
      setTimeout(() => showAlert(
        'No se puede anular totalmente',
        'Este documento ya tiene una corrección de monto asociada. No puede ser anulado totalmente.'
      ), 300);
      return;
    }
    setIsAnulling(true);
    try {
      const result = await emitCreditNote(selectedSaleToAnnul, 'Anula documento total');
      const ncSale: Sale = {
        id: `nc-${result.folio || Date.now()}`,
        results: selectedSaleToAnnul.results,
        documentType: 61,
        folio: result.folio,
        ted: result.ted,
        id_documento: result.id_documento,
        client: selectedSaleToAnnul.client,
        paymentMethod: selectedSaleToAnnul.paymentMethod,
        subtotal: selectedSaleToAnnul.subtotal,
        neto: selectedSaleToAnnul.neto,
        exento: selectedSaleToAnnul.exento,
        iva: selectedSaleToAnnul.iva,
        total: selectedSaleToAnnul.total,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        status: 'completed',
        syncStatus: 'synced',
        syncedAt: new Date().toISOString(),
        referencia: result.referencia,
        issuerUserId: user?.usuario,
        issuerCompany: user?.empresa?.rut,
      };
      useMySalesStore.getState().addSale(ncSale);
      // Navegar inmediatamente a la NC sin esperar el refresco de documentos
      navigation.navigate('ViewInvoice', { saleId: ncSale.id, showNewSaleButton: true });
      // Refrescar en segundo plano (sin await)
      fetchDpayDocuments();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showAlert('Error', `No se pudo emitir la Nota de Crédito:\n${errorMessage}`);
    } finally {
      setIsAnulling(false);
      setSelectedSaleToAnnul(null);
    }
  };

  const handleConfirmAnnul = async () => {
    if (!selectedSaleToAnnul) return;

    if (annulOption === 'correction') {
      // Navegar a pantalla de NC por corrección de monto
      setAnnulModalVisible(false);
      navigation.navigate('CreditNote', { originalSale: selectedSaleToAnnul });
    } else {
      // Anulación Total - VERIFICAR si tiene corrección parcial
      if (selectedSaleToAnnul.folio && selectedSaleToAnnul.documentType && 
          hasPartialCreditNote(selectedSaleToAnnul.folio, selectedSaleToAnnul.documentType)) {
        setAnnulModalVisible(false);
        setTimeout(() => showAlert(
          'No se puede anular totalmente',
          'Este documento ya tiene una corrección de monto asociada. No puede ser anulado totalmente.'
        ), 300);
        return;
      }

      setAnnulModalVisible(false);
      setIsAnulling(true);
      try {
        const result = await emitCreditNote(selectedSaleToAnnul, 'Anula documento total');

        // Crear venta local para la NC con información de referencia
        const ncSale: Sale = {
          id: `nc-${result.folio || Date.now()}`,
          results: selectedSaleToAnnul.results, // Mismos productos
          documentType: 61, // Nota de Crédito
          folio: result.folio,
          ted: result.ted,
          id_documento: result.id_documento,
          client: selectedSaleToAnnul.client,
          paymentMethod: selectedSaleToAnnul.paymentMethod,
          subtotal: selectedSaleToAnnul.subtotal,
          neto: selectedSaleToAnnul.neto,
          exento: selectedSaleToAnnul.exento,
          iva: selectedSaleToAnnul.iva,
          total: selectedSaleToAnnul.total,
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          status: 'completed',
          syncStatus: 'synced',
          syncedAt: new Date().toISOString(),
          referencia: result.referencia, // Información de referencia del documento anulado
          issuerUserId: user?.usuario,
          issuerCompany: user?.empresa?.rut,
        };

        // Agregar NC al store para verla en la lista y permitir imprimirla
        useMySalesStore.getState().addSale(ncSale);

        // Navegar inmediatamente a la NC sin esperar el refresco de documentos
        navigation.navigate('ViewInvoice', { saleId: ncSale.id, showNewSaleButton: true });
        // Refrescar en segundo plano (sin await)
        fetchDpayDocuments();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        showAlert('Error', `No se pudo emitir la Nota de Crédito:\n${errorMessage}`);
      } finally {
        setIsAnulling(false);
        setSelectedSaleToAnnul(null);
      }
    }
  };

  // Función para detectar si un documento local está anulado (total o parcialmente) por NC
  const getLocalDocumentAnnulment = (localSale: Sale) => {
    if (!localSale.folio) return null;
    
    const folioDoc = Number(localSale.folio);
    
    // 1. NC del servidor que referencian este documento
    const serverNCs = dpayDocuments.filter(dpayDoc => 
      Number(dpayDoc.folio_documento_anulado) === folioDoc &&
      getDocTypeIdFromDpayName(dpayDoc.tipo_documento) === 61
    );
    
    // 2. NC locales que referencian este documento (solo las que NO estén ya en el servidor)
    const serverNCFolios = new Set(serverNCs.map(nc => Number(nc.folio)));
    
    const localNCs = sales.filter(sale => {
      // Debe ser NC
      if ((sale.documentType as number) !== 61) return false;
      // Debe referenciar este documento
      if (sale.referencia?.folioRef !== localSale.folio) return false;
      // Debe tener folio asignado
      if (!sale.folio) return false;
      
      const enServidor = serverNCFolios.has(Number(sale.folio));
      
      // NO debe estar ya en el servidor (evita duplicados)
      if (enServidor) return false;
      
      return true;
    });
    
    // Combinar ambas fuentes en formato unificado
    type NCInfo = { folio: number; tipo: 'total' | 'parcial'; monto: number };
    const allNCs: NCInfo[] = [
      ...serverNCs.map(nc => {
        // Detectar si es corrección o total basado en razon_anulacion_nc
        const razon = nc.razon_anulacion_nc?.toLowerCase() || '';
        const esParcial = razon.includes('correcci') || razon.includes('monto');
        return {
          folio: nc.folio,
          tipo: esParcial ? 'parcial' : 'total',
          monto: nc.montototal,
        };
      }),
      ...localNCs.map(nc => ({
        folio: nc.folio!,
        tipo: (nc.referencia?.codigoRef === 3 ? 'parcial' : 'total') as 'total' | 'parcial',
        monto: nc.total || 0,
      })),
    ];
    
    if (allNCs.length === 0) return null;
    
    const ncTotales = allNCs.filter(nc => nc.tipo === 'total');
    const ncCorrecciones = allNCs.filter(nc => nc.tipo === 'parcial');
    const isTotalmenteAnulado = ncTotales.length > 0;
    
    // Calcular si las correcciones suman el 100% del documento
    const totalCorreccionMonto = ncCorrecciones.reduce((sum, nc) => sum + nc.monto, 0);
    const estaCompletamenteAnuladoPorCorrecciones = totalCorreccionMonto >= localSale.total;
    
    // Usar Set para eliminar duplicados de folios
    const foliosNCCorreccionUnicos = [...new Set(ncCorrecciones.map(nc => nc.folio))];
    
    return {
      isTotalmenteAnulado: isTotalmenteAnulado || estaCompletamenteAnuladoPorCorrecciones,
      ncTotales: ncTotales.length,
      ncCorrecciones: ncCorrecciones.length,
      folioNCTotal: ncTotales[0]?.folio,
      foliosNCCorreccion: foliosNCCorreccionUnicos,
      estaCompletamenteAnuladoPorCorrecciones,
    };
  };

  // Función para detectar si un documento del servidor está anulado (incluye verificación de correcciones que sumen 100%)
  const getDpayDocumentAnnulment = (dpayDoc: DpayDocument) => {
    const folioDoc = Number(dpayDoc.folio);
    
    // 1. Verificar anulación marcada por el backend
    if (dpayDoc.anulado && dpayDoc.tipo_anulacion === 'total') {
      return {
        isTotalmenteAnulado: true,
        ncTotales: 1,
        ncCorrecciones: 0,
        folioNCTotal: dpayDoc.folio_nc_anulacion || undefined,
        foliosNCCorreccion: [],
        estaCompletamenteAnuladoPorCorrecciones: false,
      };
    }
    
    // 2. Buscar todas las NC que referencian este documento
    const serverNCs = dpayDocuments.filter(doc => 
      Number(doc.folio_documento_anulado) === folioDoc &&
      getDocTypeIdFromDpayName(doc.tipo_documento) === 61
    );
    
    // 3. NC locales que referencian este documento (no sincronizadas)
    const serverNCFolios = new Set(serverNCs.map(nc => Number(nc.folio)));
    const localNCs = sales.filter(sale => {
      if ((sale.documentType as number) !== 61) return false;
      if (sale.referencia?.folioRef !== dpayDoc.folio) return false;
      if (!sale.folio) return false;
      return !serverNCFolios.has(Number(sale.folio));
    });
    
    type NCInfo = { folio: number; tipo: 'total' | 'parcial'; monto: number };
    const allNCs: NCInfo[] = [
      ...serverNCs.map(nc => {
        const razon = nc.razon_anulacion_nc?.toLowerCase() || '';
        const esParcial = razon.includes('correcci') || razon.includes('monto');
        return {
          folio: nc.folio,
          tipo: esParcial ? 'parcial' : 'total',
          monto: nc.montototal,
        };
      }),
      ...localNCs.map(nc => ({
        folio: nc.folio!,
        tipo: (nc.referencia?.codigoRef === 3 ? 'parcial' : 'total') as 'total' | 'parcial',
        monto: nc.total || 0,
      })),
    ];
    
    if (allNCs.length === 0) return null;
    
    const ncTotales = allNCs.filter(nc => nc.tipo === 'total');
    const ncCorrecciones = allNCs.filter(nc => nc.tipo === 'parcial');
    
    // Calcular si las correcciones suman el 100% del documento
    const totalCorreccionMonto = ncCorrecciones.reduce((sum, nc) => sum + nc.monto, 0);
    const estaCompletamenteAnuladoPorCorrecciones = totalCorreccionMonto >= dpayDoc.montototal;
    
    const foliosNCCorreccionUnicos = [...new Set(ncCorrecciones.map(nc => nc.folio))];
    
    return {
      isTotalmenteAnulado: ncTotales.length > 0 || estaCompletamenteAnuladoPorCorrecciones,
      ncTotales: ncTotales.length,
      ncCorrecciones: ncCorrecciones.length,
      folioNCTotal: ncTotales[0]?.folio,
      foliosNCCorreccion: foliosNCCorreccionUnicos,
      estaCompletamenteAnuladoPorCorrecciones,
    };
  };

  // Filtrar ventas y cargar documentos DPay al montar el componente
  // NOTA: Solo aplica filtros de "hoy" en la primera carga, después mantiene los filtros del usuario
  useEffect(() => {
    if (isFirstLoad.current) {
      // Primera carga: aplicar filtros de hoy por defecto
      filterSalesForToday();
      isFirstLoad.current = false;
    } else {
      // Cargas subsecuentes (al volver de ViewInvoice): mantener filtros actuales
      applyFilters(dateRange.start, dateRange.end, selectedDocType);
    }
    
    // Siempre cargar documentos DPay
    fetchDpayDocuments();
  }, []);

  // Re-filtrar cuando cambian las ventas (ej: nueva venta agregada)
  useEffect(() => {
    if (sales.length > 0) {
      applyFilters(dateRange.start, dateRange.end, selectedDocType);
    }
  }, [sales.length]);

  // Filtro rápido para ventas de hoy (optimizado)
  const filterSalesForToday = useCallback(() => {
    const todayStart = getTodayStart();
    const todayEnd = getTodayEnd();
    const todayStartOnly = new Date(todayStart.getFullYear(), todayStart.getMonth(), todayStart.getDate());
    const todayEndOnly = new Date(todayEnd.getFullYear(), todayEnd.getMonth(), todayEnd.getDate());

    const todaySales = sales.filter((sale) => {
      // Convertir a fecha local (el timestamp puede ser UTC ISO)
      const d = new Date(sale.completedAt || sale.createdAt);
      const saleDateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());

      // Filtrar por usuario logueado
      if (user?.usuario && sale.issuerUserId && sale.issuerUserId !== user.usuario) return false;
      // Filtrar por empresa logueada
      if (user?.empresa?.rut && sale.issuerCompany && sale.issuerCompany !== user.empresa.rut) return false;

      return saleDateOnly >= todayStartOnly && saleDateOnly <= todayEndOnly;
    });

    setFilteredSales(todaySales);
    setIsSearching(false);
  }, [sales]);

  const applyFilters = useCallback((startDate: Date, endDate: Date, docType: number) => {
    setIsSearching(true);

    // Crear fechas solo con año-mes-día para evitar timezone shift
    const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    // Usar requestAnimationFrame para no bloquear UI
    requestAnimationFrame(() => {
      let filtered = sales.filter((sale) => {
        // Convertir a fecha local (el timestamp puede ser UTC ISO)
        const d = new Date(sale.completedAt || sale.createdAt);
        const saleDateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());

        // Filtrar por usuario logueado
        if (user?.usuario && sale.issuerUserId && sale.issuerUserId !== user.usuario) return false;
        // Filtrar por empresa logueada
        if (user?.empresa?.rut && sale.issuerCompany && sale.issuerCompany !== user.empresa.rut) return false;

        return saleDateOnly >= startDateOnly && saleDateOnly <= endDateOnly;
      });

      if (docType !== 0) {
        filtered = filtered.filter((sale) => sale.documentType === docType);
      }

      setFilteredSales(filtered);
      setIsSearching(false);
    });
  }, [sales]);

  const handleDateSearch = (startDate: Date, endDate: Date) => {
    setDateRange({ start: startDate, end: endDate });
    applyFilters(startDate, endDate, selectedDocType);
    // Recargar documentos DPay con las nuevas fechas (pasadas directamente)
    fetchDpayDocuments(startDate, endDate);
  };

  const handleDocTypeChange = (docType: number) => {
    setSelectedDocType(docType);
    applyFilters(dateRange.start, dateRange.end, docType);
  };

  // Función para obtener documentos DPay del servidor
  const fetchDpayDocuments = async (startDate?: Date, endDate?: Date) => {
    setLoadingDpay(true);
    try {
      // Usar fechas pasadas como parámetro, o del estado si no se proveen
      const start = startDate || dateRange.start;
      const end = endDate || dateRange.end;
      
      const fechaDesde = moment(start).format('DD-MM-YYYY');
      const fechaHasta = moment(end).format('DD-MM-YYYY');

      console.log('[MySalesScreen] Obteniendo documentos DPay:', { fechaDesde, fechaHasta });

      const documents = await listarDocumentosDpay({
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
      });

      // Debug: Ver comisiones en los documentos recibidos
      console.log('[MySalesScreen] Documentos DPay cargados:', documents.length);
      console.log('[MySalesScreen] Documentos con comisión:', documents.filter(d => d.dpay_comision_monto && d.dpay_comision_monto > 0).length);
      documents.forEach((doc, index) => {
        if (index < 3) { // Solo mostrar los primeros 3 para no saturar el log
          console.log(`[MySalesScreen] Doc ${index + 1}: folio=${doc.folio}, dpay_comision_monto=${doc.dpay_comision_monto}, medio_pago=${doc.dpay_medio_pago || doc.medio_pago}, tipo=${doc.tipo_documento}`);
        }
      });

      setDpayDocuments(documents);
    } catch (error) {
      console.error('[MySalesScreen] Error cargando documentos DPay:', error);

      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.log('[MySalesScreen] Mostrando alerta de error:', errorMessage);
      
      showAlert('Error', `No se pudieron cargar los documentos DPay.\n\n${errorMessage}`);

      setDpayDocuments([]);
    } finally {
      setLoadingDpay(false);
    }
  };

  const resolveIdDocumentoForSale = (sale: Sale): number | undefined => {
    if (sale.id_documento) return sale.id_documento;
    if (!sale.folio) return undefined;
    const docType = typeof sale.documentType === 'number' ? sale.documentType : undefined;
    const match = dpayDocuments.find(
      (d) => String(d.folio) === String(sale.folio) && getDocTypeIdFromDpayName(d.tipo_documento) === docType
    );
    return match?.id_documento;
  };

  const getCoffDeleteHint = (emissionDate?: string): string => {
    if (!emissionDate) return '';
    const emission = moment(emissionDate).startOf('day');
    const today = moment().startOf('day');
    if (!emission.isBefore(today)) return '';
    const days = today.diff(emission, 'days');
    if (days > 3) {
      return '\n\nEsta boleta es de hace más de 3 días. DTEmite debe revisar el reproceso COFF manualmente.';
    }
    return '\n\nSe reprocesará el consumo de folios del día correspondiente.';
  };

  const confirmDeleteBoleta = (
    idDocumento: number,
    options?: { localSaleId?: string; emissionDate?: string }
  ) => {
    const coffHint = getCoffDeleteHint(options?.emissionDate);

    showAlert(
      'Eliminar boleta',
      `¿Deseas eliminar esta boleta? Esta acción no se puede deshacer.${coffHint}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setIsAnulling(true);
            try {
              const result = await eliminarBoletaDpay(idDocumento);
              if (result.success) {
                if (options?.localSaleId) {
                  removeSale(options.localSaleId);
                }
                await fetchDpayDocuments(dateRange.start, dateRange.end);
                setSuccessModalData({
                  visible: true,
                  message: result.message || 'Boleta eliminada correctamente.',
                });
              } else {
                showAlert('Error', result.message || 'No se pudo eliminar la boleta.');
              }
            } finally {
              setIsAnulling(false);
            }
          },
        },
      ]
    );
  };



  // Función para sincronizar todas las ventas pendientes
  const handleSyncAll = async () => {
    if (!emitirDocumento) {
      showAlert('Acción desactivada', 'La sincronización de documentos está desactivada.');
      return;
    }
    setSyncing(true);
    try {
      const result = await syncAllPending();

      // Recargar documentos DPay con los filtros actuales
      await fetchDpayDocuments(dateRange.start, dateRange.end);

      if (result.errors === 0) {
        setSyncSuccessModal({
          visible: true,
          message: `✅ ${result.success} venta${result.success !== 1 ? 's' : ''} sincronizada${result.success !== 1 ? 's' : ''} correctamente`
        });
      } else {
        setSyncPartialModal({
          visible: true,
          message: `✅ ${result.success} venta${result.success !== 1 ? 's' : ''} sincronizada${result.success !== 1 ? 's' : ''}\n❌ ${result.errors} error${result.errors !== 1 ? 'es' : ''}\n\nRevise las ventas con error para más detalles.`
        });
      }
    } catch (error) {
      console.error('[MySalesScreen] Error en sincronización:', error);
      setSyncErrorModal({
        visible: true,
        message: 'No se pudo completar la sincronización. Verifique su conexión a internet.'
      });
    } finally {
      setSyncing(false);
    }
  };

  // Función para ver detalle de documento DPay - Navegar a ViewInvoiceScreen
  const handleViewDpayDocument = async (doc: DpayDocument) => {
    setLoadingDpayDetail(true);
    try {
      console.log('[MySalesScreen] Obteniendo detalle documento DPay:', doc.id_documento);
      
      const detail = await obtenerDocumentoDpay(doc.id_documento);
      
      console.log('[MySalesScreen] Detalle cargado, navegando a ViewInvoice:', detail);
      
      // Navegar a ViewInvoiceScreen con el documento DPay
      navigation.navigate('ViewInvoice', {
        dpayDocument: detail,
      });
    } catch (error) {
      console.error('[MySalesScreen] Error cargando detalle DPay:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      showAlert('Error', `No se pudo cargar el detalle del documento.\n\n${errorMessage}`);
    } finally {
      setLoadingDpayDetail(false);
    }
  };
  const handleSyncSale = async (saleId: string) => {
    if (!emitirDocumento) {
      showAlert('Acción desactivada', 'La sincronización de documentos está desactivada.');
      return;
    }
    try {
      await syncSale(saleId);
      
      // Recargar documentos DPay con los filtros actuales
      await fetchDpayDocuments(dateRange.start, dateRange.end);
      
      setSyncSuccessModal({
        visible: true,
        message: '✅ Venta sincronizada correctamente'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setSyncErrorModal({
        visible: true,
        message: `No se pudo sincronizar la venta:\n${errorMessage}`
      });
    }
  };

  // Combinar y ordenar documentos locales y DPay, eliminando duplicados por folio
  const unifiedDocuments = useMemo((): UnifiedDocument[] => {
    // Filtrar documentos DPay por rango de fechas (solo comparar fecha, ignorar hora para evitar problemas de zona horaria)
    const startDate = new Date(dateRange.start);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(dateRange.end);
    endDate.setHours(23, 59, 59, 999);
    
    let filteredDpayDocs = dpayDocuments.filter(doc => {
      // Extraer fecha del ISO timestamp sin crear Date object que sufre timezone shift
      const [datePart] = doc.fecha_creacion.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const docDateOnly = new Date(year, month - 1, day);
      const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      
      return docDateOnly >= startDateOnly && docDateOnly <= endDateOnly;
    });
    
    // Filtrar por tipo de documento si está seleccionado
    if (selectedDocType !== 0) {
      filteredDpayDocs = filteredDpayDocs.filter(doc => {
        const dpayDocTypeId = getDocTypeIdFromDpayName(doc.tipo_documento);
        return dpayDocTypeId === selectedDocType;
      });
    }

    // Filtrar por folio si hay búsqueda
    if (folioSearch.trim() !== '') {
      const searchFolio = folioSearch.trim();
      filteredDpayDocs = filteredDpayDocs.filter(doc => 
        String(doc.folio).includes(searchFolio)
      );
    }
    
    // Crear Sets para folios/ids únicos - usar string para comparación consistente
    const localFoliosAndIds = new Set<string>();
    const dtemiteFoliosAndIds = new Set<string>();
    
    // Filtrar documentos locales por folio si hay búsqueda
    let filteredLocalSales = filteredSales;
    if (folioSearch.trim() !== '') {
      const searchFolio = folioSearch.trim();
      filteredLocalSales = filteredLocalSales.filter(sale =>
        sale.folio ? String(sale.folio).includes(searchFolio) : false
      );
    }

    const localDocs: UnifiedDocument[] = filteredLocalSales.map(sale => ({ type: 'local', data: sale }));
    
    localDocs.forEach(doc => {
      const sale = doc.data;
      const folio = sale.folio;
      const folioStr = folio ? String(folio) : null;
      
      // Agregar folio si existe (incluso si es 0)
      if (folioStr) {
        localFoliosAndIds.add(folioStr);
      }
      // También agregar ID para capturar duplicados por ID
      localFoliosAndIds.add(sale.id);
    });
    
    filteredDpayDocs.forEach(doc => {
      const folioStr = String(doc.folio);
      const idStr = String(doc.id_documento);
      
      dtemiteFoliosAndIds.add(folioStr);
      dtemiteFoliosAndIds.add(`dtemite-${idStr}`);
    });
    
    // Filtrar documentos D-PAY que NO estén duplicados
    const uniqueDpayDocs = filteredDpayDocs.filter(doc => {
      const folioStr = String(doc.folio);
      const idStr = `dtemite-${doc.id_documento}`;
      
      // Comprobar duplicado por folio o por ID
      const isDuplicateByFolio = localFoliosAndIds.has(folioStr);
      const isDuplicateById = localFoliosAndIds.has(idStr);
      const isDuplicate = isDuplicateByFolio || isDuplicateById;
      
      return !isDuplicate;
    });
    
    const dpayDocs: UnifiedDocument[] = uniqueDpayDocs.map(doc => ({ type: 'dpay', data: doc }));
    
    const combined = [...localDocs, ...dpayDocs];
    
    // Ordenar por fecha más reciente primero (sin timezone shift)
    return combined.sort((a, b) => {
      let dateA: Date, dateB: Date;
      
      if (a.type === 'local') {
        const dateStr = a.data.completedAt || a.data.createdAt;
        const [datePart, timePart] = dateStr.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hour = 0, minute = 0, second = 0] = timePart ? timePart.split(':').map(Number) : [0, 0, 0];
        dateA = new Date(year, month - 1, day, hour, minute, second);
      } else {
        const [datePart, timePart] = a.data.fecha_creacion.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hour = 0, minute = 0, second = 0] = timePart ? timePart.split(':').map(Number) : [0, 0, 0];
        dateA = new Date(year, month - 1, day, hour, minute, second);
      }
      
      if (b.type === 'local') {
        const dateStr = b.data.completedAt || b.data.createdAt;
        const [datePart, timePart] = dateStr.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hour = 0, minute = 0, second = 0] = timePart ? timePart.split(':').map(Number) : [0, 0, 0];
        dateB = new Date(year, month - 1, day, hour, minute, second);
      } else {
        const [datePart, timePart] = b.data.fecha_creacion.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hour = 0, minute = 0, second = 0] = timePart ? timePart.split(':').map(Number) : [0, 0, 0];
        dateB = new Date(year, month - 1, day, hour, minute, second);
      }
      
      return dateB.getTime() - dateA.getTime();
    });
  }, [filteredSales, dpayDocuments, selectedDocType, dateRange]);

  // Contadores básicos
  const totalCount = unifiedDocuments.length;
  const totalLocal = filteredSales.length;
  const totalDtemite = unifiedDocuments.filter(doc => doc.type === 'dpay').length;
  // Solo contar ventas pendientes que tengan tipo de documento válido (no 0, excluir "pagos recibidos")
  const pendingCount = filteredSales.filter((sale) => 
    (sale.syncStatus === 'pending' || sale.syncStatus === 'error') && 
    sale.documentType !== undefined && 
    sale.documentType !== null &&
    sale.documentType !== 0
  ).length;

  // Calcular estadísticas por tipo de documento
  const docStats = useMemo(() => {
    const boletasAfectas = { count: 0, total: 0 }; // 39
    const facturasAfectas = { count: 0, total: 0 }; // 33
    const boletasExentas = { count: 0, total: 0 }; // 41
    const facturasExentas = { count: 0, total: 0 }; // 34
    const nc = { count: 0, total: 0 }; // 61
    const pagosRecibidos = { count: 0, total: 0 }; // Documentos sin tipo (0 o undefined)
    
    // IMPORTANTE: Calcular comisiones usando dpayDocuments ORIGINALES (antes de deduplicar)
    // Esto evita que se pierdan las comisiones por documentos marcados como duplicados
    let totalComisiones = 0;
    
    // Filtrar por rango de fechas (solo comparar fecha, ignorar hora)
    const startDate = new Date(dateRange.start);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(dateRange.end);
    endDate.setHours(23, 59, 59, 999);
    
    let filteredDpayForCommission = dpayDocuments.filter(doc => {
      // Extraer fecha del ISO timestamp sin crear Date object que sufre timezone shift
      const [datePart] = doc.fecha_creacion.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const docDateOnly = new Date(year, month - 1, day);
      const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      
      return docDateOnly >= startDateOnly && docDateOnly <= endDateOnly;
    });
    
    // Aplicar filtro de tipo de documento si está seleccionado
    if (selectedDocType !== 0) {
      filteredDpayForCommission = filteredDpayForCommission.filter(doc => {
        const dpayDocTypeId = getDocTypeIdFromDpayName(doc.tipo_documento);
        return dpayDocTypeId === selectedDocType;
      });
    }
    
    // Sumar comisiones de TODOS los documentos DPay filtrados (incluyendo "duplicados")
    filteredDpayForCommission.forEach(doc => {
      const comision = Number(doc.dpay_comision_monto || 0);
      if (comision > 0) {
        console.log(`[MySalesScreen] Sumando comisión: ${comision} del folio ${doc.folio}`);
      }
      totalComisiones += comision;
    });

    // Calcular tipos de documento usando unifiedDocuments (después de deduplicar)
    unifiedDocuments.forEach(doc => {
      const docType = doc.type === 'local' ? doc.data.documentType : getDocTypeIdFromDpayName(doc.data.tipo_documento);
      const amount = doc.type === 'local' ? doc.data.total : Number(doc.data.montototal || 0);
      
      // Ya no calculamos comisiones aquí - se calculan arriba usando dpayDocuments originales

      if (docType === 39) {
        boletasAfectas.count++;
        boletasAfectas.total += amount;
      } else if (docType === 33) {
        facturasAfectas.count++;
        facturasAfectas.total += amount;
      } else if (docType === 41) {
        boletasExentas.count++;
        boletasExentas.total += amount;
      } else if (docType === 34) {
        facturasExentas.count++;
        facturasExentas.total += amount;
      } else if (docType === 61) {
        nc.count++;
        nc.total += amount;
      } else if (!docType || (docType as number) === 0) {
        // Pagos recibidos (documentos sin tipo de documento)
        pagosRecibidos.count++;
        pagosRecibidos.total += amount;
      }
    });
    
    console.log(`[MySalesScreen] Total comisiones calculadas: ${totalComisiones} (de ${filteredDpayForCommission.length} documentos DPay)`);

    const totalVentas = boletasAfectas.total + facturasAfectas.total + boletasExentas.total + facturasExentas.total;
    const totalAnulaciones = nc.total;
    // Total general incluye ventas + pagos recibidos - anulaciones - comisiones
    const totalGeneral = totalVentas + pagosRecibidos.total - totalAnulaciones - totalComisiones;

    // Debug: Mostrar totales calculados
    console.log('[MySalesScreen] Totales calculados:', {
      totalVentas,
      totalAnulaciones, 
      totalComisiones,
      totalGeneral,
      docsProcessed: unifiedDocuments.length,
      dpayDocsForCommission: filteredDpayForCommission.length
    });

    return {
      boletasAfectas,
      facturasAfectas,
      boletasExentas,
      facturasExentas,
      nc,
      pagosRecibidos,
      totalVentas,
      totalAnulaciones,
      totalComisiones,
      totalGeneral,
    };
  }, [unifiedDocuments, dpayDocuments, selectedDocType, dateRange]);

  // Función para obtener el nombre del tipo de documento
  const getDocumentTypeName = (documentType?: number): string => {
    if (!documentType || documentType === 0) return 'Pago recibido';

    switch (documentType) {
      case 33:
        return 'Factura electrónica';
      case 34:
        return 'Factura exenta';
      case 39:
        return 'Boleta electrónica';
      case 41:
        return 'Boleta exenta';
      case 61:
        return 'Nota de crédito';
      default:
        return `Documento ${documentType}`;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.background, padding: 20 }}>
      <StatusBar
        barStyle={themeColors.background === '#FFFFFF' ? 'dark-content' : 'light-content'}
        backgroundColor={themeColors.background}
      />
      <SafeAreaView />

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 }}>
        <TouchableOpacity onPress={() => navigation.navigate('Sale')} style={{ padding: 5 }}>
          <Image
            source={require('../../assets/icons/prev.png')}
            style={{ width: 35, height: 35, tintColor: '#d4186e' }}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={{
          fontSize: 18,
          fontWeight: 'bold',
          color: '#00bdce',
          letterSpacing: 1
        }}>MIS VENTAS</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Filtro de fechas */}
        <DateRangeFilter
          onSearch={handleDateSearch}
          defaultStartDate={dateRange.start}
          defaultEndDate={dateRange.end}
          isLoading={isSearching || loadingDpay}
        >
          {/* Filtro por folio */}
          <View style={{ marginVertical: 15 }}>
            <Text style={[styles.filterLabel, { color: '#00bdce', marginBottom: 8, fontSize: 16 }]}>Folio:</Text>
            <SearchInput
              value={folioSearch}
              onChangeText={setFolioSearch}
              placeholder="Ingrese número de folio..."
              keyboardType="numeric"
            />
          </View>
        </DateRangeFilter>

        {/* Filtro por tipo de documento */}
        <View style={styles.docTypeFilterContainer}>
          <Text style={[styles.filterLabel, { color: '#00bdce', textAlign: 'center', fontSize: 16 }]}>Tipo de documento:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.docTypeScroll}
          >
            {DOCUMENT_TYPE_OPTIONS.map((docType) => (
              <TouchableOpacity
                key={docType.id}
                style={[
                  styles.docTypeChip,
                  {
                    backgroundColor: selectedDocType === docType.id
                      ? themeColors.secondary
                      : 'transparent',
                    borderColor: themeColors.secondary,
                    borderWidth: 1,
                  }
                ]}
                onPress={() => handleDocTypeChange(docType.id)}
              >
                <Text style={[
                  styles.docTypeChipText,
                  {
                    color: selectedDocType === docType.id
                      ? '#FFFFFF'
                      : themeColors.secondary,
                  }
                ]}>
                  {docType.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Loading state */}
        {(isSearching || loadingDpay) && (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Image
              source={require('../../assets/logos/logo_dpay_cargando.gif')}
              style={{ width: 120, height: 120 }}
              resizeMode="contain"
            />
          </View>
        )}

        {/* Lista vacía */}
        {unifiedDocuments.length === 0 && !isSearching && !loadingDpay && (
          <EmptyState 
            iconImage={require('../../assets/icons_new2/sin_documento-01.png')}
            title="Sin documentos" 
            titleColor="#03C0C3"
            titleFontFamily="Montserrat-Bold"
            message="No hay documentos en el rango seleccionado"
            messageColor="#03C0C3"
            messageFontFamily="Montserrat-Bold"
          />
        )}

        {/* Toggle mostrar/ocultar detalles */}
        {unifiedDocuments.length > 0 && !isSearching && !loadingDpay && (
          <TouchableOpacity
            onPress={() => setShowDetails(!showDetails)}
            style={{ paddingVertical: 10, alignItems: 'center', marginBottom: 15 }}
          >
            <Text style={{
              color: '#00bdce',
              fontSize: 18,
              fontWeight: 'bold',
            }}>
              {showDetails ? 'Ver resumen de ventas' : 'Ver documentos emitidos'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Lista unificada de documentos (locales y DPay) */}
        {showDetails && unifiedDocuments.length > 0 && !isSearching && !loadingDpay && unifiedDocuments.map((doc, index) => {
          // Preparar datos unificados para el componente DocumentCard
          if (doc.type === 'local') {
            const item = doc.data;
            const annulmentInfo = getLocalDocumentAnnulment(item);
            const isAnulado = !!annulmentInfo?.isTotalmenteAnulado;
            const isNC = (item.documentType as number) === 61;
            // Verificar que no sea un pago recibido (documentType === 0 o undefined)
            const isPagoRecibido = !item.documentType || (item.documentType as number) === 0;
            
            // Generar texto del banner de anulación
            let annulmentBannerText: string | undefined;
            let annulmentBannerColor: string | undefined;
            
            // Si está completamente anulado por correcciones (múltiples NC de corrección que suman 100%)
            if (annulmentInfo?.estaCompletamenteAnuladoPorCorrecciones && annulmentInfo.ncTotales === 0) {
              annulmentBannerText = `ANULADO TOTALMENTE POR CORRECCIONES - NC #${annulmentInfo.foliosNCCorreccion.join(', #')}`;
              annulmentBannerColor = '#00bdce';
            }
            // Si tiene una NC total tradicional
            else if (annulmentInfo?.ncTotales && annulmentInfo.ncTotales > 0) {
              annulmentBannerText = `ANULADO POR NOTA DE CREDITO #${annulmentInfo.folioNCTotal}`;
              annulmentBannerColor = '#00bdce';
            }
            // Si tiene correcciones parciales (pero no suman 100%)
            else if (annulmentInfo && annulmentInfo.ncCorrecciones > 0) {
              annulmentBannerText = `CORRECCIÓN DE MONTO - NC #${annulmentInfo.foliosNCCorreccion.join(', #')}`;
              annulmentBannerColor = '#03C0C3';
            }
            // Si esta NC anula otro documento
            else if (isNC && item.referencia?.folioRef) {
              const isCorreccion = item.referencia.codigoRef === 3;
              annulmentBannerText = isCorreccion
                ? `Corrección de Monto - ${getDocumentTypeName(item.referencia.tipoDocRef)} #${item.referencia.folioRef}`
                : `Anula ${getDocumentTypeName(item.referencia.tipoDocRef)} #${item.referencia.folioRef}`;
              annulmentBannerColor = isCorreccion ? '#03C0C3' : '#00bdce';
            }
            
            return (
              <DocumentCard
                key={`local-${item.id}-${index}`}
                keyPrefix={`local-${item.id}`}
                folio={item.folio || 0}
                documentTypeName={getDocumentTypeName(item.documentType)}
                documentType={item.documentType}
                date={item.completedAt || item.createdAt}
                total={item.total}
                paymentMethod={item.paymentMethod}
                isNC={isNC}
                isSynced={item.syncStatus === 'synced'}
                isAnulado={isAnulado}
                annulmentBannerText={annulmentBannerText}
                annulmentBannerColor={annulmentBannerColor}
                onPress={() => {
                  // Buscar si hay un doc DPay con el mismo folio para poder mostrar PDF
                  const matchingDpay = item.folio
                    ? dpayDocuments.find(d => d.folio === item.folio)
                    : undefined;
                  navigation.navigate('ViewInvoice', {
                    saleId: item.id,
                    dpayIdDocumento: matchingDpay?.id_documento,
                  });
                }}
                onAnnul={
                  !isNC && !isAnulado && (
                    isPagoRecibido ||
                    (!permiteNotaCredito && isBoletaDocType(item.documentType as number)) ||
                    (permiteNotaCredito && emitirDocumento && !isPagoRecibido)
                  )
                    ? () => handleAnnulPress(item)
                    : undefined
                }
              />
            );
          } else {
            // Documento DTemite (servidor)
            const dpayDoc = doc.data;
            const docTypeId = getDocTypeIdFromDpayName(dpayDoc.tipo_documento);
            const isNC = docTypeId === 61;
            // Verificar que no sea un pago recibido (docTypeId === 0 o undefined)
            const isPagoRecibido = !docTypeId || docTypeId === 0;
            
            // Verificar anulación usando la nueva función que calcula correcciones
            const annulmentInfo = getDpayDocumentAnnulment(dpayDoc);
            const isReallyAnulado = !!annulmentInfo?.isTotalmenteAnulado;
            
            // Generar texto del banner de anulación
            let annulmentBannerText: string | undefined;
            let annulmentBannerColor: string | undefined;
            
            // Si está completamente anulado por correcciones (múltiples NC de corrección que suman 100%)
            if (annulmentInfo?.estaCompletamenteAnuladoPorCorrecciones && annulmentInfo.ncTotales === 0) {
              annulmentBannerText = `ANULADO TOTALMENTE POR CORRECCIONES - NC #${annulmentInfo.foliosNCCorreccion.join(', #')}`;
              annulmentBannerColor = '#00bdce';
            }
            // Si tiene una NC total tradicional
            else if (annulmentInfo?.ncTotales && annulmentInfo.ncTotales > 0) {
              annulmentBannerText = `ANULADO POR NOTA DE CREDITO #${annulmentInfo.folioNCTotal}`;
              annulmentBannerColor = '#00bdce';
            }
            // Si tiene correcciones parciales (pero no suman 100%)
            else if (annulmentInfo && annulmentInfo.ncCorrecciones > 0) {
              annulmentBannerText = `CORRECCIÓN DE MONTO - NC #${annulmentInfo.foliosNCCorreccion.join(', #')}`;
              annulmentBannerColor = '#03C0C3';
            }
            // Si es backend que marca parcial (legacy)
            else if (dpayDoc.anulado && dpayDoc.tipo_anulacion === 'parcial') {
              annulmentBannerText = `CORRECCIÓN DE MONTO - NC #${dpayDoc.folio_nc_anulacion}`;
              annulmentBannerColor = '#03C0C3';
            }
            // Si esta NC anula otro documento
            else if (isNC && dpayDoc.folio_documento_anulado) {
              const razon = dpayDoc.razon_anulacion_nc?.toLowerCase() || '';
              const isCorreccion = razon.includes('correcci') || razon.includes('monto');
              annulmentBannerText = isCorreccion
                ? `Corrección de Monto - ${dpayDoc.tipo_documento_anulado} #${dpayDoc.folio_documento_anulado}`
                : `Anula ${dpayDoc.tipo_documento_anulado} #${dpayDoc.folio_documento_anulado}`;
              annulmentBannerColor = isCorreccion ? '#03C0C3' : '#00bdce';
            }
            
            return (
              <DocumentCard
                key={`dpay-${dpayDoc.id_documento}-${index}`}
                keyPrefix={`dpay-${dpayDoc.id_documento}`}
                folio={dpayDoc.folio}
                documentTypeName={dpayDoc.tipo_documento}
                documentType={getDocTypeIdFromDpayName(dpayDoc.tipo_documento)}
                date={dpayDoc.fecha_creacion}
                total={dpayDoc.montototal}
                paymentMethod={dpayDoc.dpay_medio_pago || dpayDoc.medio_pago}
                isNC={isNC}
                isSynced={true}
                isAnulado={isReallyAnulado}
                annulmentBannerText={annulmentBannerText}
                annulmentBannerColor={annulmentBannerColor}
                onPress={() => handleViewDpayDocument(dpayDoc)}
                onAnnul={
                  !isNC && !isReallyAnulado && !isPagoRecibido && (
                    (!permiteNotaCredito && isBoletaDocType(docTypeId)) ||
                    (permiteNotaCredito && emitirDocumento)
                  )
                    ? () => handleAnnulDtemitePress(dpayDoc)
                    : undefined
                }
              />
            );
          }
        })}

        {/* Resumen (cuando detalles ocultos) */}
        {!showDetails && unifiedDocuments.length > 0 && !isSearching && !loadingDpay && (
          <View style={styles.summaryContainer}>
            {/* Título del Resumen */}
            <Text style={[styles.summaryLabel, { color: '#03C0C3', marginBottom: 8, fontSize: 20, fontWeight: 'bold' }]}>
              RESUMEN DE VENTAS
            </Text>
            
            {/* Usuario Logueado */}
            {user && (
              <View style={[styles.summaryRow, { marginBottom: 16, justifyContent: 'flex-start' }]}>
                <Text style={{ color: themeColors.text, fontSize: 16, fontWeight: 'bold' }}>
                  Usuario: {user.nombre || user.usuario || 'Usuario'}
                </Text>
              </View>
            )}

            {/* Boletas Afectas */}
            <View style={[styles.summaryRow, { marginTop: 10 }]}>
              <Text style={{ color: '#d4186e', fontSize: 16 }}>
                Boletas Afectas:
              </Text>
              <Text style={{ color: '#d4186e', fontSize: 16, fontWeight: 'bold' }}>
                {docStats.boletasAfectas.count}
              </Text>
            </View>

            {/* Facturas Afectas */}
            <View style={[styles.summaryRow, { marginTop: 10 }]}>
              <Text style={{ color: '#d4186e', fontSize: 16 }}>
                Facturas Afectas:
              </Text>
              <Text style={{ color: '#d4186e', fontSize: 16, fontWeight: 'bold' }}>
                {docStats.facturasAfectas.count}
              </Text>
            </View>

            {/* Boletas Exentas */}
            <View style={[styles.summaryRow, { marginTop: 10 }]}>
              <Text style={{ color: '#d4186e', fontSize: 16 }}>
                Boletas Exentas:
              </Text>
              <Text style={{ color: '#d4186e', fontSize: 16, fontWeight: 'bold' }}>
                {docStats.boletasExentas.count}
              </Text>
            </View>

            {/* Facturas Exentas */}
            <View style={[styles.summaryRow, { marginTop: 10 }]}>
              <Text style={{ color: '#d4186e', fontSize: 16 }}>
                Facturas Exentas:
              </Text>
              <Text style={{ color: '#d4186e', fontSize: 16, fontWeight: 'bold' }}>
                {docStats.facturasExentas.count}
              </Text>
            </View>

            {/* Notas de Crédito */}
            <View style={[styles.summaryRow, { marginTop: 10 }]}>
              <Text style={{ color: '#d4186e', fontSize: 16 }}>
                Notas de Crédito:
              </Text>
              <Text style={{ color: '#d4186e', fontSize: 16, fontWeight: 'bold' }}>
                {docStats.nc.count}
              </Text>
            </View>

            {/* Pagos Recibidos */}
            <View style={[styles.summaryRow, { marginTop: 10 }]}>
              <Text style={{ color: '#d4186e', fontSize: 16 }}>
                Pagos recibidos:
              </Text>
              <Text style={{ color: '#d4186e', fontSize: 16, fontWeight: 'bold' }}>
                {docStats.pagosRecibidos.count}
              </Text>
            </View>

            {/* Separador */}
            <View style={{ borderTopWidth: 1, borderTopColor: themeColors.textSecondary, opacity: 0.3, marginVertical: 16 }} />

            {/* Total Ventas */}
            <View style={[styles.summaryRow, { marginTop: 10 }]}>
              <Text style={{ color: '#d4186e', fontSize: 17, fontWeight: '600' }}>
                Total Ventas:
              </Text>
              <Text style={{ color: '#d4186e', fontSize: 17, fontWeight: 'bold' }}>
                {formatCurrency(docStats.totalVentas)}
              </Text>
            </View>

            {/* Total Pagos Recibidos */}
            <View style={[styles.summaryRow, { marginTop: 10 }]}>
              <Text style={{ color: '#d4186e', fontSize: 17, fontWeight: '600' }}>
                Total Pagos Recibidos:
              </Text>
              <Text style={{ color: '#d4186e', fontSize: 17, fontWeight: 'bold' }}>
                {formatCurrency(docStats.pagosRecibidos.total)}
              </Text>
            </View>

            {/* Total Comisiones */}
            <View style={[styles.summaryRow, { marginTop: 10 }]}>
              <Text style={{ color: '#d4186e', fontSize: 17, fontWeight: '600' }}>
                Total Comisiones:
              </Text>
              <Text style={{ color: '#d4186e', fontSize: 17, fontWeight: 'bold' }}>
                {formatCurrency(docStats.totalComisiones)}
              </Text>
            </View>

            {/* Total Anulaciones */}
            <View style={[styles.summaryRow, { marginTop: 10 }]}>
              <Text style={{ color: '#d4186e', fontSize: 17, fontWeight: '600' }}>
                Total Anulaciones (NC):
              </Text>
              <Text style={{ color: '#d4186e', fontSize: 17, fontWeight: 'bold' }}>
                {formatCurrency(docStats.totalAnulaciones)}
              </Text>
            </View>

            {/* Separador */}
            <View style={{ borderTopWidth: 2, borderTopColor: '#03C0C3', marginVertical: 16 }} />

            {/* Total General */}
            <View style={styles.summaryRow}>
              <Text style={{ color: '#03C0C3', fontSize: 20, fontWeight: 'bold' }}>
                TOTAL GENERAL:
              </Text>
              <Text style={{ color: '#03C0C3', fontSize: 22, fontWeight: 'bold' }}>
                {formatCurrency(docStats.totalGeneral)}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Botón flotante de sincronización */}
      {pendingCount > 0 && emitirDocumento && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            bottom: 20,
            right: 20,
            backgroundColor: '#4FC3F7',
            width: 60,
            height: 60,
            borderRadius: 30,
            justifyContent: 'center',
            alignItems: 'center',
            elevation: 5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
          }}
          onPress={handleSyncAll}
          disabled={syncing}
        >
          {syncing ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Image 
                source={require('../../assets/icons/reload.png')} 
                style={{ width: 30, height: 30, tintColor: '#FFFFFF' }} 
                resizeMode="contain"
              />
              {pendingCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: -5,
                    right: -5,
                    backgroundColor: themeColors.error,
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' }}>
                    {pendingCount > 99 ? '99+' : pendingCount}
                  </Text>
                </View>
              )}
            </>
          )}
        </TouchableOpacity>
      )}
      {/* Modal de Anulación */}
      <AppModal
        visible={annulModalVisible}
        title="Anular documento"
        onClose={() => setAnnulModalVisible(false)}
        maxWidth={450}
      >
        <View style={{ paddingVertical: 10 }}>
          <Text style={{
            fontSize: 16,
            color: themeColors.text,
            textAlign: 'center',
            marginBottom: 20,
            fontFamily: 'Montserrat-Regular'
          }}>
            ¿Qué tipo de nota de crédito desea emitir?
          </Text>

          {/* Opción 1: Corrección de monto */}
          <TouchableOpacity
            onPress={() => setAnnulOption('correction')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: annulOption === 'correction' ? themeColors.secondary : 'transparent',
              padding: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: themeColors.secondary,
              marginBottom: 10
            }}
          >
            <View style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              borderWidth: 2,
              borderColor: annulOption === 'correction' ? '#FFFFFF' : themeColors.secondary,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10
            }}>
              {annulOption === 'correction' && (
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFFFFF' }} />
              )}
            </View>
            <Text style={{
              flex: 1,
              fontSize: 15,
              color: annulOption === 'correction' ? '#FFFFFF' : themeColors.secondary,
              fontWeight: annulOption === 'correction' ? 'bold' : 'normal'
            }}>
              Nota de Crédito por corrección{'\n'}de monto
            </Text>
          </TouchableOpacity>

          {/* Opción 2: Anulación Total */}
          <TouchableOpacity
            onPress={() => setAnnulOption('total')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: annulOption === 'total' ? themeColors.secondary : 'transparent',
              padding: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: themeColors.secondary,
              marginBottom: 20
            }}
          >
            <View style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              borderWidth: 2,
              borderColor: annulOption === 'total' ? '#FFFFFF' : themeColors.secondary,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10
            }}>
              {annulOption === 'total' && (
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFFFFF' }} />
              )}
            </View>
            <Text style={{
              flex: 1,
              fontSize: 15,
              color: annulOption === 'total' ? '#FFFFFF' : themeColors.secondary,
              fontWeight: annulOption === 'total' ? 'bold' : 'normal'
            }}>
              Nota de Crédito por documento total
            </Text>
          </TouchableOpacity>

          {/* Botones de acción */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
            <TouchableOpacity
              onPress={() => setAnnulModalVisible(false)}
              disabled={isAnulling}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 25,
                backgroundColor: '#75bebf',
                alignItems: 'center',
                opacity: isAnulling ? 0.5 : 1
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleConfirmAnnul}
              disabled={isAnulling}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 25,
                backgroundColor: '#d4186e',
                alignItems: 'center',
                opacity: isAnulling ? 0.5 : 1
              }}
            >
              {isAnulling ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>Confirmar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </AppModal>

      {/* Modal simplificado: NC por documento total (cuando ncCorreccionMonto está desactivado) */}
      <AppModal
        visible={simpleAnnulModalVisible}
        title="Anular documento"
        onClose={() => { setSimpleAnnulModalVisible(false); setSelectedSaleToAnnul(null); }}
        maxWidth={450}
      >
        <View style={{ paddingVertical: 10 }}>
          <Text style={{
            fontSize: 16,
            color: themeColors.text,
            textAlign: 'center',
            marginBottom: 24,
            fontFamily: 'Montserrat-Regular'
          }}>
            ¿Quieres crear la Nota de Crédito por documento total?
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              onPress={() => { setSimpleAnnulModalVisible(false); setSelectedSaleToAnnul(null); }}
              disabled={isAnulling}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 25,
                backgroundColor: '#75bebf',
                alignItems: 'center',
                opacity: isAnulling ? 0.5 : 1
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>No</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConfirmSimpleAnnul}
              disabled={isAnulling}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 25,
                backgroundColor: '#d4186e',
                alignItems: 'center',
                opacity: isAnulling ? 0.5 : 1
              }}
            >
              {isAnulling ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>Sí</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </AppModal>

      {/* Loading D-PAY durante emisión de NC o carga de detalle previo */}
      <Loading
        visible={isAnulling || loadingDpayDetail}
        message={isAnulling ? 'Emitiendo nota de crédito...' : 'Cargando documento...'}
      />

      {/* Modal de Éxito */}
      <SuccessModal
        visible={successModalData.visible}
        message={successModalData.message}
        onConfirm={() => setSuccessModalData({ ...successModalData, visible: false })}
      />

      {/* Modal de Sincronización Exitosa */}
      <SuccessModal
        visible={syncSuccessModal.visible}
        title="Sincronización exitosa"
        message={syncSuccessModal.message}
        onConfirm={() => setSyncSuccessModal({ visible: false, message: '' })}
      />

      {/* Modal de Sincronización Parcial */}
      <AppModal
        visible={syncPartialModal.visible}
        title="Sincronización completada"
        message={syncPartialModal.message}
        buttons={[
          { text: 'OK', onPress: () => setSyncPartialModal({ visible: false, message: '' }), variant: 'primary' }
        ]}
        onClose={() => setSyncPartialModal({ visible: false, message: '' })}
      />

      {/* Modal de Error de Sincronización */}
      <AppModal
        visible={syncErrorModal.visible}
        title="Error"
        message={syncErrorModal.message}
        buttons={[
          { text: 'OK', onPress: () => setSyncErrorModal({ visible: false, message: '' }), variant: 'primary' }
        ]}
        onClose={() => setSyncErrorModal({ visible: false, message: '' })}
      />
    </View>
  );
};

// Estilos del componente
const styles = StyleSheet.create({
  summaryContainer: {
    marginTop: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  docTypeFilterContainer: {
    marginBottom: 15,
    marginTop: 10,
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  docTypeScroll: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 10,
  },
  docTypeChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    minWidth: 80,
    alignItems: 'center',
  },
  docTypeChipText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
