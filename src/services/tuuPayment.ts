import { NativeModules } from 'react-native';
import { IS_TUU_DEV } from './apiClient';

const { TuuPaymentModule } = NativeModules;

export interface TuuPaymentRequest {
  amount: number;
  tip?: number;
  cashback?: number;
  method: 0 | 1 | 2; // 0: Solicitar en APP, 1: Crédito, 2: Débito
  installmentsQuantity?: number;
  printVoucherOnApp: boolean;
  dteType: number;
  extraData?: {
    taxIdnValidation?: string;
    exemptAmount: number;
    netAmount: number;
    sourceName: string;
    sourceVersion: string;
    customFields?: Array<{
      name: string;
      value: string;
      print: boolean;
    }>;
  };
}

export interface TuuPaymentResponse {
  transactionStatus: boolean;
  sequenceNumber: string;
  printerVoucherCommerce: boolean;
  transactionTip?: number;
  transactionCashback?: number;
  // Datos adicionales de la tarjeta (confirmados por TUU)
  authCode?: string;        // Código de autorización del banco emisor
  last4?: string;           // Últimos 4 dígitos de la tarjeta
}

export interface TuuPaymentError {
  errorCode: number;
  errorMessage: string;
  errorCodeOnApp?: number;
  errorMessageOnApp?: string;
}

