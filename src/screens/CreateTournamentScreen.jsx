import React, { useState, useEffect } from 'react';
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
  Alert,
  Keyboard,
  ActivityIndicator
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
import { getCurrentUser } from '../services/authService.js';
import { PhoneLoginModal } from '../components/modals/PhoneLoginModal.jsx';
import { CricCalendarModal, formatCricDate } from '../components/modals/CricCalendarModal.jsx';
import { LocationPickerModal } from '../components/modals/LocationPickerModal.jsx';
import { getCurrentGpsLocation } from '../services/locationService.js';
import { useMatch } from '../context/MatchContext.jsx';

export function CreateTournamentScreen(props = {}) {
  const matchCtx = useMatch();
  const {
    navigation = props.navigation,
    onBack = props.onBack || props.onCancel || (() => {
      if (props.navigation && props.navigation.canGoBack()) {
        props.navigation.goBack();
      } else if (matchCtx?.setCurrentScreen) {
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
      } else if (matchCtx?.setCurrentScreen) {
        matchCtx.setCurrentScreen('home');
      }
    })
  } = props;

  // Stepper State (1 | 2 | 3)
  const [currentStep, setCurrentStep] = useState(1);

  // Authenticated User State
  const [currentUser, setCurrentUser] = useState(null);
  const [loginModalVisible, setLoginModalVisible] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const user = await getCurrentUser();
      if (!user) {
        setLoginModalVisible(true);
      } else {
        setCurrentUser(user);
        if (user.name) setOrganiserName(user.name);
        if (user.phone) setOrganiserPhone(user.phone);
        if (user.email) setOrganiserEmail(user.email);
      }
    };
    checkAuth();
  }, []);

  // ── Step 1 State: Overview, Branding & Venues ──
  const [bannerUri, setBannerUri] = useState(null);
  const [logoUri, setLogoUri] = useState(null);
  const [tournamentName, setTournamentName] = useState('');

  // Location State (Structured & String)
  const [city, setCity] = useState('');
  const [location, setLocation] = useState(null);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Multi-Ground / Venues Tag Manager
  const [venues, setVenues] = useState([]);
  const [currentVenueInput, setCurrentVenueInput] = useState('');

  // Organiser Info & Dates
  const [organiserName, setOrganiserName] = useState('');
  const [organiserPhone, setOrganiserPhone] = useState('');
  const [organiserEmail, setOrganiserEmail] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return formatCricDate(d);
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 9);
    return formatCricDate(d);
  });
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);

  // ── Step 2 State: Tournament Structure & Match Rules ──
  // Tournament Structure: LEAGUE | KNOCKOUT | LEAGUE_KNOCKOUT
  const [tournamentType, setTournamentType] = useState('LEAGUE_KNOCKOUT');

  const categories = [
    'OPEN', 'CORPORATE', 'COMMUNITY', 'SCHOOL', 'COLLEGE', 'UNIVERSITY', 'SERIES', 'OTHER'
  ];
  const [selectedCategory, setSelectedCategory] = useState('OPEN');

  const ballTypes = [
    { id: 'tennis_red', label: 'Tennis (Red)', icon: 'baseball-outline' },
    { id: 'tennis_green', label: 'Tennis (Green)', icon: 'baseball-outline' },
    { id: 'leather', label: 'Leather', icon: 'baseball' },
    { id: 'plastic_other', label: 'Plastic / Tape', icon: 'ellipse-outline' }
  ];
  const [selectedBall, setSelectedBall] = useState('tennis_red');

  const pitchTypes = ['TURF', 'ASTROTURF', 'MATTING', 'CEMENT', 'ROUGH / DIRT'];
  const [selectedPitch, setSelectedPitch] = useState('TURF');

  const matchFormats = [
    'LIMITED OVERS', 'BOX / TURF CRICKET', 'PAIR CRICKET', 'TEST MATCH', 'THE HUNDRED'
  ];
  const [selectedFormat, setSelectedFormat] = useState('LIMITED OVERS');

  // Match Schedule Frequency: ALL DAYS | WEEKENDS | WEEKDAYS
  const [matchesOnType, setMatchesOnType] = useState('ALL DAYS');

  // Match Timing: DAY | NIGHT | DAY_NIGHT
  const [matchTimingType, setMatchTimingType] = useState('DAY');

  // ── Step 3 State: Prizes, Registration & Regulations ──
  const [needMoreTeams, setNeedMoreTeams] = useState(true);
  const [entryFee, setEntryFee] = useState('');
  const [totalTeamsCount, setTotalTeamsCount] = useState('8');
  const [maxSquadSize, setMaxSquadSize] = useState('15');

  // Winning Prize: BOTH | CASH | TROPHIES
  const [winningPrizeType, setWinningPrizeType] = useState('BOTH');
  const [firstPrize, setFirstPrize] = useState('');
  const [runnerUpPrize, setRunnerUpPrize] = useState('');

  // Rules & Regulations
  const [tournamentRules, setTournamentRules] = useState('');

  const [informPreviousPlayers, setInformPreviousPlayers] = useState(true);
  const [needOfficials, setNeedOfficials] = useState(false);
  const [assignedScorerPhone, setAssignedScorerPhone] = useState('');

  // Quick 1-Tap GPS Auto-Detect Handler
  const handleQuickGps = async () => {
    setGpsLoading(true);
    try {
      const res = await getCurrentGpsLocation();
      if (res.success && res.location) {
        setLocation(res.location);
        setCity(res.location.formattedAddress || res.location.city);
      } else {
        Alert.alert(
          'GPS Location',
          res.message || 'Could not auto-detect GPS location. Please tap search to select manually.'
        );
      }
    } catch (e) {
      Alert.alert('GPS Location', 'GPS detection failed. Please search manually.');
    } finally {
      setGpsLoading(false);
    }
  };

  const handleSelectLocation = (selectedLoc) => {
    if (!selectedLoc) return;
    setLocation(selectedLoc);
    setCity(selectedLoc.formattedAddress || selectedLoc.city);
  };

  // ── Venue Tag Handlers ──
  const handleAddVenue = () => {
    const trimmed = currentVenueInput.trim();
    if (!trimmed) return;
    if (venues.includes(trimmed)) {
      Alert.alert('Duplicate Ground', 'This ground name is already added.');
      return;
    }
    setVenues([...venues, trimmed]);
    setCurrentVenueInput('');
  };

  const handleRemoveVenue = (indexToRemove) => {
    setVenues(venues.filter((_, idx) => idx !== indexToRemove));
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
        Alert.alert('Required Field', 'Please enter Tournament / Series Name.');
        return;
      }
      if (!city.trim()) {
        Alert.alert('Required Field', 'Please select or enter City / Location.');
        return;
      }
      setShowCityDropdown(false);
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  // Final Form Submission
  const handleSubmit = async () => {
    if (!currentUser) {
      setLoginModalVisible(true);
      return;
    }

    const finalVenues = venues.length > 0 ? venues : [city.trim() || 'Main Ground'];

    const tournamentData = {
      id: `t_${Date.now()}`,
      name: tournamentName.trim(),
      title: tournamentName.trim(),
      fullName: tournamentName.trim(),
      city: city.trim() || location?.formattedAddress || location?.city || '',
      location: location || (city.trim() ? { city: city.trim(), formattedAddress: city.trim() } : null),
      host: city.trim() || location?.formattedAddress || location?.city || 'Local Ground',
      venues: finalVenues,
      venue: finalVenues[0],
      tournamentType: tournamentType,
      structure: tournamentType,
      organiserId: currentUser?.id || `usr_${organiserPhone.trim()}`,
      organiserName: organiserName.trim() || currentUser?.name || 'Organiser',
      organiserPhone: organiserPhone.trim() || currentUser?.phone || '',
      organiserEmail: organiserEmail.trim() || currentUser?.email || '',
      startDate,
      endDate,
      duration: `${startDate} - ${endDate}`,
      category: selectedCategory,
      ballType: selectedBall,
      pitchType: selectedPitch,
      format: selectedFormat,
      matchDays: matchesOnType,
      matchesOn: matchesOnType,
      matchTiming: matchTimingType,
      needMoreTeams,
      entryFee: entryFee ? `₹${entryFee.replace(/[^0-9]/g, '')}` : '',
      totalTeamsCount: totalTeamsCount ? parseInt(totalTeamsCount, 10) : 8,
      maxSquadSize: maxSquadSize ? parseInt(maxSquadSize, 10) : 15,
      winningPrizeType,
      firstPrize: firstPrize ? `₹${firstPrize.replace(/[^0-9]/g, '')}` : '',
      runnerUpPrize: runnerUpPrize ? `₹${runnerUpPrize.replace(/[^0-9]/g, '')}` : '',
      rules: tournamentRules.trim(),
      additionalNotes: tournamentRules.trim(),
      informPreviousPlayers,
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
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" translucent={true} backgroundColor="transparent" />
      <View style={styles.container}>
        {/* ── 1. HEADER BAR ── */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleBack}
            activeOpacity={0.7}
            accessibilityLabel="Go Back"
          >
            <Ionicons name="arrow-back" size={24} color={themeColors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap} pointerEvents="none">
            <Text style={styles.headerTitle}>Host a Tournament</Text>
          </View>

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
              setShowCityDropdown(false);
              setCurrentStep(2);
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.stepTabText, currentStep === 2 && styles.stepTabTextActive]}>
              2. Rules & Format
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.stepTab, currentStep === 3 && styles.stepTabActive]}
            onPress={() => {
              if (!tournamentName.trim() || !city.trim()) {
                Alert.alert('Complete Step 1', 'Please enter Tournament Name and City first.');
                return;
              }
              setShowCityDropdown(false);
              setCurrentStep(3);
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.stepTabText, currentStep === 3 && styles.stepTabTextActive]}>
              3. Prizes & Setup
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ══════════════════════════════════════════════════════════════════════
              STEP 1: OVERVIEW, BRANDING & MULTI-GROUND VENUES
              ══════════════════════════════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <View style={styles.stepContentWrap}>
              {/* Branding: Cover Banner + Overlapping Circular Logo */}
              <View style={styles.brandingContainer}>
                {/* 1. Cover Banner (16:9) */}
                <TouchableOpacity
                  style={styles.bannerPickerCard}
                  onPress={handlePickBanner}
                  activeOpacity={0.85}
                >
                  {bannerUri ? (
                    <Image source={{ uri: bannerUri }} style={styles.bannerImage} />
                  ) : (
                    <View style={styles.bannerPlaceholder}>
                      <Ionicons name="image-outline" size={28} color={themeColors.textMuted} />
                      <Text style={styles.bannerPlaceholderText}>Upload Tournament Poster / Banner</Text>
                      <Text style={styles.bannerSubText}>Recommended 16:9 Landscape</Text>
                    </View>
                  )}
                  <View style={styles.changeCoverBadge}>
                    <Ionicons name="camera" size={12} color="#FFFFFF" />
                    <Text style={styles.changeCoverBadgeText}>Cover</Text>
                  </View>
                </TouchableOpacity>

                {/* 2. Overlapping Circular Logo */}
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

              {/* Tournament Identification Card */}
              <View style={styles.sectionCard}>
                <View style={styles.cardHeaderRow}>
                  <MaterialCommunityIcons name="trophy-award" size={18} color="#18181B" />
                  <Text style={styles.sectionCardTitle}>TOURNAMENT IDENTIFICATION</Text>
                </View>

                {/* Tournament Name */}
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

                {/* Location / City Selector */}
                <View style={styles.inputGroup}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={styles.inputLabel}>City / Ground Location *</Text>
                    <TouchableOpacity
                      onPress={handleQuickGps}
                      disabled={gpsLoading}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        backgroundColor: '#F0F9FF',
                        borderRadius: 6,
                        borderWidth: 0
                      }}
                    >
                      {gpsLoading ? (
                        <ActivityIndicator size="small" color="#0284C7" />
                      ) : (
                        <Ionicons name="navigate-circle-outline" size={14} color="#0284C7" />
                      )}
                      <Text style={{ fontSize: 11, fontFamily: systemFontMedium, color: '#0284C7' }}>
                        {gpsLoading ? 'Detecting...' : 'Auto-Detect (GPS)'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={[styles.textInput, styles.cityInputWrapper, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 12 }]}
                    onPress={() => setLocationModalVisible(true)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 8 }}>
                      <Ionicons name="location-outline" size={18} color="#0284C7" />
                      <Text
                        style={[
                          styles.cityPickerDisplayText,
                          !city && { color: themeColors.textSubtle }
                        ]}
                        numberOfLines={1}
                      >
                        {city || 'Search city, town, or tap GPS...'}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      {city ? (
                        <TouchableOpacity
                          onPress={() => {
                            setCity('');
                            setLocation(null);
                          }}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="close-circle" size={18} color={themeColors.textMuted} />
                        </TouchableOpacity>
                      ) : null}
                      <Ionicons name="search" size={16} color="#64748B" />
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Tournament Dates */}
                <View style={styles.rowInputs}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Start Date *</Text>
                    <TouchableOpacity
                      style={styles.datePickerInputBtn}
                      onPress={() => setCalendarModalVisible(true)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="calendar-month-outline" size={18} color="#18181B" />
                      <Text style={styles.datePickerText}>{startDate || 'Select Date'}</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>End Date *</Text>
                    <TouchableOpacity
                      style={styles.datePickerInputBtn}
                      onPress={() => setCalendarModalVisible(true)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="calendar-check-outline" size={18} color="#059669" />
                      <Text style={styles.datePickerText}>{endDate || 'Select Date'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Multi-Ground / Venue Tag Manager Card */}
              <View style={styles.sectionCard}>
                <View style={styles.cardHeaderRow}>
                  <MaterialCommunityIcons name="stadium-variant" size={18} color="#18181B" />
                  <Text style={styles.sectionCardTitle}>TOURNAMENT GROUNDS / VENUES</Text>
                </View>
                <Text style={styles.sectionCardSub}>
                  Add one or more ground names where tournament matches will take place.
                </Text>

                <View style={styles.addVenueInputRow}>
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    placeholder="e.g. Sadokan Stadium Ground 1"
                    placeholderTextColor={themeColors.textSubtle}
                    value={currentVenueInput}
                    onChangeText={setCurrentVenueInput}
                    onSubmitEditing={handleAddVenue}
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    style={styles.addVenueBtn}
                    onPress={handleAddVenue}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add" size={18} color="#FFFFFF" />
                    <Text style={styles.addVenueBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>

                {/* Venue Chips List */}
                {venues.length > 0 ? (
                  <View style={styles.venueChipsWrap}>
                    {venues.map((vName, index) => (
                      <View key={`${vName}-${index}`} style={styles.venueChip}>
                        <MaterialCommunityIcons name="cricket" size={14} color="#18181B" style={{ marginRight: 6 }} />
                        <Text style={styles.venueChipText} numberOfLines={1}>{vName}</Text>
                        <TouchableOpacity
                          style={styles.removeVenueChipBtn}
                          onPress={() => handleRemoveVenue(index)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="close-circle" size={16} color="#64748B" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.venueEmptyHint}>
                    <Ionicons name="information-circle-outline" size={15} color={themeColors.textMuted} />
                    <Text style={styles.venueEmptyHintText}>
                      No specific ground added. City ({city || 'Location'}) will be used as default venue.
                    </Text>
                  </View>
                )}
              </View>

              {/* Organiser Contact Info Card */}
              <View style={styles.sectionCard}>
                <View style={styles.cardHeaderRow}>
                  <Ionicons name="person-outline" size={18} color="#18181B" />
                  <Text style={styles.sectionCardTitle}>ORGANISER CONTACT DETAILS</Text>
                </View>

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
                <Text style={styles.primaryNextBtnText}>GO TO RULES & STRUCTURE (STEP 2) →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              STEP 2: TOURNAMENT STRUCTURE, FORMAT & SCHEDULE
              ══════════════════════════════════════════════════════════════════════ */}
          {currentStep === 2 && (
            <View style={styles.stepContentWrap}>
              {/* 1. TOURNAMENT STRUCTURE / COMPETITION TYPE */}
              <View style={styles.sectionCard}>
                <View style={styles.cardHeaderRow}>
                  <MaterialCommunityIcons name="tournament" size={18} color="#18181B" />
                  <Text style={styles.sectionCardTitle}>TOURNAMENT STRUCTURE</Text>
                </View>
                <Text style={styles.sectionCardSub}>
                  Select how matches and points table will be conducted.
                </Text>

                {/* Structure Options: 3 Visual Cards */}
                <View style={styles.structureList}>
                  {/* Option 1: Group Stage + Knockout */}
                  <TouchableOpacity
                    style={[
                      styles.structureCard,
                      tournamentType === 'LEAGUE_KNOCKOUT' && styles.structureCardActive
                    ]}
                    onPress={() => setTournamentType('LEAGUE_KNOCKOUT')}
                    activeOpacity={0.75}
                  >
                    <View style={styles.structureIconWrap}>
                      <MaterialCommunityIcons
                        name="trophy-variant-outline"
                        size={22}
                        color={tournamentType === 'LEAGUE_KNOCKOUT' ? '#FFFFFF' : '#18181B'}
                      />
                    </View>
                    <View style={styles.structureContent}>
                      <View style={styles.structureTitleRow}>
                        <Text style={[styles.structureTitle, tournamentType === 'LEAGUE_KNOCKOUT' && styles.structureTitleActive]}>
                          League + Knockout (Hybrid)
                        </Text>
                        <View style={styles.recommendedBadge}>
                          <Text style={styles.recommendedBadgeText}>Popular</Text>
                        </View>
                      </View>
                      <Text style={[styles.structureDesc, tournamentType === 'LEAGUE_KNOCKOUT' && styles.structureDescActive]}>
                        Group stage matches with Points Table, followed by Semi-Finals & Grand Finale.
                      </Text>
                    </View>
                    <Ionicons
                      name={tournamentType === 'LEAGUE_KNOCKOUT' ? 'checkmark-circle' : 'ellipse-outline'}
                      size={20}
                      color={tournamentType === 'LEAGUE_KNOCKOUT' ? '#18181B' : '#94A3B8'}
                    />
                  </TouchableOpacity>

                  {/* Option 2: Round-Robin League */}
                  <TouchableOpacity
                    style={[
                      styles.structureCard,
                      tournamentType === 'LEAGUE' && styles.structureCardActive
                    ]}
                    onPress={() => setTournamentType('LEAGUE')}
                    activeOpacity={0.75}
                  >
                    <View style={styles.structureIconWrap}>
                      <MaterialCommunityIcons
                        name="format-list-numbered"
                        size={22}
                        color={tournamentType === 'LEAGUE' ? '#FFFFFF' : '#18181B'}
                      />
                    </View>
                    <View style={styles.structureContent}>
                      <Text style={[styles.structureTitle, tournamentType === 'LEAGUE' && styles.structureTitleActive]}>
                        Round-Robin League Only
                      </Text>
                      <Text style={[styles.structureDesc, tournamentType === 'LEAGUE' && styles.structureDescActive]}>
                        All teams play against each other. Standings decide winner directly.
                      </Text>
                    </View>
                    <Ionicons
                      name={tournamentType === 'LEAGUE' ? 'checkmark-circle' : 'ellipse-outline'}
                      size={20}
                      color={tournamentType === 'LEAGUE' ? '#18181B' : '#94A3B8'}
                    />
                  </TouchableOpacity>

                  {/* Option 3: Direct Knockout */}
                  <TouchableOpacity
                    style={[
                      styles.structureCard,
                      tournamentType === 'KNOCKOUT' && styles.structureCardActive
                    ]}
                    onPress={() => setTournamentType('KNOCKOUT')}
                    activeOpacity={0.75}
                  >
                    <View style={styles.structureIconWrap}>
                      <MaterialCommunityIcons
                        name="sword-cross"
                        size={22}
                        color={tournamentType === 'KNOCKOUT' ? '#FFFFFF' : '#18181B'}
                      />
                    </View>
                    <View style={styles.structureContent}>
                      <Text style={[styles.structureTitle, tournamentType === 'KNOCKOUT' && styles.structureTitleActive]}>
                        Direct Knockout (Elimination)
                      </Text>
                      <Text style={[styles.structureDesc, tournamentType === 'KNOCKOUT' && styles.structureDescActive]}>
                        Single loss eliminates team. Winner advances directly to next round.
                      </Text>
                    </View>
                    <Ionicons
                      name={tournamentType === 'KNOCKOUT' ? 'checkmark-circle' : 'ellipse-outline'}
                      size={20}
                      color={tournamentType === 'KNOCKOUT' ? '#18181B' : '#94A3B8'}
                    />
                  </TouchableOpacity>
                </View>
              </View>

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

              {/* Match Schedule Days & Timing */}
              <View style={styles.sectionCard}>
                <View style={styles.cardHeaderRow}>
                  <MaterialCommunityIcons name="calendar-clock" size={18} color="#18181B" />
                  <Text style={styles.sectionCardTitle}>MATCH SCHEDULE & TIMINGS</Text>
                </View>

                {/* Match Days Frequency */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Match Schedule Frequency</Text>
                  <View style={styles.chipsWrap}>
                    {[
                      { id: 'ALL DAYS', label: 'All Days (Daily)' },
                      { id: 'WEEKENDS', label: 'Weekends Only (Sat-Sun)' },
                      { id: 'WEEKDAYS', label: 'Weekdays Only (Mon-Fri)' }
                    ].map((item) => {
                      const isSelected = matchesOnType === item.id;
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[styles.chipPill, isSelected && styles.chipPillActive]}
                          onPress={() => setMatchesOnType(item.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                            {item.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Match Timing */}
                <View style={[styles.inputGroup, { marginTop: 4 }]}>
                  <Text style={styles.inputLabel}>Match Timing & Lighting</Text>
                  <View style={styles.chipsWrap}>
                    {[
                      { id: 'DAY', label: 'Day (Sunlight)', icon: 'sunny-outline' },
                      { id: 'NIGHT', label: 'Night (Floodlights)', icon: 'cloudy-night-outline' },
                      { id: 'DAY_NIGHT', label: 'Day & Night Both', icon: 'contrast-outline' }
                    ].map((item) => {
                      const isSelected = matchTimingType === item.id;
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[styles.chipPill, isSelected && styles.chipPillActive]}
                          onPress={() => setMatchTimingType(item.id)}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name={item.icon}
                            size={15}
                            color={isSelected ? '#FFFFFF' : themeColors.textSecondary}
                            style={{ marginRight: 6 }}
                          />
                          <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                            {item.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.primaryNextBtn}
                onPress={handleNextStep}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryNextBtnText}>GO TO PRIZES & SETUP (STEP 3) →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              STEP 3: PRIZES, PUBLIC REGISTRATION & REGULATIONS
              ══════════════════════════════════════════════════════════════════════ */}
          {currentStep === 3 && (
            <View style={styles.stepContentWrap}>
              {/* 1. PUBLIC TEAM REGISTRATIONS CARD */}
              <View style={styles.sectionCard}>
                <View style={styles.cardHeaderRow}>
                  <Ionicons name="people-outline" size={18} color="#18181B" />
                  <Text style={styles.sectionCardTitle}>PUBLIC TEAM REGISTRATIONS</Text>
                </View>

                <View style={styles.toggleRow}>
                  <View style={styles.toggleTextWrap}>
                    <Text style={styles.toggleTitle}>Open Public Team Registration</Text>
                    <Text style={styles.toggleSub}>
                      Allow captains from other clubs & ground teams to discover and apply to join this tournament.
                    </Text>
                  </View>
                  <Switch
                    value={needMoreTeams}
                    onValueChange={setNeedMoreTeams}
                    trackColor={{ false: '#E2E8F0', true: '#18181B' }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {/* Expanded Fields if Registration is ON */}
                {needMoreTeams && (
                  <View style={styles.expandedSectionWrap}>
                    <View style={styles.dividerLine} />

                    <View style={styles.rowInputs}>
                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.inputLabel}>Entry Fee (₹)</Text>
                        <TextInput
                          style={styles.textInput}
                          placeholder="e.g. 5000 (or 0 for Free)"
                          placeholderTextColor={themeColors.textSubtle}
                          keyboardType="numeric"
                          value={entryFee}
                          onChangeText={setEntryFee}
                        />
                      </View>

                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.inputLabel}>Total Teams Limit</Text>
                        <TextInput
                          style={styles.textInput}
                          placeholder="e.g. 8 or 16"
                          placeholderTextColor={themeColors.textSubtle}
                          keyboardType="numeric"
                          value={totalTeamsCount}
                          onChangeText={setTotalTeamsCount}
                        />
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Max Squad Size (Per Team)</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g. 15 players"
                        placeholderTextColor={themeColors.textSubtle}
                        keyboardType="numeric"
                        value={maxSquadSize}
                        onChangeText={setMaxSquadSize}
                      />
                    </View>
                  </View>
                )}
              </View>

              {/* 2. WINNING PRIZES CARD */}
              <View style={styles.sectionCard}>
                <View style={styles.cardHeaderRow}>
                  <MaterialCommunityIcons name="trophy" size={18} color="#18181B" />
                  <Text style={styles.sectionCardTitle}>WINNING PRIZES</Text>
                </View>

                <View style={styles.chipsWrap}>
                  {[
                    { id: 'BOTH', label: 'Trophies & Cash' },
                    { id: 'CASH', label: 'Cash Prize Only' },
                    { id: 'TROPHIES', label: 'Trophies Only' }
                  ].map((pz) => {
                    const isSelected = winningPrizeType === pz.id;
                    return (
                      <TouchableOpacity
                        key={pz.id}
                        style={[styles.chipPill, isSelected && styles.chipPillActive]}
                        onPress={() => setWinningPrizeType(pz.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                          {pz.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {(winningPrizeType === 'CASH' || winningPrizeType === 'BOTH') && (
                  <View style={styles.rowInputs}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>1st Winner Prize (₹)</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g. 21000"
                        placeholderTextColor={themeColors.textSubtle}
                        keyboardType="numeric"
                        value={firstPrize}
                        onChangeText={setFirstPrize}
                      />
                    </View>

                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>Runner-Up Prize (₹)</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g. 11000"
                        placeholderTextColor={themeColors.textSubtle}
                        keyboardType="numeric"
                        value={runnerUpPrize}
                        onChangeText={setRunnerUpPrize}
                      />
                    </View>
                  </View>
                )}
              </View>

              {/* 3. RULES & REGULATIONS TEXT BOX */}
              <View style={styles.sectionCard}>
                <View style={styles.cardHeaderRow}>
                  <MaterialCommunityIcons name="book-open-outline" size={18} color="#18181B" />
                  <Text style={styles.sectionCardTitle}>RULES & REGULATIONS (OPTIONAL)</Text>
                </View>
                <Text style={styles.sectionCardSub}>
                  Specify custom ground rules, powerplay rules, mankad rules, dress code, etc.
                </Text>

                <TextInput
                  style={[styles.textInput, styles.rulesMultilineInput]}
                  placeholder="e.g. 10 Overs per match, Max 2 overs per bowler, Mankad not allowed, Super Over for tie..."
                  placeholderTextColor={themeColors.textSubtle}
                  multiline
                  numberOfLines={4}
                  value={tournamentRules}
                  onChangeText={setTournamentRules}
                />
              </View>

              {/* 4. PREVIOUS PLAYERS NOTIFICATION CARD */}
              <View style={styles.sectionCard}>
                <View style={styles.toggleRow}>
                  <View style={styles.toggleTextWrap}>
                    <Text style={styles.toggleTitle}>Notify players of previous tournaments</Text>
                    <Text style={styles.toggleSub}>
                      Broadcast tournament announcement to your ground players & team captains.
                    </Text>
                  </View>
                  <Switch
                    value={informPreviousPlayers}
                    onValueChange={setInformPreviousPlayers}
                    trackColor={{ false: '#E2E8F0', true: '#18181B' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>

              {/* 5. SUMMARY REVIEW CARD */}
              <View style={styles.summaryReviewCard}>
                <View style={styles.cardHeaderRow}>
                  <Ionicons name="checkmark-done-circle" size={18} color="#059669" />
                  <Text style={[styles.sectionCardTitle, { color: '#059669' }]}>TOURNAMENT SUMMARY REVIEW</Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tournament:</Text>
                  <Text style={styles.summaryVal}>{tournamentName || 'Unnamed Tournament'}</Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>City & Venue:</Text>
                  <Text style={styles.summaryVal}>
                    {city || 'Location'} • {venues.length > 0 ? `${venues.length} Ground(s)` : 'Main Ground'}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Structure:</Text>
                  <Text style={styles.summaryVal}>
                    {tournamentType === 'LEAGUE_KNOCKOUT'
                      ? 'League + Knockout'
                      : tournamentType === 'LEAGUE'
                      ? 'Round-Robin League'
                      : 'Direct Knockout'}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Rules:</Text>
                  <Text style={styles.summaryVal}>
                    {selectedCategory} • {selectedPitch} • {selectedFormat}
                  </Text>
                </View>
              </View>

              {/* 6. FINAL SUBMIT BUTTON */}
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSubmit}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="trophy" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.submitBtnText}>CREATE TOURNAMENT & LAUNCH HUB</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        <PhoneLoginModal
          visible={loginModalVisible}
          onClose={() => {
            setLoginModalVisible(false);
            if (!currentUser) {
              onBack();
            }
          }}
          onSuccess={(res) => {
            const loggedInUser = res?.user || null;
            setCurrentUser(loggedInUser);
            if (loggedInUser?.name) setOrganiserName(loggedInUser.name);
            if (loggedInUser?.phone) setOrganiserPhone(loggedInUser.phone);
          }}
          title="Host a Tournament"
          subtitle="Please verify your mobile number to create and manage this tournament."
        />

        <CricCalendarModal
          visible={calendarModalVisible}
          mode="range"
          initialStartDate={startDate}
          initialEndDate={endDate}
          title="Tournament Dates"
          subtitle="Choose tournament starting & ending dates"
          onClose={() => setCalendarModalVisible(false)}
          onSelectRange={({ startDate: sDate, endDate: eDate }) => {
            setStartDate(sDate);
            setEndDate(eDate);
          }}
        />

        <LocationPickerModal
          visible={locationModalVisible}
          currentLocation={location}
          currentCity={city}
          title="Select Tournament Location"
          onClose={() => setLocationModalVisible(false)}
          onSelectLocation={handleSelectLocation}
        />
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
    borderBottomWidth: 0,
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
  stepCounterBadge: {
    backgroundColor: themeColors.surfaceOffWhite,
    borderWidth: 0,
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
    borderBottomWidth: 0,
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
    borderWidth: 0,
    overflow: 'hidden',
    paddingBottom: 12,
    alignItems: 'center'
  },
  bannerPickerCard: {
    width: '100%',
    height: 140,
    backgroundColor: themeColors.surfaceOffWhite,
    borderBottomWidth: 0,
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
    gap: 4
  },
  bannerPlaceholderText: {
    fontSize: 12.5,
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
    borderWidth: 0,
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
    borderWidth: 0,
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
    borderRadius: 14,
    borderWidth: 0,
    padding: 16,
    gap: 12
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  sectionCardTitle: {
    fontSize: 11.5,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary,
    letterSpacing: 0.8
  },
  sectionCardSub: {
    fontSize: 11.5,
    fontFamily: systemFont,
    color: themeColors.textSecondary,
    marginTop: -4
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
    borderWidth: 0,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: systemFont,
    color: themeColors.textPrimary,
    minHeight: 44
  },
  cityInputWrapper: {
    position: 'relative',
    justifyContent: 'center'
  },
  cityInputIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 2
  },
  cityTextInput: {
    paddingLeft: 38,
    paddingRight: 36
  },
  cityPickerDisplayText: {
    fontSize: 14,
    fontFamily: systemFont,
    color: themeColors.textPrimary
  },
  clearCityBtn: {
    position: 'absolute',
    right: 12,
    zIndex: 2,
    padding: 4
  },
  suggestionsContainer: {
    backgroundColor: themeColors.surface,
    borderWidth: 0,
    borderRadius: 10,
    marginTop: 4,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 0
  },
  suggestionText: {
    fontSize: 13,
    fontFamily: systemFontMedium,
    color: themeColors.textPrimary
  },
  addVenueInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  addVenueBtn: {
    backgroundColor: '#18181B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 10,
    height: 44,
    gap: 4
  },
  addVenueBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: systemFontBold
  },
  venueChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4
  },
  venueChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.surfaceOffWhite,
    borderWidth: 0,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    maxWidth: '100%'
  },
  venueChipText: {
    fontSize: 12,
    fontFamily: systemFontMedium,
    color: themeColors.textPrimary,
    maxWidth: 200
  },
  removeVenueChipBtn: {
    marginLeft: 6
  },
  venueEmptyHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2
  },
  venueEmptyHintText: {
    fontSize: 11,
    fontFamily: systemFont,
    color: themeColors.textMuted,
    flex: 1
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12
  },
  datePickerInputBtn: {
    backgroundColor: themeColors.surfaceOffWhite,
    borderWidth: 0,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44
  },
  datePickerText: {
    fontSize: 13,
    fontFamily: systemFontMedium,
    color: themeColors.textPrimary
  },
  structureList: {
    gap: 10,
    marginTop: 4
  },
  structureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.surfaceOffWhite,
    borderWidth: 0,
    borderRadius: 12,
    padding: 12,
    gap: 12
  },
  structureCardActive: {
    backgroundColor: '#FAFAFA'
  },
  structureIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#18181B',
    alignItems: 'center',
    justifyContent: 'center'
  },
  structureContent: {
    flex: 1,
    gap: 2
  },
  structureTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  structureTitle: {
    fontSize: 13.5,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  structureTitleActive: {
    color: '#18181B'
  },
  recommendedBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 0,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4
  },
  recommendedBadgeText: {
    fontSize: 9.5,
    fontFamily: systemFontBold,
    color: '#B45309'
  },
  structureDesc: {
    fontSize: 11,
    fontFamily: systemFont,
    color: themeColors.textSecondary,
    lineHeight: 15
  },
  structureDescActive: {
    color: themeColors.textPrimary
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
    borderWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20
  },
  chipPillActive: {
    backgroundColor: '#18181B'
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
  expandedSectionWrap: {
    gap: 12
  },
  dividerLine: {
    height: 1,
    backgroundColor: themeColors.border,
    marginVertical: 4
  },
  rulesMultilineInput: {
    height: 85,
    textAlignVertical: 'top',
    paddingTop: 10
  },
  summaryReviewCard: {
    borderRadius: 14,
    borderWidth: 0,
    backgroundColor: '#F0FDF4',
    padding: 14,
    gap: 8
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: systemFont,
    color: themeColors.textSecondary
  },
  summaryVal: {
    fontSize: 12,
    fontFamily: systemFontMedium,
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
    flexDirection: 'row',
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
