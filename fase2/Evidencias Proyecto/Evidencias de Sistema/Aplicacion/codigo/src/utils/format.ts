export const formatCurrency = (value: number): string => {
  // Formato manual para evitar dependencia de Intl (no disponible en RN por defecto)
  if (isNaN(value)) return '$0';
  const num = Math.floor(value);
  return '$' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

/**
 * Prepara texto para impresión térmica.
 * Mantiene tildes y ñ (soportados por ISO8859-1/Latin-1).
 * Solo remueve caracteres que no están en el charset de la impresora.
 */
export const prepareForPrint = (str: string): string => {
  if (!str) return '';
  
  // Mantener caracteres ISO8859-1 (Latin-1) que incluyen:
  // á, é, í, ó, ú, Á, É, Í, Ó, Ú, ñ, Ñ, ü, Ü, ¿, ¡, etc.
  // Solo remover caracteres que no están en Latin-1
  return str
    .replace(/[^\x00-\xFF]/g, '') // Remover caracteres fuera de Latin-1
    .trim();
};

/**
 * @deprecated Usar prepareForPrint() en su lugar para mantener tildes
 */
export const removeAccents = (str: string): string => {
  // Ahora solo llama a prepareForPrint para mantener tildes
  return prepareForPrint(str);
};

export const formatDate = (date: string | Date, format: string = 'DD-MM-YYYY'): string => {
  // Siempre usar el objeto Date con métodos locales para que
  // los timestamps UTC (ej: new Date().toISOString()) se conviertan
  // correctamente a la zona horaria del dispositivo (Chile UTC-4).
  const d = typeof date === 'string' ? new Date(date) : date;

  const day    = String(d.getDate()).padStart(2, '0');
  const month  = String(d.getMonth() + 1).padStart(2, '0');
  const year   = d.getFullYear();
  const hour   = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');

  if (format === 'HH:mm')            return `${hour}:${minute}`;
  if (format === 'DD-MM-YYYY')       return `${day}-${month}-${year}`;
  if (format === 'DD/MM/YYYY')       return `${day}/${month}/${year}`;
  if (format === 'DD/MM/YYYY HH:mm') return `${day}/${month}/${year} ${hour}:${minute}`;
  if (format === 'YYYY-MM-DD')       return `${year}-${month}-${day}`;
  return `${day}-${month}-${year}`;
};
