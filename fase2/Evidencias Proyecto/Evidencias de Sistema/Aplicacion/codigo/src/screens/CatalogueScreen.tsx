import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, TouchableOpacity, StatusBar, SafeAreaView, FlatList, StyleSheet, Image, Animated, Alert } from 'react-native';

const IMG_CARRITO = require('../../assets/icons_new/carrito_rosa.png');
const IMG_CAJA    = require('../../assets/icons_new2/caja-01.png');
const IMG_RELOAD  = require('../../assets/icons/reload.png');
const IMG_LOADING = require('../../assets/logos/logo_dpay_cargando.gif');
import { useSalesStore } from '../stores/salesStore';
import { useCatalogueStore } from '../stores/catalogueStore';
import { useAuthStore } from '../stores/authStore';
import { useAlertStore } from '../stores/alertStore';
import { SearchInput, EmptyState, BackButton, AppModal } from '../components/base';
import { formatCurrency } from '../utils/format';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useThemeColors } from '../hooks/useThemeColors';
import { getProductCatalogue } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Catalogue'>;

export const CatalogueScreen: React.FC<Props> = ({ navigation }) => {
  const themeColors = useThemeColors();
  const { addItem } = useSalesStore();
  const { products: storeProducts, setProducts: setStoreProducts } = useCatalogueStore();
  const { logout } = useAuthStore();
  const { showAlert } = useAlertStore();

  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [localProducts, setLocalProducts] = useState<any[]>(storeProducts);
  const [showStockModal, setShowStockModal] = useState(false);
  
  // Usar ref para evitar re-renders al trackear doble-tap
  const lastAddedRef = useRef<{ key: string; time: number } | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadCatalogue();
    }, [])
  );

  useEffect(() => {
    // Actualizar productos locales cuando cambia el store
    setLocalProducts(storeProducts);
  }, [storeProducts]);

  const loadCatalogue = async () => {
    setLoading(true);
    try {
      const catalogueData = await getProductCatalogue();
      console.log('[Catalogue] Productos cargados:', catalogueData.length);
      // Guardar directamente como vienen de la API
      setStoreProducts(catalogueData as any);
      setLocalProducts(catalogueData as any);
    } catch (error: any) {
      console.error('[Catalogue] Error cargando productos:', error);

      // Verificar si es un error 401 (no autorizado)
      const errorMessage = error?.message || '';
      const is401Error = errorMessage.includes('401') || errorMessage.includes('Unauthorized');

      if (is401Error) {
        showAlert(
          'Sesión expirada',
          'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Iniciar sesión',
              onPress: () => {
                // Cerrar sesión, el RootNavigator manejará la navegación automáticamente
                logout();
              }
            }
          ]
        );
      } else {
        showAlert('Error', 'No se pudo cargar el catálogo. Intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  // Filtrar productos localmente por nombre (proyecto anterior usa 'nombre')
  // Optimizado con useMemo para no recalcular en cada render
  const filteredProducts = useMemo(() => {
    if (!searchText.trim()) return localProducts;
    
    const query = searchText.toLowerCase().trim();
    return localProducts.filter((product: any) => {
      const nombre = product.nombre || product.name || '';
      const codigo = product.codigo || product.code || '';
      const descripcion = product.descripcion || product.description || '';
      return (
        nombre.toLowerCase().includes(query) ||
        codigo.toLowerCase().includes(query) ||
        descripcion.toLowerCase().includes(query)
      );
    });
  }, [localProducts, searchText]);

  const handleSelectProduct = useCallback((product: any, uiKey: string) => {
    // Evitar doble tap - si se agregó hace menos de 500ms, ignorar
    const now = Date.now();
    if (lastAddedRef.current && 
        lastAddedRef.current.key === uiKey && 
        now - lastAddedRef.current.time < 500) {
      return;
    }

    // Verificar stock si es inventariable
    const esInventariable = product.inventariable !== undefined
      ? (String(product.inventariable) === 'true' || String(product.inventariable) === '1' || product.inventariable === true)
      : true;

    if (esInventariable) {
      // Buscamos 'cantidad' (API PHP) o 'stock' (Legado)
      const rawStock = product.cantidad !== undefined && product.cantidad !== null ? product.cantidad : product.stock;
      let stock = 0;

      if (rawStock !== undefined && rawStock !== null && rawStock !== '') {
        const parsed = typeof rawStock === 'string' ? parseFloat(rawStock) : rawStock;
        stock = Math.floor(parsed);
      }

      // Si es inventariable y no hay stock, mostrar alerta y salir
      if (stock <= 0) {
        setShowStockModal(true);
        return;
      }
    }

    const precioRaw = product.precio || product.price || 0;
    const precio = typeof precioRaw === 'string' ? parseFloat(precioRaw) || 0 : precioRaw;
    const nombre = product.nombre || product.name || '';
    const codigo = product.codigo || product.code || '';
    // Usar id_bodega (como string) como código de bodega para la emisión.
    // DTemite requiere el código/ID de bodega, no el nombre ('CENTRAL', 'NORTE', etc.)
    const bodegaId = product.id_bodega != null ? String(product.id_bodega) : '';
    const nombreBodega = product.nombre_bodega || '';

    // Agregar inmediatamente sin bloquear
    addItem({
      code: codigo,
      name: nombre,
      value: precio,
      count: 1,
      total: precio,
      ...(bodegaId ? { bodega: bodegaId, nombreBodega } : {}),
    });

    // Marcar como agregado para evitar doble-tap
    lastAddedRef.current = { key: uiKey, time: now };

    // Navegar inmediatamente de vuelta
    navigation.goBack();
  }, [addItem, navigation]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.isDark ? '#021735' : themeColors.background }}>
      <StatusBar barStyle={themeColors.background === '#FFFFFF' ? 'dark-content' : 'light-content'} />

      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, justifyContent: 'space-between' }}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={{
          fontSize: 20,
          fontWeight: 'bold',
          color: '#03C0C3',
          flex: 1,
          textAlign: 'right',
          marginRight: 16
        }}>
          CATÁLOGO DE PRODUCTOS
        </Text>
      </View>

      <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <SearchInput
              placeholder="Buscar por código o nombre..."
              value={searchText}
              onChangeText={handleSearch}
            />
          </View>
          <TouchableOpacity
            onPress={loadCatalogue}
            disabled={loading}
            style={{
              backgroundColor: '#03C0C3',
              width: 50,
              height: 50,
              borderRadius: 8,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            activeOpacity={0.7}
          >
            <Image
              source={IMG_RELOAD}
              style={{ width: 24, height: 24, tintColor: '#FFFFFF' }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Image
            source={IMG_LOADING}
            style={{ width: 140, height: 140 }}
            resizeMode="contain"
          />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Ícono de fondo del carrito (solo en modo oscuro) */}
          {themeColors.background === '#111111' && filteredProducts.length === 0 && (
            <View style={styles.backgroundIcon}>
              <Text style={styles.cartIcon}>🛒</Text>
            </View>
          )}
          <FlatList
            data={filteredProducts}
            keyExtractor={(item, index) => `${item.id || item.codigo || 'prod'}-${index}`}
            contentContainerStyle={{ padding: 16 }}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={5}
            initialNumToRender={8}
            updateCellsBatchingPeriod={30}
            renderItem={({ item, index }) => {
              const productId = item.id || item.codigo || item.code || '';
              // Crear key única para UI combinando ID + índice para diferenciar items repetidos (mismo producto en distinta bodega)
              const uiKey = `${productId}_${index}`;
              const codigo = item.codigo || item.code || '';
              const nombre = item.nombre || item.name || '';
              const descripcion = item.descripcion || item.description || '';
              const precioRaw = item.precio || item.price || 0;
              const precio = typeof precioRaw === 'string' ? parseFloat(precioRaw) || 0 : precioRaw;
              // Stock puede venir como número, string, null o undefined
              // Lógica para stock/cantidad desde la API PHP
              // La API devuelve 'cantidad' y 'inventariable'
              const esInventariable = item.inventariable !== undefined
                ? (String(item.inventariable) === 'true' || String(item.inventariable) === '1' || item.inventariable === true)
                : true;

              let stock: number | null = null;

              if (esInventariable) {
                // Buscamos 'cantidad' (API PHP) o 'stock' (Legado)
                const rawStock = item.cantidad !== undefined && item.cantidad !== null ? item.cantidad : item.stock;

                if (rawStock !== undefined && rawStock !== null && rawStock !== '') {
                  const parsed = typeof rawStock === 'string' ? parseFloat(rawStock) : rawStock;
                  stock = Math.floor(parsed);
                } else {
                  // Si es inventariable pero no hay dato, asumimos 0
                  stock = 0;
                }
              }
              // Si no es inventariable, stock es null (renderiza como ∞)

              return (
                <TouchableOpacity
                  style={[
                    styles.card,
                    {
                      backgroundColor: '#FFFFFF',
                      padding: 16,
                      paddingVertical: 18
                    }
                  ]}
                  onPress={() => handleSelectProduct(item, uiKey)}
                  activeOpacity={0.6}
                >

                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {/* Columna Izquierda: Imagen del producto o icono genérico */}
                    <View style={{ marginRight: 12 }}>
                      {(item.imagenes?.[0]?.path || item.imagen) ? (
                        <Image
                          source={{ uri: item.imagenes?.[0]?.path || item.imagen }}
                          style={{ width: 48, height: 48, borderRadius: 6 }}
                          resizeMode="cover"
                        />
                      ) : (
                        <Image
                          source={IMG_CARRITO}
                          style={{ width: 35, height: 35, tintColor: '#d4186e' }}
                          resizeMode="contain"
                        />
                      )}
                    </View>

                    {/* Columna Central: Información */}
                    <View style={{ flex: 1, justifyContent: 'center', paddingRight: 4 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: 'bold',
                          color: '#d4186e',
                          marginBottom: 1,
                          textTransform: 'uppercase'
                        }}
                        numberOfLines={2}
                      >
                        {nombre}
                      </Text>

                      <Text style={{
                        fontSize: 11,
                        color: '#d4186e',
                        opacity: 0.8
                      }}>
                        {codigo}
                      </Text>

                      {descripcion ? (
                        <Text style={{
                          fontSize: 11,
                          fontWeight: 'bold',
                          color: '#d4186e',
                          marginTop: 1
                        }} numberOfLines={1}>
                          {descripcion.toLowerCase()}
                        </Text>
                      ) : null}
                    </View>

                    {/* Columna Derecha: Precio y Stock */}
                    <View style={{ alignItems: 'flex-end', justifyContent: 'center', gap: 8 }}>
                      <Text style={{
                        fontSize: 18,
                        fontWeight: 'bold',
                        color: '#d4186e'
                      }}>
                        {formatCurrency(precio)}
                      </Text>

                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: 'transparent',
                        paddingHorizontal: 8,
                        paddingVertical: 5,
                        borderRadius: 6,
                        borderWidth: 1.5,
                        borderColor: '#d4186e',
                        minWidth: 80,
                        justifyContent: 'center'
                      }}>
                        <Image
                          source={IMG_CAJA}
                          style={{
                            width: 16,
                            height: 16,
                            tintColor: '#d4186e'
                          }}
                          resizeMode="contain"
                        />
                        <Text style={{
                          fontSize: 14,
                          fontWeight: 'bold',
                          marginHorizontal: 4,
                          color: '#d4186e'
                        }}>
                          |
                        </Text>
                        <Text style={{
                          fontSize: 15,
                          fontWeight: 'bold',
                          color: '#d4186e'
                        }}>
                          {stock !== null ? stock : '∞'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <EmptyState
                icon="📦"
                title="Sin productos"
                message={searchText ? 'No se encontraron productos' : 'No hay productos disponibles'}
              />
            }
          />
        </View>
      )}


      <AppModal
        visible={showStockModal}
        title="Sin Stock"
        message="No hay unidades disponibles de este producto."
        buttons={[
          { text: 'OK', onPress: () => setShowStockModal(false), variant: 'primary' }
        ]}
        onClose={() => setShowStockModal(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#d4186e',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  productInfo: {
    flex: 1,
  },
  code: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 16,
    marginTop: 4,
  },
  description: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 4,
  },
  woocommerce: {
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
  },
  priceStockColumn: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 2,
  },
  stockIcon: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  stockSeparator: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 6,
  },
  stockValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  addedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  addedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  backgroundIcon: {
    position: 'absolute',
    top: '35%',
    left: '50%',
    transform: [{ translateX: -75 }, { translateY: -75 }],
    opacity: 0.08,
    zIndex: 0,
  },
  cartIcon: {
    fontSize: 150,
    color: '#808080',
  },
});
