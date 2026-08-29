import React from 'react';
import { View, Image, StyleSheet, Text, TouchableOpacity } from 'react-native';
import AppModal from '../base/AppModal';
import { typography } from '../../theme';
import { useThemeColors } from '../../hooks/useThemeColors';

interface BiometricAuthModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const BiometricAuthModal = ({ visible, onConfirm, onCancel }: BiometricAuthModalProps) => {
  const themeColors = useThemeColors();
  
  return (
    <AppModal
      visible={visible}
      title="Autenticación biométrica"
      message="¿Desea usar Huella Digital o Face ID, para iniciar sesión?"
      onClose={onCancel}
      maxWidth={420}
    >
      <View style={styles.iconsContainer}>
        <Image 
          source={require('../../../assets/icons_new/biometrico.png')} 
          style={[styles.icon, { tintColor: themeColors.isDark ? '#FFFFFF' : undefined }]}
          resizeMode="contain"
        />
        <Image 
          source={require('../../../assets/icons_new/huella_digital.png')} 
          style={[styles.icon, { tintColor: themeColors.isDark ? '#FFFFFF' : undefined }]}
          resizeMode="contain"
        />
      </View>
      
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          onPress={onCancel}
          style={[styles.button, styles.buttonSecondary]}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>NO</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onConfirm}
          style={[styles.button, styles.buttonPrimary]}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>SÍ</Text>
        </TouchableOpacity>
      </View>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  iconsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
    marginBottom: 24,
    marginTop: 8,
    paddingVertical: 16,
  },
  icon: {
    width: 90,
    height: 90,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  button: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 25,
    minWidth: 100,
  },
  buttonPrimary: {
    backgroundColor: '#75bebf',
  },
  buttonSecondary: {
    backgroundColor: '#d4186e',
  },
  buttonText: {
    fontFamily: typography.families.bold,
    fontSize: typography.sizes.base,
    color: '#FFFFFF',
  },
});

export default BiometricAuthModal;
