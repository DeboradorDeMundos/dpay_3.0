import React, { useCallback, memo } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useSalesStore } from '../../stores/salesStore';
import { useAlertStore } from '../../stores/alertStore';
import globalStyles from '../../styles/globalStyles';
import { useThemeColors } from '../../hooks/useThemeColors';

interface SaleMenuProps {
  navigation: any;
  onMenuPress: () => void;
}

export const SaleMenu: React.FC<SaleMenuProps> = memo(({ navigation, onMenuPress }) => {
  // Selectores individuales
  const sales = useSalesStore((state) => state.sales);
  const currentSaleIdx = useSalesStore((state) => state.currentSale);
  const setNewSale = useSalesStore((state) => state.setNewSale);
  const setIndexToEdit = useSalesStore((state) => state.setIndexToEdit);
  const setCurrentSale = useSalesStore((state) => state.setCurrentSale);
  const showAlert = useAlertStore((state) => state.showAlert);
  const themeColors = useThemeColors();

  const createNewSale = useCallback(() => {
    if (sales.length === 5) {
      showAlert('Límite alcanzado', 'Sólo se pueden crear 5 cuentas');
      return;
    }
    setNewSale();
    setIndexToEdit(null);
  }, [sales.length, showAlert, setNewSale, setIndexToEdit]);

  const nextSale = useCallback(() => {
    setIndexToEdit(null);
    if (sales.length > 0) {
      const nextIndex = currentSaleIdx < sales.length - 1 ? currentSaleIdx + 1 : 0;
      setCurrentSale(nextIndex);
    }
  }, [sales.length, currentSaleIdx, setIndexToEdit, setCurrentSale]);

  const prevSale = useCallback(() => {
    setIndexToEdit(null);
    if (sales.length > 0) {
      const prevIndex = currentSaleIdx === 0 ? sales.length - 1 : currentSaleIdx - 1;
      setCurrentSale(prevIndex);
    }
  }, [sales.length, currentSaleIdx, setIndexToEdit, setCurrentSale]);

  const navigateToCatalogue = useCallback(() => {
    navigation.navigate('Catalogue');
  }, [navigation]);

  const textColor = themeColors.isDark ? '#FFFFFF' : '#213d8b';

  return (
    <View style={[globalStyles.row, globalStyles.verticalCenter, globalStyles.justifyContentBetween, globalStyles.paddingHorizontal18, localStyles.container]}>
      <View style={[globalStyles.row, globalStyles.verticalCenter]}>
        <TouchableOpacity onPress={prevSale} style={localStyles.navButton}>
          <Image 
            source={require('../../../assets/icons/prev.png')} 
            style={[localStyles.navIcon, { tintColor: '#d4186e' }]} 
          />
        </TouchableOpacity>
        <Text style={[globalStyles.textBold, localStyles.saleCounter, { color: textColor }]}>
          {currentSaleIdx + 1}/{sales.length === 0 ? 1 : sales.length}
        </Text>
        <TouchableOpacity onPress={nextSale} style={localStyles.navButton}>
          <Image 
            source={require('../../../assets/icons/next.png')} 
            style={[localStyles.navIcon, { tintColor: '#d4186e' }]} 
          />
        </TouchableOpacity>
      </View>
      <View style={[globalStyles.row, { justifyContent: 'space-evenly', flex: 1 }]}>
        <View style={localStyles.buttonContainer}>
          <TouchableOpacity
            onPress={createNewSale}
            style={[{ backgroundColor: themeColors.isDark ? '#FFFFFF' : '#d4186e' }, globalStyles.fullCenter, localStyles.actionButton]}
          >
            <Image 
              source={themeColors.isDark ? require('../../../assets/icons_new/nueva_compra_blanco.png') : require('../../../assets/icons_new/nueva_compra_blanco.png')} 
              style={[localStyles.actionIcon, themeColors.isDark && { tintColor: '#d4186e' }]} 
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Text style={[globalStyles.textCenter, localStyles.actionLabel, { color: themeColors.isDark ? '#FFFFFF' : '#d4186e' }]}>
            Nueva Cta.
          </Text>
        </View>

        <View style={[localStyles.buttonContainer, { marginLeft: -2 }]}>
          <TouchableOpacity
            onPress={navigateToCatalogue}
            style={[{ backgroundColor: themeColors.isDark ? '#FFFFFF' : '#d4186e' }, globalStyles.fullCenter, localStyles.actionButton]}
          >
            <Image 
              source={themeColors.isDark ? require('../../../assets/icons_new/menu2_blanco.png') : require('../../../assets/icons_new/menu2_blanco.png')} 
              style={[localStyles.actionIcon, themeColors.isDark && { tintColor: '#d4186e' }]} 
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Text style={[globalStyles.textCenter, localStyles.actionLabel, { color: themeColors.isDark ? '#FFFFFF' : '#d4186e' }]}>
            Catálogo
          </Text>
        </View>

        <View style={localStyles.buttonContainer}>
          <TouchableOpacity
            onPress={onMenuPress}
            style={[{ backgroundColor: themeColors.isDark ? '#FFFFFF' : '#d4186e' }, globalStyles.fullCenter, localStyles.actionButton]}
          >
            <Image 
              source={themeColors.isDark ? require('../../../assets/icons_new/menu_blanco.png') : require('../../../assets/icons_new/menu_blanco.png')} 
              style={[localStyles.actionIcon, themeColors.isDark && { tintColor: '#d4186e' }]} 
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Text style={[globalStyles.textCenter, localStyles.actionLabel, { color: themeColors.isDark ? '#FFFFFF' : '#d4186e' }]}>
            Menú
          </Text>
        </View>
      </View>
    </View>
  );
});

const localStyles = StyleSheet.create({
  container: {
    marginTop: 30,
    paddingVertical: 5,
  },
  navButton: {
    padding: 3,
  },
  navIcon: {
    width: 20,
    height: 20,
  },
  saleCounter: {
    marginHorizontal: 6,
    minWidth: 40,
    textAlign: 'center',
    fontSize: 18,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  actionIcon: {
    width: 40,
    height: 40,
  },
  actionLabel: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 14,
    fontWeight: 'bold',
  },
});
