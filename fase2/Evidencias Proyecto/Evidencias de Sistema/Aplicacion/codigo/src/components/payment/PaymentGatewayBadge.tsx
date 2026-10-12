import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useSettingsStore } from '../../stores/settingsStore';
import { PaymentGatewayFactory } from '../../services/paymentGateway/PaymentGatewayFactory';
import type { GatewayProviderId, IPaymentGateway } from '../../types/paymentGateway';

type Props = {
  selectedId: GatewayProviderId | null;
  onSelect: (id: GatewayProviderId) => void;
};

/**
 * HU-04: una sola pasarela se muestra como badge.
 * Con dos o más, el cajero elige cuál usar en el cobro.
 */
export const PaymentGatewayBadge: React.FC<Props> = ({ selectedId, onSelect }) => {
  const themeColors = useThemeColors();
  const devicePaymentProfile = useSettingsStore(s => s.devicePaymentProfile);
  const availableGatewayIds = useSettingsStore(s => s.availableGatewayIds);
  const [gateways, setGateways] = useState<IPaymentGateway[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await PaymentGatewayFactory.listAvailableForProfile(
        devicePaymentProfile,
        availableGatewayIds,
      );
      if (!cancelled) {
        setGateways(list);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [devicePaymentProfile, availableGatewayIds]);

  if (!devicePaymentProfile || gateways.length === 0) {
    return null;
  }

  const devSuffix = devicePaymentProfile === 'GENERIC_MOBILE' && __DEV__ ? ' · dev' : '';
  const active = gateways.find(g => g.id === selectedId) ?? gateways[0];

  if (gateways.length === 1) {
    return (
      <View style={{ marginHorizontal: 20, marginBottom: 8 }}>
        <Text
          style={{
            fontSize: 12,
            color: themeColors.isDark ? themeColors.textSecondary : '#666666',
          }}>
          {`Pasarela: ${active.displayName}${devSuffix}`}
        </Text>
      </View>
    );
  }

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel="Pasarela de tarjeta"
      style={{ marginHorizontal: 20, marginBottom: 8, gap: 8 }}>
      <Text
        style={{
          fontSize: 12,
          color: themeColors.isDark ? themeColors.textSecondary : '#666666',
        }}>
        {`Elegir pasarela${devSuffix}`}
      </Text>
      {gateways.map(gateway => {
        const selected = gateway.id === selectedId;
        return (
          <Pressable
            key={gateway.id}
            accessibilityRole="radio"
            accessibilityLabel={gateway.displayName}
            accessibilityState={{ selected, checked: selected }}
            onPress={() => onSelect(gateway.id)}
            style={{
              minHeight: 44,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: themeColors.secondary,
              backgroundColor: selected ? themeColors.secondary : themeColors.background,
              paddingHorizontal: 14,
              justifyContent: 'center',
            }}>
            <Text
              style={{
                fontSize: 15,
                fontWeight: '600',
                color: selected ? '#FFFFFF' : themeColors.text,
              }}>
              {gateway.displayName}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};
