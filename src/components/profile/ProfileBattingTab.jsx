import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { systemFontBold, systemFontMedium, systemFont, themeColors } from '../../theme.js';

export const ProfileBattingTab = React.memo(function ProfileBattingTab({ stats = {} }) {
  const battingMetrics = [
    { label: 'Innings Batted', value: stats.inningsBatted ?? 0 },
    { label: 'Total Runs', value: stats.totalRuns ?? 0 },
    { label: 'Balls Faced', value: stats.ballsFaced ?? 0 },
    { label: 'Highest Score', value: stats.highestScore ?? 0 },
    { label: 'Batting Average', value: stats.battingAvg ?? '0.0' },
    { label: 'Strike Rate', value: stats.strikeRate ?? '0.0' },
    { label: 'Centuries (100s)', value: stats.hundreds ?? 0 },
    { label: 'Half-Centuries (50s)', value: stats.fifties ?? 0 },
    { label: 'Fours (4s)', value: stats.fours ?? 0 },
    { label: 'Sixes (6s)', value: stats.sixes ?? 0 },
    { label: 'Not Outs', value: stats.notOuts ?? 0 }
  ];

  return (
    <ScrollView
      style={styles.pageScrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.statsCard}>
        <View style={styles.statsCardHeader}>
          <MaterialCommunityIcons name="cricket" size={18} color="#18181B" />
          <Text style={styles.statsCardTitle}>BATTING CAREER STATS</Text>
        </View>

        <View style={styles.metricsList}>
          {battingMetrics.map((item, idx) => (
            <View
              key={item.label}
              style={[
                styles.metricRow,
                idx === battingMetrics.length - 1 && { borderBottomWidth: 0 }
              ]}
            >
              <Text style={styles.metricLabel}>{item.label}</Text>
              <Text style={styles.metricValue}>{item.value}</Text>
            </View>
          ))}
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
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEEEF0'
  },
  statsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    paddingBottom: 10
  },
  statsCardTitle: {
    fontSize: 12.5,
    fontFamily: systemFontBold,
    color: '#0F172A',
    letterSpacing: 0.4
  },
  metricsList: {
    gap: 0
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8FA'
  },
  metricLabel: {
    fontSize: 13,
    fontFamily: systemFont,
    color: '#64748B'
  },
  metricValue: {
    fontSize: 14,
    fontFamily: systemFontMedium,
    color: '#0F172A'
  }
});

export default ProfileBattingTab;
