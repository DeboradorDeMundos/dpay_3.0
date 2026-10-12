import type { PaymentIntent, PaymentIntentExtraPrint, PaymentIntentExtraPrintLine } from '../services/paymentHubService';

const asRecord = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

const asString = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

/**
 * Extracts and normalizes the extra_print block from a PaymentIntent.
 * Source priority: intent.extra_print (server-normalized) → intent.metadata.extra_print (raw).
 * Returns null when extra_print is absent, disabled, or has no lines.
 */
export function parseExtraPrint(intent: PaymentIntent): PaymentIntentExtraPrint | null {
  // Prefer the server-normalized top-level field
  const raw: unknown = intent.extra_print ?? asRecord(intent.metadata).extra_print;
  if (!raw) return null;

  const block = asRecord(raw);
  if (!block.enabled) return null;

  // Lines may come as the server-normalized array or as flat adicional_1…adicional_10 keys
  let lines: PaymentIntentExtraPrintLine[] = [];

  if (Array.isArray(block.lines) && block.lines.length > 0) {
    lines = (block.lines as unknown[])
      .map((item) => {
        const l = asRecord(item);
        const text = asString(l.text) || asString(l.line);
        const index = typeof l.index === 'number' ? l.index : 0;
        return text ? { index, text } : null;
      })
      .filter((l): l is PaymentIntentExtraPrintLine => l !== null);
  } else {
    // Fallback: flat adicional_1…adicional_10
    for (let i = 1; i <= 10; i++) {
      const text = asString(block[`adicional_${i}`]);
      if (text) lines.push({ index: i, text });
    }
  }

  if (lines.length === 0) return null;

  return {
    enabled: true,
    show_logo: block.show_logo !== false,
    system_name: asString(block.system_name),
    lines,
  };
}

/** Returns just the text lines as a plain string array, convenient for preview UI. */
export function extraPrintLines(intent: PaymentIntent): string[] {
  return parseExtraPrint(intent)?.lines.map((l) => l.text) ?? [];
}
