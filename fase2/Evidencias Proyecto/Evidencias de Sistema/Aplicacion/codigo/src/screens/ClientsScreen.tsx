import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StatusBar, SafeAreaView, FlatList, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { useSalesStore } from '../stores/salesStore';
import { useClientsStore } from '../stores/clientsStore';
import { useAlertStore } from '../stores/alertStore';
import { useAuthStore } from '../stores/authStore';
import { SearchInput, EmptyState, BackButton, CreateClientModal, EditClientModal, AppModal } from '../components/base';
import { getClients, createClient, updateClient, type CreateClientData, type UpdateClientData } from '../services/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useThemeColors } from '../hooks/useThemeColors';
import type { Client } from '../types/common';

type Props = NativeStackScreenProps<RootStackParamList, 'Clients'>;

export const ClientsScreen: React.FC<Props> = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const { setClient, client } = useSalesStore();
  const { clients: storeClients, setClients: setStoreClients } = useClientsStore();
  const themeColors = useThemeColors();
  const { showAlert } = useAlertStore();
  const [localClients, setLocalClients] = useState<Client[]>(storeClients);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(
    client?.id || client?.rut || null
  );

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingClient, setPendingClient] = useState<Client | null>(null);
  
  const { user } = useAuthStore();

  useEffect(() => {
    // Cargar clientes del store o de la API
    if (storeClients.length === 0) {
      loadClients();
    } else {
      setLocalClients(storeClients);
    }
  }, []);

  useEffect(() => {
    // Actualizar clientes locales cuando cambia el store
    setLocalClients(storeClients);
  }, [storeClients]);

  const loadClients = async () => {
    setLoading(true);
    try {
      const clientsData = await getClients();
      console.log('[Clients] Clientes cargados:', clientsData.length);
      setStoreClients(clientsData);
      setLocalClients(clientsData);
    } catch (error) {
      console.error('[Clients] Error cargando clientes:', error);
      showAlert('Error', 'No se pudo cargar la lista de clientes');
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = localClients.filter((c) => {
    const nombre = (c as any).nombre || (c as any).razon || c.name || '';
    const rut = (c.rut || '').toLowerCase();
    const term = search.toLowerCase().trim();
    if (!term) return true;
    return rut.includes(term) || nombre.toLowerCase().includes(term);
  });

  const handleSelectClient = (client: Client) => {
    // Mostrar modal de confirmación antes de seleccionar
    setPendingClient(client);
    setShowConfirmModal(true);
  };

  const handleConfirmSelectClient = () => {
    if (!pendingClient) return;
    setSelectedClientId(pendingClient.id || pendingClient.rut);
    setClient(pendingClient);
    setShowConfirmModal(false);
    setPendingClient(null);
    navigation.goBack();
  };

  const handleCancelSelectClient = () => {
    setShowConfirmModal(false);
    setPendingClient(null);
  };

  const handleCreateClient = async (clientData: Omit<CreateClientData, 'rut_empresa'>) => {
    try {
      const rutEmpresa = user?.empresa?.rut;
      if (!rutEmpresa) {
        showAlert('Error', 'No se pudo obtener el RUT de la empresa. Por favor, inicie sesión nuevamente.');
        return;
      }

      // Crear cliente en la API
      await createClient({
        ...clientData,
        rut_empresa: rutEmpresa,
      });

      // Recargar lista de clientes
      await loadClients();

      // Cerrar modal
      setShowCreateModal(false);

      // Mostrar mensaje de éxito
      showAlert('Éxito', 'Cliente creado correctamente');
    } catch (error: any) {
      console.error('[ClientsScreen] Error creando cliente:', error);
      
      // Parsear mensaje de error para mostrar algo amigable al usuario
      let errorMsg = 'No se pudo crear el cliente. Por favor, inténtelo nuevamente.';
      
      if (error.message) {
        let rawMessage = error.message;
        
        // Quitar prefijo "API Error XXX: " del mensaje
        const apiErrorMatch = rawMessage.match(/^API Error \d+:\s*/);
        if (apiErrorMatch) {
          rawMessage = rawMessage.replace(apiErrorMatch[0], '');
        }
        
        // Intentar parsear JSON del backend (formato: {"mensaje":"...", ...})
        try {
          const jsonMatch = rawMessage.match(/\{[^}]*"mensaje"\s*:\s*"([^"]+)"[^}]*\}/);
          if (jsonMatch && jsonMatch[1]) {
            rawMessage = jsonMatch[1];
          }
        } catch (e) {
          // Si no es JSON válido, continuar con rawMessage
        }
        
        // Errores específicos del backend
        if (rawMessage.includes('RUT') && rawMessage.includes('ya se encuentra registrado')) {
          errorMsg = 'El RUT del cliente ya se encuentra registrado en el sistema.';
        } else if (rawMessage.includes('Numero de Identificacion') && rawMessage.includes('ya se encuentra registrado')) {
          errorMsg = 'El número de identificación del cliente ya se encuentra registrado.';
        } else if (rawMessage.includes('SQLSTATE') || rawMessage.includes('sintaxis')) {
          errorMsg = 'Error al procesar los datos. Verifique que todos los campos sean válidos.';
        } else if (rawMessage.includes('Network request failed') || rawMessage.includes('network')) {
          errorMsg = 'Error de conexión. Verifique su conexión a internet.';
        } else if (rawMessage.includes('500')) {
          errorMsg = 'Error del servidor. Por favor, inténtelo nuevamente.';
        } else {
          // Usar mensaje limpio del backend
          errorMsg = rawMessage;
        }
      }
      
      showAlert('Error al crear cliente', errorMsg);
      
      // Propagar el error para que el modal sepa que falló y NO cierre
      throw new Error(errorMsg);
    }
  };

  const handleUpdateClient = async (clientId: string, clientData: Omit<UpdateClientData, 'rut_empresa'>) => {
    try {
      const rutEmpresa = user?.empresa?.rut;
      if (!rutEmpresa) {
        showAlert('Error', 'No se pudo obtener el RUT de la empresa. Por favor, inicie sesión nuevamente.');
        return;
      }

      // Actualizar cliente en la API
      await updateClient(clientId, {
        ...clientData,
        rut_empresa: rutEmpresa,
      });

      // Recargar lista de clientes
      await loadClients();

      // Cerrar modal
      setShowEditModal(false);
      setClientToEdit(null);

      // Mostrar mensaje de éxito
      showAlert('Éxito', 'Cliente actualizado correctamente');
    } catch (error: any) {
      console.error('[ClientsScreen] Error actualizando cliente:', error);
      
      let errorMsg = 'No se pudo actualizar el cliente. Por favor, inténtelo nuevamente.';
      
      if (error.message) {
        let rawMessage = error.message;
        
        const apiErrorMatch = rawMessage.match(/^API Error \d+:\s*/);
        if (apiErrorMatch) {
          rawMessage = rawMessage.replace(apiErrorMatch[0], '');
        }
        
        try {
          const jsonMatch = rawMessage.match(/\{[^}]*"mensaje"\s*:\s*"([^"]+)"[^}]*\}/);
          if (jsonMatch && jsonMatch[1]) {
            rawMessage = jsonMatch[1];
          }
        } catch (e) {
          // Si no es JSON válido, continuar con rawMessage
        }
        
        if (rawMessage.includes('RUT') && rawMessage.includes('activo')) {
          errorMsg = 'Ya existe un cliente activo con este RUT.';
        } else if (rawMessage.includes('SQLSTATE') || rawMessage.includes('sintaxis')) {
          errorMsg = 'Error al procesar los datos. Verifique que todos los campos sean válidos.';
        } else if (rawMessage.includes('Network request failed') || rawMessage.includes('network')) {
          errorMsg = 'Error de conexión. Verifique su conexión a internet.';
        } else if (rawMessage.includes('500')) {
          errorMsg = 'Error del servidor. Por favor, inténtelo nuevamente.';
        } else {
          errorMsg = rawMessage;
        }
      }
      
      showAlert('Error al actualizar cliente', errorMsg);
      throw new Error(errorMsg);
    }
  };

  const handleEditClient = (client: Client) => {
    setClientToEdit(client);
    setShowEditModal(true);
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setClientToEdit(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.background, padding: 20 }}>
      {/* --- Modal de Confirmación de Selección --- */}
      <AppModal
        visible={showConfirmModal}
        title="Seleccionar cliente"
        message={`¿Desea seleccionar al cliente ${(pendingClient as any)?.nombre || (pendingClient as any)?.razon || pendingClient?.name || ''}?`}
        buttons={[
          { text: 'No', onPress: handleCancelSelectClient, variant: 'primary' },
          { text: 'Sí', onPress: handleConfirmSelectClient, variant: 'secondary' },
        ]}
        onClose={handleCancelSelectClient}
      />

      {/* --- Modal de Crear Cliente --- */}
      <CreateClientModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
        onCreateClient={handleCreateClient}
      />

      {/* --- Modal de Editar Cliente --- */}
      <EditClientModal
        visible={showEditModal}
        client={clientToEdit}
        onClose={() => {
          setShowEditModal(false);
          setClientToEdit(null);
        }}
        onSuccess={handleEditSuccess}
        onUpdateClient={handleUpdateClient}
      />

      <StatusBar
        barStyle={themeColors.background === '#FFFFFF' ? 'dark-content' : 'light-content'}
        backgroundColor={themeColors.background}
      />
      <SafeAreaView />

      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: '#03C0C3',
            marginRight: 12,
          }}>CLIENTES</Text>
          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            activeOpacity={0.75}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Agregar cliente"
            style={{
              minWidth: 48,
              minHeight: 48,
              borderRadius: 24,
              borderWidth: 2,
              borderColor: '#d4186e',
              backgroundColor: themeColors.background,
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: 10,
              flexDirection: 'row',
            }}
          >
            <Image
              source={require('../../assets/icons_new/icono_usuario.png')}
              style={{ width: 26, height: 26, tintColor: '#d4186e' }}
              resizeMode="contain"
            />
            <View
              pointerEvents="none"
              style={{
                marginLeft: 4,
                backgroundColor: '#d4186e',
                width: 20,
                height: 20,
                borderRadius: 10,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', lineHeight: 16 }}>+</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
        <SearchInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por RUT o nombre..."
        />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={themeColors.primary} />
        </View>
      ) : filteredClients.length === 0 ? (
        <EmptyState
          icon="👥"
          title="Sin resultados"
          message={search ? 'No se encontraron clientes' : 'No hay clientes disponibles'}
        />
      ) : (
        <FlatList
          data={filteredClients}
          keyExtractor={(item) => item.id || item.rut}
          contentContainerStyle={{ paddingTop: 16, paddingHorizontal: 16 }}
          renderItem={({ item }) => {
            // La API puede devolver campos en español o inglés
            const nombre = (item as any).nombre || (item as any).razon || item.name || 'Sin nombre';
            const direccion = (item as any).direccion || item.address || '';
            const isSelected = selectedClientId === (item.id || item.rut);

            return (
              <View style={{ marginBottom: 17, position: 'relative' }}>
                {/* Botón Editar - estilo igual al de Anular */}
                <TouchableOpacity
                  onPress={() => handleEditClient(item)}
                  style={{
                    position: 'absolute',
                    top: -10,
                    right: 0,
                    zIndex: 10,
                    backgroundColor: '#FFFFFF',
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    borderRadius: 15,
                    borderWidth: 1,
                    borderColor: '#d4186e',
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#d4186e', fontSize: 12, fontWeight: 'bold' }}>Editar</Text>
                </TouchableOpacity>

                <Pressable
                  onPress={() => handleSelectClient(item)}
                  style={{
                    backgroundColor: isSelected ? '#d4186e' : '#FFFFFF',
                    borderWidth: 2,
                    borderColor: '#d4186e',
                    borderRadius: 12,
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}>
                  <Image
                    source={require('../../assets/icons_new/icono_usuario.png')}
                    style={{ width: 50, height: 50, tintColor: isSelected ? '#FFFFFF' : '#d4186e', marginRight: 15 }}
                    resizeMode="contain"
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4, color: isSelected ? '#FFFFFF' : '#d4186e' }}>
                      {nombre.toUpperCase()}
                    </Text>
                    <Text style={{ fontSize: 13, color: isSelected ? '#FFFFFF' : '#d4186e', marginBottom: 2 }}>
                      RUT: {(item.rut || '—').toLowerCase()}
                    </Text>
                    {item.email && (
                      <Text style={{ fontSize: 13, color: isSelected ? '#FFFFFF' : '#d4186e' }}>{item.email.toLowerCase()}</Text>
                    )}
                    {direccion && (
                      <Text style={{ fontSize: 13, color: isSelected ? '#FFFFFF' : '#d4186e' }}>
                        {direccion.toLowerCase()}
                      </Text>
                    )}
                  </View>
                </Pressable>
              </View>
            );
          }}
        />
      )}
    </View>
  );
};
