import { Platform, StyleSheet } from 'react-native';
import globalStyles from './globalStyles';

export default StyleSheet.create({
  container: {
    ...globalStyles.h100,
    ...globalStyles.bgWhite,
    flex: 1,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  btn1X: {
    paddingVertical: 5,
    paddingHorizontal: 15,
    marginLeft: 5,
  },
  btn1XActive: {
    ...globalStyles.btnRounded,
    ...globalStyles.bgSecondary,
    paddingVertical: 5,
    paddingHorizontal: 15,
    marginLeft: 5,
  },
  textValue: {
    color: '#75bebf',
    ...globalStyles.textBold,
    ...globalStyles.fontSizeM,
  },
  textValueActive: {
    color: '#75bebf',
    ...globalStyles.textBold,
    ...globalStyles.fontSizeM,
  },
  itemCard: {
    ...globalStyles.row,
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    paddingHorizontal: 10,
    marginTop: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#213d8b',
  },
  itemCardEdit: {
    ...globalStyles.row,
    ...globalStyles.bgWarning,
    paddingVertical: 15,
    paddingHorizontal: 10,
    marginTop: 10,
    borderRadius: 5,
  },
  rowPayTotal: {
    ...globalStyles.btnRoundedCalc,
    ...globalStyles.bgTertiary,
    ...globalStyles.row,
    ...globalStyles.marginLeftAuto,
    ...globalStyles.marginRight15,
    ...globalStyles.payTotal,
    ...globalStyles.justifyContentBetween,
  },
  deleteBackspaceBtn: {
    backgroundColor: 'rgba(255, 182, 213, 0.5)',
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBackspaceImage: {
    height: 28,
    width: 36,
    opacity: 0.7,
  },
  xBtn: {
    backgroundColor: 'rgba(255, 182, 213, 0.5)',
    width: 60,
    height: 60,
    borderRadius: 12,
    marginTop: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  xImage: {
    height: 26,
    width: 26,
    opacity: 0.7,
  },
  cleanImage: {
    height: 40,
    width: 40,
  },
  plusBtn: {
    ...globalStyles.bgTertiary,
    width: 60,
    height: 145,
    borderRadius: 12,
    marginTop: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionColumnStack: {
    marginTop: 10,
  },
  actionBtnHalf: {
    ...globalStyles.bgTertiary,
    width: 60,
    height: 67,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnHalfGap: {
    marginTop: 6,
  },
  scanBtnLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'Montserrat-Bold_0',
  },
  scanBtnActive: {
    backgroundColor: '#5aa8a9',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  plusImage: {
    height: 40,
    width: 40,
  },
  menuBtn: {
    height: 30,
    width: 30,
  },
});
