import React, { useCallback, memo, useMemo } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import AppModal from '../base/AppModal';
import { useSalesStore } from '../../stores/salesStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { formatCurrency } from '../../utils/format';
import globalStyles from '../../styles/globalStyles';
import salesStyles from '../../styles/salesStyles';
import { useThemeColors } from '../../hooks/useThemeColors';
import { COMPROBANTE_PAGO_DOC, isComprobanteElectronico } from '../../utils/documentTypeDefaults';

interface SalePaymentProps {
  navigation: any;
}

export const SalePayment: React.FC<SalePaymentProps> = memo(({ navigation }) => {
  const themeColors = useThemeColors();

  // Selectores individuales
  const currentPrice = useSalesStore((state) => state.currentPrice);
  const sales = useSalesStore((state) => state.sales);
  const currentSaleIndex = useSalesStore((state) => state.currentSale);
  const setCurrentPrice = useSalesStore((state) => state.setCurrentPrice);
  const addItem = useSalesStore((state) => state.addItem);
  const setClient = useSalesStore((state) => state.setClient);
  const setChangeSale = useSalesStore((state) => state.setChangeSale);
  const setPaymentMethodSale = useSalesStore((state) => state.setPaymentMethodSale);
  const setDocumentTypeSale = useSalesStore((state) => state.setDocumentTypeSale);

  const documentTypes = useSettingsStore((state) => state.documentType);
  const getPaymentMethodsForDocType = useSettingsStore((state) => state.getPaymentMethodsForDocType);
  const emitirDocumento = useSettingsStore((state) => state.emitirDocumento);

  // Calcular total e itemCount reactivamente desde sales
  const currentSale = sales[currentSaleIndex];
  const results = currentSale?.results || [];

  const total = useMemo(() => {
    return results.reduce((sum, item) => {
      const itemTotal = typeof item.total === 'string' ? parseFloat(item.total) || 0 : item.total;
      return sum + itemTotal;
    }, 0);
  }, [results]);

  const itemCount = useMemo(() => {
    return results.reduce((sum, item) => {
      const itemCount = typeof item.count === 'string' ? parseInt(item.count, 10) || 0 : item.count;
      return sum + itemCount;
    }, 0);
  }, [results]);

  const textColor = useMemo(() =>
    themeColors.background === '#111111' ? themeColors.black : themeColors.white,
    [themeColors.background, themeColors.black, themeColors.white]
  );

  const [showWarningModal, setShowWarningModal] = React.useState(false);

  const handlePayBtn = useCallback(() => {
    setCurrentPrice(0);
    setChangeSale(null);
    setPaymentMethodSale('');
    // Limpiar cliente al iniciar el pago para que la próxima venta parta sin cliente
    setClient(null);

    // Si emitir documento está desactivado, solo comprobante de pago → ir directo a PaymentMethod
    if (!emitirDocumento) {
      setDocumentTypeSale({ id: 0, name: COMPROBANTE_PAGO_DOC.name, code: '0' });
      const totalAmount = itemCount > 0 ? total : (currentPrice > 0 ? currentPrice : 0);
      if (totalAmount <= 0 && itemCount === 0) {
        setShowWarningModal(true);
        return;
      }
      if (itemCount === 0 && currentPrice > 0) {
        addItem({ code: '0', value: currentPrice, count: 1, total: currentPrice, name: 'Varios' });
      }
      navigation.navigate('PaymentMethod', { total: totalAmount, autoExecute: false });
      return;
    }

    const navigateToPayment = (docType: typeof documentTypes[0], totalAmount: number) => {
      setDocumentTypeSale({
        id: docType.id,
        name: docType.name,
        code: docType.id.toString(),
      });

      const configuredMethods = getPaymentMethodsForDocType(docType.id);
      const shouldAutoExecute =
        !isComprobanteElectronico(docType.id) &&
        configuredMethods.length === 1 &&
        configuredMethods[0] !== 'Efectivo';

      navigation.navigate('PaymentMethod', {
        total: totalAmount,
        autoExecute: shouldAutoExecute
      });
    };

    if (itemCount > 0) {
      if (documentTypes.length === 1) {
        navigateToPayment(documentTypes[0], total);
      } else {
        navigation.navigate('DocumentType', { items: documentTypes });
      }
    } else {
      if (currentPrice && currentPrice > 0) {
        addItem({
          code: '0',
          value: currentPrice,
          count: 1,
          total: currentPrice,
          name: 'Varios',
        });

        if (documentTypes.length === 1) {
          navigateToPayment(documentTypes[0], currentPrice);
        } else {
          navigation.navigate('DocumentType', { items: documentTypes });
        }
        return;
      }
      setShowWarningModal(true);
    }
  }, [currentPrice, itemCount, total, documentTypes, navigation, setCurrentPrice, setClient, setChangeSale, setPaymentMethodSale, addItem, setDocumentTypeSale, getPaymentMethodsForDocType, emitirDocumento]);

  return (
    <View style={[globalStyles.paddingHorizontal18, globalStyles.marginBottom20]}>
      <TouchableOpacity
        style={salesStyles.rowPayTotal}
        onPress={handlePayBtn}
      >
        <Text style={[globalStyles.textNormal, { fontSize: 30, fontWeight: 'bold', color: '#FFFFFF' }]}>
          PAGAR
        </Text>
        <Text style={[globalStyles.textBold, { fontSize: 40, color: '#FFFFFF' }]}>
          {formatCurrency(total)}
        </Text>
      </TouchableOpacity>

      <AppModal
        visible={showWarningModal}
        title="Atención"
        message="Debe ingresar productos para poder pagar la cuenta"
        buttons={[
          { text: 'OK', onPress: () => setShowWarningModal(false), variant: 'primary' }
        ]}
        onClose={() => setShowWarningModal(false)}
      />
    </View>
  );
});
