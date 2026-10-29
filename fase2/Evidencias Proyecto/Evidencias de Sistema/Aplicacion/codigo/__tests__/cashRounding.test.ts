import {
  getCashRoundingAdjustment,
  roundCashAmount,
} from '../src/utils/cashRounding';

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
