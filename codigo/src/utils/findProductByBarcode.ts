/** Normaliza código escaneado para comparación. */
export function normalizeScanCode(raw: string): string {
  return String(raw ?? '').trim();
}

/** Dígito verificador mod-10 (EAN-13 / UPC-A). */
function computeMod10CheckDigit(body: string): string {
  const digits = body.replace(/\D/g, '');
  if (!digits.length) return '';
  let sum = 0;
  const fromRight = digits.split('').reverse();
  for (let i = 0; i < fromRight.length; i++) {
    const n = parseInt(fromRight[i], 10);
    if (Number.isNaN(n)) continue;
    sum += n * (i % 2 === 0 ? 3 : 1);
  }
  return String((10 - (sum % 10)) % 10);
}

/**
 * Variantes de cod_producto impreso como barcode (EAN/UPC/Code128).
 * Cubre ceros iniciales, UPC↔EAN-13, dígito verificador y relleno numérico.
 */
export function expandScanVariants(raw: string): string[] {
  const trimmed = normalizeScanCode(raw);
  const digits = trimmed.replace(/\D/g, '');
  const variants = new Set<string>();

  const add = (v: string) => {
    const n = normalizeScanCode(v);
    if (n) variants.add(n);
  };

  if (trimmed) {
    add(trimmed);
    if (/[a-zA-Z]/.test(trimmed)) {
      add(trimmed.toUpperCase());
      add(trimmed.toLowerCase());
    }
  }

  if (!digits) {
    return Array.from(variants).filter(Boolean);
  }

  add(digits);
  const noLeading = digits.replace(/^0+/, '') || digits;
  add(noLeading);

  if (digits.length === 12) {
    add(`0${digits}`);
    const eanBody = `0${digits}`;
    add(`${eanBody}${computeMod10CheckDigit(eanBody)}`);
    add(`${digits}${computeMod10CheckDigit(digits)}`);
  }

  if (digits.length === 13) {
    add(digits.slice(0, 12));
    add(digits.slice(1));
    const body12 = digits.slice(0, 12);
    add(body12.replace(/^0+/, '') || body12);
    if (digits.startsWith('0')) {
      add(digits.slice(1, 13));
    }
  }

  if (noLeading.length === 12) {
    add(`0${noLeading}`);
    const eanBody = `0${noLeading}`;
    add(`${eanBody}${computeMod10CheckDigit(eanBody)}`);
  }

  if (digits.length === 8) {
    add(digits.slice(0, 7));
    add(digits.replace(/^0+/, '') || digits);
  }

  if (noLeading.length === 7) {
    add(`${noLeading}${computeMod10CheckDigit(noLeading)}`);
  }

  // cod_producto interno corto impreso como EAN (ej. 6–11 dígitos)
  if (noLeading.length >= 4 && noLeading.length <= 11) {
    add(noLeading.padStart(8, '0'));
    add(noLeading.padStart(12, '0'));
    add(noLeading.padStart(13, '0'));
    const p12 = noLeading.padStart(12, '0');
    add(p12);
    add(`${p12}${computeMod10CheckDigit(p12)}`);
    const eanBody = `0${p12}`;
    add(`${eanBody}${computeMod10CheckDigit(eanBody)}`);
  }

  if (digits.length === 12) {
    add(`0${digits}`);
  }
  if (digits.length === 13 && digits[0] === '0') {
    add(digits.slice(1));
  }
  if (noLeading.length === 12) {
    add(`0${noLeading}`);
  }

  return Array.from(variants).filter(Boolean);
}

/** True si dos lecturas representan el mismo código (incluye variantes EAN/UPC). */
export function scanCodesMatch(a: string, b: string): boolean {
  return codesMatch(a, b);
}

function codesMatch(scanned: string, stored: string): boolean {
  const scanSet = expandScanVariants(scanned);
  const storeSet = expandScanVariants(stored);
  if (scanSet.some((s) => storeSet.includes(s))) {
    return true;
  }
  const scanLower = new Set(scanSet.map((s) => s.toLowerCase()));
  return storeSet.some((s) => scanLower.has(s.toLowerCase()));
}

function productCodeFields(product: Record<string, unknown>): string[] {
  const fields = [
    product.codigo,
    product.code,
    product.cod_producto,
  ];

  return fields
    .filter((v) => v !== undefined && v !== null && v !== '')
    .map((v) => normalizeScanCode(String(v)));
}

/** Busca filas de catálogo (formato API español) que coincidan con el código escaneado. */
export function findProductsByScanCode(
  products: any[],
  scannedCode: string,
): any[] {
  const needle = normalizeScanCode(scannedCode);
  if (!needle) return [];

  return products.filter((product) =>
    productCodeFields(product).some((field) => codesMatch(needle, field)),
  );
}

/** Elige la fila más conveniente si hay varias bodegas (prioriza stock > 0). */
export function pickBestProductMatch(matches: any[]): any | null {
  if (!matches.length) return null;

  const withStock = matches.filter((p) => {
    const esInventariable = p.inventariable !== undefined
      ? (String(p.inventariable) === 'true' || String(p.inventariable) === '1' || p.inventariable === true)
      : true;
    if (!esInventariable) return true;
    const rawStock = p.cantidad !== undefined && p.cantidad !== null ? p.cantidad : p.stock;
    if (rawStock === undefined || rawStock === null || rawStock === '') return false;
    const parsed = typeof rawStock === 'string' ? parseFloat(rawStock) : rawStock;
    return Math.floor(parsed) > 0;
  });

  return withStock[0] ?? matches[0];
}

/** Busca en catálogo probando todas las variantes del código leído. */
export function findProductInCatalogue(products: any[], scannedCode: string): any | null {
  const variants = expandScanVariants(scannedCode);
  for (const variant of variants) {
    const matches = findProductsByScanCode(products, variant);
    const product = pickBestProductMatch(matches);
    if (product) return product;
  }
  return null;
}
