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
  Alert
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  systemFont,
  systemFontBold,
  systemFontMedium,
  themeColors
} from '../../theme.js';
import { capitalizeWords } from '../../utils/textUtils.js';
import { useLocation } from '../../hooks/useLocation.js';

export function LocationPickerModal({
  visible,
  currentLocation = null,
  currentCity = '',
  title = 'Select Ground / City Location',
  onClose,
  onSelectLocation
}) {
  const [manualInput, setManualInput] = useState(
    currentLocation?.formattedAddress || currentLocation?.city || currentCity || ''
  );

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
      setManualInput(currentLocation?.formattedAddress || currentLocation?.city || currentCity || '');
      clearSearch();
    }
  }, [visible, currentCity, currentLocation, clearSearch]);

  const handleDetectGps = async () => {
    const loc = await detectGps();
    if (loc) {
      if (onSelectLocation) {
        onSelectLocation(loc);
      }
      if (onClose) onClose();
    } else {
      Alert.alert(
        'GPS Location Error',
        'Could not auto-detect location. Please check if device GPS/Location service is turned ON, or search manually below.'
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

  const handleApplyManual = () => {
    const text = manualInput.trim();
    if (!text) return;
    const customLoc = applyCustomManual(text);
    if (onSelectLocation) {
      onSelectLocation(customLoc);
    }
    if (onClose) onClose();
  };

  const handleFallbackDirect = () => {
    const text = searchQuery.trim();
    if (!text) return;
    const customLoc = applyCustomManual(text);
    if (onSelectLocation) {
      onSelectLocation(customLoc);
    }
    if (onClose) onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={styles.backdrop}>
        <TouchableOpacity activeOpacity={1} style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="location-sharp" size={20} color="#0284C7" />
              <Text style={styles.title}>{title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* GPS Auto-Detect Button */}
          <TouchableOpacity
            onPress={handleDetectGps}
            disabled={gpsLoading}
            activeOpacity={0.8}
            style={[styles.gpsBtn, gpsLoading && { opacity: 0.85 }]}
          >
            {gpsLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="navigate-circle-outline" size={20} color="#FFFFFF" />
            )}
            <Text style={styles.gpsBtnText}>
              {gpsLoading ? (gpsStatusText || 'Detecting Location...') : 'USE CURRENT GPS LOCATION (1-TAP)'}
            </Text>
          </TouchableOpacity>

          {/* Global Search Bar */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search any city, town, or ground worldwide..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="words"
              autoCorrect={false}
            />
            {isSearching && <ActivityIndicator size="small" color="#0284C7" />}
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={17} color="#94A3B8" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Results List */}
          {searchQuery.trim().length >= 2 ? (
            <ScrollView
              style={{ maxHeight: 280 }}
              contentContainerStyle={{ paddingBottom: 10 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.sectionHeader}>SEARCH RESULTS</Text>

              {searchResults.length === 0 && !isSearching ? (
                <View style={{ padding: 18, alignItems: 'center', gap: 10 }}>
                  <Text style={{ color: '#64748B', fontSize: 13, fontFamily: systemFontMedium, textAlign: 'center' }}>
                    No exact location found for "{searchQuery}"
                  </Text>
                  <TouchableOpacity
                    onPress={handleFallbackDirect}
                    style={styles.fallbackBtn}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.fallbackBtnText}>Use "{searchQuery.trim()}" as Ground Name</Text>
                    <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                searchResults.map((item, idx) => {
                  const subtitle = [item.state, item.country].filter(Boolean).join(', ');
                  return (
                    <TouchableOpacity
                      key={`${item.formattedAddress}-${idx}`}
                      onPress={() => handleSelectResult(item)}
                      style={styles.resultItem}
                      activeOpacity={0.7}
                    >
                      <View style={styles.pinBg}>
                        <Ionicons name="location" size={16} color="#0284C7" />
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
                      <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          ) : (
            /* Direct Manual Input Section */
            <View style={{ gap: 8, marginTop: 4 }}>
              <Text style={styles.sectionHeader}>OR ENTER CITY / GROUND MANUALLY</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  style={styles.manualInput}
                  value={manualInput}
                  onChangeText={(t) => setManualInput(capitalizeWords(t))}
                  placeholder="e.g. Jaipur, Nagaur, Lahore, Dubai..."
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="words"
                />
                <TouchableOpacity
                  onPress={handleApplyManual}
                  disabled={!manualInput.trim()}
                  activeOpacity={0.8}
                  style={[styles.applyBtn, !manualInput.trim() && { backgroundColor: '#CBD5E1' }]}
                >
                  <Text style={styles.applyBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end'
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    paddingBottom: 28,
    gap: 14,
    borderWidth: 0,
    borderColor: '#CBD5E1',
    maxHeight: '85%'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 0,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10
  },
  title: {
    fontSize: 15,
    fontFamily: systemFontBold,
    color: '#0F172A'
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 2
  },
  gpsBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontFamily: systemFontBold,
    letterSpacing: 0.3
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 0,
    borderColor: '#E2E8F0',
    gap: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: systemFontMedium,
    color: '#0F172A',
    padding: 0
  },
  sectionHeader: {
    fontSize: 11,
    fontFamily: systemFontBold,
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 6
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 6,
    borderBottomWidth: 0,
    borderBottomColor: '#F1F5F9',
    gap: 10
  },
  pinBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  resultTitle: {
    fontSize: 13.5,
    fontFamily: systemFontBold,
    color: '#0F172A'
  },
  resultSub: {
    fontSize: 11,
    fontFamily: systemFontMedium,
    color: '#64748B',
    marginTop: 2
  },
  countryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    borderWidth: 0,
    borderColor: '#E2E8F0'
  },
  countryBadgeText: {
    fontSize: 10,
    fontFamily: systemFontBold,
    color: '#475569'
  },
  fallbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 4
  },
  fallbackBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontFamily: systemFontBold
  },
  manualInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 0,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    fontFamily: systemFontMedium,
    color: '#0F172A'
  },
  applyBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 10,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center'
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: systemFontBold
  }
});
