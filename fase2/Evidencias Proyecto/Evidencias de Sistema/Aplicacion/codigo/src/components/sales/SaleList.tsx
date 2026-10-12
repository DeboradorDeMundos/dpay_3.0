import React, { useRef, useCallback, memo } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, StyleSheet, ListRenderItemInfo } from 'react-native';
import { useSalesStore, CartItem } from '../../stores/salesStore';
import { formatCurrency } from '../../utils/format';
import globalStyles from '../../styles/globalStyles';
import salesStyles from '../../styles/salesStyles';
import { useThemeColors } from '../../hooks/useThemeColors';

interface SaleListItemProps {
  item: CartItem;
  index: number;
  isEditing: boolean;
  onPress: () => void;
  onRemove: () => void;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
}

const SaleListItem = memo<SaleListItemProps>(({
  item,
  index,
  isEditing,
  onPress,
  onRemove,
  backgroundColor,
  borderColor,
  textColor,
}) => (
  <TouchableOpacity
    style={[
      isEditing ? salesStyles.itemCardEdit : salesStyles.itemCard,
      {
        borderWidth: 1,
        borderColor: '#d4186e',
        marginBottom: 5
      }
    ]}
    onPress={onPress}
  >
    <Image
      source={require('../../../assets/icons_new/carrito_blanco.png')}
      style={[{ width: 18, height: 18, marginRight: 6, tintColor: '#d4186e' }]}
    />
    <Text style={[{ width: '12%' }, globalStyles.textBold, globalStyles.fontSizeXS, { color: '#d4186e' }]}>
      {item.count}x
    </Text>
    <View style={[{ width: '48%' }, globalStyles.marginRight15]}>
      <Text style={[globalStyles.fontSizeXS, { color: '#d4186e' }]} numberOfLines={1}>
        <Text style={globalStyles.textBold}>{formatCurrency(item.value)}</Text>
        <Text style={globalStyles.textNormal}> ({item.name})</Text>
      </Text>
    </View>
    <Text style={[{ width: '20%' }, globalStyles.textBold, globalStyles.fontSizeXS, globalStyles.textRight, { color: '#d4186e' }]}>
      {formatCurrency(item.total)}
    </Text>
    <TouchableOpacity
      onPress={onRemove}
      style={[globalStyles.removeItemBtn, { width: 28, height: 28, borderRadius: 14, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }]}
    >
      <Image
        source={require('../../../assets/icons/cancel.png')}
        style={[{ width: 28, height: 28 }, { tintColor: '#d4186e' }]}
        resizeMode="cover"
      />
    </TouchableOpacity>
  </TouchableOpacity>
));

interface SaleListProps {
  onItemPress?: () => void;
  isCalcOpen?: boolean;
}

export const SaleList = memo<SaleListProps>(({ onItemPress, isCalcOpen = true }) => {
  const sales = useSalesStore((state) => state.sales);
  const currentSaleIndex = useSalesStore((state) => state.currentSale);
  const indexToEdit = useSalesStore((state) => state.indexToEdit);
  const setIndexToEdit = useSalesStore((state) => state.setIndexToEdit);
  const removeItem = useSalesStore((state) => state.removeItem);

  const listRef = useRef<FlatList>(null);
  const currentSale = sales[currentSaleIndex];
  const themeColors = useThemeColors();

  const handleItemPress = useCallback((index: number) => {
    // Si la calculadora está cerrada, abrirla
    if (!isCalcOpen && onItemPress) {
      onItemPress();
    }
    setIndexToEdit(index === indexToEdit ? null : index);
  }, [indexToEdit, setIndexToEdit, isCalcOpen, onItemPress]);

  const handleRemoveItem = useCallback((index: number) => {
    setIndexToEdit(null);
    removeItem(index);
  }, [setIndexToEdit, removeItem]);

  const renderItem = useCallback(({ item, index }: ListRenderItemInfo<CartItem>) => (
    <SaleListItem
      item={item}
      index={index}
      isEditing={index === indexToEdit}
      onPress={() => handleItemPress(index)}
      onRemove={() => handleRemoveItem(index)}
      backgroundColor={themeColors.backgroundSecondary}
      borderColor={themeColors.border}
      textColor={themeColors.text}
    />
  ), [indexToEdit, handleItemPress, handleRemoveItem, themeColors]);

  const keyExtractor = useCallback((_: CartItem, index: number) => `sale-item-${index}`, []);

  if (!currentSale || currentSale.results.length === 0) {
    return (
      <View style={[globalStyles.verticalCenter, globalStyles.flex1, globalStyles.justifyContentCenter]}>
        <Image
          source={require('../../../assets/images/no-results.png')}
          style={globalStyles.noResultsImage}
        />
        <Text style={[globalStyles.textNormal, globalStyles.marginTop10, globalStyles.colorSilver]}>
          No se ha cargado ningún artículo...
        </Text>
      </View>
    );
  }

  return (
    <View style={[globalStyles.verticalCenter, globalStyles.flex1, globalStyles.justifyContentCenter]}>
      <FlatList
        ref={listRef}
        data={currentSale.results}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        style={localStyles.list}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={8}
        onContentSizeChange={() => {
          if (currentSale.results.length > 0) {
            listRef.current?.scrollToEnd({ animated: true });
          }
        }}
      />
    </View>
  );
});

const localStyles = StyleSheet.create({
  list: {
    marginVertical: 20,
    marginHorizontal: 15,
  },
});
