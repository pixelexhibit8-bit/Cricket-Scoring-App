import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

      {/* ── 2. BATTING SECTION ── */}
      <Text style={styles.categorySectionTitle}>Batting</Text>
      <View style={styles.statsListContainer}>
        {battingStatsList.map((item, idx) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.statRowItem,
              idx === battingStatsList.length - 1 && { borderBottomWidth: 0 }
            ]}
            activeOpacity={0.7}
            onPress={() => {
              if (onSelectPlayer && item.player && item.player !== '-') {
                onSelectPlayer({ name: item.player, team: item.team });
              }
            }}
          >
            {/* Player Avatar with Team Identity */}
            <View style={styles.avatarWrap}>
              <PlayerAvatar name={item.player} size={42} />
              {item.team ? (
                <View style={styles.avatarTeamBadge}>
                  <TeamIdentityMark team={{ name: item.team }} tournamentTeams={teams} size={14} />
                </View>
              ) : null}
            </View>

            {/* Middle: Category Label + Player Name */}
            <View style={styles.statPlayerInfoCol}>
              <Text style={styles.statCategoryHeaderLabel}>{item.label}</Text>
              <Text style={styles.statPlayerFullName} numberOfLines={1}>
                {item.player}
              </Text>
            </View>

            {/* Right: Stat Value + Unit + Chevron */}
            <View style={styles.statValueRightCol}>
              <Text style={styles.statBigValueText}>{item.val}</Text>
              <Text style={styles.statUnitSubText}>{item.unit}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        ))}
      </View>

      {/* ── 3. BOWLING SECTION ── */}
      <Text style={[styles.categorySectionTitle, { marginTop: 16 }]}>Bowling</Text>
      <View style={styles.statsListContainer}>
        {bowlingStatsList.map((item, idx) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.statRowItem,
              idx === bowlingStatsList.length - 1 && { borderBottomWidth: 0 }
            ]}
            activeOpacity={0.7}
            onPress={() => {
              if (onSelectPlayer && item.player && item.player !== '-') {
                onSelectPlayer({ name: item.player, team: item.team });
              }
            }}
          >
            <View style={styles.avatarWrap}>
              <PlayerAvatar name={item.player} size={42} />
              {item.team ? (
                <View style={styles.avatarTeamBadge}>
                  <TeamIdentityMark team={{ name: item.team }} tournamentTeams={teams} size={14} />
                </View>
              ) : null}
            </View>

            <View style={styles.statPlayerInfoCol}>
              <Text style={styles.statCategoryHeaderLabel}>{item.label}</Text>
              <Text style={styles.statPlayerFullName} numberOfLines={1}>
                {item.player}
              </Text>
            </View>

            <View style={styles.statValueRightCol}>
              <Text style={styles.statBigValueText}>{item.val}</Text>
              <Text style={styles.statUnitSubText}>{item.unit}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        ))}
      </View>

      {/* ── 4. ALL STATS BUTTON ── */}
      <TouchableOpacity
        style={styles.allStatsBottomBtn}
        activeOpacity={0.85}
        onPress={() => onSelectStatCategory && onSelectStatCategory('all')}
      >
        <Text style={styles.allStatsBtnText}>All Stats ›</Text>
      </TouchableOpacity>
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
  topAggregateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    marginBottom: 14
  },
  aggregateColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  aggregateCountNumber: {
    fontSize: 22,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary,
    lineHeight: 26
  },
  aggregateSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4
  },
  boundaryBadgeCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
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
    borderWidth: 1,
    borderColor: '#EEEEF0',
    overflow: 'hidden'
  },
  statRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
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
    borderWidth: 1,
    borderColor: '#EEEEF0'
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
    borderWidth: 1,
    borderColor: '#DBEAFE',
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
