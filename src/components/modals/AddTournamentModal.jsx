import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
  Alert,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { systemFont, systemFontMedium, systemFontBold } from '../../theme.js';

export function AddTournamentModal({
  visible,
  onClose,
  onSubmitTournament
}) {
  // Form States
  const [bannerUri, setBannerUri] = useState(null);
  const [logoUri, setLogoUri] = useState(null);

  const [tName, setTName] = useState('');
  const [city, setCity] = useState('Nagaur');
  const [ground, setGround] = useState('');
  const [organiserName, setOrganiserName] = useState('Bastiram Vishwakarma');
  const [organiserNumber, setOrganiserNumber] = useState('9983228208');
  const [organiserEmail, setOrganiserEmail] = useState('bastisuthar@gmail.com');

  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  const [category, setCategory] = useState('OPEN'); // OPEN | CORPORATE | COMMUNITY | SCHOOL | OTHER | SERIES | COLLEGE | UNIVERSITY
  const [ballType, setBallType] = useState('Tennis'); // Tennis | Leather | Other
  const [pitchType, setPitchType] = useState('ROUGH'); // ROUGH | CEMENT | TURF | ASTROTURF | MATTING
  const [matchType, setMatchType] = useState('Limited Overs'); // Limited Overs | Box/Turf Cricket | Pair Cricket | Test Match | The Hundred

  const [teamsInput, setTeamsInput] = useState('Sadokan Tigers, Kings 11 Sadokan, Nagaur XI, Desert Strikers');
  const [needMoreTeams, setNeedMoreTeams] = useState(false);
  const [needOfficials, setNeedOfficials] = useState(false);

  const categories = ['OPEN', 'CORPORATE', 'COMMUNITY', 'SCHOOL', 'OTHER', 'SERIES', 'COLLEGE', 'UNIVERSITY'];
  const pitchTypes = ['ROUGH', 'CEMENT', 'TURF', 'ASTROTURF', 'MATTING'];
  const matchTypes = ['Limited Overs', 'Box/Turf Cricket', 'Pair Cricket', 'Test Match', 'The Hundred'];

  const handleSubmit = () => {
    if (!tName.trim()) {
      Alert.alert('Required Field', 'Please enter a Tournament / Series Name.');
      return;
    }
    if (!city.trim()) {
      Alert.alert('Required Field', 'Please enter a City.');
      return;
    }
    if (!organiserName.trim() || !organiserNumber.trim()) {
      Alert.alert('Required Field', 'Please provide Organiser Name and Phone Number.');
      return;
    }

    const parsedTeams = teamsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const finalTeams = parsedTeams.length >= 2 
      ? parsedTeams 
      : ['Sadokan Tigers', 'Kings 11 Sadokan', 'Nagaur XI', 'Desert Strikers'];

    // Generate Round Robin Fixtures
    const generatedFixtures = [];
    let fixId = 1;
    for (let i = 0; i < finalTeams.length; i++) {
      for (let j = i + 1; j < finalTeams.length; j++) {
        generatedFixtures.push({
          id: `fixture-${Date.now()}-${fixId++}`,
          team1: finalTeams[i],
          team2: finalTeams[j],
          status: 'UPCOMING',
          venue: ground.trim() || 'Local Ground',
          dateText: 'Scheduled'
        });
      }
    }

    const newTourney = {
      id: `tourney-${Date.now()}`,
      name: tName.trim(),
      city: city.trim(),
      ground: ground.trim() || 'Local Ground',
      organiserName: organiserName.trim(),
      organiserNumber: organiserNumber.trim(),
      organiserEmail: organiserEmail.trim(),
      startDate,
      endDate,
      category,
      ballType,
      pitchType,
      matchType,
      needMoreTeams,
      needOfficials,
      teams: finalTeams,
      teamsCount: finalTeams.length,
      fixtures: generatedFixtures,
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    if (typeof onSubmitTournament === 'function') {
      onSubmitTournament(newTourney);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#071B2C" />

        {/* CricFlow Dark Stadium Header */}
        <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Add a tournament / series</Text>

            <TouchableOpacity onPress={handleSubmit} style={styles.nextIconBtn} activeOpacity={0.7}>
              <Ionicons name="play" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Banner & Logo Section */}
          <View style={styles.mediaUploadSection}>
            <TouchableOpacity
              style={styles.bannerBox}
              activeOpacity={0.8}
              onPress={() => Alert.alert('Add Banner', 'Image picker triggered')}
            >
              {bannerUri ? (
                <Image source={{ uri: bannerUri }} style={styles.bannerImage} />
              ) : (
                <View style={styles.bannerPlaceholder}>
                  <View style={styles.cameraCircle}>
                    <Ionicons name="camera-outline" size={20} color="#DC2626" />
                  </View>
                  <Text style={styles.mediaLabelText}>Add banner</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Circular Logo Picker Overlay */}
            <TouchableOpacity
              style={styles.logoCircleWrapper}
              activeOpacity={0.8}
              onPress={() => Alert.alert('Add Logo', 'Logo image picker triggered')}
            >
              {logoUri ? (
                <Image source={{ uri: logoUri }} style={styles.logoImage} />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Ionicons name="person-outline" size={22} color="#94A3B8" />
                  <View style={styles.logoCameraBadge}>
                    <Ionicons name="camera-outline" size={10} color="#FFFFFF" />
                  </View>
                </View>
              )}
              <Text style={styles.logoSubLabelText}>Add logo</Text>
            </TouchableOpacity>
          </View>

          {/* Form Inputs Group */}
          <View style={styles.formGroup}>
            {/* Tournament / Series Name */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Tournament / series name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter tournament name"
                placeholderTextColor="#94A3B8"
                value={tName}
                onChangeText={setTName}
              />
            </View>

            {/* City */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>City *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Nagaur"
                placeholderTextColor="#94A3B8"
                value={city}
                onChangeText={setCity}
              />
            </View>

            {/* Ground */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Ground ^</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter ground / venue name"
                placeholderTextColor="#94A3B8"
                value={ground}
                onChangeText={setGround}
              />
            </View>

            {/* Participating Teams */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Participating Teams (comma separated) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Team A, Team B, Team C, Team D"
                placeholderTextColor="#94A3B8"
                value={teamsInput}
                onChangeText={setTeamsInput}
              />
              <Text style={styles.helperNote}>
                Enter team names separated by commas. Fixtures will be generated automatically.
              </Text>
            </View>

            {/* Organiser Name */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Organiser name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter organiser name"
                placeholderTextColor="#94A3B8"
                value={organiserName}
                onChangeText={setOrganiserName}
              />
            </View>

            {/* Organiser Number */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Organiser number *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter mobile number"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                value={organiserNumber}
                onChangeText={setOrganiserNumber}
              />
            </View>

            {/* Organiser Email */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Organiser email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter email address"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                value={organiserEmail}
                onChangeText={setOrganiserEmail}
              />
              <Text style={styles.helperNote}>
                *Get updated with CricFlow offers and help updates on mail.
              </Text>
            </View>
          </View>

          {/* Tournament Dates */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeaderTitle}>Tournament dates</Text>
            <View style={styles.datesRow}>
              <View style={[styles.inputWrapper, { flex: 1 }]}>
                <Text style={styles.label}>Start date *</Text>
                <View style={styles.dateInputBox}>
                  <TextInput
                    style={styles.dateText}
                    value={startDate}
                    onChangeText={setStartDate}
                  />
                  <Ionicons name="calendar-outline" size={16} color="#64748B" />
                </View>
              </View>

              <View style={[styles.inputWrapper, { flex: 1 }]}>
                <Text style={styles.label}>End date *</Text>
                <View style={styles.dateInputBox}>
                  <TextInput
                    style={styles.dateText}
                    value={endDate}
                    onChangeText={setEndDate}
                  />
                  <Ionicons name="calendar-outline" size={16} color="#64748B" />
                </View>
              </View>
            </View>
          </View>

          {/* Tournament Category Chips */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeaderTitle}>Tournament category *</Text>
            <View style={styles.chipsWrap}>
              {categories.map((cat) => {
                const isActive = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.chip, isActive && styles.chipActive]}
                    activeOpacity={0.8}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Select Ball Type */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeaderTitle}>Select ball type *</Text>
            <View style={styles.ballTypesRow}>
              {/* Tennis */}
              <TouchableOpacity
                style={styles.ballOption}
                activeOpacity={0.8}
                onPress={() => setBallType('Tennis')}
              >
                <View style={[styles.ballCircle, ballType === 'Tennis' && styles.ballCircleTennisActive]}>
                  {ballType === 'Tennis' ? (
                    <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  ) : (
                    <MaterialCommunityIcons name="tennis-ball" size={22} color="#16A34A" />
                  )}
                </View>
                <Text style={[styles.ballLabel, ballType === 'Tennis' && styles.ballLabelActive]}>Tennis</Text>
              </TouchableOpacity>

              {/* Leather */}
              <TouchableOpacity
                style={styles.ballOption}
                activeOpacity={0.8}
                onPress={() => setBallType('Leather')}
              >
                <View style={[styles.ballCircle, styles.ballCircleLeather, ballType === 'Leather' && styles.ballCircleActiveBorder]}>
                  {ballType === 'Leather' && (
                    <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  )}
                </View>
                <Text style={[styles.ballLabel, ballType === 'Leather' && styles.ballLabelActive]}>Leather</Text>
              </TouchableOpacity>

              {/* Other */}
              <TouchableOpacity
                style={styles.ballOption}
                activeOpacity={0.8}
                onPress={() => setBallType('Other')}
              >
                <View style={[styles.ballCircle, styles.ballCircleOther, ballType === 'Other' && styles.ballCircleActiveBorder]}>
                  {ballType === 'Other' && (
                    <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  )}
                </View>
                <Text style={[styles.ballLabel, ballType === 'Other' && styles.ballLabelActive]}>Other</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Pitch Type Chips */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeaderTitle}>Pitch type</Text>
            <View style={styles.chipsWrap}>
              {pitchTypes.map((pt) => {
                const isActive = pitchType === pt;
                return (
                  <TouchableOpacity
                    key={pt}
                    style={[styles.chip, isActive && styles.chipActive]}
                    activeOpacity={0.8}
                    onPress={() => setPitchType(pt)}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {pt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Match Type Chips */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeaderTitle}>Match type *</Text>
            <View style={styles.chipsWrap}>
              {matchTypes.map((mt) => {
                const isActive = matchType === mt;
                return (
                  <TouchableOpacity
                    key={mt}
                    style={[styles.chip, isActive && styles.chipActive]}
                    activeOpacity={0.8}
                    onPress={() => setMatchType(mt)}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {mt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Checkboxes / Toggles */}
          <View style={styles.checkboxesGroup}>
            <TouchableOpacity
              style={styles.checkboxRow}
              activeOpacity={0.8}
              onPress={() => setNeedMoreTeams(!needMoreTeams)}
            >
              <View style={[styles.checkboxBox, needMoreTeams && styles.checkboxBoxActive]}>
                {needMoreTeams && <Ionicons name="checkmark" size={14} color="#0284C7" />}
              </View>
              <Text style={styles.checkboxText}>Do you need more teams for your tournament?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkboxRow}
              activeOpacity={0.8}
              onPress={() => setNeedOfficials(!needOfficials)}
            >
              <View style={[styles.checkboxBox, needOfficials && styles.checkboxBoxActive]}>
                {needOfficials && <Ionicons name="checkmark" size={14} color="#0284C7" />}
              </View>
              <Text style={styles.checkboxText}>Do you need officials? (e.g. Umpire, Scorer)</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Bottom CTA Bar */}
        <SafeAreaView edges={['bottom']} style={styles.bottomBarWrapper}>
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.submitBtn}
              activeOpacity={0.85}
              onPress={handleSubmit}
            >
              <Text style={styles.submitBtnText}>Next</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  headerSafeArea: {
    backgroundColor: '#071B2C'
  },
  header: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justify: 'space-between',
    backgroundColor: '#071B2C'
  },
  backBtn: {
    padding: 6
  },
  headerTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: systemFontBold,
    flex: 1,
    marginLeft: 12
  },
  nextIconBtn: {
    padding: 6
  },
  scroll: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    gap: 20
  },
  mediaUploadSection: {
    alignItems: 'center',
    marginBottom: 10
  },
  bannerBox: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justify: 'center',
    overflow: 'hidden'
  },
  bannerPlaceholder: {
    alignItems: 'center',
    gap: 6
  },
  cameraCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justify: 'center'
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
  mediaLabelText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: systemFontMedium
  },
  logoCircleWrapper: {
    marginTop: -28,
    alignItems: 'center'
  },
  logoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F1F5F9',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justify: 'center',
    position: 'relative'
  },
  logoCameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justify: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF'
  },
  logoImage: {
    width: 60,
    height: 60,
    borderRadius: 30
  },
  logoSubLabelText: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: systemFontMedium,
    marginTop: 4
  },
  formGroup: {
    gap: 16
  },
  inputWrapper: {
    gap: 4
  },
  label: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: systemFontMedium
  },
  input: {
    height: 44,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    fontSize: 14,
    color: '#0F172A',
    fontFamily: systemFontMedium,
    paddingVertical: 6
  },
  helperNote: {
    fontSize: 10,
    color: '#94A3B8',
    fontFamily: systemFontMedium,
    marginTop: 2
  },
  sectionContainer: {
    gap: 10
  },
  sectionHeaderTitle: {
    fontSize: 13,
    color: '#0F172A',
    fontFamily: systemFontBold
  },
  datesRow: {
    flexDirection: 'row',
    gap: 14
  },
  dateInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justify: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    height: 44
  },
  dateText: {
    fontSize: 13,
    color: '#0F172A',
    fontFamily: systemFontMedium,
    flex: 1
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  chipActive: {
    backgroundColor: '#071B2C',
    borderColor: '#071B2C'
  },
  chipText: {
    fontSize: 11,
    color: '#475569',
    fontFamily: systemFontBold
  },
  chipTextActive: {
    color: '#FFFFFF'
  },
  ballTypesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginTop: 4
  },
  ballOption: {
    alignItems: 'center',
    gap: 6
  },
  ballCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justify: 'center'
  },
  ballCircleTennisActive: {
    backgroundColor: '#0D9488'
  },
  ballCircleLeather: {
    backgroundColor: '#DC2626'
  },
  ballCircleOther: {
    backgroundColor: '#EAB308'
  },
  ballCircleActiveBorder: {
    borderWidth: 3,
    borderColor: '#0284C7'
  },
  ballLabel: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: systemFontMedium
  },
  ballLabelActive: {
    color: '#0F172A',
    fontFamily: systemFontBold
  },
  checkboxesGroup: {
    gap: 12,
    marginTop: 6
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justify: 'center'
  },
  checkboxBoxActive: {
    borderColor: '#0284C7',
    backgroundColor: '#E0F2FE'
  },
  checkboxText: {
    fontSize: 12,
    color: '#475569',
    fontFamily: systemFontMedium,
    flex: 1
  },
  bottomBarWrapper: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0'
  },
  bottomBar: {
    padding: 16
  },
  submitBtn: {
    height: 48,
    borderRadius: 8,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justify: 'center'
  },
  submitBtnText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontFamily: systemFontBold
  }
});
