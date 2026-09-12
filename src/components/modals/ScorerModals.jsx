import React from 'react';
import { useMatch } from '../../context/MatchContext.jsx';
import { buildFinishedMatch } from '../../utils/cricketUtils.js';

import { ExtrasModal } from './ExtrasModal.jsx';
import { WicketDismissalModal } from './WicketDismissalModal.jsx';
import { RunOutModal } from './RunOutModal.jsx';
import { WicketPendingModal } from './WicketPendingModal.jsx';
import { BowlerChangeModal } from './BowlerChangeModal.jsx';
import { SquadSelectorModal } from './SquadSelectorModal.jsx';
import { AddPlayerModal } from './AddPlayerModal.jsx';
import { ScorerPinModal } from './ScorerPinModal.jsx';
import { MatchCompleteModal } from './MatchCompleteModal.jsx';

export function ScorerModals(props = {}) {
  const matchCtx = useMatch() || {};
  const {
    activeMatch = matchCtx.activeMatch,
    selectedMatch = matchCtx.selectedMatch,
    setSelectedMatch = matchCtx.setSelectedMatch,
    setCurrentScreen = matchCtx.setCurrentScreen,
    setBottomNavTab = matchCtx.setBottomNavTab,
    setMatchesSubTab = matchCtx.setMatchesSubTab,
    handleStartNewMatchSetup = matchCtx.handleStartNewMatchSetup,
    handleRematch = matchCtx.handleRematch,
    curInning = matchCtx.curInning,
    getBowlingRoster = matchCtx.getBowlingRoster,
    getAvailableBatsmen = matchCtx.getAvailableBatsmen,
    getAvailableBowlers = matchCtx.getAvailableBowlers,
    handleRecordBall = matchCtx.handleRecordBall,
    cancelWicketEntry = matchCtx.cancelWicketEntry,
    handleSelectWicketType = matchCtx.handleSelectWicketType,
    handleSelectDismissalFielder = matchCtx.handleSelectDismissalFielder,
    handleConfirmRunOut = matchCtx.handleConfirmRunOut,
    selectNewBatsman = matchCtx.selectNewBatsman,
    newBatsmanName = matchCtx.newBatsmanName,
    setNewBatsmanName = matchCtx.setNewBatsmanName,
    handleNewBowler = matchCtx.handleNewBowler,
    nextBowlerName = matchCtx.nextBowlerName,
    setNextBowlerName = matchCtx.setNextBowlerName,
    extrasSheetVisible = matchCtx.extrasSheetVisible,
    setExtrasSheetVisible = matchCtx.setExtrasSheetVisible,
    wicketPending = matchCtx.wicketPending,
    setWicketPending = matchCtx.setWicketPending,
    wicketEntryPending = matchCtx.wicketEntryPending,
    pendingFielderDismissal = matchCtx.pendingFielderDismissal,
    setPendingFielderDismissal = matchCtx.setPendingFielderDismissal,
    runOutPending = matchCtx.runOutPending,
    runOutDismissed = matchCtx.runOutDismissed,
    setRunOutDismissed = matchCtx.setRunOutDismissed,
    runOutEnd = matchCtx.runOutEnd,
    setRunOutEnd = matchCtx.setRunOutEnd,
    runOutRuns = matchCtx.runOutRuns,
    setRunOutRuns = matchCtx.setRunOutRuns,
    bowlerChangePending = matchCtx.bowlerChangePending,
    setBowlerChangePending = matchCtx.setBowlerChangePending,
    isEditSquadModalOpen = matchCtx.isEditSquadModalOpen,
    setIsEditSquadModalOpen = matchCtx.setIsEditSquadModalOpen,
    isAddPlayerModalOpen = matchCtx.isAddPlayerModalOpen,
    setIsAddPlayerModalOpen = matchCtx.setIsAddPlayerModalOpen,
    isAddingPlayer = matchCtx.isAddingPlayer,
    localPlayersList = matchCtx.localPlayersList || [],
    handleMidMatchMoveToTeam = matchCtx.handleMidMatchMoveToTeam,
    handleMidMatchCreatePlayer = matchCtx.handleMidMatchCreatePlayer,
    newPlayerRoleInput = matchCtx.newPlayerRoleInput,
    setNewPlayerRoleInput = matchCtx.setNewPlayerRoleInput,
    newPlayerPhoneInput = matchCtx.newPlayerPhoneInput,
    setNewPlayerPhoneInput = matchCtx.setNewPlayerPhoneInput,
    selectedLocalImageUri = matchCtx.selectedLocalImageUri,
    setSelectedLocalImageUri = matchCtx.setSelectedLocalImageUri,
    allMidMatchPlayersPool = matchCtx.allMidMatchPlayersPool || [],
    scorerPinModalVisible = matchCtx.scorerPinModalVisible,
    setScorerPinModalVisible = matchCtx.setScorerPinModalVisible,
    handleScorerPinSuccess = matchCtx.handleScorerPinSuccess,
    matchCompleteModalVisible = matchCtx.matchCompleteModalVisible,
    setMatchCompleteModalVisible = matchCtx.setMatchCompleteModalVisible
  } = { ...matchCtx, ...props };

  return (
    <>
      <ExtrasModal
        visible={Boolean(extrasSheetVisible)}
        onClose={() => setExtrasSheetVisible && setExtrasSheetVisible(false)}
        onRecordBall={handleRecordBall}
        handleRecordBall={handleRecordBall}
      />

      <WicketDismissalModal
        visible={Boolean(wicketEntryPending)}
        onRequestClose={() => pendingFielderDismissal ? (setPendingFielderDismissal && setPendingFielderDismissal('')) : (cancelWicketEntry && cancelWicketEntry())}
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
        onClose={() => setWicketPending && setWicketPending(false)}
        curInning={curInning}
        availableBatsmen={getAvailableBatsmen ? getAvailableBatsmen() : []}
        newBatsmanName={newBatsmanName}
        setNewBatsmanName={setNewBatsmanName}
        onSelectBatsman={selectNewBatsman}
        onAddPlayerMidMatch={() => setIsAddPlayerModalOpen && setIsAddPlayerModalOpen(true)}
      />

      <BowlerChangeModal
        visible={Boolean(bowlerChangePending)}
        onClose={() => setBowlerChangePending && setBowlerChangePending(false)}
        curInning={curInning}
        availableBowlers={getAvailableBowlers ? getAvailableBowlers() : []}
        nextBowlerName={nextBowlerName}
        setNextBowlerName={setNextBowlerName}
        onSelectBowler={handleNewBowler}
        onAddPlayerMidMatch={() => setIsAddPlayerModalOpen && setIsAddPlayerModalOpen(true)}
      />

      <SquadSelectorModal
        visible={Boolean(isEditSquadModalOpen)}
        onClose={() => setIsEditSquadModalOpen && setIsEditSquadModalOpen(false)}
        activeMatch={activeMatch}
        allPlayersPool={allMidMatchPlayersPool}
        localPlayersDb={localPlayersList}
        onMoveToTeam={handleMidMatchMoveToTeam}
        onOpenAddPlayerModal={() => setIsAddPlayerModalOpen && setIsAddPlayerModalOpen(true)}
      />

      <AddPlayerModal
        visible={Boolean(isAddPlayerModalOpen)}
        onClose={() => setIsAddPlayerModalOpen && setIsAddPlayerModalOpen(false)}
        newPlayerName={newBatsmanName || nextBowlerName}
        setNewPlayerName={(n) => {
          if (wicketPending && setNewBatsmanName) setNewBatsmanName(n);
          else if (bowlerChangePending && setNextBowlerName) setNextBowlerName(n);
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
        onClose={() => setScorerPinModalVisible && setScorerPinModalVisible(false)}
        onSuccess={handleScorerPinSuccess}
      />

      <MatchCompleteModal
        visible={Boolean(matchCompleteModalVisible)}
        match={activeMatch}
        onClose={() => setMatchCompleteModalVisible && setMatchCompleteModalVisible(false)}
        onViewScorecard={() => {
          if (setMatchCompleteModalVisible) setMatchCompleteModalVisible(false);
          if (setSelectedMatch && activeMatch) setSelectedMatch(buildFinishedMatch(activeMatch));
          if (setBottomNavTab) setBottomNavTab('matches');
          if (setMatchesSubTab) setMatchesSubTab('finished');
          if (setCurrentScreen) setCurrentScreen('finishedView');
        }}
        onNewMatch={() => {
          if (setMatchCompleteModalVisible) setMatchCompleteModalVisible(false);
          if (handleStartNewMatchSetup) handleStartNewMatchSetup();
        }}
        onStartRematch={() => {
          if (setMatchCompleteModalVisible) setMatchCompleteModalVisible(false);
          if (handleRematch) handleRematch();
        }}
      />
    </>
  );
}

export default ScorerModals;
