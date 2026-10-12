import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';
import { Client } from '../types';

// Almacenamiento persistente
const storage = new MMKV({ id: 'clients-storage' });

interface ClientsState {
  // Estado
  clients: Client[];
  selectedClient: Client | null;
  searchQuery: string;
  
  // Acciones
  setClients: (clients: Client[]) => void;
  addClient: (client: Client) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  removeClient: (id: string) => void;
  setSelectedClient: (client: Client | null) => void;
  setSearchQuery: (query: string) => void;
  clearClients: () => void;
  clearSelectedClient: () => void;
  
  // Helpers
  getClientById: (id: string) => Client | undefined;
  getClientByRut: (rut: string) => Client | undefined;
  getFilteredClients: () => Client[];
  getTotalClients: () => number;
}

export const useClientsStore = create<ClientsState>((set, get) => {
  // Cargar clientes desde MMKV al iniciar
  const loadedClients = storage.getString('clients');
  const initialClients: Client[] = loadedClients ? JSON.parse(loadedClients) : [];

  return {
    clients: initialClients,
    selectedClient: null,
    searchQuery: '',

    setClients: (clients) => {
      storage.set('clients', JSON.stringify(clients));
      set({ clients });
    },

    addClient: (client) => {
      const newClients = [...get().clients, client];
      storage.set('clients', JSON.stringify(newClients));
      set({ clients: newClients });
    },

    updateClient: (id, updates) => {
      const newClients = get().clients.map((client) =>
        client.id === id ? { ...client, ...updates } : client
      );
      storage.set('clients', JSON.stringify(newClients));
      
      // Actualizar también selectedClient si es el mismo
      const selectedClient = get().selectedClient;
      if (selectedClient && selectedClient.id === id) {
        set({ 
          clients: newClients, 
          selectedClient: { ...selectedClient, ...updates } 
        });
      } else {
        set({ clients: newClients });
      }
    },

    removeClient: (id) => {
      const newClients = get().clients.filter((client) => client.id !== id);
      storage.set('clients', JSON.stringify(newClients));
      
      // Limpiar selectedClient si es el que se eliminó
      const selectedClient = get().selectedClient;
      if (selectedClient && selectedClient.id === id) {
        set({ clients: newClients, selectedClient: null });
      } else {
        set({ clients: newClients });
      }
    },

    setSelectedClient: (client) => {
      set({ selectedClient: client });
    },

    setSearchQuery: (query) => {
      set({ searchQuery: query });
    },

    clearClients: () => {
      storage.delete('clients');
      set({ clients: [], selectedClient: null, searchQuery: '' });
    },

    clearSelectedClient: () => {
      set({ selectedClient: null });
    },

    // Helpers
    getClientById: (id) => {
      return get().clients.find((client) => client.id === id);
    },

    getClientByRut: (rut) => {
      // Normalizar RUT (remover puntos y guión)
      const normalizedRut = rut.replace(/[.-]/g, '');
      return get().clients.find((client) => {
        const clientRut = client.rut.replace(/[.-]/g, '');
        return clientRut === normalizedRut;
      });
    },

    getFilteredClients: () => {
      const { clients, searchQuery } = get();
      
      if (!searchQuery.trim()) {
        return clients;
      }

      const query = searchQuery.toLowerCase().trim();
      return clients.filter(
        (client) =>
          client.name.toLowerCase().includes(query) ||
          client.rut.includes(query) ||
          client.email?.toLowerCase().includes(query) ||
          client.phone?.includes(query) ||
          client.address?.toLowerCase().includes(query)
      );
    },

    getTotalClients: () => {
      return get().clients.length;
    },
  };
});
