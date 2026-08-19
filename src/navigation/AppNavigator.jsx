import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { systemFontBold } from '../theme.js';

// Screens
import { HomeScreen } from '../screens/HomeScreen.jsx';
import { PublicLiveViewScreen } from '../screens/PublicLiveViewScreen.jsx';
import { FinishedMatchViewScreen } from '../screens/FinishedMatchViewScreen.jsx';
import { MyProfileScreen } from '../screens/MyProfileScreen.jsx';
import { QuickMatchSetupScreen } from '../screens/QuickMatchSetupScreen.jsx';
import { ScorerConsoleScreen } from '../screens/ScorerConsoleScreen.jsx';
import { InningBreakScreen } from '../screens/InningBreakScreen.jsx';
import { TournamentScreen } from '../components/TournamentScreen.jsx';

export const AppNavigator = ({
  currentScreen = 'home',
  setCurrentScreen,
  // Live View Props
  activeMatch,
  publicLiveTab,
  setPublicLiveTab,
  liveViewReturnScreen,
  onJoinMatchByCode,
  setPlayingXiTeamTab,
  setPlayingXiVisible,
  playingXiPagerScrollX,
  // Finished View Props
  selectedMatch,
  finishedMatches = [],
  finishedArchive = [],
  setSelectedMatch,
  finishedTab,
  setFinishedTab,
  finishedInningIndex,
  setFinishedInningIndex,
  // Profile Props
  selectedPlayerProfile,
  setSelectedPlayerProfile,
  // Setup & Scorer Wizard Props
  savedTeamsList,
  rematchSetup,
  setRematchSetup,
  handleStartQuickMatch,
  handleRematch,
  // Scorer Console Props
  getBattingRoster,
  getBowlingRoster,
  handleRecordBall,
  handleWicketPress,
  handleUndo,
  handleRedo,
  handleSwapStrike,
  handleRetireBatsman,
  handleOpenPlayerProfile,
  setExtrasSheetVisible,
  setIsEditSquadModalOpen,
  setNextBowlerName,
  setBowlerChangePending,
  handleStartNewMatchSetup,
  // Inning Break Props
  getRosterForTeam,
  inn2Striker,
  inn2NonStriker,
  inn2Bowler,
  handleSelectInning2Opener,
  setInn2Bowler,
  renderSetupPlayerPhoto,
  handleStartInning2,
  // Shared Refresh & Dashboard Props
  refreshing,
  handlePullToRefresh,
  openScorerScreen,
  searchQuery,
  setSearchQuery,
  bottomNavTab,
  setBottomNavTab,
  matchesSubTab,
  setMatchesSubTab,
  statsCategory,
  setStatsCategory,
  setupPlayerNames,
  setSelectedPlayerName,
  activeMatchVisible,
  visibleLiveMatches,
  renderActiveMatchListCard,
  recentFinishedMatches,
  renderFinishedMatchListCard,
  visibleFinishedMatches,
  TOP_BATTERS,
  TOP_BOWLERS,
  TOP_ALLROUNDERS,
  localPlayersList,
  MASTER_PLAYERS_DB,
  getSetupPlayerProfile
}) => {
  // 1. PUBLIC LIVE VIEW
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
        setPlayingXiTeamTab={setPlayingXiTeamTab}
        setPlayingXiVisible={setPlayingXiVisible}
        playingXiPagerScrollX={playingXiPagerScrollX}
      />
    );
  }

  // 2. FINISHED MATCH DETAILS VIEW
  if (currentScreen === 'finishedView') {
    const f = (selectedMatch?.id ? selectedMatch : null)
      || (activeMatch && (activeMatch.phase === 'result' || activeMatch.resultText) ? activeMatch : null)
      || selectedMatch
      || finishedMatches[0];

    return (
      <FinishedMatchViewScreen
        match={f}
        finishedTab={finishedTab}
        setFinishedTab={setFinishedTab}
        finishedInningIndex={finishedInningIndex}
        setFinishedInningIndex={setFinishedInningIndex}
        setCurrentScreen={setCurrentScreen}
        handleOpenPlayerProfile={handleOpenPlayerProfile}
        handleRematch={handleRematch}
        refreshing={refreshing}
        handlePullToRefresh={handlePullToRefresh}
      />
    );
  }

  // 3. PLAYER PROFILE & CAREER STATS
  if (currentScreen === 'playerProfile') {
    return (
      <MyProfileScreen
        targetPlayer={selectedPlayerProfile}
        onBack={() => setCurrentScreen('home')}
        finishedMatches={finishedArchive}
        onSelectMatch={(m) => {
          if (setSelectedMatch) setSelectedMatch(m);
          setCurrentScreen('finishedView');
        }}
      />
    );
  }

  // 4. SCORER WIZARD & CONSOLE
  if (currentScreen === 'scorerWizard') {
    return (
      <View style={styles.fullPage}>
        {activeMatch ? (
          activeMatch.phase === 'result' ? (
            <FinishedMatchViewScreen
              match={activeMatch}
              finishedTab={finishedTab}
              setFinishedTab={setFinishedTab}
              finishedInningIndex={finishedInningIndex}
              setFinishedInningIndex={setFinishedInningIndex}
              setCurrentScreen={setCurrentScreen}
              handleOpenPlayerProfile={handleOpenPlayerProfile}
              handleRematch={handleRematch}
              refreshing={refreshing}
              handlePullToRefresh={handlePullToRefresh}
            />
          ) : activeMatch.phase === 'inningBreak' ? (
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
          ) : (
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
          )
        ) : (
          <QuickMatchSetupScreen
            savedTeamsList={savedTeamsList}
            initialSetup={rematchSetup}
            onStartMatch={(setupData) => {
              if (setRematchSetup) setRematchSetup(null);
              handleStartQuickMatch(setupData);
            }}
            onCancel={() => {
              if (setRematchSetup) setRematchSetup(null);
              setCurrentScreen('home');
            }}
          />
        )}
      </View>
    );
  }

  // 5. TOURNAMENT & LEAGUE SCREEN
  if (currentScreen === 'tournament') {
    return (
      <View style={{ flex: 1 }}>
        <View style={{ backgroundColor: '#071B2C', paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#123A56' }}>
          <TouchableOpacity onPress={() => setCurrentScreen('home')} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontFamily: systemFontBold }}>Tournaments & Leagues</Text>
          </TouchableOpacity>
        </View>
        <TournamentScreen finishedMatches={finishedMatches} activeMatch={activeMatch} />
      </View>
    );
  }

  // 6. DEFAULT / HOME SCREEN
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
      renderActiveMatchListCard={renderActiveMatchListCard}
      recentFinishedMatches={recentFinishedMatches}
      renderFinishedMatchListCard={renderFinishedMatchListCard}
      visibleFinishedMatches={visibleFinishedMatches}
      finishedArchive={finishedArchive}
      setSelectedMatch={setSelectedMatch}
      activeMatch={activeMatch}
      TOP_BATTERS={TOP_BATTERS}
      TOP_BOWLERS={TOP_BOWLERS}
      TOP_ALLROUNDERS={TOP_ALLROUNDERS}
      localPlayersList={localPlayersList}
      MASTER_PLAYERS_DB={MASTER_PLAYERS_DB}
      getSetupPlayerProfile={getSetupPlayerProfile}
      setSelectedPlayerProfile={setSelectedPlayerProfile}
      onJoinMatchByCode={onJoinMatchByCode}
    />
  );
};

const styles = StyleSheet.create({
  fullPage: { flex: 1, backgroundColor: '#F8FAFC' }
});

export default AppNavigator;
