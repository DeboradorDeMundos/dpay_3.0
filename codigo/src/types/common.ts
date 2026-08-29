/**
 * Tipos comunes para todo el sistema POS
 */

import { DocumentType } from './caf';

/**
 * Producto del catálogo
 * Soporta campos en español (API) e inglés (interno)
 */
export interface Product {
  id: string;
  code?: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  stock?: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Cliente
 */
export interface Client {
  id: string;
  rut: string; // RUT formato: 12345678-9
  name: string; // Razón social o nombre completo
  email?: string;
  phone?: string;
  address?: string;
  comuna?: string;
  ciudad?: string;
  giro?: string; // Giro o actividad comercial
  id_region?: number; // ID de la región
  id_provincia?: number; // ID de la provincia
  id_comuna?: number; // ID de la comuna
  internalCode?: string; // Código interno
  isActive: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/**
 * Item de una venta
 */
export interface SaleItem {
  id: string; // ID único del item en la venta
  productId?: string; // ID del producto (si aplica)
  code?: string; // Código del producto
  name: string; // Nombre del producto
  count: number; // Cantidad
  value: number; // Precio unitario
  total: number; // Total = count * value
  bodega?: string; // Código de bodega ('01', '02', etc.)
  nombreBodega?: string; // Nombre de la bodega (para referencia)
}

/**
 * Información de una venta
 */
export interface Sale {
  id: string; // ID único de la venta
  results: SaleItem[]; // Items de la venta
  documentType?: DocumentType; // Tipo de documento
  folio?: number; // Folio asignado
  ted?: string; // TED (Timbre Electrónico DTE) en formato XML
  client?: Client; // Cliente (opcional)
  paymentMethod?: string; // Método de pago
  change?: number; // Vuelto
  subtotal: number; // Suma de items
  neto: number; // Monto neto (afecto)
  exento: number; // Monto exento
  iva: number; // IVA
  total: number; // Total
  createdAt: string; // ISO 8601
  completedAt?: string; // ISO 8601 (cuando se completa)
  status: 'draft' | 'completed' | 'cancelled';
  // Campos de sincronización con servidor D-PAY
  syncStatus: 'pending' | 'syncing' | 'synced' | 'error'; // Estado de sincronización
  syncedAt?: string; // ISO 8601 de cuando se sincronizó
  trackId?: string; // Track ID del servidor D-PAY
  id_documento?: number; // ID del documento en el servidor D-PAY (para generar URL PDF)
  syncError?: string; // Mensaje de error si falló la sincronización
  tuuTransactionId?: string; // ID de transacción Tuu (sequenceNumber)
  dpayTransactionId?: number; // ID de la fila en tbl_dpay (para anulación de pagos sin DTE)

  // Información de referencia (Para Notas de Crédito y otros docs con referencia)
  referencia?: {
    tipoDocRef: number; // Tipo de documento referenciado (33, 39, etc.)
    nombreDocRef: string; // Nombre del documento referenciado
    folioRef: number; // Folio del documento referenciado
    fechaRef: string; // Fecha del documento referenciado
    razonRef: string; // Razón de la referencia ("Anula documento total", etc.)
    codigoRef: number; // Código de referencia (1=Anula, 2=Corrige, 3=Otro)
  };

  // Datos completos del pago TUU (para sincronización posterior y visualización)
  tuuPaymentData?: {
    // Request enviado a TUU
    request: {
      amount: number;
      method: number; // 1=Crédito, 2=Débito, 10=Efectivo
      dteType: number;
      tip?: number;
      cashback?: number;
      installmentsQuantity?: number;
    };
    // Response de TUU
    response: {
      sequenceNumber: string;
      transactionStatus: boolean;
      transactionTip?: number;
      transactionCashback?: number;
      printerVoucherCommerce?: boolean;
      authCode?: string;        // Código de autorización del banco
      last4?: string;           // Últimos 4 dígitos de la tarjeta
    };
    // Datos calculados
    tipoTarjeta: string; // 'CREDITO', 'DEBITO', 'EFECTIVO'
    idMedioPago: number;
    montoNeto: number;
    montoExento: number;
    // Comisiones DPay
    tipo_comision?: 'fija' | 'mixta'; // Tipo de comisión aplicada
    comision_porcentaje?: number; // % de comisión aplicada (1.99 para fija, 1.49 para mixta)
    comision_monto_fijo?: number; // Monto fijo base ($0 para fija, $70 para mixta)
    comision_monto?: number; // Monto NETO de comisión en pesos (sin IVA; el backend recalcula al registrar)
    // Estado de sincronización con backend
    syncedToBackend: boolean;
    backendSyncError?: string;
  };

