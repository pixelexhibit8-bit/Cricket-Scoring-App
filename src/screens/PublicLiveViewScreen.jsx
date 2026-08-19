import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
  useWindowDimensions,
  StyleSheet
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  systemFont,
  systemFontBold,
  systemFontMedium,
  typeScale,
  fontWeights
} from '../theme.js';
import { TeamIdentityMark } from '../components/TeamIdentityMark.jsx';
import { MatchTabBar } from '../components/MatchTabBar.jsx';
import { RealtimeWinBar } from '../components/RealtimeWinBar.jsx';
import { PreInningsScorecard } from '../components/PreInningsScorecard.jsx';
import { WormGraph } from '../components/WormGraph.jsx';
import { ManhattanGraph } from '../components/ManhattanGraph.jsx';
import { MatchInfoPanel } from '../components/MatchInfoPanel.jsx';
import { PlayerAvatar } from '../components/PlayerAvatar.jsx';
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
  makeInning
} from '../utils/cricketUtils.js';
import { MASTER_PLAYERS_DB } from '../../mockData.js';

const PUBLIC_LIVE_TABS = [
  { id: 'info', label: 'Info' },
  { id: 'live', label: 'Live' },
  { id: 'scorecard', label: 'Scorecard' },
  { id: 'overs', label: 'Overs' },
  { id: 'graphs', label: 'Graphs' }
];

