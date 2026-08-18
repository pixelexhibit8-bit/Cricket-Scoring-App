import React, { useState, useRef, useEffect, useMemo } from 'react';
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
import { PRESET_TEAM_LOGOS, getTeamLogoSource } from '../utils/teamUtils.js';
import { PlayerAvatar } from '../components/PlayerAvatar.jsx';
import { MatchTabBar } from '../components/MatchTabBar.jsx';
import { OpeningPlayersSelector } from '../components/OpeningPlayersSelector.jsx';
import { TeamLogoPickerModal } from '../components/modals/TeamLogoPickerModal.jsx';
import { AddPlayerModal } from '../components/modals/AddPlayerModal.jsx';
import { SquadSelectorModal } from '../components/modals/SquadSelectorModal.jsx';
import { EditPlayerPhotoModal } from '../components/modals/EditPlayerPhotoModal.jsx';
import { SquadPreviewModal } from '../components/modals/SquadPreviewModal.jsx';
import { MASTER_PLAYERS_DB } from '../../mockData.js';
import { fetchLocalPlayers, saveLocalPlayer, PRESET_PLAYER_AVATARS } from '../services/localPlayerService.js';
import { syncPlayersToPhotoRegistry, registerPlayerPhoto } from '../services/playerPhotoStore.js';
import { generateUUID } from '../services/supabaseClient.js';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToCloudinary } from '../services/cloudinaryService.js';
import { showToast } from '../services/toastService.js';

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
  const [wizardStep, setWizardStep] = useState(initialSetup?.startAtStep || 1);

  // Default Team Names & Logos
  const [team1Name, setTeam1Name] = useState(initialSetup?.team1Name || 'CSK');
  const [team2Name, setTeam2Name] = useState(initialSetup?.team2Name || 'RCB');
  const [team1LogoKey, setTeam1LogoKey] = useState(initialSetup?.team1LogoKey || 'csk');
  const [team2LogoKey, setTeam2LogoKey] = useState(initialSetup?.team2LogoKey || 'rcb');
  const [logoPickerModalVisible, setLogoPickerModalVisible] = useState(false);
  const [logoPickerTargetTeam, setLogoPickerTargetTeam] = useState('team1');

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
  const [tossWinner, setTossWinner] = useState(initialSetup?.team1Name || 'Team A');
  const [tossDecision, setTossDecision] = useState('BAT');

  // Auto-generate 6-digit PIN if empty
  useEffect(() => {
    if (!scorerPin) {
      const random6 = Math.floor(100000 + Math.random() * 900000).toString();
      setScorerPin(random6);
    }
  }, []);

  const generateRandomPin = () => {
    const random6 = Math.floor(100000 + Math.random() * 900000).toString();
    setScorerPin(random6);
    showToast(`New 6-Digit PIN: ${random6}`, 'success', 'PIN Generated');
  };

  // Synchronize when initialSetup is updated dynamically
  useEffect(() => {
    if (initialSetup) {
      if (initialSetup.team1Name) setTeam1Name(initialSetup.team1Name);
      if (initialSetup.team2Name) setTeam2Name(initialSetup.team2Name);
      if (initialSetup.team1LogoKey) setTeam1LogoKey(initialSetup.team1LogoKey);
      if (initialSetup.team2LogoKey) setTeam2LogoKey(initialSetup.team2LogoKey);
      if (Array.isArray(initialSetup.team1Roster) && initialSetup.team1Roster.length > 0) setTeam1Roster(initialSetup.team1Roster);
      if (Array.isArray(initialSetup.team2Roster) && initialSetup.team2Roster.length > 0) setTeam2Roster(initialSetup.team2Roster);
      if (initialSetup.totalOvers) setTotalOvers(String(initialSetup.totalOvers));
      if (initialSetup.venueName !== undefined) setVenueName(initialSetup.venueName);
      if (initialSetup.scorerPin) setScorerPin(initialSetup.scorerPin);
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
  const [newPlayerFirstName, setNewPlayerFirstName] = useState('');
  const [newPlayerLastName, setNewPlayerLastName] = useState('');
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
        showToast('Please allow gallery access to select a photo', 'error');
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
      showToast(err.message || 'Could not pick image', 'error');
    }
  };

  const takePhotoFromCamera = async (targetSetter) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showToast('Please allow camera access to capture a photo', 'error');
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
      showToast(err.message || 'Could not take photo', 'error');
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
    const fName = newPlayerFirstName.trim();
    const lName = newPlayerLastName.trim();
    const cleanPhone = newPlayerPhoneInput.trim().replace(/\D/g, '');

    if (!fName) {
      showToast('Please enter player First Name', 'error', 'Name Required');
      return;
    }
    if (!lName) {
      showToast('Please enter player Last Name / Surname', 'error', 'Surname Required');
      return;
    }
    if (cleanPhone.length !== 10) {
      showToast('Please enter a valid 10-digit mobile number for OTP login & profile linking', 'error', 'Mobile Number Required');
      return;
    }

    const trimmed = `${fName} ${lName}`;
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
      phone: cleanPhone
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

    setNewPlayerFirstName('');
    setNewPlayerLastName('');
    setNewPlayerInput('');
    setNewPlayerPhoneInput('');
    setPhotoUrlInput('');
    setSelectedLocalImageUri(null);
    setIsAddingPlayer(false);
    setAddPlayerModalVisible(false);
    showToast(`${trimmed} added successfully!`, 'success', 'Player Added');
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
      showToast('Please select Striker, Non-Striker and Opening Bowler', 'error', 'Missing Openers');
      return;
    }
    if (step3Striker === step3NonStriker) {
      showToast('Striker and Non-Striker must be two different players', 'error', 'Invalid Openers');
      return;
    }
    const finalTeam1 = team1Name.trim() || 'Team A';
    const finalTeam2 = team2Name.trim() || 'Team B';
    const resolvedPin = (scorerPin || '').trim() || '123456';

    if (onStartMatch) {
      onStartMatch({
        team1Name: finalTeam1,
        team2Name: finalTeam2,
        team1LogoKey,
        team2LogoKey,
        team1Roster: team1Roster,
        team2Roster: team2Roster,
        ballType,
        totalOvers: parseInt(totalOvers, 10) || 5,
        pitchType,
        umpireName: umpireName || 'Cric Scorer',
        venueName: venueName ? venueName.trim() : '',
        scheduledAt: matchSchedule.isoString,
        matchDate: matchSchedule.label,
        tossWinner: tossWinner || finalTeam1,
        tossDecision: tossDecision || 'BAT',
        striker: step3Striker,
        nonStriker: step3NonStriker,
        bowler: step3Bowler,
        scorerPin: resolvedPin
      });
    }
  };

  const activeT1 = team1Name.trim() || 'CricScorer Eleven';
  const activeT2 = team2Name.trim() || 'CricScorer Strikers';
  const battingTeamName = tossDecision === 'BAT' ? tossWinner : (tossWinner === activeT1 ? activeT2 : activeT1);
  const bowlingTeamName = battingTeamName === activeT1 ? activeT2 : activeT1;
  const bRoster = battingTeamName === activeT1 ? team1Roster : team2Roster;
  const blRoster = bowlingTeamName === activeT1 ? team1Roster : team2Roster;

  const selectedOpening = [
    { label: 'Striker', name: step3Striker, color: '#0284C7' },
    { label: 'Non-striker', name: step3NonStriker, color: '#0284C7' },
    { label: 'Bowler', name: step3Bowler, color: '#E11D48' }
  ];

  const allPlayersPool = useMemo(() => {
    const rawList = [
      ...DEFAULT_TEAM_A_ROSTER,
      ...DEFAULT_TEAM_B_ROSTER,
      ...(localPlayersDb || []).map(p => p?.name),
      ...team1Roster,
      ...team2Roster,
      ...playerPool
    ].filter(Boolean);
    const seen = new Set();
    const result = [];
    for (const name of rawList) {
      const clean = String(name).trim();
      const key = clean.toLowerCase();
      if (clean && !seen.has(key)) {
        seen.add(key);
        result.push(clean);
      }
    }
    return result;
  }, [localPlayersDb]);

  // Unified Clean Header + Stepper
  const renderWizardHeader = (stepNum) => {
    const stepTitles = {
      1: 'Quick Match Setup',
      2: 'Coin Toss',
      3: 'Opening Players'
    };

    return (
      <View style={{ backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
        {/* Main Header Bar */}
        <View style={{
          height: 50,
          paddingHorizontal: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <TouchableOpacity
            onPress={() => {
              if (stepNum === 1) {
                if (onCancel) onCancel();
              } else {
                setWizardStep(prev => prev - 1);
              }
            }}
            activeOpacity={0.7}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, minWidth: 60 }}
          >
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
            <Text style={{ fontSize: 13.5, fontFamily: systemFontMedium, color: '#0F172A' }}>
              {stepNum === 1 ? 'Exit' : 'Back'}
            </Text>
          </TouchableOpacity>

          <Text style={{ fontSize: 15.5, fontFamily: systemFontBold, color: '#0F172A' }}>
            {stepTitles[stepNum] || 'Quick Match'}
          </Text>

          <View style={{ backgroundColor: '#F0F9FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 0.5, borderColor: '#BAE6FD', minWidth: 60, alignItems: 'center' }}>
            <Text style={{ color: '#0284C7', fontSize: 11, fontFamily: systemFontBold }}>
              Step {stepNum}/3
            </Text>
          </View>
        </View>

        {/* Clean Sub-Bar Stepper */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 7,
          paddingHorizontal: 20,
          backgroundColor: '#F8FAFC',
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
          gap: 8
        }}>
          {[
            { step: 1, label: 'Setup' },
            { step: 2, label: 'Toss' },
            { step: 3, label: 'Openers' }
          ].map((s, idx) => {
            const isCurrent = stepNum === s.step;
            const isCompleted = stepNum > s.step;
            return (
              <View key={s.step} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: isCompleted ? '#0284C7' : isCurrent ? '#0284C7' : '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: isCompleted || isCurrent ? '#0284C7' : '#CBD5E1'
                }}>
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  ) : (
                    <Text style={{ color: isCurrent ? '#FFFFFF' : '#64748B', fontSize: 10.5, fontFamily: systemFontBold }}>
                      {s.step}
                    </Text>
                  )}
                </View>
                <Text style={{
                  fontSize: 11.5,
                  fontFamily: isCurrent ? systemFontBold : systemFontMedium,
                  color: isCurrent ? '#0284C7' : '#64748B'
                }}>
                  {s.label}
                </Text>
                {idx < 2 ? (
                  <View style={{ width: 18, height: 1.5, backgroundColor: isCompleted ? '#0284C7' : '#E2E8F0', marginHorizontal: 2 }} />
                ) : null}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  // STEP 1: ULTRA-CLEAN & SIMPLIFIED TEAMS SETUP
  if (wizardStep === 1) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#FFFFFF' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          {/* Persistent Step 1 Header */}
          {renderWizardHeader(1)}

          <ScrollView ref={step1ScrollRef} style={{ flex: 1, backgroundColor: '#F8FAFC' }} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 280 }} keyboardShouldPersistTaps="handled">
            {/* CARD 1: ULTRA-CLEAN PLAYING TEAMS & LOGOS MATCHUP */}
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', gap: 14 }}>
              <Text style={{ fontSize: 11, fontWeight: fontWeights.bold, color: '#64748B', letterSpacing: 0.5, fontFamily: systemFont, textAlign: 'center' }}>
                PLAYING TEAMS
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 }}>
                {/* LEFT SIDE: TEAM 1 LOGO (CIRCULAR) + NAME */}
                <View style={{ flex: 1, alignItems: 'center', gap: 8 }}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      setLogoPickerTargetTeam('team1');
                      setLogoPickerModalVisible(true);
                    }}
                    style={{ position: 'relative' }}
                  >
                    <TeamIdentityMark
                      team={{ name: team1Name, logoKey: team1LogoKey }}
                      size={60}
                    />
                    <View style={{ position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: 11, backgroundColor: '#0284C7', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#FFFFFF' }}>
                      <Ionicons name="camera" size={11} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>

                  <View style={{
                    width: '100%',
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#F8FAFC',
                    borderRadius: 10,
                    borderWidth: 1.5,
                    borderColor: '#CBD5E1',
                    paddingHorizontal: 8,
                    paddingVertical: 4
                  }}>
                    <TextInput
                      style={{
                        flex: 1,
                        fontSize: 13,
                        fontWeight: fontWeights.bold,
                        color: '#0F172A',
                        fontFamily: systemFontBold,
                        textAlign: 'center',
                        paddingVertical: 2
                      }}
                      value={team1Name}
                      onChangeText={setTeam1Name}
                      placeholder="Team A"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="words"
                    />
                    <Ionicons name="pencil" size={12} color="#0284C7" />
                  </View>
                </View>

                {/* CENTER SIDE: LITTLE VS BADGE */}
                <View style={{ paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#071B2C', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#38BDF8' }}>
                    <Text style={{ fontSize: 11, fontWeight: fontWeights.bold, color: '#FFFFFF', fontFamily: systemFontBold }}>VS</Text>
                  </View>
                </View>

                {/* RIGHT SIDE: TEAM 2 LOGO (CIRCULAR) + NAME */}
                <View style={{ flex: 1, alignItems: 'center', gap: 8 }}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      setLogoPickerTargetTeam('team2');
                      setLogoPickerModalVisible(true);
                    }}
                    style={{ position: 'relative' }}
                  >
                    <TeamIdentityMark
                      team={{ name: team2Name, logoKey: team2LogoKey }}
                      size={60}
                    />
                    <View style={{ position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: 11, backgroundColor: '#0284C7', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#FFFFFF' }}>
                      <Ionicons name="camera" size={11} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>

                  <View style={{
                    width: '100%',
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#F8FAFC',
                    borderRadius: 10,
                    borderWidth: 1.5,
                    borderColor: '#CBD5E1',
                    paddingHorizontal: 8,
                    paddingVertical: 4
                  }}>
                    <TextInput
                      style={{
                        flex: 1,
                        fontSize: 13,
                        fontWeight: fontWeights.bold,
                        color: '#0F172A',
                        fontFamily: systemFontBold,
                        textAlign: 'center',
                        paddingVertical: 2
                      }}
                      value={team2Name}
                      onChangeText={setTeam2Name}
                      placeholder="Team B"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="words"
                    />
                    <Ionicons name="pencil" size={12} color="#0284C7" />
                  </View>
                </View>
              </View>

              {/* SINGLE UNIFIED SQUAD STRIP */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setPlayerSelectorVisible(true)}
                style={{
                  backgroundColor: '#F0F9FF',
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: '#BAE6FD',
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 2
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MaterialCommunityIcons name="account-group" size={20} color="#0284C7" />
                  <Text style={{ color: '#0369A1', fontSize: 12, fontFamily: systemFontBold }}>
                    Playing Squads: {team1Roster.length} vs {team2Roster.length} Players
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ color: '#0284C7', fontSize: 11, fontFamily: systemFontBold }}>Manage</Text>
                  <Ionicons name="chevron-forward" size={14} color="#0284C7" />
                </View>
              </TouchableOpacity>

              {/* SQUAD PREVIEW CLEAN & MINIMAL BUTTON */}
              {(team1Roster.length > 0 || team2Roster.length > 0) && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setSquadPreviewVisible(true)}
                  style={{
                    backgroundColor: '#F0F9FF',
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: '#BAE6FD',
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    marginTop: 2
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="images" size={17} color="#0284C7" />
                    <Text style={{ color: '#0369A1', fontSize: 12.5, fontFamily: systemFontMedium }}>
                      Team Banners
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ backgroundColor: '#E0F2FE', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
                      <Text style={{ color: '#0284C7', fontSize: 11, fontFamily: systemFontMedium }}>
                        {team1Roster.length} vs {team2Roster.length}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color="#0284C7" />
                  </View>
                </TouchableOpacity>
              )}
            </View>

            {/* CARD 2: MATCH CONFIGURATION (OVERS, BALL, VENUE & UMPIRE) */}
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', gap: 14 }}>
              <Text style={{ fontSize: 11, fontWeight: fontWeights.bold, color: '#64748B', letterSpacing: 0.5, fontFamily: systemFont }}>
                MATCH SETTINGS
              </Text>

              {/* INTERACTIVE OVERS STEPPER & PRESETS */}
              <View style={{ gap: 8 }}>
                <Text style={styles.labelHeader}>TOTAL MATCH OVERS</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC', padding: 8, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
                  <TouchableOpacity
                    onPress={() => setTotalOvers(prev => String(Math.max(1, (parseInt(prev, 10) || 5) - 1)))}
                    style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Ionicons name="remove" size={22} color="#0F172A" />
                  </TouchableOpacity>

                  <View style={{ alignItems: 'center', flexDirection: 'row', gap: 8 }}>
                    <MaterialCommunityIcons name="cricket" size={20} color="#0284C7" />
                    <Text style={{ fontSize: 20, color: '#0284C7', fontFamily: systemFontBold }}>
                      {totalOvers} <Text style={{ fontSize: 12, color: '#64748B', fontFamily: systemFontMedium }}>OVERS</Text>
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => setTotalOvers(prev => String(Math.min(50, (parseInt(prev, 10) || 5) + 1)))}
                    style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: '#0284C7', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Ionicons name="add" size={22} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                {/* Quick Overs Preset Chips */}
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {['5', '8', '10', '12', '20'].map(ov => {
                    const active = totalOvers === ov;
                    return (
                      <TouchableOpacity
                        key={ov}
                        onPress={() => setTotalOvers(ov)}
                        style={{
                          flex: 1,
                          paddingVertical: 6,
                          borderRadius: 8,
                          backgroundColor: active ? '#0284C7' : '#F8FAFC',
                          borderWidth: 1,
                          borderColor: active ? '#0284C7' : '#CBD5E1',
                          alignItems: 'center'
                        }}
                      >
                        <Text style={{ color: active ? '#FFFFFF' : '#475569', fontSize: 11, fontFamily: systemFontBold }}>
                          {ov} Ov
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* BALL TYPE SELECTOR (RED TENNIS | CHERRY LEATHER | YELLOW OTHER) */}
              <View style={{ gap: 8 }}>
                <Text style={styles.labelHeader}>BALL TYPE</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {[
                    { id: 'tennis', label: 'Tennis' },
                    { id: 'leather', label: 'Leather' },
                    { id: 'other', label: 'Other' }
                  ].map(item => {
                    const active = ballType === item.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => setBallType(item.id)}
                        style={{
                          flex: 1,
                          paddingVertical: 9,
                          borderRadius: 10,
                          backgroundColor: active ? '#0284C7' : '#F8FAFC',
                          borderWidth: 1,
                          borderColor: active ? '#0284C7' : '#CBD5E1',
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 7
                        }}
                      >
                        {/* AUTHENTIC VECTOR BALL BADGES */}
                        {item.id === 'tennis' ? (
                          // RED TENNIS / TAPE BALL
                          <View style={{
                            width: 17,
                            height: 17,
                            borderRadius: 8.5,
                            backgroundColor: '#EF4444',
                            borderWidth: 1,
                            borderColor: '#DC2626',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            position: 'relative'
                          }}>
                            <View style={{
                              width: 13,
                              height: 13,
                              borderRadius: 6.5,
                              borderWidth: 1,
                              borderColor: '#FFFFFF',
                              borderStyle: 'dashed'
                            }} />
                          </View>
                        ) : item.id === 'leather' ? (
                          // CRIMSON RED LEATHER CRICKET BALL
                          <View style={{
                            width: 17,
                            height: 17,
                            borderRadius: 8.5,
                            backgroundColor: '#991B1B',
                            borderWidth: 1,
                            borderColor: '#7F1D1D',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative'
                          }}>
                            <View style={{
                              width: 1.5,
                              height: '100%',
                              backgroundColor: '#FFFFFF',
                              borderRadius: 1
                            }} />
                            <View style={{
                              position: 'absolute',
                              top: 2,
                              left: 2.5,
                              width: 3.5,
                              height: 3.5,
                              borderRadius: 2,
                              backgroundColor: 'rgba(255, 255, 255, 0.45)'
                            }} />
                          </View>
                        ) : (
                          // BRIGHT YELLOW TURF BALL
                          <View style={{
                            width: 17,
                            height: 17,
                            borderRadius: 8.5,
                            backgroundColor: '#FACC15',
                            borderWidth: 1,
                            borderColor: '#EAB308',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative'
                          }}>
                            <View style={{
                              width: 1.5,
                              height: '100%',
                              backgroundColor: '#854D0E',
                              borderRadius: 1
                            }} />
                          </View>
                        )}

                        <Text style={{ color: active ? '#FFFFFF' : '#334155', fontSize: 12.5, fontFamily: systemFontBold }}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* VENUE & UMPIRE COMPACT INPUTS */}
              <View style={{ gap: 10 }}>
                <View style={{ gap: 4 }}>
                  <Text style={styles.labelHeader}>VENUE / GROUND</Text>
                  <TextInput
                    style={styles.input}
                    value={venueName}
                    onChangeText={setVenueName}
                    placeholder="Ground, School or Turf Name"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={{ gap: 4 }}>
                  <Text style={styles.labelHeader}>UMPIRE NAME</Text>
                  <TextInput
                    style={styles.input}
                    value={umpireName}
                    onChangeText={setUmpireName}
                    placeholder="Umpire Name"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>
            </View>

            {/* NEXT: COIN TOSS BUTTON */}
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                {
                  backgroundColor: (team1Name.trim() && team2Name.trim() && totalOvers) ? '#0284C7' : '#94A3B8',
                  marginTop: 6
                }
              ]}
              disabled={!team1Name.trim() || !team2Name.trim() || !totalOvers}
              onPress={() => setWizardStep(2)}
            >
              <Text style={styles.btnText}>NEXT: COIN TOSS</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </ScrollView>

          {/* 10-PRESET TEAM LOGO PICKER MODAL */}
          <TeamLogoPickerModal
            visible={logoPickerModalVisible}
            onClose={() => setLogoPickerModalVisible(false)}
            targetTeam={logoPickerTargetTeam}
            teamName={logoPickerTargetTeam === 'team1' ? team1Name : team2Name}
            team1LogoKey={team1LogoKey}
            team2LogoKey={team2LogoKey}
            onSelectLogo={(preset, target) => {
              if (target === 'team1') {
                setTeam1LogoKey(preset.id);
                setTeam1Name(preset.name);
                if (tossWinner === team1Name || tossWinner === 'Team A' || tossWinner === 'CSK') {
                  setTossWinner(preset.name);
                }
              } else {
                setTeam2LogoKey(preset.id);
                setTeam2Name(preset.name);
                if (tossWinner === team2Name || tossWinner === 'Team B' || tossWinner === 'RCB') {
                  setTossWinner(preset.name);
                }
              }
              showToast(`${preset.label} selected! Team name updated.`, 'success');
            }}
          />

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
          <SquadSelectorModal
            visible={playerSelectorVisible}
            onClose={() => setPlayerSelectorVisible(false)}
            team1Name={activeT1}
            team2Name={activeT2}
            team1LogoKey={team1LogoKey}
            team2LogoKey={team2LogoKey}
            team1Roster={team1Roster}
            team2Roster={team2Roster}
            allPlayersPool={allPlayersPool}
            localPlayersDb={localPlayersDb}
            onMoveToTeam={handleMoveToTeam}
            onOpenAddPlayerModal={() => setAddPlayerModalVisible(true)}
            onOpenSquadPreview={() => setSquadPreviewVisible(true)}
            onEditPlayerPhoto={(name, dbMatch) => {
              setEditPhotoTargetPlayer(name);
              setEditPhotoInputUrl(dbMatch?.photoUrl || dbMatch?.photo_url || '');
              setEditPhoneInput(dbMatch?.phone || dbMatch?.mobile || '');
            }}
          />

          {/* ADD NEW PLAYER POPUP MODAL */}
          <AddPlayerModal
            visible={addPlayerModalVisible}
            onClose={() => setAddPlayerModalVisible(false)}
            onAddPlayer={async ({ fullName, phone }) => {
              const newPlayerObj = {
                id: generateUUID(),
                name: fullName,
                role: 'All-Rounder',
                photoUrl: '',
                phone
              };
              const saved = await saveLocalPlayer(newPlayerObj);
              const active = saved || newPlayerObj;
              registerPlayerPhoto(active.name, active.photoUrl);
              setLocalPlayersDb(prev => [active, ...prev.filter(p => p && p.name !== active.name)]);
              setPlayerPool(prev => [active.name, ...prev.filter(p => p !== active.name)]);
              showToast(`${active.name} added to player pool!`, 'success');
            }}
          />

          {/* EDIT PLAYER PHOTO MODAL */}
          <EditPlayerPhotoModal
            visible={Boolean(editPhotoTargetPlayer)}
            targetPlayer={editPhotoTargetPlayer}
            onClose={() => { setEditPhotoTargetPlayer(null); setSelectedLocalImageUri(null); }}
            onSaveSuccess={async ({ name, photoUrl, phone }) => {
              const existingInDb = localPlayersDb.find(p => p && p.name && p.name.trim().toLowerCase() === name.trim().toLowerCase());
              const playerObj = {
                id: existingInDb?.id || generateUUID(),
                name: name.trim(),
                role: existingInDb?.role || 'Player',
                photoUrl,
                phone
              };
              const savedObj = await saveLocalPlayer(playerObj);
              const activeObj = savedObj || playerObj;
              registerPlayerPhoto(activeObj.name, activeObj.photoUrl);
              setLocalPlayersDb(prev => [
                activeObj,
                ...prev.filter(p => p && p.name && p.name.trim().toLowerCase() !== name.trim().toLowerCase())
              ]);
            }}
          />

          {/* BROADCAST TEAM SQUAD PREVIEW BANNER MODAL */}
          <SquadPreviewModal
            visible={squadPreviewVisible}
            onClose={() => setSquadPreviewVisible(false)}
            team1Name={activeT1}
            team2Name={activeT2}
            team1LogoKey={team1LogoKey}
            team2LogoKey={team2LogoKey}
            team1Roster={team1Roster}
            team2Roster={team2Roster}
            localPlayersDb={localPlayersDb}
          />
        </View>
      </KeyboardAvoidingView>
    );
  }

  // STEP 2: COIN TOSS
  if (wizardStep === 2) {
    return (
      <View style={styles.container}>
        {/* Persistent Step 2 Header */}
        {renderWizardHeader(2)}

        <ScrollView style={{ flex: 1, backgroundColor: '#F8FAFC' }} contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#E2E8F0', gap: 14 }}>
            <Text style={{ fontSize: 11, fontFamily: systemFontMedium, color: '#64748B', letterSpacing: 0.5, textTransform: 'uppercase' }}>
              WHO WON THE TOSS?
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {[
                { name: activeT1, logoKey: team1LogoKey },
                { name: activeT2, logoKey: team2LogoKey }
              ].map((teamObj) => {
                const active = tossWinner === teamObj.name;
                return (
                  <TouchableOpacity
                    key={teamObj.name}
                    onPress={() => setTossWinner(teamObj.name)}
                    activeOpacity={0.8}
                    style={{
                      flex: 1,
                      backgroundColor: active ? '#F0F9FF' : '#FFFFFF',
                      borderColor: active ? '#0284C7' : '#E2E8F0',
                      borderWidth: active ? 1.5 : 1,
                      borderRadius: 14,
                      padding: 14,
                      alignItems: 'center',
                      gap: 8
                    }}
                  >
                    <TeamIdentityMark team={{ name: teamObj.name, logoKey: teamObj.logoKey }} size={44} />
                    <Text style={{ color: active ? '#0284C7' : '#0F172A', fontSize: 13.5, fontFamily: systemFontMedium }} numberOfLines={1}>
                      {teamObj.name}
                    </Text>
                    {active ? (
                      <View style={{ backgroundColor: '#0284C7', width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={{ fontSize: 11, fontFamily: systemFontMedium, color: '#64748B', letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 6 }}>
              THEY ELECTED TO?
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {[
                { key: 'BAT', label: 'Bat First', icon: 'cricket' },
                { key: 'BOWL', label: 'Bowl First', icon: 'baseball' }
              ].map(choice => {
                const active = tossDecision === choice.key;
                return (
                  <TouchableOpacity
                    key={choice.key}
                    onPress={() => setTossDecision(choice.key)}
                    activeOpacity={0.8}
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      paddingVertical: 12,
                      borderRadius: 12,
                      backgroundColor: active ? '#0284C7' : '#FFFFFF',
                      borderColor: active ? '#0284C7' : '#E2E8F0',
                      borderWidth: 1
                    }}
                  >
                    <MaterialCommunityIcons name={choice.icon} size={18} color={active ? '#FFFFFF' : '#64748B'} />
                    <Text style={{ color: active ? '#FFFFFF' : '#0F172A', fontSize: 13, fontFamily: systemFontMedium }}>
                      {choice.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F0F9FF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#BAE6FD', marginTop: 4 }}>
              <Ionicons name="megaphone-outline" size={18} color="#0284C7" />
              <Text style={{ fontSize: 12.5, color: '#0369A1', flex: 1, fontFamily: systemFontMedium }}>
                {tossWinner} won the toss and elected to {tossDecision.toLowerCase()} first.
              </Text>
            </View>
          </View>

          {/* CARD 2: INFERRED INNINGS 1 LINEUP CARD */}
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', gap: 12 }}>
            <Text style={{ fontSize: 11, fontFamily: systemFontMedium, color: '#64748B', letterSpacing: 0.5, textTransform: 'uppercase' }}>
              1ST INNINGS MATCH LINEUP
            </Text>

            <View style={{ gap: 8 }}>
              {/* Batting Team Row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F0FDF4', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#BBF7D0' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <TeamIdentityMark team={{ name: battingTeamName, logoKey: battingTeamName === activeT1 ? team1LogoKey : team2LogoKey }} size={32} />
                  <View>
                    <Text style={{ color: '#0F172A', fontSize: 13.5, fontFamily: systemFontBold }}>
                      {battingTeamName}
                    </Text>
                    <Text style={{ color: '#16A34A', fontSize: 11, fontFamily: systemFontMedium, marginTop: 1 }}>
                      🏏 Batting 1st ({bRoster.length} Players)
                    </Text>
                  </View>
                </View>
                <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                  <Text style={{ color: '#15803D', fontSize: 10.5, fontFamily: systemFontBold }}>BATTING</Text>
                </View>
              </View>

              {/* Bowling Team Row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <TeamIdentityMark team={{ name: bowlingTeamName, logoKey: bowlingTeamName === activeT1 ? team1LogoKey : team2LogoKey }} size={32} />
                  <View>
                    <Text style={{ color: '#0F172A', fontSize: 13.5, fontFamily: systemFontBold }}>
                      {bowlingTeamName}
                    </Text>
                    <Text style={{ color: '#64748B', fontSize: 11, fontFamily: systemFontMedium, marginTop: 1 }}>
                      ⚾ Bowling 1st ({blRoster.length} Players)
                    </Text>
                  </View>
                </View>
                <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                  <Text style={{ color: '#64748B', fontSize: 10.5, fontFamily: systemFontBold }}>BOWLING</Text>
                </View>
              </View>
            </View>
          </View>

          {/* CARD 3: MATCH CONFIGURATION SUMMARY */}
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', gap: 10 }}>
            <Text style={{ fontSize: 11, fontFamily: systemFontMedium, color: '#64748B', letterSpacing: 0.5, textTransform: 'uppercase' }}>
              MATCH CONFIGURATION
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <View style={{ flex: 1, minWidth: '45%', backgroundColor: '#F8FAFC', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', gap: 2 }}>
                <Text style={{ color: '#64748B', fontSize: 10.5, fontFamily: systemFont }}>Overs</Text>
                <Text style={{ color: '#0F172A', fontSize: 13, fontFamily: systemFontBold }}>{totalOvers} Overs Match</Text>
              </View>
              <View style={{ flex: 1, minWidth: '45%', backgroundColor: '#F8FAFC', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', gap: 2 }}>
                <Text style={{ color: '#64748B', fontSize: 10.5, fontFamily: systemFont }}>Ball Type</Text>
                <Text style={{ color: '#0F172A', fontSize: 13, fontFamily: systemFontBold }}>{ballType} Ball</Text>
              </View>
              <View style={{ flex: 1, minWidth: '45%', backgroundColor: '#F8FAFC', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', gap: 2 }}>
                <Text style={{ color: '#64748B', fontSize: 10.5, fontFamily: systemFont }}>Venue</Text>
                <Text style={{ color: '#0F172A', fontSize: 12.5, fontFamily: systemFontMedium }} numberOfLines={1}>{venueName || 'Local Ground'}</Text>
              </View>
              <View style={{ flex: 1, minWidth: '45%', backgroundColor: '#F8FAFC', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', gap: 2 }}>
                <Text style={{ color: '#64748B', fontSize: 10.5, fontFamily: systemFont }}>Umpire</Text>
                <Text style={{ color: '#0F172A', fontSize: 12.5, fontFamily: systemFontMedium }} numberOfLines={1}>{umpireName || 'Official'}</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footerBar, { flexDirection: 'row', gap: 10 }]}>
          <TouchableOpacity
            style={{ width: 48, height: 48, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' }}
            onPress={() => setWizardStep(1)}
          >
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryBtn, { flex: 1, backgroundColor: '#0284C7', borderRadius: 10 }]}
            onPress={() => setWizardStep(3)}
          >
            <Text style={styles.btnText}>CONTINUE TO OPENERS</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // STEP 3: SELECT OPENERS
  return (
    <View style={styles.container}>
      {/* Persistent Step 3 Header */}
      {renderWizardHeader(3)}

      <OpeningPlayersSelector
        battingTeamName={battingTeamName}
        bowlingTeamName={bowlingTeamName}
        battingRoster={bRoster}
        bowlingRoster={blRoster}
        striker={step3Striker}
        nonStriker={step3NonStriker}
        bowler={step3Bowler}
        onSelectBatter={handleOpeningBatterSelect}
        onSelectBowler={setStep3Bowler}
        renderPlayerPhoto={renderSetupPlayerPhoto}
        ctaText="START MATCH"
        onStart={handleFinalStartMatch}
        onBack={() => setWizardStep(2)}
        headerTitle="OPENING PLAYERS"
      />
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
