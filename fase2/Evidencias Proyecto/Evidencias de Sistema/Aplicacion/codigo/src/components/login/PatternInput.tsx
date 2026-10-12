import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { spacing, typography } from '../../theme';
import { useThemeColors } from '../../hooks/useThemeColors';

interface PatternInputProps {
  title: string;
  subtitle?: string;
  onComplete: (pattern: string) => void;
}

const PatternInput = ({ title, subtitle, onComplete }: PatternInputProps) => {
  const themeColors = useThemeColors();
  const [pattern, setPattern] = useState('');

  const handleNumberPress = (num: string) => {
    const newPattern = pattern + num;
    setPattern(newPattern);

    if (newPattern.length === 4) {
      setTimeout(() => {
        onComplete(newPattern);
        setPattern('');
      }, 100);
    }
  };

  const handleDelete = () => {
    setPattern(pattern.slice(0, -1));
  };

  const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '←'];

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: themeColors.text }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>{subtitle}</Text>
      )}

      <View style={styles.dotsContainer}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { borderColor: themeColors.isDark ? '#FFFFFF' : themeColors.secondary },
              pattern.length > i && [
                styles.dotFilled,
                { backgroundColor: themeColors.secondary, borderColor: themeColors.secondary },
              ],
            ]}
          />
        ))}
      </View>

      <View style={styles.keypad}>
        {numbers.map((num, index) => {
          if (num === '') {
            return <View key={index} style={styles.keyEmpty} />;
          }

          if (num === '←') {
            return (
              <TouchableOpacity
                key={index}
                style={[styles.key, { backgroundColor: themeColors.secondary }]}
                onPress={handleDelete}
                activeOpacity={0.7}
              >
                <Text style={styles.keyText}>{num}</Text>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={index}
              style={[styles.key, { backgroundColor: themeColors.secondary }]}
              onPress={() => handleNumberPress(num)}
              activeOpacity={0.7}
            >
              <Text style={styles.keyText}>{num}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  title: {
    fontSize: typography.sizes.s,
    fontFamily: typography.families.bold,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.families.normal,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  dotFilled: {},
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 260,
    justifyContent: 'center',
    gap: spacing.sm,
  },
  key: {
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 36,
  },
  keyEmpty: {
    width: 72,
    height: 72,
  },
  keyText: {
    fontSize: typography.sizes['3xl'],
    fontFamily: typography.families.bold,
    color: '#FFFFFF',
  },
});

export default PatternInput;
