import { HomeScreen } from '../screens/HomeScreen.jsx';
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  Image, StatusBar, TextInput, Modal, Alert, useWindowDimensions,
  Animated
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MASTER_PLAYERS_DB } from '../../mockData';
import { TeamIdentityMark } from '../components/TeamIdentityMark';
import { MatchListScoreCard } from '../components/MatchListScoreCard';
import { MatchInfoPanel } from '../components/MatchInfoPanel';
import { MatchTabBar } from '../components/MatchTabBar';
import { RealtimeWinBar } from '../components/RealtimeWinBar';
import { PreInningsScorecard } from '../components/PreInningsScorecard';
import { WormGraph } from '../components/WormGraph';
import { ManhattanGraph } from '../components/ManhattanGraph';
import { useFonts } from 'expo-font';
import { PlayerAvatar } from '../components/PlayerAvatar.jsx';
import { computeLeaderboardRankings } from '../utils/cricketUtils.js';
import { fetchLocalPlayers } from '../services/localPlayerService.js';
import { syncMatchToSupabase, fetchFinishedMatchesFromSupabase, fetchPlayersFromSupabase, syncPlayerToSupabase, fetchLiveMatchFromSupabase, subscribeToSupabaseLiveMatches } from '../services/matchService.js';
import { systemFont, systemFontMedium, systemFontBold, typeScale, fontWeights, publicType, themeColors } from '../theme.js';

Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.style = [{ fontFamily: systemFont }, Text.defaultProps.style];
TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.style = [{ fontFamily: systemFont }, TextInput.defaultProps.style];

const nameFitProps = {
  numberOfLines: 1,
  ellipsizeMode: 'tail',
  adjustsFontSizeToFit: true,
  minimumFontScale: 0.82
};

// ── Voice Announcements (Indian Female Voice Engine) ──────────────────────────
const speakBall = (runs, extraType, isWicket) => {
  let msg = '';
  if (isWicket) msg = 'Wicket! Out!';
  else if (extraType === 'wd') msg = runs > 0 ? `Wide ball, plus ${runs} run` : 'Wide ball!';
  else if (extraType === 'nb') msg = runs > 0 ? `No ball, plus ${runs} run` : 'No ball!';
  else if (runs === 0) msg = 'Dot ball';
  else if (runs === 1) msg = 'Ek run';
  else if (runs === 2) msg = 'Do run';
  else if (runs === 3) msg = 'Teen run';
  else if (runs === 4) msg = 'Chaar run! Chauka!';
  else if (runs === 6) msg = 'Chhe run! Shaandaar Chhakka!';
  else msg = `${runs} run`;
  Speech.speak(msg, { language: 'hi-IN', pitch: 1.18, rate: 0.92 });
};

const speakScoreToken = (token) => {
  if (!token) return;
  const normalized = String(token);
  const extraType = isWideToken(normalized) ? 'wd' : isNoBallToken(normalized) ? 'nb' : null;
  speakBall(getTokenNumber(normalized), extraType, isWicketToken(normalized));
};

const formatScoreTokenForPublic = (token) => {
  const normalized = String(token || '').trim();
  if (!normalized) return '';
  if (isWicketToken(normalized)) return 'WICKET';

  const runs = getTokenTeamRuns(normalized);
  if (isPenaltyToken(normalized)) return '5 PENALTY RUNS';
  if (isLegByeToken(normalized)) return `${runs} LEG BYE${runs === 1 ? '' : 'S'}`;
  if (isByeToken(normalized)) return `${runs} BYE${runs === 1 ? '' : 'S'}`;
  if (isWideToken(normalized)) return runs > 1 ? `${runs} WIDES` : 'WIDE';
  if (isNoBallToken(normalized)) return runs > 1 ? `NO BALL + ${runs - 1}` : 'NO BALL';
  if (runs === 0) return 'DOT BALL';
  if (runs === 4) return 'FOUR';
  if (runs === 6) return 'SIX';
  return `${runs} RUN${runs === 1 ? '' : 'S'}`;
};

const makeLastDelivery = ({ ballLabel, runs, addedRuns, extraType, byeType, isWicket }) => {
  let label = formatScoreTokenForPublic(ballLabel);
  let type = 'runs';

  if (isWicket) type = 'wicket';
  else if (extraType || byeType) type = 'extra';
  else if (runs === 0) type = 'dot';
  else if (runs === 4 || runs === 6) type = 'boundary';

  if (extraType === 'wd') label = addedRuns > 1 ? `${addedRuns} WIDES` : 'WIDE';
  else if (extraType === 'nb') label = addedRuns > 1 ? `NO BALL + ${addedRuns - 1}` : 'NO BALL';
  else if (byeType === 'b') label = `${addedRuns} BYE${addedRuns === 1 ? '' : 'S'}`;
  else if (byeType === 'lb') label = `${addedRuns} LEG BYE${addedRuns === 1 ? '' : 'S'}`;
  else if (byeType === 'penalty') label = '5 PENALTY RUNS';

  return { token: ballLabel, label, type };
};

// â”€â”€â”€ SAMPLE DATA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const FINISHED_MATCHES_DB = [];
const MATCH_SYNC_URL = process.env.EXPO_PUBLIC_MATCH_SYNC_URL || '';
const STORAGE_KEY = 'cricflow.mobile.match-state.v2';
const MAX_MATCH_OVERS = 50;

const SADOKAN_A_PLAYERS = [];
const SADOKAN_B_PLAYERS = [];
const SADOKAN_TEAM_NAMES = new Set();
const SADOKAN_PLAYER_POOL = [];

const getTokenNumber = (token) => {
  const value = parseInt(String(token || '').replace(/[^\d]/g, '') || '0', 10);
  return Number.isFinite(value) ? value : 0;
};

const isWideToken = (token) => /Wd$/i.test(String(token || ''));
const isNoBallToken = (token) => /Nb$/i.test(String(token || ''));
const isPenaltyToken = (token) => /Pen$/i.test(String(token || ''));
const isByeToken = (token) => /\d+B$/i.test(String(token || ''));
const isLegByeToken = (token) => /\d+LB$/i.test(String(token || ''));
const isWicketToken = (token) => /^(\d+)?W$/i.test(String(token || ''));
const isLegalToken = (token) => !isWideToken(token) && !isNoBallToken(token) && !isPenaltyToken(token);

const getTokenTeamRuns = (token) => {
  if (!token) return 0;
  if (isPenaltyToken(token)) return 5;
  if (isWideToken(token) || isNoBallToken(token)) return getTokenNumber(token) + 1;
  if (isByeToken(token) || isLegByeToken(token)) return getTokenNumber(token) || 1;
  return getTokenNumber(token);
};

const getTokenBowlerRuns = (token) => {
  if (isByeToken(token) || isLegByeToken(token) || isPenaltyToken(token)) return 0;
  return getTokenTeamRuns(token);
};

const sumDeliveryTokens = (tokens = [], runResolver = getTokenTeamRuns) =>
  tokens.reduce((total, token) => total + runResolver(token), 0);

const countWicketTokens = (tokens = []) =>
  tokens.filter(token => isWicketToken(token)).length;

const countLegalTokens = (tokens = []) =>
  tokens.filter(token => isLegalToken(token)).length;

const getCurrentOverNumber = (inning) => {
  const legalBalls = inning?.totalLegalBalls || 0;
  if (inning?.isOverComplete && legalBalls > 0) return Math.ceil(legalBalls / 6);
  return Math.floor(legalBalls / 6) + 1;
};

const getBallTokenVisual = (token, variant = 'default') => {
  const normalized = String(token || '');
  const isStrong = isWicketToken(normalized) || normalized === '4' || normalized === '6';
  if (isWicketToken(normalized)) return { backgroundColor: '#E11D48', textColor: '#FFFFFF', borderWidth: 0 };
  if (normalized === '4') return { backgroundColor: variant === 'liveStrip' ? '#0E8CAB' : '#0284C7', textColor: '#FFFFFF', borderWidth: 0 };
  if (normalized === '6') return { backgroundColor: variant === 'liveStrip' ? '#2F7D1B' : '#7C3AED', textColor: '#FFFFFF', borderWidth: 0 };
  if (normalized === '0' && variant === 'liveStrip') return { backgroundColor: '#FFFFFF', textColor: '#0F172A', borderWidth: 1 };
  return { backgroundColor: '#F1F5F9', textColor: '#334155', borderWidth: isStrong ? 0 : 1 };
};

const renderBallTokenChip = (token, index, size = 24, variant = 'default', keyPrefix = 'ball') => {
  const visual = getBallTokenVisual(token, variant);
  const chipFontSize = variant === 'liveStrip' ? 12 : 13;
  return (
    <View
      key={`${keyPrefix}-${token}-${index}`}
      style={{
        minWidth: size,
        height: size,
        paddingHorizontal: 4,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: visual.backgroundColor,
        borderWidth: visual.borderWidth,
        borderColor: '#CBD5E1'
      }}
    >
      <Text style={{ color: visual.textColor, fontSize: chipFontSize, fontVariant: ['tabular-nums'], fontFamily: systemFontBold }}>
        {token}
      </Text>
    </View>
  );
};

const renderEmptyBallSlot = (index, size = 28) => (
  <View
    key={`empty-ball-${index}`}
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      backgroundColor: '#FFFFFF'
    }}
  />
);

const renderBallTimeline = (balls = [], { size = 30, emptyText = 'Over starting...', contentPaddingRight = 16, startAtEnd = false, lockHorizontalGesture = true } = {}) => {
  let timelineRef = null;
  const shouldCaptureGesture = () => Boolean(lockHorizontalGesture && balls.length > 6);
  const scrollToLatest = () => {
    if (startAtEnd && timelineRef) {
      requestAnimationFrame(() => timelineRef?.scrollToEnd({ animated: false }));
    }
  };

  return balls.length > 0 ? (
    <ScrollView
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      directionalLockEnabled
      ref={ref => { timelineRef = ref; }}
      onLayout={scrollToLatest}
      onContentSizeChange={scrollToLatest}
      onStartShouldSetResponderCapture={shouldCaptureGesture}
      onMoveShouldSetResponderCapture={shouldCaptureGesture}
      contentContainerStyle={{ minHeight: size, alignItems: 'center', gap: 7, paddingRight: contentPaddingRight }}
    >
      {balls.map((ball, index) => renderBallTokenChip(ball, index, size))}
    </ScrollView>
  ) : (
    <View style={{ minHeight: size, justifyContent: 'center' }}>
      <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: fontWeights.bold, fontFamily: systemFont }}>{emptyText}</Text>
    </View>
  );
};

const renderCompactOverTimeline = ({
  previousOver,
  currentOverNumber,
  currentBalls = [],
  currentRuns = sumDeliveryTokens(currentBalls),
  size = 28,
  contentPaddingRight = 12,
  startAtEnd = false
} = {}) => {
  let timelineRef = null;
  const previousBalls = previousOver?.balls || [];
  const showPrevious = previousBalls.length > 0 && currentBalls.length > 0;
  const currentLegalBalls = countLegalTokens(currentBalls);
  const emptySlots = Math.max(0, 6 - currentLegalBalls);
  const shouldCaptureGesture = () => showPrevious || currentBalls.length > 6;
  const scrollToLatest = () => {
    if (startAtEnd && timelineRef) {
      requestAnimationFrame(() => timelineRef?.scrollToEnd({ animated: false }));
    }
  };

  return (
    <ScrollView
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      directionalLockEnabled
      ref={ref => { timelineRef = ref; }}
      onLayout={scrollToLatest}
      onContentSizeChange={scrollToLatest}
      onStartShouldSetResponderCapture={shouldCaptureGesture}
      onMoveShouldSetResponderCapture={shouldCaptureGesture}
      contentContainerStyle={{ minHeight: size + 6, alignItems: 'center', gap: 5, paddingRight: contentPaddingRight }}
    >
      {showPrevious ? (
        <>
          {previousBalls.map((ball, index) => renderBallTokenChip(ball, index, size, 'liveStrip', 'previous'))}
          <Text selectable style={{ color: '#475569', fontSize: 12, fontWeight: fontWeights.semibold, fontVariant: ['tabular-nums'], fontFamily: systemFont }}>
            = {sumDeliveryTokens(previousBalls)}
          </Text>
          <View style={{ width: 1, height: size + 4, backgroundColor: '#E5E7EB', marginHorizontal: 7 }} />
        </>
      ) : null}
      <Text style={{ color: '#334155', fontSize: 13, fontWeight: fontWeights.semibold, marginRight: 2, fontFamily: systemFont }}>
        Over {currentOverNumber}
      </Text>
      {currentBalls.map((ball, index) => renderBallTokenChip(ball, index, size, 'liveStrip', 'current'))}
      {Array.from({ length: emptySlots }).map((_, index) => renderEmptyBallSlot(index, size))}
      {!showPrevious && currentBalls.length > 0 ? (
        <Text selectable style={{ color: '#475569', fontSize: 12, fontWeight: fontWeights.semibold, fontVariant: ['tabular-nums'], marginLeft: 2, fontFamily: systemFont }}>
          = {currentRuns}
        </Text>
      ) : null}
    </ScrollView>
  );
};

const getDisplayOverHistory = (inning) => {
  const completed = inning?.overHistory || [];
  const currentBalls = inning?.currentOverBalls || [];
  if (!inning || inning.isOverComplete || currentBalls.length === 0) return completed;
  return [
    ...completed,
    {
      overNum: Math.floor((inning.totalLegalBalls || 0) / 6) + 1,
      runs: sumDeliveryTokens(currentBalls),
      wickets: countWicketTokens(currentBalls),
      bowlerName: inning.bowler?.name || 'Bowler',
      balls: currentBalls,
      partial: true
    }
  ];
};

const sanitizeMatchForStorage = (match) => {
  if (!match) return null;
  const cleanMatch = JSON.parse(JSON.stringify(match));
  delete cleanMatch.pendingPublicEvent;
  delete cleanMatch._pendingWicket;
  delete cleanMatch._pendingNewBowler;
  return cleanMatch;
};

const normalizeOversInput = (value) => {
  const parsed = Number(String(value || '').trim());
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_MATCH_OVERS) return null;
  return parsed;
};

const getTossWinnerName = (match) => {
  if (match?.tossWinner) return match.tossWinner;
  const tossText = String(match?.tossResult || '');
  return tossText.split(/ won/i)[0] || '';
};

const getTossDecisionText = (match, fallback = 'BAT') => {
  const raw = String(match?.tossDecision || match?.tossResult || '').toUpperCase();
  if (raw.includes('BOWL')) return 'BOWL';
  if (raw.includes('BAT')) return 'BAT';
  return fallback;
};

const getSearchBlob = (value) => {
  try {
    return JSON.stringify(value || {}).toLowerCase();
  } catch (error) {
    return '';
  }
};

