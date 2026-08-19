import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import * as Speech from 'expo-speech';
import { systemFont, systemFontBold, fontWeights } from '../theme.js';
import { MASTER_PLAYERS_DB } from '../../mockData.js';

// ── Voice Announcements (Indian Female Voice Engine) ──────────────────────────
export const speakBall = (runs, extraType, isWicket) => {
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

export const speakScoreToken = (token) => {
  if (!token) return;
  const normalized = String(token);
  const extraType = isWideToken(normalized) ? 'wd' : isNoBallToken(normalized) ? 'nb' : null;
  speakBall(getTokenNumber(normalized), extraType, isWicketToken(normalized));
};

export const formatScoreTokenForPublic = (token) => {
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

export const makeLastDelivery = ({ ballLabel, runs, addedRuns, extraType, byeType, isWicket }) => {
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

// ── Sample Data Constants ───────────────────────────────────────────────────
export const FINISHED_MATCHES_DB = [];
export const MATCH_SYNC_URL = process.env.EXPO_PUBLIC_MATCH_SYNC_URL || '';
export const STORAGE_KEY = 'cricflow.mobile.match-state.v2';
export const MAX_MATCH_OVERS = 50;

export const computeLeaderboardRankings = (finishedMatches = [], localPlayersDb = []) => {
  const playerStatsMap = {};

  const ensurePlayer = (rawName) => {
    if (!rawName || typeof rawName !== 'string') return null;
    const name = rawName.trim();
    if (!name) return null;
    const key = name.toLowerCase();
    if (!playerStatsMap[key]) {
      const dbFound = (localPlayersDb || []).find(p => p && p.name && p.name.trim().toLowerCase() === key);
      playerStatsMap[key] = {
        name,
        role: dbFound?.role || 'All-Rounder',
        photoUrl: dbFound?.photoUrl || '',
        city: dbFound?.city || dbFound?.location || '',
        runs: 0,
        balls: 0,
        wickets: 0,
        bowlingRuns: 0,
        overs: 0,
        fours: 0,
        sixes: 0,
        matches: 0,
        highScore: 0
      };
    }
    return playerStatsMap[key];
  };

  (finishedMatches || []).forEach(match => {
    if (!match) return;
    const matchPlayers = new Set();

    [match.team1, match.team2].forEach(team => {
      if (!team) return;
      (team.batting || []).forEach(b => {
        const p = ensurePlayer(b.name);
        if (p) {
          matchPlayers.add(p.name.toLowerCase());
          p.runs += Number(b.runs || 0);
          p.balls += Number(b.balls || 0);
          p.fours += Number(b.fours || 0);
          p.sixes += Number(b.sixes || 0);
          if (Number(b.runs || 0) > p.highScore) p.highScore = Number(b.runs || 0);
        }
      });
      (team.bowling || []).forEach(bw => {
        const p = ensurePlayer(bw.name);
        if (p) {
          matchPlayers.add(p.name.toLowerCase());
          p.wickets += Number(bw.wickets || 0);
          p.bowlingRuns += Number(bw.runs || 0);
          p.overs += parseFloat(String(bw.overs || '0')) || 0;
        }
      });
    });

    matchPlayers.forEach(pKey => {
      if (playerStatsMap[pKey]) playerStatsMap[pKey].matches += 1;
    });
  });

  const allPlayers = Object.values(playerStatsMap);

  const topBatters = allPlayers
    .filter(p => p.runs > 0 || p.matches > 0)
    .sort((a, b) => b.runs - a.runs || b.balls - a.balls)
    .slice(0, 50)
    .map((p, index) => ({
      rank: index + 1,
      name: p.name,
      runs: p.runs,
      balls: p.balls,
      matches: p.matches,
      sr: p.balls > 0 ? ((p.runs / p.balls) * 100).toFixed(1) : '0.0',
      photoUrl: p.photoUrl,
      role: p.role,
      city: p.city || 'Local'
    }));

  const topBowlers = allPlayers
    .filter(p => p.wickets > 0 || p.overs > 0)
    .sort((a, b) => b.wickets - a.wickets || a.bowlingRuns - b.bowlingRuns)
    .slice(0, 50)
    .map((p, index) => ({
      rank: index + 1,
      name: p.name,
      wickets: p.wickets,
      overs: p.overs.toFixed(1),
      runs: p.bowlingRuns,
      econ: p.overs > 0 ? (p.bowlingRuns / p.overs).toFixed(2) : '0.00',
      photoUrl: p.photoUrl,
      role: p.role,
      city: p.city || 'Local'
    }));

  const topAllRounders = allPlayers
    .map(p => ({
      ...p,
      pts: p.runs + (p.wickets * 25)
    }))
    .filter(p => p.pts > 0 || p.matches > 0)
    .sort((a, b) => b.pts - a.pts)
    .slice(0, 50)
    .map((p, index) => ({
      rank: index + 1,
      name: p.name,
      pts: `${p.pts} Pts`,
      runs: p.runs,
      wickets: p.wickets,
      matches: p.matches,
      photoUrl: p.photoUrl,
      role: p.role,
      city: p.city || 'Local'
    }));

  return { topBatters, topBowlers, topAllRounders };
};

// ── Token Parsers ───────────────────────────────────────────────────────────
export const getTokenNumber = (token) => {
  const value = parseInt(String(token || '').replace(/[^\d]/g, '') || '0', 10);
  return Number.isFinite(value) ? value : 0;
};

export const isWideToken = (token) => /Wd$/i.test(String(token || ''));
export const isNoBallToken = (token) => /Nb$/i.test(String(token || ''));
export const isPenaltyToken = (token) => /Pen$/i.test(String(token || ''));
export const isByeToken = (token) => /\d+B$/i.test(String(token || ''));
export const isLegByeToken = (token) => /\d+LB$/i.test(String(token || ''));
export const isWicketToken = (token) => /^(\d+)?W$/i.test(String(token || ''));
export const isLegalToken = (token) => !isWideToken(token) && !isNoBallToken(token) && !isPenaltyToken(token);

export const getTokenTeamRuns = (token) => {
  if (!token) return 0;
  if (isPenaltyToken(token)) return 5;
  if (isWideToken(token) || isNoBallToken(token)) return getTokenNumber(token) + 1;
  if (isByeToken(token) || isLegByeToken(token)) return getTokenNumber(token) || 1;
  return getTokenNumber(token);
};

export const getTokenBowlerRuns = (token) => {
  if (isByeToken(token) || isLegByeToken(token) || isPenaltyToken(token)) return 0;
  return getTokenTeamRuns(token);
};

export const sumDeliveryTokens = (tokens = [], runResolver = getTokenTeamRuns) =>
  tokens.reduce((total, token) => total + runResolver(token), 0);

export const countWicketTokens = (tokens = []) =>
  tokens.filter(token => isWicketToken(token)).length;

export const countLegalTokens = (tokens = []) =>
  tokens.filter(token => isLegalToken(token)).length;

export const getCurrentOverNumber = (inning) => {
  const legalBalls = inning?.totalLegalBalls || 0;
  if (inning?.isOverComplete && legalBalls > 0) return Math.ceil(legalBalls / 6);
  return Math.floor(legalBalls / 6) + 1;
};

export const getBallTokenVisual = (token, variant = 'default') => {
  const normalized = String(token || '');
  const isStrong = isWicketToken(normalized) || normalized === '4' || normalized === '6';
  if (isWicketToken(normalized)) return { backgroundColor: '#E11D48', textColor: '#FFFFFF', borderWidth: 0 };
  if (normalized === '4') return { backgroundColor: variant === 'liveStrip' ? '#0E8CAB' : '#0284C7', textColor: '#FFFFFF', borderWidth: 0 };
  if (normalized === '6') return { backgroundColor: variant === 'liveStrip' ? '#2F7D1B' : '#7C3AED', textColor: '#FFFFFF', borderWidth: 0 };
  if (normalized === '0' && variant === 'liveStrip') return { backgroundColor: '#FFFFFF', textColor: '#0F172A', borderWidth: 1 };
  return { backgroundColor: '#F1F5F9', textColor: '#334155', borderWidth: isStrong ? 0 : 1 };
};

export const renderBallTokenChip = (token, index, size = 24, variant = 'default', keyPrefix = 'ball') => {
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

export const renderEmptyBallSlot = (index, size = 28) => (
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

export const renderBallTimeline = (balls = [], { size = 30, emptyText = 'Over starting...', contentPaddingRight = 16, startAtEnd = false, lockHorizontalGesture = true } = {}) => {
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

export const renderCompactOverTimeline = ({
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

export const getDisplayOverHistory = (inning) => {
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

export const sanitizeMatchForStorage = (match) => {
  if (!match) return null;
  const cleanMatch = JSON.parse(JSON.stringify(match));
  delete cleanMatch.pendingPublicEvent;
  delete cleanMatch._pendingWicket;
  delete cleanMatch._pendingNewBowler;
  return cleanMatch;
};

export const normalizeOversInput = (value) => {
  const parsed = Number(String(value || '').trim());
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_MATCH_OVERS) return null;
  return parsed;
};

export const getTossWinnerName = (match) => {
  if (match?.tossWinner) return match.tossWinner;
  const tossText = String(match?.tossResult || '');
  return tossText.split(/ won/i)[0] || '';
};

export const getTossDecisionText = (match, fallback = 'BAT') => {
  const raw = String(match?.tossDecision || match?.tossResult || '').toUpperCase();
  if (raw.includes('BOWL')) return 'BOWL';
  if (raw.includes('BAT')) return 'BAT';
  return fallback;
};

export const getSearchBlob = (value) => {
  try {
    return JSON.stringify(value || {}).toLowerCase();
  } catch (error) {
    return '';
  }
};

export const getCleanPlayerNames = (names = []) => {
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

export const makeTeamCode = (name = '') => {
  const clean = String(name || '').trim();
  if (!clean) return 'TM';
  if (clean.length <= 4) return clean.toUpperCase();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return words.slice(0, 3).map(word => word[0]).join('').toUpperCase();
  return clean.replace(/[^a-z0-9]/gi, '').slice(0, 3).toUpperCase() || 'TM';
};

export const getTeamShortCode = (team, fallbackName = '') => {
  const savedCode = String(team?.code || '').trim();
  return savedCode || makeTeamCode(team?.name || fallbackName);
};

export const hasDuplicateNames = (names = []) => {
  const normalized = names.map(name => String(name || '').trim().toLowerCase()).filter(Boolean);
  return new Set(normalized).size !== normalized.length;
};

export const makeInning = (battingTeamName, bowlingTeamName) => ({
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
  status: 'active',
});

export const formatOvers = (legalBalls) => {
  const ov = Math.floor(legalBalls / 6);
  const b = legalBalls % 6;
  return `${ov}.${b}`;
};

export const parseOversToBalls = (overs) => {
  const [overPart, ballPart = '0'] = String(overs || '0.0').split('.');
  const oversNumber = Number.parseInt(overPart, 10) || 0;
  const ballsNumber = Number.parseInt(ballPart, 10) || 0;
  return (oversNumber * 6) + Math.min(Math.max(ballsNumber, 0), 5);
};

export const makeBowlingFigure = ({ name, balls = 0, runs = 0, wickets = 0 } = {}) => ({
  name: name || '',
  balls: Number(balls) || 0,
  runs: Number(runs) || 0,
  wickets: Number(wickets) || 0,
  overs: formatOvers(Number(balls) || 0)
});

export const normalizeBowlingFigure = (figure = {}, fallbackName = '') => makeBowlingFigure({
  name: figure.name || fallbackName,
  balls: figure.balls ?? figure.legalBalls ?? parseOversToBalls(figure.overs),
  runs: figure.runs,
  wickets: figure.wickets
});

export const getInningBowlingRows = (inning) => {
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

export const getBowlerFigureFromInning = (inning, name) => {
  const rows = getInningBowlingRows(inning);
  return rows.find(row => row.name === name) || makeBowlingFigure({ name });
};

export const formatOrdinal = (value) => {
  const number = Number(value) || 0;
  const mod100 = number % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${number}th`;
  if (number % 10 === 1) return `${number}st`;
  if (number % 10 === 2) return `${number}nd`;
  if (number % 10 === 3) return `${number}rd`;
  return `${number}th`;
};

export const formatMatchDateTime = (startedAt) => {
  if (!startedAt) return '';
  const date = new Date(startedAt);
  if (Number.isNaN(date.getTime())) return String(startedAt);
  return date.toLocaleString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

export const formatMatchDateLabel = (startedAt) => {
  if (!startedAt) return '';
  const date = new Date(startedAt);
  if (Number.isNaN(date.getTime())) return String(startedAt);
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export const buildFinishedMatch = (match, rosterByTeam = {}) => {
  const innings = match?.innings || [];
  const getRecordedBatters = (inning, roster = []) => {
    let rawBatters = [];
    if (Array.isArray(inning?.allBatters) && inning.allBatters.length > 0) {
      rawBatters = inning.allBatters;
    } else if (inning?.allBatters && typeof inning.allBatters === 'object') {
      rawBatters = Object.values(inning.allBatters);
    } else {
      rawBatters = [inning?.striker, inning?.nonStriker].filter(player => player?.name);
    }

    const recorded = rawBatters.map(player => ({
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

  const normalizeTeamName = (t) => {
    if (!t) return '';
    if (typeof t === 'string') return t.trim().toLowerCase();
    return (t.name || t.teamName || t.code || '').toString().trim().toLowerCase();
  };

  const buildTeam = (name) => {
    const targetName = normalizeTeamName(name);
    const battingInning = innings.find(inning => normalizeTeamName(inning?.battingTeam || inning?.battingTeamName) === targetName)
      || (name === firstTeamName ? innings[0] : innings[1]);
    const bowlingInning = innings.find(inning => normalizeTeamName(inning?.bowlingTeam || inning?.bowlingTeamName) === targetName)
      || (name === firstTeamName ? innings[1] : innings[0]);
    const teamMeta = match.teams?.find(team => normalizeTeamName(team) === targetName);
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

    const runs = battingInning?.battingTeam?.runs ?? battingInning?.runs ?? 0;
    const wickets = battingInning?.battingTeam?.wickets ?? battingInning?.wickets ?? 0;
    const totalLegalBalls = battingInning?.totalLegalBalls ?? battingInning?.legalBalls ?? 0;
    const teamCode = (typeof battingInning?.battingTeam === 'object' ? battingInning?.battingTeam?.code : null) || name.slice(0, 2).toUpperCase();

    return {
      name,
      code: teamCode,
      logoKey: teamMeta?.logoKey || (name === firstTeamName ? 'default-team-1' : 'default-team-2'),
      logoUri: teamMeta?.logoUri,
      score: battingInning
        ? `${runs}-${wickets} (${formatOvers(totalLegalBalls)} Ov)`
        : 'Yet to bat',
      runs,
      wickets,
      legalBalls: totalLegalBalls,
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

  const completedDate = match.completedAt
    || match.startedAt
    || match.created_at
    || match.createdAt
    || match.date
    || match.dateText
    || null;

  return {
    id: match.id || `finished-${Date.now()}`,
    matchType: match.matchType || `${match.totalOvers || 5} Overs Match`,
    venue: match.venue || 'Sadokan Ground',
    completedAt: completedDate,
    dateText: formatMatchDateTime(completedDate) || 'Match Finished',
    dateLabel: formatMatchDateLabel(completedDate) || 'Match Finished',
    resultText: match.resultText || 'Match Completed',
    winnerTeamName: match.winnerTeamName || '',
    team1,
    team2,
    topBatter: allBatters[0] ? `${allBatters[0].name} ${allBatters[0].runs} (${allBatters[0].balls})` : '',
    topBowler: ''
  };
};

export {
  getTeamLogoSource,
  getScorePartsFromText
} from './teamUtils.js';

export const escapeRegExp = (value = '') =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const parseFinishedScoreText = (scoreText = '') => {
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

export const getFinishedResultCardText = (match) => {
  const team1 = match?.team1 || {};
  const team2 = match?.team2 || {};
  const t1Name = team1.name || 'Team 1';
  const t2Name = team2.name || 'Team 2';
  const t1Code = team1.code || getTeamShortCode(team1, t1Name) || t1Name.slice(0, 2).toUpperCase();
  const t2Code = team2.code || getTeamShortCode(team2, t2Name) || t2Name.slice(0, 2).toUpperCase();

  const t1Parsed = parseFinishedScoreText(team1.score);
  const t2Parsed = parseFinishedScoreText(team2.score);
  const t1Runs = Number(team1.runs ?? t1Parsed.runs ?? 0);
  const t2Runs = Number(team2.runs ?? t2Parsed.runs ?? 0);
  const t2Wkts = Number(team2.wickets ?? t2Parsed.wickets ?? 0);
  const maxWkts = team2.batting?.length > 1 ? team2.batting.length - 1 : (match?.maxWickets || 10);

  const rawResult = String(match?.resultText || match?.winner || '').replace(/!+$/g, '').trim();

  if (/tie|tied/i.test(rawResult) || (t1Runs === t2Runs && t1Runs > 0 && team2.score && team2.score !== 'Yet to bat')) {
    return { title: 'Match Tied', detail: '' };
  }

  // Determine winner name
  let winnerName = match?.winnerTeamName || '';
  if (!winnerName && rawResult && rawResult !== 'Match Completed') {
    if (rawResult.toLowerCase().includes(t1Name.toLowerCase())) winnerName = t1Name;
    else if (rawResult.toLowerCase().includes(t2Name.toLowerCase())) winnerName = t2Name;
  }

  if (!winnerName) {
    if (t2Runs > t1Runs) winnerName = t2Name;
    else if (t1Runs > t2Runs) winnerName = t1Name;
  }

  const winnerCode = (winnerName === t2Name || t2Runs > t1Runs) ? t2Code : t1Code;

  // Determine win margin
  let detail = '';
  if (winnerName === t2Name || t2Runs > t1Runs) {
    const wicketsLeft = Math.max(1, maxWkts - t2Wkts);
    detail = `by ${wicketsLeft} wicket${wicketsLeft !== 1 ? 's' : ''}`;
  } else if (winnerName === t1Name || t1Runs > t2Runs) {
    const runsDiff = Math.max(1, t1Runs - t2Runs);
    detail = `by ${runsDiff} run${runsDiff !== 1 ? 's' : ''}`;
  }

  if (!detail && rawResult && rawResult !== 'Match Completed') {
    detail = rawResult.replace(new RegExp(`^${escapeRegExp(winnerName)}\\s+won\\s*`, 'i'), '').replace(/^.*?\bwon\b\s*/i, '').trim();
  }

  return {
    title: `${winnerCode} Won`,
    detail: detail || ''
  };
};

export const buildFinishedSnapshotInning = (battingTeam, bowlingTeam) => {
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
      code: battingTeam?.code || (battingTeam?.name ? battingTeam.name.slice(0, 2).toUpperCase() : 'TM'),
      runs: parsedScore.runs,
      wickets: parsedScore.wickets
    },
    bowlingTeam: {
      name: bowlingTeam?.name || 'Team',
      code: bowlingTeam?.code || (bowlingTeam?.name ? bowlingTeam.name.slice(0, 2).toUpperCase() : 'TM')
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

export const buildFinishedLiveSnapshot = (finishedMatch) => {
  const t1 = finishedMatch?.team1 || finishedMatch?.sourceMatch?.team1 || finishedMatch?.teams?.[0] || {};
  const t2 = finishedMatch?.team2 || finishedMatch?.sourceMatch?.team2 || finishedMatch?.teams?.[1] || {};

  if (finishedMatch?.sourceMatch?.innings?.length) {
    const srcInn = finishedMatch.sourceMatch.innings;
    const inn1 = srcInn[0];
    const inn2 = srcInn[1];

    const team1Data = {
      ...t1,
      name: inn1?.battingTeam?.name || t1.name || 'Team 1',
      score: t1.score || `${inn1?.battingTeam?.runs || 0}-${inn1?.battingTeam?.wickets || 0}`,
      runs: inn1?.battingTeam?.runs ?? t1.runs ?? 0,
      wickets: inn1?.battingTeam?.wickets ?? t1.wickets ?? 0,
      batting: (t1.batting?.length ? t1.batting : (inn1?.allBatters || inn1?.batting || [])),
      bowling: (t1.bowling?.length ? t1.bowling : (inn2?.bowlingStats ? Object.values(inn2.bowlingStats) : inn1?.bowling || [])),
      fallOfWickets: t1.fallOfWickets || inn1?.partnershipHistory || [],
      partnerships: t1.partnerships || inn1?.partnershipHistory || [],
      overHistory: t1.overHistory || inn1?.overHistory || []
    };

    const team2Data = {
      ...t2,
      name: inn2?.battingTeam?.name || t2.name || 'Team 2',
      score: t2.score || `${inn2?.battingTeam?.runs || 0}-${inn2?.battingTeam?.wickets || 0}`,
      runs: inn2?.battingTeam?.runs ?? t2.runs ?? 0,
      wickets: inn2?.battingTeam?.wickets ?? t2.wickets ?? 0,
      batting: (t2.batting?.length ? t2.batting : (inn2?.allBatters || inn2?.batting || [])),
      bowling: (t2.bowling?.length ? t2.bowling : (inn1?.bowlingStats ? Object.values(inn1.bowlingStats) : inn2?.bowling || [])),
      fallOfWickets: t2.fallOfWickets || inn2?.partnershipHistory || [],
      partnerships: t2.partnerships || inn2?.partnershipHistory || [],
      overHistory: t2.overHistory || inn2?.overHistory || []
    };

    return {
      ...finishedMatch.sourceMatch,
      phase: 'result',
      resultText: finishedMatch.resultText || finishedMatch.winner || finishedMatch.sourceMatch.resultText || 'Match Completed',
      winnerTeamName: finishedMatch.winnerTeamName || finishedMatch.sourceMatch.winnerTeamName || '',
      inning: Math.max(1, Math.min(srcInn.length, finishedMatch.sourceMatch.inning || srcInn.length)),
      team1: team1Data,
      team2: team2Data,
      teams: [team1Data, team2Data],
      maxOvers: finishedMatch.maxOvers || finishedMatch.sourceMatch.maxOvers,
      tossWinner: finishedMatch.tossWinner || finishedMatch.sourceMatch.tossWinner || getTossWinnerName(finishedMatch) || '',
      tossDecision: finishedMatch.tossDecision || finishedMatch.sourceMatch.tossDecision || getTossDecisionText(finishedMatch, 'BAT'),
      venue: finishedMatch.venue || finishedMatch.sourceMatch.venue || 'Local Ground',
      umpireName: finishedMatch.umpireName || finishedMatch.sourceMatch.umpireName || 'Cric Scorer'
    };
  }

  const team1Data = {
    ...t1,
    name: t1.name || 'Team 1',
    batting: t1.batting || [],
    bowling: t1.bowling || [],
    fallOfWickets: t1.fallOfWickets || [],
    partnerships: t1.partnerships || [],
    overHistory: t1.overHistory || []
  };

  const team2Data = {
    ...t2,
    name: t2.name || 'Team 2',
    batting: t2.batting || [],
    bowling: t2.bowling || [],
    fallOfWickets: t2.fallOfWickets || [],
    partnerships: t2.partnerships || [],
    overHistory: t2.overHistory || []
  };

  const innings = [
    buildFinishedSnapshotInning(team1Data, team2Data),
    buildFinishedSnapshotInning(team2Data, team1Data)
  ].filter(inning => inning?.battingTeam?.name);

  return {
    matchTitle: finishedMatch?.title || `${team1Data.name} vs ${team2Data.name}`,
    umpireName: finishedMatch?.umpireName || 'Cric Scorer',
    venue: finishedMatch?.venue || 'Local Ground',
    startedAt: finishedMatch?.sourceMatch?.startedAt || finishedMatch?.startedAt,
    tossResult: finishedMatch?.tossResult,
    tossWinner: finishedMatch?.tossWinner || getTossWinnerName(finishedMatch) || '',
    tossDecision: finishedMatch?.tossDecision || getTossDecisionText(finishedMatch, 'BAT'),
    maxOvers: finishedMatch?.maxOvers || 0,
    team1: team1Data,
    team2: team2Data,
    teams: [team1Data, team2Data],
    playingXI: {
      [team1Data.name]: (team1Data.batting || []).map(player => player.name),
      [team2Data.name]: (team2Data.batting || []).map(player => player.name)
    },
    inning: innings.length || 1,
    innings,
    phase: 'result',
    target: null,
    resultText: finishedMatch?.resultText || finishedMatch?.winner || 'Match Completed',
    winnerTeamName: finishedMatch?.winnerTeamName || ''
  };
};

export const getPlayerPreview = (name) => {
  const profile = MASTER_PLAYERS_DB.find(player => player.name === name);
  return {
    name,
    avg: profile?.avg != null ? Number(profile.avg).toFixed(2) : '-',
    sr: profile?.sr != null ? Number(profile.sr).toFixed(2) : '-'
  };
};

export const getUnplayedBatters = (roster = [], recordedBatters = []) => {
  const recordedNames = new Set(
    (recordedBatters || [])
      .map(player => String(player?.name || player || '').trim().toLowerCase())
      .filter(Boolean)
  );
  return getCleanPlayerNames(roster)
    .filter(name => !recordedNames.has(name.toLowerCase()))
    .map(getPlayerPreview);
};

