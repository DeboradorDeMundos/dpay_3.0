import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useSettingsStore } from '../../stores/settingsStore';
import { useThemeColors } from '../../hooks/useThemeColors';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const DocumentTypeConfig = () => {
  const navigation = useNavigation<NavigationProp>();
  const { documentType } = useSettingsStore();
  const themeColors = useThemeColors();

  const getDocumentTypeText = () => {
    if (documentType.length === 0) {
      return 'Ninguno';
    }
    if (documentType.length === 1) {
      return documentType[0].name;
    }
    return `${documentType.length} tipos seleccionados`;
  };

  return (
    <View style={{ marginBottom: 30 }}>
      <Text style={{ 
        fontSize: 18,
        fontFamily: 'Montserrat-Bold_0',
        color: '#03C0C3',
      }}>
        Tipo de documento
      </Text>
      <TouchableOpacity
        onPress={() => navigation.navigate('DocumentTypeSelector')}
        style={{
          borderWidth: 1,
          borderColor: themeColors.border,
          borderRadius: 8,
          padding: 12,
          marginVertical: 10,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: themeColors.background,
        }}>
        <Text style={{ 
          fontSize: 14,
          fontFamily: 'Montserrat-Bold_0',
          color: themeColors.text,
        }}>
          {getDocumentTypeText()}
        </Text>
        <Image 
          source={require('../../../assets/icons/arrow-down.png')} 
          style={{ width: 20, height: 20, tintColor: themeColors.text }} 
        />
      </TouchableOpacity>
      <Text style={{ 
        fontSize: 14,
        fontFamily: 'Montserrat-Bold_0',
        color: themeColors.textSecondary,
      }}>
        Definir el tipo de documento por defecto
      </Text>
    </View>
  );
};
