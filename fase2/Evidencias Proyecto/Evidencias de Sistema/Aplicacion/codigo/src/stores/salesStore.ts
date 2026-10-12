import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';
import { SaleItem, Client, PaymentMethod } from '../types';

const storage = new MMKV({ id: 'sales-storage' });

// Debounce para guardar en storage - evita bloquear la UI
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
const debouncedSave = (key: string, value: string) => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  // Guardar después de 100ms de inactividad
  saveTimeout = setTimeout(() => {
    storage.set(key, value);
  }, 100);
};

// Guardado inmediato para operaciones críticas
const immediateSave = (key: string, value: string) => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }
  storage.set(key, value);
};

export interface CartItem {
  code: string;
  name: string;
  value: number;
  count: number;
  total: number;
  index?: number;
  bodega?: string;      // ID/código de bodega para emisión (ej: "41")
  nombreBodega?: string; // Nombre display de la bodega (ej: "NORTE")
}

export interface Sale {
  results: CartItem[];
}

export interface DocumentType {
  id: number;
  name: string;
  code: string;
}

interface SalesState {
  sales: Sale[];
  currentSale: number;
  currentPrice: number;
  currentQuantity: number;
  currentItemName: string; // Nombre del producto actual (para mostrar en calculadora)
  client: Client | null;
  paymentMethod: string; // Nombre del método: "Efectivo", "Tarjeta de crédito", "Tarjeta de débito"
  change: string | null; // Vuelto formateado como string "$ 1.000"
  documentType: DocumentType | null;
  indexToEdit: number | null;

  addItem: (item: CartItem) => void;
  editItem: (item: CartItem, index: number) => void;
  removeItem: (index: number) => void;
  clearCart: () => void;
  setNewSale: () => void;
  setCurrentSale: (index: number) => void;
  removeSale: (index: number) => void;
  setClient: (client: Client | null) => void;
  setPaymentMethodSale: (method: string) => void; // Guarda nombre del método de pago
  setChangeSale: (change: string | null) => void; // Guarda vuelto formateado
  setDocumentType: (docType: DocumentType) => void; // Guarda tipo de documento seleccionado
  setDocumentTypeSale: (docType: DocumentType) => void; // Alias de setDocumentType
  setCurrentPrice: (price: number) => void;
  setCurrentQuantity: (quantity: number) => void;
  setCurrentItemName: (name: string) => void;
  setIndexToEdit: (index: number | null) => void;
  getCurrentSale: () => Sale | undefined;
  getTotal: () => number;
  getItemCount: () => number;
  loadFromStorage: () => void;
  clearAll: () => void;
}

