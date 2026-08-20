import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { HomeScreen } from '../screens/HomeScreen.jsx';
import { ScorerConsoleScreen } from '../screens/ScorerConsoleScreen.jsx';
import { InningBreakScreen } from '../screens/InningBreakScreen.jsx';
import { PublicLiveViewScreen } from '../screens/PublicLiveViewScreen.jsx';
import { FinishedMatchViewScreen } from '../screens/FinishedMatchViewScreen.jsx';
import { MyProfileScreen } from '../screens/MyProfileScreen.jsx';
import { QuickMatchSetupScreen } from '../screens/QuickMatchSetupScreen.jsx';
import { MatchesScreen } from '../screens/MatchesScreen.jsx';
import { RankingsScreen } from '../screens/RankingsScreen.jsx';

// Modals
import { ExtrasModal } from '../components/modals/ExtrasModal.jsx';
import { PlayingXiModal } from '../components/modals/PlayingXiModal.jsx';
import { WicketDismissalModal } from '../components/modals/WicketDismissalModal.jsx';
import { RunOutModal } from '../components/modals/RunOutModal.jsx';
import { WicketPendingModal } from '../components/modals/WicketPendingModal.jsx';
import { BowlerChangeModal } from '../components/modals/BowlerChangeModal.jsx';
import { SquadSelectorModal } from '../components/modals/SquadSelectorModal.jsx';
import { AddPlayerModal } from '../components/modals/AddPlayerModal.jsx';
import { ScorerPinModal } from '../components/modals/ScorerPinModal.jsx';
import { MatchCompleteModal } from '../components/modals/MatchCompleteModal.jsx';

import { buildFinishedMatch } from '../utils/cricketUtils.js';
import { systemFont, systemFontBold, fontWeights } from '../theme.js';
import { useMatch } from '../context/MatchContext.jsx';
import { navigationRef, ROUTE_SCREEN_MAP } from './navigationService.js';

const Stack = createNativeStackNavigator();

// ── Module-Level Stable Screen Route Components (Prevent Unnecessary Unmount/Remount) ──

function HomeScreenRoute() {
  const matchCtx = useMatch();
  return (
    <HomeScreen
      openScorerScreen={matchCtx.openScorerScreen}
      searchQuery={matchCtx.searchQuery}
      setSearchQuery={matchCtx.setSearchQuery}
      bottomNavTab={matchCtx.bottomNavTab}
      setBottomNavTab={matchCtx.setBottomNavTab}
      matchesSubTab={matchCtx.matchesSubTab}
      setMatchesSubTab={matchCtx.setMatchesSubTab}
      statsCategory={matchCtx.statsCategory}
      setStatsCategory={matchCtx.setStatsCategory}
      refreshing={matchCtx.refreshing}
      handlePullToRefresh={matchCtx.handlePullToRefresh}
      setupPlayerNames={matchCtx.setupPlayerNames}
      setSelectedPlayerName={matchCtx.setSelectedPlayerName}
      setCurrentScreen={matchCtx.setCurrentScreen}
      activeMatchVisible={matchCtx.activeMatchVisible}
      visibleLiveMatches={matchCtx.visibleLiveMatches}
      recentFinishedMatches={matchCtx.recentFinishedMatches}
      visibleFinishedMatches={matchCtx.visibleFinishedMatches}
      finishedArchive={matchCtx.finishedArchive}
      setSelectedMatch={matchCtx.setSelectedMatch}
      activeMatch={matchCtx.activeMatch}
      setActiveMatch={matchCtx.setActiveMatch}
      TOP_BATTERS={matchCtx.TOP_BATTERS}
      TOP_BOWLERS={matchCtx.TOP_BOWLERS}
      TOP_ALLROUNDERS={matchCtx.TOP_ALLROUNDERS}
      localPlayersList={matchCtx.localPlayersList}
      getSetupPlayerProfile={matchCtx.getSetupPlayerProfile}
      setSelectedPlayerProfile={matchCtx.setSelectedPlayerProfile}
      onJoinMatchByCode={matchCtx.handleJoinMatchByCode}
    />
  );
}

