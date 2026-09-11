import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useSettingsStore } from '../../stores/settingsStore';
import { PaymentGatewayFactory } from '../../services/paymentGateway';
import type { IPaymentGateway } from '../../types/paymentGateway';

/**
 * HU-04: muestra pasarela activa y auto-selección cuando hay una sola opción.
 */
export const PaymentGatewayBadge: React.FC = () => {
  const themeColors = useThemeColors();
  const devicePaymentProfile = useSettingsStore(s => s.devicePaymentProfile);
  const availableGatewayIds = useSettingsStore(s => s.availableGatewayIds);
  const [gateways, setGateways] = useState<IPaymentGateway[]>([]);
  const [active, setActive] = useState<IPaymentGateway | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await PaymentGatewayFactory.listAvailableForProfile(
        devicePaymentProfile,
        availableGatewayIds,
      );
      const defaultGw = await PaymentGatewayFactory.getDefaultCardGateway(
        devicePaymentProfile,
        availableGatewayIds,
      );
      if (!cancelled) {
        setGateways(list);
        setActive(defaultGw);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [devicePaymentProfile, availableGatewayIds]);

  if (!devicePaymentProfile || gateways.length === 0) {
    return null;
  }

  const label =
    gateways.length === 1
      ? `Pasarela: ${active?.displayName ?? gateways[0].displayName}`
      : active
        ? `Pasarela: ${active.displayName}`
        : 'Sin pasarela de tarjeta';

  return (
    <View style={{ marginHorizontal: 20, marginBottom: 8 }}>
      <Text
        style={{
          fontSize: 12,
          color: themeColors.isDark ? '#cccccc' : '#666666',
        }}>
        {label}
        {devicePaymentProfile === 'GENERIC_MOBILE' && __DEV__ ? ' · dev' : ''}
      </Text>
    </View>
  );
};
