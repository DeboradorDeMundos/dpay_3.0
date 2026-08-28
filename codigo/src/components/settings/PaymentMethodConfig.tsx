import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useSettingsStore, DPAY_DEFAULT_PAYMENT_METHODS } from '../../stores/settingsStore';
import { useThemeColors } from '../../hooks/useThemeColors';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const PaymentMethodConfig = () => {
  const navigation = useNavigation<NavigationProp>();
  const { globalPaymentMethods } = useSettingsStore();
  const themeColors = useThemeColors();

  const getStatusText = () => {
    const methods = globalPaymentMethods.length > 0
      ? globalPaymentMethods
      : DPAY_DEFAULT_PAYMENT_METHODS;
    const count = methods.length;
    if (globalPaymentMethods.length === 0) {
      return `${count} métodos D-PAY (por defecto)`;
    }
    return `${count} método${count > 1 ? 's' : ''} habilitado${count > 1 ? 's' : ''}`;
  };

  return (
    <View style={{ marginBottom: 30 }}>
      <Text style={{ 
        fontSize: 18,
        fontFamily: 'Montserrat-Bold_0',
        color: '#03C0C3',
      }}>
        Métodos de pago
      </Text>
      <TouchableOpacity
        onPress={() => navigation.navigate('PaymentMethodSelector')}
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
          {getStatusText()}
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
        Métodos disponibles para todas las ventas
      </Text>
    </View>
  );
};
