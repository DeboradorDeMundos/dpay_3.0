import React from 'react';
import { View, Text, Switch, TouchableOpacity } from 'react-native';
import { useSettingsStore } from '../../stores/settingsStore';
import { useThemeColors } from '../../hooks/useThemeColors';
import { testScanSuccessSound } from '../../utils/playScanSuccessSound';

export const ScanConfig: React.FC = () => {
  const {
    enableProductScan,
    scanPersistentMode,
    setEnableProductScan,
    setScanPersistentMode,
  } = useSettingsStore();
  const themeColors = useThemeColors();

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
          Habilitar escaneo
        </Text>
        <Switch
          trackColor={{ false: '#767577', true: '#03C0C3' }}
          thumbColor={'#f4f3f4'}
          ios_backgroundColor="#3e3e3e"
          onValueChange={setEnableProductScan}
          value={enableProductScan}
        />
      </View>
      <Text style={{
        fontSize: 14,
        color: themeColors.textSecondary,
        marginTop: 10,
      }}>
        Muestra el botón Scan en la calculadora para agregar productos al carrito escaneando con la cámara del POS.
      </Text>

      {enableProductScan ? (
        <View style={{ marginTop: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{
              flex: 1,
              fontSize: 18,
              fontFamily: 'Montserrat-Bold_0',
              color: '#03C0C3',
              marginRight: 12,
            }}>
              Mantener cámara abierta
            </Text>
            <Switch
              trackColor={{ false: '#767577', true: '#03C0C3' }}
              thumbColor={'#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={setScanPersistentMode}
              value={scanPersistentMode}
            />
          </View>
          <Text style={{
            fontSize: 14,
            color: themeColors.textSecondary,
            marginTop: 10,
          }}>
            {scanPersistentMode
              ? 'Pulsa Scan una vez: la cámara queda abierta hasta que pulses Volver.'
              : 'Mantén presionado el botón Scan para escanear. Al soltar, la cámara se cierra.'}
          </Text>

          <TouchableOpacity
            onPress={() => testScanSuccessSound()}
            style={{
              marginTop: 16,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 8,
              backgroundColor: '#03C0C3',
              alignSelf: 'flex-start',
            }}
          >
            <Text style={{ color: '#fff', fontFamily: 'Montserrat-Bold_0', fontSize: 14 }}>
              Probar sonido de scan
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
};

