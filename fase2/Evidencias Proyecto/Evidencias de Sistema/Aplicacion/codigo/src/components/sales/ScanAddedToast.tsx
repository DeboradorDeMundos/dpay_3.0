import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { formatCurrency } from '../../utils/format';

interface ScanAddedToastProps {
  productName: string;
  productPrice?: number;
  onHidden?: () => void;
}

const VISIBLE_MS = 1800;

/**
 * Banner breve que confirma visualmente que un producto escaneado se agregó al carrito.
 */
export const ScanAddedToast: React.FC<ScanAddedToastProps> = ({
  productName,
  productPrice,
  onHidden,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -8,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          onHidden?.();
        }
      });
    }, VISIBLE_MS);

    return () => clearTimeout(timer);
  }, [opacity, translateY, onHidden]);

  const displayName = productName.length > 36
    ? `${productName.slice(0, 34)}…`
    : productName;

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity, transform: [{ translateY }] },
      ]}
      pointerEvents="none"
    >
      <View style={styles.iconCircle}>
        <Text style={styles.iconText}>✓</Text>
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.title}>Agregado al carrito</Text>
        <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
        {productPrice != null && productPrice > 0 ? (
          <Text style={styles.price}>{formatCurrency(productPrice)}</Text>
        ) : null}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#021735',
    borderWidth: 2,
    borderColor: '#03C0C3',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#03C0C3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#03C0C3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    color: '#021735',
    fontSize: 20,
    fontFamily: 'Montserrat-Bold_0',
    lineHeight: 22,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    color: '#03C0C3',
    fontSize: 12,
    fontFamily: 'Montserrat-Bold_0',
    marginBottom: 2,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Montserrat-Bold_0',
  },
  price: {
    color: '#B8E8EA',
    fontSize: 13,
    fontFamily: 'Montserrat-Bold_0',
    marginTop: 2,
  },
});
