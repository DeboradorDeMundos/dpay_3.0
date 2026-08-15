import React from 'react';
import AppModal from './AppModal';

interface LogoutConfirmModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const LogoutConfirmModal = ({ visible, onConfirm, onCancel }: LogoutConfirmModalProps) => {
  return (
    <AppModal
      visible={visible}
      title="¿Desea cerrar sesión?"
      message="Se cerrará tu sesión actual y volverás a la pantalla de inicio"
      buttons={[
        { text: 'Cancelar', onPress: onCancel, variant: 'primary' },
        { text: 'Salir', onPress: onConfirm, variant: 'secondary' },
      ]}
      onClose={onCancel}
    />
  );
};

export default LogoutConfirmModal;
