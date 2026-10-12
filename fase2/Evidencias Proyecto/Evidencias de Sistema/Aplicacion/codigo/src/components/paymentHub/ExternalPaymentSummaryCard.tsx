import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { INTEGRATED_CLOUD_LABEL, type ExternalPaymentDisplay } from '../../utils/externalPaymentSummary';
import { formatCurrency } from '../../utils/format';

interface Props {
  display: ExternalPaymentDisplay;
  compact?: boolean;
}

const Row: React.FC<{ label: string; value: string; themeColors: ReturnType<typeof useThemeColors> }> = ({
  label,
  value,
  themeColors,
}) => {
  if (!value) return null;
  return (
    <View style={{ flexDirection: 'row', marginBottom: 8 }}>
      <Text style={{ width: 108, fontSize: 13, color: themeColors.textSecondary, fontWeight: '600' }}>{label}</Text>
      <Text style={{ flex: 1, fontSize: 13, color: themeColors.text }}>{value}</Text>
    </View>
  );
};

export const ExternalPaymentSummaryCard: React.FC<Props> = ({ display, compact = false }) => {
  const themeColors = useThemeColors();
  const borderColor = themeColors.border || '#e4e6ef';
  const cardBg = themeColors.background === '#FFFFFF' ? '#f8f9fb' : '#1a1a1a';

  return (
    <View
      style={{
        backgroundColor: cardBg,
        borderRadius: 14,
        borderWidth: 1,
        borderColor,
        padding: compact ? 14 : 16,
        marginBottom: compact ? 0 : 16,
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: '700', color: '#03C0C3', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>
        {display.title}
      </Text>

      {display.description ? (
        <Text style={{ fontSize: 15, fontWeight: '600', color: themeColors.text, marginBottom: 10 }}>
          {display.description}
        </Text>
      ) : null}

      <Text style={{ fontSize: compact ? 28 : 36, fontWeight: '800', color: themeColors.text, marginBottom: 12 }}>
        {display.flowType === 'print_only' ? 'Sin cobro' : formatCurrency(display.amount)}
      </Text>

      <Row
        label="Medio de pago"
        value={
          display.flowType === 'print_only'
            ? 'Solo impresión'
            : display.paymentMethod === 'cash'
              ? 'Efectivo'
              : 'Tarjeta'
        }
        themeColors={themeColors}
      />

      <Row label="Cliente" value={display.customerName || ''} themeColors={themeColors} />
      <Row label="RUT" value={display.customerRut || ''} themeColors={themeColors} />
      <Row label="Documento" value={display.documentTypeLabel || ''} themeColors={themeColors} />
      <Row label="Referencia" value={display.documentReference || ''} themeColors={themeColors} />
      <Row label="Enviado por" value={display.initiatedBy || ''} themeColors={themeColors} />
      <Row
        label="Referencia externa"
        value={display.externalId || ''}
        themeColors={themeColors}
      />
      <Row label="Terminal" value={display.terminalCode || ''} themeColors={themeColors} />

      {display.lines.length > 0 ? (
        <View style={{ marginTop: 8 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: themeColors.text, marginBottom: 8 }}>
            Detalle ({display.lineCount})
          </Text>
          <ScrollView
            style={{ maxHeight: compact ? 120 : 180 }}
            nestedScrollEnabled
            showsVerticalScrollIndicator
          >
            {display.lines.map((line, index) => (
              <View
                key={`${line.description}-${index}`}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  paddingVertical: 8,
                  borderTopWidth: index === 0 ? 0 : 1,
                  borderTopColor: borderColor,
                  gap: 12,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, color: themeColors.text, fontWeight: '600' }}>{line.description}</Text>
                  <Text style={{ fontSize: 12, color: themeColors.textSecondary, marginTop: 2 }}>
                    {line.quantity} x {formatCurrency(line.unitPrice)}
                  </Text>
                </View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: themeColors.text }}>
                  {formatCurrency(line.subtotal)}
                </Text>
              </View>
            ))}
          </ScrollView>
          {display.documentTotal ? (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: borderColor }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: themeColors.textSecondary }}>Total documento</Text>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#03C0C3' }}>{formatCurrency(display.documentTotal)}</Text>
            </View>
          ) : null}
        </View>
      ) : display.flowType === 'print_only' ? (
        <Text style={{ fontSize: 13, color: themeColors.textSecondary, marginTop: 4 }}>
          Solicitud de impresión de ticket adicional. No se procesará pago en el terminal.
        </Text>
      ) : display.flowType === 'payment_only' && !display.description ? (
        <Text style={{ fontSize: 13, color: themeColors.textSecondary, marginTop: 4 }}>
          {display.fromPartner
            ? `Cobro solicitado desde ${INTEGRATED_CLOUD_LABEL}. Confirme el monto antes de procesar en TUU.`
            : 'Cobro solicitado desde el ERP. Confirme el monto antes de procesar en TUU.'}
        </Text>
      ) : null}

      {display.extraPrintLines && display.extraPrintLines.length > 0 ? (
        <View
          style={{
            marginTop: 12,
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: themeColors.border || '#e4e6ef',
            borderRadius: 8,
            padding: 10,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '700', color: themeColors.textSecondary, marginBottom: 4 }}>
            🖨 Ticket adicional
          </Text>
          {display.extraPrintLines.map((line, i) => (
            <Text key={i} style={{ fontSize: 12, color: themeColors.textSecondary }}>
              {line}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
};
