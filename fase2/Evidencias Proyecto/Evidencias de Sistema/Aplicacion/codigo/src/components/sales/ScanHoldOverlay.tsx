import React, { useCallback, useEffect, useRef, useState, Component, type ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ActivityIndicator,
  NativeModules,
  TouchableOpacity,
  TextInput,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useProductScanLookup } from '../../hooks/useProductScanLookup';
import { useCatalogueStore } from '../../stores/catalogueStore';
import { useAddCatalogueProduct } from '../../hooks/useAddCatalogueProduct';
import { requestCameraPermission } from '../../utils/cameraPermission';
import { preloadScanSuccessSound, playScanSuccessSound } from '../../utils/playScanSuccessSound';
import { normalizeScanCode, scanCodesMatch } from '../../utils/findProductByBarcode';
import {
  ScanStabilityGate,
  extractAllScannedCodes,
  RETAIL_CODE_TYPES,
  SCAN_SUCCESS_COOLDOWN_MS,
} from '../../utils/scanCodeStability';
import AppModal from '../base/AppModal';
import { CreateQuickProductModal } from './CreateQuickProductModal';
import { ScanAddedToast } from './ScanAddedToast';
import { getAdvancedConfig } from '../../services/api';

function parseCreaProductos(value: unknown): boolean {
  if (value === true || value === 'true' || value === 't' || value === 1 || value === '1') {
    return true;
  }
  return false;
}

const PROCESSING_LOCK_MS = SCAN_SUCCESS_COOLDOWN_MS;

function isVisionCameraLinked(): boolean {
  try {
    return !!NativeModules.CameraDevices;
  } catch {
    return false;
  }
}

interface ScanHoldOverlayProps {
  visible: boolean;
  onNoStock: () => void;
  persistent?: boolean;
  onClose?: () => void;
  onProductAdded?: (info: { productName: string; productPrice: number }) => void;
}

/**
 * Overlay de cámara para escaneo de productos.
 * Modo hold: visible mientras se mantiene presionado Scan.
 * Modo persistente: queda abierto hasta pulsar Volver.
 */
