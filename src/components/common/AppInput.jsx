import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { themeColors, fonts, radius, spacing } from '../../theme.js';

/**
 * CricFlow Design System - Canonical AppInput Component
 * 
 * @param {string} label - Optional input label
 * @param {string} placeholder - Input placeholder
 * @param {string} value - Controlled value
 * @param {function} onChangeText - Value change handler
 * @param {string} icon - Leading Ionicons icon name
 * @param {boolean} clearable - Show clear button
 * @param {string} error - Validation error text
 * @param {object} style - Input container style overrides
 */
export function AppInput({
  label,
  placeholder,
  value,
  onChangeText,
  icon,
  clearable = true,
  error,
  style,
  inputStyle,
  ...props
}) {
  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      
      <View style={[styles.container, Boolean(error) && styles.containerError]}>
        {icon ? (
          <Ionicons name={icon} size={18} color={themeColors.textMuted} style={styles.leadingIcon} />
        ) : null}

        <TextInput
          placeholder={placeholder}
          placeholderTextColor={themeColors.textSubtle}
          value={value}
          onChangeText={onChangeText}
          style={[styles.input, inputStyle]}
          {...props}
        />

        {clearable && Boolean(value && value.length > 0) ? (
          <TouchableOpacity
            onPress={() => onChangeText && onChangeText('')}
            style={styles.clearBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={18} color={themeColors.textSubtle} />
          </TouchableOpacity>
        ) : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs
  },
  label: {
    fontSize: 12.5,
    fontFamily: fonts.medium,
    color: themeColors.textSecondary,
    marginBottom: 2
  },
  container: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.surface,
    borderWidth: 1,
    borderColor: themeColors.borderDark,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md
  },
  containerError: {
    borderColor: themeColors.wicket
  },
  leadingIcon: {
    marginRight: spacing.sm
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: themeColors.textPrimary,
    paddingVertical: 8
  },
  clearBtn: {
    padding: 2
  },
  errorText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: themeColors.wicket,
    marginTop: 2
  }
});
