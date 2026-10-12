import React, { memo, useMemo } from 'react';
import { View, Text } from 'react-native';
import { useSalesStore } from '../../stores/salesStore';
import { formatCurrency } from '../../utils/format';
import { useThemeColors } from '../../hooks/useThemeColors';

interface ResumeProps {
  showMoreDetails?: boolean;
}

/**
 * Resumen de compra (diseño proyecto antiguo)
 * Siempre muestra: cuenta a pagar, total productos
 * Si showMoreDetails=true: cliente, método pago, total, vuelto, documento
 */
export const Resume = memo<ResumeProps>(({ showMoreDetails = false }) => {
  const { isDark } = useThemeColors();
  const sales = useSalesStore(state => state.sales);
  const currentSaleIndex = useSalesStore(state => state.currentSale);
  const client = useSalesStore(state => state.client);
  const paymentMethod = useSalesStore(state => state.paymentMethod);
  const change = useSalesStore(state => state.change);
  const documentType = useSalesStore(state => state.documentType);
  
  const currentSaleData = sales[currentSaleIndex];
  const results = currentSaleData?.results || [];
  const itemCount = results.length;
  
  const total = useMemo(() => {
    return results.reduce((sum, item) => {
      const itemTotal = typeof item.total === 'string' ? parseFloat(item.total) || 0 : item.total;
      return sum + itemTotal;
    }, 0);
  }, [results]);

  // Tema claro: fondo azul, letras blancas
  // Tema oscuro: fondo blanco, letras azules
  const bgColor = isDark ? '#FFFFFF' : '#052CCE';
  const textColor = isDark ? '#052CCE' : '#FFFFFF';

  return (
    <View style={{
      backgroundColor: bgColor,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      marginHorizontal: 15,
    }}>
      <Text style={{
        fontWeight: 'bold',
        fontSize: 15,
        color: textColor,
        marginBottom: 6,
      }}>
        Resumen de la compra
      </Text>

      {/* Cuenta a pagar */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 }}>
        <Text style={{ fontSize: 12, color: textColor }}>Cuenta a pagar: </Text>
        <Text style={{ fontSize: 12, color: textColor }}>
          {currentSaleIndex === 0 ? 1 : currentSaleIndex + 1}
        </Text>
      </View>

      {/* Total productos */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 }}>
        <Text style={{ fontSize: 12, color: textColor }}>Total de productos facturados: </Text>
        <Text style={{ fontSize: 12, color: textColor }}>
          {itemCount}
        </Text>
      </View>

      {/* Total a pagar - SIEMPRE se muestra */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 }}>
        <Text style={{ fontSize: 12, color: textColor }}>Total a pagar: </Text>
        <Text style={{ fontSize: 12, color: textColor }}>
          {formatCurrency(total)}
        </Text>
      </View>

      {/* Detalles adicionales (solo si showMoreDetails=true) */}
      {showMoreDetails && (
        <>
          {/* Cliente */}
          {client && (client.name || (client as any).razon) && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 }}>
              <Text style={{ fontSize: 12, color: textColor }}>Cliente: </Text>
              <Text style={{ fontSize: 12, color: textColor }}>
                {(client as any).razon || client.name}
              </Text>
            </View>
          )}

          {/* Método de pago */}
          {paymentMethod && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 }}>
              <Text style={{ fontSize: 12, color: textColor }}>Método de pago: </Text>
              <Text style={{ fontSize: 12, color: textColor }}>
                {paymentMethod}
              </Text>
            </View>
          )}

          {/* Vuelto: solo con efectivo y monto ingresado (evita valores residuales de ventas anteriores) */}
          {paymentMethod?.toLowerCase().includes('efectivo') && change && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 }}>
              <Text style={{ fontSize: 12, color: textColor }}>Vuelto: </Text>
              <Text style={{ fontSize: 12, color: textColor }}>
                {change}
              </Text>
            </View>
          )}

          {/* Tipo de documento */}
          {documentType?.name && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 }}>
              <Text style={{ fontSize: 12, color: textColor }}>Tipo de documento: </Text>
              <Text style={{ fontSize: 12, color: textColor }}>
                {documentType.name}
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
});

Resume.displayName = 'Resume';
