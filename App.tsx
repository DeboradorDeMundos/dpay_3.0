/**
 * DTemite POS 2.0
 * D-PAY 2.0
 * Aplicación de Punto de Venta
 *
 * @format
 */

import React, { useEffect, useRef } from 'react';
import { StatusBar, Platform, AppState, type AppStateStatus } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useThemeStore } from './src/stores/themeStore';
import { usePrinterStore } from './src/stores/printerStore';
import { useAppUpdateStore } from './src/stores/appUpdateStore';
import { CustomAlert } from './src/components/base/CustomAlert';
import { AppUpdateModal } from './src/components/appUpdate/AppUpdateModal';
import { useAlertStore } from './src/stores/alertStore';

import BackgroundService from 'react-native-background-actions';
import { TuuSyncScheduler } from './src/services/tuuSyncService';
import { PaymentHubAgent } from './src/services/paymentHubAgent';
import { tuuPaymentService } from './src/services/tuuPayment';
import { IS_TUU_DEV, API_BASE_URL, PAYMENT_HUB_API_BASE_URL } from './src/services/apiClient';

// Tarea en segundo plano para mantener la app viva y sincronizar transacciones Tuu
const sleep = (time: any) => new Promise((resolve) => setTimeout(() => resolve(), time));

const backgroundTask = async (taskDataArguments: any) => {
  const { delay } = taskDataArguments;
  await new Promise(async (resolve) => {
    // Bucle infinito que mantiene el servicio activo
    for (let i = 0; BackgroundService.isRunning(); i++) {
      await sleep(delay);
      
      // Sincronizar transacciones Tuu pendientes cada minuto
      try {
        await TuuSyncScheduler.runIfNeeded();
      } catch (error) {
        console.error('[App] Error en sincronización automática Tuu:', error);
      }

      try {
        await PaymentHubAgent.runIfNeeded();
      } catch (error) {
        console.error('[App] Error en Payment Hub agent:', error);
      }
    }
  });
};

const backgroundOptions = {
  taskName: 'POSBackgroundService',
  taskTitle: 'D-PAY',
  taskDesc: 'D-PAY POS activo',
  taskIcon: {
    name: 'ic_launcher',
    type: 'mipmap',
  },
  color: '#213d8b',
  linkingURI: 'dtemitepos://',
  parameters: {
    delay: 5000,
  },
};

function App(): React.JSX.Element {
  const initializeTheme = useThemeStore((state) => state.initializeTheme);
  const initializePrinter = usePrinterStore((state) => state.initializePrinter);
  const initializeAppUpdate = useAppUpdateStore((state) => state.initialize);
  const checkForUpdate = useAppUpdateStore((state) => state.checkForUpdate);
  const reminderIntervalHours = useAppUpdateStore((state) => state.reminderIntervalHours);
  const { visible, title, message, buttons, hideAlert } = useAlertStore();
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const reminderTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    initializeTheme();
    initializePrinter();
    initializeAppUpdate();

    tuuPaymentService.setDevMode(IS_TUU_DEV);
    console.log(`[App] API: ${API_BASE_URL} | Hub: ${PAYMENT_HUB_API_BASE_URL} | TUU: ${IS_TUU_DEV ? 'DEV (paymentapp.dev)' : 'PROD (paymentapp)'}`);

    // Configurar StatusBar transparente para Android
    if (Platform.OS === 'android') {
      StatusBar.setTranslucent(true);
      StatusBar.setBackgroundColor('transparent');
    }

    // Sincronizar transacciones Tuu pendientes al iniciar
    const syncPendingTuuOnStartup = async () => {
      try {
        console.log('[App] Verificando transacciones Tuu pendientes al iniciar...');
        // Esperar 3 segundos para que los stores se inicialicen
        await new Promise(resolve => setTimeout(resolve, 3000));
        const count = await TuuSyncScheduler.forceSync();
        if (count > 0) {
          console.log(`[App] ✅ ${count} transacciones Tuu sincronizadas al iniciar`);
        }
      } catch (error) {
        console.error('[App] Error sincronizando Tuu al inicio:', error);
      }
    };

    syncPendingTuuOnStartup();

    // Chequeo de versión al iniciar (fail-open)
    const checkVersionOnStartup = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        await checkForUpdate();
      } catch (error) {
        console.warn('[App] Error chequeando versión al inicio:', error);
      }
    };
    checkVersionOnStartup();

    // Al volver a primer plano, reconsultar política
    const onAppStateChange = (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        checkForUpdate().catch(() => undefined);
      }
      appState.current = next;
    };
    const appStateSub = AppState.addEventListener('change', onAppStateChange);

    // Iniciar servicio en segundo plano
    const startBackgroundService = async () => {
      try {
        if (!BackgroundService.isRunning()) {
          console.log('Iniciando servicio en segundo plano...');
          await BackgroundService.start(backgroundTask, backgroundOptions);
          console.log('Servicio en segundo plano iniciado corerctamente');
        }
      } catch (e) {
        console.error('Error al iniciar servicio en segundo plano:', e);
      }
    };

    startBackgroundService();

    return () => {
      appStateSub.remove();
      if (reminderTimerRef.current) {
        clearInterval(reminderTimerRef.current);
        reminderTimerRef.current = null;
      }
    };
  }, []);

  // Reconsulta periódica según reminder_interval_hours de la API
  useEffect(() => {
    if (reminderTimerRef.current) {
      clearInterval(reminderTimerRef.current);
      reminderTimerRef.current = null;
    }
    const hours = Math.min(72, Math.max(1, reminderIntervalHours || 2));
    const ms = hours * 60 * 60 * 1000;
    reminderTimerRef.current = setInterval(() => {
      checkForUpdate().catch(() => undefined);
    }, ms);
    return () => {
      if (reminderTimerRef.current) {
        clearInterval(reminderTimerRef.current);
        reminderTimerRef.current = null;
      }
    };
  }, [reminderIntervalHours, checkForUpdate]);

  return (
    <SafeAreaProvider>
      <RootNavigator />
      <CustomAlert
        visible={visible}
        title={title}
        message={message}
        buttons={buttons}
        onClose={hideAlert}
      />
      <AppUpdateModal />
    </SafeAreaProvider>
  );
}

export default App;
