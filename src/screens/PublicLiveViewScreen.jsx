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
import { RealtimeWinBar } from '../components/RealtimeWinBar.jsx';
import { PreInningsScorecard } from '../components/PreInningsScorecard.jsx';
import { CompleteScorecardView } from '../components/CompleteScorecardView.jsx';
import { WormGraph } from '../components/WormGraph.jsx';
import { ManhattanGraph } from '../components/ManhattanGraph.jsx';
import { MatchInfoPanel } from '../components/MatchInfoPanel.jsx';
import { PlayingXiModal } from '../components/modals/PlayingXiModal.jsx';
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
  formatOrdinal,
  makeInning,
  autoCalculatePointsTable
} from '../utils/cricketUtils.js';

const BASE_PUBLIC_LIVE_TABS = [
  { id: 'info', label: 'Info' },
  { id: 'live', label: 'Live' },
  { id: 'scorecard', label: 'Scorecard' },
  { id: 'overs', label: 'Overs' },
  { id: 'graphs', label: 'Graphs' }
];

export function PublicLiveViewScreen(props = {}) {
  const matchCtx = useMatch();
  const routeParams = props.route?.params || {};
  const passedMatch = props.activeMatch || props.match || routeParams.matchData || routeParams.match || (routeParams.matchId && (matchCtx.liveMatches?.find(m => m.id === routeParams.matchId) || matchCtx.activeMatch));

  const activeMatch = useMemo(() => {
    const m = passedMatch || matchCtx.activeMatch || matchCtx.selectedMatch || {};
    if (!m || (!m.innings && !m.rawMatchData && !m.team1)) return null;
    if (m.rawMatchData && (!m.innings || m.innings.length === 0)) {
      return {
        ...m.rawMatchData,
        ...m,
        innings: m.rawMatchData.innings || m.innings,
        tournament: m.tournament || m.rawMatchData.tournament,
        tournamentId: m.tournamentId || m.rawMatchData.tournamentId,
        tournamentName: m.tournamentName || m.rawMatchData.tournamentName
      };
    }
    if (!m.innings || m.innings.length === 0) {
      const t1Name = m.team1?.name || m.team1 || 'Team 1';
      const t2Name = m.team2?.name || m.team2 || 'Team 2';
      const inn1 = makeInning({ name: t1Name }, { name: t2Name }, m.overs || 20);
      const inn2 = makeInning({ name: t2Name }, { name: t1Name }, m.overs || 20);
      return {
        ...m,
        innings: [inn1, inn2],
        team1: m.team1 || { name: t1Name },
        team2: m.team2 || { name: t2Name }
      };
    }
    return m;
  }, [passedMatch, matchCtx.activeMatch, matchCtx.selectedMatch]);

  const {
    publicLiveTab = props.publicLiveTab || matchCtx.publicLiveTab || 'live',
    setPublicLiveTab = matchCtx.setPublicLiveTab,
    liveViewReturnScreen = props.liveViewReturnScreen || matchCtx.liveViewReturnScreen || 'home',
    setCurrentScreen = matchCtx.setCurrentScreen,
    handleOpenPlayerProfile = (profile) => {
      if (matchCtx.setSelectedPlayerProfile) matchCtx.setSelectedPlayerProfile(profile);
      if (matchCtx.setCurrentScreen) matchCtx.setCurrentScreen('playerProfile');
    },
    refreshing = matchCtx.refreshing || false,
    handlePullToRefresh = matchCtx.handlePullToRefresh,
    playingXiVisible = matchCtx.playingXiVisible || false,
    setPlayingXiVisible = matchCtx.setPlayingXiVisible,
    selectedMatch = matchCtx.selectedMatch
  } = props;
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [publicTabLayouts, setPublicTabLayouts] = useState({});
  const [scorecardInningIndex, setScorecardInningIndex] = useState(0);
  const [oversInningIndex, setOversInningIndex] = useState(0);

  const isTournamentMatch = Boolean(
    activeMatch?.tournamentId ||
    activeMatch?.tournamentName ||
    activeMatch?.seriesName ||
    activeMatch?.tournament ||
    activeMatch?.tournamentTitle
  );

  const publicTabs = useMemo(() => {
    const list = [...BASE_PUBLIC_LIVE_TABS];
    if (isTournamentMatch) {
      list.push({ id: 'table', label: 'Table' });
    }
    return list;
  }, [isTournamentMatch]);

  const publicTabsRef = useRef(null);
  const publicPagerRef = useRef(null);
  const publicPagerPosition = useRef(new Animated.Value(
    Math.max(0, publicTabs.findIndex(tab => tab.id === publicLiveTab))
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
        setCurrentScreen(liveViewReturnScreen || 'home');
      }
    }
  };

  if (!activeMatch || !activeMatch.innings || !activeMatch.innings.length) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: themeColors.appBackground }}>
        <Ionicons name="radio-outline" size={34} color="#94A3B8" />
        <Text style={{ color: '#0F172A', fontSize: 16, fontFamily: systemFontBold, marginTop: 10 }}>No live match in progress</Text>
        <TouchableOpacity onPress={handleGoBack} style={{ minHeight: 42, marginTop: 14, paddingHorizontal: 18, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: '#18181B' }}>
          <Text style={{ color: '#FFFFFF', fontSize: 13, fontFamily: systemFontBold }}>BACK TO HOME</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const inn1 = activeMatch.innings?.[0];
  const inn2 = activeMatch.innings?.[1];
  const activeInningIndex = (activeMatch.inning || 1) - 1;
  const curInn = activeMatch.innings[activeInningIndex] || inn1;
  const isInn2 = activeMatch.inning === 2;

  const team1Name = activeMatch.teams?.[0]?.name || activeMatch.team1?.name || inn1?.battingTeam?.name || 'Team 1';
  const team2Name = activeMatch.teams?.[1]?.name || activeMatch.team2?.name || inn1?.bowlingTeam?.name || 'Team 2';

  const team1Meta = activeMatch.teams?.find(t => t.name === team1Name) || activeMatch.team1 || { name: team1Name };
  const team2Meta = activeMatch.teams?.find(t => t.name === team2Name) || activeMatch.team2 || { name: team2Name };

  const isTeam1Batting = (activeMatch.inning === 1 && inn1?.battingTeam?.name === team1Name) || (activeMatch.inning === 2 && inn2?.battingTeam?.name === team1Name);
  const isTeam2Batting = !isTeam1Batting;

  const t1ScoreParts = inn1?.battingTeam ? {
    score: `${inn1.battingTeam.runs ?? 0}-${inn1.battingTeam.wickets ?? 0}`,
    overs: formatOvers(inn1.totalLegalBalls || 0)
  } : { score: 'Yet to bat', overs: '' };

  const t2ScoreParts = inn2?.battingTeam ? {
    score: `${inn2.battingTeam.runs ?? 0}-${inn2.battingTeam.wickets ?? 0}`,
    overs: formatOvers(inn2.totalLegalBalls || 0)
  } : (isInn2 ? { score: '0-0', overs: '0.0' } : { score: 'Yet to bat', overs: '' });

  const reqRuns = isInn2 && activeMatch.target ? Math.max(0, activeMatch.target - (inn2?.battingTeam?.runs || 0)) : null;
  const reqBalls = isInn2 ? Math.max(0, (activeMatch.maxOvers * 6) - (inn2?.totalLegalBalls || 0)) : null;

  const crr = curInn.totalLegalBalls > 0 ? ((curInn.battingTeam.runs / curInn.totalLegalBalls) * 6).toFixed(2) : '0.00';
  const strikerSR = curInn.striker?.balls > 0 ? ((curInn.striker.runs / curInn.striker.balls) * 100).toFixed(1) : '0.0';
  const nonStrikerSR = curInn.nonStriker?.balls > 0 ? ((curInn.nonStriker.runs / curInn.nonStriker.balls) * 100).toFixed(1) : '0.0';
  const bowlerEco = curInn.bowlerLegalBalls > 0 ? ((curInn.bowler.runs / curInn.bowlerLegalBalls) * 6).toFixed(1) : '0.0';

  const overHistory = curInn.overHistory || [];
  const currentOverBalls = curInn.currentOverBalls || [];
  const thisOverRuns = currentOverBalls.reduce((acc, b) => acc + (typeof b === 'number' ? b : 0), 0);
  const currentOverNum = Math.floor((curInn.totalLegalBalls || 0) / 6) + 1;
  const latestCompletedOver = (curInn.overHistory || [])[(curInn.overHistory || []).length - 1];

  const tossWinnerName = getTossWinnerName(activeMatch) || team1Name;
  const tossDecisionText = getTossDecisionText(activeMatch, activeMatch.tossDecision || 'BAT');

  const latestBallToken = currentOverBalls[currentOverBalls.length - 1]
    || latestCompletedOver?.balls?.[latestCompletedOver.balls.length - 1]
    || '';
  const hasDeliveries = (curInn.totalLegalBalls > 0) || (currentOverBalls.length > 0) || (overHistory.length > 0) || !!curInn.lastDelivery;
  const latestDelivery = (!hasDeliveries || activeMatch.phase === 'result')
    ? null
    : (activeMatch.pendingPublicEvent
      || (curInn.lastEvent?.type === 'over' ? { token: '', label: 'Over', type: 'over' } : null)
      || curInn.lastDelivery || (latestBallToken ? {
        token: latestBallToken,
        label: formatScoreTokenForPublic(latestBallToken),
        type: isWicketToken(latestBallToken) ? 'wicket' : 'runs'
      } : null));

  const latestDeliveryColor = latestDelivery?.type === 'wicket' ? '#FDA4AF' : '#86EFAC';

  let liveStatusText = '';
  if (isInn2 && reqRuns != null) {
    liveStatusText = `${inn2?.battingTeam?.name || team2Name} need ${reqRuns} runs in ${reqBalls} balls (Target: ${activeMatch.target})`;
  } else if (activeMatch.phase === 'inningBreak') {
    liveStatusText = `Innings Break • Target: ${(inn1?.battingTeam?.runs || 0) + 1}`;
  } else {
    liveStatusText = `${tossWinnerName} won the toss and elected to ${tossDecisionText} • CRR: ${crr}`;
  }

  const batterRows = [
    { player: curInn.striker, isStriker: true },
    { player: curInn.nonStriker, isStriker: false }
  ].filter(row => row.player?.name);

  // Scorecard View Inning Data
  const viewInningObj = scorecardInningIndex === 1
    ? inn2 || makeInning(team2Name, team1Name)
    : inn1 || makeInning(team1Name, team2Name);

  const scorecardKnownBatters = viewInningObj.allBatters?.length
    ? viewInningObj.allBatters
    : [viewInningObj.striker, viewInningObj.nonStriker].filter(player => player?.name);
  const scorecardExtras = Math.max(0, (viewInningObj.battingTeam?.runs || 0) - scorecardKnownBatters.reduce((total, player) => total + (player.runs || 0), 0));
  const scorecardBowlingRows = getInningBowlingRows(viewInningObj);

  const scorecardDeclaredRoster = activeMatch.playingXI?.[viewInningObj.battingTeam?.name] || [];
  const scorecardDeclaredPlayers = scorecardDeclaredRoster.map(name => ({
    name,
    avg: '-',
    sr: '-'
  }));
  const scorecardPendingBatters = getUnplayedBatters(scorecardDeclaredRoster, scorecardKnownBatters);
  const scorecardHasStarted = Boolean(
    (viewInningObj.totalLegalBalls || 0) > 0
    || (viewInningObj.currentOverBalls || []).length > 0
    || (viewInningObj.overHistory || []).length > 0
  );

  const publicTeamOneRoster = activeMatch.playingXI?.[team1Name] || [];
  const publicTeamTwoRoster = activeMatch.playingXI?.[team2Name] || [];

  const keepPublicTabVisible = (tabIndex, animated = true) => {
    if (tabIndex === 0) {
      publicTabsRef.current?.scrollTo({ x: 0, animated });
    } else if (tabIndex === publicTabs.length - 1) {
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

  const changePublicLiveTab = (nextTabId, movePager = true) => {
    const nextIndex = publicTabs.findIndex(tab => tab.id === nextTabId);
    if (nextIndex < 0) return;

    keepPublicTabVisible(nextIndex);
    if (movePager) {
      publicPagerRef.current?.setPage(nextIndex);
    }
    if (nextTabId !== publicLiveTab) setPublicLiveTab(nextTabId);
  };

  const handlePublicPageSelected = (event) => {
    const nextIndex = event.nativeEvent.position;
    const nextTab = publicTabs[nextIndex];
    if (!nextTab) return;
    keepPublicTabVisible(nextIndex);
    if (nextTab.id !== publicLiveTab) setPublicLiveTab(nextTab.id);
  };

  const handlePublicPageScroll = (event) => {
    const { position, offset } = event.nativeEvent;
    publicPagerPosition.setValue(position + offset);
  };

  useEffect(() => {
    const idx = publicTabs.findIndex(t => t.id === publicLiveTab);
    if (idx !== -1) {
      publicPagerRef.current?.setPage(idx);
      publicPagerPosition.setValue(idx);
      keepPublicTabVisible(idx, false);
    }
  }, [publicLiveTab, publicTabs]);

  // Resolve Full Tournament Object
  const [resolvedTournament, setResolvedTournament] = useState(() => {
    const tourns = getInitialTournamentsSync();
    const tId = activeMatch?.tournamentId || activeMatch?.tournament?.id;
    const tName = activeMatch?.tournamentName || activeMatch?.seriesName || activeMatch?.tournament?.name || activeMatch?.tournamentTitle;
    if (tId) {
      const found = tourns.find(t => t.id === tId || String(t.id).toLowerCase() === String(tId).toLowerCase());
      if (found) return found;
    }
    if (tName) {
      const norm = String(tName).trim().toLowerCase();
      const found = tourns.find(t => String(t.name || t.title || '').trim().toLowerCase().includes(norm) || norm.includes(String(t.name || '').trim().toLowerCase()));
      if (found) return found;
    }
    return activeMatch?.tournament || (isTournamentMatch ? tourns[0] : null);
  });

  useEffect(() => {
    getTournamentsFromStorage().then(list => {
      if (Array.isArray(list) && list.length > 0) {
        const tId = activeMatch?.tournamentId || activeMatch?.tournament?.id;
        const tName = activeMatch?.tournamentName || activeMatch?.seriesName || activeMatch?.tournament?.name || activeMatch?.tournamentTitle;
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
  }, [activeMatch?.tournamentId, activeMatch?.tournamentName, activeMatch?.seriesName]);

  // Tournament Navigation
  const handleOpenTournament = () => {
    const tData = resolvedTournament || activeMatch.tournament || {
      id: activeMatch.tournamentId,
      name: activeMatch.tournamentName || activeMatch.seriesName || 'Tournament'
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
    const targetTourn = resolvedTournament || activeMatch?.tournament;
    if (!targetTourn) return [];
    const tTeams = targetTourn.teams || [];
    const tMatches = targetTourn.matches || [];
    if (tTeams.length === 0) return [];
    return autoCalculatePointsTable(tTeams, tMatches);
  }, [resolvedTournament, activeMatch]);

  // Overs Tab data (Inning 1 & Inning 2)
  const oversViewInning = oversInningIndex === 1 ? inn2 : inn1;
  const oversHistoryList = oversViewInning?.overHistory || [];

  const t1Short = getTeamShortCode(team1Meta, team1Name);
  const t2Short = getTeamShortCode(team2Meta, team2Name);
  const headerMatchTitle = `${t1Short} vs ${t2Short}`;

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.appBackground }}>
      <StatusBar barStyle="light-content" translucent={true} backgroundColor="transparent" />
      {/* ─── TOP DARK NAVY HEADER (MATCH TITLE + TABS + INTEGRATED LIVE HERO) ─── */}
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
          tabs={publicTabs}
          activeTab={publicLiveTab}
          layouts={publicTabLayouts}
          pageWidth={1}
          scrollX={publicPagerPosition}
          scrollRef={publicTabsRef}
          onPress={changePublicLiveTab}
          onTabLayout={capturePublicTabLayout}
          tone="dark"
        />

        {/* INTEGRATED MATCH SCORE HERO (MATCHING SCREENSHOT 2) */}
        <View style={{ borderTopWidth: 0, borderTopColor: '#123A56' }}>
          <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {/* Team 1 Block (Left) */}
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TeamIdentityMark team={team1Meta} logoSource={getTeamLogoSource(team1Meta)} size={38} />
              <View style={{ flex: 1, alignItems: 'flex-start', justifyContent: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text selectable numberOfLines={1} style={{ color: isTeam1Batting ? '#FFFFFF' : '#94A3B8', fontSize: 13, fontFamily: systemFontMedium, letterSpacing: 0.3 }}>
                    {getTeamShortCode(team1Meta, team1Name)}
                  </Text>
                  {isTeam1Batting ? <MaterialCommunityIcons name="cricket" size={12} color="#0284C7" /> : null}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 1 }}>
                  <Text selectable numberOfLines={1} style={{ color: '#FFFFFF', fontSize: 16.5, fontFamily: systemFontBold, fontVariant: ['tabular-nums'] }}>
                    {t1ScoreParts.score}
                  </Text>
                  {Boolean(t1ScoreParts.overs) && (
                    <Text selectable numberOfLines={1} style={{ color: '#94A3B8', fontSize: 10.5, fontFamily: systemFontMedium, fontVariant: ['tabular-nums'] }}>
                      {t1ScoreParts.overs}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Center Live Event or Lightning Bolt */}
            <View style={{ minWidth: 42, alignItems: 'center', justifyContent: 'center' }}>
              {latestDelivery?.label ? (
                <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#0B2A42', borderWidth: 0, borderColor: '#2B5C78' }}>
                  <Text numberOfLines={1} style={{ color: latestDeliveryColor, fontSize: 13, fontFamily: systemFontBold }}>
                    {latestDelivery.label}
                  </Text>
                </View>
              ) : (
                <MaterialCommunityIcons name="lightning-bolt" size={18} color="#64748B" />
              )}
            </View>

            {/* Team 2 Block (Right) */}
            <View style={{ flex: 1, flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
              <TeamIdentityMark team={team2Meta} logoSource={getTeamLogoSource(team2Meta)} size={38} />
              <View style={{ flex: 1, alignItems: 'flex-end', justifyContent: 'center' }}>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 4 }}>
                  <Text selectable numberOfLines={1} style={{ color: isTeam2Batting ? '#FFFFFF' : '#94A3B8', fontSize: 13, fontFamily: systemFontMedium, letterSpacing: 0.3 }}>
                    {getTeamShortCode(team2Meta, team2Name)}
                  </Text>
                  {isTeam2Batting ? <MaterialCommunityIcons name="cricket" size={12} color="#0284C7" /> : null}
                </View>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'baseline', gap: 4, marginTop: 1 }}>
                  <Text selectable numberOfLines={1} style={{ color: '#FFFFFF', fontSize: 16.5, fontFamily: systemFontBold, fontVariant: ['tabular-nums'] }}>
                    {t2ScoreParts.score}
                  </Text>
                  {Boolean(t2ScoreParts.overs) && (
                    <Text selectable numberOfLines={1} style={{ color: '#94A3B8', fontSize: 10.5, fontFamily: systemFontMedium, fontVariant: ['tabular-nums'] }}>
                      {t2ScoreParts.overs}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Bottom Gold/Yellow Status Banner */}
          <View style={{ paddingHorizontal: 16, paddingBottom: 10, alignItems: 'center', justifyContent: 'center' }}>
            <Text selectable numberOfLines={1} style={{ color: '#F59E0B', fontSize: 12, fontFamily: systemFontMedium, textAlign: 'center', letterSpacing: 0.2 }}>
              {liveStatusText}
            </Text>
          </View>
        </View>
      </View>

      {/* ─── NATIVE HORIZONTAL SWIPEABLE PAGER (INFO | LIVE | SCORECARD | OVERS | GRAPHS | TABLE) ─── */}
      <PagerView
        ref={publicPagerRef}
        style={{ flex: 1 }}
        initialPage={Math.max(0, publicTabs.findIndex(tab => tab.id === publicLiveTab))}
        onPageSelected={handlePublicPageSelected}
        onPageScroll={handlePublicPageScroll}
      >
        {publicTabs.map(({ id: pageTabId }) => (
          <View key={pageTabId} style={{ flex: 1 }}>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 14, paddingBottom: 28, gap: 12 }}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {/* ─── TAB 1: INFO TAB ─── */}
              {pageTabId === 'info' && (
                <MatchInfoPanel
                  match={activeMatch}
                  teamOne={team1Meta}
                  teamTwo={team2Meta}
                  teamOneName={team1Name}
                  teamTwoName={team2Name}
                  tossSummary={`${tossWinnerName} won the toss and chose to ${tossDecisionText}`}
                  playerCount={publicTeamOneRoster.length + publicTeamTwoRoster.length}
                  onOpenPlayingXi={(tName) => {
                    if (setPlayingXiVisible) setPlayingXiVisible(true);
                  }}
                  onPressTournament={handleOpenTournament}
                  tournamentData={resolvedTournament || activeMatch.tournament}
                />
              )}

              {/* ─── TAB 2: LIVE TAB ─── */}
              {pageTabId === 'live' && (
                <View style={{ gap: 12 }}>
                  {/* CURRENT OVER TIMELINE */}
                  <View style={{ backgroundColor: '#FFFFFF', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 0 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <Text style={{ fontSize: 11, color: '#64748B', fontFamily: systemFontBold, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        CURRENT OVER ({currentOverNum})
                      </Text>
                      <Text style={{ fontSize: 11, color: '#0284C7', fontFamily: systemFontMedium }}>
                        {thisOverRuns} Runs
                      </Text>
                    </View>
                    {renderCompactOverTimeline({
                      previousOver: !curInn.isOverComplete ? latestCompletedOver : null,
                      currentOverNumber: currentOverNum,
                      currentBalls: currentOverBalls,
                      currentRuns: thisOverRuns,
                      size: 24,
                      contentPaddingRight: 8,
                      startAtEnd: true
                    })}
                  </View>

                  {/* REALTIME WIN BAR */}
                  <RealtimeWinBar match={activeMatch} inning={curInn} />

                  {/* ON PITCH BATTERS */}
                  <View style={{ backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 0, overflow: 'hidden' }}>
                    <View style={{ minHeight: 42, backgroundColor: '#F8FAFC', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 0, borderBottomColor: '#E2E8F0' }}>
                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ color: '#1477A8', fontSize: 11.5, fontFamily: systemFontBold }}>BATTER</Text>
                        <MaterialCommunityIcons name="cricket" size={13} color="#1477A8" />
                      </View>
                      <Text style={{ color: '#7C8793', fontSize: 11.5, width: 34, textAlign: 'right', fontFamily: systemFontBold }}>R</Text>
                      <Text style={{ color: '#7C8793', fontSize: 11.5, width: 30, textAlign: 'right', fontFamily: systemFontBold }}>B</Text>
                      <Text style={{ color: '#7C8793', fontSize: 11.5, width: 32, textAlign: 'right', fontFamily: systemFontBold }}>4s</Text>
                      <Text style={{ color: '#7C8793', fontSize: 11.5, width: 32, textAlign: 'right', fontFamily: systemFontBold }}>6s</Text>
                      <Text style={{ color: '#7C8793', fontSize: 11.5, width: 54, textAlign: 'right', fontFamily: systemFontBold }}>SR</Text>
                    </View>
                    {batterRows.length > 0 ? (
                      batterRows.map(({ player, isStriker }, bIdx) => {
                        const strikeRate = player.balls > 0 ? ((player.runs / player.balls) * 100).toFixed(1) : '0.0';
                        return (
                          <TouchableOpacity
                            key={`${player.name}-${isStriker}`}
                            onPress={() => handleOpenPlayerProfile && handleOpenPlayerProfile(player.name)}
                            activeOpacity={0.7}
                            style={{
                              minHeight: 52,
                              paddingHorizontal: 14,
                              flexDirection: 'row',
                              alignItems: 'center',
                              borderTopWidth: bIdx > 0 ? 1 : 0,
                              borderTopColor: '#F1F5F9',
                              backgroundColor: '#FFFFFF'
                            }}
                          >
                            <View style={{ flex: 1, paddingRight: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text selectable style={{ color: '#0F172A', fontSize: 13, fontFamily: systemFontMedium }} numberOfLines={1}>
                                {player.name} {isStriker ? '*' : ''}
                              </Text>
                            </View>
                            <Text selectable style={{ width: 34, color: '#0F172A', fontSize: 13.5, fontFamily: systemFontBold, textAlign: 'right', fontVariant: ['tabular-nums'] }}>{player.runs}</Text>
                            <Text selectable style={{ width: 30, color: '#64748B', fontSize: 12, fontFamily: systemFontMedium, textAlign: 'right', fontVariant: ['tabular-nums'] }}>{player.balls}</Text>
                            <Text selectable style={{ width: 32, color: '#64748B', fontSize: 12, fontFamily: systemFontMedium, textAlign: 'right', fontVariant: ['tabular-nums'] }}>{player.fours || 0}</Text>
                            <Text selectable style={{ width: 32, color: '#64748B', fontSize: 12, fontFamily: systemFontMedium, textAlign: 'right', fontVariant: ['tabular-nums'] }}>{player.sixes || 0}</Text>
                            <Text selectable style={{ width: 54, color: '#0284C7', fontSize: 11.5, fontFamily: systemFontMedium, textAlign: 'right', fontVariant: ['tabular-nums'] }}>{strikeRate}</Text>
                          </TouchableOpacity>
                        );
                      })
                    ) : (
                      <Text style={{ color: '#94A3B8', fontSize: 12, padding: 14, textAlign: 'center', fontFamily: systemFontMedium }}>Opening batters not set yet</Text>
                    )}
                  </View>

                  {/* CURRENT BOWLER */}
                  {curInn.bowler?.name ? (
                    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 0, overflow: 'hidden' }}>
                      <View style={{ minHeight: 42, backgroundColor: '#F8FAFC', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 0, borderBottomColor: '#F1F5F9' }}>
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Text style={{ color: '#1477A8', fontSize: 11.5, fontFamily: systemFontBold }}>BOWLER</Text>
                          <MaterialCommunityIcons name="baseball" size={13} color="#1477A8" />
                        </View>
                        <Text style={{ color: '#7C8793', fontSize: 11.5, width: 34, textAlign: 'right', fontFamily: systemFontBold }}>O</Text>
                        <Text style={{ color: '#7C8793', fontSize: 11.5, width: 34, textAlign: 'right', fontFamily: systemFontBold }}>R</Text>
                        <Text style={{ color: '#7C8793', fontSize: 11.5, width: 32, textAlign: 'right', fontFamily: systemFontBold }}>W</Text>
                        <Text style={{ color: '#7C8793', fontSize: 11.5, width: 50, textAlign: 'right', fontFamily: systemFontBold }}>ECO</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleOpenPlayerProfile && handleOpenPlayerProfile(curInn.bowler?.name)}
                        activeOpacity={0.7}
                        style={{ minHeight: 50, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF' }}
                      >
                        <View style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                          <Text selectable style={{ color: '#0F172A', fontSize: 13, fontFamily: systemFontMedium }} numberOfLines={1}>
                            {curInn.bowler.name}
                          </Text>
                        </View>
                        <Text selectable style={{ color: '#475569', fontSize: 12, width: 34, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFontMedium }}>{curInn.bowler.overs || '0.0'}</Text>
                        <Text selectable style={{ color: '#475569', fontSize: 12, width: 34, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFontMedium }}>{curInn.bowler.runs || 0}</Text>
                        <Text selectable style={{ color: '#0284C7', fontSize: 13, width: 32, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFontBold }}>{curInn.bowler.wickets || 0}</Text>
                        <Text selectable style={{ color: '#1477A8', fontSize: 12, width: 50, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFontMedium }}>{bowlerEco}</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              )}

              {/* ─── TAB 3: SCORECARD TAB ─── */}
              {pageTabId === 'scorecard' && (
                <CompleteScorecardView
                  match={activeMatch}
                  inningIndex={scorecardInningIndex}
                  onSelectInning={(idx) => setScorecardInningIndex(idx)}
                  onSelectPlayer={(pName) => handleOpenPlayerProfile && handleOpenPlayerProfile(pName)}
                  isLive={true}
                  team1Name={team1Name}
                  team2Name={team2Name}
                  team1Score={inn1?.battingTeam ? `${inn1.battingTeam.runs ?? 0}-${inn1.battingTeam.wickets ?? 0}  ${formatOvers(inn1.totalLegalBalls || 0)}` : '0-0'}
                  team2Score={inn2?.battingTeam ? `${inn2.battingTeam.runs ?? 0}-${inn2.battingTeam.wickets ?? 0}  ${formatOvers(inn2.totalLegalBalls || 0)}` : (isInn2 ? '0-0  0.0' : 'Yet to bat')}
                />
              )}

              {/* ─── TAB 4: OVERS TAB ─── */}
              {pageTabId === 'overs' && (
                <View style={{ gap: 12 }}>
                  {/* Overs Inning Switcher (So Inning 1 overs are always accessible) */}
                  <View style={{ flexDirection: 'row', gap: 8, padding: 10, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 0 }}>
                    {[
                      { name: `${team1Name} (Inn 1)`, count: inn1?.overHistory?.length || 0 },
                      { name: `${team2Name} (Inn 2)`, count: inn2?.overHistory?.length || 0 }
                    ].map((tObj, idx) => {
                      const active = oversInningIndex === idx;
                      return (
                        <TouchableOpacity
                          key={tObj.name}
                          onPress={() => setOversInningIndex(idx)}
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

                  {oversHistoryList.length === 0 ? (
                    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: 24, borderWidth: 0, alignItems: 'center' }}>
                      <MaterialCommunityIcons name="clock-outline" size={32} color="#CBD5E1" />
                      <Text style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', marginTop: 8, fontFamily: systemFontMedium }}>
                        No overs completed in this inning yet.
                      </Text>
                    </View>
                  ) : (
                    oversHistoryList.map((o, idx) => (
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

              {/* ─── TAB 5: GRAPHS TAB ─── */}
              {pageTabId === 'graphs' && (
                <View style={{ gap: 14 }}>
                  <WormGraph
                    match={activeMatch}
                    team1Inning={inn1}
                    team2Inning={inn2}
                  />
                  <ManhattanGraph
                    match={activeMatch}
                    team1Inning={inn1}
                    team2Inning={inn2}
                  />
                </View>
              )}

              {/* ─── TAB 6: POINTS TABLE TAB (FOR TOURNAMENTS) ─── */}
              {pageTabId === 'table' && (
                <View style={{ gap: 14 }}>
                  <PointsTableSection
                    pointsTableData={tournamentPointsTable}
                    tournamentTeams={resolvedTournament?.teams || activeMatch.tournament?.teams || activeMatch.teams || []}
                    totalTeams={(resolvedTournament?.teams || activeMatch.tournament?.teams || activeMatch.teams || []).length}
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
        match={activeMatch || selectedMatch}
      />
    </View>
  );
}

export default PublicLiveViewScreen;
