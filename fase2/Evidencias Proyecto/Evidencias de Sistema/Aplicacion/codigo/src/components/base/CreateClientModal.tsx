import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Modal, FlatList, Dimensions, TextInput } from 'react-native';
import AppModal from './AppModal';
import { Input } from './Input';
import { useThemeColors } from '../../hooks/useThemeColors';
import { typography, spacing, borderRadius } from '../../theme';
import { colors as oldColors } from '../../styles/globalStyles';
import { getRegiones, getProvinciasPorRegion, getComunasPorProvincia, getRegionProvinciaFromComuna, type Region, type Provincia, type Comuna } from '../../services/api';
import { apiClient } from '../../services/apiClient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Componente Select simple para los selectores
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
                  <FlatList
                    data={filteredOptions}
                    keyExtractor={(item, index) => String(item.value || index)}
                    renderItem={({ item, index }) => (
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

interface CreateClientModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (clientData: any) => void;
  onCreateClient: (clientData: any) => Promise<void>;
}

/**
 * Valida formato de RUT chileno
 * Formato: 12345678-9 o 12.345.678-9
 */
const validateRutFormat = (rut: string): boolean => {
  if (!rut) return false;
  
  // Limpiar puntos y guiones
  const cleanRut = rut.replace(/\./g, '').replace(/-/g, '');
  
  // Debe tener al menos 8 caracteres (7 dígitos + 1 verificador)
  if (cleanRut.length < 8) return false;
  
  // Último caracter debe ser dígito o K
  const lastChar = cleanRut.slice(-1).toUpperCase();
  if (!/^[0-9K]$/.test(lastChar)) return false;
  
  // Resto deben ser números
  const digits = cleanRut.slice(0, -1);
  if (!/^\d+$/.test(digits)) return false;
  
  return true;
};

/**
 * Formatea RUT agregando puntos y guión
 * 12345678-9 -> 12.345.678-9
 */
const formatRut = (rut: string): string => {
  if (!rut) return '';
  
  // Limpiar puntos y guiones
  let cleanRut = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
  
  // Separar cuerpo y dígito verificador
  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1);
  
  // Agregar puntos cada 3 dígitos desde la derecha
  let formattedBody = '';
  for (let i = body.length - 1, count = 0; i >= 0; i--, count++) {
    if (count > 0 && count % 3 === 0) {
      formattedBody = '.' + formattedBody;
    }
    formattedBody = body[i] + formattedBody;
  }
  
  return `${formattedBody}-${dv}`;
};

/**
 * Formatea teléfono chileno con prefijo +56
 * 912345678 -> +56912345678
 */
const formatPhone = (phone: string): string => {
  if (!phone) return '';
  
  // Limpiar todo excepto números
  let cleaned = phone.replace(/[^0-9]/g, '');
  
  // Si empieza con 56, quitarlo temporalmente
  if (cleaned.startsWith('56')) {
    cleaned = cleaned.substring(2);
  }
  
  // Asegurar que tenga solo 9 dígitos (teléfono chileno)
  if (cleaned.length > 9) {
    cleaned = cleaned.substring(0, 9);
  }
  
  // Si tiene contenido, agregar +56
  if (cleaned.length > 0) {
    return `+56${cleaned}`;
  }
  
  return '';
};

