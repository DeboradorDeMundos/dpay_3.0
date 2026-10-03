/** Tiempo máximo esperando escaneo QR / cierre en Transbank (Capstone). */
export const WEBPAY_CHECKOUT_TIMEOUT_SEC = 120;
export const WEBPAY_CHECKOUT_TIMEOUT_MS = WEBPAY_CHECKOUT_TIMEOUT_SEC * 1000;

function checkoutTimeoutDurationPhrase(seconds: number): string {
  if (seconds >= 60 && seconds % 60 === 0) {
    const minutes = seconds / 60;
    return minutes === 1 ? '1 minuto' : `${minutes} minutos`;
  }
  return `${seconds} segundos`;
}

/** Alertas al cajero cuando expira el checkout Webpay. */
export function webpayCheckoutTimeoutUserMessage(): string {
  return `Pasaron ${checkoutTimeoutDurationPhrase(WEBPAY_CHECKOUT_TIMEOUT_SEC)} sin completar el pago. Vuelva a cobrar con tarjeta para generar un nuevo QR.`;
}

/** Fragmento en errores técnicos WEBPAY_TIMEOUT. */
export function webpayCheckoutTimeoutErrorDetail(): string {
  return `no se completó el pago en ${checkoutTimeoutDurationPhrase(WEBPAY_CHECKOUT_TIMEOUT_SEC)}. Puede generar un nuevo QR.`;
}
