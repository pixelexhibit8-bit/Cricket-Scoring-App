import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  systemFont,
  systemFontBold,
  systemFontMedium,
  fontWeights
} from '../../theme.js';
import {
  COUNTRIES,
  INDIA_STATES_AND_DISTRICTS,
  POPULAR_VILLAGES_BY_DISTRICT
} from '../../utils/locationData.js';

export function LocationPickerModal({
  visible,
  currentLocation = null,
  currentCity = '',
  onClose,
  onSelectLocation
}) {
  const [selectedCountry, setSelectedCountry] = useState(
    COUNTRIES.find(c => c.code === 'IN') || COUNTRIES[0]
  );
  const [selectedState, setSelectedState] = useState('Rajasthan');
  const [selectedDistrict, setSelectedDistrict] = useState('Nagaur');
  const [selectedVillage, setSelectedVillage] = useState(currentCity || 'Sadokan');
  const [customVillageText, setCustomVillageText] = useState('');

  // Active sub-sheet selector: null | 'country' | 'state' | 'district' | 'village'
  const [activePicker, setActivePicker] = useState(null);
  const [subSearchQuery, setSubSearchQuery] = useState('');

  // Initialize from currentCity if provided
  useEffect(() => {
    if (currentCity) {
      if (currentCity.includes(',')) {
        const parts = currentCity.split(',').map(s => s.trim());
        if (parts[0]) setSelectedVillage(parts[0]);
        if (parts[1]) setSelectedDistrict(parts[1]);
      } else {
        setSelectedVillage(currentCity);
      }
    }
  }, [currentCity, visible]);

  // Current State & District Objects
  const stateObj = INDIA_STATES_AND_DISTRICTS.find(s => s.state === selectedState) || INDIA_STATES_AND_DISTRICTS[0];
  const availableDistricts = stateObj?.districts || [];
  const availableVillages = POPULAR_VILLAGES_BY_DISTRICT[selectedDistrict] || [];

  // Filtered Lists for Pickers
  const filteredCountries = useMemo(() => {
    const q = subSearchQuery.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
  }, [subSearchQuery]);

  const filteredStates = useMemo(() => {
    const q = subSearchQuery.trim().toLowerCase();
    if (!q) return INDIA_STATES_AND_DISTRICTS;
    return INDIA_STATES_AND_DISTRICTS.filter(s => s.state.toLowerCase().includes(q));
  }, [subSearchQuery]);

  const filteredDistricts = useMemo(() => {
    const q = subSearchQuery.trim().toLowerCase();
    if (!q) return availableDistricts;
    return availableDistricts.filter(d => d.toLowerCase().includes(q));
  }, [availableDistricts, subSearchQuery]);

  const filteredVillages = useMemo(() => {
    const q = subSearchQuery.trim().toLowerCase();
    if (!q) return availableVillages;
    return availableVillages.filter(v => v.toLowerCase().includes(q));
  }, [availableVillages, subSearchQuery]);

  const handleSave = () => {
    const finalVillage = customVillageText.trim() || selectedVillage || selectedDistrict;
    const formatted = `${finalVillage}${selectedDistrict && selectedDistrict !== finalVillage ? `, ${selectedDistrict}` : ''}`;

    onSelectLocation({
      country: selectedCountry.name,
      countryFlag: selectedCountry.flag,
      countryCode: selectedCountry.code,
      state: selectedState,
      district: selectedDistrict,
      city: finalVillage,
      formatted
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
              <Text style={styles.title}>Select Player Location</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Location Summary Breadcrumb */}
          <View style={styles.breadcrumbBadge}>
            <Text style={styles.breadcrumbFlag}>{selectedCountry.flag}</Text>
            <Text style={styles.breadcrumbText} numberOfLines={1}>
              {selectedCountry.name} ➜ {selectedState} ➜ {selectedDistrict} ➜ {customVillageText.trim() || selectedVillage || 'Select Village'}
            </Text>
          </View>

          <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {/* 1. COUNTRY DROPDOWN */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>1. COUNTRY</Text>
              <TouchableOpacity
                onPress={() => {
                  setSubSearchQuery('');
                  setActivePicker('country');
                }}
                activeOpacity={0.7}
                style={styles.dropdownBtn}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ fontSize: 18 }}>{selectedCountry.flag}</Text>
                  <Text style={styles.dropdownValueText}>{selectedCountry.name}</Text>
                </View>
                <Ionicons name="chevron-down" size={16} color="#0284C7" />
              </TouchableOpacity>
            </View>

            {/* 2. STATE DROPDOWN */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>2. STATE / PROVINCE</Text>
              <TouchableOpacity
                onPress={() => {
                  setSubSearchQuery('');
                  setActivePicker('state');
                }}
                activeOpacity={0.7}
                style={styles.dropdownBtn}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="map-outline" size={16} color="#0284C7" />
                  <Text style={styles.dropdownValueText}>{selectedState}</Text>
                </View>
                <Ionicons name="chevron-down" size={16} color="#0284C7" />
              </TouchableOpacity>
            </View>

            {/* 3. DISTRICT DROPDOWN */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>3. DISTRICT</Text>
              <TouchableOpacity
                onPress={() => {
                  setSubSearchQuery('');
                  setActivePicker('district');
                }}
                activeOpacity={0.7}
                style={styles.dropdownBtn}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="business-outline" size={16} color="#0284C7" />
                  <Text style={styles.dropdownValueText}>{selectedDistrict}</Text>
                </View>
                <Ionicons name="chevron-down" size={16} color="#0284C7" />
              </TouchableOpacity>
            </View>

            {/* 4. VILLAGE / CITY / GROUND SELECTOR */}
            <View style={styles.fieldGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.fieldLabel}>4. VILLAGE, CITY OR GROUND</Text>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedVillage(selectedDistrict);
                    setCustomVillageText('');
                  }}
                >
                  <Text style={styles.cityDirectTag}>I live in {selectedDistrict} City</Text>
                </TouchableOpacity>
              </View>

              {/* Quick Village Chips Grid */}
              {availableVillages.length > 0 && (
                <View style={styles.villageChipsGrid}>
                  {availableVillages.map(v => {
                    const active = (selectedVillage === v && !customVillageText.trim());
                    return (
                      <TouchableOpacity
                        key={v}
                        onPress={() => {
                          setSelectedVillage(v);
                          setCustomVillageText('');
                        }}
                        style={[styles.villageChip, active && styles.villageChipActive]}
                      >
                        <Text style={[styles.villageChipText, active && styles.villageChipTextActive]}>
                          {v}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Custom Village / Ground Input */}
              <View style={styles.customVillageRow}>
                <TextInput
                  style={styles.customVillageInput}
                  value={customVillageText}
                  onChangeText={(txt) => {
                    setCustomVillageText(txt);
                    if (txt) setSelectedVillage(txt);
                  }}
                  placeholder={`Or type custom village/ground in ${selectedDistrict}...`}
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>
          </ScrollView>

          {/* Footer Save Button */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
              <Text style={styles.saveText}>Save Location</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>

      {/* SUB-PICKER POPUP SHEET (COUNTRY, STATE, DISTRICT) */}
      <Modal visible={Boolean(activePicker)} transparent animationType="fade" onRequestClose={() => setActivePicker(null)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setActivePicker(null)} style={styles.subBackdrop}>
          <TouchableOpacity activeOpacity={1} style={styles.subCard}>
            {/* Header */}
            <View style={styles.subHeader}>
              <Text style={styles.subTitle}>
                Select {activePicker === 'country' ? 'Country' : activePicker === 'state' ? 'State' : 'District'}
              </Text>
              <TouchableOpacity onPress={() => setActivePicker(null)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.subSearchBar}>
              <Ionicons name="search" size={16} color="#64748B" />
              <TextInput
                style={styles.subSearchInput}
                placeholder={`Search ${activePicker}...`}
                placeholderTextColor="#94A3B8"
                value={subSearchQuery}
                onChangeText={setSubSearchQuery}
                autoCapitalize="words"
              />
              {subSearchQuery ? (
                <TouchableOpacity onPress={() => setSubSearchQuery('')}>
                  <Ionicons name="close-circle" size={15} color="#94A3B8" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* List */}
            <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              {activePicker === 'country' && filteredCountries.map(c => {
                const active = selectedCountry.code === c.code;
                return (
                  <TouchableOpacity
                    key={c.code}
                    onPress={() => {
                      setSelectedCountry(c);
                      setActivePicker(null);
                    }}
                    style={[styles.itemRow, active && styles.itemRowActive]}
                  >
                    <Text style={{ fontSize: 18 }}>{c.flag}</Text>
                    <Text style={[styles.itemRowText, active && styles.itemRowTextActive]}>{c.name}</Text>
                    {active && <Ionicons name="checkmark-circle" size={18} color="#0284C7" />}
                  </TouchableOpacity>
                );
              })}

              {activePicker === 'state' && filteredStates.map(s => {
                const active = selectedState === s.state;
                return (
                  <TouchableOpacity
                    key={s.state}
                    onPress={() => {
                      setSelectedState(s.state);
                      const firstDist = s.districts[0] || '';
                      setSelectedDistrict(firstDist);
                      setSelectedVillage(POPULAR_VILLAGES_BY_DISTRICT[firstDist]?.[0] || firstDist);
                      setActivePicker(null);
                    }}
                    style={[styles.itemRow, active && styles.itemRowActive]}
                  >
                    <Ionicons name="map" size={16} color={active ? '#0284C7' : '#64748B'} />
                    <Text style={[styles.itemRowText, active && styles.itemRowTextActive]}>{s.state}</Text>
                    {active && <Ionicons name="checkmark-circle" size={18} color="#0284C7" />}
                  </TouchableOpacity>
                );
              })}

              {activePicker === 'district' && filteredDistricts.map(d => {
                const active = selectedDistrict === d;
                return (
                  <TouchableOpacity
                    key={d}
                    onPress={() => {
                      setSelectedDistrict(d);
                      setSelectedVillage(POPULAR_VILLAGES_BY_DISTRICT[d]?.[0] || d);
                      setActivePicker(null);
                    }}
                    style={[styles.itemRow, active && styles.itemRowActive]}
                  >
                    <Ionicons name="business" size={16} color={active ? '#0284C7' : '#64748B'} />
                    <Text style={[styles.itemRowText, active && styles.itemRowTextActive]}>{d}</Text>
                    {active && <Ionicons name="checkmark-circle" size={18} color="#0284C7" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
    gap: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    maxHeight: '90%'
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
  breadcrumbBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD'
  },
  breadcrumbFlag: {
    fontSize: 15
  },
  breadcrumbText: {
    fontSize: 11.5,
    fontFamily: systemFontBold,
    color: '#0284C7',
    flex: 1
  },
  fieldGroup: {
    gap: 6
  },
  fieldLabel: {
    fontSize: 10.5,
    fontFamily: systemFontBold,
    color: '#64748B',
    letterSpacing: 0.5
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  dropdownValueText: {
    fontSize: 13.5,
    fontFamily: systemFontMedium,
    color: '#0F172A'
  },
  cityDirectTag: {
    fontSize: 10.5,
    fontFamily: systemFontBold,
    color: '#0284C7'
  },
  villageChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2
  },
  villageChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  villageChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7'
  },
  villageChipText: {
    fontSize: 11.5,
    fontFamily: systemFontMedium,
    color: '#334155'
  },
  villageChipTextActive: {
    color: '#FFFFFF',
    fontFamily: systemFontBold
  },
  customVillageRow: {
    marginTop: 6
  },
  customVillageInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12.5,
    fontFamily: systemFontMedium,
    color: '#0F172A'
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 6
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center'
  },
  cancelText: {
    fontSize: 13,
    fontFamily: systemFontMedium,
    color: '#64748B'
  },
  saveBtn: {
    flex: 1.6,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#0284C7',
    alignItems: 'center'
  },
  saveText: {
    fontSize: 13,
    fontFamily: systemFontBold,
    color: '#FFFFFF'
  },
  subBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  subCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    elevation: 8
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8
  },
  subTitle: {
    fontSize: 15,
    fontFamily: systemFontBold,
    color: '#0F172A'
  },
  subSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6
  },
  subSearchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: systemFontMedium,
    color: '#0F172A',
    padding: 0
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 10
  },
  itemRowActive: {
    backgroundColor: '#F0F9FF'
  },
  itemRowText: {
    fontSize: 13.5,
    fontFamily: systemFontMedium,
    color: '#334155',
    flex: 1
  },
  itemRowTextActive: {
    color: '#0284C7',
    fontFamily: systemFontBold
  }
});
