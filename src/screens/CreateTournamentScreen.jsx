import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Image,
  StyleSheet,
  StatusBar,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  themeColors,
  systemFont,
  systemFontMedium,
  systemFontBold
} from '../theme.js';
import {
  saveTournament,
  saveHostedTournamentId,
  saveActiveTournamentId
} from '../services/tournamentService.js';
import { useMatch } from '../context/MatchContext.jsx';

export function CreateTournamentScreen(props = {}) {
  const matchCtx = useMatch();
  const {
    navigation = props.navigation,
    onBack = props.onBack || props.onCancel || (() => {
      if (props.navigation && props.navigation.canGoBack()) {
        props.navigation.goBack();
      } else if (matchCtx.setCurrentScreen) {
        matchCtx.setCurrentScreen('home');
      }
    }),
    onComplete = props.onComplete || ((tournamentData) => {
      if (props.navigation) {
        props.navigation.replace('PublicSeriesView', {
          seriesData: tournamentData,
          isOrganiser: true
        });
      } else if (props.navigation && props.navigation.canGoBack()) {
        props.navigation.goBack();
      } else if (matchCtx.setCurrentScreen) {
        matchCtx.setCurrentScreen('home');
      }
    })
  } = props;
  // Stepper State (1 | 2 | 3)
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 State: Overview & Organiser
  const [bannerUri, setBannerUri] = useState(null);
  const [logoUri, setLogoUri] = useState(null);
  const [tournamentName, setTournamentName] = useState('');
  const [city, setCity] = useState('');
  const [organiserName, setOrganiserName] = useState('');
  const [organiserPhone, setOrganiserPhone] = useState('');
  const [organiserEmail, setOrganiserEmail] = useState('');
  const [startDate, setStartDate] = useState('01 Dec 2026');
  const [endDate, setEndDate] = useState('10 Dec 2026');

  // Step 2 State: Match Rules & Format
  const categories = [
    'OPEN', 'CORPORATE', 'COMMUNITY', 'SCHOOL', 'COLLEGE', 'UNIVERSITY', 'SERIES', 'OTHER'
  ];
  const [selectedCategory, setSelectedCategory] = useState('OPEN');

  const ballTypes = [
    { id: 'tennis_red', label: 'Tennis (Red)', icon: 'baseball-outline' },
    { id: 'tennis_green', label: 'Tennis (Green)', icon: 'baseball-outline' },
    { id: 'leather', label: 'Leather', icon: 'baseball' },
    { id: 'plastic_other', label: 'Plastic / Other', icon: 'ellipse-outline' }
  ];
  const [selectedBall, setSelectedBall] = useState('tennis_red');

  const pitchTypes = ['ROUGH', 'CEMENT', 'TURF', 'ASTROTURF', 'MATTING'];
  const [selectedPitch, setSelectedPitch] = useState('TURF');

  const matchFormats = [
    'LIMITED OVERS', 'BOX / TURF CRICKET', 'PAIR CRICKET', 'TEST MATCH', 'THE HUNDRED'
  ];
  const [selectedFormat, setSelectedFormat] = useState('LIMITED OVERS');

  // Step 3 State: Ground Ops, Team Details & Officials
  const [needMoreTeams, setNeedMoreTeams] = useState(true);
  const [entryFee, setEntryFee] = useState('');
  const [totalTeamsCount, setTotalTeamsCount] = useState('');
  const [winningPrizeType, setWinningPrizeType] = useState('BOTH'); // 'CASH' | 'TROPHIES' | 'BOTH'
  const [matchesOnType, setMatchesOnType] = useState('ALL DAYS'); // 'WEEKENDS' | 'WEEKDAYS' | 'ALL DAYS'
  const [matchTimingType, setMatchTimingType] = useState('DAY'); // 'DAY' | 'NIGHT' | 'DAY & NIGHT'
  const [additionalNotes, setAdditionalNotes] = useState('');

  const [informPreviousPlayers, setInformPreviousPlayers] = useState(true);
  const [needOfficials, setNeedOfficials] = useState(true);
  const [selectedOfficialRoles, setSelectedOfficialRoles] = useState(['Scorer', 'Umpire']);
  const [contactPreference, setContactPreference] = useState('Call');
  const [assignedScorerPhone, setAssignedScorerPhone] = useState('');

  // 1-Click Preset Handler
  const applyPreset = (presetType) => {
    if (presetType === 'tennis_10') {
      setSelectedCategory('OPEN');
      setSelectedBall('tennis_red');
      setSelectedPitch('TURF');
      setSelectedFormat('LIMITED OVERS');
      Alert.alert('Preset Applied', 'Local Tennis 10-Over rules loaded in 1-Click.');
    } else if (presetType === 'leather_league') {
      setSelectedCategory('OPEN');
      setSelectedBall('leather');
      setSelectedPitch('MATTING');
      setSelectedFormat('LIMITED OVERS');
      Alert.alert('Preset Applied', 'Leather Ball League rules loaded in 1-Click.');
    } else if (presetType === 'box_turf') {
      setSelectedCategory('CORPORATE');
      setSelectedBall('tennis_green');
      setSelectedPitch('ASTROTURF');
      setSelectedFormat('BOX / TURF CRICKET');
      Alert.alert('Preset Applied', 'Corporate Box Turf rules loaded in 1-Click.');
    }
  };

  // Navigation Back
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else if (onBack) {
      onBack();
    } else if (navigation && navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  // Banner Image Picker
  const handlePickBanner = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Permission to access media library is required for tournament banner.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setBannerUri(result.assets[0].uri);
      }
    } catch (err) {
      console.log('Error picking banner image:', err);
    }
  };

  // Logo Image Picker (1:1 Square/Circular Avatar)
  const handlePickLogo = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Permission to access media library is required for tournament logo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setLogoUri(result.assets[0].uri);
      }
    } catch (err) {
      console.log('Error picking logo image:', err);
    }
  };

  // Validation per step
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!tournamentName.trim()) {
        Alert.alert('Required Field', 'Please enter Tournament / Series Name');
        return;
      }
      if (!city.trim()) {
        Alert.alert('Required Field', 'Please enter City / Location');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  // Final Form Submission
  const handleSubmit = async () => {
    const tournamentData = {
      id: `t_${Date.now()}`,
      name: tournamentName.trim(),
      title: tournamentName.trim(),
      fullName: tournamentName.trim(),
      city: city.trim(),
      host: city.trim() || 'Local Ground',
      organiserName: organiserName.trim(),
      organiserPhone: organiserPhone.trim(),
      organiserEmail: organiserEmail.trim(),
      startDate,
      endDate,
      duration: `${startDate} - ${endDate}`,
      category: selectedCategory,
      ballType: selectedBall,
      pitchType: selectedPitch,
      format: selectedFormat,
      needMoreTeams,
      needOfficials,
      assignedScorerPhone: assignedScorerPhone.trim(),
      bannerUri,
      logoUri,
      teams: [],
      matches: [],
      isOrganiser: true
    };

    try {
      await saveTournament(tournamentData);
      await saveHostedTournamentId(tournamentData.id);
      await saveActiveTournamentId(tournamentData.id);
    } catch (e) {
      console.warn('Failed to persist tournament:', e);
    }

    if (onComplete) {
      onComplete(tournamentData);
    } else if (navigation) {
      navigation.replace('PublicSeriesView', {
        seriesData: tournamentData,
        isOrganiser: true
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={themeColors.surface} />
      <View style={styles.container}>
        {/* ── 1. HEADER BAR ── */}
        <View style={styles.headerBar}>
          {/* Centered Title (absolute positioned so it never gets skewed) */}
          <View style={styles.headerTitleWrap} pointerEvents="none">
            <Text style={styles.headerTitle}>Host a Tournament</Text>
          </View>

          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleBack}
            activeOpacity={0.7}
            accessibilityLabel="Go Back"
          >
            <Ionicons name="arrow-back" size={24} color={themeColors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.stepCounterBadge}>
            <Text style={styles.stepCounterText}>Step {currentStep}/3</Text>
          </View>
        </View>

        {/* ── 2. STEPPER PROGRESS BAR ── */}
        <View style={styles.stepperWrap}>
          <TouchableOpacity
            style={[styles.stepTab, currentStep === 1 && styles.stepTabActive]}
            onPress={() => setCurrentStep(1)}
            activeOpacity={0.8}
          >
            <Text style={[styles.stepTabText, currentStep === 1 && styles.stepTabTextActive]}>
              1. Overview
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.stepTab, currentStep === 2 && styles.stepTabActive]}
            onPress={() => {
              if (!tournamentName.trim() || !city.trim()) {
                Alert.alert('Complete Step 1', 'Please enter Tournament Name and City first.');
                return;
              }
              setCurrentStep(2);
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.stepTabText, currentStep === 2 && styles.stepTabTextActive]}>
              2. Match Rules
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.stepTab, currentStep === 3 && styles.stepTabActive]}
            onPress={() => {
              if (!tournamentName.trim() || !city.trim()) {
                Alert.alert('Complete Step 1', 'Please enter Tournament Name and City first.');
                return;
              }
              setCurrentStep(3);
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.stepTabText, currentStep === 3 && styles.stepTabTextActive]}>
              3. Officials
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── STEP 1: OVERVIEW & ORGANISER ── */}
          {currentStep === 1 && (
            <View style={styles.stepContentWrap}>
              {/* Facebook-style Cover Banner + Overlapping Circular Logo */}
              <View style={styles.brandingContainer}>
                {/* 1. Cover Banner (16:9 Landscape) */}
                <TouchableOpacity
                  style={styles.bannerPickerCard}
                  onPress={handlePickBanner}
                  activeOpacity={0.85}
                >
                  {bannerUri ? (
                    <Image source={{ uri: bannerUri }} style={styles.bannerImage} />
                  ) : (
                    <View style={styles.bannerPlaceholder}>
                      <Ionicons name="image-outline" size={26} color={themeColors.textMuted} />
                      <Text style={styles.bannerPlaceholderText}>Tap to Upload Tournament Banner / Poster</Text>
                      <Text style={styles.bannerSubText}>Recommended 16:9 Landscape</Text>
                    </View>
                  )}
                  <View style={styles.changeCoverBadge}>
                    <Ionicons name="camera" size={12} color="#FFFFFF" />
                    <Text style={styles.changeCoverBadgeText}>Cover</Text>
                  </View>
                </TouchableOpacity>

                {/* 2. Overlapping Center Circular Logo */}
                <View style={styles.logoOverlapWrapper}>
                  <TouchableOpacity
                    style={styles.logoCircleCard}
                    onPress={handlePickLogo}
                    activeOpacity={0.85}
                  >
                    {logoUri ? (
                      <Image source={{ uri: logoUri }} style={styles.logoImage} />
                    ) : (
                      <View style={styles.logoPlaceholder}>
                        <MaterialCommunityIcons name="trophy-outline" size={26} color={themeColors.primary} />
                        <Text style={styles.logoPlaceholderText}>Add Logo</Text>
                      </View>
                    )}
                    <View style={styles.logoCameraBadge}>
                      <Ionicons name="camera" size={11} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                </View>

                <Text style={styles.brandingHintText}>Tap banner for cover poster • Tap circle for brand logo</Text>
              </View>

              {/* Basic Fields */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionCardTitle}>TOURNAMENT IDENTIFICATION</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Tournament / Series Name *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Nagaur Premier League 2026"
                    placeholderTextColor={themeColors.textSubtle}
                    value={tournamentName}
                    onChangeText={setTournamentName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>City / Location *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Nagaur, Rajasthan"
                    placeholderTextColor={themeColors.textSubtle}
                    value={city}
                    onChangeText={setCity}
                  />
                </View>

                <View style={styles.rowInputs}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Start Date</Text>
                    <TextInput
                      style={styles.textInput}
                      value={startDate}
                      onChangeText={setStartDate}
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>End Date</Text>
                    <TextInput
                      style={styles.textInput}
                      value={endDate}
                      onChangeText={setEndDate}
                    />
                  </View>
                </View>
              </View>

              {/* Organiser Info */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionCardTitle}>ORGANISER CONTACT DETAILS</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Organiser Name</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Bastiram Vishwakarma"
                    placeholderTextColor={themeColors.textSubtle}
                    value={organiserName}
                    onChangeText={setOrganiserName}
                  />
                </View>

                <View style={styles.rowInputs}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Contact Phone</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Mobile number"
                      placeholderTextColor={themeColors.textSubtle}
                      keyboardType="phone-pad"
                      value={organiserPhone}
                      onChangeText={setOrganiserPhone}
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Organiser Email</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Email ID"
                      placeholderTextColor={themeColors.textSubtle}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={organiserEmail}
                      onChangeText={setOrganiserEmail}
                    />
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.primaryNextBtn}
                onPress={handleNextStep}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryNextBtnText}>GO TO MATCH RULES (STEP 2) →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── STEP 2: MATCH RULES & FORMAT ── */}
          {currentStep === 2 && (
            <View style={styles.stepContentWrap}>
              {/* Tournament Category */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionCardTitle}>TOURNAMENT CATEGORY</Text>
                <View style={styles.chipsWrap}>
                  {categories.map((cat) => {
                    const isSelected = selectedCategory === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.chipPill, isSelected && styles.chipPillActive]}
                        onPress={() => setSelectedCategory(cat)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Select Ball Type */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionCardTitle}>SELECT BALL TYPE</Text>
                <View style={styles.chipsWrap}>
                  {ballTypes.map((ball) => {
                    const isSelected = selectedBall === ball.id;
                    return (
                      <TouchableOpacity
                        key={ball.id}
                        style={[styles.chipPill, isSelected && styles.chipPillActive]}
                        onPress={() => setSelectedBall(ball.id)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={ball.icon}
                          size={16}
                          color={isSelected ? '#FFFFFF' : themeColors.textSecondary}
                          style={{ marginRight: 6 }}
                        />
                        <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                          {ball.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Pitch Type */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionCardTitle}>PITCH TYPE</Text>
                <View style={styles.chipsWrap}>
                  {pitchTypes.map((pitch) => {
                    const isSelected = selectedPitch === pitch;
                    return (
                      <TouchableOpacity
                        key={pitch}
                        style={[styles.chipPill, isSelected && styles.chipPillActive]}
                        onPress={() => setSelectedPitch(pitch)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                          {pitch}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Match Format */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionCardTitle}>MATCH FORMAT</Text>
                <View style={styles.chipsWrap}>
                  {matchFormats.map((fmt) => {
                    const isSelected = selectedFormat === fmt;
                    return (
                      <TouchableOpacity
                        key={fmt}
                        style={[styles.chipPill, isSelected && styles.chipPillActive]}
                        onPress={() => setSelectedFormat(fmt)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                          {fmt}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <TouchableOpacity
                style={styles.primaryNextBtn}
                onPress={handleNextStep}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryNextBtnText}>GO TO GROUND OPERATIONS (STEP 3) →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── STEP 3: GROUND OPERATIONS & TEAM REGISTRATION ── */}
          {currentStep === 3 && (
            <View style={styles.stepContentWrap}>
              {/* 1. TOURNAMENT PREFERENCES CARD */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionCardTitle}>TOURNAMENT PREFERENCES</Text>

                {/* TOGGLE 1: NEED TEAMS */}
                <View style={styles.toggleRow}>
                  <View style={styles.toggleTextWrap}>
                    <Text style={styles.toggleTitle}>Do you need more teams for your tournament?</Text>
                    <Text style={styles.toggleSub}>Allow other ground teams to apply/join this tournament</Text>
                  </View>
                  <Switch
                    value={needMoreTeams}
                    onValueChange={setNeedMoreTeams}
                    trackColor={{ false: '#E2E8F0', true: '#18181B' }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={styles.dividerLine} />

                {/* TOGGLE 2: INFORM PREVIOUS PLAYERS */}
                <View style={styles.toggleRow}>
                  <View style={styles.toggleTextWrap}>
                    <Text style={styles.toggleTitle}>Inform all players of my previous tournaments</Text>
                    <Text style={styles.toggleSub}>Send notification to your registered ground player database</Text>
                  </View>
                  <Switch
                    value={informPreviousPlayers}
                    onValueChange={setInformPreviousPlayers}
                    trackColor={{ false: '#E2E8F0', true: '#18181B' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>

              {/* 2. EXPANDED TEAM & PRIZE DETAILS (Only if needMoreTeams is ON) */}
              {needMoreTeams && (
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionCardTitle}>TEAM & PRIZE DETAILS</Text>

                  <View style={styles.rowInputs}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>Entry Fee (₹) *</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g. 5000"
                        placeholderTextColor={themeColors.textSubtle}
                        keyboardType="numeric"
                        value={entryFee}
                        onChangeText={setEntryFee}
                      />
                    </View>

                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>Total No. of Teams *</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g. 8"
                        placeholderTextColor={themeColors.textSubtle}
                        keyboardType="numeric"
                        value={totalTeamsCount}
                        onChangeText={setTotalTeamsCount}
                      />
                    </View>
                  </View>

                  {/* WINNING PRIZE */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Winning Prize *</Text>
                    <View style={styles.chipsWrap}>
                      {['CASH', 'TROPHIES', 'BOTH'].map((pz) => {
                        const isSelected = winningPrizeType === pz;
                        return (
                          <TouchableOpacity
                            key={pz}
                            style={[styles.chipPill, isSelected && styles.chipPillActive]}
                            onPress={() => setWinningPrizeType(pz)}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                              {pz}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* MATCHES ON */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Matches On *</Text>
                    <View style={styles.chipsWrap}>
                      {['WEEKENDS', 'WEEKDAYS', 'ALL DAYS'].map((mo) => {
                        const isSelected = matchesOnType === mo;
                        return (
                          <TouchableOpacity
                            key={mo}
                            style={[styles.chipPill, isSelected && styles.chipPillActive]}
                            onPress={() => setMatchesOnType(mo)}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                              {mo}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* MATCH TIMING */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Match Timing *</Text>
                    <View style={styles.chipsWrap}>
                      {['DAY', 'NIGHT', 'DAY & NIGHT'].map((mt) => {
                        const isSelected = matchTimingType === mt;
                        return (
                          <TouchableOpacity
                            key={mt}
                            style={[styles.chipPill, isSelected && styles.chipPillActive]}
                            onPress={() => setMatchTimingType(mt)}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                              {mt}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* ADDITIONAL DETAILS NOTE */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Any Additional Details?</Text>
                    <TextInput
                      style={[styles.textInput, { height: 70, textAlignVertical: 'top' }]}
                      placeholder="Add details like prizes, trophies, entry fees, ground rules, etc."
                      placeholderTextColor={themeColors.textSubtle}
                      multiline
                      numberOfLines={3}
                      value={additionalNotes}
                      onChangeText={setAdditionalNotes}
                    />
                  </View>
                </View>
              )}

              {/* Summary Review Card */}
              <View style={styles.summaryReviewCard}>
                <Text style={styles.summaryTitle}>TOURNAMENT SUMMARY REVIEW</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tournament:</Text>
                  <Text style={styles.summaryVal}>{tournamentName || 'Unnamed Tournament'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>City:</Text>
                  <Text style={styles.summaryVal}>{city || 'Nagaur, RJ'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Rules:</Text>
                  <Text style={styles.summaryVal}>{selectedCategory} • {selectedPitch} • {selectedFormat}</Text>
                </View>
              </View>

              {/* Final Submit */}
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSubmit}
                activeOpacity={0.85}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialCommunityIcons name="trophy" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.submitBtnText}>CREATE TOURNAMENT & LAUNCH HUB</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: themeColors.surface
  },
  container: {
    flex: 1,
    backgroundColor: themeColors.appBackground
  },
  headerBar: {
    height: 52,
    backgroundColor: themeColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    position: 'relative'
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'flex-start',
    justifyContent: 'center',
    zIndex: 1
  },
  headerTitleWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: systemFontMedium,
    color: themeColors.textPrimary,
    letterSpacing: -0.2
  },
  headerSubtitle: {
    fontSize: 10,
    fontFamily: systemFont,
    color: themeColors.textMuted
  },
  stepCounterBadge: {
    backgroundColor: themeColors.surfaceOffWhite,
    borderWidth: 1,
    borderColor: themeColors.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    zIndex: 1
  },
  stepCounterText: {
    fontSize: 11,
    fontFamily: systemFontMedium,
    color: themeColors.primary
  },
  stepperWrap: {
    flexDirection: 'row',
    backgroundColor: themeColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8
  },
  stepTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: themeColors.surfaceOffWhite
  },
  stepTabActive: {
    backgroundColor: '#18181B'
  },
  stepTabText: {
    fontSize: 12,
    fontFamily: systemFontMedium,
    color: themeColors.textSecondary
  },
  stepTabTextActive: {
    color: '#FFFFFF',
    fontFamily: systemFontBold
  },
  scrollContainer: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40
  },
  stepContentWrap: {
    gap: 16
  },
  brandingContainer: {
    backgroundColor: themeColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: themeColors.border,
    overflow: 'hidden',
    paddingBottom: 12,
    alignItems: 'center'
  },
  bannerPickerCard: {
    width: '100%',
    height: 135,
    backgroundColor: themeColors.surfaceOffWhite,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
  bannerPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3
  },
  bannerPlaceholderText: {
    fontSize: 12,
    fontFamily: systemFontMedium,
    color: themeColors.textPrimary
  },
  bannerSubText: {
    fontSize: 10,
    fontFamily: systemFont,
    color: themeColors.textMuted
  },
  changeCoverBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(24, 24, 27, 0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  changeCoverBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: systemFontBold
  },
  logoOverlapWrapper: {
    marginTop: -42,
    alignItems: 'center',
    justifyContent: 'center'
  },
  logoCircleCard: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    overflow: 'visible',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    position: 'relative'
  },
  logoImage: {
    width: 78,
    height: 78,
    borderRadius: 39,
    resizeMode: 'cover'
  },
  logoPlaceholder: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: themeColors.surfaceOffWhite,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2
  },
  logoPlaceholderText: {
    fontSize: 9.5,
    fontFamily: systemFontBold,
    color: themeColors.primary
  },
  logoCameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#18181B',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  brandingHintText: {
    fontSize: 10.5,
    fontFamily: systemFont,
    color: themeColors.textMuted,
    marginTop: 8
  },
  sectionCard: {
    backgroundColor: themeColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: themeColors.border,
    padding: 16,
    gap: 12
  },
  sectionCardTitle: {
    fontSize: 11,
    fontFamily: systemFontBold,
    color: themeColors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 2
  },
  inputGroup: {
    gap: 6
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: systemFontMedium,
    color: themeColors.textSecondary
  },
  textInput: {
    backgroundColor: themeColors.surfaceOffWhite,
    borderWidth: 1,
    borderColor: themeColors.borderDark,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: systemFont,
    color: themeColors.textPrimary
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12
  },
  presetsCard: {
    backgroundColor: '#0F2744',
    borderRadius: 12,
    padding: 14,
    gap: 8
  },
  presetsTitle: {
    fontSize: 12,
    fontFamily: systemFontBold,
    color: '#38BDF8',
    letterSpacing: 0.8
  },
  presetsSub: {
    fontSize: 11,
    fontFamily: systemFont,
    color: '#94A3B8'
  },
  presetButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4
  },
  presetChip: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  presetChipText: {
    fontSize: 11,
    fontFamily: systemFontMedium,
    color: '#FFFFFF'
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  chipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.surfaceOffWhite,
    borderWidth: 1,
    borderColor: themeColors.borderDark,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20
  },
  chipPillActive: {
    backgroundColor: '#18181B',
    borderColor: '#18181B'
  },
  chipText: {
    fontSize: 12,
    fontFamily: systemFontMedium,
    color: themeColors.textSecondary
  },
  chipTextActive: {
    color: '#FFFFFF'
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  toggleTextWrap: {
    flex: 1
  },
  toggleTitle: {
    fontSize: 13,
    fontFamily: systemFontMedium,
    color: themeColors.textPrimary,
    marginBottom: 2
  },
  toggleSub: {
    fontSize: 11,
    fontFamily: systemFont,
    color: themeColors.textMuted
  },
  dividerLine: {
    height: 1,
    backgroundColor: themeColors.border,
    marginVertical: 4
  },
  summaryReviewCard: {
    backgroundColor: themeColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: themeColors.border,
    padding: 14,
    gap: 8
  },
  summaryTitle: {
    fontSize: 11,
    fontFamily: systemFontBold,
    color: themeColors.textMuted,
    letterSpacing: 0.8
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: systemFont,
    color: themeColors.textMuted
  },
  summaryVal: {
    fontSize: 12,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  primaryNextBtn: {
    backgroundColor: '#18181B',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8
  },
  primaryNextBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: systemFontBold,
    letterSpacing: 0.5
  },
  submitBtn: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: systemFontBold,
    letterSpacing: 0.5
  }
});

export default CreateTournamentScreen;
