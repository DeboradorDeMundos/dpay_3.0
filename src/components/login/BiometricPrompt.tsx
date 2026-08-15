import React, { useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import ReactNativeBiometrics from 'react-native-biometrics';

interface BiometricPromptProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

const BiometricPrompt = ({ onSuccess, onCancel }: BiometricPromptProps) => {
  useEffect(() => {
    checkBiometricAndPrompt();
  }, []);

  const checkBiometricAndPrompt = async () => {
    try {
      const rnBiometrics = new ReactNativeBiometrics();
      
      const { available, biometryType } = await rnBiometrics.isSensorAvailable();

      if (!available) {
        return;
      }

      let promptMessage = 'Autenticación biométrica';
      if (biometryType === 'TouchID') {
        promptMessage = 'Usar huella digital';
      } else if (biometryType === 'FaceID') {
        promptMessage = 'Usar Face ID';
      }

      const { success } = await rnBiometrics.simplePrompt({
        promptMessage,
        cancelButtonText: 'Cancelar',
      });

      if (success) {
        onSuccess();
      } else {
        // Usuario canceló
        if (onCancel) {
          onCancel();
        }
      }
    } catch (error) {
      console.error('Biometric error:', error);
      // En caso de error, también llamar onCancel
      if (onCancel) {
        onCancel();
      }
    }
  };

  return null; // This component doesn't render anything
};

export default BiometricPrompt;
