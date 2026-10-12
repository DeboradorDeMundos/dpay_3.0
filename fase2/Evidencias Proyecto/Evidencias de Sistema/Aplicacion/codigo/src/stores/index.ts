// Stores - Estado global con Zustand + MMKV
export { useAuthStore } from './authStore';
export { useSalesStore } from './salesStore';
export { useSettingsStore } from './settingsStore';
export { useThemeStore } from './themeStore';
export { useCAFStore } from './cafStore';
export { useCatalogueStore } from './catalogueStore';
export { useClientsStore } from './clientsStore';
export { useMySalesStore } from './mySalesStore';
export { usePrinterStore } from './printerStore';
export { useAppUpdateStore } from './appUpdateStore';

// Re-export types from salesStore
export type { CartItem, Sale, DocumentType } from './salesStore';
export type { PrinterDevice } from './printerStore';
