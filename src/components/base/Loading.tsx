import React from 'react';
import { View, Image, StyleSheet, Text, Modal, Dimensions } from 'react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { typography } from '../../theme';

interface LoadingProps {
  visible: boolean;
  message?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const Loading: React.FC<LoadingProps> = ({ visible, message }) => {
  const themeColors = useThemeColors();
  
  if (!visible) return null;

  // Detectar si el mensaje es de verificación de términos para aplicar el estilo AppModal
  const isTermsVerification = message?.toLowerCase().includes('términos') || 
                              message?.toLowerCase().includes('terminos');

  const containerStyle = isTermsVerification 
    ? [
        styles.containerModal,
        { 
          backgroundColor: themeColors.isDark ? '#1a2a4a' : '#FFFFFF',
          borderColor: '#75bebf',
        }
      ]
    : [
        styles.container,
        { backgroundColor: themeColors.card }
      ];

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={containerStyle}>
          <Image
            source={require('../../../assets/logos/logo_dpay_cargando.gif')}
            style={styles.gif}
            resizeMode="contain"
          />
          {message && (
            <Text 
              style={[
                isTermsVerification ? styles.messageModal : styles.message,
                { 
                  color: isTermsVerification ? themeColors.secondary : themeColors.text,
                  fontFamily: isTermsVerification ? typography.families.bold : typography.families.normal 
                }
              ]}
            >
              {message}
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  container: {
    paddingVertical: 24,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 200,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  containerModal: {
    width: SCREEN_WIDTH - 48,
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: 3,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  gif: {
    width: 80,
    height: 80,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  messageModal: {
    marginTop: 16,
    fontSize: typography.sizes.lg,
    textAlign: 'center',
    fontWeight: 'bold',
    lineHeight: 24,
  },
});
