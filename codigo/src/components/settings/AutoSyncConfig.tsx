import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '../../hooks/useThemeColors';

/**
 * Componente informativo de sincronización automática
 * La sincronización está SIEMPRE ACTIVA y no puede ser desactivada
 */
export const AutoSyncConfig: React.FC = () => {
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
          Sincronización Automática
        </Text>
        <View style={{
          backgroundColor: '#03C0C3',
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 6,
        }}>
          <Text style={{
            color: '#FFFFFF',
            fontSize: 14,
            fontFamily: 'Montserrat-Bold_0',
          }}>
            ✓ ACTIVA
          </Text>
        </View>
      </View>
      <Text style={{ 
        fontSize: 14,
        color: themeColors.textSecondary,
        marginTop: 10,
        lineHeight: 20,
      }}>
        Los documentos se sincronizan automáticamente con DTemite al completar la venta para generar el TED. 
        Las transacciones de pago Tuu también se registran automáticamente en el backend.
      </Text>
      <Text style={{ 
        fontSize: 12,
        color: '#03C0C3',
        marginTop: 8,
        fontFamily: 'Montserrat-Bold_0',
      }}>
        💡 Esta función está siempre activa para garantizar la integridad de los datos
      </Text>
    </View>
  );
};
