import { apiClient, PAYMENT_HUB_API_BASE_URL } from './apiClient';
import { APP_VERSION_CODE } from '../constants/appVersion';

export interface AppVersionPolicy {
  platform: string;
  latest_version: string;
  min_version_code: number;
  force_update: boolean;
  download_url: string;
  message: string;
  reminder_interval_hours: number;
}

/**
 * Consulta política de versión (público, sin auth).
 * Fail-open: ante error de red/API retorna null.
 */
export async function fetchAppVersionPolicy(
  platform: string = 'android',
): Promise<AppVersionPolicy | null> {
  try {
    const response = await apiClient(
      `/paymenthub/app/version?platform=${encodeURIComponent(platform)}`,
      {
        method: 'GET',
        requiresAuth: false,
        baseUrl: PAYMENT_HUB_API_BASE_URL,
      },
    );
    const data = await response.json();
    if (!data || typeof data.min_version_code !== 'number') {
      return null;
    }
    return {
      platform: String(data.platform || platform),
      latest_version: String(data.latest_version || ''),
      min_version_code: Number(data.min_version_code),
      force_update: !!data.force_update,
      download_url: String(data.download_url || ''),
      message: String(data.message || ''),
      reminder_interval_hours: Math.min(
        72,
        Math.max(1, Number(data.reminder_interval_hours) || 2),
      ),
    };
  } catch (error) {
    console.warn('[AppUpdate] No se pudo consultar versión (fail-open):', error);
    return null;
  }
}

export function isAppOutdated(policy: AppVersionPolicy, versionCode = APP_VERSION_CODE): boolean {
  return versionCode < policy.min_version_code;
}

export function shouldShowSoftReminder(
  lastDismissedAt: number | null,
  reminderIntervalHours: number,
  now = Date.now(),
): boolean {
  if (lastDismissedAt == null) {
    return true;
  }
  const intervalMs = Math.max(1, reminderIntervalHours) * 60 * 60 * 1000;
  return now - lastDismissedAt >= intervalMs;
}
