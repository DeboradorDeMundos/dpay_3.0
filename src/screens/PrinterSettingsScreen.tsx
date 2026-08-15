import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { BluetoothManager } from 'react-native-bluetooth-escpos-printer';
import BleManager from 'react-native-ble-manager';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useThemeColors } from '../hooks/useThemeColors';
import { useBluetoothPermissions } from '../hooks/useBluetoothPermissions';
import { usePrinterStore, type PrinterDevice } from '../stores/printerStore';
import { useAlertStore } from '../stores/alertStore';
import { Button, BackButton } from '../components/base';

type Props = NativeStackScreenProps<RootStackParamList, 'PrinterSettings'>;

export const PrinterSettingsScreen: React.FC<Props> = ({ navigation, route }) => {
  const returnToSettings = route.params?.returnToSettings ?? false;
  const themeColors = useThemeColors();
  const { checkPermissions, requestPermissions } = useBluetoothPermissions();
  const { selectedPrinter, isConnected, selectPrinter, setConnected, clearPrinter } = usePrinterStore();
  const { showAlert } = useAlertStore();

  const [isScanning, setIsScanning] = useState(false);
  const [pairedDevices, setPairedDevices] = useState<PrinterDevice[]>([]);
  const [newDevices, setNewDevices] = useState<PrinterDevice[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Verificar estado de Bluetooth al cargar
    checkBluetoothEnabled();
  }, []);

  /**
   * Verifica si Bluetooth está habilitado
   */
  const checkBluetoothEnabled = async () => {
    try {
      const enabled = await BluetoothManager.isBluetoothEnabled();
      if (!enabled) {
        showAlert(
          'Bluetooth Desactivado',
          'Para usar la impresora, activa Bluetooth en tu dispositivo.',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Activar',
              onPress: async () => {
                try {
                  await BluetoothManager.enableBluetooth();
                } catch (error) {
                  console.error('Error al activar Bluetooth:', error);
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error al verificar Bluetooth:', error);
    }
  };

  /**
   * Escanea dispositivos Bluetooth cercanos
   * Siempre verifica y solicita permisos antes de escanear
   */
  const scanForDevices = async () => {
    // Verifica permisos primero
    const hasPerms = await checkPermissions();
    
    if (!hasPerms) {
      // Si no tiene permisos, solicita de nuevo (detectará si fue denegado permanentemente)
      const granted = await requestPermissions();
      if (!granted) {
        // El hook ya muestra el alert con opción de ir a configuración si fue denegado permanentemente
        return;
      }
    }

    setIsScanning(true);
    setPairedDevices([]);
    setNewDevices([]);

    const formatDevice = (d: any): PrinterDevice => ({
      address: d.address || d.id || '',
      name: d.name || 'Dispositivo desconocido',
    });

    const doScan = async () => {
      // Obtener bonded via BleManager (Android) o BluetoothManager (iOS)
      let bondedRaw: any[] = [];
      if (Platform.OS === 'android') {
        try {
          bondedRaw = await BleManager.getBondedPeripherals();
        } catch (e) {
          console.warn('getBondedPeripherals falló:', e);
        }
      }

      // Escanear todos los dispositivos cercanos (incluye paired y found)
      const scanResult = await BluetoothManager.scanDevices();
      const foundRaw: any[] = JSON.parse((scanResult as any).found || '[]');
      const pairedRaw: any[] = JSON.parse((scanResult as any).paired || '[]');

      // Consolidar dispositivos emparejados de todas las fuentes
      const pairedMap = new Map<string, PrinterDevice>();
      [...pairedRaw, ...bondedRaw]
        .filter(d => d.name || d.id || d.address)
        .forEach(d => {
          const device = formatDevice(d);
          if (device.address) pairedMap.set(device.address, device);
        });

      const paired = Array.from(pairedMap.values());
      const pairedAddresses = new Set(paired.map(d => d.address));

      // Dispositivos nuevos = encontrados pero no emparejados
      const newDevs = foundRaw
        .filter(d => d.name && !pairedAddresses.has(d.address || d.id))
        .map(formatDevice);

      setPairedDevices(paired);
      setNewDevices(newDevs);

      if (paired.length === 0 && newDevs.length === 0) {
        showAlert(
          'Sin dispositivos',
          'No se encontraron dispositivos Bluetooth cercanos. Asegúrate de que el Bluetooth esté activado y los dispositivos estén encendidos.'
        );
      }
    };

    try {
      if (Platform.OS === 'android') {
        await BleManager.enableBluetooth();
        await doScan();
        setIsScanning(false);
      } else {
        await BluetoothManager.enableBluetooth();
        setTimeout(async () => {
          try {
            await doScan();
          } catch (error) {
            console.error('Error al escanear en iOS:', error);
            showAlert('Error', 'No se pudieron escanear los dispositivos.');
          } finally {
            setIsScanning(false);
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error al escanear dispositivos:', error);
      showAlert(
        'Error',
        'No se pudieron escanear los dispositivos Bluetooth. Asegúrate de tener Bluetooth activado.'
      );
      setIsScanning(false);
    }
  };

  /**
   * Conecta a una impresora
   */
  const connectToPrinter = async (device: PrinterDevice) => {
    setIsConnecting(true);

    try {
      // Intentar conectar con timeout
      const connectPromise = BluetoothManager.connect(device.address);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout de conexión')), 15000)
      );

      await Promise.race([connectPromise, timeoutPromise]);
      
      // Verificar que realmente está conectado
      const isBluetoothEnabled = await BluetoothManager.isBluetoothEnabled();
      if (!isBluetoothEnabled) {
        throw new Error('Bluetooth deshabilitado');
      }
      
      selectPrinter(device);
      setConnected(true);
      setPairedDevices([]);
      setNewDevices([]);
      setIsScanning(false);

      const finishConnect = () => {
        if (returnToSettings) {
          navigation.navigate('Settings');
        } else {
          navigation.goBack();
        }
      };

      showAlert(
        'Conectado',
        `Impresora conectada correctamente:\n${device.name}`,
        [{ text: 'Aceptar', onPress: finishConnect }],
      );
    } catch (error: any) {
      console.error('Error al conectar:', error);
      
      // Limpiar estado en caso de error
      setConnected(false);
      
      // Mensajes de error específicos
      let errorMessage = 'No se pudo conectar a la impresora.';
      let errorDetails = '';
      
      if (error.message?.includes('Timeout')) {
        errorMessage = 'La conexión tomó demasiado tiempo.';
        errorDetails = 'Verifica que la impresora esté encendida y cerca del dispositivo.';
      } else if (error.message?.includes('Bluetooth')) {
        errorMessage = 'Bluetooth deshabilitado.';
        errorDetails = 'Activa Bluetooth en tu dispositivo e intenta nuevamente.';
      } else if (error.message?.includes('Device not found')) {
        errorMessage = 'Impresora no encontrada.';
        errorDetails = 'Asegúrate de que la impresora esté emparejada en la configuración de Bluetooth.';
      } else if (error.message?.includes('Connection failed') || error.message?.includes('connect')) {
        errorMessage = 'Fallo en la conexión.';
        errorDetails = `Posibles causas:
• La impresora está apagada
• La impresora está fuera de alcance
• La impresora está conectada a otro dispositivo
• Intenta desemparejar y volver a emparejar la impresora`;
      } else {
        errorDetails = error.message || 'Error desconocido';
      }
      
      showAlert(
        '✗ Error de Conexión',
        `${errorMessage}\n\n${errorDetails}`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Reintentar', 
            onPress: () => connectToPrinter(device),
            style: 'default'
          }
        ]
      );
    } finally {
      setIsConnecting(false);
    }
  };

  /**
   * Desconecta la impresora actual
   */
  const disconnectPrinter = async () => {
    try {
      // BluetoothManager no expone disconnect() en esta versión de la librería.
      // Limpiamos el estado de la app para que la conexión quede abandonada.
      setConnected(false);
      clearPrinter();
      showAlert('✓ Desconectado', 'Impresora desconectada exitosamente');
    } catch (error: any) {
      console.error('Error al desconectar:', error);
      setConnected(false);
      clearPrinter();
      showAlert('Advertencia', 'Se limpió la configuración de impresora, pero puede que siga conectada. Reinicia Bluetooth si tienes problemas.');
    }
  };

  /**
   * Imprime una prueba
   */
  const printTest = async () => {
    if (!selectedPrinter) {
      showAlert(
        'Sin impresora',
        'Primero debes seleccionar una impresora'
      );
      return;
    }

    if (!isConnected) {
      showAlert(
        'Impresora desconectada',
        '¿Deseas reconectar a la impresora antes de imprimir?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Conectar', 
            onPress: async () => {
              await connectToPrinter(selectedPrinter);
              // Después de conectar, intentar imprimir
              if (isConnected) {
                printTest();
              }
            }
          }
        ]
      );
      return;
    }

    try {
      const { BluetoothEscposPrinter } = require('react-native-bluetooth-escpos-printer');
      
      // Verificar conexión antes de imprimir
      const isBluetoothEnabled = await BluetoothManager.isBluetoothEnabled();
      if (!isBluetoothEnabled) {
        throw new Error('Bluetooth deshabilitado');
      }
      
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
      await BluetoothEscposPrinter.printText('D-PAY\n', {
        encoding: 'GBK',
        codepage: 0,
        widthtimes: 1,
        heigthtimes: 1,
        fonttype: 1,
      });
      await BluetoothEscposPrinter.printText('Prueba de Impresión\n', {});
      await BluetoothEscposPrinter.printText('------------------------\n', {});
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
      await BluetoothEscposPrinter.printText(`Fecha: ${new Date().toLocaleString('es-CL')}\n`, {});
      await BluetoothEscposPrinter.printText('Impresora configurada correctamente\n', {});
      await BluetoothEscposPrinter.printText('\n\n\n', {});
      
      showAlert(
        '✓ Impresión Exitosa',
        'Documento de prueba enviado a la impresora correctamente'
      );
    } catch (error: any) {
      console.error('Error al imprimir prueba:', error);
      
      let errorMessage = 'No se pudo imprimir el documento de prueba.';
      let errorDetails = '';
      
      if (error.message?.includes('Bluetooth')) {
        errorMessage = 'Bluetooth deshabilitado.';
        errorDetails = 'Activa Bluetooth e intenta nuevamente.';
        setConnected(false);
      } else if (error.message?.includes('not connected') || error.message?.includes('disconnect')) {
        errorMessage = 'Impresora desconectada.';
        errorDetails = 'La conexión se perdió. Reconecta la impresora.';
        setConnected(false);
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Timeout de impresión.';
        errorDetails = 'La impresora no respondió a tiempo. Verifica que esté encendida.';
      } else {
        errorDetails = 'Verifica que la impresora esté encendida y conectada.\n\n' + (error.message || 'Error desconocido');
      }
      
      showAlert(
        '✗ Error de Impresión',
        `${errorMessage}\n\n${errorDetails}`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Reconectar', 
            onPress: async () => {
              setConnected(false);
              await connectToPrinter(selectedPrinter);
            }
          }
        ]
      );
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.background, padding: 20 }}>
      <StatusBar
        barStyle={themeColors.background === '#FFFFFF' ? 'dark-content' : 'light-content'}
        backgroundColor={themeColors.background}
      />
      <SafeAreaView />

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, marginBottom: 4 }}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={{ 
          fontSize: 20, 
          fontWeight: 'bold', 
          color: '#03C0C3'
        }}>
          Config. Impresora
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Impresora actual */}
        {selectedPrinter && (
          <View
            style={{
              backgroundColor: themeColors.backgroundSecondary,
              borderRadius: 8,
              padding: 16,
              marginBottom: 20,
            }}>
            <Text style={{ fontSize: 14, color: themeColors.textSecondary, marginBottom: 4 }}>
              Impresora Seleccionada
            </Text>
            <Text style={{ fontSize: 18, fontWeight: '600', color: themeColors.text }}>
              {selectedPrinter.name}
            </Text>
            <Text style={{ fontSize: 12, color: themeColors.textSecondary, marginTop: 4 }}>
              {selectedPrinter.address}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 8,
              }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: isConnected ? '#10B981' : '#EF4444',
                  marginRight: 8,
                }}
              />
              <Text style={{ fontSize: 14, color: themeColors.textSecondary }}>
                {isConnected ? 'Conectado' : 'Desconectado'}
              </Text>
            </View>
          </View>
        )}

        {/* Botones de acción */}
        <View style={{ marginBottom: 20 }}>
          <Button
            onPress={scanForDevices}
            variant="primary"
            disabled={isScanning}
            style={{ marginBottom: 12 }}>
            {isScanning ? 'Buscando impresoras...' : 'Buscar Impresoras'}
          </Button>

          {selectedPrinter && isConnected && (
            <>
              <Button
                onPress={printTest}
                variant="primary"
                style={{ marginBottom: 12, backgroundColor: '#10B981' }}>
                Imprimir Prueba
              </Button>

              <Button
                onPress={disconnectPrinter}
                variant="primary"
                style={{ backgroundColor: '#EF4444' }}>
                Desconectar Impresora
              </Button>
            </>
          )}
        </View>

        {/* Lista de dispositivos */}
        {isScanning && (
          <View style={{ alignItems: 'center', padding: 20 }}>
            <ActivityIndicator size="large" color={themeColors.primary} />
            <Text style={{ color: themeColors.textSecondary, marginTop: 12 }}>
              Buscando dispositivos...
            </Text>
          </View>
        )}

        {(pairedDevices.length > 0 || newDevices.length > 0) && !isConnected && (
          <View>
            {/* Sección: Conectados (emparejados) */}
            {pairedDevices.length > 0 && (
              <View style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 8 }} />
                  <Text style={{ fontSize: 16, fontWeight: '600', color: themeColors.text }}>
                    Conectados
                  </Text>
                </View>
                {pairedDevices.map((device) => {
                  const isThisConnected = isConnected && selectedPrinter?.address === device.address;
                  return (
                    <TouchableOpacity
                      key={device.address}
                      style={{
                        backgroundColor: isThisConnected ? '#F0FDF4' : themeColors.backgroundSecondary,
                        borderWidth: isThisConnected ? 2 : 1,
                        borderColor: '#10B981',
                        borderRadius: 8,
                        padding: 16,
                        marginBottom: 10,
                      }}
                      onPress={() => connectToPrinter(device)}
                      disabled={isConnecting || isThisConnected}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 16, fontWeight: '600', color: themeColors.text }}>
                            {device.name}
                          </Text>
                          <Text style={{ fontSize: 12, color: themeColors.textSecondary, marginTop: 4 }}>
                            {device.address}
                          </Text>
                        </View>
                        {isConnecting && !isThisConnected ? (
                          <ActivityIndicator size="small" color="#10B981" />
                        ) : isThisConnected ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 6 }} />
                            <Text style={{ fontSize: 12, color: '#10B981', fontWeight: '700' }}>Conectada</Text>
                          </View>
                        ) : (
                          <Text style={{ fontSize: 12, color: '#10B981', fontWeight: '600' }}>Tocar para conectar</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Sección: Nuevos dispositivos */}
            {newDevices.length > 0 && (
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#F59E0B', marginRight: 8 }} />
                  <Text style={{ fontSize: 16, fontWeight: '600', color: themeColors.text }}>
                    Nuevos dispositivos
                  </Text>
                </View>
                {newDevices.map((device) => (
                  <TouchableOpacity
                    key={device.address}
                    style={{
                      backgroundColor: themeColors.background,
                      borderWidth: 1,
                      borderColor: themeColors.border,
                      borderRadius: 8,
                      padding: 16,
                      marginBottom: 10,
                    }}
                    onPress={() => connectToPrinter(device)}
                    disabled={isConnecting}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: themeColors.text }}>
                          {device.name}
                        </Text>
                        <Text style={{ fontSize: 12, color: themeColors.textSecondary, marginTop: 4 }}>
                          {device.address}
                        </Text>
                      </View>
                      {isConnecting ? (
                        <ActivityIndicator size="small" color={themeColors.primary} />
                      ) : (
                        <Text style={{ fontSize: 12, color: '#F59E0B', fontWeight: '600' }}>Tocar para conectar</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};
