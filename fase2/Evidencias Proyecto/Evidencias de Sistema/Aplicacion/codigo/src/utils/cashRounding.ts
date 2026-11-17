/**
 * Regla de redondeo para pagos en efectivo en Chile.
 *
 * Base legal:
 * - Ley N° 20.956, artículo 13 (Ley de Productividad, 2016).
 * - Decreto N° 1266 de 2017, Ministerio de Hacienda (reglamento de ejecución).
 *   https://www.bcn.cl/leychile/navegar?idNorma=1111243
 * - Banco Central: https://www.billetesymonedas.cl/Monedas/ReglaRedondeo
 *
 * Reglas que esta utilidad asume y que el código que la usa debe respetar:
 * - Solo aplica a pagos en dinero efectivo. Tarjetas de crédito, débito u otros
 *   medios quedan excluidos (Decreto 1266, art. 3).
 * - Se aplica sobre el monto final a pagar (Decreto 1266, art. 4); en D-PAY eso
 *   es el total de la venta más la propina, si la hay.
 * - No tiene efecto tributario: la boleta o factura (DTE) y lo que se registra
 *   en tbl_dpay se emiten por el monto exacto, sin redondear (art. 1 y 5).
 */

/**
 * Redondea un monto en pesos a la decena según la regla legal:
 * unidad 1 a 5 baja a la decena inferior; unidad 6 a 9 sube a la superior.
 *
 * @param amount - Monto final en pesos (entero, sin decimales).
 * @returns Monto a cobrar en efectivo.
 *
 * @example
 * roundCashAmount(1234) // 1230
 * roundCashAmount(1235) // 1230
 * roundCashAmount(1236) // 1240
 * roundCashAmount(1230) // 1230
 */
export const roundCashAmount = (amount: number): number => {
  const pesos = Math.round(amount);
  if (pesos <= 0) return 0;

  const unit = pesos % 10;
  return unit <= 5 ? pesos - unit : pesos + (10 - unit);
};

/**
 * Diferencia entre el monto a cobrar en efectivo y el monto exacto.
 * Negativo cuando se rebaja (unidad 1 a 5) y positivo cuando se eleva (6 a 9).
 *
 * @param amount - Monto final exacto en pesos.
 * @returns Ajuste en pesos, entre -5 y +4.
 */
export const getCashRoundingAdjustment = (amount: number): number => {
  return roundCashAmount(amount) - Math.round(amount);
};
