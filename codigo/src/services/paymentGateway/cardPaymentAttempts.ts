export type CardPaymentAttempt = {
  at: string;
  provider: string;
  status: string;
  paymentId?: string;
  token?: string;
  buyOrder?: string;
  amount?: number;
};

export function prependCardPaymentAttempt(
  existing: CardPaymentAttempt[],
  attempt: CardPaymentAttempt,
  max = 50,
): CardPaymentAttempt[] {
  return [attempt, ...existing].slice(0, max);
}
