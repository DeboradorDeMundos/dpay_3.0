import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, Modal, ActivityIndicator } from 'react-native';
import { typography } from '../../theme';
import { useThemeColors } from '../../hooks/useThemeColors';

interface AppModalButton {
  text: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
}

interface AppModalProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AppModalButton[];
  onClose?: () => void;
  children?: React.ReactNode;
  maxWidth?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AppModal: React.FC<AppModalProps> = ({ visible, title, message, buttons, onClose, children, maxWidth = 400 }) => {
  const themeColors = useThemeColors();
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
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
              maxWidth: maxWidth,
            },
          ]}
        >
          <Text style={[styles.title, { color: themeColors.secondary }]}>
            {title}
          </Text>
          
          {message && (
            <Text style={[styles.message, { color: themeColors.text }]}>
              {message}
            </Text>
          )}

          {children}

          {buttons && buttons.length > 0 && (
            <View style={styles.buttonsContainer}>
              {buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={button.onPress}
                  disabled={button.disabled || button.loading}
                  style={[
                    styles.button,
                    button.variant === 'secondary'
                      ? styles.buttonSecondary
                      : styles.buttonPrimary,
                    (button.disabled || button.loading) && styles.buttonDisabled,
                  ]}
                  activeOpacity={0.8}
                >
                  {button.loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.buttonText}>{button.text}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
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
    marginBottom: 12,
  },
  message: {
    fontFamily: typography.families.normal,
    fontSize: typography.sizes.base,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
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
    minWidth: 90,
    maxWidth: 140,
  },
  buttonPrimary: {
    backgroundColor: '#75bebf',
  },
  buttonSecondary: {
    backgroundColor: '#d4186e',
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    fontFamily: typography.families.bold,
    fontSize: typography.sizes.base,
    color: '#FFFFFF',
  },
});

export default AppModal;
