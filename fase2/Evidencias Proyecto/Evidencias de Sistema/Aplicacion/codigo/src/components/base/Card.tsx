import React from 'react';
import { View, TouchableOpacity, ViewStyle } from 'react-native';
import { colors, shadows } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'default' | 'outlined';
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  style, 
  onPress, 
  variant = 'default' 
}) => {
  const baseStyle: ViewStyle = {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    ...shadows.sm,
  };

  const variantStyle: ViewStyle = variant === 'outlined' 
    ? { borderWidth: 1, borderColor: colors.border, ...shadows.none }
    : {};

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component 
      style={[baseStyle, variantStyle, style]} 
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {children}
    </Component>
  );
};
