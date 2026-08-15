import React, { useEffect, useRef, useState } from 'react';
import { View, StatusBar, SafeAreaView, ScrollView, TouchableOpacity, Text, Image, Dimensions, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useSalesStore } from '../stores/salesStore';
import { useSettingsStore } from '../stores/settingsStore';
import { BackButton, Loading } from '../components/base';
import { Resume, ConfirmButton } from '../components/sales';
import { TotalToPay, PaymentsMethods } from '../components/payment';
import { useThemeColors } from '../hooks/useThemeColors';
import { formatCurrency } from '../utils/format';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

const { width: screenWidth } = Dimensions.get('window');

const tertiaryColor = '#9d418d';
const whiteColor = '#FFFFFF';

type Props = NativeStackScreenProps<RootStackParamList, 'PaymentMethod'>;

export const PaymentMethodScreen: React.FC<Props> = ({ navigation, route }) => {
  const themeColors = useThemeColors();
  const scrollRef = useRef<ScrollView>(null);
  const client = useSalesStore(state => state.client);
  const getTotal = useSalesStore(state => state.getTotal);
  const setChangeSale = useSalesStore(state => state.setChangeSale);
  const selectClient = useSettingsStore(state => state.selectClient);
  
  const [showUI, setShowUI] = useState(!route.params?.autoExecute);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    setChangeSale(null);
  }, [setChangeSale]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardVisible(true);
      setKeyboardHeight(event.endCoordinates?.height ?? 0);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleAutoPaymentFailed = () => {
    setShowUI(true);
  };

  /** Scroll suave al input de efectivo sin ocultar el total (evita scrollToEnd agresivo). */
  const scrollToShowInputCentered = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: 280, animated: true });
    }, 80);
  };

  if (!showUI) {
    return (
      <View style={{ flex: 1, backgroundColor: themeColors.background }}>
        <StatusBar 
          barStyle={themeColors.background === '#FFFFFF' ? 'dark-content' : 'light-content'} 
          backgroundColor={themeColors.background} 
        />
        <Loading visible={true} message="Procesando pago..." />
        <View style={{ position: 'absolute', opacity: 0 }}>
          <PaymentsMethods 
            scrollToShowInputCentered={scrollToShowInputCentered}
            autoExecute={true}
            onAutoPaymentFailed={handleAutoPaymentFailed}
          />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: themeColors.background }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <View style={{ flex: 1, padding: 20 }}>
        <StatusBar 
          barStyle={themeColors.background === '#FFFFFF' ? 'dark-content' : 'light-content'} 
          backgroundColor={themeColors.background} 
        />
        <SafeAreaView />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#03C0C3' }}>MÉTODOS DE PAGO</Text>
        </View>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="on-drag"
          style={{ width: screenWidth, marginTop: 10, marginHorizontal: -20 }}
          contentContainerStyle={{
            paddingBottom: keyboardVisible ? keyboardHeight + 100 : 48,
            flexGrow: 1,
          }}
        >
          {/* Resume siempre muestra todos los detalles porque el documento ya fue seleccionado */}
          <Resume showMoreDetails={true} />
          {selectClient && (
            <View style={{ marginHorizontal: 20, marginTop: 20 }}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Clients')}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  padding: 15,
                  borderWidth: 2,
                  borderColor: '#d4186e',
                }}
              >
                {client?.rut ? (
                  <>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Image 
                        source={require('../../assets/icons_new/icono_usuario.png')} 
                        style={{ width: 30, height: 30, tintColor: '#d4186e', marginRight: 10 }} 
                        resizeMode="contain"
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#d4186e', fontWeight: 'bold', fontSize: 12 }}>{client.rut}</Text>
                        <Text style={{ color: '#d4186e', fontWeight: 'bold', fontSize: 14 }}>{(client as any).razon || client.name}</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={{ color: '#d4186e', fontSize: 14 }}>Cambiar cliente</Text>
                      <Image 
                        source={require('../../assets/icons/next.png')} 
                        style={{ width: 20, height: 20, tintColor: '#d4186e' }} 
                        resizeMode="contain"
                      />
                    </View>
                  </>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Image 
                        source={require('../../assets/icons_new/icono_usuario.png')} 
                        style={{ width: 30, height: 30, tintColor: '#d4186e', marginRight: 12 }} 
                        resizeMode="contain"
                      />
                      <Text style={{ color: '#d4186e', fontSize: 16, fontWeight: 'bold' }}>Seleccionar cliente</Text>
                    </View>
                    <Image 
                      source={require('../../assets/icons/next.png')} 
                      style={{ width: 20, height: 20, tintColor: '#d4186e' }} 
                      resizeMode="contain"
                    />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}
          <TotalToPay />
          <PaymentsMethods scrollToShowInputCentered={scrollToShowInputCentered} />
          <ConfirmButton />
        </ScrollView>
        {keyboardVisible ? (
          <View style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: keyboardHeight,
            backgroundColor: '#d4186e',
            paddingVertical: 10,
            paddingHorizontal: 20,
            alignItems: 'center',
            borderTopWidth: 2,
            borderTopColor: '#03C0C3',
            zIndex: 20,
            elevation: 20,
          }}>
            <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' }}>
              Total a pagar
            </Text>
            <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' }}>
              {formatCurrency(getTotal())}
            </Text>
          </View>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
};