function PublicLiveViewScreenRoute() {
  const {
    activeMatch,
    publicLiveTab,
    setPublicLiveTab,
    liveViewReturnScreen,
    setCurrentScreen,
    setSelectedPlayerProfile,
    refreshing,
    handlePullToRefresh,
    setPlayingXiVisible
  } = useMatch();

  const handleOpenPlayerProfile = (profile) => {
    if (setSelectedPlayerProfile) {
      setSelectedPlayerProfile(profile);
    }
    if (setCurrentScreen) {
      setCurrentScreen('playerProfile');
    }
  };

  return (
    <PublicLiveViewScreen
      activeMatch={activeMatch}
      publicLiveTab={publicLiveTab}
      setPublicLiveTab={setPublicLiveTab}
      liveViewReturnScreen={liveViewReturnScreen}
      setCurrentScreen={setCurrentScreen}
      handleOpenPlayerProfile={handleOpenPlayerProfile}
      refreshing={refreshing}
      handlePullToRefresh={handlePullToRefresh}
      setPlayingXiVisible={setPlayingXiVisible}
    />
  );
}

function FinishedMatchViewScreenRoute() {
  const {
    selectedMatch,
    activeMatch,
    finishedMatches = [],
    setCurrentScreen,
    setSelectedPlayerProfile,
    handleRematch,
    refreshing,
    handlePullToRefresh,
    setPlayingXiVisible
  } = useMatch();

  const handleOpenPlayerProfile = (profile) => {
    if (setSelectedPlayerProfile) {
      setSelectedPlayerProfile(profile);
    }
    if (setCurrentScreen) {
      setCurrentScreen('playerProfile');
    }
  };

  const finishedMatchSnapshot =
    (selectedMatch?.id ? selectedMatch : null) ||
    (activeMatch && (activeMatch.phase === 'result' || activeMatch.resultText)
      ? buildFinishedMatch(activeMatch)
      : null) ||
    selectedMatch ||
    finishedMatches[0];

  return (
    <FinishedMatchViewScreen
      match={finishedMatchSnapshot}
      setCurrentScreen={setCurrentScreen}
      handleOpenPlayerProfile={handleOpenPlayerProfile}
      handleRematch={handleRematch}
      refreshing={refreshing}
      handlePullToRefresh={handlePullToRefresh}
      setPlayingXiVisible={setPlayingXiVisible}
    />
  );
}

function PlayerProfileScreenRoute() {
  const {
    selectedPlayerProfile,
    setCurrentScreen,
    finishedArchive = [],
    setSelectedMatch
  } = useMatch();

  return (
    <MyProfileScreen
      targetPlayer={selectedPlayerProfile}
      onBack={() => setCurrentScreen('home')}
      finishedMatches={finishedArchive}
      onSelectMatch={(m) => {
        if (setSelectedMatch) setSelectedMatch(m);
        if (setCurrentScreen) setCurrentScreen('finishedView');
      }}
    />
  );
}

function QuickMatchSetupScreenRoute() {
  const {
    savedTeamsList = [],
    rematchSetup,
    setRematchSetup,
    handleStartQuickMatch,
    setCurrentScreen
  } = useMatch();

  return (
    <View style={styles.fullPage}>
      <QuickMatchSetupScreen
        savedTeamsList={savedTeamsList}
        initialSetup={rematchSetup}
        onStartMatch={(setupData) => {
          if (setRematchSetup) setRematchSetup(null);
          if (handleStartQuickMatch) handleStartQuickMatch(setupData);
        }}
        onCancel={() => {
          if (setRematchSetup) setRematchSetup(null);
          if (setCurrentScreen) setCurrentScreen('home');
        }}
      />
    </View>
  );
}

