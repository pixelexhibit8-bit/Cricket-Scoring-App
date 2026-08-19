import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  StatusBar, TextInput, Modal, Alert, useWindowDimensions,
  Animated, RefreshControl, BackHandler, LogBox
} from 'react-native';

LogBox.ignoreLogs([
  '[Supabase Realtime Warning]',
  'channel error: transport failure',
  'Realtime Warning'
]);
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { MASTER_PLAYERS_DB } from './mockData';
import { TeamIdentityMark } from './src/components/TeamIdentityMark';
import { MatchListScoreCard } from './src/components/MatchListScoreCard';
import { MatchInfoPanel } from './src/components/MatchInfoPanel';
import { MatchTabBar } from './src/components/MatchTabBar';
import { RealtimeWinBar } from './src/components/RealtimeWinBar';
import { PreInningsScorecard } from './src/components/PreInningsScorecard';
import { OpeningPlayersSelector } from './src/components/OpeningPlayersSelector';
import { WormGraph } from './src/components/WormGraph';
import { ManhattanGraph } from './src/components/ManhattanGraph';
import { MyProfileScreen } from './src/screens/MyProfileScreen.jsx';
import { HomeScreen } from './src/screens/HomeScreen.jsx';
import { PlayerAvatar } from './src/components/PlayerAvatar.jsx';
import { TournamentScreen } from './src/components/TournamentScreen.jsx';
import { ScorerPinModal } from './src/components/modals/ScorerPinModal.jsx';
import { MatchCompleteModal } from './src/components/modals/MatchCompleteModal.jsx';
import { BowlerChangeModal } from './src/components/modals/BowlerChangeModal.jsx';
import { ExtrasModal } from './src/components/modals/ExtrasModal.jsx';
import { WicketPendingModal } from './src/components/modals/WicketPendingModal.jsx';
import { RunOutModal } from './src/components/modals/RunOutModal.jsx';
import { SquadSelectorModal } from './src/components/modals/SquadSelectorModal.jsx';
import { AddPlayerModal } from './src/components/modals/AddPlayerModal.jsx';
import { PlayingXiModal } from './src/components/modals/PlayingXiModal.jsx';
import { WicketDismissalModal } from './src/components/modals/WicketDismissalModal.jsx';
import { QuickMatchSetupScreen } from './src/screens/QuickMatchSetupScreen.jsx';
import { ScorerConsoleScreen } from './src/screens/ScorerConsoleScreen.jsx';
import { InningBreakScreen } from './src/screens/InningBreakScreen.jsx';
import { PublicLiveViewScreen } from './src/screens/PublicLiveViewScreen.jsx';
import { FinishedMatchViewScreen } from './src/screens/FinishedMatchViewScreen.jsx';
import { AppNavigator } from './src/navigation/AppNavigator.jsx';
import { capitalizeWords } from './src/utils/textUtils.js';
import { fetchLocalPlayers, saveLocalPlayer } from './src/services/localPlayerService.js';
import { syncPlayersToPhotoRegistry } from './src/services/playerPhotoStore.js';
import { CricGlobalToast } from './src/components/CricGlobalToast.jsx';
import { showToast } from './src/services/toastService.js';
import { AppSplashScreen } from './src/components/common/AppSplashScreen.jsx';
import { useFonts } from 'expo-font';
import { syncMatchToSupabase, fetchFinishedMatchesFromSupabase, fetchPlayersFromSupabase, fetchLiveMatchFromSupabase, fetchLiveMatchesFromSupabase, subscribeToSupabaseLiveMatches, fetchMatchByAccessCode } from './src/services/matchService.js';
import { getCurrentUser } from './src/services/authService.js';
import { generateUUID } from './src/services/supabaseClient.js';
import { AppButton } from './src/components/common/AppButton.jsx';
import { systemFont, systemFontMedium, systemFontBold, typeScale, fontWeights, publicType, theme } from './src/theme.js';

Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.style = [{ fontFamily: systemFont }, Text.defaultProps.style];
TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.style = [{ fontFamily: systemFont }, TextInput.defaultProps.style];

const nameFitProps = {
  numberOfLines: 1,
  ellipsizeMode: 'tail',
  adjustsFontSizeToFit: true,
  minimumFontScale: 0.82
};

import {
  DEFAULT_UMPIRE_NAME,
  speakBall,
  speakScoreToken,
  formatScoreTokenForPublic,
  makeLastDelivery,
  FINISHED_MATCHES_DB,
  computeLeaderboardRankings,
  MATCH_SYNC_URL,
  STORAGE_KEY,
  MAX_MATCH_OVERS,
  isWicketToken,
  getTokenBowlerRuns,
  sumDeliveryTokens,
  countWicketTokens,
  countLegalTokens,
  getCurrentOverNumber,
  renderBallTimeline,
  renderCompactOverTimeline,
  getDisplayOverHistory,
  sanitizeMatchForStorage,
  normalizeOversInput,
  getTossWinnerName,
  getTossDecisionText,
  getSearchBlob,
  getCleanPlayerNames,
  makeTeamCode,
  getTeamShortCode,
  hasDuplicateNames,
  makeInning,
  formatOvers,
  makeBowlingFigure,
  normalizeBowlingFigure,
  getInningBowlingRows,
  getBowlerFigureFromInning,
  formatOrdinal,
  formatMatchDateTime,
  buildFinishedMatch,
  getScorePartsFromText,
  getFinishedResultCardText,
  buildFinishedLiveSnapshot
} from './src/utils/cricketUtils.js';


const PUBLIC_LIVE_TABS = [
  { id: 'info', label: 'Info' },
  { id: 'live', label: 'Live' },
  { id: 'scorecard', label: 'Scorecard' },
  { id: 'overs', label: 'Overs' },
  { id: 'graphs', label: 'Graphs' }
];

const FINISHED_MATCH_TABS = [
  { id: 'info', label: 'Info' },
  { id: 'summary', label: 'Summary' },
  { id: 'scorecard', label: 'Scorecard' },
  { id: 'overs', label: 'Overs' },
  { id: 'graphs', label: 'Graphs' }
];

const InningTeamTab = ({ name, selected, statusText, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.82}
    style={{
      flex: 1,
      minHeight: 48,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: selected ? '#2F80C8' : '#FFFFFF',
      borderWidth: 1,
      borderColor: selected ? '#2F80C8' : '#D9DEE3'
    }}
  >
    <Text
      selectable
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.72}
      style={{
        color: selected ? '#FFFFFF' : '#0F172A',
        fontSize: typeScale.name,
        fontWeight: fontWeights.bold,
        textAlign: 'center',
        fontFamily: systemFont
      }}
    >
      {name}
    </Text>
    {statusText ? (
      <Text
        numberOfLines={1}
        style={{
          color: selected ? '#D6EEFF' : '#64748B',
          fontSize: 10,
          fontWeight: fontWeights.semibold,
          marginTop: 2,
          fontFamily: systemFont
        }}
      >
        {statusText}
      </Text>
    ) : null}
  </TouchableOpacity>
);

const getTeamLogoSource = (team, fallbackIndex = 0) => {
  if (team?.logoUri) return { uri: team.logoUri };
  return require('./assets/logo.png');
};

const getPlayerPreview = (name) => {
  const cleanName = String(name || '').trim();
  const profile = MASTER_PLAYERS_DB.find(player => player?.name?.toLowerCase() === cleanName.toLowerCase());
  return {
    name: cleanName,
    avatar: profile?.avatar || null,
    avg: profile?.avg != null ? Number(profile.avg).toFixed(2) : '-',
    sr: profile?.sr != null ? Number(profile.sr).toFixed(2) : '-'
  };
};

const getUnplayedBatters = (roster = [], recordedBatters = []) => {
  const recordedNames = new Set(
    (recordedBatters || [])
      .map(player => String(player?.name || player || '').trim().toLowerCase())
      .filter(Boolean)
  );
  return getCleanPlayerNames(roster)
    .filter(name => !recordedNames.has(name.toLowerCase()))
    .map(getPlayerPreview);
};






const WICKET_TYPES = [
  { id: 'bowled', label: 'Bowled', icon: 'radio-button-on' },
  { id: 'caught', label: 'Caught', icon: 'hand-left-outline' },
  { id: 'lbw', label: 'LBW', icon: 'body-outline' },
  { id: 'runOut', label: 'Run Out', icon: 'swap-horizontal-outline' },
  { id: 'stumped', label: 'Stumped', icon: 'flash-outline' },
  { id: 'hitWicket', label: 'Hit Wicket', icon: 'alert-circle-outline' }
];

