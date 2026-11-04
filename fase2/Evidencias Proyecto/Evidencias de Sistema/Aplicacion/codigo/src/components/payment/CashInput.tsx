import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Keyboard } from 'react-native';
import { formatCurrency } from '../../utils/format';
import { roundCashAmount } from '../../utils/cashRounding';
import { useThemeColors } from '../../hooks/useThemeColors';

interface CashInputProps {
  cash: string;
  setCash: (value: string) => void;
  /** Total exacto de la venta, antes del redondeo en efectivo. */
  total: number;
  onContinue: () => void;
  onFocus?: () => void;
}

/**
 * Input para pago en efectivo (diseño proyecto antiguo)
 * Muestra campo "Sencillo" con $ y calcula "Vuelto" automáticamente
 * Botón "Continuar" solo aparece cuando monto >= total en efectivo
 * Optimizado para mejor visibilidad con teclado activo
 *
 * El cobro en efectivo usa el total redondeado (Ley 20.956, ver utils/cashRounding).
 * Si difiere del total de la venta se muestra solo "Total efectivo", sin la
 * diferencia ni la referencia legal (decisión de producto); ese mismo total es
 * el que sale en la boleta o factura.
 */
export const CashInput: React.FC<CashInputProps> = ({ 
  cash, 
  setCash, 
  total, 
  onContinue,
  onFocus
}) => {
  const themeColors = useThemeColors();
  
  const cashTotal = roundCashAmount(total);

  // Calcula vuelto contra el total en efectivo (siempre >= 0 para mejorar UX)
  const cashNumber = cash ? parseInt(cash.replace(/\./g, ''), 10) : 0;
  const change = Math.max(0, cashNumber - cashTotal);
  const canContinue = cashNumber >= cashTotal;

  const handleCashChange = (text: string) => {
    const _cash = text.replace(/\$/g, '').replace(/\./g, '').trim();
    // formatCurrency retorna con $, lo quitamos para guardar solo el número
    const formatted = _cash !== '' ? formatCurrency(parseInt(_cash, 10)) : '';
    setCash(formatted.replace('$', '').trim());
    
    // Auto-dismiss keyboard cuando el monto es suficiente
    if (_cash && parseInt(_cash, 10) - cashTotal >= 0) {
      Keyboard.dismiss();
    }
  };

  return (
    <View style={{
      backgroundColor: themeColors.backgroundSecondary,
      width: '100%',
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderTopWidth: 1,
      borderTopColor: themeColors.border,
    }}>
      {/* Total redondeado: solo se muestra si el total no termina en 0 */}
      {cashTotal !== Math.round(total) && (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}>
          <Text style={{
            fontWeight: 'bold',
            fontSize: 16,
            color: themeColors.secondary,
            flex: 1,
          }}>
            Total efectivo
          </Text>
          <Text style={{
            fontWeight: 'bold',
            fontSize: 16,
            color: themeColors.secondary,
          }}>
            {formatCurrency(cashTotal)}
          </Text>
        </View>
      )}

      {/* Input Sencillo */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
      }}>
        <Text style={{
          fontWeight: 'bold',
          fontSize: 16,
          color: themeColors.secondary,
          flex: 1,
        }}>
          Sencillo
        </Text>
        <TextInput
          style={{
            fontSize: 16,
            flex: 2,
            textAlign: 'right',
            color: themeColors.secondary,
            fontWeight: 'bold',
            paddingVertical: 4,
          }}
          placeholder="$ Sencillo"
          placeholderTextColor={themeColors.textSecondary}
          autoCapitalize="none"
          keyboardType="numeric"
          value={cash ? `$ ${cash}` : ''}
          onChangeText={handleCashChange}
          onFocus={onFocus}
          returnKeyType="done"
        />
      </View>

      {/* Mostrar Vuelto */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Text style={{
          fontWeight: 'bold',
          fontSize: 16,
          color: themeColors.secondary,
          flex: 1,
        }}>
          Vuelto
        </Text>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
          style={{
            flex: 2,
            fontSize: 28,
            textAlign: 'right',
            color: themeColors.secondary,
            fontWeight: 'bold',
          }}>
          {formatCurrency(change)}
        </Text>
      </View>

      {/* Botón Continuar (solo si el monto es suficiente) */}
      {canContinue && (
        <View style={{
          flexDirection: 'row',
          alignSelf: 'center',
          marginTop: 12,
          marginBottom: 8,
        }}>
          <TouchableOpacity
            onPress={onContinue}
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              paddingVertical: 10,
              paddingHorizontal: 28,
              borderRadius: 12,
              backgroundColor: themeColors.secondary,
            }}>
            <Text style={{
              color: '#FFFFFF',
              fontWeight: 'bold',
              fontSize: 16,
            }}>
              Continuar
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};
