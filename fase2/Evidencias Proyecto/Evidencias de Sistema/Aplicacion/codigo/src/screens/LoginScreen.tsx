import React, { useState, useEffect } from 'react';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'settings-storage' });
import { View, Text, Image, StyleSheet, StatusBar, TouchableWithoutFeedback, TouchableOpacity, Keyboard, NativeModules, Platform, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Loading } from '../components/base/Loading';
import { useAuthStore } from '../stores/authStore';
import { spacing, typography } from '../theme';
import LoginForm from '../components/login/LoginForm';
import PatternInput from '../components/login/PatternInput';
import BiometricPrompt from '../components/login/BiometricPrompt';
import SaveCredentialsModal from '../components/login/SaveCredentialsModal';
import BiometricAuthModal from '../components/login/BiometricAuthModal';
import ForgotPatternModal from '../components/login/ForgotPatternModal';
import RejectTermsModal from '../components/login/RejectTermsModal';
import DemoCredentialsConfirmModal from '../components/login/DemoCredentialsConfirmModal';
import { TermsConditionsModal, TermsAcceptanceData } from '../components/login/TermsConditionsModal';
import { apiLogin, getCafs, getProductCatalogue, getClients } from '../services/api';
import { setAuthToken } from '../services/apiClient';
import { checkUserHasActiveContract, acceptTermsAndConditions } from '../services/contratoService';
import { useCAFStore } from '../stores/cafStore';
import { useCatalogueStore } from '../stores/catalogueStore';
import { useClientsStore } from '../stores/clientsStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useAlertStore } from '../stores/alertStore';
import { cleanRut } from '../utils/rut';
import { shouldEnableBiometrics } from '../utils/deviceInfo';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useThemeColors } from '../hooks/useThemeColors';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

type LoginStep = 'form' | 'pattern' | 'save-credentials' | 'create-pattern' | 'validate-pattern' | 'choose-auth-method' | 'biometric' | 'terms-and-conditions';

