import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, TouchableWithoutFeedback, Animated, Dimensions, Image, StyleSheet } from 'react-native';
import globalStyles, { colors } from '../../styles/globalStyles';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { useThemeColors } from '../../hooks/useThemeColors';
import LogoutConfirmModal from './LogoutConfirmModal';

interface SideMenuProps {
  visible: boolean;
  onClose: () => void;
  navigation: any;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const SideMenu: React.FC<SideMenuProps> = ({ visible, onClose, navigation }) => {
  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logout = useAuthStore((state) => state.logout);
  const { isDarkMode, toggleTheme } = useThemeStore();
  const themeColors = useThemeColors();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleNavigate = (screen: string) => {
    onClose();
    setTimeout(() => {
      navigation.navigate(screen);
    }, 300);
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    onClose();
    setTimeout(() => {
      logout();
      navigation.navigate('Login');
    }, 300);
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="auto">
      {/* Overlay - Toca fuera para cerrar */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { 
              backgroundColor: 'rgba(0,0,0,0.5)', 
              opacity: fadeAnim 
            }
          ]}
        />
      </TouchableWithoutFeedback>

      {/* Menu Content - Bloqueará interacciones debajo */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            right: 10,
            top: '50%',
            marginTop: -250,
            width: 100,
            height: 500,
            padding: 10,
            backgroundColor: '#d4186e',
            borderRadius: 20,
            shadowColor: '#000',
            shadowOffset: { width: -2, height: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 10,
            transform: [{ translateX: slideAnim }],
            zIndex: 9999,
            justifyContent: 'space-evenly',
          },
        ]}
        pointerEvents="auto"
      >
        {/* Configuración */}
        <View style={{ alignItems: 'center' }}>
          <TouchableOpacity 
            onPress={() => handleNavigate('Settings')} 
            style={[
              { backgroundColor: '#FFFFFF' },
              globalStyles.fullCenter,
              { borderRadius: 12, width: 75, height: 75 }
            ]}
          >
            <Image 
              source={require('../../../assets/icons_new/configuracion_rosa.png')} 
              style={{ width: 50, height: 50 }} 
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Text style={[globalStyles.marginTop5, globalStyles.textNormal, { fontSize: 9, color: '#FFFFFF', fontWeight: 'bold', textAlign: 'center' }]}>
            Config.
          </Text>
        </View>

        {/* Mis Ventas */}
        <View style={[{ alignItems: 'center' }]}>
          <TouchableOpacity 
            onPress={() => handleNavigate('MySales')} 
            style={[
              { backgroundColor: '#FFFFFF' },
              globalStyles.fullCenter,
              { borderRadius: 12, width: 75, height: 75 }
            ]}
          >
            <Image 
              source={require('../../../assets/icons_new/venta_rosa.png')} 
              style={{ width: 50, height: 50 }} 
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Text style={[globalStyles.marginTop5, globalStyles.textNormal, { fontSize: 9, color: '#FFFFFF', fontWeight: 'bold', textAlign: 'center' }]}>
            Ventas
          </Text>
        </View>

        {/* Modo Oscuro/Claro */}
        <View style={[{ alignItems: 'center' }]}>
          <TouchableOpacity 
            onPress={toggleTheme}
            style={[
              { backgroundColor: '#213d8b' },
              globalStyles.fullCenter,
              { borderRadius: 12, width: 75, height: 75 }
            ]}
          >
            <Image 
              source={require('../../../assets/icons_new/modo_oscuro.png')} 
              style={{ width: 50, height: 50 }} 
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Text style={[globalStyles.marginTop5, globalStyles.textNormal, { fontSize: 9, color: '#FFFFFF', fontWeight: 'bold', textAlign: 'center' }]}>
            {isDarkMode ? 'Claro' : 'Oscuro'}
          </Text>
        </View>

        {/* Cerrar Sesión */}
        <View style={[{ alignItems: 'center' }]}>
          <TouchableOpacity 
            onPress={handleLogout}
            style={[
              { backgroundColor: '#FFFFFF' },
              globalStyles.fullCenter,
              { borderRadius: 12, width: 75, height: 75 }
            ]}
          >
            <Image 
              source={require('../../../assets/icons_new/salir_rosa.png')} 
              style={{ width: 50, height: 50 }} 
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Text style={[globalStyles.marginTop5, globalStyles.textNormal, { fontSize: 9, color: '#FFFFFF', fontWeight: 'bold', textAlign: 'center' }]}>
            Salir
          </Text>
        </View>
      </Animated.View>

      <LogoutConfirmModal
        visible={showLogoutModal}
        onConfirm={confirmLogout}
        onCancel={cancelLogout}
      />
    </View>
  );
};
