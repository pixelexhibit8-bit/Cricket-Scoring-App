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
  const [expandedScorecardBatter, setExpandedScorecardBatter] = useState(null);

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

  const inn = activeMatch.innings[activeMatch.inning - 1] || activeMatch.innings[0];
  const isInn2 = activeMatch.inning === 2;
  const reqRuns = isInn2 && activeMatch.target ? Math.max(0, activeMatch.target - inn.battingTeam.runs) : null;
  const reqBalls = isInn2 ? Math.max(0, (activeMatch.maxOvers * 6) - inn.totalLegalBalls) : null;

  const crr = inn.totalLegalBalls > 0 ? ((inn.battingTeam.runs / inn.totalLegalBalls) * 6).toFixed(2) : '0.00';
  const strikerSR = inn.striker?.balls > 0 ? ((inn.striker.runs / inn.striker.balls) * 100).toFixed(1) : '0.0';
  const nonStrikerSR = inn.nonStriker?.balls > 0 ? ((inn.nonStriker.runs / inn.nonStriker.balls) * 100).toFixed(1) : '0.0';
  const bowlerEco = inn.bowlerLegalBalls > 0 ? ((inn.bowler.runs / inn.bowlerLegalBalls) * 6).toFixed(1) : '0.0';

  const overHistory = inn.overHistory || [];
  const currentOverBalls = inn.currentOverBalls || [];
  const thisOverRuns = currentOverBalls.reduce((acc, b) => acc + (typeof b === 'number' ? b : 0), 0);
  const currentOverNum = Math.floor((inn.totalLegalBalls || 0) / 6) + 1;
  const latestCompletedOver = (inn.overHistory || [])[(inn.overHistory || []).length - 1];

  const tossWinnerName = getTossWinnerName(activeMatch) || 'Team';
  const tossDecisionText = getTossDecisionText(activeMatch, activeMatch.tossDecision || 'BAT');
  const tossDecisionIcon = tossDecisionText?.includes('BAT') ? 'cricket' : 'baseball';
  const tossWinnerTeamMeta = activeMatch.teams?.find(team => team.name === tossWinnerName) || { name: tossWinnerName };
  const tossWinnerCode = getTeamShortCode(tossWinnerTeamMeta, tossWinnerName);

  const battingTeamMeta = activeMatch.teams?.find(team => team.name === inn.battingTeam.name) || inn.battingTeam;
  const battingTeamCode = getTeamShortCode(battingTeamMeta, inn.battingTeam.name);
  const battingTeamLogoSource = getTeamLogoSource(battingTeamMeta);

  const latestBallToken = currentOverBalls[currentOverBalls.length - 1]
    || latestCompletedOver?.balls?.[latestCompletedOver.balls.length - 1]
    || '';
  const hasDeliveries = (inn.totalLegalBalls > 0) || (currentOverBalls.length > 0) || (overHistory.length > 0) || !!inn.lastDelivery;
  const latestDelivery = (!hasDeliveries || activeMatch.phase === 'result')
    ? null
    : (activeMatch.pendingPublicEvent
      || (inn.lastEvent?.type === 'over' ? { token: '', label: 'Over', type: 'over' } : null)
      || inn.lastDelivery || (latestBallToken ? {
        token: latestBallToken,
        label: formatScoreTokenForPublic(latestBallToken),
        type: isWicketToken(latestBallToken) ? 'wicket' : 'runs'
      } : null));

  const latestDeliveryColor = latestDelivery?.type === 'wicket' ? '#FDA4AF' : '#86EFAC';
  const outcomeBoxWidth = Math.min(120, Math.max(92, screenWidth * 0.27));

  const batterRows = [
    { player: inn.striker, isStriker: true },
    { player: inn.nonStriker, isStriker: false }
  ].filter(row => row.player?.name);

  // Scorecard View Inning Data
  const scorecardChasingTeam = activeMatch.innings[1]?.battingTeam || activeMatch.innings[0]?.bowlingTeam;
  const scorecardFirstBattingTeam = activeMatch.innings[0]?.battingTeam;
  const waitingSecondInning = makeInning(
    scorecardChasingTeam?.name || 'Team 2',
    scorecardFirstBattingTeam?.name || 'Team 1'
  );
  const viewInningObj = scorecardInningIndex === 1
    ? activeMatch.innings[1] || waitingSecondInning
    : activeMatch.innings[0] || inn;
  const scorecardKnownBatters = viewInningObj.allBatters?.length
    ? viewInningObj.allBatters
    : [viewInningObj.striker, viewInningObj.nonStriker].filter(player => player?.name);
  const scorecardExtras = Math.max(0, viewInningObj.battingTeam.runs - scorecardKnownBatters.reduce((total, player) => total + (player.runs || 0), 0));
  const scorecardBowlingRows = getInningBowlingRows(viewInningObj);
  const scorecardPartnershipHistory = viewInningObj.partnershipHistory || [];
  const scorecardFallOfWickets = scorecardPartnershipHistory.filter(item => item.status === 'out' && item.dismissedName);
  const scorecardCurrentPartners = [viewInningObj.striker, viewInningObj.nonStriker].filter(player => player?.name);
  const scorecardPartnerships = [
    ...scorecardPartnershipHistory,
    ...(scorecardCurrentPartners.length === 2 && ((viewInningObj.partnershipRuns || 0) > 0 || (viewInningObj.partnershipBalls || 0) > 0) ? [{
      wicketNumber: (viewInningObj.battingTeam.wickets || 0) + 1,
      p1: scorecardCurrentPartners[0].name,
      r1: inn.striker?.runs || 0,
      p2: scorecardCurrentPartners[1].name,
      r2: inn.nonStriker?.runs || 0,
      totalRuns: viewInningObj.partnershipRuns || 0,
      totalBalls: viewInningObj.partnershipBalls || 0,
      status: 'unbroken'
    }] : [])
  ];
  const scorecardHasStarted = Boolean(
    (viewInningObj.totalLegalBalls || 0) > 0
    || (viewInningObj.currentOverBalls || []).length > 0
    || (viewInningObj.overHistory || []).length > 0
  );
  const scorecardDeclaredRoster = activeMatch.playingXI?.[viewInningObj.battingTeam.name] || [];
  const scorecardDeclaredPlayers = scorecardDeclaredRoster.map(name => {
    const profile = MASTER_PLAYERS_DB.find(player => player.name === name);
    return {
      name,
      avg: profile?.avg != null ? Number(profile.avg).toFixed(2) : '-',
      sr: profile?.sr != null ? Number(profile.sr).toFixed(2) : '-'
    };
  });
  const scorecardPendingBatters = getUnplayedBatters(scorecardDeclaredRoster, scorecardKnownBatters);
  const scorecardInningIsComplete = activeMatch.phase === 'result'
    || viewInningObj.status === 'complete'
    || scorecardInningIndex + 1 < activeMatch.inning;
  const scorecardPendingTitle = scorecardInningIsComplete ? 'DID NOT BAT' : 'YET TO BAT';

  const publicTeamOneName = activeMatch.teams?.[0]?.name || activeMatch.innings[0]?.battingTeam?.name || 'Team 1';
  const publicTeamTwoName = activeMatch.teams?.[1]?.name || activeMatch.innings[0]?.bowlingTeam?.name || 'Team 2';
  const publicTeamOneRoster = activeMatch.playingXI?.[publicTeamOneName] || [];
  const publicTeamTwoRoster = activeMatch.playingXI?.[publicTeamTwoName] || [];

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

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      {/* ─── TOP DARK NAVY HEADER WITH BACK BUTTON & TABS ─── */}
      <View style={{ backgroundColor: '#071B2C', paddingHorizontal: 14, paddingTop: 10, borderBottomWidth: 1, borderBottomColor: '#123A56' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 6 }}>
          <TouchableOpacity onPress={() => setCurrentScreen && setCurrentScreen(liveViewReturnScreen)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <Ionicons name="arrow-back" size={18} color="#E0F2FE" />
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontFamily: systemFontMedium }} numberOfLines={1}>
              {activeMatch.matchTitle}
            </Text>
          </TouchableOpacity>
        </View>

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
              contentContainerStyle={{ padding: 14, paddingBottom: 24, gap: 14 }}
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
                    { icon: 'trophy-outline', label: 'Match', value: activeMatch.matchTitle },
                    { icon: 'calendar-outline', label: 'Date & time', value: formatMatchDateTime(activeMatch.startedAt) },
                    { icon: 'swap-horizontal-outline', label: 'Toss', value: activeMatch.tossResult || `${tossWinnerName} chose to ${tossDecisionText}`, emphasis: true },
                    activeMatch.venue ? { icon: 'location-outline', label: 'Venue', value: activeMatch.venue } : null,
                    { icon: 'person-outline', label: 'Umpire', value: activeMatch.umpireName || 'Cric Scorer' },
                    { icon: 'partly-sunny-outline', label: 'Conditions', value: activeMatch.conditions || '28°C, Clear Sky' }
                  ]}
                  teamOneName={publicTeamOneName}
                  teamTwoName={publicTeamTwoName}
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
                <View style={{ gap: 14 }}>
                  {/* PROMINENT LIVE SCORECARD HERO */}
                  <View style={{ backgroundColor: '#071B2C', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#123A56', overflow: 'hidden' }}>
                    <View style={{ position: 'relative', minHeight: 58, flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ flex: 1, minWidth: 0, paddingRight: latestDelivery?.label ? 14 : 0, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <TeamIdentityMark team={battingTeamMeta} logoSource={battingTeamLogoSource} size={50} />
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text selectable style={{ color: '#7DD3FC', fontSize: 13, fontFamily: systemFontMedium }} numberOfLines={1}>
                            {battingTeamCode}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 7, marginTop: 3 }}>
                            <Text selectable style={{ color: '#FFFFFF', fontSize: 26, fontFamily: systemFontBold, fontVariant: ['tabular-nums'] }}>
                              {inn.battingTeam.runs}-{inn.battingTeam.wickets}
                            </Text>
                            <Text selectable style={{ color: '#9FC4D7', fontSize: 14, fontFamily: systemFontMedium, fontVariant: ['tabular-nums'] }}>
                              {formatOvers(inn.totalLegalBalls)} Ov
                            </Text>
                          </View>
                        </View>
                      </View>

                      {latestDelivery?.label ? (
                        <>
                          <View pointerEvents="none" style={{ position: 'absolute', left: '50%', top: 8, bottom: 0, width: StyleSheet.hairlineWidth, backgroundColor: '#2B5C78' }} />
                          <View style={{ flex: 1, minWidth: 0, paddingLeft: 14, alignItems: 'center', justifyContent: 'center' }}>
                            <View style={{ width: outcomeBoxWidth, minHeight: 48, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' }}>
                              <Text
                                selectable
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                minimumFontScale={0.85}
                                style={{ color: latestDeliveryColor, fontSize: 24, fontFamily: systemFontBold, textAlign: 'center' }}
                              >
                                {latestDelivery.label}
                              </Text>
                            </View>
                          </View>
                        </>
                      ) : null}
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#123A56' }}>
                      <Text selectable style={{ color: '#9FC4D7', fontSize: 11.5, fontFamily: systemFontMedium, fontVariant: ['tabular-nums'] }}>
                        CRR <Text style={{ color: '#E0F2FE', fontFamily: systemFontBold }}>{crr}</Text>
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Text style={{ color: '#7EAAC2', fontSize: 10, fontFamily: systemFontMedium }}>TOSS</Text>
                        <Text selectable style={{ color: '#E0F2FE', fontSize: 11.5, fontFamily: systemFontMedium }} numberOfLines={1}>
                          {tossWinnerCode}
                        </Text>
                        <MaterialCommunityIcons name={tossDecisionIcon} size={13} color="#7DD3FC" />
                      </View>
                    </View>
                  </View>

                  {/* CURRENT OVER TIMELINE */}
                  <View style={{ backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#CBD5E1' }}>
                    {renderCompactOverTimeline({
                      previousOver: !inn.isOverComplete ? latestCompletedOver : null,
                      currentOverNumber: currentOverNum,
                      currentBalls: currentOverBalls,
                      currentRuns: thisOverRuns,
                      size: 24,
                      contentPaddingRight: 12,
                      startAtEnd: true
                    })}
                  </View>

                  <RealtimeWinBar match={activeMatch} inning={inn} />

                  {/* ON PITCH BATTERS */}
                  <View style={{ backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#CBD5E1', overflow: 'hidden' }}>
                    <View style={{ minHeight: 38, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
                      <Text style={{ flex: 1, color: '#64748B', fontSize: 11, fontFamily: systemFontBold }}>ON PITCH BATTERS</Text>
                      <Text style={{ width: 30, color: '#94A3B8', fontSize: 11, fontFamily: systemFontBold, textAlign: 'right' }}>R</Text>
                      <Text style={{ width: 30, color: '#94A3B8', fontSize: 11, fontFamily: systemFontBold, textAlign: 'right' }}>B</Text>
                      <Text style={{ width: 28, color: '#94A3B8', fontSize: 11, fontFamily: systemFontBold, textAlign: 'right' }}>4s</Text>
                      <Text style={{ width: 28, color: '#94A3B8', fontSize: 11, fontFamily: systemFontBold, textAlign: 'right' }}>6s</Text>
                      <Text style={{ width: 50, color: '#94A3B8', fontSize: 11, fontFamily: systemFontBold, textAlign: 'right' }}>SR</Text>
                    </View>
                    {batterRows.map(({ player, isStriker }) => {
                      const strikeRate = player.balls > 0 ? ((player.runs / player.balls) * 100).toFixed(1) : '0.0';
                      return (
                        <TouchableOpacity
                          key={`${player.name}-${isStriker}`}
                          onPress={() => handleOpenPlayerProfile && handleOpenPlayerProfile(player.name)}
                          activeOpacity={0.7}
                          style={{ minHeight: 52, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}
                        >
                          <View style={{ flex: 1, paddingRight: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text selectable style={{ color: '#0F172A', fontSize: 13, fontFamily: isStriker ? systemFontBold : systemFontMedium }} numberOfLines={1}>
                              {player.name}
                            </Text>
                            {isStriker ? <MaterialCommunityIcons name="cricket" size={14} color="#0284C7" /> : null}
                          </View>
                          <Text selectable style={{ width: 30, color: '#0F172A', fontSize: 13, fontFamily: systemFontBold, textAlign: 'right', fontVariant: ['tabular-nums'] }}>{player.runs}</Text>
                          <Text selectable style={{ width: 30, color: '#475569', fontSize: 12, fontFamily: systemFontMedium, textAlign: 'right', fontVariant: ['tabular-nums'] }}>{player.balls}</Text>
                          <Text selectable style={{ width: 28, color: '#475569', fontSize: 12, fontFamily: systemFontMedium, textAlign: 'right', fontVariant: ['tabular-nums'] }}>{player.fours || 0}</Text>
                          <Text selectable style={{ width: 28, color: '#475569', fontSize: 12, fontFamily: systemFontMedium, textAlign: 'right', fontVariant: ['tabular-nums'] }}>{player.sixes || 0}</Text>
                          <Text selectable style={{ width: 50, color: '#475569', fontSize: 11.5, fontFamily: systemFontMedium, textAlign: 'right', fontVariant: ['tabular-nums'] }}>{strikeRate}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* CURRENT BOWLER */}
                  {inn.bowler ? (
                    <TouchableOpacity
                      onPress={() => handleOpenPlayerProfile && handleOpenPlayerProfile(inn.bowler?.name)}
                      activeOpacity={0.7}
                      style={{ minHeight: 52, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#FFFFFF' }}
                    >
                      <View style={{ flex: 1, minWidth: 0, paddingRight: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text selectable style={{ color: '#0F172A', fontSize: 13, fontFamily: systemFontBold }} numberOfLines={1}>
                          {inn.bowler.name}
                        </Text>
                        <MaterialCommunityIcons name="baseball" size={14} color="#0284C7" />
                      </View>
                      {[
                        ['O', inn.bowler.overs],
                        ['R', inn.bowler.runs],
                        ['W', inn.bowler.wickets],
                        ['ECO', bowlerEco]
                      ].map(([label, value]) => (
                        <View key={label} style={{ width: label === 'ECO' ? 44 : 30, alignItems: 'flex-end' }}>
                          <Text selectable style={{ color: label === 'W' ? '#0284C7' : '#0F172A', fontSize: 13, fontFamily: systemFontBold, fontVariant: ['tabular-nums'] }}>{value}</Text>
                          <Text style={{ color: '#94A3B8', fontSize: 8.5, marginTop: 1, fontFamily: systemFontMedium }}>{label}</Text>
                        </View>
                      ))}
                    </TouchableOpacity>
                  ) : null}
                </View>
              )}

              {/* ─── TAB 3: SCORECARD TAB ─── */}
              {pageTabId === 'scorecard' && (
                <View style={{ gap: 14 }}>
                  {/* INNINGS SWITCHER PILLS */}
                  <View style={{ flexDirection: 'row', gap: 8, padding: 10, backgroundColor: '#F1F5F9', borderRadius: 12 }}>
                    {[activeMatch.innings[0]?.battingTeam?.name || 'Inning 1', activeMatch.innings[0]?.bowlingTeam?.name || 'Inning 2'].map((teamName, idx) => {
                      const active = scorecardInningIndex === idx;
                      return (
                        <TouchableOpacity
                          key={teamName}
                          onPress={() => setScorecardInningIndex(idx)}
                          style={{
                            flex: 1,
                            paddingVertical: 9,
                            paddingHorizontal: 12,
                            borderRadius: 8,
                            alignItems: 'center',
                            backgroundColor: active ? '#0284C7' : '#FFFFFF',
                            borderWidth: 1,
                            borderColor: active ? '#0284C7' : '#CBD5E1'
                          }}
                        >
                          <Text style={{ fontSize: 12.5, fontFamily: systemFontBold, color: active ? '#FFFFFF' : '#0F172A' }} numberOfLines={1}>
                            {teamName}
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
                      <View style={{ backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#CBD5E1', overflow: 'hidden' }}>
                        <View style={{ minHeight: 44, backgroundColor: '#F8FAFC', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
                          <Text style={{ flex: 1, color: '#1477A8', fontSize: 12, fontFamily: systemFontBold }}>BATTER</Text>
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
                                style={{ minHeight: 56, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' }}
                              >
                                <View style={{ flex: 1, paddingRight: 6 }}>
                                  <Text selectable style={{ color: '#111827', fontSize: 13, fontFamily: systemFontMedium }} numberOfLines={1}>
                                    {b.name} {b.name === viewInningObj.striker?.name ? '*' : ''}
                                  </Text>
                                  <Text selectable style={{ color: b.isOut ? '#64748B' : '#0284C7', fontSize: 10.5, marginTop: 2, fontFamily: systemFont }} numberOfLines={1}>
                                    {b.dismissal || 'Not out'}
                                  </Text>
                                </View>
                                <Text selectable style={{ color: '#111827', fontSize: 13.5, width: 34, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFontBold }}>{b.runs}</Text>
                                <Text selectable style={{ color: '#4B5563', fontSize: 12, width: 30, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFontMedium }}>{b.balls}</Text>
                                <Text selectable style={{ color: '#4B5563', fontSize: 12, width: 32, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFontMedium }}>{b.fours || 0}</Text>
                                <Text selectable style={{ color: '#4B5563', fontSize: 12, width: 32, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFontMedium }}>{b.sixes || 0}</Text>
                                <Text selectable style={{ color: '#374151', fontSize: 11.5, width: 54, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFontMedium }}>{sr}</Text>
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
                      <View style={{ backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#CBD5E1', overflow: 'hidden' }}>
                        <View style={{ minHeight: 44, backgroundColor: '#F8FAFC', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
                          <Text style={{ flex: 1, color: '#1477A8', fontSize: 12, fontFamily: systemFontBold }}>BOWLER</Text>
                          <Text style={{ color: '#7C8793', fontSize: 11, width: 34, textAlign: 'right', fontFamily: systemFontBold }}>O</Text>
                          <Text style={{ color: '#7C8793', fontSize: 11, width: 34, textAlign: 'right', fontFamily: systemFontBold }}>R</Text>
                          <Text style={{ color: '#7C8793', fontSize: 11, width: 32, textAlign: 'right', fontFamily: systemFontBold }}>W</Text>
                          <Text style={{ color: '#7C8793', fontSize: 11, width: 50, textAlign: 'right', fontFamily: systemFontBold }}>ECO</Text>
                        </View>
                        {scorecardBowlingRows.length > 0 ? scorecardBowlingRows.map((bowlerRow, bowlerIndex) => (
                          <View key={`${bowlerRow.name}-${bowlerIndex}`} style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderTopWidth: bowlerIndex > 0 ? 1 : 0, borderTopColor: '#F1F5F9' }}>
                            <View style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                              <Text selectable style={{ color: '#111827', fontSize: 13, fontFamily: systemFontBold }} numberOfLines={1}>{bowlerRow.name}</Text>
                            </View>
                            <Text selectable style={{ color: '#4B5563', fontSize: 12, width: 34, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFontMedium }}>{bowlerRow.overs}</Text>
                            <Text selectable style={{ color: '#4B5563', fontSize: 12, width: 34, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFontMedium }}>{bowlerRow.runs}</Text>
                            <Text selectable style={{ color: '#111827', fontSize: 13, width: 32, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFontBold }}>{bowlerRow.wickets}</Text>
                            <Text selectable style={{ color: '#1477A8', fontSize: 12, width: 50, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFontMedium }}>{bowlerRow.econ}</Text>
                          </View>
                        )) : (
                          <Text style={{ color: '#94A3B8', fontSize: 11, padding: 12, textAlign: 'center', fontFamily: systemFontMedium }}>No bowling yet</Text>
                        )}
                      </View>
                    </>
                  )}
                </View>
              )}

              {/* ─── TAB 4: OVERS TAB ─── */}
              {pageTabId === 'overs' && (
                <View style={{ gap: 10 }}>
                  {overHistory.length === 0 ? (
                    <Text style={{ color: '#94A3B8', fontSize: 12, textAlign: 'center', paddingVertical: 30, fontFamily: systemFontMedium }}>
                      No overs completed yet.
                    </Text>
                  ) : (
                    overHistory.map((o, idx) => (
                      <View key={idx} style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <Text style={{ color: '#0284C7', fontSize: 13, fontFamily: systemFontBold }}>Over {o.overNum} - {o.bowlerName}</Text>
                          <Text style={{ color: '#B45309', fontSize: 13, fontFamily: systemFontBold }}>{o.runs} Runs {o.wickets > 0 ? `- ${o.wickets} W` : ''}</Text>
                        </View>
                        <View style={{ minHeight: 26 }}>
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
                    team1Inning={activeMatch?.innings?.[0]}
                    team2Inning={activeMatch?.innings?.[1]}
                  />
                  <ManhattanGraph
                    match={activeMatch}
                    team1Inning={activeMatch?.innings?.[0]}
                    team2Inning={activeMatch?.innings?.[1]}
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
