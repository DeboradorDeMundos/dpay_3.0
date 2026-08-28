import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar, SafeAreaView, ScrollView, Alert, Image, TextInput } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';
import { usePrinterStore } from '../stores/printerStore';
import { colors } from '../theme';
import { BackButton, LogoutConfirmModal } from '../components/base';
import { AutomaticPrintingConfig, SelectClientConfig, TipConfig, EmitirDocumentoConfig, DocumentTypeConfig, PaymentMethodConfig, PersonalizedMessagesConfig, LogoConfig, PrintTEDConfig, NcCorreccionMontoConfig, GatewayModeConfig, GatewayModeToggle, GatewayModeProvider, ScanConfig } from '../components/settings';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useThemeColors } from '../hooks/useThemeColors';
import { useBluetoothPermissions } from '../hooks/useBluetoothPermissions';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { logout } = useAuthStore();
  const themeColors = useThemeColors();
  const { hasPermissions, checkPermissions, requestPermissions } = useBluetoothPermissions();
  const { selectedPrinter } = usePrinterStore();
  const { additionalLines, setAdditionalLines } = useSettingsStore();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [localAdditionalLines, setLocalAdditionalLines] = useState(additionalLines || '6');

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigation.navigate('Login');
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const handlePrinterSettings = async () => {
    // Siempre verifica y solicita permisos antes de acceder a configuración de impresora
    const hasPerms = await checkPermissions();
    
    if (!hasPerms) {
      // Si no tiene permisos, solicita de nuevo (detectará si fue denegado permanentemente)
      const granted = await requestPermissions();
      if (!granted) {
        // El hook ya muestra el alert con opción de ir a configuración si fue denegado permanentemente
        return;
      }
    }

    navigation.navigate('PrinterSettings', { returnToSettings: true });
  };

  const handleAdditionalLinesChange = (value: string) => {
    const numericValue = parseInt(value, 10);
    if (!isNaN(numericValue)) {
      setAdditionalLines(numericValue);
      setLocalAdditionalLines(value);
    } else {
      setLocalAdditionalLines(value);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.background, padding: 20 }}>
      <StatusBar 
        barStyle={themeColors.background === '#FFFFFF' ? 'dark-content' : 'light-content'} 
        backgroundColor={themeColors.background} 
      />
      <SafeAreaView />

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={{ 
          fontSize: 20, 
          fontWeight: 'bold', 
          color: '#03C0C3'
        }}>
          CONFIGURACIÓN
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 20 }}>
        {/* Impresora */}
        <View style={{ marginBottom: 30 }}>
          <Text style={{ 
            fontSize: 18,
            fontWeight: 'bold',
            fontFamily: 'Montserrat-Bold_0',
            color: '#03C0C3',
          }}>
            Impresora
          </Text>
          <TouchableOpacity
            onPress={handlePrinterSettings}
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
              {selectedPrinter?.name || 'Ninguno'}
            </Text>
            <Image 
              source={require('../../assets/icons/arrow-down.png')} 
              style={{ width: 20, height: 20, tintColor: themeColors.text }} 
            />
          </TouchableOpacity>
          <Text style={{ 
            fontSize: 14,
            fontFamily: 'Montserrat-Bold_0',
            color: themeColors.textSecondary,
          }}>
            Seleccionar la impresora a utilizar
          </Text>
        </View>

        {/* Líneas adicionales - justo después de impresora */}
        <View style={{ marginBottom: 30 }}>
          <Text style={{ 
            fontSize: 18,
            fontWeight: 'bold',
            fontFamily: 'Montserrat-Bold_0',
            color: '#03C0C3',
          }}>
            Líneas adicionales
          </Text>
          <TextInput
            value={localAdditionalLines}
            onChangeText={handleAdditionalLinesChange}
            keyboardType="numeric"
            style={{
              borderWidth: 1,
              borderColor: themeColors.border,
              borderRadius: 8,
              padding: 12,
              marginVertical: 10,
              backgroundColor: themeColors.background,
              color: themeColors.text,
              fontSize: 14,
              fontFamily: 'Montserrat-Bold_0',
            }}
          />
          <Text style={{ 
            fontSize: 14,
            fontFamily: 'Montserrat-Bold_0',
            color: themeColors.textSecondary,
          }}>
            Número de líneas en blanco al final de la impresión
          </Text>
        </View>

        {/* Emitir documento electrónico */}
        <EmitirDocumentoConfig />

        {/* NC por corrección de monto */}
        <NcCorreccionMontoConfig />

        {/* Opciones de impresión */}
        <AutomaticPrintingConfig />
        <PrintTEDConfig />
        
        {/* Sincronización - OCULTO: Siempre activo */}
        {/* <AutoSyncConfig /> */}

        {/* Configuración de documentos y pagos */}
        <DocumentTypeConfig />
        <PaymentMethodConfig />

        {/* Cliente */}
        <SelectClientConfig />

        {/* Propina */}
        <TipConfig />

        {/* Cobros externos — antes de logo en boleta */}
        <GatewayModeProvider>
          <View style={{ marginBottom: 30 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{
                flex: 1,
                fontSize: 18,
                fontWeight: 'bold',
                fontFamily: 'Montserrat-Bold_0',
                color: '#03C0C3',
                marginRight: 12,
              }}>
                Cobros externos
              </Text>
              <GatewayModeToggle />
            </View>
            <GatewayModeConfig />
          </View>
        </GatewayModeProvider>

        {/* Escaneo de productos */}
        <ScanConfig />

        {/* Logo de la empresa (si hay logo cargado, se muestra en boleta/PDF) */}
        <LogoConfig />

        {/* Mensajes personalizados */}
        <PersonalizedMessagesConfig />
      </ScrollView>

      <LogoutConfirmModal
        visible={showLogoutModal}
        onConfirm={confirmLogout}
        onCancel={cancelLogout}
      />
    </View>
  );
};
