import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
  useWindowDimensions,
  StyleSheet,
  StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PagerView from 'react-native-pager-view';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  systemFont,
  systemFontBold,
  systemFontMedium,
  typeScale,
  fontWeights,
  theme,
  themeColors,
  spacing,
  radius
} from '../theme.js';
import { useMatch } from '../context/MatchContext.jsx';
import { TeamIdentityMark } from '../components/TeamIdentityMark.jsx';
import { MatchTabBar } from '../components/MatchTabBar.jsx';
import { PlayerAvatar } from '../components/PlayerAvatar.jsx';
import { PreInningsScorecard } from '../components/PreInningsScorecard.jsx';
import { CompleteScorecardView } from '../components/CompleteScorecardView.jsx';
import { WormGraph } from '../components/WormGraph.jsx';
import { ManhattanGraph } from '../components/ManhattanGraph.jsx';
import { MatchInfoPanel } from '../components/MatchInfoPanel.jsx';
import { FinishedMatchSummary } from '../components/FinishedMatchSummary.jsx';
import { PlayingXiModal } from '../components/modals/PlayingXiModal.jsx';
import { MatchCompleteModal } from '../components/modals/MatchCompleteModal.jsx';
import { PointsTableSection } from '../components/tournament/PointsTableSection.jsx';
import { getInitialTournamentsSync, getTournamentsFromStorage } from '../services/tournamentService.js';
import {
  formatOvers,
  formatScoreTokenForPublic,
  isWicketToken,
  renderBallTimeline,
  renderCompactOverTimeline,
  getTeamShortCode,
  getTeamLogoSource,
  getTossWinnerName,
  getTossDecisionText,
  formatMatchDateTime,
  getInningBowlingRows,
  getUnplayedBatters,
  buildFinishedLiveSnapshot,
  buildFinishedMatch,
  getDisplayOverHistory,
  getScorePartsFromText,
  autoCalculatePointsTable
} from '../utils/cricketUtils.js';

const BASE_FINISHED_MATCH_TABS = [
  { id: 'info', label: 'Info' },
  { id: 'summary', label: 'Summary' },
  { id: 'scorecard', label: 'Scorecard' },
  { id: 'overs', label: 'Overs' },
  { id: 'graphs', label: 'Graphs' }
];

