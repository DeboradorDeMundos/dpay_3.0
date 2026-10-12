import React from 'react';
import { View, Text, Switch, TouchableOpacity } from 'react-native';
import { useSettingsStore } from '../../stores/settingsStore';
import { useThemeColors } from '../../hooks/useThemeColors';

export const AutomaticPrintingConfig: React.FC = () => {
  const { automaticPrinting, autoPrintMode, setAutomaticPrinting, setAutoPrintMode } = useSettingsStore();
  const themeColors = useThemeColors();

  const handleModeChange = (mode: 'document' | 'voucher' | 'both') => {
    setAutoPrintMode(mode);
  };

  return (
    <View style={{ marginBottom: 30 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ 
          flex: 1,
          fontSize: 18,
          fontFamily: 'Montserrat-Bold_0',
          color: '#03C0C3',
          marginRight: 12,
        }}>
          Impresión automática
        </Text>
        <Switch
          trackColor={{ false: '#767577', true: '#03C0C3' }}
          thumbColor={'#f4f3f4'}
          ios_backgroundColor="#3e3e3e"
          onValueChange={setAutomaticPrinting}
          value={automaticPrinting}
        />
      </View>
      <Text style={{ 
        fontSize: 14,
        color: themeColors.textSecondary,
        marginTop: 10,
      }}>
        Permite imprimir automáticamente la venta generada
      </Text>

      {automaticPrinting && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ 
            fontSize: 16,
            fontWeight: 'bold',
            fontFamily: 'Montserrat-Bold_0',
            color: themeColors.background === '#111111' ? '#75bebf' : themeColors.text,
            marginBottom: 15,
          }}>
            Tipo de impresión automática
          </Text>

          {/* Solo Documento */}
          <TouchableOpacity
            style={{
              backgroundColor: themeColors.isDark ? '#021735' : '#FFFFFF',
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              borderWidth: 2,
              borderColor: autoPrintMode === 'document' ? '#03C0C3' : (themeColors.isDark ? 'transparent' : '#03C0C3'),
            }}
            onPress={() => handleModeChange('document')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: '#03C0C3',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}>
                {autoPrintMode === 'document' && (
                  <View style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: '#03C0C3',
                  }} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: themeColors.isDark ? '#FFFFFF' : '#666666',
                  marginBottom: 4,
                }}>
                  Solo Documento
                </Text>
                <Text style={{
                  fontSize: 13,
                  color: themeColors.isDark ? '#CCCCCC' : '#999999',
                }}>
                  Boleta o Factura
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Solo Comprobante */}
          <TouchableOpacity
            style={{
              backgroundColor: themeColors.isDark ? '#021735' : '#FFFFFF',
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              borderWidth: 2,
              borderColor: autoPrintMode === 'voucher' ? '#03C0C3' : (themeColors.isDark ? 'transparent' : '#03C0C3'),
            }}
            onPress={() => handleModeChange('voucher')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: '#03C0C3',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}>
                {autoPrintMode === 'voucher' && (
                  <View style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: '#03C0C3',
                  }} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: themeColors.isDark ? '#FFFFFF' : '#666666',
                  marginBottom: 4,
                }}>
                  Solo Comprobante
                </Text>
                <Text style={{
                  fontSize: 13,
                  color: themeColors.isDark ? '#CCCCCC' : '#999999',
                }}>
                  Comprobante de pago D-PAY
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Ambos */}
          <TouchableOpacity
            style={{
              backgroundColor: themeColors.isDark ? '#021735' : '#FFFFFF',
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              borderWidth: 2,
              borderColor: autoPrintMode === 'both' ? '#03C0C3' : (themeColors.isDark ? 'transparent' : '#03C0C3'),
            }}
            onPress={() => handleModeChange('both')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: '#03C0C3',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}>
                {autoPrintMode === 'both' && (
                  <View style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: '#03C0C3',
                  }} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: themeColors.isDark ? '#FFFFFF' : '#666666',
                  marginBottom: 4,
                }}>
                  Ambos
                </Text>
                <Text style={{
                  fontSize: 13,
                  color: themeColors.isDark ? '#CCCCCC' : '#999999',
                }}>
                  Documento y comprobante D-PAY
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <Text style={{ 
            fontSize: 13,
            fontFamily: 'Montserrat-Bold_0',
            color: themeColors.textSecondary,
            marginTop: 8,
          }}>
            Seleccionar que se imprimirá automáticamente al completar una venta
          </Text>
        </View>
      )}
    </View>
  );
};
