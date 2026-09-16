import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { systemFontBold, systemFontMedium, systemFont, themeColors } from '../../theme.js';

export const ProfileBowlingTab = React.memo(function ProfileBowlingTab({ stats = {} }) {
  const bowlingAvg = stats.wickets > 0
    ? (stats.runsConceded / stats.wickets).toFixed(1)
    : (stats.runsConceded > 0 ? `${stats.runsConceded}.0` : '0.0');

  const bowlingMetrics = [
    { label: 'Overs Bowled', value: stats.oversBowled ?? '0.0' },
    { label: 'Maidens', value: stats.maidens ?? 0 },
    { label: 'Runs Conceded', value: stats.runsConceded ?? 0 },
    { label: 'Wickets Taken', value: stats.wickets ?? 0 },
    { label: 'Best Bowling', value: stats.bestBowling || '-' },
    { label: 'Bowling Economy', value: stats.economy ?? '0.00' },
    { label: 'Bowling Average', value: bowlingAvg }
  ];

  return (
    <ScrollView
      style={styles.pageScrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.statsCard}>
        <View style={styles.statsCardHeader}>
          <MaterialCommunityIcons name="baseball" size={18} color="#18181B" />
          <Text style={styles.statsCardTitle}>BOWLING CAREER STATS</Text>
        </View>

        <View style={styles.metricsList}>
          {bowlingMetrics.map((item, idx) => (
            <View
              key={item.label}
              style={[
                styles.metricRow,
                idx === bowlingMetrics.length - 1 && { borderBottomWidth: 0 }
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

export default ProfileBowlingTab;
