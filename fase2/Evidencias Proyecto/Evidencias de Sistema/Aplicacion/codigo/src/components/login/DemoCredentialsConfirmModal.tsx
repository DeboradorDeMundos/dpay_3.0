import React from 'react';
import AppModal from '../base/AppModal';

interface DemoCredentialsConfirmModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const DemoCredentialsConfirmModal = ({ visible, onConfirm, onCancel }: DemoCredentialsConfirmModalProps) => {
  return (
    <AppModal
      visible={visible}
      title="¿Usar credenciales de prueba?"
      message="Esto reemplazará los datos que has ingresado. ¿Deseas continuar?"
      buttons={[
        { text: 'Cancelar', onPress: onCancel, variant: 'secondary' },
        { text: 'Usar Prueba', onPress: onConfirm, variant: 'primary' },
      ]}
      onClose={onCancel}
    />
  );
};

export default DemoCredentialsConfirmModal;
