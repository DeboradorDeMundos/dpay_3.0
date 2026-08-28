import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';
import { Settings, PrinterConfig, DocumentType } from '../types';
import { withRequiredComprobante, COMPROBANTE_PAGO_DOC } from '../utils/documentTypeDefaults';
import type { DpayComisiones } from '../services/api';

const storage = new MMKV({ id: 'settings-storage' });

interface SettingsState {
  // Estado (de Settings)
  systemImage?: string;
  documentType: Array<{ id: DocumentType; name: string; enabled: boolean }>;
  automaticPrinting: boolean;
  autoPrintMode: 'document' | 'voucher' | 'both';
  selectClient: boolean;
  enableTip: boolean;
  addComments: boolean;
  emitirDocumento: boolean; // Emitir documento electrónico y sincronizar con DTEMITE
  ncCorreccionMonto: boolean; // Habilitar NC por corrección de monto al anular
  additionalLines: string;
  header1: string;
  header2: string;
  header3: string;
  header4: string;
  header5: string;
  header6: string;
  footer1: string;
  footer2: string;
  footer3: string;
  footer4: string;
  footer5: string;
  footer6: string;
  coolingInterval: string;
  paperWidth: string;
  commentInvoice: string;
  showLogo: boolean;
  enableProductScan: boolean;
  scanPersistentMode: boolean;
  scanFlashAlways: boolean;
  processPayments: boolean;
  printTED: boolean;
  autoSync: boolean; // Sincronización automática (SIEMPRE ACTIVA - forzada a true)
  printer?: PrinterConfig;
  paymentMethodsByDocType: Record<number, string[]>; // Deprecated - mantener por compatibilidad
  globalPaymentMethods: string[]; // Métodos de pago globales: ["Efectivo", "Tarjeta de crédito", "Tarjeta de débito"]
  dpayComisiones: DpayComisiones | null; // Comisiones DPay de la empresa
  
  // Acciones
  updateSettings: (newSettings: Partial<Settings>) => void;
  setPrinter: (printer: PrinterConfig | null | undefined) => void;
  setDocumentTypes: (types: Array<{ id: DocumentType; name: string; enabled: boolean }>) => void;
  setAutomaticPrinting: (enabled: boolean) => void;
  setAutoPrintMode: (mode: 'document' | 'voucher' | 'both') => void;
  setSelectClient: (enabled: boolean) => void;
  setEnableTip: (enabled: boolean) => void;
  setAddComments: (enabled: boolean) => void;
  setEmitirDocumento: (enabled: boolean) => void;
  setNcCorreccionMonto: (enabled: boolean) => void;
  setProcessPayments: (enabled: boolean) => void;
  setAdditionalLines: (lines: number) => void;
  setShowLogo: (enabled: boolean) => void;
  setEnableProductScan: (enabled: boolean) => void;
  setScanPersistentMode: (enabled: boolean) => void;
  setScanFlashAlways: (enabled: boolean) => void;
  setPrintTED: (enabled: boolean) => void;
  setAutoSync: (enabled: boolean) => void;
  setGlobalPaymentMethods: (methods: string[]) => void;
  setPaymentMethodsForDocType: (docTypeId: number, methods: string[]) => void; // Deprecated
  getPaymentMethodsForDocType: (docTypeId: number) => string[]; // Ahora retorna métodos globales
  setDpayComisiones: (comisiones: DpayComisiones | null) => void;
  loadFromStorage: () => void;
  clear: () => void;
}

const defaultSettings: Settings = {
  systemImage: undefined,
  documentType: [COMPROBANTE_PAGO_DOC],
  automaticPrinting: false,
  autoPrintMode: 'document',
  selectClient: false,
  enableTip: false,
  addComments: false,
  emitirDocumento: true, // Activo por defecto
  ncCorreccionMonto: false, // Desactivado por defecto
  additionalLines: '6',
  header1: '',
  header2: '',
  header3: '',
  header4: '',
  header5: '',
  header6: '',
  footer1: '',
  footer2: '',
  footer3: '',
  footer4: '',
  footer5: '',
  footer6: '',
  coolingInterval: '',
  paperWidth: '',
  commentInvoice: '',
  showLogo: false,
  enableProductScan: false,
  scanPersistentMode: true,
  scanFlashAlways: false,
  processPayments: false,
  printTED: true,
  autoSync: true, // Sincronización automática SIEMPRE activada
  printer: undefined,
};

