import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Alert
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  themeColors,
  systemFont,
  systemFontMedium,
  systemFontBold
} from '../../theme.js';
import { showToast } from '../../services/toastService.js';
import { fetchGlobalTeams, saveGlobalTeam, searchGlobalTeams } from '../../services/teamService.js';
import { TeamIdentityMark } from '../TeamIdentityMark.jsx';

const DEFAULT_COLOR_SWATCHES = [
  '#18181B', // Jet Black
  '#1D4ED8', // Navy Blue
  '#DC2626', // Crimson Red
  '#059669', // Emerald Green
  '#D97706', // Warm Amber
  '#7C3AED'  // Royal Purple
];

export function AddTeamHubModal({
  visible,
  onClose,
  tournament,
  onAddTeam,
  savedTeams = [],
  localPlayers = []
}) {
  // Active Mode: 'MANUAL' | 'SHARE' | 'SAVED' | 'QR'
  const [activeMode, setActiveMode] = useState('MANUAL');

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Global Teams Pool
  const [globalTeams, setGlobalTeams] = useState([]);

  // Form State (Mode 1: Create)
  const [teamName, setTeamName] = useState('');
  const [city, setCity] = useState(tournament?.city || tournament?.host || '');
  const [captainName, setCaptainName] = useState('');
  const [captainPhone, setCaptainPhone] = useState('');
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLOR_SWATCHES[0]);
  const [logoUri, setLogoUri] = useState(null);
  const [squadPlayers, setSquadPlayers] = useState([]);

  // Load global teams directory on open
  useEffect(() => {
    if (visible) {
      fetchGlobalTeams().then(teams => {
        if (Array.isArray(teams)) {
          setGlobalTeams(teams);
        }
      }).catch(() => {});
    }
  }, [visible]);

  // Tournament Code Generator
  const tournamentCode = useMemo(() => {
    if (!tournament) return 'CF-8421';
    const rawId = tournament.id || 'TOUR8421';
    const cleanPrefix = (tournament.name || tournament.title || 'TOUR')
      .replace(/[^A-Za-z0-9]/g, '')
      .slice(0, 4)
      .toUpperCase();
    const cleanSuffix = rawId.slice(-4).toUpperCase();
    return `CF-${cleanPrefix}${cleanSuffix}`;
  }, [tournament]);

  // Combined Saved Teams Pool (Global + Props)
  const allAvailableTeams = useMemo(() => {
    const combined = [...(Array.isArray(savedTeams) ? savedTeams : []), ...globalTeams];
    const map = new Map();
    combined.forEach(t => {
      if (t && t.name) {
        const key = t.name.trim().toLowerCase();
        if (!map.has(key)) map.set(key, t);
      }
    });
    return Array.from(map.values());
  }, [savedTeams, globalTeams]);

  // Search Results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchGlobalTeams(searchQuery, allAvailableTeams);
  }, [searchQuery, allAvailableTeams]);

  // Pick Team Logo Image (1:1 Aspect Ratio)
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

  // WhatsApp Share Invite Link & Code
  const handleShareInvite = async () => {
    try {
      const tourName = tournament?.name || tournament?.title || 'Cricket Tournament';
      const tourCity = tournament?.city || tournament?.host || 'Local Ground';
      const tourDates = tournament?.duration || tournament?.startDate || 'Season 2026';
      
      const msg = `*Team Registration Open: ${tourName}*\n*Location:* ${tourCity}\n*Dates:* ${tourDates}\n\n*Captains, register your team & squad directly on CricFlow:*\nIn-App Join Code: *${tournamentCode}*\n\nTrack ball-by-ball live scoring, leaderboard stats, and points table in real-time!`;

      await Share.share({
        message: msg,
        title: `Register for ${tourName}`
      });
    } catch (err) {
      console.log('Share invite error:', err);
    }
  };

  // Handle Save Manual Team
  const handleSaveTeam = async (continueAdding = false) => {
    if (!teamName.trim()) {
      Alert.alert('Required Field', 'Please enter Team Name.');
      return;
    }

    const cleanTeamName = teamName.trim();
    const finalPlayers = squadPlayers.length > 0 ? squadPlayers : [
      { id: `p_${Date.now()}_1`, name: captainName.trim() || 'Captain', role: 'All-Rounder', isCaptain: true, phone: captainPhone.trim() }
    ];

    const newTeamData = {
      id: `team_${Date.now()}`,
      name: cleanTeamName,
      shortName: cleanTeamName.slice(0, 4).toUpperCase(),
      city: city.trim() || tournament?.city || 'Local Ground',
      captainName: captainName.trim() || (finalPlayers[0]?.name || 'Captain'),
      captainPhone: captainPhone.trim() || (finalPlayers[0]?.phone || ''),
      color: selectedColor,
      cardBg: `${selectedColor}15`,
      logoUri: logoUri,
      icon: 'shield-half-full',
      count: `${finalPlayers.length} Players`,
      playersCount: finalPlayers.length,
      players: finalPlayers
    };

    // Save to global directory
    saveGlobalTeam(newTeamData).catch(() => {});

    if (onAddTeam) {
      onAddTeam(newTeamData);
    }

    showToast(`Team "${cleanTeamName}" added successfully!`, 'success');

    if (continueAdding) {
      // Reset form for next team
      setTeamName('');
      setCaptainName('');
      setCaptainPhone('');
      setLogoUri(null);
      setSquadPlayers([]);
    } else {
      // Close modal
      handleClose();
    }
  };

  // Handle Quick Add from Search or Saved List
  const handleQuickAddTeam = (teamItem) => {
    const rawPlayers = Array.isArray(teamItem.players) ? teamItem.players : [];
    const teamData = {
      id: teamItem.id || `team_${Date.now()}`,
      name: teamItem.name,
      shortName: teamItem.shortName || teamItem.name.slice(0, 4).toUpperCase(),
      city: teamItem.city || tournament?.city || 'Local Ground',
      captainName: teamItem.captainName || 'Captain',
      captainPhone: teamItem.captainPhone || '',
      color: teamItem.color || selectedColor,
      cardBg: `${teamItem.color || selectedColor}15`,
      logoUri: teamItem.logoUri || null,
      logoKey: teamItem.logoKey || null,
      icon: 'shield-half-full',
      count: teamItem.count || `${rawPlayers.length || 11} Players`,
      playersCount: rawPlayers.length || 11,
      players: rawPlayers
    };

    if (onAddTeam) {
      onAddTeam(teamData);
    }

    showToast(`Team "${teamItem.name}" added to tournament!`, 'success');
  };

  // Reset & Close
  const handleClose = () => {
    setTeamName('');
    setCaptainName('');
    setCaptainPhone('');
    setLogoUri(null);
    setSquadPlayers([]);
    setSearchQuery('');
    setActiveMode('MANUAL');
    if (onClose) onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <Pressable style={styles.modalOverlay} onPress={handleClose}>
        <Pressable style={styles.modalContent} onPress={() => {}}>
          {/* Modal Handle */}
          <View style={styles.modalHandle} />

          {/* Header Row */}
          <View style={styles.modalHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialCommunityIcons name="shield-account-outline" size={22} color={themeColors.textPrimary} />
              <Text style={styles.modalTitle}>Add Teams to Tournament</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={themeColors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* ── 1. LIVE SEARCH BAR (Search All Global Ground Teams) ── */}
          <View style={styles.searchBarWrap}>
            <Ionicons name="search" size={18} color={themeColors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search existing ground teams / clubs..."
              placeholderTextColor={themeColors.textSubtle}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={themeColors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* SEARCH RESULTS DROPDOWN (If Searching) */}
          {searchQuery.trim().length > 0 && (
            <View style={styles.searchResultsBox}>
              <Text style={styles.searchResultsLabel}>SEARCH RESULTS ({searchResults.length})</Text>
              {searchResults.length > 0 ? (
                <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                  {searchResults.map((st) => {
                    const squadCount = Array.isArray(st.players) ? st.players.length : (st.playersCount || 11);
                    return (
                      <View key={st.id || st.name} style={styles.searchResultRow}>
                        <View style={styles.teamMiniIcon}>
                          <TeamIdentityMark team={st} size={32} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.searchResultName}>{st.name}</Text>
                          <Text style={styles.searchResultSub}>
                            {st.city || 'Local Ground'} • {squadCount} Players • Capt: {st.captainName || 'Captain'}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.quickAddBtn}
                          onPress={() => handleQuickAddTeam(st)}
                        >
                          <Ionicons name="add" size={16} color="#FFFFFF" />
                          <Text style={styles.quickAddBtnText}>Add</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </ScrollView>
              ) : (
                <Text style={styles.noResultsText}>No existing team found. Add it manually below!</Text>
              )}
            </View>
          )}

          {/* ── 2. QUICK REGISTRATION MODE TABS ── */}
          <View style={styles.modeTabsRow}>
            <TouchableOpacity
              style={[styles.modeTabPill, activeMode === 'MANUAL' && styles.modeTabPillActive]}
              onPress={() => setActiveMode('MANUAL')}
            >
              <Ionicons name="create-outline" size={15} color={activeMode === 'MANUAL' ? '#FFFFFF' : themeColors.textSecondary} />
              <Text style={[styles.modeTabText, activeMode === 'MANUAL' && styles.modeTabTextActive]}>Manual Form</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeTabPill, activeMode === 'SAVED' && styles.modeTabPillActive]}
              onPress={() => setActiveMode('SAVED')}
            >
              <MaterialCommunityIcons name="star-outline" size={16} color={activeMode === 'SAVED' ? '#FFFFFF' : themeColors.textSecondary} />
              <Text style={[styles.modeTabText, activeMode === 'SAVED' && styles.modeTabTextActive]}>Saved Teams ({allAvailableTeams.length})</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeTabPill, activeMode === 'SHARE' && styles.modeTabPillActive]}
              onPress={() => setActiveMode('SHARE')}
            >
              <Ionicons name="logo-whatsapp" size={15} color={activeMode === 'SHARE' ? '#FFFFFF' : '#16A34A'} />
              <Text style={[styles.modeTabText, activeMode === 'SHARE' && styles.modeTabTextActive]}>Captain Invite</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeTabPill, activeMode === 'QR' && styles.modeTabPillActive]}
              onPress={() => setActiveMode('QR')}
            >
              <Ionicons name="qr-code-outline" size={15} color={activeMode === 'QR' ? '#FFFFFF' : themeColors.textSecondary} />
              <Text style={[styles.modeTabText, activeMode === 'QR' && styles.modeTabTextActive]}>QR Code</Text>
            </TouchableOpacity>
          </View>

          {/* ── 3. MODE BODY CONTENT ── */}
          <ScrollView
            style={styles.modalScrollBody}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* ── MODE 1: MANUAL ADD FORM ── */}
            {activeMode === 'MANUAL' && (
              <View style={styles.formContainer}>
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

                {/* Team Name Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>TEAM NAME *</Text>
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="e.g. East Delhi Riders"
                    placeholderTextColor={themeColors.textSubtle}
                    value={teamName}
                    onChangeText={setTeamName}
                  />
                </View>

                {/* City / Ground Location */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>CITY / GROUND LOCATION</Text>
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="e.g. Delhi / Sadokan Ground"
                    placeholderTextColor={themeColors.textSubtle}
                    value={city}
                    onChangeText={setCity}
                  />
                </View>

                {/* Captain Phone Number Input */}
                <View style={styles.inputGroup}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.inputLabel}>CAPTAIN MOBILE NUMBER</Text>
                    <Text style={styles.inputHint}>For WhatsApp match alerts</Text>
                  </View>
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

                {/* Captain Name Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>CAPTAIN NAME (OPTIONAL)</Text>
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="e.g. Bastiram"
                    placeholderTextColor={themeColors.textSubtle}
                    value={captainName}
                    onChangeText={setCaptainName}
                  />
                </View>

                {/* Color Swatches */}
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

                {/* Dual Action Buttons */}
                <View style={styles.dualActionRow}>
                  <TouchableOpacity
                    style={styles.addMoreBtn}
                    onPress={() => handleSaveTeam(true)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="add" size={18} color={themeColors.textPrimary} />
                    <Text style={styles.addMoreBtnText}>+ Add & Next Team</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.saveDoneBtn}
                    onPress={() => handleSaveTeam(false)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.saveDoneBtnText}>Done & Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ── MODE 2: SHARE WITH CAPTAINS (WHATSAPP INVITE) ── */}
            {activeMode === 'SHARE' && (
              <View style={styles.shareCardContainer}>
                <View style={styles.shareHeroBadge}>
                  <Ionicons name="logo-whatsapp" size={32} color="#16A34A" />
                  <Text style={styles.shareHeroTitle}>Invite Captains to Register</Text>
                  <Text style={styles.shareHeroSubtitle}>
                    Send tournament link to captain WhatsApp groups. Captains can register their squad on CricFlow in 1 click.
                  </Text>
                </View>

                {/* Tournament Join Code Box */}
                <View style={styles.codeBoxContainer}>
                  <Text style={styles.codeBoxLabel}>TOURNAMENT JOIN CODE</Text>
                  <Text style={styles.codeBoxValue}>{tournamentCode}</Text>
                  <Text style={styles.codeBoxHint}>Captains can enter this code in CricFlow app</Text>
                </View>

                <TouchableOpacity
                  style={styles.whatsappPrimaryBtn}
                  onPress={handleShareInvite}
                  activeOpacity={0.85}
                >
                  <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
                  <Text style={styles.whatsappPrimaryBtnText}>Share on WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.copyLinkOutlineBtn}
                  onPress={() => {
                    handleShareInvite();
                    showToast('Registration link generated!', 'info');
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="copy-outline" size={18} color={themeColors.textPrimary} />
                  <Text style={styles.copyLinkOutlineBtnText}>Copy Registration Link</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── MODE 3: YOUR SAVED TEAMS ── */}
            {activeMode === 'SAVED' && (
              <View style={styles.savedTeamsContainer}>
                <Text style={styles.savedTeamsHeading}>Ground Teams Directory ({allAvailableTeams.length})</Text>
                <View style={styles.savedTeamsList}>
                  {allAvailableTeams.map((st) => {
                    const squadCount = Array.isArray(st.players) ? st.players.length : (st.playersCount || 11);
                    return (
                      <View key={st.id || st.name} style={styles.savedTeamCard}>
                        <View style={styles.savedTeamIcon}>
                          <TeamIdentityMark team={st} size={36} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.savedTeamName}>{st.name}</Text>
                          <Text style={styles.savedTeamSub}>
                            {st.city || 'Local Ground'} • {squadCount} Players • Capt: {st.captainName || 'Captain'}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.quickAddPillBtn}
                          onPress={() => handleQuickAddTeam(st)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="add" size={16} color="#FFFFFF" />
                          <Text style={styles.quickAddPillBtnText}>Add</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ── MODE 4: QR CODE REGISTRATION ── */}
            {activeMode === 'QR' && (
              <View style={styles.qrCodeContainer}>
                <View style={styles.qrBoxWrapper}>
                  <MaterialCommunityIcons name="qrcode-scan" size={80} color="#18181B" />
                  <Text style={styles.qrCodeTitle}>Ground QR Check-in</Text>
                  <Text style={styles.qrCodeSubtitle}>
                    Show this Tournament QR code to team captains at the ground entrance for instant registration.
                  </Text>
                  <View style={styles.qrCodeTag}>
                    <Text style={styles.qrCodeTagText}>CODE: {tournamentCode}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.whatsappPrimaryBtn}
                  onPress={handleShareInvite}
                  activeOpacity={0.85}
                >
                  <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.whatsappPrimaryBtnText}>Share Tournament QR / Link</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: themeColors.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 24,
    maxHeight: '92%'
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 10
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 0,
    borderBottomColor: themeColors.border
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  closeBtn: {
    padding: 4
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.surfaceOffWhite,
    borderWidth: 0,
    borderColor: themeColors.borderDark,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    marginTop: 10,
    gap: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: systemFont,
    color: themeColors.textPrimary
  },
  searchResultsBox: {
    backgroundColor: themeColors.surfaceOffWhite,
    borderWidth: 0,
    borderColor: themeColors.borderDark,
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
    gap: 6
  },
  searchResultsLabel: {
    fontSize: 10,
    fontFamily: systemFontBold,
    color: themeColors.textMuted,
    letterSpacing: 0.6
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0,
    borderBottomColor: themeColors.border
  },
  teamMiniIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center'
  },
  searchResultName: {
    fontSize: 13,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  searchResultSub: {
    fontSize: 11,
    fontFamily: systemFont,
    color: themeColors.textMuted
  },
  quickAddBtn: {
    backgroundColor: '#18181B',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  quickAddBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: systemFontBold
  },
  noResultsText: {
    fontSize: 12,
    fontFamily: systemFont,
    color: themeColors.textMuted,
    paddingVertical: 8,
    textAlign: 'center'
  },
  modeTabsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 0,
    borderBottomColor: themeColors.border
  },
  modeTabPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: themeColors.surfaceOffWhite,
    borderWidth: 0,
    borderColor: themeColors.border
  },
  modeTabPillActive: {
    backgroundColor: '#18181B',
    borderColor: '#18181B'
  },
  modeTabText: {
    fontSize: 11,
    fontFamily: systemFontMedium,
    color: themeColors.textSecondary
  },
  modeTabTextActive: {
    color: '#FFFFFF',
    fontFamily: systemFontBold
  },
  modalScrollBody: {
    marginTop: 8
  },
  modalScrollContent: {
    paddingBottom: 20
  },
  formContainer: {
    gap: 12,
    paddingTop: 4
  },
  logoPickerCenter: {
    alignItems: 'center',
    marginBottom: 4
  },
  circularLogoBox: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 0,
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
    borderWidth: 0,
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
  inputLabel: {
    fontSize: 11,
    fontFamily: systemFontBold,
    color: themeColors.textSecondary,
    letterSpacing: 0.5
  },
  inputHint: {
    fontSize: 10.5,
    fontFamily: systemFont,
    color: themeColors.textMuted
  },
  modalTextInput: {
    backgroundColor: themeColors.surfaceOffWhite,
    borderWidth: 0,
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
    borderWidth: 0,
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
  squadBoxSection: {
    backgroundColor: themeColors.surfaceOffWhite,
    borderWidth: 0,
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
    color: themeColors.textMuted,
    marginTop: 2
  },
  pasteSquadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    borderWidth: 0,
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
    borderWidth: 0,
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
  swatchesRow: {
    flexDirection: 'row',
    gap: 10
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  colorSwatchActive: {
    borderWidth: 0,
    borderColor: '#0284C7'
  },
  dualActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6
  },
  addMoreBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: themeColors.surfaceOffWhite,
    borderWidth: 0,
    borderColor: themeColors.borderDark,
    height: 44,
    borderRadius: 10
  },
  addMoreBtnText: {
    fontSize: 12.5,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  saveDoneBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#18181B',
    height: 44,
    borderRadius: 10
  },
  saveDoneBtnText: {
    fontSize: 12.5,
    fontFamily: systemFontBold,
    color: '#FFFFFF'
  },
  shareCardContainer: {
    gap: 14,
    paddingTop: 8
  },
  shareHeroBadge: {
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 0,
    borderColor: '#BBF7D0',
    borderRadius: 14,
    padding: 16,
    gap: 6
  },
  shareHeroTitle: {
    fontSize: 15,
    fontFamily: systemFontBold,
    color: '#15803D'
  },
  shareHeroSubtitle: {
    fontSize: 12,
    fontFamily: systemFont,
    color: '#166534',
    textAlign: 'center',
    lineHeight: 17
  },
  codeBoxContainer: {
    alignItems: 'center',
    backgroundColor: themeColors.surfaceOffWhite,
    borderWidth: 0,
    borderColor: themeColors.borderDark,
    borderRadius: 12,
    padding: 14,
    gap: 4
  },
  codeBoxLabel: {
    fontSize: 10,
    fontFamily: systemFontBold,
    color: themeColors.textMuted,
    letterSpacing: 0.6
  },
  codeBoxValue: {
    fontSize: 22,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary,
    letterSpacing: 1.5
  },
  codeBoxHint: {
    fontSize: 11,
    fontFamily: systemFont,
    color: themeColors.textMuted
  },
  whatsappPrimaryBtn: {
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: 10
  },
  whatsappPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: systemFontBold
  },
  copyLinkOutlineBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 0,
    borderColor: themeColors.borderDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 10
  },
  copyLinkOutlineBtnText: {
    color: themeColors.textPrimary,
    fontSize: 12.5,
    fontFamily: systemFontBold
  },
  savedTeamsContainer: {
    gap: 8,
    paddingTop: 4
  },
  savedTeamsHeading: {
    fontSize: 12,
    fontFamily: systemFontBold,
    color: themeColors.textSecondary
  },
  savedTeamsList: {
    gap: 8
  },
  savedTeamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.surfaceOffWhite,
    borderWidth: 0,
    borderColor: themeColors.border,
    borderRadius: 12,
    padding: 10
  },
  savedTeamIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center'
  },
  savedTeamName: {
    fontSize: 13.5,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  savedTeamSub: {
    fontSize: 11,
    fontFamily: systemFont,
    color: themeColors.textMuted
  },
  quickAddPillBtn: {
    backgroundColor: '#18181B',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  quickAddPillBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: systemFontBold
  },
  qrCodeContainer: {
    alignItems: 'center',
    gap: 16,
    paddingTop: 10
  },
  qrBoxWrapper: {
    alignItems: 'center',
    backgroundColor: themeColors.surfaceOffWhite,
    borderWidth: 0,
    borderColor: themeColors.border,
    borderRadius: 16,
    padding: 24,
    gap: 10,
    width: '100%'
  },
  qrCodeTitle: {
    fontSize: 16,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  qrCodeSubtitle: {
    fontSize: 12,
    fontFamily: systemFont,
    color: themeColors.textMuted,
    textAlign: 'center',
    lineHeight: 17
  },
  qrCodeTag: {
    backgroundColor: '#18181B',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4
  },
  qrCodeTagText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: systemFontBold,
    letterSpacing: 1
  }
});
