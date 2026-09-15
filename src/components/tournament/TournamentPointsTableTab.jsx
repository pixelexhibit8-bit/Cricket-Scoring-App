import React from 'react';
import {
  ScrollView,
  StyleSheet
} from 'react-native';
import { themeColors } from '../../theme.js';
import { PointsTableSection } from './PointsTableSection.jsx';

export const TournamentPointsTableTab = React.memo(function TournamentPointsTableTab({
  tournament,
  pointsTableData,
  teamFormEnabled,
  onToggleTeamForm
}) {
  const totalTeams = Array.isArray(tournament?.teams) ? tournament.teams.length : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <PointsTableSection
        pointsTableData={pointsTableData}
        totalTeams={totalTeams}
        tournamentTeams={tournament?.teams || []}
        isOverviewPreview={false}
        teamFormEnabled={teamFormEnabled}
        onToggleTeamForm={onToggleTeamForm}
      />
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.appBackground
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40
  }
});
