/**
 * Tipos para CAF (Código de Autorización de Folios)
 * Sistema de facturación electrónica chilena
 */

/**
 * Tipo de documento tributario electrónico (DTE)
 */
export enum DocumentType {
  FACTURA_AFECTA = 33,
  FACTURA_EXENTA = 34,
  BOLETA_AFECTA = 39,
  BOLETA_EXENTA = 41,
}

/**
 * Rango de folios autorizados
 */
export interface FolioRange {
  from: number;
  to: number;
}

/**
 * Autorización de folios (CAF)
 */
export interface CAF {
  id: string;
  documentType: DocumentType;
  range: FolioRange;
  issueDate: string; // ISO 8601
  privateKey: string; // Base64 encoded RSA private key
  publicKey: string; // Base64 encoded RSA public key
  cafXml: string; // XML completo del CAF
  currentFolio: number; // Último folio usado
  remainingFolios: number; // Folios disponibles
}

/**
 * Estructura del CAF parseado del XML
 */
export interface CAFData {
  version: string;
  DA: {
    RE: string; // RUT Emisor
    RS: string; // Razón Social
    TD: string; // Tipo de Documento
    RNG: {
      D: string; // Desde
      H: string; // Hasta
    };
    FA: string; // Fecha de Autorización
    RSAPK: {
      M: string; // Módulo RSA
      E: string; // Exponente RSA
    };
    IDK: string; // Identificador de la clave
  };
  FRMA: {
    algoritmo: string;
    value: string; // Firma del SII
  };
  RSASK: string; // Private Key (Base64)
  RSAPUBK: string; // Public Key (Base64)
}

/**
 * Request para obtener CAFs del servidor
 */
export interface GetCAFsRequest {
  token: string;
}

/**
 * Response del servidor con CAFs
 */
export interface GetCAFsResponse {
  success: boolean;
  data: CAF[];
  message?: string;
}

/**
 * Asignación de folio para un documento
 */
export interface FolioAssignment {
  cafId: string;
  documentType: DocumentType;
  folio: number;
  assignedAt: string; // ISO 8601
}
