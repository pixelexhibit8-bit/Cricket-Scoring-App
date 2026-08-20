import React, { useState, useRef, useEffect } from 'react';
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
import { TeamIdentityMark } from '../components/TeamIdentityMark.jsx';
import { MatchTabBar } from '../components/MatchTabBar.jsx';
import { PlayerAvatar } from '../components/PlayerAvatar.jsx';
import { PreInningsScorecard } from '../components/PreInningsScorecard.jsx';
import { WormGraph } from '../components/WormGraph.jsx';
import { ManhattanGraph } from '../components/ManhattanGraph.jsx';
import { MatchInfoPanel } from '../components/MatchInfoPanel.jsx';
import { FinishedMatchSummary } from '../components/FinishedMatchSummary.jsx';
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
  getDisplayOverHistory,
  getScorePartsFromText
} from '../utils/cricketUtils.js';

const FINISHED_MATCH_TABS = [
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
      <TeamIdentityMark team={team} size={38} isLoser={isLoser} />
      <View style={{ flex: 1, alignItems: align === 'left' ? 'flex-start' : 'flex-end', justifyContent: 'center' }}>
        <View style={{ flexDirection: align === 'left' ? 'row' : 'row-reverse', alignItems: 'center', gap: 4 }}>
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
          {isWinner ? (
            <MaterialCommunityIcons name="trophy" size={13} color="#F59E0B" />
          ) : null}
        </View>

        <View style={{ flexDirection: align === 'left' ? 'row' : 'row-reverse', alignItems: 'baseline', gap: 4, marginTop: 1 }}>
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
          {Boolean(scoreParts.overs) && (
            <Text
              selectable
              style={{
                color: '#94A3B8',
                fontSize: 10.5,
                fontFamily: systemFontMedium,
                fontVariant: ['tabular-nums']
              }}
              numberOfLines={1}
            >
              {scoreParts.overs}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const MatchResultHero = ({ teamOne, teamTwo, winnerTeamName, resultText }) => (
  <View style={{ borderTopWidth: 1, borderTopColor: '#123A56' }}>
    <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <ResultTeamBlock team={teamOne} isWinner={winnerTeamName === teamOne?.name || (resultText && resultText.toLowerCase().includes(teamOne?.name?.toLowerCase()))} align="left" />
      <View style={{ minWidth: 42, alignItems: 'center', justifyContent: 'center' }}>
        <MaterialCommunityIcons name="lightning-bolt" size={18} color="#64748B" />
      </View>
      <ResultTeamBlock team={teamTwo} isWinner={winnerTeamName === teamTwo?.name || (resultText && resultText.toLowerCase().includes(teamTwo?.name?.toLowerCase()))} align="right" />
    </View>
    <View style={{ paddingHorizontal: 16, paddingBottom: 10, alignItems: 'center', justifyContent: 'center' }}>
      <Text
        selectable
        numberOfLines={1}
        style={{
          color: '#F59E0B',
          fontSize: 12,
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

export function FinishedMatchViewScreen({
  match,
  finishedTab: externalFinishedTab,
  setFinishedTab: externalSetFinishedTab,
  finishedInningIndex: externalFinishedInningIndex,
  setFinishedInningIndex: externalSetFinishedInningIndex,
  setCurrentScreen,
  handleOpenPlayerProfile,
  handleRematch,
  refreshing = false,
  handlePullToRefresh,
  setPlayingXiVisible
}) {
  const { width: screenWidth } = useWindowDimensions();
  const [internalFinishedTab, setInternalFinishedTab] = useState('summary');
  const [internalInningIndex, setInternalInningIndex] = useState(0);
  const [publicTabLayouts, setPublicTabLayouts] = useState({});

  const finishedTab = externalFinishedTab !== undefined ? externalFinishedTab : internalFinishedTab;
  const setFinishedTab = externalSetFinishedTab || setInternalFinishedTab;
  const finishedInningIndex = externalFinishedInningIndex !== undefined ? externalFinishedInningIndex : internalInningIndex;
  const setFinishedInningIndex = externalSetFinishedInningIndex || setInternalInningIndex;

  const finishedSwipeRef = useRef(null);
  const publicTabsRef = useRef(null);
  const finishedPagerPosition = useRef(new Animated.Value(
    Math.max(0, FINISHED_MATCH_TABS.findIndex(tab => tab.id === finishedTab))
  )).current;

  if (!match) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: themeColors.appBackground }}>
        <Ionicons name="checkmark-done-outline" size={34} color="#94A3B8" />
        <Text style={{ color: '#0F172A', fontSize: 16, fontFamily: systemFontBold, marginTop: 10 }}>No finished match</Text>
        <TouchableOpacity onPress={() => setCurrentScreen && setCurrentScreen('home')} style={{ minHeight: 42, marginTop: 14, paddingHorizontal: 18, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: '#18181B' }}>
          <Text style={{ color: '#FFFFFF', fontSize: 13, fontFamily: systemFontBold }}>BACK TO HOME</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const f = match;
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
    } else if (tabIndex === FINISHED_MATCH_TABS.length - 1) {
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
    const nextIndex = FINISHED_MATCH_TABS.findIndex(tab => tab.id === nextTabId);
    if (nextIndex < 0) return;
    if (setFinishedTab) setFinishedTab(nextTabId);
    keepFinishedTabVisible(nextIndex);
    if (movePager) finishedSwipeRef.current?.setPage(nextIndex);
  };

  const handleFinishedPageSelected = (event) => {
    const nextIndex = event.nativeEvent.position;
    const nextTab = FINISHED_MATCH_TABS[nextIndex];
    if (!nextTab) return;
    keepFinishedTabVisible(nextIndex);
    if (nextTab.id !== finishedTab && setFinishedTab) setFinishedTab(nextTab.id);
  };

  const handleFinishedPageScroll = (event) => {
    const { position, offset } = event.nativeEvent;
    finishedPagerPosition.setValue(position + offset);
  };

  useEffect(() => {
    const idx = FINISHED_MATCH_TABS.findIndex(t => t.id === finishedTab);
    if (idx !== -1) {
      finishedSwipeRef.current?.setPage(idx);
      finishedPagerPosition.setValue(idx);
      keepFinishedTabVisible(idx, false);
    }
  }, [finishedTab]);

  const team1Name = f.team1?.name || 'Team 1';
  const team2Name = f.team2?.name || 'Team 2';

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.appBackground }}>
      {/* ─── TOP DARK NAVY HEADER (TITLE + TABS + INTEGRATED HERO) ─── */}
      <View style={{ backgroundColor: '#071B2C', borderBottomWidth: 1, borderBottomColor: '#123A56' }}>
        {/* Top Title & Back */}
        <View style={{ paddingHorizontal: 14, paddingTop: 10, paddingBottom: 4, flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => setCurrentScreen && setCurrentScreen('home')} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <Ionicons name="arrow-back" size={18} color="#E0F2FE" />
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontFamily: systemFontMedium }} numberOfLines={1}>
              {f.title || f.matchTitle || `${team1Name} vs ${team2Name}`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 5-Tabs Strip */}
        <MatchTabBar
          tabs={FINISHED_MATCH_TABS}
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

      {/* ─── NATIVE HORIZONTAL SWIPEABLE PAGER (SUMMARY | SCORECARD | OVERS | GRAPHS | INFO) ─── */}
      <PagerView
        ref={finishedSwipeRef}
        style={{ flex: 1 }}
        initialPage={Math.max(0, FINISHED_MATCH_TABS.findIndex(tab => tab.id === finishedTab))}
        onPageSelected={handleFinishedPageSelected}
        onPageScroll={handleFinishedPageScroll}
      >
        {FINISHED_MATCH_TABS.map(({ id: pageTabId }) => (
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
                    rows={[
                      { icon: 'trophy-outline', label: 'Match', value: f.matchTitle || f.title || `${team1Name} vs ${team2Name}` },
                      { icon: 'calendar-outline', label: 'Date & time', value: formatMatchDateTime(f.startedAt || f.date) },
                      { icon: 'swap-horizontal-outline', label: 'Toss', value: f.tossResult || `${getTossWinnerName(f)} chose to ${getTossDecisionText(f, 'BAT')}`, emphasis: true },
                      f.venue ? { icon: 'location-outline', label: 'Venue', value: f.venue } : null,
                      { icon: 'person-outline', label: 'Umpire', value: f.umpireName || 'Cric Scorer' },
                      { icon: 'partly-sunny-outline', label: 'Conditions', value: f.conditions || '28°C, Clear Sky' }
                    ]}
                    teamOneName={team1Name}
                    teamTwoName={team2Name}
                    playerCount={totalPlayerCount}
                    onOpenPlayingXi={() => {
                      if (setPlayingXiVisible) setPlayingXiVisible(true);
                    }}
                  />
                );
              })()}

              {/* TAB 2: SUMMARY */}
              {pageTabId === 'summary' && (
                <FinishedMatchSummary match={f} onRematch={handleRematch} onPressPlayer={handleOpenPlayerProfile} />
              )}

              {/* TAB 3: SCORECARD */}
              {pageTabId === 'scorecard' && (
                <View style={{ gap: 14 }}>
                  {/* Inning Switcher Pills */}
                  <View style={{ flexDirection: 'row', gap: 8, padding: 12, backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0' }}>
                    {[f.team1, f.team2].map((tObj, idx) => {
                      const active = finishedInningIndex === idx;
                      return (
                        <TouchableOpacity
                          key={tObj.name}
                          onPress={() => setFinishedInningIndex(idx)}
                          style={{
                            flex: 1,
                            minHeight: 48,
                            paddingHorizontal: 8,
                            paddingVertical: 6,
                            borderRadius: 8,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: active ? '#18181B' : '#FFFFFF',
                            borderWidth: 1,
                            borderColor: active ? '#18181B' : '#EEEEF0'
                          }}
                        >
                          <Text style={{ fontSize: 13, fontFamily: systemFontMedium, color: active ? '#FFFFFF' : '#0F172A', textAlign: 'center' }} numberOfLines={1}>
                            {tObj.name}
                          </Text>
                          <Text style={{ fontSize: 10.5, fontFamily: systemFontMedium, color: active ? '#D4D4D8' : '#64748B', marginTop: 2 }} numberOfLines={1}>
                            {tObj.score || 'Yet to bat'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

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

                    {finishedBattingRows.map((b, bi) => {
                      const r = Number(b.runs) || 0;
                      const bl = Number(b.balls) || 0;
                      const sr = bl > 0 ? ((r / bl) * 100).toFixed(1) : (b.sr || '0.0');
                      return (
                        <View key={`${b.name}-${bi}`} style={{ borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => handleOpenPlayerProfile && handleOpenPlayerProfile(b.name)}
                            style={{ minHeight: 54, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' }}
                          >
                            <View style={{ flex: 1, paddingRight: 6 }}>
                              <Text selectable style={{ color: '#0F172A', fontSize: 13, fontFamily: systemFontMedium }} numberOfLines={1}>
                                {b.name}
                              </Text>
                              <Text selectable style={{ color: b.dismissal === 'Not out' ? '#059669' : '#64748B', fontSize: 10.5, marginTop: 2, fontFamily: systemFontMedium }} numberOfLines={1}>
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
                  </View>

                  {/* BOWLING TABLE */}
                  {finishedBowlingRows.length > 0 ? (
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
                      {finishedBowlingRows.map((bw, bwi) => (
                        <View key={`${bw.name}-${bwi}`} style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderTopWidth: bwi > 0 ? 1 : 0, borderTopColor: '#F1F5F9' }}>
                          <View style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                            <Text selectable style={{ color: '#0F172A', fontSize: 13, fontFamily: systemFontMedium }} numberOfLines={1}>{bw.name}</Text>
                          </View>
                          <Text selectable style={{ color: '#64748B', fontSize: 12, width: 34, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFontMedium }}>{bw.overs || bw.o || '0.0'}</Text>
                          <Text selectable style={{ color: '#64748B', fontSize: 12, width: 34, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFontMedium }}>{bw.runs || bw.r || 0}</Text>
                          <Text selectable style={{ color: '#0284C7', fontSize: 13, width: 32, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFontBold }}>{bw.wickets || bw.w || 0}</Text>
                          <Text selectable style={{ color: '#1477A8', fontSize: 12, width: 50, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFontMedium }}>{bw.econ || bw.eco || '0.00'}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  {/* DID NOT BAT */}
                  {finishedPendingBatters.length > 0 ? (
                    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 14 }}>
                      <Text style={{ color: '#64748B', fontSize: 11, fontFamily: systemFontBold, letterSpacing: 0.5, marginBottom: 12, textTransform: 'uppercase' }}>
                        DID NOT BAT ({finishedPendingBatters.length})
                      </Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                        {finishedPendingBatters.map(p => (
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
                </View>
              )}

              {/* TAB 4: OVERS */}
              {pageTabId === 'overs' && (
                <View style={{ gap: 12 }}>
                  <View style={{ flexDirection: 'row', gap: 8, padding: 10, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
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

                  {(finishedInningIndex === 0 ? finishedTeam1Inning : finishedTeam2Inning)?.overHistory?.length === 0 ? (
                    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: 24, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' }}>
                      <MaterialCommunityIcons name="clock-outline" size={32} color="#CBD5E1" />
                      <Text style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', marginTop: 8, fontFamily: systemFontMedium }}>
                        No overs recorded for this inning.
                      </Text>
                    </View>
                  ) : (
                    (finishedInningIndex === 0 ? finishedTeam1Inning : finishedTeam2Inning)?.overHistory?.map((o, idx) => (
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
            </ScrollView>
          </View>
        ))}
      </PagerView>
    </View>
  );
}

export default FinishedMatchViewScreen;
