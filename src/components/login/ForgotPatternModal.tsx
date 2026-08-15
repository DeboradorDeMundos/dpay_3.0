import React from 'react';
import AppModal from '../base/AppModal';

interface ForgotPatternModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ForgotPatternModal = ({ visible, onConfirm, onCancel }: ForgotPatternModalProps) => {
  return (
    <AppModal
      visible={visible}
      title="Olvidé mi patrón"
      message="Deberá iniciar sesión nuevamente con sus credenciales"
      onClose={onCancel}
      buttons={[
        { text: 'CANCELAR', onPress: onCancel, variant: 'secondary' },
        { text: 'ACEPTAR', onPress: onConfirm, variant: 'primary' },
      ]}
    />
  );
};

export default ForgotPatternModal;
