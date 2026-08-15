import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';
import { Platform } from 'react-native';
import { APP_VERSION_CODE } from '../constants/appVersion';
import {
  fetchAppVersionPolicy,
  isAppOutdated,
  shouldShowSoftReminder,
  type AppVersionPolicy,
} from '../services/appUpdateService';
import { openTuuAppStore } from '../services/tuuAppStore';

const storage = new MMKV({ id: 'app-update-storage' });
const KEY_LAST_DISMISSED = 'lastDismissedAt';
const KEY_LAST_CHECKED = 'lastCheckedAt';

interface AppUpdateState {
  visible: boolean;
  forceUpdate: boolean;
  message: string;
  downloadUrl: string;
  latestVersion: string;
  reminderIntervalHours: number;
  lastDismissedAt: number | null;
  lastCheckedAt: number | null;
  checking: boolean;
  openingStore: boolean;
  initialize: () => void;
  checkForUpdate: (opts?: { forceShowSoft?: boolean }) => Promise<void>;
  dismissSoft: () => void;
  openDownload: () => Promise<void>;
}

function readNumber(key: string): number | null {
  const raw = storage.getString(key);
  if (raw == null || raw === '') {
    return null;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

const DEFAULT_UPDATE_MESSAGE =
  'Hay una nueva versión de D-PAY disponible. Actualízala desde la tienda TUU del equipo.';

export const useAppUpdateStore = create<AppUpdateState>((set, get) => ({
  visible: false,
  forceUpdate: false,
  message: '',
  downloadUrl: '',
  latestVersion: '',
  reminderIntervalHours: 2,
  lastDismissedAt: null,
  lastCheckedAt: null,
  checking: false,
  openingStore: false,

  initialize: () => {
    set({
      lastDismissedAt: readNumber(KEY_LAST_DISMISSED),
      lastCheckedAt: readNumber(KEY_LAST_CHECKED),
    });
  },

  checkForUpdate: async (opts = {}) => {
    if (Platform.OS !== 'android') {
      return;
    }
    if (get().checking) {
      return;
    }

    set({ checking: true });
    try {
      const policy: AppVersionPolicy | null = await fetchAppVersionPolicy('android');
      const now = Date.now();
      storage.set(KEY_LAST_CHECKED, String(now));
      set({ lastCheckedAt: now, checking: false });

      // Fail-open
      if (!policy) {
        return;
      }

      set({ reminderIntervalHours: policy.reminder_interval_hours });

      if (!isAppOutdated(policy, APP_VERSION_CODE)) {
        if (get().visible) {
          set({ visible: false, forceUpdate: false });
        }
        return;
      }

      const base = {
        message: policy.message || DEFAULT_UPDATE_MESSAGE,
        downloadUrl: policy.download_url || '',
        latestVersion: policy.latest_version || '',
        reminderIntervalHours: policy.reminder_interval_hours,
      };

      if (policy.force_update) {
        set({ ...base, visible: true, forceUpdate: true });
        return;
      }

      const { lastDismissedAt } = get();
      const showSoft =
        opts.forceShowSoft === true ||
        shouldShowSoftReminder(lastDismissedAt, policy.reminder_interval_hours, now);

      if (showSoft) {
        set({ ...base, visible: true, forceUpdate: false });
      }
    } catch (error) {
      console.warn('[AppUpdate] checkForUpdate error (fail-open):', error);
      set({ checking: false });
    }
  },

  dismissSoft: () => {
    if (get().forceUpdate) {
      return;
    }
    const now = Date.now();
    storage.set(KEY_LAST_DISMISSED, String(now));
    set({ visible: false, lastDismissedAt: now });
  },

  openDownload: async () => {
    if (get().openingStore) {
      return;
    }
    set({ openingStore: true });
    try {
      const ok = await openTuuAppStore(get().downloadUrl);
      if (!ok) {
        console.warn('[AppUpdate] No se pudo abrir la tienda TUU');
      }
    } finally {
      set({ openingStore: false });
    }
  },
}));
