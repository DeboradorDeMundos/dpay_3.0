import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';
import { Product } from '../types';

// Almacenamiento persistente
const storage = new MMKV({ id: 'catalogue-storage' });

interface CatalogueState {
  // Estado
  products: Product[];
  searchQuery: string;
  selectedCategory: string | null;
  
  // Acciones
  setProducts: (products: Product[]) => void;
  mergeProducts: (products: any[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  removeProduct: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  clearCatalogue: () => void;
  
  // Helpers
  getProductById: (id: string) => Product | undefined;
  getProductByCode: (code: string) => Product | undefined;
  getFilteredProducts: () => Product[];
  getCategories: () => string[];
  getTotalProducts: () => number;
}

export const useCatalogueStore = create<CatalogueState>((set, get) => {
  // Cargar productos desde MMKV al iniciar
  const loadedProducts = storage.getString('products');
  const initialProducts: Product[] = loadedProducts ? JSON.parse(loadedProducts) : [];

  return {
    products: initialProducts,
    searchQuery: '',
    selectedCategory: null,

    setProducts: (products) => {
      storage.set('products', JSON.stringify(products));
      set({ products });
    },

    mergeProducts: (incoming) => {
      if (!incoming?.length) return;
      const current = get().products;
      const keyOf = (p: any) => `${p.id ?? p.id_producto ?? ''}_${p.id_bodega ?? ''}`;
      const map = new Map<string, any>();
      current.forEach((p) => map.set(keyOf(p), p));
      incoming.forEach((p) => map.set(keyOf(p), p));
      const merged = Array.from(map.values());
      storage.set('products', JSON.stringify(merged));
      set({ products: merged });
    },

    addProduct: (product) => {
      const newProducts = [...get().products, product];
      storage.set('products', JSON.stringify(newProducts));
      set({ products: newProducts });
    },

    updateProduct: (id, updates) => {
      const newProducts = get().products.map((product) =>
        product.id === id ? { ...product, ...updates } : product
      );
      storage.set('products', JSON.stringify(newProducts));
      set({ products: newProducts });
    },

    removeProduct: (id) => {
      const newProducts = get().products.filter((product) => product.id !== id);
      storage.set('products', JSON.stringify(newProducts));
      set({ products: newProducts });
    },

    setSearchQuery: (query) => {
      set({ searchQuery: query });
    },

    setSelectedCategory: (category) => {
      set({ selectedCategory: category });
    },

    clearCatalogue: () => {
      storage.delete('products');
      set({ products: [], searchQuery: '', selectedCategory: null });
    },

    // Helpers
    getProductById: (id) => {
      return get().products.find((product) => product.id === id);
    },

    getProductByCode: (code) => {
      return get().products.find((product) => product.code === code);
    },

    getFilteredProducts: () => {
      const { products, searchQuery, selectedCategory } = get();
      
      let filtered = products;

      // Filtrar por categoría
      if (selectedCategory) {
        filtered = filtered.filter((product) => product.category === selectedCategory);
      }

      // Filtrar por búsqueda
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(
          (product) =>
            product.name.toLowerCase().includes(query) ||
            product.code?.toLowerCase().includes(query) ||
            product.description?.toLowerCase().includes(query)
        );
      }

      return filtered;
    },

    getCategories: () => {
      const categories = new Set(
        get().products
          .filter((product) => product.category)
          .map((product) => product.category!)
      );
      return Array.from(categories).sort();
    },

    getTotalProducts: () => {
      return get().products.length;
    },
  };
});
