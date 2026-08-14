import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { systemFontBold, systemFontMedium, shadows, themeColors } from '../../theme.js';

/**
 * Reusable Global AppButton component driven by the central Design System
 * 
 * @param {string} title - Button label text
 * @param {function} onPress - Click handler
 * @param {'primary' | 'outline' | 'secondary' | 'warning' | 'danger' | 'text'} variant - Visual style variant
 * @param {'sm' | 'md' | 'lg'} size - Button size
 * @param {string} icon - Icon name
 * @param {'material' | 'ionicons'} iconType - Icon library (defaults to material)
 * @param {'left' | 'right'} iconPosition - Icon alignment
 * @param {boolean} loading - Loading spinner state
 * @param {boolean} disabled - Disabled state
 * @param {boolean} fullWidth - Expand to 100% container width
 * @param {object} style - Custom container style overrides
 * @param {object} textStyle - Custom text style overrides
 */
export function AppButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconType = 'material',
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  textStyle,
  ...rest
}) {
  const isOutline = variant === 'outline';
  const isSecondary = variant === 'secondary';
  const isWarning = variant === 'warning';
  const isDanger = variant === 'danger';
  const isText = variant === 'text';
  const isPrimary = variant === 'primary';

  // Resolve Variant Colors
  let bg = themeColors.primary;
  let textColor = '#FFFFFF';
  let borderColor = themeColors.primary;
  let borderWidth = 0;

  if (isOutline) {
    bg = '#FFFFFF';
    textColor = themeColors.primary;
    borderColor = themeColors.primary;
    borderWidth = 1.5;
  } else if (isSecondary) {
    bg = '#F8FAFC';
    textColor = '#334155';
    borderColor = '#CBD5E1';
    borderWidth = 1;
  } else if (isWarning) {
    bg = '#FEF3C7';
    textColor = '#B45309';
    borderColor = '#F59E0B';
    borderWidth = 1;
  } else if (isDanger) {
    bg = '#FEE2E2';
    textColor = '#DC2626';
    borderColor = '#EF4444';
    borderWidth = 1;
  } else if (isText) {
    bg = 'transparent';
    textColor = themeColors.primary;
    borderColor = 'transparent';
    borderWidth = 0;
  }

  if (disabled) {
    bg = isText ? 'transparent' : '#E2E8F0';
    textColor = '#94A3B8';
    borderColor = isOutline ? '#CBD5E1' : 'transparent';
  }

  // Size Specifications
  let height = 48;
  let fontSize = 13;
  let iconSize = 18;
  let paddingHorizontal = 16;
  let borderRadius = 10;

  if (size === 'sm') {
    height = 36;
    fontSize = 11;
    iconSize = 14;
    paddingHorizontal = 12;
    borderRadius = 8;
  } else if (size === 'lg') {
    height = 54;
    fontSize = 15;
    iconSize = 20;
    paddingHorizontal = 20;
    borderRadius = 12;
  }

  const renderIcon = () => {
    if (!icon) return null;
    const color = textColor;
    if (iconType === 'ionicons') {
      return <Ionicons name={icon} size={iconSize} color={color} />;
    }
    return <MaterialCommunityIcons name={icon} size={iconSize} color={color} />;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        {
          backgroundColor: bg,
          borderColor,
          borderWidth,
          height,
          paddingHorizontal,
          borderRadius,
          width: fullWidth ? '100%' : 'auto'
        },
        isPrimary && !disabled ? shadows.small : null,
        style
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <View style={styles.contentRow}>
          {iconPosition === 'left' && renderIcon()}
          {Boolean(title) ? (
            <Text
              style={[
                styles.label,
                {
                  color: textColor,
                  fontSize
                },
                textStyle
              ]}
              numberOfLines={1}
            >
              {String(title)}
            </Text>
          ) : null}
          {iconPosition === 'right' && renderIcon()}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  label: {
    fontFamily: systemFontBold,
    letterSpacing: 0.2,
    textAlign: 'center'
  }
});

export default AppButton;
