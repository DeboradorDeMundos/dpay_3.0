/**
 * Tipos para Documentos Tributarios Electrónicos (DTE)
 * Sistema de facturación electrónica chilena
 */

import { DocumentType } from './caf';

/**
 * Identificación del documento
 */
export interface IdDoc {
  TipoDTE: string; // Tipo de documento (33, 34, 39, 41)
  Folio: string; // Número de folio
  FchEmis: string; // Fecha de emisión (YYYY-MM-DD)
  FchVenc?: string; // Fecha de vencimiento (YYYY-MM-DD)
}

/**
 * Información del emisor
 */
export interface Emisor {
  RUTEmisor: string; // RUT del emisor
  RznSocEmisor: string; // Razón social
  GiroEmisor: string; // Giro comercial
  DirOrigen: string; // Dirección
  CmnaOrigen: string; // Comuna
  CiudadOrigen: string; // Ciudad/Provincia
}

/**
 * Información del receptor/cliente
 */
export interface Receptor {
  RUTRecep: string; // RUT del receptor
  CdgIntRecep?: string; // Código interno del receptor
  RznSocRecep: string; // Razón social o nombre
  CorreoRecep?: string; // Correo electrónico
  Contacto?: string; // Contacto adicional
  DirRecep: string; // Dirección
  CmnaRecep: string; // Comuna
  CiudadRecep: string; // Ciudad
}

/**
 * Totales del documento
 */
export interface Totales {
  MntNeto: string; // Monto neto (afecto)
  MntExe: string; // Monto exento
  TasaIVA: string; // Tasa de IVA (19)
  IVA: string; // Monto IVA
  MntTotal: string; // Total del documento
}

/**
 * Código de item
 */
export interface CdgItem {
  TpoCodigo: string; // Tipo de código (INT1, EAN13, etc.)
  VlrCodigo: string; // Valor del código
}

/**
 * Detalle de un item del documento
 */
export interface DetalleItem {
  NroLinDet: string; // Número de línea
  CdgItem?: CdgItem; // Código del producto (opcional)
  NmbItem: string; // Nombre del producto
  QtyItem: string; // Cantidad
  PrcItem: string; // Precio unitario
  MontoItem: string; // Monto total del item
}

/**
 * Encabezado del documento
 */
export interface Encabezado {
  IdDoc: IdDoc;
  Emisor: Emisor;
  Receptor: Receptor;
  Totales: Totales;
}

/**
 * Documento completo (DTE)
 */
export interface Documento {
  Encabezado: Encabezado;
  Detalle: DetalleItem[];
}

/**
 * Sistema/credenciales para envío al servidor
 */
export interface Sistema {
  nombre: string; // Nombre del sistema (D-PAY)
  rut: string; // RUT del usuario
  usuario: string; // Usuario
  clave: string; // Clave en base64
}

/**
 * Payload completo para enviar documento al servidor
 */
export interface DocumentPayload {
  Sistema: Sistema;
  Documento: Documento;
}

/**
 * Información de la empresa emisora
 */
export interface EmpresaInfo {
  rut: string;
  razon: string;
  giro: string;
  direccion: string;
  comuna: string;
  provincia: string;
}

/**
 * Información del sistema
 */
export interface SistemaInfo {
  sistema: string; // Nombre del sistema
  empresa: EmpresaInfo;
}

/**
 * Response del servidor al guardar documento
 */
export interface SaveDocumentResponse {
  success: boolean;
  folio?: number;
  pdf?: string; // Base64 del PDF
  xml?: string; // XML del documento
  ted?: string; // TED (Timbre Electrónico)
  message?: string;
  error?: string;
}

/**
 * Tipos de documento disponibles
 */
export interface DocumentTypeOption {
  id: DocumentType;
  name: string;
  description: string;
  requiresIVA: boolean; // true si calcula IVA
  isExempt: boolean; // true si es exento
}

/**
 * Información completa de la venta para generar documento
 */
export interface SaleDocument {
  documentType: DocumentTypeOption;
  folio: number;
  purchaseDate: string; // ISO 8601
  information: SistemaInfo;
  sale: {
    results: Array<{
      code?: string;
      name: string;
      count: number;
      value: number;
      total: number;
    }>;
  };
  client?: {
    rut: string;
    name: string;
    email?: string;
    address?: string;
    comuna?: string;
    ciudad?: string;
  };
  paymentMethod?: string;
  change?: number;
}
