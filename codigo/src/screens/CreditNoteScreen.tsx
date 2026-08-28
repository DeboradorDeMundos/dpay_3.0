import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, StatusBar, SafeAreaView, FlatList, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { BackButton, AppModal } from '../components/base';
import { formatCurrency } from '../utils/format';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useThemeColors } from '../hooks/useThemeColors';
import { useAuthStore } from '../stores/authStore';
import { useMySalesStore } from '../stores/mySalesStore';
import { useAlertStore } from '../stores/alertStore';
import { emitCreditNote, listarDocumentosDpay, obtenerDocumentoDpay, type DpayDocument, type DpayDocumentDetail } from '../services/api';
import type { Sale, SaleItem } from '../types/common';
import moment from 'moment';

type Props = NativeStackScreenProps<RootStackParamList, 'CreditNote'>;

interface NCItem extends SaleItem {
  selected: boolean;
  ncQuantity: number;
  customPrice?: number;
  cantidadDisponible: number; // Cantidad disponible considerando NCs previas
}

// Mapear nombre de documento DPay a código numérico
const getDocTypeIdFromDpayName = (typeName: string): number | undefined => {
  const typeMap: Record<string, number> = {
    'Boleta Electrónica': 39,
    'Boleta Exenta': 41,
    'Factura Electrónica': 33,
    'Factura Exenta': 34,
    'Nota de Crédito': 61,
    'Nota de Credito': 61,
    'Nota de Crédito Electrónica': 61,
  };
  return typeMap[typeName];
};

// Helper: Verificar si dos items coinciden por código y precio
const itemsMatch = (code1?: string, price1?: number, code2?: string, price2?: number): boolean => {
  // Comparar códigos (considerar undefined, null, o '0' como equivalentes)
  const normalizedCode1 = !code1 || code1 === '0' ? '' : code1;
  const normalizedCode2 = !code2 || code2 === '0' ? '' : code2;
  const codesMatch = normalizedCode1 === normalizedCode2;
  
  // Comparar precios con tolerancia de 1 peso para manejar redondeos
  const p1 = price1 || 0;
  const p2 = price2 || 0;
  const pricesMatch = Math.abs(p1 - p2) <= 1;
  
  return codesMatch && pricesMatch;
};

