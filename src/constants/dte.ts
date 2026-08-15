/**
 * Constantes para Documentos Tributarios Electrónicos (DTE)
 * Sistema de facturación electrónica chilena
 */

/**
 * Template XML para TED (Timbre Electrónico DTE)
 * El TED es la firma digital del documento que permite su validación por el SII
 */
export const TED_XML = '<TED version="1.0">_DD_<FRMT algoritmo="SHA1withRSA">_FRMT_</FRMT></TED>';

/**
 * Template XML para DD (Documento Descriptor)
 * Contiene los datos básicos del documento para generar la firma
 * 
 * Placeholders:
 * _RE_: RUT del emisor
 * _TD_: Tipo de documento (33, 39, 41, etc.)
 * _F_: Folio asignado
 * _FE_: Fecha de emisión (YYYY-MM-DD)
 * _RR_: RUT del receptor
 * _RSR_: Razón social del receptor (máx 40 caracteres)
 * _MNT_: Monto total del documento
 * _IT1_: Nombre del primer item (máx 40 caracteres)
 * _CAF_: XML del CAF sin saltos de línea
 * _TSTED_: Timestamp de generación del TED (YYYY-MM-DDTHH:mm:ss)
 */
export const DD_XML =
  '<DD><RE>_RE_</RE><TD>_TD_</TD><F>_F_</F><FE>_FE_</FE><RR>_RR_</RR><RSR>_RSR_</RSR><MNT>_MNT_</MNT><IT1>_IT1_</IT1>_CAF_<TSTED>_TSTED_</TSTED></DD>';

/**
 * Tipos de documentos tributarios disponibles
 */
export const DOCUMENT_TYPES = [
  {
    id: 39,
    name: 'Boleta Electrónica',
    code: '39',
  },
  {
    id: 41,
    name: 'Boleta Exenta',
    code: '41',
  },
  {
    id: 33,
    name: 'Factura Electrónica',
    code: '33',
  },
  {
    id: 34,
    name: 'Factura Exenta',
    code: '34',
  },
];

/**
 * Mapea el tipo de documento DTemite al tipo que espera Tuu.
 * Tuu solo acepta: 0, 33, 34, 44, 48, 99
 * - Boletas (39, 41) → 48 (código genérico de boleta para Tuu)
 * - Facturas (33, 34) → se mantienen igual
 */
export function mapDocTypeToTuu(dtemiteDocType: number): number {
  switch (dtemiteDocType) {
    case 39: // Boleta Electrónica
    case 41: // Boleta Exenta
      return 48; // Tuu usa 48 para boletas
    case 33: // Factura Electrónica
    case 34: // Factura Exenta
      return dtemiteDocType;
    default:
      return dtemiteDocType;
  }
}
