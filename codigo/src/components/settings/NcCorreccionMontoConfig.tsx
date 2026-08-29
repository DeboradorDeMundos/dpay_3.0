import React from 'react';
import { View, Text, Switch } from 'react-native';
import { useSettingsStore } from '../../stores/settingsStore';
import { useThemeColors } from '../../hooks/useThemeColors';

export const NcCorreccionMontoConfig: React.FC = () => {
  const { ncCorreccionMonto, setNcCorreccionMonto } = useSettingsStore();
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
          NC por corrección de monto
        </Text>
        <Switch
          trackColor={{ false: '#767577', true: '#03C0C3' }}
          thumbColor={'#f4f3f4'}
          ios_backgroundColor="#3e3e3e"
          onValueChange={setNcCorreccionMonto}
          value={ncCorreccionMonto}
        />
      </View>
      <Text style={{ 
        fontSize: 14,
        color: themeColors.textSecondary,
        marginTop: 10,
      }}>
        Si está activo, al anular un documento podrás elegir entre una Nota de Crédito por corrección de monto o por documento total. Si está desactivado, se preguntará directamente si desea crear la NC por documento total.
      </Text>
    </View>
  );
};
