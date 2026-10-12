import React, { useState, useCallback, useMemo, useRef, memo } from 'react';
import { View, TouchableOpacity, StatusBar, BackHandler, Platform, Image, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Calculator, SaleList, SaleMenu, SalePayment } from '../components/sales';
import { SideMenu } from '../components/base/SideMenu';
import { useAlertStore } from '../stores/alertStore';
import { useSalesStore } from '../stores/salesStore';
import globalStyles from '../styles/globalStyles';
import salesStyles from '../styles/salesStyles';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useThemeColors } from '../hooks/useThemeColors';

type Props = NativeStackScreenProps<RootStackParamList, 'Sale'>;

export const SaleScreen: React.FC<Props> = memo(({ navigation }) => {
  const [showCalc, setShowCalc] = useState(true);
  const [isMenuVisible, setMenuVisible] = useState(false);
  const showAlert = useAlertStore((state) => state.showAlert);
  const themeColors = useThemeColors();
  const isFirstFocus = useRef(true);

  const toggleCalc = useCallback(() => {
    setShowCalc(prev => !prev);
  }, []);

  const openCalc = useCallback(() => {
    setShowCalc(true);
  }, []);

  const openMenu = useCallback(() => {
    setMenuVisible(true);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuVisible(false);
  }, []);

  const arrowIcon = useMemo(() => 
    showCalc 
      ? require('../../assets/icons_new2/flecha-01.png')
      : require('../../assets/icons_new2/calculadura_flecha-01.png'),
    [showCalc]
  );

  const arrowRotation = useMemo(() => 
    showCalc ? 180 : 0,
    [showCalc]
  );

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') {
        StatusBar.setHidden(true, 'fade');
      }

      // Al volver de Catálogo (u otra pantalla): si hay items, colapsar la calculadora
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
      } else {
        const { sales, currentSale } = useSalesStore.getState();
        if ((sales[currentSale]?.results?.length ?? 0) > 0) {
          setShowCalc(false);
        }
      }

      const handleBackPress = () => {
        showAlert(
          'Salir de la aplicación',
          '¿Está seguro que desea salir?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Salir', onPress: () => BackHandler.exitApp() },
          ]
        );
        return true;
      };

      if (Platform.OS === 'android') {
        BackHandler.addEventListener('hardwareBackPress', handleBackPress);
      }

      return () => {
        if (Platform.OS === 'android') {
          StatusBar.setHidden(false, 'fade');
          BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
        }
      };
    }, [showAlert]),
  );

  const statusBarStyle = themeColors.isDark ? 'light-content' : 'dark-content';

  return (
    <View style={[salesStyles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar 
        barStyle={statusBarStyle} 
        backgroundColor={themeColors.background} 
      />

      <SaleMenu navigation={navigation} onMenuPress={openMenu} />
      <SaleList onItemPress={openCalc} isCalcOpen={showCalc} />

      <View style={globalStyles.verticalCenter}>
        <TouchableOpacity
          style={showCalc ? undefined : globalStyles.marginBottom20}
          onPress={toggleCalc}
        >
          <Image 
            source={arrowIcon} 
            style={[
              showCalc ? { width: 40, height: 40 } : { width: 80, height: 80 },
              showCalc && { transform: [{ rotate: `${arrowRotation}deg` }] }
            ]} 
          />
        </TouchableOpacity>
      </View>

      {showCalc && <Calculator />}
      <SalePayment navigation={navigation} />

      {isMenuVisible && (
        <SideMenu 
          visible={isMenuVisible} 
          onClose={closeMenu} 
          navigation={navigation} 
        />
      )}
    </View>
  );
});