export const CreditNoteScreen: React.FC<Props> = ({ navigation, route }) => {
  const { originalSale } = route.params;
  const { isDark, ...themeColors } = useThemeColors();
  const user = useAuthStore((state) => state.user);
  const { showAlert } = useAlertStore();
  
  const [ncItems, setNcItems] = useState<NCItem[]>(
    originalSale.results.map(item => ({
      ...item,
      selected: false,
      ncQuantity: 0,
      customPrice: undefined,
      cantidadDisponible: item.count, // Inicialmente toda la cantidad disponible
    }))
  );
  
  const [discountCode, setDiscountCode] = useState('0');
  const [discountAmount, setDiscountAmount] = useState('');
  const [isEmitting, setIsEmitting] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [createdNcSaleId, setCreatedNcSaleId] = useState<string | null>(null);
  const [dpayDocuments, setDpayDocuments] = useState<DpayDocument[]>([]);
  const [dpayNCDetails, setDpayNCDetails] = useState<DpayDocumentDetail[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);

  // Cargar documentos DPay para verificar NC previas
  useEffect(() => {
    const loadDpayDocuments = async () => {
      if (!originalSale.folio || !user?.empresa?.rut) {
        setIsLoadingDocs(false);
        return;
      }

      try {
        setIsLoadingDocs(true);
        const docs = await listarDocumentosDpay({
          fecha_desde: moment().subtract(90, 'days').startOf('day').format('DD-MM-YYYY'),
          fecha_hasta: moment().endOf('day').format('DD-MM-YYYY'),
          rut_empresa: user.empresa.rut,
        });
        setDpayDocuments(docs);

        // Filtrar NCs del servidor que referencian este documento
        const folioStr = String(originalSale.folio);
        const serverNCs = docs.filter(doc =>
          String(doc.folio_documento_anulado) === folioStr &&
          getDocTypeIdFromDpayName(doc.tipo_documento) === 61
        );

        // Cargar detalle completo de cada NC del servidor
        const ncDetailsPromises = serverNCs.map(nc => 
          obtenerDocumentoDpay(nc.id_documento).catch(error => {
            console.error(`[CreditNoteScreen] Error cargando detalle NC ${nc.folio}:`, error);
            return null;
          })
        );
        
        const ncDetails = (await Promise.all(ncDetailsPromises)).filter(d => d !== null) as DpayDocumentDetail[];
        setDpayNCDetails(ncDetails);
        
      } catch (error) {
        console.error('[CreditNoteScreen] Error cargando documentos DPay:', error);
        setDpayDocuments([]);
        setDpayNCDetails([]);
      } finally {
        setIsLoadingDocs(false);
      }
    };

    loadDpayDocuments();
  }, [originalSale.folio, user?.empresa?.rut]);

  // Obtener NC locales no sincronizadas que referencian este documento
  const localSales = useMySalesStore((state) => state.sales);

  // Calcular cantidades devueltas por item (servidor + locales)
  const itemQuantitiesReturned = useMemo(() => {
    const returned: Record<string, number> = {};
    
    if (!originalSale.folio) return returned;

    const folioStr = String(originalSale.folio);
    const isExento = originalSale.documentType === 34 || originalSale.documentType === 41;

    // Procesar cada item del documento original
    originalSale.results.forEach(originalItem => {
      const key = `${originalItem.code || ''}_${originalItem.value}`;
      returned[key] = 0;

      // 1. Sumar cantidades de NCs del servidor
      dpayNCDetails.forEach(ncDetail => {
        ncDetail.detalle?.forEach(detItem => {
          // Convertir precio del servidor a precio bruto si es necesario
          const precioNeto = Number(detItem.precio_unitario) || 0;
          const precioBruto = isExento ? precioNeto : Math.round(precioNeto * 1.19);
          
          if (itemsMatch(originalItem.code, originalItem.value, detItem.cod_producto, precioBruto)) {
            returned[key] += Number(detItem.cantidad) || 0;
          }
        });
      });

      // 2. Sumar cantidades de NCs locales (excluir las que ya están en servidor)
      // Usar folios de NC del servidor convertidos a number para comparación
      const foliosNCServidor = new Set(dpayNCDetails.map(nc => Number(nc.folio)));
      localSales
        .filter(sale => {
          if ((sale.documentType as number) !== 61) return false;
          if (sale.referencia?.folioRef !== originalSale.folio) return false;
          if (!sale.folio) return false;
          
          // Excluir si ya está en el servidor
          const enServidor = foliosNCServidor.has(Number(sale.folio));
          return !enServidor;
        })
        .forEach(localNC => {
          localNC.results?.forEach(ncItem => {
            if (itemsMatch(originalItem.code, originalItem.value, ncItem.code, ncItem.value)) {
              returned[key] += ncItem.count || 0;
            }
          });
        });
    });

    return returned;
  }, [originalSale, dpayNCDetails, dpayDocuments, localSales]);

  // Actualizar cantidades disponibles cuando cambien las devoluciones
  useEffect(() => {
    setNcItems(prevItems => 
      prevItems.map(item => {
        const key = `${item.code || ''}_${item.value}`;
        const cantidadDevuelta = itemQuantitiesReturned[key] || 0;
        const cantidadDisponible = Math.max(0, item.count - cantidadDevuelta);
        
        return {
          ...item,
          cantidadDisponible,
          // Si la cantidad disponible es 0, deseleccionar el item
          selected: cantidadDisponible === 0 ? false : item.selected,
          ncQuantity: cantidadDisponible === 0 ? 0 : Math.min(item.ncQuantity, cantidadDisponible),
        };
      })
    );
  }, [itemQuantitiesReturned]);

  // Calcular monto ya anulado por NC previas (servidor + locales) y monto disponible
  const { montoYaAnulado, montoDisponible } = useMemo(() => {
    if (!originalSale.folio) {
      return { montoYaAnulado: 0, montoDisponible: originalSale.total };
    }

    const folioOriginal = Number(originalSale.folio);

    // 1. NC del servidor DPay que referencian este documento
    const ncDelServidor = dpayDocuments.filter(doc =>
      Number(doc.folio_documento_anulado) === folioOriginal &&
      getDocTypeIdFromDpayName(doc.tipo_documento) === 61
    );
    
    const totalServidorAnulado = ncDelServidor.reduce((sum, nc) => sum + (Number(nc.montototal) || 0), 0);

    // 2. NC locales no sincronizadas (no duplicar con las del servidor)
    // Crear Set con folios de NC del servidor (convertir a number para comparación)
    const foliosNCServidor = new Set(ncDelServidor.map(nc => Number(nc.folio)));
    
    const totalLocalAnulado = localSales
      .filter(sale => {
        if ((sale.documentType as number) !== 61) return false;
        if (sale.referencia?.folioRef !== originalSale.folio) return false;
        if (!sale.folio) return false;
        
        // Excluir si ya está en el servidor
        const enServidor = foliosNCServidor.has(Number(sale.folio));
        return !enServidor;
      })
      .reduce((sum, nc) => sum + (nc.total || 0), 0);

    const totalAnulado = totalServidorAnulado + totalLocalAnulado;
    const disponible = Math.max(0, originalSale.total - totalAnulado);

    return {
      montoYaAnulado: totalAnulado,
      montoDisponible: disponible,
    };
  }, [originalSale.folio, originalSale.total, dpayDocuments, localSales]);

  const getDocumentTypeName = (type?: number): string => {
    if (!type) return 'Documento';
    switch (type) {
      case 33: return 'Factura electrónica';
      case 34: return 'Factura exenta';
      case 39: return 'Boleta electrónica';
      case 41: return 'Boleta exenta';
      case 61: return 'Nota de crédito';
      default: return `Documento ${type}`;
    }
  };

  const toggleItemSelection = (index: number) => {
    setNcItems(prev => {
      const currentItem = prev[index];
      const newSelected = !currentItem.selected;
      
      // No permitir seleccionar si no hay cantidad disponible
      if (newSelected && currentItem.cantidadDisponible === 0) {
        return prev;
      }
      
      if (!newSelected) {
        // Si se está deseleccionando, limpiar customPrice
        return prev.map((item, i) => i === index ? {
          ...item,
          selected: false,
          ncQuantity: 0,
          customPrice: undefined,
        } : item);
      }
      
      // Si se está seleccionando, calcular monto disponible restante
      const otrosItemsTotal = prev.reduce((sum, item, i) => {
        if (i !== index && item.selected && item.ncQuantity > 0) {
          const price = item.customPrice !== undefined ? item.customPrice : item.value;
          return sum + (price * item.ncQuantity);
        }
        return sum;
      }, 0);
      
      const disponibleRestante = montoDisponible - otrosItemsTotal;
      const itemTotal = currentItem.value * currentItem.cantidadDisponible;
      
      let customPrice = undefined;
      // Si el total del item excede el disponible restante, ajustar al disponible total
      if (itemTotal > disponibleRestante) {
        customPrice = disponibleRestante;
      }
      
      return prev.map((item, i) => i === index ? {
        ...item,
        selected: true,
        ncQuantity: item.cantidadDisponible,
        customPrice,
      } : item);
    });
  };

  const updateNCQuantity = (index: number, quantity: number) => {
    setNcItems(prev => prev.map((item, i) => {
      if (i === index) {
        const validQuantity = Math.min(Math.max(0, quantity), item.cantidadDisponible);
        return {
          ...item,
          ncQuantity: validQuantity,
          selected: validQuantity > 0,
        };
      }
      return item;
    }));
  };
  const updateCustomPrice = (index: number, newPrice: string) => {
    setNcItems(prev => prev.map((item, i) => {
      if (i === index) {
        // Si el string está vacío, poner precio en 0
        if (newPrice.trim() === '') {
          return {
            ...item,
            customPrice: 0,
          };
        }
        
        const priceValue = parseFloat(newPrice);
        return {
          ...item,
          customPrice: !isNaN(priceValue) ? priceValue : item.customPrice,
        };
      }
      return item;
    }));
  };
  const ncTotals = useMemo(() => {
    let itemsTotal = ncItems.reduce((sum, item) => {
      if (item.selected && item.ncQuantity > 0) {
        // Usar customPrice si existe, sino usar value original
        const price = item.customPrice !== undefined ? item.customPrice : item.value;
        return sum + (price * item.ncQuantity);
      }
      return sum;
    }, 0);

    const discount = parseFloat(discountAmount) || 0;
    itemsTotal += discount;

    const isExento = originalSale.documentType === 34 || originalSale.documentType === 41;
    
    let neto = 0;
    let exento = 0;
    let iva = 0;
    
    if (isExento) {
      exento = itemsTotal;
    } else {
      neto = Math.round(itemsTotal / 1.19);
      iva = itemsTotal - neto;
    }

    return {
      subtotal: itemsTotal,
      neto,
      exento,
      iva,
      total: itemsTotal,
    };
  }, [ncItems, discountAmount, originalSale.documentType]);

  const isValidNC = useMemo(() => {
    if (isLoadingDocs) return false; // No permitir emitir mientras se verifican NC previas
    const hasSelectedItems = ncItems.some(item => item.selected && item.ncQuantity > 0);
    const hasDiscount = (parseFloat(discountAmount) || 0) > 0;
    const exceedsDisponible = ncTotals.total > montoDisponible;
    
    return (hasSelectedItems || hasDiscount) && !exceedsDisponible && montoDisponible > 0;
  }, [ncItems, discountAmount, ncTotals.total, montoDisponible, isLoadingDocs]);

  const handleEmitNC = async () => {
    if (!isValidNC) return;

    setIsEmitting(true);
    try {
      const customItems: SaleItem[] = [];
      
      ncItems.forEach(item => {
        if (item.selected && item.ncQuantity > 0) {
          // Usar customPrice si existe, sino usar value original
          const efectivePrice = item.customPrice !== undefined ? item.customPrice : item.value;
          customItems.push({
            id: item.id,
            productId: item.productId,
            code: item.code,
            name: item.name,
            count: item.ncQuantity,
            value: efectivePrice,
            total: efectivePrice * item.ncQuantity,
            ...(item.bodega ? { bodega: item.bodega } : {}),
            ...(item.nombreBodega ? { nombreBodega: item.nombreBodega } : {}),
          });
        }
      });

      const discount = parseFloat(discountAmount) || 0;
      if (discount > 0) {
        customItems.push({
          id: `discount-${Date.now()}`,
          code: discountCode || '0',
          name: `Descuento - ${discountCode || 'Código 0'}`,
          count: 1,
          value: discount,
          total: discount,
        });
      }

      const result = await emitCreditNote(originalSale, 'Corrección de monto', 3, customItems);

      const ncSale: Sale = {
        id: `nc-${result.folio || Date.now()}`,
        results: customItems,
        documentType: 61 as any,
        folio: result.folio,
        ted: result.ted,
        id_documento: result.id_documento,
        client: originalSale.client,
        paymentMethod: originalSale.paymentMethod,
        subtotal: ncTotals.subtotal,
        neto: ncTotals.neto,
        exento: ncTotals.exento,
        iva: ncTotals.iva,
        total: ncTotals.total,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        status: 'completed',
        syncStatus: 'synced',
        syncedAt: new Date().toISOString(),
        referencia: result.referencia,
        issuerUserId: user?.usuario,
        issuerCompany: user?.empresa?.rut,
      };

      useMySalesStore.getState().addSale(ncSale);
      setCreatedNcSaleId(ncSale.id);
      setSuccessMessage(`Nota de Crédito emitida correctamente.\nFolio: ${result.folio || 'N/A'}\nMonto: ${formatCurrency(ncTotals.total)}`);
      setSuccessModalVisible(true);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showAlert('Error', `No se pudo emitir la Nota de Crédito:\n${errorMessage}`);
    } finally {
      setIsEmitting(false);
    }
  };

  const renderItem = ({ item, index }: { item: NCItem; index: number }) => {
    const totalmenteDevuelto = item.cantidadDisponible === 0;
    const cantidadDevuelta = item.count - item.cantidadDisponible;
    
    return (
    <View
      style={{
        backgroundColor: totalmenteDevuelto ? '#F5F5F5' : (item.selected ? '#d4186e' : '#FFFFFF'),
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: totalmenteDevuelto ? '#CCCCCC' : '#d4186e',
      }}
    >
      <TouchableOpacity 
        onPress={() => toggleItemSelection(index)} 
        disabled={totalmenteDevuelto}
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
      >
        <View style={{
          width: 24,
          height: 24,
          borderRadius: 4,
          borderWidth: 2,
          borderColor: totalmenteDevuelto ? '#888' : (item.selected ? '#FFFFFF' : '#d4186e'),
          backgroundColor: totalmenteDevuelto ? '#CCCCCC' : (item.selected ? '#FFFFFF' : 'transparent'),
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}>
          {item.selected && !totalmenteDevuelto && <Text style={{ color: '#d4186e', fontSize: 16, fontWeight: 'bold' }}>✓</Text>}
          {totalmenteDevuelto && <Text style={{ color: '#555', fontSize: 16, fontWeight: 'bold' }}>✕</Text>}
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ 
            fontSize: 15, 
            fontWeight: '600', 
            color: totalmenteDevuelto ? '#555' : (item.selected ? '#FFFFFF' : '#d4186e'),
            textDecorationLine: totalmenteDevuelto ? 'line-through' : 'none'
          }} numberOfLines={2}>{item.name}</Text>
          <Text style={{ fontSize: 13, color: totalmenteDevuelto ? '#666' : (item.selected ? '#FFFFFF' : '#d4186e'), marginTop: 2, opacity: totalmenteDevuelto ? 1 : 0.9 }}>
            {formatCurrency(item.value)} c/u
          </Text>
        </View>
      </TouchableOpacity>

      <View style={{ paddingLeft: 36, marginTop: 4 }}>
        <Text style={{ fontSize: 13, color: totalmenteDevuelto ? '#666' : (item.selected ? '#FFFFFF' : '#d4186e'), opacity: totalmenteDevuelto ? 1 : 0.85, marginBottom: 4 }}>
          Original: {item.count}
        </Text>
        
        {cantidadDevuelta > 0 && (
          <Text style={{ fontSize: 12, color: totalmenteDevuelto ? '#666' : (item.selected ? '#FFFFFF' : '#d4186e'), opacity: totalmenteDevuelto ? 1 : 0.75, marginBottom: 4 }}>
            Ya devuelto: {cantidadDevuelta}
          </Text>
        )}
        
        <Text style={{ fontSize: 13, color: totalmenteDevuelto ? '#555' : (item.selected ? '#FFFFFF' : '#d4186e'), opacity: totalmenteDevuelto ? 1 : 0.85, marginBottom: 8, fontWeight: '600' }}>
          Disponible: {item.cantidadDisponible}
        </Text>
        
        {!totalmenteDevuelto && (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 13, color: item.selected ? '#FFFFFF' : '#d4186e', opacity: 0.85, marginRight: 8 }}>Devolver:</Text>
          
          <TouchableOpacity onPress={() => updateNCQuantity(index, item.ncQuantity - 1)} disabled={item.ncQuantity === 0} style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: item.ncQuantity === 0 ? (item.selected ? 'rgba(255,255,255,0.3)' : '#E0E0E0') : (item.selected ? '#FFFFFF' : '#d4186e'),
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Text style={{ color: item.ncQuantity === 0 ? (item.selected ? '#FFFFFF' : '#999') : (item.selected ? '#d4186e' : '#FFFFFF'), fontSize: 18, fontWeight: 'bold' }}>-</Text>
          </TouchableOpacity>

          <View style={{
            width: 60,
            height: 36,
            borderWidth: 1,
            borderColor: item.selected ? '#FFFFFF' : '#CCC',
            borderRadius: 8,
            marginHorizontal: 8,
            backgroundColor: item.selected ? 'rgba(255,255,255,0.2)' : '#FFFFFF',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <TextInput
              value={item.ncQuantity.toString()}
              onChangeText={(text: string) => {
                const num = parseInt(text) || 0;
                updateNCQuantity(index, num);
              }}
              keyboardType="numeric"
              maxLength={4}
              style={{
                width: '100%',
                height: '100%',
                textAlign: 'center',
                color: item.selected ? '#FFFFFF' : '#333333',
                fontSize: 16,
                fontWeight: '700',
                paddingVertical: 0,
              }}
            />
          </View>

          <TouchableOpacity 
            onPress={() => updateNCQuantity(index, item.ncQuantity + 1)} 
            disabled={item.ncQuantity >= item.cantidadDisponible} 
            style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: item.ncQuantity >= item.cantidadDisponible ? (item.selected ? 'rgba(255,255,255,0.3)' : '#E0E0E0') : (item.selected ? '#FFFFFF' : '#d4186e'),
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Text style={{ 
              color: item.ncQuantity >= item.cantidadDisponible ? (item.selected ? '#FFFFFF' : '#999') : (item.selected ? '#d4186e' : '#FFFFFF'), 
              fontSize: 18, 
              fontWeight: 'bold' 
            }}>+</Text>
          </TouchableOpacity>
        </View>
        )}
      </View>

      {item.selected && item.ncQuantity > 0 && (
        <View style={{
          marginTop: 8,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.3)',
          paddingLeft: 36,
        }}>
          {/* Input para editar precio unitario */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 13, color: '#FFFFFF', opacity: 0.85, marginRight: 8 }}>Precio c/u:</Text>
            <View style={{
              flex: 1,
              height: 36,
              borderWidth: 1,
              borderColor: '#FFFFFF',
              borderRadius: 8,
              backgroundColor: 'rgba(255,255,255,0.2)',
              justifyContent: 'center',
              paddingHorizontal: 8,
            }}>
              <TextInput
                value={(item.customPrice !== undefined ? item.customPrice : item.value).toString()}
                onChangeText={(text: string) => updateCustomPrice(index, text)}
                keyboardType="numeric"
                style={{
                  color: '#FFFFFF',
                  fontSize: 14,
                  fontWeight: '600',
                  textAlign: 'right',
                  padding: 0,
                }}
                placeholder={item.value.toString()}
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
            </View>
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#FFFFFF', opacity: 0.7 }}>
              Original: {formatCurrency(item.value)} c/u
            </Text>
            <Text style={{ fontSize: 15, color: '#FFFFFF', fontWeight: '700' }}>
              Subtotal: {formatCurrency((item.customPrice !== undefined ? item.customPrice : item.value) * item.ncQuantity)}
            </Text>
          </View>
        </View>
      )}
    </View>
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1, backgroundColor: themeColors.background }}>
        <StatusBar barStyle={themeColors.background === '#FFFFFF' ? 'dark-content' : 'light-content'} backgroundColor={themeColors.background} />
        <SafeAreaView />

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#03C0C3' }}>CORRECCIÓN DE MONTO</Text>
        </View>

        <FlatList
          data={ncItems}
          renderItem={renderItem}
          keyExtractor={(item: NCItem) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16 }}
          ListHeaderComponent={
            <View>
              <View style={{
                backgroundColor: 'transparent',
                borderRadius: 12,
                padding: 16,
                marginBottom: 20,
                borderWidth: 2,
                borderColor: '#d4186e',
              }}>
                <Text style={{ fontSize: 14, color: '#d4186e', marginBottom: 8, fontWeight: '600' }}>Documento original</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: isDark ? '#FFFFFF' : '#d4186e' }}>{getDocumentTypeName(originalSale.documentType)}</Text>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: isDark ? '#FFFFFF' : '#d4186e' }}>#{originalSale.folio}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 14, color: isDark ? '#CCC' : '#666' }}>Total original:</Text>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: isDark ? '#FFFFFF' : '#333333' }}>{formatCurrency(originalSale.total)}</Text>
                </View>
                {montoYaAnulado > 0 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 14, color: '#FFD700' }}>Ya anulado:</Text>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFD700' }}>-{formatCurrency(montoYaAnulado)}</Text>
                  </View>
                )}
                <View style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between', 
                  marginTop: montoYaAnulado > 0 ? 8 : 0,
                  paddingTop: montoYaAnulado > 0 ? 8 : 0,
                  borderTopWidth: montoYaAnulado > 0 ? 1 : 0,
                  borderTopColor: isDark ? '#444' : '#E0E0E0'
                }}>
                  <Text style={{ fontSize: 14, color: '#03C0C3', fontWeight: 'bold' }}>Disponible para NC:</Text>
                  <Text style={{ fontSize: 17, fontWeight: 'bold', color: '#03C0C3' }}>{formatCurrency(montoDisponible)}</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#03C0C3' }}>Productos a devolver:</Text>
                <Text style={{ fontSize: 14, color: '#03C0C3' }}>
                  {ncItems.filter(i => i.selected && i.ncQuantity > 0).length} de {ncItems.length}
                </Text>
              </View>
            </View>
          }
          ListFooterComponent={
            <View>
              <View style={{
                backgroundColor: 'transparent',
                borderRadius: 12,
                padding: 16,
                marginTop: 8,
                marginBottom: 20,
                borderWidth: 2,
                borderColor: '#03C0C3',
              }}>
                <Text style={{ fontSize: 15, fontWeight: 'bold', color: 'rgba(255, 255, 255, 0.92)', marginBottom: 4 }}>
                  Agregar descuento
                </Text>
                <Text style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.92)', marginBottom: 12, opacity: 0.8 }}>
                  (Código 0 - No editable)
                </Text>
                
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, color: themeColors.textSecondary, marginBottom: 4, opacity: 0.6 }}>Código:</Text>
                    <TextInput
                      value={discountCode}
                      editable={false}
                      placeholder="0"
                      placeholderTextColor={themeColors.textSecondary}
                      style={{
                        height: 44,
                        borderWidth: 1,
                        borderColor: '#03C0C3',
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        color: themeColors.text,
                        fontSize: 15,
                        backgroundColor: 'rgba(3, 192, 195, 0.2)',
                        opacity: 0.7,
                      }}
                    />
                  </View>

                  <View style={{ flex: 2 }}>
                    <Text style={{ fontSize: 13, color: themeColors.textSecondary, marginBottom: 4, opacity: 0.6 }}>Monto:</Text>
                    <TextInput
                      value={discountAmount}
                      onChangeText={setDiscountAmount}
                      placeholder="0"
                      placeholderTextColor={themeColors.textSecondary}
                      keyboardType="numeric"
                      style={{
                        height: 44,
                        borderWidth: 1,
                        borderColor: '#03C0C3',
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        color: themeColors.text,
                        fontSize: 15,
                        backgroundColor: 'rgba(3, 192, 195, 0.2)',
                      }}
                    />
                  </View>
                </View>
              </View>

              <View style={{
                backgroundColor: isDark ? '#FFFFFF' : '#052CCE',
                paddingVertical: 12,
                paddingHorizontal: 35,
                marginBottom: 20,
                marginHorizontal: -16,
              }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16, color: isDark ? '#052CCE' : '#FFFFFF', marginBottom: 4 }}>Resumen nota de crédito</Text>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 }}>
                  <Text style={{ fontSize: 13, color: isDark ? '#052CCE' : '#FFFFFF' }}>Neto:</Text>
                  <Text style={{ fontSize: 13, color: isDark ? '#052CCE' : '#FFFFFF' }}>{formatCurrency(ncTotals.neto)}</Text>
                </View>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 }}>
                  <Text style={{ fontSize: 13, color: isDark ? '#052CCE' : '#FFFFFF' }}>Exento:</Text>
                  <Text style={{ fontSize: 13, color: isDark ? '#052CCE' : '#FFFFFF' }}>{formatCurrency(ncTotals.exento)}</Text>
                </View>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 }}>
                  <Text style={{ fontSize: 13, color: isDark ? '#052CCE' : '#FFFFFF' }}>IVA:</Text>
                  <Text style={{ fontSize: 13, color: isDark ? '#052CCE' : '#FFFFFF' }}>{formatCurrency(ncTotals.iva)}</Text>
                </View>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 }}>
                  <Text style={{ fontSize: 13, color: isDark ? '#052CCE' : '#FFFFFF' }}>Total NC:</Text>
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: isDark ? '#052CCE' : '#FFFFFF' }}>{formatCurrency(ncTotals.total)}</Text>
                </View>
              </View>

              {ncTotals.total > montoDisponible && (
                <View style={{ marginBottom: 20, padding: 8, backgroundColor: '#FFE6E6', borderRadius: 8 }}>
                  <Text style={{ fontSize: 12, color: '#D32F2F', textAlign: 'center', fontWeight: 'bold' }}>
                    ⚠️ La NC excede el monto disponible
                  </Text>
                  <Text style={{ fontSize: 11, color: '#D32F2F', textAlign: 'center', marginTop: 4 }}>
                    Disponible: {formatCurrency(montoDisponible)} | NC: {formatCurrency(ncTotals.total)}
                  </Text>
                </View>
              )}
              {montoDisponible <= 0 && (
                <View style={{ marginBottom: 20, padding: 8, backgroundColor: '#FFE6E6', borderRadius: 8 }}>
                  <Text style={{ fontSize: 12, color: '#D32F2F', textAlign: 'center', fontWeight: 'bold' }}>
                    ⚠️ Documento totalmente anulado
                  </Text>
                  <Text style={{ fontSize: 11, color: '#D32F2F', textAlign: 'center', marginTop: 4 }}>
                    No se pueden crear más NC para este documento
                  </Text>
                </View>
              )}

              <TouchableOpacity
                onPress={handleEmitNC}
                disabled={!isValidNC || isEmitting}
                style={{
                  backgroundColor: isValidNC && !isEmitting ? '#00bdce' : (isDark ? '#333' : '#CCC'),
                  borderRadius: 25,
                  padding: 16,
                  alignItems: 'center',
                  marginBottom: 40,
                }}
              >
                {isEmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>Emitir nota de crédito</Text>
                )}
              </TouchableOpacity>
            </View>
          }
        />

        {/* Modal de carga inicial */}
        {isLoadingDocs && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}>
            <View style={{
              backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
              borderRadius: 16,
              padding: 32,
              alignItems: 'center',
              minWidth: 200,
            }}>
              <ActivityIndicator size="large" color="#03C0C3" />
              <Text style={{ 
                fontSize: 16, 
                color: '#03C0C3', 
                marginTop: 16, 
                fontWeight: '600',
                textAlign: 'center'
              }}>
                Verificando NC previas...
              </Text>
              <Text style={{ 
                fontSize: 13, 
                color: isDark ? '#CCC' : '#666', 
                marginTop: 8,
                textAlign: 'center'
              }}>
                Por favor espere
              </Text>
            </View>
          </View>
        )}

        <AppModal
          visible={successModalVisible}
          title=""
          onClose={() => {
            setSuccessModalVisible(false);
            const id = createdNcSaleId;
            setCreatedNcSaleId(null);
            if (id) {
              navigation.replace('ViewInvoice', { saleId: id, showNewSaleButton: true });
            } else {
              navigation.goBack();
            }
          }}
        >
          <View style={{ alignItems: 'center', padding: 20 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>✅</Text>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#00bdce', textAlign: 'center', marginBottom: 12 }}>¡Éxito!</Text>
            <Text style={{ fontSize: 15, color: themeColors.text, textAlign: 'center', lineHeight: 22 }}>{successMessage}</Text>
            
            <TouchableOpacity
              onPress={() => {
                setSuccessModalVisible(false);
                const id = createdNcSaleId;
                setCreatedNcSaleId(null);
                if (id) {
                  navigation.replace('ViewInvoice', { saleId: id, showNewSaleButton: true });
                } else {
                  navigation.goBack();
                }
              }}
              style={{ backgroundColor: '#00bdce', borderRadius: 25, paddingVertical: 12, paddingHorizontal: 40, marginTop: 20 }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </AppModal>
      </View>
    </KeyboardAvoidingView>
  );
};
