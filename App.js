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
import { AppNavigator } from './src/navigation/AppNavigator.jsx';
import { PlayerAvatar } from './src/components/PlayerAvatar.jsx';
import { ScorerPinModal } from './src/components/modals/ScorerPinModal.jsx';
import { MatchCompleteModal } from './src/components/modals/MatchCompleteModal.jsx';
import { BowlerChangeModal } from './src/components/modals/BowlerChangeModal.jsx';
import { ExtrasModal } from './src/components/modals/ExtrasModal.jsx';
import { RunOutModal } from './src/components/modals/RunOutModal.jsx';
import { WicketPendingModal } from './src/components/modals/WicketPendingModal.jsx';
import { SquadSelectorModal } from './src/components/modals/SquadSelectorModal.jsx';
import { AddPlayerModal } from './src/components/modals/AddPlayerModal.jsx';
import { PlayingXiModal } from './src/components/modals/PlayingXiModal.jsx';
import { WicketDismissalModal } from './src/components/modals/WicketDismissalModal.jsx';
import { capitalizeWords } from './src/utils/textUtils.js';
import { fetchLocalPlayers, saveLocalPlayer, aggregateMatchToPlayerStats } from './src/services/localPlayerService.js';
import { useCricketScoring } from './src/hooks/useCricketScoring.js';
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