  // Información del emisor (para filtrar por usuario/empresa)
  issuerUserId?: string; // RUT o ID del usuario emisor
  issuerUser?: string;   // Nombre o alias del usuario emisor
  issuerCompany?: string; // RUT de la empresa emisora
}

/**
 * Configuración de impresora
 */
export interface PrinterConfig {
  id?: string;
  name: string;
  address: string; // MAC address del dispositivo Bluetooth
  type: 'bluetooth' | 'usb' | 'network';
  isConnected: boolean;
  lastConnected?: string; // ISO 8601
}

/**
 * Configuración del sistema
 */
export interface Settings {
  // Configuración visual
  systemImage?: string; // URL o base64 de la imagen del sistema

  // Configuración de documentos
  documentType: Array<{
    id: DocumentType;
    name: string;
    enabled: boolean;
  }>;

  // Configuración de funcionalidades
  automaticPrinting: boolean; // Imprimir automáticamente al completar venta
  autoPrintMode: 'document' | 'voucher' | 'both'; // Qué imprimir automáticamente: documento, comprobante o ambos
  selectClient: boolean; // Solicitar selección de cliente
  enableTip: boolean; // Habilitar opción de propina
  addComments: boolean; // Permitir agregar comentarios
  processPayments: boolean; // Procesar pagos
  emitirDocumento: boolean; // Emitir documento electrónico y sincronizar con DTEMITE (si false, solo envía a tbl_dpay)
  ncCorreccionMonto: boolean; // Habilitar NC por corrección de monto al anular (si false, muestra modal simplificado de NC total)

  // Configuración de impresión
  printer?: PrinterConfig; // Impresora configurada
  paperWidth: string; // Ancho del papel (mm)
  coolingInterval: string; // Intervalo de enfriamiento (ms)
  printTED: boolean; // Imprimir código TED (PDF417)

  // Configuración de sincronización
  autoSync: boolean; // Sincronizar automáticamente al completar venta (SIEMPRE ACTIVO - no se puede desactivar)

  // Headers de impresión (6 líneas personalizables)
  header1: string;
  header2: string;
  header3: string;
  header4: string;
  header5: string;
  header6: string;

  // Footers de impresión (6 líneas personalizables)
  footer1: string;
  footer2: string;
  footer3: string;
  footer4: string;
  footer5: string;
  footer6: string;

  // Líneas adicionales
  additionalLines: string;
  commentInvoice: string; // Comentario para facturas
  showLogo: boolean; // Mostrar logo en el PDF de la boleta
  enableProductScan: boolean; // Botón Scan en calculadora (escaneo por cámara)
  scanPersistentMode: boolean; // true = cámara abierta hasta pulsar Volver; false = mantener presionado Scan
  scanFlashAlways: boolean; // true = flash siempre; false = botón en overlay para encender/apagar
}

/**
 * Información de login
 */
export interface LoginInformation {
  usuario: string; // Usuario
  user?: string; // Alias de usuario (legacy)
  rut?: string; // RUT del usuario
  b64pass?: string; // Password en base64 (para emisión de documentos)
  token: string; // Token de autenticación
  nombre?: string; // Nombre del usuario
  empresa?: {
    rut: string;
    razon: string;
    giro: string;
    direccion: string;
    comuna: string;
    provincia: string;
    telefono?: string;
    email?: string;
  };
  sistema?: string; // Nombre del sistema
  /** true si el tenant tiene NC (61) habilitada en DTEmite */
  permiteNotaCredito?: boolean;
}

/**
 * Estado de sincronización
 */
export interface SyncStatus {
  lastSync?: string; // ISO 8601 de última sincronización
  pendingCafs: number; // CAFs pendientes de descargar
  pendingCatalogue: boolean; // Catálogo pendiente de sincronizar
  pendingClients: boolean; // Clientes pendientes de sincronizar
  isSyncing: boolean; // Si está sincronizando actualmente
}

/**
 * Método de pago
 */
export interface PaymentMethod {
  id: string;
  name: string;
  requiresChange: boolean; // Si requiere calcular vuelto
  icon?: string;
}

/**
 * Respuesta genérica del API
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
