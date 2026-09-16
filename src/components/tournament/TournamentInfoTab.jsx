import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet
} from 'react-native';
import {
  themeColors,
  systemFont,
  systemFontMedium,
  systemFontBold
} from '../../theme.js';

export const TournamentInfoTab = React.memo(function TournamentInfoTab({
  tournament
}) {
  const matchesCount = Array.isArray(tournament?.matches) ? tournament.matches.length : 8;
  const overs = tournament?.overs || tournament?.maxOvers || 20;

  const infoRows = [
    {
      key: 'Series',
      val: tournament?.fullName || tournament?.name || tournament?.title || 'Cricket Tournament'
    },
    {
      key: 'Host',
      val: tournament?.host || tournament?.city || 'Local Ground'
    },
    {
      key: 'Duration',
      val: tournament?.duration || tournament?.startDate || '06 Sep - 17 Sep 2026'
    },
    {
      key: 'Format',
      val: tournament?.format ? `${tournament.format} (${overs} Overs)` : `${matchesCount} Matches • ${overs} Overs`
    },
    {
      key: 'Structure',
      val: tournament?.structure === 'hybrid'
        ? 'League + Knockout (Hybrid)'
        : (tournament?.structure === 'knockout' ? 'Direct Knockout' : 'Round-Robin League')
    }
  ];

  if (Array.isArray(tournament?.rounds) && tournament.rounds.length > 0) {
    infoRows.push({
      key: 'Rounds',
      val: tournament.rounds.join(' › ')
    });
  }

  if (tournament?.ballType) {
    infoRows.push({
      key: 'Ball Type',
      val: String(tournament.ballType).toUpperCase()
    });
  }

  if (tournament?.pitchType) {
    infoRows.push({
      key: 'Pitch Type',
      val: String(tournament.pitchType).toUpperCase()
    });
  }

  if (tournament?.entryFee) {
    infoRows.push({
      key: 'Entry Fee',
      val: `₹${tournament.entryFee}`
    });
  }

  if (tournament?.prizes?.first) {
    infoRows.push({
      key: '1st Prize',
      val: tournament.prizes.first
    });
  }

  if (tournament?.prizes?.runnerUp) {
    infoRows.push({
      key: 'Runner-up',
      val: tournament.prizes.runnerUp
    });
  }

  if (Array.isArray(tournament?.venues) && tournament.venues.length > 0) {
    infoRows.push({
      key: 'Venues',
      val: tournament.venues.join(' • ')
    });
  }

  if (tournament?.organiserName) {
    infoRows.push({
      key: 'Organiser',
      val: tournament.organiserName + (tournament.organiserPhone ? ` (${tournament.organiserPhone})` : '')
    });
  }

  infoRows.push({
    key: 'Broadcaster',
    val: tournament?.broadcaster || 'CricFlow Live, YouTube, Ground Bulletin'
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.specsCard}>
        {infoRows.map((row, idx) => (
          <View
            key={row.key}
            style={[
              styles.infoRowItem,
              idx === infoRows.length - 1 && { borderBottomWidth: 0 }
            ]}
          >
            <Text style={styles.infoKeyText}>{row.key}</Text>
            <Text style={styles.infoValText} numberOfLines={2}>
              {row.val}
            </Text>
          </View>
        ))}
      </View>
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
  },
  specsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 0,
    paddingHorizontal: 16,
    paddingVertical: 6
  },
  infoRowItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 0,
    borderBottomColor: '#F8F8FA'
  },
  infoKeyText: {
    fontSize: 13,
    fontFamily: systemFont,
    color: themeColors.textMuted,
    width: 100
  },
  infoValText: {
    fontSize: 13.5,
    fontFamily: systemFontMedium,
    color: themeColors.textPrimary,
    flex: 1,
    textAlign: 'right',
    lineHeight: 18
  }
});
