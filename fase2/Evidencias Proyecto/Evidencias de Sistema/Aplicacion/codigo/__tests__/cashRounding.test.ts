import {
  applyCashRoundingToItems,
  getCashRoundingAdjustment,
  roundCashAmount,
} from '../src/utils/cashRounding';
import { calculateTotalsByDocType } from '../src/services/api';

const item = (value: number, count = 1) => ({ name: 'Varios', value, count, total: value * count });
const sum = (items: { total: number }[]) => items.reduce((s, i) => s + i.total, 0);

describe('roundCashAmount (Ley 20.956, art. 13)', () => {
  it('no cambia montos que terminan en 0', () => {
    expect(roundCashAmount(1230)).toBe(1230);
    expect(roundCashAmount(10)).toBe(10);
  });

  it('unidad 1 a 5 baja a la decena inferior', () => {
    expect(roundCashAmount(1231)).toBe(1230);
    expect(roundCashAmount(1234)).toBe(1230);
    expect(roundCashAmount(1235)).toBe(1230);
  });

  it('unidad 6 a 9 sube a la decena superior', () => {
    expect(roundCashAmount(1236)).toBe(1240);
    expect(roundCashAmount(1239)).toBe(1240);
    expect(roundCashAmount(9996)).toBe(10000);
  });

  it('montos menores a 10', () => {
    expect(roundCashAmount(5)).toBe(0);
    expect(roundCashAmount(6)).toBe(10);
  });

  it('montos no positivos devuelven 0', () => {
    expect(roundCashAmount(0)).toBe(0);
    expect(roundCashAmount(-15)).toBe(0);
  });

  it('se aplica al monto final con propina, no por separado', () => {
    // total 1.234 + propina 123 = 1.357 -> 1.360
    expect(roundCashAmount(1234 + 123)).toBe(1360);
  });
});

describe('getCashRoundingAdjustment', () => {
  it('es negativo al rebajar y positivo al elevar', () => {
    expect(getCashRoundingAdjustment(1235)).toBe(-5);
    expect(getCashRoundingAdjustment(1236)).toBe(4);
    expect(getCashRoundingAdjustment(1230)).toBe(0);
  });
});

describe('applyCashRoundingToItems (DTE por el total en efectivo)', () => {
  it('sin ajuste devuelve las mismas líneas', () => {
    const items = [item(3230)];
    expect(applyCashRoundingToItems(items)).toBe(items);
  });

  it('baja la última línea: $3.234 -> $3.230', () => {
    const result = applyCashRoundingToItems([item(1000), item(2234)]);
    expect(result).toEqual([item(1000), item(2230)]);
    expect(sum(result)).toBe(3230);
  });

  it('sube la última línea: $3.259 -> $3.260', () => {
    const result = applyCashRoundingToItems([item(3259)]);
    expect(sum(result)).toBe(3260);
  });

  it('separa una unidad si la línea tiene cantidad mayor a 1', () => {
    // 3 x $1.078 = $3.234 -> 2 x $1.078 + 1 x $1.074 = $3.230
    const result = applyCashRoundingToItems([item(1078, 3)]);
    expect(result).toEqual([item(1078, 2), item(1074, 1)]);
    result.forEach(line => expect(line.total).toBe(line.value * line.count));
    expect(sum(result)).toBe(3230);
  });

  it('con propina redondea total + propina y la propina queda exacta', () => {
    // venta $3.234 + propina $323 = $3.557 -> cobro $3.560; DTE = 3.560 - 323 = $3.237
    const tip = 323;
    const result = applyCashRoundingToItems([item(3234)], tip);
    expect(sum(result)).toBe(3237);
    expect(sum(result) + tip).toBe(3560);
  });

  it('con propina que ya cuadra no ajusta', () => {
    // $3.234 + $6 = $3.240
    const items = [item(3234)];
    expect(applyCashRoundingToItems(items, 6)).toBe(items);
  });

  it('usa la línea de mayor precio si la última quedaría en $0 o menos', () => {
    // $1.000 + $3 = $1.003 -> $1.000; la línea de $3 quedaría en $0
    const result = applyCashRoundingToItems([item(1000), item(3)]);
    expect(result).toEqual([item(997), item(3)]);
  });

  it('no deja la venta en $0 cuando el monto es menor o igual a $5', () => {
    const items = [item(5)];
    expect(applyCashRoundingToItems(items)).toBe(items);
  });

  it('no muta las líneas originales', () => {
    const items = [item(3234)];
    applyCashRoundingToItems(items);
    expect(items).toEqual([item(3234)]);
  });

  it.each([39, 33])('neto + IVA cuadran con el total redondeado (tipo %i)', docType => {
    const [neto, exento, iva, total] = calculateTotalsByDocType(
      applyCashRoundingToItems([item(3234)]),
      docType,
    );
    expect(total).toBe(3230);
    expect(neto + exento + iva).toBe(3230);
  });

  it('boleta exenta (41): el total redondeado queda como exento', () => {
    const [neto, exento, iva, total] = calculateTotalsByDocType(
      applyCashRoundingToItems([item(3259)]),
      41,
    );
    expect([neto, exento, iva, total]).toEqual([0, 3260, 0, 3260]);
  });
});
