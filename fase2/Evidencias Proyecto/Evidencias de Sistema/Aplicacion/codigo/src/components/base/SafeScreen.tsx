import React from 'react';
import { View, SafeAreaView, StyleSheet, StatusBar, ViewStyle } from 'react-native';
import { colors } from '../../theme';

interface SafeScreenProps {
  children: React.ReactNode;
  backgroundColor?: string;
  style?: ViewStyle;
  statusBarStyle?: 'light-content' | 'dark-content';
}

export const SafeScreen: React.FC<SafeScreenProps> = ({
  children,
  backgroundColor = colors.white,
  style,
  statusBarStyle = 'dark-content',
}) => {
  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={backgroundColor} />
      <SafeAreaView style={styles.safeArea}>{children}</SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
});
