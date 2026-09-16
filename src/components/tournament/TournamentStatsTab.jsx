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
      {/* ── 1. PREMIUM 2-CARD BOUNDARY SECTION (6s & 4s) ── */}
      <View style={styles.boundaryCardsContainer}>
        {/* Sixes Card (Violet Accent) */}
        <TouchableOpacity
          style={[styles.boundaryCard, styles.sixesCard]}
          activeOpacity={0.8}
          onPress={() => onSelectStatCategory && onSelectStatCategory('sixes')}
        >
          <View style={styles.boundaryCardTopRow}>
            <View style={[styles.boundaryIconPill, { backgroundColor: '#7C3AED' }]}>
              <MaterialCommunityIcons name="baseball" size={13} color="#FFFFFF" />
              <Text style={styles.boundaryIconPillText}>6s</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color="#A78BFA" />
          </View>

          <Text style={[styles.boundaryBigCount, { color: '#FFFFFF' }]}>{totalSixes}</Text>
          <Text style={[styles.boundaryCardLabel, { color: '#C4B5FD' }]}>TOTAL SIXES</Text>

          {batting.mostSixes?.player && batting.mostSixes.player !== '-' ? (
            <View style={styles.boundaryLeaderSnippet}>
              <Text style={[styles.boundaryLeaderName, { color: '#EDE9FE' }]} numberOfLines={1}>
                {batting.mostSixes.player}
              </Text>
              <Text style={[styles.boundaryLeaderVal, { color: '#A78BFA' }]}>
                {batting.mostSixes.value} Sixes
              </Text>
            </View>
          ) : (
            <View style={styles.boundaryLeaderSnippet}>
              <Text style={[styles.boundaryLeaderName, { color: '#94A3B8' }]}>Leaderboard</Text>
              <Text style={[styles.boundaryLeaderVal, { color: '#A78BFA' }]}>View Top Hitters ›</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Fours Card (Sky Blue Accent) */}
        <TouchableOpacity
          style={[styles.boundaryCard, styles.foursCard]}
          activeOpacity={0.8}
          onPress={() => onSelectStatCategory && onSelectStatCategory('fours')}
        >
          <View style={styles.boundaryCardTopRow}>
            <View style={[styles.boundaryIconPill, { backgroundColor: '#0284C7' }]}>
              <MaterialCommunityIcons name="cricket" size={13} color="#FFFFFF" />
              <Text style={styles.boundaryIconPillText}>4s</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color="#64748B" />
          </View>

          <Text style={[styles.boundaryBigCount, { color: '#0F172A' }]}>{totalFours}</Text>
          <Text style={[styles.boundaryCardLabel, { color: '#64748B' }]}>TOTAL FOURS</Text>

          {batting.mostFours?.player && batting.mostFours.player !== '-' ? (
            <View style={styles.boundaryLeaderSnippet}>
              <Text style={[styles.boundaryLeaderName, { color: '#334155' }]} numberOfLines={1}>
                {batting.mostFours.player}
              </Text>
              <Text style={[styles.boundaryLeaderVal, { color: '#0284C7' }]}>
                {batting.mostFours.value} Fours
              </Text>
            </View>
          ) : (
            <View style={styles.boundaryLeaderSnippet}>
              <Text style={[styles.boundaryLeaderName, { color: '#94A3B8' }]}>Leaderboard</Text>
              <Text style={[styles.boundaryLeaderVal, { color: '#0284C7' }]}>View Top Hitters ›</Text>
            </View>
          )}
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
              <PlayerAvatar name={item.player} size={38} />
              {item.team ? (
                <View style={styles.avatarTeamBadge}>
                  <TeamIdentityMark teamName={item.team} size={14} />
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
              <PlayerAvatar name={item.player} size={38} />
              {item.team ? (
                <View style={styles.avatarTeamBadge}>
                  <TeamIdentityMark teamName={item.team} size={14} />
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
  boundaryCardsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20
  },
  boundaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    borderWidth: 0,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3
  },
  sixesCard: {
    backgroundColor: '#1E1B4B'
  },
  foursCard: {
    backgroundColor: '#FFFFFF'
  },
  boundaryCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  boundaryIconPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  boundaryIconPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: systemFontBold
  },
  boundaryBigCount: {
    fontSize: 28,
    fontFamily: systemFontBold,
    letterSpacing: -0.5,
    marginBottom: 2
  },
  boundaryCardLabel: {
    fontSize: 10.5,
    fontFamily: systemFontMedium,
    letterSpacing: 0.5,
    textTransform: 'uppercase'
  },
  boundaryLeaderSnippet: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 0
  },
  boundaryLeaderName: {
    fontSize: 11.5,
    fontFamily: systemFontMedium
  },
  boundaryLeaderVal: {
    fontSize: 10.5,
    fontFamily: systemFontBold,
    marginTop: 1
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