function ScorerConsoleScreenRoute() {
  const {
    activeMatch,
    savedTeamsList = [],
    rematchSetup,
    setRematchSetup,
    handleStartQuickMatch,
    setCurrentScreen,
    setSelectedPlayerProfile,
    handleRematch,
    refreshing,
    handlePullToRefresh,
    getRosterForTeam,
    inn2Striker,
    inn2NonStriker,
    inn2Bowler,
    handleSelectInning2Opener,
    setInn2Bowler,
    renderSetupPlayerPhoto,
    handleStartInning2,
    handleStartNewMatchSetup,
    getBattingRoster,
    getBowlingRoster,
    handleRecordBall,
    handleWicketPress,
    handleUndo,
    handleRedo,
    handleSwapStrike,
    handleRetireBatsman,
    setExtrasSheetVisible,
    setIsEditSquadModalOpen,
    setNextBowlerName,
    setBowlerChangePending,
    setPlayingXiVisible
  } = useMatch();

  const handleOpenPlayerProfile = (profile) => {
    if (setSelectedPlayerProfile) {
      setSelectedPlayerProfile(profile);
    }
    if (setCurrentScreen) {
      setCurrentScreen('playerProfile');
    }
  };

  if (!activeMatch) {
    return (
      <View style={styles.fullPage}>
        <QuickMatchSetupScreen
          savedTeamsList={savedTeamsList}
          initialSetup={rematchSetup}
          onStartMatch={(setupData) => {
            if (setRematchSetup) setRematchSetup(null);
            if (handleStartQuickMatch) handleStartQuickMatch(setupData);
          }}
          onCancel={() => {
            if (setRematchSetup) setRematchSetup(null);
            if (setCurrentScreen) setCurrentScreen('home');
          }}
        />
      </View>
    );
  }

  if (activeMatch.phase === 'result') {
    const finishedSnapshot = buildFinishedMatch(activeMatch);
    return (
      <FinishedMatchViewScreen
        match={finishedSnapshot}
        setCurrentScreen={setCurrentScreen}
        handleOpenPlayerProfile={handleOpenPlayerProfile}
        handleRematch={handleRematch}
        refreshing={refreshing}
        handlePullToRefresh={handlePullToRefresh}
        setPlayingXiVisible={setPlayingXiVisible}
      />
    );
  }

  if (activeMatch.phase === 'inningBreak') {
    return (
      <InningBreakScreen
        activeMatch={activeMatch}
        getRosterForTeam={getRosterForTeam}
        inn2Striker={inn2Striker}
        inn2NonStriker={inn2NonStriker}
        inn2Bowler={inn2Bowler}
        handleSelectInning2Opener={handleSelectInning2Opener}
        setInn2Bowler={setInn2Bowler}
        renderSetupPlayerPhoto={renderSetupPlayerPhoto}
        handleStartInning2={handleStartInning2}
      />
    );
  }

  const innIdx = (activeMatch?.inning || 1) - 1;
  const inn = activeMatch?.innings?.[innIdx] || activeMatch?.innings?.[0];
  if (!inn?.battingTeam || !inn?.bowlingTeam) {
    return (
      <View style={styles.emptyStateContainer}>
        <Ionicons name="alert-circle-outline" size={32} color="#0284C7" />
        <Text style={styles.emptyStateTitle}>No Active Match Selected</Text>
        <Text style={styles.emptyStateSubtitle}>
          Start a new match setup or unlock an existing match to score.
        </Text>
        <TouchableOpacity
          onPress={handleStartNewMatchSetup}
          style={styles.emptyStateBtn}
        >
          <Text style={styles.emptyStateBtnText}>+ START NEW MATCH</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScorerConsoleScreen
      activeMatch={activeMatch}
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
    />
  );
}

function InningBreakScreenRoute() {
  const {
    activeMatch,
    getRosterForTeam,
    inn2Striker,
    inn2NonStriker,
    inn2Bowler,
    handleSelectInning2Opener,
    setInn2Bowler,
    renderSetupPlayerPhoto,
    handleStartInning2
  } = useMatch();

  return (
    <InningBreakScreen
      activeMatch={activeMatch}
      getRosterForTeam={getRosterForTeam}
      inn2Striker={inn2Striker}
      inn2NonStriker={inn2NonStriker}
      inn2Bowler={inn2Bowler}
      handleSelectInning2Opener={handleSelectInning2Opener}
      setInn2Bowler={setInn2Bowler}
      renderSetupPlayerPhoto={renderSetupPlayerPhoto}
      handleStartInning2={handleStartInning2}
    />
  );
}

function MatchesScreenRoute() {
  const matchCtx = useMatch();
  return (
    <MatchesScreen
      {...matchCtx}
      onSelectMatch={(m) => {
        if (matchCtx.setSelectedMatch) matchCtx.setSelectedMatch(m);
        if (matchCtx.setCurrentScreen) matchCtx.setCurrentScreen('finishedView');
      }}
    />
  );
}

function RankingsScreenRoute() {
  const {
    TOP_BATTERS = [],
    TOP_BOWLERS = [],
    TOP_ALLROUNDERS = [],
    setSelectedPlayerProfile,
    setCurrentScreen,
    refreshing,
    handlePullToRefresh
  } = useMatch();

  return (
    <RankingsScreen
      topBatters={TOP_BATTERS}
      topBowlers={TOP_BOWLERS}
      topAllRounders={TOP_ALLROUNDERS}
      onSelectPlayer={(playerName, meta) => {
        if (setSelectedPlayerProfile) setSelectedPlayerProfile({ name: playerName, ...meta });
        if (setCurrentScreen) setCurrentScreen('playerProfile');
      }}
      refreshing={refreshing}
      onRefresh={handlePullToRefresh}
    />
  );
}

// ── Main App Router & Navigator ──

export function AppNavigator(props) {
  const matchCtx = useMatch();
  const merged = { ...(matchCtx || {}), ...props };

  const {
    activeMatch,
    selectedMatch,
    setSelectedMatch,
    selectedPlayerName,
    setSelectedPlayerName,
    selectedPlayerProfile,
    setSelectedPlayerProfile,
    setCurrentScreen,
    setBottomNavTab,
    setMatchesSubTab,
    handleStartNewMatchSetup,
    handleRematch,
    playingXiVisible,
    setPlayingXiVisible,
    curInning,
    getBowlingRoster,
    getAvailableBatsmen,
    getAvailableBowlers,
    handleRecordBall,
    cancelWicketEntry,
    handleSelectWicketType,
    handleSelectDismissalFielder,
    handleConfirmRunOut,
    selectNewBatsman,
    newBatsmanName,
    setNewBatsmanName,
    handleNewBowler,
    nextBowlerName,
    setNextBowlerName,
    extrasSheetVisible,
    setExtrasSheetVisible,
    wicketPending,
    setWicketPending,
    wicketEntryPending,
    pendingFielderDismissal,
    setPendingFielderDismissal,
    runOutPending,
    runOutDismissed,
    setRunOutDismissed,
    runOutEnd,
    setRunOutEnd,
    runOutRuns,
    setRunOutRuns,
    bowlerChangePending,
    setBowlerChangePending,
    isEditSquadModalOpen,
    setIsEditSquadModalOpen,
    isAddPlayerModalOpen,
    setIsAddPlayerModalOpen,
    isAddingPlayer,
    handleMidMatchMoveToTeam,
    handleMidMatchCreatePlayer,
    newPlayerRoleInput,
    setNewPlayerRoleInput,
    newPlayerPhoneInput,
    setNewPlayerPhoneInput,
    selectedLocalImageUri,
    setSelectedLocalImageUri,
    allMidMatchPlayersPool = [],
    scorerPinModalVisible,
    setScorerPinModalVisible,
    handleScorerPinSuccess,
    matchCompleteModalVisible,
    setMatchCompleteModalVisible
  } = merged;

  return (
    <View style={styles.rootContainer}>
      {/* 1. REACT NAVIGATION NATIVE STACK CONTAINER */}
      <NavigationContainer
        ref={navigationRef}
        onStateChange={() => {
          const currentRoute = navigationRef.getCurrentRoute();
          if (currentRoute?.name && ROUTE_SCREEN_MAP[currentRoute.name]) {
            // Keep currentScreen in sync
          }
        }}
      >
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: '#071B2C' }
          }}
        >
          <Stack.Screen name="Home" component={HomeScreenRoute} />
          <Stack.Screen name="QuickMatchSetup" component={QuickMatchSetupScreenRoute} />
          <Stack.Screen name="ScorerConsole" component={ScorerConsoleScreenRoute} />
          <Stack.Screen name="PublicLiveView" component={PublicLiveViewScreenRoute} />
          <Stack.Screen name="FinishedMatchView" component={FinishedMatchViewScreenRoute} />
          <Stack.Screen
            name="PlayerProfile"
            component={PlayerProfileScreenRoute}
          />
          <Stack.Screen name="InningBreak" component={InningBreakScreenRoute} />
          <Stack.Screen name="Matches" component={MatchesScreenRoute} />
          <Stack.Screen name="Rankings" component={RankingsScreenRoute} />
        </Stack.Navigator>
      </NavigationContainer>

      {/* 2. SHARED CRICKET MODAL OVERLAYS (Root Level) */}
      <ExtrasModal
        visible={Boolean(extrasSheetVisible)}
        onClose={() => setExtrasSheetVisible(false)}
        onRecordBall={handleRecordBall}
        handleRecordBall={handleRecordBall}
      />

      <PlayingXiModal
        visible={Boolean(playingXiVisible)}
        onClose={() => setPlayingXiVisible(false)}
        match={activeMatch || selectedMatch}
      />

      <WicketDismissalModal
        visible={Boolean(wicketEntryPending)}
        onRequestClose={() => pendingFielderDismissal ? setPendingFielderDismissal('') : cancelWicketEntry()}
        pendingFielderDismissal={pendingFielderDismissal}
        setPendingFielderDismissal={setPendingFielderDismissal}
        cancelWicketEntry={cancelWicketEntry}
        curInning={curInning}
        getBowlingRoster={getBowlingRoster}
        handleSelectDismissalFielder={handleSelectDismissalFielder}
        handleSelectWicketType={handleSelectWicketType}
      />

      <RunOutModal
        visible={Boolean(runOutPending)}
        onClose={cancelWicketEntry}
        curInning={curInning}
        runOutDismissed={runOutDismissed}
        setRunOutDismissed={setRunOutDismissed}
        runOutEnd={runOutEnd}
        setRunOutEnd={setRunOutEnd}
        runOutRuns={runOutRuns}
        setRunOutRuns={setRunOutRuns}
        onConfirmRunOut={handleConfirmRunOut}
      />

      <WicketPendingModal
        visible={Boolean(wicketPending)}
        onClose={() => setWicketPending(false)}
        curInning={curInning}
        availableBatsmen={getAvailableBatsmen ? getAvailableBatsmen() : []}
        newBatsmanName={newBatsmanName}
        setNewBatsmanName={setNewBatsmanName}
        onSelectBatsman={selectNewBatsman}
        onAddPlayerMidMatch={() => setIsAddPlayerModalOpen(true)}
      />

      <BowlerChangeModal
        visible={Boolean(bowlerChangePending)}
        onClose={() => setBowlerChangePending(false)}
        curInning={curInning}
        availableBowlers={getAvailableBowlers ? getAvailableBowlers() : []}
        nextBowlerName={nextBowlerName}
        setNextBowlerName={setNextBowlerName}
        onSelectBowler={handleNewBowler}
        onAddPlayerMidMatch={() => setIsAddPlayerModalOpen(true)}
      />

      <SquadSelectorModal
        visible={Boolean(isEditSquadModalOpen)}
        onClose={() => setIsEditSquadModalOpen(false)}
        activeMatch={activeMatch}
        onMovePlayer={handleMidMatchMoveToTeam}
        allPlayersPool={allMidMatchPlayersPool}
        onOpenAddPlayerModal={() => setIsAddPlayerModalOpen(true)}
      />

      <AddPlayerModal
        visible={Boolean(isAddPlayerModalOpen)}
        onClose={() => setIsAddPlayerModalOpen(false)}
        newPlayerName={newBatsmanName || nextBowlerName}
        setNewPlayerName={(n) => {
          if (wicketPending) setNewBatsmanName(n);
          else if (bowlerChangePending) setNextBowlerName(n);
        }}
        newPlayerRole={newPlayerRoleInput}
        setNewPlayerRole={setNewPlayerRoleInput}
        newPlayerPhone={newPlayerPhoneInput}
        setNewPlayerPhone={setNewPlayerPhoneInput}
        selectedImageUri={selectedLocalImageUri}
        setSelectedImageUri={setSelectedLocalImageUri}
        onAddPlayer={handleMidMatchCreatePlayer}
        isAddingPlayer={isAddingPlayer}
      />

      <ScorerPinModal
        visible={Boolean(scorerPinModalVisible)}
        onClose={() => setScorerPinModalVisible(false)}
        onSuccess={handleScorerPinSuccess}
      />

      <MatchCompleteModal
        visible={Boolean(matchCompleteModalVisible)}
        match={activeMatch}
        onClose={() => setMatchCompleteModalVisible(false)}
        onViewScorecard={() => {
          setMatchCompleteModalVisible(false);
          if (setSelectedMatch && activeMatch) setSelectedMatch(buildFinishedMatch(activeMatch));
          if (setBottomNavTab) setBottomNavTab('matches');
          if (setMatchesSubTab) setMatchesSubTab('finished');
          if (setCurrentScreen) setCurrentScreen('finishedView');
        }}
        onNewMatch={() => {
          setMatchCompleteModalVisible(false);
          if (handleStartNewMatchSetup) handleStartNewMatchSetup();
        }}
        onStartRematch={() => {
          setMatchCompleteModalVisible(false);
          if (handleRematch) handleRematch();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#071B2C'
  },
  fullPage: {
    flex: 1,
    backgroundColor: '#071B2C'
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#071B2C',
    gap: 12
  },
  emptyStateTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: systemFontBold,
    textAlign: 'center'
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    fontFamily: systemFont,
    textAlign: 'center',
    lineHeight: 19
  },
  emptyStateBtn: {
    marginTop: 10,
    backgroundColor: '#0284C7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10
  },
  emptyStateBtnText: {
    color: '#FFFFFF',
    fontFamily: systemFontBold,
    fontSize: 13,
    letterSpacing: 0.5
  }
});

export default AppNavigator;
