import React, { useEffect, useRef } from 'react';
import {
  AppState,
  InteractionManager,
  TouchableOpacity,
  Text,
  View,
  type AppStateStatus,
} from 'react-native';
import { usePaymentHubStore } from '../../stores/paymentHubStore';
import { PaymentHubAgent } from '../../services/paymentHubAgent';
import { navigationRef, navigateToExternalPayment } from '../../navigation/navigationRef';
import type { PaymentIntent } from '../../services/paymentHubService';
import { formatExternalPaymentBanner } from '../../utils/externalPaymentSummary';
import { useAlertStore } from '../../stores/alertStore';
import {
  buildExternalIntentClosureCopy,
  startIntentStatusPolling,
} from '../../utils/externalIntentWatch';

interface PaymentHubListenerProps {
  currentRouteName?: string;
}

/**
 * Puente React ↔ agente en background.
 * El agente solo encola intents; la navegación ocurre aquí (hilo UI seguro).
 */
export const PaymentHubListener: React.FC<PaymentHubListenerProps> = ({ currentRouteName }) => {
  const {
    gatewayModeEnabled,
    serverExternalPaymentEnabled,
    incomingIntent,
    activeIntent,
    setIncomingIntent,
  } = usePaymentHubStore();
  const { showAlert } = useAlertStore();

  const appState = useRef<AppStateStatus>(AppState.currentState);
  const navigatingRef = useRef(false);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      const prev = appState.current;
      appState.current = next;
      if (next === 'active' && prev !== 'active' && usePaymentHubStore.getState().gatewayModeEnabled) {
        PaymentHubAgent.refreshTerminalState()
          .then(() => PaymentHubAgent.runIfNeeded())
          .catch(() => {});
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (appState.current !== 'active') return;
    if (!gatewayModeEnabled) return;
    PaymentHubAgent.runIfNeeded().catch(() => {});
  }, [incomingIntent, currentRouteName, gatewayModeEnabled, serverExternalPaymentEnabled]);

  useEffect(() => {
    if (!incomingIntent?.id || activeIntent || currentRouteName === 'ExternalPayment') {
      return;
    }

    const stopPolling = startIntentStatusPolling({
      intentId: incomingIntent.id,
      onClosed: (intent, status) => {
        setIncomingIntent(null);
        PaymentHubAgent.releaseHandlingLock();
        const copy = buildExternalIntentClosureCopy(intent, status);
        showAlert(copy.title, copy.message);
      },
    });

    return stopPolling;
  }, [incomingIntent?.id, activeIntent, currentRouteName, setIncomingIntent, showAlert]);

  useEffect(() => {
    if (!incomingIntent || activeIntent || currentRouteName === 'ExternalPayment') {
      return;
    }
    if (!gatewayModeEnabled || !serverExternalPaymentEnabled) {
      return;
    }
    if (!navigationRef.isReady() || navigatingRef.current) {
      return;
    }
    if (appState.current !== 'active') {
      return;
    }

    navigatingRef.current = true;
    const intent: PaymentIntent = incomingIntent;

    const task = InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        try {
          if (!navigationRef.isReady()) {
            navigatingRef.current = false;
            return;
          }
          usePaymentHubStore.getState().setActiveIntent(intent);
          setIncomingIntent(null);
          navigateToExternalPayment(intent);
        } catch (error) {
          console.error('[PaymentHubListener] Error navegando a cobro externo:', error);
        } finally {
          navigatingRef.current = false;
        }
      });
    });

    return () => task.cancel();
  }, [incomingIntent, activeIntent, currentRouteName, setIncomingIntent, gatewayModeEnabled, serverExternalPaymentEnabled]);

  const isBackground = appState.current !== 'active';

  const showBanner =
    gatewayModeEnabled &&
    serverExternalPaymentEnabled &&
    incomingIntent &&
    currentRouteName !== 'ExternalPayment' &&
    isBackground;

  const showInAppBanner =
    gatewayModeEnabled &&
    serverExternalPaymentEnabled &&
    incomingIntent &&
    currentRouteName !== 'ExternalPayment' &&
    !isBackground &&
    !activeIntent;

  const bannerIntent = incomingIntent;
  if (!bannerIntent || (!showBanner && !showInAppBanner)) {
    return null;
  }

  const openPayment = () => {
    if (!navigationRef.isReady()) return;
    usePaymentHubStore.getState().setActiveIntent(bannerIntent);
    setIncomingIntent(null);
    navigateToExternalPayment(bannerIntent);
  };

  const bannerText = formatExternalPaymentBanner(bannerIntent);

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        elevation: 9999,
      }}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={openPayment}
        style={{
          backgroundColor: '#213d8b',
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderBottomWidth: 3,
          borderBottomColor: '#03C0C3',
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
          {showBanner ? 'Cobro externo en cola' : bannerText.title}
        </Text>
        <Text style={{ color: '#e8f4ff', fontSize: 14, marginTop: 4 }}>
          {bannerText.detail}
          {showBanner ? ' — desbloquea el POS para atender' : ' — toca para abrir'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
