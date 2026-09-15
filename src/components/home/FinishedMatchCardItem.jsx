import React from 'react';
import { View } from 'react-native';
import { MatchListScoreCard } from '../MatchListScoreCard.jsx';
import {
  getScorePartsFromText,
  getFinishedResultCardText
} from '../../utils/cricketUtils.js';

export const FinishedMatchCardItem = React.memo(function FinishedMatchCardItem({
  match,
  onPress,
  style
}) {
  if (!match) return null;

  const teamOneScore = getScorePartsFromText(match.team1?.score);
  const teamTwoScore = getScorePartsFromText(match.team2?.score);
  const resultCardText = getFinishedResultCardText(match);
  const resultColor = match.winnerTeamName === match.team1?.name ? '#0369A1' : '#92400E';
  const tourName = match.tournamentName || match.tournamentTitle || match.seriesName || '';
  const subtitleText = tourName
    ? `${tourName} • ${match.maxOvers || 5} Overs`
    : `${match.maxOvers || 5} Overs • ${match.venue || 'Sadokan Ground'}`;

  return (
    <View style={[{ marginBottom: 10 }, style]}>
      <MatchListScoreCard
        subtitle={subtitleText}
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
        onPress={onPress}
      />
    </View>
  );
});

export default FinishedMatchCardItem;
