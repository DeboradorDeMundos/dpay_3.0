import React from 'react';
import { View, Text, Image, ImageSourcePropType } from 'react-native';
import { colors } from '../../theme';

interface EmptyStateProps {
  icon?: string; // Emoji (deprecated, usar iconImage)
  iconImage?: ImageSourcePropType; // Imagen de icono
  iconTintColor?: string; // Color del icono (para imágenes)
  title: string;
  titleColor?: string;
  titleFontFamily?: string;
  message?: string;
  messageColor?: string;
  messageFontFamily?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon, 
  iconImage,
  iconTintColor,
  title,
  titleColor = colors.text,
  titleFontFamily,
  message,
  messageColor = colors.textSecondary,
  messageFontFamily,
}) => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      {/* Icono: Imagen o Emoji */}
      {iconImage ? (
        <Image 
          source={iconImage} 
          style={{ 
            width: 80, 
            height: 80, 
            marginBottom: 16,
            tintColor: iconTintColor,
          }} 
          resizeMode="contain"
        />
      ) : icon ? (
        <Text style={{ fontSize: 48, marginBottom: 16 }}>{icon}</Text>
      ) : null}
      
      <Text style={{ fontSize: 18, fontWeight: '600', color: titleColor, marginBottom: 8, fontFamily: titleFontFamily }}>
        {title}
      </Text>
      {message && (
        <Text style={{ fontSize: 14, color: messageColor, textAlign: 'center', fontFamily: messageFontFamily }}>
          {message}
        </Text>
      )}
    </View>
  );
};
