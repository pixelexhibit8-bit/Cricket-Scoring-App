import React, { useState, useMemo } from 'react';
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

// Popular Indian States & Districts (with focus on Rajasthan & Local Grounds)
const INDIAN_STATES_DATA = [
  {
    state: 'Rajasthan',
    districts: [
      {
        name: 'Nagaur',
        villages: ['Sadokan', 'Deh', 'Jayal', 'Merta', 'Kuchaman', 'Didwana', 'Ladnun', 'Makrana', 'Riyan Badi', 'Degana', 'Parbatsar', 'Khinwsar', 'Mundwa', 'Gachhipura']
      },
      {
        name: 'Jodhpur',
        villages: ['Jodhpur City', 'Piparcity', 'Bilara', 'Osian', 'Bhopalgarh', 'Luni', 'Phalodi', 'Shergarh', 'Balesar']
      },
      {
        name: 'Jaipur',
        villages: ['Jaipur City', 'Chomu', 'Amer', 'Sanganer', 'Kotputli', 'Shahpura', 'Dudu', 'Phulera', 'Chaksu']
      },
      {
        name: 'Bikaner',
        villages: ['Bikaner City', 'Nokha', 'Kolayat', 'Lunkaransar', 'Khajuwala', 'Dungargarh', 'Chhatargarh']
      },
      {
        name: 'Ajmer',
        villages: ['Ajmer City', 'Kishangarh', 'Beawar', 'Pushkar', 'Nasirabad', 'Kekri', 'Sarwar']
      },
      {
        name: 'Sikar',
        villages: ['Sikar City', 'Neem Ka Thana', 'Fatehpur', 'Laxmangarh', 'Danta Ramgarh', 'Sri Madhopur']
      },
      {
        name: 'Pali',
        villages: ['Pali City', 'Sojat', 'Jaitaran', 'Bali', 'Desuri', 'Rani', 'Rohat', 'Sumerpur']
      },
      {
        name: 'Churu',
        villages: ['Churu City', 'Ratangarh', 'Sujangarh', 'Sardarshahar', 'Rajgarh', 'Taranagar', 'Bidasar']
      },
      {
        name: 'Jhunjhunu',
        villages: ['Jhunjhunu City', 'Nawalgarh', 'Khetri', 'Chirawa', 'Buhana', 'Udaipurwati']
      },
      {
        name: 'Udaipur',
        villages: ['Udaipur City', 'Mavli', 'Vallabhnagar', 'Salumber', 'Kherwara', 'Gogunda']
      }
    ]
  },
  {
    state: 'Gujarat',
    districts: [
      { name: 'Ahmedabad', villages: ['Ahmedabad City', 'Sanand', 'Dholka', 'Viramgam'] },
      { name: 'Surat', villages: ['Surat City', 'Bardoli', 'Mandvi', 'Kamrej'] },
      { name: 'Rajkot', villages: ['Rajkot City', 'Gondal', 'Jetpur', 'Dhoraji'] },
      { name: 'Vadodara', villages: ['Vadodara City', 'Padra', 'Dabhoi', 'Karjan'] }
    ]
  },
  {
    state: 'Delhi (NCR)',
    districts: [
      { name: 'Central Delhi', villages: ['Connaught Place', 'Karol Bagh', 'Pahar Ganj'] },
      { name: 'South Delhi', villages: ['Saket', 'Hauz Khas', 'Greater Kailash'] },
      { name: 'North Delhi', villages: ['Model Town', 'Civil Lines', 'Rohini'] },
      { name: 'West Delhi', villages: ['Janakpuri', 'Rajouri Garden', 'Dwarka'] }
    ]
  },
  {
    state: 'Haryana',
    districts: [
      { name: 'Gurugram', villages: ['Gurugram City', 'Sohna', 'Pataudi', 'Manesar'] },
      { name: 'Faridabad', villages: ['Faridabad City', 'Ballabgarh', 'NIT'] },
      { name: 'Hisar', villages: ['Hisar City', 'Hansi', 'Barwala', 'Adampur'] },
      { name: 'Rohtak', villages: ['Rohtak City', 'Meham', 'Sampla', 'Kalanaur'] }
    ]
  },
  {
    state: 'Punjab',
    districts: [
      { name: 'Ludhiana', villages: ['Ludhiana City', 'Khanna', 'Jagraon', 'Samrala'] },
      { name: 'Amritsar', villages: ['Amritsar City', 'Ajnala', 'Baba Bakala'] },
      { name: 'Patiala', villages: ['Patiala City', 'Nabha', 'Rajpura', 'Samana'] }
    ]
  },
  {
    state: 'Uttar Pradesh',
    districts: [
      { name: 'Noida / G.B. Nagar', villages: ['Noida City', 'Greater Noida', 'Dadri', 'Jewar'] },
      { name: 'Lucknow', villages: ['Lucknow City', 'Malihabad', 'Mohanlalganj'] },
      { name: 'Agra', villages: ['Agra City', 'Fatehabad', 'Bah', 'Kheragarh'] }
    ]
  },
  {
    state: 'Maharashtra',
    districts: [
      { name: 'Mumbai', villages: ['Mumbai City', 'Andheri', 'Bandra', 'Borivali'] },
      { name: 'Pune', villages: ['Pune City', 'Haveli', 'Baramati', 'Shirur'] }
    ]
  },
  {
    state: 'Madhya Pradesh',
    districts: [
      { name: 'Indore', villages: ['Indore City', 'Mhow', 'Sanwer', 'Depalpur'] },
      { name: 'Bhopal', villages: ['Bhopal City', 'Berasia'] }
    ]
  }
];

