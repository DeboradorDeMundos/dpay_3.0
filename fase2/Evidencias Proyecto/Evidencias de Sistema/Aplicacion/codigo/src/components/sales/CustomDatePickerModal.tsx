import React, { useEffect, useRef } from 'react';
import { View, Text, Modal, StyleSheet, Dimensions, Animated, Platform, TouchableOpacity } from 'react-native';
import DatePicker from 'react-native-date-picker';
import { useThemeColors } from '../../hooks/useThemeColors';
import { typography } from '../../theme';

interface CustomDatePickerModalProps {
  visible: boolean;
  date: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
  title: string;
  mode?: 'date' | 'time' | 'datetime';
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const CustomDatePickerModal: React.FC<CustomDatePickerModalProps> = ({
  visible,
  date,
  onConfirm,
  onCancel,
  title,
  mode = 'date',
}) => {
  const themeColors = useThemeColors();
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [selectedDate, setSelectedDate] = React.useState(date);

  useEffect(() => {
    setSelectedDate(date);
  }, [date]);

  useEffect(() => {
    if (visible) {
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

  if (!visible) return null;

  const handleConfirm = () => {
    onConfirm(selectedDate);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.backdrop,
            { opacity: opacityAnim },
          ]}
        />
        
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
          <Text style={[styles.title, { color: themeColors.secondary }]}>
            {title}
          </Text>
          
          <View style={styles.pickerContainer}>
            <DatePicker
              date={selectedDate}
              onDateChange={setSelectedDate}
              mode={mode}
              theme={themeColors.isDark ? 'dark' : 'light'}
              dividerColor="#75bebf"
            />
          </View>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity 
              style={styles.button}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, { color: '#75bebf' }]}>
                Cancelar
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.confirmButton]}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonTextWhite}>
                Confirmar
              </Text>
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
    marginBottom: 20,
  },
  pickerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  button: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#75bebf',
    backgroundColor: 'transparent',
    minWidth: 90,
    maxWidth: 140,
  },
  confirmButton: {
    backgroundColor: '#75bebf',
    borderColor: '#75bebf',
  },
  buttonText: {
    fontFamily: typography.families.bold,
    fontSize: typography.sizes.base,
  },
  buttonTextWhite: {
    fontFamily: typography.families.bold,
    fontSize: typography.sizes.base,
    color: '#FFFFFF',
  },
});
