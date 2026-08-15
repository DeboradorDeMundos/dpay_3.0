import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { MMKV } from 'react-native-mmkv';
import { useSettingsStore } from '../../stores/settingsStore';
import { useAuthStore } from '../../stores/authStore';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAlertStore } from '../../stores/alertStore';
import { SuccessModal, AppModal } from '../base';

const storage = new MMKV({ id: 'settings-storage' });

export const LogoConfig: React.FC = () => {
  const { systemImage, updateSettings } = useSettingsStore();
  const { user } = useAuthStore();
  const themeColors = useThemeColors();
  const { showAlert } = useAlertStore();
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSelectImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 1,
        maxWidth: 384, // Ancho estándar para impresoras térmicas de 58mm
        maxHeight: 200, // Altura máxima razonable para logo
        includeBase64: true, // Obtener base64 directamente
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        showAlert('Error', 'No se pudo seleccionar la imagen: ' + result.errorMessage);
        return;
      }

      if (!result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      if (!asset.base64) {
        showAlert('Error', 'La imagen seleccionada no es válida');
        return;
      }

      setLoading(true);

      // Guardar imagen original con clave específica de empresa
      const systemName = user?.sistema || 'default';
      const logoKey = `systemImage_${systemName}`;
      storage.set(logoKey, asset.base64);
      updateSettings({ systemImage: asset.base64 });

      setSuccessMessage('Logo actualizado correctamente.');
      setShowSuccessModal(true);
    } catch (error) {
      console.error('[LogoConfig] Error al seleccionar imagen:', error);
      showAlert('Error', 'No se pudo procesar la imagen seleccionada');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLogo = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    // Eliminar logo específico de esta empresa
    const systemName = user?.sistema || 'default';
    const logoKey = `systemImage_${systemName}`;
    storage.delete(logoKey);
    updateSettings({ systemImage: undefined });
    setShowDeleteConfirm(false);
    setSuccessMessage('Logo eliminado correctamente');
    setShowSuccessModal(true);
  };

  return (
    <View style={{ marginBottom: 30 }}>
      <Text
        style={{
          fontSize: 18,
          fontFamily: 'Montserrat-Bold_0',
          color: '#03C0C3',
        }}>
        Logo de la empresa
      </Text>

      {/* Vista previa del logo */}
      {systemImage ? (
        <View
          style={{
            marginVertical: 15,
            padding: 15,
            borderWidth: 1,
            borderColor: themeColors.border,
            borderRadius: 8,
            backgroundColor: themeColors.background,
            alignItems: 'center',
          }}>
          <View style={{
            width: 200,
            height: 100,
            backgroundColor: '#e0e0e0', // Fondo gris claro para distinguir logos blancos o transparentes
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 8,
            overflow: 'hidden'
          }}>
            <Image
              source={{
                uri: systemImage?.startsWith('data:image')
                  ? systemImage
                  : `data:image/png;base64,${systemImage}`
              }}
              style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
              onError={(e) => console.log('[LogoConfig] Error loading image:', e.nativeEvent.error)}
            />
          </View>
          <TouchableOpacity
            onPress={handleRemoveLogo}
            style={{
              marginTop: 10,
              paddingHorizontal: 15,
              paddingVertical: 8,
              backgroundColor: '#ff4444',
              borderRadius: 6,
            }}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>
              Eliminar logo
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View
          style={{
            marginVertical: 15,
            padding: 30,
            borderWidth: 1,
            borderColor: themeColors.border,
            borderRadius: 8,
            backgroundColor: themeColors.background,
            alignItems: 'center',
          }}>
          <Image
            source={require('../../../assets/icons_new/cambiar_logotipo.png')}
            style={{ width: 60, height: 60, tintColor: themeColors.textSecondary }}
            resizeMode="contain"
          />
          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              color: themeColors.textSecondary,
            }}>
            Sin logo configurado
          </Text>
        </View>
      )}

      {/* Botón cambiar logo */}
      <TouchableOpacity
        onPress={handleSelectImage}
        disabled={loading}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 12,
          backgroundColor: themeColors.background === '#111111' ? '#75bebf' : themeColors.tertiary,
          borderRadius: 8,
        }}>
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Image
              source={require('../../../assets/icons/upload-image.png')}
              style={{ width: 20, height: 20, tintColor: '#fff', marginRight: 8 }}
            />
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
              {systemImage ? 'Cambiar logo' : 'Seleccionar logo'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      <Text
        style={{
          marginTop: 10,
          fontSize: 14,
          fontFamily: 'Montserrat-Bold_0',
          color: themeColors.textSecondary,
        }}>
        El logo se mostrará en boletas e impresiones mientras esté cargado. Para ocultarlo, usa Eliminar logo.
      </Text>

      <SuccessModal
        visible={showSuccessModal}
        message={successMessage}
        onConfirm={() => setShowSuccessModal(false)}
      />

      <AppModal
        visible={showDeleteConfirm}
        title="Eliminar Logo"
        message="¿Estás seguro de que deseas eliminar el logo actual?"
        buttons={[
          {
            text: 'Cancelar',
            onPress: () => setShowDeleteConfirm(false),
            variant: 'primary',
          },
          {
            text: 'Eliminar',
            onPress: confirmDelete,
            variant: 'secondary',
          },
        ]}
        onClose={() => setShowDeleteConfirm(false)}
      />
    </View>
  );
};