export function PublicLiveViewScreen({
  activeMatch,
  publicLiveTab = 'live',
  setPublicLiveTab,
  liveViewReturnScreen = 'home',
  setCurrentScreen,
  handleOpenPlayerProfile,
  refreshing = false,
  handlePullToRefresh,
  setPlayingXiTeamTab,
  setPlayingXiVisible,
  playingXiPagerScrollX
}) {
  const { width: screenWidth } = useWindowDimensions();
  const [publicTabLayouts, setPublicTabLayouts] = useState({});
  const [scorecardInningIndex, setScorecardInningIndex] = useState(0);
  const [oversInningIndex, setOversInningIndex] = useState(0);

  const publicTabsRef = useRef(null);
  const publicPagerRef = useRef(null);
  const publicPagerScrollX = useRef(new Animated.Value(
    PUBLIC_LIVE_TABS.findIndex(tab => tab.id === publicLiveTab) * screenWidth
  )).current;

  if (!activeMatch || !activeMatch.innings || !activeMatch.innings.length) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#F8FAFC' }}>
        <Ionicons name="radio-outline" size={34} color="#94A3B8" />
        <Text style={{ color: '#0F172A', fontSize: 16, fontFamily: systemFontBold, marginTop: 10 }}>No live match in progress</Text>
        <TouchableOpacity onPress={() => setCurrentScreen && setCurrentScreen('home')} style={{ minHeight: 42, marginTop: 14, paddingHorizontal: 18, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0284C7' }}>
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
    overs: `(${formatOvers(inn1.totalLegalBalls || 0)} ov)`
  } : { score: 'Yet to bat', overs: '' };

  const t2ScoreParts = inn2?.battingTeam ? {
    score: `${inn2.battingTeam.runs ?? 0}-${inn2.battingTeam.wickets ?? 0}`,
    overs: `(${formatOvers(inn2.totalLegalBalls || 0)} ov)`
  } : (isInn2 ? { score: '0-0', overs: '(0.0 ov)' } : { score: 'Yet to bat', overs: '' });

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
  const scorecardDeclaredPlayers = scorecardDeclaredRoster.map(name => {
    const profile = MASTER_PLAYERS_DB.find(player => player.name === name);
    return {
      name,
      avg: profile?.avg != null ? Number(profile.avg).toFixed(2) : '-',
      sr: profile?.sr != null ? Number(profile.sr).toFixed(2) : '-'
    };
  });
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

  const changePublicLiveTab = (nextTabId, movePager = true) => {
    const nextIndex = PUBLIC_LIVE_TABS.findIndex(tab => tab.id === nextTabId);
    if (nextIndex < 0) return;

    keepPublicTabVisible(nextIndex);
    if (movePager) {
      publicPagerRef.current?.scrollTo({ x: nextIndex * screenWidth, animated: true });
    }
    if (nextTabId !== publicLiveTab) setPublicLiveTab(nextTabId);
  };

  const handlePublicPagerEnd = (event) => {
    const nextIndex = Math.max(
      0,
      Math.min(PUBLIC_LIVE_TABS.length - 1, Math.round(event.nativeEvent.contentOffset.x / screenWidth))
    );
    const nextTab = PUBLIC_LIVE_TABS[nextIndex];
    if (!nextTab) return;
    keepPublicTabVisible(nextIndex);
    if (nextTab.id !== publicLiveTab) setPublicLiveTab(nextTab.id);
  };

  // Overs Tab data (Inning 1 & Inning 2)
  const oversViewInning = oversInningIndex === 1 ? inn2 : inn1;
  const oversHistoryList = oversViewInning?.overHistory || [];

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      {/* ─── TOP DARK NAVY HEADER (MATCH TITLE + TABS + INTEGRATED LIVE HERO) ─── */}
      <View style={{ backgroundColor: '#071B2C', borderBottomWidth: 1, borderBottomColor: '#123A56' }}>
        {/* Top Title & Back */}
        <View style={{ paddingHorizontal: 14, paddingTop: 10, paddingBottom: 4, flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => setCurrentScreen && setCurrentScreen(liveViewReturnScreen)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <Ionicons name="arrow-back" size={18} color="#E0F2FE" />
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontFamily: systemFontMedium }} numberOfLines={1}>
              {activeMatch.matchTitle || `${team1Name} vs ${team2Name}`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 5-Tabs Strip */}
        <MatchTabBar
          tabs={PUBLIC_LIVE_TABS}
          activeTab={publicLiveTab}
          layouts={publicTabLayouts}
          pageWidth={screenWidth}
          scrollX={publicPagerScrollX}
          scrollRef={publicTabsRef}
          onPress={changePublicLiveTab}
          onTabLayout={capturePublicTabLayout}
          tone="dark"
        />

        {/* INTEGRATED MATCH SCORE HERO (MATCHING SCREENSHOT 2) */}
        <View style={{ borderTopWidth: 1, borderTopColor: '#123A56' }}>
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
                <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#0B2A42', borderWidth: 1, borderColor: '#2B5C78' }}>
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

      {/* ─── HORIZONTAL SWIPEABLE PAGER (INFO | LIVE | SCORECARD | OVERS | GRAPHS) ─── */}
      <Animated.ScrollView
        ref={publicPagerRef}
        horizontal
        pagingEnabled
        snapToInterval={screenWidth}
        snapToAlignment="start"
        disableIntervalMomentum
        directionalLockEnabled
        nestedScrollEnabled
        bounces={false}
        overScrollMode="never"
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: publicPagerScrollX } } }],
          { useNativeDriver: true }
        )}
        onMomentumScrollEnd={handlePublicPagerEnd}
        onLayout={() => {
          const activeIndex = Math.max(0, PUBLIC_LIVE_TABS.findIndex(tab => tab.id === publicLiveTab));
          const offset = activeIndex * screenWidth;
          publicPagerRef.current?.scrollTo({ x: offset, animated: false });
          publicPagerScrollX.setValue(offset);
          keepPublicTabVisible(activeIndex, false);
        }}
        style={{ flex: 1 }}
      >
        {PUBLIC_LIVE_TABS.map(({ id: pageTabId }) => (
          <View key={pageTabId} style={{ width: screenWidth, flex: 1 }}>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 14, paddingBottom: 28, gap: 12 }}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handlePullToRefresh}
                  colors={['#0284C7']}
                  tintColor="#0284C7"
                />
              }
            >
              {/* ─── TAB 1: INFO TAB ─── */}
              {pageTabId === 'info' && (
                <MatchInfoPanel
                  rows={[
                    { icon: 'trophy-outline', label: 'Match', value: activeMatch.matchTitle || `${team1Name} vs ${team2Name}` },
                    { icon: 'calendar-outline', label: 'Date & time', value: formatMatchDateTime(activeMatch.startedAt) },
                    { icon: 'swap-horizontal-outline', label: 'Toss', value: activeMatch.tossResult || `${tossWinnerName} chose to ${tossDecisionText}`, emphasis: true },
                    activeMatch.venue ? { icon: 'location-outline', label: 'Venue', value: activeMatch.venue } : null,
                    { icon: 'person-outline', label: 'Umpire', value: activeMatch.umpireName || 'Cric Scorer' },
                    { icon: 'partly-sunny-outline', label: 'Conditions', value: activeMatch.conditions || '28°C, Clear Sky' }
                  ]}
                  teamOneName={team1Name}
                  teamTwoName={team2Name}
                  playerCount={publicTeamOneRoster.length + publicTeamTwoRoster.length}
                  onOpenPlayingXi={() => {
                    if (setPlayingXiTeamTab) setPlayingXiTeamTab(1);
                    if (playingXiPagerScrollX) playingXiPagerScrollX.setValue(0);
                    if (setPlayingXiVisible) setPlayingXiVisible(true);
                  }}
                />
              )}

              {/* ─── TAB 2: LIVE TAB ─── */}
              {pageTabId === 'live' && (
                <View style={{ gap: 12 }}>
                  {/* CURRENT OVER TIMELINE */}
                  <View style={{ backgroundColor: '#FFFFFF', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#E2E8F0' }}>
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
                  <View style={{ backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' }}>
                    <View style={{ minHeight: 42, backgroundColor: '#F8FAFC', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
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
                    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' }}>
                      <View style={{ minHeight: 42, backgroundColor: '#F8FAFC', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
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
                <View style={{ gap: 14 }}>
                  {/* INNINGS SWITCHER PILLS (MATCHING FINISHED VIEW) */}
                  <View style={{ flexDirection: 'row', gap: 8, padding: 12, backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0' }}>
                    {[
                      {
                        name: team1Name,
                        score: inn1?.battingTeam ? `${inn1.battingTeam.runs ?? 0}-${inn1.battingTeam.wickets ?? 0} (${formatOvers(inn1.totalLegalBalls || 0)} ov)` : '0-0'
                      },
                      {
                        name: team2Name,
                        score: inn2?.battingTeam ? `${inn2.battingTeam.runs ?? 0}-${inn2.battingTeam.wickets ?? 0} (${formatOvers(inn2.totalLegalBalls || 0)} ov)` : (isInn2 ? '0-0 (0.0 ov)' : 'Yet to bat')
                      }
                    ].map((tObj, idx) => {
                      const active = scorecardInningIndex === idx;
                      return (
                        <TouchableOpacity
                          key={tObj.name}
                          onPress={() => setScorecardInningIndex(idx)}
                          style={{
                            flex: 1,
                            minHeight: 48,
                            paddingHorizontal: 8,
                            paddingVertical: 6,
                            borderRadius: 8,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: active ? '#0284C7' : '#FFFFFF',
                            borderWidth: 1,
                            borderColor: active ? '#0284C7' : '#D9DEE3'
                          }}
                        >
                          <Text style={{ fontSize: 13, fontFamily: systemFontMedium, color: active ? '#FFFFFF' : '#0F172A', textAlign: 'center' }} numberOfLines={1}>
                            {tObj.name}
                          </Text>
                          <Text style={{ fontSize: 10.5, fontFamily: systemFontMedium, color: active ? '#D6EEFF' : '#64748B', marginTop: 2 }} numberOfLines={1}>
                            {tObj.score}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {!scorecardHasStarted ? (
                    <PreInningsScorecard players={scorecardDeclaredPlayers} />
                  ) : (
                    <>
                      {/* BATTING TABLE */}
                      <View style={{ backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' }}>
                        <View style={{ minHeight: 44, backgroundColor: '#F8FAFC', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
                          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Text style={{ color: '#1477A8', fontSize: 12, fontFamily: systemFontBold }}>BATTER</Text>
                            <Ionicons name="arrow-down" size={12} color="#1477A8" />
                          </View>
                          <Text style={{ color: '#7C8793', fontSize: 11.5, width: 34, textAlign: 'right', fontFamily: systemFontBold }}>R</Text>
                          <Text style={{ color: '#7C8793', fontSize: 11.5, width: 30, textAlign: 'right', fontFamily: systemFontBold }}>B</Text>
                          <Text style={{ color: '#7C8793', fontSize: 11.5, width: 32, textAlign: 'right', fontFamily: systemFontBold }}>4s</Text>
                          <Text style={{ color: '#7C8793', fontSize: 11.5, width: 32, textAlign: 'right', fontFamily: systemFontBold }}>6s</Text>
                          <Text style={{ color: '#7C8793', fontSize: 11.5, width: 54, textAlign: 'right', fontFamily: systemFontBold }}>SR</Text>
                        </View>

                        {scorecardKnownBatters.map((b, bi) => {
                          const sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0';
                          return (
                            <View key={`${scorecardInningIndex}-${b.name}-${bi}`} style={{ borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                              <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => handleOpenPlayerProfile && handleOpenPlayerProfile(b.name)}
                                style={{ minHeight: 54, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' }}
                              >
                                <View style={{ flex: 1, paddingRight: 6 }}>
                                  <Text selectable style={{ color: '#0F172A', fontSize: 13, fontFamily: systemFontMedium }} numberOfLines={1}>
                                    {b.name} {b.name === viewInningObj.striker?.name ? '*' : ''}
                                  </Text>
                                  <Text selectable style={{ color: b.isOut ? '#64748B' : '#0284C7', fontSize: 10.5, marginTop: 2, fontFamily: systemFontMedium }} numberOfLines={1}>
                                    {b.dismissal || 'Not out'}
                                  </Text>
                                </View>
                                <Text selectable style={{ color: '#0F172A', fontSize: 13.5, width: 34, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFontBold }}>{b.runs}</Text>
                                <Text selectable style={{ color: '#64748B', fontSize: 12, width: 30, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFontMedium }}>{b.balls}</Text>
                                <Text selectable style={{ color: '#64748B', fontSize: 12, width: 32, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFontMedium }}>{b.fours || 0}</Text>
                                <Text selectable style={{ color: '#64748B', fontSize: 12, width: 32, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFontMedium }}>{b.sixes || 0}</Text>
                                <Text selectable style={{ color: '#0284C7', fontSize: 11.5, width: 54, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFontMedium }}>{sr}</Text>
                              </TouchableOpacity>
                            </View>
                          );
                        })}

                        {/* Extras row */}
                        <View style={{ minHeight: 40, paddingHorizontal: 14, backgroundColor: '#F8FAFC', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={{ color: '#64748B', fontSize: 11, fontFamily: systemFontBold }}>EXTRAS</Text>
                          <Text selectable style={{ color: '#0F172A', fontSize: 13, fontFamily: systemFontBold, fontVariant: ['tabular-nums'] }}>{scorecardExtras}</Text>
                        </View>
                      </View>

                      {/* BOWLING TABLE */}
                      <View style={{ backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' }}>
                        <View style={{ minHeight: 44, backgroundColor: '#F8FAFC', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
                          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Text style={{ color: '#1477A8', fontSize: 12, fontFamily: systemFontBold }}>BOWLER</Text>
                            <Ionicons name="arrow-down" size={12} color="#1477A8" />
                          </View>
                          <Text style={{ color: '#7C8793', fontSize: 11.5, width: 34, textAlign: 'right', fontFamily: systemFontBold }}>O</Text>
                          <Text style={{ color: '#7C8793', fontSize: 11.5, width: 34, textAlign: 'right', fontFamily: systemFontBold }}>R</Text>
                          <Text style={{ color: '#7C8793', fontSize: 11.5, width: 32, textAlign: 'right', fontFamily: systemFontBold }}>W</Text>
                          <Text style={{ color: '#7C8793', fontSize: 11.5, width: 50, textAlign: 'right', fontFamily: systemFontBold }}>ECO</Text>
                        </View>
                        {scorecardBowlingRows.length > 0 ? scorecardBowlingRows.map((bowlerRow, bowlerIndex) => (
                          <View key={`${bowlerRow.name}-${bowlerIndex}`} style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderTopWidth: bowlerIndex > 0 ? 1 : 0, borderTopColor: '#F1F5F9' }}>
                            <View style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                              <Text selectable style={{ color: '#0F172A', fontSize: 13, fontFamily: systemFontMedium }} numberOfLines={1}>{bowlerRow.name}</Text>
                            </View>
                            <Text selectable style={{ color: '#64748B', fontSize: 12, width: 34, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFontMedium }}>{bowlerRow.overs}</Text>
                            <Text selectable style={{ color: '#64748B', fontSize: 12, width: 34, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFontMedium }}>{bowlerRow.runs}</Text>
                            <Text selectable style={{ color: '#0284C7', fontSize: 13, width: 32, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFontBold }}>{bowlerRow.wickets}</Text>
                            <Text selectable style={{ color: '#1477A8', fontSize: 12, width: 50, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFontMedium }}>{bowlerRow.econ}</Text>
                          </View>
                        )) : (
                          <Text style={{ color: '#94A3B8', fontSize: 11, padding: 12, textAlign: 'center', fontFamily: systemFontMedium }}>No bowling figures yet</Text>
                        )}
                      </View>

                      {/* PENDING / YET TO BAT BATTERS */}
                      {scorecardPendingBatters && scorecardPendingBatters.length > 0 ? (
                        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 14 }}>
                          <Text style={{ color: '#64748B', fontSize: 11, fontFamily: systemFontBold, letterSpacing: 0.5, marginBottom: 12, textTransform: 'uppercase' }}>
                            YET TO BAT ({scorecardPendingBatters.length})
                          </Text>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                            {scorecardPendingBatters.map(p => (
                              <TouchableOpacity
                                key={p.name}
                                onPress={() => handleOpenPlayerProfile && handleOpenPlayerProfile(p.name)}
                                activeOpacity={0.7}
                                style={{ width: '48%', flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}
                              >
                                <PlayerAvatar name={p.name} photoUrl={p.avatar} size={32} />
                                <View style={{ flex: 1, minWidth: 0 }}>
                                  <Text selectable style={{ color: '#0F172A', fontSize: 12.5, fontFamily: systemFontMedium }} numberOfLines={1}>
                                    {p.name}
                                  </Text>
                                  <Text style={{ color: '#94A3B8', fontSize: 10, fontFamily: systemFontMedium }}>
                                    SR: {p.sr}
                                  </Text>
                                </View>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      ) : null}
                    </>
                  )}
                </View>
              )}

              {/* ─── TAB 4: OVERS TAB ─── */}
              {pageTabId === 'overs' && (
                <View style={{ gap: 12 }}>
                  {/* Overs Inning Switcher (So Inning 1 overs are always accessible) */}
                  <View style={{ flexDirection: 'row', gap: 8, padding: 10, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
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
                            borderWidth: 1,
                            borderColor: active ? '#0284C7' : '#D9DEE3'
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
                    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: 24, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' }}>
                      <MaterialCommunityIcons name="clock-outline" size={32} color="#CBD5E1" />
                      <Text style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', marginTop: 8, fontFamily: systemFontMedium }}>
                        No overs completed in this inning yet.
                      </Text>
                    </View>
                  ) : (
                    oversHistoryList.map((o, idx) => (
                      <View key={idx} style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E2E8F0' }}>
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
            </ScrollView>
          </View>
        ))}
      </Animated.ScrollView>
    </View>
  );
}

export default PublicLiveViewScreen;