// â”€â”€â”€ APP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    'SFProDisplay-Regular': require('./assets/fonts/SFProDisplay-Regular.otf'),
    'SFProDisplay-Medium': require('./assets/fonts/SFProDisplay-Medium.otf'),
    'SFProDisplay-Bold': require('./assets/fonts/SFProDisplay-Bold.otf')
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => { });
    }
  }, [fontsLoaded]);

  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const [team1Roster, setTeam1Roster] = useState([]);
  const [team2Roster, setTeam2Roster] = useState([]);
  const [playerPool, setPlayerPool] = useState([]);
  const [localPlayersList, setLocalPlayersList] = useState([]);
  const [selectedPlayerName, setSelectedPlayerName] = useState(null);

  // Mid-Match Squad Edit & Player Creation States
  const [isEditSquadModalOpen, setIsEditSquadModalOpen] = useState(false);
  const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false);
  const [newPlayerRoleInput, setNewPlayerRoleInput] = useState('All-Rounder');
  const [newPlayerPhoneInput, setNewPlayerPhoneInput] = useState('');
  const [selectedLocalImageUri, setSelectedLocalImageUri] = useState(null);
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);

  const allMidMatchPlayersPool = [...new Set([
    ...(localPlayersList || []).map(p => p.name),
    ...MASTER_PLAYERS_DB.map(p => p.name),
    ...(team1Roster || []),
    ...(team2Roster || [])
  ])].filter(Boolean);

  const handleMidMatchMoveToTeam = (playerName, targetTeam) => {
    if (!activeMatch) return;
    const t1Name = activeMatch?.teams?.[0]?.name || activeMatch?.innings?.[0]?.battingTeam?.name || 'Team 1';
    const t2Name = activeMatch?.teams?.[1]?.name || activeMatch?.innings?.[0]?.bowlingTeam?.name || 'Team 2';

    let currentT1 = [...(activeMatch.playingXI?.[t1Name] || team1Roster || [])];
    let currentT2 = [...(activeMatch.playingXI?.[t2Name] || team2Roster || [])];

    currentT1 = currentT1.filter(p => p !== playerName);
    currentT2 = currentT2.filter(p => p !== playerName);

    if (targetTeam === 'team1') {
      currentT1.push(playerName);
      showToast(`${playerName} added to ${t1Name}!`, 'success');
    } else if (targetTeam === 'team2') {
      currentT2.push(playerName);
      showToast(`${playerName} added to ${t2Name}!`, 'success');
    } else {
      showToast(`${playerName} removed from squad`, 'info');
    }

    setTeam1Roster(currentT1);
    setTeam2Roster(currentT2);

    const updatedMatch = {
      ...activeMatch,
      team1Roster: currentT1,
      team2Roster: currentT2,
      playingXI: {
        ...(activeMatch.playingXI || {}),
        [t1Name]: currentT1,
        [t2Name]: currentT2
      },
      teams: (activeMatch.teams || []).map((t, idx) => ({
        ...t,
        roster: idx === 0 ? currentT1 : currentT2
      }))
    };

    setActiveMatch(updatedMatch);
    syncMatchToSupabase(updatedMatch);
  };

  const handleMidMatchCreatePlayer = async (newPlayerName) => {
    if (!newPlayerName || !newPlayerName.trim()) {
      showToast('Please enter a valid player name', 'error');
      return;
    }
    const cleanName = capitalizeWords(newPlayerName.trim());
    setIsAddingPlayer(true);
    try {
      const playerObj = {
        id: generateUUID(),
        name: cleanName,
        role: newPlayerRoleInput || 'All-Rounder',
        phone: newPlayerPhoneInput?.trim() || '',
        photo_url: selectedLocalImageUri || ''
      };
      await saveLocalPlayer(playerObj);
      setLocalPlayersList(prev => [...(prev || []).filter(p => p.name !== cleanName), playerObj]);

      handleMidMatchMoveToTeam(cleanName, 'team1');

      setIsAddPlayerModalOpen(false);
      setNewPlayerPhoneInput('');
      setSelectedLocalImageUri(null);
      showToast(`${cleanName} registered & added to squad!`, 'success');
    } catch (err) {
      showToast('Could not save player', 'error');
    } finally {
      setIsAddingPlayer(false);
    }
  };

  useEffect(() => {
    const loadPlayers = () => {
      fetchLocalPlayers().then(players => {
        if (Array.isArray(players)) {
          setLocalPlayersList(players);
          syncPlayersToPhotoRegistry(players);
        }
      }).catch(() => { });
    };
    loadPlayers();
    const interval = setInterval(loadPlayers, 3000);
    return () => clearInterval(interval);
  }, []);

  // Navigation
  const [currentScreen, setCurrentScreen] = useState('home');
  const [bottomNavTab, setBottomNavTab] = useState('home'); // 'home' | 'matches' | 'rankings' | 'profile'
  const [matchesSubTab, setMatchesSubTab] = useState('home'); // 'home' | 'live' | 'finished' | 'playerStats'
  const [publicLiveTab, setPublicLiveTab] = useState('live');
  const [showTopTitleHeader, setShowTopTitleHeader] = useState(true); // 'live' | 'info' | 'scorecard' | 'overs' | 'graphs'
  const [publicTabLayouts, setPublicTabLayouts] = useState({});
  const [liveViewReturnScreen, setLiveViewReturnScreen] = useState('home');
  const [statsCategory, setStatsCategory] = useState('batters');
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [finishedArchive, setFinishedArchive] = useState(FINISHED_MATCHES_DB || []);
  const [storageReady, setStorageReady] = useState(false);
  const finishedMatches = Array.isArray(finishedArchive) ? finishedArchive : [];
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [pollVote, setPollVote] = useState(null);
  const [liveSyncState, setLiveSyncState] = useState('connected');

  const handlePullToRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const [liveDataList, finishedData] = await Promise.all([
        fetchLiveMatchesFromSupabase(),
        fetchFinishedMatchesFromSupabase()
      ]);
      if (Array.isArray(liveDataList)) {
        setLiveMatches(liveDataList);
        setActiveMatch(prev => {
          if (!prev) return liveDataList[0] || null;
          const found = liveDataList.find(m => (m.id && m.id === prev.id) || (m.supabaseId && m.supabaseId === prev.supabaseId));
          return found || prev;
        });
      }
      if (finishedData && Array.isArray(finishedData)) {
        setFinishedArchive(finishedData);
      }
    } catch (e) {
      console.log('Pull to refresh error:', e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const finishedSwipeRef = useRef(null);
  const publicPagerRef = useRef(null);
  const publicTabsRef = useRef(null);
  const publicPagerScrollX = useRef(new Animated.Value(
    PUBLIC_LIVE_TABS.findIndex(tab => tab.id === 'live') * screenWidth
  )).current;
  const playingXiPagerRef = useRef(null);
  const playingXiPagerScrollX = useRef(new Animated.Value(0)).current;

  // ── Match setup wizard ──
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedPlayerProfile, setSelectedPlayerProfile] = useState(null);

  const handleOpenPlayerProfile = (profile) => {
    setSelectedPlayerProfile(profile);
    setCurrentScreen('playerProfile');
  };

  const [team1Name, setTeam1Name] = useState('');
  const [team2Name, setTeam2Name] = useState('');
  const [scorerPin, setScorerPin] = useState('');
  const [totalOvers, setTotalOvers] = useState('');
  const [ballType, setBallType] = useState('tennis'); // 'tennis' | 'leather' | 'tape'
  const [pitchType, setPitchType] = useState('turf'); // 'turf' | 'matting' | 'cement' | 'dirt'
  const [umpireName, setUmpireName] = useState(DEFAULT_UMPIRE_NAME);
  const [venueName, setVenueName] = useState('');
  const [tossWinner, setTossWinner] = useState('');
  const [tossDecision, setTossDecision] = useState('BAT');

  const [savedTeamsList, setSavedTeamsList] = useState([]);

  // ── Active match (multi-inning) ──
  const [activeMatch, setActiveMatch] = useState(null);
  const [liveMatches, setLiveMatches] = useState([]);
  const [rematchSetup, setRematchSetup] = useState(null);
  // activeMatch shape:
  // { matchTitle, tossResult, maxOvers,
  //   inn1BattingTeam, inn1BowlingTeam,   â† inning 1 team names
  //   inning: 1|2,
  //   innings: [inningObj, inningObj?],   â† inning objects
  //   phase: 'playing'|'inningBreak'|'result',
  //   resultText: string,
  //   target: number|null  (for inning 2)
  // }

  // Inning break / opener selection state
  const [inn2Striker, setInn2Striker] = useState('');
  const [inn2NonStriker, setInn2NonStriker] = useState('');
  const [inn2Bowler, setInn2Bowler] = useState('');

  // Wicket modal
  const [wicketPending, setWicketPending] = useState(false);
  const [newBatsmanName, setNewBatsmanName] = useState('');
  const [wicketEntryPending, setWicketEntryPending] = useState(false);
  const [pendingFielderDismissal, setPendingFielderDismissal] = useState('');
  const [runOutPending, setRunOutPending] = useState(false);
  const [runOutDismissed, setRunOutDismissed] = useState('');
  const [runOutEnd, setRunOutEnd] = useState('');
  const [runOutRuns, setRunOutRuns] = useState(0);

  // Next bowler modal (after each over)
  const [bowlerChangePending, setBowlerChangePending] = useState(false);
  const [nextBowlerName, setNextBowlerName] = useState('');
  const [extrasSheetVisible, setExtrasSheetVisible] = useState(false);

  // Undo & Redo History Stack, Info Squad Dropdown, and Poll Vote
  const [matchHistoryStack, setMatchHistoryStack] = useState([]);
  const [matchRedoStack, setMatchRedoStack] = useState([]);
  const [isInfoSquadsExpanded, setIsInfoSquadsExpanded] = useState(true);
  const [playingXiVisible, setPlayingXiVisible] = useState(false);
  const [playingXiTeamTab, setPlayingXiTeamTab] = useState(1);
  const [playingXiTabLayouts, setPlayingXiTabLayouts] = useState({});
  const hasRemoteSyncRef = useRef(false);
  const publicAnnouncementFingerprintRef = useRef('');
  useEffect(() => {
    fetchPlayersFromSupabase().then(dbPlayers => {
      if (Array.isArray(dbPlayers) && dbPlayers.length > 0) {
        setPlayerPool(dbPlayers.map(p => p.name));
      }
    }).catch(() => { });

    fetchFinishedMatchesFromSupabase().then(dbMatches => {
      if (Array.isArray(dbMatches) && dbMatches.length > 0) {
        setFinishedArchive(prev => {
          const map = new Map();
          (prev || []).forEach(m => {
            if (m?.title || m?.id) map.set(m.id || m.title, m);
          });
          (dbMatches || []).filter(m => Boolean(m && (m.team1?.name || m.teams?.[0]?.name))).forEach(m => {
            const key = m.id || m.title;
            if (key) {
              const existing = map.get(key);
              if (!existing || (m.team1?.batting?.length || 0) > (existing.team1?.batting?.length || 0)) {
                map.set(key, m);
              }
            }
          });
          return Array.from(map.values());
        });
      }
    }).catch(() => { });
  }, []);

  // ── TRUE REAL-TIME WebSocket Subscription (zero delay via Supabase Realtime) ──
  useEffect(() => {
    const onLiveUpdate = (matchData, eventType, fullRow) => {
      if (!matchData || (!matchData.matchTitle && !matchData.title)) return;
      const matchId = matchData.id || matchData.supabaseId || fullRow?.id;
      const isFinished = matchData.phase === 'result' || matchData.phase === 'finished' || matchData.isCompleted;

      // 1. Update liveMatches array
      setLiveMatches(prev => {
        const list = Array.isArray(prev) ? [...prev] : [];
        const index = list.findIndex(m => (m.id && m.id === matchId) || (m.supabaseId && m.supabaseId === matchId));
        if (isFinished) {
          if (index !== -1) list.splice(index, 1);
          return list;
        }
        if (index !== -1) {
          list[index] = { ...list[index], ...matchData };
        } else {
          list.unshift(matchData);
        }
        return list;
      });

      // 2. If finished, sync finished matches archive
      if (isFinished) {
        fetchFinishedMatchesFromSupabase().then(dbMatches => {
          if (Array.isArray(dbMatches) && dbMatches.length > 0) {
            setFinishedArchive(dbMatches);
          }
        }).catch(() => { });
      }

      // 3. Update activeMatch if matching or if viewing
      if (currentScreen !== 'scorerWizard') {
        setActiveMatch(prev => {
          if (!prev) return matchData;
          if ((prev.id && prev.id === matchId) || (prev.supabaseId && prev.supabaseId === matchId)) {
            return { ...prev, ...matchData };
          }
          return prev;
        });
      }
    };

    // Subscribe via WebSocket (instant push — zero delay)
    const unsubscribe = subscribeToSupabaseLiveMatches(onLiveUpdate);

    // Initial fetch of all live matches on mount
    fetchLiveMatchesFromSupabase().then(liveList => {
      if (Array.isArray(liveList) && liveList.length > 0) {
        setLiveMatches(liveList);
        setActiveMatch(prev => prev || liveList[0]);
      }
    }).catch(() => { });

    return () => {
      unsubscribe();
    };
  }, [currentScreen]);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (!mounted || !raw) return;
        const saved = JSON.parse(raw);

        // Restore finished matches archive first
        if (Array.isArray(saved?.finishedMatches) && saved.finishedMatches.length > 0) {
          setFinishedArchive(saved.finishedMatches.filter(m => {
            if (!m || typeof m !== 'object') return false;
            const t1 = m.team1?.name || m.teams?.[0]?.name;
            const t2 = m.team2?.name || m.teams?.[1]?.name;
            // Accept any match with real team names (not placeholders)
            const isPlaceholder = (n) => !n || n === 'Team 1' || n === 'Team 2' || n === 'Team A' || n === 'Team B';
            return !isPlaceholder(t1) && !isPlaceholder(t2);
          }));
        }

        if (saved?.selectedMatch?.id) {
          setSelectedMatch(saved.selectedMatch);
        }

        // Restore activeMatch — but if it's already completed (phase='result'),
        // convert to finishedMatch and clear activeMatch so home shows it in Finished tab
        if (saved?.activeMatch?.matchTitle && Array.isArray(saved.activeMatch.innings)) {
          const restoredMatch = saved.activeMatch;

          if (restoredMatch.phase === 'result' || restoredMatch.resultText) {
            // Completed match: add to finished archive, don't restore as activeMatch
            const finishedSnapshot = buildFinishedMatch(restoredMatch);
            if (finishedSnapshot && (finishedSnapshot.title || finishedSnapshot.id)) {
              setFinishedArchive(prev => {
                const list = Array.isArray(prev) ? prev : [];
                const exists = list.some(m => m.id === finishedSnapshot.id || m.title === finishedSnapshot.title);
                if (exists) return list;
                return [finishedSnapshot, ...list];
              });
              setSelectedMatch(prev => prev || finishedSnapshot);
            }
            // Don't set activeMatch — it's done, let it live in finishedArchive
          } else {
            // Ongoing match: restore as activeMatch so scorer can resume
            setActiveMatch(restoredMatch);
          }
        }
      })
      .catch(() => { })
      .finally(() => {
        if (mounted) setStorageReady(true);
      });
    return () => { mounted = false; };
  }, []);

  // Hardware Back Button Handler for Android
  useEffect(() => {
    const onBackPress = () => {
      if (playingXiVisible) {
        setPlayingXiVisible(false);
        return true;
      }
      if (isEditSquadModalOpen) {
        setIsEditSquadModalOpen(false);
        return true;
      }
      if (extrasSheetVisible) {
        setExtrasSheetVisible(false);
        return true;
      }
      if (wicketPending || bowlerChangePending) {
        return true;
      }

      if (currentScreen === 'liveView') {
        setCurrentScreen(liveViewReturnScreen || 'home');
        return true;
      }
      if (currentScreen === 'finishedView') {
        setCurrentScreen('home');
        return true;
      }
      if (currentScreen === 'scorerWizard') {
        if (wizardStep > 1) {
          setWizardStep(prev => prev - 1);
        } else {
          setCurrentScreen('home');
        }
        return true;
      }
      if (currentScreen === 'tournament' || currentScreen === 'about' || currentScreen === 'auth' || currentScreen === 'playerProfile') {
        setCurrentScreen('home');
        return true;
      }

      if (bottomNavTab !== 'home') {
        setBottomNavTab('home');
        return true;
      }

      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [
    currentScreen,
    bottomNavTab,
    wizardStep,
    playingXiVisible,
    isEditSquadModalOpen,
    extrasSheetVisible,
    wicketPending,
    bowlerChangePending,
    liveViewReturnScreen
  ]);

  useEffect(() => {
    if (!storageReady) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 1,
      savedAt: new Date().toISOString(),
      activeMatch: sanitizeMatchForStorage(activeMatch),
      finishedMatches: finishedArchive,
      selectedMatch
    })).catch(() => { });

    // Debounced Supabase sync — waits 1.5s after last change to avoid spamming DB on rapid ball entries
    if (isScorerUnlocked && currentScreen === 'scorerWizard' && activeMatch?.matchTitle) {
      const syncTimer = setTimeout(() => {
        syncMatchToSupabase(activeMatch).catch(() => { });
      }, 1500);
      return () => clearTimeout(syncTimer);
    }
  }, [activeMatch, finishedArchive, selectedMatch, storageReady]);

  // AUTOMATIC FINISHED MATCH PERSISTENCE TO ARCHIVE & SUPABASE DATABASE
  useEffect(() => {
    if (activeMatch && (activeMatch.phase === 'result' || activeMatch.resultText)) {
      const finishedSnapshot = buildFinishedMatch(activeMatch);
      if (finishedSnapshot && (finishedSnapshot.title || finishedSnapshot.id)) {
        setFinishedArchive(prev => {
          const list = Array.isArray(prev) ? prev : [];
          const exists = list.some(m => m.id === finishedSnapshot.id);
          if (exists) {
            return list.map(m => m.id === finishedSnapshot.id ? finishedSnapshot : m);
          }
          return [finishedSnapshot, ...list];
        });
        syncMatchToSupabase({
          ...activeMatch,
          phase: 'result',
          winnerTeamName: finishedSnapshot.winnerTeamName,
          resultText: finishedSnapshot.winner
        }).catch(() => { });
      }
    }
  }, [activeMatch?.phase, activeMatch?.resultText]);

  // ── Derived ─────────────────────────────────────────────────────────────────

  const curInning = (activeMatch && Array.isArray(activeMatch.innings))
    ? (activeMatch.innings[Math.max(0, (activeMatch.inning || 1) - 1)] || activeMatch.innings[0] || null)
    : null;
  const activeTossWinnerName = getTossWinnerName(activeMatch) || tossWinner || team1Name || 'Team 1';
  const activeTossDecisionText = getTossDecisionText(activeMatch, tossDecision || 'BAT');

  const getMatchRosterMap = (match = activeMatch) => ({
    ...(match?.playingXI || {}),
    [team1Name || 'Team 1']: team1Roster,
    [team2Name || 'Team 2']: team2Roster
  });

  const getRosterForTeam = (teamName, fallbackRoster = []) => {
    if (!teamName) return fallbackRoster;
    const clean = String(teamName).trim().toLowerCase();
    if (activeMatch?.playingXI) {
      for (const key of Object.keys(activeMatch.playingXI)) {
        if (key.trim().toLowerCase() === clean && Array.isArray(activeMatch.playingXI[key]) && activeMatch.playingXI[key].length > 0) {
          return activeMatch.playingXI[key];
        }
      }
    }
    if (activeMatch?.teams?.[0]?.name?.trim()?.toLowerCase() === clean) return team1Roster?.length ? team1Roster : fallbackRoster;
    if (activeMatch?.teams?.[1]?.name?.trim()?.toLowerCase() === clean) return team2Roster?.length ? team2Roster : fallbackRoster;
    if (team1Name?.trim()?.toLowerCase() === clean) return team1Roster?.length ? team1Roster : fallbackRoster;
    if (team2Name?.trim()?.toLowerCase() === clean) return team2Roster?.length ? team2Roster : fallbackRoster;
    return fallbackRoster;
  };

  // Which roster bats / bowls right now
  const getBattingRoster = () => {
    if (!activeMatch) return team1Roster;
    return getRosterForTeam(curInning?.battingTeam?.name, team1Roster);
  };
  const getBowlingRoster = () => {
    if (!activeMatch) return team2Roster;
    return getRosterForTeam(curInning?.bowlingTeam?.name, team2Roster);
  };

  // Only return players who are NOT currently batting and NOT out yet
  const getAvailableBatsmen = () => {
    const roster = getBattingRoster();
    if (!curInning) return roster;
    const activeOnPitch = [curInning.striker?.name, curInning.nonStriker?.name].filter(Boolean);
    const dismissed = curInning.dismissedPlayers || [];
    return roster.filter(name => !activeOnPitch.includes(name) && !dismissed.includes(name));
  };

  // Return bowlers excluding the current bowler (can't bowl consecutive overs)
  const getAvailableBowlers = () => {
    const roster = getBowlingRoster();
    if (!curInning) return roster;
    return roster.filter(name => name !== curInning.bowler?.name);
  };

  // ⚡ 1. Scorer Broadcast: Auto-sync activeMatch to Supabase on match creation & ball updates
  useEffect(() => {
    if (activeMatch && currentScreen === 'scorerWizard') {
      syncMatchToSupabase(activeMatch);
    }
  }, [activeMatch, currentScreen]);

  // ⚡ 2. Viewer Realtime Sync: Auto-receive live match updates without manual refresh (< 300ms)
  useEffect(() => {
    if (currentScreen === 'scorerWizard') return undefined;

    const unsubscribe = subscribeToSupabaseLiveMatches((remoteMatch) => {
      if (remoteMatch && remoteMatch.matchTitle) {
        setLiveSyncState('connected');
        setActiveMatch(remoteMatch);
      }
    });

    // Initial fetch on mount / screen change only
    fetchLiveMatchFromSupabase().then(liveData => {
      if (liveData && liveData.matchTitle) {
        setLiveSyncState('connected');
        setActiveMatch(liveData);
      }
    }).catch(() => { });

    return () => {
      unsubscribe();
    };
  }, [currentScreen]);

  useEffect(() => {
    if (!MATCH_SYNC_URL || currentScreen !== 'scorerWizard' || !activeMatch?.playingXI) return;
    fetch(MATCH_SYNC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activeMatch)
    }).catch(() => { });
  }, [activeMatch, currentScreen]);

  useEffect(() => {
    if (activeMatch?.phase === 'result') {
      const finishedMatch = buildFinishedMatch(activeMatch, getMatchRosterMap(activeMatch));
      setSelectedMatch(current => current?.id === finishedMatch.id ? current : finishedMatch);
      setFinishedArchive(current => {
        const existingIndex = current.findIndex(match => match.id === finishedMatch.id);
        if (existingIndex >= 0) {
          const next = [...current];
          next[existingIndex] = finishedMatch;
          return next;
        }
        return [finishedMatch, ...current];
      });
    }
  }, [activeMatch]);

  useEffect(() => {
    if (currentScreen !== 'liveView') {
      publicAnnouncementFingerprintRef.current = '';
      return;
    }
    if (!activeMatch) return;
    const liveInning = activeMatch.innings?.[activeMatch.inning - 1];
    if (!liveInning) return;
    const currentBalls = liveInning.currentOverBalls || [];
    const completedOvers = liveInning.overHistory || [];
    const latestCompletedOver = completedOvers[completedOvers.length - 1];
    const latestToken = currentBalls[currentBalls.length - 1] || latestCompletedOver?.balls?.[latestCompletedOver.balls.length - 1] || '';
    const fingerprint = [
      activeMatch.startedAt,
      activeMatch.inning,
      liveInning.totalLegalBalls,
      liveInning.battingTeam.runs,
      liveInning.battingTeam.wickets,
      currentBalls.length,
      liveInning.lastEvent?.label || ''
    ].join(':');

    if (!publicAnnouncementFingerprintRef.current) {
      publicAnnouncementFingerprintRef.current = fingerprint;
      return;
    }
    if (fingerprint === publicAnnouncementFingerprintRef.current) return;
    publicAnnouncementFingerprintRef.current = fingerprint;
    try { speakScoreToken(latestToken); } catch (error) { }
  }, [activeMatch, currentScreen]);

  const handleRematch = (matchToRematch) => {
    const target = matchToRematch || (activeMatch && (activeMatch.phase === 'result' || activeMatch.resultText) ? buildFinishedMatch(activeMatch) : null) || selectedMatch || finishedMatches[0];
    if (!target) return;

    // Archive current completed match snapshot safely
    const finishedSnapshot = target.sourceMatch ? target : buildFinishedMatch(target, {
      [team1Name]: team1Roster,
      [team2Name]: team2Roster
    });
    if (finishedSnapshot && (finishedSnapshot.title || finishedSnapshot.id)) {
      setFinishedArchive(prev => {
        const list = Array.isArray(prev) ? prev : [];
        if (list.some(m => m.id === finishedSnapshot.id)) return list;
        return [finishedSnapshot, ...list];
      });
      syncMatchToSupabase({
        ...(target.sourceMatch || target),
        phase: 'result',
        winnerTeamName: finishedSnapshot.winnerTeamName,
        resultText: finishedSnapshot.winner
      }).catch(() => { });
    }

    const t1 = target.team1?.name || target.teams?.[0]?.name || team1Name || 'CricScorer Eleven';
    const t2 = target.team2?.name || target.teams?.[1]?.name || team2Name || 'CricScorer Strikers';
    const r1 = target.sourceMatch?.playingXI?.[t1] || target.playingXI?.[t1] || (target.team1?.batting || []).map(p => p.name).filter(Boolean) || team1Roster;
    const r2 = target.sourceMatch?.playingXI?.[t2] || target.playingXI?.[t2] || (target.team2?.batting || []).map(p => p.name).filter(Boolean) || team2Roster;

    setRematchSetup({
      team1Name: t1,
      team2Name: t2,
      team1Roster: Array.isArray(r1) && r1.length > 0 ? r1 : team1Roster,
      team2Roster: Array.isArray(r2) && r2.length > 0 ? r2 : team2Roster,
      totalOvers: target.maxOvers || 5,
      venueName: target.venue && target.venue !== 'Venue not added' ? target.venue : '',
      scorerPin: '',
      isRematch: true
    });

    setActiveMatch(null);
    setSelectedMatch(null);
    setIsScorerUnlocked(true);
    setCurrentScreen('scorerWizard');
  };


  // â”€â”€ HANDLERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const [isScorerUnlocked, setIsScorerUnlocked] = useState(false);
  const [scorerPinModalVisible, setScorerPinModalVisible] = useState(false);
  const [matchCompleteModalVisible, setMatchCompleteModalVisible] = useState(false);

  useEffect(() => {
    if (activeMatch && (activeMatch.phase === 'result' || activeMatch.resultText) && currentScreen === 'scorerWizard') {
      setMatchCompleteModalVisible(true);
    }
  }, [activeMatch?.phase, activeMatch?.resultText, currentScreen]);

  const openScorerScreen = async () => {
    const user = await getCurrentUser();
    if (!user) {
      showToast('Please login from Profile to start a ground match', 'error', '🔒 Login Required');
      setBottomNavTab('profile');
      setCurrentScreen('home');
      return;
    }

    setIsScorerUnlocked(true);
    setScorerPinModalVisible(false);
    if (activeMatch && (activeMatch.phase === 'playing' || activeMatch.phase === 'inningBreak')) {
      setCurrentScreen('scorerWizard');
    } else {
      handleStartNewMatchSetup();
    }
  };

  const handleScorerPinSuccess = () => {
    setIsScorerUnlocked(true);
    setScorerPinModalVisible(false);
    setCurrentScreen('scorerWizard');
  };

  const handleStartNewMatchSetup = () => {
    if (activeMatch && (activeMatch.innings?.[0]?.totalLegalBalls || 0) > 0) {
      const finishedSnapshot = buildFinishedMatch(activeMatch);
      if (finishedSnapshot) {
        setFinishedArchive(prev => [finishedSnapshot, ...(prev || [])]);
      }
    }
    setActiveMatch(null);
    setTeam1Roster([]);
    setTeam2Roster([]);
    setPlayerPool([]);
    setStep3Striker('');
    setStep3NonStriker('');
    setStep3Bowler('');
    setScorerPin('');
    setTotalOvers('5');
    setBallType('tennis');
    setPitchType('turf');
    setWizardStep(1);
    setIsScorerUnlocked(true);
    setScorerPinModalVisible(false);
    setCurrentScreen('scorerWizard');
  };

  // Step 3: Start Inning 1
  const [step3Striker, setStep3Striker] = useState('');
  const [step3NonStriker, setStep3NonStriker] = useState('');
  const [step3Bowler, setStep3Bowler] = useState('');


  const handleStartQuickMatch = (config) => {
    const {
      team1Name: t1,
      team2Name: t2,
      team1LogoKey: lk1,
      team2LogoKey: lk2,
      team1Roster: r1,
      team2Roster: r2,
      ballType: bType,
      totalOvers: oversNum,
      pitchType: pType,
      umpireName: uName,
      venueName: vName,
      tossWinner: winner,
      tossDecision: decision,
      striker,
      nonStriker,
      bowler
    } = config;

    setTeam1Name(t1);
    setTeam2Name(t2);
    setTeam1Roster(r1);
    setTeam2Roster(r2);
    setBallType(bType || 'tennis');
    setTotalOvers(String(oversNum));
    setPitchType(pType);
    setUmpireName(uName);
    setVenueName(vName);
    setTossWinner(winner);
    setTossDecision(decision);
    setStep3Striker(striker);
    setStep3NonStriker(nonStriker);
    setStep3Bowler(bowler);

    let bat1 = t1, bowl1 = t2;
    const team1Logo = lk1 || t1.toLowerCase();
    const team2Logo = lk2 || t2.toLowerCase();
    const inn1BatLogo = bat1 === t1 ? team1Logo : team2Logo;
    const inn1BowlLogo = bowl1 === t1 ? team1Logo : team2Logo;

    const inn1 = makeInning(bat1, bowl1);
    inn1.battingTeam.logoKey = inn1BatLogo;
    inn1.bowlingTeam.logoKey = inn1BowlLogo;
    inn1.striker = { name: striker, runs: 0, balls: 0, fours: 0, sixes: 0, dismissal: 'Not out', isOut: false };
    inn1.nonStriker = { name: nonStriker || '', runs: 0, balls: 0, fours: 0, sixes: 0, dismissal: 'Not out', isOut: false };
    inn1.row1Name = striker;
    inn1.bowler = { name: bowler, runs: 0, wickets: 0, overs: '0.0' };
    inn1.bowlingStats = { [bowler]: makeBowlingFigure({ name: bowler }) };
    inn1.battingStats = {
      [striker]: { name: striker, runs: 0, balls: 0, fours: 0, sixes: 0, dismissal: 'Not out', isOut: false },
      ...(nonStriker ? { [nonStriker]: { name: nonStriker, runs: 0, balls: 0, fours: 0, sixes: 0, dismissal: 'Not out', isOut: false } } : {})
    };

    const matchUUID = generateUUID();
    const autoMatchCode = 'CF-' + Math.floor(1000 + Math.random() * 9000).toString();
    const newMatch = {
      id: matchUUID,
      supabaseId: matchUUID,
      matchCode: autoMatchCode,
      matchTitle: `${t1} vs ${t2}`,
      maxOvers: oversNum,
      venue: vName || 'Local Ground',
      ballType: bType || 'tennis',
      pitchType: pType || 'turf',
      phase: 'playing',
      inning: 1,
      currentInningIndex: 0,
      startedAt: new Date().toISOString(),
      tossWinner: winner,
      tossDecision: decision,
      tossResult: `${winner} won the toss and elected to ${decision}`,
      tossChoice: decision,
      umpireName: uName || DEFAULT_UMPIRE_NAME,
      scorerPin: config.scorerPin || autoMatchCode,
      team1: { name: t1, code: makeTeamCode(t1), logoKey: team1Logo },
      team2: { name: t2, code: makeTeamCode(t2), logoKey: team2Logo },
      teams: [
        { name: t1, code: makeTeamCode(t1), logoKey: team1Logo },
        { name: t2, code: makeTeamCode(t2), logoKey: team2Logo }
      ],
      playingXI: {
        [t1]: r1,
        [t2]: r2
      },
      innings: [inn1]
    };

    setActiveMatch(newMatch);
    setLiveMatches(prev => {
      const filtered = (prev || []).filter(m => (m.id !== newMatch.id && m.supabaseId !== newMatch.id));
      return [newMatch, ...filtered];
    });
    syncMatchToSupabase(newMatch).catch(() => { });
    setIsScorerUnlocked(true);
    setCurrentScreen('scorerWizard');
  };

  const handleJoinMatchByCode = async (code) => {
    try {
      const found = await fetchMatchByAccessCode(code);
      if (found) {
        setActiveMatch(found);
        setIsScorerUnlocked(true);
        setCurrentScreen('scorerWizard');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };


  // Inning end check
  const checkInningEnd = (inn, maxOv, maxWk) => {
    const oversUp = inn.totalLegalBalls >= maxOv * 6;
    const allOut = inn.battingTeam.wickets >= maxWk;
    return oversUp || allOut;
  };

  // Record a ball (Supports Runs, Wides, No-Balls, Wickets, Byes, Leg Byes, Penalty)
  const handleRecordBall = (runs, extraType = null, isWicket = false, byeType = null, wicketDetails = null) => {
    if (!activeMatch || activeMatch.phase !== 'playing') return;

    // ðŸ’¾ Push snapshot to history stack for UNDO & reset REDO
    const historySnapshot = JSON.parse(JSON.stringify(activeMatch));
    delete historySnapshot.pendingPublicEvent;
    setMatchHistoryStack(prevStack => [...prevStack.slice(-20), historySnapshot]);
    setMatchRedoStack([]);

    // ðŸ”Š Voice announcement
    try { speakBall(runs, extraType, isWicket); } catch (e) { }

    let overJustCompleted = false;
    let wicketFell = false;

    setActiveMatch(prev => {
      const innings = prev.innings.map(x => ({ ...x }));
      const inn = { ...innings[prev.inning - 1] };
      innings[prev.inning - 1] = inn;

      let addedRuns = runs;
      let ballLabel = String(runs);
      let isLegal = true;
      const isRunOut = isWicket && wicketDetails?.type === 'runOut';
      const bowlerName = inn.bowler?.name || 'Bowler';
      const dismissedEndKey = isRunOut && wicketDetails?.dismissed === 'nonStriker' ? 'nonStriker' : 'striker';
      const dismissedOriginal = inn[dismissedEndKey];
      const dismissedName = dismissedOriginal?.name;
      const dismissalText = wicketDetails?.dismissalText || (isRunOut
        ? `run out (${wicketDetails.end === 'striker' ? 'striker end' : 'non-striker end'})`
        : `b ${bowlerName}`);
      const bowlerGetsWicket = isWicket && wicketDetails?.bowlerCredited !== false;
      const partnershipPlayerNames = [inn.striker?.name, inn.nonStriker?.name].filter(Boolean);

      if (extraType === 'wd') { addedRuns += 1; ballLabel = runs > 0 ? `${runs}Wd` : 'Wd'; isLegal = false; }
      else if (extraType === 'nb') { addedRuns += 1; ballLabel = runs > 0 ? `${runs}Nb` : 'Nb'; isLegal = false; }
      else if (byeType === 'b') { ballLabel = `${runs || 1}B`; }
      else if (byeType === 'lb') { ballLabel = `${runs || 1}LB`; }
      else if (byeType === 'penalty') { addedRuns = 5; ballLabel = '5Pen'; isLegal = false; }
      if (isWicket) { ballLabel = isRunOut && runs > 0 ? `${runs}W` : 'W'; addedRuns = runs; }

      inn.lastDelivery = {
        ...makeLastDelivery({
          ballLabel,
          runs,
          addedRuns,
          extraType,
          byeType,
          isWicket
        }),
        detail: isWicket ? `${dismissedName || 'Batter'} - ${dismissalText}` : ''
      };

      // Team runs & wickets
      inn.battingTeam = { ...inn.battingTeam, runs: inn.battingTeam.runs + addedRuns };
      if (isWicket) {
        inn.battingTeam = { ...inn.battingTeam, wickets: inn.battingTeam.wickets + 1 };
        if (dismissedName && !(inn.dismissedPlayers || []).includes(dismissedName)) {
          inn.dismissedPlayers = [...(inn.dismissedPlayers || []), dismissedName];
        }
      }

      // Legal balls count â†’ overs
      const newLegalBalls = inn.totalLegalBalls + (isLegal ? 1 : 0);
      inn.totalLegalBalls = newLegalBalls;
      const ballsThisOver = newLegalBalls % 6;
      const overComplete = isLegal && ballsThisOver === 0 && newLegalBalls > 0;
      if (overComplete) overJustCompleted = true;

      // Bowler balls & runs (Byes, Leg Byes, Penalty do NOT count against bowler)
      const bowlerRunsScored = (byeType === 'b' || byeType === 'lb' || byeType === 'penalty') ? 0 : addedRuns;
      const previousBowlerFigure = normalizeBowlingFigure(
        (inn.bowlingStats || {})[bowlerName] || { ...inn.bowler, balls: inn.bowlerLegalBalls },
        bowlerName
      );
      const updatedBowlerFigure = makeBowlingFigure({
        name: bowlerName,
        balls: previousBowlerFigure.balls + (isLegal ? 1 : 0),
        runs: previousBowlerFigure.runs + bowlerRunsScored,
        wickets: previousBowlerFigure.wickets + (bowlerGetsWicket ? 1 : 0)
      });
      inn.bowlingStats = { ...(inn.bowlingStats || {}), [bowlerName]: updatedBowlerFigure };
      inn.bowlerLegalBalls = updatedBowlerFigure.balls;
      inn.bowler = {
        name: bowlerName,
        runs: updatedBowlerFigure.runs,
        wickets: updatedBowlerFigure.wickets,
        overs: updatedBowlerFigure.overs
      };

      // Striker stats: no-ball bat runs count to batter; byes/leg-byes do not.
      const batsmanRuns = extraType === 'nb' ? runs : (extraType || byeType) ? 0 : runs;
      const newStriker = {
        ...inn.striker,
        runs: inn.striker.runs + batsmanRuns,
        balls: inn.striker.balls + (isLegal ? 1 : 0),
        fours: inn.striker.fours + (runs === 4 && !extraType && !byeType ? 1 : 0),
        sixes: inn.striker.sixes + (runs === 6 && !extraType && !byeType ? 1 : 0),
      };
      const crossedFifty = inn.striker.runs < 50 && newStriker.runs >= 50;
      const updatedNonStriker = (inn.nonStriker && inn.nonStriker.name)
        ? { ...inn.nonStriker }
        : ((inn.allBatters || []).find(b => !b.isOut && b.name !== newStriker.name) || { name: 'Non-Striker', runs: 0, balls: 0 });
      const dismissedPlayer = dismissedEndKey === 'nonStriker' ? updatedNonStriker : newStriker;
      const nextPartnershipRuns = (inn.partnershipRuns || 0) + addedRuns;
      const nextPartnershipBalls = (inn.partnershipBalls || 0) + (isLegal ? 1 : 0);
      const nextPartnershipContributions = { ...(inn.partnershipContributions || {}) };

      partnershipPlayerNames.forEach(name => {
        nextPartnershipContributions[name] = {
          runs: nextPartnershipContributions[name]?.runs || 0,
          balls: nextPartnershipContributions[name]?.balls || 0
        };
      });
      if (newStriker?.name) {
        const strikerContribution = nextPartnershipContributions[newStriker.name] || { runs: 0, balls: 0 };
        nextPartnershipContributions[newStriker.name] = {
          runs: strikerContribution.runs + batsmanRuns,
          balls: strikerContribution.balls + (isLegal ? 1 : 0)
        };
      }

      if (isWicket) {
        inn.lastWicket = {
          name: dismissedPlayer?.name || 'Batter',
          runs: dismissedPlayer?.runs || 0,
          balls: dismissedPlayer?.balls || 0,
          teamScore: inn.battingTeam.runs,
          teamWickets: inn.battingTeam.wickets,
          over: formatOvers(newLegalBalls),
          dismissal: dismissalText
        };
        const firstPartner = partnershipPlayerNames[0] || dismissedPlayer?.name || '';
        const secondPartner = partnershipPlayerNames[1] || '';
        inn.partnershipHistory = [...(inn.partnershipHistory || []), {
          wicketNumber: inn.battingTeam.wickets,
          p1: firstPartner,
          r1: nextPartnershipContributions[firstPartner]?.runs || 0,
          b1: nextPartnershipContributions[firstPartner]?.balls || 0,
          p2: secondPartner,
          r2: nextPartnershipContributions[secondPartner]?.runs || 0,
          b2: nextPartnershipContributions[secondPartner]?.balls || 0,
          totalRuns: nextPartnershipRuns,
          totalBalls: nextPartnershipBalls,
          teamScore: inn.battingTeam.runs,
          over: formatOvers(newLegalBalls),
          dismissedName: dismissedPlayer?.name || '',
          status: 'out'
        }];
        inn.partnershipRuns = 0;
        inn.partnershipBalls = 0;
        inn.partnershipContributions = {};
      } else {
        inn.partnershipRuns = nextPartnershipRuns;
        inn.partnershipBalls = nextPartnershipBalls;
        inn.partnershipContributions = nextPartnershipContributions;
      }

      if (isWicket) inn.lastEvent = { type: 'wicket', label: 'Wicket' };
      else if (crossedFifty) inn.lastEvent = { type: 'fifty', label: 'Fifty' };
      else if (overComplete) inn.lastEvent = { type: 'over', label: 'Over' };
      else inn.lastEvent = null;

      const allBatters = (inn.allBatters?.length
        ? inn.allBatters
        : [inn.striker, inn.nonStriker].filter(player => player?.name)
      ).map(player => ({ ...player }));
      const strikerIndex = allBatters.findIndex(player => player.name === newStriker.name);
      const strikerRow = {
        ...newStriker,
        dismissal: isWicket && dismissedEndKey === 'striker' ? dismissalText : 'Not out',
        isOut: isWicket && dismissedEndKey === 'striker'
      };
      if (strikerIndex >= 0) allBatters[strikerIndex] = strikerRow;
      else allBatters.push(strikerRow);
      if (updatedNonStriker?.name) {
        const nonStrikerIndex = allBatters.findIndex(player => player.name === updatedNonStriker.name);
        const nonStrikerRow = {
          ...updatedNonStriker,
          dismissal: isWicket && dismissedEndKey === 'nonStriker' ? dismissalText : 'Not out',
          isOut: isWicket && dismissedEndKey === 'nonStriker'
        };
        if (nonStrikerIndex >= 0) allBatters[nonStrikerIndex] = nonStrikerRow;
        else allBatters.push(nonStrikerRow);
      }
      inn.allBatters = allBatters;

      if (isWicket) {
        let strikerEndPlayer = newStriker;
        let nonStrikerEndPlayer = updatedNonStriker;

        if (isRunOut) {
          const survivingPlayer = dismissedEndKey === 'striker' ? updatedNonStriker : newStriker;
          if (wicketDetails.end === 'striker') {
            strikerEndPlayer = dismissedPlayer;
            nonStrikerEndPlayer = survivingPlayer;
          } else {
            strikerEndPlayer = survivingPlayer;
            nonStrikerEndPlayer = dismissedPlayer;
          }
        }

        inn.striker = overComplete ? nonStrikerEndPlayer : strikerEndPlayer;
        inn.nonStriker = overComplete ? strikerEndPlayer : nonStrikerEndPlayer;
        inn.pendingBatterEnd = inn.striker?.name === dismissedName ? 'striker' : 'nonStriker';
      } else {
        const strikeRotationRuns = (byeType === 'b' || byeType === 'lb') ? (runs || 1) : runs;
        const oddRun = strikeRotationRuns % 2 === 1;
        const doSwap = (oddRun && !overComplete) || (!oddRun && overComplete);
        if (doSwap) {
          inn.striker = updatedNonStriker;
          inn.nonStriker = newStriker;
        } else {
          inn.striker = newStriker;
          inn.nonStriker = updatedNonStriker;
        }
      }

      // Save completed over to overHistory log & manage currentOverBalls timeline without premature clearing
      const prevWasOverComplete = inn.isOverComplete;
      const currentBallsBase = prevWasOverComplete ? [] : (inn.currentOverBalls || []);
      const currentOverBowlerWicketsBase = prevWasOverComplete ? 0 : (inn.currentOverBowlerWickets || 0);
      const newCurrentBalls = [...currentBallsBase, ballLabel];
      const newCurrentOverBowlerWickets = currentOverBowlerWicketsBase + (bowlerGetsWicket ? 1 : 0);

      if (overComplete) {
        const overRuns = sumDeliveryTokens(newCurrentBalls);
        const overBowlerRuns = sumDeliveryTokens(newCurrentBalls, getTokenBowlerRuns);
        const overLegalBalls = countLegalTokens(newCurrentBalls);
        const overWkts = countWicketTokens(newCurrentBalls);
        const overNum = Math.floor(newLegalBalls / 6);
        inn.overHistory = [...(inn.overHistory || []), {
          overNum,
          runs: overRuns,
          wickets: overWkts,
          legalBalls: overLegalBalls,
          bowlerRuns: overBowlerRuns,
          bowlerWickets: newCurrentOverBowlerWickets,
          bowlerName,
          balls: newCurrentBalls
        }];
        inn.currentOverBalls = newCurrentBalls; // KEEP COMPLETED OVER BALLS VISIBLE!
        inn.currentOverBowlerWickets = newCurrentOverBowlerWickets;
        inn.isOverComplete = true; // Mark over complete so next ball starts fresh!
      } else {
        inn.currentOverBalls = newCurrentBalls;
        inn.currentOverBowlerWickets = newCurrentOverBowlerWickets;
        inn.isOverComplete = false;
      }

      // Check inning end & chase result
      const roster = getRosterForTeam(inn.battingTeam.name, []);
      const totalSquadPlayers = roster.length > 0
        ? roster.length
        : (inn.allBatters?.length > 1 ? inn.allBatters.length : 11);
      const mw = Math.max(1, totalSquadPlayers - 1);
      const innEnded = checkInningEnd(inn, prev.maxOvers, mw);
      const inn1Runs = Number(innings[0]?.battingTeam?.runs || 0);
      const effectiveTarget = prev.target || (inn1Runs + 1);
      const chaseCompleted = prev.inning === 2 && inn.battingTeam.runs >= effectiveTarget;

      if (chaseCompleted) {
        inn.status = 'complete';
        const wicketsLeft = Math.max(1, mw - inn.battingTeam.wickets);
        const resultText = `${inn.battingTeam.name} won by ${wicketsLeft} wicket${wicketsLeft !== 1 ? 's' : ''}!`;
        try { Speech.speak('Match over! ' + resultText, { language: 'en-IN' }); } catch (e) { }
        return { ...prev, innings, phase: 'result', winnerTeamName: inn.battingTeam.name, resultText, pendingPublicEvent: null };
      }

      if (innEnded && prev.inning === 1) {
        inn.status = 'complete';
        try { Speech.speak('Over! End of inning 1!', { language: 'en-IN' }); } catch (e) { }
        return { ...prev, innings, phase: 'inningBreak', target: inn.battingTeam.runs + 1, pendingPublicEvent: null };
      } else if (innEnded && prev.inning === 2) {
        inn.status = 'complete';
        const inn2Runs = Number(inn.battingTeam.runs || 0);
        let resultText = '';
        let winnerTeamName = null;
        if (inn2Runs >= effectiveTarget) {
          const wicketsLeft = Math.max(1, mw - inn.battingTeam.wickets);
          resultText = `${inn.battingTeam.name} won by ${wicketsLeft} wicket${wicketsLeft !== 1 ? 's' : ''}!`;
          winnerTeamName = inn.battingTeam.name;
        } else if (inn2Runs === inn1Runs) {
          resultText = 'Match tied!';
          winnerTeamName = null;
        } else {
          const diff = Math.max(1, inn1Runs - inn2Runs);
          const defTeam = innings[0]?.battingTeam?.name || 'Defending Team';
          resultText = `${defTeam} won by ${diff} run${diff !== 1 ? 's' : ''}!`;
          winnerTeamName = defTeam;
        }
        try { Speech.speak('Match over! ' + resultText, { language: 'en-IN' }); } catch (e) { }
        return { ...prev, innings, phase: 'result', winnerTeamName, resultText, pendingPublicEvent: null };
      }

      // Wicket fell â€” need new batsman
      if (isWicket && !innEnded) {
        wicketFell = true;
        return { ...prev, innings, _pendingWicket: true, _pendingNewBowler: overComplete, pendingPublicEvent: null };
      }

      // Over complete but inning not over â€” need new bowler
      if (overComplete && !innEnded) {
        return { ...prev, innings, _pendingNewBowler: true, pendingPublicEvent: null };
      }

      return { ...prev, innings, pendingPublicEvent: null };
    });

    // Trigger wicket modal
    setTimeout(() => {
      setActiveMatch(prev => {
        if (!prev) return prev;
        if (prev._pendingWicket) {
          setWicketPending(true);
          return { ...prev, _pendingWicket: false };
        }
        if (prev._pendingNewBowler) {
          setNextBowlerName('');
          setBowlerChangePending(true);
          return { ...prev, _pendingNewBowler: false };
        }
        return prev;
      });
    }, 80);
  };

  const selectNewBatsman = (name) => {
    const cleanName = name.trim();
    if (!cleanName) return;
    const battingRoster = getBattingRoster();
    const bowlingRoster = getBowlingRoster();
    if (!battingRoster.includes(cleanName) && bowlingRoster.includes(cleanName)) {
      Alert.alert('New Batter', `${cleanName} belongs to the fielding team.`);
      return;
    }
    const needsNewBowler = Boolean(activeMatch?._pendingNewBowler);
    setActiveMatch(prev => {
      const innings = prev.innings.map(x => ({ ...x }));
      const inn = { ...innings[prev.inning - 1] };
      const playingXI = { ...(prev.playingXI || {}) };
      const battingTeamName = inn.battingTeam.name;
      if (!playingXI[battingTeamName]?.includes(cleanName)) {
        playingXI[battingTeamName] = [...(playingXI[battingTeamName] || []), cleanName];
      }
      const newBatter = { name: cleanName, runs: 0, balls: 0, fours: 0, sixes: 0 };
      const batterEnd = inn.pendingBatterEnd || 'striker';
      inn[batterEnd] = newBatter;
      inn.pendingBatterEnd = null;
      if (!(inn.allBatters || []).some(player => player.name === cleanName)) {
        inn.allBatters = [...(inn.allBatters || []), { ...newBatter, dismissal: 'Not out', isOut: false }];
      }
      innings[prev.inning - 1] = inn;
      return { ...prev, innings, playingXI, _pendingNewBowler: false };
    });
    try { Speech.speak(`${cleanName} is coming in to bat`, { language: 'en-IN' }); } catch (e) { }
    setNewBatsmanName('');
    setWicketPending(false);
    if (needsNewBowler) {
      setNextBowlerName('');
      setBowlerChangePending(true);
    }
  };

  const handleNewBatsman = () => {
    selectNewBatsman(newBatsmanName);
  };

  const handleWicketPress = () => {
    setPendingFielderDismissal('');
    setActiveMatch(prev => prev ? {
      ...prev,
      pendingPublicEvent: {
        token: 'W',
        label: 'WICKET',
        type: 'wicket',
        detail: ''
      }
    } : prev);
    setWicketEntryPending(true);
  };

  const cancelWicketEntry = () => {
    setPendingFielderDismissal('');
    setWicketEntryPending(false);
    setRunOutPending(false);
    setActiveMatch(prev => prev?.pendingPublicEvent?.type === 'wicket'
      ? { ...prev, pendingPublicEvent: null }
      : prev);
  };

  const handleSelectWicketType = (type) => {
    const bowlerName = curInning?.bowler?.name || 'Bowler';

    if (type === 'runOut') {
      setWicketEntryPending(false);
      setRunOutDismissed('');
      setRunOutEnd('');
      setRunOutRuns(0);
      setRunOutPending(true);
      return;
    }

    if (type === 'caught' || type === 'stumped') {
      setPendingFielderDismissal(type);
      return;
    }

    const dismissalText = {
      bowled: `b ${bowlerName}`,
      lbw: `lbw b ${bowlerName}`,
      hitWicket: `hit wicket b ${bowlerName}`
    }[type];

    setWicketEntryPending(false);
    handleRecordBall(0, null, true, null, {
      type,
      dismissed: 'striker',
      dismissalText,
      bowlerCredited: true
    });
  };

  const handleSelectDismissalFielder = (fielderName) => {
    const bowlerName = curInning?.bowler?.name || 'Bowler';
    const dismissalText = pendingFielderDismissal === 'caught'
      ? fielderName === bowlerName
        ? `c & b ${bowlerName}`
        : `c ${fielderName} b ${bowlerName}`
      : `st ${fielderName} b ${bowlerName}`;

    setWicketEntryPending(false);
    setPendingFielderDismissal('');
    handleRecordBall(0, null, true, null, {
      type: pendingFielderDismissal,
      dismissed: 'striker',
      dismissalText,
      bowlerCredited: true
    });
  };

  const handleConfirmRunOut = () => {
    if (!runOutDismissed || !runOutEnd) return;
    setRunOutPending(false);
    handleRecordBall(runOutRuns, null, true, null, {
      type: 'runOut',
      dismissed: runOutDismissed,
      end: runOutEnd,
      bowlerCredited: false
    });
  };

  const handleNewBowler = () => {
    const name = nextBowlerName.trim();
    if (!name) return;
    const bowlingRoster = getBowlingRoster();
    const battingRoster = getBattingRoster();
    if (!bowlingRoster.includes(name) && battingRoster.includes(name)) {
      Alert.alert('Change Bowler', `${name} belongs to the batting team.`);
      return;
    }
    const innBeforeChange = activeMatch?.innings?.[activeMatch.inning - 1];
    if ((innBeforeChange?.currentOverBalls || []).length > 0 && !innBeforeChange?.isOverComplete) {
      Alert.alert('Change Bowler', 'Normal bowler change is allowed only after the over is complete.');
      return;
    }
    setActiveMatch(prev => {
      const innings = prev.innings.map(x => ({ ...x }));
      const inn = { ...innings[prev.inning - 1] };
      if ((inn.currentOverBalls || []).length > 0 && !inn.isOverComplete) {
        Alert.alert('Change Bowler', 'Normal bowler change is allowed only after the over is complete.');
        return prev;
      }
      const playingXI = { ...(prev.playingXI || {}) };
      const bowlingTeamName = inn.bowlingTeam.name;
      if (!playingXI[bowlingTeamName]?.includes(name)) {
        playingXI[bowlingTeamName] = [...(playingXI[bowlingTeamName] || []), name];
      }

      const savedBowlerFigure = getBowlerFigureFromInning(inn, name);
      inn.bowlingStats = { ...(inn.bowlingStats || {}), [name]: savedBowlerFigure };
      inn.bowler = {
        name,
        runs: savedBowlerFigure.runs,
        wickets: savedBowlerFigure.wickets,
        overs: savedBowlerFigure.overs
      };
      inn.bowlerLegalBalls = savedBowlerFigure.balls;
      innings[prev.inning - 1] = inn;
      return { ...prev, innings, playingXI };
    });
    try { Speech.speak(`${name} will bowl the next over`, { language: 'en-IN' }); } catch (e) { }
    setNextBowlerName('');
    setBowlerChangePending(false);
  };

  const handleRetireBatsman = () => {
    const strikerName = curInning?.striker?.name;
    if (!activeMatch || !strikerName) return;
    setMatchHistoryStack(prevStack => [...prevStack.slice(-20), JSON.parse(JSON.stringify(activeMatch))]);
    setMatchRedoStack([]);
    setActiveMatch(prev => {
      const innings = prev.innings.map(x => ({ ...x }));
      const inn = { ...innings[prev.inning - 1] };
      const retiredPlayer = { ...inn.striker, dismissal: 'Retired hurt', isOut: true, retired: true };
      inn.dismissedPlayers = [...new Set([...(inn.dismissedPlayers || []), strikerName])];
      inn.allBatters = (inn.allBatters?.length ? inn.allBatters : [inn.striker, inn.nonStriker].filter(Boolean))
        .map(player => player.name === strikerName ? retiredPlayer : player);
      if (!inn.allBatters.some(player => player.name === strikerName)) inn.allBatters.push(retiredPlayer);
      inn.partnershipHistory = [...(inn.partnershipHistory || []), {
        wicketNumber: (inn.battingTeam.wickets || 0) + 1,
        p1: inn.striker?.name || '',
        r1: inn.partnershipContributions?.[inn.striker?.name]?.runs || 0,
        b1: inn.partnershipContributions?.[inn.striker?.name]?.balls || 0,
        p2: inn.nonStriker?.name || '',
        r2: inn.partnershipContributions?.[inn.nonStriker?.name]?.runs || 0,
        b2: inn.partnershipContributions?.[inn.nonStriker?.name]?.balls || 0,
        totalRuns: inn.partnershipRuns || 0,
        totalBalls: inn.partnershipBalls || 0,
        teamScore: inn.battingTeam.runs,
        over: formatOvers(inn.totalLegalBalls || 0),
        dismissedName: strikerName,
        status: 'retired'
      }];
      inn.partnershipRuns = 0;
      inn.partnershipBalls = 0;
      inn.partnershipContributions = {};
      inn.pendingBatterEnd = 'striker';
      innings[prev.inning - 1] = inn;
      return { ...prev, innings };
    });
    Speech.speak('Batsman retired. Select next batsman.', { language: 'en-IN' });
    setNewBatsmanName('');
    setWicketPending(true);
  };

  const handleSwapStrike = () => {
    const inn = activeMatch?.innings?.[activeMatch.inning - 1];
    const deliveryAlreadyRecorded = (inn?.totalLegalBalls || 0) > 0
      || (inn?.currentOverBalls || []).length > 0
      || (inn?.overHistory || []).length > 0;
    if (!inn?.striker?.name || !inn?.nonStriker?.name || activeMatch.phase !== 'playing' || deliveryAlreadyRecorded) return;

    Alert.alert(
      'Swap strike?',
      `${inn.nonStriker.name} will take strike. Score and ball data will stay unchanged.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Swap',
          onPress: () => {
            setMatchHistoryStack(prevStack => [...prevStack.slice(-20), JSON.parse(JSON.stringify(activeMatch))]);
            setMatchRedoStack([]);
            setActiveMatch(prev => {
              const innings = prev.innings.map(inning => ({ ...inning }));
              const currentInning = { ...innings[prev.inning - 1] };
              const previousStriker = currentInning.striker;
              currentInning.striker = currentInning.nonStriker;
              currentInning.nonStriker = previousStriker;
              innings[prev.inning - 1] = currentInning;
              return { ...prev, innings };
            });
          }
        }
      ]
    );
  };

  // âª Full Working UNDO Ball
  const handleUndo = () => {
    if (!matchHistoryStack || matchHistoryStack.length === 0) {
      Alert.alert('Undo Ball', 'No previous ball recorded to undo.');
      return;
    }
    const previousState = matchHistoryStack[matchHistoryStack.length - 1];
    setMatchHistoryStack(prev => prev.slice(0, -1));
    setMatchRedoStack(prev => [...prev, JSON.parse(JSON.stringify(activeMatch))]);
    setActiveMatch(previousState);
    try { Speech.speak('Last ball undone', { language: 'en-IN' }); } catch (e) { }
  };


  // â© Full Working REDO Ball
  const handleRedo = () => {
    if (!matchRedoStack || matchRedoStack.length === 0) {
      Alert.alert('Redo Ball', 'No action available to redo.');
      return;
    }
    const nextState = matchRedoStack[matchRedoStack.length - 1];
    setMatchRedoStack(prev => prev.slice(0, -1));
    setMatchHistoryStack(prev => [...prev, JSON.parse(JSON.stringify(activeMatch))]);
    setActiveMatch(nextState);
    try { Speech.speak('Last ball redone', { language: 'en-IN' }); } catch (e) { }
  };

  // Start Inning 2
  const handleSelectInning2Opener = (name) => {
    if (!name) return;
    if (name === inn2Striker) {
      setInn2Striker('');
      return;
    }
    if (name === inn2NonStriker) {
      setInn2NonStriker('');
      return;
    }
    if (!inn2Striker) {
      setInn2Striker(name);
      return;
    }
    if (!inn2NonStriker) {
      setInn2NonStriker(name);
      return;
    }
    setInn2NonStriker(name);
  };

  const handleStartInning2 = () => {
    if (!inn2Striker || !inn2NonStriker || !inn2Bowler) {
      Alert.alert('Second Innings', 'Select both openers and opening bowler.');
      return;
    }
    if (inn2Striker === inn2NonStriker) {
      Alert.alert('Second Innings', 'Opening batters must be different players.');
      return;
    }
    const firstInning = activeMatch?.innings?.[0];
    const secondBattingRoster = getRosterForTeam(firstInning?.bowlingTeam.name, []);
    const secondBowlingRoster = getRosterForTeam(firstInning?.battingTeam.name, []);
    if (!secondBattingRoster.includes(inn2Striker) || !secondBattingRoster.includes(inn2NonStriker) || !secondBowlingRoster.includes(inn2Bowler)) {
      Alert.alert('Second Innings', 'Selected players must belong to the correct teams.');
      return;
    }
    setActiveMatch(prev => {
      const inn1 = prev.innings[0];
      const team1Logo = prev.team1?.logoKey || prev.teams?.[0]?.logoKey || 'csk';
      const team2Logo = prev.team2?.logoKey || prev.teams?.[1]?.logoKey || 'rcb';
      const inn2BatLogo = inn1.bowlingTeam.name === prev.teams?.[0]?.name ? team1Logo : team2Logo;
      const inn2BowlLogo = inn1.battingTeam.name === prev.teams?.[0]?.name ? team1Logo : team2Logo;
      const inn2 = makeInning(inn1.bowlingTeam.name, inn1.battingTeam.name);
      inn2.battingTeam.logoKey = inn2BatLogo;
      inn2.bowlingTeam.logoKey = inn2BowlLogo;
      inn2.striker = { name: inn2Striker, runs: 0, balls: 0, fours: 0, sixes: 0 };
      inn2.nonStriker = { name: inn2NonStriker, runs: 0, balls: 0, fours: 0, sixes: 0 };
      inn2.bowler = { name: inn2Bowler, runs: 0, wickets: 0, overs: '0.0' };
      inn2.bowlingStats = { [inn2Bowler]: makeBowlingFigure({ name: inn2Bowler }) };
      inn2.allBatters = [inn2.striker, inn2.nonStriker].filter(player => player.name).map(player => ({ ...player, dismissal: 'Not out', isOut: false }));
      try { Speech.speak('Second innings started. Target is ' + (prev.target || (inn1.battingTeam.runs + 1)) + ' runs.', { language: 'en-IN' }); } catch (e) { }
      return { ...prev, innings: [inn1, inn2], inning: 2, phase: 'playing' };
    });
    setInn2Striker(''); setInn2NonStriker(''); setInn2Bowler('');
  };

  // â”€â”€ RENDER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  // PUBLIC LIVE VIEW â€” EXACT CREX SCORECARD LAYOUT MATCHING USER SCREENSHOT
  const [scorecardInningIndex, setScorecardInningIndex] = useState(0);
  const [expandedScorecardBatter, setExpandedScorecardBatter] = useState(null);
  const scorecardSecondInning = activeMatch?.innings?.[1];
  const scorecardSecondInningHasDelivery = Boolean(
    scorecardSecondInning
    && ((scorecardSecondInning.totalLegalBalls || 0) > 0
      || (scorecardSecondInning.currentOverBalls || []).length > 0
      || (scorecardSecondInning.overHistory || []).length > 0)
  );
  const scorecardIsInningsBreak = Boolean(
    activeMatch
    && (activeMatch.phase === 'inningBreak'
      || (activeMatch.phase === 'playing' && activeMatch.inning === 2 && !scorecardSecondInningHasDelivery))
  );

  useEffect(() => {
    if (!activeMatch || publicLiveTab !== 'scorecard') return;
    const currentInningIndex = activeMatch.inning === 2 || activeMatch.phase === 'inningBreak' ? 1 : 0;
    setScorecardInningIndex(current => current === currentInningIndex ? current : currentInningIndex);
    setExpandedScorecardBatter(null);
  }, [publicLiveTab, activeMatch?.inning, scorecardIsInningsBreak]);

  const renderLiveScoreBoard = ({ showMatchHeader = false, match = activeMatch, heroOnly = false, bodyOnly = false, tone = 'light' } = {}) => {
    const inn = match.innings[match.inning - 1];
    const isInn2 = match.inning === 2;
    const reqRuns = isInn2 && match.target
      ? Math.max(0, match.target - inn.battingTeam.runs)
      : null;
    const reqBalls = isInn2
      ? Math.max(0, (match.maxOvers * 6) - inn.totalLegalBalls)
      : null;
    const crr = inn.totalLegalBalls > 0
      ? ((inn.battingTeam.runs / inn.totalLegalBalls) * 6).toFixed(2)
      : '0.00';
    const currentOverBalls = inn.currentOverBalls || [];
    const thisOverRuns = sumDeliveryTokens(currentOverBalls);
    const currentOverNum = getCurrentOverNumber(inn);
    const partnershipRuns = typeof inn.partnershipRuns === 'number'
      ? inn.partnershipRuns
      : (inn.striker?.runs || 0) + (inn.nonStriker?.runs || 0);
    const partnershipBalls = typeof inn.partnershipBalls === 'number'
      ? inn.partnershipBalls
      : (inn.striker?.balls || 0) + (inn.nonStriker?.balls || 0);
    const partnershipRate = partnershipBalls > 0
      ? ((partnershipRuns / partnershipBalls) * 6).toFixed(2)
      : '0.00';
    const bowlerEco = inn.bowlerLegalBalls > 0
      ? ((inn.bowler.runs / inn.bowlerLegalBalls) * 6).toFixed(1)
      : '0.0';
    const totalInningsBalls = Math.max(0, (Number(match.maxOvers) || 0) * 6);
    const legalBallsForProjection = Math.min(inn.totalLegalBalls || 0, totalInningsBalls);
    const remainingProjectionBalls = Math.max(0, totalInningsBalls - legalBallsForProjection);
    const currentRateNumber = legalBallsForProjection > 0
      ? ((inn.battingTeam.runs || 0) / legalBallsForProjection) * 6
      : 0;
    const projectedBaseRate = currentRateNumber > 0 ? Math.max(1, Math.floor(currentRateNumber)) : 6;
    const projectedScenarioRates = [
      projectedBaseRate,
      projectedBaseRate + 1,
      projectedBaseRate + 2,
      projectedBaseRate + 3
    ].filter(rate => Math.abs(rate - currentRateNumber) >= 0.05).slice(0, 3);
    const calculateProjectedScore = (rate) => Math.round(
      (inn.battingTeam.runs || 0) + ((remainingProjectionBalls * rate) / 6)
    );
    const projectedScoreColumns = [
      {
        label: `${currentRateNumber.toFixed(2)}*`,
        value: calculateProjectedScore(currentRateNumber),
        active: true
      },
      ...projectedScenarioRates.map(rate => ({
        label: rate.toFixed(1),
        value: calculateProjectedScore(rate),
        active: false
      }))
    ];
    const tossWinnerName = getTossWinnerName(match) || '-';
    const tossDecisionText = getTossDecisionText(match, tossDecision || 'BAT');
    const tossDecisionIcon = tossDecisionText === 'BOWL' ? 'baseball' : 'cricket';
    const tossWinnerTeamMeta = match.teams?.find(team => team.name === tossWinnerName || team.code === tossWinnerName);
    const tossWinnerCode = tossWinnerName === '-' ? '-' : getTeamShortCode(tossWinnerTeamMeta, tossWinnerName);
    const matchStatusText = match.phase === 'result'
      ? match.resultText
      : match.phase === 'inningBreak'
        ? `${inn.battingTeam.name} finish on ${inn.battingTeam.runs}-${inn.battingTeam.wickets}`
        : isInn2
          ? `${reqRuns ?? 0} runs needed from ${reqBalls ?? 0} balls`
          : null;
    const battingTeamMeta = match.teams?.find(team => team.name === inn.battingTeam.name) || inn.battingTeam;
    const battingTeamCode = getTeamShortCode(battingTeamMeta, inn.battingTeam.name);
    const battingTeamLogoSource = getTeamLogoSource(battingTeamMeta);
    const latestCompletedOver = (inn.overHistory || [])[(inn.overHistory || []).length - 1];
    const latestBallToken = currentOverBalls[currentOverBalls.length - 1]
      || latestCompletedOver?.balls?.[latestCompletedOver.balls.length - 1]
      || '';
    const hasDeliveries = (inn.totalLegalBalls > 0) || (inn.currentOverBalls && inn.currentOverBalls.length > 0) || (inn.overHistory && inn.overHistory.length > 0) || !!inn.lastDelivery;
    const latestDelivery = (!hasDeliveries || match.phase === 'result')
      ? null
      : (match.pendingPublicEvent
        || (inn.lastEvent?.type === 'over' ? { token: '', label: 'Over', type: 'over' } : null)
        || inn.lastDelivery || (latestBallToken ? {
          token: latestBallToken,
          label: formatScoreTokenForPublic(latestBallToken),
          type: isWicketToken(latestBallToken) ? 'wicket' : 'runs'
        } : null));
    const isDarkHero = tone === 'dark' && !bodyOnly;
    const latestDeliveryColor = latestDelivery?.type === 'wicket'
      ? (isDarkHero ? '#FDA4AF' : '#BE123C')
      : (isDarkHero ? '#86EFAC' : '#15803D');
    const heroSurfaceColor = isDarkHero ? '#071B2C' : '#FFFFFF';
    const heroBorderColor = isDarkHero ? '#123A56' : '#CBD5E1';
    const heroTeamColor = isDarkHero ? '#7DD3FC' : '#0284C7';
    const heroScoreColor = isDarkHero ? '#FFFFFF' : '#0F172A';
    const heroSubtleColor = isDarkHero ? '#9FC4D7' : '#64748B';
    const heroMetaColor = isDarkHero ? '#E0F2FE' : '#0F172A';
    const heroMutedColor = isDarkHero ? '#7EAAC2' : '#94A3B8';
    const heroIconBg = isDarkHero ? '#0B2A42' : '#E0F2FE';
    const heroStatusColor = isDarkHero ? '#BAE6FD' : (match.phase === 'result' ? '#0284C7' : '#475569');
    const heroDividerColor = isDarkHero ? '#2B5C78' : '#E2E8F0';
    const outcomeBoxWidth = Math.min(120, Math.max(92, screenWidth * 0.27));
    const batterRows = [
      { player: inn.striker, isStriker: true },
      { player: inn.nonStriker, isStriker: false }
    ].filter(row => row.player?.name);

    return (
      <View style={{ backgroundColor: bodyOnly ? '#FFFFFF' : heroSurfaceColor }}>
        {!bodyOnly && showMatchHeader ? (
          <View style={{ paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: heroBorderColor, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="radio-outline" size={15} color={heroTeamColor} />
                <Text style={{ color: heroTeamColor, fontSize: typeScale.caption, fontWeight: fontWeights.bold, fontFamily: systemFont }}>LIVE PUBLIC VIEW</Text>
              </View>
              <Text selectable style={{ color: heroScoreColor, fontSize: typeScale.title, fontWeight: fontWeights.bold, marginTop: 5, fontFamily: systemFont }} numberOfLines={1}>
                {match.matchTitle}
              </Text>
            </View>
            <View style={{ backgroundColor: isDarkHero ? '#0B2A42' : '#FEF3C7', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 6, borderWidth: isDarkHero ? 1 : 0, borderColor: '#2B5C78' }}>
              <Text style={{ color: isDarkHero ? '#E0F2FE' : '#92400E', fontSize: typeScale.caption, fontWeight: fontWeights.bold, fontFamily: systemFont }}>INN {match.inning}</Text>
            </View>
          </View>
        ) : null}

        {!bodyOnly ? (
          <View style={{ paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: heroBorderColor }}>
            <View style={{ position: 'relative', minHeight: 58, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1, minWidth: 0, paddingRight: latestDelivery?.label ? 14 : 0, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <TeamIdentityMark team={battingTeamMeta} logoSource={battingTeamLogoSource} size={54} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text selectable style={{ color: heroTeamColor, fontSize: typeScale.body, fontWeight: fontWeights.medium, fontFamily: systemFont }} numberOfLines={1}>
                    {battingTeamCode}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 7, marginTop: 3 }}>
                    <Text selectable style={{ color: heroScoreColor, ...publicType.score, fontVariant: ['tabular-nums'] }}>
                      {inn.battingTeam.runs}-{inn.battingTeam.wickets}
                    </Text>
                    <Text selectable style={{ color: heroSubtleColor, fontSize: typeScale.name, fontWeight: fontWeights.semibold, fontVariant: ['tabular-nums'], fontFamily: systemFont }}>
                      {formatOvers(inn.totalLegalBalls)}
                    </Text>
                  </View>
                </View>
              </View>
              {latestDelivery?.label ? (
                <>
                  <View pointerEvents="none" style={{ position: 'absolute', left: '50%', top: 8, bottom: 0, width: StyleSheet.hairlineWidth, backgroundColor: heroDividerColor }} />
                  <View style={{ flex: 1, minWidth: 0, paddingLeft: 14, alignItems: 'center', justifyContent: 'center' }}>
                    <View style={{ width: outcomeBoxWidth, minHeight: 48, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' }}>
                      <Text
                        selectable
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.85}
                        style={{ color: latestDeliveryColor, fontSize: 26, fontFamily: systemFontBold, textAlign: 'center' }}
                      >
                        {latestDelivery.label}
                      </Text>
                    </View>
                  </View>
                </>
              ) : null}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginTop: 9 }}>
              <Text selectable style={{ color: heroSubtleColor, fontSize: 11, fontWeight: fontWeights.semibold, fontVariant: ['tabular-nums'], fontFamily: systemFont }}>
                CRR  <Text style={{ color: heroMetaColor, fontWeight: fontWeights.bold, fontFamily: systemFont }}>{crr}</Text>
              </Text>
              <View style={{ flex: 1, minWidth: 0, minHeight: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 5 }}>
                <Text style={{ color: heroMutedColor, fontSize: typeScale.micro, lineHeight: 14, includeFontPadding: false, fontWeight: fontWeights.bold, fontFamily: systemFont }}>TOSS</Text>
                <Text selectable style={{ flexShrink: 1, minWidth: 0, color: heroMetaColor, fontSize: typeScale.label, lineHeight: 14, includeFontPadding: false, fontWeight: fontWeights.bold, textAlign: 'right', fontFamily: systemFont }} numberOfLines={1}>
                  {tossWinnerCode}
                </Text>
                <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: heroIconBg, alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialCommunityIcons name={tossDecisionIcon} size={12} color={heroTeamColor} />
                </View>
              </View>
            </View>
            {matchStatusText ? (
              <Text selectable style={{ color: heroStatusColor, fontSize: 12, lineHeight: 17, fontWeight: fontWeights.bold, marginTop: 7, fontFamily: systemFont }}>
                {matchStatusText}
              </Text>
            ) : null}
          </View>
        ) : null}

        {!heroOnly ? (
          <>
            <View style={{ paddingLeft: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#CBD5E1' }}>
              {renderCompactOverTimeline({
                previousOver: !inn.isOverComplete ? latestCompletedOver : null,
                currentOverNumber: currentOverNum,
                currentBalls: currentOverBalls,
                currentRuns: thisOverRuns,
                size: 24,
                contentPaddingRight: 12,
                startAtEnd: true
              })}
            </View>

            <RealtimeWinBar match={match} inning={inn} />

            <View style={{ borderBottomWidth: 1, borderBottomColor: '#CBD5E1' }}>
              <View style={{ minHeight: 38, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
                <Text style={{ flex: 1, color: '#64748B', ...publicType.label }}>ON PITCH PLAYERS</Text>
                <Text style={{ width: 30, color: '#94A3B8', ...publicType.label, textAlign: 'right' }}>R</Text>
                <Text style={{ width: 30, color: '#94A3B8', ...publicType.label, textAlign: 'right' }}>B</Text>
                <Text style={{ width: 28, color: '#94A3B8', ...publicType.label, textAlign: 'right' }}>4s</Text>
                <Text style={{ width: 28, color: '#94A3B8', ...publicType.label, textAlign: 'right' }}>6s</Text>
                <Text style={{ width: 50, color: '#94A3B8', ...publicType.label, textAlign: 'right' }}>SR</Text>
              </View>
              {batterRows.map(({ player, isStriker }) => {
                const strikeRate = player.balls > 0 ? ((player.runs / player.balls) * 100).toFixed(1) : '0.0';
                return (
                  <TouchableOpacity
                    key={`${player.name}-${isStriker}`}
                    onPress={() => handleOpenPlayerProfile(player.name)}
                    activeOpacity={0.7}
                    style={{ minHeight: 56, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}
                  >
                    <View style={{ flex: 1, paddingRight: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text selectable {...nameFitProps} style={{ flexShrink: 1, minWidth: 0, color: '#0F172A', fontSize: typeScale.name, fontWeight: isStriker ? fontWeights.strong : fontWeights.bold, fontFamily: systemFont }}>{player.name}</Text>
                      {isStriker ? <MaterialCommunityIcons name="cricket" size={15} color="#0284C7" /> : null}
                    </View>
                    <Text selectable style={{ width: 30, color: '#0F172A', fontSize: typeScale.name, fontWeight: fontWeights.bold, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFont }}>{player.runs}</Text>
                    <Text selectable style={{ width: 30, color: '#475569', fontSize: 12, fontWeight: fontWeights.bold, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFont }}>{player.balls}</Text>
                    <Text selectable style={{ width: 28, color: '#475569', fontSize: 12, fontWeight: fontWeights.bold, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFont }}>{player.fours || 0}</Text>
                    <Text selectable style={{ width: 28, color: '#475569', fontSize: 12, fontWeight: fontWeights.bold, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFont }}>{player.sixes || 0}</Text>
                    <Text selectable style={{ width: 50, color: '#475569', fontSize: 11, fontWeight: fontWeights.bold, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFont }}>{strikeRate}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {inn.bowler ? (
              <>
                <View style={{ height: 8, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }} />
                <TouchableOpacity
                  onPress={() => handleOpenPlayerProfile(inn.bowler?.name)}
                  activeOpacity={0.7}
                  style={{ minHeight: 50, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#CBD5E1', backgroundColor: '#FFFFFF' }}
                >
                  <View style={{ flex: 1, minWidth: 0, paddingRight: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text selectable {...nameFitProps} style={{ flexShrink: 1, minWidth: 0, color: '#0F172A', fontSize: typeScale.name, fontFamily: systemFont }}>
                      {inn.bowler.name}
                    </Text>
                    <MaterialCommunityIcons name="baseball" size={15} color="#0284C7" />
                  </View>
                  {[
                    ['O', inn.bowler.overs],
                    ['R', inn.bowler.runs],
                    ['W', inn.bowler.wickets],
                    ['ECO', bowlerEco]
                  ].map(([label, value]) => (
                    <View key={label} style={{ width: label === 'ECO' ? 44 : 30, alignItems: 'flex-end' }}>
                      <Text selectable style={{ color: label === 'W' ? '#0284C7' : '#0F172A', fontSize: 13, fontFamily: systemFontMedium, fontVariant: ['tabular-nums'] }}>{value}</Text>
                      <Text style={{ color: '#94A3B8', fontSize: 8, marginTop: 1, fontFamily: systemFont }}>{label}</Text>
                    </View>
                  ))}
                </TouchableOpacity>
              </>
            ) : null}

            <View style={{ borderBottomWidth: 1, borderBottomColor: '#CBD5E1' }}>
              <View style={{ paddingHorizontal: 12, paddingTop: 11 }}>
                <Text style={{ color: '#64748B', ...publicType.label }}>PARTNERSHIP</Text>
              </View>
              <View style={{ flexDirection: 'row', marginTop: 7 }}>
                {[
                  ['RUNS', partnershipRuns],
                  ['BALLS', partnershipBalls],
                  ['RUN RATE', partnershipRate]
                ].map(([label, value], index) => (
                  <View key={label} style={{ flex: 1, paddingHorizontal: 12, paddingBottom: 12, borderLeftWidth: index > 0 ? 1 : 0, borderLeftColor: '#E2E8F0' }}>
                    <Text selectable style={{ color: '#0F172A', fontSize: 14, fontVariant: ['tabular-nums'], fontFamily: systemFontMedium }}>{value}</Text>
                    <Text style={{ color: '#94A3B8', fontSize: typeScale.micro, marginTop: 2, fontFamily: systemFont }}>{label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={{ paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#CBD5E1' }}>
              <Text style={{ color: '#64748B', ...publicType.label }}>LAST WICKET</Text>
              {inn.lastWicket ? (
                <View style={{ marginTop: 6, gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <Text selectable {...nameFitProps} style={{ flex: 1, minWidth: 0, color: '#0F172A', fontSize: typeScale.name, fontFamily: systemFontMedium }}>{inn.lastWicket.name}</Text>
                    <Text selectable style={{ color: '#0284C7', fontSize: typeScale.label, fontVariant: ['tabular-nums'], fontFamily: systemFont }}>
                      Over {inn.lastWicket.over}
                    </Text>
                  </View>
                  <Text selectable {...nameFitProps} style={{ color: '#64748B', fontSize: 11, lineHeight: 16, fontFamily: systemFont }}>
                    {inn.lastWicket.dismissal}
                  </Text>
                  <Text selectable style={{ color: '#0F172A', fontSize: typeScale.caption, fontVariant: ['tabular-nums'], fontFamily: systemFont }}>
                    Team {inn.lastWicket.teamScore}-{inn.lastWicket.teamWickets}
                  </Text>
                </View>
              ) : (
                <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 5, fontFamily: systemFont }}>No wicket yet</Text>
              )}
            </View>

            {match.phase === 'playing' && totalInningsBalls > 0 && (inn.totalLegalBalls || 0) >= 12 ? (
              <View style={{ marginTop: 6, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}>
                <View style={{ minHeight: 34, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <Text style={{ flex: 1, color: '#0F172A', fontSize: typeScale.name, lineHeight: 18, fontWeight: fontWeights.bold, fontFamily: systemFont }}>
                    Projected Score
                  </Text>
                  <Text style={{ color: '#64748B', fontSize: 10, fontWeight: fontWeights.bold, fontFamily: systemFont }}>
                    as per RR*
                  </Text>
                </View>
                <View style={{ minHeight: 30, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
                  <Text style={{ width: 78, color: '#64748B', fontSize: 11, fontWeight: fontWeights.bold, fontFamily: systemFont }}>Run Rate</Text>
                  {projectedScoreColumns.map(column => (
                    <Text key={`rate-${column.label}`} selectable style={{ flex: 1, color: column.active ? '#475569' : '#64748B', fontSize: typeScale.label, fontWeight: fontWeights.bold, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFont }}>
                      {column.label}
                    </Text>
                  ))}
                </View>
                <View style={{ minHeight: 38, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
                  <Text style={{ width: 78, color: '#0F172A', fontSize: typeScale.body, fontWeight: fontWeights.bold, fontFamily: systemFont }}>
                    {match.maxOvers} Over
                  </Text>
                  {projectedScoreColumns.map(column => (
                    <Text key={`projected-${column.label}`} selectable style={{ flex: 1, color: '#0F172A', fontSize: typeScale.name, fontWeight: fontWeights.bold, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFont }}>
                      {column.value}
                    </Text>
                  ))}
                </View>
              </View>
            ) : null}
          </>
        ) : null}
      </View>
    );
  };

  const keepPublicTabVisible = (tabIndex, animated = true) => {
    if (tabIndex === 0) {
      publicTabsRef.current?.scrollTo({ x: 0, animated });
    } else if (tabIndex === PUBLIC_LIVE_TABS.length - 1) {
      publicTabsRef.current?.scrollToEnd({ animated });
    } else {
      publicTabsRef.current?.scrollTo({
        x: Math.max(0, (tabIndex * 92) - (screenWidth * 0.28)),
        animated
      });
    }
  };

  const capturePublicTabLayout = (tabId, event) => {
    const { x, width } = event.nativeEvent.layout;
    setPublicTabLayouts(previous => {
      const current = previous[tabId];
      if (current && Math.abs(current.x - x) < 0.5 && Math.abs(current.width - width) < 0.5) return previous;
      return { ...previous, [tabId]: { x, width } };
    });
  };

  const capturePlayingXiTabLayout = (teamId, event) => {
    const { x, width } = event.nativeEvent.layout;
    setPlayingXiTabLayouts(previous => {
      const current = previous[teamId];
      if (current && Math.abs(current.x - x) < 0.5 && Math.abs(current.width - width) < 0.5) return previous;
      return { ...previous, [teamId]: { x, width } };
    });
  };

  const changePlayingXiTeam = (teamId, movePager = true) => {
    const nextIndex = teamId - 1;
    if (movePager) {
      playingXiPagerRef.current?.scrollTo({ x: nextIndex * screenWidth, animated: true });
    }
    if (teamId !== playingXiTeamTab) setPlayingXiTeamTab(teamId);
  };

  const handlePlayingXiPagerEnd = (event) => {
    const nextIndex = Math.max(0, Math.min(1, Math.round(event.nativeEvent.contentOffset.x / screenWidth)));
    const nextTeamId = nextIndex + 1;
    if (nextTeamId !== playingXiTeamTab) setPlayingXiTeamTab(nextTeamId);
  };

  // FULL SCREEN FINISHED MATCH SCORECARD VIEW (MATCHING CREX EXACT SCREENSHOT 2)
  const [finishedTab, setFinishedTab] = useState('summary');
  const [finishedInningIndex, setFinishedInningIndex] = useState(0);



  const playingXiFinishedMatch = currentScreen === 'finishedView' ? (selectedMatch || finishedMatches[0]) : null;
  const activePlayingXiTeams = activeMatch?.teams?.length >= 2 && activeMatch?.playingXI
    ? activeMatch.teams.slice(0, 2).map((team, index) => ({
      id: index + 1,
      name: team.name,
      roster: activeMatch.playingXI[team.name] || []
    }))
    : [
      { id: 1, name: team1Name, roster: team1Roster },
      { id: 2, name: team2Name, roster: team2Roster }
    ];
  const playingXiTabs = (playingXiFinishedMatch && playingXiFinishedMatch.team1 && playingXiFinishedMatch.team2)
    ? [
      { id: 1, name: playingXiFinishedMatch.team1?.name || team1Name, roster: (playingXiFinishedMatch.team1?.batting || []).map(player => player.name) },
      { id: 2, name: playingXiFinishedMatch.team2?.name || team2Name, roster: (playingXiFinishedMatch.team2?.batting || []).map(player => player.name) }
    ]
    : activePlayingXiTeams;
  const playingXiMatchTitle = playingXiFinishedMatch?.title || activeMatch?.matchTitle || `${team1Name} vs ${team2Name}`;
  const playingXiTabsMeasured = playingXiTabs.every(team => playingXiTabLayouts[team.id]);
  const playingXiIndicatorTranslateX = playingXiPagerScrollX.interpolate({
    inputRange: [0, screenWidth],
    outputRange: playingXiTabs.map(team => {
      const layout = playingXiTabLayouts[team.id];
      return layout ? layout.x + (layout.width / 2) - 50 : 0;
    }),
    extrapolate: 'clamp'
  });
  const playingXiIndicatorScaleX = playingXiPagerScrollX.interpolate({
    inputRange: [0, screenWidth],
    outputRange: playingXiTabs.map(team => (playingXiTabLayouts[team.id]?.width || 100) / 100),
    extrapolate: 'clamp'
  });
  const activeDisplayTeamOne = activeMatch?.teams?.[0] || {
    name: team1Name,
    code: team1Name.slice(0, 2).toUpperCase(),
    logoKey: 'default-team-1'
  };
  const activeDisplayTeamTwo = activeMatch?.teams?.[1] || {
    name: team2Name,
    code: team2Name.slice(0, 2).toUpperCase(),
    logoKey: 'default-team-2'
  };
  const getLatestTeamInning = (teamName) => [...(activeMatch?.innings || [])]
    .reverse()
    .find(inning => (inning?.battingTeam?.name || inning?.battingTeamName || inning?.teamName) === teamName);
  const activeDisplayInningOne = getLatestTeamInning(activeDisplayTeamOne?.name);
  const activeDisplayInningTwo = getLatestTeamInning(activeDisplayTeamTwo?.name);
  const getFinishedCardScoreParts = (team) => getScorePartsFromText(team?.score);
  const openLiveMatchCard = () => {
    setPublicLiveTab('live');
    setLiveViewReturnScreen('home');
    setCurrentScreen('liveView');
  };
  const liveOversText = activeMatch?.maxOvers || activeMatch?.totalOvers || activeMatch?.overs || 20;
  const searchNeedle = searchQuery.trim().toLowerCase();
  const isDummyTeamName = (n) => !n || n === 'Team 1' || n === 'Team 2' || n === 'TM' || n === 'Team A' || n === 'Team B';

  const filterLiveMatch = (m) => {
    if (!m || m.phase === 'result' || m.phase === 'finished' || m.isCompleted) return false;
    const t1Name = m.teams?.[0]?.name || m.team1?.name || m.innings?.[0]?.battingTeam?.name || m.inn1BattingTeam;
    const t2Name = m.teams?.[1]?.name || m.team2?.name || m.innings?.[0]?.bowlingTeam?.name || m.inn1BowlingTeam;
    if (isDummyTeamName(t1Name) || isDummyTeamName(t2Name)) return false;
    if (searchNeedle && !getSearchBlob(m).includes(searchNeedle)) return false;
    return true;
  };

  const visibleLiveMatches = React.useMemo(() => {
    const list = Array.isArray(liveMatches) ? [...liveMatches] : [];
    if (activeMatch && filterLiveMatch(activeMatch)) {
      const exists = list.some(m => (m.id && m.id === activeMatch.id) || (m.supabaseId && m.supabaseId === activeMatch.supabaseId));
      if (!exists) list.unshift(activeMatch);
    }
    return list.filter(filterLiveMatch);
  }, [liveMatches, activeMatch, searchNeedle]);

  const activeMatchVisible = visibleLiveMatches.length > 0;

  const renderActiveMatchListCard = (targetMatch = null, index = 0) => {
    const m = targetMatch || activeMatch;
    if (!m) return null;

    const t1 = m.teams?.[0] || m.team1 || { name: m.innings?.[0]?.battingTeam?.name || m.inn1BattingTeam || 'Team 1' };
    const t2 = m.teams?.[1] || m.team2 || { name: m.innings?.[0]?.bowlingTeam?.name || m.inn1BowlingTeam || 'Team 2' };
    const inn1 = m.innings?.[0];
    const inn2 = m.innings?.[1];

    const oversNum = m.maxOvers || m.totalOvers || 20;
    const venueText = m.venue ? ` - ${m.venue}` : '';
    const subtitle = `${oversNum}-over match${venueText}`;

    const t1Score = inn1?.battingTeam ? `${inn1.battingTeam.runs ?? 0}-${inn1.battingTeam.wickets ?? 0}` : '0-0';
    const t1Overs = inn1 ? formatOvers(inn1.totalLegalBalls || 0) : '0.0';
    const t2Score = inn2?.battingTeam ? `${inn2.battingTeam.runs ?? 0}-${inn2.battingTeam.wickets ?? 0}` : '';
    const t2Overs = inn2 ? formatOvers(inn2.totalLegalBalls || 0) : '';

    const currentInning = m.inning === 2 ? (inn2 || inn1) : (inn1 || inn2);
    const activeBattingTeamName = currentInning?.battingTeam?.name || t1.name;

    const tossWin = getTossWinnerName(m) || m.tossWinner || t1.name;
    const tossDec = getTossDecisionText(m, m.tossDecision || 'BAT');

    return (
      <View key={`${m.id || m.supabaseId || m.matchCode || 'live-card'}-${index}`} style={{ marginBottom: 8 }}>
        <MatchListScoreCard
          subtitle={subtitle}
          teamOne={t1}
          teamTwo={t2}
          teamOneScore={t1Score}
          teamOneOvers={t1Overs}
          teamTwoScore={t2Score}
          teamTwoOvers={t2Overs}
          activeTeamName={activeBattingTeamName}
          statusLabel="Live"
          statusColor="#E11D48"
          statusDotColor="#E11D48"
          footerText={`Toss: ${tossWin}, Elected to ${tossDec}`}
          onPress={() => {
            setActiveMatch(m);
            openLiveMatchCard();
          }}
        />
      </View>
    );
  };

  const renderFinishedMatchListCard = (match, index = 0) => {
    const teamOneScore = getFinishedCardScoreParts(match.team1);
    const teamTwoScore = getFinishedCardScoreParts(match.team2);
    const resultCardText = getFinishedResultCardText(match);
    const resultColor = match.winnerTeamName === match.team1?.name ? '#0369A1' : '#92400E';

    const oversText = `${match.maxOvers || 5} Overs`;
    const ballTypeText = match.ballType ? ` • ${match.ballType.charAt(0).toUpperCase() + match.ballType.slice(1)} Ball` : ' • Tennis Ball';
    const venueText = match.venue ? ` • ${match.venue}` : ' • Sadokan Ground';
    const subtitleText = `${oversText}${ballTypeText}${venueText}`;

    return (
      <View key={`${match.id || match.title || 'match'}-${index}`} style={{ marginBottom: 8 }}>
        <MatchListScoreCard
          subtitle={subtitleText}
          teamOne={match.team1}
          teamTwo={match.team2}
          teamOneScore={teamOneScore.score}
          teamOneOvers={teamOneScore.overs}
          teamTwoScore={teamTwoScore.score}
          teamTwoOvers={teamTwoScore.overs}
          winnerTeamName={match.winnerTeamName}
          resultTitle={resultCardText.title}
          resultDetail={resultCardText.detail}
          resultColor={resultColor}
          topRightIcon={null}
          onPress={() => {
            setSelectedMatch(match);
            setFinishedTab('summary');
            setFinishedInningIndex(0);
            setCurrentScreen('finishedView');
          }}
        />
      </View>
    );
  };
  const visibleFinishedMatches = (searchNeedle
    ? finishedMatches.filter(match => getSearchBlob(match).includes(searchNeedle))
    : finishedMatches)
    .filter(m => Boolean(m && (m.team1?.name || m.teams?.[0]?.name)))
    .sort((a, b) => {
      const timeA = new Date(a.completedAt || a.dateText || 0).getTime();
      const timeB = new Date(b.completedAt || b.dateText || 0).getTime();
      return timeB - timeA;
    });
  const recentFinishedMatches = visibleFinishedMatches.slice(0, 3);
  const localPlayerNames = (localPlayersList || []).map(p => p && p.name).filter(Boolean);
  const setupPlayerNames = getCleanPlayerNames([...localPlayerNames, ...team1Roster, ...team2Roster, ...playerPool]);
  const getSetupPlayerProfile = (playerName) => {
    if (!playerName) return null;
    const cleanName = String(playerName).trim().toLowerCase();

    // 1. Check custom local players database (Saved with custom photoUrl / avatar)
    const local = localPlayersList.find(p => p && p.name && p.name.trim().toLowerCase() === cleanName);
    if (local) {
      return {
        name: local.name,
        avatar: local.photoUrl || local.photo_url || local.avatar || null,
        role: local.role || 'Player'
      };
    }

    // 2. Check master database
    const master = MASTER_PLAYERS_DB.find(p => p && p.name && p.name.trim().toLowerCase() === cleanName);
    if (master) {
      return {
        name: master.name,
        avatar: master.avatar || master.photoUrl || null,
        role: master.role || 'Player'
      };
    }

    return null;
  };

  const renderSetupPlayerPhoto = (playerName, size = 28) => {
    const player = getSetupPlayerProfile(playerName);
    const photoUri = player?.avatar || player?.photoUrl;
    return <PlayerAvatar name={playerName} photoUrl={photoUri} size={size} />;
  };

  const isDarkMatchScreen = currentScreen === 'scorerWizard' || currentScreen === 'finishedView' || currentScreen === 'liveView';
  const shellBackgroundColor = isDarkMatchScreen ? '#071B2C' : '#FFFFFF';

  return (
    <SafeAreaProvider>
      <View style={[styles.root, { backgroundColor: shellBackgroundColor }]}>
        <StatusBar barStyle={isDarkMatchScreen ? 'light-content' : 'dark-content'} backgroundColor={shellBackgroundColor} />
        <SafeAreaView style={[styles.safe, { backgroundColor: shellBackgroundColor }]} edges={['top', 'left', 'right']}>

          <AppNavigator
            currentScreen={currentScreen}
            setCurrentScreen={setCurrentScreen}
            activeMatch={activeMatch}
            publicLiveTab={publicLiveTab}
            setPublicLiveTab={setPublicLiveTab}
            liveViewReturnScreen={liveViewReturnScreen}
            onJoinMatchByCode={handleJoinMatchByCode}
            setPlayingXiTeamTab={setPlayingXiTeamTab}
            setPlayingXiVisible={setPlayingXiVisible}
            selectedMatch={selectedMatch}
            finishedMatches={finishedMatches}
            finishedArchive={finishedArchive}
            setSelectedMatch={setSelectedMatch}
            finishedTab={finishedTab}
            setFinishedTab={setFinishedTab}
            finishedInningIndex={finishedInningIndex}
            setFinishedInningIndex={setFinishedInningIndex}
            selectedPlayerProfile={selectedPlayerProfile}
            setSelectedPlayerProfile={setSelectedPlayerProfile}
            savedTeamsList={savedTeamsList}
            rematchSetup={rematchSetup}
            setRematchSetup={setRematchSetup}
            handleStartQuickMatch={handleStartQuickMatch}
            handleRematch={handleRematch}
            getBattingRoster={getBattingRoster}
            getBowlingRoster={getBowlingRoster}
            handleRecordBall={handleRecordBall}
            handleWicketPress={handleWicketPress}
            handleUndo={handleUndo}
            handleRedo={handleRedo}
            handleSwapStrike={handleSwapStrike}
            handleRetireBatsman={handleRetireBatsman}
            handleOpenPlayerProfile={handleOpenPlayerProfile}
            setExtrasSheetVisible={setExtrasSheetVisible}
            setIsEditSquadModalOpen={setIsEditSquadModalOpen}
            setNextBowlerName={setNextBowlerName}
            setBowlerChangePending={setBowlerChangePending}
            handleStartNewMatchSetup={handleStartNewMatchSetup}
            getRosterForTeam={getRosterForTeam}
            inn2Striker={inn2Striker}
            inn2NonStriker={inn2NonStriker}
            inn2Bowler={inn2Bowler}
            handleSelectInning2Opener={handleSelectInning2Opener}
            setInn2Bowler={setInn2Bowler}
            renderSetupPlayerPhoto={renderSetupPlayerPhoto}
            handleStartInning2={handleStartInning2}
            refreshing={refreshing}
            handlePullToRefresh={handlePullToRefresh}
            openScorerScreen={openScorerScreen}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            bottomNavTab={bottomNavTab}
            setBottomNavTab={setBottomNavTab}
            matchesSubTab={matchesSubTab}
            setMatchesSubTab={setMatchesSubTab}
            statsCategory={statsCategory}
            setStatsCategory={setStatsCategory}
            setupPlayerNames={setupPlayerNames}
            setSelectedPlayerName={setSelectedPlayerName}
            activeMatchVisible={activeMatchVisible}
            visibleLiveMatches={visibleLiveMatches}
            renderActiveMatchListCard={renderActiveMatchListCard}
            recentFinishedMatches={recentFinishedMatches}
            renderFinishedMatchListCard={renderFinishedMatchListCard}
            visibleFinishedMatches={visibleFinishedMatches}
            TOP_BATTERS={computeLeaderboardRankings(finishedArchive, localPlayersList).topBatters}
            TOP_BOWLERS={computeLeaderboardRankings(finishedArchive, localPlayersList).topBowlers}
            TOP_ALLROUNDERS={computeLeaderboardRankings(finishedArchive, localPlayersList).topAllRounders}
            localPlayersList={localPlayersList}
            MASTER_PLAYERS_DB={MASTER_PLAYERS_DB}
            getSetupPlayerProfile={getSetupPlayerProfile}
          />

        </SafeAreaView>


        <ExtrasModal
          visible={extrasSheetVisible}
          onClose={() => setExtrasSheetVisible(false)}
          onRecordBall={handleRecordBall}
          handleRecordBall={handleRecordBall}
        />

        <PlayingXiModal
          visible={playingXiVisible}
          onClose={() => setPlayingXiVisible(false)}
          playingXiMatchTitle={playingXiMatchTitle}
          playingXiTabs={playingXiTabs}
          playingXiTeamTab={playingXiTeamTab}
          changePlayingXiTeam={changePlayingXiTeam}
          capturePlayingXiTabLayout={capturePlayingXiTabLayout}
          playingXiTabsMeasured={playingXiTabsMeasured}
          playingXiIndicatorTranslateX={playingXiIndicatorTranslateX}
          playingXiIndicatorScaleX={playingXiIndicatorScaleX}
          playingXiPagerRef={playingXiPagerRef}
          playingXiPagerScrollX={playingXiPagerScrollX}
          handlePlayingXiPagerEnd={handlePlayingXiPagerEnd}
          screenWidth={screenWidth}
        />

        <WicketDismissalModal
          visible={wicketEntryPending}
          onRequestClose={() => pendingFielderDismissal ? setPendingFielderDismissal('') : cancelWicketEntry()}
          pendingFielderDismissal={pendingFielderDismissal}
          setPendingFielderDismissal={setPendingFielderDismissal}
          cancelWicketEntry={cancelWicketEntry}
          curInning={curInning}
          getBowlingRoster={getBowlingRoster}
          handleSelectDismissalFielder={handleSelectDismissalFielder}
          handleSelectWicketType={handleSelectWicketType}
        />

        {/* RUN OUT MODAL */}
        <RunOutModal
          visible={runOutPending}
          onClose={cancelWicketEntry}
          curInning={curInning}
          runOutDismissed={runOutDismissed}
          setRunOutDismissed={setRunOutDismissed}
          runOutEnd={runOutEnd}
          setRunOutEnd={setRunOutEnd}
          runOutRuns={runOutRuns}
          setRunOutRuns={setRunOutRuns}
          handleConfirmRunOut={handleConfirmRunOut}
        />

        {/* WICKET MODAL — FULL SCREEN SPACIOUS SELECTION SCREEN */}
        <WicketPendingModal
          visible={wicketPending}
          onClose={() => setWicketPending(false)}
          curInning={curInning}
          getAvailableBatsmen={getAvailableBatsmen}
          selectNewBatsman={selectNewBatsman}
          newBatsmanName={newBatsmanName}
          setNewBatsmanName={setNewBatsmanName}
          handleNewBatsman={handleNewBatsman}
        />

        {/* NEXT BOWLER MODAL — FULL SCREEN SPACIOUS SELECTION SCREEN */}
        <BowlerChangeModal
          visible={bowlerChangePending}
          onClose={() => setBowlerChangePending(false)}
          activeMatch={activeMatch}
          setActiveMatch={setActiveMatch}
          curInning={curInning}
          getAvailableBowlers={getAvailableBowlers}
          nextBowlerName={nextBowlerName}
          setNextBowlerName={setNextBowlerName}
          handleNewBowler={handleNewBowler}
        />

        {/* SHARED OFFICIAL SQUAD SELECTOR MODAL (MID-MATCH EDIT) */}
        <SquadSelectorModal
          visible={isEditSquadModalOpen}
          onClose={() => setIsEditSquadModalOpen(false)}
          team1Name={activeMatch?.teams?.[0]?.name || activeMatch?.innings?.[0]?.battingTeam?.name || 'Team 1'}
          team2Name={activeMatch?.teams?.[1]?.name || activeMatch?.innings?.[0]?.bowlingTeam?.name || 'Team 2'}
          team1LogoKey={activeMatch?.teams?.[0]?.logoKey || 'csk'}
          team2LogoKey={activeMatch?.teams?.[1]?.logoKey || 'rcb'}
          team1Roster={activeMatch?.playingXI?.[activeMatch?.teams?.[0]?.name] || team1Roster}
          team2Roster={activeMatch?.playingXI?.[activeMatch?.teams?.[1]?.name] || team2Roster}
          allPlayersPool={allMidMatchPlayersPool}
          localPlayersDb={localPlayersList}
          onMoveToTeam={handleMidMatchMoveToTeam}
          onOpenAddPlayerModal={() => setIsAddPlayerModalOpen(true)}
          onOpenSquadPreview={() => { }}
          onEditPlayerPhoto={() => { }}
        />

        {/* SHARED OFFICIAL ADD PLAYER MODAL (MID-MATCH REGISTER) */}
        <AddPlayerModal
          visible={isAddPlayerModalOpen}
          onClose={() => setIsAddPlayerModalOpen(false)}
          isAddingPlayer={isAddingPlayer}
          onAddPlayer={handleMidMatchCreatePlayer}
          newPlayerRoleInput={newPlayerRoleInput}
          setNewPlayerRoleInput={setNewPlayerRoleInput}
          newPlayerPhoneInput={newPlayerPhoneInput}
          setNewPlayerPhoneInput={setNewPlayerPhoneInput}
          selectedLocalImageUri={selectedLocalImageUri}
          setSelectedLocalImageUri={setSelectedLocalImageUri}
        />



        <ScorerPinModal
          visible={scorerPinModalVisible}
          activeMatch={activeMatch}
          onClose={() => setScorerPinModalVisible(false)}
          onSuccessContinueMatch={handleScorerPinSuccess}
          onSuccessRemoteMatch={(remoteMatch) => {
            if (remoteMatch) {
              setActiveMatch(remoteMatch);
            }
            setIsScorerUnlocked(true);
            setScorerPinModalVisible(false);
            setCurrentScreen('scorerWizard');
          }}
          onSelectStartNewMatch={handleStartNewMatchSetup}
        />

        <MatchCompleteModal
          visible={matchCompleteModalVisible}
          match={activeMatch}
          onClose={() => setMatchCompleteModalVisible(false)}
          onStartRematch={() => {
            setMatchCompleteModalVisible(false);
            handleRematch(activeMatch);
          }}
          onViewScorecard={() => {
            setMatchCompleteModalVisible(false);
            setFinishedTab('scorecard');
          }}
        />

        {/* Global Floating Toast for entire CricFlow App */}
        <CricGlobalToast />
      </View>
    </SafeAreaProvider>
  );
}

// â”€â”€â”€ STYLES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.hero.bg, fontFamily: systemFont },
  safe: { flex: 1, backgroundColor: theme.hero.bg },
  fullPage: { flex: 1, backgroundColor: theme.colors.surface },
  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backBtnText: { fontSize: 13, fontWeight: fontWeights.bold, color: theme.colors.textPrimary, fontFamily: systemFont },
  pageTitle: { fontSize: 13, fontWeight: fontWeights.bold, color: theme.colors.primary, fontFamily: systemFont }
});
