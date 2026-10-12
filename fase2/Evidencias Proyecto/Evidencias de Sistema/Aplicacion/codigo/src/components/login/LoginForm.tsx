import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Input } from '../base/Input';
import { spacing, typography } from '../../theme';
import { formatRut, validateRutFormat } from '../../utils/rut';
import { useThemeColors } from '../../hooks/useThemeColors';

interface LoginFormProps {
  rut: string;
  usuario: string;
  password: string;
  onRutChange: (rut: string) => void;
  onUsuarioChange: (usuario: string) => void;
  onPasswordChange: (password: string) => void;
  onSubmit: () => void;
  loading?: boolean;
}

const LoginForm = ({
  rut,
  usuario,
  password,
  onRutChange,
  onUsuarioChange,
  onPasswordChange,
  onSubmit,
  loading,
}: LoginFormProps) => {
  const themeColors = useThemeColors();

  const handleRutChange = (value: string) => {
    const formatted = formatRut(value);
    onRutChange(formatted);
  };

  const isRutValid = validateRutFormat(rut);
  const isFormValid = isRutValid && usuario.length > 0 && password.length > 0;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: themeColors.secondary }]}>Iniciar Sesión</Text>

      <Input
        placeholder="RUT / RUN"
        value={rut}
        onChangeText={handleRutChange}
        keyboardType="numeric"
        autoCapitalize="none"
        textAlign="center"
        error={rut.length > 0 && !isRutValid ? 'RUT inválido' : undefined}
      />

      <Input
        placeholder="Usuario"
        value={usuario}
        onChangeText={onUsuarioChange}
        autoCapitalize="none"
        textAlign="center"
      />

      <Input
        placeholder="Contraseña"
        value={password}
        onChangeText={onPasswordChange}
        secureTextEntry={true}
        textAlign="center"
      />

      <TouchableOpacity
        onPress={onSubmit}
        disabled={!isFormValid || loading}
        style={[
          styles.submitButton,
          (!isFormValid || loading) && styles.submitButtonDisabled,
        ]}
        activeOpacity={0.8}
      >
        <Text style={styles.submitButtonText}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontFamily: typography.families.bold,
    marginBottom: spacing.xl,
    textAlign: 'center',
    color: '#FFFFFF', // Blanco para contrastar con fondo oscuro
  },
  submitButton: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    backgroundColor: '#213d8b', // Azul siempre, en modo oscuro y claro
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontFamily: typography.families.bold,
    fontSize: typography.sizes.base,
    color: '#FFFFFF', // Texto blanco para contrastar con fondo azul
  },
});

export default LoginForm;