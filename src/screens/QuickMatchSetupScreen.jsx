import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { systemFont, systemFontBold, systemFontMedium, typeScale, fontWeights, theme } from '../theme.js';
import { TeamPickerModal } from '../components/TeamPickerModal.jsx';
import { TeamIdentityMark } from '../components/TeamIdentityMark.jsx';
import { PlayerAvatar } from '../components/PlayerAvatar.jsx';
import { MatchTabBar } from '../components/MatchTabBar.jsx';
import { MASTER_PLAYERS_DB } from '../../mockData.js';
import { fetchLocalPlayers, saveLocalPlayer, PRESET_PLAYER_AVATARS } from '../services/localPlayerService.js';
import { syncPlayersToPhotoRegistry, registerPlayerPhoto } from '../services/playerPhotoStore.js';
import { generateUUID } from '../services/supabaseClient.js';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToCloudinary } from '../services/cloudinaryService.js';

const DEFAULT_TEAM_A_ROSTER = [];
const DEFAULT_TEAM_B_ROSTER = [];

const nameFitProps = {
  numberOfLines: 1,
  ellipsizeMode: 'tail',
  adjustsFontSizeToFit: true,
  minimumFontScale: 0.82
};

export function QuickMatchSetupScreen({
  savedTeamsList = [],
  initialSetup = null,
  onStartMatch,
  onCancel
}) {
  const step1ScrollRef = useRef(null);
  // Wizard Step: 1 = Build Teams & Setup, 2 = Coin Toss, 3 = Select Openers
  const [wizardStep, setWizardStep] = useState(1);

  // Default App-Branded Team Names or Rematch Initial Data
  const [team1Name, setTeam1Name] = useState(initialSetup?.team1Name || 'CricFlow Eleven');
  const [team2Name, setTeam2Name] = useState(initialSetup?.team2Name || 'CricFlow Strikers');

  const [team1Roster, setTeam1Roster] = useState(initialSetup?.team1Roster || DEFAULT_TEAM_A_ROSTER);
  const [team2Roster, setTeam2Roster] = useState(initialSetup?.team2Roster || DEFAULT_TEAM_B_ROSTER);
  const [playerPool, setPlayerPool] = useState([]);
  const [localPlayersDb, setLocalPlayersDb] = useState([]);

  const [ballType, setBallType] = useState(initialSetup?.ballType || 'tennis');
  const [totalOvers, setTotalOvers] = useState(initialSetup?.totalOvers ? String(initialSetup.totalOvers) : '5');
  const [pitchType, setPitchType] = useState(initialSetup?.pitchType || 'turf');
  const [umpireName, setUmpireName] = useState(initialSetup?.umpireName || 'Cric Scorer');
  const [venueName, setVenueName] = useState(initialSetup?.venueName || '');
  const [scorerPin, setScorerPin] = useState(initialSetup?.scorerPin || '');

  // Toss State
  const [tossWinner, setTossWinner] = useState(initialSetup?.team1Name || 'CricFlow Eleven');
  const [tossDecision, setTossDecision] = useState('BAT');

  // Synchronize when initialSetup is updated dynamically
  useEffect(() => {
    if (initialSetup) {
      if (initialSetup.team1Name) setTeam1Name(initialSetup.team1Name);
      if (initialSetup.team2Name) setTeam2Name(initialSetup.team2Name);
      if (Array.isArray(initialSetup.team1Roster) && initialSetup.team1Roster.length > 0) setTeam1Roster(initialSetup.team1Roster);
      if (Array.isArray(initialSetup.team2Roster) && initialSetup.team2Roster.length > 0) setTeam2Roster(initialSetup.team2Roster);
      if (initialSetup.totalOvers) setTotalOvers(String(initialSetup.totalOvers));
      if (initialSetup.venueName !== undefined) setVenueName(initialSetup.venueName);
      if (initialSetup.scorerPin !== undefined) setScorerPin(initialSetup.scorerPin);
      if (initialSetup.ballType) setBallType(initialSetup.ballType);
      if (initialSetup.pitchType) setPitchType(initialSetup.pitchType);
      if (initialSetup.team1Name) setTossWinner(initialSetup.team1Name);
    }
  }, [initialSetup]);

  // Step 3: Openers State
  const [step3Striker, setStep3Striker] = useState('');
  const [step3NonStriker, setStep3NonStriker] = useState('');
  const [step3Bowler, setStep3Bowler] = useState('');

  // Modals
  const [teamPickerVisible, setTeamPickerVisible] = useState(false);
  const [targetPickerSlot, setTargetPickerSlot] = useState('team1');
  const [playerSelectorVisible, setPlayerSelectorVisible] = useState(false);
  const [newPlayerInput, setNewPlayerInput] = useState('');
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');
  const [activeSquadTab, setActiveSquadTab] = useState('all'); // 'all' | 'team1' | 'team2'

  const bannerScrollRef = useRef(null);
  const [bannerWidth, setBannerWidth] = useState(0);
  const [addPlayerModalVisible, setAddPlayerModalVisible] = useState(false);
  const [newPlayerRoleInput, setNewPlayerRoleInput] = useState('All-Rounder');
  const [squadPreviewVisible, setSquadPreviewVisible] = useState(false);
  const [previewActiveTab, setPreviewActiveTab] = useState('team1');
  const [previewTabLayouts, setPreviewTabLayouts] = useState({});
  const [newPlayerPhoneInput, setNewPlayerPhoneInput] = useState('');
  const [editPhoneInput, setEditPhoneInput] = useState('');
  const [editPhotoTargetPlayer, setEditPhotoTargetPlayer] = useState(null);
  const [editPhotoInputUrl, setEditPhotoInputUrl] = useState('');
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [selectedLocalImageUri, setSelectedLocalImageUri] = useState(null);

  const pickImageFromGallery = async (targetSetter) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow gallery access to select a player photo.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const dataUri = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        targetSetter(dataUri);
      }
    } catch (err) {
      Alert.alert('Gallery Error', err.message || 'Could not pick image');
    }
  };

  const takePhotoFromCamera = async (targetSetter) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow camera access to capture a player photo.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const dataUri = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        targetSetter(dataUri);
      }
    } catch (err) {
      Alert.alert('Camera Error', err.message || 'Could not take photo');
    }
  };

  const handleSavePlayerPhoto = async () => {
    if (!editPhotoTargetPlayer) return;
    const name = typeof editPhotoTargetPlayer === 'string' ? editPhotoTargetPlayer : editPhotoTargetPlayer.name;
    if (!name) return;

    setIsSavingPhoto(true);
    let finalUrl = editPhotoInputUrl.trim();

    if (selectedLocalImageUri) {
      const uploaded = await uploadImageToCloudinary(selectedLocalImageUri);
      if (uploaded) finalUrl = uploaded;
    }

    const existingInDb = localPlayersDb.find(p => p && p.name && p.name.trim().toLowerCase() === name.trim().toLowerCase());

    const playerObj = {
      id: existingInDb?.id || generateUUID(),
      name: name.trim(),
      role: existingInDb?.role || 'Player',
      photoUrl: finalUrl,
      phone: editPhoneInput ? editPhoneInput.trim() : (existingInDb?.phone || '')
    };

    const savedObj = await saveLocalPlayer(playerObj);
    const activeObj = savedObj || playerObj;

    registerPlayerPhoto(activeObj.name, activeObj.photoUrl);

    setLocalPlayersDb(prev => [
      activeObj,
      ...prev.filter(p => p && p.name && p.name.trim().toLowerCase() !== name.trim().toLowerCase())
    ]);

    setIsSavingPhoto(false);
    setEditPhotoTargetPlayer(null);
    setEditPhotoInputUrl('');
    setSelectedLocalImageUri(null);
  };

  // Fetch local players DB on mount
  useEffect(() => {
    fetchLocalPlayers().then(players => {
      if (Array.isArray(players) && players.length > 0) {
        setLocalPlayersDb(players);
        const names = players.map(p => p.name);
        setPlayerPool(prev => Array.from(new Set([...names, ...prev])));
      }
    }).catch(() => {});
  }, []);

  const makeTeamCode = (name) => {
    if (!name) return 'TM';
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleOpenTeamPicker = (slot) => {
    setTargetPickerSlot(slot);
    setTeamPickerVisible(true);
  };

  const handleSelectTeamFromPicker = (teamObj) => {
    if (targetPickerSlot === 'team1') {
      setTeam1Name(teamObj.name);
      if (teamObj.players && teamObj.players.length > 0) setTeam1Roster(teamObj.players);
    } else {
      setTeam2Name(teamObj.name);
      if (teamObj.players && teamObj.players.length > 0) setTeam2Roster(teamObj.players);
    }
    setTeamPickerVisible(false);
  };

  const handleCreateTeamFromPicker = (newTeamName) => {
    if (targetPickerSlot === 'team1') {
      setTeam1Name(newTeamName);
    } else {
      setTeam2Name(newTeamName);
    }
    setTeamPickerVisible(false);
  };

  const handleRemovePlayerFromRoster = (slot, playerName) => {
    if (slot === 'team1') {
      setTeam1Roster(prev => prev.filter(p => p !== playerName));
    } else {
      setTeam2Roster(prev => prev.filter(p => p !== playerName));
    }
  };

  const handleMoveToTeam = (playerName, targetSlot) => {
    setTeam1Roster(prev => prev.filter(p => p !== playerName));
    setTeam2Roster(prev => prev.filter(p => p !== playerName));
    setPlayerPool(prev => prev.filter(p => p !== playerName));

    if (targetSlot === 'team1') {
      setTeam1Roster(prev => [...prev, playerName]);
    } else if (targetSlot === 'team2') {
      setTeam2Roster(prev => [...prev, playerName]);
    } else {
      setPlayerPool(prev => [...prev, playerName]);
    }
  };

  const handleAddNewPlayerToPool = async () => {
    const trimmed = newPlayerInput.trim();
    if (!trimmed) return;

    setIsAddingPlayer(true);
    let uploadedPhotoUrl = '';

    if (selectedLocalImageUri) {
      uploadedPhotoUrl = await uploadImageToCloudinary(selectedLocalImageUri) || selectedLocalImageUri;
    } else if (photoUrlInput.trim()) {
      uploadedPhotoUrl = photoUrlInput.trim();
    }

    const existingInDb = localPlayersDb.find(p => p && p.name && p.name.trim().toLowerCase() === trimmed.toLowerCase());
    const finalPhotoUrl = uploadedPhotoUrl || existingInDb?.photoUrl || existingInDb?.photo_url || '';

    const newPlayerObj = {
      id: existingInDb?.id || generateUUID(),
      name: trimmed,
      role: newPlayerRoleInput || existingInDb?.role || 'All-Rounder',
      photoUrl: finalPhotoUrl,
      phone: newPlayerPhoneInput.trim()
    };

    // Save/update to local database (AsyncStorage + Supabase with auto link resolution)
    const savedObj = await saveLocalPlayer(newPlayerObj);
    const activePlayerObj = savedObj || newPlayerObj;

    registerPlayerPhoto(activePlayerObj.name, activePlayerObj.photoUrl);

    setLocalPlayersDb(prev => [
      activePlayerObj,
      ...prev.filter(p => p && p.name && p.name.trim().toLowerCase() !== trimmed.toLowerCase())
    ]);

    if (!team1Roster.includes(trimmed) && !team2Roster.includes(trimmed) && !playerPool.includes(trimmed)) {
      setPlayerPool(prev => [trimmed, ...prev]);
    }

    setNewPlayerInput('');
    setNewPlayerPhoneInput('');
    setPhotoUrlInput('');
    setSelectedLocalImageUri(null);
    setIsAddingPlayer(false);
    setAddPlayerModalVisible(false);
  };

  const renderSetupPlayerPhoto = (playerName, size = 28) => {
    const dbFound = localPlayersDb.find(p => p && p.name && p.name.toLowerCase() === String(playerName).toLowerCase());
    const photoUri = dbFound?.photoUrl || dbFound?.photo_url;
    return <PlayerAvatar name={playerName} photoUrl={photoUri} size={size} />;
  };

  const renderOpeningRow = ({ name, active, accent, iconName, roleLabel, onPress }) => (
    <TouchableOpacity
      key={name}
      onPress={onPress}
      style={{
        minHeight: 52,
        paddingHorizontal: 12,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justify: 'space-between',
        gap: 10,
        backgroundColor: active ? (accent === '#0284C7' ? '#F0F9FF' : '#FFF1F2') : '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9'
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
        {renderSetupPlayerPhoto(name, 32)}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text {...nameFitProps} style={{ color: '#0F172A', fontSize: 13, fontWeight: active ? fontWeights.bold : '600', fontFamily: systemFont }}>{name}</Text>
          {roleLabel ? (
            <Text style={{ color: accent, fontSize: 9, fontWeight: fontWeights.bold, marginTop: 1, fontFamily: systemFont }}>{roleLabel}</Text>
          ) : null}
        </View>
      </View>
      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: active ? accent : '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
        <MaterialCommunityIcons name={iconName} size={15} color={active ? '#FFFFFF' : '#94A3B8'} />
      </View>
    </TouchableOpacity>
  );

  const handleOpeningBatterSelect = (name) => {
    if (step3Striker === name) {
      setStep3Striker('');
      return;
    }
    if (step3NonStriker === name) {
      setStep3NonStriker('');
      return;
    }
    if (!step3Striker) {
      setStep3Striker(name);
      return;
    }
    if (!step3NonStriker) {
      setStep3NonStriker(name);
      return;
    }
    setStep3NonStriker(name);
  };

  const handleFinalStartMatch = () => {
    if (!step3Striker || !step3NonStriker || !step3Bowler) {
      Alert.alert('Missing Openers', 'Please select Striker, Non-Striker and Opening Bowler to start match.');
      return;
    }
    if (step3Striker === step3NonStriker) {
      Alert.alert('Invalid Openers', 'Striker and Non-Striker must be two different players.');
      return;
    }
    const finalTeam1 = team1Name.trim() || 'CricFlow Eleven';
    const finalTeam2 = team2Name.trim() || 'CricFlow Strikers';
    const resolvedPin = (scorerPin && scorerPin.trim().length === 6) ? scorerPin.trim() : '998322';

    if (onStartMatch) {
      onStartMatch({
        team1Name: finalTeam1,
        team2Name: finalTeam2,
        team1Roster: team1Roster,
        team2Roster: team2Roster,
        ballType,
        totalOvers: parseInt(totalOvers, 10) || 5,
        pitchType,
        umpireName: umpireName || 'Cric Scorer',
        venueName: venueName ? venueName.trim() : '',
        tossWinner: tossWinner || finalTeam1,
        tossDecision: tossDecision || 'BAT',
        striker: step3Striker,
        nonStriker: step3NonStriker,
        bowler: step3Bowler,
        scorerPin: resolvedPin
      });
    }
  };

  const activeT1 = team1Name.trim() || 'CricFlow Eleven';
  const activeT2 = team2Name.trim() || 'CricFlow Strikers';
  const battingTeamName = tossDecision === 'BAT' ? tossWinner : (tossWinner === activeT1 ? activeT2 : activeT1);
  const bowlingTeamName = battingTeamName === activeT1 ? activeT2 : activeT1;
  const bRoster = battingTeamName === activeT1 ? team1Roster : team2Roster;
  const blRoster = bowlingTeamName === activeT1 ? team1Roster : team2Roster;

  const selectedOpening = [
    { label: 'Striker', name: step3Striker, color: '#0284C7' },
    { label: 'Non-striker', name: step3NonStriker, color: '#0284C7' },
    { label: 'Bowler', name: step3Bowler, color: '#E11D48' }
  ];

  const allPlayersPool = Array.from(new Set([...team1Roster, ...team2Roster, ...playerPool]));

  // STEP 1: ULTRA-CLEAN & SIMPLIFIED TEAMS SETUP
  if (wizardStep === 1) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#FFFFFF' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          {/* Top Header Bar */}
          <View style={styles.headerBar}>
            <TouchableOpacity onPress={onCancel} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 }}>
              <Ionicons name="arrow-back" size={20} color="#0F172A" />
              <Text style={{ fontSize: 15, fontWeight: fontWeights.bold, color: '#0F172A', fontFamily: systemFont }}>Home</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 13, fontWeight: fontWeights.bold, color: '#0284C7', fontFamily: systemFont }}>Quick Match - Step 1/3</Text>
          </View>

          <ScrollView ref={step1ScrollRef} style={{ flex: 1, backgroundColor: '#F8FAFC' }} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 280 }} keyboardShouldPersistTaps="handled">
            {/* Title & Subtitle */}
            <View>
              <Text style={{ color: '#0F172A', fontSize: 20, fontWeight: fontWeights.bold, fontFamily: systemFontBold }}>
                {initialSetup?.isRematch ? 'Rematch Setup' : 'Quick Match Setup'}
              </Text>
              <Text style={{ color: '#64748B', fontSize: 11, fontWeight: fontWeights.bold, marginTop: 3, fontFamily: systemFont }}>
                {initialSetup?.isRematch ? 'Teams & rosters pre-loaded from previous match' : 'Set teams, overs & details for local scoring'}
              </Text>
              {initialSetup?.isRematch ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#E0F2FE', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, alignSelf: 'flex-start', marginTop: 8 }}>
                  <MaterialCommunityIcons name="cached" size={16} color="#0284C7" />
                  <Text style={{ color: '#0369A1', fontSize: 11, fontFamily: systemFontBold }}>Rematch: Same Teams & Squads Active</Text>
                </View>
              ) : null}
            </View>

            {/* ULTRA-CLEAN HORIZONTAL MATCHUP CARD (LEFT - CENTER VS - RIGHT) */}
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#CBD5E1', gap: 12, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 2 }}>
              <Text style={{ fontSize: 11, fontWeight: fontWeights.bold, color: '#64748B', letterSpacing: 0.5, fontFamily: systemFont, textAlign: 'center' }}>
                PLAYING TEAMS
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 }}>
                {/* LEFT SIDE: TEAM 1 LOGO + NAME UNDER LOGO */}
                <View style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                  <Image
                    source={require('../../assets/default_team_1.png')}
                    style={{ width: 64, height: 64, resizeMode: 'contain' }}
                  />
                  <TextInput
                    style={{
                      width: '100%',
                      fontSize: 14,
                      fontWeight: fontWeights.bold,
                      color: '#0F172A',
                      fontFamily: systemFontBold,
                      textAlign: 'center',
                      paddingVertical: 4
                    }}
                    value={team1Name}
                    onChangeText={setTeam1Name}
                    placeholder="Team 1 Name"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="words"
                  />
                </View>

                {/* CENTER SIDE: LITTLE BIG VS LOGO BADGE */}
                <View style={{ paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' }}>
                  <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: '#071B2C', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#38BDF8', elevation: 3 }}>
                    <Text style={{ fontSize: 13, fontWeight: fontWeights.bold, color: '#FFFFFF', fontFamily: systemFontBold }}>VS</Text>
                  </View>
                </View>

                {/* RIGHT SIDE: TEAM 2 LOGO + NAME UNDER LOGO */}
                <View style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                  <Image
                    source={require('../../assets/default_team_2.png')}
                    style={{ width: 64, height: 64, resizeMode: 'contain' }}
                  />
                  <TextInput
                    style={{
                      width: '100%',
                      fontSize: 14,
                      fontWeight: fontWeights.bold,
                      color: '#0F172A',
                      fontFamily: systemFontBold,
                      textAlign: 'center',
                      paddingVertical: 4
                    }}
                    value={team2Name}
                    onChangeText={setTeam2Name}
                    placeholder="Team 2 Name"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="words"
                  />
                </View>
              </View>
            </View>

            {/* ULTRA-MINIMAL SQUAD BUTTONS */}
            <View style={{ gap: 10 }}>
              {/* TOP BUTTON: MANAGE SQUAD */}
              <TouchableOpacity
                onPress={() => setPlayerSelectorVisible(true)}
                style={{
                  backgroundColor: '#F0F9FF',
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: '#BAE6FD',
                  height: 48,
                  paddingHorizontal: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <MaterialCommunityIcons name="account-group" size={22} color="#0284C7" />
                  <Text style={{ color: '#0369A1', fontSize: 13, fontFamily: systemFontBold }}>
                    MANAGE SQUAD
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#0284C7" />
              </TouchableOpacity>

              {/* BOTTOM BUTTON: VIEW SQUADS */}
              <TouchableOpacity
                onPress={() => setSquadPreviewVisible(true)}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: '#CBD5E1',
                  height: 48,
                  paddingHorizontal: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', width: 44 }}>
                    <Image source={require('../../assets/default_team_1.png')} style={{ width: 26, height: 26, resizeMode: 'contain', zIndex: 2 }} />
                    <Image source={require('../../assets/default_team_2.png')} style={{ width: 26, height: 26, resizeMode: 'contain', marginLeft: -12, zIndex: 1 }} />
                  </View>
                  <Text style={{ color: '#0F172A', fontSize: 13, fontFamily: systemFontBold }}>
                    VIEW SQUADS
                  </Text>
                </View>
                <Ionicons name="eye-outline" size={18} color="#0284C7" />
              </TouchableOpacity>
            </View>

            {/* Total Match Overs */}
            <View>
              <Text style={styles.labelHeader}>Total Match Overs</Text>
              <TextInput
                style={[styles.input, { marginTop: 4 }]}
                value={totalOvers}
                onChangeText={setTotalOvers}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="e.g. 5, 6, 8, 10, 20"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Umpire Name */}
            <View>
              <Text style={styles.labelHeader}>Umpire Name</Text>
              <TextInput
                style={[styles.input, { marginTop: 4 }]}
                value={umpireName}
                onChangeText={setUmpireName}
                placeholder="Cric Scorer"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Venue Name */}
            <View>
              <Text style={styles.labelHeader}>Venue Name</Text>
              <TextInput
                style={[styles.input, { marginTop: 4 }]}
                value={venueName}
                onChangeText={setVenueName}
                onFocus={() => {
                  setTimeout(() => {
                    step1ScrollRef.current?.scrollTo({ y: 260, animated: true });
                  }, 120);
                }}
                placeholder="Ground, village or city"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Set 6-Digit Scorer PIN */}
            <View>
              <Text style={styles.labelHeader}>Set 6-Digit Scorer PIN (Security Lock)</Text>
              <TextInput
                style={[styles.input, { marginTop: 4 }]}
                value={scorerPin}
                onChangeText={(val) => setScorerPin(val.replace(/[^\d]/g, '').slice(0, 6))}
                onFocus={() => {
                  setTimeout(() => {
                    step1ScrollRef.current?.scrollToEnd({ animated: true });
                  }, 120);
                }}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="998322"
                placeholderTextColor="#94A3B8"
              />
              <Text style={{ fontSize: 10, color: '#64748B', marginTop: 4, fontFamily: systemFont }}>
                Leave blank to use default backup PIN (998322).
              </Text>
            </View>

            {/* NEXT: COIN TOSS BUTTON */}
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: (team1Name.trim() && team2Name.trim() && totalOvers) ? '#0284C7' : '#94A3B8', marginTop: 4 }]}
              disabled={!team1Name.trim() || !team2Name.trim() || !totalOvers}
              onPress={() => setWizardStep(2)}
            >
              <Text style={styles.btnText}>NEXT: COIN TOSS</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </ScrollView>

          <TeamPickerModal
            visible={teamPickerVisible}
            targetSlot={targetPickerSlot}
            savedTeams={savedTeamsList}
            opponentTeams={[]}
            onSelectTeam={handleSelectTeamFromPicker}
            onCreateTeam={handleCreateTeamFromPicker}
            onClose={() => setTeamPickerVisible(false)}
          />

          {/* FULL-SCREEN MANAGE SQUAD PLAYERS MODAL */}
          <Modal
            visible={playerSelectorVisible}
            animationType="slide"
            onRequestClose={() => setPlayerSelectorVisible(false)}
          >
            <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
              {/* Clean Header Bar */}
              <View style={{ height: 56, paddingHorizontal: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#CBD5E1', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <TouchableOpacity onPress={() => setPlayerSelectorVisible(false)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="arrow-back" size={22} color="#0F172A" />
                  <Text style={{ fontSize: 15, fontWeight: fontWeights.bold, color: '#0F172A', fontFamily: systemFont }}>Back</Text>
                </TouchableOpacity>
                <Text style={{ color: '#0F172A', fontSize: 16, fontWeight: fontWeights.bold, fontFamily: systemFontBold }}>Manage Squad Players</Text>
                <TouchableOpacity
                  onPress={() => setPlayerSelectorVisible(false)}
                  style={{ height: 34, paddingHorizontal: 14, borderRadius: 8, backgroundColor: '#0284C7', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: fontWeights.bold, fontFamily: systemFont }}>DONE</Text>
                </TouchableOpacity>
              </View>
              {/* PROMINENT TOP DARK MATCHUP HEADER BANNER */}
              <View style={{ paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#071B2C', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                {/* Team 1 Info */}
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Image source={require('../../assets/default_team_1.png')} style={{ width: 38, height: 38, resizeMode: 'contain' }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: fontWeights.bold, fontFamily: systemFontBold }} numberOfLines={1}>{activeT1}</Text>
                    <Text style={{ color: '#38BDF8', fontSize: 11, fontWeight: fontWeights.bold, fontFamily: systemFont, marginTop: 1 }}>{team1Roster.length} Players</Text>
                  </View>
                </View>

                {/* VS Circle Badge */}
                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#38BDF8' }}>
                  <Text style={{ color: '#38BDF8', fontSize: 11, fontWeight: fontWeights.bold, fontFamily: systemFontBold }}>VS</Text>
                </View>

                {/* Team 2 Info */}
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: fontWeights.bold, fontFamily: systemFontBold }} numberOfLines={1}>{activeT2}</Text>
                    <Text style={{ color: '#FB7185', fontSize: 11, fontWeight: fontWeights.bold, fontFamily: systemFont, marginTop: 1 }}>{team2Roster.length} Players</Text>
                  </View>
                  <Image source={require('../../assets/default_team_2.png')} style={{ width: 38, height: 38, resizeMode: 'contain' }} />
                </View>
              </View>

              {/* SEARCH BAR & PROMINENT CREATE NEW PLAYER CARD */}
              <View style={{ padding: 12, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', gap: 10 }}>
                {/* SEARCH INPUT (NAME OR MOBILE NUMBER) */}
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#CBD5E1', paddingHorizontal: 12, height: 44, gap: 8 }}>
                  <Ionicons name="search" size={18} color="#64748B" />
                  <TextInput
                    style={{ flex: 1, fontSize: 13, color: '#0F172A', fontFamily: systemFont }}
                    placeholder="Search by player name or mobile number..."
                    placeholderTextColor="#94A3B8"
                    value={playerSearchQuery}
                    onChangeText={setPlayerSearchQuery}
                    keyboardType="default"
                  />
                  {playerSearchQuery ? (
                    <TouchableOpacity onPress={() => setPlayerSearchQuery('')}>
                      <Ionicons name="close-circle" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* OFFICIAL SCORECARD LIGHT THEME ADD PLAYER CARD */}
                <View style={{ backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#CBD5E1', padding: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F0F9FF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#BAE6FD' }}>
                      <Ionicons name="person-add" size={18} color="#0284C7" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#0F172A', fontSize: 13, fontFamily: systemFontBold }}>
                        Add New Player
                      </Text>
                      <Text style={{ color: '#64748B', fontSize: 11, fontFamily: systemFontMedium, marginTop: 1 }}>
                        Create ground player with mobile & photo
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => setAddPlayerModalVisible(true)}
                    style={{ backgroundColor: '#0284C7', paddingHorizontal: 14, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 12, fontFamily: systemFontBold }}>+ ADD</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* LOCAL PLAYERS LIST (SEARCH BY NAME OR MOBILE NUMBER) */}
              <ScrollView style={{ flex: 1, backgroundColor: '#F8FAFC' }} contentContainerStyle={{ padding: 12, gap: 8, paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
                {allPlayersPool
                  .filter(name => {
                    if (!playerSearchQuery.trim()) return true;
                    const q = playerSearchQuery.toLowerCase().trim();
                    const qClean = q.replace(/\D/g, '');
                    const dbMatch = localPlayersDb.find(p => p && p.name && p.name.trim().toLowerCase() === name.trim().toLowerCase());
                    const phone = dbMatch?.phone || dbMatch?.mobile || '';
                    const phoneClean = String(phone).replace(/\D/g, '');

                    const matchName = name.toLowerCase().includes(q);
                    const matchPhoneRaw = Boolean(phone && String(phone).toLowerCase().includes(q));
                    const matchPhoneClean = Boolean(qClean.length > 0 && phoneClean.includes(qClean));

                    return matchName || matchPhoneRaw || matchPhoneClean;
                  })
                  .map(playerName => {
                    const inTeamA = team1Roster.includes(playerName);
                    const inTeamB = team2Roster.includes(playerName);
                    const dbMatch = localPlayersDb.find(p => p && p.name && p.name.trim().toLowerCase() === playerName.trim().toLowerCase());
                    const playerPhone = dbMatch?.phone || dbMatch?.mobile || '';

                    return (
                      <View
                        key={`selector-${playerName}`}
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: 12,
                          height: 56,
                          borderWidth: 1,
                          borderColor: (inTeamA || inTeamB) ? '#0284C7' : '#E2E8F0',
                          flexDirection: 'row',
                          alignItems: 'center',
                          overflow: 'hidden'
                        }}
                      >
                        {/* LEFT FULL-HEIGHT BUTTON (TEAM 1 TRANSFER) */}
                        <TouchableOpacity
                          onPress={() => handleMoveToTeam(playerName, inTeamA ? 'pool' : 'team1')}
                          style={{
                            width: 48,
                            height: '100%',
                            backgroundColor: inTeamA ? '#0284C7' : '#F0F9FF',
                            borderRightWidth: 1,
                            borderRightColor: inTeamA ? '#0284C7' : '#E2E8F0',
                            justifyContent: 'center',
                            alignItems: 'center'
                          }}
                        >
                          <Ionicons
                            name={inTeamA ? 'checkmark-circle' : 'arrow-back'}
                            size={inTeamA ? 24 : 20}
                            color={inTeamA ? '#FFFFFF' : '#0284C7'}
                          />
                        </TouchableOpacity>

                        {/* PLAYER IDENTITY (PHOTO + NAME + MOBILE NUMBER IN ONE ROW) */}
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12 }}>
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => {
                              const dbFound = localPlayersDb.find(p => p && p.name && p.name.trim().toLowerCase() === playerName.trim().toLowerCase());
                              setEditPhotoTargetPlayer(playerName);
                              setEditPhotoInputUrl(dbFound?.photoUrl || dbFound?.photo_url || '');
                              setEditPhoneInput(dbFound?.phone || dbFound?.mobile || '');
                            }}
                          >
                            {renderSetupPlayerPhoto(playerName, 36)}
                          </TouchableOpacity>
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => (inTeamA || inTeamB) && handleMoveToTeam(playerName, 'pool')}
                            style={{ flex: 1 }}
                          >
                            <Text style={{ color: '#0F172A', fontSize: 14, fontWeight: fontWeights.bold, fontFamily: systemFont }} numberOfLines={1}>
                              {playerName}
                            </Text>
                            {inTeamA || inTeamB ? (
                              <Text style={{ fontSize: 11, fontWeight: fontWeights.bold, color: '#0284C7', fontFamily: systemFont, marginTop: 1 }} numberOfLines={1}>
                                {inTeamA ? activeT1 : activeT2} • Tap to unselect
                              </Text>
                            ) : null}
                          </TouchableOpacity>
                        </View>

                        {/* RIGHT FULL-HEIGHT BUTTON (TEAM 2 TRANSFER) */}
                        <TouchableOpacity
                          onPress={() => handleMoveToTeam(playerName, inTeamB ? 'pool' : 'team2')}
                          style={{
                            width: 48,
                            height: '100%',
                            backgroundColor: inTeamB ? '#0284C7' : '#F0F9FF',
                            borderLeftWidth: 1,
                            borderLeftColor: inTeamB ? '#0284C7' : '#E2E8F0',
                            justifyContent: 'center',
                            alignItems: 'center'
                          }}
                        >
                          <Ionicons
                            name={inTeamB ? 'checkmark-circle' : 'arrow-forward'}
                            size={inTeamB ? 24 : 20}
                            color={inTeamB ? '#FFFFFF' : '#0284C7'}
                          />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
              </ScrollView>

              {/* CLEAN BOTTOM ACTION BAR */}
              <View style={{ paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
                <TouchableOpacity
                  onPress={() => setPlayerSelectorVisible(false)}
                  style={{ backgroundColor: '#0284C7', height: 46, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: fontWeights.bold, fontFamily: systemFont }}>CONFIRM SQUADS</Text>
                  <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </Modal>

      {/* ADD NEW PLAYER POPUP MODAL */}
      <Modal
        visible={addPlayerModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddPlayerModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setAddPlayerModalVisible(false)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 }}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={{ width: '100%', maxWidth: 360, backgroundColor: '#071B2C', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#1E3A5F', gap: 14 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 16, color: '#FFFFFF', fontFamily: systemFontBold }}>
                Add New Player
              </Text>
              <TouchableOpacity onPress={() => setAddPlayerModalVisible(false)}>
                <Ionicons name="close" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* PLAYER NAME INPUT */}
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 11, color: '#BAE6FD', fontFamily: systemFontMedium }}>Player Name *</Text>
              <TextInput
                style={{ backgroundColor: '#0F2942', borderRadius: 10, borderWidth: 1, borderColor: '#1E3A5F', paddingHorizontal: 12, height: 42, color: '#FFFFFF', fontSize: 13, fontFamily: systemFont }}
                placeholder="Player Name (e.g. Rahul)..."
                placeholderTextColor="#64748B"
                value={newPlayerInput}
                onChangeText={setNewPlayerInput}
                maxLength={36}
              />
            </View>

            {/* MOBILE NUMBER INPUT */}
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 11, color: '#BAE6FD', fontFamily: systemFontMedium }}>Mobile Number (Optional)</Text>
              <TextInput
                style={{ backgroundColor: '#0F2942', borderRadius: 10, borderWidth: 1, borderColor: '#1E3A5F', paddingHorizontal: 12, height: 42, color: '#FFFFFF', fontSize: 13, fontFamily: systemFont }}
                placeholder="Mobile No. (e.g. 9829012345)..."
                placeholderTextColor="#64748B"
                value={newPlayerPhoneInput}
                onChangeText={setNewPlayerPhoneInput}
                keyboardType="phone-pad"
                maxLength={15}
              />
            </View>

            {/* ROLE SELECTOR PILLS */}
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 11, color: '#BAE6FD', fontFamily: systemFontMedium }}>Player Role</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {[
                  { id: 'All-Rounder', label: '⭐ All-Rounder' },
                  { id: 'Batsman', label: '🏑 Batsman' },
                  { id: 'Bowler', label: '⚡ Bowler' },
                  { id: 'WK-Batsman', label: '🧤 WK-Batsman' }
                ].map(item => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => setNewPlayerRoleInput(item.id)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 8,
                      backgroundColor: newPlayerRoleInput === item.id ? '#0284C7' : '#0F2942',
                      borderWidth: 1,
                      borderColor: newPlayerRoleInput === item.id ? '#38BDF8' : '#1E3A5F'
                    }}
                  >
                    <Text style={{ fontSize: 11, color: newPlayerRoleInput === item.id ? '#FFFFFF' : '#94A3B8', fontFamily: systemFontBold }}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* PHOTO PICKER OPTIONS */}
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 11, color: '#BAE6FD', fontFamily: systemFontMedium }}>Player Photo (Optional)</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  onPress={() => takePhotoFromCamera(setSelectedLocalImageUri)}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#0F2942', height: 40, borderRadius: 10, borderWidth: 1, borderColor: '#1E3A5F' }}
                >
                  <Ionicons name="camera" size={16} color="#38BDF8" />
                  <Text style={{ fontSize: 12, fontWeight: fontWeights.bold, color: '#FFFFFF', fontFamily: systemFont }}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => pickImageFromGallery(setSelectedLocalImageUri)}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#0F2942', height: 40, borderRadius: 10, borderWidth: 1, borderColor: '#1E3A5F' }}
                >
                  <Ionicons name="images" size={16} color="#38BDF8" />
                  <Text style={{ fontSize: 12, fontWeight: fontWeights.bold, color: '#FFFFFF', fontFamily: systemFont }}>Gallery</Text>
                </TouchableOpacity>
              </View>
              {selectedLocalImageUri ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <Image source={{ uri: selectedLocalImageUri }} style={{ width: 28, height: 28, borderRadius: 14 }} />
                  <Text style={{ fontSize: 11, color: '#38BDF8', fontFamily: systemFontBold }}>Photo Selected</Text>
                </View>
              ) : null}
            </View>

            {/* ACTION BUTTONS */}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
              <TouchableOpacity
                onPress={() => setAddPlayerModalVisible(false)}
                style={{ flex: 1, height: 42, borderRadius: 8, backgroundColor: '#1E293B', alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: '#94A3B8', fontSize: 12, fontFamily: systemFontBold }}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddNewPlayerToPool}
                disabled={isAddingPlayer || !newPlayerInput.trim()}
                style={{ flex: 1, height: 42, borderRadius: 8, backgroundColor: (isAddingPlayer || !newPlayerInput.trim()) ? '#64748B' : '#0284C7', alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 12, fontFamily: systemFontBold }}>
                  {isAddingPlayer ? 'SAVING...' : 'SAVE PLAYER'}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* EDIT PLAYER PHOTO MODAL */}
      <Modal
        visible={Boolean(editPhotoTargetPlayer)}
        transparent
        animationType="fade"
        onRequestClose={() => { setEditPhotoTargetPlayer(null); setSelectedLocalImageUri(null); }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => { setEditPhotoTargetPlayer(null); setSelectedLocalImageUri(null); }}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 }}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={{ width: '100%', maxWidth: 360, backgroundColor: '#071B2C', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#1E3A5F', gap: 14 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 15, color: '#FFFFFF', fontFamily: systemFontBold }} numberOfLines={1}>
                Set Photo: {typeof editPhotoTargetPlayer === 'string' ? editPhotoTargetPlayer : editPhotoTargetPlayer?.name}
              </Text>
              <TouchableOpacity onPress={() => { setEditPhotoTargetPlayer(null); setSelectedLocalImageUri(null); }}>
                <Ionicons name="close" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View style={{ alignItems: 'center', marginVertical: 4 }}>
              {selectedLocalImageUri ? (
                <Image source={{ uri: selectedLocalImageUri }} style={{ width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: '#0284C7' }} />
              ) : (
                <PlayerAvatar
                  name={typeof editPhotoTargetPlayer === 'string' ? editPhotoTargetPlayer : editPhotoTargetPlayer?.name}
                  photoUrl={editPhotoInputUrl}
                  size={64}
                />
              )}
            </View>

            <Text style={{ fontSize: 11, color: '#BAE6FD', fontFamily: systemFontMedium, textAlign: 'center' }}>
              Upload Photo from Camera or Phone Gallery:
            </Text>

            <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center' }}>
              <TouchableOpacity
                onPress={() => takePhotoFromCamera(setSelectedLocalImageUri)}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#0F2942', height: 42, borderRadius: 10, borderWidth: 1, borderColor: '#1E3A5F' }}
              >
                <Ionicons name="camera" size={16} color="#38BDF8" />
                <Text style={{ fontSize: 12, fontWeight: fontWeights.bold, color: '#FFFFFF', fontFamily: systemFont }}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => pickImageFromGallery(setSelectedLocalImageUri)}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#0F2942', height: 42, borderRadius: 10, borderWidth: 1, borderColor: '#1E3A5F' }}
              >
                <Ionicons name="images" size={16} color="#38BDF8" />
                <Text style={{ fontSize: 12, fontWeight: fontWeights.bold, color: '#FFFFFF', fontFamily: systemFont }}>Gallery</Text>
              </TouchableOpacity>
            </View>

            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 11, color: '#BAE6FD', fontFamily: systemFontMedium }}>
                Mobile Number (Optional):
              </Text>
              <TextInput
                style={{ backgroundColor: '#0F2942', borderRadius: 10, borderWidth: 1, borderColor: '#1E3A5F', paddingHorizontal: 12, height: 42, color: '#FFFFFF', fontSize: 12, fontFamily: systemFont }}
                placeholder="Mobile No. (e.g. 9829012345)..."
                placeholderTextColor="#64748B"
                value={editPhoneInput}
                onChangeText={setEditPhoneInput}
                keyboardType="phone-pad"
                maxLength={15}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
              <TouchableOpacity
                onPress={() => { setEditPhotoTargetPlayer(null); setSelectedLocalImageUri(null); }}
                style={{ flex: 1, height: 42, borderRadius: 8, backgroundColor: '#1E293B', alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: '#94A3B8', fontSize: 12, fontFamily: systemFontBold }}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSavePlayerPhoto}
                disabled={isSavingPhoto}
                style={{ flex: 1, height: 42, borderRadius: 8, backgroundColor: '#0284C7', alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 12, fontFamily: systemFontBold }}>
                  {isSavingPhoto ? 'UPLOADING...' : 'SAVE PHOTO'}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* BROADCAST TEAM SQUAD PREVIEW BANNER MODAL */}
      <Modal
        visible={squadPreviewVisible}
        animationType="slide"
        onRequestClose={() => setSquadPreviewVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          {/* LIGHT THEME HEADER BAR */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, color: '#0F172A', fontFamily: systemFontBold }}>
                PLAYING SQUAD BANNERS
              </Text>
              <Text style={{ fontSize: 11, color: '#64748B', fontFamily: systemFontMedium, marginTop: 2 }}>
                Swipe left / right or tap tabs to view team rosters
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setSquadPreviewVisible(false)}
              style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="close" size={20} color="#0F172A" />
            </TouchableOpacity>
          </View>

          {/* REUSABLE SHARED MATCH TAB BAR PRIMITIVE WITH SMOOTH ANIMATED UNDERLINE */}
          <View style={{ backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingHorizontal: 8 }}>
            <MatchTabBar
              tabs={[
                { id: 'team1', label: `${team1Name} (${team1Roster.length})` },
                { id: 'team2', label: `${team2Name} (${team2Roster.length})` }
              ]}
              activeTab={previewActiveTab}
              onPress={(tabId) => {
                setPreviewActiveTab(tabId);
                bannerScrollRef.current?.scrollTo({
                  x: tabId === 'team1' ? 0 : (bannerWidth || 360),
                  animated: true
                });
              }}
              layouts={previewTabLayouts}
              onTabLayout={(key, event) => {
                const { x, width } = event.nativeEvent.layout;
                setPreviewTabLayouts(prev => ({ ...prev, [key]: { x, width } }));
              }}
            />
          </View>

          {/* HORIZONTAL SWIPEABLE SQUAD ROSTER BANNER PAGER */}
          <ScrollView
            ref={bannerScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const offsetX = e.nativeEvent.contentOffset.x;
              const width = e.nativeEvent.layoutMeasurement.width;
              if (width > 0) setBannerWidth(width);
              if (width > 0 && offsetX >= width * 0.5) {
                setPreviewActiveTab('team2');
              } else {
                setPreviewActiveTab('team1');
              }
            }}
            scrollEventThrottle={16}
            style={{ flex: 1, marginTop: 12 }}
          >
            {/* TEAM 1 SQUAD BANNER CARD (LIGHT THEME GRID 4 CARDS PER ROW) */}
            <View style={{ width: bannerWidth || 360, paddingHorizontal: 16, gap: 12 }}>
              {/* HERO BANNER CARD */}
              <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#BAE6FD', alignItems: 'center', gap: 4, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 }}>
                <Image source={require('../../assets/default_team_1.png')} style={{ width: 56, height: 56, resizeMode: 'contain' }} />
                <Text style={{ color: '#0F172A', fontSize: 18, fontFamily: systemFontBold, textAlign: 'center' }}>
                  {team1Name}
                </Text>
                <Text style={{ color: '#0284C7', fontSize: 12, fontFamily: systemFontBold, marginTop: 2 }}>
                  {team1Roster.length} PLAYERS SQUAD
                </Text>
              </View>

              {/* ROSTER GRID (4 SQUARE CARDS PER ROW WITH BIG IMAGES) */}
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
                {team1Roster.length === 0 ? (
                  <View style={{ padding: 24, alignItems: 'center' }}>
                    <Text style={{ color: '#64748B', fontSize: 12, fontFamily: systemFontMedium }}>No players added to {team1Name} yet.</Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {team1Roster.map((pName, idx) => {
                      const dbMatch = localPlayersDb.find(p => p && p.name && p.name.trim().toLowerCase() === pName.trim().toLowerCase());
                      const role = dbMatch?.role || 'Player';

                      return (
                        <View
                          key={`t1-grid-${pName}-${idx}`}
                          style={{
                            width: '23%',
                            backgroundColor: '#FFFFFF',
                            borderRadius: 12,
                            padding: 6,
                            borderWidth: 1,
                            borderColor: '#BAE6FD',
                            alignItems: 'center',
                            gap: 4,
                            shadowColor: '#000',
                            shadowOpacity: 0.02,
                            shadowRadius: 3,
                            elevation: 1,
                            position: 'relative'
                          }}
                        >
                          <View style={{ position: 'absolute', top: 3, left: 4, backgroundColor: '#F0F9FF', paddingHorizontal: 4, borderRadius: 4 }}>
                            <Text style={{ fontSize: 9, color: '#0284C7', fontFamily: systemFontBold }}>#{idx + 1}</Text>
                          </View>
                          <View style={{ marginTop: 8 }}>
                            {renderSetupPlayerPhoto(pName, 44)}
                          </View>
                          <Text style={{ color: '#0F172A', fontSize: 10, fontFamily: systemFontBold, textAlign: 'center' }} numberOfLines={1}>
                            {pName}
                          </Text>
                          <View style={{ backgroundColor: '#F0F9FF', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 }}>
                            <Text style={{ color: '#0284C7', fontSize: 8, fontFamily: systemFontBold }} numberOfLines={1}>
                              {role}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </ScrollView>
            </View>

            {/* TEAM 2 SQUAD BANNER CARD (LIGHT THEME GRID 4 CARDS PER ROW) */}
            <View style={{ width: bannerWidth || 360, paddingHorizontal: 16, gap: 12 }}>
              {/* HERO BANNER CARD */}
              <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#FECDD3', alignItems: 'center', gap: 4, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 }}>
                <Image source={require('../../assets/default_team_2.png')} style={{ width: 56, height: 56, resizeMode: 'contain' }} />
                <Text style={{ color: '#0F172A', fontSize: 18, fontFamily: systemFontBold, textAlign: 'center' }}>
                  {team2Name}
                </Text>
                <Text style={{ color: '#E11D48', fontSize: 12, fontFamily: systemFontBold, marginTop: 2 }}>
                  {team2Roster.length} PLAYERS SQUAD
                </Text>
              </View>

              {/* ROSTER GRID (4 SQUARE CARDS PER ROW WITH BIG IMAGES) */}
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
                {team2Roster.length === 0 ? (
                  <View style={{ padding: 24, alignItems: 'center' }}>
                    <Text style={{ color: '#64748B', fontSize: 12, fontFamily: systemFontMedium }}>No players added to {team2Name} yet.</Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {team2Roster.map((pName, idx) => {
                      const dbMatch = localPlayersDb.find(p => p && p.name && p.name.trim().toLowerCase() === pName.trim().toLowerCase());
                      const role = dbMatch?.role || 'Player';

                      return (
                        <View
                          key={`t2-grid-${pName}-${idx}`}
                          style={{
                            width: '23%',
                            backgroundColor: '#FFFFFF',
                            borderRadius: 12,
                            padding: 6,
                            borderWidth: 1,
                            borderColor: '#FECDD3',
                            alignItems: 'center',
                            gap: 4,
                            shadowColor: '#000',
                            shadowOpacity: 0.02,
                            shadowRadius: 3,
                            elevation: 1,
                            position: 'relative'
                          }}
                        >
                          <View style={{ position: 'absolute', top: 3, left: 4, backgroundColor: '#FFF1F2', paddingHorizontal: 4, borderRadius: 4 }}>
                            <Text style={{ fontSize: 9, color: '#E11D48', fontFamily: systemFontBold }}>#{idx + 1}</Text>
                          </View>
                          <View style={{ marginTop: 8 }}>
                            {renderSetupPlayerPhoto(pName, 44)}
                          </View>
                          <Text style={{ color: '#0F172A', fontSize: 10, fontFamily: systemFontBold, textAlign: 'center' }} numberOfLines={1}>
                            {pName}
                          </Text>
                          <View style={{ backgroundColor: '#FFF1F2', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 }}>
                            <Text style={{ color: '#E11D48', fontSize: 8, fontFamily: systemFontBold }} numberOfLines={1}>
                              {role}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </ScrollView>
            </View>
          </ScrollView>

          {/* BOTTOM CONFIRMATION ACTION BAR */}
          <View style={{ padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
            <TouchableOpacity
              onPress={() => setSquadPreviewVisible(false)}
              style={{ backgroundColor: '#0284C7', height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontFamily: systemFontBold }}>
                CONFIRM & CLOSE SQUAD PREVIEW
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // STEP 2: COIN TOSS
  if (wizardStep === 2) {
    return (
      <View style={styles.container}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => setWizardStep(1)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 }}>
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
            <Text style={{ fontSize: 15, fontWeight: fontWeights.bold, color: '#0F172A', fontFamily: systemFont }}>Back</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 13, fontWeight: fontWeights.bold, color: '#0284C7', fontFamily: systemFont }}>Step 2 of 3</Text>
        </View>

        <ScrollView style={{ flex: 1, backgroundColor: '#F8FAFC' }} contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
          <View style={styles.cardBox}>
            <Text style={{ color: '#0F172A', fontSize: 18, fontWeight: fontWeights.bold, fontFamily: systemFontBold }}>Coin Toss</Text>
            <Text style={{ color: '#64748B', fontSize: 11, fontWeight: fontWeights.bold, marginTop: 2, marginBottom: 12, fontFamily: systemFont }}>
              Select who won the toss and elected to bat or bowl
            </Text>

            <Text style={styles.labelHeader}>WHO WON THE TOSS?</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {[activeT1, activeT2].map(team => {
                const active = tossWinner === team;
                return (
                  <TouchableOpacity
                    key={team}
                    onPress={() => setTossWinner(team)}
                    style={[styles.tossOptionBtn, { backgroundColor: active ? '#0284C7' : '#F8FAFC', borderColor: active ? '#0284C7' : '#CBD5E1' }]}
                  >
                    <Text style={{ color: active ? '#FFFFFF' : '#0F172A', fontSize: 12, fontWeight: fontWeights.bold, fontFamily: systemFont }}>{team}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.labelHeader, { marginTop: 10 }]}>THEY ELECTED TO?</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {['BAT', 'BOWL'].map(choice => {
                const active = tossDecision === choice;
                return (
                  <TouchableOpacity
                    key={choice}
                    onPress={() => setTossDecision(choice)}
                    style={[styles.tossOptionBtn, { backgroundColor: active ? '#0284C7' : '#F8FAFC', borderColor: active ? '#0284C7' : '#CBD5E1' }]}
                  >
                    <Text style={{ color: active ? '#FFFFFF' : '#0F172A', fontSize: 12, fontWeight: fontWeights.bold, fontFamily: systemFont }}>{choice === 'BAT' ? 'Bat First' : 'Bowl First'}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F0F9FF', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#BAE6FD', marginTop: 12 }}>
              <Ionicons name="megaphone-outline" size={16} color="#0369A1" />
              <Text style={{ fontSize: 12, fontWeight: fontWeights.bold, color: '#0369A1', flex: 1, fontFamily: systemFont }}>
                {tossWinner} won the toss and elected to {tossDecision.toLowerCase()} first.
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footerBar, { flexDirection: 'row', gap: 10 }]}>
          <TouchableOpacity style={{ flex: 0.3, height: 48, borderRadius: 8, backgroundColor: '#475569', alignItems: 'center', justifyContent: 'center' }} onPress={() => setWizardStep(1)}>
            <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryBtn, { flex: 1, backgroundColor: '#0284C7' }]}
            onPress={() => setWizardStep(3)}
          >
            <Text style={styles.btnText}>NEXT: OPENING PLAYERS</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // STEP 3: SELECT OPENERS
  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => setWizardStep(2)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 }}>
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
          <Text style={{ fontSize: 15, fontWeight: fontWeights.bold, color: '#0F172A', fontFamily: systemFont }}>Back</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 13, fontWeight: fontWeights.bold, color: '#0284C7', fontFamily: systemFont }}>Step 3 of 3</Text>
      </View>

      <ScrollView style={{ flex: 1, backgroundColor: '#F8FAFC' }} contentContainerStyle={{ padding: 14, gap: 14, paddingBottom: 24 }}>
        <View style={styles.cardBox}>
          <View style={{ minHeight: 46, paddingHorizontal: 14, backgroundColor: '#F0F9FF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: '#0369A1', fontSize: 12, fontWeight: fontWeights.bold, fontFamily: systemFont }}>OPENING PLAYERS</Text>
            <Text style={{ color: '#64748B', fontSize: 11, fontWeight: fontWeights.semibold, fontFamily: systemFont }}>{battingTeamName} batting first</Text>
          </View>

          <View style={{ flexDirection: 'row' }}>
            {selectedOpening.map((item, index) => (
              <View key={item.label} style={{ flex: 1, minHeight: 62, padding: 9, borderRightWidth: index < selectedOpening.length - 1 ? 1 : 0, borderRightColor: '#E2E8F0', justifyContent: 'center' }}>
                <Text style={{ color: '#94A3B8', fontSize: 9, fontWeight: fontWeights.bold, fontFamily: systemFont }}>{item.label.toUpperCase()}</Text>
                <Text style={{ color: item.name ? item.color : '#64748B', fontSize: 12, fontWeight: fontWeights.bold, marginTop: 4, fontFamily: systemFont }} numberOfLines={1}>
                  {item.name || 'Select'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* OPENING BATTERS SELECTION */}
        <View style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, overflow: 'hidden' }}>
          <View style={{ minHeight: 42, paddingHorizontal: 12, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialCommunityIcons name="cricket" size={16} color="#0284C7" />
            <Text style={{ flex: 1, color: '#0F172A', fontSize: 12, fontWeight: fontWeights.bold, fontFamily: systemFont }}>OPENING BATTERS ({battingTeamName})</Text>
            <Text style={{ color: '#0284C7', fontSize: 11, fontWeight: fontWeights.bold, fontFamily: systemFont }}>{[step3Striker, step3NonStriker].filter(Boolean).length}/2</Text>
          </View>
          {bRoster.map(name => renderOpeningRow({
            name,
            active: step3Striker === name || step3NonStriker === name,
            accent: '#0284C7',
            iconName: 'cricket',
            roleLabel: step3Striker === name ? 'STRIKER' : step3NonStriker === name ? 'NON-STRIKER' : '',
            onPress: () => handleOpeningBatterSelect(name)
          }))}
        </View>

        {/* OPENING BOWLER SELECTION */}
        <View style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, overflow: 'hidden' }}>
          <View style={{ minHeight: 42, paddingHorizontal: 12, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialCommunityIcons name="baseball" size={16} color="#E11D48" />
            <Text style={{ color: '#0F172A', fontSize: 12, fontWeight: fontWeights.bold, fontFamily: systemFont }}>OPENING BOWLER ({bowlingTeamName})</Text>
          </View>
          {blRoster.map(name => renderOpeningRow({
            name,
            active: step3Bowler === name,
            accent: '#E11D48',
            iconName: 'baseball',
            roleLabel: 'BOWLER',
            onPress: () => setStep3Bowler(name)
          }))}
        </View>
      </ScrollView>

      {/* START MATCH BUTTON */}
      <View style={[styles.footerBar, { flexDirection: 'row', gap: 10 }]}>
        <TouchableOpacity style={{ flex: 0.3, height: 48, borderRadius: 8, backgroundColor: '#475569', alignItems: 'center', justifyContent: 'center' }} onPress={() => setWizardStep(2)}>
          <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          disabled={!step3Striker || !step3NonStriker || !step3Bowler}
          style={[styles.primaryBtn, { flex: 1, backgroundColor: step3Striker && step3NonStriker && step3Bowler ? '#0284C7' : '#94A3B8' }]}
          onPress={handleFinalStartMatch}
        >
          <MaterialCommunityIcons name="cricket" size={18} color="#FFFFFF" />
          <Text style={styles.btnText}>START MATCH</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  headerBar: { backgroundColor: '#FFFFFF', height: 52, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  footerBar: { padding: 14, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  primaryBtn: { height: 48, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnText: { fontSize: 13, color: '#FFFFFF', fontFamily: systemFontBold },
  cardBox: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#CBD5E1', gap: 10 },
  cardTitle: { fontSize: 12, fontWeight: fontWeights.bold, color: '#0F172A', fontFamily: systemFont },
  input: { height: 44, borderRadius: 8, borderWidth: 1.5, borderColor: '#CBD5E1', paddingHorizontal: 12, fontSize: 13, fontWeight: fontWeights.semibold, color: '#0F172A', fontFamily: systemFont },
  managePlayersBtn: { minHeight: 44, borderRadius: 8, borderWidth: 1, borderColor: '#BAE6FD', backgroundColor: '#F0F9FF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  labelHeader: { fontSize: 11, fontWeight: fontWeights.bold, color: '#475569', fontFamily: systemFont },
  tossOptionBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, alignItems: 'center' }
});
