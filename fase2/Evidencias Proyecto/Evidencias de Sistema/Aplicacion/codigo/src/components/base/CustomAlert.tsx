import React from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions, StyleSheet } from 'react-native';
import { typography } from '../../theme';
import { useThemeColors } from '../../hooks/useThemeColors';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttons?: AlertButton[];
  onClose: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  buttons = [{ text: 'OK', style: 'default' }],
  onClose,
}) => {
  const themeColors = useThemeColors();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
    }
  }, [visible]);

  if (!visible) return null;

  const handleButtonPress = (button: AlertButton) => {
    button.onPress?.();
    onClose();
  };

  const getButtonStyle = (style?: string) => {
    if (style === 'destructive') return { backgroundColor: '#d4186e' };
    return { backgroundColor: '#75bebf' };
  };

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: fadeAnim }]} />
      <Animated.View
        style={[
          styles.alertBox,
          { backgroundColor: themeColors.isDark ? '#1a2a4a' : '#FFFFFF' },
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Text style={[styles.title, { color: themeColors.secondary }]}>{title}</Text>
        <Text style={[styles.message, { color: themeColors.text }]}>{message}</Text>
        <View style={styles.buttonsContainer}>
          {buttons.map((button, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleButtonPress(button)}
              style={[
                styles.button,
                getButtonStyle(button.style),
                buttons.length === 1 && styles.buttonSingle,
              ]}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>{button.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 9999,
    elevation: 99,
  },
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  alertBox: {
    width: SCREEN_WIDTH - 48,
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#75bebf',
    paddingVertical: 24,
    paddingHorizontal: 20,
    elevation: 100,
  },
  title: {
    fontFamily: typography.families.bold,
    fontSize: typography.sizes.xl,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontFamily: typography.families.normal,
    fontSize: typography.sizes.base,
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSingle: {
    flex: 0,
    paddingHorizontal: 40,
  },
  buttonText: {
    fontFamily: typography.families.bold,
    color: '#FFFFFF',
    fontSize: typography.sizes.base,
  },
});

