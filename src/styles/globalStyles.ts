import { StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

// Colores originales del proyecto antiguo
export const colors = {
  primary: '#75bebf',
  secondary: '#213d8b',
  tertiary: '#d4186e',
  white: '#FFFFFF',
  black: '#111111',
  silverChalice: '#9f9f9f',
  silver: '#cccccc',
  mercury: '#e3e3e3',
  alabaster: '#f7f7f7',
  warning: '#ffdba2',
  wapp: '#128c7e',
  email: '#6fcbf2',
};

export default StyleSheet.create({
  // Opacity
  opacity0: {
    opacity: 0,
  },
  opacity03: {
    opacity: 0.3,
  },
  opacity1: {
    opacity: 1,
  },

  // Heights
  h100: {
    height: '100%',
  },

  // Images
  image: {
    width: 190,
    height: 150,
    marginBottom: 40,
  },

  // Alignment
  fullCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  verticalCenter: {
    alignItems: 'center',
  },
  alignContentCenter: {
    alignContent: 'center',
  },
  alignSelfCenter: {
    alignSelf: 'center',
  },
  alignSelfEnd: {
    alignSelf: 'flex-end',
  },
  justifyContentCenter: {
    justifyContent: 'center',
  },

  // Buttons
  menuBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    borderRadius: 15,
  },
  normalBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 15,
  },
  btnRounded: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
  },
  btnRoundedCalc: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 15,
  },
  iconBtn: {
    height: 20,
    width: 20,
  },
  paymentOptionTertiary: {
    backgroundColor: colors.tertiary,
    width: screenWidth,
    paddingVertical: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingRight: 15,
    paddingLeft: 40,
  },
  paymentOption: {
    width: screenWidth,
    paddingVertical: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingRight: 15,
    paddingLeft: 40,
  },
  removeItemBtn: {
    position: 'absolute',
    top: -9,
    right: 0,
    zIndex: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },

  // Background Colors
  bgPrimary: {
    backgroundColor: colors.primary,
  },
  bgSecondary: {
    backgroundColor: colors.secondary,
  },
  bgTertiary: {
    backgroundColor: colors.tertiary,
  },
  bgWhite: {
    backgroundColor: colors.white,
  },
  bgSilver: {
    backgroundColor: colors.silver,
  },
  bgAlabaster: {
    backgroundColor: colors.alabaster,
  },
  bgWarning: {
    backgroundColor: colors.warning,
  },
  bgWapp: {
    backgroundColor: colors.wapp,
  },
  bgEmail: {
    backgroundColor: colors.email,
  },
  bgSemiTransparent: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  // Widths
  btnLong07: {
    width: screenWidth * 0.7,
  },
  btnLong045: {
    width: screenWidth * 0.45,
  },
  btnLong021: {
    width: screenWidth * 0.22,
  },
  payTotal: {
    width: '100%',
  },
  w100: {
    width: screenWidth,
  },
  w100p: {
    width: '100%',
  },
  w80p: {
    width: '80%',
  },
  w75p: {
    width: '75%',
  },
  w60p: {
    width: '60%',
  },
  w50p: {
    width: '50%',
  },
  w40p: {
    width: '40%',
  },
  w48p: {
    width: '48%',
  },
  w35p: {
    width: '35%',
  },
  w30p: {
    width: '30%',
  },
  w25p: {
    width: '25%',
  },
  w15p: {
    width: '15%',
  },
  w10p: {
    width: '10%',
  },

  // Text Colors
  colorWhite: {
    color: colors.white,
  },
  colorBlack: {
    color: colors.black,
  },
  colorPrimary: {
    color: colors.primary,
  },
  colorSecondary: {
    color: colors.secondary,
  },
  colorTertiary: {
    color: colors.tertiary,
  },
  colorSilver: {
    color: colors.silver,
  },
  colorSilverChalice: {
    color: colors.silverChalice,
  },
  colorAlabaster: {
    color: colors.alabaster,
  },

  // Text Styles
  textBold: {
    fontWeight: 'bold',
  },
  textNormal: {
    fontWeight: 'normal',
  },
  textNormalItalic: {
    fontWeight: 'normal',
    fontStyle: 'italic',
  },
  textCenter: {
    textAlign: 'center',
  },
  textRight: {
    textAlign: 'right',
  },
  textUppercase: {
    textTransform: 'uppercase',
  },

  // Font Sizes
  fontSizeXXS: {
    fontSize: 10,
  },
  fontSizeXS: {
    fontSize: 12,
  },
  fontSizeS: {
    fontSize: 18,
  },
  fontSizeSM: {
    fontSize: 26,
  },
  fontSizeM: {
    fontSize: 38,
  },
  fontSizeLG: {
    fontSize: 48,
  },

  // Margins
  margin0: {
    margin: 0,
  },
  marginTop5: {
    marginTop: 5,
  },
  marginTop10: {
    marginTop: 10,
  },
  marginTop20: {
    marginTop: 20,
  },
  marginTop30: {
    marginTop: 30,
  },
  marginTop40: {
    marginTop: 40,
  },
  marginTopAuto: {
    marginTop: 'auto',
  },
  marginBottom10: {
    marginBottom: 10,
  },
  marginBottom20: {
    marginBottom: 20,
  },
  marginBottom30: {
    marginBottom: 30,
  },
  marginBottom40: {
    marginBottom: 40,
  },
  marginLeft5: {
    marginLeft: 5,
  },
  marginLeft10: {
    marginLeft: 10,
  },
  marginLeft20: {
    marginLeft: 20,
  },
  marginLeft15: {
    marginLeft: 15,
  },
  marginLeftAuto: {
    marginLeft: 'auto',
  },
  marginRight5: {
    marginRight: 5,
  },
  marginRight10: {
    marginRight: 10,
  },
  marginRight15: {
    marginRight: 15,
  },
  marginRightAuto: {
    marginRight: 'auto',
  },
  marginVertical10: {
    marginVertical: 10,
  },
  marginVertical20: {
    marginVertical: 20,
  },
  marginHorizontal15: {
    marginHorizontal: 15,
  },
  marginLeftLess10: {
    marginLeft: -10,
  },
  marginHorizontalLess20: {
    marginHorizontal: -20,
  },
  marginHorizontalAuto: {
    marginLeft: 'auto',
    marginRight: 'auto',
  },

  // Padding
  paddingVertical5: {
    paddingVertical: 5,
  },
  paddingVertical10: {
    paddingVertical: 10,
  },
  paddingVertical15: {
    paddingVertical: 15,
  },
  paddingVertical18: {
    paddingVertical: 18,
  },
  paddingHorizontal18: {
    paddingHorizontal: 18,
  },
  paddingHorizontal20: {
    paddingHorizontal: 20,
  },
  paddingVertical22: {
    paddingVertical: 22,
  },
  paddingRight15: {
    paddingRight: 15,
  },
  paddingRight20: {
    paddingRight: 20,
  },
  paddingRight25: {
    paddingRight: 25,
  },
  paddingTop10: {
    paddingTop: 10,
  },
  paddingTop20: {
    paddingTop: 20,
  },
  paddingBottom10: {
    paddingBottom: 10,
  },
  paddingBottom20: {
    paddingBottom: 20,
  },
  paddingLeft10: {
    paddingLeft: 10,
  },
  paddingLeft40: {
    paddingLeft: 40,
  },
  paddingLeft45: {
    paddingLeft: 45,
  },
  paddingLeft50: {
    paddingLeft: 50,
  },
  padding15: {
    padding: 15,
  },
  padding20: {
    padding: 20,
  },

  // Flex
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  flexCol: {
    flexDirection: 'column',
  },
  flex1: {
    flex: 1,
  },
  textAlignVerticalCenter: {
    textAlignVertical: 'center',
  },
  justifyContentBetween: {
    justifyContent: 'space-between',
  },
  justifyContentEnd: {
    justifyContent: 'flex-end',
  },

  // Borders
  borderFullBottom20: {
    borderBottomEndRadius: 20,
    borderBottomStartRadius: 20,
  },
  borderFull1: {
    borderWidth: 1,
  },
  borderHorizontal: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  borderBgMercury: {
    borderColor: colors.mercury,
  },
  borderBgSilver: {
    borderColor: colors.silver,
  },
  borderBgSilverChalice: {
    borderColor: colors.silverChalice,
  },
  borderVertical1: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  borderTop1: {
    borderTopWidth: 1,
  },
  borderBottom1: {
    borderBottomWidth: 1,
  },
  borderRadius10: {
    borderRadius: 10,
  },
  borderRadius15: {
    borderRadius: 15,
  },

  // Inputs
  input: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 15,
    borderColor: colors.silver,
  },
  inputWithMinorPadding: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    borderColor: colors.silver,
  },
  inputUploadImage: {
    borderStyle: 'dotted',
    borderWidth: 1,
    padding: 10,
    borderRadius: 15,
    borderColor: colors.silver,
  },
  inputSearch: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    borderColor: colors.silver,
  },

  // Image Sizes
  full150: {
    width: 150,
    height: 150,
  },
  full40: {
    width: 40,
    height: 40,
  },
  full30: {
    width: 30,
    height: 30,
  },
  full25: {
    width: 25,
    height: 25,
  },
  full20: {
    width: 20,
    height: 20,
  },
  noResultsImage: {
    width: screenWidth * 0.4,
    height: screenWidth * 0.4 - 50,
  },
  headerImageInvoice: {
    width: '70%',
    height: 80,
    resizeMode: 'contain',
  },

  // Positions
  positionRelative: {
    position: 'relative',
  },
  positionAbsolute: {
    position: 'absolute',
  },

  // Loaders
  loadingContainer: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    zIndex: 999,
    position: 'absolute',
    left: 0,
    top: 0,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
