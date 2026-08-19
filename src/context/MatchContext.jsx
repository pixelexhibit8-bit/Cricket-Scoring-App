import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { BackHandler } from 'react-native';
import { PlayerAvatar } from '../components/PlayerAvatar.jsx';
import { computeLeaderboardRankings } from '../utils/cricketUtils.js';
import { useMatchSync } from '../hooks/useMatchSync.js';
import { useSquadManagement } from '../hooks/useSquadManagement.js';
import { useCricketSpeech } from '../hooks/useCricketSpeech.js';
import { useCricketScoring } from '../hooks/useCricketScoring.js';
import { useScorerWorkflow } from '../hooks/useScorerWorkflow.js';
import { navigate, ROUTE_SCREEN_MAP } from '../navigation/navigationService.js';

const MatchContext = createContext(null);

export function MatchProvider({ children }) {
  // ── Navigation & Screen States ──
  const [currentScreen, _setCurrentScreen] = useState('home');
  const setCurrentScreen = useCallback((screenName) => {
    _setCurrentScreen(screenName);
    navigate(screenName);
  }, []);
  const [bottomNavTab, setBottomNavTab] = useState('home'); // 'home' | 'matches' | 'rankings' | 'profile'
  const [matchesSubTab, setMatchesSubTab] = useState('home');
  const [publicLiveTab, setPublicLiveTab] = useState('live');
  const [liveViewReturnScreen, setLiveViewReturnScreen] = useState('home');
  const [statsCategory, setStatsCategory] = useState('batters');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayerName, setSelectedPlayerName] = useState(null);
  const [selectedPlayerProfile, setSelectedPlayerProfile] = useState(null);
  const [savedTeamsList, setSavedTeamsList] = useState([]);
  const [extrasSheetVisible, setExtrasSheetVisible] = useState(false);
  const [playingXiVisible, setPlayingXiVisible] = useState(false);

  // ── Hook 1: Match Synchronization & Realtime Cloud Sync ──
  const {
    activeMatch,
    setActiveMatch,
    liveMatches,
    setLiveMatches,
    finishedArchive,
    setFinishedArchive,
    selectedMatch,
    setSelectedMatch,
    playerPool,
    refreshing,
    handlePullToRefresh,
    handleJoinMatchByCode,
    liveSyncState
  } = useMatchSync({
    currentScreen,
    setCurrentScreen,
    setBottomNavTab
  });

  const finishedMatches = useMemo(() => {
    return Array.isArray(finishedArchive) ? finishedArchive : [];
  }, [finishedArchive]);

  // ── Hook 2: Mid-Match Squad & Player Management ──
  const {
    localPlayersList,
    setLocalPlayersList,
    isEditSquadModalOpen,
    setIsEditSquadModalOpen,
    isAddPlayerModalOpen,
    setIsAddPlayerModalOpen,
    newPlayerRoleInput,
    setNewPlayerRoleInput,
    newPlayerPhoneInput,
    setNewPlayerPhoneInput,
    selectedLocalImageUri,
    setSelectedLocalImageUri,
    isAddingPlayer,
    allMidMatchPlayersPool,
    handleMidMatchMoveToTeam,
    handleMidMatchCreatePlayer
  } = useSquadManagement({
    activeMatch,
    setActiveMatch
  });

  // ── Hook 3: Live Voice Announcements ──
  useCricketSpeech({
    activeMatch,
    currentScreen
  });

  // ── Roster & Inning Getters ──
  const curInning = useMemo(() => {
    if (!activeMatch || !Array.isArray(activeMatch.innings)) return null;
    return activeMatch.innings[Math.max(0, (activeMatch.inning || 1) - 1)] || activeMatch.innings[0] || null;
  }, [activeMatch]);

  const getRosterForTeam = useCallback((teamName, fallbackRoster = []) => {
    if (!teamName) return fallbackRoster;
    const clean = String(teamName).trim().toLowerCase();
    if (activeMatch?.playingXI) {
      for (const key of Object.keys(activeMatch.playingXI)) {
        if (key.trim().toLowerCase() === clean && Array.isArray(activeMatch.playingXI[key]) && activeMatch.playingXI[key].length > 0) {
          return activeMatch.playingXI[key];
        }
      }
    }
    const t1 = activeMatch?.teams?.[0]?.name;
    const t2 = activeMatch?.teams?.[1]?.name;
    if (t1 && t1.trim().toLowerCase() === clean) return activeMatch?.playingXI?.[t1] || fallbackRoster;
    if (t2 && t2.trim().toLowerCase() === clean) return activeMatch?.playingXI?.[t2] || fallbackRoster;
    return fallbackRoster;
  }, [activeMatch]);

  const getBattingRoster = useCallback(() => {
    if (!activeMatch || !curInning) return [];
    return getRosterForTeam(curInning?.battingTeam?.name, []);
  }, [activeMatch, curInning, getRosterForTeam]);

  const getBowlingRoster = useCallback(() => {
    if (!activeMatch || !curInning) return [];
    return getRosterForTeam(curInning?.bowlingTeam?.name, []);
  }, [activeMatch, curInning, getRosterForTeam]);

  const getAvailableBatsmen = useCallback(() => {
    const roster = getBattingRoster();
    if (!curInning) return roster;
    const activeOnPitch = [curInning.striker?.name, curInning.nonStriker?.name].filter(Boolean);
    const dismissed = curInning.dismissedPlayers || [];
    return roster.filter(name => !activeOnPitch.includes(name) && !dismissed.includes(name));
  }, [curInning, getBattingRoster]);

  const getAvailableBowlers = useCallback(() => {
    const roster = getBowlingRoster();
    if (!curInning) return roster;
    return roster.filter(name => name !== curInning.bowler?.name);
  }, [curInning, getBowlingRoster]);

  // ── Hook 4: Core Ball-by-Ball Cricket Scoring Engine ──
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
    setLiveMatches,
    curInning,
    getRosterForTeam,
    getBattingRoster,
    getBowlingRoster
  });

  // ── Hook 5: Scorer Workflow & Match Filters ──
  const {
    isScorerUnlocked,
    setIsScorerUnlocked,
    scorerPinModalVisible,
    setScorerPinModalVisible,
    matchCompleteModalVisible,
    setMatchCompleteModalVisible,
    rematchSetup,
    setRematchSetup,
    openScorerScreen,
    handleScorerPinSuccess,
    handleStartNewMatchSetup,
    handleStartQuickMatch,
    handleRematch,
    visibleLiveMatches,
    activeMatchVisible,
    visibleFinishedMatches,
    recentFinishedMatches,
    setupPlayerNames,
    getSetupPlayerProfile
  } = useScorerWorkflow({
    activeMatch,
    setActiveMatch,
    setLiveMatches,
    liveMatches,
    finishedArchive,
    setFinishedArchive,
    selectedMatch,
    setSelectedMatch,
    currentScreen,
    setCurrentScreen,
    setBottomNavTab,
    searchQuery,
    localPlayersList,
    playerPool
  });

  // ── Hardware Back Button Handler for Android ──
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
      if (
        currentScreen === 'finishedView' ||
        currentScreen === 'scorerWizard' ||
        currentScreen === 'about' ||
        currentScreen === 'auth' ||
        currentScreen === 'playerProfile'
      ) {
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
    playingXiVisible,
    isEditSquadModalOpen,
    extrasSheetVisible,
    wicketPending,
    bowlerChangePending,
    liveViewReturnScreen
  ]);

  const renderSetupPlayerPhoto = useCallback((playerName, size = 28) => {
    const player = getSetupPlayerProfile(playerName);
    const photoUri = player?.avatar || player?.photoUrl;
    return <PlayerAvatar name={playerName} photoUrl={photoUri} size={size} />;
  }, [getSetupPlayerProfile]);

  // Memoize leaderboard rankings
  const leaderboardRankings = useMemo(
    () => computeLeaderboardRankings(finishedArchive, localPlayersList),
    [finishedArchive, localPlayersList]
  );

  const value = {
    // Navigation & Screens
    currentScreen,
    setCurrentScreen,
    bottomNavTab,
    setBottomNavTab,
    matchesSubTab,
    setMatchesSubTab,
    publicLiveTab,
    setPublicLiveTab,
    liveViewReturnScreen,
    setLiveViewReturnScreen,
    statsCategory,
    setStatsCategory,
    searchQuery,
    setSearchQuery,
    selectedPlayerName,
    setSelectedPlayerName,
    selectedPlayerProfile,
    setSelectedPlayerProfile,
    savedTeamsList,
    setSavedTeamsList,
    extrasSheetVisible,
    setExtrasSheetVisible,
    playingXiVisible,
    setPlayingXiVisible,

    // Match Sync & Archive
    activeMatch,
    setActiveMatch,
    liveMatches,
    setLiveMatches,
    finishedArchive,
    setFinishedArchive,
    finishedMatches,
    selectedMatch,
    setSelectedMatch,
    playerPool,
    refreshing,
    handlePullToRefresh,
    handleJoinMatchByCode,
    liveSyncState,

    // Squad Management
    localPlayersList,
    setLocalPlayersList,
    isEditSquadModalOpen,
    setIsEditSquadModalOpen,
    isAddPlayerModalOpen,
    setIsAddPlayerModalOpen,
    newPlayerRoleInput,
    setNewPlayerRoleInput,
    newPlayerPhoneInput,
    setNewPlayerPhoneInput,
    selectedLocalImageUri,
    setSelectedLocalImageUri,
    isAddingPlayer,
    allMidMatchPlayersPool,
    handleMidMatchMoveToTeam,
    handleMidMatchCreatePlayer,

    // Roster & Inning Getters
    curInning,
    getRosterForTeam,
    getBattingRoster,
    getBowlingRoster,
    getAvailableBatsmen,
    getAvailableBowlers,

    // Scoring Engine
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
    handleStartInning2,

    // Scorer Workflow & Filters
    isScorerUnlocked,
    setIsScorerUnlocked,
    scorerPinModalVisible,
    setScorerPinModalVisible,
    matchCompleteModalVisible,
    setMatchCompleteModalVisible,
    rematchSetup,
    setRematchSetup,
    openScorerScreen,
    handleScorerPinSuccess,
    handleStartNewMatchSetup,
    handleStartQuickMatch,
    handleRematch,
    visibleLiveMatches,
    activeMatchVisible,
    visibleFinishedMatches,
    recentFinishedMatches,
    setupPlayerNames,
    getSetupPlayerProfile,
    renderSetupPlayerPhoto,

    // Leaderboard Rankings
    leaderboardRankings,
    TOP_BATTERS: leaderboardRankings.topBatters,
    TOP_BOWLERS: leaderboardRankings.topBowlers,
    TOP_ALLROUNDERS: leaderboardRankings.topAllRounders
  };

  return (
    <MatchContext.Provider value={value}>
      {children}
    </MatchContext.Provider>
  );
}

export function useMatch() {
  const context = useContext(MatchContext);
  if (!context) {
    throw new Error('useMatch must be used within a MatchProvider');
  }
  return context;
}

export default MatchContext;
