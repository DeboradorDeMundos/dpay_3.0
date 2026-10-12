import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar, SafeAreaView, ScrollView, Dimensions, Image } from 'react-native';
import { useSalesStore } from '../stores/salesStore';
import { useSettingsStore } from '../stores/settingsStore';
import { colors } from '../theme';
import { BackButton } from '../components/base';
import { Resume, ConfirmButton } from '../components/sales';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useThemeColors } from '../hooks/useThemeColors';
import { isComprobanteElectronico, getDocumentTypeListLabel } from '../utils/documentTypeDefaults';

const { width: screenWidth } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'DocumentType'>;

export const DocumentTypeScreen: React.FC<Props> = ({ navigation, route }) => {
  const setDocumentTypeSale = useSalesStore(state => state.setDocumentTypeSale);
  const sales = useSalesStore(state => state.sales);
  const currentSale = useSalesStore(state => state.currentSale);
  const documentTypes = useSettingsStore(state => state.documentType);
  const { getPaymentMethodsForDocType } = useSettingsStore();
  const themeColors = useThemeColors();

  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);

  // Obtener items desde la configuración o desde los parámetros de navegación
  const getItems = () => {
    if (documentTypes.length > 0) {
      return documentTypes;
    }
    return route.params?.items || [];
  };

  const items = getItems();

  const handleSelectDocumentType = (type: typeof items[0]) => {
    setSelectedDocId(type.id);
    setDocumentTypeSale({ id: type.id, name: type.name, code: type.id.toString() });

    const total = sales[currentSale]?.results
      .map(item => item.total)
      .reduce((prev, curr) => prev + curr, 0) || 0;

    // Verificar métodos de pago configurados para este documento
    const configuredMethods = getPaymentMethodsForDocType(type.id);
    const shouldAutoExecute =
      !isComprobanteElectronico(type.id) &&
      configuredMethods.length === 1 &&
      configuredMethods[0] !== 'Efectivo';

    navigation.navigate('PaymentMethod', { total, autoExecute: shouldAutoExecute });
  };

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
          color: '#03C0C3'
        }}>
          TIPO DE DOCUMENTO
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        style={{ width: screenWidth, marginTop: 20, marginHorizontal: -20 }}
      >
        {/* Resume sin el tipo de documento (aún no seleccionado) */}
        <Resume showMoreDetails={false} />

        <Text style={{
          fontSize: 18,
          color: themeColors.isDark ? '#FFFFFF' : '#d4186e',
          fontWeight: 'bold',
          marginTop: 20,
          marginLeft: 20,
        }}>
          Documento tributarios electrónicos
        </Text>

        <View style={{
          marginTop: 20,
          marginHorizontal: 20,
          gap: 15,
        }}>
          {items.map((docType) => {
            const getDocumentIcon = (id: number) => {
              if (id === 0) return require('../../assets/icons_new2/boleta01.png');
              if (id === 39 || id === 41) return require('../../assets/icons_new2/boleta01.png');
              if (id === 33 || id === 34) return require('../../assets/icons_new/factura_rosa_claro.png');
              return require('../../assets/icons_new/factura_rosa_claro.png');
            };

            const isSelected = selectedDocId === docType.id;
            const bgColor = isSelected ? '#052CCE' : '#d4186e';

            return (
              <TouchableOpacity
                key={docType.id}
                onPress={() => handleSelectDocumentType(docType)}
                style={{
                  backgroundColor: bgColor,
                  borderRadius: 12,
                  padding: 20,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, flexShrink: 1, minWidth: 0, marginRight: 12 }}>
                  <Image
                    source={getDocumentIcon(docType.id)}
                    style={{ width: 40, height: 40, tintColor: '#FFFFFF', marginRight: 15, flexShrink: 0 }}
                    resizeMode="contain"
                  />
                  <Text
                    style={{
                      flex: 1,
                      flexShrink: 1,
                      fontSize: 18,
                      fontWeight: 'bold',
                      color: '#FFFFFF',
                    }}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {getDocumentTypeListLabel(docType)}
                  </Text>
                </View>

                {/* Radio button */}
                <View style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: '#FFFFFF',
                  backgroundColor: isSelected ? '#FFFFFF' : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {isSelected && (
                    <View style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: bgColor,
                    }} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ConfirmButton NO se usa aquí en el nuevo flujo */}
      </ScrollView>
    </View >
  );
};
