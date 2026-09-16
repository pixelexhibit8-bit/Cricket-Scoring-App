import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  themeColors,
  systemFont,
  systemFontMedium,
  systemFontBold
} from '../../theme.js';
import { PlayerAvatar } from '../PlayerAvatar.jsx';
import { TeamIdentityMark } from '../TeamIdentityMark.jsx';

export const TournamentStatsTab = React.memo(function TournamentStatsTab({
  tournament,
  stats,
  onSelectStatCategory,
  onSelectPlayer
}) {
  const hasMatchesPlayed = Boolean(stats?.hasMatchesPlayed);

  if (!hasMatchesPlayed) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.emptyScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.emptyStatsContainer}>
          <View style={styles.emptyIconCircle}>
            <MaterialCommunityIcons name="chart-timeline-variant-shimmer" size={38} color="#0284C7" />
          </View>
          <Text style={styles.emptyStatsTitle}>Stats Not Available Yet</Text>
          <Text style={styles.emptyStatsSubtitle}>
            Tournament statistics, boundary counts, and player rankings will be calculated automatically once matches begin.
          </Text>
          <View style={styles.emptyMatchesBadge}>
            <MaterialCommunityIcons name="clock-outline" size={14} color="#64748B" />
            <Text style={styles.emptyMatchesBadgeText}>0 Matches Played</Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  const teams = Array.isArray(tournament?.teams) ? tournament.teams : [];
  const batting = stats?.batting || {};
  const bowling = stats?.bowling || {};

  const totalSixes = stats?.totalSixes ?? 0;
  const totalFours = stats?.totalFours ?? 0;

  // Stat rows data for Batting
  const battingStatsList = [
    {
      id: 'mostRuns',
      label: 'Most Runs',
      player: batting.mostRuns?.player || '-',
      team: batting.mostRuns?.team || '',
      val: batting.mostRuns?.value || '-',
      unit: 'runs'
    },
    {
      id: 'bestStrikeRate',
      label: 'Best Strike Rate',
      player: batting.bestStrikeRate?.player || '-',
      team: batting.bestStrikeRate?.team || '',
      val: batting.bestStrikeRate?.value || '-',
      unit: 'strike rate'
    },
    {
      id: 'highestScore',
      label: 'Highest Score',
      player: batting.highestScore?.player || '-',
      team: batting.highestScore?.team || '',
      val: batting.highestScore?.value || '-',
      unit: 'runs'
    },
    {
      id: 'mostSixes',
      label: 'Most Sixes',
      player: batting.mostSixes?.player || '-',
      team: batting.mostSixes?.team || '',
      val: batting.mostSixes?.value || '-',
      unit: 'sixes'
    },
    {
      id: 'mostFours',
      label: 'Most Fours',
      player: batting.mostFours?.player || '-',
      team: batting.mostFours?.team || '',
      val: batting.mostFours?.value || '-',
      unit: 'fours'
    }
  ];

  // Stat rows data for Bowling
  const bowlingStatsList = [
    {
      id: 'mostWickets',
      label: 'Most Wickets',
      player: bowling.mostWickets?.player || '-',
      team: bowling.mostWickets?.team || '',
      val: bowling.mostWickets?.value || '-',
      unit: 'wickets'
    },
    {
      id: 'bestFigures',
      label: 'Best Figures',
      player: bowling.bestFigures?.player || '-',
      team: bowling.bestFigures?.team || '',
      val: bowling.bestFigures?.value || '-',
      unit: 'best figure'
    },
    {
      id: 'bestEconomy',
      label: 'Best Economy',
      player: bowling.bestEconomy?.player || '-',
      team: bowling.bestEconomy?.team || '',
      val: bowling.bestEconomy?.value || '-',
      unit: 'economy'
    },
    {
      id: 'mostDotBalls',
      label: 'Most Dot Balls',
      player: bowling.mostDotBalls?.player || '-',
      team: bowling.mostDotBalls?.team || '',
      val: bowling.mostDotBalls?.value || '-',
      unit: 'dots'
    }
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ── 1. TOP 2-COLUMN BOUNDARIES AGGREGATE STRIP ── */}
      <View style={styles.topAggregateCard}>
        {/* Sixes Block */}
        <TouchableOpacity
          style={styles.aggregateColumn}
          activeOpacity={0.7}
          onPress={() => onSelectStatCategory && onSelectStatCategory('sixes')}
        >
          <Text style={styles.aggregateCountNumber}>{totalSixes}</Text>
          <View style={styles.aggregateSubRow}>
            <View style={[styles.boundaryBadgeCircle, { backgroundColor: '#16A34A' }]}>
              <Text style={styles.boundaryBadgeText}>6</Text>
            </View>
            <Text style={styles.aggregateUnitLabel}>sixes</Text>
            <Ionicons name="chevron-forward" size={13} color="#64748B" />
          </View>
        </TouchableOpacity>

        {/* Middle Separator Line */}
        <View style={styles.verticalSeparator} />

        {/* Fours Block */}
        <TouchableOpacity
          style={styles.aggregateColumn}
          activeOpacity={0.7}
          onPress={() => onSelectStatCategory && onSelectStatCategory('fours')}
        >
          <Text style={styles.aggregateCountNumber}>{totalFours}</Text>
          <View style={styles.aggregateSubRow}>
            <View style={[styles.boundaryBadgeCircle, { backgroundColor: '#0284C7' }]}>
              <Text style={styles.boundaryBadgeText}>4</Text>
            </View>
            <Text style={styles.aggregateUnitLabel}>fours</Text>
            <Ionicons name="chevron-forward" size={13} color="#64748B" />
          </View>
        </TouchableOpacity>
      </View>

      {/* ── 2. BATTING CATEGORY STATS LIST ── */}
      <Text style={styles.categorySectionTitle}>BATTING LEADERS</Text>
      <View style={styles.statsListContainer}>
        {battingStatsList.map((item, idx) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.statRowItem, idx === battingStatsList.length - 1 && { borderBottomWidth: 0 }]}
            activeOpacity={0.75}
            onPress={() => onSelectStatCategory && onSelectStatCategory(item.id)}
          >
            <View style={styles.avatarWrap}>
              <PlayerAvatar name={item.player} size={46} />
              {item.team ? (
                <View style={styles.avatarTeamBadge}>
                  <TeamIdentityMark teamName={item.team} size={16} />
                </View>
              ) : null}
            </View>

            <View style={styles.statPlayerInfoCol}>
              <Text style={styles.statCategoryHeaderLabel}>{item.label}</Text>
              <Text style={styles.statPlayerFullName} numberOfLines={1}>
                {item.player} {item.team ? `• ${item.team}` : ''}
              </Text>
            </View>

            <View style={styles.statValueRightCol}>
              <Text style={styles.statBigValueText}>{item.val}</Text>
              <Text style={styles.statUnitSubText}>{item.unit}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── 3. BOWLING CATEGORY STATS LIST ── */}
      <Text style={[styles.categorySectionTitle, { marginTop: 22 }]}>BOWLING LEADERS</Text>
      <View style={styles.statsListContainer}>
        {bowlingStatsList.map((item, idx) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.statRowItem, idx === bowlingStatsList.length - 1 && { borderBottomWidth: 0 }]}
            activeOpacity={0.75}
            onPress={() => onSelectStatCategory && onSelectStatCategory(item.id)}
          >
            <View style={styles.avatarWrap}>
              <PlayerAvatar name={item.player} size={46} />
              {item.team ? (
                <View style={styles.avatarTeamBadge}>
                  <TeamIdentityMark teamName={item.team} size={16} />
                </View>
              ) : null}
            </View>

            <View style={styles.statPlayerInfoCol}>
              <Text style={styles.statCategoryHeaderLabel}>{item.label}</Text>
              <Text style={styles.statPlayerFullName} numberOfLines={1}>
                {item.player} {item.team ? `• ${item.team}` : ''}
              </Text>
            </View>

            <View style={styles.statValueRightCol}>
              <Text style={styles.statBigValueText}>{item.val}</Text>
              <Text style={styles.statUnitSubText}>{item.unit}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* All Stats Button */}
      <TouchableOpacity
        style={styles.allStatsBottomBtn}
        activeOpacity={0.8}
        onPress={() => onSelectStatCategory && onSelectStatCategory('all')}
      >
        <Text style={styles.allStatsBtnText}>View All Tournament Stats</Text>
      </TouchableOpacity>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFCFD'
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40
  },
  emptyScrollContent: {
    padding: 16,
    paddingBottom: 40,
    justifyContent: 'center',
    minHeight: 400
  },
  emptyStatsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 0,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 0
  },
  emptyStatsTitle: {
    fontSize: 16,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary,
    marginBottom: 8,
    textAlign: 'center'
  },
  emptyStatsSubtitle: {
    fontSize: 13,
    fontFamily: systemFont,
    color: themeColors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
    maxWidth: 280
  },
  emptyMatchesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8F8FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 0
  },
  emptyMatchesBadgeText: {
    fontSize: 11.5,
    fontFamily: systemFontMedium,
    color: '#64748B'
  },
  topAggregateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    marginBottom: 18
  },
  aggregateColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  aggregateCountNumber: {
    fontSize: 26,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary,
    marginBottom: 4
  },
  aggregateSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  boundaryBadgeCircle: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    alignItems: 'center',
    justifyContent: 'center'
  },
  boundaryBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontFamily: systemFontBold
  },
  aggregateUnitLabel: {
    fontSize: 12,
    fontFamily: systemFontMedium,
    color: '#0284C7'
  },
  verticalSeparator: {
    width: 1,
    height: 36,
    backgroundColor: '#EEEEF0'
  },
  categorySectionTitle: {
    fontSize: 12.5,
    fontFamily: systemFontMedium,
    color: themeColors.textMuted,
    marginBottom: 8,
    paddingLeft: 4
  },
  statsListContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 0,
    overflow: 'hidden'
  },
  statRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 0,
    borderBottomColor: '#F8F8FA'
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 12
  },
  avatarTeamBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 1,
    borderWidth: 0
  },
  statPlayerInfoCol: {
    flex: 1
  },
  statCategoryHeaderLabel: {
    fontSize: 13,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  statPlayerFullName: {
    fontSize: 11.5,
    fontFamily: systemFont,
    color: themeColors.textMuted,
    marginTop: 2
  },
  statValueRightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  statBigValueText: {
    fontSize: 16,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  statUnitSubText: {
    fontSize: 10,
    fontFamily: systemFont,
    color: themeColors.textMuted,
    marginTop: 1
  },
  allStatsBottomBtn: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 0,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20
  },
  allStatsBtnText: {
    color: '#0284C7',
    fontSize: 13,
    fontFamily: systemFontBold
  }
});
