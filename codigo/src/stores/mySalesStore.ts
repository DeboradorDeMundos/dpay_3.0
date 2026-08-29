import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';
import { Sale } from '../types';
import { emitDocument, registrarTransaccionTuu } from '../services/api';
import { getTerminalSerial } from '../utils/deviceInfo';
import { generateTEDForSale } from '../services/ted';
import { useAuthStore } from './authStore';
import { APP_VERSION } from '../constants/appVersion';

// Almacenamiento persistente
const storage = new MMKV({ id: 'my-sales-storage' });

interface MySalesState {
  // Estado
  sales: Sale[];
  
  // Acciones
  setSales: (sales: Sale[]) => void;
  addSale: (sale: Sale) => void;
  updateSale: (id: string, updates: Partial<Sale>) => void;
  removeSale: (id: string) => void;
  markAsSynced: (id: string) => void;
  clearSales: () => void;
  
  // Sincronización (nuevas funciones)
  syncSale: (saleId: string) => Promise<void>;
  syncAllPending: () => Promise<{ success: number; errors: number }>;
  syncTuuPayment: (saleId: string) => Promise<boolean>; // Sincronizar pago TUU con backend
  
  // Helpers
  getSaleById: (id: string) => Sale | undefined;
  getSaleByFolio: (folio: number, documentType: number) => Sale | undefined;
  getUnsyncedSales: () => Sale[];
  getSyncedSales: () => Sale[];
  getPendingSales: () => Sale[];
  getPendingTuuSyncs: () => Sale[]; // Ventas con pago TUU pendiente de sincronizar
  getTotalSales: () => number;
  getTotalUnsyncedSales: () => number;
}

