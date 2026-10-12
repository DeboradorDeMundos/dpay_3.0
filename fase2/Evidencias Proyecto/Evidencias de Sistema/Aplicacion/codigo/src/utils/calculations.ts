/**
 * Funciones de cálculo para documentos tributarios
 * Basado en el sistema de facturación electrónica chilena
 */

import { DocumentType, SaleDocument } from '../types';

/**
 * Calcula los totales (neto, exento, IVA, total) según el tipo de documento
 * 
 * @param sale - Información de la venta
 * @returns [neto, exento, iva, total]
 */
export const getTotals = (sale: SaleDocument): [number, number, number, number] => {
  // Calcular el total de los items
  const subtotal = Math.round(
    sale.sale.results.reduce((sum, item) => sum + item.total, 0)
  );

  let neto = 0;
  let exento = 0;
  let iva = 0;
  let total = subtotal;

  switch (sale.documentType.id) {
    case DocumentType.FACTURA_AFECTA: // 33 - Factura Afecta
      // Neto = Total sin IVA
      // IVA = 19% del neto
      // Total = Neto + IVA
      neto = Math.round(subtotal);
      iva = Math.round(neto * 0.19);
      exento = 0;
      total = Math.round(neto + iva);
      break;

    case DocumentType.FACTURA_EXENTA: // 34 - Factura Exenta
      // Todo es exento, no hay IVA
      exento = Math.round(subtotal);
      neto = 0;
      iva = 0;
      total = exento;
      break;

    case DocumentType.BOLETA_AFECTA: // 39 - Boleta Afecta
      // Total incluye IVA
      // IVA = 19/119 del total
      // Neto = Total - IVA
      total = Math.round(subtotal);
      iva = Math.round(total * (19 / 119));
      neto = Math.round(total - iva);
      exento = 0;
      break;

    case DocumentType.BOLETA_EXENTA: // 41 - Boleta Exenta
      // Todo es exento, no hay IVA
      exento = Math.round(subtotal);
      neto = 0;
      iva = 0;
      total = exento;
      break;

    default:
      // Por defecto, tratarlo como exento
      exento = Math.round(subtotal);
      neto = 0;
      iva = 0;
      total = exento;
  }

  return [neto, exento, iva, total];
};

/**
 * Calcula el total de un item (cantidad * precio)
 * 
 * @param quantity - Cantidad
 * @param price - Precio unitario
 * @returns Total redondeado
 */
export const calculateItemTotal = (quantity: number, price: number): number => {
  return Math.round(quantity * price);
};

/**
 * Calcula el vuelto (cambio)
 * 
 * @param amountPaid - Monto pagado
 * @param total - Total a pagar
 * @returns Vuelto (0 si el monto pagado es menor al total)
 */
export const calculateChange = (amountPaid: number, total: number): number => {
  const change = amountPaid - total;
  return change > 0 ? Math.round(change) : 0;
};

/**
 * Calcula el IVA desde un monto que ya incluye IVA
 * Útil para boletas afectas (tipo 39)
 * 
 * @param totalWithIVA - Total que incluye IVA
 * @returns IVA calculado
 */
export const calculateIVAFromTotal = (totalWithIVA: number): number => {
  return Math.round(totalWithIVA * (19 / 119));
};

/**
 * Calcula el neto desde un monto que ya incluye IVA
 * 
 * @param totalWithIVA - Total que incluye IVA
 * @returns Neto (sin IVA)
 */
export const calculateNetoFromTotal = (totalWithIVA: number): number => {
  const iva = calculateIVAFromTotal(totalWithIVA);
  return Math.round(totalWithIVA - iva);
};

/**
 * Agrega IVA a un monto neto
 * Útil para facturas afectas (tipo 33)
 * 
 * @param neto - Monto neto (sin IVA)
 * @returns IVA calculado
 */
export const addIVAToNeto = (neto: number): number => {
  return Math.round(neto * 0.19);
};

/**
 * Calcula el total desde un monto neto
 * 
 * @param neto - Monto neto (sin IVA)
 * @returns Total (neto + IVA)
 */
export const calculateTotalFromNeto = (neto: number): number => {
  const iva = addIVAToNeto(neto);
  return Math.round(neto + iva);
};
