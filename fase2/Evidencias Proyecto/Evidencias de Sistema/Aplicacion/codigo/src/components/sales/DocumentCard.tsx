import React, { memo } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { formatCurrency, formatDate } from '../../utils/format';
import { useThemeColors } from '../../hooks/useThemeColors';

interface DocumentCardProps {
  // Información del documento
  folio: number;
  documentTypeName: string;
  documentType?: number;
  date: string;
  total: number;
  paymentMethod?: string;
  isNC: boolean;
  isSynced: boolean;
  
  // Estado de anulación
  isAnulado: boolean;
  annulmentBannerText?: string;
  annulmentBannerColor?: string;
  
  // Propina (solo para pagos recibidos sin DTE)
  tip?: number;

  // Acciones
  onPress: () => void;
  onAnnul?: () => void;
  
  // Identificador único para el key
  keyPrefix: string;
}

export const DocumentCard = memo<DocumentCardProps>(({
  folio,
  documentTypeName,
  documentType,
  date,
  total,
  tip,
  paymentMethod,
  isNC,
  isSynced,
  isAnulado,
  annulmentBannerText,
  annulmentBannerColor = '#00bdce',
  onPress,
  onAnnul,
  keyPrefix,
}) => {
  const themeColors = useThemeColors();
  const canAnnul = !!onAnnul && !isNC && !isAnulado;

  // Determinar el ícono según el tipo de documento
  const getDocumentIcon = () => {
    // Pagos recibidos (sin documento fiscal)
    if (!documentType || documentType === 0) {
      return require('../../../assets/icons_new/efectivo_rosa.png');
    }
    if (documentType === 39 || documentType === 41) {
      return require('../../../assets/icons_new2/boleta01.png');
    }
    if (documentType === 33 || documentType === 34) {
      return require('../../../assets/icons_new/factura_rosa_claro.png');
    }
    // Por defecto, usar ícono de boleta
    return require('../../../assets/icons_new2/boleta01.png');
  };

  return (
    <View style={{ marginBottom: 15 }}>
      {/* Botón Anular */}
      {canAnnul && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: -10,
            right: 15,
            zIndex: 10,
            backgroundColor: '#FFFFFF',
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 15,
            borderWidth: 1,
            borderColor: themeColors.secondary,
            flexDirection: 'row',
            alignItems: 'center',
          }}
          onPress={onAnnul}
        >
          <Text style={{ color: themeColors.secondary, fontSize: 12, fontWeight: 'bold' }}>Anular</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity 
        style={{ marginBottom: 15 }}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {/* Banner de anulación/corrección - FUERA del view con opacity para que siempre se vea claro */}
        {annulmentBannerText && (
          <View style={{ 
            marginBottom: 8, 
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 8,
            backgroundColor: isAnulado ? '#F5F5F5' : '#FFFFFF',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            borderColor: isAnulado ? '#CCCCCC' : themeColors.secondary,
            borderWidth: 1.5,
            borderBottomWidth: 0,
          }}>
            <Text style={{ fontSize: 12, color: annulmentBannerColor, fontWeight: 'bold' }}>
              {annulmentBannerText}
            </Text>
            <View style={{ 
              height: 1, 
              backgroundColor: annulmentBannerColor, 
              marginTop: 8 
            }} />
          </View>
        )}

        <View
          style={{
            backgroundColor: isAnulado ? '#F5F5F5' : '#FFFFFF',
            borderColor: isAnulado ? '#CCCCCC' : themeColors.secondary,
            borderWidth: 1.5,
            borderRadius: 16,
            ...(annulmentBannerText ? { borderTopLeftRadius: 0, borderTopRightRadius: 0 } : {}),
            padding: 16,
            opacity: isAnulado ? 0.7 : 1,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* Icono Documento */}
            <Image
              source={getDocumentIcon()}
              style={{
                width: 45,
                height: 45,
                marginRight: 15,
                tintColor: isAnulado ? '#CCCCCC' : themeColors.secondary
              }}
              resizeMode="contain"
            />

            {/* Información Central */}
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 16,
                fontWeight: 'bold',
                color: isAnulado ? '#999999' : themeColors.secondary,
                textDecorationLine: isAnulado ? 'line-through' : 'none'
              }}>
                Folio: {folio}
              </Text>
              <Text style={{
                fontSize: 14,
                color: isAnulado ? '#999999' : themeColors.secondary,
                marginTop: 2
              }}>
                {documentTypeName}
              </Text>
              <Text style={{
                fontSize: 14,
                color: isAnulado ? '#999999' : themeColors.secondary,
                marginTop: 2
              }}>
                {formatDate(date, 'DD/MM/YYYY HH:mm')}
              </Text>
              {!isNC && paymentMethod && (
                <Text style={{
                  fontSize: 12,
                  color: isAnulado ? '#AAAAAA' : themeColors.secondary,
                  marginTop: 4,
                  fontStyle: 'italic'
                }}>
                  {paymentMethod}
                </Text>
              )}
            </View>

            {/* Monto y Estado */}
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: isAnulado ? '#999999' : themeColors.secondary,
                textDecorationLine: isAnulado ? 'line-through' : 'none'
              }}>
                {formatCurrency(total)}
              </Text>
              {!!tip && tip > 0 && (
                <Text style={{
                  fontSize: 11,
                  color: isAnulado ? '#AAAAAA' : themeColors.secondary,
                  marginTop: 2,
                  fontStyle: 'italic',
                  opacity: 0.8,
                }}>
                  inc. propina {formatCurrency(tip)}
                </Text>
              )}

              {/* Indicador de Sincronización - Solo mostrar si tiene tipo de documento válido (no 0) */}
              {documentType !== undefined && documentType !== null && documentType !== 0 && (
                <View style={{ marginTop: 8 }}>
                  <View style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: isAnulado ? '#CCCCCC' : themeColors.secondary,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <Text style={{ 
                      color: isAnulado ? '#CCCCCC' : themeColors.secondary, 
                      fontSize: 14, 
                      fontWeight: 'bold' 
                    }}>
                      {isSynced ? '✓' : '-'}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
});

DocumentCard.displayName = 'DocumentCard';
