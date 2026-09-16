import React from 'react';
import { View } from 'react-native';
import { MatchListScoreCard } from '../MatchListScoreCard.jsx';
import { getCleanMatchStageBadge, getUpcomingMatchSchedule } from '../../utils/cricketUtils.js';
import { resolveTeamWithRoster } from '../../utils/teamUtils.js';

export const UpcomingFixtureCardItem = React.memo(function UpcomingFixtureCardItem({
  fixture,
  onPress,
  style,
  delay = 0
}) {
  if (!fixture) return null;

  const tournamentTeams = fixture.tournament?.teams || [];
  const t1 = resolveTeamWithRoster(fixture.team1 || { name: fixture.team1Name || fixture.teams?.[0]?.name || 'Team 1' }, tournamentTeams);
  const t2 = resolveTeamWithRoster(fixture.team2 || { name: fixture.team2Name || fixture.teams?.[1]?.name || 'Team 2' }, tournamentTeams);
  const tourName = fixture.tournamentName || fixture.tournamentTitle || fixture.seriesName || '';
  const cleanStage = getCleanMatchStageBadge(fixture.stage, fixture.matchNumber || fixture.matchNo);
  const venue = fixture.venue || fixture.venueName || 'Sadokan Ground';
  const schedule = getUpcomingMatchSchedule(fixture);

  const subtitle = tourName
    ? (cleanStage ? `${cleanStage} • ${tourName}` : tourName)
    : (cleanStage || 'Upcoming Fixture');

  return (
    <View style={[{ marginBottom: 10 }, style]}>
      <MatchListScoreCard
        subtitle={subtitle}
        teamOne={t1}
        teamTwo={t2}
        teamOneScore=""
        teamTwoScore=""
        useFullName={true}
        statusLabel={schedule.topText}
        statusSubLabel={schedule.bottomText}
        statusColor={schedule.primaryColor}
        statusDotColor="transparent"
        footerText={venue}
        footerColor="#64748B"
        topRightIcon="notifications-outline"
        onPress={onPress}
        delay={delay}
      />
    </View>
  );
});

export default UpcomingFixtureCardItem;
