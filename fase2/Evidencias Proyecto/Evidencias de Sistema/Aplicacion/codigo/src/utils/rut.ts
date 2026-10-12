/**
 * Valida formato de RUT chileno
 */
export const validateRutFormat = (rut: string): boolean => {
  const rutClean = rut.replace(/[^0-9kK]/g, '');
  
  if (rutClean.length < 2) return false;
  
  const rutBody = rutClean.slice(0, -1);
  const rutDv = rutClean.slice(-1).toUpperCase();
  
  if (!/^\d+$/.test(rutBody)) return false;
  
  const calculatedDv = calculateRutDv(rutBody);
  
  return rutDv === calculatedDv;
};

/**
 * Calcula el dígito verificador de un RUT
 */
export const calculateRutDv = (rut: string): string => {
  let sum = 0;
  let multiplier = 2;
  
  for (let i = rut.length - 1; i >= 0; i--) {
    sum += parseInt(rut[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const remainder = sum % 11;
  const dv = 11 - remainder;
  
  if (dv === 11) return '0';
  if (dv === 10) return 'K';
  return dv.toString();
};

/**
 * Formatea un RUT con puntos y guión
 */
export const formatRut = (rut: string): string => {
  const rutClean = rut.replace(/[^0-9kK]/g, '');
  
  if (rutClean.length < 2) return rutClean;
  
  const rutBody = rutClean.slice(0, -1);
  const rutDv = rutClean.slice(-1).toUpperCase();
  
  // Agregar puntos cada 3 dígitos
  const formattedBody = rutBody.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  return `${formattedBody}-${rutDv}`;
};

/**
 * Limpia un RUT dejando solo números y K
 */
export const cleanRut = (rut: string): string => {
  return rut.replace(/[^0-9kK]/g, '').toUpperCase();
};
