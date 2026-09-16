import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { systemFontBold, systemFontMedium } from '../../theme.js';

export const ProfileOverviewTab = React.memo(function ProfileOverviewTab({ stats = {} }) {
  return (
    <ScrollView
      style={styles.pageScrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ gap: 14 }}>
        {/* Top 4 Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <MaterialCommunityIcons
              name="scoreboard-outline"
              size={48}
              color="#18181B"
              style={styles.watermarkIcon}
            />
            <Text style={styles.summaryVal}>{stats.matchesPlayed ?? 0}</Text>
            <Text style={styles.summaryLbl}>Matches</Text>
          </View>

          <View style={styles.summaryCard}>
            <MaterialCommunityIcons
              name="cricket"
              size={48}
              color="#0F2744"
              style={styles.watermarkIcon}
            />
            <Text style={[styles.summaryVal, { color: '#0F2744' }]}>{stats.totalRuns ?? 0}</Text>
            <Text style={styles.summaryLbl}>Total Runs</Text>
          </View>

          <View style={styles.summaryCard}>
            <Ionicons
              name="trophy-outline"
              size={44}
              color="#18181B"
              style={[styles.watermarkIcon, { right: -6, bottom: -6 }]}
            />
            <Text style={[styles.summaryVal, { color: '#18181B' }]}>{stats.highestScore ?? 0}</Text>
            <Text style={styles.summaryLbl}>High Score</Text>
          </View>

          <View style={styles.summaryCard}>
            <MaterialCommunityIcons
              name="baseball"
              size={48}
              color="#EA580C"
              style={styles.watermarkIcon}
            />
            <Text style={[styles.summaryVal, { color: '#EA580C' }]}>{stats.wickets ?? 0}</Text>
            <Text style={styles.summaryLbl}>Wickets</Text>
          </View>
        </View>

        {/* Batting & Bowling Highlights */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={styles.highlightBox}>
            <View style={styles.highlightHeader}>
              <MaterialCommunityIcons name="cricket" size={16} color="#0F2744" />
              <Text style={styles.highlightTitle}>Batting</Text>
            </View>
            <View style={[styles.statRow, { marginTop: 4 }]}>
              <Text style={styles.statRowLabel}>Average</Text>
              <Text style={styles.statRowVal}>{stats.battingAvg ?? '0.00'}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statRowLabel}>Strike Rate</Text>
              <Text style={[styles.statRowVal, { color: '#0F2744' }]}>{stats.strikeRate ?? '0.00'}</Text>
            </View>
          </View>

          <View style={styles.highlightBox}>
            <View style={styles.highlightHeader}>
              <MaterialCommunityIcons name="baseball" size={16} color="#EA580C" />
              <Text style={styles.highlightTitle}>Bowling</Text>
            </View>
            <View style={[styles.statRow, { marginTop: 4 }]}>
              <Text style={styles.statRowLabel}>Economy</Text>
              <Text style={styles.statRowVal}>{stats.economy ?? '0.00'}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statRowLabel}>Best</Text>
              <Text style={[styles.statRowVal, { color: '#EA580C' }]}>{stats.bestBowling || '-'}</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  pageScrollView: {
    flex: 1
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 28
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 8
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    overflow: 'hidden',
    position: 'relative'
  },
  watermarkIcon: {
    position: 'absolute',
    right: -8,
    bottom: -8,
    opacity: 0.06
  },
  summaryVal: {
    fontSize: 18,
    fontFamily: systemFontBold,
    color: '#0F172A'
  },
  summaryLbl: {
    fontSize: 10,
    fontFamily: systemFontMedium,
    color: '#64748B',
    marginTop: 2
  },
  highlightBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 0,
    gap: 6
  },
  highlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  highlightTitle: {
    fontSize: 12,
    fontFamily: systemFontBold,
    color: '#0F172A'
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  statRowLabel: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: systemFontMedium
  },
  statRowVal: {
    fontSize: 12,
    fontFamily: systemFontBold,
    color: '#0F172A'
  }
});
