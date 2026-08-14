import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTeamShortCode } from '../utils/teamUtils';
import { systemFont, fontWeights } from '../theme';

export const calculateRealtimeWinPct = (match, inn) => {
  if (!match || !inn) return { team1Pct: 50, team2Pct: 50 };

  const team1Name = match.team1?.name || match.teams?.[0]?.name;
  const team2Name = match.team2?.name || match.teams?.[1]?.name;

  // 1. Finished Match Result
  const isFinished = match.phase === 'result' || inn.status === 'complete' && match.inning === 2;
  if (isFinished) {
    const winnerName = match.winnerTeamName || match.winner;
    const isTeam1Winner = winnerName ? winnerName === team1Name : (match.team1?.runs > match.team2?.runs);
    return {
      team1Pct: isTeam1Winner ? 100 : 0,
      team2Pct: isTeam1Winner ? 0 : 100
    };
  }

  const battingTeamName = inn.battingTeam?.name;
  const isTeam1Batting = battingTeamName === team1Name;

  const totalLegalBalls = inn.totalLegalBalls || 0;
  const maxOvers = match.maxOvers || 20;
  const maxBalls = maxOvers * 6;
  const runsScored = inn.battingTeam?.runs || 0;
  const wicketsLost = inn.battingTeam?.wickets || 0;
  const wicketsLeft = Math.max(0, 10 - wicketsLost);

  // 2. Pre-Match / Early Match (First 6 balls or before play)
  if (totalLegalBalls < 6) {
    // Balanced 50-50 initial state with slight team rating adjustment
    let baseTeam1Pct = 50;
    let baseTeam2Pct = 50;

    // Small toss advantage (+2%)
    if (match.tossWinner) {
      if (match.tossWinner === team1Name) {
        baseTeam1Pct += 2;
        baseTeam2Pct -= 2;
      } else if (match.tossWinner === team2Name) {
        baseTeam1Pct -= 2;
        baseTeam2Pct += 2;
      }
    }

    return {
      team1Pct: Math.round(baseTeam1Pct),
      team2Pct: Math.round(baseTeam2Pct)
    };
  }

  let battingWinPct = 50;

  // 3. Second Innings Chasing Calculation
  if (match.inning === 2 && match.target && match.target > 0) {
    const runsNeeded = match.target - runsScored;
    const ballsLeft = Math.max(0, maxBalls - totalLegalBalls);

    if (runsNeeded <= 0) {
      battingWinPct = 100;
    } else if (wicketsLeft <= 0 || (ballsLeft <= 0 && runsNeeded > 0)) {
      battingWinPct = 0;
    } else {
      const rrr = (runsNeeded / ballsLeft) * 6;
      const crr = (runsScored / totalLegalBalls) * 6;

      // Par RRR benchmark based on format max overs
      const parRRR = maxOvers <= 6 ? 10.0 : maxOvers <= 10 ? 9.0 : 8.0;

      let rrrDiff = rrr - parRRR;
      let rrrImpact = rrrDiff * 4.5; // High RRR lowers chasing chances

      // Wicket multiplier
      let wicketMultiplier = Math.pow(wicketsLeft / 10, 0.7);

      battingWinPct = (50 - rrrImpact) * wicketMultiplier;

      // Set batter bonus on crease
      const strikerRuns = inn.striker?.runs || 0;
      const nonStrikerRuns = inn.nonStriker?.runs || 0;
      if (strikerRuns >= 30 || nonStrikerRuns >= 30) battingWinPct += 5;

      battingWinPct = Math.max(3, Math.min(97, Math.round(battingWinPct)));
    }
  } else {
    // 4. First Innings Calculation
    const crr = totalLegalBalls > 0 ? (runsScored / totalLegalBalls) * 6 : 0;
    const parRate = maxOvers <= 6 ? 9.5 : maxOvers <= 10 ? 8.5 : 7.8;

    const rateBonus = (crr - parRate) * 3.5;
    const wicketPenalty = wicketsLost * 5.5;

    battingWinPct = 50 + rateBonus - wicketPenalty;

    const strikerRuns = inn.striker?.runs || 0;
    const nonStrikerRuns = inn.nonStriker?.runs || 0;
    if (strikerRuns >= 25 || nonStrikerRuns >= 25) battingWinPct += 4;

    battingWinPct = Math.max(8, Math.min(92, Math.round(battingWinPct)));
  }

  const team1Pct = isTeam1Batting ? battingWinPct : 100 - battingWinPct;
  const team2Pct = 100 - team1Pct;

  return {
    team1Pct: Math.max(1, Math.min(99, Math.round(team1Pct))),
    team2Pct: Math.max(1, Math.min(99, Math.round(team2Pct)))
  };
};

export const RealtimeWinBar = ({ match, inning, team1, team2 }) => {
  if (!match || !inning) return null;

  const t1 = team1 || match.team1 || match.teams?.[0];
  const t2 = team2 || match.team2 || match.teams?.[1];

  const t1Code = getTeamShortCode(t1, t1?.name || 'TEAM A');
  const t2Code = getTeamShortCode(t2, t2?.name || 'TEAM B');

  const { team1Pct, team2Pct } = calculateRealtimeWinPct(match, inning);

  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 11,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        gap: 8
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ color: '#0F172A', fontSize: 13, fontWeight: fontWeights.bold, fontFamily: systemFont }}>
            {t1Code}
          </Text>
          <Text style={{ color: '#0284C7', fontSize: 13, fontWeight: fontWeights.bold, fontVariant: ['tabular-nums'], fontFamily: systemFont }}>
            {team1Pct}%
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="analytics-outline" size={14} color="#0284C7" />
          <Text style={{ color: '#64748B', fontSize: 11, fontWeight: fontWeights.bold, letterSpacing: 0.2, fontFamily: systemFont }}>
            WINNING PREDICTION
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ color: '#0284C7', fontSize: 13, fontWeight: fontWeights.bold, fontVariant: ['tabular-nums'], fontFamily: systemFont }}>
            {team2Pct}%
          </Text>
          <Text style={{ color: '#0F172A', fontSize: 13, fontWeight: fontWeights.bold, fontFamily: systemFont }}>
            {t2Code}
          </Text>
        </View>
      </View>

      {/* Seamless Flat Dual Progress Line */}
      <View style={{ height: 5, backgroundColor: '#F1F5F9', borderRadius: 3, flexDirection: 'row', overflow: 'hidden' }}>
        <View
          style={{
            width: `${team1Pct}%`,
            backgroundColor: '#0284C7'
          }}
        />
        <View
          style={{
            width: `${team2Pct}%`,
            backgroundColor: '#0284C7',
            opacity: 0.25
          }}
        />
      </View>
    </View>
  );
};

export default RealtimeWinBar;