export const ScanHoldOverlay: React.FC<ScanHoldOverlayProps> = ({
  visible,
  onNoStock,
  persistent = false,
  onClose,
  onProductAdded,
}) => {
  const { lookupAndAddMany, isLookingUp } = useProductScanLookup();
  const mergeProducts = useCatalogueStore((s) => s.mergeProducts);
  const { addCatalogueProduct } = useAddCatalogueProduct();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [nativeMissing, setNativeMissing] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [notFoundCode, setNotFoundCode] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [canCreateProducts, setCanCreateProducts] = useState(false);
  const [defaultMonedaId, setDefaultMonedaId] = useState<number | undefined>(undefined);
  const [addedToast, setAddedToast] = useState<{ productName: string; productPrice: number } | null>(null);
  const [addedToastKey, setAddedToastKey] = useState(0);
  const [scanFrameSuccess, setScanFrameSuccess] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [manualHint, setManualHint] = useState<string | null>(null);
  const [manualSearching, setManualSearching] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const [manualInputFocused, setManualInputFocused] = useState(false);
  const frameFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const manualInputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);

  const showAddedFeedback = useCallback((info: { productName: string; productPrice: number }) => {
    setAddedToastKey((prev) => prev + 1);
    setAddedToast(info);
    setScanFrameSuccess(true);
    if (frameFlashTimerRef.current) {
      clearTimeout(frameFlashTimerRef.current);
    }
    frameFlashTimerRef.current = setTimeout(() => {
      setScanFrameSuccess(false);
    }, 450);
    onProductAdded?.(info);
  }, [onProductAdded]);

  const scanPaused = notFoundCode !== null || showCreateForm;
  const lastScanRef = useRef<{ code: string; time: number } | null>(null);
  const processingRef = useRef(false);
  const stabilityGateRef = useRef(new ScanStabilityGate());

  useEffect(() => {
    if (!visible) {
      setHasPermission(null);
      setTorchOn(false);
      setNotFoundCode(null);
      setShowCreateForm(false);
      setAddedToast(null);
      setScanFrameSuccess(false);
      setManualCode('');
      setManualHint(null);
      setManualSearching(false);
      setKeyboardInset(0);
      setManualInputFocused(false);
      if (frameFlashTimerRef.current) {
        clearTimeout(frameFlashTimerRef.current);
        frameFlashTimerRef.current = null;
      }
      lastScanRef.current = null;
      processingRef.current = false;
      stabilityGateRef.current.reset();
      return;
    }
    if (!isVisionCameraLinked()) {
      setNativeMissing(true);
      return;
    }
    setNativeMissing(false);
    preloadScanSuccessSound();
    (async () => {
      const ok = await requestCameraPermission();
      setHasPermission(ok);
    })();
    (async () => {
      try {
        const config = await getAdvancedConfig();
        setCanCreateProducts(parseCreaProductos(config.crea_productos));
        const monedaId = config.id_moneda_predeterminada ?? config.id_moneda;
        if (monedaId) setDefaultMonedaId(Number(monedaId));
      } catch {
        setCanCreateProducts(false);
      }
    })();
  }, [visible]);

  useEffect(() => {
    if (!visible) return undefined;
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardInset(event.endCoordinates.height);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardInset(0);
      setManualInputFocused(false);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [visible]);

  const dismissNotFound = useCallback(() => {
    setNotFoundCode(null);
    setShowCreateForm(false);
    stabilityGateRef.current.reset();
    lastScanRef.current = null;
    setTimeout(() => manualInputRef.current?.focus(), 100);
  }, []);

  const handleProductCreated = useCallback((product: any) => {
    if (product) {
      mergeProducts([product]);
      const result = addCatalogueProduct(product);
      if (result.ok) {
        playScanSuccessSound();
        const precioRaw = product.precio || product.price || 0;
        const productPrice = typeof precioRaw === 'string' ? parseFloat(precioRaw) || 0 : precioRaw;
        const productName = product.nombre || product.name || 'Producto';
        showAddedFeedback({ productName, productPrice });
        setManualCode('');
        setManualHint(null);
      }
    }
    dismissNotFound();
  }, [mergeProducts, addCatalogueProduct, dismissNotFound, showAddedFeedback]);

  const applyLookupResult = useCallback((result: Awaited<ReturnType<typeof lookupAndAddMany>>, sourceCode: string) => {
    if (result.status === 'added' || result.status === 'not_found' || result.status === 'no_stock') {
      stabilityGateRef.current.reset();
    }
    if (result.status === 'added') {
      setManualHint(null);
      setManualCode('');
      showAddedFeedback({
        productName: result.productName,
        productPrice: result.productPrice,
      });
      return;
    }
    if (result.status === 'not_found') {
      setManualHint(`No hay producto con código "${sourceCode}"`);
      setNotFoundCode(sourceCode);
      return;
    }
    if (result.status === 'no_stock') {
      onNoStock();
    }
  }, [showAddedFeedback, onNoStock]);

  const processScanCodes = useCallback(async (codes: string[]) => {
    if (scanPaused || !codes.length) return;

    const stableCodes: string[] = codes.reduce<string[]>((acc, raw) => {
      const stable = stabilityGateRef.current.observe(raw);
      if (stable) acc.push(stable);
      return acc;
    }, []);
    if (!stableCodes.length) return;

    const now = Date.now();
    const primary = stableCodes[0];
    if (
      lastScanRef.current &&
      scanCodesMatch(lastScanRef.current.code, primary) &&
      now - lastScanRef.current.time < PROCESSING_LOCK_MS
    ) {
      return;
    }

    if (processingRef.current) return;
    processingRef.current = true;
    lastScanRef.current = { code: primary, time: now };

    try {
      const result = await lookupAndAddMany(stableCodes);
      applyLookupResult(result, primary);
    } finally {
      setTimeout(() => {
        processingRef.current = false;
      }, PROCESSING_LOCK_MS);
    }
  }, [lookupAndAddMany, scanPaused, applyLookupResult]);

  const handleManualSearch = useCallback(async () => {
    const code = normalizeScanCode(manualCode);
    if (!code || processingRef.current || isLookingUp) return;

    setManualHint(null);
    setManualSearching(true);
    processingRef.current = true;
    lastScanRef.current = { code, time: Date.now() };

    try {
      const result = await lookupAndAddMany([code]);
      applyLookupResult(result, code);
    } finally {
      setManualSearching(false);
      setTimeout(() => {
        processingRef.current = false;
      }, PROCESSING_LOCK_MS);
    }
  }, [manualCode, isLookingUp, lookupAndAddMany, applyLookupResult]);

  const handleManualCodeChange = useCallback((value: string) => {
    setManualCode(value);
    if (manualHint) setManualHint(null);
  }, [manualHint]);

  const manualBusy = isLookingUp || manualSearching;
  const canSearchManual = manualCode.trim().length >= 2 && !manualBusy;
  const typingMode = manualInputFocused || keyboardInset > 0;

  if (!visible) {
    return null;
  }

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <KeyboardAvoidingView
        style={styles.keyboardRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.backdrop, keyboardInset > 0 && { paddingBottom: keyboardInset }]}>
          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            contentContainerStyle={[
              styles.scrollContent,
              typingMode && styles.scrollContentTyping,
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={[styles.mainContent, typingMode && styles.mainContentTyping]}>
              {!typingMode && !nativeMissing ? (
                <ScanCameraErrorBoundary onReset={onClose}>
                  <ScanCameraView
                    hasPermission={hasPermission}
                    isLookingUp={isLookingUp}
                    torchOn={torchOn}
                    onToggleTorch={() => setTorchOn((prev) => !prev)}
                    onCode={processScanCodes}
                    paused={scanPaused}
                    frameSuccess={scanFrameSuccess}
                  />
                </ScanCameraErrorBoundary>
              ) : null}
              {!typingMode && nativeMissing ? (
                <View style={styles.messageBox}>
                  <Text style={styles.messageTitle}>Cámara no disponible</Text>
                  <Text style={styles.messageText}>
                    Reinstala la app en el POS para activar el escaneo:{'\n'}
                    npm run android:dev
                  </Text>
                </View>
              ) : null}
              {!typingMode && torchOn ? (
                <Text style={styles.flashHint}>
                  En envases brillantes apaga el flash para evitar reflejos.
                </Text>
              ) : null}
              {!typingMode && addedToast ? (
                <View style={styles.toastWrap}>
                  <ScanAddedToast
                    key={`overlay-toast-${addedToastKey}`}
                    productName={addedToast.productName}
                    productPrice={addedToast.productPrice}
                    onHidden={() => setAddedToast(null)}
                  />
                </View>
              ) : null}
              {!typingMode && !persistent ? (
                <Text style={styles.hint}>Suelta el botón Scan para cerrar</Text>
              ) : null}
              {!typingMode && persistent ? (
                <Text style={styles.hint}>Apunta al código de producto con la cámara</Text>
              ) : null}
              <View style={[styles.manualSection, typingMode && styles.manualSectionTyping]}>
                {typingMode ? (
                  <Text style={styles.typingTitle}>Ingreso de código</Text>
                ) : (
                  <Text style={styles.manualLabel}>Código de producto</Text>
                )}
                <View style={styles.manualRow}>
                  <TextInput
                    ref={manualInputRef}
                    style={styles.manualInput}
                    value={manualCode}
                    onChangeText={handleManualCodeChange}
                    placeholder="Escribe el código e ingresa"
                    placeholderTextColor="#64748B"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    returnKeyType="search"
                    onSubmitEditing={handleManualSearch}
                    editable={!manualBusy}
                    onFocus={() => {
                      setManualInputFocused(true);
                      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
                    }}
                    onBlur={() => setManualInputFocused(false)}
                  />
                  <TouchableOpacity
                    style={[styles.manualBtn, !canSearchManual && styles.manualBtnDisabled]}
                    onPress={handleManualSearch}
                    activeOpacity={0.85}
                    disabled={!canSearchManual}
                  >
                    {manualBusy ? (
                      <ActivityIndicator size="small" color="#021735" />
                    ) : (
                      <Text style={styles.manualBtnText}>Buscar</Text>
                    )}
                  </TouchableOpacity>
                </View>
                {manualHint ? (
                  <Text style={styles.manualHint}>{manualHint}</Text>
                ) : (
                  <Text style={styles.manualHelp}>
                    Si la cámara no lee, escribe el código impreso en el producto.
                  </Text>
                )}
              </View>
            </View>
          </ScrollView>

          {persistent && onClose ? (
            <View style={styles.footer}>
              <TouchableOpacity
                onPress={onClose}
                style={styles.volverBtn}
                activeOpacity={0.85}
              >
                <Text style={styles.volverBtnText}>Volver</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>

      <AppModal
        visible={notFoundCode !== null && !showCreateForm}
        title="Producto no encontrado"
        message={`No se encontró ningún producto con el código "${notFoundCode ?? ''}".`}
        buttons={canCreateProducts ? [
          { text: 'Corregir código', onPress: dismissNotFound, variant: 'secondary' },
          { text: 'Crear producto', onPress: () => setShowCreateForm(true), variant: 'primary' },
        ] : [
          { text: 'Corregir código', onPress: dismissNotFound, variant: 'primary' },
        ]}
        onClose={dismissNotFound}
      />

      <CreateQuickProductModal
        visible={showCreateForm && notFoundCode !== null}
        codigo={notFoundCode ?? ''}
        idMoneda={defaultMonedaId}
        onClose={() => setShowCreateForm(false)}
        onCreated={handleProductCreated}
      />
    </Modal>
  );
};

interface ScanCameraViewProps {
  hasPermission: boolean | null;
  isLookingUp: boolean;
  torchOn: boolean;
  onToggleTorch: () => void;
  onCode: (codes: string[]) => void;
  paused?: boolean;
  frameSuccess?: boolean;
}

const ScanCameraView: React.FC<ScanCameraViewProps> = ({
  hasPermission,
  isLookingUp,
  torchOn,
  onToggleTorch,
  onCode,
  paused = false,
  frameSuccess = false,
}) => {
  const {
    Camera,
    useCameraDevice,
    useCameraFormat,
    useCodeScanner,
  } = require('react-native-vision-camera') as typeof import('react-native-vision-camera');

  const device = useCameraDevice('back');
  const format = useCameraFormat(device, [
    { videoResolution: 'max' },
    { fps: 30 },
  ]);

  const codeScanner = useCodeScanner({
    codeTypes: [...RETAIL_CODE_TYPES],
    onCodeScanned: (codes) => {
      if (paused) return;
      const values = extractAllScannedCodes(codes);
      if (values.length) {
        onCode(values);
      }
    },
  });

  if (hasPermission === null) {
    return <ActivityIndicator size="large" color="#03C0C3" />;
  }
  if (hasPermission === false) {
    return (
      <Text style={styles.messageText}>
        Permiso de cámara denegado. Actívalo en ajustes del dispositivo.
      </Text>
    );
  }
  if (!device) {
    return (
      <Text style={styles.messageText}>No se detectó cámara en este dispositivo.</Text>
    );
  }

  const showTorchButton = device.hasTorch;

  return (
    <View style={styles.cameraBox}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        format={format}
        isActive={!paused}
        torch={torchOn && device.hasTorch ? 'on' : 'off'}
        codeScanner={codeScanner}
      />
      <View style={styles.frameOverlay}>
        <View style={[styles.scanFrame, frameSuccess && styles.scanFrameSuccess]} />
        {showTorchButton ? (
          <TouchableOpacity
            onPress={onToggleTorch}
            style={[styles.flashBtn, torchOn && styles.flashBtnActive]}
            activeOpacity={0.85}
          >
            <Text style={styles.flashBtnText}>{torchOn ? 'Flash ON' : 'Flash'}</Text>
          </TouchableOpacity>
        ) : null}
        {isLookingUp && (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Buscando...</Text>
          </View>
        )}
      </View>
    </View>
  );
};

class ScanCameraErrorBoundary extends Component<
  { children: ReactNode; onReset?: () => void },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('[Scan] Error en cámara:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.messageBox}>
          <Text style={styles.messageTitle}>Error al abrir cámara</Text>
          <Text style={styles.messageText}>
            No se pudo iniciar el escaneo. Pulsa Volver e inténtalo de nuevo.
          </Text>
          {this.props.onReset ? (
            <TouchableOpacity
              onPress={() => {
                this.setState({ hasError: false });
                this.props.onReset?.();
              }}
              style={[styles.volverBtn, { marginTop: 16 }]}
            >
              <Text style={styles.volverBtnText}>Cerrar</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  keyboardRoot: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 23, 53, 0.92)',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  scrollContentTyping: {
    justifyContent: 'flex-start',
    paddingTop: 12,
    paddingBottom: 16,
  },
  mainContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContentTyping: {
    justifyContent: 'flex-start',
    width: '100%',
  },
  cameraBox: {
    width: '100%',
    height: 340,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  frameOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: '92%',
    height: 130,
    borderWidth: 2,
    borderColor: '#03C0C3',
    borderRadius: 8,
  },
  scanFrameSuccess: {
    borderColor: '#4ADE80',
    borderWidth: 3,
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
  },
  toastWrap: {
    width: '100%',
    marginTop: 14,
    paddingHorizontal: 4,
  },
  flashBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: 'rgba(2, 23, 53, 0.75)',
    borderWidth: 1,
    borderColor: '#03C0C3',
  },
  flashBtnActive: {
    backgroundColor: '#03C0C3',
  },
  flashBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Montserrat-Bold_0',
  },
  hint: {
    marginTop: 16,
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Montserrat-Bold_0',
    textAlign: 'center',
  },
  flashHint: {
    marginTop: 10,
    paddingHorizontal: 8,
    color: '#FCD34D',
    fontSize: 12,
    fontFamily: 'Montserrat-Bold_0',
    textAlign: 'center',
    lineHeight: 18,
  },
  manualSection: {
    width: '100%',
    marginTop: 16,
  },
  manualSectionTyping: {
    marginTop: 0,
  },
  typingTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Montserrat-Bold_0',
    marginBottom: 12,
    textAlign: 'center',
  },
  manualLabel: {
    color: '#03C0C3',
    fontSize: 13,
    fontFamily: 'Montserrat-Bold_0',
    marginBottom: 8,
  },
  manualRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
  },
  manualInput: {
    flex: 1,
    backgroundColor: '#021735',
    borderWidth: 1,
    borderColor: '#03C0C3',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Montserrat-Bold_0',
    letterSpacing: 0.5,
  },
  manualBtn: {
    backgroundColor: '#03C0C3',
    borderRadius: 10,
    minWidth: 88,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualBtnDisabled: {
    opacity: 0.45,
  },
  manualBtnText: {
    color: '#021735',
    fontSize: 15,
    fontFamily: 'Montserrat-Bold_0',
  },
  manualHelp: {
    marginTop: 8,
    color: '#94A3B8',
    fontSize: 12,
    fontFamily: 'Montserrat-Bold_0',
    lineHeight: 18,
  },
  manualHint: {
    marginTop: 8,
    color: '#FCA5A5',
    fontSize: 12,
    fontFamily: 'Montserrat-Bold_0',
    lineHeight: 18,
  },
  messageBox: {
    padding: 20,
    backgroundColor: '#021735',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#03C0C3',
  },
  messageTitle: {
    color: '#03C0C3',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Montserrat-Bold_0',
    marginBottom: 10,
    textAlign: 'center',
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Montserrat-Bold_0',
    textAlign: 'center',
    lineHeight: 20,
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 8,
    fontSize: 13,
    fontFamily: 'Montserrat-Bold_0',
  },
  footer: {
    width: '100%',
    paddingBottom: 8,
  },
  volverBtn: {
    backgroundColor: '#03C0C3',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  volverBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Montserrat-Bold_0',
  },
});