export const useMySalesStore = create<MySalesState>((set, get) => {
  // Cargar ventas desde MMKV al iniciar
  const loadedSales = storage.getString('mySales');
  const initialSales: Sale[] = loadedSales ? JSON.parse(loadedSales) : [];

  return {
    sales: initialSales,

    setSales: (sales) => {
      storage.set('mySales', JSON.stringify(sales));
      set({ sales });
    },

    addSale: (sale) => {
      const newSales = [...get().sales, sale];
      storage.set('mySales', JSON.stringify(newSales));
      set({ sales: newSales });
    },

    updateSale: (id, updates) => {
      const newSales = get().sales.map((sale) =>
        sale.id === id ? { ...sale, ...updates } : sale
      );
      storage.set('mySales', JSON.stringify(newSales));
      set({ sales: newSales });
    },

    removeSale: (id) => {
      const newSales = get().sales.filter((sale) => sale.id !== id);
      storage.set('mySales', JSON.stringify(newSales));
      set({ sales: newSales });
    },

    markAsSynced: (id) => {
      get().updateSale(id, { syncStatus: 'synced' });
    },

    clearSales: () => {
      storage.delete('mySales');
      set({ sales: [] });
    },

    // Sincronización con el servidor de D-PAY
    syncSale: async (saleId) => {
      const sale = get().getSaleById(saleId);
      if (!sale) {
        throw new Error('Venta no encontrada');
      }

      // No sincronizar "pagos recibidos" (ventas sin tipo de documento o con tipo 0)
      if (!sale.documentType || sale.documentType === 0) {
        console.log('[MySalesStore] Venta sin tipo de documento (pago recibido), no se sincroniza:', saleId);
        return;
      }

      if (sale.syncStatus === 'synced') {
        console.log('[MySalesStore] Venta ya sincronizada:', saleId);
        return;
      }

      try {
        console.log('[MySalesStore] Iniciando sincronización de venta:', saleId);
        
        // Actualizar estado a 'syncing'
        get().updateSale(saleId, { syncStatus: 'syncing' });

        // Emitir documento al servidor
        const response = await emitDocument(sale);

        if (response.status === 'success') {
          // Actualizar estado a 'synced' y guardar el folio y TED asignados por el servidor
          const updatedSale: Partial<Sale> = {
            syncStatus: 'synced',
            syncedAt: new Date().toISOString(),
            trackId: response.trackId,
            folio: response.folio || sale.folio,
            id_documento: response.id_documento || undefined,
            syncError: undefined,
          };
          
          // Guardar el TED del servidor si viene
          if (response.ted) {
            updatedSale.ted = response.ted;
            console.log('[MySalesStore] TED recibido del servidor');
          }
          
          get().updateSale(saleId, updatedSale);
          
          // Si no vino TED del servidor, intentar generarlo localmente
          if (!response.ted) {
            console.log('[MySalesStore] Generando TED localmente...');
            const saleWithFolio = get().getSaleById(saleId);
            if (saleWithFolio && saleWithFolio.folio) {
              const ted = await generateTEDForSale(saleWithFolio);
              if (ted) {
                get().updateSale(saleId, { ted });
                console.log('[MySalesStore] TED generado localmente exitosamente');
              } else {
                console.log('[MySalesStore] No se pudo generar TED localmente (puede faltar CAF)');
              }
            }
          }
          
          console.log('[MySalesStore] Venta sincronizada exitosamente:', saleId, 'Folio:', response.folio);
        } else {
          throw new Error(response.message || response.error || 'Error desconocido en emisión');
        }
      } catch (error) {
        console.error('[MySalesStore] Error al sincronizar venta:', error);
        
        // Actualizar estado a 'error'
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        get().updateSale(saleId, {
          syncStatus: 'error',
          syncError: errorMessage,
        });
        
        throw error;
      }
    },

    syncAllPending: async () => {
      const pendingSales = get().getPendingSales();
      console.log('[MySalesStore] Sincronizando', pendingSales.length, 'ventas pendientes');

      let successCount = 0;
      let errorCount = 0;

      for (const sale of pendingSales) {
        try {
          await get().syncSale(sale.id);
          successCount++;
        } catch (error) {
          errorCount++;
          console.error('[MySalesStore] Error sincronizando venta:', sale.id, error);
        }
      }

      console.log('[MySalesStore] Sincronización completa:', { successCount, errorCount });
      return { success: successCount, errors: errorCount };
    },

    // Sincronizar pago TUU pendiente con el backend
    syncTuuPayment: async (saleId) => {
      const sale = get().getSaleById(saleId);
      if (!sale) {
        console.error('[MySalesStore] Venta no encontrada para sincronizar TUU:', saleId);
        return false;
      }

      if (!sale.tuuPaymentData) {
        console.log('[MySalesStore] La venta no tiene datos de pago TUU:', saleId);
        return false;
      }

      if (sale.tuuPaymentData.syncedToBackend) {
        console.log('[MySalesStore] El pago TUU ya está sincronizado:', saleId);
        return true;
      }

      const isPagoRecibido = !sale.documentType || sale.documentType === 0;

      // Boletas/facturas requieren folio DTE; comprobante electrónico (solo cobro) no lo tiene
      if (!sale.folio && !isPagoRecibido) {
        console.warn('[MySalesStore] La venta no tiene folio asignado, no se puede sincronizar TUU:', saleId);
        return false;
      }

      try {
        const authState = useAuthStore.getState();
        const usuario = (authState.user?.usuario || authState.user?.user || 'sistema').substring(0, 50);
        const dispositivo = await getTerminalSerial();
        const tuu = sale.tuuPaymentData;

        const payload: Parameters<typeof registrarTransaccionTuu>[0] = {
          monto: tuu.request.amount,
          id_cliente: sale.client?.id ? Number(sale.client.id) : 0,
          rut_cliente: sale.client?.rut || '66666666-6',
          nombre_cliente: (sale.client?.name || (sale.client as any)?.razon || 'PUBLICO GENERAL').substring(0, 100),
          email_cliente: sale.client?.email || undefined,
          telefono_cliente: (sale.client as any)?.telefono || (sale.client as any)?.phone || undefined,
          tipo_cliente: sale.client?.id ? 'registrado' : 'natural',
          usuario,
          tipo_comision: tuu.tipo_comision,
          comision_porcentaje: tuu.comision_porcentaje,
          comision_monto_fijo: tuu.comision_monto_fijo,
          comision_monto: tuu.comision_monto,
          id_mediopago: tuu.idMedioPago,
          tipo_tarjeta: (tuu.tipoTarjeta || '').substring(0, 20),
          cuotas: tuu.request.method === 1 ? 0 : 1,
          propina: tuu.response.transactionTip || 0,
          transaction_tip: tuu.response.transactionTip || 0,
          cashback: tuu.response.transactionCashback || 0,
          exempt_amount: tuu.montoExento,
          net_amount: tuu.montoNeto,
          transaction_status: tuu.response.transactionStatus,
          sequence_number: (tuu.response.sequenceNumber || '').substring(0, 50),
          codigo_autorizacion: (tuu.response.authCode || '').substring(0, 20),
          ultimos_digitos: (tuu.response.last4 || '').replace(/\*/g, '').slice(-4),
          printer_voucher_commerce: tuu.response.printerVoucherCommerce || false,
          dispositivo,
          source_name: 'Dpay',
          source_version: APP_VERSION,
          detalle: sale.results.map(item => `${item.count}x ${item.name}`).join(', ').substring(0, 200),
          request_json: tuu.request,
          response_json: tuu.response,
        };

        if (!isPagoRecibido && sale.folio) {
          payload.folio_dte = Number(sale.folio);
          payload.tipo_dte = sale.documentType;
        }

        const result = await registrarTransaccionTuu(payload);

        if (result.success) {
          get().updateSale(saleId, {
            dpayTransactionId: result.id,
            tuuPaymentData: { ...sale.tuuPaymentData, syncedToBackend: true, backendSyncError: undefined },
          });
          return true;
        } else {
          const errorMsg = result.message || 'Error desconocido al sincronizar';
          console.warn(`[MySalesStore] Error sincronizando TUU (${sale.id}):`, errorMsg);
          get().updateSale(saleId, {
            tuuPaymentData: { ...sale.tuuPaymentData, syncedToBackend: false, backendSyncError: errorMsg },
          });
          return false;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        console.error(`[MySalesStore] Excepción sincronizando TUU (${saleId}):`, errorMessage);
        get().updateSale(saleId, {
          tuuPaymentData: { ...sale.tuuPaymentData, syncedToBackend: false, backendSyncError: errorMessage },
        });
        return false;
      }
    },

    // Helpers
    getSaleById: (id) => {
      return get().sales.find((sale) => sale.id === id);
    },

    getSaleByFolio: (folio, documentType) => {
      return get().sales.find(
        (sale) => sale.folio === folio && sale.documentType === documentType
      );
    },

    getUnsyncedSales: () => {
      return get().sales.filter((sale) => sale.syncStatus !== 'synced');
    },

    getSyncedSales: () => {
      return get().sales.filter((sale) => sale.syncStatus === 'synced');
    },

    getPendingSales: () => {
      // Solo incluir ventas pendientes que tengan tipo de documento válido (no 0 ni undefined/null)
      // Las ventas sin documentType o con tipo 0 son "pagos recibidos" que no deben sincronizarse
      return get().sales.filter((sale) => 
        (sale.syncStatus === 'pending' || sale.syncStatus === 'error') && 
        sale.documentType !== undefined && 
        sale.documentType !== null &&
        sale.documentType !== 0
      );
    },

    // Ventas con pago TUU pendiente de sincronizar al backend
    getPendingTuuSyncs: () => {
      return get().sales.filter((sale) => {
        if (!sale.tuuPaymentData || sale.tuuPaymentData.syncedToBackend) return false;
        const isPagoRecibido = !sale.documentType || sale.documentType === 0;
        return isPagoRecibido || !!sale.folio;
      });
    },

    getTotalSales: () => {
      return get().sales.length;
    },

    getTotalUnsyncedSales: () => {
      return get().getUnsyncedSales().length;
    },
  };
});
