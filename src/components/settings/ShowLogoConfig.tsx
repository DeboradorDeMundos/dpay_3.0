import React from 'react';
import { View, Text, Switch } from 'react-native';
import { useSettingsStore } from '../../stores/settingsStore';
import { useThemeColors } from '../../hooks/useThemeColors';

export const ShowLogoConfig: React.FC = () => {
  const { showLogo, setShowLogo } = useSettingsStore();
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
          Mostrar logo en boleta
        </Text>
        <Switch
          trackColor={{ false: '#767577', true: '#03C0C3' }}
          thumbColor={'#f4f3f4'}
          ios_backgroundColor="#3e3e3e"
          onValueChange={setShowLogo}
          value={showLogo}
        />
      </View>
      <Text style={{ 
        fontSize: 14,
        color: themeColors.textSecondary,
        marginTop: 10,
      }}>
        Si está activo, el logo de la empresa aparece en el PDF de la boleta. Requiere que haya un logo configurado.
      </Text>
    </View>
  );
};