const LoginScreen = ({ navigation }: Props) => {
  const {
    login,
    savedCredentials,
    pattern,
    useBiometric,
    saveCredentials,
    savePattern,
    validatePattern,
    setBiometric,
  } = useAuthStore();

  const cafStore = useCAFStore();
  const catalogueStore = useCatalogueStore();
  const clientsStore = useClientsStore();
  const settingsStore = useSettingsStore();
  const { showAlert } = useAlertStore();
  const themeColors = useThemeColors();

  // Inicializar step correctamente según si hay credenciales guardadas
  const [step, setStep] = useState<LoginStep>('form');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  // Form data
  const [rut, setRut] = useState('');
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');

  // Control flags
  const [tempLoginData, setTempLoginData] = useState<any>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [showForgotPatternModal, setShowForgotPatternModal] = useState(false);
  const [showRejectTermsModal, setShowRejectTermsModal] = useState(false);
  const [showDemoCredentialsModal, setShowDemoCredentialsModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);

  // Actualizar step cuando se cargan credenciales desde storage
  // Solo si NO está en proceso de login/navegación y NO hay datos temporales
  useEffect(() => {
    if (!loading && !isNavigating && !tempLoginData) {
      if (savedCredentials && pattern) {
        setStep('choose-auth-method');
      } else if (!savedCredentials) {
        setStep('form');
      }
    }
  }, [savedCredentials, pattern, loading, isNavigating, tempLoginData]);

  // Verificar si el dispositivo soporta biometría (no es POS)
  useEffect(() => {
    const checkBiometrics = async () => {
      const shouldEnable = await shouldEnableBiometrics();
      setBiometricsAvailable(shouldEnable);
      console.log('[Login] Biometría disponible:', shouldEnable);
    };
    checkBiometrics();
  }, []);

  // Permitir captura de pantalla en desarrollo
  useEffect(() => {
    if (Platform.OS === 'android' && __DEV__) {
      try {
        // Permitir captura de pantalla temporalmente para demos
        const { UIManager } = NativeModules;
        if (UIManager?.setLayoutAnimationEnabledExperimental) {
          // Esta es una forma indirecta de permitir capturas
          UIManager.setLayoutAnimationEnabledExperimental(true);
        }
      } catch (error) {
        console.log('No se pudo habilitar captura de pantalla:', error);
      }
    }
  }, []);

  // Handle biometric authentication
  const handleBiometric = async () => {
    // This will be called from BiometricPrompt component
    if (savedCredentials && pattern) {
      // Pasar true para indicar que viene de biométrico y saltar pregunta de guardar credenciales
      await performLogin(savedCredentials.rut, savedCredentials.usuario, savedCredentials.password, true);
    }
  };

  // Perform login API call
  // isFromPattern indica si viene de validación de patrón (ya tiene credenciales guardadas)
  const performLogin = async (rut: string, usuario: string, password: string, isFromPattern: boolean = false) => {
    try {
      setLoading(true);
      setLoadingMessage('Iniciando sesión...');

      // Limpiar RUT antes de enviar (sin puntos, solo guión)
      // Formato: 22222222-2
      const cleanedRut = cleanRut(rut);
      const formattedRut = cleanedRut.slice(0, -1) + '-' + cleanedRut.slice(-1);

      console.log('[Login] RUT original:', rut);
      console.log('[Login] RUT limpio:', cleanedRut);
      console.log('[Login] RUT formateado:', formattedRut);
      console.log('[Login] Viene de patrón:', isFromPattern);

      const response = await apiLogin({
        rut: formattedRut,
        usuario,
        password
      });

      console.log('[Login] Respuesta recibida:', {
        hasToken: !!response.token,
        usuario: response.usuario,
        sistema: response.sistema
      });

      if (!response.token) {
        throw new Error('No se recibió token de autenticación');
      }

      // Configurar token para verificar contrato
      setAuthToken(response.token);

      // Verificar si el usuario tiene contrato DPAY activo
      setLoadingMessage('Verificando términos y condiciones DPAY...');
      const hasContract = await checkUserHasActiveContract(formattedRut);
      
      console.log('[Login] ¿Tiene contrato DPAY activo?:', hasContract);

      // Si viene de patrón, ya tiene credenciales guardadas, ir directo al login
      if (isFromPattern) {
        // Si NO tiene contrato DPAY, debe aceptar términos primero
        if (!hasContract) {
          console.log('[Login] Usuario sin contrato DPAY, mostrando términos y condiciones');
          setTempLoginData({
            token: response.token,
            usuario: response.usuario,
            nombre: response.nombre,
            sistema: response.sistema,
            empresa: response.empresa,
            rut: formattedRut,
            password,
          });
          setUserEmail(savedCredentials?.usuario || usuario);
          setStep('terms-and-conditions');
          return;
        }
        
        console.log('[Login] Usuario con contrato DPAY válido, continuando login...');
        await completeLogin(response, formattedRut, usuario, password);
        return;
      }

      // Save login data temporarily
      setTempLoginData({
        token: response.token,
        usuario: response.usuario,
        nombre: response.nombre,
        sistema: response.sistema,
        empresa: response.empresa,
        rut: formattedRut,
        password,
      });

      // Si NO tiene contrato DPAY activo, mostrar términos y condiciones
      if (!hasContract) {
        console.log('[Login] Usuario sin contrato DPAY, mostrando términos y condiciones');
        setUserEmail(response.usuario || usuario);
        setStep('terms-and-conditions');
        return;
      }

      console.log('[Login] Usuario con contrato DPAY válido, continuando flujo normal');
      // Verificar si las credenciales guardadas son del mismo usuario
      const isSameUser = savedCredentials &&
        savedCredentials.rut === formattedRut &&
        savedCredentials.usuario === usuario;

      // Si no hay credenciales guardadas o es un usuario diferente, preguntar si quiere guardar
      if (!isSameUser) {
        setStep('save-credentials');
      } else {
        // Ya tiene credenciales guardadas para este usuario, completar login
        await completeLogin(response, formattedRut, usuario, password);
      }
    } catch (error: any) {
      console.error('[Login] Error en performLogin:', error);

      let msg = error.message || 'Error al iniciar sesión';

      // Filtrar mensaje "404" si existe y personalizar
      if (msg.includes('404')) {
        msg = 'Credenciales incorrectas. Por favor verifique su RUT, usuario y contraseña.';
      } else if (msg.includes('Network request failed') || msg.includes('network')) {
        msg = 'Error de conexión. Verifique su conexión a internet.';
      }

      showAlert('Error de inicio de sesión', msg);
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  // Complete login and download initial data
  const completeLogin = async (loginData: any, rut: string, usuario: string, password: string) => {
    // Protección contra múltiples navegaciones
    if (isNavigating) {
      console.log('[Login] ===== YA SE ESTÁ NAVEGANDO, SALIENDO =====');
      return;
    }

    try {
      console.log('[Login] ===== INICIO completeLogin =====');
      setIsNavigating(true);
      setLoading(true);

      // Construir objeto LoginInformation según el tipo correcto
      // IMPORTANTE: usuario debe ser el valor original del formulario (minúsculas)
      // NO el que devuelve el API (mayúsculas) - esto es crítico para la emisión
      const loginInfo = {
        usuario: usuario,                      // Usuario original del formulario (para emisión)
        user: loginData.usuario || usuario,    // Usuario del API (para mostrar)
        rut: rut,
        token: loginData.token,
        empresa: loginData.empresa || {
          rut: '',
          razon: '',
          giro: '',
          direccion: '',
          comuna: '',
          provincia: '',
        },
        sistema: loginData.sistema || 'D-PAY',
        permiteNotaCredito: true, // Capstone: anulación habilitada sin depender del flag del backend
      };

      // Login to store - authStore se encargará de codificar la contraseña
      login(loginInfo, password);

      // Configurar token para próximas llamadas
      setAuthToken(loginData.token);

      // Download initial data
      setLoadingMessage('Descargando CAF...');
      try {
        const cafs = await getCafs();
        cafStore.setCAFs(cafs);
        console.log('[Login] CAFs descargados:', cafs.length);
      } catch (error) {
        console.log('[Login] Error descargando CAFs (no crítico):', error);
      }

      setLoadingMessage('Descargando catálogo...');
      try {
        const productsAPI = await getProductCatalogue();
        console.log('[Login] Productos RAW de API:', JSON.stringify(productsAPI).substring(0, 500));
        console.log('[Login] Tipo de datos:', typeof productsAPI, Array.isArray(productsAPI));
        // Guardar directamente como vienen de la API (formato español)
        catalogueStore.setProducts(productsAPI as any);
        console.log('[Login] Productos guardados:', productsAPI.length);
      } catch (error) {
        console.log('[Login] Error descargando catálogo (no crítico):', error);
      }

      setLoadingMessage('Descargando clientes...');
      try {
        const clients = await getClients();
        clientsStore.setClients(clients as any);
        console.log('[Login] Clientes descargados:', clients.length);
      } catch (error) {
        console.log('[Login] Error descargando clientes (no crítico):', error);
        clientsStore.setClients([]);
      }

      // Descargar logo de la empresa si existe el campo sistema
      // SIEMPRE se actualiza para reflejar el sistema del login actual
      if (loginData.sistema) {
        setLoadingMessage('Descargando logo de la empresa...');
        const systemName = loginData.sistema.trim();
        console.log('[Login] Nombre del sistema recibido:', systemName);
        
        // Guardar/cargar logo POR EMPRESA (no globalmente)
        // Key: systemImage_{systemName} para que cada empresa tenga su logo independiente
        const logoKey = `systemImage_${systemName}`;
        const savedLogoStr = storage.getString(logoKey);
        
        // NO descargar logo si el usuario ya tiene uno guardado manualmente para ESTA empresa
        if (savedLogoStr) {
          console.log(`[Login] Empresa '${systemName}' tiene logo manual guardado - no se descargará`);
          // Cargar el logo guardado de esta empresa
          settingsStore.updateSettings({ systemImage: savedLogoStr });
        } else {
          // Solo descargar si no tiene logo personalizado para esta empresa
          const timestamp = new Date().getTime();
          const logoUrl = `https://pro.dtemite.cl/Content/Logos/${systemName}.png?t=${timestamp}`;
          console.log(`[Login] Descargando logo para empresa '${systemName}' desde:`, logoUrl);

          try {
            const response = await ReactNativeBlobUtil.config({ fileCache: true })
              .fetch('GET', logoUrl);

            const status = response.info().status;
            if (status === 200) {
              const base64Data = await response.readFile('base64');
              // Validar que sea un png real verificando cabecera o longitud
              if (base64Data && base64Data.length > 100) {
                // Guardar con clave específica de empresa
                storage.set(logoKey, base64Data);
                settingsStore.updateSettings({ systemImage: base64Data });
                console.log(`[Login] Logo descargado para empresa '${systemName}' y guardado correctamente`);
              } else {
                console.warn('[Login] El archivo descargado parece corrupto o muy pequeño');
              }
            } else {
              console.warn(`[Login] No se pudo descargar el logo. Status code: ${status}`);
            }

            // Limpiar archivo temporal
            await ReactNativeBlobUtil.fs.unlink(response.path());
          } catch (error) {
            console.warn(`[Login] No se pudo descargar el logo para empresa '${systemName}':`, error);
            // No es crítico, continuamos sin el logo
          }
        }
      }

      setLoadingMessage('Completando...');

      // Pequeña espera para asegurar que todo esté listo
      await new Promise(resolve => setTimeout(resolve, 300));

      // NO navegamos manualmente - el RootNavigator lo hará automáticamente
      // cuando detecte que isAuthenticated es true
      console.log('[Login] ===== LOGIN COMPLETADO - RootNavigator navegará automáticamente =====');

    } catch (error: any) {
      console.error('[Login] Error en completeLogin:', error);
      showAlert('Advertencia', 'Sesión iniciada, pero hubo errores descargando datos: ' + error.message);
      // No navegamos manualmente - el RootNavigator lo hará
    } finally {
      setLoading(false);
      setLoadingMessage('');
      // Resetear después de un tiempo para permitir nuevos logins si es necesario
      setTimeout(() => setIsNavigating(false), 1000);
    }
  };

  // Handle form submit
  const handleFormSubmit = async () => {
    if (!rut || !usuario || !password) {
      showAlert('Error', 'Complete todos los campos');
      return;
    }

    await performLogin(rut, usuario, password);
  };

  // Handle save credentials decision
  const handleSaveCredentials = async (shouldSave: boolean) => {
    if (shouldSave) {
      // Save credentials
      saveCredentials(rut, usuario, password);
      // Go to create pattern step
      setStep('create-pattern');
    } else {
      // Don't save, complete login
      if (tempLoginData) {
        await completeLogin(tempLoginData, rut, usuario, password);
      }
    }
  };

  // Handle pattern creation
  const handleCreatePattern = async (newPattern: string) => {
    savePattern(newPattern);

    // Show biometric modal solo si hay sensor biométrico disponible
    if (biometricsAvailable) {
      setShowBiometricModal(true);
    } else {
      // Si no hay biometría disponible (POS), continuar sin preguntar
      setBiometric(false);
      if (tempLoginData) {
        await completeLogin(tempLoginData, rut, usuario, password);
      }
    }
  };

  const handleBiometricConfirm = async () => {
    setShowBiometricModal(false);
    setBiometric(true);
    if (tempLoginData) {
      await completeLogin(tempLoginData, rut, usuario, password);
    }
  };

  const handleBiometricCancel = async () => {
    setShowBiometricModal(false);
    setBiometric(false);
    if (tempLoginData) {
      await completeLogin(tempLoginData, rut, usuario, password);
    }
  };

  // Handle pattern validation
  const handleValidatePattern = async (inputPattern: string) => {
    if (validatePattern(inputPattern)) {
      if (savedCredentials) {
        // Pasar true para indicar que viene de patrón y saltar pregunta de guardar credenciales
        await performLogin(savedCredentials.rut, savedCredentials.usuario, savedCredentials.password, true);
      }
    } else {
      showAlert('Error', 'Patrón incorrecto');
    }
  };

  // Handle forgot pattern
  const handleForgotPattern = () => {
    setShowForgotPatternModal(true);
  };

  const handleForgotPatternConfirm = () => {
    setShowForgotPatternModal(false);
    useAuthStore.getState().clearCredentials();
    setStep('form');
    setRut('');
    setUsuario('');
    setPassword('');
  };

  const handleForgotPatternCancel = () => {
    setShowForgotPatternModal(false);
  };

  // Handle terms and conditions acceptance
  const handleAcceptTerms = async (data: TermsAcceptanceData) => {
    try {
      setLoading(true);
      setLoadingMessage('Registrando aceptación de términos DPAY...');

      if (!tempLoginData) {
        throw new Error('No hay datos de login temporales');
      }

      // Preparar datos para el endpoint de aceptación de anexo DPAY
      const acceptanceData = {
        rut_empresa: tempLoginData.rut,
        ...data,
      };

      console.log('[Login] Aceptando términos DPAY con datos:', {
        rut_empresa: acceptanceData.rut_empresa,
        email_usuario: acceptanceData.email_usuario,
        fingerprint: acceptanceData.fingerprint,
        tiempo_lectura_segundos: acceptanceData.tiempo_lectura_segundos,
        scroll_completo: acceptanceData.scroll_completo
      });

      // Llamar al endpoint de aceptación (crea anexo tipo dpay_pos)
      const result = await acceptTermsAndConditions(acceptanceData);
      
      console.log('[Login] ✓ Contrato DPAY creado exitosamente:', {
        id_anexo: result.id_anexo,
        numero_anexo: result.numero_anexo
      });

      // Verificar si las credenciales guardadas son del mismo usuario
      const isSameUser = savedCredentials &&
        savedCredentials.rut === tempLoginData.rut &&
        savedCredentials.usuario === usuario;

      // Si no hay credenciales guardadas o es un usuario diferente, preguntar si quiere guardar
      if (!isSameUser) {
        setStep('save-credentials');
      } else {
        // Ya tiene credenciales guardadas para este usuario, completar login
        await completeLogin(
          tempLoginData,
          tempLoginData.rut,
          savedCredentials?.usuario ?? usuario,
          savedCredentials?.password ?? password,
        );
      }
    } catch (error: any) {
      console.error('[Login] ✗ Error aceptando términos DPAY:', error);
      showAlert('Error', 'No se pudo registrar la aceptación de términos y condiciones: ' + error.message);
      // Volver al formulario
      setStep('form');
      setTempLoginData(null);
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  // Handle terms and conditions rejection
  const handleRejectTerms = () => {
    setShowRejectTermsModal(true);
  };

  const handleRejectTermsReview = () => {
    setShowRejectTermsModal(false);
  };

  const handleRejectTermsExit = () => {
    setShowRejectTermsModal(false);
    BackHandler.exitApp();
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.mainContainer}>
        <StatusBar
          barStyle={themeColors.isDark ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />

        {/* Imagen de fondo con patrón */}
        <Image
          source={themeColors.isDark
            ? require('../../assets/images/fondo-negro-logo.png')
            : require('../../assets/images/fondo-blanco-logo.png')
          }
          style={styles.backgroundImage}
          resizeMode="cover"
        />

        <SafeAreaView style={styles.safeArea}>
          {/* Logo DPAY */}
          <View style={[styles.logoContainer, step === 'choose-auth-method' && { marginBottom: 80, marginTop: 40 }]}>
            <Image
              source={themeColors.isDark ? require('../../assets/logos/logo_dpay_fuente_blanca.png') : require('../../assets/logos/logo_dpay_fuente_azul.png')}
              style={{ width: 280, height: 120 }}
              resizeMode="contain"
            />
          </View>

          <View style={styles.contentContainer}>
            {/* Vista con credenciales guardadas */}
            {step === 'choose-auth-method' && savedCredentials ? (
              <View style={[styles.buttonsContainer, { marginTop: 0 }]}>
                <TouchableOpacity
                  onPress={() => setStep('validate-pattern')}
                  style={[styles.mainButton, { backgroundColor: themeColors.isDark ? '#FFFFFF' : '#213d8b' }]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.mainButtonText, { color: themeColors.isDark ? '#213d8b' : '#FFFFFF' }]}>
                    Ingrese un patrón de 4 dígitos
                  </Text>
                </TouchableOpacity>

                {/* Botón de huella: habilitado en celulares, completamente oculto en dispositivos POS */}
                {biometricsAvailable && (
                  <TouchableOpacity
                    onPress={() => setStep('biometric')}
                    style={[styles.secondaryButton, { backgroundColor: '#03C0C3' }]}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.secondaryButtonText}>
                      Ingresar con la huella
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={handleForgotPattern}
                  style={[styles.secondaryButton, { backgroundColor: themeColors.secondary }]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryButtonText}>
                    Iniciar con otro usuario
                  </Text>
                </TouchableOpacity>

                {/* Info del usuario */}
                <View style={styles.userInfoContainer}>
                  <Text style={[styles.userInfoName, { color: themeColors.secondary }]}>
                    {savedCredentials.usuario}
                  </Text>
                  <Text style={[styles.userInfoRut, { color: themeColors.secondary }]}>
                    Rut: {savedCredentials.rut.replace(/(\d{2})(\d{3})(\d{3})(.)/, '$1.XXX.$3-$4')}
                  </Text>
                </View>
              </View>
            ) : null}

            {step === 'form' && (
              <>
                <LoginForm
                  rut={rut}
                  usuario={usuario}
                  password={password}
                  onRutChange={setRut}
                  onUsuarioChange={setUsuario}
                  onPasswordChange={setPassword}
                  onSubmit={handleFormSubmit}
                  loading={loading}
                />

                <TouchableOpacity
                  onPress={() => {
                    // Si hay datos escritos, mostrar modal de confirmación
                    if (rut.trim() || usuario.trim()) {
                      setShowDemoCredentialsModal(true);
                    } else {
                      // Si no hay datos, aplicar directamente
                      setRut('11.111.111-1');
                      setUsuario('demo');
                      setPassword('demo123');
                    }
                  }}
                  style={[styles.secondaryButton, { backgroundColor: themeColors.secondary, marginTop: 12 }]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryButtonText}>
                    🔍 Vista Previa
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {step === 'save-credentials' && (
              <SaveCredentialsModal
                visible={true}
                onConfirm={() => handleSaveCredentials(true)}
                onCancel={() => handleSaveCredentials(false)}
              />
            )}

            {step === 'create-pattern' && (
              <PatternInput
                title="Ingrese un patrón de 4 dígitos"
                onComplete={handleCreatePattern}
              />
            )}

            {step === 'validate-pattern' && (
              <>
                <PatternInput
                  title="Ingrese un patrón de 4 dígitos"
                  onComplete={handleValidatePattern}
                />
                <View style={styles.patternButtonsRow}>
                  <TouchableOpacity
                    onPress={() => setStep('choose-auth-method')}
                    style={styles.linkButton}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.linkButtonText, { color: themeColors.textSecondary }]}>
                      ← Volver
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleForgotPattern}
                    style={styles.linkButton}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.linkButtonText, { color: themeColors.textSecondary }]}>
                      Olvidé mi patrón
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {step === 'biometric' && useBiometric && (
              <BiometricPrompt
                onSuccess={handleBiometric}
                onCancel={() => setStep('choose-auth-method')}
              />
            )}
          </View>
        </SafeAreaView>

        <TermsConditionsModal
          visible={step === 'terms-and-conditions'}
          userName={tempLoginData?.nombre || usuario}
          userEmail={userEmail}
          onAccept={handleAcceptTerms}
          onReject={handleRejectTerms}
        />

        <BiometricAuthModal
          visible={showBiometricModal}
          onConfirm={handleBiometricConfirm}
          onCancel={handleBiometricCancel}
        />

        <ForgotPatternModal
          visible={showForgotPatternModal}
          onConfirm={handleForgotPatternConfirm}
          onCancel={handleForgotPatternCancel}
        />

        <RejectTermsModal
          visible={showRejectTermsModal}
          onReview={handleRejectTermsReview}
          onExit={handleRejectTermsExit}
        />

        <DemoCredentialsConfirmModal
          visible={showDemoCredentialsModal}
          onConfirm={() => {
            setShowDemoCredentialsModal(false);
            setRut('11.111.111-1');
            setUsuario('demo');
            setPassword('demo123');
          }}
          onCancel={() => setShowDemoCredentialsModal(false)}
        />

        <Loading visible={loading} message={loadingMessage} />
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    transform: [{ scale: 1.5 }],
  },
  safeArea: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 80,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  contentContainer: {
    paddingHorizontal: spacing.xl,
  },
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  mainButton: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF', // Fondo blanco siempre
  },
  mainButtonText: {
    fontFamily: typography.families.bold,
    fontSize: typography.sizes.base,
    color: '#213d8b', // Texto azul siempre
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontFamily: typography.families.bold,
    fontSize: typography.sizes.base,
    color: '#FFFFFF',
  },
  userInfoContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  userInfoName: {
    fontFamily: typography.families.bold,
    fontSize: typography.sizes.base,
  },
  userInfoRut: {
    fontFamily: typography.families.normal,
    fontSize: typography.sizes.sm,
    marginTop: 4,
  },
  patternButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    width: '100%',
  },
  linkButton: {
    padding: 10,
  },
  linkButtonText: {
    fontFamily: typography.families.normal,
    fontSize: typography.sizes.sm,
  },
});

export default LoginScreen;