// ——— APP ROOT ——————————————————————————————————————————————————————————

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

  const [extrasSheetVisible, setExtrasSheetVisible] = useState(false);
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
      if (currentScreen === 'about' || currentScreen === 'auth' || currentScreen === 'playerProfile') {
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

  // 🏏 CORE CRICKET SCORING HOOK
  const {
    matchHistoryStack,
    matchRedoStack,
    wicketPending,
    setWicketPending,
    wicketEntryPending,
    setWicketEntryPending,
    newBatsmanName,
    setNewBatsmanName,
    pendingFielderDismissal,
    setPendingFielderDismissal,
    runOutPending,
    setRunOutPending,
    runOutDismissed,
    setRunOutDismissed,
    runOutEnd,
    setRunOutEnd,
    runOutRuns,
    setRunOutRuns,
    bowlerChangePending,
    setBowlerChangePending,
    nextBowlerName,
    setNextBowlerName,
    inn2Striker,
    setInn2Striker,
    inn2NonStriker,
    setInn2NonStriker,
    inn2Bowler,
    setInn2Bowler,
    handleRecordBall,
    selectNewBatsman,
    handleNewBatsman,
    handleWicketPress,
    cancelWicketEntry,
    handleSelectWicketType,
    handleSelectDismissalFielder,
    handleConfirmRunOut,
    handleNewBowler,
    handleRetireBatsman,
    handleSwapStrike,
    handleUndo,
    handleRedo,
    handleSelectInning2Opener,
    handleStartInning2
  } = useCricketScoring({
    activeMatch,
    setActiveMatch,
    getRosterForTeam,
    getBattingRoster,
    getBowlingRoster
  });

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
      // Atomically aggregate and update player career stats
      aggregateMatchToPlayerStats(finishedMatch).catch(() => {});
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

  const openScorerScreen = async (matchToScore = null) => {
    const user = await getCurrentUser();
    if (!user) {
      showToast('Please login from Profile to start a ground match', 'error', '🔒 Login Required');
      setBottomNavTab('profile');
      setCurrentScreen('home');
      return;
    }

    const target = matchToScore || activeMatch;
    const isUserOwned = target && (target.creatorId === user.id || target.isCoScorer || !target.creatorId);
    const isLive = target && (target.phase === 'playing' || target.phase === 'inningBreak');

    if (isLive && isUserOwned) {
      setActiveMatch(target);
      setIsScorerUnlocked(true);
      setScorerPinModalVisible(false);
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
    getCurrentUser().then(user => {
      const creatorId = user?.id || 'local_scorer';
      const creatorName = user?.name || 'Local Scorer';
      const newMatch = {
        id: matchUUID,
        supabaseId: matchUUID,
        creatorId,
        creatorName,
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
    });
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

  // —————————————————————————————————————————————————————————————————————————————————————————————————————————————————

  // PUBLIC LIVE VIEW — EXACT CREX SCORECARD LAYOUT MATCHING USER SCREENSHOT
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

  // FULL SCREEN FINISHED MATCH SCORECARD VIEW
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

          {/* MODULAR CENTRAL APP NAVIGATOR */}
          <AppNavigator
            currentScreen={currentScreen}
            setCurrentScreen={setCurrentScreen}
            activeMatch={activeMatch}
            setActiveMatch={setActiveMatch}
            selectedMatch={selectedMatch}
            setSelectedMatch={setSelectedMatch}
            finishedArchive={finishedArchive}
            finishedMatches={finishedMatches}
            visibleLiveMatches={visibleLiveMatches}
            recentFinishedMatches={recentFinishedMatches}
            visibleFinishedMatches={visibleFinishedMatches}
            activeMatchVisible={activeMatchVisible}
            renderActiveMatchListCard={renderActiveMatchListCard}
            renderFinishedMatchListCard={renderFinishedMatchListCard}
            openScorerScreen={openScorerScreen}
            handleStartNewMatchSetup={handleStartNewMatchSetup}
            handleStartQuickMatch={handleStartQuickMatch}
            handleRematch={handleRematch}
            rematchSetup={rematchSetup}
            setRematchSetup={setRematchSetup}
            handleJoinMatchByCode={handleJoinMatchByCode}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            bottomNavTab={bottomNavTab}
            setBottomNavTab={setBottomNavTab}
            matchesSubTab={matchesSubTab}
            setMatchesSubTab={setMatchesSubTab}
            statsCategory={statsCategory}
            setStatsCategory={setStatsCategory}
            refreshing={refreshing}
            handlePullToRefresh={handlePullToRefresh}
            setupPlayerNames={setupPlayerNames}
            setSelectedPlayerName={setSelectedPlayerName}
            selectedPlayerProfile={selectedPlayerProfile}
            setSelectedPlayerProfile={setSelectedPlayerProfile}
            localPlayersList={localPlayersList}
            MASTER_PLAYERS_DB={MASTER_PLAYERS_DB}
            getSetupPlayerProfile={getSetupPlayerProfile}
            renderSetupPlayerPhoto={renderSetupPlayerPhoto}
            savedTeamsList={savedTeamsList}
            TOP_BATTERS={computeLeaderboardRankings(finishedArchive, localPlayersList).topBatters}
            TOP_BOWLERS={computeLeaderboardRankings(finishedArchive, localPlayersList).topBowlers}
            TOP_ALLROUNDERS={computeLeaderboardRankings(finishedArchive, localPlayersList).topAllRounders}
            publicLiveTab={publicLiveTab}
            setPublicLiveTab={setPublicLiveTab}
            liveViewReturnScreen={liveViewReturnScreen}
            setPlayingXiTeamTab={setPlayingXiTeamTab}
            setPlayingXiVisible={setPlayingXiVisible}
            playingXiPagerScrollX={playingXiPagerScrollX}
            finishedTab={finishedTab}
            setFinishedTab={setFinishedTab}
            finishedInningIndex={finishedInningIndex}
            setFinishedInningIndex={setFinishedInningIndex}
            publicTabLayouts={publicTabLayouts}
            setPublicTabLayouts={setPublicTabLayouts}
            publicTabsRef={publicTabsRef}
            publicPagerScrollX={publicPagerScrollX}
            getBattingRoster={getBattingRoster}
            getBowlingRoster={getBowlingRoster}
            getRosterForTeam={getRosterForTeam}
            handleRecordBall={handleRecordBall}
            handleWicketPress={handleWicketPress}
            handleUndo={handleUndo}
            handleRedo={handleRedo}
            handleSwapStrike={handleSwapStrike}
            handleRetireBatsman={handleRetireBatsman}
            setExtrasSheetVisible={setExtrasSheetVisible}
            setIsEditSquadModalOpen={setIsEditSquadModalOpen}
            setNextBowlerName={setNextBowlerName}
            setBowlerChangePending={setBowlerChangePending}
            inn2Striker={inn2Striker}
            inn2NonStriker={inn2NonStriker}
            inn2Bowler={inn2Bowler}
            handleSelectInning2Opener={handleSelectInning2Opener}
            setInn2Bowler={setInn2Bowler}
            handleStartInning2={handleStartInning2}
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