// Mapeo de códigos de error ICE de Tuu
const TUU_ERROR_MESSAGES: Record<string, { title: string; message: string; isCancellable?: boolean }> = {
  'ICE-8': { title: 'Error de datos', message: 'Faltan datos requeridos para la transacción.' },
  'ICE-10': { title: 'Transacción cancelada', message: 'El pago fue cancelado.', isCancellable: true },
  'ICE-12': { title: 'Error de credenciales', message: 'Problema con las credenciales del dispositivo. Vuelve a ingresar a Tuu.' },
  'ICE-14': { title: 'Sin conexión', message: 'El dispositivo no tiene conexión a internet.' },
  'ICE-20': { title: 'SDK no instalado', message: 'El SDK de pagos no está instalado en el dispositivo.' },
  'ICE-21': { title: 'Actualización requerida', message: 'La aplicación Tuu necesita ser actualizada.' },
  'ICE-23': { title: 'Error de formato', message: 'Error en los campos personalizados de la transacción.' },
  'ICE-25': { title: 'Permisos requeridos', message: 'La aplicación requiere permisos adicionales.' },
  'ICE-30': { title: 'Verificación pendiente', message: 'El dispositivo está en verificación. Puede tomar hasta 48 horas hábiles.' },
  'ICE-31': { title: 'Asignación pendiente', message: 'Esperando asignación de rubro. Puede tomar hasta 24 horas hábiles.' },
  'ICE-32': { title: 'Dispositivo suspendido', message: 'El dispositivo ha sido suspendido. Contacta a soporte Tuu.' },
  'ICE-33': { title: 'Dispositivo desactivado', message: 'El dispositivo ha sido desactivado permanentemente.' },
  'ICE-34': { title: 'Dispositivo no registrado', message: 'El dispositivo no está registrado en el sistema.' },
  'ICE-35': { title: 'Dispositivo no encontrado', message: 'El dispositivo no se encuentra registrado.' },
  'ICE-37': { title: 'Error de verificación', message: 'No se pudo verificar el estado del dispositivo.' },
  'ICE-43': { title: 'Error de inyección', message: 'No se pudo verificar el estado de inyección del dispositivo.' },
  'ICE-44': { title: 'Error de memoria', message: 'Problemas de memoria en el dispositivo. Reinicia la aplicación.' },
  'ICE-45': { title: 'Configuración corrupta', message: 'Configuración de pagos corrupta. Contacta a soporte Tuu.' },
  'ICE-46': { title: 'Error IPEK', message: 'Configuración de seguridad corrupta. Contacta a soporte Tuu.' },
  'ICE-47': { title: 'Sin configuración', message: 'El dispositivo no está configurado para pagos.' },
  'ICE-48': { title: 'Error de formato', message: 'Error en el formato de la transacción.' },
  'ICE-49': { title: 'JSON inválido', message: 'Error en el formato de los datos enviados.' },
  'ICE-50': { title: 'No aprobado', message: 'El dispositivo no está aprobado para recibir pagos.' },
  'ICE-9': {
    title: 'Error en el pago (TUU)',
    message:
      'TUU no pudo completar el cobro. Verifica terminal dev registrado, llaves inyectadas y tipo de documento habilitado. Si el monto es correcto, contacta soporte Haulmer.',
    isCancellable: true,
  },
  'ICE-60': { title: 'Error de inicio', message: 'Error al iniciar la aplicación. Intenta nuevamente.' },
  'ICE-61': { title: 'Error de servicios', message: 'Error al iniciar los servicios. Intenta nuevamente.' },
  
  // Códigos HP - Errores del procesador de pagos/banco
  // Re-intentos recomendados
  'HP-01': { title: 'Error temporal', message: 'Error temporal del banco. Por favor, re-intenta.', isCancellable: true },
  'HP-K01': { title: 'Error temporal', message: 'Error temporal del banco. Por favor, re-intenta.', isCancellable: true },
  'HP-02': { title: 'Llamar al banco', message: 'Re-intenta o llama al autorizador del banco.', isCancellable: true },
  'HP-K02': { title: 'Llamar al banco', message: 'Re-intenta o llama al autorizador del banco.', isCancellable: true },
  'HP-03': { title: 'Llamar al banco', message: 'Re-intenta o llama al autorizador del banco.', isCancellable: true },
  'HP-K03': { title: 'Llamar al banco', message: 'Re-intenta o llama al autorizador del banco.', isCancellable: true },
  'HP-N0': { title: 'Error temporal', message: 'Error temporal del banco. Por favor, re-intenta.', isCancellable: true },
  'HP-KN0': { title: 'Error temporal', message: 'Error temporal del banco. Por favor, re-intenta.', isCancellable: true },
  
  // Tarjeta declinada/rechazada
  'HP-05': { title: 'Tarjeta declinada', message: 'La tarjeta fue rechazada. Intenta con otra tarjeta.', isCancellable: true },
  'HP-K05': { title: 'Tarjeta declinada', message: 'La tarjeta fue rechazada. Intenta con otra tarjeta o verifica el saldo.', isCancellable: true },
  
  // Transacciones no operativas
  'HP-06': { title: 'Sistema no disponible', message: 'Transacciones temporalmente no disponibles. Re-intenta más tarde.', isCancellable: true },
  'HP-K06': { title: 'Sistema no disponible', message: 'Transacciones temporalmente no disponibles. Re-intenta más tarde.', isCancellable: true },
  
  // Errores de procesamiento
  'HP-04': { title: 'Error de procesamiento', message: 'Error procesando la transacción. Intenta nuevamente.', isCancellable: true },
  'HP-K04': { title: 'Error de procesamiento', message: 'Error procesando la transacción. Intenta nuevamente.', isCancellable: true },
  'HP-07': { title: 'Error de procesamiento', message: 'Error procesando la transacción. Intenta nuevamente.', isCancellable: true },
  'HP-K07': { title: 'Error de procesamiento', message: 'Error procesando la transacción. Intenta nuevamente.', isCancellable: true },
  
  // Clave/PIN
  'HP-38': { title: 'Exceso de intentos', message: 'Excedió el número de intentos de clave. La tarjeta puede estar bloqueada.', isCancellable: true },
  'HP-K38': { title: 'Exceso de intentos', message: 'Excedió el número de intentos de clave. La tarjeta puede estar bloqueada.', isCancellable: true },
  'HP-55': { title: 'Clave incorrecta', message: 'La clave ingresada es incorrecta. Intenta nuevamente.', isCancellable: true },
  'HP-K55': { title: 'Clave incorrecta', message: 'La clave ingresada es incorrecta. Intenta nuevamente.', isCancellable: true },
  'HP-82': { title: 'Cambio de clave', message: 'Se requiere cambio de clave. Contacta a tu banco.', isCancellable: true },
  'HP-K82': { title: 'Cambio de clave', message: 'Se requiere cambio de clave. Contacta a tu banco.', isCancellable: true },
  
  // Saldo/Fondos
  'HP-51': { title: 'Saldo insuficiente', message: 'La tarjeta no tiene fondos suficientes.', isCancellable: true },
  'HP-K51': { title: 'Saldo insuficiente', message: 'La tarjeta no tiene fondos suficientes.', isCancellable: true },
  
  // Tarjeta expirada
  'HP-54': { title: 'Tarjeta expirada', message: 'La tarjeta está vencida. Usa una tarjeta vigente.', isCancellable: true },
  'HP-K54': { title: 'Tarjeta expirada', message: 'La tarjeta está vencida. Usa una tarjeta vigente.', isCancellable: true },
  
  // Servicio no habilitado
  'HP-57': { title: 'Servicio no habilitado', message: 'El servicio no está habilitado para esta tarjeta.', isCancellable: true },
  'HP-K57': { title: 'Servicio no habilitado', message: 'El servicio no está habilitado para esta tarjeta.', isCancellable: true },
  'HP-83': { title: 'Servicio no habilitado', message: 'El servicio no está habilitado para esta tarjeta.', isCancellable: true },
  'HP-K83': { title: 'Servicio no habilitado', message: 'El servicio no está habilitado para esta tarjeta.', isCancellable: true },
  'HP-84': { title: 'Servicio no habilitado', message: 'El servicio no está habilitado para esta tarjeta.', isCancellable: true },
  'HP-K84': { title: 'Servicio no habilitado', message: 'El servicio no está habilitado para esta tarjeta.', isCancellable: true },
  'HP-T3': { title: 'Servicio no habilitado', message: 'El servicio no está habilitado para esta tarjeta.', isCancellable: true },
  'HP-KT3': { title: 'Servicio no habilitado', message: 'El servicio no está habilitado para esta tarjeta.', isCancellable: true },
  
  // Límites excedidos
  'HP-61': { title: 'Límite excedido', message: 'Excedió el monto o cantidad máxima permitida.', isCancellable: true },
  'HP-K61': { title: 'Límite excedido', message: 'Excedió el monto o cantidad máxima permitida.', isCancellable: true },
  'HP-65': { title: 'Límite de usos', message: 'Excedió el máximo de veces de uso permitido.', isCancellable: true },
  'HP-K65': { title: 'Límite de usos', message: 'Excedió el máximo de veces de uso permitido.', isCancellable: true },
  'HP-P9': { title: 'Monto excedido', message: 'El monto excede el límite permitido.', isCancellable: true },
  'HP-KP9': { title: 'Monto excedido', message: 'El monto excede el límite permitido.', isCancellable: true },
  
  // Tarjeta bloqueada
  'HP-75': { title: 'Tarjeta bloqueada', message: 'La tarjeta está bloqueada. Contacta a tu banco.', isCancellable: true },
  'HP-K75': { title: 'Tarjeta bloqueada', message: 'La tarjeta está bloqueada. Contacta a tu banco.', isCancellable: true },
  'HP-T8': { title: 'Tarjeta bloqueada', message: 'La tarjeta está bloqueada. Contacta a tu banco.', isCancellable: true },
  'HP-KT8': { title: 'Tarjeta bloqueada', message: 'La tarjeta está bloqueada. Contacta a tu banco.', isCancellable: true },
  
  // Tarjeta incorrecta/sin cuenta
  'HP-87': { title: 'Tarjeta incorrecta', message: 'La tarjeta ingresada es incorrecta.', isCancellable: true },
  'HP-K87': { title: 'Tarjeta incorrecta', message: 'La tarjeta ingresada es incorrecta.', isCancellable: true },
  'HP-W9': { title: 'Tarjeta incorrecta', message: 'La tarjeta ingresada es incorrecta.', isCancellable: true },
  'HP-K78': { title: 'Sin cuenta', message: 'La tarjeta no tiene cuenta asociada.', isCancellable: true },
  
  // Problemas con la tarjeta
  'HP-62': { title: 'Tarjeta con problemas', message: 'La tarjeta tiene problemas. Re-intenta o usa otra tarjeta.', isCancellable: true },
  'HP-K62': { title: 'Tarjeta con problemas', message: 'La tarjeta tiene problemas. Re-intenta o usa otra tarjeta.', isCancellable: true },
  
  // Timeout
  'HP-68': { title: 'Tiempo de respuesta', message: 'Tiempo de respuesta excedido. Re-intenta.', isCancellable: true },
  'HP-K68': { title: 'Tiempo de respuesta', message: 'Tiempo de respuesta excedido. Re-intenta.', isCancellable: true },
  
  // Cuotas
  'HP-Q9': { title: 'Cuota incorrecta', message: 'El número de cuotas ingresado es incorrecto.', isCancellable: true },
  'HP-KQ9': { title: 'Cuota incorrecta', message: 'El número de cuotas ingresado es incorrecto.', isCancellable: true },
  'HP-W8': { title: 'Cuota incorrecta', message: 'Re-intenta con otro valor de cuota.', isCancellable: true },
  'HP-Q8': { title: 'Tasa excedida', message: 'La tasa de cuotas fue excedida.', isCancellable: true },
  'HP-KQ8': { title: 'Tasa excedida', message: 'La tasa de cuotas fue excedida.', isCancellable: true },
  
  // Inserción de tarjeta
  'HP-P4': { title: 'Insertar tarjeta', message: 'Re-intenta insertando tu tarjeta (no contactless).', isCancellable: true },
  'HP-KP4': { title: 'Insertar tarjeta', message: 'Re-intenta insertando tu tarjeta (no contactless).', isCancellable: true },
  'HP-D1': { title: 'Tarjeta retirada', message: 'Retiraste la tarjeta antes de tiempo. Re-intenta.', isCancellable: true },
  
  // Re-intentar con autorizador
  'HP-P0': { title: 'Llamar al banco', message: 'Re-intenta o llama al autorizador del banco.', isCancellable: true },
  'HP-KP0': { title: 'Llamar al banco', message: 'Re-intenta o llama al autorizador del banco.', isCancellable: true },
  'HP-P3': { title: 'Llamar al banco', message: 'Re-intenta o llama al autorizador del banco.', isCancellable: true },
  'HP-KP3': { title: 'Llamar al banco', message: 'Re-intenta o llama al autorizador del banco.', isCancellable: true },
  'HP-S4': { title: 'Llamar al banco', message: 'Re-intenta o llama al autorizador del banco.', isCancellable: true },
  'HP-KS4': { title: 'Llamar al banco', message: 'Re-intenta o llama al autorizador del banco.', isCancellable: true },
  'HP-T4': { title: 'Llamar al banco', message: 'Re-intenta o llama al autorizador del banco.', isCancellable: true },
  'HP-KT4': { title: 'Llamar al banco', message: 'Re-intenta o llama al autorizador del banco.', isCancellable: true },
  
  // Re-intentar
  'HP-X1': { title: 'Re-intentar', message: 'Re-intenta nuevamente la transacción.', isCancellable: true },
  'HP-KX1': { title: 'Re-intentar', message: 'Re-intenta nuevamente la transacción.', isCancellable: true },
  
  // Sistema de pagos
  'HP-255': { title: 'Sistema apagado', message: 'Sistema de pagos apagado. Reinicia la app Tuu.', isCancellable: true },
  
  // Errores de red
  'HP-NETWORK ERROR': { title: 'Error de red', message: 'Error en la red. Verifica tu conexión a internet.', isCancellable: true },
  
  // Errores HTTP/Sistema
  'HP-200': { title: 'Error del sistema', message: 'Error procesando la transacción. Contacta a soporte.', isCancellable: true },
  'HP-401': { title: 'No autorizado', message: 'Error de autenticación. Reinicia la app Tuu.', isCancellable: true },
  'HP-403': { title: 'Prohibido', message: 'Error de autorización. Contacta a soporte Tuu.', isCancellable: true },
  'HP-500': { title: 'Error del servidor', message: 'Error en el servidor de pagos. Re-intenta más tarde.', isCancellable: true },
  'HP-PIN': { title: 'Error en el kernel', message: 'Error en el sistema de pagos. Reinicia la app Tuu.', isCancellable: true },
  
  // Errores genéricos procesamiento (HP-10 hasta HP-98 no mapeados específicamente)
  'HP-10': { title: 'Error de procesamiento', message: 'Error procesando la transacción. Intenta nuevamente.', isCancellable: true },
  'HP-K10': { title: 'Error de procesamiento', message: 'Error procesando la transacción. Intenta nuevamente.', isCancellable: true },
  'HP-12': { title: 'Error de procesamiento', message: 'Error procesando la transacción. Intenta nuevamente.', isCancellable: true },
  'HP-K12': { title: 'Error de procesamiento', message: 'Error procesando la transacción. Intenta nuevamente.', isCancellable: true },
  'HP-13': { title: 'Error de procesamiento', message: 'Error procesando la transacción. Intenta nuevamente.', isCancellable: true },
  'HP-K13': { title: 'Error de procesamiento', message: 'Error procesando la transacción. Intenta nuevamente.', isCancellable: true },
};

