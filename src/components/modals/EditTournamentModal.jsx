import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Image,
  StyleSheet,
  Alert,
  Keyboard,
  StatusBar,
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
} from '../../theme.js';
import {
  saveTournament,
  deleteTournament
} from '../../services/tournamentService.js';
import { CricCalendarModal, formatCricDate } from './CricCalendarModal.jsx';
import { LocationPickerModal } from './LocationPickerModal.jsx';
import { getCurrentGpsLocation } from '../../services/locationService.js';

export function EditTournamentModal({
  visible = false,
  onClose = () => {},
  tournament = null,
  onTournamentUpdated = () => {},
  onTournamentDeleted = () => {}
}) {
  if (!tournament) return null;

  // Form State
  const [tournamentName, setTournamentName] = useState('');
  const [city, setCity] = useState('');
  const [location, setLocation] = useState(null);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Venues
  const [venues, setVenues] = useState([]);
  const [currentVenueInput, setCurrentVenueInput] = useState('');

  // Dates
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);

  // Structure & Rules
  const [tournamentType, setTournamentType] = useState('LEAGUE_KNOCKOUT');
  const [selectedCategory, setSelectedCategory] = useState('OPEN');
  const [selectedBall, setSelectedBall] = useState('tennis_red');
  const [selectedPitch, setSelectedPitch] = useState('TURF');
  const [selectedFormat, setSelectedFormat] = useState('LIMITED OVERS');
  const [matchesOnType, setMatchesOnType] = useState('ALL DAYS');
  const [matchTimingType, setMatchTimingType] = useState('DAY');

  // Prizes & Details
  const [needMoreTeams, setNeedMoreTeams] = useState(true);
  const [entryFee, setEntryFee] = useState('');
  const [totalTeamsCount, setTotalTeamsCount] = useState('8');
  const [maxSquadSize, setMaxSquadSize] = useState('15');
  const [winningPrizeType, setWinningPrizeType] = useState('BOTH');
  const [firstPrize, setFirstPrize] = useState('');
  const [runnerUpPrize, setRunnerUpPrize] = useState('');
  const [tournamentRules, setTournamentRules] = useState('');
  const [bannerUri, setBannerUri] = useState(null);
  const [logoUri, setLogoUri] = useState(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Populate from active tournament when opened
  useEffect(() => {
    if (tournament) {
      setTournamentName(tournament.name || tournament.title || tournament.fullName || '');
      setLocation(tournament.location || null);
      setCity(tournament.city || tournament.location?.formattedAddress || tournament.host || '');
      setVenues(Array.isArray(tournament.venues) ? tournament.venues : (tournament.venue ? [tournament.venue] : []));
      setStartDate(tournament.startDate || formatCricDate(new Date()));
      setEndDate(tournament.endDate || '');
      setTournamentType(tournament.tournamentType || tournament.structure || 'LEAGUE_KNOCKOUT');
      setSelectedCategory(tournament.category || 'OPEN');
      setSelectedBall(tournament.ballType || 'tennis_red');
      setSelectedPitch(tournament.pitchType || 'TURF');
      setSelectedFormat(tournament.format || 'LIMITED OVERS');
      setMatchesOnType(tournament.matchDays || tournament.matchesOn || 'ALL DAYS');
      setMatchTimingType(tournament.matchTiming || 'DAY');
      setNeedMoreTeams(tournament.needMoreTeams !== undefined ? Boolean(tournament.needMoreTeams) : true);
      setEntryFee(tournament.entryFee ? String(tournament.entryFee).replace(/[^0-9]/g, '') : '');
      setTotalTeamsCount(tournament.totalTeamsCount ? String(tournament.totalTeamsCount) : '8');
      setMaxSquadSize(tournament.maxSquadSize ? String(tournament.maxSquadSize) : '15');
      setWinningPrizeType(tournament.winningPrizeType || 'BOTH');
      setFirstPrize(tournament.firstPrize ? String(tournament.firstPrize).replace(/[^0-9]/g, '') : '');
      setRunnerUpPrize(tournament.runnerUpPrize ? String(tournament.runnerUpPrize).replace(/[^0-9]/g, '') : '');
      setTournamentRules(tournament.rules || tournament.additionalNotes || '');
      setBannerUri(tournament.bannerUri || null);
      setLogoUri(tournament.logoUri || null);
    }
  }, [tournament, visible]);

  const categories = ['OPEN', 'CORPORATE', 'COMMUNITY', 'SCHOOL', 'COLLEGE', 'UNIVERSITY', 'SERIES', 'OTHER'];
  const ballTypes = [
    { id: 'tennis_red', label: 'Tennis (Red)', icon: 'baseball-outline' },
    { id: 'tennis_green', label: 'Tennis (Green)', icon: 'baseball-outline' },
    { id: 'leather', label: 'Leather', icon: 'baseball' },
    { id: 'plastic_other', label: 'Plastic / Tape', icon: 'ellipse-outline' }
  ];
  const pitchTypes = ['TURF', 'ASTROTURF', 'MATTING', 'CEMENT', 'ROUGH / DIRT'];
  const matchFormats = ['LIMITED OVERS', 'BOX / TURF CRICKET', 'PAIR CRICKET', 'TEST MATCH', 'THE HUNDRED'];

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
          res.message || 'Could not auto-detect GPS location. Please search manually.'
        );
      }
    } catch (e) {
      Alert.alert('GPS Location', 'GPS detection failed.');
    } finally {
      setGpsLoading(false);
    }
  };

  const handleSelectLocation = (selectedLoc) => {
    if (!selectedLoc) return;
    setLocation(selectedLoc);
    setCity(selectedLoc.formattedAddress || selectedLoc.city);
  };

  // Venue Handlers
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

  // Banner Picker
  const handlePickBanner = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Permission to access media library is required for banner.');
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
      console.log('Error picking banner:', err);
    }
  };

  // Logo Picker
  const handlePickLogo = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Permission to access media library is required for logo.');
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
      console.log('Error picking logo:', err);
    }
  };

  // Save Tournament Changes
  const handleSave = async () => {
    if (!tournamentName.trim()) {
      Alert.alert('Required Field', 'Please enter Tournament Name.');
      return;
    }
    if (!city.trim()) {
      Alert.alert('Required Field', 'Please enter City / Location.');
      return;
    }

    setSaving(true);
    const finalVenues = venues.length > 0 ? venues : [city.trim() || 'Main Ground'];

    const updatedTournamentData = {
      ...tournament,
      name: tournamentName.trim(),
      title: tournamentName.trim(),
      fullName: tournamentName.trim(),
      city: city.trim() || location?.formattedAddress || location?.city || '',
      location: location || (city.trim() ? { city: city.trim(), formattedAddress: city.trim() } : null),
      host: city.trim() || location?.formattedAddress || location?.city || 'Local Ground',
      venues: finalVenues,
      venue: finalVenues[0],
      startDate,
      endDate,
      duration: `${startDate} - ${endDate}`,
      tournamentType,
      structure: tournamentType,
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
      bannerUri,
      logoUri,
      updatedAt: new Date().toISOString()
    };

    try {
      await saveTournament(updatedTournamentData);
      setSaving(false);
      onTournamentUpdated(updatedTournamentData);
      onClose();
    } catch (err) {
      setSaving(false);
      Alert.alert('Error', 'Failed to update tournament.');
    }
  };

  // Delete Tournament with Double Confirmation
  const handleDelete = () => {
    Alert.alert(
      'Delete Tournament?',
      `Are you sure you want to delete "${tournament.name || tournament.title}"? All matches, teams, and tournament stats will be permanently removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            const success = await deleteTournament(tournament.id);
            setDeleting(false);
            if (success) {
              onTournamentDeleted(tournament.id);
              onClose();
            } else {
              Alert.alert('Error', 'Failed to delete tournament. Please try again.');
            }
          }
        }
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor={themeColors.surface} />
        <View style={styles.modalContainer}>
          {/* Header Bar */}
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={themeColors.textPrimary} />
            </TouchableOpacity>
          <View style={styles.modalHeaderTitleWrap}>
            <Text style={styles.modalHeaderTitle}>Edit Tournament</Text>
            <Text style={styles.modalHeaderSub}>Update details or delete tournament</Text>
          </View>
          <TouchableOpacity
            style={styles.saveHeaderBtn}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            <Text style={styles.saveHeaderBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Cover & Logo Banner */}
          <View style={styles.brandingContainer}>
            <TouchableOpacity style={styles.bannerPickerCard} onPress={handlePickBanner} activeOpacity={0.85}>
              {bannerUri ? (
                <Image source={{ uri: bannerUri }} style={styles.bannerImage} />
              ) : (
                <View style={styles.bannerPlaceholder}>
                  <Ionicons name="image-outline" size={26} color={themeColors.textMuted} />
                  <Text style={styles.bannerPlaceholderText}>Tap to Change Tournament Banner</Text>
                </View>
              )}
              <View style={styles.changeCoverBadge}>
                <Ionicons name="camera" size={12} color="#FFFFFF" />
                <Text style={styles.changeCoverBadgeText}>Cover</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.logoOverlapWrapper}>
              <TouchableOpacity style={styles.logoCircleCard} onPress={handlePickLogo} activeOpacity={0.85}>
                {logoUri ? (
                  <Image source={{ uri: logoUri }} style={styles.logoImage} />
                ) : (
                  <View style={styles.logoPlaceholder}>
                    <MaterialCommunityIcons name="trophy-outline" size={26} color={themeColors.primary} />
                    <Text style={styles.logoPlaceholderText}>Logo</Text>
                  </View>
                )}
                <View style={styles.logoCameraBadge}>
                  <Ionicons name="camera" size={11} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Tournament Name & City */}
          <View style={styles.sectionCard}>
            <View style={styles.cardHeaderRow}>
              <MaterialCommunityIcons name="trophy-award" size={18} color="#18181B" />
              <Text style={styles.sectionCardTitle}>TOURNAMENT IDENTIFICATION</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tournament Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Tournament Name"
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
                    borderWidth: 0,
                    borderColor: '#BAE6FD'
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

            {/* Dates */}
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Start Date</Text>
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
                <Text style={styles.inputLabel}>End Date</Text>
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

          {/* Grounds / Venues Manager */}
          <View style={styles.sectionCard}>
            <View style={styles.cardHeaderRow}>
              <MaterialCommunityIcons name="stadium-variant" size={18} color="#18181B" />
              <Text style={styles.sectionCardTitle}>TOURNAMENT GROUNDS</Text>
            </View>

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
              <TouchableOpacity style={styles.addVenueBtn} onPress={handleAddVenue} activeOpacity={0.8}>
                <Ionicons name="add" size={18} color="#FFFFFF" />
                <Text style={styles.addVenueBtnText}>Add</Text>
              </TouchableOpacity>
            </View>

            {venues.length > 0 && (
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
            )}
          </View>

          {/* Tournament Structure */}
          <View style={styles.sectionCard}>
            <View style={styles.cardHeaderRow}>
              <MaterialCommunityIcons name="tournament" size={18} color="#18181B" />
              <Text style={styles.sectionCardTitle}>TOURNAMENT STRUCTURE</Text>
            </View>

            <View style={styles.structureList}>
              {[
                { id: 'LEAGUE_KNOCKOUT', title: 'League + Knockout (Hybrid)', desc: 'Group matches + Points Table + Semi & Finals' },
                { id: 'LEAGUE', title: 'Round-Robin League Only', desc: 'All teams play against each other' },
                { id: 'KNOCKOUT', title: 'Direct Knockout (Elimination)', desc: 'Single match knockout bracket' }
              ].map((item) => {
                const isSelected = tournamentType === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.structureCard, isSelected && styles.structureCardActive]}
                    onPress={() => setTournamentType(item.id)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.structureContent}>
                      <Text style={[styles.structureTitle, isSelected && styles.structureTitleActive]}>
                        {item.title}
                      </Text>
                      <Text style={styles.structureDesc}>{item.desc}</Text>
                    </View>
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={20}
                      color={isSelected ? '#18181B' : '#94A3B8'}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Category, Ball, Pitch */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionCardTitle}>CATEGORY & BALL TYPE</Text>
            <View style={styles.chipsWrap}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chipPill, selectedCategory === cat && styles.chipPillActive]}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.chipsWrap, { marginTop: 6 }]}>
              {ballTypes.map((ball) => (
                <TouchableOpacity
                  key={ball.id}
                  style={[styles.chipPill, selectedBall === ball.id && styles.chipPillActive]}
                  onPress={() => setSelectedBall(ball.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={ball.icon}
                    size={15}
                    color={selectedBall === ball.id ? '#FFFFFF' : themeColors.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.chipText, selectedBall === ball.id && styles.chipTextActive]}>
                    {ball.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Schedule Days & Timing */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionCardTitle}>SCHEDULE DAYS & TIMINGS</Text>
            <View style={styles.chipsWrap}>
              {[
                { id: 'ALL DAYS', label: 'All Days' },
                { id: 'WEEKENDS', label: 'Weekends Only' },
                { id: 'WEEKDAYS', label: 'Weekdays Only' }
              ].map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.chipPill, matchesOnType === item.id && styles.chipPillActive]}
                  onPress={() => setMatchesOnType(item.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, matchesOnType === item.id && styles.chipTextActive]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.chipsWrap, { marginTop: 6 }]}>
              {[
                { id: 'DAY', label: 'Day (Sunlight)', icon: 'sunny-outline' },
                { id: 'NIGHT', label: 'Night (Floodlights)', icon: 'cloudy-night-outline' },
                { id: 'DAY_NIGHT', label: 'Day & Night Both', icon: 'contrast-outline' }
              ].map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.chipPill, matchTimingType === item.id && styles.chipPillActive]}
                  onPress={() => setMatchTimingType(item.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={item.icon}
                    size={15}
                    color={matchTimingType === item.id ? '#FFFFFF' : themeColors.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.chipText, matchTimingType === item.id && styles.chipTextActive]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Prizes & Registration */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionCardTitle}>WINNING PRIZES & ENTRY</Text>
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Entry Fee (₹)</Text>
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
                <Text style={styles.inputLabel}>1st Prize (₹)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 21000"
                  placeholderTextColor={themeColors.textSubtle}
                  keyboardType="numeric"
                  value={firstPrize}
                  onChangeText={setFirstPrize}
                />
              </View>
            </View>
          </View>

          {/* Custom Rules */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionCardTitle}>CUSTOM TOURNAMENT RULES</Text>
            <TextInput
              style={[styles.textInput, styles.rulesMultilineInput]}
              placeholder="e.g. 10 Overs per match, Max 2 overs per bowler, Mankad not allowed..."
              placeholderTextColor={themeColors.textSubtle}
              multiline
              numberOfLines={4}
              value={tournamentRules}
              onChangeText={setTournamentRules}
            />
          </View>

          {/* Bottom Actions: Save & Delete */}
          <View style={styles.bottomActionsWrap}>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="content-save-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.saveBtnText}>{saving ? 'UPDATING...' : 'SAVE & UPDATE TOURNAMENT'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={handleDelete}
              disabled={deleting}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" style={{ marginRight: 8 }} />
              <Text style={styles.deleteBtnText}>{deleting ? 'DELETING...' : 'DELETE TOURNAMENT'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

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
          title="Edit Tournament Location"
          onClose={() => setLocationModalVisible(false)}
          onSelectLocation={handleSelectLocation}
        />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: themeColors.surface
  },
  modalContainer: {
    flex: 1,
    backgroundColor: themeColors.appBackground
  },
  modalHeader: {
    height: 54,
    backgroundColor: themeColors.surface,
    borderBottomWidth: 0,
    borderBottomColor: themeColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'flex-start',
    justifyContent: 'center'
  },
  modalHeaderTitleWrap: {
    alignItems: 'center'
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  modalHeaderSub: {
    fontSize: 10,
    fontFamily: systemFont,
    color: themeColors.textMuted
  },
  saveHeaderBtn: {
    backgroundColor: '#18181B',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8
  },
  saveHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontFamily: systemFontBold
  },
  scrollArea: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16
  },
  brandingContainer: {
    backgroundColor: themeColors.surface,
    borderRadius: 14,
    borderWidth: 0,
    borderColor: themeColors.border,
    overflow: 'hidden',
    paddingBottom: 10,
    alignItems: 'center'
  },
  bannerPickerCard: {
    width: '100%',
    height: 125,
    backgroundColor: themeColors.surfaceOffWhite,
    borderBottomWidth: 0,
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
    gap: 4
  },
  bannerPlaceholderText: {
    fontSize: 12,
    fontFamily: systemFontMedium,
    color: themeColors.textPrimary
  },
  changeCoverBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(24, 24, 27, 0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  changeCoverBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: systemFontBold
  },
  logoOverlapWrapper: {
    marginTop: -38,
    alignItems: 'center'
  },
  logoCircleCard: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FFFFFF',
    borderWidth: 0,
    borderColor: '#FFFFFF',
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
    width: 70,
    height: 70,
    borderRadius: 35,
    resizeMode: 'cover'
  },
  logoPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: themeColors.surfaceOffWhite,
    alignItems: 'center',
    justifyContent: 'center'
  },
  logoPlaceholderText: {
    fontSize: 9,
    fontFamily: systemFontBold,
    color: themeColors.primary
  },
  logoCameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#18181B',
    borderWidth: 0,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
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
    elevation: 3
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
  structureList: {
    gap: 8
  },
  structureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.surfaceOffWhite,
    borderWidth: 0,
    borderRadius: 10,
    padding: 12,
    gap: 10
  },
  structureCardActive: {
    backgroundColor: '#FAFAFA'
  },
  structureContent: {
    flex: 1,
    gap: 2
  },
  structureTitle: {
    fontSize: 13,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  structureTitleActive: {
    color: '#18181B'
  },
  structureDesc: {
    fontSize: 11,
    fontFamily: systemFont,
    color: themeColors.textSecondary
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
  rulesMultilineInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 10
  },
  bottomActionsWrap: {
    gap: 10,
    marginTop: 8
  },
  saveBtn: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontFamily: systemFontBold,
    letterSpacing: 0.5
  },
  deleteBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 0,
    borderRadius: 12,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  deleteBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontFamily: systemFontBold,
    letterSpacing: 0.5
  }
});

export default EditTournamentModal;
