import React from 'react';
import AppModal from './AppModal';

interface SuccessModalProps {
  visible: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
}

const SuccessModal = ({ visible, title = 'Éxito', message, onConfirm }: SuccessModalProps) => {
  return (
    <AppModal
      visible={visible}
      title={title}
      message={message}
      buttons={[
        { text: 'OK', onPress: onConfirm, variant: 'primary' },
      ]}
      onClose={onConfirm}
    />
  );
};

export default SuccessModal;
