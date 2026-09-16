import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { systemFontBold, systemFontMedium, systemFont, themeColors } from '../../theme.js';

export const ProfileOverviewTab = React.memo(function ProfileOverviewTab({
  stats = {},
  profile = {}
}) {
  const detailRows = [
    {
      label: 'Playing Role',
      value: profile?.role || 'All-Rounder',
      icon: 'account-outline',
      iconFamily: 'MaterialCommunityIcons'
    },
    {
      label: 'Batting Style',
      value: profile?.battingStyle || 'Right Hand Bat',
      icon: 'cricket',
      iconFamily: 'MaterialCommunityIcons'
    },
    {
      label: 'Bowling Style',
      value: profile?.bowlingStyle || 'Right Arm Medium',
      icon: 'baseball',
      iconFamily: 'MaterialCommunityIcons'
    },
    {
      label: 'City / Location',
      value: profile?.city || 'Local Ground',
      icon: 'location-outline',
      iconFamily: 'Ionicons'
    },
    {
      label: 'Date of Birth',
      value: profile?.dob || '-',
      icon: 'calendar-outline',
      iconFamily: 'Ionicons'
    },
    {
      label: 'Jersey Number',
      value: profile?.jerseyNumber ? `#${profile.jerseyNumber}` : '-',
      icon: 'tshirt-crew-outline',
      iconFamily: 'MaterialCommunityIcons'
    }
  ];

  return (
    <ScrollView
      style={styles.pageScrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ gap: 14 }}>
        {/* 1. TOP CAREER STATS STRIP (4 METRICS) */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryVal}>{stats.matchesPlayed ?? 0}</Text>
            <Text style={styles.summaryLbl}>Matches</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryVal}>{stats.totalRuns ?? 0}</Text>
            <Text style={styles.summaryLbl}>Runs</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryVal}>{stats.wickets ?? 0}</Text>
            <Text style={styles.summaryLbl}>Wickets</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryVal}>{stats.highestScore ?? 0}</Text>
            <Text style={styles.summaryLbl}>High Score</Text>
          </View>
        </View>

        {/* 2. PLAYER INFORMATION (ROW-BY-ROW DETAILS) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="person-outline" size={16} color="#18181B" />
            <Text style={styles.sectionTitle}>PLAYER DETAILS</Text>
          </View>

          <View style={styles.detailsList}>
            {detailRows.map((row, idx) => (
              <View
                key={row.label}
                style={[
                  styles.detailRow,
                  idx === detailRows.length - 1 && { borderBottomWidth: 0 }
                ]}
              >
                <View style={styles.detailLabelCol}>
                  {row.iconFamily === 'Ionicons' ? (
                    <Ionicons name={row.icon} size={15} color="#64748B" />
                  ) : (
                    <MaterialCommunityIcons name={row.icon} size={15} color="#64748B" />
                  )}
                  <Text style={styles.detailLabelText}>{row.label}</Text>
                </View>
                <Text style={styles.detailValueText} numberOfLines={1}>
                  {row.value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 3. KEY HIGHLIGHTS PERFORMANCE CARD */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="stats-chart-outline" size={16} color="#18181B" />
            <Text style={styles.sectionTitle}>CAREER HIGHLIGHTS</Text>
          </View>

          <View style={styles.highlightsGrid}>
            <View style={styles.highlightItem}>
              <Text style={styles.highlightLbl}>Batting Avg</Text>
              <Text style={styles.highlightVal}>{stats.battingAvg ?? '0.0'}</Text>
            </View>

            <View style={styles.highlightItem}>
              <Text style={styles.highlightLbl}>Strike Rate</Text>
              <Text style={styles.highlightVal}>{stats.strikeRate ?? '0.0'}</Text>
            </View>

            <View style={styles.highlightItem}>
              <Text style={styles.highlightLbl}>Economy</Text>
              <Text style={styles.highlightVal}>{stats.economy ?? '0.00'}</Text>
            </View>

            <View style={styles.highlightItem}>
              <Text style={styles.highlightLbl}>Best Bowling</Text>
              <Text style={styles.highlightVal}>{stats.bestBowling || '-'}</Text>
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
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEEEF0'
  },
  summaryVal: {
    fontSize: 18,
    fontFamily: systemFontBold,
    color: '#0F172A'
  },
  summaryLbl: {
    fontSize: 11,
    fontFamily: systemFontMedium,
    color: '#64748B',
    marginTop: 3
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEEEF0'
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC'
  },
  sectionTitle: {
    fontSize: 12.5,
    fontFamily: systemFontBold,
    color: '#0F172A',
    letterSpacing: 0.4
  },
  detailsList: {
    gap: 0
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8FA'
  },
  detailLabelCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  detailLabelText: {
    fontSize: 13,
    fontFamily: systemFont,
    color: '#64748B'
  },
  detailValueText: {
    fontSize: 13.5,
    fontFamily: systemFontMedium,
    color: '#0F172A',
    maxWidth: '55%',
    textAlign: 'right'
  },
  highlightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 12
  },
  highlightItem: {
    width: '50%',
    paddingVertical: 4
  },
  highlightLbl: {
    fontSize: 11.5,
    fontFamily: systemFont,
    color: '#64748B'
  },
  highlightVal: {
    fontSize: 16,
    fontFamily: systemFontBold,
    color: '#0F172A',
    marginTop: 2
  }
});

export default ProfileOverviewTab;
