import React from 'react';
import { TextInput, TextInputProps } from 'react-native';
import { useThemeColors } from '../../hooks/useThemeColors';

interface SearchInputProps extends TextInputProps {
  onChangeText: (text: string) => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({ 
  onChangeText, 
  placeholder = 'Buscar...', 
  ...props 
}) => {
  const themeColors = useThemeColors();
  
  return (
    <TextInput
      style={{
        borderWidth: 2,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 15,
        borderColor: '#03C0C3',
        fontSize: 14,
        fontFamily: 'Montserrat-Bold_0',
        color: themeColors.text,
        backgroundColor: themeColors.background,
      }}
      placeholder={placeholder}
      placeholderTextColor={themeColors.textSecondary}
      autoCapitalize="none"
      onChangeText={onChangeText}
      {...props}
    />
  );
};
