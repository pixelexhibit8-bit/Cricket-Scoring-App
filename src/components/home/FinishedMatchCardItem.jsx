import React from 'react';
import { View } from 'react-native';
import { MatchListScoreCard } from '../MatchListScoreCard.jsx';
import {
  getScorePartsFromText,
  getFinishedResultCardText,
  getResultColor
} from '../../utils/cricketUtils.js';

export const FinishedMatchCardItem = React.memo(function FinishedMatchCardItem({
  match,
  index = 0,
  onPress,
  style
}) {
  if (!match) return null;

  const teamOneScore = getScorePartsFromText(match.team1?.score);
  const teamTwoScore = getScorePartsFromText(match.team2?.score);
  const resultCardText = getFinishedResultCardText(match);
  const resultColor = getResultColor(match, index);
  const tourName = match.tournamentName || match.tournamentTitle || match.seriesName || '';
  const venue = match.venue || 'Sadokan Ground';
  const subtitleText = tourName ? `${tourName} • ${venue}` : venue;

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
