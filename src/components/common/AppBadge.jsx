import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { themeColors, fonts, radius, spacing } from '../../theme.js';

/**
 * CricFlow Design System - Canonical AppBadge Component
 * 
 * @param {string} label - Badge text
 * @param {'live' | 'primary' | 'success' | 'warning' | 'muted' | 'outline' | 'custom'} variant - Style variant
 * @param {string} bg - Custom background color
 * @param {string} color - Custom text color
 * @param {object} style - Custom container style
 */
export function AppBadge({
  label,
  variant = 'primary',
  bg,
  color,
  style,
  textStyle,
  icon = null
}) {
  let resolvedBg = bg || themeColors.primarySurface;
  let resolvedColor = color || themeColors.primary;
  let resolvedBorder = 'transparent';

  if (variant === 'live') {
    resolvedBg = themeColors.wicket;
    resolvedColor = '#FFFFFF';
  } else if (variant === 'success') {
    resolvedBg = '#DCFCE7';
    resolvedColor = '#16A34A';
  } else if (variant === 'warning') {
    resolvedBg = themeColors.warningLight;
    resolvedColor = themeColors.warning;
  } else if (variant === 'muted') {
    resolvedBg = '#F1F5F9';
    resolvedColor = themeColors.textMuted;
  } else if (variant === 'outline') {
    resolvedBg = 'transparent';
    resolvedColor = themeColors.primary;
    resolvedBorder = themeColors.primary;
  }

  return (
    <View style={[
      styles.badge,
      { backgroundColor: resolvedBg, borderColor: resolvedBorder, borderWidth: resolvedBorder !== 'transparent' ? 1 : 0 },
      style
    ]}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={[styles.text, { color: resolvedColor }, textStyle]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start'
  },
  icon: {
    marginRight: 4
  },
  text: {
    fontSize: 10.5,
    fontFamily: fonts.bold,
    letterSpacing: 0.3
  }
});
