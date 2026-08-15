import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated, Dimensions, Modal } from 'react-native';
import { typography } from '../../theme';
import { useThemeColors } from '../../hooks/useThemeColors';
import { formatCurrency } from '../../utils/format';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TipModalProps {
  visible: boolean;
  totalAmount: number;
  onCancel: () => void;
  onNoTip: () => void;
  onAcceptTip: (tipAmount: number) => void;
}

type TipMode = 'percentage' | 'amount';

export const TipModal: React.FC<TipModalProps> = ({
  visible,
  totalAmount,
  onCancel,
  onNoTip,
  onAcceptTip,
}) => {
  const themeColors = useThemeColors();
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const [tipMode, setTipMode] = useState<TipMode>('percentage');
  const [percentage, setPercentage] = useState('10');
  const [customAmount, setCustomAmount] = useState('');

  // Propina calculada
  const tipAmount = tipMode === 'percentage'
    ? Math.round(totalAmount * (parseFloat(percentage) || 0) / 100)
    : parseInt(customAmount.replace(/\./g, ''), 10) || 0;

  const totalWithTip = totalAmount + tipAmount;

  // Reset al abrir
  useEffect(() => {
    if (visible) {
      setTipMode('percentage');
      setPercentage('10');
      setCustomAmount('');

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const percentageOptions = ['10', '15', '20', '25'];

  const handleAmountChange = (value: string) => {
    // Solo números, formatear con puntos de miles
    const cleaned = value.replace(/\D/g, '');
    if (cleaned === '') {
      setCustomAmount('');
      return;
    }
    const formatted = parseInt(cleaned, 10).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    setCustomAmount(formatted);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]} />

        <Animated.View
          style={[
            styles.modalContainer,
            {
              backgroundColor: themeColors.isDark ? '#1a2a4a' : '#FFFFFF',
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Título */}
          <Text style={[styles.title, { color: themeColors.secondary }]}>Propina</Text>

          {/* Monto del documento */}
          <View style={styles.amountSection}>
            <Text style={[styles.label, { color: themeColors.textSecondary }]}>
              Monto del documento
            </Text>
            <Text style={[styles.amount, { color: themeColors.text }]}>
              {formatCurrency(totalAmount)}
            </Text>
          </View>

          {/* Selector de modo */}
          <View style={styles.modeSelector}>
            <TouchableOpacity
              onPress={() => setTipMode('percentage')}
              style={[
                styles.modeButton,
                tipMode === 'percentage' && styles.modeButtonActive,
              ]}
            >
              <Text style={[
                styles.modeButtonText,
                tipMode === 'percentage' && styles.modeButtonTextActive,
              ]}>
                Porcentaje
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTipMode('amount')}
              style={[
                styles.modeButton,
                tipMode === 'amount' && styles.modeButtonActive,
              ]}
            >
              <Text style={[
                styles.modeButtonText,
                tipMode === 'amount' && styles.modeButtonTextActive,
              ]}>
                Monto fijo
              </Text>
            </TouchableOpacity>
          </View>

          {/* Input según modo */}
          {tipMode === 'percentage' ? (
            <View style={styles.percentageGrid}>
              {percentageOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  onPress={() => setPercentage(option)}
                  style={[
                    styles.percentageButton,
                    percentage === option && styles.percentageButtonActive,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.percentageButtonText,
                    { color: percentage === option ? '#FFFFFF' : themeColors.text },
                  ]}>
                    {option}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.inputRow}>
              <Text style={[styles.inputPrefix, { color: themeColors.text }]}>$</Text>
              <TextInput
                value={customAmount}
                onChangeText={handleAmountChange}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={themeColors.textSecondary}
                style={[
                  styles.input,
                  styles.inputExpand,
                  {
                    color: themeColors.text,
                    borderColor: '#03C0C3',
                    backgroundColor: themeColors.isDark ? '#0a1a3a' : '#F5F5F5',
                  },
                ]}
                selectTextOnFocus
              />
            </View>
          )}

          {/* Propina calculada */}
          <View style={styles.tipResult}>
            <Text style={[styles.tipLabel, { color: themeColors.textSecondary }]}>
              Propina
            </Text>
            <Text style={[styles.tipValue, { color: '#03C0C3' }]}>
              {formatCurrency(tipAmount)}
            </Text>
          </View>

          {/* Total con propina */}
          <View style={[styles.totalSection, { borderTopColor: themeColors.isDark ? '#2a3a5a' : '#E0E0E0' }]}>
            <Text style={[styles.totalLabel, { color: themeColors.text }]}>Total a pagar</Text>
            <Text style={[styles.totalValue, { color: '#d4186e' }]}>
              {formatCurrency(totalWithTip)}
            </Text>
          </View>

          {/* Botones */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              onPress={() => onAcceptTip(tipAmount)}
              style={[styles.button, styles.buttonAccept]}
              activeOpacity={0.8}
              disabled={tipAmount <= 0}
            >
              <Text style={[styles.buttonText, tipAmount <= 0 && { opacity: 0.5 }]}>
                SI
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onNoTip}
              style={[styles.button, styles.buttonNoTip]}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>NO</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: SCREEN_WIDTH - 48,
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#75bebf',
    paddingVertical: 24,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  title: {
    fontFamily: typography.families.bold,
    fontSize: typography.sizes.xl,
    textAlign: 'center',
    marginBottom: 16,
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  label: {
    fontFamily: typography.families.normal,
    fontSize: typography.sizes.sm,
    marginBottom: 4,
  },
  amount: {
    fontFamily: typography.families.bold,
    fontSize: 28,
  },
  modeSelector: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#03C0C3',
    marginBottom: 16,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#03C0C3',
  },
  modeButtonText: {
    fontFamily: typography.families.bold,
    fontSize: typography.sizes.sm,
    color: '#03C0C3',
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
  },
  percentageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
    justifyContent: 'center',
  },
  percentageButton: {
    width: '22%',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#03C0C3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageButtonActive: {
    backgroundColor: '#03C0C3',
    borderColor: '#03C0C3',
  },
  percentageButtonText: {
    fontFamily: typography.families.bold,
    fontSize: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  input: {
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 22,
    fontFamily: typography.families.bold,
    textAlign: 'center',
    minWidth: 100,
  },
  inputExpand: {
    flex: 1,
    textAlign: 'left',
  },
  inputPrefix: {
    fontFamily: typography.families.bold,
    fontSize: 22,
    marginRight: 8,
  },
  inputSuffix: {
    fontFamily: typography.families.bold,
    fontSize: 22,
    marginLeft: 8,
  },
  tipResult: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipLabel: {
    fontFamily: typography.families.normal,
    fontSize: typography.sizes.base,
  },
  tipValue: {
    fontFamily: typography.families.bold,
    fontSize: 20,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 12,
    marginBottom: 20,
  },
  totalLabel: {
    fontFamily: typography.families.bold,
    fontSize: typography.sizes.base,
  },
  totalValue: {
    fontFamily: typography.families.bold,
    fontSize: 24,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  button: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 25,
  },
  buttonCancel: {
    backgroundColor: '#d4186e',
  },
  buttonNoTip: {
    backgroundColor: '#75bebf',
  },
  buttonAccept: {
    backgroundColor: '#d4186e',
  },
  buttonText: {
    fontFamily: typography.families.bold,
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
