import React from 'react';
import { View, Text, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSalesStore } from '../../stores/salesStore';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';

const { width: screenWidth } = Dimensions.get('window');

// Colores del proyecto antiguo
const tertiaryColor = '#9d418d';
const whiteColor = '#FFFFFF';

/**
 * Botón de confirmación (diseño proyecto antiguo)
 * Solo aparece cuando hay documentType.id y paymentMethod
 * Al presionar navega a SaleCompleted
 */
export const ConfirmButton: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  const documentType = useSalesStore(state => state.documentType);
  const paymentMethod = useSalesStore(state => state.paymentMethod);

  // Solo mostrar si hay documento y método de pago
  const shouldShow = documentType?.id && paymentMethod !== '';

  if (!shouldShow) return null;

  return (
    <View style={{
      marginVertical: 20,
      marginHorizontal: 'auto',
    }}>
      <TouchableOpacity
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 12,
          paddingHorizontal: 32,
          borderRadius: 15,
          backgroundColor: tertiaryColor,
          width: screenWidth * 0.7,
          flexDirection: 'row',
          flexWrap: 'wrap',
        }}
        onPress={() => navigation.navigate('SaleCompleted', { sale: {} })}
      >
        <Text style={{
          fontSize: 18,
          color: whiteColor,
        }}>
          Confirmar
        </Text>
        <Image
          source={require('../../../assets/icons/check-white.png')}
          style={{
            width: 30,
            height: 30,
            marginLeft: 'auto',
          }}
        />
      </TouchableOpacity>
    </View>
  );
};
