import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Pressable
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  systemFont,
  systemFontBold,
  systemFontMedium,
  themeColors
} from '../../theme.js';
import { useLocation } from '../../hooks/useLocation.js';

const POPULAR_CITIES = [
  'Nagaur', 'Jaipur', 'Jodhpur', 'Delhi', 'Mumbai',
  'Bengaluru', 'Ahmedabad', 'Pune', 'Hyderabad', 'Kolkata', 'Indore', 'Lucknow'
];

export function LocationPickerModal({
  visible = false,
  currentLocation = null,
  currentCity = '',
  title = 'Select City / Ground',
  onClose = () => {},
  onSelectLocation = () => {}
}) {
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    gpsLoading,
    gpsStatusText,
    detectGps,
    selectResult,
    applyCustomManual,
    clearSearch
  } = useLocation(currentLocation, (loc) => {
    if (onSelectLocation) {
      onSelectLocation(loc);
    }
  });

  useEffect(() => {
    if (visible) {
      clearSearch();
    }
  }, [visible, clearSearch]);

  const handleDetectGps = async () => {
    const loc = await detectGps();
    if (loc) {
      if (onSelectLocation) {
        onSelectLocation(loc);
      }
      if (onClose) onClose();
    } else {
      Alert.alert(
        'GPS Location',
        'Could not auto-detect location. Please check if device GPS is turned on, or search city manually.'
      );
    }
  };

  const handleSelectResult = (item) => {
    const normalized = selectResult(item);
    if (onSelectLocation) {
      onSelectLocation(normalized);
    }
    if (onClose) onClose();
  };

  const handleSelectQuickCity = (cityName) => {
    const customLoc = applyCustomManual(cityName);
    if (onSelectLocation) {
      onSelectLocation(customLoc);
    }
    if (onClose) onClose();
  };

  const handleSelectCustom = (text) => {
    const trimmed = (text || '').trim();
    if (!trimmed) return;
    const customLoc = applyCustomManual(trimmed);
    if (onSelectLocation) {
      onSelectLocation(customLoc);
    }
    if (onClose) onClose();
  };

  const queryTrimmed = searchQuery.trim();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconBox}>
                <Ionicons name="location-outline" size={18} color="#18181B" />
              </View>
              <Text style={styles.title}>{title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Clean Unified Search Box */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={17} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search city or enter ground name..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={() => queryTrimmed && handleSelectCustom(queryTrimmed)}
            />
            {isSearching ? (
              <ActivityIndicator size="small" color="#18181B" />
            ) : queryTrimmed ? (
              <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={17} color="#94A3B8" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Current Location (GPS) Sleek Row */}
          <TouchableOpacity
            style={styles.gpsRow}
            onPress={handleDetectGps}
            disabled={gpsLoading}
            activeOpacity={0.7}
          >
            <View style={styles.gpsIconBox}>
              {gpsLoading ? (
                <ActivityIndicator size="small" color="#18181B" />
              ) : (
                <Ionicons name="navigate-outline" size={17} color="#18181B" />
              )}
            </View>
            <View style={styles.gpsTextCol}>
              <Text style={styles.gpsTitle}>
                {gpsLoading ? (gpsStatusText || 'Detecting GPS location...') : 'Use Current Location'}
              </Text>
              <Text style={styles.gpsSub}>Auto-detect using device GPS</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Content Area */}
          <ScrollView
            style={styles.scrollList}
            contentContainerStyle={styles.scrollListContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {queryTrimmed.length > 0 ? (
              /* ── LIVE SEARCH RESULTS ── */
              <View>
                {/* Option 1: Direct Custom Ground / City Entry */}
                <TouchableOpacity
                  style={styles.customMatchRow}
                  onPress={() => handleSelectCustom(queryTrimmed)}
                  activeOpacity={0.7}
                >
                  <View style={styles.customIconBox}>
                    <Ionicons name="add-circle-outline" size={18} color="#18181B" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.customMatchTitle} numberOfLines={1}>
                      Use "{queryTrimmed}"
                    </Text>
                    <Text style={styles.customMatchSub}>Set as custom ground / city</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={15} color="#18181B" />
                </TouchableOpacity>

                {/* API Search Results */}
                {searchResults.length > 0 ? (
                  <View style={{ marginTop: 8 }}>
                    <Text style={styles.sectionHeader}>MATCHING CITIES</Text>
                    {searchResults.map((item, idx) => {
                      const subtitle = [item.district, item.state, item.country].filter(Boolean).join(', ');
                      return (
                        <TouchableOpacity
                          key={`${item.formattedAddress}-${idx}`}
                          onPress={() => handleSelectResult(item)}
                          style={styles.resultItem}
                          activeOpacity={0.7}
                        >
                          <View style={styles.pinIconBox}>
                            <Ionicons name="location-outline" size={16} color="#64748B" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.resultTitle} numberOfLines={1}>
                              {item.city}
                            </Text>
                            {subtitle ? (
                              <Text style={styles.resultSub} numberOfLines={1}>
                                {subtitle}
                              </Text>
                            ) : null}
                          </View>
                          {item.countryCode ? (
                            <View style={styles.countryBadge}>
                              <Text style={styles.countryBadgeText}>{item.countryCode}</Text>
                            </View>
                          ) : null}
                          <Ionicons name="chevron-forward" size={15} color="#CBD5E1" />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            ) : (
              /* ── POPULAR CITIES (When search is empty) ── */
              <View>
                <Text style={styles.sectionHeader}>POPULAR CITIES</Text>
                <View style={styles.popularGrid}>
                  {POPULAR_CITIES.map((city) => (
                    <TouchableOpacity
                      key={city}
                      style={styles.popularCityChip}
                      onPress={() => handleSelectQuickCity(city)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.popularCityText}>{city}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end'
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 20,
    maxHeight: '85%',
    borderWidth: 0,
    borderColor: '#EEEEF0'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  headerIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: 16.5,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center'
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    gap: 8,
    marginBottom: 10
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: systemFontMedium,
    color: themeColors.textPrimary,
    padding: 0
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 12
  },
  gpsIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center'
  },
  gpsTextCol: {
    flex: 1
  },
  gpsTitle: {
    fontSize: 13.5,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  gpsSub: {
    fontSize: 11.5,
    fontFamily: systemFont,
    color: themeColors.textSecondary,
    marginTop: 1
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 8
  },
  scrollList: {
    maxHeight: 340
  },
  scrollListContent: {
    paddingBottom: 16
  },
  sectionHeader: {
    fontSize: 11,
    fontFamily: systemFontBold,
    color: themeColors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4
  },
  popularGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  popularCityChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#EEEEF0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  popularCityText: {
    fontSize: 12.5,
    fontFamily: systemFontMedium,
    color: '#334155'
  },
  customMatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#EEEEF0',
    borderRadius: 10,
    padding: 12,
    gap: 10,
    marginBottom: 6
  },
  customIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  customMatchTitle: {
    fontSize: 13.5,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  customMatchSub: {
    fontSize: 11,
    fontFamily: systemFont,
    color: themeColors.textSecondary,
    marginTop: 1
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8FA',
    gap: 10
  },
  pinIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center'
  },
  resultTitle: {
    fontSize: 13.5,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  resultSub: {
    fontSize: 11.5,
    fontFamily: systemFont,
    color: themeColors.textSecondary,
    marginTop: 2
  },
  countryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#F4F4F5',
    borderRadius: 4
  },
  countryBadgeText: {
    fontSize: 10,
    fontFamily: systemFontBold,
    color: '#64748B'
  }
});

export default LocationPickerModal;
