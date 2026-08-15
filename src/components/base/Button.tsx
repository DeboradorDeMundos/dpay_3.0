import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import globalStyles, { colors as oldColors } from '../../styles/globalStyles';

interface ButtonProps {
  onPress: () => void;
  children: string;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  onPress,
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.base,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.white}
        />
      ) : (
        <Text style={[styles.text, styles[`text_${variant}`], styles[`text_${size}`], textStyle]}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    ...shadows.sm,
  },
  
  // Variants - usando colores del proyecto antiguo
  primary: {
    backgroundColor: oldColors.primary, // #75bebf (turquesa)
  },
  secondary: {
    backgroundColor: oldColors.secondary, // #213d8b (azul)
  },
  tertiary: {
    backgroundColor: oldColors.tertiary, // #9d418d (morado)
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: oldColors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  
  // Sizes
  sm: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 36,
  },
  md: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  lg: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    minHeight: 56,
  },
  
  // States
  disabled: {
    opacity: 0.5,
  },
  fullWidth: {
    width: '100%',
  },
  
  // Text styles - usando colores del proyecto antiguo
  text: {
    fontWeight: typography.weights.semibold,
  },
  text_primary: {
    color: oldColors.white,
  },
  text_secondary: {
    color: oldColors.white,
  },
  text_tertiary: {
    color: oldColors.white,
  },
  text_outline: {
    color: oldColors.primary,
  },
  text_ghost: {
    color: oldColors.primary,
  },
  text_sm: {
    fontSize: typography.sizes.sm,
  },
  text_md: {
    fontSize: typography.sizes.base,
  },
  text_lg: {
    fontSize: typography.sizes.lg,
  },
});
