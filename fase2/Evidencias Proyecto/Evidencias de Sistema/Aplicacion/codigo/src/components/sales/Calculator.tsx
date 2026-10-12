import React, { useCallback, useMemo, memo, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Pressable } from 'react-native';
import { useSalesStore } from '../../stores/salesStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useAlertStore } from '../../stores/alertStore';
import { AppModal } from '../base';
import { ScanHoldOverlay } from './ScanHoldOverlay';
import { ScanAddedToast } from './ScanAddedToast';
import { formatCurrency } from '../../utils/format';
import globalStyles from '../../styles/globalStyles';
import salesStyles from '../../styles/salesStyles';
import { useThemeColors } from '../../hooks/useThemeColors';

interface CalculatorProps {}

// Botones definidos fuera del componente - nunca cambian
const CALCULATOR_BUTTONS = [
  [7, 8, 9],
  [4, 5, 6],
  [1, 2, 3],
  ['clean', 0, '00'],
] as const;

// Componente memoizado para cada botón numérico con efecto de presión
interface CalcButtonProps {
  value: number | string;
  onPress: () => void;
  backgroundColor: string;
  textColor: string;
  rowIndex: number;
  colIndex: number;
  isDark: boolean;
}

const CalcButton = memo<CalcButtonProps>(({ value, onPress, backgroundColor, textColor, rowIndex, colIndex, isDark }) => {
  const pressedBgColor = isDark ? '#FFFFFF' : '#213d8b';
  const pressedTextColor = isDark ? '#213d8b' : '#FFFFFF';
  const borderColor = '#F3BAD7';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        localStyles.calcButton,
        { backgroundColor: pressed ? pressedBgColor : backgroundColor },
        colIndex > 0 && { borderLeftWidth: 1, borderLeftColor: borderColor },
        rowIndex > 0 && { borderTopWidth: 1, borderTopColor: borderColor },
        rowIndex === 3 && { height: 79 },
      ]}
    >
      {({ pressed }) => (
        <Text style={[localStyles.calcButtonText, { color: pressed ? pressedTextColor : textColor }]}>
          {value}
        </Text>
      )}
    </Pressable>
  );
});

// Componente memoizado para el botón de limpiar con efecto de presión
interface CleanButtonProps {
  onPress: () => void;
  backgroundColor: string;
  rowIndex: number;
  colIndex: number;
  isDark: boolean;
}

const CleanButton = memo<CleanButtonProps>(({ onPress, backgroundColor, rowIndex, colIndex, isDark }) => {
  const pressedBgColor = isDark ? '#FFFFFF' : '#213d8b';
  const borderColor = '#F3BAD7';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        localStyles.calcButton,
        { backgroundColor: pressed ? pressedBgColor : backgroundColor },
        colIndex > 0 && { borderLeftWidth: 1, borderLeftColor: borderColor },
        rowIndex > 0 && { borderTopWidth: 1, borderTopColor: borderColor },
        rowIndex === 3 && { height: 71 },
      ]}
    >
      <Image
        source={require('../../../assets/icons_new/limpiar.png')}
        style={[localStyles.cleanIcon, { tintColor: '#d4186e', marginTop: 6 }]}
      />
    </Pressable>
  );
});

