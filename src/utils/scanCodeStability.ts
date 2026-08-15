import { expandScanVariants, normalizeScanCode } from './findProductByBarcode';

/** Tipos soportados nativamente por VisionCamera en Android (ver CodeType.kt). */
export const RETAIL_CODE_TYPES = [
  'ean-13',
  'ean-8',
  'upc-a',
  'upc-e',
  'code-128',
  'code-39',
  'code-93',
  'codabar',
  'itf',
] as const;

export type RetailCodeType = (typeof RETAIL_CODE_TYPES)[number];

const RETAIL_TYPE_PRIORITY: Record<string, number> = Object.fromEntries(
  RETAIL_CODE_TYPES.map((t, i) => [t, i]),
);

const STABLE_CONSECUTIVE_READS = 1;
const DUPLICATE_COOLDOWN_MS = 900;
const MIN_CODE_LENGTH = 2;
const MAX_CODE_LENGTH = 48;

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

function isRepeatedDigitCode(digits: string): boolean {
  return digits.length >= 8 && /^(\d)\1+$/.test(digits);
}

function variantsOverlap(a: string, b: string): boolean {
  const setA = new Set(expandScanVariants(a));
  return expandScanVariants(b).some((v) => setA.has(v));
}

export function isPlausibleRetailBarcode(raw: string, _type?: string): boolean {
  const code = normalizeScanCode(raw);
  if (!code || code.length < MIN_CODE_LENGTH || code.length > MAX_CODE_LENGTH) {
    return false;
  }

  const digits = digitsOnly(code);
  if (digits.length >= 8 && isRepeatedDigitCode(digits)) {
    return false;
  }

  if (/^[\x00-\x1F]/.test(code)) {
    return false;
  }

  return true;
}

export interface ScannedCodeCandidate {
  type?: string;
  value?: string;
  frame?: { width: number; height: number };
}

function sortCandidates(valid: ScannedCodeCandidate[]): ScannedCodeCandidate[] {
  return [...valid].sort((a, b) => {
    const pa = RETAIL_TYPE_PRIORITY[a.type ?? ''] ?? 50;
    const pb = RETAIL_TYPE_PRIORITY[b.type ?? ''] ?? 50;
    if (pa !== pb) {
      return pa - pb;
    }
    const areaA = (a.frame?.width ?? 0) * (a.frame?.height ?? 0);
    const areaB = (b.frame?.width ?? 0) * (b.frame?.height ?? 0);
    return areaB - areaA;
  });
}

/** Todos los códigos legibles del frame, mejor candidato primero. */
export function extractAllScannedCodes(codes: ScannedCodeCandidate[]): string[] {
  const valid = codes.filter((c) => c.value?.trim());
  if (!valid.length) return [];

  const sorted = sortCandidates(valid);
  const results: string[] = [];
  const seen = new Set<string>();

  const tryAdd = (raw: string) => {
    const value = normalizeScanCode(raw);
    if (!value || seen.has(value)) return;
    if (value.length < MIN_CODE_LENGTH || value.length > MAX_CODE_LENGTH) return;
    seen.add(value);
    results.push(value);
  };

  for (const candidate of sorted) {
    if (isPlausibleRetailBarcode(candidate.value!, candidate.type)) {
      tryAdd(candidate.value!);
    }
  }

  for (const candidate of sorted) {
    const type = candidate.type ?? '';
    if (type === 'unknown' || !(type in RETAIL_TYPE_PRIORITY)) {
      tryAdd(candidate.value!);
    }
  }

  if (!results.length && sorted[0]?.value) {
    tryAdd(sorted[0].value);
  }

  return results;
}

export function pickBestScannedCode(codes: ScannedCodeCandidate[]): string | null {
  return extractAllScannedCodes(codes)[0] ?? null;
}

export class ScanStabilityGate {
  private consecutiveCode: string | null = null;
  private consecutiveCount = 0;
  private lastAcceptedCode: string | null = null;
  private lastAcceptedAt = 0;

  reset(): void {
    this.consecutiveCode = null;
    this.consecutiveCount = 0;
    this.lastAcceptedCode = null;
    this.lastAcceptedAt = 0;
  }

  observe(rawCode: string): string | null {
    const code = normalizeScanCode(rawCode);
    if (!code) {
      this.consecutiveCode = null;
      this.consecutiveCount = 0;
      return null;
    }

    const now = Date.now();
    if (
      this.lastAcceptedCode &&
      now - this.lastAcceptedAt < DUPLICATE_COOLDOWN_MS &&
      (this.lastAcceptedCode === code || variantsOverlap(this.lastAcceptedCode, code))
    ) {
      return null;
    }

    if (
      this.consecutiveCode === code ||
      (this.consecutiveCode !== null && variantsOverlap(this.consecutiveCode, code))
    ) {
      this.consecutiveCount += 1;
      this.consecutiveCode = code;
    } else {
      this.consecutiveCode = code;
      this.consecutiveCount = 1;
    }

    if (this.consecutiveCount >= STABLE_CONSECUTIVE_READS) {
      this.consecutiveCode = null;
      this.consecutiveCount = 0;
      this.lastAcceptedCode = code;
      this.lastAcceptedAt = now;
      return code;
    }

    return null;
  }
}

export const SCAN_SUCCESS_COOLDOWN_MS = DUPLICATE_COOLDOWN_MS;
