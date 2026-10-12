import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useSettingsStore } from '../../stores/settingsStore';
import { useThemeColors } from '../../hooks/useThemeColors';
import { fetchDpayComisiones } from '../../services/api';

export const DpayComisionesConfig: React.FC = () => {
  const { dpayComisiones, setDpayComisiones } = useSettingsStore();
  const themeColors = useThemeColors();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadComisiones = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDpayComisiones();
      setDpayComisiones(data);
    } catch (err) {
      console.error('Error cargando comisiones DPay:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!dpayComisiones) {
      loadComisiones();
    }
  }, []);

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('es-CL')}`;
  };

  const getTipoComisionLabel = (tipo: 'fija' | 'mixta') => {
    if (tipo === 'fija') {
      return 'Fija (% + IVA)';
    }
    return 'Mixta (% + Monto Fijo + IVA)';
  };

  return (
    <View style={{ marginBottom: 30 }}>
      <Text style={{ 
        fontSize: 18,
        fontFamily: 'Montserrat-Bold_0',
        color: '#03C0C3',
      }}>
        Comisiones DPay
      </Text>

      {loading && (
        <View style={{ marginTop: 10, alignItems: 'center' }}>
          <ActivityIndicator size="small" color={themeColors.primary} />
          <Text style={{ 
            fontSize: 14,
            fontFamily: 'Montserrat-Bold_0',
            color: themeColors.textSecondary,
            marginTop: 8,
          }}>
            Cargando comisiones...
          </Text>
        </View>
      )}

      {error && (
        <View style={{ marginTop: 10 }}>
          <Text style={{ 
            fontSize: 14,
            fontFamily: 'Montserrat-Bold_0',
            color: '#ff4444',
            marginBottom: 8,
          }}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={loadComisiones}
            style={{
              backgroundColor: themeColors.primary,
              padding: 10,
              borderRadius: 8,
              alignItems: 'center',
            }}>
            <Text style={{ 
              fontSize: 14,
              fontFamily: 'Montserrat-Bold_0',
              color: '#fff',
            }}>
              Reintentar
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && dpayComisiones && (
        <View style={{ marginTop: 10 }}>
          <View style={{
            borderWidth: 1,
            borderColor: themeColors.border,
            borderRadius: 8,
            padding: 12,
            backgroundColor: themeColors.background,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ 
                fontSize: 14,
                fontFamily: 'Montserrat-Bold_0',
                color: themeColors.text,
              }}>
                Estado:
              </Text>
              <Text style={{ 
                fontSize: 14,
                fontFamily: 'Montserrat-Bold_0',
                color: dpayComisiones.habilitado ? '#4caf50' : '#ff4444',
              }}>
                {dpayComisiones.habilitado ? 'Habilitado' : 'Deshabilitado'}
              </Text>
            </View>

            {dpayComisiones.habilitado && (
              <>
                <View style={{ 
                  height: 1, 
                  backgroundColor: themeColors.border, 
                  marginVertical: 8 
                }} />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ 
                    fontSize: 14,
                    fontFamily: 'Montserrat-Bold_0',
                    color: themeColors.text,
                  }}>
                    Tipo de Comisión:
                  </Text>
                  <Text style={{ 
                    fontSize: 14,
                    fontFamily: 'Montserrat-Bold_0',
                    color: themeColors.text,
                  }}>
                    {getTipoComisionLabel(dpayComisiones.tipo_comision)}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ 
                    fontSize: 14,
                    fontFamily: 'Montserrat-Bold_0',
                    color: themeColors.text,
                  }}>
                    Porcentaje:
                  </Text>
                  <Text style={{ 
                    fontSize: 14,
                    fontFamily: 'Montserrat-Bold_0',
                    color: themeColors.text,
                  }}>
                    {formatPercentage(dpayComisiones.comision_porcentaje)}
                  </Text>
                </View>

                {dpayComisiones.tipo_comision === 'mixta' && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ 
                      fontSize: 14,
                      fontFamily: 'Montserrat-Bold_0',
                      color: themeColors.text,
                    }}>
                      Monto Fijo Base:
                    </Text>
                    <Text style={{ 
                      fontSize: 14,
                      fontFamily: 'Montserrat-Bold_0',
                      color: themeColors.text,
                    }}>
                      {formatCurrency(dpayComisiones.comision_monto_fijo)}
                    </Text>
                  </View>
                )}

                <View style={{ 
                  marginTop: 8,
                  padding: 10,
                  backgroundColor: themeColors.background === '#111111' ? '#1a1a1a' : '#f5f5f5',
                  borderRadius: 6,
                }}>
                  <Text style={{ 
                    fontSize: 12,
                    fontFamily: 'Montserrat-Bold_0',
                    color: themeColors.textSecondary,
                    lineHeight: 18,
                  }}>
                    {dpayComisiones.tipo_comision === 'fija' 
                      ? `Comisión: (Monto × ${dpayComisiones.comision_porcentaje}%) + IVA`
                      : `Comisión: ((Monto × ${dpayComisiones.comision_porcentaje}%) + ${formatCurrency(dpayComisiones.comision_monto_fijo)}) + IVA`
                    }
                  </Text>
                </View>
              </>
            )}
          </View>

          <Text style={{ 
            fontSize: 14,
            fontFamily: 'Montserrat-Bold_0',
            color: themeColors.textSecondary,
            marginTop: 10,
          }}>
            Configuración de comisiones para pagos con DPay
          </Text>
        </View>
      )}
    </View>
  );
};
