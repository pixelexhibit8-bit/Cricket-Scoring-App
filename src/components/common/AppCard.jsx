import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { themeColors, radius, spacing } from '../../theme.js';

/**
 * CricFlow Design System - Canonical AppCard Component
 * 
 * @param {'default' | 'flat' | 'hero' | 'outlined'} variant - Visual appearance
 * @param {boolean} pressable - If card is interactive
 * @param {function} onPress - Press handler
 * @param {object} style - Custom style overrides
 * @param {React.ReactNode} children - Card content
 */
export function AppCard({
  children,
  variant = 'default',
  pressable = false,
  onPress,
  style,
  ...props
}) {
  const isHero = variant === 'hero';
  const isFlat = variant === 'flat';
  const isOutlined = variant === 'outlined';

  const cardStyles = [
    styles.base,
    isHero && styles.hero,
    isFlat && styles.flat,
    isOutlined && styles.outlined,
    style
  ];

  if (pressable && onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={cardStyles}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyles} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: themeColors.cardBackground,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: themeColors.cardBorder
  },
  hero: {
    backgroundColor: themeColors.heroBackground,
    borderColor: themeColors.heroBorder
  },
  flat: {
    backgroundColor: themeColors.surfaceOffWhite,
    borderColor: themeColors.borderDark
  },
  outlined: {
    backgroundColor: 'transparent',
    borderColor: themeColors.border
  }
});
