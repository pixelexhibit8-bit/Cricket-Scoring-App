import React from 'react';
import { View } from 'react-native';
import { MatchListScoreCard } from '../MatchListScoreCard.jsx';
import { formatOvers } from '../../utils/cricketUtils.js';

export const LiveMatchCardItem = React.memo(function LiveMatchCardItem({
  match,
  onPress,
  style
}) {
  if (!match) return null;

  const t1 = match.teams?.[0] || match.team1 || { name: match.innings?.[0]?.battingTeam?.name || match.inn1BattingTeam || 'Team 1' };
  const t2 = match.teams?.[1] || match.team2 || { name: match.innings?.[0]?.bowlingTeam?.name || match.inn1BowlingTeam || 'Team 2' };
  const inn1 = match.innings?.[0];
  const inn2 = match.innings?.[1];

  const oversNum = match.maxOvers || match.totalOvers || 20;
  const tourName = match.tournamentName || match.tournamentTitle || match.seriesName || '';
  const venueText = match.venue ? ` • ${match.venue}` : ' • Sadokan Ground';
  const subtitle = tourName ? `${tourName} • ${oversNum} Overs` : `${oversNum} Overs${venueText}`;

  const t1Score = inn1?.battingTeam ? `${inn1.battingTeam.runs ?? 0}-${inn1.battingTeam.wickets ?? 0}` : '0-0';
  const t1Overs = inn1 ? formatOvers(inn1.totalLegalBalls || 0) : '0.0';
  const t2Score = inn2?.battingTeam ? `${inn2.battingTeam.runs ?? 0}-${inn2.battingTeam.wickets ?? 0}` : '';
  const t2Overs = inn2 ? formatOvers(inn2.totalLegalBalls || 0) : '';

  const currentInning = match.inning === 2 ? (inn2 || inn1) : (inn1 || inn2);
  const activeBattingTeamName = currentInning?.battingTeam?.name || t1.name;

  const tossWin = match.tossWinner || t1.name;
  const tossDec = match.tossDecision || 'BAT';

  return (
    <View style={[{ marginBottom: 10 }, style]}>
      <MatchListScoreCard
        subtitle={subtitle}
        teamOne={t1}
        teamTwo={t2}
        teamOneScore={t1Score}
        teamOneOvers={t1Overs}
        teamTwoScore={t2Score}
        teamTwoOvers={t2Overs}
        activeTeamName={activeBattingTeamName}
        statusLabel="Live"
        statusColor="#E11D48"
        statusDotColor="#E11D48"
        footerText={`Toss: ${tossWin}, Elected to ${tossDec}`}
        onPress={onPress}
      />
    </View>
  );
});

export default LiveMatchCardItem;