/**
 * Parsea el código de error ICE/HP del mensaje de error de Tuu
 */
export function parseTuuError(error: any): { title: string; message: string; isCancellable: boolean } {
  const defaultError = { title: 'Error de pago', message: 'No se pudo procesar el pago. Por favor, intenta nuevamente.', isCancellable: true };
  
  if (!error) return defaultError;

  console.log('[parseTuuError] Error completo recibido:', JSON.stringify(error, null, 2));

  // 1. Si el error.message es un JSON string, parsearlo
  let errorObj = error;
  if (typeof error.message === 'string' && error.message.trim().startsWith('{')) {
    try {
      errorObj = JSON.parse(error.message);
      console.log('[parseTuuError] JSON parseado desde error.message:', errorObj);
    } catch (e) {
      console.warn('[parseTuuError] No se pudo parsear error.message como JSON');
    }
  }

  const tuuDetailMessage =
    errorObj.errorMessageOnApp ||
    errorObj.errorMessage ||
    error?.errorMessageOnApp ||
    error?.errorMessage;

  // 2. PRIORIDAD: Buscar código directo en errorCodeOnApp (formato TUU)
  let foundCode: string | null = null;
  if (errorObj.errorCodeOnApp) {
    foundCode = String(errorObj.errorCodeOnApp).toUpperCase();
    console.log('[parseTuuError] Código encontrado en errorCodeOnApp:', foundCode);
  }
  // errorCode numérico (ICE-9) o string (HP-35)
  else if (errorObj.errorCode != null && errorObj.errorCode !== '') {
    const errorCodeNum = Number(errorObj.errorCode);
    if (!isNaN(errorCodeNum)) {
      foundCode = `ICE-${errorCodeNum}`;
      console.log('[parseTuuError] Código numérico convertido a:', foundCode);
    } else {
      foundCode = String(errorObj.errorCode).toUpperCase();
      console.log('[parseTuuError] Código encontrado en errorCode:', foundCode);
    }
  } else if (error?.errorCodeOnApp) {
    foundCode = String(error.errorCodeOnApp).toUpperCase();
    console.log('[parseTuuError] Código encontrado en error.errorCodeOnApp:', foundCode);
  } else if (error?.errorCode != null && error?.errorCode !== '') {
    const errorCodeNum = Number(error.errorCode);
    if (!isNaN(errorCodeNum)) {
      foundCode = `ICE-${errorCodeNum}`;
      console.log('[parseTuuError] Código numérico (directo) convertido a:', foundCode);
    } else {
      foundCode = String(error.errorCode).toUpperCase();
      console.log('[parseTuuError] Código encontrado en error.errorCode:', foundCode);
    }
  }

  // Códigos HP incompletos (ej. "HP-") — usar mensaje real de TUU
  if (foundCode === 'HP-' || foundCode === 'HP') {
    foundCode = null;
  }

  const lookupCode = (code: string) => {
    const mapped = TUU_ERROR_MESSAGES[code];
    if (mapped) return mapped;
    if (code.startsWith('HP-')) {
      return TUU_ERROR_MESSAGES[code.replace(/^HP-/, 'ICE-')];
    }
    return undefined;
  };

  if (foundCode) {
    const mapped = lookupCode(foundCode);
    if (mapped) {
      console.log('[parseTuuError] Mensaje mapeado para código:', foundCode, mapped);
      const message = tuuDetailMessage && typeof tuuDetailMessage === 'string'
        ? tuuDetailMessage
        : mapped.message;
      return { title: mapped.title, message, isCancellable: mapped.isCancellable ?? true };
    }
    
    // Si no encontró mapeo directo, intentar con diferentes formatos
    let alternativeCode = null;
    if (foundCode.match(/^\d+$/)) {
      // Si es un número, convertir a ICE-XX
      alternativeCode = `ICE-${foundCode}`;
    } else if (foundCode.startsWith('ICE-')) {
      // Si ya es ICE-XX, probar solo el número
      alternativeCode = foundCode.replace('ICE-', '');
    }
    
    if (alternativeCode) {
      const alternativeMapping = TUU_ERROR_MESSAGES[alternativeCode];
      if (alternativeMapping) {
        console.log('[parseTuuError] Mensaje encontrado con formato alternativo:', alternativeCode, alternativeMapping);
        return { ...alternativeMapping, isCancellable: alternativeMapping.isCancellable || false };
      }
    }
    
    // Si aún no encuentra mapeo específico, categorizar el error
    if (foundCode === 'ICE-10' || foundCode === '10') {
      return { 
        title: 'Transacción cancelada', 
        message: 'El pago fue cancelado.', 
        isCancellable: true 
      };
    }
    
    // Para códigos ICE sin mapear
    if (foundCode.startsWith('ICE-') || foundCode.match(/^\d+$/)) {
      const message = tuuDetailMessage && typeof tuuDetailMessage === 'string'
        ? tuuDetailMessage
        : `Error en el procesamiento (${foundCode}). Por favor, intenta nuevamente.`;
      return { title: 'Error de pago', message, isCancellable: true };
    }

    // Códigos HP sin mapeo — mensaje de TUU, no "prueba otra tarjeta" genérico
    if (foundCode.startsWith('HP-')) {
      const message = tuuDetailMessage && typeof tuuDetailMessage === 'string'
        ? tuuDetailMessage
        : `Error en el procesamiento (${foundCode}). Por favor, intenta nuevamente.`;
      return { title: 'Error de pago', message, isCancellable: true };
    }
  }

  if (tuuDetailMessage && typeof tuuDetailMessage === 'string') {
    return { title: 'Error de pago', message: tuuDetailMessage, isCancellable: true };
  }

  // 3. Buscar en múltiples fuentes de mensaje
  const searchStrings = [
    errorObj.message,
    errorObj.errorMessage,
    errorObj.errorMessageOnApp,
    error?.message,
    error?.errorMessage,
    error?.errorMessageOnApp,
    String(errorObj),
    String(error)
  ].filter(Boolean);
  
  console.log('[parseTuuError] Buscando códigos en mensajes:', searchStrings);
  
  for (const errorString of searchStrings) {
    // Buscar código ICE (ej: ICE-10, ICE-32)
    const iceMatch = errorString.match(/ICE-\d+/);
    if (iceMatch) {
      const iceCode = iceMatch[0];
      console.log('[parseTuuError] Código ICE encontrado:', iceCode);
      const mapped = TUU_ERROR_MESSAGES[iceCode];
      if (mapped) {
        return { ...mapped, isCancellable: mapped.isCancellable || false };
      }
    }

    // Buscar código HP (ej: HP-K05, HP-05, HP-K51)
    const hpMatch = errorString.match(/HP-K?\w+/i);
    if (hpMatch) {
      const hpCode = hpMatch[0].toUpperCase();
      console.log('[parseTuuError] Código HP encontrado:', hpCode);
      const mapped = TUU_ERROR_MESSAGES[hpCode];
      if (mapped) {
        return { ...mapped, isCancellable: mapped.isCancellable || false };
      }
      // Si no está mapeado específicamente, es un error del banco
      return { 
        title: 'Transacción rechazada', 
        message: `La transacción fue rechazada por el banco (${hpCode}). Por favor, intenta con otra tarjeta.`, 
        isCancellable: true 
      };
    }
  }

  // 4. Verificar errores comunes sin código ICE/HP
  const allMessages = searchStrings.join(' ').toLowerCase();
  if (allMessages.includes('timeout')) {
    return { title: 'Tiempo agotado', message: 'La transacción tardó demasiado. Verifica si el pago se procesó.', isCancellable: false };
  }
  
  if (allMessages.includes('cancelada') || allMessages.includes('cancelled') || allMessages.includes('canceled')) {
    return { title: 'Transacción cancelada', message: 'El pago fue cancelado.', isCancellable: true };
  }
  
  if (allMessages.includes('rechazada') || allMessages.includes('rejected')) {
    return { title: 'Transacción rechazada', message: 'El pago fue rechazado por el banco.', isCancellable: true };
  }

  // Si hay userInfo con errorMessage, usarlo
  if (error.userInfo?.errorMessage) {
    return { title: 'Error de pago', message: error.userInfo.errorMessage, isCancellable: false };
  }

  // Usar el primer mensaje disponible como respaldo
  const firstMessage = searchStrings[0] || defaultError.message;
  console.log('[parseTuuError] No se encontró código específico, usando mensaje:', firstMessage);
  return { ...defaultError, message: firstMessage };
}

