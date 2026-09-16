import React, { useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import {
  systemFont,
  systemFontBold,
  systemFontMedium,
  themeColors
} from '../../theme.js';
import { useLocation } from '../../hooks/useLocation.js';

export function LocationPickerModal({
  visible = false,
  currentLocation = null,
  currentCity = '',
  title = 'Select City / Location',
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

          {/* Clean Search Input */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={17} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search city or location..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="words"
              autoCorrect={false}
              autoFocus={visible}
            />
            {isSearching ? (
              <ActivityIndicator size="small" color="#18181B" />
            ) : queryTrimmed ? (
              <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={17} color="#94A3B8" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Use Current Location (GPS) Row */}
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
              <Text style={styles.gpsSub}>Auto-detect city using device GPS</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Pure Search Results List */}
          <ScrollView
            style={styles.scrollList}
            contentContainerStyle={styles.scrollListContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {queryTrimmed.length > 0 ? (
              searchResults.length > 0 ? (
                searchResults.map((item, idx) => {
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
                })
              ) : !isSearching ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="search-outline" size={26} color="#94A3B8" />
                  <Text style={styles.emptyTitle}>No City Found</Text>
                  <Text style={styles.emptySub}>
                    No match found for "{queryTrimmed}". Check spelling or try nearby district.
                  </Text>
                </View>
              ) : null
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="map-outline" size={28} color="#CBD5E1" />
                <Text style={styles.emptyStateText}>
                  Type city or town name to search across India & worldwide
                </Text>
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
    maxHeight: '80%',
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
    maxHeight: 320
  },
  scrollListContent: {
    paddingBottom: 16
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
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
    fontSize: 14,
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
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 6
  },
  emptyTitle: {
    fontSize: 14,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary,
    marginTop: 4
  },
  emptySub: {
    fontSize: 12,
    fontFamily: systemFont,
    color: themeColors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 20
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 8
  },
  emptyStateText: {
    fontSize: 12,
    fontFamily: systemFont,
    color: themeColors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 30
  }
});

export default LocationPickerModal;
