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
 *
 * Decisión de producto (29-10-2026): en efectivo, la boleta o factura y tbl_dpay
 * se emiten por el total ya redondeado. El ajuste se aplica a una línea de
 * producto (applyCashRoundingToItems) porque el SII exige que el total del DTE
 * cuadre con la suma de las líneas; neto e IVA se recalculan desde ahí.
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

/** Campos mínimos de una línea de venta que necesita el ajuste. */
export interface RoundableItem {
  value: number;
  count: number;
  total: number;
}

/**
 * Ajusta las líneas de la venta para que el pago en efectivo quede redondeado.
 *
 * El monto final (total de líneas + propina) se redondea a la decena y la
 * diferencia se suma o resta a la última línea, así el DTE cuadra con lo
 * cobrado. La propina no forma parte del DTE, por lo que la suma de líneas
 * resultante es: redondeo(total + propina) - propina.
 *
 * Si la línea elegida tiene cantidad mayor a 1, se separa una unidad con el
 * precio ajustado, porque el SII exige MontoItem = cantidad x precio.
 * Si el ajuste dejaría un precio <= 0, se usa la línea de mayor precio.
 *
 * @param items - Líneas de la venta con el precio exacto (no se mutan).
 * @param tip - Propina en pesos; 0 si no hay.
 * @returns Nuevas líneas con el ajuste aplicado, o las mismas si no hay ajuste.
 *
 * @example
 * // Venta $3.234 sin propina -> la línea queda en $3.230
 * applyCashRoundingToItems([{ value: 3234, count: 1, total: 3234 }]);
 */
export const applyCashRoundingToItems = <T extends RoundableItem>(
  items: T[],
  tip: number = 0,
): T[] => {
  if (items.length === 0) return items;

  const itemsTotal = items.reduce((sum, item) => sum + item.total, 0);
  const finalAmount = Math.round(itemsTotal + Math.max(0, tip));
  const adjustment = roundCashAmount(finalAmount) - finalAmount;
  if (adjustment === 0) return items;

  let index = items.length - 1;
  if (items[index].value + adjustment <= 0) {
    index = items.reduce((best, item, i) => (item.value > items[best].value ? i : best), 0);
  }

  const target = items[index];
  const adjustedValue = target.value + adjustment;
  if (adjustedValue <= 0) return items;

  const adjustedLine: T = { ...target, count: 1, value: adjustedValue, total: adjustedValue };
  if (target.count <= 1) {
    return items.map((item, i) => (i === index ? adjustedLine : item));
  }

  const remainingLine: T = {
    ...target,
    count: target.count - 1,
    total: target.total - target.value,
  };
  return [...items.slice(0, index), remainingLine, adjustedLine, ...items.slice(index + 1)];
};