export const useSalesStore = create<SalesState>((set, get) => ({
  sales: [],
  currentSale: 0,
  currentPrice: 0,
  currentQuantity: 1,
  currentItemName: '',
  client: null,
  paymentMethod: '',
  change: null,
  documentType: null,
  indexToEdit: null,

  addItem: (item) => {
    const { sales, currentSale } = get();
    const newSales = [...sales];
    if (!newSales[currentSale]) {
      newSales[currentSale] = { results: [] };
    }
    
    // Asegurar que los valores sean números
    const sanitizedItem = {
      ...item,
      value: typeof item.value === 'string' ? parseFloat(item.value) || 0 : item.value,
      count: typeof item.count === 'string' ? parseInt(item.count, 10) || 0 : item.count,
      total: typeof item.total === 'string' ? parseFloat(item.total) || 0 : item.total,
    };
    
    // Buscar si el producto ya existe en el carrito (mismo código y precio)
    const currentResults = newSales[currentSale].results;
    const existingIndex = currentResults.findIndex(
      (existing) => existing.code === sanitizedItem.code && existing.value === sanitizedItem.value
    );
    
    let newResults;
    if (existingIndex !== -1) {
      // Producto existe: sumar cantidad - crear nuevo array con item actualizado
      const existingItem = currentResults[existingIndex];
      const newCount = existingItem.count + sanitizedItem.count;
      newResults = currentResults.map((item, idx) => 
        idx === existingIndex 
          ? { ...existingItem, count: newCount, total: existingItem.value * newCount }
          : item
      );
    } else {
      // Producto nuevo: crear nuevo array con item agregado
      newResults = [...currentResults, sanitizedItem];
    }
    
    // Crear nueva referencia del objeto sale
    newSales[currentSale] = {
      ...newSales[currentSale],
      results: newResults
    };
    
    // Actualizar UI inmediatamente
    set({ sales: newSales });
    // Guardar en storage con debounce para no bloquear
    debouncedSave('sales', JSON.stringify(newSales));
  },

  editItem: (item, index) => {
    const { sales, currentSale } = get();
    const newSales = [...sales];
    if (newSales[currentSale]?.results[index]) {
      // Crear nuevo array con el item editado
      const newResults = newSales[currentSale].results.map((existingItem, idx) => 
        idx === index
          ? {
              ...existingItem,
              value: typeof item.value === 'string' ? parseFloat(item.value) || 0 : item.value,
              count: typeof item.count === 'string' ? parseInt(item.count, 10) || 0 : item.count,
              total: typeof item.total === 'string' ? parseFloat(item.total) || 0 : item.total,
            }
          : existingItem
      );
      
      // Crear nueva referencia del objeto sale
      newSales[currentSale] = {
        ...newSales[currentSale],
        results: newResults
      };
      
      set({ sales: newSales });
      debouncedSave('sales', JSON.stringify(newSales));
    }
  },

  removeItem: (index) => {
    const { sales, currentSale } = get();
    const newSales = [...sales];
    if (newSales[currentSale]) {
      // Crear un nuevo array de results sin el item eliminado
      newSales[currentSale] = {
        ...newSales[currentSale],
        results: newSales[currentSale].results.filter((_, i) => i !== index)
      };
      set({ sales: newSales });
      debouncedSave('sales', JSON.stringify(newSales));
    }
  },

  clearCart: () => {
    const { sales, currentSale } = get();
    const newSales = [...sales];
    if (newSales[currentSale]) {
      newSales[currentSale].results = [];
      set({ sales: newSales });
      storage.set('sales', JSON.stringify(newSales));
    }
  },

  setNewSale: () => {
    const { sales } = get();
    const newSales = [...sales, { results: [] }];
    set({ sales: newSales, currentSale: newSales.length - 1 });
    storage.set('sales', JSON.stringify(newSales));
  },

  setCurrentSale: (index) => {
    set({ currentSale: index });
  },

  removeSale: (index) => {
    const { sales } = get();
    const newSales = [...sales];
    newSales.splice(index, 1);
    set({ sales: newSales, currentSale: Math.max(0, newSales.length - 1) });
    storage.set('sales', JSON.stringify(newSales));
  },

  setClient: (client) => {
    set({ client });
    if (client) storage.set('currentClient', JSON.stringify(client));
    else storage.delete('currentClient');
  },

  setPaymentMethodSale: (method) => set({ paymentMethod: method }),
  setChangeSale: (change) => set({ change }),
  
  setDocumentTypeSale: (docType) => {
    set({ documentType: docType });
    if (docType) storage.set('currentDocumentType', JSON.stringify(docType));
    else storage.delete('currentDocumentType');
  },

  setDocumentType: (docType) => {
    set({ documentType: docType });
    if (docType) storage.set('currentDocumentType', JSON.stringify(docType));
    else storage.delete('currentDocumentType');
  },

  setCurrentPrice: (price) => set({ currentPrice: price }),
  setCurrentQuantity: (quantity) => set({ currentQuantity: quantity }),
  setCurrentItemName: (name) => set({ currentItemName: name }),
  setIndexToEdit: (index) => set({ indexToEdit: index }),

  getCurrentSale: () => {
    const { sales, currentSale } = get();
    return sales[currentSale];
  },

  getTotal: () => {
    const sale = get().getCurrentSale();
    if (!sale?.results) return 0;
    // Asegurar que los totales sean números y no strings
    return sale.results.reduce((sum, item) => {
      const itemTotal = typeof item.total === 'string' ? parseFloat(item.total) || 0 : item.total;
      return sum + itemTotal;
    }, 0);
  },

  getItemCount: () => {
    const sale = get().getCurrentSale();
    if (!sale?.results) return 0;
    // Asegurar que los counts sean números
    return sale.results.reduce((sum, item) => {
      const itemCount = typeof item.count === 'string' ? parseInt(item.count, 10) || 0 : item.count;
      return sum + itemCount;
    }, 0);
  },

  loadFromStorage: () => {
    try {
      const salesStr = storage.getString('sales');
      const clientStr = storage.getString('currentClient');
      const docTypeStr = storage.getString('currentDocumentType');
      if (salesStr) set({ sales: JSON.parse(salesStr) });
      if (clientStr) set({ client: JSON.parse(clientStr) });
      if (docTypeStr) set({ documentType: JSON.parse(docTypeStr) });
    } catch (error) {
      console.error('Error loading sales:', error);
    }
  },

  clearAll: () => {
    set({
      sales: [],
      currentSale: 0,
      currentPrice: 0,
      currentQuantity: 1,
      client: null,
      paymentMethod: '',
      change: null,
      documentType: null,
      indexToEdit: null,
    });
    storage.delete('sales');
    storage.delete('currentClient');
    storage.delete('currentDocumentType');
  },
}));
