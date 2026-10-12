import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  TextInput,
  BackHandler,
  Keyboard,
  KeyboardEvent,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { TermsConditionsContent } from './TermsConditionsContent';

interface TermsConditionsModalProps {
  visible: boolean;
  userName?: string;
  userEmail?: string;
  onAccept: (data: TermsAcceptanceData) => void;
  onReject: () => void;
}

export interface TermsAcceptanceData {
  email_usuario: string;
  fingerprint: string;
  resolucion_pantalla: string;
  timezone: string;
  tiempo_lectura_segundos: number;
  scroll_completo: boolean;
}

export const TermsConditionsModal: React.FC<TermsConditionsModalProps> = ({
  visible,
  userName = '',
  userEmail = '',
  onAccept,
  onReject,
}) => {
  const [email, setEmail] = useState(userEmail);
  const [scrollCompleto, setScrollCompleto] = useState(false);
  const [tiempoLectura, setTiempoLectura] = useState(0);
  const [canAccept, setCanAccept] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const tiempoInicioRef = useRef<number>(Date.now());
  const scrollViewRef = useRef<ScrollView>(null);

  // Timer para medir tiempo de lectura
  useEffect(() => {
    if (!visible) {
      return;
    }

    tiempoInicioRef.current = Date.now();
    setTiempoLectura(0);
    setScrollCompleto(false);
    setCanAccept(false);

    const interval = setInterval(() => {
      const tiempoTranscurrido = Math.floor((Date.now() - tiempoInicioRef.current) / 1000);
      setTiempoLectura(tiempoTranscurrido);
    }, 1000);

    return () => clearInterval(interval);
  }, [visible]);

  // Bloquear botón de back de Android
  useEffect(() => {
    if (!visible) {
      return;
    }

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Bloquear el back - el usuario debe aceptar o rechazar explícitamente
      return true;
    });

    return () => backHandler.remove();
  }, [visible]);

  // Escuchar eventos del teclado para levantar el footer
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e: KeyboardEvent) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Validar condiciones para habilitar botón aceptar
  useEffect(() => {
    const emailValido = validateEmail(email);
    const tiempoMinimo = tiempoLectura >= 10; // Mínimo 10 segundos de lectura
    setCanAccept(scrollCompleto && emailValido && tiempoMinimo);
  }, [scrollCompleto, email, tiempoLectura]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (text.length > 0 && !validateEmail(text)) {
      setEmailError('Formato de email inválido');
    } else {
      setEmailError('');
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    
    // Detectar si llegó al final (con margen de 20px)
    const paddingToBottom = 20;
    const isCloseToBottom = 
      layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;

    if (isCloseToBottom && !scrollCompleto) {
      setScrollCompleto(true);
    }
  };

  const getDeviceFingerprint = async (): Promise<string> => {
    try {
      // Usar directamente el Device ID único del sistema operativo
      // Este es garantizado único por Android/iOS y no genera colisiones
      const deviceId = await DeviceInfo.getUniqueId();
      
      // Validar que no sea vacío
      if (!deviceId || deviceId.trim().length === 0) {
        // Fallback: crear fingerprint con marca + modelo + versión
        const brand = await DeviceInfo.getBrand();
        const model = await DeviceInfo.getModel();
        const systemVersion = await DeviceInfo.getSystemVersion();
        return `${brand}-${model}-${systemVersion}-${Date.now()}`.substring(0, 64);
      }
      
      // Si el deviceId es muy largo, tomar solo los primeros 64 caracteres
      return deviceId.substring(0, 64);
    } catch (error) {
      console.error('[TermsConditions] Error obteniendo fingerprint:', error);
      // Fallback: timestamp + random
      return `error-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`.substring(0, 64);
    }
  };

  const getScreenResolution = (): string => {
    const { width, height } = Dimensions.get('window');
    return `${Math.round(width)}x${Math.round(height)}`;
  };

  const getTimezone = (): string => {
    try {
      const offset = new Date().getTimezoneOffset();
      const hours = Math.floor(Math.abs(offset) / 60);
      const minutes = Math.abs(offset) % 60;
      const sign = offset <= 0 ? '+' : '-';
      return `UTC${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } catch (error) {
      return 'UTC-03:00'; // Default Chile
    }
  };

  const handleAccept = async () => {
    if (!canAccept) {
      return;
    }

    const fingerprint = await getDeviceFingerprint();
    const resolucion = getScreenResolution();
    const timezone = getTimezone();

    const data: TermsAcceptanceData = {
      email_usuario: email.trim(),
      fingerprint,
      resolucion_pantalla: resolucion,
      timezone,
      tiempo_lectura_segundos: tiempoLectura,
      scroll_completo: scrollCompleto,
    };

    onAccept(data);
  };

  const handleReject = () => {
    onReject();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent={true}
    >
      <View style={[styles.mainContainer, { paddingBottom: keyboardHeight }]}>

        {/* Header fijo arriba */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Términos y Condiciones</Text>
          {userName && (
            <Text style={styles.headerSubtitle}>Bienvenido, {userName}</Text>
          )}
        </View>

        {/* Contenido scrolleable — se reduce cuando sube el teclado */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
        >
          <TermsConditionsContent />

          {!scrollCompleto && (
            <View style={styles.scrollHint}>
              <Text style={styles.scrollHintText}>
                ↓ Desplázate hacia abajo para leer todo el documento
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Footer FUERA del scroll — aparece solo al llegar al final */}
        {scrollCompleto && (
          <View style={styles.footer}>
            <View style={styles.infoRow}>
              <Text style={styles.infoText}>
                ⏱ {Math.floor(tiempoLectura / 60)}:{(tiempoLectura % 60).toString().padStart(2, '0')} de lectura
              </Text>
              <Text style={styles.infoText}>✓ Leído completo</Text>
            </View>

            <View style={styles.emailContainer}>
              <Text style={styles.emailLabel}>Email de contacto *</Text>
              <TextInput
                style={[styles.emailInput, emailError ? styles.emailInputError : null]}
                value={email}
                onChangeText={handleEmailChange}
                placeholder="tu@email.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {emailError ? (
                <Text style={styles.emailErrorText}>{emailError}</Text>
              ) : null}
            </View>

            {!canAccept && tiempoLectura < 10 && (
              <Text style={styles.warningText}>
                Debes leer el documento al menos 10 segundos
              </Text>
            )}

            <View style={styles.buttonsRow}>
              <TouchableOpacity
                style={[styles.button, styles.rejectButton]}
                onPress={handleReject}
              >
                <Text style={styles.rejectButtonText}>No acepto</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.acceptButton,
                  !canAccept && styles.acceptButtonDisabled,
                ]}
                onPress={handleAccept}
                disabled={!canAccept}
              >
                <Text style={[
                  styles.acceptButtonText,
                  !canAccept && styles.acceptButtonTextDisabled,
                ]}>
                  Acepto
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.disclaimerText}>
              Al aceptar, autorizas el almacenamiento de esta aceptación y tus datos de sesión conforme a la Ley 19.628.
            </Text>
          </View>
        )}

      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#E91E8C',
    padding: 20,
    paddingTop: 50,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    marginTop: 5,
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  scrollHint: {
    backgroundColor: 'rgba(233, 30, 140, 0.95)',
    padding: 12,
    alignItems: 'center',
    marginTop: 10,
    marginHorizontal: 20,
    borderRadius: 8,
  },
  scrollHintText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    paddingBottom: 20,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
  },
  emailContainer: {
    marginBottom: 15,
  },
  emailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emailInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#333',
  },
  emailInputError: {
    borderColor: '#dc3545',
  },
  emailErrorText: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 12,
    color: '#6c757d',
  },
  warningText: {
    fontSize: 12,
    color: '#E91E8C',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#dc3545',
  },
  rejectButtonText: {
    color: '#dc3545',
    fontSize: 16,
    fontWeight: '700',
  },
  acceptButton: {
    backgroundColor: '#E91E8C',
  },
  acceptButtonDisabled: {
    backgroundColor: '#d3d3d3',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  acceptButtonTextDisabled: {
    color: '#999',
  },
  disclaimerText: {
    fontSize: 11,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 16,
  },
});