export function LocationPickerModal({
  visible,
  currentCity,
  onClose,
  onSelectLocation
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('Rajasthan');
  const [selectedDistrict, setSelectedDistrict] = useState('Nagaur');
  const [customVillageInput, setCustomVillageInput] = useState('');

  // 1. Search Filtering Across Entire Hierarchy
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const results = [];
    INDIAN_STATES_DATA.forEach(st => {
      st.districts.forEach(dist => {
        // Match District
        if (dist.name.toLowerCase().includes(q)) {
          results.push({
            type: 'district',
            display: `${dist.name}, ${st.state}`,
            city: dist.name,
            district: dist.name,
            state: st.state
          });
        }
        // Match Villages
        (dist.villages || []).forEach(v => {
          if (v.toLowerCase().includes(q)) {
            results.push({
              type: 'village',
              display: `${v}, ${dist.name}`,
              city: v,
              district: dist.name,
              state: st.state
            });
          }
        });
      });
    });

    return results.slice(0, 15);
  }, [searchQuery]);

  // Current State & District Objects
  const stateObj = INDIAN_STATES_DATA.find(s => s.state === selectedState) || INDIAN_STATES_DATA[0];
  const districtObj = stateObj?.districts.find(d => d.name === selectedDistrict) || stateObj?.districts[0];

  const handleSelectResult = (item) => {
    onSelectLocation({
      city: item.city,
      district: item.district,
      state: item.state,
      country: 'India',
      formatted: `${item.city}${item.district && item.district !== item.city ? `, ${item.district}` : ''}`
    });
    onClose();
  };

  const handleSelectDistrictDirectly = (distName) => {
    onSelectLocation({
      city: distName,
      district: distName,
      state: selectedState,
      country: 'India',
      formatted: `${distName}, ${selectedState}`
    });
    onClose();
  };

  const handleSelectVillage = (villageName) => {
    onSelectLocation({
      city: villageName,
      district: districtObj.name,
      state: selectedState,
      country: 'India',
      formatted: `${villageName}, ${districtObj.name}`
    });
    onClose();
  };

  const handleApplyCustomVillage = () => {
    const custom = customVillageInput.trim();
    if (!custom) return;
    onSelectLocation({
      city: custom,
      district: districtObj.name,
      state: selectedState,
      country: 'India',
      formatted: `${custom}, ${districtObj.name}`
    });
    setCustomVillageInput('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={styles.backdrop}>
        <TouchableOpacity activeOpacity={1} style={styles.drawerCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="location-outline" size={20} color="#0284C7" />
              <Text style={styles.title}>Select City / Ground Location</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Search Input Bar */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Sadokan, Nagaur, Jaipur, Ground..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="words"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color="#94A3B8" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* SEARCH RESULTS VIEW */}
          {searchQuery ? (
            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionHeading}>MATCHING LOCATIONS</Text>
              {searchResults.length === 0 ? (
                <View style={{ padding: 20, alignItems: 'center', gap: 6 }}>
                  <Text style={{ color: '#64748B', fontSize: 13, fontFamily: systemFontMedium }}>
                    No standard city found for "{searchQuery}"
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      onSelectLocation({
                        city: searchQuery.trim(),
                        district: districtObj.name,
                        state: selectedState,
                        country: 'India',
                        formatted: `${searchQuery.trim()}, ${districtObj.name}`
                      });
                      onClose();
                    }}
                    style={styles.useCustomQueryBtn}
                  >
                    <Text style={styles.useCustomQueryText}>
                      Use "{searchQuery.trim()}" as Custom Ground/Village ➜
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                searchResults.map((item, idx) => (
                  <TouchableOpacity
                    key={`sr-${idx}`}
                    onPress={() => handleSelectResult(item)}
                    style={styles.searchResultItem}
                  >
                    <View style={styles.pinIconWrap}>
                      <Ionicons name="location" size={16} color="#0284C7" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.resultMainText}>{item.display}</Text>
                      <Text style={styles.resultSubText}>{item.state} • India</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          ) : (
            /* STEP-BY-STEP HIERARCHY SELECTOR */
            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              {/* 1. State Selector Horizontal Chips */}
              <Text style={styles.sectionHeading}>SELECT STATE</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
                {INDIAN_STATES_DATA.map(st => {
                  const active = selectedState === st.state;
                  return (
                    <TouchableOpacity
                      key={st.state}
                      onPress={() => {
                        setSelectedState(st.state);
                        setSelectedDistrict(st.districts[0]?.name || '');
                      }}
                      style={[styles.stateChip, active && styles.stateChipActive]}
                    >
                      <Text style={[styles.stateChipText, active && styles.stateChipTextActive]}>
                        {st.state}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* 2. District Selector Chips */}
              <Text style={[styles.sectionHeading, { marginTop: 14 }]}>SELECT DISTRICT IN {selectedState.toUpperCase()}</Text>
              <View style={styles.districtsGrid}>
                {stateObj?.districts.map(dist => {
                  const active = selectedDistrict === dist.name;
                  return (
                    <TouchableOpacity
                      key={dist.name}
                      onPress={() => setSelectedDistrict(dist.name)}
                      style={[styles.distChip, active && styles.distChipActive]}
                    >
                      <Text style={[styles.distChipText, active && styles.distChipTextActive]}>
                        {dist.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 3. Direct District Stop / City Level Button */}
              <TouchableOpacity
                onPress={() => handleSelectDistrictDirectly(selectedDistrict)}
                style={styles.directDistrictBtn}
              >
                <Ionicons name="checkmark-circle-outline" size={16} color="#0284C7" />
                <Text style={styles.directDistrictText}>
                  I live in {selectedDistrict} city directly (Save as "{selectedDistrict}, {selectedState}")
                </Text>
              </TouchableOpacity>

              {/* 4. Villages & Local Grounds in Selected District */}
              <Text style={[styles.sectionHeading, { marginTop: 14 }]}>
                VILLAGES & GROUNDS IN {selectedDistrict.toUpperCase()}
              </Text>
              <View style={styles.villagesGrid}>
                {(districtObj?.villages || []).map(v => (
                  <TouchableOpacity
                    key={v}
                    onPress={() => handleSelectVillage(v)}
                    style={styles.villageChip}
                  >
                    <Ionicons name="flag-outline" size={12} color="#475569" />
                    <Text style={styles.villageChipText}>{v}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 5. Custom Village Input Field */}
              <View style={styles.customVillageBox}>
                <Text style={styles.customVillageLabel}>
                  Village/Ground not in list? Type village name:
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                  <TextInput
                    style={styles.customVillageInput}
                    value={customVillageInput}
                    onChangeText={setCustomVillageInput}
                    placeholder={`e.g. Sadokan Ground, ${selectedDistrict}`}
                    placeholderTextColor="#94A3B8"
                  />
                  <TouchableOpacity
                    onPress={handleApplyCustomVillage}
                    disabled={!customVillageInput.trim()}
                    style={[styles.applyCustomBtn, !customVillageInput.trim() && { backgroundColor: '#CBD5E1' }]}
                  >
                    <Text style={styles.applyCustomText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
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
  drawerCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    paddingBottom: 28,
    gap: 12,
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
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
  sectionHeading: {
    fontSize: 10.5,
    fontFamily: systemFontBold,
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 6
  },
  stateChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  stateChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7'
  },
  stateChipText: {
    fontSize: 12,
    fontFamily: systemFontMedium,
    color: '#475569'
  },
  stateChipTextActive: {
    color: '#FFFFFF',
    fontFamily: systemFontBold
  },
  districtsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  distChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  distChipActive: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0284C7'
  },
  distChipText: {
    fontSize: 12,
    fontFamily: systemFontMedium,
    color: '#334155'
  },
  distChipTextActive: {
    color: '#0284C7',
    fontFamily: systemFontBold
  },
  directDistrictBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginTop: 10
  },
  directDistrictText: {
    fontSize: 11.5,
    fontFamily: systemFontBold,
    color: '#0284C7',
    flex: 1
  },
  villagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  villageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  villageChipText: {
    fontSize: 11.5,
    fontFamily: systemFontMedium,
    color: '#334155'
  },
  customVillageBox: {
    marginTop: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  customVillageLabel: {
    fontSize: 11,
    fontFamily: systemFontMedium,
    color: '#64748B'
  },
  customVillageInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12.5,
    fontFamily: systemFontMedium,
    color: '#0F172A'
  },
  applyCustomBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center'
  },
  applyCustomText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: systemFontBold
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 10
  },
  pinIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  resultMainText: {
    fontSize: 13,
    fontFamily: systemFontBold,
    color: '#0F172A'
  },
  resultSubText: {
    fontSize: 11,
    fontFamily: systemFontMedium,
    color: '#64748B',
    marginTop: 1
  },
  useCustomQueryBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 6
  },
  useCustomQueryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: systemFontBold
  }
});
