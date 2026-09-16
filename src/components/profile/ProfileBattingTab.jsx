import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { systemFontBold, systemFontMedium } from '../../theme.js';

export const ProfileBattingTab = React.memo(function ProfileBattingTab({ stats = {} }) {
  return (
    <ScrollView
      style={styles.pageScrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.statsCard}>
        <MaterialCommunityIcons
          name="cricket"
          size={135}
          color="#0F2744"
          style={styles.watermarkIcon}
        />
        <View style={styles.statsCardHeader}>
          <MaterialCommunityIcons name="cricket" size={18} color="#0F2744" />
          <Text style={styles.statsCardTitle}>Batting Performance</Text>
        </View>
        <View style={styles.statRowGrid}>
          <View style={styles.statCol}>
            <Text style={styles.statColVal}>{stats.inningsBatted ?? 0}</Text>
            <Text style={styles.statColLbl}>Innings</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statColVal}>{stats.strikeRate ?? '0.00'}</Text>
            <Text style={styles.statColLbl}>Strike Rate</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statColVal}>{stats.battingAvg ?? '0.00'}</Text>
            <Text style={styles.statColLbl}>Average</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statColVal}>{stats.fours ?? 0}</Text>
            <Text style={styles.statColLbl}>Fours (4s)</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statColVal}>{stats.sixes ?? 0}</Text>
            <Text style={styles.statColLbl}>Sixes (6s)</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statColVal}>{stats.fifties ?? 0}</Text>
            <Text style={styles.statColLbl}>50s</Text>
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
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 0,
    overflow: 'hidden',
    position: 'relative'
  },
  watermarkIcon: {
    position: 'absolute',
    right: -15,
    bottom: -25,
    opacity: 0.04,
    transform: [{ rotate: '-12deg' }]
  },
  statsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    borderBottomWidth: 0,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8
  },
  statsCardTitle: {
    fontSize: 13,
    fontFamily: systemFontBold,
    color: '#0F172A'
  },
  statRowGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 10
  },
  statCol: {
    width: '33.33%',
    alignItems: 'center'
  },
  statColVal: {
    fontSize: 15,
    fontFamily: systemFontBold,
    color: '#0F172A'
  },
  statColLbl: {
    fontSize: 10,
    fontFamily: systemFontMedium,
    color: '#64748B',
    marginTop: 2
  }
});
