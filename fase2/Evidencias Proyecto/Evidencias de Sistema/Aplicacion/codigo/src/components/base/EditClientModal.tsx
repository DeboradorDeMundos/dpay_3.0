import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Modal, FlatList, Dimensions, TextInput } from 'react-native';
import AppModal from './AppModal';
import { Input } from './Input';
import { useThemeColors } from '../../hooks/useThemeColors';
import { typography, spacing, borderRadius } from '../../theme';
import { colors as oldColors } from '../../styles/globalStyles';
import { getRegiones, getProvinciasPorRegion, getComunasPorProvincia, getClientById, getRegionProvinciaFromComuna, type Region, type Provincia, type Comuna } from '../../services/api';
import { apiClient } from '../../services/apiClient';
import type { Client } from '../../types/common';
import { useAuthStore } from '../../stores/authStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Componente Select (reutilizado del CreateClientModal)
interface SelectOption {
  label: string;
  value: number | string;
}

interface SelectProps {
  label: string;
  value: number | string | null;
  options: SelectOption[];
  onSelect: (value: number | string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  required?: boolean;
}

const Select: React.FC<SelectProps> = ({ label, value, options, onSelect, placeholder, disabled, error, required }) => {
  const themeColors = useThemeColors();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  
  const selectedOption = options.find(opt => opt.value === value);
  
  // Filtrar opciones según el texto de búsqueda
  const filteredOptions = searchText.trim() === ''
    ? options
    : options.filter(opt => 
        opt.label.toLowerCase().includes(searchText.toLowerCase())
      );
  
  // Debug: Log para ver qué está pasando
  useEffect(() => {
    if (value) {
      console.log(`[Select ${label}] Value:`, value, typeof value);
      console.log(`[Select ${label}] Options:`, options.length, options.map(o => ({ v: o.value, t: typeof o.value })));
      console.log(`[Select ${label}] Selected:`, selectedOption?.label || 'NO ENCONTRADO');
    }
  }, [value, options, label]);
  
  const handleSelectOption = (optionValue: number | string) => {
    onSelect(optionValue);
    setModalVisible(false);
    setSearchText(''); // Limpiar búsqueda después de seleccionar
  };
  
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.asterisk}> *</Text>}
      </Text>
      <TouchableOpacity
        style={[
          styles.selectButton,
          error && styles.selectButtonError,
          disabled && styles.selectButtonDisabled,
        ]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
      >
        <Text style={[
          styles.selectButtonText,
          { color: selectedOption ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)' }
        ]}>
          {selectedOption ? selectedOption.label : placeholder || 'Seleccionar...'}
        </Text>
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setModalVisible(false);
          setSearchText('');
        }}
      >
        <TouchableOpacity
          style={styles.selectModalOverlay}
          activeOpacity={1}
          onPress={() => {
            setModalVisible(false);
            setSearchText('');
          }}
        >
          <TouchableOpacity activeOpacity={1} style={styles.selectModalWrapper}>
            <View style={[styles.selectModalContent, { backgroundColor: themeColors.isDark ? '#1a2a4a' : '#FFFFFF' }]}>
              <Text style={[styles.selectModalTitle, { color: themeColors.secondary }]}>{label}</Text>
              
              {/* Input de búsqueda */}
              <TextInput
                style={[
                  styles.selectSearchInput,
                  { 
                    backgroundColor: themeColors.isDark ? '#253d5c' : '#f5f5f5',
                    color: themeColors.text,
                    borderColor: searchText.length > 0 ? '#75bebf' : 'rgba(117, 190, 191, 0.3)',
                  }
                ]}
                placeholder="Buscar..."
                placeholderTextColor={themeColors.textSecondary}
                value={searchText}
                onChangeText={setSearchText}
                autoCapitalize="none"
              />
              
              {/* Contador de resultados */}
              {searchText.length > 0 && (
                <Text style={[styles.selectSearchResults, { color: themeColors.textSecondary }]}>
                  {filteredOptions.length} resultado{filteredOptions.length !== 1 ? 's' : ''}
                </Text>
              )}
              
              <View style={styles.selectListContainer}>
                {filteredOptions.length === 0 ? (
                  <View style={styles.selectEmptyContainer}>
                    <Text style={[styles.selectEmptyText, { color: themeColors.textSecondary }]}>
                      {searchText.length > 0 
                        ? 'No se encontraron resultados'
                        : 'No hay opciones disponibles'
                      }
                    </Text>
                  </View>
                ) : (
                  <FlatList<SelectOption>
                    data={filteredOptions}
                    keyExtractor={(item: SelectOption, index: number) => String(item.value || index)}
                    renderItem={({ item, index }: { item: SelectOption; index: number }) => (
                      <TouchableOpacity
                        style={[
                          styles.selectOption,
                          { 
                            borderBottomWidth: 1,
                            borderBottomColor: item.value === value ? 'rgba(117, 190, 191, 0.4)' : 'rgba(117, 190, 191, 0.2)',
                          },
                          item.value === value && { 
                            backgroundColor: '#75bebf',
                          }
                        ]}
                        onPress={() => handleSelectOption(item.value)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.selectOptionContent}>
                          <Text style={[
                            styles.selectOptionText,
                            { color: item.value === value ? '#FFFFFF' : themeColors.text },
                            item.value === value && { fontWeight: 'bold' }
                          ]}>
                            {item.label}
                          </Text>
                          {item.value === value && (
                            <View style={styles.selectCheckmark}>
                              <Text style={styles.selectCheckmarkText}>✓</Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    )}
                    scrollEnabled={true}
                    scrollEventThrottle={16}
                    showsVerticalScrollIndicator={true}
                    bounces={false}
                    nestedScrollEnabled={true}
                  />
                )}
              </View>
              <TouchableOpacity
                style={styles.selectCloseButton}
                onPress={() => {
                  setModalVisible(false);
                  setSearchText('');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.selectCloseButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

interface EditClientModalProps {
  visible: boolean;
  client: Client | null;
  onClose: () => void;
  onSuccess: (clientData: any) => void;
  onUpdateClient: (clientId: string, clientData: any) => Promise<void>;
}

const validateRutFormat = (rut: string): boolean => {
  if (!rut) return false;
  const cleanRut = rut.replace(/\./g, '').replace(/-/g, '');
  if (cleanRut.length < 8) return false;
  const lastChar = cleanRut.slice(-1).toUpperCase();
  if (!/^[0-9K]$/.test(lastChar)) return false;
  const digits = cleanRut.slice(0, -1);
  if (!/^\d+$/.test(digits)) return false;
  return true;
};

const formatRut = (rut: string): string => {
  if (!rut) return '';
  let cleanRut = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1);
  let formattedBody = '';
  for (let i = body.length - 1, count = 0; i >= 0; i--, count++) {
    if (count > 0 && count % 3 === 0) {
      formattedBody = '.' + formattedBody;
    }
    formattedBody = body[i] + formattedBody;
  }
  return `${formattedBody}-${dv}`;
};

const formatPhone = (phone: string): string => {
  if (!phone) return '';
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('56')) {
    cleaned = cleaned.substring(2);
  }
  if (cleaned.length > 9) {
    cleaned = cleaned.substring(0, 9);
  }
  if (cleaned.length > 0) {
    return `+56${cleaned}`;
  }
  return '';
};

export const EditClientModal: React.FC<EditClientModalProps> = ({
  visible,
  client,
  onClose,
  onSuccess,
  onUpdateClient,
}) => {
  const themeColors = useThemeColors();
  const user = useAuthStore((state) => state.user);
  
  const [formData, setFormData] = useState({
    rut: '',
    razon: '',
    giro: '',
    email: '',
    telefono: '',
    direccion: '',
    id_region: null as number | null,
    id_provincia: null as number | null,
    id_comuna: null as number | null,
  });
  
  const [regiones, setRegiones] = useState<Region[]>([]);
  const [provincias, setProvincias] = useState<Provincia[]>([]);
  const [comunas, setComunas] = useState<Comuna[]>([]);
  const [loadingRegiones, setLoadingRegiones] = useState(false);
  const [loadingClientData, setLoadingClientData] = useState(false);
  const [clientData, setClientData] = useState<Client | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  // Cargar regiones al abrir el modal
  useEffect(() => {
    if (visible) {
      loadRegiones();
    }
  }, [visible]);

  // Cargar datos completos del cliente desde el backend cuando se abre el modal
  useEffect(() => {
    const loadClientData = async () => {
      if (client && visible && user?.empresa?.rut) {
        setLoadingClientData(true);
        setLoadError(null);
        try {
          console.log('[EditClientModal] Cargando datos completos del cliente:', client.id);
          const fullClientData = await getClientById(String(client.id), user.empresa.rut);
          console.log('[EditClientModal] Datos completos recibidos:', fullClientData);
          console.log('[EditClientModal] IDs geográficos:', {
            id_region: fullClientData.id_region,
            tipo: typeof fullClientData.id_region,
            id_provincia: fullClientData.id_provincia,
            id_comuna: fullClientData.id_comuna,
          });
          setClientData(fullClientData);
        } catch (error) {
          console.error('[EditClientModal] Error al cargar datos del cliente:', error);
          const errorMessage = error instanceof Error ? error.message : 'Error al cargar datos del cliente';
          setLoadError(errorMessage);
          setShowErrorModal(true);
        } finally {
          setLoadingClientData(false);
        }
      }
    };

    loadClientData();
  }, [client, visible, user]);

  // Cargar datos del cliente en el formulario cuando clientData esté disponible
  useEffect(() => {
    const loadClientFormData = async () => {
      if (clientData && visible) {
        console.log('[EditClientModal] Cargando datos en formulario:', clientData);
        
        setFormData({
          rut: clientData.rut || '',
          razon: clientData.name || '',
          giro: clientData.giro || '',
          email: clientData.email || '',
          telefono: clientData.phone || '',
          direccion: clientData.address || '',
          id_region: clientData.id_region || null,
          id_provincia: clientData.id_provincia || null,
          id_comuna: clientData.id_comuna || null,
        });

        // Cargar todas las comunas
        if (!comunas || comunas.length === 0) {
          loadAllComunas();
        }

        // Si el cliente tiene región y provincia, cargar las provincias de esa región
        if (clientData.id_region) {
          console.log('[EditClientModal] Cargando provincias para región:', clientData.id_region);
          await loadProvinciasPorRegion(clientData.id_region);
        }
      }
    };

    loadClientFormData();
  }, [clientData, visible]);

  const loadAllComunas = async () => {
    try {
      const response = await apiClient('/cotizador/comunas', {
        method: 'GET',
        requiresAuth: false,
      });
      const data = await response.json();
      const loaded = Array.isArray(data) ? data : (data.data || data.comunas || []);
      console.log('[EditClientModal] Todas las comunas cargadas:', loaded.length);
      setComunas(loaded);
    } catch (error) {
      console.error('Error al cargar comunas:', error);
    }
  };

  const loadRegiones = async () => {
    setLoadingRegiones(true);
    try {
      const data = await getRegiones();
      setRegiones(data);
    } catch (error) {
      console.error('Error al cargar regiones:', error);
    } finally {
      setLoadingRegiones(false);
    }
  };

  const loadProvinciasPorRegion = async (idRegion: number) => {
    try {
      console.log('[EditClientModal] Solicitando provincias para región:', idRegion);
      const data = await getProvinciasPorRegion(idRegion);
      console.log('[EditClientModal] Provincias recibidas:', data.length, data);
      setProvincias(data);
    } catch (error) {
      console.error('Error al cargar provincias:', error);
    }
  };

  const loadComunasPorProvincia = async (idProvincia: number) => {
    try {
      console.log('[EditClientModal] Solicitando comunas para provincia:', idProvincia);
      const data = await getComunasPorProvincia(idProvincia);
      console.log('[EditClientModal] Comunas recibidas:', data.length, data);
      setComunas(data);
    } catch (error) {
      console.error('Error al cargar comunas:', error);
    }
  };

  const handleComunaChange = async (comunaId: number | string) => {
    const id = Number(comunaId);
    setFormData({ ...formData, id_comuna: id });
    if (errors.comuna) {
      setErrors({ ...errors, comuna: '' });
    }

    // Obtener región y provincia desde la comuna seleccionada
    try {
      const response = await getRegionProvinciaFromComuna(id);
      if (response) {
        const regionId = Number(response.id_region);
        const provinciaId = Number(response.id_provincia);
        
        setFormData(prev => ({ 
          ...prev, 
          id_region: regionId,
          id_provincia: provinciaId,
          id_comuna: id,
        }));
        
        // Cargar las provincias de la región obtenida
        try {
          const provData = await getProvinciasPorRegion(regionId);
          setProvincias(provData);
          console.log('[EditClientModal] Provincias cargadas:', provData);
        } catch (error) {
          console.error('[EditClientModal] Error al cargar provincias:', error);
        }
        
        if (errors.region || errors.provincia || errors.comuna) {
          setErrors({ ...errors, region: '', provincia: '', comuna: '' });
        }

        console.log('[EditClientModal] Región y provincia autocargadas desde comuna:', { regionId, provinciaId });
      }
    } catch (error) {
      console.error('[EditClientModal] Error al obtener región/provincia desde comuna:', error);
    }
  };

  const handleRegionChange = async (regionId: number | string) => {
    const id = Number(regionId);
    setFormData({
      ...formData,
      id_region: id,
      id_provincia: null,
      id_comuna: null,
    });
    if (errors.region) {
      setErrors({ ...errors, region: '', provincia: '', comuna: '' });
    }
    setProvincias([]);
    setComunas([]);
    
    try {
      const data = await getProvinciasPorRegion(id);
      setProvincias(data);
    } catch (error) {
      console.error('Error al cargar provincias:', error);
    }
  };

  const handleProvinciaChange = async (provinciaId: number | string) => {
    const id = Number(provinciaId);
    setFormData({
      ...formData,
      id_provincia: id,
      id_comuna: null,
    });
    if (errors.provincia) {
      setErrors({ ...errors, provincia: '', comuna: '' });
    }
    setComunas([]);
    
    try {
      const data = await getComunasPorProvincia(id);
      setComunas(data);
    } catch (error) {
      console.error('Error al cargar comunas:', error);
    }
  };

  const handleRutChange = (value: string) => {
    const cleaned = value.replace(/[^0-9Kk.\-]/g, '');
    setFormData({ ...formData, rut: cleaned });
    if (errors.rut) {
      setErrors({ ...errors, rut: '' });
    }
  };

  const handleRutBlur = () => {
    if (formData.rut && formData.rut.length >= 8) {
      const formatted = formatRut(formData.rut);
      setFormData({ ...formData, rut: formatted });
    }
  };

  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/[^0-9+\s]/g, '');
    setFormData({ ...formData, telefono: cleaned });
    if (errors.telefono) {
      setErrors({ ...errors, telefono: '' });
    }
  };

  const handlePhoneBlur = () => {
    if (formData.telefono) {
      const formatted = formatPhone(formData.telefono);
      setFormData({ ...formData, telefono: formatted });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.rut.trim()) {
      newErrors.rut = 'RUT es obligatorio';
    } else if (!validateRutFormat(formData.rut)) {
      newErrors.rut = 'Formato de RUT inválido';
    }
    
    if (!formData.razon.trim()) {
      newErrors.razon = 'Razón social es obligatoria';
    }
    
    if (!formData.id_region) {
      newErrors.region = 'Región es obligatoria';
    }
    
    if (!formData.id_provincia) {
      newErrors.provincia = 'Provincia es obligatoria';
    }
    
    if (!formData.id_comuna) {
      newErrors.comuna = 'Comuna es obligatoria';
    }
    
    // Email obligatorio y debe ser válido
    if (!formData.email.trim()) {
      newErrors.email = 'Email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    // Dirección obligatoria
    if (!formData.direccion.trim()) {
      newErrors.direccion = 'Dirección es obligatoria';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !client) return;
    
    setLoading(true);
    try {
      const updateData: any = {
        rut: formData.rut.replace(/\./g, '').toUpperCase(),
        razon: formData.razon.trim(),
      };
      
      if (formData.id_region) {
        updateData.id_region = formData.id_region;
      }
      if (formData.id_provincia) {
        updateData.id_provincia = formData.id_provincia;
      }
      if (formData.id_comuna) {
        updateData.id_comuna = formData.id_comuna;
      }
      
      if (formData.giro.trim()) {
        updateData.giro = formData.giro.trim();
      }
      if (formData.email.trim()) {
        updateData.email = formData.email.trim();
      }
      if (formData.telefono.trim()) {
        let phoneDigits = formData.telefono.replace(/[^0-9]/g, '');
        if (phoneDigits.startsWith('56')) {
          phoneDigits = phoneDigits.substring(2);
        }
        updateData.telefono = phoneDigits;
      }
      if (formData.direccion.trim()) {
        updateData.direccion = formData.direccion.trim();
      }
      
      await onUpdateClient(client.id, updateData);
      
      onSuccess(formData);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setShowErrorModal(false);
    // Forzar recarga
    if (client && user?.empresa?.rut) {
      setLoadingClientData(true);
      setLoadError(null);
      getClientById(String(client.id), user.empresa.rut)
        .then(fullClientData => {
          setClientData(fullClientData);
        })
        .catch(error => {
          const errorMessage = error instanceof Error ? error.message : 'Error al cargar datos del cliente';
          setLoadError(errorMessage);
          setShowErrorModal(true);
        })
        .finally(() => {
          setLoadingClientData(false);
        });
    }
  };

  const handleCancelError = () => {
    setShowErrorModal(false);
    onClose();
  };

  const handleCancel = () => {
    setErrors({});
    setClientData(null);
    setProvincias([]);
    setComunas([]);
    setLoadError(null);
    setShowErrorModal(false);
    onClose();
  };

  if (!client) return null;

  return (
    <>
      <AppModal
        visible={visible}
        title="Editar Cliente"
        onClose={handleCancel}
        maxWidth={450}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {loadingClientData ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#75bebf" />
              <Text style={styles.loadingText}>Cargando datos del cliente...</Text>
            </View>
          ) : (
          <View style={styles.formContainer}>
          <Input
            label="RUT *"
            value={formData.rut}
            onChangeText={handleRutChange}
            onBlur={handleRutBlur}
            placeholder="12.345.678-9"
            error={errors.rut}
            autoCapitalize="characters"
            maxLength={12}
            editable={!loading}
          />

          <Input
            label="Razón Social / Nombre *"
            value={formData.razon}
            onChangeText={(value: string) => {
              setFormData({ ...formData, razon: value });
              if (errors.razon) setErrors({ ...errors, razon: '' });
            }}
            placeholder="Nombre del cliente"
            error={errors.razon}
            autoCapitalize="words"
            editable={!loading}
          />

          <Input
            label="Giro *"
            value={formData.giro}
            onChangeText={(value: string) => setFormData({ ...formData, giro: value })}
            placeholder="Actividad comercial"
            autoCapitalize="sentences"
            editable={!loading}
          />

          <Select
            label="Comuna *"
            value={formData.id_comuna}
            options={comunas.map(c => ({ 
              label: c.nombre_comuna || c.nombre || c.comuna || 'Comuna sin nombre', 
              value: Number(c.id_comuna || c.id)
            }))}
            onSelect={handleComunaChange}
            placeholder="Selecciona una comuna"
            error={errors.comuna}
            disabled={loading || comunas.length === 0}
            required
          />

          <Select
            label="Provincia"
            value={formData.id_provincia}
            options={provincias.map(p => ({ 
              label: p.nombre_provincia || p.nombre || p.provincia || 'Provincia sin nombre', 
              value: Number(p.id_provincia || p.id)
            }))}
            onSelect={handleProvinciaChange}
            placeholder="Autollenado desde la comuna"
            error={errors.provincia}
            disabled={true}
          />

          <Select
            label="Región"
            value={formData.id_region}
            options={regiones.map(r => ({ 
              label: r.nombre_region || r.nombre || r.region || 'Región sin nombre', 
              value: Number(r.id_region || r.id)
            }))}
            onSelect={handleRegionChange}
            placeholder="Autollenado desde la comuna"
            error={errors.region}
            disabled={true}
          />

          <Input
            label="Dirección *"
            value={formData.direccion}
            onChangeText={(value: string) => {
              setFormData({ ...formData, direccion: value });
              if (errors.direccion) setErrors({ ...errors, direccion: '' });
            }}
            placeholder="Calle, número, comuna"
            error={errors.direccion}
            autoCapitalize="words"
            editable={!loading}
          />

          <Input
            label="Email *"
            value={formData.email}
            onChangeText={(value: string) => {
              setFormData({ ...formData, email: value });
              if (errors.email) setErrors({ ...errors, email: '' });
            }}
            placeholder="correo@ejemplo.cl"
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />

          <Input
            label="Teléfono"
            value={formData.telefono}
            onChangeText={handlePhoneChange}
            onBlur={handlePhoneBlur}
            placeholder="+56912345678"
            keyboardType="phone-pad"
            editable={!loading}
          />

          <Text style={[styles.requiredNote, { color: themeColors.textSecondary }]}>
            <Text style={{ color: '#ff4444', fontWeight: 'bold' }}>*</Text> <Text style={{ color: '#d4186e' }}>Campos obligatorios</Text>
          </Text>
        </View>
        )}
      </ScrollView>

        <View style={styles.buttonsContainer}>
          <View style={styles.buttonRow}>
            <View style={styles.buttonWrapper}>
              <View
                style={[
                  styles.button,
                  styles.buttonSecondary,
                  (loading || loadingClientData) && styles.buttonDisabled,
                ]}
              >
                <TouchableOpacity
                  onPress={handleCancel}
                  disabled={loading || loadingClientData}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.buttonText, styles.buttonSecondaryText]}>
                    Cancelar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.buttonWrapper}>
              <View
                style={[
                  styles.button,
                  styles.buttonPrimary,
                  (loading || loadingClientData) && styles.buttonDisabled,
                ]}
              >
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={loading || loadingClientData}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.buttonText, styles.buttonPrimaryText]}>
                      Guardar
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </AppModal>

      {/* Modal de error al cargar datos */}
      <AppModal
        visible={showErrorModal}
        title="Error al cargar cliente"
        message={loadError || 'No se pudieron cargar los datos del cliente. ¿Desea reintentar?'}
        buttons={[
          { text: 'Cancelar', onPress: handleCancelError, variant: 'secondary' },
          { text: 'Reintentar', onPress: handleRetry, variant: 'primary' },
        ]}
        onClose={handleCancelError}
      />
    </>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    maxHeight: 500,
  },
  formContainer: {
    paddingTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#75bebf',
    fontFamily: typography.families.normal,
  },
  requiredNote: {
    fontSize: 15,
    fontStyle: 'italic',
    marginTop: 8,
    marginBottom: 16,
  },
  buttonsContainer: {
    marginTop: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonWrapper: {
    flex: 1,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonPrimary: {
    backgroundColor: '#75bebf',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#75bebf',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonPrimaryText: {
    color: '#FFFFFF',
  },
  buttonSecondaryText: {
    color: '#75bebf',
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: '#03C0C3',
    marginBottom: spacing.xs,
  },
  asterisk: {
    color: '#ff4444',
    fontWeight: 'bold',
  },
  selectButton: {
    borderWidth: 1.5,
    borderColor: oldColors.mercury,
    borderRadius: borderRadius.md,
    backgroundColor: '#213d8b',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 48,
    justifyContent: 'center',
  },
  selectButtonError: {
    borderColor: '#ff4444',
  },
  selectButtonDisabled: {
    opacity: 0.5,
  },
  selectButtonText: {
    fontSize: typography.sizes.base,
    color: '#FFFFFF',
  },
  errorText: {
    fontSize: typography.sizes.sm,
    color: '#ff4444',
    marginTop: spacing.xs,
  },
  selectModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectModalWrapper: {
    width: SCREEN_WIDTH - 32,
    maxWidth: 550,
    maxHeight: '90%',
  },
  selectModalContent: {
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#75bebf',
    paddingVertical: 20,
    paddingHorizontal: 20,
    maxHeight: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  selectModalTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  selectSearchInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: spacing.md,
    fontSize: typography.sizes.base,
    fontFamily: typography.families.normal,
  },
  selectSearchResults: {
    fontSize: typography.sizes.sm,
    marginBottom: spacing.sm,
    fontStyle: 'italic',
  },
  selectListContainer: {
    maxHeight: 420,
    flexGrow: 1,
  },
  selectEmptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  selectEmptyText: {
    fontSize: typography.sizes.base,
    fontStyle: 'italic',
  },
  selectOption: {
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  selectOptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectOptionText: {
    fontSize: typography.sizes.base,
    flex: 1,
  },
  selectCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  selectCheckmarkText: {
    color: '#75bebf',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectCloseButton: {
    marginTop: spacing.md,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#75bebf',
    alignItems: 'center',
    marginHorizontal: 0,
  },
  selectCloseButtonText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.base,
    fontWeight: 'bold',
  },
});
