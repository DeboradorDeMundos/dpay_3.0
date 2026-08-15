/**
 * Servicio de sincronización automática de transacciones Tuu
 * Se ejecuta en segundo plano para garantizar que todas las transacciones de Tuu
 * se registren en el backend incluso si el usuario cierra la app o hay errores temporales
 */

import { useMySalesStore } from '../stores/mySalesStore';
import { useAuthStore } from '../stores/authStore';

/**
 * Sincroniza todas las transacciones Tuu pendientes con el backend
 * @returns Número de transacciones sincronizadas exitosamente
 */
export const syncPendingTuuTransactions = async (): Promise<number> => {
  try {
    const { getPendingTuuSyncs, syncTuuPayment } = useMySalesStore.getState();
    const pendingSales = getPendingTuuSyncs();

    if (pendingSales.length === 0) {
      return 0;
    }

    console.log(`[TuuSync] ${pendingSales.length} transacciones pendientes`);

    let successCount = 0;
    const errors: string[] = [];

    for (const sale of pendingSales) {
      try {
        const success = await syncTuuPayment(sale.id);
        
        if (success) {
          successCount++;
        } else {
          const errorMsg = sale.tuuPaymentData?.backendSyncError || 'Error desconocido';
          errors.push(`${sale.id}: ${errorMsg}`);
        }
      } catch (error: any) {
        errors.push(`${sale.id}: ${error.message}`);
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (successCount > 0) {
      console.log(`[TuuSync] ✅ ${successCount}/${pendingSales.length} sincronizadas`);
    }

    if (errors.length > 0) {
      console.error(`[TuuSync] ⚠️ ${errors.length} errores:`, errors.slice(0, 3));
    }

    return successCount;

  } catch (error) {
    console.error('[TuuSync] Error crítico:', error);
    return 0;
  }
};

/**
 * Verifica si hay transacciones pendientes de sincronizar
 * @returns true si hay transacciones pendientes
 */
export const hasPendingTuuTransactions = (): boolean => {
  const { getPendingTuuSyncs } = useMySalesStore.getState();
  return getPendingTuuSyncs().length > 0;
};

/**
 * Estadísticas de sincronización de Tuu
 */
export const getTuuSyncStats = () => {
  const { sales } = useMySalesStore.getState();
  
  const tuuSales = sales.filter(s => s.tuuPaymentData);
  const syncedCount = tuuSales.filter(s => s.tuuPaymentData?.syncedToBackend).length;
  const pendingCount = tuuSales.filter((s) => {
    if (s.tuuPaymentData?.syncedToBackend) return false;
    const isPagoRecibido = !s.documentType || s.documentType === 0;
    return isPagoRecibido || !!s.folio;
  }).length;
  const errorCount = tuuSales.filter(s => s.tuuPaymentData?.backendSyncError).length;
  const withoutFolioCount = tuuSales.filter(s => !s.folio).length;

  return {
    total: tuuSales.length,
    synced: syncedCount,
    pending: pendingCount,
    errors: errorCount,
    withoutFolio: withoutFolioCount,
  };
};

/**
 * Servicio de sincronización periódica
 * Se debe llamar desde el servicio de background
 */
export class TuuSyncScheduler {
  private static lastSyncTime: number = 0;
  private static syncInterval: number = 60000; // 1 minuto
  private static isRunning: boolean = false;

  /**
   * Ejecuta la sincronización si ha pasado el intervalo configurado
   */
  static async runIfNeeded(): Promise<void> {
    const now = Date.now();
    const timeSinceLastSync = now - this.lastSyncTime;

    if (timeSinceLastSync < this.syncInterval || this.isRunning) {
      return;
    }

    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated || !hasPendingTuuTransactions()) {
      return;
    }

    try {
      this.isRunning = true;
      const syncedCount = await syncPendingTuuTransactions();
      this.lastSyncTime = now;
    } catch (error) {
      console.error('[TuuSync] Error en sincronización:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Fuerza una sincronización inmediata (ignora el intervalo)
   */
  static async forceSync(): Promise<number> {
    if (this.isRunning) {
      return 0;
    }

    try {
      this.isRunning = true;
      const count = await syncPendingTuuTransactions();
      this.lastSyncTime = Date.now();
      return count;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Configura el intervalo de sincronización (en milisegundos)
   */
  static setSyncInterval(intervalMs: number): void {
    this.syncInterval = intervalMs;
  }

  /**
   * Resetea el temporizador para forzar una sincronización en el próximo ciclo
   */
  static resetTimer(): void {
    this.lastSyncTime = 0;
  }
}
