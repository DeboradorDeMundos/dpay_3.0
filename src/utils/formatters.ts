/**
 * Funciones de formateo para la aplicación
 */

/**
 * Formatea un número como moneda chilena (CLP)
 * Ejemplo: 1234567 => "1.234.567"
 * 
 * @param value - Valor numérico
 * @returns String formateado con separador de miles
 */
export const formatCurrency = (value: number | string): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '0';
  }
  
  return numValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

/**
 * Remueve acentos de un string
 * Útil para búsquedas y comparaciones
 * 
 * @param value - String con acentos
 * @returns String sin acentos
 */
export const removeAccents = (value: string): string => {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

/**
 * Formatea un RUT chileno
 * Ejemplo: "123456789" => "12.345.678-9"
 * 
 * @param rut - RUT sin formato o con formato
 * @returns RUT formateado
 */
export const formatRUT = (rut: string): string => {
  // Eliminar puntos y guiones
  const cleanRUT = rut.replace(/\./g, '').replace(/-/g, '');
  
  if (cleanRUT.length < 2) {
    return cleanRUT;
  }
  
  // Separar dígito verificador
  const dv = cleanRUT.slice(-1);
  const number = cleanRUT.slice(0, -1);
  
  // Agregar puntos cada 3 dígitos
  const formattedNumber = number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  return `${formattedNumber}-${dv}`;
};

/**
 * Valida un RUT chileno
 * 
 * @param rut - RUT a validar
 * @returns true si el RUT es válido
 */
export const validateRUT = (rut: string): boolean => {
  // Limpiar RUT
  const cleanRUT = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
  
  if (cleanRUT.length < 2) {
    return false;
  }
  
  const dv = cleanRUT.slice(-1);
  const number = cleanRUT.slice(0, -1);
  
  // Calcular dígito verificador
  let sum = 0;
  let multiplier = 2;
  
  for (let i = number.length - 1; i >= 0; i--) {
    sum += parseInt(number[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const expectedDV = 11 - (sum % 11);
  let calculatedDV: string;
  
  if (expectedDV === 11) {
    calculatedDV = '0';
  } else if (expectedDV === 10) {
    calculatedDV = 'K';
  } else {
    calculatedDV = expectedDV.toString();
  }
  
  return dv === calculatedDV;
};

/**
 * Formatea una fecha a formato chileno
 * Ejemplo: "2024-01-15" => "15/01/2024"
 * 
 * @param date - Fecha en formato ISO o Date
 * @returns Fecha formateada DD/MM/YYYY
 */
export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear();
  
  return `${day}/${month}/${year}`;
};

/**
 * Formatea una fecha y hora
 * Ejemplo: "2024-01-15T10:30:00" => "15/01/2024 10:30"
 * 
 * @param date - Fecha en formato ISO o Date
 * @returns Fecha y hora formateadas
 */
export const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear();
  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

/**
 * Obtiene una fecha sin zona horaria (UTC)
 * 
 * @param date - Fecha
 * @returns Fecha ajustada a UTC
 */
export const getDateWithoutTZ = (date: Date = new Date()): Date => {
  const newDate = new Date(date);
  newDate.setTime(newDate.getTime() - newDate.getTimezoneOffset() * 60 * 1000);
  return newDate;
};

/**
 * Resta meses a una fecha
 * 
 * @param numOfMonths - Número de meses a restar
 * @param date - Fecha base (default: hoy)
 * @returns Nueva fecha
 */
export const subtractMonths = (numOfMonths: number, date: Date = new Date()): Date => {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() - numOfMonths);
  return newDate;
};

/**
 * Convierte un valor binario MD5 a hexadecimal
 * 
 * @param md5Value - Valor MD5 binario
 * @returns Valor hexadecimal
 */
export const bin2hex = (md5Value: string): string => {
  let hex = '';
  
  for (let i = 0; i < md5Value.length; i++) {
    const chr = md5Value.charCodeAt(i).toString(16);
    hex += chr.length < 2 ? '0' + chr : chr;
  }
  
  return hex;
};

/**
 * Formatea un número de teléfono chileno
 * Ejemplo: "912345678" => "+56 9 1234 5678"
 * 
 * @param phone - Número de teléfono
 * @returns Teléfono formateado
 */
export const formatPhone = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length === 9 && cleanPhone.startsWith('9')) {
    return `+56 9 ${cleanPhone.slice(1, 5)} ${cleanPhone.slice(5)}`;
  }
  
  if (cleanPhone.length === 8) {
    return `+56 ${cleanPhone.slice(0, 4)} ${cleanPhone.slice(4)}`;
  }
  
  return phone;
};

/**
 * Capitaliza la primera letra de cada palabra
 * 
 * @param text - Texto a capitalizar
 * @returns Texto capitalizado
 */
export const capitalize = (text: string): string => {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Trunca un texto a un largo máximo
 * 
 * @param text - Texto a truncar
 * @param maxLength - Largo máximo
 * @returns Texto truncado con "..."
 */
export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.slice(0, maxLength - 3) + '...';
};
