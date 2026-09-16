import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  systemFont,
  systemFontBold,
  systemFontMedium
} from '../theme.js';
import { useMatch } from '../context/MatchContext.jsx';
import { QuickMatchSetupScreen } from './QuickMatchSetupScreen.jsx';
import { FinishedMatchViewScreen } from './FinishedMatchViewScreen.jsx';
import { InningBreakScreen } from './InningBreakScreen.jsx';
import { PlayerAvatar } from '../components/PlayerAvatar.jsx';
import { ScorerModals } from '../components/modals/ScorerModals.jsx';
import {
  formatOvers,
  sumDeliveryTokens,
  getCurrentOverNumber,
  renderBallTimeline,
  buildFinishedMatch
} from '../utils/cricketUtils.js';

export function ScorerConsoleScreen(props = {}) {
  const matchCtx = useMatch();
  const {
    activeMatch = matchCtx.activeMatch,
    getBattingRoster = matchCtx.getBattingRoster,
    getBowlingRoster = matchCtx.getBowlingRoster,
    handleRecordBall = matchCtx.handleRecordBall,
    handleWicketPress = matchCtx.handleWicketPress,
    handleUndo = matchCtx.handleUndo,
    handleRedo = matchCtx.handleRedo,
    handleSwapStrike = matchCtx.handleSwapStrike,
    handleRetireBatsman = matchCtx.handleRetireBatsman,
    handleOpenPlayerProfile = (profile) => {
      if (matchCtx.setSelectedPlayerProfile) matchCtx.setSelectedPlayerProfile(profile);
      if (matchCtx.setCurrentScreen) matchCtx.setCurrentScreen('playerProfile');
    },
    setExtrasSheetVisible = matchCtx.setExtrasSheetVisible,
    setIsEditSquadModalOpen = matchCtx.setIsEditSquadModalOpen,
    setNextBowlerName = matchCtx.setNextBowlerName,
    setBowlerChangePending = matchCtx.setBowlerChangePending,
    handleStartNewMatchSetup = matchCtx.handleStartNewMatchSetup
  } = props;

  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  if (!activeMatch) {
    return <QuickMatchSetupScreen />;
  }

  if (activeMatch.phase === 'result') {
    return <FinishedMatchViewScreen />;
  }

  if (activeMatch.phase === 'inningBreak') {
    return <InningBreakScreen />;
  }

  const innIdx = (activeMatch?.inning || 1) - 1;
  const inn = activeMatch?.innings?.[innIdx] || activeMatch?.innings?.[0];
  if (!inn?.battingTeam || !inn?.bowlingTeam) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, backgroundColor: '#071B2C', gap: 12 }}>
        <StatusBar barStyle="light-content" translucent={true} backgroundColor="transparent" />
        <Ionicons name="alert-circle-outline" size={32} color="#0284C7" />
        <Text style={{ fontSize: 18, color: '#FFFFFF', fontFamily: systemFontBold, textAlign: 'center' }}>No Active Match Selected</Text>
        <Text style={{ fontSize: 13, color: '#94A3B8', fontFamily: systemFont, textAlign: 'center', lineHeight: 19 }}>
          Start a new match setup or unlock an existing match to score.
        </Text>
        <TouchableOpacity
          onPress={handleStartNewMatchSetup}
          style={{ marginTop: 10, backgroundColor: '#0284C7', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 }}
        >
          <Text style={{ color: '#FFFFFF', fontFamily: systemFontBold, fontSize: 13, letterSpacing: 0.5 }}>+ START NEW MATCH</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const batRoster = getBattingRoster ? getBattingRoster() : [];
  const bowlRoster = getBowlingRoster ? getBowlingRoster() : [];

  // Display-only fallbacks — never mutate the state object directly
  const displayStriker = inn.striker || (batRoster[0] ? { name: batRoster[0], runs: 0, balls: 0, fours: 0, sixes: 0, dismissal: 'Not out', isOut: false } : null);
  const displayNonStriker = inn.nonStriker || (batRoster[1] ? { name: batRoster[1], runs: 0, balls: 0, fours: 0, sixes: 0, dismissal: 'Not out', isOut: false } : null);
  const displayBowler = inn.bowler || (bowlRoster[0] ? { name: bowlRoster[0], runs: 0, wickets: 0, overs: '0.0' } : null);

  const inn2 = activeMatch.inning === 2;
  const reqRuns = inn2 && activeMatch.target ? activeMatch.target - inn.battingTeam.runs : null;
  const reqBalls = inn2 ? Math.max(0, (activeMatch.maxOvers * 6) - inn.totalLegalBalls) : null;

  const scorerCurrentOverBalls = inn.currentOverBalls || [];
  const scorerCurrentOverRuns = sumDeliveryTokens(scorerCurrentOverBalls);
  const scorerCurrentOverNum = getCurrentOverNumber(inn);

  // Dynamic Responsive Scaling for 100% viewport fit on all devices (Zero scrolling)
  const isSmallScreen = screenHeight < 720;
  const isMediumScreen = screenHeight >= 720 && screenHeight < 840;

  const keypadKeyHeight = isSmallScreen ? 62 : (isMediumScreen ? 74 : 84);
  const keypadBoundariesHeight = isSmallScreen ? 54 : (isMediumScreen ? 66 : 76);
  const keypadWicketHeight = isSmallScreen ? 56 : (isMediumScreen ? 68 : 78);
  const keypadExtrasHeight = isSmallScreen ? 44 : (isMediumScreen ? 48 : 52);
  const topActionsHeight = isSmallScreen ? 42 : (isMediumScreen ? 46 : 50);

  const keypadNumFontSize = isSmallScreen ? 28 : (isMediumScreen ? 32 : 36);
  const keypadBoundariesFontSize = isSmallScreen ? 18 : (isMediumScreen ? 21 : 24);
  const keypadActionFontSize = isSmallScreen ? 17 : (isMediumScreen ? 19 : 21);

  const scoreHeroPaddingTop = insets.top + (isSmallScreen ? 8 : 12);
  const scoreHeroPaddingBottom = isSmallScreen ? 12 : (isMediumScreen ? 16 : 18);
  const scoreFontSize = isSmallScreen ? 38 : (isMediumScreen ? 42 : 46);
  const containerPadding = isSmallScreen ? 6 : 10;
  const containerGap = isSmallScreen ? 6 : 10;

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F7F7' }}>
      <StatusBar barStyle="light-content" translucent={true} backgroundColor="transparent" />
      {/* SPACIOUS DARK CREX SCORE HERO */}
      <View style={{ backgroundColor: '#071B2C', paddingHorizontal: 16, paddingTop: scoreHeroPaddingTop, paddingBottom: scoreHeroPaddingBottom, borderBottomWidth: 0, gap: isSmallScreen ? 6 : 10, alignItems: 'center' }}>
        {/* Big Score Center Row (No Brackets, Thin | Line Separator) */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <Text style={{ fontSize: scoreFontSize, lineHeight: scoreFontSize + 4, color: '#FFFFFF', fontFamily: systemFontBold }}>{inn.battingTeam.runs}-{inn.battingTeam.wickets}</Text>
          <View style={{ width: 1.5, height: isSmallScreen ? 22 : 28, backgroundColor: '#1E4D6B', borderRadius: 1 }} />
          <Text style={{ fontSize: isSmallScreen ? 17 : 20, color: '#9FC4D7', fontFamily: systemFontMedium }}>{formatOvers(inn.totalLegalBalls)} Ov</Text>
        </View>

        {/* Clean Inning & Batting Info Line */}
        <Text style={{ color: '#9FC4D7', fontSize: isSmallScreen ? 11 : 12, fontFamily: systemFontMedium }}>
          Inning {activeMatch.inning === 1 ? '1st' : '2nd'} • {inn.battingTeam.name} Batting
        </Text>
      </View>

      <ScrollView style={{ flex: 1, backgroundColor: '#F7F7F7' }} contentContainerStyle={{ padding: containerPadding, gap: containerGap, paddingBottom: isSmallScreen ? 8 : 14 }} showsVerticalScrollIndicator={false}>

        {/* ELEGANT OFF-WHITE DELIVERY TIMELINE CARD */}
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 12, paddingVertical: isSmallScreen ? 7 : 10, borderWidth: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 0 }}>
            <Text style={{ color: '#0F172A', fontSize: 11, fontFamily: systemFontBold }}>
              OVER {scorerCurrentOverNum}
            </Text>
          </View>

          <View style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
            {renderBallTimeline(scorerCurrentOverBalls, { size: isSmallScreen ? 24 : 26, emptyText: 'Over starting...', contentPaddingRight: 4 })}
          </View>

          <Text style={{ color: '#0284C7', fontSize: 13, fontVariant: ['tabular-nums'], fontFamily: systemFontBold }}>
            {scorerCurrentOverRuns} RUNS
          </Text>
        </View>

        {inn2 && activeMatch.target ? (
          <View style={{ flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 0, overflow: 'hidden' }}>
            {[
              ['TARGET', activeMatch.target],
              ['NEED', Math.max(0, reqRuns)],
              ['BALLS', reqBalls]
            ].map(([label, value], index) => (
              <View
                key={label}
                style={{ flex: 1, alignItems: 'center', paddingVertical: 8, borderLeftWidth: index > 0 ? 1 : 0, borderLeftColor: '#F1F5F9' }}
              >
                <Text style={{ color: '#94A3B8', fontSize: 9, fontFamily: systemFontBold }}>{label}</Text>
                <Text style={{ color: label === 'NEED' ? '#0284C7' : '#0F172A', fontSize: 14, marginTop: 1, fontVariant: ['tabular-nums'], fontFamily: systemFontBold }}>
                  {value}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* CARD 1: SEPARATE BATTING PAIR CARD */}
        {(() => {
          const s = displayStriker || { name: 'Striker', runs: 0, balls: 0 };
          const ns = displayNonStriker || { name: 'Non-Striker', runs: 0, balls: 0 };
          const pinnedRow1 = inn.row1Name || s.name;
          const row1Batter = (pinnedRow1 === ns?.name) ? ns : s;
          const row2Batter = (row1Batter?.name === s?.name) ? ns : s;

          const isRow1Striker = row1Batter?.name === s?.name;
          const isRow2Striker = row2Batter?.name === s?.name;
          const canSwapOpeningStrike = inn.totalLegalBalls === 0
            && (inn.currentOverBalls || []).length === 0
            && (inn.overHistory || []).length === 0;

          return (
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 14, overflow: 'hidden', borderWidth: 0 }}>
              {/* Header Row */}
              <View style={{ backgroundColor: '#F8FAFC', paddingHorizontal: 14, paddingVertical: isSmallScreen ? 5 : 7, borderBottomWidth: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 10.5, color: '#64748B', letterSpacing: 0.5, fontFamily: systemFontBold }}>
                  BATTING • {inn.battingTeam.name.toUpperCase()}
                </Text>
                <Text style={{ fontSize: 10.5, color: '#94A3B8', fontFamily: systemFontMedium }}>R (B)</Text>
              </View>

              {/* Row 1 Batter */}
              {row1Batter && (
                <View style={{ minHeight: isSmallScreen ? 46 : 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: isSmallScreen ? 6 : 8, borderBottomWidth: 0, backgroundColor: isRow1Striker ? '#F0F9FF' : '#FFFFFF' }}>
                  <TouchableOpacity
                    onPress={() => handleOpenPlayerProfile && handleOpenPlayerProfile(row1Batter.name)}
                    activeOpacity={0.7}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}
                  >
                    <PlayerAvatar name={row1Batter.name} photoUrl={row1Batter.photoUrl || row1Batter.photo_url} size={isSmallScreen ? 28 : 32} />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: isSmallScreen ? 12.5 : 13.5, color: isRow1Striker ? '#0F172A' : '#475569', fontFamily: isRow1Striker ? systemFontBold : systemFontMedium }} numberOfLines={1}>
                          {row1Batter.name}
                        </Text>
                        {isRow1Striker ? <MaterialCommunityIcons name="cricket" size={14} color="#0284C7" /> : null}
                        {isRow1Striker ? (
                          <TouchableOpacity
                            onPress={handleRetireBatsman}
                            style={{ backgroundColor: '#FFFBEB', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, borderWidth: 0 }}
                          >
                            <Text style={{ color: '#B45309', fontSize: 9, fontFamily: systemFontBold }}>Retire</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                      <Text style={{ fontSize: 10, color: isRow1Striker ? '#0284C7' : '#94A3B8', fontFamily: systemFontMedium }}>
                        {isRow1Striker ? 'On Strike (*)' : 'Non-Striker'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <Text style={{ fontSize: isRow1Striker ? (isSmallScreen ? 15 : 16) : (isSmallScreen ? 13.5 : 14.5), color: isRow1Striker ? '#0284C7' : '#475569', fontFamily: isRow1Striker ? systemFontBold : systemFontMedium }}>
                    {row1Batter.runs}<Text style={{ fontSize: 11.5, color: '#64748B', fontFamily: systemFont }}> ({row1Batter.balls})</Text>
                  </Text>
                </View>
              )}

              {row1Batter?.name && row2Batter?.name && canSwapOpeningStrike ? (
                <View style={{ height: 32, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 0, backgroundColor: '#F8FAFC' }}>
                  <TouchableOpacity onPress={handleSwapStrike} style={{ minHeight: 32, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Ionicons name="swap-vertical" size={14} color="#0284C7" />
                    <Text style={{ color: '#0284C7', fontSize: 9.5, fontFamily: systemFontBold }}>SWAP STRIKE</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {/* Row 2 Batter */}
              {row2Batter && (
                <View style={{ minHeight: isSmallScreen ? 46 : 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: isSmallScreen ? 6 : 8, backgroundColor: isRow2Striker ? '#F0F9FF' : '#FFFFFF' }}>
                  <TouchableOpacity
                    onPress={() => handleOpenPlayerProfile && handleOpenPlayerProfile(row2Batter.name)}
                    activeOpacity={0.7}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}
                  >
                    <PlayerAvatar name={row2Batter.name} photoUrl={row2Batter.photoUrl || row2Batter.photo_url} size={isSmallScreen ? 28 : 32} />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: isSmallScreen ? 12.5 : 13.5, color: isRow2Striker ? '#0F172A' : '#475569', fontFamily: isRow2Striker ? systemFontBold : systemFontMedium }} numberOfLines={1}>
                          {row2Batter.name}
                        </Text>
                        {isRow2Striker ? <MaterialCommunityIcons name="cricket" size={14} color="#0284C7" /> : null}
                        {isRow2Striker ? (
                          <TouchableOpacity
                            onPress={handleRetireBatsman}
                            style={{ backgroundColor: '#FFFBEB', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, borderWidth: 0 }}
                          >
                            <Text style={{ color: '#B45309', fontSize: 9, fontFamily: systemFontBold }}>Retire</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                      <Text style={{ fontSize: 10, color: isRow2Striker ? '#0284C7' : '#94A3B8', fontFamily: systemFontMedium }}>
                        {isRow2Striker ? 'On Strike (*)' : 'Non-Striker'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <Text style={{ fontSize: isRow2Striker ? (isSmallScreen ? 15 : 16) : (isSmallScreen ? 13.5 : 14.5), color: isRow2Striker ? '#0284C7' : '#475569', fontFamily: isRow2Striker ? systemFontBold : systemFontMedium }}>
                    {row2Batter.runs}<Text style={{ fontSize: 11.5, color: '#64748B', fontFamily: systemFont }}> ({row2Batter.balls})</Text>
                  </Text>
                </View>
              )}
            </View>
          );
        })()}

        {/* CARD 2: SEPARATE CURRENT BOWLER CARD (SYMMETRICAL TO BATSMAN ROW) */}
        {displayBowler && (
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 14, overflow: 'hidden', borderWidth: 0 }}>
            <View style={{ minHeight: isSmallScreen ? 46 : 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: isSmallScreen ? 6 : 8, backgroundColor: '#FFFFFF' }}>
              <TouchableOpacity
                onPress={() => handleOpenPlayerProfile && handleOpenPlayerProfile(displayBowler.name)}
                activeOpacity={0.7}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}
              >
                <PlayerAvatar name={displayBowler.name} photoUrl={displayBowler.photoUrl || displayBowler.photo_url} size={isSmallScreen ? 28 : 32} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: isSmallScreen ? 12.5 : 13.5, color: '#0F172A', fontFamily: systemFontBold }} numberOfLines={1}>
                      {displayBowler.name}
                    </Text>
                    <MaterialCommunityIcons name="baseball" size={14} color="#0284C7" />
                    <TouchableOpacity
                      onPress={() => { setNextBowlerName(displayBowler.name); setBowlerChangePending(true); }}
                      style={{ backgroundColor: '#F0F9FF', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, borderWidth: 0 }}
                    >
                      <Text style={{ color: '#0284C7', fontSize: 9, fontFamily: systemFontBold }}>Change</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={{ fontSize: 10, color: '#64748B', fontFamily: systemFontMedium }}>
                    Current Bowler ({inn.bowlingTeam.name})
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Right: Big Overs (e.g. 1.2 Ov) just like batsman runs */}
              <Text style={{ fontSize: isSmallScreen ? 15 : 16, color: '#0F172A', fontFamily: systemFontBold }}>
                {displayBowler.overs || '0.0'}<Text style={{ fontSize: 11.5, color: '#64748B', fontFamily: systemFont }}> Ov</Text>
              </Text>
            </View>
          </View>
        )}

        {/* DEDICATED PROPER CALCULATOR TOUCHPAD (RESPONSIVE HEIGHTS, ZERO GAP, ZERO SCROLL) */}
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', borderWidth: 0, marginTop: 2 }}>

          {/* ROW 0: TOP ACTIONS (UNDO | VIBRANT COLORFUL EDIT SQUAD | REDO) */}
          <View style={{ flexDirection: 'row', borderBottomWidth: 0, borderBottomColor: '#E2E8F0', backgroundColor: '#F8FAFC' }}>
            <TouchableOpacity
              onPress={handleUndo}
              activeOpacity={0.7}
              style={{
                flex: 1, height: topActionsHeight, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                borderRightWidth: 0, borderRightColor: '#E2E8F0'
              }}
            >
              <Ionicons name="arrow-undo" size={isSmallScreen ? 15 : 17} color="#0F172A" />
              <Text style={{ color: '#0F172A', fontSize: isSmallScreen ? 12 : 13, fontFamily: systemFontBold }}>UNDO</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsEditSquadModalOpen(true)}
              activeOpacity={0.8}
              style={{
                flex: 1.35, height: topActionsHeight, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                backgroundColor: '#0284C7', borderRightWidth: 0, borderRightColor: '#E2E8F0'
              }}
            >
              <Ionicons name="people" size={isSmallScreen ? 16 : 18} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontSize: isSmallScreen ? 12 : 13, fontFamily: systemFontBold, letterSpacing: 0.4 }}>EDIT SQUAD</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleRedo}
              activeOpacity={0.7}
              style={{
                flex: 1, height: topActionsHeight, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6
              }}
            >
              <Ionicons name="arrow-redo" size={isSmallScreen ? 15 : 17} color="#0F172A" />
              <Text style={{ color: '#0F172A', fontSize: isSmallScreen ? 12 : 13, fontFamily: systemFontBold }}>REDO</Text>
            </TouchableOpacity>
          </View>

          {/* ROW 1: 0, 1, 2, 3 CHUNKY KEYS */}
          <View style={{ flexDirection: 'row', borderBottomWidth: 0, borderBottomColor: '#E2E8F0' }}>
            {[0, 1, 2, 3].map((n, idx) => (
              <TouchableOpacity
                key={n}
                activeOpacity={0.65}
                style={{
                  flex: 1, height: keypadKeyHeight, alignItems: 'center', justifyContent: 'center',
                  borderRightWidth: idx < 3 ? 1.5 : 0, borderRightColor: '#E2E8F0',
                  backgroundColor: '#FFFFFF'
                }}
                onPress={() => handleRecordBall(n)}
              >
                <Text style={{ color: '#0F172A', fontSize: keypadNumFontSize, fontFamily: systemFontBold, lineHeight: keypadNumFontSize + 4 }}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ROW 2: 4 FOUR, 6 SIX */}
          <View style={{ flexDirection: 'row', borderBottomWidth: 0, borderBottomColor: '#E2E8F0' }}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={{ flex: 1, height: keypadBoundariesHeight, alignItems: 'center', justifyContent: 'center', borderRightWidth: 0, borderRightColor: '#E2E8F0', backgroundColor: '#F0F9FF' }}
              onPress={() => handleRecordBall(4)}
            >
              <Text style={{ color: '#0284C7', fontSize: keypadBoundariesFontSize, fontFamily: systemFontBold, letterSpacing: 0.5 }}>4 FOUR</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={{ flex: 1, height: keypadBoundariesHeight, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F3FF' }}
              onPress={() => handleRecordBall(6)}
            >
              <Text style={{ color: '#7C3AED', fontSize: keypadBoundariesFontSize, fontFamily: systemFontBold, letterSpacing: 0.5 }}>6 SIX</Text>
            </TouchableOpacity>
          </View>

          {/* ROW 3: WIDE, NO BALL, WICKET */}
          <View style={{ flexDirection: 'row', borderBottomWidth: 0, borderBottomColor: '#E2E8F0' }}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={{ flex: 1, height: keypadWicketHeight, alignItems: 'center', justifyContent: 'center', borderRightWidth: 0, borderRightColor: '#E2E8F0', backgroundColor: '#FFFBEB' }}
              onPress={() => handleRecordBall(0, 'wd')}
            >
              <Text style={{ color: '#B45309', fontSize: keypadActionFontSize, fontFamily: systemFontBold }}>WIDE</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={{ flex: 1, height: keypadWicketHeight, alignItems: 'center', justifyContent: 'center', borderRightWidth: 0, borderRightColor: '#E2E8F0', backgroundColor: '#FFFBEB' }}
              onPress={() => handleRecordBall(0, 'nb')}
            >
              <Text style={{ color: '#B45309', fontSize: keypadActionFontSize, fontFamily: systemFontBold }}>NO BALL</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={{ flex: 1.15, height: keypadWicketHeight, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF1F2' }}
              onPress={handleWicketPress}
            >
              <Text style={{ color: '#E11D48', fontSize: keypadActionFontSize + 1, fontFamily: systemFontBold }}>WICKET</Text>
            </TouchableOpacity>
          </View>

          {/* ROW 4: ADVANCED EXTRAS */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={{ minHeight: keypadExtrasHeight, paddingVertical: isSmallScreen ? 10 : 13, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, backgroundColor: '#F8FAFC' }}
            onPress={() => setExtrasSheetVisible(true)}
          >
            <Ionicons name="add-circle-outline" size={isSmallScreen ? 17 : 20} color="#0284C7" />
            <Text style={{ color: '#0284C7', fontSize: isSmallScreen ? 13 : 14.5, fontFamily: systemFontBold }}>EXTRAS</Text>
            <Text style={{ color: '#64748B', fontSize: isSmallScreen ? 10.5 : 11.5, fontFamily: systemFontMedium }}>wides, no-balls, byes, penalty</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Scorer Cricket Modals */}
      <ScorerModals />
    </View>
  );
}
