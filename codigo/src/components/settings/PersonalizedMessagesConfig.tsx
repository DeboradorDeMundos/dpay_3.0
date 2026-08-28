import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { useSettingsStore } from '../../stores/settingsStore';
import { useThemeColors } from '../../hooks/useThemeColors';

export const PersonalizedMessagesConfig = () => {
  const themeColors = useThemeColors();
  const { 
    header1, header2, header3, header4, header5, header6,
    footer1, footer2, footer3, footer4, footer5, footer6,
    updateSettings 
  } = useSettingsStore();

  const inputStyle = {
    borderWidth: 2,
    borderColor: '#03C0C3',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    backgroundColor: themeColors.background,
    color: themeColors.text,
    fontSize: 14,
  };

  return (
    <View style={{ marginBottom: 30 }}>
      <Text style={{ 
        fontSize: 18,
        fontFamily: 'Montserrat-Bold_0',
        color: '#03C0C3',
        marginBottom: 8,
      }}>
        Mensajes personalizados
      </Text>
      
      <Text style={{ 
        fontSize: 14,
        fontFamily: 'Montserrat-Bold_0',
        color: themeColors.textSecondary,
        marginBottom: 16,
      }}>
        Permitir agregar información adicional a nivel de cabecera y pie de documento.
      </Text>

      {/* CABECERA */}
      <Text style={{ 
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'Montserrat-Bold_0',
        color: themeColors.text,
        marginTop: 12,
        marginBottom: 4,
      }}>
        Después de la fecha de emisión
      </Text>

      <TextInput
        style={inputStyle}
        placeholder="Cabecera 1"
        placeholderTextColor={themeColors.textSecondary}
        value={header1}
        onChangeText={(text) => updateSettings({ header1: text })}
      />
      <TextInput
        style={inputStyle}
        placeholder="Cabecera 2"
        placeholderTextColor={themeColors.textSecondary}
        value={header2}
        onChangeText={(text) => updateSettings({ header2: text })}
      />
      <TextInput
        style={inputStyle}
        placeholder="Cabecera 3"
        placeholderTextColor={themeColors.textSecondary}
        value={header3}
        onChangeText={(text) => updateSettings({ header3: text })}
      />
      <TextInput
        style={inputStyle}
        placeholder="Cabecera 4"
        placeholderTextColor={themeColors.textSecondary}
        value={header4}
        onChangeText={(text) => updateSettings({ header4: text })}
      />
      <TextInput
        style={inputStyle}
        placeholder="Cabecera 5"
        placeholderTextColor={themeColors.textSecondary}
        value={header5}
        onChangeText={(text) => updateSettings({ header5: text })}
      />
      <TextInput
        style={inputStyle}
        placeholder="Cabecera 6"
        placeholderTextColor={themeColors.textSecondary}
        value={header6}
        onChangeText={(text) => updateSettings({ header6: text })}
      />

      {/* PIE */}
      <Text style={{ 
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'Montserrat-Bold_0',
        color: themeColors.text,
        marginTop: 20,
        marginBottom: 4,
      }}>
        Después del total
      </Text>

      <TextInput
        style={inputStyle}
        placeholder="Pie 1"
        placeholderTextColor={themeColors.textSecondary}
        value={footer1}
        onChangeText={(text) => updateSettings({ footer1: text })}
      />
      <TextInput
        style={inputStyle}
        placeholder="Pie 2"
        placeholderTextColor={themeColors.textSecondary}
        value={footer2}
        onChangeText={(text) => updateSettings({ footer2: text })}
      />
      <TextInput
        style={inputStyle}
        placeholder="Pie 3"
        placeholderTextColor={themeColors.textSecondary}
        value={footer3}
        onChangeText={(text) => updateSettings({ footer3: text })}
      />
      <TextInput
        style={inputStyle}
        placeholder="Pie 4"
        placeholderTextColor={themeColors.textSecondary}
        value={footer4}
        onChangeText={(text) => updateSettings({ footer4: text })}
      />
      <TextInput
        style={inputStyle}
        placeholder="Pie 5"
        placeholderTextColor={themeColors.textSecondary}
        value={footer5}
        onChangeText={(text) => updateSettings({ footer5: text })}
      />
      <TextInput
        style={inputStyle}
        placeholder="Pie 6"
        placeholderTextColor={themeColors.textSecondary}
        value={footer6}
        onChangeText={(text) => updateSettings({ footer6: text })}
      />
    </View>
  );
};