/**
 * Categorías de errores TUU para el backend
 */
export type TuuErrorCategory = 
  | 'CANCELADO_USUARIO'     // Usuario canceló la transacción
  | 'RECHAZADO_BANCO'       // Banco rechazó (saldo, límite, tarjeta bloqueada)
  | 'ERROR_TARJETA'         // Problema con la tarjeta (vencida, incorrecta)
  | 'ERROR_DISPOSITIVO'     // Problema del dispositivo TUU
  | 'ERROR_RED'             // Sin conexión, timeout
  | 'ERROR_CONFIGURACION'   // SDK, credenciales, permisos
  | 'ERROR_DESCONOCIDO';    // Error no clasificado

export interface TuuErrorDetails {
  category: TuuErrorCategory;
  code: string;
  title: string;
  message: string;
  isRetryable: boolean;
}

/**
 * Clasifica el error de TUU para registro en backend
 */
export function classifyTuuError(error: any): TuuErrorDetails {
  // Usar parseTuuError para obtener los mensajes correctos
  const parsed = parseTuuError(error);
  
  // Múltiples fuentes donde puede estar el código de error
  let code = 'UNKNOWN';
  
  // 1. PRIORIDAD: errorCodeOnApp (formato nativo de TUU)
  if (error?.errorCodeOnApp) {
    code = String(error.errorCodeOnApp).toUpperCase();
  }
  // 2. errorCode directo - convertir números a formato ICE-XX
  else if (error?.errorCode) {
    const errorCodeNum = Number(error.errorCode);
    if (!isNaN(errorCodeNum)) {
      code = `ICE-${errorCodeNum}`;
    } else {
      code = String(error.errorCode).toUpperCase();
    }
  }
  // 3. Si error.message es un JSON string, parsearlo y buscar códigos
  else if (typeof error?.message === 'string' && error.message.trim().startsWith('{')) {
    try {
      const errorObj = JSON.parse(error.message);
      if (errorObj.errorCodeOnApp) {
        code = String(errorObj.errorCodeOnApp).toUpperCase();
      } else if (errorObj.errorCode) {
        const errorCodeNum = Number(errorObj.errorCode);
        if (!isNaN(errorCodeNum)) {
          code = `ICE-${errorCodeNum}`;
        } else {
          code = String(errorObj.errorCode).toUpperCase();
        }
      }
    } catch (e) {
      // Si falla el parsing, continuar con busqueda en string
    }
  }
  
  // 4. Buscar patrones ICE/HP en todos los mensajes posibles
  if (code === 'UNKNOWN') {
    const searchStrings = [
      error?.message,
      error?.errorMessage,
      error?.errorMessageOnApp,
      String(error)
    ].filter(Boolean);
    
    for (const str of searchStrings) {
      const iceMatch = str.match(/ICE-\d+/);
      const hpMatch = str.match(/HP-K?\w+/i);
      
      if (iceMatch) {
        code = iceMatch[0].toUpperCase();
        break;
      } else if (hpMatch) {
        code = hpMatch[0].toUpperCase();
        break;
      }
    }
  }
  
  console.log('[classifyTuuError] Código extraído:', code, 'Mensaje de parseTuuError:', {
    title: parsed.title,
    message: parsed.message
  });

  // Crear string combinado para búsquedas de texto
  const allMessages = [
    error?.message,
    error?.errorMessage,
    error?.errorMessageOnApp,
    parsed.message,
    String(error)
  ].filter(Boolean).join(' ').toLowerCase();

  // Clasificar por código
  let category: TuuErrorCategory = 'ERROR_DESCONOCIDO';
  let isRetryable = true;

  // Cancelado por usuario
  if (code === 'ICE-10' || allMessages.includes('cancelada') || allMessages.includes('cancelled')) {
    category = 'CANCELADO_USUARIO';
    isRetryable = true;
  }
  // Errores de red/conexión
  else if (code === 'ICE-14' || code.includes('HP-68') || allMessages.includes('timeout')) {
    category = 'ERROR_RED';
    isRetryable = true;
  }
  // Errores de dispositivo TUU
  else if (['ICE-30', 'ICE-31', 'ICE-32', 'ICE-33', 'ICE-34', 'ICE-35', 'ICE-37', 'ICE-43', 'ICE-50'].includes(code)) {
    category = 'ERROR_DISPOSITIVO';
    isRetryable = false;
  }
  // Errores de configuración/SDK
  else if (['ICE-8', 'ICE-12', 'ICE-20', 'ICE-21', 'ICE-23', 'ICE-25', 'ICE-44', 'ICE-45', 'ICE-46', 'ICE-47', 'ICE-48', 'ICE-49', 'ICE-60', 'ICE-61', 'HP-255'].includes(code)) {
    category = 'ERROR_CONFIGURACION';
    isRetryable = false;
  }
  // Errores de tarjeta (vencida, incorrecta, bloqueada)
  else if (code.match(/HP-K?(54|62|75|87|T8|W9|78)/)) {
    category = 'ERROR_TARJETA';
    isRetryable = false;
  }
  // Rechazos del banco (saldo, límite, clave, servicio no habilitado)
  else if (code.startsWith('HP-')) {
    category = 'RECHAZADO_BANCO';
    isRetryable = true;
  }

  // IMPORTANTE: Usar siempre los mensajes de parseTuuError para consistencia
  return {
    category,
    code,
    title: parsed.title,      // ✅ Usar el title procesado por parseTuuError
    message: parsed.message,  // ✅ Usar el message procesado por parseTuuError  
    isRetryable,
  };
}

