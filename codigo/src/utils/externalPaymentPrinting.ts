import type { PaymentIntent } from '../services/paymentHubService';
import type { TuuPaymentResponse } from '../services/tuuPayment';
import type { ExtraTicketData } from '../hooks/usePrinter';
import { parseExtraPrint } from './extraPrint';

export const EXTRA_PRINT_DELAY_MS = 5000;

interface UserEmpresa {
  razon?: string;
  rut?: string;
  direccion?: string;
  comuna?: string;
}

interface PrinterFunctions {
  printPaymentVoucher: (data: {
    empresa: { razon: string; rut: string; direccion: string; comuna: string };
    tipoTarjeta: 'CREDITO' | 'DEBITO';
    sequenceNumber: string;
    monto: number;
    montoNeto: number;
    montoExento: number;
    iva: number;
    propina?: number;
    cuotas?: number;
    authCode?: string;
    last4?: string;
    fecha: string;
    estado: boolean;
  }) => Promise<void>;
  printExtraTicket: (data: ExtraTicketData) => Promise<void>;
  selectedPrinter: { address: string } | null;
}

interface Settings {
  automaticPrinting: boolean;
  autoPrintMode: 'document' | 'voucher' | 'both';
}

interface RunExternalPaymentPrintingOptions {
  intent: PaymentIntent;
  /** The successful TUU response */
  tuuResult: TuuPaymentResponse;
  /** TUU method used: 1 = credit, 2 = debit */
  tuuMethod: 1 | 2;
  /** Net amount sent to TUU (amount / 1.19 rounded) */
  netAmount: number;
  user: { empresa?: UserEmpresa } | null;
  settings: Settings;
  printer: PrinterFunctions;
  delayMs?: number;
}

interface PrintResult {
  primaryPrinted: boolean;
  extraPrinted: boolean;
  errors: string[];
}

/**
 * Orchestrates post-payment printing for cloud-to-cloud Payment Hub cobros.
 *
 * Order of operations:
 *  1. Print primary (TUU voucher) if automaticPrinting is on and mode is voucher/both.
 *     Note: document printing is not applicable for external cobros (no local DTE).
 *  2. Wait EXTRA_PRINT_DELAY_MS.
 *  3. Print extra ticket if intent.extra_print.enabled (always, regardless of automaticPrinting).
 *
 * Errors in any step are caught individually and do not block the next step or the payment flow.
 */
export async function runExternalPaymentPrinting(opts: RunExternalPaymentPrintingOptions): Promise<PrintResult> {
  const {
    intent,
    tuuResult,
    tuuMethod,
    netAmount,
    user,
    settings,
    printer,
    delayMs = EXTRA_PRINT_DELAY_MS,
  } = opts;

  const result: PrintResult = { primaryPrinted: false, extraPrinted: false, errors: [] };

  if (!printer.selectedPrinter) {
    return result;
  }

  // === 1. Primary: TUU payment voucher ===
  const shouldPrintVoucher =
    settings.automaticPrinting &&
    (settings.autoPrintMode === 'voucher' || settings.autoPrintMode === 'both');

  if (shouldPrintVoucher) {
    try {
      const empresa = user?.empresa ?? {};
      const amount = intent.amount;
      const montoExento = 0;
      const iva = amount - netAmount - montoExento;

      await printer.printPaymentVoucher({
        empresa: {
          razon: empresa.razon || '',
          rut: empresa.rut || '',
          direccion: empresa.direccion || '',
          comuna: empresa.comuna || '',
        },
        tipoTarjeta: tuuMethod === 1 ? 'CREDITO' : 'DEBITO',
        sequenceNumber: tuuResult.sequenceNumber,
        monto: amount,
        montoNeto: netAmount,
        montoExento,
        iva,
        propina: tuuResult.transactionTip,
        authCode: tuuResult.authCode,
        last4: tuuResult.last4,
        fecha: new Date().toISOString(),
        estado: tuuResult.transactionStatus,
      });
      result.primaryPrinted = true;
      console.log('[ExternalPaymentPrinting] Comprobante impreso');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[ExternalPaymentPrinting] Error comprobante:', msg);
      result.errors.push(`Comprobante: ${msg}`);
    }
  }

  // === 2. Delay before extra ticket ===
  const extraPrint = parseExtraPrint(intent);
  if (extraPrint) {
    await new Promise(resolve => setTimeout(resolve, delayMs));

    // === 3. Extra ticket ===
    try {
      const data: ExtraTicketData = {
        showLogo: extraPrint.show_logo,
        systemName: extraPrint.system_name,
        lines: extraPrint.lines.map(l => l.text),
      };
      await printer.printExtraTicket(data);
      result.extraPrinted = true;
      console.log('[ExternalPaymentPrinting] Ticket extra impreso');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[ExternalPaymentPrinting] Error ticket extra:', msg);
      result.errors.push(`Ticket extra: ${msg}`);
    }
  }

  return result;
}

interface RunExternalExtraPrintOnlyOptions {
  intent: PaymentIntent;
  printer: Pick<PrinterFunctions, 'printExtraTicket' | 'selectedPrinter'>;
}

/**
 * Prints only the extra ticket (print_only flow or post-cash without TUU voucher).
 */
export async function runExternalExtraPrintOnly(
  opts: RunExternalExtraPrintOnlyOptions,
): Promise<{ extraPrinted: boolean; error?: string }> {
  const { intent, printer } = opts;

  if (!printer.selectedPrinter) {
    return { extraPrinted: false, error: 'Sin impresora seleccionada' };
  }

  const extraPrint = parseExtraPrint(intent);
  if (!extraPrint) {
    return { extraPrinted: false, error: 'Sin líneas de ticket adicional' };
  }

  try {
    await printer.printExtraTicket({
      showLogo: extraPrint.show_logo,
      systemName: extraPrint.system_name,
      lines: extraPrint.lines.map(l => l.text),
    });
    console.log('[ExternalPaymentPrinting] Ticket extra impreso (solo impresión)');
    return { extraPrinted: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ExternalPaymentPrinting] Error ticket extra:', msg);
    return { extraPrinted: false, error: msg };
  }
}
