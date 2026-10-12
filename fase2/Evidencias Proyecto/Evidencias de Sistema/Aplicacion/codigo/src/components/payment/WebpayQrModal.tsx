import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from 'react-native';
import AppModal from '../base/AppModal';
import { formatCurrency } from '../../utils/format';
import { useThemeColors } from '../../hooks/useThemeColors';
import type { WebpayQrCheckoutPayload } from '../../types/paymentGateway';
import { WEBPAY_CHECKOUT_TIMEOUT_SEC } from '../../services/paymentGateway/webpayCheckoutConstants';

interface WebpayQrModalProps {
  visible: boolean;
  payload: WebpayQrCheckoutPayload | null;
  waiting?: boolean;
  startedAt?: number | null;
  onCancelCheckout?: () => void;
  onOpenBrowser?: () => void;
}

function formatRemaining(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const WebpayQrModal: React.FC<WebpayQrModalProps> = ({
  visible,
  payload,
  waiting = true,
  startedAt,
  onCancelCheckout,
  onOpenBrowser,
}) => {
  const themeColors = useThemeColors();
  const [remainingSec, setRemainingSec] = useState(WEBPAY_CHECKOUT_TIMEOUT_SEC);

  useEffect(() => {
    if (!visible || !startedAt) {
      setRemainingSec(WEBPAY_CHECKOUT_TIMEOUT_SEC);
      return undefined;
    }

    const tick = () => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const left = Math.max(0, WEBPAY_CHECKOUT_TIMEOUT_SEC - elapsed);
      setRemainingSec(left);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [visible, startedAt]);

  const openBrowser = async () => {
    if (!payload?.qr_page_url) return;
    if (onOpenBrowser) {
      onOpenBrowser();
      return;
    }
    const can = await Linking.canOpenURL(payload.qr_page_url);
    if (can) await Linking.openURL(payload.qr_page_url);
  };

  return (
    <AppModal
      visible={visible}
      title="Pago Webpay (QR)"
      maxWidth={440}
      onClose={onCancelCheckout}
      buttons={
        onCancelCheckout
          ? [
              {
                text: 'Cancelar cobro',
                onPress: onCancelCheckout,
                variant: 'secondary' as const,
              },
            ]
          : undefined
      }
    >
      {!payload ? (
        <ActivityIndicator color="#d4186e" style={{ marginVertical: 24 }} />
      ) : (
        <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={[styles.amount, { color: themeColors.isDark ? '#fff' : '#111' }]}>
            {formatCurrency(payload.amount)}
          </Text>
          <Text style={styles.hint}>{payload.instructions}</Text>
          <Text style={styles.timer}>
            Tiempo restante: <Text style={styles.timerValue}>{formatRemaining(remainingSec)}</Text>
          </Text>
          <Image
            source={{ uri: payload.qr_data_url }}
            style={styles.qr}
            accessibilityLabel="Código QR checkout Webpay"
          />
          {waiting ? (
            <ActivityIndicator size="small" color="#d4186e" style={{ marginTop: 12 }} />
          ) : null}
          <Text style={styles.waitText}>
            Escanea el QR o abre el enlace. Si expira el tiempo, vuelve al cobro para un QR nuevo.
          </Text>
          <TouchableOpacity onPress={openBrowser} style={styles.linkBtn}>
            <Text style={styles.linkText}>Abrir pantalla QR en navegador</Text>
          </TouchableOpacity>
          {payload.test_cards.length > 0 ? (
            <View style={styles.cardsBox}>
              <Text style={styles.cardsTitle}>Tarjetas de prueba (integración)</Text>
              {payload.test_cards.map(card => (
                <Text key={card.label} style={styles.cardLine}>
                  <Text style={styles.cardLabel}>{card.label}: </Text>
                  {card.pan} · CVV {card.cvv}
                </Text>
              ))}
            </View>
          ) : null}
          <Text style={styles.meta}>Orden: {payload.buy_order || payload.payment_id}</Text>
        </ScrollView>
      )}
    </AppModal>
  );
};

const styles = StyleSheet.create({
  scroll: { maxHeight: 480 },
  amount: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  hint: { fontSize: 13, color: '#64748b', textAlign: 'center', marginBottom: 8 },
  timer: { fontSize: 13, textAlign: 'center', color: '#64748b', marginBottom: 12 },
  timerValue: { fontWeight: '700', color: '#d4186e' },
  qr: {
    width: 260,
    height: 260,
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  waitText: { fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 12 },
  linkBtn: { marginTop: 12, alignItems: 'center' },
  linkText: { color: '#d4186e', fontSize: 13, textDecorationLine: 'underline' },
  cardsBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  cardsTitle: { fontWeight: '600', marginBottom: 8, fontSize: 13 },
  cardLine: { fontSize: 12, marginBottom: 6, color: '#334155' },
  cardLabel: { fontWeight: '600' },
  meta: { fontSize: 11, color: '#94a3b8', marginTop: 12, textAlign: 'center' },
});
