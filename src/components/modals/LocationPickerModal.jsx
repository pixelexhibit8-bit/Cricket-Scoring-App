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
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import {
  systemFont,
  systemFontBold,
  systemFontMedium
} from '../../theme.js';
import { capitalizeWords } from '../../utils/textUtils.js';

export function LocationPickerModal({
  visible,
  currentCity = '',
  onClose,
  onSelectLocation
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatusText, setGpsStatusText] = useState('');
  const [manualInput, setManualInput] = useState(currentCity || '');

  useEffect(() => {
    if (currentCity) setManualInput(currentCity);
  }, [currentCity, visible]);

  // Live Real-World Search via OpenStreetMap Geocoding API
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=in&addressdetails=1&limit=8`,
          { headers: { 'User-Agent': 'CricFlowMobileApp/1.0' } }
        );
        const data = await res.json();
        if (Array.isArray(data)) {
          const formatted = data.map(item => {
            const addr = item.address || {};
            const villageOrCity = addr.village || addr.suburb || addr.town || addr.city || addr.hamlet || addr.county || item.name;
            const district = addr.state_district || addr.district || addr.county || '';
            const state = addr.state || '';
            
            const displayTitle = villageOrCity;
            const displaySub = [district, state, 'India'].filter(Boolean).join(', ');
            const savedValue = [villageOrCity, district].filter(Boolean).join(', ') || item.display_name;

            return {
              displayTitle,
              displaySub,
              savedValue,
              raw: item
            };
          });
          setSearchResults(formatted);
        }
      } catch (err) {
        console.warn('Location search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Real GPS Auto-Detect with Pinpoint Accuracy
  const handleDetectGps = async () => {
    setGpsLoading(true);
    setGpsStatusText('Locating GPS satellites...');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow location permission to auto-detect your exact ground.');
        setGpsLoading(false);
        setGpsStatusText('');
        return;
      }

      setGpsStatusText('Fetching pinpoint coordinates...');
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest
      });

      const { latitude, longitude } = loc.coords;
      setGpsStatusText('Resolving place name...');

      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        { headers: { 'User-Agent': 'CricFlowMobileApp/1.0' } }
      );
      const data = await res.json();
      const addr = data?.address || {};

      const placeName = addr.village || addr.suburb || addr.neighbourhood || addr.hamlet || addr.town || addr.city || addr.road || 'Local Ground';
      const district = addr.state_district || addr.county || addr.district || '';
      const state = addr.state || '';

      const fullString = [placeName, district].filter(Boolean).join(', ');
      
      onSelectLocation({
        city: placeName,
        district,
        state,
        formatted: fullString || data?.display_name || 'Sadokan, Nagaur'
      });
      onClose();
    } catch (err) {
      console.warn('GPS Error:', err);
      Alert.alert('GPS Error', 'Could not detect exact GPS location. Please type your city/ground name.');
    } finally {
      setGpsLoading(false);
      setGpsStatusText('');
    }
  };

  const handleSelectResult = (item) => {
    onSelectLocation({
      city: item.displayTitle,
      formatted: item.savedValue
    });
    onClose();
  };

  const handleApplyManual = () => {
    if (!manualInput.trim()) return;
    onSelectLocation({
      city: manualInput.trim(),
      formatted: manualInput.trim()
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={styles.backdrop}>
        <TouchableOpacity activeOpacity={1} style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="location" size={20} color="#0284C7" />
              <Text style={styles.title}>Player City / Ground Location</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* GPS Auto-Detect Button */}
          <TouchableOpacity
            onPress={handleDetectGps}
            disabled={gpsLoading}
            activeOpacity={0.8}
            style={styles.gpsBtn}
          >
            {gpsLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="navigate-circle" size={20} color="#FFFFFF" />
            )}
            <Text style={styles.gpsBtnText}>
              {gpsLoading ? (gpsStatusText || 'Detecting Location...') : 'USE CURRENT GPS LOCATION (1-TAP)'}
            </Text>
          </TouchableOpacity>

          {/* Live Search Bar */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search any village, ground, city in India..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="words"
            />
            {isSearching && <ActivityIndicator size="small" color="#0284C7" />}
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color="#94A3B8" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Live Results List */}
          {searchQuery.length >= 2 ? (
            <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionHeader}>SEARCH RESULTS</Text>
              {searchResults.length === 0 && !isSearching ? (
                <View style={{ padding: 16, alignItems: 'center' }}>
                  <Text style={{ color: '#64748B', fontSize: 13, fontFamily: systemFontMedium }}>
                    No exact location found for "{searchQuery}"
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      onSelectLocation({ city: searchQuery.trim(), formatted: searchQuery.trim() });
                      onClose();
                    }}
                    style={styles.fallbackBtn}
                  >
                    <Text style={styles.fallbackBtnText}>Use "{searchQuery.trim()}" directly ➜</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                searchResults.map((item, idx) => (
                  <TouchableOpacity
                    key={`res-${idx}`}
                    onPress={() => handleSelectResult(item)}
                    style={styles.resultItem}
                  >
                    <View style={styles.pinBg}>
                      <Ionicons name="location" size={16} color="#0284C7" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.resultTitle}>{item.displayTitle}</Text>
                      <Text style={styles.resultSub}>{item.displaySub}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          ) : (
            /* Direct Manual Input Section */
            <View style={{ gap: 10, marginTop: 4 }}>
              <Text style={styles.sectionHeader}>OR ENTER CITY / GROUND NAME MANUALLY</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  style={styles.manualInput}
                  value={manualInput}
                  onChangeText={(t) => setManualInput(capitalizeWords(t))}
                  placeholder="e.g. Sadokan Ground, Nagaur"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="words"
                />
                <TouchableOpacity
                  onPress={handleApplyManual}
                  disabled={!manualInput.trim()}
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
    borderWidth: 1,
    borderColor: '#CBD5E1',
    maxHeight: '85%'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10
  },
  title: {
    fontSize: 16,
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
    elevation: 3
  },
  gpsBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontFamily: systemFontBold
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
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
    fontSize: 10.5,
    fontFamily: systemFontBold,
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 6
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
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
  fallbackBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8
  },
  fallbackBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: systemFontBold
  },
  manualInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
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