export const CreateClientModal: React.FC<CreateClientModalProps> = ({
  visible,
  onClose,
  onSuccess,
  onCreateClient,
}) => {
  const themeColors = useThemeColors();
  
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
  
  // Estados para datos geográficos
  const [regiones, setRegiones] = useState<Region[]>([]);
  const [provincias, setProvincias] = useState<Provincia[]>([]);
  const [comunas, setComunas] = useState<Comuna[]>([]);
  const [loadingRegiones, setLoadingRegiones] = useState(false);
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [loadingComunas, setLoadingComunas] = useState(false);

  // Cargar comunas y regiones al abrir el modal
  useEffect(() => {
    if (visible) {
      loadComunas();
      loadRegiones();
    }
  }, [visible]);

  const loadComunas = async () => {
    try {
      setLoadingComunas(true);
      const response = await apiClient('/cotizador/comunas', {
        method: 'GET',
        requiresAuth: false,
      });
      const data = await response.json();
      const loaded = Array.isArray(data) ? data : (data.data || data.comunas || []);
      console.log('Comunas cargadas:', loaded.length);
      setComunas(loaded);
    } catch (error) {
      console.error('Error al cargar comunas:', error);
    } finally {
      setLoadingComunas(false);
    }
  };

  // Cuando selecciona una comuna, obtener región y provincia automáticamente
  const handleComunaChange = async (comunaId: number | string) => {
    const id = Number(comunaId);
    setFormData({ 
      ...formData, 
      id_comuna: id,
    });
    
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
          console.log('[CreateClientModal] Provincias cargadas:', provData);
        } catch (error) {
          console.error('[CreateClientModal] Error al cargar provincias:', error);
        }
        
        // Limpiar errores geográficos
        if (errors.region || errors.provincia || errors.comuna) {
          setErrors({ ...errors, region: '', provincia: '', comuna: '' });
        }

        console.log('[CreateClientModal] Región y provincia autocargadas desde comuna:', { regionId, provinciaId });
      }
    } catch (error) {
      console.error('[CreateClientModal] Error al obtener región/provincia desde comuna:', error);
    }
  };

  const loadRegiones = async () => {
    try {
      const data = await getRegiones();
      console.log('Regiones cargadas:', data);
      setRegiones(data);
    } catch (error) {
      console.error('Error al cargar regiones:', error);
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
  };

  const handleRutChange = (value: string) => {
    // Permitir solo números, K, puntos y guión
    const cleaned = value.replace(/[^0-9Kk.\-]/g, '');
    setFormData({ ...formData, rut: cleaned });
    
    // Limpiar error si existe
    if (errors.rut) {
      setErrors({ ...errors, rut: '' });
    }
  };

  const handleRutBlur = () => {
    if (formData.rut && formData.rut.length >= 8) {
      // Formatear RUT al salir del campo
      const formatted = formatRut(formData.rut);
      setFormData({ ...formData, rut: formatted });
    }
  };

  const handlePhoneChange = (value: string) => {
    // Permitir solo números, +, y espacios
    const cleaned = value.replace(/[^0-9+\s]/g, '');
    setFormData({ ...formData, telefono: cleaned });
    
    // Limpiar error si existe
    if (errors.telefono) {
      setErrors({ ...errors, telefono: '' });
    }
  };

  const handlePhoneBlur = () => {
    if (formData.telefono) {
      // Formatear teléfono al salir del campo
      const formatted = formatPhone(formData.telefono);
      setFormData({ ...formData, telefono: formatted });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    
    // RUT obligatorio
    if (!formData.rut.trim()) {
      newErrors.rut = 'RUT es obligatorio';
    } else if (!validateRutFormat(formData.rut)) {
      newErrors.rut = 'Formato de RUT inválido';
    }
    
    // Razón social obligatoria
    if (!formData.razon.trim()) {
      newErrors.razon = 'Razón social es obligatoria';
    }
    
    // Región obligatoria
    if (!formData.id_region) {
      newErrors.region = 'Región es obligatoria';
    }
    
    // Provincia obligatoria
    if (!formData.id_provincia) {
      newErrors.provincia = 'Provincia es obligatoria';
    }
    
    // Comuna obligatoria
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
    
    // Teléfono opcional pero debe tener 9 dígitos
    if (formData.telefono) {
      const cleaned = formData.telefono.replace(/[^0-9]/g, '');
      // Si empieza con 56, quitarlo para validar solo los 9 dígitos finales
      const phoneDigits = cleaned.startsWith('56') ? cleaned.substring(2) : cleaned;
      if (phoneDigits.length !== 9) {
        newErrors.telefono = 'Teléfono debe tener 9 dígitos (+56912345678)';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // Preparar datos con IDs geográficos
      const clientData: any = {
        rut: formData.rut.replace(/\./g, '').toUpperCase(), // Enviar sin puntos
        razon: formData.razon.trim(),
      };
      
      // Agregar IDs geográficos si están seleccionados
      if (formData.id_region) {
        clientData.id_region = formData.id_region;
      }
      if (formData.id_provincia) {
        clientData.id_provincia = formData.id_provincia;
      }
      if (formData.id_comuna) {
        clientData.id_comuna = formData.id_comuna;
      }
      
      // Solo agregar campos opcionales si tienen valor
      if (formData.giro.trim()) {
        clientData.giro = formData.giro.trim();
      }
      if (formData.email.trim()) {
        clientData.email = formData.email.trim();
      }
      if (formData.telefono.trim()) {
        // Enviar teléfono sin + ni prefijo 56, solo los 9 dígitos
        let phoneDigits = formData.telefono.replace(/[^0-9]/g, '');
        // Si empieza con 56, quitarlo
        if (phoneDigits.startsWith('56')) {
          phoneDigits = phoneDigits.substring(2);
        }
        clientData.telefono = phoneDigits;
      }
      if (formData.direccion.trim()) {
        clientData.direccion = formData.direccion.trim();
      }
      
      await onCreateClient(clientData);
      
      // Limpiar formulario
      setFormData({
        rut: '',
        razon: '',
        giro: '',
        email: '',
        telefono: '',
        direccion: '',
        id_region: null,
        id_provincia: null,
        id_comuna: null,
      });
      setErrors({});
      setProvincias([]);
      setComunas([]);
      
      onSuccess(formData);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Limpiar formulario y errores
    setFormData({
      rut: '',
      razon: '',
      giro: '',
      email: '',
      telefono: '',
      direccion: '',
      id_region: null,
      id_provincia: null,
      id_comuna: null,
    });
    setErrors({});
    setProvincias([]);
    setComunas([]);
    onClose();
  };

  return (
    <AppModal
      visible={visible}
      title="Crear Nuevo Cliente"
      onClose={handleCancel}
      maxWidth={450}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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

          {/* Selectores geográficos - Comuna primero, autollenado de región/provincia */}
          <Select
            label="Comuna *"
            value={formData.id_comuna}
            options={comunas.map(c => ({ 
              label: c.nombre_comuna || c.nombre || c.comuna || 'Comuna sin nombre', 
              value: Number(c.id_comuna || c.id)
            }))}
            onSelect={handleComunaChange}
            placeholder={loadingComunas ? "Cargando..." : comunas.length > 0 ? "Seleccionar comuna" : "No hay comunas disponibles"}
            disabled={loading || loadingComunas}
            required
            error={errors.comuna}
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
            disabled={true}
            error={errors.provincia}
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
            disabled={true}
            error={errors.region}
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
            error={errors.telefono}
            keyboardType="phone-pad"
            editable={!loading}
            maxLength={15}
          />

          <Text style={[styles.requiredNote, { color: themeColors.textSecondary }]}>
            <Text style={{ color: '#ff4444', fontWeight: 'bold' }}>*</Text> <Text style={{ color: '#d4186e' }}>Campos obligatorios</Text>
          </Text>
        </View>
      </ScrollView>

      <View style={styles.buttonsContainer}>
        <View style={styles.buttonRow}>
          <View style={styles.buttonWrapper}>
            <View
              style={[
                styles.button,
                styles.buttonSecondary,
                loading && styles.buttonDisabled,
              ]}
            >
              <Text
                style={[styles.buttonText, styles.buttonSecondaryText]}
                onPress={loading ? undefined : handleCancel}
              >
                Cancelar
              </Text>
            </View>
          </View>

          <View style={styles.buttonWrapper}>
            <View
              style={[
                styles.button,
                styles.buttonPrimary,
                loading && styles.buttonDisabled,
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text
                  style={[styles.buttonText, styles.buttonPrimaryText]}
                  onPress={handleCreate}
                >
                  Crear Cliente
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    maxHeight: 400,
  },
  formContainer: {
    paddingTop: 10,
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
  // Estilos para Select
  inputContainer: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: '#03C0C3', // Celeste igual que título CLIENTES
    marginBottom: spacing.xs,
  },
  asterisk: {
    color: '#ff4444',
    fontWeight: 'bold',
  },
  selectButton: {
    borderWidth: 1.5,
    borderColor: oldColors.mercury, // #e3e3e3 (gris)
    borderRadius: borderRadius.md,
    backgroundColor: '#213d8b', // Azul igual que Input
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
    fontWeight: typography.weights.normal,
  },
  errorText: {
    fontSize: typography.sizes.sm,
    color: '#ff4444',
    marginTop: spacing.xs,
  },
  selectModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 24,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  selectModalTitle: {
    fontFamily: typography.families.bold,
    fontSize: typography.sizes.xl,
    textAlign: 'center',
    marginBottom: 16,
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
    minHeight: 150,
    marginBottom: 20,
    flexGrow: 1,
  },
  selectOption: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    minHeight: 50,
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  selectOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectOptionText: {
    fontFamily: typography.families.normal,
    fontSize: typography.sizes.base,
    lineHeight: 22,
    flex: 1,
  },
  selectCheckmark: {
    marginLeft: 12,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectCheckmarkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  selectCloseButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    backgroundColor: '#75bebf',
  },
  selectCloseButtonText: {
    fontFamily: typography.families.bold,
    fontSize: typography.sizes.base,
    color: '#FFFFFF',
  },
  selectEmptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectEmptyText: {
    fontFamily: typography.families.normal,
    fontSize: typography.sizes.base,
    textAlign: 'center',
  },
});