const defaultPaymentMethods: Record<number, string[]> = {};
/** D-PAY POS: tarjetas activas por defecto si no hay configuración guardada. */
export const DPAY_DEFAULT_PAYMENT_METHODS = ['Efectivo', 'Tarjeta de crédito', 'Tarjeta de débito'];
const defaultGlobalPaymentMethods: string[] = [];

export const useSettingsStore = create<SettingsState>((set, get) => {
  // Cargar settings desde MMKV al iniciar
  const loadedSettings = storage.getString('settings');
  const parsedSettings = loadedSettings ? JSON.parse(loadedSettings) : {};
  
  // IMPORTANTE: autoSync SIEMPRE debe ser true, ignorar valor guardado
  const initialSettings: Settings = {
    ...defaultSettings,
    ...parsedSettings,
    autoSync: true, // FORZAR SIEMPRE A TRUE
    documentType: withRequiredComprobante(parsedSettings.documentType ?? defaultSettings.documentType),
    additionalLines: parsedSettings.additionalLines || defaultSettings.additionalLines,
  };

  // Cargar payment methods desde MMKV al iniciar
  const loadedPaymentMethods = storage.getString('paymentMethodsByDocType');
  const initialPaymentMethods: Record<number, string[]> = loadedPaymentMethods
    ? JSON.parse(loadedPaymentMethods)
    : defaultPaymentMethods;
  
  // Cargar métodos de pago globales
  const loadedGlobalPaymentMethods = storage.getString('globalPaymentMethods');
  const initialGlobalPaymentMethods: string[] = loadedGlobalPaymentMethods
    ? JSON.parse(loadedGlobalPaymentMethods)
    : defaultGlobalPaymentMethods;

  return {
    ...initialSettings,
    paymentMethodsByDocType: initialPaymentMethods,
    dpayComisiones: null, // Se cargará cuando el usuario acceda a configuraciones
    globalPaymentMethods: initialGlobalPaymentMethods,
  
    updateSettings: (newSettings) => {
      const current = get();
      const updated = { ...current, ...newSettings };
      
      // IMPORTANTE: Forzar autoSync a true siempre
      updated.autoSync = true;
      
      // Guardar solo las propiedades de Settings (sin las acciones)
      const settingsToSave: Settings = {
        systemImage: updated.systemImage,
        documentType: withRequiredComprobante(updated.documentType ?? defaultSettings.documentType),
        automaticPrinting: updated.automaticPrinting,
        autoPrintMode: updated.autoPrintMode,
        selectClient: updated.selectClient,
        enableTip: updated.enableTip,
        addComments: updated.addComments,
        emitirDocumento: updated.emitirDocumento,
        ncCorreccionMonto: updated.ncCorreccionMonto,
        additionalLines: updated.additionalLines,
        header1: updated.header1,
        header2: updated.header2,
        header3: updated.header3,
        header4: updated.header4,
        header5: updated.header5,
        header6: updated.header6,
        footer1: updated.footer1,
        footer2: updated.footer2,
        footer3: updated.footer3,
        footer4: updated.footer4,
        footer5: updated.footer5,
        footer6: updated.footer6,
        coolingInterval: updated.coolingInterval,
        paperWidth: updated.paperWidth,
        commentInvoice: updated.commentInvoice,
        showLogo: updated.showLogo,
        enableProductScan: updated.enableProductScan ?? false,
        scanPersistentMode: updated.scanPersistentMode ?? false,
        scanFlashAlways: updated.scanFlashAlways ?? false,
        processPayments: updated.processPayments,
        printTED: updated.printTED,
        autoSync: true, // FORZAR SIEMPRE A TRUE AL GUARDAR
        printer: updated.printer,
      };
      
      storage.set('settings', JSON.stringify(settingsToSave));
      set(updated);
    },

    setPrinter: (printer) => {
      get().updateSettings({ printer: printer ?? undefined });
    },

    setDocumentTypes: (types) => {
      get().updateSettings({ documentType: withRequiredComprobante(types as any) });
    },

    setAutomaticPrinting: (enabled) => {
      get().updateSettings({ automaticPrinting: enabled });
    },

    setAutoPrintMode: (mode) => {
      get().updateSettings({ autoPrintMode: mode });
    },

    setSelectClient: (enabled) => {
      get().updateSettings({ selectClient: enabled });
    },

    setEnableTip: (enabled) => {
      get().updateSettings({ enableTip: enabled });
    },

    setAddComments: (enabled) => {
      get().updateSettings({ addComments: enabled });
    },

    setEmitirDocumento: (enabled) => {
      get().updateSettings({ emitirDocumento: enabled });
    },

    setNcCorreccionMonto: (enabled) => {
      get().updateSettings({ ncCorreccionMonto: enabled });
    },

    setProcessPayments: (enabled) => {
      get().updateSettings({ processPayments: enabled });
    },

    setAdditionalLines: (lines: number) => {
      get().updateSettings({ additionalLines: lines.toString() });
    },

    setShowLogo: (enabled: boolean) => {
      get().updateSettings({ showLogo: enabled });
    },

    setEnableProductScan: (enabled: boolean) => {
      get().updateSettings({ enableProductScan: enabled });
    },

    setScanPersistentMode: (enabled: boolean) => {
      get().updateSettings({ scanPersistentMode: enabled });
    },

    setScanFlashAlways: (enabled: boolean) => {
      get().updateSettings({ scanFlashAlways: enabled });
    },

    setPrintTED: (enabled: boolean) => {
      get().updateSettings({ printTED: enabled });
    },

    setAutoSync: (enabled: boolean) => {
      // AutoSync SIEMPRE debe estar activado - ignorar intentos de desactivar
      if (!enabled) {
        console.warn('[SettingsStore] Intento de desactivar autoSync bloqueado - debe estar siempre activo');
        return;
      }
      get().updateSettings({ autoSync: true });
    },

    setGlobalPaymentMethods: (methods: string[]) => {
      storage.set('globalPaymentMethods', JSON.stringify(methods));
      set({ globalPaymentMethods: methods });
    },

    // Deprecated - mantener por compatibilidad pero ya no se usa
    setPaymentMethodsForDocType: (docTypeId: number, methods: string[]) => {
      // Ahora redirige a setGlobalPaymentMethods
      get().setGlobalPaymentMethods(methods);
    },

    // Ahora retorna los métodos globales (ignora docTypeId)
    getPaymentMethodsForDocType: (docTypeId: number) => {
      const methods = get().globalPaymentMethods;
      if (methods.length > 0) return methods;
      return DPAY_DEFAULT_PAYMENT_METHODS;
    },

    setDpayComisiones: (comisiones: DpayComisiones | null) => {
      set({ dpayComisiones: comisiones });
    },
  
    loadFromStorage: () => {
      try {
        const settingsStr = storage.getString('settings');
        const globalPaymentMethodsStr = storage.getString('globalPaymentMethods');
        
        if (settingsStr) {
          const settings = JSON.parse(settingsStr);
          // IMPORTANTE: Forzar autoSync a true siempre al cargar
          // Si additionalLines está vacío (usuarios existentes con '' guardado), usar el default
          set({
            ...defaultSettings,
            ...settings,
            autoSync: true,
            documentType: withRequiredComprobante(settings.documentType ?? defaultSettings.documentType),
            additionalLines: settings.additionalLines || defaultSettings.additionalLines,
          });
        }
        
        if (globalPaymentMethodsStr) {
          const globalPaymentMethods = JSON.parse(globalPaymentMethodsStr);
          set({ globalPaymentMethods });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    },
  
    clear: () => {
      storage.delete('settings');
      storage.delete('globalPaymentMethods');
      storage.delete('paymentMethodsByDocType');
      set({ ...defaultSettings, paymentMethodsByDocType: defaultPaymentMethods, globalPaymentMethods: defaultGlobalPaymentMethods });
    },
  };
});
