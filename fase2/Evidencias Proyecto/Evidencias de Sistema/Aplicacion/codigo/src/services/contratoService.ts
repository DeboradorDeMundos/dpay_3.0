import { apiClient } from './apiClient';

/**
 * Servicio para gestión de contratos DPAY
 */

// Constante para el tipo de servicio DPAY POS
const DPAY_SERVICE_TYPE = 'dpay_pos';

export interface ContratoAnexo {
  id_anexo: number;
  id_contrato_maestro: number;
  idsistema: number;
  rutcliente: string;
  numero_anexo: string;
  tipo_servicio: string;
  nombre_servicio: string;
  version_anexo: string;
  estado: 'activo' | 'retractado' | 'cancelado' | 'suspendido';
  fecha_aceptacion: string;
  fecha_fin_retracto: string;
  valor_mensual_uf: number;
  activo: boolean;
}

export interface AceptarTerminosData {
  rut_empresa: string;
  email_usuario: string;
  fingerprint: string;
  resolucion_pantalla: string;
  timezone: string;
  tiempo_lectura_segundos: number;
  scroll_completo: boolean;
}

/**
 * Verificar si el usuario tiene contrato DPAY activo
 * IMPORTANTE: Solo verifica anexos específicos de DPAY (tipo_servicio = 'dpay_pos')
 * No considera otros tipos de servicios que pueda tener el cliente
 * 
 * @param rut RUT del sistema (formato: 12345678-9)
 * @returns true si tiene anexo DPAY activo, false en caso contrario
 */
export const checkUserHasActiveContract = async (rut: string): Promise<boolean> => {
  try {
    console.log(`[ContratoService] Verificando contrato DPAY para RUT: ${rut}`);
    
    const response = await apiClient(`/dpay/contrato/anexos/${rut}`, {
      method: 'GET',
      requiresAuth: true,
    });
    
    const anexos: ContratoAnexo[] = await response.json();
    
    console.log(`[ContratoService] Total anexos recibidos: ${anexos.length}`);
    
    // Filtrar SOLO anexos de DPAY (tipo_servicio = 'dpay_pos')
    const anexosDpay = anexos.filter(anexo => anexo.tipo_servicio === DPAY_SERVICE_TYPE);
    
    console.log(`[ContratoService] Anexos DPAY encontrados: ${anexosDpay.length}`, anexosDpay.map(a => ({
      id_anexo: a.id_anexo,
      tipo_servicio: a.tipo_servicio,
      estado: a.estado,
      activo: a.activo
    })));
    
    // Verificar si tiene al menos un anexo DPAY activo
    const anexoDpayActivo = anexosDpay.find(
      anexo => anexo.tipo_servicio === DPAY_SERVICE_TYPE && 
               anexo.estado === 'activo' && 
               anexo.activo === true
    );
    
    if (anexoDpayActivo) {
      console.log(`[ContratoService] ✓ Usuario TIENE contrato DPAY activo (ID: ${anexoDpayActivo.id_anexo})`);
      return true;
    } else {
      console.log('[ContratoService] ✗ Usuario NO tiene contrato DPAY activo');
      return false;
    }
  } catch (error) {
    console.error('[ContratoService] Error al verificar contrato DPAY:', error);
    // En caso de error (404, etc.), asumimos que no tiene contrato
    console.log('[ContratoService] Por error, asumiendo que NO tiene contrato DPAY');
    return false;
  }
};

/**
 * Aceptar términos y condiciones (crear anexo DPAY)
 * @param data Datos de aceptación de términos
 */
export const acceptTermsAndConditions = async (data: AceptarTerminosData): Promise<any> => {
  const response = await apiClient('/dpay/contrato/aceptar-anexo', {
    method: 'POST',
    body: JSON.stringify(data),
    requiresAuth: true,
  });
  
  return response.json();
};

/**
 * Obtener anexos activos
 * @param rut RUT del sistema
 */
export const getActiveContracts = async (rut: string): Promise<ContratoAnexo[]> => {
  const response = await apiClient(`/dpay/contrato/anexos/${rut}`, {
    method: 'GET',
    requiresAuth: true,
  });
  
  return response.json();
};
