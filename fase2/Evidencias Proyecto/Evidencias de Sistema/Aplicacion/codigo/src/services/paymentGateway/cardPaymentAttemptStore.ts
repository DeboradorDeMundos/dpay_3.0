import { MMKV } from 'react-native-mmkv';
import {
  prependCardPaymentAttempt,
  type CardPaymentAttempt,
} from './cardPaymentAttempts';

const storage = new MMKV({ id: 'card-payment-attempts' });
const KEY = 'attempts';

export function listCardPaymentAttempts(): CardPaymentAttempt[] {
  const raw = storage.getString(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordCardPaymentAttempt(
  attempt: Omit<CardPaymentAttempt, 'at'> & { at?: string },
): void {
  const next = prependCardPaymentAttempt(listCardPaymentAttempts(), {
    ...attempt,
    at: attempt.at ?? new Date().toISOString(),
  });
  storage.set(KEY, JSON.stringify(next));
}
