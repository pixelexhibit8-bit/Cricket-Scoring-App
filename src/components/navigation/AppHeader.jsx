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
import { systemFontBold, systemFontMedium } from '../../theme.js';

export function AppHeader({
  searchQuery = '',
  setSearchQuery,
  placeholder = 'Search matches, players, teams...',
  showSearch = true,
  rightElement = null
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
            Cric<Text style={{ color: '#0284C7' }}>Flow</Text>
          </Text>
        </View>

        {rightElement ? (
          <View style={styles.rightActionWrap}>
            {rightElement}
          </View>
        ) : null}
      </View>

      {/* 2. FULL-WIDTH SEARCH BAR (BELOW BRAND HEADER) */}
      {showSearch ? (
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={16} color="#64748B" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={placeholder}
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {Boolean(searchQuery && searchQuery.trim().length > 0) && (
              <TouchableOpacity
                onPress={() => setSearchQuery ? setSearchQuery('') : null}
                style={styles.clearBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={16} color="#94A3B8" />
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  brandRow: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 14,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52
  },
  logoAndTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  logoImg: {
    width: 32,
    height: 32,
    resizeMode: 'contain'
  },
  brandTitle: {
    fontSize: 20,
    color: '#0F172A',
    fontFamily: systemFontBold,
    letterSpacing: -0.3
  },
  rightActionWrap: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  searchRow: {
    paddingHorizontal: 16,
    paddingBottom: 12
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 13,
    fontFamily: systemFontMedium,
    paddingVertical: 0
  },
  clearBtn: {
    padding: 4,
    marginLeft: 4
  }
});

export default AppHeader;
