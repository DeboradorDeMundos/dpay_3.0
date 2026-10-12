import React from 'react';
import { TouchableOpacity, Image, StyleSheet } from 'react-native';

interface BackButtonProps {
  onPress: () => void;
  style?: object;
}

export const BackButton: React.FC<BackButtonProps> = ({ onPress, style }) => {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.container, style]}>
      <Image 
        source={require('../../../assets/icons/prev.png')} 
        style={styles.icon}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 30,
    height: 30,
    tintColor: '#d4186e',
  },
});
