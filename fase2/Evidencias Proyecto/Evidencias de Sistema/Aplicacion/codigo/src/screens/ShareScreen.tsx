import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useShare } from '../hooks/useShare';
import { useThemeColors } from '../hooks/useThemeColors';
import globalStyles from '../styles/globalStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'Share'>;

export const ShareScreen: React.FC<Props> = ({ navigation, route }) => {
  const { invoiceData, settings, barcodeImage } = route.params;
  const themeColors = useThemeColors();
  const { phone, setPhone, email, setEmail, isLoading, onShare } = useShare(
    invoiceData,
    settings,
    barcodeImage
  );

  return (
    <SafeAreaView style={[globalStyles.flex1, { backgroundColor: themeColors.background }]}>
      <StatusBar
        barStyle={themeColors.background === '#FFFFFF' ? 'dark-content' : 'light-content'}
        backgroundColor={themeColors.background}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={globalStyles.flex1}
      >
        <ScrollView style={[globalStyles.flex1, globalStyles.paddingHorizontal20]}>
          {/* Header */}
          <View style={[globalStyles.row, globalStyles.verticalCenter, globalStyles.marginTop20]}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ padding: 10, marginLeft: -10 }}
            >
              <Image
                source={require('../../assets/icons/prev.png')}
                style={{ width: 24, height: 24, tintColor: '#d4186e' }}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <Text
              style={[
                globalStyles.textBold,
                globalStyles.fontSizeLG,
                { color: themeColors.text, marginLeft: 10 },
              ]}
            >
              Compartir Documento
            </Text>
          </View>

          {/* Información del Documento */}
          <View
            style={[
              globalStyles.marginTop30,
              globalStyles.padding15,
              {
                backgroundColor: themeColors.white,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: themeColors.border,
              },
            ]}
          >
            <Text style={[globalStyles.textBold, { color: themeColors.text, fontSize: 16 }]}>
              {invoiceData.documentType.name}
            </Text>
            <Text style={[globalStyles.marginTop5, { color: themeColors.secondary, fontSize: 14 }]}>
              Folio N° {invoiceData.folio}
            </Text>
            <Text style={[globalStyles.marginTop5, { color: themeColors.secondary, fontSize: 14 }]}>
              Total: ${invoiceData.total.toLocaleString('es-CL')}
            </Text>
          </View>

          {/* WhatsApp Section */}
          <View style={globalStyles.marginTop30}>
            <Text
              style={[
                globalStyles.textBold,
                globalStyles.marginBottom10,
                { color: themeColors.text, fontSize: 15 },
              ]}
            >
              Compartir por WhatsApp
            </Text>

            <View style={globalStyles.row}>
              {/* Prefix +56 */}
              <View
                style={[
                  {
                    backgroundColor: themeColors.white,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: themeColors.border,
                    paddingHorizontal: 15,
                    paddingVertical: 14,
                    marginRight: 10,
                  },
                ]}
              >
                <Text style={[globalStyles.textBold, { color: themeColors.secondary, fontSize: 15 }]}>
                  +56
                </Text>
              </View>

              {/* Input Phone */}
              <TextInput
                style={[
                  globalStyles.flex1,
                  {
                    backgroundColor: themeColors.white,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: themeColors.border,
                    paddingHorizontal: 15,
                    paddingVertical: 14,
                    color: themeColors.text,
                    fontSize: 15,
                    marginRight: 10,
                  },
                ]}
                placeholder="9xxxxxxxx"
                placeholderTextColor={themeColors.textTertiary}
                keyboardType="numeric"
                maxLength={9}
                value={phone}
                onChangeText={setPhone}
                editable={!isLoading}
              />

              {/* WhatsApp Button */}
              <TouchableOpacity
                onPress={() => onShare('whatsapp')}
                disabled={isLoading}
                style={[
                  globalStyles.fullCenter,
                  {
                    backgroundColor: '#25D366',
                    borderRadius: 12,
                    width: 56,
                    height: 56,
                    opacity: isLoading ? 0.6 : 1,
                  },
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Image
                    source={require('../../assets/icons/whatsapp.png')}
                    style={{ width: 28, height: 28, tintColor: '#fff' }}
                    resizeMode="contain"
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Email Section */}
          <View style={globalStyles.marginTop30}>
            <Text
              style={[
                globalStyles.textBold,
                globalStyles.marginBottom10,
                { color: themeColors.text, fontSize: 15 },
              ]}
            >
              Compartir por Email
            </Text>

            <View style={globalStyles.row}>
              {/* Input Email */}
              <TextInput
                style={[
                  globalStyles.flex1,
                  {
                    backgroundColor: themeColors.white,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: themeColors.border,
                    paddingHorizontal: 15,
                    paddingVertical: 14,
                    color: themeColors.text,
                    fontSize: 15,
                    marginRight: 10,
                  },
                ]}
                placeholder="usuario@mail.com"
                placeholderTextColor={themeColors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                editable={!isLoading}
              />

              {/* Email Button */}
              <TouchableOpacity
                onPress={() => onShare('email')}
                disabled={isLoading}
                style={[
                  globalStyles.fullCenter,
                  {
                    backgroundColor: '#0078D4',
                    borderRadius: 12,
                    width: 56,
                    height: 56,
                    opacity: isLoading ? 0.6 : 1,
                  },
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Image
                    source={require('../../assets/icons/email.png')}
                    style={{ width: 28, height: 28, tintColor: '#fff' }}
                    resizeMode="contain"
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Instrucciones */}
          <View style={[globalStyles.marginTop30, globalStyles.marginBottom30]}>
            <Text style={[{ color: themeColors.secondary, fontSize: 13, lineHeight: 20 }]}>
              💡 El documento se generará en formato PDF y se compartirá a través de la aplicación
              seleccionada.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