export const Calculator = memo(({}: CalculatorProps = {}) => {
  const themeColors = useThemeColors();
  const showAlert = useAlertStore((state) => state.showAlert);
  const enableProductScan = useSettingsStore((state) => state.enableProductScan);
  const scanPersistentMode = useSettingsStore((state) => state.scanPersistentMode);
  const [scanHoldActive, setScanHoldActive] = useState(false);
  const scanHoldOpenedAtRef = useRef(0);
  const scanHoldActiveRef = useRef(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [screenAddedToast, setScreenAddedToast] = useState<{ productName: string; productPrice: number } | null>(null);
  const screenToastKeyRef = useRef(0);

  // Selectores individuales para evitar re-renders innecesarios
  const currentPrice = useSalesStore((state) => state.currentPrice);
  const currentQuantity = useSalesStore((state) => state.currentQuantity);
  const indexToEdit = useSalesStore((state) => state.indexToEdit);
  const sales = useSalesStore((state) => state.sales);
  const addItem = useSalesStore((state) => state.addItem);
  const editItem = useSalesStore((state) => state.editItem);
  const removeSale = useSalesStore((state) => state.removeSale);
  const setCurrentPrice = useSalesStore((state) => state.setCurrentPrice);
  const setCurrentQuantity = useSalesStore((state) => state.setCurrentQuantity);
  const currentItemName = useSalesStore((state) => state.currentItemName);
  const setCurrentItemName = useSalesStore((state) => state.setCurrentItemName);
  const setIndexToEdit = useSalesStore((state) => state.setIndexToEdit);
  const setCurrentSale = useSalesStore((state) => state.setCurrentSale);
  const getCurrentSale = useSalesStore((state) => state.getCurrentSale);

  const currentSale = getCurrentSale();

  // Estado local para controlar el tipo de valor (precio/cantidad)
  const [valueType, setValueType] = React.useState<0 | 1>(0);
  const [newCountChanged, setNewCountChanged] = React.useState(false);
  const [newValueChanged, setNewValueChanged] = React.useState(false);

  // Colores memoizados
  const isDark = themeColors.isDark;
  const buttonBgColor = useMemo(() => isDark ? '#080d33' : '#d4186e', [isDark]);
  const calcBgColor = useMemo(() => isDark ? '#021735' : '#FFFFFF', [isDark]);
  const textColor = useMemo(() => isDark ? '#FFFFFF' : '#d4186e', [isDark]);

  React.useEffect(() => {
    if (indexToEdit !== null && currentSale) {
      const dataToEdit = currentSale.results[indexToEdit];
      setCurrentPrice(dataToEdit.value);
      setCurrentQuantity(dataToEdit.count);
      setCurrentItemName(dataToEdit.name);
      setValueType(1);
    } else {
      setCurrentPrice(0);
      setCurrentQuantity(0);
      if (!currentItemName) {
        setCurrentItemName('');
      }
      setValueType(0);
    }
    setNewCountChanged(false);
    setNewValueChanged(false);
  }, [indexToEdit]);

  const changeValues = useCallback((value: number | string, isReset = false) => {
    if (valueType === 0) {
      let newValue = indexToEdit !== null && !newValueChanged ? 0 : isReset ? 0 : currentPrice;
      const newValueAux = newValue + '' + value;
      newValue = newValueAux.length > 9 ? parseInt(String(newValue), 10) : parseInt(newValueAux, 10);
      setCurrentPrice(newValue);
      setNewValueChanged(true);
    } else if (valueType === 1) {
      const newCount = indexToEdit !== null && !newCountChanged ? 0 : isReset ? 0 : currentQuantity;
      const newCountAux = newCount + '' + value;
      setCurrentQuantity(
        newCountAux.length > 3 ? parseInt(String(newCount)) : parseInt(newCountAux),
      );
      setNewCountChanged(true);
    }
  }, [valueType, indexToEdit, newValueChanged, newCountChanged, currentPrice, currentQuantity, setCurrentPrice, setCurrentQuantity]);

  const addNewItem = useCallback(() => {
    const finalCount = currentQuantity === 0 ? 1 : currentQuantity;

    if (finalCount > 0 && currentPrice > 0) {
      const item = {
        code: '0',
        value: currentPrice,
        count: finalCount,
        total: currentPrice * finalCount,
        name: 'Varios',
      };

      if (indexToEdit !== null) {
        editItem(item, indexToEdit);
        setIndexToEdit(null);
        setCurrentItemName('');
      } else {
        addItem(item);
        setCurrentPrice(0);
        setCurrentQuantity(0);
        setCurrentItemName('');
        setValueType(0);
        // No colapsar la calculadora al agregar manualmente con "+"
        // Solo se colapsa cuando vuelves del catálogo (ver useFocusEffect en SaleScreen)
      }
    } else {
      showAlert(
        'Atención',
        'Debe ingresar una cantidad mayor a 0 para poder agregar el producto a su cuenta'
      );
    }
  }, [currentQuantity, currentPrice, indexToEdit, editItem, setIndexToEdit, addItem, setCurrentPrice, setCurrentQuantity, showAlert]);

  const cleanInvoice = useCallback(() => {
    const saleIndex = Math.max(0, sales.findIndex((s) => s === currentSale));
    showAlert(
      `Eliminar Cuenta ${saleIndex + 1}`,
      `¿Está seguro que desea eliminar la cuenta ${saleIndex + 1}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setCurrentPrice(0);
            if (sales.length > 0) {
              setIndexToEdit(null);
              const newIndex = saleIndex > 0 ? saleIndex - 1 : 0;
              setCurrentSale(newIndex);
              removeSale(saleIndex);
              showAlert('Éxito', 'La cuenta fue eliminada con éxito');
            }
          },
        },
      ],
    );
  }, [sales, currentSale, setCurrentPrice, setIndexToEdit, setCurrentSale, removeSale, showAlert]);

  const toggleValueType = useCallback(() => {
    setValueType(prev => prev === 0 ? 1 : 0);
  }, []);

  const startScanHold = useCallback(() => {
    scanHoldOpenedAtRef.current = Date.now();
    scanHoldActiveRef.current = true;
    setScanHoldActive(true);
  }, []);

  const endScanHold = useCallback(() => {
    if (!scanHoldActiveRef.current) return;
    // Al abrir el modal el POS suele disparar pressOut fantasma → no cerrar de inmediato
    if (Date.now() - scanHoldOpenedAtRef.current < 500) {
      return;
    }
    scanHoldActiveRef.current = false;
    setScanHoldActive(false);
  }, []);

  const openScan = useCallback(() => {
    scanHoldOpenedAtRef.current = Date.now();
    scanHoldActiveRef.current = true;
    setScanHoldActive(true);
  }, []);

  const closeScan = useCallback(() => {
    scanHoldActiveRef.current = false;
    setScanHoldActive(false);
  }, []);

  const handleScanNoStock = useCallback(() => {
    setShowStockModal(true);
  }, []);

  const handleScanProductAdded = useCallback((info: { productName: string; productPrice: number }) => {
    screenToastKeyRef.current += 1;
    setScreenAddedToast(info);
  }, []);

  const resetValue = useCallback(() => {
    changeValues(0, true);
  }, [changeValues]);

  // Crear handlers memoizados para cada botón
  const buttonHandlers = useMemo(() => {
    const handlers: Record<string, () => void> = {};
    CALCULATOR_BUTTONS.flat().forEach((value) => {
      if (value !== 'clean') {
        handlers[String(value)] = () => changeValues(value);
      }
    });
    return handlers;
  }, [changeValues]);

  // Mostrar el nombre del item actual: ya sea el que se está editando o el que se está por agregar
  const displayItemName = currentItemName || (indexToEdit !== null && currentSale ? currentSale.results[indexToEdit]?.name : null);

  return (
    <View style={[globalStyles.marginTopAuto, globalStyles.marginBottom20]}>
      {screenAddedToast ? (
        <View style={localStyles.screenToastWrap}>
          <ScanAddedToast
            key={`screen-toast-${screenToastKeyRef.current}`}
            productName={screenAddedToast.productName}
            productPrice={screenAddedToast.productPrice}
            onHidden={() => setScreenAddedToast(null)}
          />
        </View>
      ) : null}
      <View style={[globalStyles.row, globalStyles.marginLeft15]}>
        <TouchableOpacity
          onPress={() => setValueType(1)}
          style={[
            valueType === 0 ? salesStyles.btn1X : salesStyles.btn1XActive,
          ]}
        >
          <Text style={[globalStyles.fontSizeM, globalStyles.textBold, { color: valueType === 0 ? (isDark ? '#FFFFFF' : '#d4186e') : '#FFFFFF' }]}>
            {currentQuantity === 0 ? '1' : currentQuantity}x
          </Text>
        </TouchableOpacity>
        <View style={[globalStyles.marginLeftAuto, { marginRight: 18 }]}>
          <TouchableOpacity
            onPress={() => setValueType(0)}
          >
            <Text style={[globalStyles.textBold, globalStyles.fontSizeM, { color: textColor }]}>
              {formatCurrency(currentPrice)}
            </Text>
          </TouchableOpacity>
          {displayItemName && (
            <Text style={[
              globalStyles.textNormalItalic,
              globalStyles.textRight,
              globalStyles.colorSilver,
            ]}>
              {displayItemName}
            </Text>
          )}
        </View>
      </View>

      <View style={[globalStyles.marginTop20, globalStyles.paddingHorizontal18, globalStyles.row]}>
        <View style={[localStyles.calculatorGrid, globalStyles.marginLeftAuto, globalStyles.marginRight15, { borderColor: '#F3BAD7', backgroundColor: calcBgColor }]}>
          {CALCULATOR_BUTTONS.map((row, rowIndex) => (
            <View key={rowIndex} style={localStyles.calculatorRow}>
              {row.map((item, colIndex) =>
                item === 'clean' ? (
                  <CleanButton
                    key={colIndex}
                    onPress={cleanInvoice}
                    backgroundColor={calcBgColor}
                    rowIndex={rowIndex}
                    colIndex={colIndex}
                    isDark={isDark}
                  />
                ) : (
                  <CalcButton
                    key={colIndex}
                    value={item}
                    onPress={buttonHandlers[String(item)]}
                    backgroundColor={calcBgColor}
                    textColor={textColor}
                    rowIndex={rowIndex}
                    colIndex={colIndex}
                    isDark={isDark}
                  />
                ),
              )}
            </View>
          ))}
        </View>
        <View style={localStyles.rightColumn}>
          <TouchableOpacity
            onPress={resetValue}
            style={salesStyles.deleteBackspaceBtn}
          >
            <Image
              source={require('../../../assets/icons/delete-backspace.png')}
              style={salesStyles.deleteBackspaceImage}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={toggleValueType}
            style={salesStyles.xBtn}
          >
            <Image
              source={require('../../../assets/icons/x-icon.png')}
              style={salesStyles.xImage}
            />
          </TouchableOpacity>
          {enableProductScan ? (
            <View style={salesStyles.actionColumnStack}>
              <TouchableOpacity
                onPress={addNewItem}
                style={salesStyles.actionBtnHalf}
              >
                <Image
                  source={require('../../../assets/icons/plus-icon.png')}
                  style={[salesStyles.plusImage, { height: 32, width: 32 }]}
                />
              </TouchableOpacity>
              {scanPersistentMode ? (
                <Pressable
                  onPress={openScan}
                  style={({ pressed }) => [
                    salesStyles.actionBtnHalf,
                    salesStyles.actionBtnHalfGap,
                    (pressed || scanHoldActive) && salesStyles.scanBtnActive,
                  ]}
                >
                  <Text style={salesStyles.scanBtnLabel}>Scan</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPressIn={startScanHold}
                  onPressOut={endScanHold}
                  style={({ pressed }) => [
                    salesStyles.actionBtnHalf,
                    salesStyles.actionBtnHalfGap,
                    (pressed || scanHoldActive) && salesStyles.scanBtnActive,
                  ]}
                >
                  <Text style={salesStyles.scanBtnLabel}>Scan</Text>
                </Pressable>
              )}
            </View>
          ) : (
            <TouchableOpacity
              onPress={addNewItem}
              style={salesStyles.plusBtn}
            >
              <Image
                source={require('../../../assets/icons/plus-icon.png')}
                style={salesStyles.plusImage}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {enableProductScan && (
        <ScanHoldOverlay
          visible={scanHoldActive}
          onNoStock={handleScanNoStock}
          persistent={scanPersistentMode}
          onClose={closeScan}
          onProductAdded={handleScanProductAdded}
        />
      )}

      <AppModal
        visible={showStockModal}
        title="Sin Stock"
        message="No hay unidades disponibles de este producto."
        buttons={[
          { text: 'OK', onPress: () => setShowStockModal(false), variant: 'primary' },
        ]}
        onClose={() => setShowStockModal(false)}
      />
    </View>
  );
});

const localStyles = StyleSheet.create({
  calculatorGrid: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 15,
    overflow: 'hidden',
  },
  calculatorRow: {
    flexDirection: 'row',
  },
  calcButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 70,
  },
  calcButtonText: {
    fontSize: 34,
    fontWeight: 'bold',
  },
  cleanIcon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  rightColumn: {
    marginLeft: 20,
  },
  screenToastWrap: {
    marginBottom: 12,
    marginHorizontal: 18,
    zIndex: 20,
  },
});
