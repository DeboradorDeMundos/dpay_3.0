import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, SafeAreaView, Image } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { BackButton } from '../components/base';
import { useSettingsStore, DPAY_DEFAULT_PAYMENT_METHODS } from '../stores/settingsStore';
import { useThemeColors } from '../hooks/useThemeColors';
import { shouldEnableBiometrics } from '../utils/deviceInfo';

type Props = NativeStackScreenProps<RootStackParamList, 'PaymentMethodSelector'>;

// Métodos de pago disponibles
const AVAILABLE_PAYMENT_METHODS = [
  { id: 'Efectivo', name: 'Efectivo', icon: require('../../assets/icons_new/efectivo_rosa.png') },
  { id: 'Tarjeta de crédito', name: 'Tarjeta de crédito', icon: require('../../assets/icons_new/credito_rosa.png') },
  { id: 'Tarjeta de débito', name: 'Tarjeta de débito', icon: require('../../assets/icons_new/debto_rosa.png') },
];

export const PaymentMethodSelectorScreen = ({ navigation }: Props) => {
  const themeColors = useThemeColors();
  const { globalPaymentMethods, setGlobalPaymentMethods } = useSettingsStore();
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  // Detectar tipo de dispositivo al montar el componente
  useEffect(() => {
    const checkDevice = async () => {
      const hasBiometrics = await shouldEnableBiometrics();
      setIsMobileDevice(hasBiometrics); // Si tiene biométricos = celular
      
      // Si es celular y tiene métodos de tarjeta seleccionados, limpiarlos
      if (hasBiometrics && globalPaymentMethods) {
        const cardMethods = globalPaymentMethods.filter(
          method => method !== 'Efectivo'
        );
        
        if (cardMethods.length > 0) {
          // Remover todos los métodos de tarjeta, dejar solo Efectivo si estaba seleccionado
          const onlyCash = globalPaymentMethods.filter(
            method => method === 'Efectivo'
          );
          setGlobalPaymentMethods(onlyCash);
        }
      }
    };
    checkDevice();
  }, []);

  const togglePaymentMethod = (methodId: string) => {
    // En celulares, solo permitir Efectivo
    if (isMobileDevice && methodId !== 'Efectivo') {
      return; // No hacer nada si es celular e intenta seleccionar tarjetas
    }

    const currentMethods = globalPaymentMethods || [];
    const index = currentMethods.indexOf(methodId);
    
    if (index !== -1) {
      // Ya está seleccionado, lo removemos
      const newMethods = currentMethods.filter(m => m !== methodId);
      setGlobalPaymentMethods(newMethods);
    } else {
      // No está seleccionado, lo agregamos
      const newMethods = [...currentMethods, methodId];
      setGlobalPaymentMethods(newMethods);
    }
  };

  const isMethodSelected = (methodId: string) => {
    const methods = globalPaymentMethods || [];
    if (methods.length === 0) {
      return DPAY_DEFAULT_PAYMENT_METHODS.includes(methodId);
    }
    return methods.includes(methodId);
  };

  const isMethodDisabled = (methodId: string) => {
    // En celulares, deshabilitar todo excepto Efectivo
    return isMobileDevice && methodId !== 'Efectivo';
  };

  const methodCount = globalPaymentMethods?.length || 0;

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
          Métodos de Pago
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Instrucciones */}
        <View style={{ 
          backgroundColor: '#FFFFFF', 
          borderRadius: 12, 
          padding: 20, 
          marginBottom: 20,
          borderWidth: 3,
          borderColor: '#03C0C3',
        }}>
          <Text style={{ 
            fontSize: 16, 
            color: '#213d8b',
            marginBottom: 12,
            fontWeight: 'bold',
          }}>
            Seleccione los métodos de pago disponibles para todos los documentos:
          </Text>
          <Text style={{ 
            fontSize: 14, 
            color: '#213d8b',
            lineHeight: 22,
          }}>
            • Si selecciona 1 método, la app saltará directo al pago.{'\n'}
            • Si no selecciona ninguno, D-PAY usa efectivo, crédito y débito por defecto.
          </Text>
        </View>

        {/* Aviso para celulares */}
        {isMobileDevice && (
          <View style={{ 
            backgroundColor: '#FFF3CD', 
            borderRadius: 12, 
            padding: 16, 
            marginBottom: 20,
            borderWidth: 2,
            borderColor: '#FFC107',
          }}>
            <Text style={{ 
              fontSize: 14, 
              color: '#856404',
              lineHeight: 20,
              fontWeight: '600',
            }}>
              ℹ️ Dispositivo móvil detectado:{'\n'}
              Solo el método "Efectivo" está disponible. Los pagos con tarjeta requieren un dispositivo POS.
            </Text>
          </View>
        )}

        {/* Lista de métodos */}
        {AVAILABLE_PAYMENT_METHODS.map((method) => {
          const selected = isMethodSelected(method.id);
          const disabled = isMethodDisabled(method.id);
            
            return (
              <TouchableOpacity
                key={method.id}
                onPress={() => togglePaymentMethod(method.id)}
                disabled={disabled}
                style={{
                  backgroundColor: selected ? '#d4186e' : '#FFFFFF',
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 8,
                  borderWidth: 2,
                  borderColor: disabled ? '#cccccc' : '#d4186e',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  opacity: disabled ? 0.4 : 1,
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Image 
                    source={method.icon} 
                    style={{ 
                      width: 30, 
                      height: 30, 
                      marginRight: 12,
                      tintColor: disabled ? '#999999' : (selected ? '#FFFFFF' : '#d4186e')
                    }} 
                    resizeMode="contain"
                  />
                  <Text style={{ 
                    fontSize: 16, 
                    color: disabled ? '#999999' : (selected ? '#FFFFFF' : '#d4186e'),
                    fontWeight: selected ? 'bold' : 'normal',
                  }}>
                    {method.name}
                  </Text>
                  {disabled && (
                    <Text style={{
                      fontSize: 12,
                      color: '#999999',
                      marginLeft: 8,
                      fontStyle: 'italic',
                    }}>
                      (Solo POS)
                    </Text>
                  )}
                </View>
                {selected && !disabled && (
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
