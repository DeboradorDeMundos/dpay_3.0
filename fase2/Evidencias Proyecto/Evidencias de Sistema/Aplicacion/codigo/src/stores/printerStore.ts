import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';

// Storage específico para impresora
const printerStorage = new MMKV({
  id: 'printer-storage',
});

export interface PrinterDevice {
  address: string;
  name: string;
}

interface PrinterStore {
  selectedPrinter: PrinterDevice | null;
  isConnected: boolean;
  
  // Acciones
  selectPrinter: (printer: PrinterDevice) => void;
  setConnected: (connected: boolean) => void;
  clearPrinter: () => void;
  
  // Inicializar desde storage
  initializePrinter: () => void;
}

export const usePrinterStore = create<PrinterStore>((set) => ({
  selectedPrinter: null,
  isConnected: false,

  selectPrinter: (printer) => {
    printerStorage.set('printer', JSON.stringify(printer));
    set({ selectedPrinter: printer });
  },

  setConnected: (connected) => {
    set({ isConnected: connected });
  },

  clearPrinter: () => {
    printerStorage.delete('printer');
    set({ selectedPrinter: null, isConnected: false });
  },

  initializePrinter: () => {
    const printerJson = printerStorage.getString('printer');
    if (printerJson) {
      try {
        const printer = JSON.parse(printerJson) as PrinterDevice;
        set({ selectedPrinter: printer });
      } catch (error) {
        console.error('Error al cargar impresora guardada:', error);
      }
    }
  },
}));