/**
 * Servicio para integración con Tuu Pagos
 */
class TuuPaymentService {
  private isDev: boolean = IS_TUU_DEV;

  async isTuuAppInstalled(): Promise<boolean> {
    try {
      return await TuuPaymentModule.isTuuAppInstalled(this.isDev);
    } catch (error) {
      console.error('[TuuPayment] Error verificando instalación:', error);
      return false;
    }
  }

  async startPayment(paymentData: TuuPaymentRequest): Promise<TuuPaymentResponse> {
    try {
      if (__DEV__) console.log('[TuuPayment] Iniciando pago:', paymentData);
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Timeout: La transacción tardó más de 2 minutos.'));
        }, 120000);
      });

      const result = await Promise.race([
        TuuPaymentModule.startPayment(paymentData, this.isDev),
        timeoutPromise
      ]);
      
      if (__DEV__) {
        console.log('[TuuPayment] Resultado:', JSON.stringify(result, null, 2));
      }
      
      if (!result.transactionStatus) {
        const errPayload =
          typeof result === 'object' && result !== null
            ? JSON.stringify(result)
            : 'Transacción rechazada por el banco';
        throw new Error(errPayload);
      }
      
      return result as TuuPaymentResponse;
    } catch (error: any) {
      if (__DEV__) {
        console.error('[TuuPayment] Error:', error?.message || error);
      }
      throw error;
    }
  }

  setDevMode(isDev: boolean) {
    this.isDev = isDev;
  }
}

export const tuuPaymentService = new TuuPaymentService();