const getCleanPlayerNames = (names = []) => {
  const seen = new Set();
  return names
    .map(name => String(name || '').trim())
    .filter(name => {
      const key = name.toLowerCase();
      if (!name || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const makeTeamCode = (name = '') => {
  const words = String(name).trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return words.slice(0, 2).map(word => word[0]).join('').toUpperCase();
  return String(name).replace(/[^a-z0-9]/gi, '').slice(0, 2).toUpperCase() || 'TM';
};

const getTeamShortCode = (team, fallbackName = '') => {
  const savedCode = String(team?.code || '').trim();
  return savedCode || makeTeamCode(team?.name || fallbackName);
};

const hasDuplicateNames = (names = []) => {
  const normalized = names.map(name => String(name || '').trim().toLowerCase()).filter(Boolean);
  return new Set(normalized).size !== normalized.length;
};

const TOP_BATTERS = [];
const TOP_BOWLERS = [];
const TOP_ALLROUNDERS = [];

const isSadokanMatchSnapshot = (match) => {
  const names = (match?.teams || []).map(team => team.name).filter(Boolean);
  return names.length === 2 && names.every(name => SADOKAN_TEAM_NAMES.has(name));
};

const isSadokanFinishedMatch = (match) => {
  if (!match || typeof match !== 'object') return false;
  const t1 = match.team1?.name || match.teams?.[0]?.name;
  const t2 = match.team2?.name || match.teams?.[1]?.name;
  if (!t1 || !t2 || t1 === 'Team 1' || t2 === 'Team 2' || t1 === 'TM' || t2 === 'TM') return false;

  const parseRuns = (scoreStr) => {
    if (!scoreStr || scoreStr === 'Yet to bat') return 0;
    const m = String(scoreStr).match(/^(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
  };

  const t1ScoreRuns = parseRuns(match.team1?.score);
  const t2ScoreRuns = parseRuns(match.team2?.score);

  const hasActualMatchData = Boolean(
    (match.team1?.runs || 0) > 0
    || (match.team2?.runs || 0) > 0
    || (match.team1?.legalBalls || 0) > 0
    || (match.team2?.legalBalls || 0) > 0
    || (match.team1?.overHistory || []).length > 0
    || (match.team2?.overHistory || []).length > 0
    || t1ScoreRuns > 0
    || t2ScoreRuns > 0
  );

  return hasActualMatchData;
};

// â”€â”€â”€ HELPERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const makeInning = (battingTeamName, bowlingTeamName) => ({
  battingTeam: { name: battingTeamName, code: battingTeamName.slice(0, 2).toUpperCase(), runs: 0, wickets: 0 },
  bowlingTeam: { name: bowlingTeamName, code: bowlingTeamName.slice(0, 2).toUpperCase() },
  totalLegalBalls: 0,
  bowlerLegalBalls: 0,
  currentOverBalls: [],
  currentOverBowlerWickets: 0,
  bowlingStats: {},
  striker: null,
  nonStriker: null,
  bowler: null,
  dismissedPlayers: [],
  partnershipRuns: 0,
  partnershipBalls: 0,
  partnershipHistory: [],
  partnershipContributions: {},
  lastWicket: null,
  lastEvent: null,
  lastDelivery: null,
  pendingBatterEnd: null,
  status: 'active', // active | complete
});

const formatOvers = (legalBalls) => {
  const ov = Math.floor(legalBalls / 6);
  const b = legalBalls % 6;
  return `${ov}.${b}`;
};

const parseOversToBalls = (overs) => {
  const [overPart, ballPart = '0'] = String(overs || '0.0').split('.');
  const oversNumber = Number.parseInt(overPart, 10) || 0;
  const ballsNumber = Number.parseInt(ballPart, 10) || 0;
  return (oversNumber * 6) + Math.min(Math.max(ballsNumber, 0), 5);
};

const makeBowlingFigure = ({ name, balls = 0, runs = 0, wickets = 0 } = {}) => ({
  name: name || '',
  balls: Number(balls) || 0,
  runs: Number(runs) || 0,
  wickets: Number(wickets) || 0,
  overs: formatOvers(Number(balls) || 0)
});

const normalizeBowlingFigure = (figure = {}, fallbackName = '') => makeBowlingFigure({
  name: figure.name || fallbackName,
  balls: figure.balls ?? figure.legalBalls ?? parseOversToBalls(figure.overs),
  runs: figure.runs,
  wickets: figure.wickets
});

const getInningBowlingRows = (inning) => {
  if (!inning) return [];
  const figures = {};
  const addFigure = (name, balls = 0, runs = 0, wickets = 0) => {
    if (!name) return;
    const current = figures[name] || makeBowlingFigure({ name });
    figures[name] = makeBowlingFigure({
      name,
      balls: current.balls + (Number(balls) || 0),
      runs: current.runs + (Number(runs) || 0),
      wickets: current.wickets + (Number(wickets) || 0)
    });
  };

  const storedStats = inning.bowlingStats || {};
  Object.entries(storedStats).forEach(([name, figure]) => {
    const normalized = normalizeBowlingFigure(figure, name);
    addFigure(normalized.name, normalized.balls, normalized.runs, normalized.wickets);
  });

  if (Object.keys(storedStats).length === 0) {
    (inning.overHistory || []).forEach(over => {
      const balls = over.legalBalls ?? countLegalTokens(over.balls || []);
      const runs = over.bowlerRuns ?? sumDeliveryTokens(over.balls || [], getTokenBowlerRuns);
      const wickets = over.bowlerWickets ?? over.wickets ?? 0;
      addFigure(over.bowlerName, balls, runs, wickets);
    });
    if (!inning.isOverComplete && (inning.currentOverBalls || []).length > 0) {
      const balls = inning.currentOverBalls || [];
      addFigure(
        inning.bowler?.name,
        countLegalTokens(balls),
        sumDeliveryTokens(balls, getTokenBowlerRuns),
        inning.currentOverBowlerWickets || countWicketTokens(balls)
      );
    }
  }

  if (inning.bowler?.name && !figures[inning.bowler.name]) {
    const current = normalizeBowlingFigure(
      { ...inning.bowler, balls: inning.bowlerLegalBalls ?? parseOversToBalls(inning.bowler.overs) },
      inning.bowler.name
    );
    addFigure(current.name, current.balls, current.runs, current.wickets);
  }

  return Object.values(figures).map(figure => ({
    ...figure,
    econ: figure.balls > 0 ? ((figure.runs / figure.balls) * 6).toFixed(2) : '0.00'
  }));
};

const getBowlerFigureFromInning = (inning, name) => {
  const rows = getInningBowlingRows(inning);
  return rows.find(row => row.name === name) || makeBowlingFigure({ name });
};

const formatOrdinal = (value) => {
  const number = Number(value) || 0;
  const mod100 = number % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${number}th`;
  if (number % 10 === 1) return `${number}st`;
  if (number % 10 === 2) return `${number}nd`;
  if (number % 10 === 3) return `${number}rd`;
  return `${number}th`;
};

const formatMatchDateTime = (startedAt) => {
  const date = startedAt ? new Date(startedAt) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const buildFinishedMatch = (match, rosterByTeam = {}) => {
  const innings = match?.innings || [];
  const getRecordedBatters = (inning, roster = []) => {
    const recorded = (inning?.allBatters?.length
      ? inning.allBatters
      : [inning?.striker, inning?.nonStriker].filter(player => player?.name)
    ).map(player => ({
      ...player,
      runs: player.runs || 0,
      balls: player.balls || 0,
      fours: player.fours || 0,
      sixes: player.sixes || 0,
      dismissal: player.dismissal || (player.isOut ? 'Out' : 'Not out'),
      sr: player.balls > 0 ? ((player.runs / player.balls) * 100).toFixed(1) : '0.0'
    }));
    const recordedNames = new Set(recorded.map(player => player.name));
    return [
      ...recorded,
      ...roster.filter(name => !recordedNames.has(name)).map(name => ({
        name,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        dismissal: 'Did not bat',
        sr: '0.0'
      }))
    ];
  };

  const getBowling = (inning) => getInningBowlingRows(inning);

  const firstTeamName = innings[0]?.battingTeam?.name || match.team1_name || match.team1?.name || match.inn1BattingTeam || match.teams?.[0]?.name || 'Team 1';
  const secondTeamName = innings[0]?.bowlingTeam?.name || match.team2_name || match.team2?.name || match.inn1BowlingTeam || match.teams?.[1]?.name || 'Team 2';

  const buildTeam = (name) => {
    const battingInning = innings.find(inning => inning?.battingTeam?.name === name);
    const bowlingInning = innings.find(inning => inning?.bowlingTeam?.name === name);
    const teamMeta = match.teams?.find(team => team.name === name);
    let cumulativePartnershipRuns = 0;
    const partnerships = (battingInning?.partnershipHistory || []).map(partnership => {
      cumulativePartnershipRuns += partnership.totalRuns || 0;
      return {
        ...partnership,
        wkt: `${formatOrdinal(partnership.wicketNumber)} wicket`,
        score: `${partnership.teamScore ?? cumulativePartnershipRuns}-${partnership.wicketNumber}`,
        over: partnership.over || (battingInning.lastWicket?.name === partnership.dismissedName ? battingInning.lastWicket.over : '')
      };
    });
    if ((battingInning?.partnershipRuns || 0) > 0) {
      partnerships.push({
        wkt: 'Unbroken',
        p1: battingInning.striker?.name || '',
        r1: battingInning.partnershipContributions?.[battingInning.striker?.name]?.runs || 0,
        p2: battingInning.nonStriker?.name || '',
        r2: battingInning.partnershipContributions?.[battingInning.nonStriker?.name]?.runs || 0,
        totalRuns: battingInning.partnershipRuns,
        totalBalls: battingInning.partnershipBalls || 0,
        status: 'unbroken'
      });
    }
    return {
      name,
      code: battingInning?.battingTeam.code || name.slice(0, 2).toUpperCase(),
      logoKey: teamMeta?.logoKey || (name === firstTeamName ? 'default-team-1' : 'default-team-2'),
      logoUri: teamMeta?.logoUri,
      score: battingInning
        ? `${battingInning.battingTeam.runs}-${battingInning.battingTeam.wickets} (${formatOvers(battingInning.totalLegalBalls)} Ov)`
        : 'Yet to bat',
      runs: battingInning?.battingTeam.runs || 0,
      wickets: battingInning?.battingTeam.wickets || 0,
      legalBalls: battingInning?.totalLegalBalls || 0,
      batting: getRecordedBatters(battingInning, rosterByTeam[name] || match.playingXI?.[name] || []),
      bowling: getBowling(battingInning),
      fallOfWickets: partnerships.filter(partnership => partnership.status === 'out'),
      partnerships,
      overHistory: getDisplayOverHistory(battingInning),
      currentOverBalls: battingInning?.currentOverBalls || []
    };
  };

  const team1 = buildTeam(firstTeamName);
  const team2 = buildTeam(secondTeamName);
  const allBatters = [...team1.batting, ...team2.batting]
    .filter(player => player.balls > 0 || player.runs > 0)
    .sort((a, b) => b.runs - a.runs || a.balls - b.balls);
  const winnerTeamName = [firstTeamName, secondTeamName].find(name => match.resultText?.startsWith(name)) || '';
  const finalInning = innings[innings.length - 1];
  const lastCompletedOver = finalInning?.overHistory?.[finalInning.overHistory.length - 1];
  const lastOver = !finalInning?.isOverComplete && finalInning?.currentOverBalls?.length
    ? {
      overNum: Math.floor((finalInning.totalLegalBalls || 0) / 6) + 1,
      bowlerName: finalInning.bowler?.name || 'Bowler',
      runs: sumDeliveryTokens(finalInning.currentOverBalls),
      balls: finalInning.currentOverBalls
    }
    : lastCompletedOver;

  return {
    id: `finished-${match.startedAt || match.matchTitle}`,
    title: match.matchTitle,
    winner: match.resultText,
    winnerTeamName,
    venue: match.venue || 'Venue not added',
    date: formatMatchDateTime(match.startedAt),
    maxOvers: match.maxOvers,
    tossResult: match.tossResult,
    umpireName: match.umpireName || DEFAULT_UMPIRE_NAME,
    team1,
    team2,
    topPerformers: allBatters.slice(0, 3),
    topScorer: allBatters[0] || null,
    lastOver,
    sourceMatch: match
  };
};

const parseFinishedScoreText = (scoreText = '') => {
  const text = String(scoreText || '').trim();
  const scoreMatch = text.match(/(\d+)\s*-\s*(\d+)/);
  const oversMatch = text.match(/\(([^)]+)\)/);
  const oversText = (oversMatch?.[1] || '0.0').replace(/\s*Ov$/i, '').trim();
  return {
    runs: Number(scoreMatch?.[1] || 0),
    wickets: Number(scoreMatch?.[2] || 0),
    legalBalls: parseOversToBalls(oversText)
  };
};

const getScorePartsFromText = (scoreText = '') => {
  const rawScore = String(scoreText || '').trim();
  const match = rawScore.match(/^(.+?)(?:\s*\(([^)]+)\))?$/);
  return {
    score: match?.[1]?.trim() || rawScore,
    overs: (match?.[2] || '').replace(/\s*Ov$/i, '').trim()
  };
};

const escapeRegExp = (value = '') =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getFinishedResultCardText = (match) => {
  const rawResult = String(match?.winner || '').replace(/!+$/g, '').trim();
  if (!rawResult) return { title: 'Result', detail: '' };
  if (/tie|tied/i.test(rawResult)) return { title: 'Match Tied', detail: '' };

  const winnerTeam = [match?.team1, match?.team2].find(team => team?.name === match?.winnerTeamName);
  const winnerCode = getTeamShortCode(winnerTeam, match?.winnerTeamName || '');
  const detail = match?.winnerTeamName
    ? rawResult.replace(new RegExp(`^${escapeRegExp(match.winnerTeamName)}\\s+won\\s*`, 'i'), '').trim()
    : rawResult.replace(/^.*?\bwon\b\s*/i, '').trim();

  return {
    title: `${winnerCode || 'Team'} Won`,
    detail
  };
};

const buildFinishedSnapshotInning = (battingTeam, bowlingTeam) => {
  const parsedScore = parseFinishedScoreText(battingTeam?.score);
  const activeBatters = (battingTeam?.batting || []).filter(player => player.dismissal === 'Not out');
  const fallbackBatters = (battingTeam?.batting || []).filter(player => (player.runs || 0) > 0 || (player.balls || 0) > 0);
  const striker = activeBatters[0] || fallbackBatters[0] || battingTeam?.batting?.[0] || null;
  const nonStriker = activeBatters[1] || fallbackBatters.find(player => player.name !== striker?.name) || battingTeam?.batting?.find(player => player.name !== striker?.name) || null;
  const bowlerRow = bowlingTeam?.bowling?.[0] || null;
  const fallOfWicketsArr = battingTeam?.fallOfWickets || [];
  const lastWicket = fallOfWicketsArr.length > 0 ? fallOfWicketsArr[fallOfWicketsArr.length - 1] : null;
  const partnershipsArr = battingTeam?.partnerships || [];
  const unbrokenPartnership = partnershipsArr.find(item => item.status === 'unbroken')
    || (partnershipsArr.length > 0 ? partnershipsArr[partnershipsArr.length - 1] : null)
    || null;

  return {
    battingTeam: {
      name: battingTeam?.name || 'Team',
      code: battingTeam?.code || makeTeamCode(battingTeam?.name),
      runs: parsedScore.runs,
      wickets: parsedScore.wickets
    },
    bowlingTeam: {
      name: bowlingTeam?.name || 'Team',
      code: bowlingTeam?.code || makeTeamCode(bowlingTeam?.name)
    },
    totalLegalBalls: battingTeam?.legalBalls ?? parsedScore.legalBalls,
    bowlerLegalBalls: parseOversToBalls(bowlerRow?.overs),
    currentOverBalls: battingTeam?.currentOverBalls || [],
    currentOverBowlerWickets: 0,
    overHistory: battingTeam?.overHistory || [],
    bowlingStats: Object.fromEntries((battingTeam?.bowling || []).map(row => [row.name, normalizeBowlingFigure(row, row.name)])),
    striker,
    nonStriker,
    bowler: bowlerRow ? { name: bowlerRow.name, runs: bowlerRow.runs || 0, wickets: bowlerRow.wickets || 0, overs: bowlerRow.overs || '0.0' } : null,
    dismissedPlayers: (battingTeam?.batting || []).filter(player => player.dismissal && player.dismissal !== 'Not out' && player.dismissal !== 'Did not bat').map(player => player.name),
    partnershipRuns: unbrokenPartnership?.totalRuns || 0,
    partnershipBalls: unbrokenPartnership?.totalBalls || 0,
    partnershipHistory: battingTeam?.partnerships || [],
    partnershipContributions: {},
    lastWicket: lastWicket ? {
      name: lastWicket.dismissedName || 'Wicket',
      runs: 0,
      balls: 0,
      dismissal: lastWicket.dismissal || '',
      teamScore: lastWicket.score,
      teamWickets: parsedScore.wickets,
      over: lastWicket.over || ''
    } : null,
    lastEvent: { type: 'result', label: 'Result' },
    lastDelivery: null,
    pendingBatterEnd: null,
    status: 'complete'
  };
};

const buildFinishedLiveSnapshot = (finishedMatch) => {
  if (finishedMatch?.sourceMatch?.innings?.length) {
    return {
      ...finishedMatch.sourceMatch,
      phase: 'result',
      resultText: finishedMatch.winner || finishedMatch.sourceMatch.resultText,
      inning: Math.max(1, Math.min(finishedMatch.sourceMatch.innings.length, finishedMatch.sourceMatch.inning || finishedMatch.sourceMatch.innings.length)),
      teams: finishedMatch.sourceMatch.teams?.length ? finishedMatch.sourceMatch.teams : [finishedMatch.team1, finishedMatch.team2],
      maxOvers: finishedMatch.maxOvers || finishedMatch.sourceMatch.maxOvers
    };
  }

  const innings = [
    buildFinishedSnapshotInning(finishedMatch?.team1, finishedMatch?.team2),
    buildFinishedSnapshotInning(finishedMatch?.team2, finishedMatch?.team1)
  ].filter(inning => inning?.battingTeam?.name);

  return {
    matchTitle: finishedMatch?.title || `${finishedMatch?.team1?.name || 'Team 1'} vs ${finishedMatch?.team2?.name || 'Team 2'}`,
    umpireName: finishedMatch?.umpireName || DEFAULT_UMPIRE_NAME,
    venue: finishedMatch?.venue,
    startedAt: finishedMatch?.sourceMatch?.startedAt,
    tossResult: finishedMatch?.tossResult,
    tossWinner: getTossWinnerName(finishedMatch) || '',
    tossDecision: getTossDecisionText(finishedMatch, 'BAT'),
    maxOvers: finishedMatch?.maxOvers || 0,
    teams: [finishedMatch?.team1, finishedMatch?.team2].filter(Boolean),
    playingXI: {
      [finishedMatch?.team1?.name]: (finishedMatch?.team1?.batting || []).map(player => player.name),
      [finishedMatch?.team2?.name]: (finishedMatch?.team2?.batting || []).map(player => player.name)
    },
    inning: innings.length || 1,
    innings,
    phase: 'result',
    target: null,
    resultText: finishedMatch?.winner || ''
  };
};

const PUBLIC_LIVE_TABS = [
  { id: 'info', label: 'Info', icon: 'information-circle-outline' },
  { id: 'live', label: 'Live', icon: 'radio-outline' },
  { id: 'scorecard', label: 'Scorecard', icon: 'stats-chart-outline' },
  { id: 'overs', label: 'Overs', icon: 'list-outline' },
  { id: 'graphs', label: 'Graphs', icon: 'pulse-outline' }
];

const FINISHED_MATCH_TABS = [
  { id: 'info', label: 'Info', icon: 'information-circle-outline' },
  { id: 'summary', label: 'Summary', icon: 'trophy-outline' },
  { id: 'scorecard', label: 'Scorecard', icon: 'stats-chart-outline' },
  { id: 'overs', label: 'Overs', icon: 'list-outline' },
  { id: 'graphs', label: 'Graphs', icon: 'pulse-outline' }
];

const InningTeamTab = ({ name, selected, statusText, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.82}
    style={{
      flex: 1,
      minHeight: 48,
      paddingHorizontal: 10,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: selected ? '#2F80C8' : '#FFFFFF',
      borderWidth: 1,
      borderColor: selected ? '#2F80C8' : '#D9DEE3'
    }}
  >
    <Text
      selectable
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.82}
      style={{
        color: selected ? '#FFFFFF' : '#0F172A',
        fontSize: typeScale.name,
        fontWeight: fontWeights.bold,
        textAlign: 'center',
        fontFamily: systemFont
      }}
    >
      {name}
      {statusText ? (
        <Text style={{ color: selected ? '#D6EEFF' : '#64748B', fontSize: typeScale.label, fontWeight: fontWeights.semibold, fontFamily: systemFont }}>
          {` ${statusText}`}
        </Text>
      ) : null}
    </Text>
  </TouchableOpacity>
);

const getTeamLogoSource = (team, fallbackIndex = 0) => {
  if (team?.logoUri) return { uri: team.logoUri };
  return require('../../assets/logo.png');
};

const getPlayerPreview = (name) => {
  const cleanName = String(name || '').trim();
  const profile = MASTER_PLAYERS_DB.find(player => player?.name?.toLowerCase() === cleanName.toLowerCase());
  return {
    name: cleanName,
    avatar: profile?.avatar || null,
    avg: profile?.avg != null ? Number(profile.avg).toFixed(2) : '-',
    sr: profile?.sr != null ? Number(profile.sr).toFixed(2) : '-'
  };
};

const getUnplayedBatters = (roster = [], recordedBatters = []) => {
  const recordedNames = new Set(
    (recordedBatters || [])
      .map(player => String(player?.name || player || '').trim().toLowerCase())
      .filter(Boolean)
  );
  return getCleanPlayerNames(roster)
    .filter(name => !recordedNames.has(name.toLowerCase()))
    .map(getPlayerPreview);
};

const PendingBattersSection = ({ title, players }) => {
  if (!players?.length) return null;

  return (
    <View style={{ backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingHorizontal: 16, paddingTop: 18, paddingBottom: 18 }}>
      <Text style={{ color: '#64748B', fontSize: typeScale.label, lineHeight: 15, includeFontPadding: false, fontWeight: fontWeights.bold, fontFamily: systemFont }}>
        {title}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 16 }}>
        {players.map(player => (
          <View key={`${title}-${player.name}`} style={{ width: '47%', minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {player.avatar ? (
              <Image source={{ uri: player.avatar }} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#E2E8F0' }} />
            ) : (
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#E0F2FE', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="person-outline" size={19} color="#0284C7" />
              </View>
            )}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text selectable {...nameFitProps} style={{ color: '#0F172A', fontSize: typeScale.name, lineHeight: 17, fontWeight: fontWeights.semibold, fontFamily: systemFont }}>
                {player.name}
              </Text>
              <Text style={{ color: '#64748B', fontSize: typeScale.caption, lineHeight: 14, includeFontPadding: false, fontWeight: fontWeights.medium, marginTop: 3, fontFamily: systemFont }}>
                SR: {player.sr}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const ResultTeamBlock = ({ team, isWinner, align = 'left' }) => {
  const scoreParts = getScorePartsFromText(team?.score);
  const teamCode = getTeamShortCode(team, team?.name);
  const isLoser = !isWinner;

  return (
    <View style={{ flex: 1, flexDirection: align === 'left' ? 'row' : 'row-reverse', alignItems: 'center', gap: 10 }}>
      <TeamIdentityMark team={team} size={44} isLoser={isLoser} />
      <View style={{ flex: 1, alignItems: align === 'left' ? 'flex-start' : 'flex-end', justifyContent: 'center' }}>
        <View style={{ flexDirection: align === 'left' ? 'row' : 'row-reverse', alignItems: 'center', gap: 5 }}>
          <Text
            selectable
            numberOfLines={1}
            style={{
              color: isWinner ? '#FFFFFF' : '#94A3B8',
              fontSize: 16,
              fontFamily: systemFontBold,
              letterSpacing: 0.5
            }}
          >
            {teamCode}
          </Text>
          {isWinner ? (
            <MaterialCommunityIcons name="trophy" size={15} color="#F59E0B" />
          ) : null}
        </View>

        <View style={{ flexDirection: align === 'left' ? 'row' : 'row-reverse', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
          <Text
            selectable
            style={{
              color: '#FFFFFF',
              fontSize: 19,
              fontFamily: systemFontBold,
              fontVariant: ['tabular-nums']
            }}
            numberOfLines={1}
          >
            {scoreParts.score}
          </Text>
          {scoreParts.overs ? (
            <Text
              selectable
              style={{
                color: '#94A3B8',
                fontSize: 12,
                fontFamily: systemFontMedium,
                fontVariant: ['tabular-nums']
              }}
              numberOfLines={1}
            >
              {scoreParts.overs}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const MatchResultHero = ({ teamOne, teamTwo, winnerTeamName, resultText }) => (
  <View style={{ backgroundColor: '#071B2C', borderBottomWidth: 1, borderBottomColor: '#123A56' }}>
    <View style={{ paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <ResultTeamBlock team={teamOne} isWinner={winnerTeamName === teamOne?.name || (resultText && resultText.toLowerCase().includes(teamOne?.name?.toLowerCase()))} align="left" />
      <View style={{ width: 28, alignItems: 'center', justifyContent: 'center' }}>
        <MaterialCommunityIcons name="lightning-bolt" size={22} color="#64748B" />
      </View>
      <ResultTeamBlock team={teamTwo} isWinner={winnerTeamName === teamTwo?.name || (resultText && resultText.toLowerCase().includes(teamTwo?.name?.toLowerCase()))} align="right" />
    </View>
    <View style={{ paddingHorizontal: 16, paddingBottom: 12, alignItems: 'center', justifyContent: 'center' }}>
      <Text
        selectable
        style={{
          color: '#F59E0B',
          fontSize: 13.5,
          fontFamily: systemFontBold,
          textAlign: 'center',
          letterSpacing: 0.2
        }}
      >
        {resultText}
      </Text>
    </View>
  </View>
);

const FinishedMatchSummary = ({ match, onRematch }) => {
  const playerOfMatch = match.topScorer ? getPlayerPreview(match.topScorer.name) : null;
  const teamSections = [match.team1, match.team2].filter(Boolean).map(team => {
    const batters = [...(team?.batting || [])]
      .filter(player => player.runs > 0 || player.balls > 0)
      .sort((a, b) => b.runs - a.runs || a.balls - b.balls)
      .slice(0, 2)
      .map(player => ({
        key: `bat-${team.name}-${player.name}`,
        name: player.name,
        detail: `SR ${player.sr}`,
        value: `${player.runs} (${player.balls})`,
        icon: 'cricket'
      }));
    const bowler = [...(team.bowling || [])].sort((a, b) => b.wickets - a.wickets || a.runs - b.runs)[0];
    const performers = bowler
      ? [...batters, {
        key: `bowl-${team.name}-${bowler.name}`,
        name: bowler.name,
        detail: `ECO ${bowler.econ}`,
        value: `${bowler.wickets}-${bowler.runs} (${bowler.overs})`,
        icon: 'baseball'
      }]
      : batters;
    return { team, performers };
  });

  return (
    <View style={{ marginHorizontal: -14 }}>
      {match.lastOver?.balls?.length ? (
        <View style={{ backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#CBD5E1' }}>
          <View style={{ minHeight: 48, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ minWidth: 58 }}>
              <Text style={{ color: '#7C8793', fontSize: 9, fontWeight: fontWeights.bold, fontFamily: systemFont }}>FINAL OVER</Text>
              <Text selectable style={{ color: '#0F172A', fontSize: 12, fontWeight: fontWeights.bold, marginTop: 2, fontFamily: systemFont }}>Over {match.lastOver.overNum}</Text>
            </View>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {match.lastOver.balls.map((ball, index) => {
                const strongBall = isWicketToken(ball) || ball === '4' || ball === '6';
                const ballColor = isWicketToken(ball) ? '#E11D48' : ball === '4' ? '#0284C7' : ball === '6' ? '#7C3AED' : '#F1F5F9';
                return (
                  <View key={`${ball}-${index}`} style={{ minWidth: 27, height: 27, paddingHorizontal: 5, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: ballColor, borderWidth: strongBall ? 0 : 1, borderColor: '#CBD5E1' }}>
                    <Text style={{ color: strongBall ? '#FFFFFF' : '#334155', fontSize: 10, fontWeight: fontWeights.bold, fontVariant: ['tabular-nums'], fontFamily: systemFont }}>{ball}</Text>
                  </View>
                );
              })}
            </View>
            <Text selectable style={{ color: '#0F172A', fontSize: 12, fontWeight: fontWeights.bold, fontVariant: ['tabular-nums'], fontFamily: systemFont }}>{match.lastOver.runs} R</Text>
          </View>
        </View>
      ) : null}

      {match.topScorer ? (
        <View style={{ minHeight: 78, marginHorizontal: 16, marginVertical: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8 }}>
          {playerOfMatch?.avatar ? (
            <Image source={{ uri: playerOfMatch.avatar }} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#F1F5F9' }} />
          ) : (
            <View style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E0F2FE' }}>
              <MaterialCommunityIcons name="star-circle-outline" size={24} color="#0284C7" />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text selectable style={{ color: '#0F172A', fontSize: typeScale.title, lineHeight: 20, fontWeight: fontWeights.bold, fontFamily: systemFont }} numberOfLines={1}>{match.topScorer.name}</Text>
            <Text selectable style={{ color: '#64748B', fontSize: typeScale.body, lineHeight: 17, fontWeight: fontWeights.semibold, marginTop: 2, fontFamily: systemFont }} numberOfLines={1}>Player of the Match</Text>
          </View>
          <Text selectable style={{ color: '#0284C7', fontSize: typeScale.title, fontWeight: fontWeights.bold, fontVariant: ['tabular-nums'], fontFamily: systemFont }}>{match.topScorer.runs} ({match.topScorer.balls})</Text>
        </View>
      ) : null}

      <View style={{ paddingHorizontal: 16, paddingVertical: 15, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
        <Text style={{ color: '#0F172A', fontSize: 15, fontWeight: fontWeights.bold, fontFamily: systemFont }}>TOP PERFORMERS</Text>
      </View>
      {teamSections.map(({ team, performers }) => (
        <View key={team.name} style={{ backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#CBD5E1' }}>
          <View style={{ minHeight: 42, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, backgroundColor: '#F8FAFC' }}>
            <Text selectable style={{ flex: 1, color: '#64748B', fontSize: 11, fontWeight: fontWeights.semibold, fontFamily: systemFont }} numberOfLines={1}>{team.name}</Text>
            <Text selectable style={{ color: '#64748B', fontSize: 11, fontWeight: fontWeights.semibold, fontVariant: ['tabular-nums'], fontFamily: systemFont }}>{team.score}</Text>
          </View>
          {performers.map((performer, index) => (
            <View key={performer.key} style={{ minHeight: 66, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 11, borderTopWidth: index > 0 ? 1 : 0, borderTopColor: '#E8ECEF' }}>
              <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9' }}>
                <MaterialCommunityIcons name={performer.icon} size={18} color="#64748B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text selectable style={{ color: '#0F172A', fontSize: 13, fontWeight: fontWeights.bold, fontFamily: systemFont }} numberOfLines={1}>{performer.name}</Text>
                <Text selectable style={{ color: '#7C8793', fontSize: 10, fontWeight: fontWeights.semibold, marginTop: 2, fontFamily: systemFont }}>{performer.detail}</Text>
              </View>
              <Text selectable style={{ color: '#0F172A', fontSize: 14, fontWeight: fontWeights.bold, fontVariant: ['tabular-nums'], fontFamily: systemFont }}>{performer.value}</Text>
            </View>
          ))}
          {performers.length === 0 ? (
            <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: fontWeights.semibold, paddingHorizontal: 16, paddingVertical: 18, fontFamily: systemFont }}>No recorded performance</Text>
          ) : null}
        </View>
      ))}

      {/* QUICK REMATCH ACTION CARD */}
      <View style={{ marginHorizontal: 16, marginTop: 16, marginBottom: 8, padding: 16, backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#CBD5E1', elevation: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <MaterialCommunityIcons name="cached" size={20} color="#0284C7" />
          <Text style={{ fontSize: 14, fontWeight: fontWeights.bold, color: '#0F172A', fontFamily: systemFontBold }}>Play Another Match?</Text>
        </View>
        <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 12, fontFamily: systemFont }}>
          Start a fresh rematch with the same teams ({match.team1?.name} & {match.team2?.name}) and pre-loaded player squads.
        </Text>
        <TouchableOpacity
          onPress={() => onRematch ? onRematch(match) : null}
          style={{
            height: 46,
            borderRadius: 8,
            backgroundColor: '#0284C7',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          <MaterialCommunityIcons name="cached" size={18} color="#FFFFFF" />
          <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: fontWeights.bold, fontFamily: systemFontBold }}>PLAY REMATCH (SAME TEAMS)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const DEFAULT_UMPIRE_NAME = 'CricFlow';

const WICKET_TYPES = [
  { id: 'bowled', label: 'Bowled', icon: 'radio-button-on' },
  { id: 'caught', label: 'Caught', icon: 'hand-left-outline' },
  { id: 'lbw', label: 'LBW', icon: 'body-outline' },
  { id: 'runOut', label: 'Run Out', icon: 'swap-horizontal-outline' },
  { id: 'stumped', label: 'Stumped', icon: 'flash-outline' },
  { id: 'hitWicket', label: 'Hit Wicket', icon: 'alert-circle-outline' }
];

// â”€â”€â”€ APP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function AppNavigator() {
  const [fontsLoaded] = useFonts({
    'SFProDisplay-Regular': require('../../assets/fonts/SFProDisplay-Regular.otf'),
    'SFProDisplay-Medium': require('../../assets/fonts/SFProDisplay-Medium.otf'),
    'SFProDisplay-Bold': require('../../assets/fonts/SFProDisplay-Bold.otf')
  });

  const { width: screenWidth } = useWindowDimensions();
  const fixedSetupTeams = [
    { id: 'team-sadokan-a', name: 'Sadokan A', code: 'SA', logoKey: 'default-team-1' },
    { id: 'team-sadokan-b', name: 'Sadokan B', code: 'SB', logoKey: 'default-team-2' }
  ];

  const [team1Roster, setTeam1Roster] = useState([]);
  const [team2Roster, setTeam2Roster] = useState([]);
  const [playerPool, setPlayerPool] = useState(SADOKAN_PLAYER_POOL);

  // Navigation
  const [currentScreen, setCurrentScreen] = useState('home');
  const [bottomNavTab, setBottomNavTab] = useState('home'); // Default: 'home'
  const [matchesSubTab, setMatchesSubTab] = useState('live'); // 'live' | 'finished' | 'playerStats'
  const [mainTab, setMainTab] = useState('live');
  const [publicLiveTab, setPublicLiveTab] = useState('live');
  const [showTopTitleHeader, setShowTopTitleHeader] = useState(true); // 'live' | 'info' | 'scorecard' | 'overs' | 'graphs'
  const [publicTabLayouts, setPublicTabLayouts] = useState({});
  const [liveViewReturnScreen, setLiveViewReturnScreen] = useState('home');
  const [statsCategory, setStatsCategory] = useState('batters');
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [finishedArchive, setFinishedArchive] = useState(FINISHED_MATCHES_DB);
  const [storageReady, setStorageReady] = useState(false);
  const finishedMatches = finishedArchive;
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPlayerName, setSelectedPlayerName] = useState(null);

  const handlePullToRefresh = () => {
    setRefreshing(true);
    fetchFinishedMatchesFromSupabase().then(dbMatches => {
      if (Array.isArray(dbMatches) && dbMatches.length > 0) {
        setFinishedArchive(prev => {
          const map = new Map();
          (prev || []).forEach(m => { if (m?.id || m?.title) map.set(m.id || m.title, m); });
          dbMatches.forEach(m => { const key = m.id || m.title; if (key) map.set(key, m); });
          return Array.from(map.values());
        });
      }
    }).catch(() => {}).finally(() => setRefreshing(false));
  };

  const finishedSwipeRef = useRef(null);
  const publicPagerRef = useRef(null);
  const publicTabsRef = useRef(null);
  const publicPagerScrollX = useRef(new Animated.Value(
    PUBLIC_LIVE_TABS.findIndex(tab => tab.id === 'live') * screenWidth
  )).current;
  const playingXiPagerRef = useRef(null);
  const playingXiPagerScrollX = useRef(new Animated.Value(0)).current;

  // â”€â”€ Match setup wizard â”€â”€
  const [wizardStep, setWizardStep] = useState(1);
  const [team1Name, setTeam1Name] = useState('Sadokan A');
  const [team2Name, setTeam2Name] = useState('Sadokan B');
  const [totalOvers, setTotalOvers] = useState('5');
  const [umpireName, setUmpireName] = useState(DEFAULT_UMPIRE_NAME);
  const [venueName, setVenueName] = useState('');
  const [tossWinner, setTossWinner] = useState('Sadokan A');
  const [tossDecision, setTossDecision] = useState('BAT');
  const [newPlayerNameInput, setNewPlayerNameInput] = useState('');
  const [playerSelectorVisible, setPlayerSelectorVisible] = useState(false);

  // â”€â”€ Active match (multi-inning) â”€â”€
  const [activeMatch, setActiveMatch] = useState(null);
  // activeMatch shape:
  // { matchTitle, tossResult, maxOvers,
  //   inn1BattingTeam, inn1BowlingTeam,   â† inning 1 team names
  //   inning: 1|2,
  //   innings: [inningObj, inningObj?],   â† inning objects
  //   phase: 'playing'|'inningBreak'|'result',
  //   resultText: string,
  //   target: number|null  (for inning 2)
  // }

  // Inning break / opener selection state
  const [inn2Striker, setInn2Striker] = useState('');
  const [inn2NonStriker, setInn2NonStriker] = useState('');
  const [inn2Bowler, setInn2Bowler] = useState('');

  // Wicket modal
  const [wicketPending, setWicketPending] = useState(false);
  const [newBatsmanName, setNewBatsmanName] = useState('');
  const [wicketEntryPending, setWicketEntryPending] = useState(false);
  const [pendingFielderDismissal, setPendingFielderDismissal] = useState('');
  const [runOutPending, setRunOutPending] = useState(false);
  const [runOutDismissed, setRunOutDismissed] = useState('');
  const [runOutEnd, setRunOutEnd] = useState('');
  const [runOutRuns, setRunOutRuns] = useState(0);

  // Next bowler modal (after each over)
  const [bowlerChangePending, setBowlerChangePending] = useState(false);
  const [nextBowlerName, setNextBowlerName] = useState('');
  const [extrasSheetVisible, setExtrasSheetVisible] = useState(false);

  // Edit squad modal
  const [isEditSquadModalOpen, setIsEditSquadModalOpen] = useState(false);
  const [midMatchNewPlayer, setMidMatchNewPlayer] = useState('');

  // Undo & Redo History Stack, Info Squad Dropdown, and Poll Vote
  const [matchHistoryStack, setMatchHistoryStack] = useState([]);
  const [matchRedoStack, setMatchRedoStack] = useState([]);
  const [isInfoSquadsExpanded, setIsInfoSquadsExpanded] = useState(true);
  const [playingXiVisible, setPlayingXiVisible] = useState(false);
  const [playingXiTeamTab, setPlayingXiTeamTab] = useState(1);
  const [playingXiTabLayouts, setPlayingXiTabLayouts] = useState({});
  const [pollVote, setPollVote] = useState(null);
  const [liveSyncState, setLiveSyncState] = useState('current');

  const hasRemoteSyncRef = useRef(false);
  const publicAnnouncementFingerprintRef = useRef('');

  // Weather Intelligence & Pitch Analytics
  const [selectedWeatherVenue, setSelectedWeatherVenue] = useState('Sadokan Ground');
  const [weatherData, setWeatherData] = useState({
    temp: 31,
    feelsLike: 33,
    condition: 'Sunny & Clear Skies',
    humidity: 42,
    wind: 14,
    windDir: 'SW',
    rainRisk: 5,
    uvIndex: 'High (7.2)',
    dewFactor: 'Moderate Dew Expected (Innings 2)',
    pitchImpact: 'Dry Surface - Batting Friendly & Good for Spin',
    swingIndex: 'Moderate Swing (Clear Skies)',
    dlsRisk: 'Very Low Risk (0%)',
    visibility: '10 km',
    aqi: '68 Good',
    hourly: [
      { time: '14:00', temp: 31, icon: 'sunny-outline', rain: 0 },
      { time: '15:00', temp: 32, icon: 'sunny-outline', rain: 0 },
      { time: '16:00', temp: 31, icon: 'partly-sunny-outline', rain: 5 },
      { time: '17:00', temp: 29, icon: 'partly-sunny-outline', rain: 10 },
      { time: '18:00', temp: 27, icon: 'cloudy-night-outline', rain: 15 },
      { time: '19:00', temp: 26, icon: 'cloudy-night-outline', rain: 10 }
    ]
  });

  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=26.9124&longitude=75.7873&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,precipitation_probability,weather_code&forecast_days=1')
      .then(r => r.json())
      .then(d => {
        if (d?.current) {
          const temp = Math.round(d.current.temperature_2m || 31);
          const humidity = Math.round(d.current.relative_humidity_2m || 42);
          const wind = Math.round(d.current.wind_speed_10m || 14);
          const rainProb = Math.max(0, ...(d.hourly?.precipitation_probability?.slice(0, 6) || [0]));

          let condition = 'Sunny & Clear';
          if (rainProb > 40) condition = 'Passing Showers Likely';
          else if (humidity > 70) condition = 'Humid & Overcast';
          else if (temp > 35) condition = 'Hot & Dry';

          let pitchImpact = humidity > 65 ? 'Damp Pitch - Pacer Assistance' : 'Dry Surface - Batting & Spin Friendly';
          let dewFactor = humidity > 60 ? 'Heavy Dew in 2nd Innings (Bowl First)' : 'Low Dew Impact';
          let swingIndex = humidity > 65 ? 'High Swing Index (Seam Support)' : 'Moderate Swing';
          let dlsRisk = rainProb > 30 ? `Moderate Risk (${rainProb}% Rain)` : 'Low DLS Interruption Risk';

          const hourlyForecast = (d.hourly?.temperature_2m || []).slice(0, 6).map((t, idx) => ({
            time: `${14 + idx}:00`,
            temp: Math.round(t),
            icon: (d.hourly?.precipitation_probability?.[idx] || 0) > 30 ? 'rainy-outline' : (14 + idx >= 18 ? 'cloudy-night-outline' : 'sunny-outline'),
            rain: d.hourly?.precipitation_probability?.[idx] || 0
          }));

          setWeatherData(p => ({
            ...p,
            temp,
            feelsLike: temp + 2,
            condition,
            humidity,
            wind,
            rainRisk: rainProb,
            pitchImpact,
            dewFactor,
            swingIndex,
            dlsRisk,
            hourly: hourlyForecast.length > 0 ? hourlyForecast : p.hourly
          }));
        }
      })
      .catch(() => { });
  }, []);
  useEffect(() => {
    fetchPlayersFromSupabase().then(dbPlayers => {
      if (Array.isArray(dbPlayers) && dbPlayers.length > 0) {
        setPlayerPool(dbPlayers.map(p => p.name));
      }
    }).catch(() => { });

    fetchFinishedMatchesFromSupabase().then(dbMatches => {
      if (Array.isArray(dbMatches) && dbMatches.length > 0) {
        setFinishedArchive(prev => {
          const map = new Map();
          (prev || []).forEach(m => {
            if (m?.title || m?.id) map.set(m.id || m.title, m);
          });
          dbMatches.filter(isSadokanFinishedMatch).forEach(m => {
            const key = m.id || m.title;
            if (key) {
              const existing = map.get(key);
              // Only overwrite if new match has richer team data
              if (!existing || (m.team1?.batting?.length || 0) > (existing.team1?.batting?.length || 0)) {
                map.set(key, m);
              }
            }
          });
          return Array.from(map.values());
        });
      }
    }).catch(() => { });
  }, []);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (!mounted || !raw) return;
        const saved = JSON.parse(raw);
        if (saved?.activeMatch?.matchTitle && Array.isArray(saved.activeMatch.innings) && isSadokanMatchSnapshot(saved.activeMatch)) {
          setActiveMatch(saved.activeMatch);
        }
        if (Array.isArray(saved?.finishedMatches)) {
          setFinishedArchive(saved.finishedMatches.filter(isSadokanFinishedMatch));
        }
        if (saved?.selectedMatch?.id && isSadokanFinishedMatch(saved.selectedMatch)) {
          setSelectedMatch(saved.selectedMatch);
        }
      })
      .catch(() => { })
      .finally(() => {
        if (mounted) setStorageReady(true);
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 1,
      savedAt: new Date().toISOString(),
      activeMatch: sanitizeMatchForStorage(activeMatch),
      finishedMatches: finishedArchive,
      selectedMatch
    })).catch(() => { });

    if (activeMatch?.matchTitle) {
      syncMatchToSupabase(activeMatch).catch(() => { });
    }
  }, [activeMatch, finishedArchive, selectedMatch, storageReady]);

  // AUTOMATIC FINISHED MATCH PERSISTENCE TO ARCHIVE & SUPABASE DATABASE
  useEffect(() => {
    if (activeMatch && (activeMatch.phase === 'result' || activeMatch.resultText)) {
      const finishedSnapshot = buildFinishedMatch(activeMatch);
      if (finishedSnapshot && (finishedSnapshot.title || finishedSnapshot.id)) {
        setFinishedArchive(prev => {
          const list = Array.isArray(prev) ? prev : [];
          const exists = list.some(m => m.id === finishedSnapshot.id || m.title === finishedSnapshot.title);
          if (exists) {
            return list.map(m => (m.id === finishedSnapshot.id || m.title === finishedSnapshot.title) ? finishedSnapshot : m);
          }
          return [finishedSnapshot, ...list];
        });
        syncMatchToSupabase({
          ...activeMatch,
          phase: 'result',
          winnerTeamName: finishedSnapshot.winnerTeamName,
          resultText: finishedSnapshot.winner
        }).catch(() => { });
      }
    }
  }, [activeMatch?.phase, activeMatch?.resultText]);

  // â”€â”€ Derived â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const curInning = activeMatch ? activeMatch.innings[activeMatch.inning - 1] : null;
  const activeTossWinnerName = getTossWinnerName(activeMatch) || tossWinner || team1Name;
  const activeTossDecisionText = getTossDecisionText(activeMatch, tossDecision || 'BAT');

  const getMatchRosterMap = (match = activeMatch) => ({
    ...(match?.playingXI || {}),
    [team1Name]: team1Roster,
    [team2Name]: team2Roster
  });

  const getRosterForTeam = (teamName, fallbackRoster = []) => {
    if (!teamName) return fallbackRoster;
    const declaredRoster = activeMatch?.playingXI?.[teamName];
    if (Array.isArray(declaredRoster) && declaredRoster.length > 0) return declaredRoster;
    const teamIndex = activeMatch?.teams?.findIndex(team => team.name === teamName);
    if (teamIndex === 0) return team1Roster;
    if (teamIndex === 1) return team2Roster;
    if (teamName === team1Name) return team1Roster;
    if (teamName === team2Name) return team2Roster;
    return fallbackRoster;
  };

  // Which roster bats / bowls right now
  const getBattingRoster = () => {
    if (!activeMatch) return team1Roster;
    return getRosterForTeam(curInning?.battingTeam?.name, team1Roster);
  };
  const getBowlingRoster = () => {
    if (!activeMatch) return team2Roster;
    return getRosterForTeam(curInning?.bowlingTeam?.name, team2Roster);
  };

  // Only return players who are NOT currently batting and NOT out yet
  const getAvailableBatsmen = () => {
    const roster = getBattingRoster();
    if (!curInning) return roster;
    const activeOnPitch = [curInning.striker?.name, curInning.nonStriker?.name].filter(Boolean);
    const dismissed = curInning.dismissedPlayers || [];
    return roster.filter(name => !activeOnPitch.includes(name) && !dismissed.includes(name));
  };

  // Return bowlers excluding the current bowler (can't bowl consecutive overs)
  const getAvailableBowlers = () => {
    const roster = getBowlingRoster();
    if (!curInning) return roster;
    return roster.filter(name => name !== curInning.bowler?.name);
  };

  // ⚡ 1. Scorer Broadcast: Auto-sync activeMatch to Supabase on every ball update
  useEffect(() => {
    if (activeMatch && currentScreen === 'scorerWizard') {
      syncMatchToSupabase(activeMatch);
    }
  }, [activeMatch, currentScreen]);

  // ⚡ 2. Viewer Realtime Sync: Auto-receive live match updates without manual refresh (< 300ms)
  useEffect(() => {
    if (currentScreen === 'scorerWizard') return undefined;

    const unsubscribe = subscribeToSupabaseLiveMatches((remoteMatch) => {
      if (remoteMatch && remoteMatch.matchTitle) {
        setLiveSyncState('connected');
        setActiveMatch(remoteMatch);
      }
    });

    fetchLiveMatchFromSupabase().then(liveData => { if (liveData && liveData.matchTitle) { setLiveSyncState('connected'); setActiveMatch(liveData); } }).catch(() => { }); return () => { unsubscribe(); };
  }, [currentScreen]);

  useEffect(() => {
    if (!MATCH_SYNC_URL || currentScreen !== 'scorerWizard' || !activeMatch?.playingXI) return;
    fetch(MATCH_SYNC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activeMatch)
    }).catch(() => { });
  }, [activeMatch, currentScreen]);

  useEffect(() => {
    if (activeMatch?.phase === 'result') {
      const finishedMatch = buildFinishedMatch(activeMatch, getMatchRosterMap(activeMatch));
      setSelectedMatch(current => current?.id === finishedMatch.id ? current : finishedMatch);
      setFinishedArchive(current => {
        const existingIndex = current.findIndex(match => match.id === finishedMatch.id);
        if (existingIndex >= 0) {
          const next = [...current];
          next[existingIndex] = finishedMatch;
          return next;
        }
        return [finishedMatch, ...current];
      });
    }
  }, [activeMatch]);

  useEffect(() => {
    if (currentScreen !== 'liveView') {
      publicAnnouncementFingerprintRef.current = '';
      return;
    }
    if (!activeMatch) return;
    const liveInning = activeMatch.innings?.[activeMatch.inning - 1];
    if (!liveInning) return;
    const currentBalls = liveInning.currentOverBalls || [];
    const completedOvers = liveInning.overHistory || [];
    const latestCompletedOver = completedOvers[completedOvers.length - 1];
    const latestToken = currentBalls[currentBalls.length - 1] || latestCompletedOver?.balls?.[latestCompletedOver.balls.length - 1] || '';
    const fingerprint = [
      activeMatch.startedAt,
      activeMatch.inning,
      liveInning.totalLegalBalls,
      liveInning.battingTeam.runs,
      liveInning.battingTeam.wickets,
      currentBalls.length,
      liveInning.lastEvent?.label || ''
    ].join(':');

    if (!publicAnnouncementFingerprintRef.current) {
      publicAnnouncementFingerprintRef.current = fingerprint;
      return;
    }
    if (fingerprint === publicAnnouncementFingerprintRef.current) return;
    publicAnnouncementFingerprintRef.current = fingerprint;
    try { speakScoreToken(latestToken); } catch (error) { }
  }, [activeMatch, currentScreen]);

  const handleRematch = (matchToRematch) => {
    const target = matchToRematch || (activeMatch && (activeMatch.phase === 'result' || activeMatch.resultText) ? buildFinishedMatch(activeMatch) : null) || selectedMatch || finishedMatches[0];
    if (!target) return;

    // Archive current completed match snapshot safely
    const finishedSnapshot = target.sourceMatch ? target : buildFinishedMatch(target, {
      [team1Name]: team1Roster,
      [team2Name]: team2Roster
    });
    if (finishedSnapshot && (finishedSnapshot.title || finishedSnapshot.id)) {
      setFinishedArchive(prev => {
        const list = Array.isArray(prev) ? prev : [];
        if (list.some(m => m.id === finishedSnapshot.id)) return list;
        return [finishedSnapshot, ...list];
      });
      syncMatchToSupabase({
        ...(target.sourceMatch || target),
        phase: 'result',
        winnerTeamName: finishedSnapshot.winnerTeamName,
        resultText: finishedSnapshot.winner
      }).catch(() => { });
    }

    const t1 = target.team1?.name || target.teams?.[0]?.name || team1Name || 'CricScorer Eleven';
    const t2 = target.team2?.name || target.teams?.[1]?.name || team2Name || 'CricScorer Strikers';
    const r1 = target.sourceMatch?.playingXI?.[t1] || target.playingXI?.[t1] || (target.team1?.batting || []).map(p => p.name).filter(Boolean) || team1Roster;
    const r2 = target.sourceMatch?.playingXI?.[t2] || target.playingXI?.[t2] || (target.team2?.batting || []).map(p => p.name).filter(Boolean) || team2Roster;

    setTeam1Name(t1);
    setTeam2Name(t2);
    setTeam1Roster(Array.isArray(r1) && r1.length > 0 ? r1 : team1Roster);
    setTeam2Roster(Array.isArray(r2) && r2.length > 0 ? r2 : team2Roster);
    if (target.maxOvers) setTotalOvers(String(target.maxOvers));
    if (target.venue) setVenueName(target.venue);
    setTossWinner(t1);

    setActiveMatch(null);
    setSelectedMatch(null);
    setWizardStep(1);
    setCurrentScreen('scorerWizard');
  };

  // Max wickets = roster size - 1 (last man can't bat alone)
  const maxWickets = () => getBattingRoster().length - 1;

  // â”€â”€ HANDLERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const openScorerScreen = () => {
    setCurrentScreen('scorerWizard');
  };

  const handleMoveToTeam = (name, targetTeam) => {
    const cleanName = String(name || '').trim();
    if (!cleanName) return;

    setPlayerPool(current => current.filter(player => player !== cleanName));
    setTeam1Roster(current => current.filter(player => player !== cleanName));
    setTeam2Roster(current => current.filter(player => player !== cleanName));

    if (targetTeam === 'team1') {
      setTeam1Roster(current => getCleanPlayerNames([...current, cleanName]));
    } else if (targetTeam === 'team2') {
      setTeam2Roster(current => getCleanPlayerNames([...current, cleanName]));
    } else {
      setPlayerPool(current => getCleanPlayerNames([cleanName, ...current]));
    }
    clearOpeningSelections();
  };

  const handleAddNewPlayer = () => {
    const name = newPlayerNameInput.trim();
    if (!name) return;
    const playerExists = [...playerPool, ...team1Roster, ...team2Roster]
      .some(player => player.toLowerCase() === name.toLowerCase());
    if (!playerExists) {
      setPlayerPool(current => getCleanPlayerNames([name, ...current]));
    }
    setNewPlayerNameInput('');
    clearOpeningSelections();
  };

  // Step 3: Start Inning 1
  const [step3Striker, setStep3Striker] = useState('');
  const [step3NonStriker, setStep3NonStriker] = useState('');
  const [step3Bowler, setStep3Bowler] = useState('');

  const clearOpeningSelections = () => {
    setStep3Striker('');
    setStep3NonStriker('');
    setStep3Bowler('');
  };

  const handleRemoveSetupPlayer = (slot, playerName) => {
    if (slot === 'team1') {
      setTeam1Roster(current => current.filter(name => name !== playerName));
    } else {
      setTeam2Roster(current => current.filter(name => name !== playerName));
    }
    setPlayerPool(current => getCleanPlayerNames([playerName, ...current]));
    clearOpeningSelections();
  };

  const validateSetupStepOne = () => {
    const cleanTeam1 = team1Name.trim();
    const cleanTeam2 = team2Name.trim();
    const overs = normalizeOversInput(totalOvers);

    if (!cleanTeam1 || !cleanTeam2) {
      Alert.alert('Match Setup', 'Both team names are required.');
      return false;
    }
    if (cleanTeam1.toLowerCase() === cleanTeam2.toLowerCase()) {
      Alert.alert('Match Setup', 'Team names must be different.');
      return false;
    }
    if (!overs) {
      Alert.alert('Match Setup', `Overs must be a whole number from 1 to ${MAX_MATCH_OVERS}.`);
      return false;
    }
    if (team1Roster.length < 2 || team2Roster.length < 2) {
      Alert.alert('Match Setup', 'Each team needs at least two players before toss.');
      return false;
    }
    if (hasDuplicateNames(team1Roster) || hasDuplicateNames(team2Roster)) {
      Alert.alert('Match Setup', 'Duplicate players found inside a squad.');
      return false;
    }
    const overlap = team1Roster
      .map(name => name.trim().toLowerCase())
      .filter(name => team2Roster.map(player => player.trim().toLowerCase()).includes(name));
    if (overlap.length > 0) {
      Alert.alert('Match Setup', 'A player cannot be in both teams.');
      return false;
    }

    setTeam1Name(cleanTeam1);
    setTeam2Name(cleanTeam2);
    setTotalOvers(String(overs));
    setTossWinner(current => [cleanTeam1, cleanTeam2].includes(current) ? current : cleanTeam1);
    return true;
  };

  const handleSetupStepOneNext = () => {
    if (!validateSetupStepOne()) return;
    setWizardStep(2);
  };

  const handleStartMatch = () => {
    if (!validateSetupStepOne()) return;
    const overs = normalizeOversInput(totalOvers);
    if (!step3Striker || !step3NonStriker || !step3Bowler) {
      Alert.alert('Opening Players', 'Select striker, non-striker, and opening bowler.');
      return;
    }
    if (step3Striker === step3NonStriker) {
      Alert.alert('Opening Players', 'Striker and non-striker must be different players.');
      return;
    }

    const cleanTeam1 = team1Name.trim();
    const cleanTeam2 = team2Name.trim();
    let bat1 = cleanTeam1, bowl1 = cleanTeam2;
    if ((tossWinner === cleanTeam1 && tossDecision === 'BOWL') || (tossWinner === cleanTeam2 && tossDecision === 'BAT')) {
      bat1 = cleanTeam2; bowl1 = cleanTeam1;
    }
    const battingRoster = bat1 === cleanTeam1 ? team1Roster : team2Roster;
    const bowlingRoster = bowl1 === cleanTeam1 ? team1Roster : team2Roster;
    if (!battingRoster.includes(step3Striker) || !battingRoster.includes(step3NonStriker)) {
      Alert.alert('Opening Players', 'Opening batters must belong to the batting team.');
      return;
    }
    if (!bowlingRoster.includes(step3Bowler)) {
      Alert.alert('Opening Players', 'Opening bowler must belong to the bowling team.');
      return;
    }
    const selectedTeam1Meta = fixedSetupTeams[0];
    const selectedTeam2Meta = fixedSetupTeams[1];
    const inn1 = makeInning(bat1, bowl1);
    inn1.striker = { name: step3Striker, runs: 0, balls: 0, fours: 0, sixes: 0, dismissal: 'Not out', isOut: false };
    inn1.nonStriker = { name: step3NonStriker || '', runs: 0, balls: 0, fours: 0, sixes: 0, dismissal: 'Not out', isOut: false };
    inn1.row1Name = step3Striker;
    inn1.bowler = { name: step3Bowler, runs: 0, wickets: 0, overs: '0.0' };
    inn1.bowlingStats = { [step3Bowler]: makeBowlingFigure({ name: step3Bowler }) };
    inn1.allBatters = [inn1.striker, inn1.nonStriker].filter(player => player.name).map(player => ({ ...player, dismissal: 'Not out', isOut: false }));

    setActiveMatch({
      matchTitle: `${cleanTeam1} vs ${cleanTeam2}`,
      umpireName: umpireName.trim() || DEFAULT_UMPIRE_NAME,
      venue: venueName.trim(),
      startedAt: new Date().toISOString(),
      tossResult: `${tossWinner || cleanTeam1} won the toss and elected to ${tossDecision}`,
      tossWinner: tossWinner || cleanTeam1,
      tossDecision,
      maxOvers: overs,
      teams: [
        { id: selectedTeam1Meta.id, name: cleanTeam1, code: selectedTeam1Meta.code || makeTeamCode(cleanTeam1), logoKey: selectedTeam1Meta.logoKey },
        { id: selectedTeam2Meta.id, name: cleanTeam2, code: selectedTeam2Meta.code || makeTeamCode(cleanTeam2), logoKey: selectedTeam2Meta.logoKey }
      ],
      playingXI: {
        [cleanTeam1]: [...team1Roster],
        [cleanTeam2]: [...team2Roster]
      },
      inn1BattingTeam: bat1,
      inn1BowlingTeam: bowl1,
      inning: 1,
      innings: [inn1],
      phase: 'playing',
      target: null,
      resultText: '',
    });
  };

  // Inning end check
  const checkInningEnd = (inn, maxOv, maxWk) => {
    const oversUp = inn.totalLegalBalls >= maxOv * 6;
    const allOut = inn.battingTeam.wickets >= maxWk;
    return oversUp || allOut;
  };

  // Record a ball (Supports Runs, Wides, No-Balls, Wickets, Byes, Leg Byes, Penalty)
  const handleRecordBall = (runs, extraType = null, isWicket = false, byeType = null, wicketDetails = null) => {
    if (!activeMatch || activeMatch.phase !== 'playing') return;

    // ðŸ’¾ Push snapshot to history stack for UNDO & reset REDO
    const historySnapshot = JSON.parse(JSON.stringify(activeMatch));
    delete historySnapshot.pendingPublicEvent;
    setMatchHistoryStack(prevStack => [...prevStack.slice(-20), historySnapshot]);
    setMatchRedoStack([]);

    // ðŸ”Š Voice announcement
    try { speakBall(runs, extraType, isWicket); } catch (e) { }

    let overJustCompleted = false;
    let wicketFell = false;

    setActiveMatch(prev => {
      const innings = prev.innings.map(x => ({ ...x }));
      const inn = { ...innings[prev.inning - 1] };
      innings[prev.inning - 1] = inn;

      let addedRuns = runs;
      let ballLabel = String(runs);
      let isLegal = true;
      const isRunOut = isWicket && wicketDetails?.type === 'runOut';
      const bowlerName = inn.bowler?.name || 'Bowler';
      const dismissedEndKey = isRunOut && wicketDetails?.dismissed === 'nonStriker' ? 'nonStriker' : 'striker';
      const dismissedOriginal = inn[dismissedEndKey];
      const dismissedName = dismissedOriginal?.name;
      const dismissalText = wicketDetails?.dismissalText || (isRunOut
        ? `run out (${wicketDetails.end === 'striker' ? 'striker end' : 'non-striker end'})`
        : `b ${bowlerName}`);
      const bowlerGetsWicket = isWicket && wicketDetails?.bowlerCredited !== false;
      const partnershipPlayerNames = [inn.striker?.name, inn.nonStriker?.name].filter(Boolean);

      if (extraType === 'wd') { addedRuns += 1; ballLabel = runs > 0 ? `${runs}Wd` : 'Wd'; isLegal = false; }
      else if (extraType === 'nb') { addedRuns += 1; ballLabel = runs > 0 ? `${runs}Nb` : 'Nb'; isLegal = false; }
      else if (byeType === 'b') { ballLabel = `${runs || 1}B`; }
      else if (byeType === 'lb') { ballLabel = `${runs || 1}LB`; }
      else if (byeType === 'penalty') { addedRuns = 5; ballLabel = '5Pen'; isLegal = false; }
      if (isWicket) { ballLabel = isRunOut && runs > 0 ? `${runs}W` : 'W'; addedRuns = runs; }

      inn.lastDelivery = {
        ...makeLastDelivery({
          ballLabel,
          runs,
          addedRuns,
          extraType,
          byeType,
          isWicket
        }),
        detail: isWicket ? `${dismissedName || 'Batter'} - ${dismissalText}` : ''
      };

      // Team runs & wickets
      inn.battingTeam = { ...inn.battingTeam, runs: inn.battingTeam.runs + addedRuns };
      if (isWicket) {
        inn.battingTeam = { ...inn.battingTeam, wickets: inn.battingTeam.wickets + 1 };
        if (dismissedName && !(inn.dismissedPlayers || []).includes(dismissedName)) {
          inn.dismissedPlayers = [...(inn.dismissedPlayers || []), dismissedName];
        }
      }

      // Legal balls count â†’ overs
      const newLegalBalls = inn.totalLegalBalls + (isLegal ? 1 : 0);
      inn.totalLegalBalls = newLegalBalls;
      const ballsThisOver = newLegalBalls % 6;
      const overComplete = isLegal && ballsThisOver === 0 && newLegalBalls > 0;
      if (overComplete) overJustCompleted = true;

      // Bowler balls & runs (Byes, Leg Byes, Penalty do NOT count against bowler)
      const bowlerRunsScored = (byeType === 'b' || byeType === 'lb' || byeType === 'penalty') ? 0 : addedRuns;
      const previousBowlerFigure = normalizeBowlingFigure(
        (inn.bowlingStats || {})[bowlerName] || { ...inn.bowler, balls: inn.bowlerLegalBalls },
        bowlerName
      );
      const updatedBowlerFigure = makeBowlingFigure({
        name: bowlerName,
        balls: previousBowlerFigure.balls + (isLegal ? 1 : 0),
        runs: previousBowlerFigure.runs + bowlerRunsScored,
        wickets: previousBowlerFigure.wickets + (bowlerGetsWicket ? 1 : 0)
      });
      inn.bowlingStats = { ...(inn.bowlingStats || {}), [bowlerName]: updatedBowlerFigure };
      inn.bowlerLegalBalls = updatedBowlerFigure.balls;
      inn.bowler = {
        name: bowlerName,
        runs: updatedBowlerFigure.runs,
        wickets: updatedBowlerFigure.wickets,
        overs: updatedBowlerFigure.overs
      };

      // Striker stats: no-ball bat runs count to batter; byes/leg-byes do not.
      const batsmanRuns = extraType === 'nb' ? runs : (extraType || byeType) ? 0 : runs;
      const newStriker = {
        ...inn.striker,
        runs: inn.striker.runs + batsmanRuns,
        balls: inn.striker.balls + (isLegal ? 1 : 0),
        fours: inn.striker.fours + (runs === 4 && !extraType && !byeType ? 1 : 0),
        sixes: inn.striker.sixes + (runs === 6 && !extraType && !byeType ? 1 : 0),
      };
      const crossedFifty = inn.striker.runs < 50 && newStriker.runs >= 50;
      const updatedNonStriker = (inn.nonStriker && inn.nonStriker.name)
        ? { ...inn.nonStriker }
        : ((inn.allBatters || []).find(b => !b.isOut && b.name !== newStriker.name) || { name: 'Non-Striker', runs: 0, balls: 0 });
      const dismissedPlayer = dismissedEndKey === 'nonStriker' ? updatedNonStriker : newStriker;
      const nextPartnershipRuns = (inn.partnershipRuns || 0) + addedRuns;
      const nextPartnershipBalls = (inn.partnershipBalls || 0) + (isLegal ? 1 : 0);
      const nextPartnershipContributions = { ...(inn.partnershipContributions || {}) };

      partnershipPlayerNames.forEach(name => {
        nextPartnershipContributions[name] = {
          runs: nextPartnershipContributions[name]?.runs || 0,
          balls: nextPartnershipContributions[name]?.balls || 0
        };
      });
      if (newStriker?.name) {
        const strikerContribution = nextPartnershipContributions[newStriker.name] || { runs: 0, balls: 0 };
        nextPartnershipContributions[newStriker.name] = {
          runs: strikerContribution.runs + batsmanRuns,
          balls: strikerContribution.balls + (isLegal ? 1 : 0)
        };
      }

      if (isWicket) {
        inn.lastWicket = {
          name: dismissedPlayer?.name || 'Batter',
          runs: dismissedPlayer?.runs || 0,
          balls: dismissedPlayer?.balls || 0,
          teamScore: inn.battingTeam.runs,
          teamWickets: inn.battingTeam.wickets,
          over: formatOvers(newLegalBalls),
          dismissal: dismissalText
        };
        const firstPartner = partnershipPlayerNames[0] || dismissedPlayer?.name || '';
        const secondPartner = partnershipPlayerNames[1] || '';
        inn.partnershipHistory = [...(inn.partnershipHistory || []), {
          wicketNumber: inn.battingTeam.wickets,
          p1: firstPartner,
          r1: nextPartnershipContributions[firstPartner]?.runs || 0,
          b1: nextPartnershipContributions[firstPartner]?.balls || 0,
          p2: secondPartner,
          r2: nextPartnershipContributions[secondPartner]?.runs || 0,
          b2: nextPartnershipContributions[secondPartner]?.balls || 0,
          totalRuns: nextPartnershipRuns,
          totalBalls: nextPartnershipBalls,
          teamScore: inn.battingTeam.runs,
          over: formatOvers(newLegalBalls),
          dismissedName: dismissedPlayer?.name || '',
          status: 'out'
        }];
        inn.partnershipRuns = 0;
        inn.partnershipBalls = 0;
        inn.partnershipContributions = {};
      } else {
        inn.partnershipRuns = nextPartnershipRuns;
        inn.partnershipBalls = nextPartnershipBalls;
        inn.partnershipContributions = nextPartnershipContributions;
      }

      if (isWicket) inn.lastEvent = { type: 'wicket', label: 'Wicket' };
      else if (crossedFifty) inn.lastEvent = { type: 'fifty', label: 'Fifty' };
      else if (overComplete) inn.lastEvent = { type: 'over', label: 'Over' };
      else inn.lastEvent = null;

      const allBatters = (inn.allBatters?.length
        ? inn.allBatters
        : [inn.striker, inn.nonStriker].filter(player => player?.name)
      ).map(player => ({ ...player }));
      const strikerIndex = allBatters.findIndex(player => player.name === newStriker.name);
      const strikerRow = {
        ...newStriker,
        dismissal: isWicket && dismissedEndKey === 'striker' ? dismissalText : 'Not out',
        isOut: isWicket && dismissedEndKey === 'striker'
      };
      if (strikerIndex >= 0) allBatters[strikerIndex] = strikerRow;
      else allBatters.push(strikerRow);
      if (updatedNonStriker?.name) {
        const nonStrikerIndex = allBatters.findIndex(player => player.name === updatedNonStriker.name);
        const nonStrikerRow = {
          ...updatedNonStriker,
          dismissal: isWicket && dismissedEndKey === 'nonStriker' ? dismissalText : 'Not out',
          isOut: isWicket && dismissedEndKey === 'nonStriker'
        };
        if (nonStrikerIndex >= 0) allBatters[nonStrikerIndex] = nonStrikerRow;
        else allBatters.push(nonStrikerRow);
      }
      inn.allBatters = allBatters;

      if (isWicket) {
        let strikerEndPlayer = newStriker;
        let nonStrikerEndPlayer = updatedNonStriker;

        if (isRunOut) {
          const survivingPlayer = dismissedEndKey === 'striker' ? updatedNonStriker : newStriker;
          if (wicketDetails.end === 'striker') {
            strikerEndPlayer = dismissedPlayer;
            nonStrikerEndPlayer = survivingPlayer;
          } else {
            strikerEndPlayer = survivingPlayer;
            nonStrikerEndPlayer = dismissedPlayer;
          }
        }

        inn.striker = overComplete ? nonStrikerEndPlayer : strikerEndPlayer;
        inn.nonStriker = overComplete ? strikerEndPlayer : nonStrikerEndPlayer;
        inn.pendingBatterEnd = inn.striker?.name === dismissedName ? 'striker' : 'nonStriker';
      } else {
        const strikeRotationRuns = (byeType === 'b' || byeType === 'lb') ? (runs || 1) : runs;
        const oddRun = strikeRotationRuns % 2 === 1;
        const doSwap = (oddRun && !overComplete) || (!oddRun && overComplete);
        if (doSwap) {
          inn.striker = updatedNonStriker;
          inn.nonStriker = newStriker;
        } else {
          inn.striker = newStriker;
          inn.nonStriker = updatedNonStriker;
        }
      }

      // Save completed over to overHistory log & manage currentOverBalls timeline without premature clearing
      const prevWasOverComplete = inn.isOverComplete;
      const currentBallsBase = prevWasOverComplete ? [] : (inn.currentOverBalls || []);
      const currentOverBowlerWicketsBase = prevWasOverComplete ? 0 : (inn.currentOverBowlerWickets || 0);
      const newCurrentBalls = [...currentBallsBase, ballLabel];
      const newCurrentOverBowlerWickets = currentOverBowlerWicketsBase + (bowlerGetsWicket ? 1 : 0);

      if (overComplete) {
        const overRuns = sumDeliveryTokens(newCurrentBalls);
        const overBowlerRuns = sumDeliveryTokens(newCurrentBalls, getTokenBowlerRuns);
        const overLegalBalls = countLegalTokens(newCurrentBalls);
        const overWkts = countWicketTokens(newCurrentBalls);
        const overNum = Math.floor(newLegalBalls / 6);
        inn.overHistory = [...(inn.overHistory || []), {
          overNum,
          runs: overRuns,
          wickets: overWkts,
          legalBalls: overLegalBalls,
          bowlerRuns: overBowlerRuns,
          bowlerWickets: newCurrentOverBowlerWickets,
          bowlerName,
          balls: newCurrentBalls
        }];
        inn.currentOverBalls = newCurrentBalls; // KEEP COMPLETED OVER BALLS VISIBLE!
        inn.currentOverBowlerWickets = newCurrentOverBowlerWickets;
        inn.isOverComplete = true; // Mark over complete so next ball starts fresh!
      } else {
        inn.currentOverBalls = newCurrentBalls;
        inn.currentOverBowlerWickets = newCurrentOverBowlerWickets;
        inn.isOverComplete = false;
      }

      // Check inning end
      const roster = getRosterForTeam(inn.battingTeam.name, []);
      const mw = roster.length - 1;
      const innEnded = checkInningEnd(inn, prev.maxOvers, mw);
      const chaseCompleted = prev.inning === 2
        && prev.target
        && inn.battingTeam.runs >= prev.target;

      if (chaseCompleted) {
        inn.status = 'complete';
        const wicketsLeft = Math.max(0, mw - inn.battingTeam.wickets);
        const resultText = `${inn.battingTeam.name} won by ${wicketsLeft} wicket${wicketsLeft !== 1 ? 's' : ''}!`;
        try { Speech.speak('Match over! ' + resultText, { language: 'en-IN' }); } catch (e) { }
        return { ...prev, innings, phase: 'result', resultText, pendingPublicEvent: null };
      }

      if (innEnded && prev.inning === 1) {
        inn.status = 'complete';
        try { Speech.speak('Over! End of inning 1!', { language: 'en-IN' }); } catch (e) { }
        return { ...prev, innings, phase: 'inningBreak', target: inn.battingTeam.runs + 1, pendingPublicEvent: null };
      } else if (innEnded && prev.inning === 2) {
        inn.status = 'complete';
        const inn2 = inn;
        const inn1 = innings[0];
        const target = prev.target;
        let resultText = '';
        if (inn2.battingTeam.runs === target - 1) {
          resultText = 'Match tied!';
        } else {
          const diff = target - inn2.battingTeam.runs - 1;
          resultText = `${inn1.battingTeam.name} won by ${diff} run${diff !== 1 ? 's' : ''}!`;
        }
        try { Speech.speak('Match over! ' + resultText, { language: 'en-IN' }); } catch (e) { }
        return { ...prev, innings, phase: 'result', resultText, pendingPublicEvent: null };
      }

      // Wicket fell â€” need new batsman
      if (isWicket && !innEnded) {
        wicketFell = true;
        return { ...prev, innings, _pendingWicket: true, _pendingNewBowler: overComplete, pendingPublicEvent: null };
      }

      // Over complete but inning not over â€” need new bowler
      if (overComplete && !innEnded) {
        return { ...prev, innings, _pendingNewBowler: true, pendingPublicEvent: null };
      }

      return { ...prev, innings, pendingPublicEvent: null };
    });

    // Trigger wicket modal
    setTimeout(() => {
      setActiveMatch(prev => {
        if (!prev) return prev;
        if (prev._pendingWicket) {
          setWicketPending(true);
          return { ...prev, _pendingWicket: false };
        }
        if (prev._pendingNewBowler) {
          setNextBowlerName('');
          setBowlerChangePending(true);
          return { ...prev, _pendingNewBowler: false };
        }
        return prev;
      });
    }, 80);
  };

  const selectNewBatsman = (name) => {
    const cleanName = name.trim();
    if (!cleanName) return;
    const battingRoster = getBattingRoster();
    const bowlingRoster = getBowlingRoster();
    if (!battingRoster.includes(cleanName) && bowlingRoster.includes(cleanName)) {
      Alert.alert('New Batter', `${cleanName} belongs to the fielding team.`);
      return;
    }
    const needsNewBowler = Boolean(activeMatch?._pendingNewBowler);
    setActiveMatch(prev => {
      const innings = prev.innings.map(x => ({ ...x }));
      const inn = { ...innings[prev.inning - 1] };
      const playingXI = { ...(prev.playingXI || {}) };
      const battingTeamName = inn.battingTeam.name;
      if (!playingXI[battingTeamName]?.includes(cleanName)) {
        playingXI[battingTeamName] = [...(playingXI[battingTeamName] || []), cleanName];
      }
      const newBatter = { name: cleanName, runs: 0, balls: 0, fours: 0, sixes: 0 };
      const batterEnd = inn.pendingBatterEnd || 'striker';
      inn[batterEnd] = newBatter;
      inn.pendingBatterEnd = null;
      if (!(inn.allBatters || []).some(player => player.name === cleanName)) {
        inn.allBatters = [...(inn.allBatters || []), { ...newBatter, dismissal: 'Not out', isOut: false }];
      }
      innings[prev.inning - 1] = inn;
      return { ...prev, innings, playingXI, _pendingNewBowler: false };
    });
    try { Speech.speak(`${cleanName} is coming in to bat`, { language: 'en-IN' }); } catch (e) { }
    setNewBatsmanName('');
    setWicketPending(false);
    if (needsNewBowler) {
      setNextBowlerName('');
      setBowlerChangePending(true);
    }
  };

  const handleNewBatsman = () => {
    selectNewBatsman(newBatsmanName);
  };

  const handleWicketPress = () => {
    setPendingFielderDismissal('');
    setActiveMatch(prev => prev ? {
      ...prev,
      pendingPublicEvent: {
        token: 'W',
        label: 'WICKET',
        type: 'wicket',
        detail: ''
      }
    } : prev);
    setWicketEntryPending(true);
  };

  const cancelWicketEntry = () => {
    setPendingFielderDismissal('');
    setWicketEntryPending(false);
    setRunOutPending(false);
    setActiveMatch(prev => prev?.pendingPublicEvent?.type === 'wicket'
      ? { ...prev, pendingPublicEvent: null }
      : prev);
  };

  const handleSelectWicketType = (type) => {
    const bowlerName = curInning?.bowler?.name || 'Bowler';

    if (type === 'runOut') {
      setWicketEntryPending(false);
      setRunOutDismissed('');
      setRunOutEnd('');
      setRunOutRuns(0);
      setRunOutPending(true);
      return;
    }

    if (type === 'caught' || type === 'stumped') {
      setPendingFielderDismissal(type);
      return;
    }

    const dismissalText = {
      bowled: `b ${bowlerName}`,
      lbw: `lbw b ${bowlerName}`,
      hitWicket: `hit wicket b ${bowlerName}`
    }[type];

    setWicketEntryPending(false);
    handleRecordBall(0, null, true, null, {
      type,
      dismissed: 'striker',
      dismissalText,
      bowlerCredited: true
    });
  };

  const handleSelectDismissalFielder = (fielderName) => {
    const bowlerName = curInning?.bowler?.name || 'Bowler';
    const dismissalText = pendingFielderDismissal === 'caught'
      ? fielderName === bowlerName
        ? `c & b ${bowlerName}`
        : `c ${fielderName} b ${bowlerName}`
      : `st ${fielderName} b ${bowlerName}`;

    setWicketEntryPending(false);
    setPendingFielderDismissal('');
    handleRecordBall(0, null, true, null, {
      type: pendingFielderDismissal,
      dismissed: 'striker',
      dismissalText,
      bowlerCredited: true
    });
  };

  const handleConfirmRunOut = () => {
    if (!runOutDismissed || !runOutEnd) return;
    setRunOutPending(false);
    handleRecordBall(runOutRuns, null, true, null, {
      type: 'runOut',
      dismissed: runOutDismissed,
      end: runOutEnd,
      bowlerCredited: false
    });
  };

  const handleNewBowler = () => {
    const name = nextBowlerName.trim();
    if (!name) return;
    const bowlingRoster = getBowlingRoster();
    const battingRoster = getBattingRoster();
    if (!bowlingRoster.includes(name) && battingRoster.includes(name)) {
      Alert.alert('Change Bowler', `${name} belongs to the batting team.`);
      return;
    }
    const innBeforeChange = activeMatch?.innings?.[activeMatch.inning - 1];
    if ((innBeforeChange?.currentOverBalls || []).length > 0 && !innBeforeChange?.isOverComplete) {
      Alert.alert('Change Bowler', 'Normal bowler change is allowed only after the over is complete.');
      return;
    }
    setActiveMatch(prev => {
      const innings = prev.innings.map(x => ({ ...x }));
      const inn = { ...innings[prev.inning - 1] };
      if ((inn.currentOverBalls || []).length > 0 && !inn.isOverComplete) {
        Alert.alert('Change Bowler', 'Normal bowler change is allowed only after the over is complete.');
        return prev;
      }
      const playingXI = { ...(prev.playingXI || {}) };
      const bowlingTeamName = inn.bowlingTeam.name;
      if (!playingXI[bowlingTeamName]?.includes(name)) {
        playingXI[bowlingTeamName] = [...(playingXI[bowlingTeamName] || []), name];
      }

      const savedBowlerFigure = getBowlerFigureFromInning(inn, name);
      inn.bowlingStats = { ...(inn.bowlingStats || {}), [name]: savedBowlerFigure };
      inn.bowler = {
        name,
        runs: savedBowlerFigure.runs,
        wickets: savedBowlerFigure.wickets,
        overs: savedBowlerFigure.overs
      };
      inn.bowlerLegalBalls = savedBowlerFigure.balls;
      innings[prev.inning - 1] = inn;
      return { ...prev, innings, playingXI };
    });
    try { Speech.speak(`${name} will bowl the next over`, { language: 'en-IN' }); } catch (e) { }
    setNextBowlerName('');
    setBowlerChangePending(false);
  };

  const handleRetireBatsman = () => {
    const strikerName = curInning?.striker?.name;
    if (!activeMatch || !strikerName) return;
    setMatchHistoryStack(prevStack => [...prevStack.slice(-20), JSON.parse(JSON.stringify(activeMatch))]);
    setMatchRedoStack([]);
    setActiveMatch(prev => {
      const innings = prev.innings.map(x => ({ ...x }));
      const inn = { ...innings[prev.inning - 1] };
      const retiredPlayer = { ...inn.striker, dismissal: 'Retired hurt', isOut: true, retired: true };
      inn.dismissedPlayers = [...new Set([...(inn.dismissedPlayers || []), strikerName])];
      inn.allBatters = (inn.allBatters?.length ? inn.allBatters : [inn.striker, inn.nonStriker].filter(Boolean))
        .map(player => player.name === strikerName ? retiredPlayer : player);
      if (!inn.allBatters.some(player => player.name === strikerName)) inn.allBatters.push(retiredPlayer);
      inn.partnershipHistory = [...(inn.partnershipHistory || []), {
        wicketNumber: (inn.battingTeam.wickets || 0) + 1,
        p1: inn.striker?.name || '',
        r1: inn.partnershipContributions?.[inn.striker?.name]?.runs || 0,
        b1: inn.partnershipContributions?.[inn.striker?.name]?.balls || 0,
        p2: inn.nonStriker?.name || '',
        r2: inn.partnershipContributions?.[inn.nonStriker?.name]?.runs || 0,
        b2: inn.partnershipContributions?.[inn.nonStriker?.name]?.balls || 0,
        totalRuns: inn.partnershipRuns || 0,
        totalBalls: inn.partnershipBalls || 0,
        teamScore: inn.battingTeam.runs,
        over: formatOvers(inn.totalLegalBalls || 0),
        dismissedName: strikerName,
        status: 'retired'
      }];
      inn.partnershipRuns = 0;
      inn.partnershipBalls = 0;
      inn.partnershipContributions = {};
      inn.pendingBatterEnd = 'striker';
      innings[prev.inning - 1] = inn;
      return { ...prev, innings };
    });
    Speech.speak('Batsman retired. Select next batsman.', { language: 'en-IN' });
    setNewBatsmanName('');
    setWicketPending(true);
  };

  const handleSwapStrike = () => {
    const inn = activeMatch?.innings?.[activeMatch.inning - 1];
    const deliveryAlreadyRecorded = (inn?.totalLegalBalls || 0) > 0
      || (inn?.currentOverBalls || []).length > 0
      || (inn?.overHistory || []).length > 0;
    if (!inn?.striker?.name || !inn?.nonStriker?.name || activeMatch.phase !== 'playing' || deliveryAlreadyRecorded) return;

    Alert.alert(
      'Swap strike?',
      `${inn.nonStriker.name} will take strike. Score and ball data will stay unchanged.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Swap',
          onPress: () => {
            setMatchHistoryStack(prevStack => [...prevStack.slice(-20), JSON.parse(JSON.stringify(activeMatch))]);
            setMatchRedoStack([]);
            setActiveMatch(prev => {
              const innings = prev.innings.map(inning => ({ ...inning }));
              const currentInning = { ...innings[prev.inning - 1] };
              const previousStriker = currentInning.striker;
              currentInning.striker = currentInning.nonStriker;
              currentInning.nonStriker = previousStriker;
              innings[prev.inning - 1] = currentInning;
              return { ...prev, innings };
            });
          }
        }
      ]
    );
  };

  // âª Full Working UNDO Ball
  const handleUndo = () => {
    if (!matchHistoryStack || matchHistoryStack.length === 0) {
      Alert.alert('Undo Ball', 'No previous ball recorded to undo.');
      return;
    }
    const previousState = matchHistoryStack[matchHistoryStack.length - 1];
    setMatchHistoryStack(prev => prev.slice(0, -1));
    setMatchRedoStack(prev => [...prev, JSON.parse(JSON.stringify(activeMatch))]);
    setActiveMatch(previousState);
    try { Speech.speak('Last ball undone', { language: 'en-IN' }); } catch (e) { }
  };

  // â© Full Working REDO Ball
  const handleRedo = () => {
    if (!matchRedoStack || matchRedoStack.length === 0) {
      Alert.alert('Redo Ball', 'No action available to redo.');
      return;
    }
    const nextState = matchRedoStack[matchRedoStack.length - 1];
    setMatchRedoStack(prev => prev.slice(0, -1));
    setMatchHistoryStack(prev => [...prev, JSON.parse(JSON.stringify(activeMatch))]);
    setActiveMatch(nextState);
    try { Speech.speak('Last ball redone', { language: 'en-IN' }); } catch (e) { }
  };

  // Start Inning 2
  const handleSelectInning2Opener = (name) => {
    if (!name) return;
    if (name === inn2Striker) {
      setInn2Striker('');
      return;
    }
    if (name === inn2NonStriker) {
      setInn2NonStriker('');
      return;
    }
    if (!inn2Striker) {
      setInn2Striker(name);
      return;
    }
    if (!inn2NonStriker) {
      setInn2NonStriker(name);
      return;
    }
    setInn2NonStriker(name);
  };

  const handleStartInning2 = () => {
    if (!inn2Striker || !inn2NonStriker || !inn2Bowler) {
      Alert.alert('Second Innings', 'Select both openers and opening bowler.');
      return;
    }
    if (inn2Striker === inn2NonStriker) {
      Alert.alert('Second Innings', 'Opening batters must be different players.');
      return;
    }
    const firstInning = activeMatch?.innings?.[0];
    const secondBattingRoster = getRosterForTeam(firstInning?.bowlingTeam.name, []);
    const secondBowlingRoster = getRosterForTeam(firstInning?.battingTeam.name, []);
    if (!secondBattingRoster.includes(inn2Striker) || !secondBattingRoster.includes(inn2NonStriker) || !secondBowlingRoster.includes(inn2Bowler)) {
      Alert.alert('Second Innings', 'Selected players must belong to the correct teams.');
      return;
    }
    setActiveMatch(prev => {
      const inn1 = prev.innings[0];
      const inn2 = makeInning(inn1.bowlingTeam.name, inn1.battingTeam.name);
      inn2.striker = { name: inn2Striker, runs: 0, balls: 0, fours: 0, sixes: 0 };
      inn2.nonStriker = { name: inn2NonStriker, runs: 0, balls: 0, fours: 0, sixes: 0 };
      inn2.bowler = { name: inn2Bowler, runs: 0, wickets: 0, overs: '0.0' };
      inn2.bowlingStats = { [inn2Bowler]: makeBowlingFigure({ name: inn2Bowler }) };
      inn2.allBatters = [inn2.striker, inn2.nonStriker].filter(player => player.name).map(player => ({ ...player, dismissal: 'Not out', isOut: false }));
      return { ...prev, innings: [inn1, inn2], inning: 2, phase: 'playing' };
    });
    setInn2Striker(''); setInn2NonStriker(''); setInn2Bowler('');
  };

  // â”€â”€ RENDER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  // PUBLIC LIVE VIEW â€” EXACT CREX SCORECARD LAYOUT MATCHING USER SCREENSHOT
  const [scorecardInningIndex, setScorecardInningIndex] = useState(0);
  const [expandedScorecardBatter, setExpandedScorecardBatter] = useState(null);
  const scorecardSecondInning = activeMatch?.innings?.[1];
  const scorecardSecondInningHasDelivery = Boolean(
    scorecardSecondInning
    && ((scorecardSecondInning.totalLegalBalls || 0) > 0
      || (scorecardSecondInning.currentOverBalls || []).length > 0
      || (scorecardSecondInning.overHistory || []).length > 0)
  );
  const scorecardIsInningsBreak = Boolean(
    activeMatch
    && (activeMatch.phase === 'inningBreak'
      || (activeMatch.phase === 'playing' && activeMatch.inning === 2 && !scorecardSecondInningHasDelivery))
  );

  useEffect(() => {
    if (!activeMatch || publicLiveTab !== 'scorecard') return;
    const currentInningIndex = activeMatch.inning === 2 || activeMatch.phase === 'inningBreak' ? 1 : 0;
    setScorecardInningIndex(current => current === currentInningIndex ? current : currentInningIndex);
    setExpandedScorecardBatter(null);
  }, [publicLiveTab, activeMatch?.inning, scorecardIsInningsBreak]);

  const renderLiveScoreBoard = ({ showMatchHeader = false, match = activeMatch, heroOnly = false, bodyOnly = false, tone = 'light' } = {}) => {
    const inn = match.innings[match.inning - 1];
    const isInn2 = match.inning === 2;
    const reqRuns = isInn2 && match.target
      ? Math.max(0, match.target - inn.battingTeam.runs)
      : null;
    const reqBalls = isInn2
      ? Math.max(0, (match.maxOvers * 6) - inn.totalLegalBalls)
      : null;
    const crr = inn.totalLegalBalls > 0
      ? ((inn.battingTeam.runs / inn.totalLegalBalls) * 6).toFixed(2)
      : '0.00';
    const currentOverBalls = inn.currentOverBalls || [];
    const thisOverRuns = sumDeliveryTokens(currentOverBalls);
    const currentOverNum = getCurrentOverNumber(inn);
    const partnershipRuns = typeof inn.partnershipRuns === 'number'
      ? inn.partnershipRuns
      : (inn.striker?.runs || 0) + (inn.nonStriker?.runs || 0);
    const partnershipBalls = typeof inn.partnershipBalls === 'number'
      ? inn.partnershipBalls
      : (inn.striker?.balls || 0) + (inn.nonStriker?.balls || 0);
    const partnershipRate = partnershipBalls > 0
      ? ((partnershipRuns / partnershipBalls) * 6).toFixed(2)
      : '0.00';
    const bowlerEco = inn.bowlerLegalBalls > 0
      ? ((inn.bowler.runs / inn.bowlerLegalBalls) * 6).toFixed(1)
      : '0.0';
    const totalInningsBalls = Math.max(0, (Number(match.maxOvers) || 0) * 6);
    const legalBallsForProjection = Math.min(inn.totalLegalBalls || 0, totalInningsBalls);
    const remainingProjectionBalls = Math.max(0, totalInningsBalls - legalBallsForProjection);
    const currentRateNumber = legalBallsForProjection > 0
      ? ((inn.battingTeam.runs || 0) / legalBallsForProjection) * 6
      : 0;
    const projectedBaseRate = currentRateNumber > 0 ? Math.max(1, Math.floor(currentRateNumber)) : 6;
    const projectedScenarioRates = [
      projectedBaseRate,
      projectedBaseRate + 1,
      projectedBaseRate + 2,
      projectedBaseRate + 3
    ].filter(rate => Math.abs(rate - currentRateNumber) >= 0.05).slice(0, 3);
    const calculateProjectedScore = (rate) => Math.round(
      (inn.battingTeam.runs || 0) + ((remainingProjectionBalls * rate) / 6)
    );
    const projectedScoreColumns = [
      {
        label: `${currentRateNumber.toFixed(2)}*`,
        value: calculateProjectedScore(currentRateNumber),
        active: true
      },
      ...projectedScenarioRates.map(rate => ({
        label: rate.toFixed(1),
        value: calculateProjectedScore(rate),
        active: false
      }))
    ];
    const tossWinnerName = getTossWinnerName(match) || '-';
    const tossDecisionText = getTossDecisionText(match, tossDecision || 'BAT');
    const tossDecisionIcon = tossDecisionText === 'BOWL' ? 'baseball' : 'cricket';
    const tossWinnerTeamMeta = match.teams?.find(team => team.name === tossWinnerName || team.code === tossWinnerName);
    const tossWinnerCode = tossWinnerName === '-' ? '-' : getTeamShortCode(tossWinnerTeamMeta, tossWinnerName);
    const matchStatusText = match.phase === 'result'
      ? match.resultText
      : match.phase === 'inningBreak'
        ? `${inn.battingTeam.name} finish on ${inn.battingTeam.runs}-${inn.battingTeam.wickets}`
        : isInn2
          ? `${reqRuns ?? 0} runs needed from ${reqBalls ?? 0} balls`
          : null;
    const battingTeamMeta = match.teams?.find(team => team.name === inn.battingTeam.name) || inn.battingTeam;
    const battingTeamCode = getTeamShortCode(battingTeamMeta, inn.battingTeam.name);
    const battingTeamLogoSource = getTeamLogoSource(battingTeamMeta);
    const latestCompletedOver = (inn.overHistory || [])[(inn.overHistory || []).length - 1];
    const latestBallToken = currentOverBalls[currentOverBalls.length - 1]
      || latestCompletedOver?.balls?.[latestCompletedOver.balls.length - 1]
      || '';
    const latestDelivery = match.phase === 'result'
      ? null
      : (match.pendingPublicEvent
        || (inn.lastEvent?.type === 'over' ? { token: '', label: 'Over', type: 'over' } : null)
        || inn.lastDelivery || {
        token: latestBallToken,
        label: formatScoreTokenForPublic(latestBallToken),
        type: isWicketToken(latestBallToken) ? 'wicket' : 'runs'
      });
    const isDarkHero = tone === 'dark' && !bodyOnly;
    const latestDeliveryColor = latestDelivery?.type === 'wicket'
      ? (isDarkHero ? '#FDA4AF' : '#BE123C')
      : (isDarkHero ? '#86EFAC' : '#15803D');
    const heroSurfaceColor = isDarkHero ? '#071B2C' : '#FFFFFF';
    const heroBorderColor = isDarkHero ? '#123A56' : '#CBD5E1';
    const heroTeamColor = isDarkHero ? '#7DD3FC' : '#0284C7';
    const heroScoreColor = isDarkHero ? '#FFFFFF' : '#0F172A';
    const heroSubtleColor = isDarkHero ? '#9FC4D7' : '#64748B';
    const heroMetaColor = isDarkHero ? '#E0F2FE' : '#0F172A';
    const heroMutedColor = isDarkHero ? '#7EAAC2' : '#94A3B8';
    const heroIconBg = isDarkHero ? '#0B2A42' : '#E0F2FE';
    const heroStatusColor = isDarkHero ? '#BAE6FD' : (match.phase === 'result' ? '#0284C7' : '#475569');
    const heroDividerColor = isDarkHero ? '#2B5C78' : '#E2E8F0';
    const outcomeBoxWidth = Math.min(120, Math.max(92, screenWidth * 0.27));
    const batterRows = [
      { player: inn.striker, isStriker: true },
      { player: inn.nonStriker, isStriker: false }
    ].filter(row => row.player?.name);

    return (
      <View style={{ backgroundColor: bodyOnly ? '#FFFFFF' : heroSurfaceColor }}>
        {!bodyOnly && showMatchHeader ? (
          <View style={{ paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: heroBorderColor, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="radio-outline" size={15} color={heroTeamColor} />
                <Text style={{ color: heroTeamColor, fontSize: typeScale.caption, fontWeight: fontWeights.bold, fontFamily: systemFont }}>LIVE PUBLIC VIEW</Text>
              </View>
              <Text selectable style={{ color: heroScoreColor, fontSize: typeScale.title, fontWeight: fontWeights.bold, marginTop: 5, fontFamily: systemFont }} numberOfLines={1}>
                {match.matchTitle}
              </Text>
            </View>
            <View style={{ backgroundColor: isDarkHero ? '#0B2A42' : '#FEF3C7', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 6, borderWidth: isDarkHero ? 1 : 0, borderColor: '#2B5C78' }}>
              <Text style={{ color: isDarkHero ? '#E0F2FE' : '#92400E', fontSize: typeScale.caption, fontWeight: fontWeights.bold, fontFamily: systemFont }}>INN {match.inning}</Text>
            </View>
          </View>
        ) : null}

        {!bodyOnly ? (
          <View style={{ paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: heroBorderColor }}>
            <View style={{ position: 'relative', minHeight: 58, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1, minWidth: 0, paddingRight: latestDelivery?.label ? 14 : 0, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <TeamIdentityMark team={battingTeamMeta} logoSource={battingTeamLogoSource} size={54} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text selectable style={{ color: heroTeamColor, fontSize: typeScale.body, fontWeight: fontWeights.medium, fontFamily: systemFont }} numberOfLines={1}>
                    {battingTeamCode}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 7, marginTop: 3 }}>
                    <Text selectable style={{ color: heroScoreColor, ...publicType.score, fontVariant: ['tabular-nums'] }}>
                      {inn.battingTeam.runs}-{inn.battingTeam.wickets}
                    </Text>
                    <Text selectable style={{ color: heroSubtleColor, fontSize: typeScale.name, fontWeight: fontWeights.semibold, fontVariant: ['tabular-nums'], fontFamily: systemFont }}>
                      {formatOvers(inn.totalLegalBalls)}
                    </Text>
                  </View>
                </View>
              </View>
              {latestDelivery?.label ? (
                <>
                  <View pointerEvents="none" style={{ position: 'absolute', left: '50%', top: 8, bottom: 0, width: StyleSheet.hairlineWidth, backgroundColor: heroDividerColor }} />
                  <View style={{ flex: 1, minWidth: 0, paddingLeft: 14, alignItems: 'center', justifyContent: 'center' }}>
                    <View style={{ width: outcomeBoxWidth, minHeight: 48, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' }}>
                      <Text
                        selectable
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.85}
                        style={{ color: latestDeliveryColor, fontSize: 26, fontFamily: systemFontBold, textAlign: 'center' }}
                      >
                        {latestDelivery.label}
                      </Text>
                    </View>
                  </View>
                </>
              ) : null}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginTop: 9 }}>
              <Text selectable style={{ color: heroSubtleColor, fontSize: 11, fontWeight: fontWeights.semibold, fontVariant: ['tabular-nums'], fontFamily: systemFont }}>
                CRR  <Text style={{ color: heroMetaColor, fontWeight: fontWeights.bold, fontFamily: systemFont }}>{crr}</Text>
              </Text>
              <View style={{ flex: 1, minWidth: 0, minHeight: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 5 }}>
                <Text style={{ color: heroMutedColor, fontSize: typeScale.micro, lineHeight: 14, includeFontPadding: false, fontWeight: fontWeights.bold, fontFamily: systemFont }}>TOSS</Text>
                <Text selectable style={{ flexShrink: 1, minWidth: 0, color: heroMetaColor, fontSize: typeScale.label, lineHeight: 14, includeFontPadding: false, fontWeight: fontWeights.bold, textAlign: 'right', fontFamily: systemFont }} numberOfLines={1}>
                  {tossWinnerCode}
                </Text>
                <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: heroIconBg, alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialCommunityIcons name={tossDecisionIcon} size={12} color={heroTeamColor} />
                </View>
              </View>
            </View>
            {matchStatusText ? (
              <Text selectable style={{ color: heroStatusColor, fontSize: 12, lineHeight: 17, fontWeight: fontWeights.bold, marginTop: 7, fontFamily: systemFont }}>
                {matchStatusText}
              </Text>
            ) : null}
          </View>
        ) : null}

        {!heroOnly ? (
          <>
            <View style={{ paddingLeft: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#CBD5E1' }}>
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

            <RealtimeWinBar match={match} inning={inn} />

            <View style={{ borderBottomWidth: 1, borderBottomColor: '#CBD5E1' }}>
              <View style={{ minHeight: 38, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
                <Text style={{ flex: 1, color: '#64748B', ...publicType.label }}>ON PITCH PLAYERS</Text>
                <Text style={{ width: 30, color: '#94A3B8', ...publicType.label, textAlign: 'right' }}>R</Text>
                <Text style={{ width: 30, color: '#94A3B8', ...publicType.label, textAlign: 'right' }}>B</Text>
                <Text style={{ width: 28, color: '#94A3B8', ...publicType.label, textAlign: 'right' }}>4s</Text>
                <Text style={{ width: 28, color: '#94A3B8', ...publicType.label, textAlign: 'right' }}>6s</Text>
                <Text style={{ width: 50, color: '#94A3B8', ...publicType.label, textAlign: 'right' }}>SR</Text>
              </View>
              {batterRows.map(({ player, isStriker }) => {
                const strikeRate = player.balls > 0 ? ((player.runs / player.balls) * 100).toFixed(1) : '0.0';
                return (
                  <View key={`${player.name}-${isStriker}`} style={{ minHeight: 56, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}>
                    <View style={{ flex: 1, paddingRight: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text selectable {...nameFitProps} style={{ flexShrink: 1, minWidth: 0, color: '#0F172A', fontSize: typeScale.name, fontWeight: isStriker ? fontWeights.strong : fontWeights.bold, fontFamily: systemFont }}>{player.name}</Text>
                      {isStriker ? <MaterialCommunityIcons name="cricket" size={15} color="#0284C7" /> : null}
                    </View>
                    <Text selectable style={{ width: 30, color: '#0F172A', fontSize: typeScale.name, fontWeight: fontWeights.bold, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFont }}>{player.runs}</Text>
                    <Text selectable style={{ width: 30, color: '#475569', fontSize: 12, fontWeight: fontWeights.bold, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFont }}>{player.balls}</Text>
                    <Text selectable style={{ width: 28, color: '#475569', fontSize: 12, fontWeight: fontWeights.bold, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFont }}>{player.fours || 0}</Text>
                    <Text selectable style={{ width: 28, color: '#475569', fontSize: 12, fontWeight: fontWeights.bold, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFont }}>{player.sixes || 0}</Text>
                    <Text selectable style={{ width: 50, color: '#475569', fontSize: 11, fontWeight: fontWeights.bold, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFont }}>{strikeRate}</Text>
                  </View>
                );
              })}
            </View>

            {inn.bowler ? (
              <>
                <View style={{ height: 8, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }} />
                <View style={{ minHeight: 50, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#CBD5E1', backgroundColor: '#FFFFFF' }}>
                  <View style={{ flex: 1, minWidth: 0, paddingRight: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text selectable {...nameFitProps} style={{ flexShrink: 1, minWidth: 0, color: '#0F172A', fontSize: typeScale.name, fontFamily: systemFont }}>
                      {inn.bowler.name}
                    </Text>
                    <MaterialCommunityIcons name="baseball" size={15} color="#0284C7" />
                  </View>
                  {[
                    ['O', inn.bowler.overs],
                    ['R', inn.bowler.runs],
                    ['W', inn.bowler.wickets],
                    ['ECO', bowlerEco]
                  ].map(([label, value]) => (
                    <View key={label} style={{ width: label === 'ECO' ? 44 : 30, alignItems: 'flex-end' }}>
                      <Text selectable style={{ color: label === 'W' ? '#0284C7' : '#0F172A', fontSize: 13, fontFamily: systemFontMedium, fontVariant: ['tabular-nums'] }}>{value}</Text>
                      <Text style={{ color: '#94A3B8', fontSize: 8, marginTop: 1, fontFamily: systemFont }}>{label}</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : null}

            <View style={{ borderBottomWidth: 1, borderBottomColor: '#CBD5E1' }}>
              <View style={{ paddingHorizontal: 12, paddingTop: 11 }}>
                <Text style={{ color: '#64748B', ...publicType.label }}>PARTNERSHIP</Text>
              </View>
              <View style={{ flexDirection: 'row', marginTop: 7 }}>
                {[
                  ['RUNS', partnershipRuns],
                  ['BALLS', partnershipBalls],
                  ['RUN RATE', partnershipRate]
                ].map(([label, value], index) => (
                  <View key={label} style={{ flex: 1, paddingHorizontal: 12, paddingBottom: 12, borderLeftWidth: index > 0 ? 1 : 0, borderLeftColor: '#E2E8F0' }}>
                    <Text selectable style={{ color: '#0F172A', fontSize: 14, fontVariant: ['tabular-nums'], fontFamily: systemFontMedium }}>{value}</Text>
                    <Text style={{ color: '#94A3B8', fontSize: typeScale.micro, marginTop: 2, fontFamily: systemFont }}>{label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={{ paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#CBD5E1' }}>
              <Text style={{ color: '#64748B', ...publicType.label }}>LAST WICKET</Text>
              {inn.lastWicket ? (
                <View style={{ marginTop: 6, gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <Text selectable {...nameFitProps} style={{ flex: 1, minWidth: 0, color: '#0F172A', fontSize: typeScale.name, fontFamily: systemFontMedium }}>{inn.lastWicket.name}</Text>
                    <Text selectable style={{ color: '#0284C7', fontSize: typeScale.label, fontVariant: ['tabular-nums'], fontFamily: systemFont }}>
                      Over {inn.lastWicket.over}
                    </Text>
                  </View>
                  <Text selectable {...nameFitProps} style={{ color: '#64748B', fontSize: 11, lineHeight: 16, fontFamily: systemFont }}>
                    {inn.lastWicket.dismissal}
                  </Text>
                  <Text selectable style={{ color: '#0F172A', fontSize: typeScale.caption, fontVariant: ['tabular-nums'], fontFamily: systemFont }}>
                    Team {inn.lastWicket.teamScore}-{inn.lastWicket.teamWickets}
                  </Text>
                </View>
              ) : (
                <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 5, fontFamily: systemFont }}>No wicket yet</Text>
              )}
            </View>

            {match.phase === 'playing' && totalInningsBalls > 0 && (inn.totalLegalBalls || 0) >= 12 ? (
              <View style={{ marginTop: 6, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}>
                <View style={{ minHeight: 34, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <Text style={{ flex: 1, color: '#0F172A', fontSize: typeScale.name, lineHeight: 18, fontWeight: fontWeights.bold, fontFamily: systemFont }}>
                    Projected Score
                  </Text>
                  <Text style={{ color: '#64748B', fontSize: 10, fontWeight: fontWeights.bold, fontFamily: systemFont }}>
                    as per RR*
                  </Text>
                </View>
                <View style={{ minHeight: 30, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
                  <Text style={{ width: 78, color: '#64748B', fontSize: 11, fontWeight: fontWeights.bold, fontFamily: systemFont }}>Run Rate</Text>
                  {projectedScoreColumns.map(column => (
                    <Text key={`rate-${column.label}`} selectable style={{ flex: 1, color: column.active ? '#475569' : '#64748B', fontSize: typeScale.label, fontWeight: fontWeights.bold, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFont }}>
                      {column.label}
                    </Text>
                  ))}
                </View>
                <View style={{ minHeight: 38, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
                  <Text style={{ width: 78, color: '#0F172A', fontSize: typeScale.body, fontWeight: fontWeights.bold, fontFamily: systemFont }}>
                    {match.maxOvers} Over
                  </Text>
                  {projectedScoreColumns.map(column => (
                    <Text key={`projected-${column.label}`} selectable style={{ flex: 1, color: '#0F172A', fontSize: typeScale.name, fontWeight: fontWeights.bold, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFont }}>
                      {column.value}
                    </Text>
                  ))}
                </View>
              </View>
            ) : null}
          </>
        ) : null}
      </View>
    );
  };

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

  const capturePlayingXiTabLayout = (teamId, event) => {
    const { x, width } = event.nativeEvent.layout;
    setPlayingXiTabLayouts(previous => {
      const current = previous[teamId];
      if (current && Math.abs(current.x - x) < 0.5 && Math.abs(current.width - width) < 0.5) return previous;
      return { ...previous, [teamId]: { x, width } };
    });
  };

  const changePlayingXiTeam = (teamId, movePager = true) => {
    const nextIndex = teamId - 1;
    if (movePager) {
      playingXiPagerRef.current?.scrollTo({ x: nextIndex * screenWidth, animated: true });
    }
    if (teamId !== playingXiTeamTab) setPlayingXiTeamTab(teamId);
  };

  const handlePlayingXiPagerEnd = (event) => {
    const nextIndex = Math.max(0, Math.min(1, Math.round(event.nativeEvent.contentOffset.x / screenWidth)));
    const nextTeamId = nextIndex + 1;
    if (nextTeamId !== playingXiTeamTab) setPlayingXiTeamTab(nextTeamId);
  };

  const renderLiveView = ({ compactHeader = false } = {}) => {
    if (!activeMatch || !activeMatch.innings || !activeMatch.innings.length) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#F8FAFC' }}>
          <Ionicons name="radio-outline" size={34} color="#94A3B8" />
          <Text style={{ color: '#0F172A', fontSize: typeScale.pageTitle, fontWeight: fontWeights.bold, marginTop: 10, fontFamily: systemFont }}>No live match in progress</Text>
          <TouchableOpacity onPress={() => setCurrentScreen('home')} style={{ minHeight: 42, marginTop: 14, paddingHorizontal: 18, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0284C7' }}>
            <Text style={{ color: '#FFFFFF', fontSize: typeScale.body, fontWeight: fontWeights.bold, fontFamily: systemFont }}>BACK TO HOME</Text>
          </TouchableOpacity>
        </View>
      );
    }
    const inn = activeMatch.innings[activeMatch.inning - 1] || activeMatch.innings[0];
    const activePublicTab = publicLiveTab;
    const inn1Done = activeMatch.innings[0]?.status === 'complete';
    const isInn2 = activeMatch.inning === 2;
    const reqRuns = isInn2 && activeMatch.target ? Math.max(0, activeMatch.target - inn.battingTeam.runs) : null;
    const reqBalls = isInn2 ? Math.max(0, (activeMatch.maxOvers * 6) - inn.totalLegalBalls) : null;

    // Stats calculations
    const crr = inn.totalLegalBalls > 0 ? ((inn.battingTeam.runs / inn.totalLegalBalls) * 6).toFixed(2) : '0.00';
    const rrr = (isInn2 && reqBalls > 0) ? ((reqRuns / reqBalls) * 6).toFixed(2) : '0.00';

    const strikerSR = inn.striker?.balls > 0 ? ((inn.striker.runs / inn.striker.balls) * 100).toFixed(1) : '0.0';
    const nonStrikerSR = inn.nonStriker?.balls > 0 ? ((inn.nonStriker.runs / inn.nonStriker.balls) * 100).toFixed(1) : '0.0';
    const bowlerEco = inn.bowlerLegalBalls > 0 ? ((inn.bowler.runs / inn.bowlerLegalBalls) * 6).toFixed(1) : '0.0';

    const overHistory = inn.overHistory || [];
    const maxOverRuns = Math.max(12, ...overHistory.map(o => o.runs));

    // Scorecard Inning Data
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
    const scorecardPartnershipContributions = viewInningObj.partnershipContributions || {};
    const scorecardCurrentPartners = [viewInningObj.striker, viewInningObj.nonStriker].filter(player => player?.name);
    const getCurrentPartnershipContribution = (player) => {
      if (scorecardPartnershipContributions[player.name]) return scorecardPartnershipContributions[player.name];
      const previousContribution = scorecardPartnershipHistory.reduce((totals, partnership) => {
        if (partnership.p1 === player.name) {
          totals.runs += partnership.r1 || 0;
          totals.balls += partnership.b1 || 0;
        }
        if (partnership.p2 === player.name) {
          totals.runs += partnership.r2 || 0;
          totals.balls += partnership.b2 || 0;
        }
        return totals;
      }, { runs: 0, balls: 0 });
      return {
        runs: Math.max(0, (player.runs || 0) - previousContribution.runs),
        balls: Math.max(0, (player.balls || 0) - previousContribution.balls)
      };
    };
    const scorecardHasCurrentPartnership = scorecardCurrentPartners.length === 2
      && ((viewInningObj.partnershipRuns || 0) > 0 || (viewInningObj.partnershipBalls || 0) > 0);
    const scorecardPartnerships = [
      ...scorecardPartnershipHistory,
      ...(scorecardHasCurrentPartnership ? [{
        wicketNumber: (viewInningObj.battingTeam.wickets || 0) + 1,
        p1: scorecardCurrentPartners[0].name,
        r1: getCurrentPartnershipContribution(scorecardCurrentPartners[0]).runs,
        b1: getCurrentPartnershipContribution(scorecardCurrentPartners[0]).balls,
        p2: scorecardCurrentPartners[1].name,
        r2: getCurrentPartnershipContribution(scorecardCurrentPartners[1]).runs,
        b2: getCurrentPartnershipContribution(scorecardCurrentPartners[1]).balls,
        totalRuns: viewInningObj.partnershipRuns || 0,
        totalBalls: viewInningObj.partnershipBalls || 0,
        status: 'unbroken'
      }] : [])
    ];
    const scoreHeroInning = viewInningObj;
    const scorecardHasStarted = Boolean(
      (scoreHeroInning.totalLegalBalls || 0) > 0
      || (scoreHeroInning.currentOverBalls || []).length > 0
      || (scoreHeroInning.overHistory || []).length > 0
    );
    const scorecardChasingTeamMeta = activeMatch.teams?.find(team => team.name === scorecardChasingTeam?.name) || {
      ...scorecardChasingTeam,
      logoKey: 'default-team-2'
    };
    const scorecardDeclaredRoster = activeMatch.playingXI?.[scoreHeroInning.battingTeam.name]
      || (scoreHeroInning.battingTeam.name === team1Name ? team1Roster : team2Roster);
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
    const publicTeamOneName = activeMatch.teams?.[0]?.name || activeMatch.innings[0]?.battingTeam.name || team1Name;
    const publicTeamTwoName = activeMatch.teams?.[1]?.name || activeMatch.innings[0]?.bowlingTeam.name || team2Name;
    const publicTeamOneRoster = activeMatch.playingXI?.[publicTeamOneName] || (publicTeamOneName === team1Name ? team1Roster : team2Roster);
    const publicTeamTwoRoster = activeMatch.playingXI?.[publicTeamTwoName] || (publicTeamTwoName === team2Name ? team2Roster : team1Roster);
    const publicTossWinner = getTossWinnerName(activeMatch) || tossWinner || publicTeamOneName;
    const publicTossDecision = getTossDecisionText(activeMatch, tossDecision || 'BAT');

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
        {/* Clean CREX Top Bar Header with Actions */}
        <View style={{ backgroundColor: '#071B2C', paddingHorizontal: 14, paddingTop: 10, borderBottomWidth: 1, borderBottomColor: '#123A56' }}>
          {showTopTitleHeader ? (
            compactHeader ? (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingBottom: 6 }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="radio-outline" size={15} color="#7DD3FC" />
                    <Text style={{ color: '#7DD3FC', fontSize: typeScale.caption, fontWeight: fontWeights.bold, fontFamily: systemFont }}>LIVE PUBLIC VIEW</Text>
                  </View>
                  <Text selectable style={{ color: '#FFFFFF', fontSize: typeScale.title, fontWeight: fontWeights.bold, marginTop: 4, fontFamily: systemFont }} numberOfLines={1}>{activeMatch.matchTitle}</Text>
                </View>
                <View style={{ backgroundColor: '#0B2A42', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: '#2B5C78' }}>
                  <Text style={{ color: '#E0F2FE', fontSize: typeScale.caption, fontWeight: fontWeights.bold, fontFamily: systemFont }}>INN {activeMatch.inning}</Text>
                </View>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 6 }}>
                <TouchableOpacity onPress={() => setCurrentScreen(liveViewReturnScreen)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <Ionicons name="arrow-back" size={20} color="#E0F2FE" />
                  <Text style={{ color: '#FFFFFF', fontSize: typeScale.pageTitle, fontWeight: fontWeights.bold, fontFamily: systemFont }} numberOfLines={1}>{activeMatch.matchTitle}</Text>
                </TouchableOpacity>
              </View>
            )
          ) : null}

          <MatchTabBar
            tabs={PUBLIC_LIVE_TABS}
            activeTab={activePublicTab}
            layouts={publicTabLayouts}
            pageWidth={screenWidth}
            scrollX={publicPagerScrollX}
            scrollRef={publicTabsRef}
            onPress={changePublicLiveTab}
            onTabLayout={capturePublicTabLayout}
            tone="dark"
          />
        </View>

        {showTopTitleHeader ? renderLiveScoreBoard({ match: activeMatch, heroOnly: true, tone: 'dark' }) : null}

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
          {PUBLIC_LIVE_TABS.map(({ id: pageTabId }) => {
            const activePublicTab = pageTabId;
            return (
              <View key={pageTabId} style={{ width: screenWidth, flex: 1 }}>
                <ScrollView
                  style={{ flex: 1 }}
                  contentContainerStyle={{ padding: 14, paddingBottom: 24, gap: 14 }}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                >

                  {/* TAB 1: LIVE TAB */}
                  {activePublicTab === 'live' && (
                    <>
                      {renderLiveScoreBoard({ bodyOnly: true })}
                      {/* CREX WIN POLL CARD ("Who will win?") */}
                      {false && <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', gap: 12 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ color: '#0F172A', fontSize: typeScale.name, fontWeight: fontWeights.bold, fontFamily: systemFont }}>Who will win?</Text>
                          <Text style={{ color: '#64748B', fontSize: 11, fontWeight: fontWeights.bold, fontFamily: systemFont }}>Total Votes: 49,262</Text>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <TouchableOpacity
                            onPress={() => setPollVote(team1Name)}
                            style={{
                              flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
                              backgroundColor: pollVote === team1Name ? '#0284C7' : '#F8FAFC',
                              borderWidth: 1, borderColor: pollVote === team1Name ? '#0284C7' : '#E2E8F0'
                            }}
                          >
                            <Text style={{ color: pollVote === team1Name ? '#FFFFFF' : '#0F172A', fontSize: typeScale.body, fontWeight: fontWeights.bold, fontFamily: systemFont }}>
                              {team1Name} {pollVote ? '(64%)' : ''}
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => setPollVote('DRAW')}
                            style={{
                              flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
                              backgroundColor: pollVote === 'DRAW' ? '#0284C7' : '#F8FAFC',
                              borderWidth: 1, borderColor: pollVote === 'DRAW' ? '#0284C7' : '#E2E8F0'
                            }}
                          >
                            <Text style={{ color: pollVote === 'DRAW' ? '#FFFFFF' : '#0F172A', fontSize: typeScale.body, fontWeight: fontWeights.bold, fontFamily: systemFont }}>
                              DRAW {pollVote ? '(5%)' : ''}
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => setPollVote(team2Name)}
                            style={{
                              flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
                              backgroundColor: pollVote === team2Name ? '#0284C7' : '#F8FAFC',
                              borderWidth: 1, borderColor: pollVote === team2Name ? '#0284C7' : '#E2E8F0'
                            }}
                          >
                            <Text style={{ color: pollVote === team2Name ? '#FFFFFF' : '#0F172A', fontSize: typeScale.body, fontWeight: fontWeights.bold, fontFamily: systemFont }}>
                              {team2Name} {pollVote ? '(31%)' : ''}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>}

                      {/* SHARE LIVE SCORE BUTTON */}
                      {false && <TouchableOpacity
                        onPress={() => Alert.alert('Share Live Score', `Match: ${activeMatch.matchTitle}\nScore: ${inn.battingTeam.runs}/${inn.battingTeam.wickets} (${formatOvers(inn.totalLegalBalls)} Ov)`)}
                        style={{ backgroundColor: '#F1F5F9', borderRadius: 12, paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#CBD5E1' }}
                      >
                        <Ionicons name="share-outline" size={16} color="#0F172A" />
                        <Text style={{ color: '#0F172A', fontSize: typeScale.name, fontWeight: fontWeights.bold, fontFamily: systemFont }}>Share Live Score</Text>
                      </TouchableOpacity>}
                    </>
                  )}

                  {/* TAB 2: SCORECARD TAB */}
                  {activePublicTab === 'scorecard' && (
                    <View style={{ gap: 14 }}>
                      {/* Inning Switcher Pills */}
                      <View style={{ flexDirection: 'row', gap: 8, padding: 14, backgroundColor: '#F4F6F8', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
                        <InningTeamTab
                          name={activeMatch.innings[0]?.battingTeam.name || publicTeamOneName}
                          selected={scorecardInningIndex === 0}
                          onPress={() => setScorecardInningIndex(0)}
                        />

                        <InningTeamTab
                          name={scorecardChasingTeam?.name || publicTeamTwoName}
                          selected={scorecardInningIndex === 1}
                          statusText={!scorecardSecondInningHasDelivery ? 'Yet to bat' : ''}
                          onPress={() => setScorecardInningIndex(1)}
                        />
                      </View>

                      {scorecardInningIndex === 1 && scorecardIsInningsBreak ? (
                        <View style={{ marginTop: 12, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#CBD5E1' }}>
                          <View style={{ minHeight: 48, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, backgroundColor: '#F7F9FA', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <Ionicons name="pause-circle-outline" size={18} color="#0284C7" />
                              <Text style={{ color: '#0F172A', fontSize: typeScale.body, fontWeight: fontWeights.bold, fontFamily: systemFont }}>INNINGS BREAK</Text>
                            </View>
                            <Text style={{ color: '#64748B', fontSize: 9, fontWeight: fontWeights.bold, fontFamily: systemFont }}>1ST INNINGS COMPLETE</Text>
                          </View>

                          <View style={{ minHeight: 94, paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <TeamIdentityMark team={scorecardChasingTeamMeta} size={44} />
                            <View style={{ flex: 1, minWidth: 0 }}>
                              <Text selectable style={{ color: '#0F172A', fontSize: typeScale.title, fontWeight: fontWeights.bold, fontFamily: systemFont }} numberOfLines={1}>{scorecardChasingTeam?.name}</Text>
                              <Text style={{ color: '#64748B', fontSize: 10, fontWeight: fontWeights.bold, marginTop: 4, fontFamily: systemFont }}>SECOND INNINGS</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                              <Text style={{ color: '#64748B', fontSize: typeScale.micro, fontWeight: fontWeights.bold, fontFamily: systemFont }}>TARGET</Text>
                              <Text selectable style={{ color: '#0284C7', fontSize: typeScale.outcome, lineHeight: 29, fontWeight: fontWeights.bold, fontVariant: ['tabular-nums'], fontFamily: systemFont }}>{activeMatch.target}</Text>
                            </View>
                          </View>

                          <View style={{ minHeight: 42, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#F0F9FF', borderTopWidth: 1, borderTopColor: '#BAE6FD' }}>
                            <Ionicons name="time-outline" size={15} color="#0284C7" />
                            <Text style={{ color: '#0369A1', fontSize: 11, fontWeight: fontWeights.bold, fontFamily: systemFont }}>Second innings starts shortly</Text>
                          </View>
                        </View>
                      ) : !scorecardHasStarted ? (
                        <PreInningsScorecard players={scorecardDeclaredPlayers} />
                      ) : (
                        <>
                          {/* BATTING TABLE */}
                          <View style={{ backgroundColor: '#FFFFFF', overflow: 'hidden', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
                            <View style={{ minHeight: 50, backgroundColor: '#FFFFFF', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
                              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Text style={{ color: '#1477A8', fontSize: typeScale.body, fontFamily: systemFontBold }}>BATTER</Text>
                                <Ionicons name="arrow-down" size={13} color="#1477A8" />
                              </View>
                              <Text style={{ color: '#7C8793', fontSize: 12, width: 34, textAlign: 'right', fontFamily: systemFontBold }}>R</Text>
                              <Text style={{ color: '#7C8793', fontSize: 12, width: 30, textAlign: 'right', fontFamily: systemFontBold }}>B</Text>
                              <Text style={{ color: '#7C8793', fontSize: 12, width: 32, textAlign: 'right', fontFamily: systemFontBold }}>4s</Text>
                              <Text style={{ color: '#7C8793', fontSize: 12, width: 32, textAlign: 'right', fontFamily: systemFontBold }}>6s</Text>
                              <Text style={{ color: '#7C8793', fontSize: 12, width: 58, textAlign: 'right', fontFamily: systemFontBold }}>SR</Text>

                            </View>

                            {/* DYNAMIC ALL BATTERS LIST */}
                            {(scorecardKnownBatters.length > 0 ? (
                              scorecardKnownBatters.map((b, bi) => {
                                const sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0';
                                const batterKey = `${scorecardInningIndex}-${b.name}`;
                                const isExpanded = expandedScorecardBatter === batterKey;
                                return (
                                  <View key={batterKey} style={{ borderBottomWidth: 1, borderBottomColor: '#E8ECEF' }}>
                                    <TouchableOpacity
                                      activeOpacity={0.7}
                                      onPress={() => setExpandedScorecardBatter(isExpanded ? null : batterKey)}
                                      style={{ minHeight: 78, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}
                                    >
                                      <View style={{ flex: 1, paddingRight: 6 }}>
                                        <Text selectable style={{ color: '#111827', fontSize: typeScale.name, fontFamily: systemFontMedium }} numberOfLines={1}>
                                          {b.name} {b.name === viewInningObj.striker?.name ? '*' : ''}
                                        </Text>
                                        <Text selectable style={{ color: b.isOut ? '#737D88' : '#0F8B75', fontSize: 11, marginTop: 6, fontFamily: systemFont }} numberOfLines={1}>
                                          {b.dismissal || 'Not out'}
                                        </Text>
                                      </View>
                                      <Text selectable style={{ color: '#111827', fontSize: typeScale.title, width: 34, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFontBold }}>{b.runs}</Text>
                                      <Text selectable style={{ color: '#4B5563', fontSize: 12, width: 30, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFont }}>{b.balls}</Text>
                                      <Text selectable style={{ color: '#4B5563', fontSize: 12, width: 32, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFont }}>{b.fours || 0}</Text>
                                      <Text selectable style={{ color: '#4B5563', fontSize: 12, width: 32, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFont }}>{b.sixes || 0}</Text>
                                      <Text selectable style={{ color: '#374151', fontSize: 12, width: 58, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFontMedium }}>{sr}</Text>

                                    </TouchableOpacity>
                                    {isExpanded ? (
                                      <View style={{ minHeight: 38, paddingHorizontal: 16, paddingVertical: 9, backgroundColor: '#F7F9FA', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text style={{ color: '#64748B', fontSize: 10, fontFamily: systemFontMedium }}>BOUNDARIES  {b.fours || 0} fours  {b.sixes || 0} sixes</Text>
                                        <Text selectable style={{ color: '#0F172A', fontSize: typeScale.caption, fontVariant: ['tabular-nums'], fontFamily: systemFontBold }}>STRIKE RATE  {sr}</Text>
                                      </View>
                                    ) : null}
                                  </View>
                                );
                              })
                            ) : (
                              <>
                                {viewInningObj.striker && (
                                  <View style={{ paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                      <Text style={{ color: '#0F172A', fontSize: typeScale.name, flex: 1, fontFamily: systemFontMedium }}>{viewInningObj.striker.name}*</Text>
                                      <Text style={{ color: '#0F172A', fontSize: typeScale.name, width: 28, textAlign: 'right', fontFamily: systemFontBold }}>{viewInningObj.striker.runs}</Text>
                                      <Text style={{ color: '#64748B', fontSize: 12, width: 28, textAlign: 'right', fontFamily: systemFont }}>{viewInningObj.striker.balls}</Text>
                                      <Text style={{ color: '#64748B', fontSize: 12, width: 26, textAlign: 'right', fontFamily: systemFont }}>{viewInningObj.striker.fours}</Text>
                                      <Text style={{ color: '#64748B', fontSize: 12, width: 26, textAlign: 'right', fontFamily: systemFont }}>{viewInningObj.striker.sixes}</Text>
                                      <Text style={{ color: '#0284C7', fontSize: 11, width: 50, textAlign: 'right', fontFamily: systemFontMedium }}>{strikerSR}</Text>
                                    </View>
                                    <Text style={{ color: '#0284C7', fontSize: 10, marginTop: 2, fontFamily: systemFont }}>Not out</Text>
                                  </View>
                                )}
                                {viewInningObj.nonStriker?.name ? (
                                  <View style={{ paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                      <Text style={{ color: '#0F172A', fontSize: typeScale.name, flex: 1, fontFamily: systemFontMedium }}>{viewInningObj.nonStriker.name}</Text>
                                      <Text style={{ color: '#0F172A', fontSize: typeScale.name, width: 28, textAlign: 'right', fontFamily: systemFontBold }}>{viewInningObj.nonStriker.runs}</Text>
                                      <Text style={{ color: '#64748B', fontSize: 12, width: 28, textAlign: 'right', fontFamily: systemFont }}>{viewInningObj.nonStriker.balls}</Text>
                                      <Text style={{ color: '#64748B', fontSize: 12, width: 26, textAlign: 'right', fontFamily: systemFont }}>{viewInningObj.nonStriker.fours}</Text>
                                      <Text style={{ color: '#64748B', fontSize: 12, width: 26, textAlign: 'right', fontFamily: systemFont }}>{viewInningObj.nonStriker.sixes}</Text>
                                      <Text style={{ color: '#0284C7', fontSize: 11, width: 50, textAlign: 'right', fontFamily: systemFontMedium }}>{nonStrikerSR}</Text>
                                    </View>
                                    <Text style={{ color: '#0284C7', fontSize: 10, marginTop: 2, fontFamily: systemFont }}>Not out</Text>
                                  </View>
                                ) : null}
                              </>
                            ))}

                            {/* Extras row */}
                            <View style={{ minHeight: 44, paddingHorizontal: 16, backgroundColor: '#F7F9FA', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Text style={{ color: '#64748B', fontSize: 11, fontWeight: fontWeights.bold, fontFamily: systemFont }}>EXTRAS</Text>
                              <Text selectable style={{ color: '#0F172A', fontSize: typeScale.name, fontWeight: fontWeights.bold, fontVariant: ['tabular-nums'], fontFamily: systemFont }}>{scorecardExtras}</Text>
                            </View>
                            <PendingBattersSection title={scorecardPendingTitle} players={scorecardPendingBatters} />
                          </View>

                          {/* BOWLING TABLE */}
                          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' }}>
                            <View style={{ minHeight: 48, backgroundColor: '#F7F9FA', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
                              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Text style={{ color: '#1477A8', fontSize: typeScale.body, fontWeight: fontWeights.bold, fontFamily: systemFont }}>BOWLER</Text>
                                <Ionicons name="arrow-down" size={13} color="#1477A8" />
                              </View>
                              <Text style={{ color: '#7C8793', fontSize: 11, fontWeight: fontWeights.bold, width: 34, textAlign: 'right', fontFamily: systemFont }}>O</Text>
                              <Text style={{ color: '#7C8793', fontSize: 11, fontWeight: fontWeights.bold, width: 30, textAlign: 'right', fontFamily: systemFont }}>M</Text>
                              <Text style={{ color: '#7C8793', fontSize: 11, fontWeight: fontWeights.bold, width: 34, textAlign: 'right', fontFamily: systemFont }}>R</Text>
                              <Text style={{ color: '#7C8793', fontSize: 11, fontWeight: fontWeights.bold, width: 32, textAlign: 'right', fontFamily: systemFont }}>W</Text>
                              <Text style={{ color: '#7C8793', fontSize: 11, fontWeight: fontWeights.bold, width: 50, textAlign: 'right', fontFamily: systemFont }}>ECO</Text>
                            </View>
                            {scorecardBowlingRows.length > 0 ? scorecardBowlingRows.map((bowlerRow, bowlerIndex) => {
                              const isCurrentBowler = bowlerRow.name === viewInningObj.bowler?.name;
                              return (
                                <View key={`${bowlerRow.name}-${bowlerIndex}`} style={{ minHeight: 50, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderTopWidth: bowlerIndex > 0 ? 1 : 0, borderTopColor: '#E8ECEF' }}>
                                  <View style={{ flex: 1, minWidth: 0, paddingRight: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    {isCurrentBowler ? <MaterialCommunityIcons name="baseball" size={15} color="#0284C7" /> : null}
                                    <Text selectable {...nameFitProps} style={{ flex: 1, minWidth: 0, color: '#111827', fontWeight: fontWeights.bold, fontSize: typeScale.name, fontFamily: systemFont }}>{bowlerRow.name}</Text>
                                  </View>
                                  <Text selectable style={{ color: '#4B5563', fontWeight: fontWeights.bold, fontSize: 12, width: 34, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFont }}>{bowlerRow.overs}</Text>
                                  <Text selectable style={{ color: '#4B5563', fontWeight: fontWeights.bold, fontSize: 12, width: 30, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFont }}>0</Text>
                                  <Text selectable style={{ color: '#4B5563', fontWeight: fontWeights.bold, fontSize: 12, width: 34, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFont }}>{bowlerRow.runs}</Text>
                                  <Text selectable style={{ color: '#111827', fontWeight: fontWeights.bold, fontSize: typeScale.name, width: 32, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFont }}>{bowlerRow.wickets}</Text>
                                  <Text selectable style={{ color: '#1477A8', fontWeight: fontWeights.bold, fontSize: typeScale.body, width: 50, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFont }}>{bowlerRow.econ}</Text>
                                </View>
                              );
                            }) : (
                              <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: fontWeights.bold, padding: 12, textAlign: 'center', fontFamily: systemFont }}>No bowling yet</Text>
                            )}
                          </View>

                          {/* FALL OF WICKETS */}
                          <View style={{ marginTop: 14, backgroundColor: '#FFFFFF', overflow: 'hidden', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E2E8F0' }}>
                            <View style={{ minHeight: 46, backgroundColor: '#F7F9FA', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Text style={{ color: '#64748B', fontSize: typeScale.label, fontWeight: fontWeights.bold, fontFamily: systemFont }}>FALL OF WICKETS</Text>
                              <Text style={{ color: '#64748B', fontSize: typeScale.label, fontWeight: fontWeights.bold, fontFamily: systemFont }}>SCORE / OVER</Text>
                            </View>
                            {scorecardFallOfWickets.length === 0 ? (
                              <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: fontWeights.bold, padding: 12, textAlign: 'center', fontFamily: systemFont }}>No wickets fallen yet</Text>
                            ) : (
                              scorecardFallOfWickets.map((item, i) => (
                                <View key={`${item.dismissedName}-${i}`} style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: '#E8ECEF' }}>
                                  <Text selectable {...nameFitProps} style={{ flex: 1, minWidth: 0, color: '#0F172A', fontWeight: fontWeights.bold, fontSize: typeScale.body, fontFamily: systemFont }}>{item.dismissedName}</Text>
                                  <Text selectable style={{ color: '#64748B', fontWeight: fontWeights.bold, fontSize: typeScale.body, fontVariant: ['tabular-nums'], fontFamily: systemFont }}>
                                    {item.teamScore ?? viewInningObj.battingTeam.runs}-{item.wicketNumber || i + 1}{item.over ? `  (${item.over} ov)` : ''}
                                  </Text>
                                </View>
                              ))
                            )}
                          </View>

                          {/* PARTNERSHIPS */}
                          <View style={{ marginTop: 14, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E2E8F0' }}>
                            <View style={{ minHeight: 46, paddingHorizontal: 16, justifyContent: 'center', backgroundColor: '#F7F9FA' }}>
                              <Text style={{ color: '#64748B', fontSize: 11, fontWeight: fontWeights.bold, fontFamily: systemFont }}>INNING PARTNERSHIPS</Text>
                            </View>

                            {scorecardPartnerships.length === 0 ? (
                              <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: fontWeights.bold, padding: 14, textAlign: 'center', fontFamily: systemFont }}>No partnership recorded yet</Text>
                            ) : scorecardPartnerships.map((item, idx) => {
                              const partnershipState = item.status === 'unbroken'
                                ? viewInningObj.status === 'complete' ? ' (Unbroken)' : ' (Current)'
                                : '';
                              return (
                                <View key={`${item.wicketNumber}-${idx}`} style={{ minHeight: 66, backgroundColor: item.status === 'unbroken' ? '#ECFEFF' : '#FFFFFF', paddingHorizontal: 16, paddingVertical: 11, borderTopWidth: 1, borderTopColor: item.status === 'unbroken' ? '#A5F3FC' : '#E8ECEF' }}>
                                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <Text style={{ fontSize: typeScale.label, fontWeight: fontWeights.bold, color: item.status === 'unbroken' ? '#0284C7' : '#64748B', fontFamily: systemFont }}>
                                      {formatOrdinal(item.wicketNumber)} Wicket{partnershipState}
                                    </Text>
                                    <Text selectable style={{ fontSize: typeScale.body, fontWeight: fontWeights.bold, color: item.status === 'unbroken' ? '#0369A1' : '#0F172A', fontVariant: ['tabular-nums'], fontFamily: systemFont }}>{item.totalRuns} runs ({item.totalBalls})</Text>
                                  </View>
                                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                                    <Text selectable style={{ flex: 1, fontSize: 11, fontWeight: fontWeights.bold, color: '#0F172A', fontFamily: systemFont }} numberOfLines={1}>{item.p1} <Text style={{ color: '#64748B', fontWeight: fontWeights.semibold, fontFamily: systemFont }}>({item.r1})</Text></Text>
                                    {item.p2 ? (
                                      <Text selectable style={{ flex: 1, fontSize: 11, fontWeight: fontWeights.bold, color: '#0F172A', textAlign: 'right', fontFamily: systemFont }} numberOfLines={1}>{item.p2} <Text style={{ color: '#64748B', fontWeight: fontWeights.semibold, fontFamily: systemFont }}>({item.r2})</Text></Text>
                                    ) : null}
                                  </View>
                                </View>
                              );
                            })}
                          </View>
                        </>
                      )}
                    </View>
                  )}

                  {/* TAB 3: WORM & MANHATTAN GRAPHS */}
                  {activePublicTab === 'graphs' && (
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

                  {/* TAB 4: OVERS BREAKDOWN */}
                  {activePublicTab === 'overs' && (
                    <View style={{ gap: 8 }}>
                      {overHistory.length === 0 ? (
                        <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: fontWeights.bold, textAlign: 'center', paddingVertical: 30, fontFamily: systemFont }}>
                          No overs completed yet.
                        </Text>
                      ) : (
                        overHistory.map((o, idx) => (
                          <View key={idx} style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                              <Text style={{ color: '#0284C7', fontSize: typeScale.body, fontWeight: fontWeights.bold, fontFamily: systemFont }}>Over {o.overNum} - {o.bowlerName}</Text>
                              <Text style={{ color: '#B45309', fontSize: typeScale.body, fontWeight: fontWeights.bold, fontFamily: systemFont }}>{o.runs} Runs {o.wickets > 0 ? `- ${o.wickets} W` : ''}</Text>
                            </View>
                            <View style={{ minHeight: 26 }}>
                              {renderBallTimeline(o.balls, { size: 26, emptyText: 'No balls', contentPaddingRight: 4 })}
                            </View>
                          </View>
                        ))
                      )}
                    </View>
                  )}

                  {activePublicTab === 'info' && (
                    <MatchInfoPanel
                      rows={[
                        { icon: 'trophy-outline', label: 'Match', value: activeMatch.matchTitle },
                        { icon: 'calendar-outline', label: 'Date & time', value: formatMatchDateTime(activeMatch.startedAt) },
                        { icon: 'swap-horizontal-outline', label: 'Toss', value: activeMatch.tossResult || `${publicTossWinner} chose to ${publicTossDecision}`, emphasis: true },
                        activeMatch.venue ? { icon: 'location-outline', label: 'Venue', value: activeMatch.venue } : null,
                        { icon: 'person-outline', label: 'Umpire', value: activeMatch.umpireName || DEFAULT_UMPIRE_NAME },
                        { icon: 'partly-sunny-outline', label: 'Conditions', value: `${weatherData.temp} C, ${weatherData.condition}` }
                      ]}
                      teamOneName={publicTeamOneName}
                      teamTwoName={publicTeamTwoName}
                      playerCount={publicTeamOneRoster.length + publicTeamTwoRoster.length}
                      onOpenPlayingXi={() => {
                        setPlayingXiTeamTab(1);
                        playingXiPagerScrollX.setValue(0);
                        setPlayingXiVisible(true);
                      }}
                    />
                  )}

                  {/* Legacy info layout retained for data compatibility */}
                  {false && activePublicTab === 'info' && (
                    <View style={{ gap: 14 }}>
                      <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', gap: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Ionicons name="information-circle" size={18} color="#0284C7" />
                          <Text style={{ fontSize: typeScale.name, fontWeight: fontWeights.bold, color: '#0F172A', fontFamily: systemFont }}>MATCH INFORMATION</Text>
                        </View>

                        <View style={{ gap: 10 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: 12, color: '#64748B', fontWeight: fontWeights.bold, fontFamily: systemFont }}>Match</Text>
                            <Text style={{ fontSize: 12, color: '#0F172A', fontWeight: fontWeights.bold, fontFamily: systemFont }}>{activeMatch.matchTitle}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: 12, color: '#64748B', fontWeight: fontWeights.bold, fontFamily: systemFont }}>Series</Text>
                            <Text style={{ fontSize: 12, color: '#0F172A', fontWeight: fontWeights.bold, fontFamily: systemFont }}>CricFlow Premier League 2026</Text>
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: 12, color: '#64748B', fontWeight: fontWeights.bold, fontFamily: systemFont }}>Date & Time</Text>
                            <Text style={{ fontSize: 12, color: '#0F172A', fontWeight: fontWeights.bold, fontFamily: systemFont }}>Today, 7:30 PM IST</Text>
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: 12, color: '#64748B', fontWeight: fontWeights.bold, fontFamily: systemFont }}>Toss Announcement</Text>
                            <Text style={{ fontSize: 12, color: '#0284C7', fontWeight: fontWeights.bold, fontFamily: systemFont }}>{activeTossWinnerName} won & elected to {activeTossDecisionText}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: 12, color: '#64748B', fontWeight: fontWeights.bold, fontFamily: systemFont }}>Venue</Text>
                            <Text style={{ fontSize: 12, color: '#0F172A', fontWeight: fontWeights.bold, fontFamily: systemFont }}>Town Oval Ground, Sector 12</Text>
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: 12, color: '#64748B', fontWeight: fontWeights.bold, fontFamily: systemFont }}>Umpires</Text>
                            <Text style={{ fontSize: 12, color: '#0F172A', fontWeight: fontWeights.bold, fontFamily: systemFont }}>K. Ananthapadmanabhan, Nitin Menon</Text>
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: 12, color: '#64748B', fontWeight: fontWeights.bold, fontFamily: systemFont }}>Pitch & Weather</Text>
                            <Text style={{ fontSize: 12, color: '#166534', fontWeight: fontWeights.bold, fontFamily: systemFont }}>31 C Clear - Good Batting Deck</Text>
                          </View>
                        </View>
                      </View>

                      {/* ANNOUNCED PLAYING XI SQUADS DROPDOWN (ONLY SHOWS IF TEAM PLAYING SELECTION EXISTS) */}
                      {((team1Roster && team1Roster.length > 0) || (team2Roster && team2Roster.length > 0)) && (
                        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', gap: 10 }}>
                          <TouchableOpacity
                            onPress={() => setIsInfoSquadsExpanded(!isInfoSquadsExpanded)}
                            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <Ionicons name="people" size={18} color="#0284C7" />
                              <Text style={{ fontSize: typeScale.name, fontWeight: fontWeights.bold, color: '#0F172A', fontFamily: systemFont }}>Announced Playing XI Squads</Text>
                            </View>
                            <Ionicons name={isInfoSquadsExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#64748B" />
                          </TouchableOpacity>

                          {isInfoSquadsExpanded && (
                            <View style={{ gap: 12, marginTop: 6 }}>
                              {/* Team 1 XI */}
                              {team1Roster && team1Roster.length > 0 && (
                                <View style={{ backgroundColor: '#F0F9FF', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#BAE6FD', gap: 6 }}>
                                  <Text style={{ fontSize: typeScale.body, fontWeight: fontWeights.bold, color: '#0284C7', fontFamily: systemFont }}>{team1Name} Playing XI ({team1Roster.length})</Text>
                                  {team1Roster.map((p, idx) => (
                                    <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3 }}>
                                      <Text style={{ fontSize: 12, fontWeight: fontWeights.bold, color: '#0F172A', fontFamily: systemFont }}>{idx + 1}. {p}</Text>
                                      <Text style={{ fontSize: 10, fontWeight: fontWeights.bold, color: idx === 0 ? '#B45309' : idx < 4 ? '#0284C7' : '#64748B', fontFamily: systemFont }}>
                                        {idx === 0 ? 'WK' : idx < 4 ? 'Batter' : idx < 7 ? 'Allrounder' : 'Bowler'}
                                      </Text>
                                    </View>
                                  ))}
                                </View>
                              )}

                              {/* Team 2 XI */}
                              {team2Roster && team2Roster.length > 0 && (
                                <View style={{ backgroundColor: '#FFF1F2', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#FECDD3', gap: 6 }}>
                                  <Text style={{ fontSize: typeScale.body, fontWeight: fontWeights.bold, color: '#E11D48', fontFamily: systemFont }}>{team2Name} Playing XI ({team2Roster.length})</Text>
                                  {team2Roster.map((p, idx) => (
                                    <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3 }}>
                                      <Text style={{ fontSize: 12, fontWeight: fontWeights.bold, color: '#0F172A', fontFamily: systemFont }}>{idx + 1}. {p}</Text>
                                      <Text style={{ fontSize: 10, fontWeight: fontWeights.bold, color: idx === 0 ? '#B45309' : idx < 4 ? '#0284C7' : '#E11D48', fontFamily: systemFont }}>
                                        {idx === 0 ? 'Capt (C)' : idx < 4 ? 'Batter' : idx < 7 ? 'Allrounder' : 'Bowler'}
                                      </Text>
                                    </View>
                                  ))}
                                </View>
                              )}
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  )}

                </ScrollView>
              </View>
            );
          })}
        </Animated.ScrollView>
      </View>
    );
  };

  // FULL SCREEN FINISHED MATCH SCORECARD VIEW (MATCHING LIVE VIEW LAYOUT EXACTLY)
  // FULL SCREEN FINISHED MATCH SCORECARD VIEW (MATCHING CREX EXACT SCREENSHOT 2)
  const [finishedTab, setFinishedTab] = useState('summary');
  const [finishedInningIndex, setFinishedInningIndex] = useState(0);

  const renderFinishedView = () => {
    const f = selectedMatch || finishedMatches[0];
    if (!f) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#F8FAFC' }}>
          <Ionicons name="checkmark-done-outline" size={34} color="#94A3B8" />
          <Text style={{ color: '#0F172A', fontSize: typeScale.pageTitle, fontWeight: fontWeights.bold, marginTop: 10, fontFamily: systemFont }}>No finished match</Text>
          <TouchableOpacity onPress={() => setCurrentScreen('home')} style={{ minHeight: 42, marginTop: 14, paddingHorizontal: 18, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0284C7' }}>
            <Text style={{ color: '#FFFFFF', fontSize: typeScale.body, fontWeight: fontWeights.bold, fontFamily: systemFont }}>BACK TO HOME</Text>
          </TouchableOpacity>
        </View>
      );
    }
    const finishedLiveMatch = buildFinishedLiveSnapshot(f);
    const viewTeam = (finishedInningIndex === 0 ? finishedLiveMatch.team1 : finishedLiveMatch.team2) || {
      name: 'Team',
      score: '0-0',
      batting: [],
      bowling: [],
      overHistory: [],
      fallOfWickets: [],
      partnerships: []
    };
    const opponentTeam = (finishedInningIndex === 0 ? finishedLiveMatch.team2 : finishedLiveMatch.team1) || {};
    const finishedBowlingRows = (opponentTeam?.bowling?.length ? opponentTeam.bowling : viewTeam?.bowling) || [];
    const finishedBattingRows = (viewTeam.batting || []).filter(player => player.dismissal !== 'Did not bat');
    const finishedDeclaredRoster = finishedLiveMatch.playingXI?.[viewTeam.name]
      || f.sourceMatch?.playingXI?.[viewTeam.name]
      || (viewTeam.batting || []).map(player => player.name);
    const finishedPendingBatters = getUnplayedBatters(finishedDeclaredRoster, finishedBattingRows);
    const finishedSelectedMatch = {
      ...finishedLiveMatch,
      inning: Math.max(1, Math.min(finishedLiveMatch.innings?.length || 1, finishedInningIndex + 1))
    };
    const finishedSelectedInning = finishedSelectedMatch.innings?.[finishedSelectedMatch.inning - 1];
    const finishedOverHistory = finishedSelectedInning ? getDisplayOverHistory(finishedSelectedInning) : (viewTeam.overHistory || []);
    const finishedMaxOverRuns = Math.max(12, ...finishedOverHistory.map(over => over.runs || 0));
    const keepFinishedTabVisible = (tabIndex, animated = true) => {
      const tab = FINISHED_MATCH_TABS[tabIndex];
      const layout = tab ? publicTabLayouts[`finished:${tab.id}`] : null;
      if (!layout) return;
      publicTabsRef.current?.scrollTo({
        x: Math.max(0, layout.x + (layout.width / 2) - (screenWidth / 2)),
        animated
      });
    };
    const changeFinishedTab = (nextTabId, movePager = true) => {
      const nextIndex = FINISHED_MATCH_TABS.findIndex(tab => tab.id === nextTabId);
      if (nextIndex < 0) return;
      setFinishedTab(nextTabId);
      keepFinishedTabVisible(nextIndex);
      if (movePager) finishedSwipeRef.current?.scrollTo({ x: nextIndex * screenWidth, animated: true });
    };
    const handleFinishedPagerEnd = (event) => {
      const nextIndex = Math.max(0, Math.min(
        FINISHED_MATCH_TABS.length - 1,
        Math.round(event.nativeEvent.contentOffset.x / screenWidth)
      ));
      const nextTab = FINISHED_MATCH_TABS[nextIndex];
      if (!nextTab) return;
      keepFinishedTabVisible(nextIndex);
      if (nextTab.id !== finishedTab) setFinishedTab(nextTab.id);
    };

    return (
      <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        {/* Top Bar Header */}
        <View style={{ backgroundColor: '#071B2C', paddingHorizontal: 14, paddingTop: 12, borderBottomWidth: 1, borderBottomColor: '#123A56' }}>
          <TouchableOpacity onPress={() => setCurrentScreen('home')} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name="arrow-back" size={20} color="#E0F2FE" />
            <Text style={{ flex: 1, color: '#FFFFFF', fontSize: typeScale.pageTitle, fontWeight: fontWeights.bold, fontFamily: systemFont }} numberOfLines={1}>{f.title}</Text>
          </TouchableOpacity>

          <MatchTabBar
            tabs={FINISHED_MATCH_TABS}
            activeTab={finishedTab}
            layouts={publicTabLayouts}
            layoutPrefix="finished:"
            pageWidth={screenWidth}
            scrollX={publicPagerScrollX}
            scrollRef={publicTabsRef}
            onPress={changeFinishedTab}
            onTabLayout={capturePublicTabLayout}
            tone="dark"
          />
        </View>

        <MatchResultHero
          teamOne={f.team1}
          teamTwo={f.team2}
          winnerTeamName={f.winnerTeamName}
          resultText={f.winner}
        />

        <Animated.ScrollView
          ref={finishedSwipeRef}
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
          onMomentumScrollEnd={handleFinishedPagerEnd}
          onLayout={() => {
            const activeIndex = Math.max(0, FINISHED_MATCH_TABS.findIndex(tab => tab.id === finishedTab));
            const offset = activeIndex * screenWidth;
            finishedSwipeRef.current?.scrollTo({ x: offset, animated: false });
            publicPagerScrollX.setValue(offset);
            keepFinishedTabVisible(activeIndex, false);
          }}
          style={{ flex: 1 }}
        >
          {FINISHED_MATCH_TABS.map(({ id: pageTabId }) => (
            <View key={pageTabId} style={{ width: screenWidth, flex: 1 }}>
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 14, paddingBottom: 24, gap: 14 }}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              >
                {/* TAB: SUMMARY */}
                {pageTabId === 'summary' && (
                  <FinishedMatchSummary match={f} onRematch={handleRematch} />
                )}

                {/* TAB 1: SCORECARD TAB */}
                {pageTabId === 'scorecard' && (
                  <View style={{ gap: 14 }}>
                    {/* Inning Switcher Pills */}
                    <View style={{ flexDirection: 'row', gap: 8, padding: 14, backgroundColor: '#F4F6F8', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
                      {[f.team1, f.team2].map((tObj, idx) => {
                        const hasScore = tObj.score && tObj.score !== 'Yet to bat';
                        return (
                          <InningTeamTab
                            key={idx}
                            name={tObj.name}
                            selected={finishedInningIndex === idx}
                            statusText={hasScore ? '' : 'Yet to bat'}
                            onPress={() => setFinishedInningIndex(idx)}
                          />
                        );
                      })}
                    </View>

                    {/* BATTING TABLE */}
                    <View style={{ backgroundColor: '#FFFFFF', overflow: 'hidden', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
                      <View style={{ minHeight: 50, backgroundColor: '#FFFFFF', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Text style={{ color: '#1477A8', fontSize: typeScale.body, fontWeight: fontWeights.bold, fontFamily: systemFont }}>BATTER</Text>
                          <Ionicons name="arrow-down" size={13} color="#1477A8" />
                        </View>
                        <Text style={{ color: '#7C8793', fontSize: 12, fontWeight: fontWeights.bold, width: 34, textAlign: 'right', fontFamily: systemFont }}>R</Text>
                        <Text style={{ color: '#7C8793', fontSize: 12, fontWeight: fontWeights.bold, width: 30, textAlign: 'right', fontFamily: systemFont }}>B</Text>
                        <Text style={{ color: '#7C8793', fontSize: 12, fontWeight: fontWeights.bold, width: 32, textAlign: 'right', fontFamily: systemFont }}>4s</Text>
                        <Text style={{ color: '#7C8793', fontSize: 12, fontWeight: fontWeights.bold, width: 32, textAlign: 'right', fontFamily: systemFont }}>6s</Text>
                        <Text style={{ color: '#7C8793', fontSize: 12, fontWeight: fontWeights.bold, width: 58, textAlign: 'right', fontFamily: systemFont }}>SR</Text>
                      </View>

                      {finishedBattingRows.map((b, bi) => (
                        <View key={bi} style={{ minHeight: 58, paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: bi > 0 ? 1 : 0, borderTopColor: '#E8ECEF' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text selectable {...nameFitProps} style={{ flex: 1, minWidth: 0, color: '#111827', fontWeight: fontWeights.bold, fontSize: typeScale.name, fontFamily: systemFont }}>{b.name}</Text>
                            <Text selectable style={{ color: '#0F172A', fontWeight: fontWeights.bold, fontSize: typeScale.name, width: 34, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFont }}>{b.runs}</Text>
                            <Text selectable style={{ color: '#64748B', fontWeight: fontWeights.bold, fontSize: 12, width: 30, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFont }}>{b.balls}</Text>
                            <Text selectable style={{ color: '#64748B', fontWeight: fontWeights.bold, fontSize: 12, width: 32, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFont }}>{b.fours}</Text>
                            <Text selectable style={{ color: '#64748B', fontWeight: fontWeights.bold, fontSize: 12, width: 32, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFont }}>{b.sixes}</Text>
                            <Text selectable style={{ color: '#0284C7', fontWeight: fontWeights.bold, fontSize: typeScale.label, width: 58, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFont }}>{b.sr || '0.0'}</Text>
                          </View>
                          <Text style={{ color: b.dismissal === 'Not out' ? '#0284C7' : '#64748B', fontSize: 10, fontWeight: fontWeights.bold, marginTop: 3, fontFamily: systemFont }} numberOfLines={1}>{b.dismissal}</Text>
                        </View>
                      ))}
                      <PendingBattersSection title="DID NOT BAT" players={finishedPendingBatters} />
                    </View>

                    {/* BOWLING TABLE */}
                    {viewTeam.bowling && (
                      <View style={{ marginTop: 14, backgroundColor: '#FFFFFF', overflow: 'hidden', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E2E8F0' }}>
                        <View style={{ minHeight: 48, backgroundColor: '#F7F9FA', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
                          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Text style={{ color: '#1477A8', fontSize: typeScale.body, fontWeight: fontWeights.bold, fontFamily: systemFont }}>BOWLER</Text>
                            <Ionicons name="arrow-down" size={13} color="#1477A8" />
                          </View>
                          <Text style={{ color: '#7C8793', fontSize: 11, fontWeight: fontWeights.bold, width: 34, textAlign: 'right', fontFamily: systemFont }}>O</Text>
                          <Text style={{ color: '#7C8793', fontSize: 11, fontWeight: fontWeights.bold, width: 30, textAlign: 'right', fontFamily: systemFont }}>M</Text>
                          <Text style={{ color: '#7C8793', fontSize: 11, fontWeight: fontWeights.bold, width: 34, textAlign: 'right', fontFamily: systemFont }}>R</Text>
                          <Text style={{ color: '#7C8793', fontSize: 11, fontWeight: fontWeights.bold, width: 32, textAlign: 'right', fontFamily: systemFont }}>W</Text>
                          <Text style={{ color: '#7C8793', fontSize: 11, fontWeight: fontWeights.bold, width: 50, textAlign: 'right', fontFamily: systemFont }}>ECO</Text>
                        </View>
                        {viewTeam.bowling.map((bw, bwi) => (
                          <View key={bwi} style={{ minHeight: 50, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderTopWidth: bwi > 0 ? 1 : 0, borderTopColor: '#E8ECEF' }}>
                            <Text selectable {...nameFitProps} style={{ flex: 1, minWidth: 0, color: '#111827', fontWeight: fontWeights.bold, fontSize: typeScale.name, fontFamily: systemFont }}>{bw.name}</Text>
                            <Text selectable style={{ color: '#4B5563', fontWeight: fontWeights.bold, fontSize: 12, width: 34, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFont }}>{bw.overs}</Text>
                            <Text selectable style={{ color: '#4B5563', fontWeight: fontWeights.bold, fontSize: 12, width: 30, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFont }}>0</Text>
                            <Text selectable style={{ color: '#4B5563', fontWeight: fontWeights.bold, fontSize: 12, width: 34, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFont }}>{bw.runs}</Text>
                            <Text selectable style={{ color: '#111827', fontWeight: fontWeights.bold, fontSize: typeScale.name, width: 32, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFont }}>{bw.wickets}</Text>
                            <Text selectable style={{ color: '#1477A8', fontWeight: fontWeights.bold, fontSize: typeScale.body, width: 50, textAlign: 'right', fontVariant: ['tabular-nums'], fontFamily: systemFont }}>{bw.econ || '0.00'}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    {/* FALL OF WICKETS */}
                    <View style={{ marginTop: 14, backgroundColor: '#FFFFFF', overflow: 'hidden', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E2E8F0' }}>
                      <View style={{ minHeight: 46, backgroundColor: '#F7F9FA', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ color: '#64748B', fontSize: typeScale.label, fontWeight: fontWeights.bold, fontFamily: systemFont }}>FALL OF WICKETS</Text>
                        <Text style={{ color: '#64748B', fontSize: typeScale.label, fontWeight: fontWeights.bold, fontFamily: systemFont }}>Score - Over</Text>
                      </View>
                      {viewTeam.fallOfWickets.map((fw, fwi) => (
                        <View key={fwi} style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: '#E8ECEF' }}>
                          <Text selectable style={{ flex: 1, color: '#0F172A', fontWeight: fontWeights.bold, fontSize: typeScale.body, fontFamily: systemFont }} numberOfLines={1}>{fw.dismissedName || 'Wicket'}</Text>
                          <Text selectable style={{ color: '#64748B', fontWeight: fontWeights.bold, fontSize: 12, fontVariant: ['tabular-nums'], fontFamily: systemFont }}>{fw.score}{fw.over ? `  (${fw.over} ov)` : ''}</Text>
                        </View>
                      ))}
                      {viewTeam.fallOfWickets.length === 0 ? <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: fontWeights.bold, padding: 14, textAlign: 'center', fontFamily: systemFont }}>No wicket</Text> : null}
                    </View>

                    {/* PARTNERSHIPS */}
                    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' }}>
                      <View style={{ minHeight: 46, backgroundColor: '#F7F9FA', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ color: '#64748B', fontSize: typeScale.label, fontWeight: fontWeights.bold, fontFamily: systemFont }}>INNING PARTNERSHIPS</Text>
                      </View>
                      {viewTeam.partnerships.map((item, idx) => (
                        <View key={idx} style={{ paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#E8ECEF' }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                            <Text style={{ fontSize: typeScale.label, fontWeight: fontWeights.bold, color: '#0284C7', fontFamily: systemFont }}>{item.wkt}</Text>
                            <Text style={{ fontSize: typeScale.body, fontWeight: fontWeights.bold, color: '#0F172A', fontFamily: systemFont }}>{item.totalRuns} runs ({item.totalBalls}b)</Text>
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                            <Text selectable style={{ flex: 1, fontSize: 11, fontWeight: fontWeights.bold, color: '#0F172A', fontFamily: systemFont }} numberOfLines={1}>{item.p1} <Text style={{ color: '#64748B', fontWeight: fontWeights.semibold, fontFamily: systemFont }}>({item.r1 || 0})</Text></Text>
                            <Text selectable style={{ flex: 1, fontSize: 11, fontWeight: fontWeights.bold, color: '#0F172A', textAlign: 'right', fontFamily: systemFont }} numberOfLines={1}>{item.p2} <Text style={{ color: '#64748B', fontWeight: fontWeights.semibold, fontFamily: systemFont }}>({item.r2 || 0})</Text></Text>
                          </View>
                        </View>
                      ))}
                      {viewTeam.partnerships.length === 0 ? <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: fontWeights.bold, padding: 14, textAlign: 'center', fontFamily: systemFont }}>No partnership data</Text> : null}
                    </View>
                  </View>
                )}

                {/* TAB 2: WORM & MANHATTAN GRAPHS */}
                {pageTabId === 'graphs' && (
                  <View style={{ gap: 14 }}>
                    <WormGraph
                      match={f.sourceMatch || f}
                      team1Inning={f.sourceMatch?.innings?.[0]}
                      team2Inning={f.sourceMatch?.innings?.[1]}
                    />
                    <ManhattanGraph
                      match={f.sourceMatch || f}
                      team1Inning={f.sourceMatch?.innings?.[0]}
                      team2Inning={f.sourceMatch?.innings?.[1]}
                    />
                  </View>
                )}

                {/* TAB 3: OVERS BREAKDOWN */}
                {pageTabId === 'overs' && (
                  <View style={{ gap: 8 }}>
                    {finishedOverHistory.length === 0 ? (
                      <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: fontWeights.bold, textAlign: 'center', paddingVertical: 30, fontFamily: systemFont }}>
                        No overs completed yet.
                      </Text>
                    ) : (
                      finishedOverHistory.map((o, idx) => (
                        <View key={`${viewTeam.name}-${o.overNum}-${idx}`} style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <Text style={{ color: '#0284C7', fontSize: typeScale.body, fontWeight: fontWeights.bold, fontFamily: systemFont }}>Over {o.overNum} - {o.bowlerName}</Text>
                            <Text style={{ color: '#B45309', fontSize: typeScale.body, fontWeight: fontWeights.bold, fontFamily: systemFont }}>{o.runs} Runs {o.wickets > 0 ? `- ${o.wickets} W` : ''}</Text>
                          </View>
                          <View style={{ minHeight: 26 }}>
                            {renderBallTimeline(o.balls, { size: 26, emptyText: 'No balls', contentPaddingRight: 4 })}
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                )}

                {/* TAB: INFO TAB */}
                {pageTabId === 'info' && (
                  <MatchInfoPanel
                    rows={[
                      { icon: 'trophy-outline', label: 'Match', value: f.title || `${f.team1?.name || 'Team 1'} vs ${f.team2?.name || 'Team 2'}` },
                      { icon: 'calendar-outline', label: 'Date & time', value: f.date || formatMatchDateTime(f.completedAt || f.startedAt || f.date) },
                      { icon: 'swap-horizontal-outline', label: 'Toss', value: f.tossResult || (f.tossWinner ? `${f.tossWinner} won the toss and elected to ${(f.tossDecision || 'bat').toUpperCase()}` : `${f.team1?.name || 'Team 1'} won the toss and elected to BAT`), emphasis: true },
                      { icon: 'location-outline', label: 'Venue', value: (f.venue && f.venue !== 'Venue not added') ? f.venue : 'Local Ground' },
                      { icon: 'person-outline', label: 'Umpire', value: f.umpireName || 'Cric Scorer' },
                      { icon: 'partly-sunny-outline', label: 'Conditions', value: f.conditions || (weatherData ? `${weatherData.temp} C, ${weatherData.condition}` : '27 C, Humid & Overcast') },
                      { icon: 'checkmark-done-outline', label: 'Result', value: f.winner || f.resultText, emphasis: true, accent: true }
                    ]}
                    teamOneName={f.team1?.name || 'Team 1'}
                    teamTwoName={f.team2?.name || 'Team 2'}
                    playerCount={(f.team1?.batting?.length || 0) + (f.team2?.batting?.length || 0) || (f.sourceMatch?.playingXI ? Object.values(f.sourceMatch.playingXI).flat().length : 4)}
                    onOpenPlayingXi={() => {
                      setPlayingXiTeamTab(1);
                      playingXiPagerScrollX.setValue(0);
                      setPlayingXiVisible(true);
                    }}
                  />
                )}

                {false && pageTabId === 'info' && (
                  <View style={{ gap: 14 }}>
                    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', gap: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="information-circle" size={18} color="#0284C7" />
                        <Text style={{ fontSize: 14, fontWeight: fontWeights.bold, color: '#0F172A', fontFamily: systemFont }}>MATCH INFORMATION</Text>
                      </View>

                      <View style={{ gap: 10 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 12, color: '#64748B', fontWeight: fontWeights.bold, fontFamily: systemFont }}>Match</Text>
                          <Text style={{ fontSize: 12, color: '#0F172A', fontWeight: fontWeights.bold, fontFamily: systemFont }}>{f.title}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 12, color: '#64748B', fontWeight: fontWeights.bold, fontFamily: systemFont }}>Result</Text>
                          <Text style={{ flex: 1, marginLeft: 16, textAlign: 'right', fontSize: 12, color: '#0F172A', fontWeight: fontWeights.bold, fontFamily: systemFont }}>{f.winner}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 12, color: '#64748B', fontWeight: fontWeights.bold, fontFamily: systemFont }}>Top scorer</Text>
                          <Text style={{ fontSize: 12, color: '#0F172A', fontWeight: fontWeights.bold, fontFamily: systemFont }}>{f.topScorer ? `${f.topScorer.name} - ${f.topScorer.runs} (${f.topScorer.balls})` : '-'}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 12, color: '#64748B', fontWeight: fontWeights.bold, fontFamily: systemFont }}>Venue</Text>
                          <Text style={{ fontSize: 12, color: '#0F172A', fontWeight: fontWeights.bold, fontFamily: systemFont }}>{f.venue}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 12, color: '#64748B', fontWeight: fontWeights.bold, fontFamily: systemFont }}>Date</Text>
                          <Text style={{ fontSize: 12, color: '#0F172A', fontWeight: fontWeights.bold, fontFamily: systemFont }}>{f.date}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 12, color: '#64748B', fontWeight: fontWeights.bold, fontFamily: systemFont }}>Umpire</Text>
                          <Text style={{ fontSize: 12, color: '#0F172A', fontWeight: fontWeights.bold, fontFamily: systemFont }}>{f.umpireName}</Text>
                        </View>
                      </View>
                    </View>

                    {/* PLAYING XI SQUADS ACCORDION */}
                    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', gap: 10 }}>
                      <TouchableOpacity
                        onPress={() => setIsInfoSquadsExpanded(!isInfoSquadsExpanded)}
                        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Ionicons name="people" size={18} color="#0284C7" />
                          <Text style={{ fontSize: 14, fontWeight: fontWeights.bold, color: '#0F172A', fontFamily: systemFont }}>Announced Playing XI Squads</Text>
                        </View>
                        <Ionicons name={isInfoSquadsExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#64748B" />
                      </TouchableOpacity>

                      {isInfoSquadsExpanded && (
                        <View style={{ gap: 12, marginTop: 6 }}>
                          <View style={{ borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
                            <Text style={{ paddingVertical: 9, fontSize: 12, fontWeight: fontWeights.bold, color: '#0F172A', fontFamily: systemFont }}>{f.team1.name} Playing XI ({f.team1.batting.length})</Text>
                            {f.team1.batting.map((p, idx) => (
                              <View key={idx} style={{ minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 9, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
                                <Text style={{ width: 20, fontSize: 10, fontWeight: fontWeights.bold, color: '#94A3B8', fontFamily: systemFont }}>{idx + 1}</Text>
                                <Text style={{ flex: 1, fontSize: 12, fontWeight: fontWeights.bold, color: '#0F172A', fontFamily: systemFont }}>{p.name}</Text>
                              </View>
                            ))}
                          </View>

                          <View style={{ borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
                            <Text style={{ paddingVertical: 9, fontSize: 12, fontWeight: fontWeights.bold, color: '#0F172A', fontFamily: systemFont }}>{f.team2.name} Playing XI ({f.team2.batting.length})</Text>
                            {f.team2.batting.map((p, idx) => (
                              <View key={idx} style={{ minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 9, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
                                <Text style={{ width: 20, fontSize: 10, fontWeight: fontWeights.bold, color: '#94A3B8', fontFamily: systemFont }}>{idx + 1}</Text>
                                <Text style={{ flex: 1, fontSize: 12, fontWeight: fontWeights.bold, color: '#0F172A', fontFamily: systemFont }}>{p.name}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                )}

              </ScrollView>
            </View>
          ))}
        </Animated.ScrollView>
      </View>
    );
  };

  const renderScorerConsole = () => {
    const inn = activeMatch?.innings?.[activeMatch.inning - 1];
    if (!inn?.battingTeam || !inn?.bowlingTeam || !inn?.striker || !inn?.nonStriker || !inn?.bowler) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#F8FAFC' }}>
          <Ionicons name="alert-circle-outline" size={32} color="#E11D48" />
          <Text style={{ color: '#0F172A', fontSize: 16, fontWeight: fontWeights.bold, marginTop: 10, textAlign: 'center', fontFamily: systemFont }}>
            Match setup did not finish correctly
          </Text>
          <Text style={{ color: '#64748B', fontSize: 12, fontWeight: fontWeights.semibold, marginTop: 6, textAlign: 'center', fontFamily: systemFont }}>
            Select striker, non-striker, and opening bowler again.
          </Text>
          <TouchableOpacity
            onPress={() => {
              setActiveMatch(null);
              setWizardStep(3);
            }}
            style={{ minHeight: 42, marginTop: 16, paddingHorizontal: 18, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0284C7' }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: fontWeights.bold, fontFamily: systemFont }}>FIX OPENERS</Text>
          </TouchableOpacity>
        </View>
      );
    }
    const mw = getBattingRoster().length - 1;
    const inn2 = activeMatch.inning === 2;
    const reqRuns = inn2 && activeMatch.target ? activeMatch.target - inn.battingTeam.runs : null;
    const reqBalls = inn2 ? Math.max(0, (activeMatch.maxOvers * 6) - inn.totalLegalBalls) : null;
    const scorerBowlerEconomy = inn.bowlerLegalBalls > 0
      ? ((inn.bowler.runs / inn.bowlerLegalBalls) * 6).toFixed(1)
      : '0.0';
    const scorerCurrentOverBalls = inn.currentOverBalls || [];
    const scorerCurrentOverRuns = sumDeliveryTokens(scorerCurrentOverBalls);
    const scorerCurrentOverNum = getCurrentOverNumber(inn);

    return (
      <View style={{ flex: 1, backgroundColor: '#EBF0F5' }}>
        {/* SPACIOUS DARK CREX SCORE HERO */}
        <View style={{ backgroundColor: '#071B2C', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: '#123A56', gap: 10, alignItems: 'center' }}>
          {/* Big Score Center Row (No Brackets, Thin | Line Separator) */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <Text style={{ fontSize: 46, lineHeight: 50, color: '#FFFFFF', fontFamily: systemFontBold }}>{inn.battingTeam.runs}-{inn.battingTeam.wickets}</Text>
            <View style={{ width: 1.5, height: 28, backgroundColor: '#1E4D6B', borderRadius: 1 }} />
            <Text style={{ fontSize: 20, color: '#9FC4D7', fontFamily: systemFontMedium }}>{formatOvers(inn.totalLegalBalls)} Ov</Text>
          </View>

          {/* Clean Inning & Batting Info Line (Direct Text, No Extra Background Patch) */}
          <Text style={{ color: '#9FC4D7', fontSize: 12, fontFamily: systemFontMedium }}>
            Inning {activeMatch.inning}st • {inn.battingTeam.name} Batting
          </Text>
        </View>

        <ScrollView style={{ flex: 1, backgroundColor: '#EBF0F5' }} contentContainerStyle={{ padding: 10, gap: 10, paddingBottom: 16 }} showsVerticalScrollIndicator={false}>

          {/* ELEGANT OFF-WHITE DELIVERY TIMELINE CARD */}
          <View style={{ backgroundColor: '#F4F7FA', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#CBD5E1', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <View style={{ backgroundColor: '#E2E8F0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#CBD5E1' }}>
              <Text style={{ color: '#0F172A', fontSize: 11, fontFamily: systemFontBold }}>
                OVER {scorerCurrentOverNum}
              </Text>
            </View>

            <View style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
              {renderBallTimeline(scorerCurrentOverBalls, { size: 26, emptyText: 'Over starting...', contentPaddingRight: 4 })}
            </View>

            <Text style={{ color: '#0284C7', fontSize: 13, fontVariant: ['tabular-nums'], fontFamily: systemFontBold }}>
              {scorerCurrentOverRuns} RUNS
            </Text>
          </View>

          {inn2 && activeMatch.target ? (
            <View style={{ flexDirection: 'row', backgroundColor: '#F4F7FA', borderRadius: 12, borderWidth: 1, borderColor: '#CBD5E1', overflow: 'hidden' }}>
              {[
                ['TARGET', activeMatch.target],
                ['NEED', Math.max(0, reqRuns)],
                ['BALLS', reqBalls]
              ].map(([label, value], index) => (
                <View
                  key={label}
                  style={{ flex: 1, alignItems: 'center', paddingVertical: 8, borderLeftWidth: index > 0 ? 1 : 0, borderLeftColor: '#CBD5E1' }}
                >
                  <Text style={{ color: '#94A3B8', fontSize: 9, fontFamily: systemFontBold }}>{label}</Text>
                  <Text style={{ color: label === 'NEED' ? '#0284C7' : '#0F172A', fontSize: 14, marginTop: 1, fontVariant: ['tabular-nums'], fontFamily: systemFontBold }}>
                    {value}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* INTEGRATED GRID ACTIVE PLAYERS CARD (NAMES FIXED IN ROW, HIGHLIGHT COLOR SHIFTS ON STRIKE ROTATION) */}
          {(() => {
            const s = inn.striker || { name: 'Striker', runs: 0, balls: 0 };
            const ns = inn.nonStriker || { name: 'Non-Striker', runs: 0, balls: 0 };
            // Determine fixed Row 1 and Row 2 batters
            const pinnedRow1 = inn.row1Name || s.name;
            const row1Batter = (pinnedRow1 === ns?.name) ? ns : s;
            const row2Batter = (row1Batter?.name === s?.name) ? ns : s;

            const isRow1Striker = row1Batter?.name === s?.name;
            const isRow2Striker = row2Batter?.name === s?.name;
            const canSwapOpeningStrike = inn.totalLegalBalls === 0
              && (inn.currentOverBalls || []).length === 0
              && (inn.overHistory || []).length === 0;

            return (
              <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden' }}>
                {/* Header Row */}
                <View style={{ backgroundColor: '#F8FAFC', paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 34 }}>
                  <Text style={{ fontSize: 11, color: '#64748B', letterSpacing: 0.5, fontFamily: systemFontBold }}>ON PITCH PLAYERS</Text>
                  <Text style={{ fontSize: 11, color: '#94A3B8', fontFamily: systemFontMedium }}>LIVE STATS</Text>
                </View>

                {/* Row 1 Batter (Fixed Position 1) */}
                {row1Batter && (
                  <View style={{ height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: isRow1Striker ? '#F0F9FF' : '#FFFFFF' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                      <View style={{ width: 18, alignItems: 'center' }}>
                        {isRow1Striker ? <MaterialCommunityIcons name="cricket" size={18} color="#0284C7" /> : null}
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ fontSize: 14, color: isRow1Striker ? '#0F172A' : '#475569', fontFamily: isRow1Striker ? systemFontBold : systemFontMedium }} numberOfLines={1}>
                            {row1Batter.name}
                          </Text>
                          {isRow1Striker ? (
                            <TouchableOpacity
                              onPress={handleRetireBatsman}
                              style={{ backgroundColor: '#FFFBEB', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, borderWidth: 1, borderColor: '#FDE68A' }}
                            >
                              <Text style={{ color: '#B45309', fontSize: 9, fontFamily: systemFontBold }}>Retire</Text>
                            </TouchableOpacity>
                          ) : null}
                        </View>
                      </View>
                    </View>
                    <Text style={{ fontSize: isRow1Striker ? 16 : 15, color: isRow1Striker ? '#0284C7' : '#475569', fontFamily: isRow1Striker ? systemFontBold : systemFontMedium }}>
                      {row1Batter.runs}<Text style={{ fontSize: 12, color: '#64748B', fontFamily: systemFont }}> ({row1Batter.balls})</Text>
                    </Text>
                  </View>
                )}

                {row1Batter?.name && row2Batter?.name && canSwapOpeningStrike ? (
                  <View style={{ height: 36, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#F8FAFC' }}>
                    <TouchableOpacity onPress={handleSwapStrike} style={{ minHeight: 36, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <Ionicons name="swap-vertical" size={16} color="#0284C7" />
                      <Text style={{ color: '#0284C7', fontSize: 10, fontFamily: systemFontBold }}>SWAP STRIKE</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                {/* Row 2 Batter (Fixed Position 2) */}
                {row2Batter && (
                  <View style={{ height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: isRow2Striker ? '#F0F9FF' : '#FFFFFF' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                      <View style={{ width: 18, alignItems: 'center' }}>
                        {isRow2Striker ? <MaterialCommunityIcons name="cricket" size={18} color="#0284C7" /> : null}
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ fontSize: 14, color: isRow2Striker ? '#0F172A' : '#475569', fontFamily: isRow2Striker ? systemFontBold : systemFontMedium }} numberOfLines={1}>
                            {row2Batter.name}
                          </Text>
                          {isRow2Striker ? (
                            <TouchableOpacity
                              onPress={handleRetireBatsman}
                              style={{ backgroundColor: '#FFFBEB', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, borderWidth: 1, borderColor: '#FDE68A' }}
                            >
                              <Text style={{ color: '#B45309', fontSize: 9, fontFamily: systemFontBold }}>Retire</Text>
                            </TouchableOpacity>
                          ) : null}
                        </View>
                      </View>
                    </View>
                    <Text style={{ fontSize: isRow2Striker ? 16 : 15, color: isRow2Striker ? '#0284C7' : '#475569', fontFamily: isRow2Striker ? systemFontBold : systemFontMedium }}>
                      {row2Batter.runs}<Text style={{ fontSize: 12, color: '#64748B', fontFamily: systemFont }}> ({row2Batter.balls})</Text>
                    </Text>
                  </View>
                )}

                {/* Bowler Row */}
                {inn.bowler && (
                  <View style={{ height: 58, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0, paddingLeft: 14, paddingRight: 8 }}>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ fontSize: 14, color: '#334155', fontFamily: systemFontMedium }} numberOfLines={1}>{inn.bowler.name}</Text>
                          <MaterialCommunityIcons name="baseball" size={15} color="#0284C7" />
                          <TouchableOpacity
                            onPress={() => { setNextBowlerName(inn.bowler.name); setBowlerChangePending(true); }}
                            style={{ backgroundColor: '#FFFFFF', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, borderWidth: 1, borderColor: '#BAE6FD', marginLeft: 4 }}
                          >
                            <Text style={{ color: '#0284C7', fontSize: 9, fontFamily: systemFontBold }}>Change</Text>
                          </TouchableOpacity>
                        </View>
                        <Text style={{ fontSize: 10, color: '#64748B', fontFamily: systemFontMedium }}>Current Bowler</Text>
                      </View>
                    </View>
                    <View style={{ width: 148, alignSelf: 'stretch', flexDirection: 'row', borderLeftWidth: 1, borderLeftColor: '#E2E8F0' }}>
                      {[
                        ['O', inn.bowler.overs],
                        ['R', inn.bowler.runs],
                        ['W', inn.bowler.wickets],
                        ['ECO', scorerBowlerEconomy]
                      ].map(([label, value], index) => (
                        <View
                          key={label}
                          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', borderLeftWidth: index > 0 ? 1 : 0, borderLeftColor: '#E2E8F0' }}
                        >
                          <Text style={{ color: '#94A3B8', fontSize: 8, fontFamily: systemFontBold }}>{label}</Text>
                          <Text style={{ color: label === 'W' ? '#0284C7' : '#0F172A', fontSize: 12, marginTop: 2, fontVariant: ['tabular-nums'], fontFamily: systemFontBold }}>{value}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            );
          })()}

          {/* SINGLE INTEGRATED UNIFIED TOUCHPAD GRID (CONTAINS UNDO/REDO + KEYPAD) */}
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden' }}>

            {/* ROW 0: TOP ACTIONS (UNDO | EDIT SQUAD | REDO DIVIDED BY THIN LINES) */}
            <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#F8FAFC' }}>
              <TouchableOpacity
                onPress={handleUndo}
                style={{
                  flex: 1, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                  borderRightWidth: 1, borderRightColor: '#E2E8F0'
                }}
              >
                <Ionicons name="arrow-undo" size={15} color="#0F172A" />
                <Text style={{ color: '#0F172A', fontSize: 13, fontFamily: systemFontBold }}>UNDO</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIsEditSquadModalOpen(true)}
                style={{
                  flex: 1.2, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                  borderRightWidth: 1, borderRightColor: '#E2E8F0', backgroundColor: '#F0F9FF'
                }}
              >
                <Ionicons name="people-outline" size={16} color="#0284C7" />
                <Text style={{ color: '#0284C7', fontSize: 12, fontFamily: systemFontBold }}>EDIT SQUAD</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleRedo}
                style={{
                  flex: 1, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6
                }}
              >
                <Ionicons name="arrow-redo" size={15} color="#0F172A" />
                <Text style={{ color: '#0F172A', fontSize: 13, fontFamily: systemFontBold }}>REDO</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
              {[0, 1, 2, 3].map((n, idx) => (
                <TouchableOpacity
                  key={n}
                  style={{
                    flex: 1, paddingVertical: 14, alignItems: 'center', justifyContent: 'center',
                    borderRightWidth: idx < 3 ? 1 : 0, borderRightColor: '#E2E8F0'
                  }}
                  onPress={() => handleRecordBall(n)}
                >
                  <Text style={{ color: '#0F172A', fontSize: typeScale.keypad, fontFamily: systemFontBold }}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ROW 2: 4 FOUR, 6 SIX */}
            <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#E2E8F0', backgroundColor: '#F0F9FF' }}
                onPress={() => handleRecordBall(4)}
              >
                <Text style={{ color: '#0284C7', fontSize: typeScale.keyAction, fontFamily: systemFontBold }}>4 FOUR</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F3FF' }}
                onPress={() => handleRecordBall(6)}
              >
                <Text style={{ color: '#7C3AED', fontSize: typeScale.keyAction, fontFamily: systemFontBold }}>6 SIX</Text>
              </TouchableOpacity>
            </View>

            {/* ROW 3: WIDE, NO BALL, WICKET */}
            <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#E2E8F0', backgroundColor: '#FFFBEB' }}
                onPress={() => handleRecordBall(0, 'wd')}
              >
                <Text style={{ color: '#B45309', fontSize: 15, fontFamily: systemFontBold }}>WIDE</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#E2E8F0', backgroundColor: '#FFFBEB' }}
                onPress={() => handleRecordBall(0, 'nb')}
              >
                <Text style={{ color: '#B45309', fontSize: 15, fontFamily: systemFontBold }}>NO BALL</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF1F2' }}
                onPress={handleWicketPress}
              >
                <Text style={{ color: '#E11D48', fontSize: typeScale.keyAction, fontFamily: systemFontBold }}>WICKET</Text>
              </TouchableOpacity>
            </View>


            {/* ROW 4: ADVANCED EXTRAS */}
            <TouchableOpacity
              style={{ minHeight: 54, paddingVertical: 15, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, backgroundColor: '#F8FAFC' }}
              onPress={() => setExtrasSheetVisible(true)}
            >
              <Ionicons name="add-circle-outline" size={18} color="#0284C7" />
              <Text style={{ color: '#0284C7', fontSize: 14, fontFamily: systemFontBold }}>EXTRAS</Text>
              <Text style={{ color: '#64748B', fontSize: 11, fontFamily: systemFontMedium }}>wides, no-ball runs, byes, penalty</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => {
              setPublicLiveTab('live');
              setLiveViewReturnScreen('scorerWizard');
              setCurrentScreen('liveView');
            }}
            activeOpacity={0.85}
            style={{ minHeight: 50, borderRadius: 8, backgroundColor: '#0284C7', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <Ionicons name="radio-outline" size={18} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontFamily: systemFontBold }}>Live Public View</Text>
            <Ionicons name="chevron-forward" size={17} color="#FFFFFF" />
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  const renderInningBreak = () => {
    const inn1 = activeMatch.innings[0];
    const target = activeMatch.target;
    const firstInningTeamMeta = activeMatch.teams?.find(team => team.name === inn1.battingTeam.name) || {
      ...inn1.battingTeam,
      logoKey: 'default-team-1'
    };
    const bat2Roster = getRosterForTeam(inn1.bowlingTeam.name, []);
    const bowl2Roster = getRosterForTeam(inn1.battingTeam.name, []);
    const inningReady = inn2Striker && inn2NonStriker && inn2Bowler;

    return (
      <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
          <View style={{ backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#CBD5E1' }}>
            <View style={{ minHeight: 48, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F8FAFC' }}>
              <Ionicons name="pause-circle-outline" size={18} color="#0284C7" />
              <Text style={{ color: '#0F172A', fontSize: 13, fontWeight: fontWeights.bold, fontFamily: systemFont }}>INNINGS BREAK</Text>
            </View>
            <View style={{ paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TeamIdentityMark team={firstInningTeamMeta} size={48} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ color: '#64748B', fontSize: 11, fontWeight: fontWeights.bold, fontFamily: systemFont }} numberOfLines={1}>{inn1.battingTeam.name.toUpperCase()}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                  <Text selectable style={{ color: '#0F172A', fontSize: typeScale.score, lineHeight: 31, fontWeight: fontWeights.bold, fontVariant: ['tabular-nums'], fontFamily: systemFont }}>
                    {inn1.battingTeam.runs}-{inn1.battingTeam.wickets}
                  </Text>
                  <Text selectable style={{ color: '#64748B', fontSize: 13, fontWeight: fontWeights.semibold, fontVariant: ['tabular-nums'], fontFamily: systemFont }}>
                    {formatOvers(inn1.totalLegalBalls)} ({activeMatch.maxOvers})
                  </Text>
                </View>
              </View>
            </View>
            <View style={{ paddingHorizontal: 16, paddingVertical: 11, borderTopWidth: 1, borderTopColor: '#FDE68A', backgroundColor: '#FFFBEB' }}>
              <Text selectable style={{ color: '#92400E', fontSize: 13, fontWeight: fontWeights.bold, fontFamily: systemFont }}>
                {inn1.bowlingTeam.name} need {target} runs to win
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 12, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#CBD5E1' }}>
            <View style={{ minHeight: 48, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, backgroundColor: '#F8FAFC' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <MaterialCommunityIcons name="cricket" size={18} color="#0284C7" />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#0F172A', fontSize: 13, fontWeight: fontWeights.bold, fontFamily: systemFont }}>SELECT OPENERS</Text>
                  <Text style={{ color: '#64748B', fontSize: 10, fontWeight: fontWeights.bold, marginTop: 2, fontFamily: systemFont }} numberOfLines={1}>{inn1.bowlingTeam.name}</Text>
                </View>
              </View>
              <Text style={{ color: inn2NonStriker ? '#15803D' : '#64748B', fontSize: 11, fontWeight: fontWeights.bold, fontVariant: ['tabular-nums'], fontFamily: systemFont }}>
                {inn2Striker ? (inn2NonStriker ? '2/2' : '1/2') : '0/2'}
              </Text>
            </View>

            {bat2Roster.map((name, index) => {
              const selectedRole = name === inn2Striker ? 'STRIKER' : name === inn2NonStriker ? 'NON-STRIKER' : null;
              return (
                <TouchableOpacity
                  key={name}
                  onPress={() => handleSelectInning2Opener(name)}
                  style={{ minHeight: 56, paddingHorizontal: 16, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 11, borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: selectedRole ? '#F0F9FF' : '#FFFFFF' }}
                >
                  <Text style={{ width: 22, color: '#94A3B8', fontSize: 11, fontWeight: fontWeights.bold, fontVariant: ['tabular-nums'], fontFamily: systemFont }}>{index + 1}</Text>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text selectable {...nameFitProps} style={{ color: '#0F172A', fontSize: 14, fontWeight: selectedRole ? fontWeights.bold : '700', fontFamily: systemFont }}>{name}</Text>
                    {selectedRole ? (
                      <Text style={{ color: '#0284C7', fontSize: 9, fontWeight: fontWeights.bold, marginTop: 3, fontFamily: systemFont }}>{selectedRole}</Text>
                    ) : null}
                  </View>
                  {selectedRole === 'STRIKER' ? (
                    <MaterialCommunityIcons name="cricket" size={18} color="#0284C7" />
                  ) : selectedRole ? (
                    <Ionicons name="checkmark-circle" size={18} color="#0284C7" />
                  ) : (
                    <Ionicons name="ellipse-outline" size={18} color="#CBD5E1" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ marginTop: 12, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#CBD5E1' }}>
            <View style={{ minHeight: 48, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F8FAFC' }}>
              <MaterialCommunityIcons name="baseball" size={18} color="#E11D48" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#0F172A', fontSize: 13, fontWeight: fontWeights.bold, fontFamily: systemFont }}>SELECT OPENING BOWLER</Text>
                <Text style={{ color: '#64748B', fontSize: 10, fontWeight: fontWeights.bold, marginTop: 2, fontFamily: systemFont }} numberOfLines={1}>{inn1.battingTeam.name}</Text>
              </View>
            </View>

            {bowl2Roster.map((name, index) => {
              const isSelected = inn2Bowler === name;
              return (
                <TouchableOpacity
                  key={name}
                  onPress={() => setInn2Bowler(isSelected ? '' : name)}
                  style={{ minHeight: 54, paddingHorizontal: 16, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 11, borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: isSelected ? '#FFF1F2' : '#FFFFFF' }}
                >
                  <Text style={{ width: 22, color: '#94A3B8', fontSize: 11, fontWeight: fontWeights.bold, fontVariant: ['tabular-nums'], fontFamily: systemFont }}>{index + 1}</Text>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text selectable {...nameFitProps} style={{ color: '#0F172A', fontSize: 14, fontWeight: isSelected ? fontWeights.bold : '700', fontFamily: systemFont }}>{name}</Text>
                    {isSelected ? <Text style={{ color: '#E11D48', fontSize: 9, fontWeight: fontWeights.bold, marginTop: 3, fontFamily: systemFont }}>OPENING BOWLER</Text> : null}
                  </View>
                  <Ionicons name={isSelected ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={isSelected ? '#E11D48' : '#CBD5E1'} />
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <View style={{ paddingHorizontal: 14, paddingVertical: 11, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#CBD5E1' }}>
          <TouchableOpacity
            disabled={!inningReady}
            style={[styles.nextBtn, { backgroundColor: inningReady ? '#0284C7' : '#94A3B8', borderRadius: 6 }]}
            onPress={handleStartInning2}
          >
            <MaterialCommunityIcons name="cricket" size={16} color="#FFFFFF" />
            <Text style={styles.nextBtnText}>START INNING 2</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderResult = () => {
    const finishedMatch = selectedMatch?.id === `finished-${activeMatch.startedAt || activeMatch.matchTitle}`
      ? selectedMatch
      : buildFinishedMatch(activeMatch, {
        [team1Name]: team1Roster,
        [team2Name]: team2Roster
      });
    const openFinishedScorecard = () => {
      setSelectedMatch(finishedMatch);
      setFinishedTab('summary');
      setFinishedInningIndex(0);
      setCurrentScreen('finishedView');
    };
    const returnHome = () => {
      setSelectedMatch(finishedMatch);
      setActiveMatch(null);
      setCurrentScreen('home');
      setBottomNavTab('home');
      setWizardStep(1);
    };
    return (
      <ScrollView style={{ flex: 1, backgroundColor: '#F8FAFC' }} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <MatchResultHero
          teamOne={finishedMatch.team1}
          teamTwo={finishedMatch.team2}
          winnerTeamName={finishedMatch.winnerTeamName}
          resultText={finishedMatch.winner}
        />

        <View style={{ marginTop: 12, flexDirection: 'row', backgroundColor: '#FFFFFF', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#CBD5E1' }}>
          {[
            ['TARGET', activeMatch.target || '-'],
            ['OVERS', activeMatch.maxOvers],
            ['INNINGS', activeMatch.innings.length]
          ].map(([label, value], index) => (
            <View key={label} style={{ flex: 1, alignItems: 'center', paddingVertical: 13, borderLeftWidth: index > 0 ? 1 : 0, borderLeftColor: '#E2E8F0' }}>
              <Text selectable style={{ color: '#0F172A', fontSize: 14, fontWeight: fontWeights.bold, fontVariant: ['tabular-nums'], fontFamily: systemFont }}>{value}</Text>
              <Text style={{ color: '#94A3B8', fontSize: 9, fontWeight: fontWeights.bold, marginTop: 3, fontFamily: systemFont }}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={{ paddingHorizontal: 14, paddingTop: 16, gap: 9 }}>
          <TouchableOpacity
            onPress={() => handleRematch(finishedMatch)}
            style={{
              minHeight: 50,
              borderRadius: 8,
              backgroundColor: '#0284C7',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              elevation: 2
            }}
          >
            <MaterialCommunityIcons name="cached" size={20} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: fontWeights.bold, fontFamily: systemFontBold }}>PLAY REMATCH (SAME TEAMS)</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={openFinishedScorecard} style={{ minHeight: 48, borderRadius: 6, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Ionicons name="stats-chart-outline" size={17} color="#0284C7" />
            <Text style={{ color: '#0284C7', fontSize: 13, fontWeight: fontWeights.bold, fontFamily: systemFont }}>VIEW FINAL SCORECARD</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={returnHome} style={{ minHeight: 46, borderRadius: 6, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Ionicons name="home-outline" size={17} color="#475569" />
            <Text style={{ color: '#334155', fontSize: 13, fontWeight: fontWeights.bold, fontFamily: systemFont }}>BACK TO HOME</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  const playingXiFinishedMatch = currentScreen === 'finishedView' ? (selectedMatch || finishedMatches[0]) : null;
  const activePlayingXiTeams = activeMatch?.teams?.length >= 2 && activeMatch?.playingXI
    ? activeMatch.teams.slice(0, 2).map((team, index) => ({
      id: index + 1,
      name: team.name,
      roster: activeMatch.playingXI[team.name] || []
    }))
    : [
      { id: 1, name: team1Name, roster: team1Roster },
      { id: 2, name: team2Name, roster: team2Roster }
    ];
  const playingXiTabs = (playingXiFinishedMatch && playingXiFinishedMatch.team1 && playingXiFinishedMatch.team2)
    ? [
      { id: 1, name: playingXiFinishedMatch.team1?.name || team1Name, roster: (playingXiFinishedMatch.team1?.batting || []).map(player => player.name) },
      { id: 2, name: playingXiFinishedMatch.team2?.name || team2Name, roster: (playingXiFinishedMatch.team2?.batting || []).map(player => player.name) }
    ]
    : activePlayingXiTeams;
  const playingXiMatchTitle = playingXiFinishedMatch?.title || activeMatch?.matchTitle || `${team1Name} vs ${team2Name}`;
  const playingXiTabsMeasured = playingXiTabs.every(team => playingXiTabLayouts[team.id]);
  const playingXiIndicatorTranslateX = playingXiPagerScrollX.interpolate({
    inputRange: [0, screenWidth],
    outputRange: playingXiTabs.map(team => {
      const layout = playingXiTabLayouts[team.id];
      return layout ? layout.x + (layout.width / 2) - 50 : 0;
    }),
    extrapolate: 'clamp'
  });
  const playingXiIndicatorScaleX = playingXiPagerScrollX.interpolate({
    inputRange: [0, screenWidth],
    outputRange: playingXiTabs.map(team => (playingXiTabLayouts[team.id]?.width || 100) / 100),
    extrapolate: 'clamp'
  });
  const activeDisplayTeamOne = activeMatch?.teams?.[0] || {
    name: team1Name,
    code: team1Name.slice(0, 2).toUpperCase(),
    logoKey: 'default-team-1'
  };
  const activeDisplayTeamTwo = activeMatch?.teams?.[1] || {
    name: team2Name,
    code: team2Name.slice(0, 2).toUpperCase(),
    logoKey: 'default-team-2'
  };
  const getLatestTeamInning = (teamName) => [...(activeMatch?.innings || [])]
    .reverse()
    .find(inning => (inning?.battingTeam?.name || inning?.battingTeamName || inning?.teamName) === teamName);
  const activeDisplayInningOne = getLatestTeamInning(activeDisplayTeamOne?.name);
  const activeDisplayInningTwo = getLatestTeamInning(activeDisplayTeamTwo?.name);
  const getFinishedCardScoreParts = (team) => getScorePartsFromText(team?.score);
  const openLiveMatchCard = () => {
    setPublicLiveTab('live');
    setLiveViewReturnScreen('home');
    setCurrentScreen('liveView');
  };
  const renderActiveMatchListCard = () => (
    <MatchListScoreCard
      subtitle={`${activeMatch.maxOvers}-over match${activeMatch.venue ? ` - ${activeMatch.venue}` : ''}`}
      teamOne={activeDisplayTeamOne}
      teamTwo={activeDisplayTeamTwo}
      teamOneScore={activeDisplayInningOne?.battingTeam ? `${activeDisplayInningOne.battingTeam.runs ?? 0}-${activeDisplayInningOne.battingTeam.wickets ?? 0}` : '0-0'}
      teamOneOvers={activeDisplayInningOne ? formatOvers(activeDisplayInningOne.totalLegalBalls) : '0.0'}
      teamTwoScore={activeDisplayInningTwo?.battingTeam ? `${activeDisplayInningTwo.battingTeam.runs ?? 0}-${activeDisplayInningTwo.battingTeam.wickets ?? 0}` : ''}
      teamTwoOvers={activeDisplayInningTwo ? formatOvers(activeDisplayInningTwo.totalLegalBalls) : ''}
      activeTeamName={curInning?.battingTeam?.name}
      statusLabel="Live"
      statusColor="#E11D48"
      statusDotColor="#E11D48"
      footerText={`Toss: ${activeTossWinnerName}, Elected to ${activeTossDecisionText}`}
      onPress={openLiveMatchCard}
    />
  );
  const renderFinishedMatchListCard = (match) => {
    const teamOneScore = getFinishedCardScoreParts(match.team1);
    const teamTwoScore = getFinishedCardScoreParts(match.team2);
    const resultCardText = getFinishedResultCardText(match);
    const resultColor = match.winnerTeamName === match.team1?.name ? '#0369A1' : '#92400E';

    return (
      <MatchListScoreCard
        key={match.id}
        subtitle={`${match.maxOvers}-over match${match.venue ? ` - ${match.venue}` : ''}`}
        teamOne={match.team1}
        teamTwo={match.team2}
        teamOneScore={teamOneScore.score}
        teamOneOvers={teamOneScore.overs}
        teamTwoScore={teamTwoScore.score}
        teamTwoOvers={teamTwoScore.overs}
        winnerTeamName={match.winnerTeamName}
        resultTitle={resultCardText.title}
        resultDetail={resultCardText.detail}
        resultColor={resultColor}
        topRightIcon={null}
        onPress={() => {
          setSelectedMatch(match);
          setFinishedTab('summary');
          setFinishedInningIndex(0);
          setCurrentScreen('finishedView');
        }}
      />
    );
  };
  const searchNeedle = searchQuery.trim().toLowerCase();
  const [globalLocalPlayers, setGlobalLocalPlayers] = useState([]);

  useEffect(() => {
    fetchLocalPlayers().then(players => {
      if (Array.isArray(players) && players.length > 0) {
        setGlobalLocalPlayers(players);
      }
    }).catch(() => {});
  }, []);

  const activeMatchVisible = Boolean(
    activeMatch
    && activeMatch.phase !== 'result'
    && (
      (activeMatch.innings?.[0]?.totalLegalBalls || 0) > 0
      || (activeMatch.innings?.[0]?.currentOverBalls || []).length > 0
      || activeMatch.phase === 'playing'
    )
    && (!searchNeedle || getSearchBlob(activeMatch).includes(searchNeedle))
  );
  const visibleFinishedMatches = (searchNeedle
    ? finishedMatches.filter(match => getSearchBlob(match).includes(searchNeedle))
    : finishedMatches).filter(isSadokanFinishedMatch);
  const recentFinishedMatch = visibleFinishedMatches[0] || null;

  const extraLocalNames = globalLocalPlayers.map(p => p.name);
  const setupPlayerNames = getCleanPlayerNames([...SADOKAN_PLAYER_POOL, ...extraLocalNames, ...team1Roster, ...team2Roster, ...playerPool]);
  const getSetupPlayerProfile = (playerName) => MASTER_PLAYERS_DB.find(player => player.name.toLowerCase() === String(playerName).toLowerCase());
  const renderSetupPlayerPhoto = (playerName, size = 28) => {
    return <PlayerAvatar name={playerName} size={size} />;
  };

  const renderSetupTeamSlot = (slot) => {
    const isTeamOne = slot === 'team1';
    const name = isTeamOne ? team1Name : team2Name;
    const roster = isTeamOne ? team1Roster : team2Roster;
    const accent = isTeamOne ? '#0284C7' : '#E11D48';
    const softBg = isTeamOne ? '#F0F9FF' : '#FFF1F2';
    const logoKey = isTeamOne ? 'default-team-1' : 'default-team-2';

    return (
      <View style={{ flex: 1, minWidth: 0, backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1', overflow: 'hidden' }}>
        <View style={{ minHeight: 62, padding: 10, backgroundColor: softBg, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', gap: 9 }}>
          <TeamIdentityMark team={{ name, code: makeTeamCode(name), logoKey }} size={36} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ color: accent, fontSize: 10, fontWeight: fontWeights.bold, fontFamily: systemFont }}>{isTeamOne ? 'TEAM A' : 'TEAM B'}</Text>
            <Text {...nameFitProps} style={{ color: '#0F172A', fontSize: 14, fontWeight: fontWeights.bold, marginTop: 2, fontFamily: systemFont }}>{name}</Text>
            <Text style={{ color: '#64748B', fontSize: 10, fontWeight: fontWeights.bold, marginTop: 2, fontFamily: systemFont }}>{roster.length} players selected</Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 8 }}>
          {roster.map(playerName => (
            <View key={`${slot}-${playerName}`} style={{ minHeight: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, borderBottomWidth: 1, borderBottomColor: '#EEF2F6' }}>
              {renderSetupPlayerPhoto(playerName, 22)}
              <Text {...nameFitProps} style={{ flex: 1, minWidth: 0, color: '#0F172A', fontSize: 10, fontWeight: fontWeights.bold, fontFamily: systemFont }}>{playerName}</Text>
              <TouchableOpacity onPress={() => handleRemoveSetupPlayer(slot, playerName)} style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="close-circle" size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
          {roster.length === 0 ? (
            <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: fontWeights.bold, textAlign: 'center', paddingVertical: 14, fontFamily: systemFont }}>No players selected</Text>
          ) : null}
        </View>
      </View>
    );
  };

  const renderPlayerSelectorRow = (playerName) => {
    const inTeamA = team1Roster.includes(playerName);
    const inTeamB = team2Roster.includes(playerName);
    const isAssigned = inTeamA || inTeamB;

    return (
      <View key={`selector-${playerName}`} style={{ minHeight: 92, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {renderSetupPlayerPhoto(playerName, 38)}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text selectable {...nameFitProps} style={{ color: '#0F172A', fontSize: 15, lineHeight: 20, fontWeight: fontWeights.bold, fontFamily: systemFont }}>{playerName}</Text>
            <Text {...nameFitProps} style={{ color: inTeamA ? '#0284C7' : inTeamB ? '#E11D48' : '#64748B', fontSize: 10, fontWeight: fontWeights.bold, marginTop: 2, fontFamily: systemFont }}>
              {inTeamA ? team1Name : inTeamB ? team2Name : 'Available'}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 9, paddingLeft: 48 }}>
          <TouchableOpacity
            onPress={() => handleMoveToTeam(playerName, 'team1')}
            style={{ flex: 1, minHeight: 34, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: inTeamA ? '#0284C7' : '#F0F9FF', borderWidth: 1, borderColor: inTeamA ? '#0284C7' : '#BAE6FD' }}
          >
            <Text style={{ color: inTeamA ? '#FFFFFF' : '#0284C7', fontSize: 11, fontWeight: fontWeights.bold, fontFamily: systemFont }}>A</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleMoveToTeam(playerName, 'team2')}
            style={{ flex: 1, minHeight: 34, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: inTeamB ? '#E11D48' : '#FFF1F2', borderWidth: 1, borderColor: inTeamB ? '#E11D48' : '#FECDD3' }}
          >
            <Text style={{ color: inTeamB ? '#FFFFFF' : '#E11D48', fontSize: 11, fontWeight: fontWeights.bold, fontFamily: systemFont }}>B</Text>
          </TouchableOpacity>
          {isAssigned ? (
            <TouchableOpacity
              onPress={() => handleMoveToTeam(playerName, 'pool')}
              style={{ width: 42, height: 34, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' }}
            >
              <Ionicons name="close" size={16} color="#64748B" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  };

  const isDarkMatchScreen = currentScreen === 'finishedView'
    || currentScreen === 'liveView'
    || (currentScreen === 'scorerWizard' && activeMatch?.phase === 'playing');
  const shellBackgroundColor = isDarkMatchScreen ? '#071B2C' : '#FFFFFF';

  return (
    <SafeAreaProvider>
      <View style={[styles.root, { backgroundColor: shellBackgroundColor }]}>
        <StatusBar barStyle={isDarkMatchScreen ? 'light-content' : 'dark-content'} backgroundColor={shellBackgroundColor} translucent />
        <SafeAreaView style={[styles.safe, { backgroundColor: shellBackgroundColor }]} edges={['top', 'left', 'right']}>

          {/* â•â•â• PUBLIC LIVE & FINISHED SCORECARDS â•â•â• */}
          {currentScreen === 'liveView' ? (
            renderLiveView()
          ) : currentScreen === 'finishedView' ? (
            renderFinishedView()
          ) : currentScreen === 'scorerWizard' ? (
            <View style={styles.fullPage}>

              {/* Page Header */}
              {activeMatch && activeMatch.phase === 'playing' ? (
                <View style={{ backgroundColor: '#071B2C', paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#123A56' }}>
                  <TouchableOpacity onPress={() => { setCurrentScreen('home'); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="arrow-back" size={20} color="#E0F2FE" />
                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: fontWeights.bold, fontFamily: systemFont }}>
                      {getTeamShortCode(activeDisplayTeamOne, activeDisplayTeamOne?.name || 'SA')} vs {getTeamShortCode(activeDisplayTeamTwo, activeDisplayTeamTwo?.name || 'SB')}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (activeMatch && activeMatch.phase === 'result') ? null : (
                <View style={styles.pageHeader}>
                  <TouchableOpacity onPress={() => { setCurrentScreen('home'); setWizardStep(1); }} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={20} color="#0F172A" />
                    <Text style={styles.backBtnText}>Home</Text>
                  </TouchableOpacity>
                  <Text style={styles.pageTitle}>
                    {activeMatch
                      ? activeMatch.phase === 'result' ? 'Match Over'
                        : activeMatch.phase === 'inningBreak' ? 'Inning Break'
                          : `Live - Inning ${activeMatch.inning}`
                      : `Match Setup - Step ${wizardStep}/3`}
                  </Text>
                </View>
              )}

              {/* CONTENT */}
              {activeMatch ? (
                activeMatch.phase === 'result' ? renderResult()
                  : activeMatch.phase === 'inningBreak' ? renderInningBreak()
                    : renderScorerConsole()
              ) : wizardStep === 1 ? (
                /* â”€â”€ STEP 1: TEAMS & SQUAD â”€â”€ */
                <ScrollView
                  style={{ flex: 1 }}
                  contentContainerStyle={{ padding: 14, gap: 14, paddingBottom: 24 }}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={{ gap: 14 }}>
                    <View>
                      <Text style={{ color: '#0F172A', fontSize: typeScale.pageTitle, fontWeight: fontWeights.bold, fontFamily: systemFont }}>Build Teams</Text>
                      <Text style={{ color: '#64748B', fontSize: 11, fontWeight: fontWeights.bold, marginTop: 2, fontFamily: systemFont }}>
                        {team1Roster.length + team2Roster.length} selected | {playerPool.length} available
                      </Text>
                    </View>

                    {/* Selected Teams */}
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      {renderSetupTeamSlot('team1')}
                      {renderSetupTeamSlot('team2')}
                    </View>

                    <TouchableOpacity
                      onPress={() => setPlayerSelectorVisible(true)}
                      style={{ minHeight: 46, borderRadius: 6, borderWidth: 1, borderColor: '#BAE6FD', backgroundColor: '#F0F9FF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    >
                      <Ionicons name="swap-horizontal-outline" size={18} color="#0284C7" />
                      <Text style={{ color: '#0369A1', fontSize: 12, fontWeight: fontWeights.bold, fontFamily: systemFont }}>MANAGE PLAYERS</Text>
                    </TouchableOpacity>

                    {false && (
                      <View style={{ marginTop: 12, gap: 10 }}>
                        <Text style={{ fontSize: 13, fontWeight: fontWeights.bold, color: '#0F172A', fontFamily: systemFont }}>
                          Master Player Cards Pool
                        </Text>

                        <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={{ gap: 10 }} showsVerticalScrollIndicator={true}>
                          {MASTER_PLAYERS_DB.map((player) => {
                            const inTeam1 = team1Roster.includes(player.name);
                            const inTeam2 = team2Roster.includes(player.name);

                            return (
                              <View
                                key={player.id}
                                style={{
                                  backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12, borderWidth: 1.5,
                                  borderColor: inTeam1 ? '#0284C7' : inTeam2 ? '#E11D48' : '#E2E8F0',
                                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                                  shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 3, elevation: 1
                                }}
                              >
                                {/* Avatar Image */}
                                <Image source={{ uri: player.avatar }} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#E2E8F0' }} />

                                {/* Player Details */}
                                <View style={{ flex: 1, gap: 2 }}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Text style={{ fontSize: 14, fontWeight: fontWeights.bold, color: '#0F172A', fontFamily: systemFont }}>{player.name}</Text>
                                    <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                      <Text style={{ fontSize: 10, fontWeight: fontWeights.bold, color: '#64748B', fontFamily: systemFont }}>{player.name}</Text>
                                    </View>
                                  </View>
                                  <Text style={{ fontSize: 11, color: '#64748B', fontWeight: fontWeights.medium, fontFamily: systemFont }}>
                                    {player.matches} Matches - {player.runs} Runs - {player.wickets} Wkts (SR: {player.sr})
                                  </Text>
                                </View>

                                {/* Action Buttons */}
                                <View style={{ flexDirection: 'row', gap: 6 }}>
                                  <TouchableOpacity
                                    onPress={() => handleMoveToTeam(player.name, inTeam1 ? 'pool' : 'team1')}
                                    style={{
                                      backgroundColor: inTeam1 ? '#0284C7' : '#F0F9FF', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8,
                                      borderWidth: 1, borderColor: '#0284C7'
                                    }}
                                  >
                                    <Text style={{ fontSize: 11, fontWeight: fontWeights.bold, color: inTeam1 ? '#FFFFFF' : '#0284C7', fontFamily: systemFont }}>
                                      {inTeam1 ? 'Team A' : '+ Team A'}
                                    </Text>
                                  </TouchableOpacity>

                                  <TouchableOpacity
                                    onPress={() => handleMoveToTeam(player.name, inTeam2 ? 'pool' : 'team2')}
                                    style={{
                                      backgroundColor: inTeam2 ? '#E11D48' : '#FFF1F2', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8,
                                      borderWidth: 1, borderColor: '#E11D48'
                                    }}
                                  >
                                    <Text style={{ fontSize: 11, fontWeight: fontWeights.bold, color: inTeam2 ? '#FFFFFF' : '#E11D48', fontFamily: systemFont }}>
                                      {inTeam2 ? 'Team B' : '+ Team B'}
                                    </Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                            );
                          })}
                        </ScrollView>
                      </View>
                    )}

                    <Text style={styles.inputLabel}>Total Match Overs</Text>
                    <TextInput style={styles.textInput} value={totalOvers} onChangeText={setTotalOvers} keyboardType="number-pad" maxLength={2} placeholder="5" placeholderTextColor="#94A3B8" />

                    <Text style={styles.inputLabel}>Umpire Name</Text>
                    <TextInput
                      style={styles.textInput}
                      value={umpireName}
                      onChangeText={setUmpireName}
                      autoCapitalize="words"
                      placeholder={DEFAULT_UMPIRE_NAME}
                      placeholderTextColor="#94A3B8"
                    />

                    <Text style={styles.inputLabel}>Venue Name</Text>
                    <TextInput
                      style={styles.textInput}
                      value={venueName}
                      onChangeText={setVenueName}
                      autoCapitalize="words"
                      placeholder="Ground, village or city"
                      placeholderTextColor="#94A3B8"
                    />

                    <TouchableOpacity style={styles.nextBtn} onPress={handleSetupStepOneNext}>
                      <Text style={styles.nextBtnText}>NEXT: COIN TOSS</Text>
                      <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </ScrollView>

              ) : wizardStep === 2 ? (
                /* â”€â”€ STEP 2: TOSS â”€â”€ */
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 14, gap: 14 }}>
                  <View style={styles.formCard}>
                    <Text style={styles.formCardTitle}>Step 2: Coin Toss</Text>

                    <Text style={styles.inputLabel}>Who Won the Toss?</Text>
                    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                      {[team1Name, team2Name].map(t => (
                        <TouchableOpacity key={t} style={[styles.tossBtn, tossWinner === t && styles.tossBtnActive]} onPress={() => setTossWinner(t)}>
                          <Text style={[styles.tossBtnText, tossWinner === t && { color: '#FFFFFF' }]}>{t}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={styles.inputLabel}>They Elected to...</Text>
                    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                      {['BAT', 'BOWL'].map(d => (
                        <TouchableOpacity key={d} style={[styles.tossBtn, tossDecision === d && styles.tossBtnActive]} onPress={() => setTossDecision(d)}>
                          <MaterialCommunityIcons name={d === 'BAT' ? 'cricket' : 'baseball'} size={14} color={tossDecision === d ? '#FFFFFF' : '#475569'} />
                          <Text style={[styles.tossBtnText, tossDecision === d && { color: '#FFFFFF' }]}>{d === 'BAT' ? 'Bat First' : 'Bowl First'}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <View style={styles.tossSummary}>
                      <Ionicons name="megaphone-outline" size={14} color="#0369A1" />
                      <Text style={styles.tossSummaryText}>{tossWinner} won the toss and elected to {tossDecision} first.</Text>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <TouchableOpacity style={[styles.nextBtn, { flex: 0.4, backgroundColor: '#475569' }]} onPress={() => setWizardStep(1)}>
                        <Ionicons name="arrow-back" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.nextBtn, { flex: 1 }]} onPress={() => setWizardStep(3)}>
                        <Text style={styles.nextBtnText}>NEXT: OPENERS</Text>
                        <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </ScrollView>

              ) : (
                /* â”€â”€ STEP 3: SELECT OPENERS â”€â”€ */
                (() => {
                  let bat1 = team1Name, bowl1 = team2Name;
                  if ((tossWinner === team1Name && tossDecision === 'BOWL') || (tossWinner === team2Name && tossDecision === 'BAT')) {
                    bat1 = team2Name; bowl1 = team1Name;
                  }
                  const bRoster = bat1 === team1Name ? team1Roster : team2Roster;
                  const blRoster = bowl1 === team1Name ? team1Roster : team2Roster;
                  const battingLogoKey = bat1 === team1Name ? 'default-team-1' : 'default-team-2';
                  const bowlingLogoKey = bowl1 === team1Name ? 'default-team-1' : 'default-team-2';
                  const renderOpeningRow = ({ name, active, accent, iconName, onPress, roleLabel }) => (
                    <TouchableOpacity
                      key={name}
                      onPress={onPress}
                      style={{ minHeight: 52, paddingHorizontal: 12, backgroundColor: active ? '#F0F9FF' : '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', gap: 10 }}
                    >
                      {renderSetupPlayerPhoto(name, 34)}
                      <Text {...nameFitProps} style={{ flex: 1, minWidth: 0, color: active ? accent : '#0F172A', fontSize: 13, fontWeight: active ? fontWeights.bold : fontWeights.bold, fontFamily: systemFont }}>{name}</Text>
                      {active ? (
                        <View style={{ minHeight: 24, paddingHorizontal: 8, borderRadius: 5, backgroundColor: accent === '#E11D48' ? '#FFF1F2' : '#E0F2FE', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Ionicons name="checkmark-circle-outline" size={13} color={accent} />
                          <Text style={{ color: accent, fontSize: 9, fontWeight: fontWeights.bold, fontFamily: systemFont }}>{roleLabel || 'SELECTED'}</Text>
                        </View>
                      ) : (
                        <MaterialCommunityIcons name={iconName} size={17} color="#94A3B8" />
                      )}
                    </TouchableOpacity>
                  );
                  const handleOpeningBatterSelect = (name) => {
                    if (step3Striker === name) {
                      setStep3Striker('');
                      return;
                    }
                    if (step3NonStriker === name) {
                      setStep3NonStriker('');
                      return;
                    }
                    if (!step3Striker) {
                      setStep3Striker(name);
                      return;
                    }
                    if (!step3NonStriker) {
                      setStep3NonStriker(name);
                      return;
                    }
                    setStep3NonStriker(name);
                  };
                  const selectedOpening = [
                    { label: 'Striker', name: step3Striker, color: '#0284C7' },
                    { label: 'Non-Striker', name: step3NonStriker, color: '#0284C7' },
                    { label: 'Bowler', name: step3Bowler, color: '#E11D48' }
                  ];
                  return (
                    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 14, gap: 14, paddingBottom: 24 }}>
                      <View style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, overflow: 'hidden' }}>
                        <View style={{ minHeight: 86, padding: 14, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <View style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <TeamIdentityMark team={{ name: bat1, code: makeTeamCode(bat1), logoKey: battingLogoKey }} size={42} />
                            <View style={{ flex: 1, minWidth: 0 }}>
                              <Text style={{ color: '#0284C7', fontSize: 10, fontWeight: fontWeights.bold, fontFamily: systemFont }}>BATTING FIRST</Text>
                              <Text style={{ color: '#0F172A', fontSize: typeScale.pageTitle, fontWeight: fontWeights.bold, marginTop: 3, fontFamily: systemFont }} numberOfLines={1}>{bat1}</Text>
                            </View>
                          </View>
                          <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: fontWeights.bold, fontFamily: systemFont }}>VS</Text>
                          <View style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
                            <View style={{ flex: 1, minWidth: 0, alignItems: 'flex-end' }}>
                              <Text style={{ color: '#E11D48', fontSize: 10, fontWeight: fontWeights.bold, fontFamily: systemFont }}>BOWLING</Text>
                              <Text style={{ color: '#0F172A', fontSize: typeScale.pageTitle, fontWeight: fontWeights.bold, marginTop: 3, textAlign: 'right', fontFamily: systemFont }} numberOfLines={1}>{bowl1}</Text>
                            </View>
                            <TeamIdentityMark team={{ name: bowl1, code: makeTeamCode(bowl1), logoKey: bowlingLogoKey }} size={42} />
                          </View>
                        </View>

                        <View style={{ paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#F8FAFC', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Ionicons name="megaphone-outline" size={14} color="#0369A1" />
                          <Text style={{ flex: 1, color: '#334155', fontSize: 11, fontWeight: fontWeights.bold, fontFamily: systemFont }}>{bat1} batting first against {bowl1}.</Text>
                        </View>

                        <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
                          {selectedOpening.map((item, index) => (
                            <View key={item.label} style={{ flex: 1, minHeight: 62, padding: 9, borderRightWidth: index < selectedOpening.length - 1 ? 1 : 0, borderRightColor: '#E2E8F0', justifyContent: 'center' }}>
                              <Text style={{ color: '#94A3B8', fontSize: 9, fontWeight: fontWeights.bold, fontFamily: systemFont }}>{item.label.toUpperCase()}</Text>
                              <Text style={{ color: item.name ? item.color : '#64748B', fontSize: 12, fontWeight: fontWeights.bold, marginTop: 4, fontFamily: systemFont }} numberOfLines={1}>
                                {item.name || 'Select'}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>

                      <View style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, overflow: 'hidden' }}>
                        <View style={{ minHeight: 42, paddingHorizontal: 12, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <MaterialCommunityIcons name="cricket" size={16} color="#0284C7" />
                          <Text style={{ flex: 1, color: '#0F172A', fontSize: 12, fontWeight: fontWeights.bold, fontFamily: systemFont }}>OPENING BATTERS</Text>
                          <Text style={{ color: '#0284C7', fontSize: 11, fontWeight: fontWeights.bold, fontFamily: systemFont }}>{[step3Striker, step3NonStriker].filter(Boolean).length}/2</Text>
                        </View>
                        {bRoster.map(name => renderOpeningRow({
                          name,
                          active: step3Striker === name || step3NonStriker === name,
                          accent: '#0284C7',
                          iconName: 'cricket',
                          roleLabel: step3Striker === name ? 'STRIKER' : step3NonStriker === name ? 'NON-STRIKER' : '',
                          onPress: () => handleOpeningBatterSelect(name)
                        }))}
                      </View>

                      <View style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, overflow: 'hidden' }}>
                        <View style={{ minHeight: 42, paddingHorizontal: 12, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <MaterialCommunityIcons name="baseball" size={16} color="#E11D48" />
                          <Text style={{ color: '#0F172A', fontSize: 12, fontWeight: fontWeights.bold, fontFamily: systemFont }}>OPENING BOWLER</Text>
                        </View>
                        {blRoster.map(name => renderOpeningRow({
                          name,
                          active: step3Bowler === name,
                          accent: '#E11D48',
                          iconName: 'baseball',
                          roleLabel: 'BOWLER',
                          onPress: () => setStep3Bowler(name)
                        }))}
                      </View>

                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity style={[styles.nextBtn, { flex: 0.4, borderRadius: 6, backgroundColor: '#475569' }]} onPress={() => setWizardStep(2)}>
                          <Ionicons name="arrow-back" size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          disabled={!step3Striker || !step3NonStriker || !step3Bowler}
                          style={[styles.nextBtn, { flex: 1, borderRadius: 6, backgroundColor: step3Striker && step3NonStriker && step3Bowler ? '#0284C7' : '#94A3B8' }]}
                          onPress={handleStartMatch}
                        >
                          <MaterialCommunityIcons name="cricket" size={16} color="#FFFFFF" />
                          <Text style={styles.nextBtnText}>START MATCH</Text>
                        </TouchableOpacity>
                      </View>
                    </ScrollView>
                  );
                })()
              )}
            </View>

          ) : (
            <HomeScreen
              openScorerScreen={openScorerScreen}
              setIsMenuOpen={setIsMenuOpen}
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
              searchNeedle={searchNeedle}
              setSelectedPlayerName={setSelectedPlayerName}
              setCurrentScreen={setCurrentScreen}
              renderSetupPlayerPhoto={renderSetupPlayerPhoto}
              activeMatchVisible={activeMatchVisible}
              renderActiveMatchListCard={renderActiveMatchListCard}
              recentFinishedMatch={recentFinishedMatch}
              renderFinishedMatchListCard={renderFinishedMatchListCard}
              visibleFinishedMatches={visibleFinishedMatches}
              finishedArchive={finishedArchive}
              activeMatch={activeMatch}
              TOP_BATTERS={computeLeaderboardRankings(finishedArchive, localPlayersDb).topBatters}
              TOP_BOWLERS={computeLeaderboardRankings(finishedArchive, localPlayersDb).topBowlers}
              TOP_ALLROUNDERS={computeLeaderboardRankings(finishedArchive, localPlayersDb).topAllRounders}
              styles={styles}
            />
          )}
        </SafeAreaView>

        <Modal
          visible={playerSelectorVisible}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setPlayerSelectorVisible(false)}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
            <View style={{ minHeight: 58, paddingHorizontal: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#CBD5E1', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <TouchableOpacity onPress={() => setPlayerSelectorVisible(false)} style={{ minWidth: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="arrow-back" size={22} color="#0F172A" />
              </TouchableOpacity>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ color: '#0F172A', fontSize: typeScale.pageTitle, fontWeight: fontWeights.bold, fontFamily: systemFont }} numberOfLines={1}>Select Players</Text>
                <Text style={{ color: '#64748B', fontSize: 10, fontWeight: fontWeights.bold, marginTop: 2, fontFamily: systemFont }} numberOfLines={1}>
                  {team1Roster.length} in A | {team2Roster.length} in B | {playerPool.length} available
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setPlayerSelectorVisible(false)}
                style={{ minHeight: 36, paddingHorizontal: 12, borderRadius: 6, backgroundColor: '#0284C7', alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: fontWeights.bold, fontFamily: systemFont }}>DONE</Text>
              </TouchableOpacity>
            </View>

            <View style={{ backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
              <View style={{ flexDirection: 'row', paddingHorizontal: 14, paddingTop: 12, gap: 8 }}>
                {[
                  { label: team1Name, value: team1Roster.length, color: '#0284C7', bg: '#F0F9FF' },
                  { label: team2Name, value: team2Roster.length, color: '#E11D48', bg: '#FFF1F2' },
                  { label: 'Available', value: playerPool.length, color: '#475569', bg: '#F8FAFC' }
                ].map(item => (
                  <View key={item.label} style={{ flex: 1, minHeight: 48, borderRadius: 6, backgroundColor: item.bg, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}>
                    <Text style={{ color: item.color, fontSize: 18, fontWeight: fontWeights.bold, fontFamily: systemFont }}>{item.value}</Text>
                    <Text style={{ color: '#64748B', fontSize: 9, fontWeight: fontWeights.bold, marginTop: 1, fontFamily: systemFont }} numberOfLines={1}>{item.label}</Text>
                  </View>
                ))}
              </View>

              <View style={{ padding: 14 }}>
                <Text style={styles.inputLabel}>Add Player</Text>
                <View style={styles.addPlayerRow}>
                  <TextInput
                    style={styles.addPlayerInput}
                    placeholder="Type player name..."
                    placeholderTextColor="#94A3B8"
                    value={newPlayerNameInput}
                    onChangeText={setNewPlayerNameInput}
                    maxLength={36}
                  />
                  <TouchableOpacity style={[styles.addPlayerBtn, { backgroundColor: '#0F172A', width: 70, flexDirection: 'row', gap: 4 }]} onPress={handleAddNewPlayer}>
                    <Ionicons name="add-circle-outline" size={14} color="#FFFFFF" />
                    <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: fontWeights.bold, fontFamily: systemFont }}>ADD</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 24 }}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              {setupPlayerNames.map(renderPlayerSelectorRow)}
            </ScrollView>
          </SafeAreaView>
        </Modal>

        <Modal
          visible={extrasSheetVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setExtrasSheetVisible(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.42)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 18, borderTopRightRadius: 18, borderWidth: 1, borderColor: '#CBD5E1', maxHeight: '82%' }}>
              <View style={{ minHeight: 58, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="add-circle-outline" size={20} color="#0284C7" />
                  <View>
                    <Text style={{ color: '#0F172A', fontSize: 15, fontWeight: fontWeights.bold, fontFamily: systemFont }}>EXTRAS</Text>
                    <Text style={{ color: '#64748B', fontSize: 10, fontWeight: fontWeights.bold, marginTop: 2, fontFamily: systemFont }}>Advanced scoring inputs</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setExtrasSheetVisible(false)} style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9' }}>
                  <Ionicons name="close" size={18} color="#0F172A" />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={{ padding: 14, gap: 14, paddingBottom: 22 }} showsVerticalScrollIndicator={false}>
                {[
                  {
                    title: 'WIDES',
                    icon: 'radio-outline',
                    color: '#B45309',
                    bg: '#FFFBEB',
                    items: [
                      { label: '2 WIDES', action: () => handleRecordBall(1, 'wd') },
                      { label: '3 WIDES', action: () => handleRecordBall(2, 'wd') },
                      { label: '4 WIDES', action: () => handleRecordBall(3, 'wd') },
                      { label: '5 WIDES', action: () => handleRecordBall(4, 'wd') }
                    ]
                  },
                  {
                    title: 'NO BALL WITH BAT RUNS',
                    icon: 'alert-circle-outline',
                    color: '#B45309',
                    bg: '#FFFBEB',
                    items: [
                      { label: 'NB +1', action: () => handleRecordBall(1, 'nb') },
                      { label: 'NB +2', action: () => handleRecordBall(2, 'nb') },
                      { label: 'NB +4', action: () => handleRecordBall(4, 'nb') },
                      { label: 'NB +6', action: () => handleRecordBall(6, 'nb') }
                    ]
                  },
                  {
                    title: 'BYES',
                    icon: 'swap-horizontal-outline',
                    color: '#475569',
                    bg: '#F8FAFC',
                    items: [1, 2, 3, 4].map(runs => ({ label: `+${runs} BYE`, action: () => handleRecordBall(runs, null, false, 'b') }))
                  },
                  {
                    title: 'LEG BYES',
                    icon: 'swap-horizontal-outline',
                    color: '#475569',
                    bg: '#F8FAFC',
                    items: [1, 2, 3, 4].map(runs => ({ label: `+${runs} LB`, action: () => handleRecordBall(runs, null, false, 'lb') }))
                  }
                ].map(section => (
                  <View key={section.title} style={{ gap: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name={section.icon} size={15} color={section.color} />
                      <Text style={{ color: '#64748B', fontSize: 11, fontWeight: fontWeights.bold, fontFamily: systemFont }}>{section.title}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {section.items.map(item => (
                        <TouchableOpacity
                          key={item.label}
                          onPress={() => {
                            setExtrasSheetVisible(false);
                            item.action();
                          }}
                          style={{ width: '48%', minHeight: 46, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: section.bg, alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Text style={{ color: section.color, fontSize: 13, fontWeight: fontWeights.bold, fontFamily: systemFont }}>{item.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}

                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="add-circle-outline" size={15} color="#475569" />
                    <Text style={{ color: '#64748B', fontSize: 11, fontWeight: fontWeights.bold, fontFamily: systemFont }}>PENALTY</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setExtrasSheetVisible(false);
                      handleRecordBall(0, null, false, 'penalty');
                    }}
                    style={{ minHeight: 46, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ color: '#475569', fontSize: 13, fontWeight: fontWeights.bold, fontFamily: systemFont }}>+5 PENALTY</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal
          visible={playingXiVisible}
          animationType="slide"
          presentationStyle="fullScreen"
          transparent={false}
          statusBarTranslucent
          navigationBarTranslucent
          onRequestClose={() => setPlayingXiVisible(false)}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            <View style={{ minHeight: 60, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#CBD5E1' }}>
              <TouchableOpacity
                onPress={() => setPlayingXiVisible(false)}
                style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="arrow-back" size={22} color="#0F172A" />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#0F172A', fontSize: typeScale.pageTitle, fontWeight: fontWeights.bold, fontFamily: systemFont }}>PLAYING XI</Text>
                <Text style={{ color: '#64748B', fontSize: 10, fontWeight: fontWeights.bold, marginTop: 2, fontFamily: systemFont }} numberOfLines={1}>
                  {playingXiMatchTitle}
                </Text>
              </View>
            </View>

            <View style={{ backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#CBD5E1' }}>
              <View style={{ position: 'relative', minHeight: 54, width: '100%', flexDirection: 'row', alignItems: 'stretch', justifyContent: 'space-evenly' }}>
                {playingXiTabs.map(team => {
                  const active = playingXiTeamTab === team.id;
                  return (
                    <TouchableOpacity
                      key={team.id}
                      onLayout={(event) => capturePlayingXiTabLayout(team.id, event)}
                      onPress={() => changePlayingXiTeam(team.id)}
                      style={{ maxWidth: (screenWidth - 48) / 2, minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }}
                    >
                      <MaterialCommunityIcons name="account-group" size={18} color={active ? '#0284C7' : '#94A3B8'} />
                      <Text style={{ flexShrink: 1, color: active ? '#0F172A' : '#64748B', fontSize: 12, fontWeight: active ? fontWeights.bold : '700', fontFamily: systemFont }} numberOfLines={1}>
                        {team.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                {playingXiTabsMeasured ? (
                  <Animated.View
                    pointerEvents="none"
                    style={{ position: 'absolute', left: 0, bottom: 0, width: 100, height: 3, transform: [{ translateX: playingXiIndicatorTranslateX }] }}
                  >
                    <Animated.View style={{ flex: 1, borderRadius: 2, backgroundColor: '#0284C7', transform: [{ scaleX: playingXiIndicatorScaleX }] }} />
                  </Animated.View>
                ) : null}
              </View>
            </View>

            <Animated.ScrollView
              ref={playingXiPagerRef}
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
                [{ nativeEvent: { contentOffset: { x: playingXiPagerScrollX } } }],
                { useNativeDriver: true }
              )}
              onMomentumScrollEnd={handlePlayingXiPagerEnd}
              onLayout={() => {
                const offset = (playingXiTeamTab - 1) * screenWidth;
                playingXiPagerRef.current?.scrollTo({ x: offset, animated: false });
                playingXiPagerScrollX.setValue(offset);
              }}
              style={{ flex: 1 }}
            >
              {playingXiTabs.map(team => (
                <View key={team.id} style={{ width: screenWidth, flex: 1 }}>
                  <ScrollView
                    style={{ flex: 1 }}
                    contentInsetAdjustmentBehavior="automatic"
                    contentContainerStyle={{ paddingBottom: 24, backgroundColor: '#FFFFFF' }}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled
                  >
                    <View style={{ minHeight: 42, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
                      <Text style={{ color: '#64748B', fontSize: 10, fontWeight: fontWeights.bold, fontFamily: systemFont }}>SQUAD</Text>
                      <Text style={{ color: '#64748B', fontSize: 10, fontWeight: fontWeights.bold, fontFamily: systemFont }}>{team.roster.length} PLAYERS</Text>
                    </View>

                    {team.roster.map((playerName) => {
                      const playerProfile = MASTER_PLAYERS_DB.find(player => player.name === playerName);
                      return (
                        <View
                          key={`${team.id}-${playerName}`}
                          style={{
                            minHeight: 68,
                            paddingHorizontal: 16,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 12,
                            backgroundColor: '#FFFFFF',
                            borderBottomWidth: 1,
                            borderBottomColor: '#E8ECEF'
                          }}
                        >
                          <PlayerAvatar name={playerName} size={44} />
                          <Text
                            selectable
                            {...nameFitProps}
                            style={{ flex: 1, minWidth: 0, color: '#0F172A', fontSize: 14, lineHeight: 19, fontWeight: fontWeights.bold, fontFamily: systemFont }}
                          >
                            {playerName}
                          </Text>
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>
              ))}
            </Animated.ScrollView>
          </SafeAreaView>
        </Modal>

        <Modal
          visible={wicketEntryPending}
          animationType="slide"
          onRequestClose={() => pendingFielderDismissal ? setPendingFielderDismissal('') : cancelWicketEntry()}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
            <View style={{ minHeight: 58, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#CBD5E1' }}>
              <TouchableOpacity
                onPress={() => pendingFielderDismissal ? setPendingFielderDismissal('') : cancelWicketEntry()}
                style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name={pendingFielderDismissal ? 'arrow-back' : 'close'} size={22} color="#0F172A" />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#0F172A', fontSize: typeScale.pageTitle, fontWeight: fontWeights.bold, fontFamily: systemFont }}>
                  {pendingFielderDismissal === 'caught'
                    ? 'WHO TOOK THE CATCH?'
                    : pendingFielderDismissal === 'stumped'
                      ? 'WHO COMPLETED THE STUMPING?'
                      : 'HOW WAS THE BATTER OUT?'}
                </Text>
                <Text style={{ color: '#64748B', fontSize: 11, fontWeight: fontWeights.bold, marginTop: 2, fontFamily: systemFont }} numberOfLines={1}>
                  {pendingFielderDismissal
                    ? `${curInning?.bowlingTeam?.name || 'Bowling team'} fielders`
                    : curInning?.striker?.name || 'Striker'}
                </Text>
              </View>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
              {pendingFielderDismissal ? (
                <View style={{ marginTop: 12, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#CBD5E1' }}>
                  <View style={{ minHeight: 42, paddingHorizontal: 16, justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
                    <Text style={{ color: '#64748B', fontSize: 10, fontWeight: fontWeights.bold, fontFamily: systemFont }}>
                      {pendingFielderDismissal === 'caught' ? 'FIELDER' : 'WICKETKEEPER / FIELDER'}
                    </Text>
                  </View>
                  {getBowlingRoster().map((name, index) => (
                    <TouchableOpacity
                      key={name}
                      onPress={() => handleSelectDismissalFielder(name)}
                      style={{ minHeight: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 11, borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}
                    >
                      <Text style={{ width: 22, color: '#94A3B8', fontSize: 11, fontWeight: fontWeights.bold, fontVariant: ['tabular-nums'], fontFamily: systemFont }}>{index + 1}</Text>
                      <Text selectable {...nameFitProps} style={{ flex: 1, minWidth: 0, color: '#0F172A', fontSize: 14, fontWeight: fontWeights.bold, fontFamily: systemFont }}>{name}</Text>
                      {name === curInning?.bowler?.name ? (
                        <Text style={{ color: '#0284C7', fontSize: 9, fontWeight: fontWeights.bold, fontFamily: systemFont }}>BOWLER</Text>
                      ) : null}
                      <Ionicons name="chevron-forward" size={17} color="#94A3B8" />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={{ marginTop: 12, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#CBD5E1' }}>
                  <View style={{ minHeight: 42, paddingHorizontal: 16, justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
                    <Text style={{ color: '#64748B', fontSize: 10, fontWeight: fontWeights.bold, fontFamily: systemFont }}>DISMISSAL</Text>
                  </View>
                  {WICKET_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      onPress={() => handleSelectWicketType(type.id)}
                      style={{ minHeight: 58, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}
                    >
                      <Ionicons name={type.icon} size={19} color={type.id === 'runOut' ? '#E11D48' : '#475569'} />
                      <Text style={{ flex: 1, color: '#0F172A', fontSize: 14, fontWeight: fontWeights.bold, fontFamily: systemFont }}>{type.label}</Text>
                      <Ionicons name="chevron-forward" size={17} color="#94A3B8" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>

        <Modal visible={runOutPending} animationType="slide" onRequestClose={cancelWicketEntry}>
          <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
            <View style={{ minHeight: 58, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#CBD5E1' }}>
              <TouchableOpacity onPress={cancelWicketEntry} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="close" size={22} color="#0F172A" />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#0F172A', fontSize: typeScale.pageTitle, fontWeight: fontWeights.bold, fontFamily: systemFont }}>RUN OUT</Text>
                <Text style={{ color: '#64748B', fontSize: 11, fontWeight: fontWeights.bold, marginTop: 2, fontFamily: systemFont }}>Record wicket details</Text>
              </View>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
              <View style={{ marginTop: 12, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#CBD5E1' }}>
                <View style={{ minHeight: 42, paddingHorizontal: 16, justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
                  <Text style={{ color: '#64748B', fontSize: 10, fontWeight: fontWeights.bold, fontFamily: systemFont }}>BATTER OUT</Text>
                </View>
                {[
                  { id: 'striker', label: 'Striker', name: curInning?.striker?.name },
                  { id: 'nonStriker', label: 'Non-striker', name: curInning?.nonStriker?.name }
                ].filter(item => item.name).map((item) => {
                  const selected = runOutDismissed === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setRunOutDismissed(item.id)}
                      style={{ minHeight: 58, paddingHorizontal: 16, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 11, borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: selected ? '#FFF1F2' : '#FFFFFF' }}
                    >
                      <MaterialCommunityIcons name="cricket" size={18} color={selected ? '#E11D48' : '#64748B'} />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text selectable {...nameFitProps} style={{ color: '#0F172A', fontSize: 14, fontWeight: selected ? fontWeights.bold : '700', fontFamily: systemFont }}>{item.name}</Text>
                        <Text style={{ color: selected ? '#E11D48' : '#94A3B8', fontSize: 9, fontWeight: fontWeights.bold, marginTop: 3, fontFamily: systemFont }}>{item.label.toUpperCase()}</Text>
                      </View>
                      <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={19} color={selected ? '#E11D48' : '#CBD5E1'} />
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={{ marginTop: 12, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#CBD5E1' }}>
                <View style={{ minHeight: 42, paddingHorizontal: 16, justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
                  <Text style={{ color: '#64748B', fontSize: 10, fontWeight: fontWeights.bold, fontFamily: systemFont }}>WICKET BROKEN AT</Text>
                </View>
                {[
                  { id: 'striker', label: 'Striker End' },
                  { id: 'nonStriker', label: 'Non-striker End' }
                ].map((item) => {
                  const selected = runOutEnd === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setRunOutEnd(item.id)}
                      style={{ minHeight: 54, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 11, borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: selected ? '#F0F9FF' : '#FFFFFF' }}
                    >
                      <Ionicons name="flag-outline" size={18} color={selected ? '#0284C7' : '#64748B'} />
                      <Text style={{ flex: 1, color: '#0F172A', fontSize: 14, fontWeight: selected ? fontWeights.bold : '700', fontFamily: systemFont }}>{item.label}</Text>
                      <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={19} color={selected ? '#0284C7' : '#CBD5E1'} />
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={{ marginTop: 12, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#CBD5E1' }}>
                <View style={{ minHeight: 42, paddingHorizontal: 16, justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
                  <Text style={{ color: '#64748B', fontSize: 10, fontWeight: fontWeights.bold, fontFamily: systemFont }}>COMPLETED RUNS</Text>
                </View>
                <View style={{ minHeight: 58, flexDirection: 'row', alignItems: 'stretch' }}>
                  <TouchableOpacity
                    disabled={runOutRuns === 0}
                    onPress={() => setRunOutRuns(value => Math.max(0, value - 1))}
                    style={{ flex: 1, alignItems: 'center', justifyContent: 'center', opacity: runOutRuns === 0 ? 0.35 : 1 }}
                  >
                    <Ionicons name="remove" size={22} color="#0F172A" />
                  </TouchableOpacity>
                  <View style={{ flex: 1.4, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' }}>
                    <Text style={{ color: '#0F172A', fontSize: typeScale.keyAction, fontWeight: fontWeights.bold, fontVariant: ['tabular-nums'], fontFamily: systemFont }}>{runOutRuns}</Text>
                    <Text style={{ color: '#64748B', fontSize: 9, fontWeight: fontWeights.bold, marginTop: 2, fontFamily: systemFont }}>RUNS</Text>
                  </View>
                  <TouchableOpacity onPress={() => setRunOutRuns(value => value + 1)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="add" size={22} color="#0F172A" />
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            <View style={{ paddingHorizontal: 14, paddingVertical: 11, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#CBD5E1' }}>
              <TouchableOpacity
                disabled={!runOutDismissed || !runOutEnd}
                onPress={handleConfirmRunOut}
                style={[styles.nextBtn, { borderRadius: 6, backgroundColor: runOutDismissed && runOutEnd ? '#E11D48' : '#94A3B8' }]}
              >
                <Ionicons name="checkmark-circle-outline" size={17} color="#FFFFFF" />
                <Text style={styles.nextBtnText}>CONFIRM RUN OUT</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>

        {/* WICKET MODAL â€” FULL SCREEN SPACIOUS SELECTION SCREEN */}
        <Modal visible={wicketPending} animationType="slide" onRequestClose={() => setWicketPending(false)}>
          <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
            {/* Top Navigation Bar */}
            <View style={{ backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ fontSize: typeScale.pageTitle, fontWeight: fontWeights.bold, color: '#0F172A', fontFamily: systemFont }}>SELECT NEW BATTER</Text>
                <Text style={{ fontSize: 12, color: '#64748B', fontWeight: fontWeights.medium, marginTop: 2, fontFamily: systemFont }}>
                  {curInning?.pendingBatterEnd === 'nonStriker' ? 'Will join at non-striker end' : 'Will take strike'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setWicketPending(false)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' }}
              >
                <Ionicons name="close" size={16} color="#0F172A" />
                <Text style={{ color: '#0F172A', fontWeight: fontWeights.bold, fontSize: 12, fontFamily: systemFont }}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 14 }} showsVerticalScrollIndicator={false}>
              {/* Squad Header Pill */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', px: 2 }}>
                <Text style={{ fontSize: 11, fontWeight: fontWeights.bold, color: '#64748B', letterSpacing: 0.5, fontFamily: systemFont }}>PLAYING SQUAD</Text>
                <Text style={{ fontSize: 11, fontWeight: fontWeights.semibold, color: '#94A3B8', fontFamily: systemFont }}>TAP TO SEND IN</Text>
              </View>

              {/* Full Squad Minimal Player Cards List */}
              <View style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
                {getAvailableBatsmen().map((name, idx, arr) => {
                  const playerObj = MASTER_PLAYERS_DB.find(p => p.name === name);
                  const avatar = playerObj?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80';

                  return (
                    <TouchableOpacity
                      key={name}
                      style={{
                        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14,
                        borderBottomWidth: idx < arr.length - 1 ? 1 : 0, borderBottomColor: '#E2E8F0',
                        backgroundColor: '#FFFFFF'
                      }}
                      onPress={() => selectNewBatsman(name)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, paddingRight: 10 }}>
                        <Image source={{ uri: avatar }} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#F1F5F9' }} />
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text selectable {...nameFitProps} style={{ fontSize: 16, fontWeight: fontWeights.bold, color: '#0F172A', fontFamily: systemFont }}>{name}</Text>
                        </View>
                      </View>
                      <View style={{ backgroundColor: '#0F172A', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: fontWeights.bold, fontFamily: systemFont }}>Select</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Or Add Custom Player */}
              <View style={{ gap: 6, marginTop: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: fontWeights.bold, color: '#64748B', fontFamily: systemFont }}>ADD NEW PLAYER</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    style={[styles.textInput, { flex: 1, backgroundColor: '#FFFFFF' }]}
                    placeholder="Type new player name..."
                    placeholderTextColor="#94A3B8"
                    value={newBatsmanName}
                    onChangeText={setNewBatsmanName}
                  />
                  <TouchableOpacity
                    style={{ backgroundColor: newBatsmanName.trim() ? '#0F172A' : '#94A3B8', paddingHorizontal: 16, borderRadius: 10, justifyContent: 'center', alignItems: 'center' }}
                    onPress={handleNewBatsman}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: fontWeights.bold, fontSize: 13, fontFamily: systemFont }}>Add & Select</Text>
                  </TouchableOpacity>
                </View>
              </View>

            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* NEXT BOWLER MODAL â€” FULL SCREEN SPACIOUS SELECTION SCREEN */}
        <Modal visible={bowlerChangePending} animationType="slide" onRequestClose={() => setBowlerChangePending(false)}>
          <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
            {/* Top Navigation Bar */}
            <View style={{ backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ fontSize: typeScale.pageTitle, fontWeight: fontWeights.bold, color: '#0F172A', fontFamily: systemFont }}>SELECT NEXT BOWLER</Text>
                <Text style={{ fontSize: 12, color: '#64748B', fontWeight: fontWeights.medium, marginTop: 2, fontFamily: systemFont }}>
                  Inning {activeMatch?.inning} - {curInning?.bowlingTeam?.name || 'Bowling Team'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setBowlerChangePending(false)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' }}
              >
                <Ionicons name="close" size={16} color="#0F172A" />
                <Text style={{ color: '#0F172A', fontWeight: fontWeights.bold, fontSize: 12, fontFamily: systemFont }}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 14 }} showsVerticalScrollIndicator={false}>
              {/* Squad Header Pill */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', px: 2 }}>
                <Text style={{ fontSize: 11, fontWeight: fontWeights.bold, color: '#64748B', letterSpacing: 0.5, fontFamily: systemFont }}>BOWLING SQUAD</Text>
                <Text style={{ fontSize: 11, fontWeight: fontWeights.semibold, color: '#94A3B8', fontFamily: systemFont }}>TAP TO SELECT</Text>
              </View>

              {/* Full Squad Minimal Player Cards List */}
              <View style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
                {getAvailableBowlers().map((name, idx, arr) => {
                  const playerObj = MASTER_PLAYERS_DB.find(p => p.name === name);
                  const avatar = playerObj?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80';

                  return (
                    <TouchableOpacity
                      key={name}
                      style={{
                        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14,
                        borderBottomWidth: idx < arr.length - 1 ? 1 : 0, borderBottomColor: '#E2E8F0',
                        backgroundColor: '#FFFFFF'
                      }}
                      onPress={() => {
                        if ((curInning?.currentOverBalls || []).length > 0 && !curInning?.isOverComplete) {
                          Alert.alert('Change Bowler', 'Normal bowler change is allowed only after the over is complete.');
                          return;
                        }
                        setActiveMatch(prev => {
                          const innings = prev.innings.map(x => ({ ...x }));
                          const inn = { ...innings[prev.inning - 1] };
                          if ((inn.currentOverBalls || []).length > 0 && !inn.isOverComplete) {
                            Alert.alert('Change Bowler', 'Normal bowler change is allowed only after the over is complete.');
                            return prev;
                          }
                          const savedBowlerFigure = getBowlerFigureFromInning(inn, name);
                          inn.bowlingStats = { ...(inn.bowlingStats || {}), [name]: savedBowlerFigure };
                          inn.bowler = {
                            name,
                            runs: savedBowlerFigure.runs,
                            wickets: savedBowlerFigure.wickets,
                            overs: savedBowlerFigure.overs
                          };
                          inn.bowlerLegalBalls = savedBowlerFigure.balls;
                          innings[prev.inning - 1] = inn;
                          return { ...prev, innings };
                        });
                        setNextBowlerName('');
                        setBowlerChangePending(false);
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, paddingRight: 10 }}>
                        <Image source={{ uri: avatar }} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#F1F5F9' }} />
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text selectable {...nameFitProps} style={{ fontSize: 16, fontWeight: fontWeights.bold, color: '#0F172A', fontFamily: systemFont }}>{name}</Text>
                        </View>
                      </View>
                      <View style={{ backgroundColor: '#0F172A', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: fontWeights.bold, fontFamily: systemFont }}>Select</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Or Add Custom Bowler */}
              <View style={{ gap: 6, marginTop: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: fontWeights.bold, color: '#64748B', fontFamily: systemFont }}>ADD NEW BOWLER</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    style={[styles.textInput, { flex: 1, backgroundColor: '#FFFFFF' }]}
                    placeholder="Type bowler name..."
                    placeholderTextColor="#94A3B8"
                    value={nextBowlerName}
                    onChangeText={setNextBowlerName}
                  />
                  <TouchableOpacity
                    style={{ backgroundColor: nextBowlerName.trim() ? '#0F172A' : '#94A3B8', paddingHorizontal: 16, borderRadius: 10, justifyContent: 'center', alignItems: 'center' }}
                    onPress={handleNewBowler}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: fontWeights.bold, fontSize: 13, fontFamily: systemFont }}>Add & Select</Text>
                  </TouchableOpacity>
                </View>
              </View>

            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* EDIT SQUAD MODAL */}
        {isEditSquadModalOpen && (
          <Modal visible animationType="slide" transparent onRequestClose={() => setIsEditSquadModalOpen(false)}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
              <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, gap: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: fontWeights.bold, color: '#0F172A', fontFamily: systemFont }}>Edit Squad / Add Sub Player</Text>
                <TextInput style={styles.textInput} placeholder="New player name..." placeholderTextColor="#94A3B8" value={midMatchNewPlayer} onChangeText={setMidMatchNewPlayer} />
                <TouchableOpacity style={styles.nextBtn} onPress={() => {
                  if (midMatchNewPlayer.trim()) {
                    setTeam1Roster(p => [...p, midMatchNewPlayer.trim()]);
                    setMidMatchNewPlayer('');
                  }
                  setIsEditSquadModalOpen(false);
                }}>
                  <Text style={styles.nextBtnText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsEditSquadModalOpen(false)} style={{ alignItems: 'center', padding: 10 }}>
                  <Text style={{ color: '#64748B', fontWeight: fontWeights.bold, fontFamily: systemFont }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        {/* STICKY BOTTOM NAVIGATION BAR */}
        {currentScreen === 'home' ? (
          <View style={{
            flexDirection: 'row',
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#E2E8F0',
            paddingTop: 8,
            paddingBottom: 12
          }}>
            {[
              { id: 'home', label: 'Home', activeIcon: 'home', inactiveIcon: 'home-outline' },
              { id: 'matches', label: 'Matches', activeIcon: 'trophy', inactiveIcon: 'trophy-outline' },
              { id: 'weather', label: 'Weather', activeIcon: 'cloudy-night', inactiveIcon: 'cloudy-night-outline' },
              { id: 'profile', label: 'Profile', activeIcon: 'person', inactiveIcon: 'person-outline' }
            ].map(t => {
              const isActive = bottomNavTab === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => setBottomNavTab(t.id)}
                  activeOpacity={0.7}
                  style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 }}
                >
                  <Ionicons
                    name={isActive ? t.activeIcon : t.inactiveIcon}
                    size={24}
                    color={isActive ? '#0284C7' : '#64748B'}
                  />
                  <Text style={{
                    fontSize: 11,
                    fontWeight: isActive ? fontWeights.bold : '600',
                    color: isActive ? '#0284C7' : '#64748B',
                    fontFamily: systemFont
                  }}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}
      </View>
    </SafeAreaProvider>
  );
}

// â”€â”€â”€ STYLES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF', fontFamily: systemFont },
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoImg: { width: 30, height: 30, borderRadius: 8 },
  logoText: { fontSize: 18, fontWeight: fontWeights.bold, color: '#0F172A', fontFamily: systemFont },
  logoAccent: { color: '#0284C7' },
  startBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#0284C7', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  startBtnText: { fontSize: 11, fontWeight: fontWeights.bold, color: '#FFFFFF', fontFamily: systemFont },
  searchContainer: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 6, backgroundColor: '#FFFFFF' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1.5, borderColor: '#CBD5E1' },
  searchInput: { flex: 1, paddingHorizontal: 10, paddingVertical: 9, fontSize: 13, fontWeight: fontWeights.semibold, color: '#0F172A', fontFamily: systemFont },
  tabsRow: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', justifyContent: 'space-around' },
  tabBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 10, paddingHorizontal: 8 },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: '#0284C7' },
  tabText: { fontSize: 11, fontWeight: fontWeights.semibold, color: '#64748B', fontFamily: systemFont },
  tabTextActive: { color: '#0284C7', fontWeight: fontWeights.bold },
  tabContent: { padding: 12, gap: 10 },
  sectionLabel: { fontSize: 10, fontWeight: fontWeights.bold, color: '#64748B', letterSpacing: 0.8, marginBottom: 6, fontFamily: systemFont },
  matchCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  matchCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  matchCardTitle: { fontSize: 11, fontWeight: fontWeights.semibold, color: '#64748B', flex: 1, fontFamily: systemFont },
  liveDot: { backgroundColor: '#FEF3C7', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 },
  liveDotText: { fontSize: 10, fontWeight: fontWeights.bold, color: '#B45309', fontFamily: systemFont },
  matchScore: { fontSize: typeScale.score, fontWeight: fontWeights.bold, color: '#0F172A', fontFamily: systemFont },
  matchOvers: { fontSize: 14, color: '#64748B', fontWeight: fontWeights.semibold, fontFamily: systemFont },
  idleCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 22, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', gap: 8 },
  idleIconBg: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center' },
  idleTitle: { fontSize: 15, fontWeight: fontWeights.bold, color: '#0F172A', fontFamily: systemFont },
  idleSub: { fontSize: 11, color: '#64748B', fontWeight: fontWeights.medium, textAlign: 'center', fontFamily: systemFont },
  idleBtn: { backgroundColor: '#0284C7', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginTop: 4 },
  idleBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: fontWeights.bold, fontFamily: systemFont },
  subFilterRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  subFilterBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#CBD5E1' },
  subFilterActive: { backgroundColor: '#0284C7', borderColor: '#0284C7' },
  subFilterText: { fontSize: 13.5, fontWeight: fontWeights.bold, color: '#475569', fontFamily: systemFontBold },
  rankItem: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', gap: 10 },
  rankBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E0F2FE', justifyContent: 'center', alignItems: 'center' },
  rankBadgeText: { color: '#0369A1', fontWeight: fontWeights.bold, fontSize: 11, fontFamily: systemFont },
  rankName: { fontSize: 13, fontWeight: fontWeights.bold, color: '#0F172A', fontFamily: systemFont },
  rankSub: { fontSize: 10, color: '#64748B', fontWeight: fontWeights.semibold, marginTop: 1, fontFamily: systemFont },
  rankVal: { fontSize: 13, fontWeight: fontWeights.bold, color: '#0284C7', fontFamily: systemFont },
  fullPage: { flex: 1, backgroundColor: '#FFFFFF' },
  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backBtnText: { fontSize: 13, fontWeight: fontWeights.bold, color: '#0F172A', fontFamily: systemFont },
  pageTitle: { fontSize: 13, fontWeight: fontWeights.bold, color: '#0284C7', fontFamily: systemFont },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', gap: 10 },
  formCardTitle: { fontSize: 15, fontWeight: fontWeights.bold, color: '#0F172A', fontFamily: systemFont },
  inputLabel: { fontSize: 11, fontWeight: fontWeights.bold, color: '#475569', fontFamily: systemFont },
  textInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10, fontSize: 13, fontWeight: fontWeights.semibold, color: '#0F172A', fontFamily: systemFont },
  squadBox: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#E2E8F0', gap: 8 },
  squadBoxTitle: { fontSize: 10, fontWeight: fontWeights.bold, color: '#0284C7', fontFamily: systemFont },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { backgroundColor: '#E0F2FE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  chipText: { fontSize: 11, fontWeight: fontWeights.bold, color: '#0369A1', fontFamily: systemFont },
  addPlayerRow: { flexDirection: 'row', gap: 8 },
  addPlayerInput: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 11, fontWeight: fontWeights.semibold, color: '#0F172A', fontFamily: systemFont },
  addPlayerBtn: { backgroundColor: '#0284C7', width: 34, height: 34, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#0284C7', paddingVertical: 12, borderRadius: 12 },
  nextBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: fontWeights.bold, fontFamily: systemFont },
  tossBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, backgroundColor: '#F8FAFC', borderRadius: 10, borderWidth: 1, borderColor: '#CBD5E1' },
  tossBtnActive: { backgroundColor: '#0284C7', borderColor: '#0284C7' },
  tossBtnText: { fontSize: 12, fontWeight: fontWeights.bold, color: '#475569', fontFamily: systemFont },
  tossSummary: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0F9FF', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#BAE6FD' },
  tossSummaryText: { fontSize: 12, fontWeight: fontWeights.bold, color: '#0369A1', flex: 1, fontFamily: systemFont },
  playerGridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  playerSelectCard: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F8FAFC', borderRadius: 10, padding: 9, borderWidth: 1.5, borderColor: '#E2E8F0' },
  playerSelectCardActive: { backgroundColor: '#F0F9FF', borderColor: '#0284C7' },
  playerSelectText: { fontSize: 11, fontWeight: fontWeights.bold, color: '#0F172A', fontFamily: systemFont },
  scoreCard: { backgroundColor: '#1E293B', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#334155' },
  scoreCardTitle: { fontSize: 11, fontWeight: fontWeights.semibold, color: '#94A3B8', fontFamily: systemFont },
  bigRuns: { fontSize: typeScale.scorerScore, fontWeight: fontWeights.bold, color: '#FFFFFF', fontFamily: systemFont },
  bigOvers: { fontSize: 16, fontWeight: fontWeights.semibold, color: '#94A3B8', fontFamily: systemFont },
  ballCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' },
  ballCircleText: { fontSize: 10, fontWeight: fontWeights.bold, color: '#FFFFFF', fontFamily: systemFont },
  editSquadBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#0F172A', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  editSquadBtnText: { color: '#38BDF8', fontSize: 10, fontWeight: fontWeights.bold, fontFamily: systemFont },
  playerCard: { backgroundColor: '#1E293B', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#334155', gap: 8 },
  playerRowActive: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#0F172A', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#0284C7' },
  playerActiveName: { fontSize: 13, fontWeight: fontWeights.bold, color: '#FFFFFF', fontFamily: systemFont },
  playerStatsSub: { fontSize: 10, color: '#94A3B8', fontWeight: fontWeights.medium, marginTop: 1, fontFamily: systemFont },
  playerScore: { fontSize: 18, fontWeight: fontWeights.bold, color: '#FFFFFF', fontFamily: systemFont },
  playerBalls: { fontSize: 12, color: '#94A3B8', fontFamily: systemFont },
  keypadLabel: { color: '#38BDF8', fontSize: 10, fontWeight: fontWeights.bold, letterSpacing: 0.8, fontFamily: systemFont },
  undoBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#78350F', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#F59E0B' },
  undoBtnText: { color: '#FDE68A', fontWeight: fontWeights.bold, fontSize: 10, fontFamily: systemFont },
  keypadRow: { flexDirection: 'row', gap: 10 },
  keyBtn: { flex: 1, backgroundColor: '#1E293B', paddingVertical: 20, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#334155' },
  keyBtnText: { color: '#FFFFFF', fontSize: typeScale.keyAction, fontWeight: fontWeights.bold, fontFamily: systemFont },
});
