import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  themeColors,
  systemFont,
  systemFontMedium,
  systemFontBold
import { getTournamentByJoinCode, registerTeamViaJoinCode } from '../../services/teamService.js';
import { showToast } from '../../services/toastService.js';
import { TeamIdentityMark } from '../TeamIdentityMark.jsx';

const DEFAULT_COLOR_SWATCHES = [
  '#18181B', // Jet Black
  '#1D4ED8', // Navy Blue
  '#DC2626', // Crimson Red
  '#059669', // Emerald Green
  '#D97706', // Warm Amber
  '#7C3AED'  // Royal Purple
];

export function CaptainTeamRegistrationModal({
  visible,
  onClose,
  initialJoinCode = '',
  onRegistrationSuccess
}) {
  const [joinCode, setJoinCode] = useState(initialJoinCode);
  const [isSearchingTourn, setIsSearchingTourn] = useState(false);
  const [targetTournament, setTargetTournament] = useState(null);

  // Team Form
  const [teamName, setTeamName] = useState('');
  const [city, setCity] = useState('');
  const [captainName, setCaptainName] = useState('');
  const [captainPhone, setCaptainPhone] = useState('');
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLOR_SWATCHES[0]);
  const [logoUri, setLogoUri] = useState(null);
  const [squadList, setSquadList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialJoinCode) {
      setJoinCode(initialJoinCode);
      handleLookupTournament(initialJoinCode);
    }
  }, [initialJoinCode]);

  const handleLookupTournament = async (codeToLookup = joinCode) => {
    const clean = (codeToLookup || '').trim();
    if (!clean) return;

    setIsSearchingTourn(true);
    try {
      const tourn = await getTournamentByJoinCode(clean);
      if (tourn) {
        setTargetTournament(tourn);
        setCity(tourn.city || '');
      } else {
        setTargetTournament(null);
        showToast('No tournament found for this code. Please verify.', 'error');
      }
    } catch (e) {
      console.warn('Lookup error:', e);
    } finally {
      setIsSearchingTourn(false);
    }
  };

  const handlePickLogo = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Permission to access media gallery is needed to select team logo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setLogoUri(result.assets[0].uri);
      }
    } catch (err) {
      console.log('Logo picker error:', err);
    }
  };

  const handleSubmitRegistration = async () => {
    if (!targetTournament) {
      Alert.alert('Tournament Required', 'Please enter a valid Tournament Join Code first.');
      return;
    }
    if (!teamName.trim()) {
      Alert.alert('Required Field', 'Please enter your Team Name.');
      return;
    }
    if (!captainPhone.trim()) {
      Alert.alert('Required Field', 'Please enter Captain Mobile Number.');
      return;
    }

    const cleanTeamName = teamName.trim();
    const finalPlayers = squadList.length > 0 ? squadList : [
      { id: `sp_${Date.now()}_1`, name: captainName.trim() || 'Captain', role: 'All-Rounder', isCaptain: true, phone: captainPhone.trim() }
    ];

    const teamData = {
      id: `team_${Date.now()}`,
      name: cleanTeamName,
      shortName: cleanTeamName.slice(0, 4).toUpperCase(),
      city: city.trim() || targetTournament.city || 'Local Ground',
      captainName: captainName.trim() || 'Captain',
      captainPhone: captainPhone.trim(),
      color: selectedColor,
      cardBg: `${selectedColor}15`,
      logoUri: logoUri,
      icon: 'shield-half-full',
      count: `${finalPlayers.length} Players`,
      playersCount: finalPlayers.length,
      players: finalPlayers
    };

    setIsSubmitting(true);
    try {
      const res = await registerTeamViaJoinCode(joinCode, teamData);
      showToast(`Team "${cleanTeamName}" registered successfully!`, 'success');
      if (onRegistrationSuccess) {
        onRegistrationSuccess(res);
      }
      handleClose();
    } catch (err) {
      Alert.alert('Registration Failed', err.message || 'Could not register team. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setJoinCode('');
    setTargetTournament(null);
    setTeamName('');
    setCity('');
    setCaptainName('');
    setCaptainPhone('');
    setSquadList([]);
    setLogoUri(null);
    if (onClose) onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <Pressable style={styles.modalBackdrop} onPress={handleClose} />

        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialCommunityIcons name="shield-account-outline" size={22} color={themeColors.textPrimary} />
              <Text style={styles.headerTitle}>Captain Team Registration</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={themeColors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: '85%' }} showsVerticalScrollIndicator={false}>
            {/* ── STEP 1: TOURNAMENT JOIN CODE ── */}
            <View style={styles.codeSection}>
              <Text style={styles.inputLabel}>ENTER TOURNAMENT JOIN CODE *</Text>
              <View style={styles.codeSearchRow}>
                <TextInput
                  style={styles.codeInput}
                  placeholder="e.g. CF-SPL26 or TOUR8421"
                  placeholderTextColor={themeColors.textSubtle}
                  value={joinCode}
                  onChangeText={setJoinCode}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={styles.lookupBtn}
                  onPress={() => handleLookupTournament()}
                  activeOpacity={0.8}
                >
                  <Ionicons name="search" size={16} color="#FFFFFF" />
                  <Text style={styles.lookupBtnText}>Verify</Text>
                </TouchableOpacity>
              </View>

              {/* Tournament Match Card */}
              {targetTournament && (
                <View style={styles.tournCard}>
                  <View style={styles.tournIconBox}>
                    <MaterialCommunityIcons name="trophy" size={20} color="#0284C7" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.tournCardName}>{targetTournament.name || targetTournament.title}</Text>
                    <Text style={styles.tournCardSub}>
                      {targetTournament.city || 'Local Ground'} • Organized by {targetTournament.host || targetTournament.organiserName || 'Tournament Host'}
                    </Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                </View>
              )}
            </View>

            {/* ── STEP 2: TEAM DETAILS FORM ── */}
            <View style={styles.formSection}>
              {/* Circular Team Logo Picker */}
              <View style={styles.logoPickerCenter}>
                <TouchableOpacity
                  style={[styles.circularLogoBox, { borderColor: selectedColor }]}
                  onPress={handlePickLogo}
                  activeOpacity={0.8}
                >
                  {logoUri ? (
                    <Image source={{ uri: logoUri }} style={styles.circularLogoImg} />
                  ) : (
                    <View style={[styles.logoPlaceholder, { backgroundColor: `${selectedColor}15` }]}>
                      {teamName.trim().length > 0 ? (
                        <Text style={[styles.logoInitialText, { color: selectedColor }]}>
                          {teamName.trim().slice(0, 2).toUpperCase()}
                        </Text>
                      ) : (
                        <Ionicons name="camera-outline" size={26} color={selectedColor} />
                      )}
                    </View>
                  )}
                  <View style={styles.cameraIconBadge}>
                    <Ionicons name="camera" size={12} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
                <Text style={styles.logoPickerHint}>Tap to upload Team Logo (1:1)</Text>
              </View>

              {/* Team Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>TEAM NAME *</Text>
                <TextInput
                  style={styles.modalTextInput}
                  placeholder="e.g. Nagaur Blasters"
                  placeholderTextColor={themeColors.textSubtle}
                  value={teamName}
                  onChangeText={setTeamName}
                />
              </View>

              {/* City */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CITY / LOCALITY</Text>
                <TextInput
                  style={styles.modalTextInput}
                  placeholder="e.g. Sadokan / Nagaur"
                  placeholderTextColor={themeColors.textSubtle}
                  value={city}
                  onChangeText={setCity}
                />
              </View>

              {/* Captain Mobile Number */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CAPTAIN MOBILE NUMBER *</Text>
                <View style={styles.phoneInputWrap}>
                  <Ionicons name="call-outline" size={16} color={themeColors.textMuted} />
                  <TextInput
                    style={styles.phoneTextInput}
                    placeholder="e.g. 9876543210"
                    placeholderTextColor={themeColors.textSubtle}
                    keyboardType="phone-pad"
                    value={captainPhone}
                    onChangeText={setCaptainPhone}
                  />
                </View>
              </View>

              {/* Captain Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CAPTAIN NAME</Text>
                <TextInput
                  style={styles.modalTextInput}
                  placeholder="e.g. Bastiram"
                  placeholderTextColor={themeColors.textSubtle}
                  value={captainName}
                  onChangeText={setCaptainName}
                />
              </View>

              {/* Color Swatch */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>TEAM COLOR BADGE</Text>
                <View style={styles.swatchesRow}>
                  {DEFAULT_COLOR_SWATCHES.map(color => (
                    <TouchableOpacity
                      key={color}
                      style={[styles.colorSwatch, { backgroundColor: color }, selectedColor === color && styles.colorSwatchActive]}
                      onPress={() => setSelectedColor(color)}
                    >
                      {selectedColor === color && (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitRegisterBtn, isSubmitting && { opacity: 0.6 }]}
                onPress={handleSubmitRegistration}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.submitRegisterBtnText}>
                  {isSubmitting ? 'Registering Team...' : 'Submit & Register Team'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.5)'
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject
  },
  modalSheet: {
    backgroundColor: themeColors.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 24,
    maxHeight: '94%'
  },
  modalHandle: {
    width: 38,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 10
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  closeBtn: {
    padding: 4
  },
  codeSection: {
    marginTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border
  },
  inputLabel: {
    fontSize: 11,
    fontFamily: systemFontBold,
    color: themeColors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 6
  },
  codeSearchRow: {
    flexDirection: 'row',
    gap: 8
  },
  codeInput: {
    flex: 1,
    backgroundColor: themeColors.surfaceOffWhite,
    borderWidth: 1,
    borderColor: themeColors.borderDark,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  lookupBtn: {
    backgroundColor: '#18181B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    borderRadius: 10
  },
  lookupBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontFamily: systemFontBold
  },
  tournCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 10,
    padding: 10,
    marginTop: 10
  },
  tournIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center'
  },
  tournCardName: {
    fontSize: 13,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  tournCardSub: {
    fontSize: 11,
    fontFamily: systemFont,
    color: themeColors.textSecondary
  },
  formSection: {
    marginTop: 12,
    gap: 12
  },
  logoPickerCenter: {
    alignItems: 'center',
    marginBottom: 4
  },
  circularLogoBox: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    overflow: 'visible',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center'
  },
  circularLogoImg: {
    width: 64,
    height: 64,
    borderRadius: 32
  },
  logoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center'
  },
  logoInitialText: {
    fontSize: 20,
    fontFamily: systemFontBold
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#18181B',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF'
  },
  logoPickerHint: {
    fontSize: 11,
    fontFamily: systemFont,
    color: themeColors.textMuted,
    marginTop: 6
  },
  inputGroup: {
    gap: 4
  },
  modalTextInput: {
    backgroundColor: themeColors.surfaceOffWhite,
    borderWidth: 1,
    borderColor: themeColors.borderDark,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    fontFamily: systemFont,
    color: themeColors.textPrimary
  },
  phoneInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.surfaceOffWhite,
    borderWidth: 1,
    borderColor: themeColors.borderDark,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    gap: 8
  },
  phoneTextInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: systemFont,
    color: themeColors.textPrimary
  },
  swatchesRow: {
    flexDirection: 'row',
    gap: 10
  },
  colorSwatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center'
  },
  colorSwatchActive: {
    borderWidth: 2,
    borderColor: '#0284C7'
  },
  squadBoxSection: {
    backgroundColor: themeColors.surfaceOffWhite,
    borderWidth: 1,
    borderColor: themeColors.border,
    borderRadius: 12,
    padding: 12
  },
  squadBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  squadCountSub: {
    fontSize: 11,
    fontFamily: systemFont,
    color: themeColors.textMuted
  },
  pasteSquadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  pasteSquadBtnText: {
    fontSize: 11.5,
    fontFamily: systemFontBold,
    color: '#16A34A'
  },
  squadPreviewChipsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10
  },
  playerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: themeColors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  playerChipName: {
    fontSize: 11.5,
    fontFamily: systemFontMedium,
    color: themeColors.textPrimary
  },
  captainBadge: {
    backgroundColor: '#18181B',
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: systemFontBold,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3
  },
  wkBadge: {
    backgroundColor: '#0284C7',
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: systemFontBold,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3
  },
  morePlayersChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  morePlayersText: {
    fontSize: 11,
    fontFamily: systemFontMedium,
    color: themeColors.textMuted
  },
  submitRegisterBtn: {
    backgroundColor: '#18181B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: 10,
    marginTop: 8
  },
  submitRegisterBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontFamily: systemFontBold
  }
});
