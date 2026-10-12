import React from 'react';
import AppModal from '../base/AppModal';

interface RejectTermsModalProps {
  visible: boolean;
  onReview: () => void;
  onExit: () => void;
}

const RejectTermsModal = ({ visible, onReview, onExit }: RejectTermsModalProps) => {
  return (
    <AppModal
      visible={visible}
      title="Términos y Condiciones"
      message="Debe aceptar los términos y condiciones para usar la aplicación DPAY. ¿Desea salir de la aplicación?"
      buttons={[
        { text: 'Seguir Leyendo', onPress: onReview, variant: 'primary' },
        { text: 'Salir', onPress: onExit, variant: 'secondary' },
      ]}
      onClose={onReview}
    />
  );
};

export default RejectTermsModal;
