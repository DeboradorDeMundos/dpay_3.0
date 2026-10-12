import React from 'react';
import { View, Text, Switch } from 'react-native';
import { useSettingsStore } from '../../stores/settingsStore';
import { useThemeColors } from '../../hooks/useThemeColors';

export const SelectClientConfig: React.FC = () => {
  const { selectClient, setSelectClient } = useSettingsStore();
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
          Seleccionar cliente
        </Text>
        <Switch
          trackColor={{ false: '#767577', true: '#03C0C3' }}
          thumbColor={'#f4f3f4'}
          ios_backgroundColor="#3e3e3e"
          onValueChange={setSelectClient}
          value={selectClient}
        />
      </View>
      <Text style={{ 
        fontSize: 14,
        color: themeColors.textSecondary,
        marginTop: 10,
      }}>
        Permitir seleccionar el cliente al momento de emitir el documento. Si no está activo, se emitirá con el RUT genérico.
      </Text>
    </View>
  );
};
