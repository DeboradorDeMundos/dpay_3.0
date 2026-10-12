import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AppModal from './AppModal';
import { typography } from '../../theme';
import { useThemeColors } from '../../hooks/useThemeColors';

export interface EnrollmentTerminalInfo {
  terminal_code: string;
  serial_number: string;
  display_name?: string;
}

interface EnrollmentConfirmModalProps {
  visible: boolean;
  terminal: EnrollmentTerminalInfo | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const EnrollmentConfirmModal = ({
  visible,
  terminal,
  onConfirm,
  onCancel,
}: EnrollmentConfirmModalProps) => {
  const themeColors = useThemeColors();
  const showName = Boolean(
    terminal?.display_name && terminal.display_name !== terminal.terminal_code,
  );

  return (
    <AppModal
      visible={visible}
      title="¿Es esta su caja?"
      message="Confirme que el terminal enrolado en DTemite corresponde a este POS antes de activar los cobros externos."
      buttons={[
        { text: 'No es mi caja', onPress: onCancel, variant: 'primary' },
        { text: 'Sí, es mi caja', onPress: onConfirm, variant: 'secondary' },
      ]}
      onClose={onCancel}
    >
      {terminal ? (
        <View style={styles.details}>
          <View style={styles.row}>
            <Text style={[styles.label, { color: themeColors.textSecondary }]}>Código</Text>
            <Text style={[styles.value, { color: themeColors.text }]}>{terminal.terminal_code}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: themeColors.textSecondary }]}>Serial</Text>
            <Text style={[styles.value, { color: themeColors.text }]}>{terminal.serial_number}</Text>
          </View>
          {showName ? (
            <View style={styles.row}>
              <Text style={[styles.label, { color: themeColors.textSecondary }]}>Nombre</Text>
              <Text style={[styles.value, { color: themeColors.text }]}>{terminal.display_name}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </AppModal>
  );
};

const styles = StyleSheet.create({
  details: {
    marginBottom: 24,
    gap: 10,
  },
  row: {
    alignItems: 'center',
  },
  label: {
    fontFamily: typography.families.normal,
    fontSize: typography.sizes.sm,
    marginBottom: 2,
  },
  value: {
    fontFamily: typography.families.bold,
    fontSize: typography.sizes.base,
    textAlign: 'center',
  },
});

export default EnrollmentConfirmModal;
