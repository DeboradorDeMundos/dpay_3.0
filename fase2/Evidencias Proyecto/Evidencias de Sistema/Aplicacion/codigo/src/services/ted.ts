/**
 * Servicio para generación de TED (Timbre Electrónico DTE)
 * Genera el código TED que se convierte en PDF417 para la boleta
 */
import moment from 'moment';
import { Sale } from '../types';
import { TED_XML, DD_XML } from '../constants/dte';
import { signDDXML } from './signDD';
import { useAuthStore } from '../stores/authStore';
import { useCAFStore } from '../stores/cafStore';
import { decode as atob } from 'base-64';

// Función para remover acentos
const removeAccents = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x00-\x7F]/g, '');
};

interface GenerateTEDParams {
  sale: Sale;
  folio: number;
  documentType: number;
  clientRut?: string;
  clientName?: string;
}

/**
 * Genera el TED (Timbre Electrónico DTE) para una venta
 * 
 * @param params Parámetros para la generación del TED
 * @returns XML del TED o undefined si no se puede generar
 */
export const generateTED = async (params: GenerateTEDParams): Promise<string | undefined> => {
  const { sale, folio, documentType, clientRut, clientName } = params;
  
  try {
    // Obtener usuario y CAF
    const user = useAuthStore.getState().user;
    const cafStore = useCAFStore.getState();
    
    if (!user) {
      console.log('[TED Service] No hay usuario autenticado');
      return undefined;
    }
    
    // Obtener CAF activo para el tipo de documento
    const activeCaf = cafStore.getActiveCaf(documentType);
    if (!activeCaf) {
      console.log('[TED Service] No hay CAF disponible para tipo de documento:', documentType);
      return undefined;
    }

    const purchaseDate = moment(sale.completedAt || sale.createdAt).format('YYYY-MM-DDTHH:mm:ss');
    const purchaseDateShort = moment(sale.completedAt || sale.createdAt).format('YYYY-MM-DD');
    
    // Preparar datos del cliente
    const finalClientRut = clientRut || sale.client?.rut || '66666666-6';
    const finalClientName = removeAccents(
      clientName || 
      (sale.client as any)?.razon || 
      (sale.client as any)?.nombre || 
      sale.client?.name || 
      'PUBLICO GENERAL'
    ).slice(0, 40);
    
    // Preparar datos del documento
    const firstItemName = removeAccents(sale.results[0]?.name || 'VENTA').slice(0, 40);
    const totalAmount = sale.total || sale.results.reduce((sum, item) => sum + item.total, 0);

    // Generar DD (Documento Descriptor)
    const ddXML = DD_XML
      .replace('_RE_', user.empresa?.rut || '')
      .replace('_TD_', documentType.toString())
      .replace('_F_', folio.toString())
      .replace('_FE_', purchaseDateShort)
      .replace('_RR_', finalClientRut)
      .replace('_RSR_', finalClientName)
      .replace('_MNT_', totalAmount.toString())
      .replace('_IT1_', firstItemName)
      .replace('_TSTED_', purchaseDate)
      .replace('_CAF_', atob(activeCaf.nom_archivocaf).replace(/(\r\n|\n|\r)/gm, ''));

    // Firmar DD con la clave privada RSA
    const signatureBase64 = signDDXML(ddXML, activeCaf.rsask);

    // Generar TED completo
    const tedXML = TED_XML
      .replace('_DD_', ddXML)
      .replace('_FRMT_', signatureBase64);

    console.log('[TED Service] TED generado exitosamente para folio:', folio);
    return tedXML;
  } catch (error) {
    console.error('[TED Service] Error generando TED:', error);
    return undefined;
  }
};

/**
 * Genera el TED para una venta usando sus datos actuales
 * Útil para regenerar el TED de una venta ya sincronizada
 */
export const generateTEDForSale = async (sale: Sale): Promise<string | undefined> => {
  console.log('[TED Service] generateTEDForSale llamado con sale:', {
    id: sale.id,
    folio: sale.folio,
    documentType: sale.documentType,
    hasTed: !!sale.ted,
  });
  
  if (!sale.folio || !sale.documentType) {
    console.log('[TED Service] La venta no tiene folio o tipo de documento');
    return undefined;
  }
  
  // DocumentType puede ser un enum o un número
  const docType = typeof sale.documentType === 'number' 
    ? sale.documentType 
    : (sale.documentType as any)?.id || sale.documentType;
  
  console.log('[TED Service] Generando TED para folio:', sale.folio, 'docType:', docType);
  
  return generateTED({
    sale,
    folio: sale.folio,
    documentType: docType,
    clientRut: sale.client?.rut,
    clientName: sale.client?.name || (sale.client as any)?.razon,
  });
};
