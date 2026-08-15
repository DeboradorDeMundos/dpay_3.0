import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform } from 'react-native';
import ImmersiveMode from 'react-native-immersive-mode';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';
import { usePaymentHubStore } from '../stores/paymentHubStore';
import type { RootStackParamList } from './types';

// Screens
import LoginScreen from '../screens/LoginScreen';
import { SaleScreen } from '../screens/SaleScreen';
import { PaymentMethodScreen } from '../screens/PaymentMethodScreen';
import { DocumentTypeScreen } from '../screens/DocumentTypeScreen';
import { SaleCompletedScreen } from '../screens/SaleCompletedScreen';
import { CatalogueScreen } from '../screens/CatalogueScreen';
import { ClientsScreen } from '../screens/ClientsScreen';
import { MySalesScreen } from '../screens/MySalesScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ViewInvoiceScreen } from '../screens/ViewInvoiceScreen';
import { ShareScreen } from '../screens/ShareScreen';
import { PrinterSettingsScreen } from '../screens/PrinterSettingsScreen';
import { DocumentTypeSelectorScreen } from '../screens/DocumentTypeSelectorScreen';
import { PaymentMethodSelectorScreen } from '../screens/PaymentMethodSelectorScreen';
import { CreditNoteScreen } from '../screens/CreditNoteScreen';
import { ExternalPaymentScreen } from '../screens/ExternalPaymentScreen';
import { navigationRef } from './navigationRef';
import { PaymentHubListener } from '../components/paymentHub/PaymentHubListener';
import { PaymentHubAgent } from '../services/paymentHubAgent';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const { loadFromStorage, isAuthenticated, token } = useAuthStore();
  const { loadFromStorage: loadSettings } = useSettingsStore();
  const { loadFromStorage: loadPaymentHub } = usePaymentHubStore();
  const [currentRouteName, setCurrentRouteName] = useState<string | undefined>();

  useEffect(() => {
    loadFromStorage();
    loadSettings();
    loadPaymentHub();

    const refreshHub = setTimeout(() => {
      const hub = usePaymentHubStore.getState();
      const auth = useAuthStore.getState();
      if (auth.token && hub.gatewayModeEnabled) {
        PaymentHubAgent.refreshTerminalState()
          .then(() => PaymentHubAgent.runIfNeeded())
          .catch(() => {});
      }
    }, 800);

    return () => clearTimeout(refreshHub);
  }, []);

  // Función para mantener el modo inmersivo
  const restoreImmersiveMode = () => {
    if (Platform.OS === 'android') {
      try {
        ImmersiveMode.setBarMode('FullSticky');
        ImmersiveMode.fullLayout(true);
      } catch (error) {
        console.warn('Error restaurando modo inmersivo:', error);
      }
    }
  };

  return (
    <NavigationContainer
      ref={navigationRef}
      onStateChange={() => {
        setCurrentRouteName(navigationRef.getCurrentRoute()?.name);
        setTimeout(restoreImmersiveMode, 50);
      }}
      onReady={() => {
        setCurrentRouteName(navigationRef.getCurrentRoute()?.name);
      }}
    >
      {isAuthenticated && token ? (
        <PaymentHubListener currentRouteName={currentRouteName} />
      ) : null}
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {!isAuthenticated || !token ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Sale" component={SaleScreen} />
            <Stack.Screen name="PaymentMethod" component={PaymentMethodScreen} />
            <Stack.Screen name="DocumentType" component={DocumentTypeScreen} />
            <Stack.Screen name="SaleCompleted" component={SaleCompletedScreen} />
            <Stack.Screen name="Catalogue" component={CatalogueScreen} />
            <Stack.Screen name="Clients" component={ClientsScreen} />
            <Stack.Screen name="MySales" component={MySalesScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="PrinterSettings" component={PrinterSettingsScreen} />
            <Stack.Screen name="DocumentTypeSelector" component={DocumentTypeSelectorScreen} />
            <Stack.Screen name="PaymentMethodSelector" component={PaymentMethodSelectorScreen} />
            <Stack.Screen name="ViewInvoice" component={ViewInvoiceScreen} />
            <Stack.Screen name="Share" component={ShareScreen} />
            <Stack.Screen name="CreditNote" component={CreditNoteScreen} />
            <Stack.Screen name="ExternalPayment" component={ExternalPaymentScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
