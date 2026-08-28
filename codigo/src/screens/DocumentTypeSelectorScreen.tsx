import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, SafeAreaView, Image } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { BackButton } from '../components/base';
import { useSettingsStore } from '../stores/settingsStore';
import { useThemeColors } from '../hooks/useThemeColors';
import { AVAILABLE_DOCUMENT_TYPES } from '../constants';
import { withRequiredComprobante } from '../utils/documentTypeDefaults';

type Props = NativeStackScreenProps<RootStackParamList, 'DocumentTypeSelector'>;

const COMPROBANTE_ID = 0;

const getDocumentIcon = (id: number | null) => {
  if (id === COMPROBANTE_ID) return require('../../assets/icons_new2/boleta01.png');
  if (id === null) return require('../../assets/icons/cancel.png');
  if (id === 39 || id === 41) return require('../../assets/icons_new2/boleta01.png');
  if (id === 33 || id === 34) return require('../../assets/icons_new/factura_rosa_claro.png');
  return require('../../assets/icons/cancel.png');
};

export const DocumentTypeSelectorScreen = ({ navigation }: Props) => {
  const themeColors = useThemeColors();
  const { documentType, setDocumentTypes } = useSettingsStore();

  const [selectedTypes, setSelectedTypes] = useState(withRequiredComprobante(documentType));

  useEffect(() => {
    setSelectedTypes(withRequiredComprobante(documentType));
  }, [documentType]);

  const toggleDocumentType = (item: { id: number; name: string }) => {
    if (item.id === COMPROBANTE_ID) {
      return;
    }

    const index = selectedTypes.findIndex((t) => t.id === item.id);

    if (index !== -1) {
      const newTypes = withRequiredComprobante(selectedTypes.filter((t) => t.id !== item.id));
      setSelectedTypes(newTypes);
      setDocumentTypes(newTypes);
    } else {
      const newTypes = withRequiredComprobante([...selectedTypes, { ...item, enabled: true }]);
      setSelectedTypes(newTypes);
      setDocumentTypes(newTypes);
    }
  };

  const isSelected = (id: number) => selectedTypes.some((t) => t.id === id);

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.background, padding: 20 }}>
      <StatusBar
        barStyle={themeColors.background === '#FFFFFF' ? 'dark-content' : 'light-content'}
        backgroundColor={themeColors.background}
      />
      <SafeAreaView />

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={{
          fontSize: 20,
          fontWeight: 'bold',
          color: '#03C0C3',
        }}>
          Tipos de Documento
        </Text>
      </View>

      <Text style={{
        fontSize: 14,
        color: themeColors.textSecondary,
        marginBottom: 16,
      }}>
        Comprobante Electrónico siempre está activo (solo cobro, sin DTE). Marca los DTE que quieras emitir desde el POS.
      </Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        {AVAILABLE_DOCUMENT_TYPES.map((item) => {
          const selected = isSelected(item.id);
          const locked = item.id === COMPROBANTE_ID;

          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => toggleDocumentType(item)}
              disabled={locked}
              style={{
                backgroundColor: selected ? '#d4186e' : '#FFFFFF',
                borderRadius: 8,
                padding: 16,
                marginBottom: 10,
                borderWidth: 2,
                borderColor: '#d4186e',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                opacity: locked ? 0.95 : 1,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Image
                  source={getDocumentIcon(item.id)}
                  style={{ width: 30, height: 30, marginRight: 12, tintColor: selected ? '#FFFFFF' : '#d4186e' }}
                  resizeMode="contain"
                />
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 16,
                    color: selected ? '#FFFFFF' : '#d4186e',
                    fontWeight: selected ? 'bold' : 'normal',
                  }}>
                    {item.name}
                  </Text>
                  {locked ? (
                    <Text style={{ fontSize: 12, color: selected ? '#FFFFFF' : themeColors.textSecondary, marginTop: 4 }}>
                      Siempre incluido
                    </Text>
                  ) : null}
                </View>
              </View>
              {selected && (
                <Image
                  source={require('../../assets/icons/check-white.png')}
                  style={{ width: 24, height: 24, tintColor: '#FFFFFF' }}
                  resizeMode="contain"
                />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};
