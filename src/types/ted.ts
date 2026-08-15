/**
 * Tipos para TED (Timbre Electrónico del DTE)
 * Sistema de facturación electrónica chilena
 */

import { DocumentType } from './caf';

/**
 * Estructura DD (Documento de Datos) del TED
 * Es la estructura que se firma digitalmente
 */
export interface DD {
  RE: string; // RUT Emisor
  TD: string; // Tipo de Documento (33, 34, 39, 41)
  F: string; // Folio
  FE: string; // Fecha de Emisión (YYYY-MM-DD)
  RR: string; // RUT Receptor
  RSR: string; // Razón Social Receptor
  MNT: string; // Monto Total
  IT1: string; // Item 1 (primer producto)
  CAF: string; // CAF XML (Código de Autorización de Folios)
  TSTED: string; // Timestamp (YYYY-MM-DDTHH:mm:ss)
}

/**
 * Firma RSA del DD
 */
export interface FRMT {
  algoritmo: 'SHA1withRSA'; // Algoritmo de firma
  value: string; // Firma en Base64
}

/**
 * TED completo (Timbre Electrónico del DTE)
 */
export interface TED {
  version: '1.0';
  DD: DD;
  FRMT: FRMT;
}

/**
 * TED en formato XML string
 */
export type TEDXMLString = string;

/**
 * Parámetros para generar el TED
 */
export interface GenerateTEDParams {
  rutEmisor: string; // RUT del emisor (formato: 12345678-9)
  documentType: DocumentType; // Tipo de documento (33, 34, 39, 41)
  folio: number; // Número de folio
  fechaEmision: string; // Fecha de emisión (YYYY-MM-DD)
  rutReceptor: string; // RUT del receptor (formato: 12345678-9)
  razonSocialReceptor: string; // Razón social del receptor
  montoTotal: number; // Monto total del documento
  primerItem: string; // Descripción del primer item
  cafXML: string; // XML completo del CAF
  privateKey: string; // Private Key en Base64 (del CAF)
}

/**
 * Resultado de la generación del TED
 */
export interface GenerateTEDResult {
  success: boolean;
  ted?: TEDXMLString; // TED en formato XML
  tedObject?: TED; // TED como objeto
  pdf417?: string; // Código PDF417 en Base64 (opcional)
  error?: string; // Mensaje de error si falla
}

/**
 * Parámetros para generar PDF417 del TED
 */
export interface GeneratePDF417Params {
  tedXML: TEDXMLString; // TED en formato XML
  width?: number; // Ancho del código (default: 200)
  height?: number; // Alto del código (default: 80)
}

/**
 * Resultado de la generación del PDF417
 */
export interface GeneratePDF417Result {
  success: boolean;
  pdf417?: string; // Imagen en Base64
  error?: string; // Mensaje de error si falla
}
