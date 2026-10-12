import React from 'react';
import AppModal from '../base/AppModal';

interface SaveCredentialsModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const SaveCredentialsModal = ({ visible, onConfirm, onCancel }: SaveCredentialsModalProps) => {
  return (
    <AppModal
      visible={visible}
      title="Guardar credenciales"
      message="¿Desea guardar estas credenciales para una próxima oportunidad?"
      buttons={[
        { text: 'Si', onPress: onConfirm, variant: 'primary' },
        { text: 'No', onPress: onCancel, variant: 'secondary' },
      ]}
      onClose={onCancel}
    />
  );
};

export default SaveCredentialsModal;
