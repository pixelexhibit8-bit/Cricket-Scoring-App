import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StatusBar,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { systemFont, systemFontMedium, systemFontBold } from '../theme';
import { MatchTabBar } from './MatchTabBar';
import { capitalizeWords } from '../utils/textUtils.js';

const PRESET_LOGOS = [
  { id: 'logo_default', name: 'CricFlow Logo', source: require('../../assets/logo.png') },
  { id: 'team_1', name: 'Team A Logo', source: require('../../assets/default_team_1.png') },
  { id: 'team_2', name: 'Team B Logo', source: require('../../assets/default_team_2.png') },
  { id: 'sadokan_a', name: 'Champions Crest', source: require('../../assets/sadokan_a.png') },
  { id: 'sadokan_b', name: 'Warriors Shield', source: require('../../assets/sadokan_b.png') }
];

export function TeamPickerModal({
  visible,
  targetSlot, // 'team1' | 'team2'
  savedTeams = [],
  opponentTeams = [],
  onSelectTeam,
  onCreateTeam,
  onClose
}) {
  const [activeTab, setActiveTab] = useState('yourTeams'); // 'yourTeams' | 'opponents' | 'add'
  const [searchQuery, setSearchQuery] = useState('');
  const [tabLayouts, setTabLayouts] = useState({});

  // Form state for Create Team (Add tab)
  const [newTeamName, setNewTeamName] = useState('');
  const [newCity, setNewCity] = useState('Nagaur');
  const [captainPhone, setCaptainPhone] = useState('');
  const [captainName, setCaptainName] = useState('');
  const [addSelf, setAddSelf] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState(require('../../assets/logo.png'));
  const [showLogoSelector, setShowLogoSelector] = useState(false);

  const handleAddTeamSubmit = () => {
    const cleanName = newTeamName.trim();
    if (!cleanName) return;

    const newTeamObj = {
      id: 'team_' + Date.now(),
      name: cleanName,
      city: newCity.trim() || 'Nagaur',
      captainPhone: captainPhone.trim(),
      captainName: captainName.trim(),
      addSelf,
      logoUri: selectedLogo
    };

    if (typeof onCreateTeam === 'function') {
      onCreateTeam(newTeamObj, targetSlot);
    }
    // Reset form
    setNewTeamName('');
    setCaptainPhone('');
    setCaptainName('');
    setAddSelf(false);
  };

  const filteredYourTeams = savedTeams.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredOpponents = opponentTeams.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <StatusBar barStyle="light-content" backgroundColor="#071B2C" />
      <SafeAreaView style={styles.container}>
        {/* Header - CricFlow Dark Hero Style */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {activeTab === 'add'
              ? 'Create your team'
              : targetSlot === 'team1'
              ? 'Select Team A'
              : 'Select Team B'}
          </Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Top 3 Shared MatchTabBar Primitive */}
        <View style={{ backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingHorizontal: 12 }}>
          <MatchTabBar
            tabs={[
              { id: 'yourTeams', label: 'Your teams' },
              { id: 'opponents', label: 'Opponents' },
              { id: 'add', label: 'Add' }
            ]}
            activeTab={activeTab}
            onPress={(tabId) => setActiveTab(tabId)}
            layouts={tabLayouts}
            onTabLayout={(key, event) => {
              const { x, width } = event.nativeEvent.layout;
              setTabLayouts(prev => ({ ...prev, [key]: { x, width } }));
            }}
          />
        </View>

        {/* Tab 1: Your Teams */}
        {activeTab === 'yourTeams' && (
          <ScrollView style={styles.content} contentContainerStyle={{ padding: 16, gap: 12 }}>
            {filteredYourTeams.length > 0 ? (
              filteredYourTeams.map(team => (
                <TouchableOpacity
                  key={team.id || team.name}
                  style={styles.teamCard}
                  onPress={() => onSelectTeam(team, targetSlot)}
                  activeOpacity={0.8}
                >
                  <View style={styles.teamAvatar}>
                    <MaterialCommunityIcons name="shield-account" size={24} color="#0284C7" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.teamCardName}>{team.name}</Text>
                    <Text style={styles.teamCardSub}>{team.city || 'Nagaur'}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyBox}>
                <MaterialCommunityIcons name="account-group-outline" size={56} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No Saved Teams Yet</Text>
                <Text style={styles.emptySub}>
                  Create your team to get started with live ball-by-ball scoring.
                </Text>
                <TouchableOpacity
                  style={styles.primaryPillBtn}
                  onPress={() => setActiveTab('add')}
                >
                  <Text style={styles.primaryPillText}>Create your team</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}

        {/* Tab 2: Opponents */}
        {activeTab === 'opponents' && (
          <ScrollView style={styles.content} contentContainerStyle={{ padding: 16, gap: 12 }}>
            {filteredOpponents.length > 0 ? (
              filteredOpponents.map(team => (
                <TouchableOpacity
                  key={team.id || team.name}
                  style={styles.teamCard}
                  onPress={() => onSelectTeam(team, targetSlot)}
                  activeOpacity={0.8}
                >
                  <View style={styles.teamAvatarOpponent}>
                    <MaterialCommunityIcons name="shield-account" size={24} color="#E11D48" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.teamCardName}>{team.name}</Text>
                    <Text style={styles.teamCardSub}>{team.city || 'Nagaur'}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyBox}>
                <Ionicons name="people-outline" size={60} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No Opponents Yet</Text>
                <Text style={styles.emptySub}>
                  You haven't played a match yet. Start one now and your opponent teams will appear here automatically.
                </Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                  <TouchableOpacity style={styles.outlineBtn} onPress={() => {}}>
                    <Text style={styles.outlineBtnText}>Need help?</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.primaryPillBtn}
                    onPress={() => setActiveTab('add')}
                  >
                    <Text style={styles.primaryPillText}>Create your team</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        )}

        {/* Tab 3: Add (Create Your Team) */}
        {activeTab === 'add' && (
          <View style={{ flex: 1 }}>
            <ScrollView style={styles.content} contentContainerStyle={{ padding: 16, gap: 16 }}>
              <View style={styles.formCard}>
                {/* Team Logo Picker Box */}
                <TouchableOpacity
                  style={styles.logoPickerBox}
                  activeOpacity={0.85}
                  onPress={() => setShowLogoSelector(true)}
                >
                  <View style={styles.logoWrapper}>
                    <View style={styles.logoCircle}>
                      <Image
                        source={selectedLogo}
                        style={styles.logoImage}
                        resizeMode="contain"
                      />
                    </View>
                    <View style={styles.pencilBadge}>
                      <Ionicons name="pencil" size={13} color="#FFFFFF" />
                    </View>
                  </View>
                  <Text style={styles.logoLabel}>Team logo</Text>
                </TouchableOpacity>

                {/* Team Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>Team name *</Text>
                  <TextInput
                    style={styles.lineInput}
                    value={newTeamName}
                    onChangeText={(t) => setNewTeamName(capitalizeWords(t))}
                    placeholder="Enter team name"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="words"
                  />
                </View>

                {/* City / Town */}
                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>City / town *</Text>
                  <TextInput
                    style={styles.lineInput}
                    value={newCity}
                    onChangeText={(t) => setNewCity(capitalizeWords(t))}
                    placeholder="Nagaur"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="words"
                  />
                </View>

                {/* Captain Phone */}
                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>+91 Team captain/coordinator number (optional)</Text>
                  <TextInput
                    style={styles.lineInput}
                    value={captainPhone}
                    onChangeText={setCaptainPhone}
                    keyboardType="phone-pad"
                    maxLength={10}
                    placeholder="10 digit mobile number"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                {/* Captain Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>Team captain name (optional)</Text>
                  <TextInput
                    style={styles.lineInput}
                    value={captainName}
                    onChangeText={(t) => setCaptainName(capitalizeWords(t))}
                    placeholder="Captain name"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="words"
                  />
                </View>

                {/* Checkbox: Add yourself */}
                <TouchableOpacity
                  style={styles.checkboxRow}
                  activeOpacity={0.8}
                  onPress={() => setAddSelf(!addSelf)}
                >
                  <MaterialCommunityIcons
                    name={addSelf ? 'checkbox-marked-outline' : 'checkbox-blank-outline'}
                    size={20}
                    color={addSelf ? '#0284C7' : '#94A3B8'}
                  />
                  <Text style={styles.checkboxLabel}>Add yourself in the team</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Bottom Full-width Add Team Button */}
            <View style={styles.bottomBar}>
              <TouchableOpacity
                style={[
                  styles.addTeamSubmitBtn,
                  !newTeamName.trim() && { backgroundColor: '#94A3B8' }
                ]}
                activeOpacity={0.8}
                disabled={!newTeamName.trim()}
                onPress={handleAddTeamSubmit}
              >
                <Text style={styles.addTeamSubmitText}>Add team</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* LOGO SELECTION MODAL */}
        <Modal
          visible={showLogoSelector}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowLogoSelector(false)}
        >
          <View style={styles.logoModalOverlay}>
            <View style={styles.logoModalContent}>
              <View style={styles.logoModalHeader}>
                <Text style={styles.logoModalTitle}>Select Team Logo</Text>
                <TouchableOpacity onPress={() => setShowLogoSelector(false)}>
                  <Ionicons name="close" size={22} color="#0F172A" />
                </TouchableOpacity>
              </View>

              <View style={styles.logoGrid}>
                {PRESET_LOGOS.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.logoItem,
                      selectedLogo === item.source && styles.logoItemActive
                    ]}
                    onPress={() => {
                      setSelectedLogo(item.source);
                      setShowLogoSelector(false);
                    }}
                  >
                    <Image source={item.source} style={{ width: 44, height: 44 }} resizeMode="contain" />
                    <Text style={styles.logoItemText}>{item.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EBF0F5'
  },
  header: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justify: 'space-between',
    backgroundColor: '#071B2C',
    borderBottomWidth: 1,
    borderBottomColor: '#123A56'
  },
  backBtn: {
    padding: 4
  },
  headerTitle: {
    fontSize: 17,
    color: '#FFFFFF',
    fontFamily: systemFontBold
  },
  content: {
    flex: 1
  },
  teamCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  teamAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justify: 'center',
    borderWidth: 1,
    borderColor: '#BAE6FD'
  },
  teamAvatarOpponent: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justify: 'center',
    borderWidth: 1,
    borderColor: '#FECDD3'
  },
  teamCardName: {
    fontSize: 15,
    color: '#0F172A',
    fontFamily: systemFontBold
  },
  teamCardSub: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: systemFontMedium,
    marginTop: 1
  },
  emptyBox: {
    alignItems: 'center',
    justify: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
    gap: 10
  },
  emptyTitle: {
    fontSize: 15,
    color: '#0F172A',
    fontFamily: systemFontBold,
    marginTop: 8
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: systemFontMedium,
    textAlign: 'center',
    lineHeight: 18
  },
  primaryPillBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8
  },
  primaryPillText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: systemFontBold
  },
  outlineBtn: {
    borderWidth: 1.5,
    borderColor: '#0284C7',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8
  },
  outlineBtnText: {
    fontSize: 12,
    color: '#0284C7',
    fontFamily: systemFontBold
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 16
  },
  logoPickerBox: {
    alignItems: 'center',
    paddingVertical: 4,
    gap: 6
  },
  logoWrapper: {
    width: 80,
    height: 80,
    position: 'relative',
    alignSelf: 'center'
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    alignItems: 'center',
    justify: 'center',
    backgroundColor: '#F0F9FF',
    overflow: 'hidden'
  },
  logoImage: {
    width: 52,
    height: 52,
    alignSelf: 'center'
  },
  pencilBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#0284C7',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justify: 'center',
    zIndex: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3
  },
  logoLabel: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: systemFontMedium,
    marginTop: 4
  },
  inputGroup: {
    gap: 4
  },
  fieldLabel: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: systemFontMedium
  },
  lineInput: {
    height: 42,
    borderBottomWidth: 1.5,
    borderBottomColor: '#CBD5E1',
    fontSize: 14,
    color: '#0F172A',
    fontFamily: systemFontBold
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8
  },
  checkboxLabel: {
    fontSize: 12,
    color: '#475569',
    fontFamily: systemFontMedium
  },
  bottomBar: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0'
  },
  addTeamSubmitBtn: {
    height: 48,
    borderRadius: 10,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justify: 'center'
  },
  addTeamSubmitText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: systemFontBold
  },
  logoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justify: 'center',
    padding: 20
  },
  logoModalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 16
  },
  logoModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justify: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 10
  },
  logoModalTitle: {
    fontSize: 16,
    color: '#0F172A',
    fontFamily: systemFontBold
  },
  logoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justify: 'space-around'
  },
  logoItem: {
    width: '28%',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    gap: 6
  },
  logoItemActive: {
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF'
  },
  logoItemText: {
    fontSize: 10,
    color: '#0F172A',
    fontFamily: systemFontBold,
    textAlign: 'center'
  }
});
