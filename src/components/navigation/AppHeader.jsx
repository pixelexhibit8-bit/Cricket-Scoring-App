import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { systemFontBold, systemFontMedium, themeColors } from '../../theme.js';

export function AppHeader({
  searchQuery = '',
  setSearchQuery,
  placeholder = 'Search matches, players...',
  showSearch = true,
  rightElement = null,
  scrollY = null   // kept in API for compatibility but no longer used
}) {
  return (
    <View style={styles.headerRoot}>
      {/* 1. TOP BRAND ROW */}
      <View style={styles.brandRow}>
        <View style={styles.logoAndTitle}>
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.logoImg}
          />
          <Text style={styles.brandTitle}>
            Cric<Text style={{ color: themeColors.primary }}>Flow</Text>
          </Text>
        </View>

        <View style={styles.rightActionWrap}>
          {rightElement ? rightElement : (
            <TouchableOpacity
              style={styles.menuDrawerBtn}
              activeOpacity={0.7}
              disabled={true}
              accessibilityLabel="Navigation Menu"
            >
              <Ionicons name="menu-outline" size={24} color={themeColors.textPrimary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 2. FULL-WIDTH SEARCH BAR */}
      {showSearch ? (
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={themeColors.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={placeholder}
              placeholderTextColor={themeColors.textSubtle}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {Boolean(searchQuery && searchQuery.trim().length > 0) && (
              <TouchableOpacity
                onPress={() => (setSearchQuery ? setSearchQuery('') : null)}
                style={styles.clearBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={18} color={themeColors.textSubtle} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRoot: {
    backgroundColor: themeColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
    zIndex: 10
  },
  brandRow: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 12,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  menuDrawerBtn: {
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  logoAndTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  logoImg: {
    width: 28,
    height: 28,
    resizeMode: 'contain'
  },
  brandTitle: {
    fontSize: 18,
    color: themeColors.textPrimary,
    fontFamily: systemFontBold,
    letterSpacing: -0.3
  },
  rightActionWrap: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  searchRow: {
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 10,
    justifyContent: 'center'
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.surfaceOffWhite,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: themeColors.border
  },
  searchIcon: {
    marginRight: 10
  },
  searchInput: {
    flex: 1,
    color: themeColors.textPrimary,
    fontSize: 14,
    fontFamily: systemFontMedium,
    paddingVertical: 0
  },
  clearBtn: {
    padding: 4,
    marginLeft: 4
  }
});

export default AppHeader;
