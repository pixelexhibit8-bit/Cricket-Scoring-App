import React, { useState, useEffect } from 'react';
import { StyleSheet, View, StatusBar, BackHandler, LogBox } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';

// ── Components & UI Primitives ──
import { AppNavigator } from './src/navigation/AppNavigator.jsx';
import { PlayerAvatar } from './src/components/PlayerAvatar.jsx';
import { CricGlobalToast } from './src/components/CricGlobalToast.jsx';
import { systemFont, fontWeights, theme } from './src/theme.js';
import { MASTER_PLAYERS_DB } from './mockData';
import {
  computeLeaderboardRankings,
  getTossWinnerName,
  getTossDecisionText
} from './src/utils/cricketUtils.js';

// ── Custom Cricket Domain Hooks ──
import { useCricketScoring } from './src/hooks/useCricketScoring.js';
import { useMatchSync } from './src/hooks/useMatchSync.js';
import { useCricketSpeech } from './src/hooks/useCricketSpeech.js';
import { useSquadManagement } from './src/hooks/useSquadManagement.js';
import { useScorerWorkflow } from './src/hooks/useScorerWorkflow.js';

LogBox.ignoreLogs([
  '[Supabase Realtime Warning]',
  'channel error: transport failure',
  'Realtime Warning'
]);

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

  // ── Navigation & Screen States ──
  const [currentScreen, setCurrentScreen] = useState('home');
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

  const finishedMatches = Array.isArray(finishedArchive) ? finishedArchive : [];

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
  const curInning = (activeMatch && Array.isArray(activeMatch.innings))
    ? (activeMatch.innings[Math.max(0, (activeMatch.inning || 1) - 1)] || activeMatch.innings[0] || null)
    : null;

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
    const t1 = activeMatch?.teams?.[0]?.name;
    const t2 = activeMatch?.teams?.[1]?.name;
    if (t1 && t1.trim().toLowerCase() === clean) return activeMatch?.playingXI?.[t1] || fallbackRoster;
    if (t2 && t2.trim().toLowerCase() === clean) return activeMatch?.playingXI?.[t2] || fallbackRoster;
    return fallbackRoster;
  };

  const getBattingRoster = () => (!activeMatch || !curInning ? [] : getRosterForTeam(curInning?.battingTeam?.name, []));
  const getBowlingRoster = () => (!activeMatch || !curInning ? [] : getRosterForTeam(curInning?.bowlingTeam?.name, []));

  const getAvailableBatsmen = () => {
    const roster = getBattingRoster();
    if (!curInning) return roster;
    const activeOnPitch = [curInning.striker?.name, curInning.nonStriker?.name].filter(Boolean);
    const dismissed = curInning.dismissedPlayers || [];
    return roster.filter(name => !activeOnPitch.includes(name) && !dismissed.includes(name));
  };

  const getAvailableBowlers = () => {
    const roster = getBowlingRoster();
    if (!curInning) return roster;
    return roster.filter(name => name !== curInning.bowler?.name);
  };

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
      if (currentScreen === 'finishedView' || currentScreen === 'scorerWizard' || currentScreen === 'about' || currentScreen === 'auth' || currentScreen === 'playerProfile') {
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

          {/* CENTRAL APP NAVIGATOR & ROUTER */}
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
            playingXiVisible={playingXiVisible}
            setPlayingXiVisible={setPlayingXiVisible}
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
            curInning={curInning}
            getAvailableBatsmen={getAvailableBatsmen}
            getAvailableBowlers={getAvailableBowlers}
            cancelWicketEntry={cancelWicketEntry}
            handleSelectWicketType={handleSelectWicketType}
            handleSelectDismissalFielder={handleSelectDismissalFielder}
            handleConfirmRunOut={handleConfirmRunOut}
            selectNewBatsman={selectNewBatsman}
            handleNewBatsman={handleNewBatsman}
            newBatsmanName={newBatsmanName}
            setNewBatsmanName={setNewBatsmanName}
            handleNewBowler={handleNewBowler}
            extrasSheetVisible={extrasSheetVisible}
            wicketPending={wicketPending}
            setWicketPending={setWicketPending}
            wicketEntryPending={wicketEntryPending}
            pendingFielderDismissal={pendingFielderDismissal}
            setPendingFielderDismissal={setPendingFielderDismissal}
            runOutPending={runOutPending}
            runOutDismissed={runOutDismissed}
            setRunOutDismissed={setRunOutDismissed}
            runOutEnd={runOutEnd}
            setRunOutEnd={setRunOutEnd}
            runOutRuns={runOutRuns}
            setRunOutRuns={setRunOutRuns}
            bowlerChangePending={bowlerChangePending}
            isEditSquadModalOpen={isEditSquadModalOpen}
            setIsEditSquadModalOpen={setIsEditSquadModalOpen}
            isAddPlayerModalOpen={isAddPlayerModalOpen}
            setIsAddPlayerModalOpen={setIsAddPlayerModalOpen}
            isAddingPlayer={isAddingPlayer}
            handleMidMatchMoveToTeam={handleMidMatchMoveToTeam}
            handleMidMatchCreatePlayer={handleMidMatchCreatePlayer}
            newPlayerRoleInput={newPlayerRoleInput}
            setNewPlayerRoleInput={setNewPlayerRoleInput}
            newPlayerPhoneInput={newPlayerPhoneInput}
            setNewPlayerPhoneInput={setNewPlayerPhoneInput}
            selectedLocalImageUri={selectedLocalImageUri}
            setSelectedLocalImageUri={setSelectedLocalImageUri}
            allMidMatchPlayersPool={allMidMatchPlayersPool}
            scorerPinModalVisible={scorerPinModalVisible}
            setScorerPinModalVisible={setScorerPinModalVisible}
            handleScorerPinSuccess={handleScorerPinSuccess}
            setIsScorerUnlocked={setIsScorerUnlocked}
            matchCompleteModalVisible={matchCompleteModalVisible}
            setMatchCompleteModalVisible={setMatchCompleteModalVisible}
            inn2Striker={inn2Striker}
            inn2NonStriker={inn2NonStriker}
            inn2Bowler={inn2Bowler}
            handleSelectInning2Opener={handleSelectInning2Opener}
            setInn2Bowler={setInn2Bowler}
            handleStartInning2={handleStartInning2}
          />
        </SafeAreaView>

        {/* Global Floating Toast for entire CricFlow App */}
        <CricGlobalToast />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.hero.bg, fontFamily: systemFont },
  safe: { flex: 1, backgroundColor: theme.hero.bg }
});
