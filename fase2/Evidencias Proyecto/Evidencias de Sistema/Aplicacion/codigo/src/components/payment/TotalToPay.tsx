import React from 'react';
import { View, Text } from 'react-native';
import { useSalesStore } from '../../stores/salesStore';
import { formatCurrency } from '../../utils/format';
import { useThemeColors } from '../../hooks/useThemeColors';

/**
 * Componente que muestra el total a pagar (diseño proyecto antiguo)
 * Calcula el total sumando todos los items del carrito
 * Adaptado a tema claro/oscuro y optimizado para diferentes resoluciones
 */
export const TotalToPay: React.FC = () => {
  const getTotal = useSalesStore(state => state.getTotal);
  const total = getTotal();

  return (
    <View style={{
      backgroundColor: '#d4186e',
      paddingVertical: 12,
      paddingHorizontal: 15,
      width: '100%',
      marginTop: 10,
      alignItems: 'center',
    }}>
      <Text style={{
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 4,
      }}>
        Total a pagar
      </Text>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
        style={{
          color: '#FFFFFF',
          fontSize: 32,
          fontWeight: 'bold',
        }}>
        {formatCurrency(total)}
      </Text>
    </View>
  );
};
