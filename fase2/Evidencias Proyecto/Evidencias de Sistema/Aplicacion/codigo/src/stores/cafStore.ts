import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';
import type { CAFData } from '../services/api';

// Almacenamiento persistente
const storage = new MMKV({ id: 'caf-storage' });

interface CAFState {
  // Estado
  cafs: CAFData[];
  
  // Acciones
  setCAFs: (cafs: CAFData[]) => void;
  getActiveCaf: (documentTypeId: number) => CAFData | null;
  getNextFolio: (documentTypeId: number) => number | null;
  incrementFolio: (cafId: number) => void;
  clearCAFs: () => void;
  
  // Helpers
  hasAvailableFolios: (documentTypeId: number) => boolean;
  getRemainingFolios: (documentTypeId: number) => number;
  initializeCAFs: () => void;
}

export const useCAFStore = create<CAFState>((set, get) => ({
  cafs: [],

  setCAFs: (newCafs) => {
    const { cafs: currentCafs } = get();
    
    // Fusionar CAFs nuevos con los existentes para preservar el contador de folios (rango_desde)
    const mergedCafs = newCafs.map(newCaf => {
      const existingCaf = currentCafs.find(c => c.id_ctrl_folio === newCaf.id_ctrl_folio);
      if (existingCaf) {
        // Si ya tenemos este CAF, mantenemos el mayor rango_desde (el progreso local)
        // Esto evita que al recargar desde el servidor se resetee el contador a 1
        return {
          ...newCaf,
          rango_desde: Math.max(existingCaf.rango_desde, newCaf.rango_desde)
        };
      }
      return newCaf;
    });

    storage.set('cafs', JSON.stringify(mergedCafs));
    set({ cafs: mergedCafs });
  },

  getActiveCaf: (documentTypeId) => {
    const { cafs } = get();
    // Buscar el primer CAF activo para el tipo de documento que aún tenga folios disponibles
    const activeCaf = cafs.find(
      (c) => c.id_td === documentTypeId && c.activo && c.rango_desde <= c.rango_hasta
    );
    return activeCaf || null;
  },

  getNextFolio: (documentTypeId) => {
    const activeCaf = get().getActiveCaf(documentTypeId);
    if (!activeCaf) {
      return null;
    }
    return activeCaf.rango_desde;
  },

  incrementFolio: (cafId) => {
    const { cafs } = get();
    const updatedCafs = cafs.map((caf) => {
      if (caf.id_ctrl_folio === cafId) {
        return {
          ...caf,
          rango_desde: caf.rango_desde + 1,
        };
      }
      return caf;
    });
    get().setCAFs(updatedCafs);
  },

  clearCAFs: () => {
    storage.delete('cafs');
    set({ cafs: [] });
  },

  hasAvailableFolios: (documentTypeId) => {
    const activeCaf = get().getActiveCaf(documentTypeId);
    return activeCaf !== null && activeCaf.rango_desde <= activeCaf.rango_hasta;
  },

  getRemainingFolios: (documentTypeId) => {
    const activeCaf = get().getActiveCaf(documentTypeId);
    if (!activeCaf) {
      return 0;
    }
    return Math.max(0, activeCaf.rango_hasta - activeCaf.rango_desde + 1);
  },

  initializeCAFs: () => {
    const cafsJson = storage.getString('cafs');
    if (cafsJson) {
      try {
        const cafs = JSON.parse(cafsJson) as CAFData[];
        set({ cafs });
      } catch (error) {
        console.error('[cafStore] Error al cargar CAFs guardados:', error);
      }
    }
  },
}));

// Inicializar automáticamente al cargar el módulo
useCAFStore.getState().initializeCAFs();
