// ============================================
// CONSTANTES DE LA APLICACIÓN
// ============================================

// Exportar constantes de DTE
export * from './dte';

// Colores del tema
export const COLORS = {
  primary: '#1a73e8',
  secondary: '#5f6368',
  success: '#34a853',
  danger: '#ea4335',
  warning: '#fbbc04',
  info: '#4285f4',
  light: '#f8f9fa',
  dark: '#202124',
  white: '#ffffff',
  black: '#000000',
  gray: {
    50: '#f8f9fa',
    100: '#e8eaed',
    200: '#dadce0',
    300: '#c6c8cc',
    400: '#9aa0a6',
    500: '#5f6368',
    600: '#3c4043',
    700: '#202124',
  },
} as const;

// Tamaños de fuente
export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// Espaciado
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// Documentos SII - Lista de tipos disponibles para selección
export const AVAILABLE_DOCUMENT_TYPES = [
  { id: 0, name: 'Comprobante Electrónico', enabled: true },
  { id: 39, name: 'Boleta afecta', enabled: false },
  { id: 41, name: 'Boleta exenta', enabled: false },
  { id: 33, name: 'Factura afecta', enabled: false },
  { id: 34, name: 'Factura exenta', enabled: false },
] as const;

// Documentos SII - IDs
export const DOCUMENT_TYPES = {
  BOLETA: 39,
  BOLETA_ELECTRONICA: 39,
  FACTURA: 33,
  FACTURA_ELECTRONICA: 33,
  FACTURA_EXENTA: 34,
  NOTA_CREDITO: 61,
  NOTA_DEBITO: 56,
} as const;

// Métodos de pago
export const PAYMENT_METHODS = {
  CASH: 'cash',
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
  TRANSFER: 'transfer',
} as const;

// Mensajes de error comunes
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Error de conexión. Por favor, verifica tu internet.',
  GENERIC_ERROR: 'Ha ocurrido un error. Por favor, intenta nuevamente.',
  UNAUTHORIZED: 'Sesión expirada. Por favor, inicia sesión nuevamente.',
  VALIDATION_ERROR: 'Por favor, completa todos los campos requeridos.',
  NO_PRINTER: 'No se ha seleccionado una impresora.',
  PRINT_ERROR: 'Error al imprimir el documento.',
  SAVE_ERROR: 'Error al guardar la venta.',
  SYNC_ERROR: 'Error al sincronizar con el servidor.',
} as const;

// Configuración de la API
export const API_CONFIG = {
  TIMEOUT: 30000, // 30 segundos
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 segundo
} as const;

// Configuración de sincronización
export const SYNC_CONFIG = {
  INTERVAL: 30000, // 30 segundos
  MAX_RETRIES: 5,
  RETRY_DELAY: 5000, // 5 segundos
} as const;

// Configuración de impresión
export const PRINTER_CONFIG = {
  ENCODING: 'GBK',
  WIDTH_58MM: 32,
  WIDTH_80MM: 48,
  DEFAULT_WIDTH: 32,
} as const;

// Regex patterns
export const REGEX_PATTERNS = {
  RUT: /^[0-9]+-[0-9kK]{1}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^(\+?56)?(\s?)(0?9)(\s?)[9876543]\d{7}$/,
} as const;

// IVA (Impuesto al Valor Agregado)
export const TAX = {
  RATE: 0.19, // 19%
  FACTOR: 1.19,
} as const;
