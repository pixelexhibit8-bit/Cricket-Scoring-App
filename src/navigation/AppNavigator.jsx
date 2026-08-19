import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from '../screens/HomeScreen.jsx';
import { ScorerConsoleScreen } from '../screens/ScorerConsoleScreen.jsx';
import { InningBreakScreen } from '../screens/InningBreakScreen.jsx';
import { PublicLiveViewScreen } from '../screens/PublicLiveViewScreen.jsx';
import { FinishedMatchViewScreen } from '../screens/FinishedMatchViewScreen.jsx';
import { MyProfileScreen } from '../screens/MyProfileScreen.jsx';
import { QuickMatchSetupScreen } from '../screens/QuickMatchSetupScreen.jsx';

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
import { systemFont, fontWeights } from '../theme.js';

export function AppNavigator({
  currentScreen,
  setCurrentScreen,

  // Match states & handlers
  activeMatch,
  setActiveMatch,
  selectedMatch,
  setSelectedMatch,
  finishedArchive = [],
  finishedMatches = [],
  visibleLiveMatches = [],
  recentFinishedMatches = [],
  visibleFinishedMatches = [],
  activeMatchVisible = false,

  // Actions
  openScorerScreen,
  handleStartNewMatchSetup,
  handleStartQuickMatch,
  handleRematch,
  rematchSetup,
  setRematchSetup,
  handleJoinMatchByCode,

  // Home Navigation
  searchQuery,
  setSearchQuery,
  bottomNavTab,
  setBottomNavTab,
  matchesSubTab,
  setMatchesSubTab,
  statsCategory,
  setStatsCategory,
  refreshing,
  handlePullToRefresh,
  setupPlayerNames,
  setSelectedPlayerName,

  // Profile & Players
  selectedPlayerProfile,
  setSelectedPlayerProfile,
  localPlayersList = [],
  MASTER_PLAYERS_DB = [],
  getSetupPlayerProfile,
  renderSetupPlayerPhoto,
  savedTeamsList = [],

  // Leaderboard
  TOP_BATTERS = [],
  TOP_BOWLERS = [],
  TOP_ALLROUNDERS = [],

  // Live Screen props
  publicLiveTab,
  setPublicLiveTab,
  liveViewReturnScreen,
  playingXiVisible,
  setPlayingXiVisible,

  // Scorer Console & Modals props
  curInning,
  getBattingRoster,
  getBowlingRoster,
  getRosterForTeam,
  getAvailableBatsmen,
  getAvailableBowlers,
  handleRecordBall,
  handleWicketPress,
  cancelWicketEntry,
  handleSelectWicketType,
  handleSelectDismissalFielder,
  handleConfirmRunOut,
  selectNewBatsman,
  handleNewBatsman,
  newBatsmanName,
  setNewBatsmanName,
  handleNewBowler,
  nextBowlerName,
  setNextBowlerName,
  handleUndo,
  handleRedo,
  handleSwapStrike,
  handleRetireBatsman,

  // Modal States
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

  // Squad edit mid match
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

  // Scorer Pin & Match Complete
  scorerPinModalVisible,
  setScorerPinModalVisible,
  handleScorerPinSuccess,
  setIsScorerUnlocked,
  matchCompleteModalVisible,
  setMatchCompleteModalVisible,

  // Inning Break props
  inn2Striker,
  inn2NonStriker,
  inn2Bowler,
  handleSelectInning2Opener,
  setInn2Bowler,
  handleStartInning2
}) {
  const handleOpenPlayerProfile = (profile) => {
    if (setSelectedPlayerProfile) {
      setSelectedPlayerProfile(profile);
    }
    if (setCurrentScreen) {
      setCurrentScreen('playerProfile');
    }
  };

  const renderActiveScreen = () => {
    // 1. PUBLIC LIVE SCORECARD VIEW
    if (currentScreen === 'liveView') {
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

    // 2. FINISHED MATCH VIEW
    if (currentScreen === 'finishedView') {
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
        />
      );
    }

    // 3. PLAYER PROFILE SCREEN
    if (currentScreen === 'playerProfile') {
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

    // 4. SCORER WIZARD & CONSOLE FLOW
    if (currentScreen === 'scorerWizard') {
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

      // Default Scorer Live Console
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

    // 5. DEFAULT HOME DASHBOARD SCREEN
    return (
      <HomeScreen
        openScorerScreen={openScorerScreen}
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
        setCurrentScreen={setCurrentScreen}
        activeMatchVisible={activeMatchVisible}
        visibleLiveMatches={visibleLiveMatches}
        recentFinishedMatches={recentFinishedMatches}
        visibleFinishedMatches={visibleFinishedMatches}
        finishedArchive={finishedArchive}
        setSelectedMatch={setSelectedMatch}
        activeMatch={activeMatch}
        setActiveMatch={setActiveMatch}
        TOP_BATTERS={TOP_BATTERS}
        TOP_BOWLERS={TOP_BOWLERS}
        TOP_ALLROUNDERS={TOP_ALLROUNDERS}
        localPlayersList={localPlayersList}
        MASTER_PLAYERS_DB={MASTER_PLAYERS_DB}
        getSetupPlayerProfile={getSetupPlayerProfile}
        setSelectedPlayerProfile={setSelectedPlayerProfile}
        onJoinMatchByCode={handleJoinMatchByCode}
      />
    );
  };

  return (
    <View style={styles.rootContainer}>
      {/* 1. ACTIVE MAIN SCREEN */}
      {renderActiveScreen()}

      {/* 2. SHARED CRICKET MODAL OVERLAYS */}
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
        handleConfirmRunOut={handleConfirmRunOut}
      />

      <WicketPendingModal
        visible={Boolean(wicketPending)}
        onClose={() => setWicketPending(false)}
        curInning={curInning}
        getAvailableBatsmen={getAvailableBatsmen}
        selectNewBatsman={selectNewBatsman}
        newBatsmanName={newBatsmanName}
        setNewBatsmanName={setNewBatsmanName}
        handleNewBatsman={handleNewBatsman}
      />

      <BowlerChangeModal
        visible={Boolean(bowlerChangePending)}
        onClose={() => setBowlerChangePending(false)}
        activeMatch={activeMatch}
        setActiveMatch={setActiveMatch}
        curInning={curInning}
        getAvailableBowlers={getAvailableBowlers}
        nextBowlerName={nextBowlerName}
        setNextBowlerName={setNextBowlerName}
        handleNewBowler={handleNewBowler}
      />

      <SquadSelectorModal
        visible={Boolean(isEditSquadModalOpen)}
        onClose={() => setIsEditSquadModalOpen(false)}
        team1Name={activeMatch?.teams?.[0]?.name || activeMatch?.innings?.[0]?.battingTeam?.name || 'Team 1'}
        team2Name={activeMatch?.teams?.[1]?.name || activeMatch?.innings?.[0]?.bowlingTeam?.name || 'Team 2'}
        team1LogoKey={activeMatch?.teams?.[0]?.logoKey || 'csk'}
        team2LogoKey={activeMatch?.teams?.[1]?.logoKey || 'rcb'}
        team1Roster={activeMatch?.playingXI?.[activeMatch?.teams?.[0]?.name] || []}
        team2Roster={activeMatch?.playingXI?.[activeMatch?.teams?.[1]?.name] || []}
        allPlayersPool={allMidMatchPlayersPool}
        localPlayersDb={localPlayersList}
        onMoveToTeam={handleMidMatchMoveToTeam}
        onOpenAddPlayerModal={() => setIsAddPlayerModalOpen(true)}
        onOpenSquadPreview={() => { }}
        onEditPlayerPhoto={() => { }}
      />

      <AddPlayerModal
        visible={Boolean(isAddPlayerModalOpen)}
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
        visible={Boolean(scorerPinModalVisible)}
        activeMatch={activeMatch}
        onClose={() => setScorerPinModalVisible(false)}
        onSuccessContinueMatch={handleScorerPinSuccess}
        onSuccessRemoteMatch={(remoteMatch) => {
          if (remoteMatch && setActiveMatch) {
            setActiveMatch(remoteMatch);
          }
          if (setIsScorerUnlocked) setIsScorerUnlocked(true);
          if (setScorerPinModalVisible) setScorerPinModalVisible(false);
          if (setCurrentScreen) setCurrentScreen('scorerWizard');
        }}
        onSelectStartNewMatch={handleStartNewMatchSetup}
      />

      <MatchCompleteModal
        visible={Boolean(matchCompleteModalVisible)}
        match={activeMatch}
        onClose={() => setMatchCompleteModalVisible(false)}
        onStartRematch={() => {
          if (setMatchCompleteModalVisible) setMatchCompleteModalVisible(false);
          if (handleRematch) handleRematch(activeMatch);
        }}
        onViewScorecard={() => {
          if (setMatchCompleteModalVisible) setMatchCompleteModalVisible(false);
          if (setFinishedTab) setFinishedTab('scorecard');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1
  },
  fullPage: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC'
  },
  emptyStateTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: fontWeights.bold,
    marginTop: 10,
    textAlign: 'center',
    fontFamily: systemFont
  },
  emptyStateSubtitle: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: fontWeights.semibold,
    marginTop: 6,
    textAlign: 'center',
    fontFamily: systemFont
  },
  emptyStateBtn: {
    minHeight: 42,
    marginTop: 16,
    paddingHorizontal: 18,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7'
  },
  emptyStateBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: fontWeights.bold,
    fontFamily: systemFont
  }
});
export default AppNavigator;