const ResultTeamBlock = ({ team, isWinner, align = 'left' }) => {
  const scoreParts = getScorePartsFromText(team?.score);
  const rawName = String(team?.name || '').trim();
  const displayName = rawName.length <= 6 ? rawName : getTeamShortCode(team, rawName);
  const isLoser = !isWinner;

  return (
    <View style={{ flex: 1, flexDirection: align === 'left' ? 'row' : 'row-reverse', alignItems: 'center', gap: 10 }}>
      <TeamIdentityMark team={team} size={36} isLoser={isLoser} />
      <View style={{ flex: 1, alignItems: align === 'left' ? 'flex-start' : 'flex-end', justifyContent: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {align === 'right' && isWinner ? (
            <MaterialCommunityIcons name="trophy" size={13} color="#F59E0B" />
          ) : null}
          <Text
            selectable
            numberOfLines={1}
            style={{
              color: isWinner ? '#FFFFFF' : '#94A3B8',
              fontSize: 13,
              fontFamily: systemFontMedium,
              letterSpacing: 0.3
            }}
          >
            {displayName}
          </Text>
          {align === 'left' && isWinner ? (
            <MaterialCommunityIcons name="trophy" size={13} color="#F59E0B" />
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 1 }}>
          {align === 'right' && Boolean(scoreParts.overs) ? (
            <Text
              selectable
              style={{
                color: '#94A3B8',
                fontSize: 11,
                fontFamily: systemFontMedium,
                fontVariant: ['tabular-nums']
              }}
              numberOfLines={1}
            >
              ({scoreParts.overs.replace(/[()]/g, '')})
            </Text>
          ) : null}

          <Text
            selectable
            style={{
              color: '#FFFFFF',
              fontSize: 16.5,
              fontFamily: systemFontBold,
              fontVariant: ['tabular-nums']
            }}
            numberOfLines={1}
          >
            {scoreParts.score || 'Yet to bat'}
          </Text>

          {align === 'left' && Boolean(scoreParts.overs) ? (
            <Text
              selectable
              style={{
                color: '#94A3B8',
                fontSize: 11,
                fontFamily: systemFontMedium,
                fontVariant: ['tabular-nums']
              }}
              numberOfLines={1}
            >
              ({scoreParts.overs.replace(/[()]/g, '')})
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const MatchResultHero = ({ teamOne, teamTwo, winnerTeamName, resultText }) => (
  <View style={{ borderTopWidth: 0, borderTopColor: '#123A56' }}>
    <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <ResultTeamBlock team={teamOne} isWinner={winnerTeamName === teamOne?.name || (resultText && resultText.toLowerCase().includes(teamOne?.name?.toLowerCase()))} align="left" />
      <View style={{ minWidth: 36, alignItems: 'center', justifyContent: 'center' }}>
        <MaterialCommunityIcons name="lightning-bolt" size={18} color="#475569" />
      </View>
      <ResultTeamBlock team={teamTwo} isWinner={winnerTeamName === teamTwo?.name || (resultText && resultText.toLowerCase().includes(teamTwo?.name?.toLowerCase()))} align="right" />
    </View>
    <View style={{ paddingHorizontal: 16, paddingBottom: 10, alignItems: 'center', justifyContent: 'center' }}>
      <Text
        selectable
        numberOfLines={1}
        style={{
          color: '#EAB308',
          fontSize: 12.5,
          fontFamily: systemFontMedium,
          textAlign: 'center',
          letterSpacing: 0.2
        }}
      >
        {resultText}
      </Text>
    </View>
  </View>
);

export function FinishedMatchViewScreen(props = {}) {
  const insets = useSafeAreaInsets();
  const matchCtx = useMatch();
  const {
    selectedMatch,
    activeMatch,
    finishedMatches = [],
    handleRematch: ctxHandleRematch,
    refreshing: ctxRefreshing,
    handlePullToRefresh: ctxHandlePullToRefresh,
    setPlayingXiVisible: ctxSetPlayingXiVisible,
    setCurrentScreen: ctxSetCurrentScreen,
    setSelectedPlayerProfile: ctxSetSelectedPlayerProfile
  } = matchCtx;

  const routeParams = props.route?.params || {};
  const passedMatch = props.match || routeParams.matchData || routeParams.match || (routeParams.matchId && (finishedMatches.find(m => m.id === routeParams.matchId) || matchCtx.savedMatches?.find(m => m.id === routeParams.matchId)));

  const defaultMatch =
    passedMatch ||
    (selectedMatch?.id ? selectedMatch : null) ||
    (activeMatch && (activeMatch.phase === 'result' || activeMatch.resultText)
      ? buildFinishedMatch(activeMatch)
      : null) ||
    selectedMatch ||
    finishedMatches[0];

  const rawMatch = props.match || defaultMatch;

  const match = useMemo(() => {
    if (!rawMatch) return null;
    if (rawMatch.sourceMatch) return rawMatch;
    if (rawMatch.rawMatchData) {
      const built = buildFinishedMatch(rawMatch.rawMatchData);
      return {
        ...built,
        tournament: rawMatch.tournament || built.tournament,
        tournamentId: rawMatch.tournamentId || built.tournamentId,
        tournamentName: rawMatch.tournamentName || built.tournamentName,
        stage: rawMatch.stage || built.stage,
        matchNumber: rawMatch.matchNumber || rawMatch.matchNo || built.matchNumber,
        venue: rawMatch.venue || built.venue,
        date: rawMatch.date || rawMatch.dateStr || built.date,
        resultText: rawMatch.result || rawMatch.resultText || built.resultText
      };
    }
    if (rawMatch.innings && rawMatch.innings.length > 0) {
      return buildFinishedMatch(rawMatch);
    }
    return rawMatch;
  }, [rawMatch]);

  const {
    finishedTab: externalFinishedTab,
    setFinishedTab: externalSetFinishedTab,
    finishedInningIndex: externalFinishedInningIndex,
    setFinishedInningIndex: externalSetFinishedInningIndex,
    setCurrentScreen = ctxSetCurrentScreen,
    handleOpenPlayerProfile = (profile) => {
      if (ctxSetSelectedPlayerProfile) ctxSetSelectedPlayerProfile(profile);
      if (ctxSetCurrentScreen) ctxSetCurrentScreen('playerProfile');
    },
    handleRematch = ctxHandleRematch,
    refreshing = ctxRefreshing || false,
    handlePullToRefresh = ctxHandlePullToRefresh,
    setPlayingXiVisible = ctxSetPlayingXiVisible,
    playingXiVisible = matchCtx.playingXiVisible || false,
    matchCompleteModalVisible = matchCtx.matchCompleteModalVisible || false,
    setMatchCompleteModalVisible = matchCtx.setMatchCompleteModalVisible,
    setSelectedMatch = matchCtx.setSelectedMatch,
    setBottomNavTab = matchCtx.setBottomNavTab,
    setMatchesSubTab = matchCtx.setMatchesSubTab,
    handleStartNewMatchSetup = matchCtx.handleStartNewMatchSetup
  } = props;
  const { width: screenWidth } = useWindowDimensions();
  const [internalFinishedTab, setInternalFinishedTab] = useState('summary');
  const [internalInningIndex, setInternalInningIndex] = useState(0);
  const [publicTabLayouts, setPublicTabLayouts] = useState({});

  const f = match;
  const isTournamentMatch = Boolean(
    f?.tournamentId ||
    f?.tournamentName ||
    f?.seriesName ||
    f?.tournament ||
    f?.tournamentTitle
  );

  const finishedTabs = useMemo(() => {
    const list = [...BASE_FINISHED_MATCH_TABS];
    if (isTournamentMatch) {
      list.push({ id: 'table', label: 'Table' });
    }
    return list;
  }, [isTournamentMatch]);

  const finishedTab = externalFinishedTab !== undefined ? externalFinishedTab : internalFinishedTab;
  const setFinishedTab = externalSetFinishedTab || setInternalFinishedTab;
  const finishedInningIndex = externalFinishedInningIndex !== undefined ? externalFinishedInningIndex : internalInningIndex;
  const setFinishedInningIndex = externalSetFinishedInningIndex || setInternalInningIndex;

  const finishedSwipeRef = useRef(null);
  const publicTabsRef = useRef(null);
  const finishedPagerPosition = useRef(new Animated.Value(
    Math.max(0, finishedTabs.findIndex(tab => tab.id === finishedTab))
  )).current;

  const handleGoBack = () => {
    if (props.navigation && props.navigation.canGoBack && props.navigation.canGoBack()) {
      props.navigation.goBack();
    } else if (props.onBack) {
      props.onBack();
    } else if (setCurrentScreen) {
      if (isTournamentMatch) {
        setCurrentScreen('series');
      } else {
        setCurrentScreen('home');
      }
    }
  };

  if (!match) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: themeColors.appBackground }}>
        <Ionicons name="checkmark-done-outline" size={34} color="#94A3B8" />
        <Text style={{ color: '#0F172A', fontSize: 16, fontFamily: systemFontBold, marginTop: 10 }}>No finished match</Text>
        <TouchableOpacity onPress={handleGoBack} style={{ minHeight: 42, marginTop: 14, paddingHorizontal: 18, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: '#18181B' }}>
          <Text style={{ color: '#FFFFFF', fontSize: 13, fontFamily: systemFontBold }}>BACK TO HOME</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const finishedLiveMatch = buildFinishedLiveSnapshot(f);
  const viewTeam = (finishedInningIndex === 0 ? finishedLiveMatch?.team1 : finishedLiveMatch?.team2) || {
    name: 'Team',
    score: '0-0',
    batting: [],
    bowling: [],
    overHistory: []
  };
  const opponentTeam = (finishedInningIndex === 0 ? finishedLiveMatch?.team2 : finishedLiveMatch?.team1) || {};
  const finishedBowlingRows = (viewTeam?.bowling?.length ? viewTeam.bowling : opponentTeam?.bowling) || [];
  const finishedBattingRows = (viewTeam.batting || []).filter(player => player.dismissal !== 'Did not bat');
  const finishedDeclaredRoster = finishedLiveMatch.playingXI?.[viewTeam.name]
    || f.sourceMatch?.playingXI?.[viewTeam.name]
    || (viewTeam.batting || []).map(player => player.name);
  const finishedPendingBatters = getUnplayedBatters(finishedDeclaredRoster, finishedBattingRows);

  const finishedTeam1Inning = f.sourceMatch?.innings?.[0] || { battingTeam: f.team1, overHistory: f.team1?.overHistory || [] };
  const finishedTeam2Inning = f.sourceMatch?.innings?.[1] || { battingTeam: f.team2, overHistory: f.team2?.overHistory || [] };

  const keepFinishedTabVisible = (tabIndex, animated = true) => {
    if (tabIndex === 0) {
      publicTabsRef?.current?.scrollTo({ x: 0, animated });
    } else if (tabIndex === finishedTabs.length - 1) {
      publicTabsRef?.current?.scrollToEnd({ animated });
    } else {
      publicTabsRef?.current?.scrollTo({
        x: Math.max(0, (tabIndex * 92) - (screenWidth * 0.28)),
        animated
      });
    }
  };

  const captureTabLayout = (tabId, event) => {
    if (!setPublicTabLayouts) return;
    const { x, width } = event.nativeEvent.layout;
    setPublicTabLayouts(previous => {
      const current = previous[`finished:${tabId}`];
      if (current && Math.abs(current.x - x) < 0.5 && Math.abs(current.width - width) < 0.5) return previous;
      return { ...previous, [`finished:${tabId}`]: { x, width } };
    });
  };

  const changeFinishedTab = (nextTabId, movePager = true) => {
    const nextIndex = finishedTabs.findIndex(tab => tab.id === nextTabId);
    if (nextIndex < 0) return;
    if (setFinishedTab) setFinishedTab(nextTabId);
    keepFinishedTabVisible(nextIndex);
    if (movePager) finishedSwipeRef.current?.setPage(nextIndex);
  };

  const handleFinishedPageSelected = (event) => {
    const nextIndex = event.nativeEvent.position;
    const nextTab = finishedTabs[nextIndex];
    if (!nextTab) return;
    keepFinishedTabVisible(nextIndex);
    if (nextTab.id !== finishedTab && setFinishedTab) setFinishedTab(nextTab.id);
  };

  const handleFinishedPageScroll = (event) => {
    const { position, offset } = event.nativeEvent;
    finishedPagerPosition.setValue(position + offset);
  };

  useEffect(() => {
    const idx = finishedTabs.findIndex(t => t.id === finishedTab);
    if (idx !== -1) {
      finishedSwipeRef.current?.setPage(idx);
      finishedPagerPosition.setValue(idx);
      keepFinishedTabVisible(idx, false);
    }
  }, [finishedTab, finishedTabs]);

  // Resolve Full Tournament Object
  const [resolvedTournament, setResolvedTournament] = useState(() => {
    const tourns = getInitialTournamentsSync();
    const tId = f?.tournamentId || f?.tournament?.id;
    const tName = f?.tournamentName || f?.seriesName || f?.tournament?.name || f?.tournamentTitle;
    if (tId) {
      const found = tourns.find(t => t.id === tId || String(t.id).toLowerCase() === String(tId).toLowerCase());
      if (found) return found;
    }
    if (tName) {
      const norm = String(tName).trim().toLowerCase();
      const found = tourns.find(t => String(t.name || t.title || '').trim().toLowerCase().includes(norm) || norm.includes(String(t.name || '').trim().toLowerCase()));
      if (found) return found;
    }
    return f?.tournament || (isTournamentMatch ? tourns[0] : null);
  });

  useEffect(() => {
    getTournamentsFromStorage().then(list => {
      if (Array.isArray(list) && list.length > 0) {
        const tId = f?.tournamentId || f?.tournament?.id;
        const tName = f?.tournamentName || f?.seriesName || f?.tournament?.name || f?.tournamentTitle;
        let target = null;
        if (tId) {
          target = list.find(t => t.id === tId || String(t.id).toLowerCase() === String(tId).toLowerCase());
        }
        if (!target && tName) {
          const norm = String(tName).trim().toLowerCase();
          target = list.find(t => String(t.name || t.title || '').trim().toLowerCase().includes(norm) || norm.includes(String(t.name || '').trim().toLowerCase()));
        }
        if (target) {
          setResolvedTournament(target);
        }
      }
    }).catch(() => {});
  }, [f?.tournamentId, f?.tournamentName, f?.seriesName]);

  // Tournament Navigation
  const handleOpenTournament = () => {
    const tData = resolvedTournament || f.tournament || {
      id: f.tournamentId,
      name: f.tournamentName || f.seriesName || 'Tournament'
    };
    if (matchCtx.setActiveTournament) {
      matchCtx.setActiveTournament(tData);
    }
    if (matchCtx.setBottomNavTab) {
      matchCtx.setBottomNavTab('series');
    }
    if (matchCtx.setCurrentScreen) {
      matchCtx.setCurrentScreen('series');
    }
  };

  // Full Tournament Points Table (All teams in tournament)
  const tournamentPointsTable = useMemo(() => {
    const targetTourn = resolvedTournament || f?.tournament;
    if (!targetTourn) return [];
    const tTeams = targetTourn.teams || [];
    const tMatches = targetTourn.matches || [];
    if (tTeams.length === 0) return [];
    return autoCalculatePointsTable(tTeams, tMatches);
  }, [resolvedTournament, f]);

  const team1Name = f.team1?.name || 'Team 1';
  const team2Name = f.team2?.name || 'Team 2';

  const t1Short = getTeamShortCode(f.team1, team1Name);
  const t2Short = getTeamShortCode(f.team2, team2Name);
  const headerMatchTitle = `${t1Short} vs ${t2Short}`;

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.appBackground }}>
      <StatusBar barStyle="light-content" translucent={true} backgroundColor="transparent" />
      {/* ─── TOP DARK NAVY HEADER (TITLE + TABS + INTEGRATED HERO) ─── */}
      <View style={{ backgroundColor: '#071B2C', borderBottomWidth: 0, borderBottomColor: '#123A56' }}>
        {/* Top Title & Back */}
        <View style={{ paddingHorizontal: 16, paddingTop: insets.top + 8, paddingBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={handleGoBack}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={{ marginRight: 12, padding: 2, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontFamily: systemFontBold, letterSpacing: 0.2, flex: 1 }} numberOfLines={1}>
            {headerMatchTitle}
          </Text>
        </View>

        {/* Tabs Strip */}
        <MatchTabBar
          tabs={finishedTabs}
          activeTab={finishedTab}
          layouts={publicTabLayouts}
          layoutPrefix="finished:"
          pageWidth={1}
          scrollX={finishedPagerPosition}
          scrollRef={publicTabsRef}
          onPress={changeFinishedTab}
          onTabLayout={captureTabLayout}
          tone="dark"
        />

        {/* Integrated Result Hero (Screenshot 2) */}
        <MatchResultHero
          teamOne={f.team1}
          teamTwo={f.team2}
          winnerTeamName={f.winnerTeamName}
          resultText={f.winner || f.resultText}
        />
      </View>

      {/* ─── NATIVE HORIZONTAL SWIPEABLE PAGER (INFO | SUMMARY | SCORECARD | OVERS | GRAPHS | TABLE) ─── */}
      <PagerView
        ref={finishedSwipeRef}
        style={{ flex: 1 }}
        initialPage={Math.max(0, finishedTabs.findIndex(tab => tab.id === finishedTab))}
        onPageSelected={handleFinishedPageSelected}
        onPageScroll={handleFinishedPageScroll}
      >
        {finishedTabs.map(({ id: pageTabId }) => (
          <View key={pageTabId} style={{ flex: 1 }}>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 14, paddingBottom: 28, gap: 12 }}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {/* TAB 1: INFO */}
              {pageTabId === 'info' && (() => {
                const getTeamRosterCount = (tName, teamObj) => {
                  if (f.playingXI && tName) {
                    if (Array.isArray(f.playingXI[tName]) && f.playingXI[tName].length > 0) return f.playingXI[tName].length;
                    const matchKey = Object.keys(f.playingXI).find(k => k.trim().toLowerCase() === tName.trim().toLowerCase());
                    if (matchKey && Array.isArray(f.playingXI[matchKey]) && f.playingXI[matchKey].length > 0) return f.playingXI[matchKey].length;
                  }
                  if (f.sourceMatch?.playingXI && tName) {
                    if (Array.isArray(f.sourceMatch.playingXI[tName]) && f.sourceMatch.playingXI[tName].length > 0) return f.sourceMatch.playingXI[tName].length;
                    const matchKey = Object.keys(f.sourceMatch.playingXI).find(k => k.trim().toLowerCase() === tName.trim().toLowerCase());
                    if (matchKey && Array.isArray(f.sourceMatch.playingXI[matchKey]) && f.sourceMatch.playingXI[matchKey].length > 0) return f.sourceMatch.playingXI[matchKey].length;
                  }
                  if (Array.isArray(teamObj?.batting) && teamObj.batting.length > 0) {
                    return teamObj.batting.length;
                  }
                  return 0;
                };
                const teamOneCount = getTeamRosterCount(team1Name, f.team1);
                const teamTwoCount = getTeamRosterCount(team2Name, f.team2);
                const totalPlayerCount = teamOneCount + teamTwoCount;

                return (
                  <MatchInfoPanel
                    match={f}
                    teamOne={f.team1}
                    teamTwo={f.team2}
                    teamOneName={team1Name}
                    teamTwoName={team2Name}
                    matchResult={f.resultText || f.result || ''}
                    tossSummary={f.tossResult || (f.tossWinner ? `${f.tossWinner} won the toss and chose to ${String(f.tossDecision || 'bat').toLowerCase()}` : '')}
                    playerCount={totalPlayerCount}
                    onOpenPlayingXi={(tName) => {
                      if (setPlayingXiVisible) setPlayingXiVisible(true);
                    }}
                    onPressTournament={handleOpenTournament}
                    tournamentData={resolvedTournament || f.tournament}
                  />
                );
              })()}

              {/* TAB 2: SUMMARY */}
              {pageTabId === 'summary' && (
                <FinishedMatchSummary
                  match={f}
                  onRematch={handleRematch}
                  onPressPlayer={handleOpenPlayerProfile}
                  onSelectTab={changeFinishedTab}
                  onPressTournament={(tab) => {
                    handleOpenTournament();
                  }}
                  tournamentData={resolvedTournament || f.tournament}
                />
              )}

              {/* TAB 3: SCORECARD */}
              {pageTabId === 'scorecard' && (
                <CompleteScorecardView
                  match={f}
                  inningIndex={finishedInningIndex}
                  onSelectInning={(idx) => setFinishedInningIndex(idx)}
                  onSelectPlayer={(pName) => handleOpenPlayerProfile && handleOpenPlayerProfile(pName)}
                  isLive={false}
                  team1Name={team1Name}
                  team2Name={team2Name}
                  team1Score={f.team1?.score || '0-0'}
                  team2Score={f.team2?.score || '0-0'}
                />
              )}

              {/* TAB 4: OVERS */}
              {pageTabId === 'overs' && (
                <View style={{ gap: 12 }}>
                  <View style={{ flexDirection: 'row', gap: 8, padding: 10, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 0 }}>
                    {[
                      { name: `${team1Name} (Inn 1)`, count: finishedTeam1Inning?.overHistory?.length || 0 },
                      { name: `${team2Name} (Inn 2)`, count: finishedTeam2Inning?.overHistory?.length || 0 }
                    ].map((tObj, idx) => {
                      const active = finishedInningIndex === idx;
                      return (
                        <TouchableOpacity
                          key={tObj.name}
                          onPress={() => setFinishedInningIndex(idx)}
                          style={{
                            flex: 1,
                            paddingVertical: 7,
                            paddingHorizontal: 8,
                            borderRadius: 8,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: active ? '#0284C7' : '#FFFFFF',
                            borderWidth: 0
                          }}
                        >
                          <Text style={{ fontSize: 12, fontFamily: systemFontMedium, color: active ? '#FFFFFF' : '#0F172A' }} numberOfLines={1}>
                            {tObj.name} • {tObj.count} Ov
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {(finishedInningIndex === 0 ? finishedTeam1Inning : finishedTeam2Inning)?.overHistory?.length === 0 ? (
                    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: 24, borderWidth: 0, alignItems: 'center' }}>
                      <MaterialCommunityIcons name="clock-outline" size={32} color="#CBD5E1" />
                      <Text style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', marginTop: 8, fontFamily: systemFontMedium }}>
                        No overs recorded for this inning.
                      </Text>
                    </View>
                  ) : (
                    (finishedInningIndex === 0 ? finishedTeam1Inning : finishedTeam2Inning)?.overHistory?.map((o, idx) => (
                      <View key={idx} style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, borderWidth: 0 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <Text style={{ color: '#0284C7', fontSize: 13, fontFamily: systemFontBold }}>Over {o.overNum} • {o.bowlerName}</Text>
                          <Text style={{ color: '#B45309', fontSize: 13, fontFamily: systemFontMedium }}>{o.runs} Runs {o.wickets > 0 ? `• ${o.wickets} Wkt` : ''}</Text>
                        </View>
                        <View style={{ minHeight: 28 }}>
                          {renderBallTimeline(o.balls, { size: 26, emptyText: 'No balls', contentPaddingRight: 4 })}
                        </View>
                      </View>
                    ))
                  )}
                </View>
              )}

              {/* TAB 5: GRAPHS */}
              {pageTabId === 'graphs' && (
                <View style={{ gap: 14 }}>
                  <WormGraph
                    match={f}
                    team1Inning={finishedTeam1Inning}
                    team2Inning={finishedTeam2Inning}
                  />
                  <ManhattanGraph
                    match={f}
                    team1Inning={finishedTeam1Inning}
                    team2Inning={finishedTeam2Inning}
                  />
                </View>
              )}

              {/* TAB 6: POINTS TABLE (FOR TOURNAMENTS) */}
              {pageTabId === 'table' && (
                <View style={{ gap: 14 }}>
                  <PointsTableSection
                    pointsTableData={tournamentPointsTable}
                    tournamentTeams={resolvedTournament?.teams || f.tournament?.teams || [f.team1, f.team2].filter(Boolean)}
                    totalTeams={(resolvedTournament?.teams || f.tournament?.teams || [f.team1, f.team2].filter(Boolean)).length}
                    teamFormEnabled={true}
                    isOverviewPreview={false}
                  />
                </View>
              )}
            </ScrollView>
          </View>
        ))}
      </PagerView>

      {/* Playing XI Modal */}
      <PlayingXiModal
        visible={Boolean(playingXiVisible)}
        onClose={() => setPlayingXiVisible && setPlayingXiVisible(false)}
        match={activeMatch || selectedMatch || f}
      />

      {/* Match Complete Modal */}
      <MatchCompleteModal
        visible={Boolean(matchCompleteModalVisible)}
        match={activeMatch || selectedMatch || f}
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
    </View>
  );
}

export default FinishedMatchViewScreen;
