import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { systemFontBold, systemFontMedium } from '../../theme.js';

export const ProfileBowlingTab = React.memo(function ProfileBowlingTab({ stats = {} }) {
  return (
    <ScrollView
      style={styles.pageScrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.statsCard}>
        <MaterialCommunityIcons
          name="baseball"
          size={135}
          color="#EA580C"
          style={styles.watermarkIcon}
        />
        <View style={styles.statsCardHeader}>
          <MaterialCommunityIcons name="baseball" size={18} color="#EA580C" />
          <Text style={styles.statsCardTitle}>Bowling Performance</Text>
        </View>
        <View style={styles.statRowGrid}>
          <View style={styles.statCol}>
            <Text style={styles.statColVal}>{stats.oversBowled ?? '0.0'}</Text>
            <Text style={styles.statColLbl}>Overs</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statColVal}>{stats.wickets ?? 0}</Text>
            <Text style={styles.statColLbl}>Wickets</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statColVal}>{stats.economy ?? '0.00'}</Text>
            <Text style={styles.statColLbl}>Economy</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statColVal}>{stats.maidens ?? 0}</Text>
            <Text style={styles.statColLbl}>Maidens</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statColVal}>{stats.bestBowling || '-'}</Text>
            <Text style={styles.statColLbl}>Best Bowling</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statColVal}>{stats.runsConceded ?? 0}</Text>
            <Text style={styles.statColLbl}>Runs Given</Text>
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
    transform: [{ rotate: '12deg' }]
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
