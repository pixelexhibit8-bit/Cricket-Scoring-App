import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { themeColors, fonts, spacing } from '../../theme.js';

/**
 * CricFlow Design System - Canonical Full-Screen AppModalShell Component
 * 
 * @param {boolean} visible - Modal visibility state
 * @param {function} onClose - Close handler
 * @param {string} title - Header title
 * @param {string} subtitle - Optional header subtitle
 * @param {React.ReactNode} icon - Optional header leading icon
 * @param {React.ReactNode} footer - Optional bottom fixed action bar
 * @param {React.ReactNode} children - Modal body
 */
export function AppModalShell({
  visible,
  onClose,
  title,
  subtitle,
  icon,
  footer,
  children,
  scrollable = true,
  contentContainerStyle,
  ...props
}) {
  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} {...props}>
      <SafeAreaView style={styles.safeArea}>
        {/* TOP HEADER BAR */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.closeBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={22} color={themeColors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.titleWrap}>
            <View style={styles.titleRow}>
              {icon ? <View style={styles.icon}>{icon}</View> : null}
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
            </View>
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        {/* BODY */}
        {scrollable ? (
          <ScrollView
            style={styles.body}
            contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.body, contentContainerStyle]}>
            {children}
          </View>
        )}

        {/* BOTTOM FIXED ACTION FOOTER */}
        {footer ? (
          <View style={styles.footer}>
            {footer}
          </View>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: themeColors.appBackground
  },
  header: {
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: themeColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.borderDark
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center'
  },
  titleWrap: {
    flex: 1
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  icon: {
    marginRight: 2
  },
  title: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: themeColors.textPrimary
  },
  subtitle: {
    fontSize: 11.5,
    fontFamily: fonts.medium,
    color: themeColors.textMuted,
    marginTop: 2
  },
  body: {
    flex: 1
  },
  contentContainer: {
    paddingBottom: spacing.xl
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: themeColors.surface,
    borderTopWidth: 1,
    borderTopColor: themeColors.border
  }
});
