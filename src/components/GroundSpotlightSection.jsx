import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PlayerAvatar } from './PlayerAvatar.jsx';
import { systemFontMedium, systemFontBold } from '../theme.js';

export function GroundSpotlightSection({
  topBatters = [],
  topBowlers = [],
  topAllRounders = [],
  onSelectPlayer,
  onViewAll
}) {
  if (!topBatters.length && !topBowlers.length && !topAllRounders.length) {
    return null;
  }

  const topBatter = topBatters[0];
  const topBowler = topBowlers[0];
  const topAllRounder = topAllRounders[0];

  return (
    <View style={styles.container}>
      {/* SECTION HEADER */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>
          GROUND SPOTLIGHT
        </Text>
        <TouchableOpacity
          onPress={onViewAll}
          style={styles.viewAllBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="chevron-forward" size={13} color="#18181B" />
        </TouchableOpacity>
      </View>

      {/* 3 COLORFUL SPOTLIGHT CARDS */}
      <View style={styles.cardsRow}>
        {/* 1. TOP BATTER CARD (Full Navy Blue Theme) */}
        {topBatter ? (
          <TouchableOpacity
            onPress={() => onSelectPlayer && onSelectPlayer(topBatter.name, { role: 'Top Batsman', photoUrl: topBatter.photoUrl || topBatter.photo_url })}
            activeOpacity={0.85}
            style={[styles.card, styles.batterCard]}
          >
            <View style={styles.avatarWrap}>
              <PlayerAvatar name={topBatter.name} photoUrl={topBatter.photoUrl || topBatter.photo_url} size={42} />
              <View style={[styles.rankBadge, styles.batterBadge]}>
                <Text style={styles.rankBadgeText}>#1</Text>
              </View>
            </View>

            <Text style={[styles.playerName, styles.textWhite]} numberOfLines={1}>
              {topBatter.name}
            </Text>

            <View style={[styles.roleChip, styles.batterChip]}>
              <Text style={[styles.roleChipText, { color: '#BAE6FD' }]}>BATTER</Text>
            </View>

            <View style={[styles.statBottom, styles.batterStatBorder]}>
              <Text style={[styles.statPrimary, { color: '#FFFFFF' }]}>
                {topBatter.runs ?? 0} <Text style={styles.statUnitLight}>Runs</Text>
              </Text>
              <Text style={styles.statSecondaryLight} numberOfLines={1}>
                SR: {topBatter.sr || '0.0'}
              </Text>
            </View>
          </TouchableOpacity>
        ) : null}

        {/* 2. TOP BOWLER CARD (Full Vibrant Orange Theme) */}
        {topBowler ? (
          <TouchableOpacity
            onPress={() => onSelectPlayer && onSelectPlayer(topBowler.name, { role: 'Top Bowler', photoUrl: topBowler.photoUrl || topBowler.photo_url })}
            activeOpacity={0.85}
            style={[styles.card, styles.bowlerCard]}
          >
            <View style={styles.avatarWrap}>
              <PlayerAvatar name={topBowler.name} photoUrl={topBowler.photoUrl || topBowler.photo_url} size={42} />
              <View style={[styles.rankBadge, styles.bowlerBadge]}>
                <Text style={styles.rankBadgeText}>#1</Text>
              </View>
            </View>

            <Text style={[styles.playerName, styles.textWhite]} numberOfLines={1}>
              {topBowler.name}
            </Text>

            <View style={[styles.roleChip, styles.bowlerChip]}>
              <Text style={[styles.roleChipText, { color: '#FFEDD5' }]}>BOWLER</Text>
            </View>

            <View style={[styles.statBottom, styles.bowlerStatBorder]}>
              <Text style={[styles.statPrimary, { color: '#FFFFFF' }]}>
                {topBowler.wickets ?? 0} <Text style={styles.statUnitLight}>Wkts</Text>
              </Text>
              <Text style={styles.statSecondaryLight} numberOfLines={1}>
                Eco: {topBowler.econ || '0.0'}
              </Text>
            </View>
          </TouchableOpacity>
        ) : null}

        {/* 3. TOP ALL-ROUNDER CARD (Full Sleek Black Theme) */}
        {topAllRounder ? (
          <TouchableOpacity
            onPress={() => onSelectPlayer && onSelectPlayer(topAllRounder.name, { role: 'All-Rounder', photoUrl: topAllRounder.photoUrl || topAllRounder.photo_url })}
            activeOpacity={0.85}
            style={[styles.card, styles.allRounderCard]}
          >
            <View style={styles.avatarWrap}>
              <PlayerAvatar name={topAllRounder.name} photoUrl={topAllRounder.photoUrl || topAllRounder.photo_url} size={42} />
              <View style={[styles.rankBadge, styles.allRounderBadge]}>
                <Text style={styles.rankBadgeText}>#1</Text>
              </View>
            </View>

            <Text style={[styles.playerName, styles.textWhite]} numberOfLines={1}>
              {topAllRounder.name}
            </Text>

            <View style={[styles.roleChip, styles.allRounderChip]}>
              <Text style={[styles.roleChipText, { color: '#E2E8F0' }]}>ALL-R</Text>
            </View>

            <View style={[styles.statBottom, styles.allRounderStatBorder]}>
              <Text style={[styles.statPrimary, { color: '#FFFFFF' }]}>
                {topAllRounder.runs ?? 0}R • {topAllRounder.wickets ?? 0}W
              </Text>
              <Text style={styles.statSecondaryLight} numberOfLines={1}>
                {topAllRounder.matches || 1} Matches
              </Text>
            </View>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    marginBottom: 4
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2
  },
  sectionTitle: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: systemFontMedium,
    letterSpacing: 0.5,
    textTransform: 'uppercase'
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2
  },
  viewAllText: {
    color: '#18181B',
    fontSize: 11.5,
    fontFamily: systemFontMedium
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 8
  },
  card: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderWidth: 1,
    alignItems: 'center',
    gap: 5
  },

  // 1. Full Navy Blue Card
  batterCard: {
    backgroundColor: '#0F2744',
    borderColor: '#1E3A8A'
  },
  batterBadge: {
    backgroundColor: '#0284C7'
  },
  batterChip: {
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    borderColor: 'rgba(56, 189, 248, 0.35)'
  },
  batterStatBorder: {
    borderTopColor: 'rgba(255, 255, 255, 0.12)'
  },

  // 2. Full Orange Card
  bowlerCard: {
    backgroundColor: '#EA580C',
    borderColor: '#C2410C'
  },
  bowlerBadge: {
    backgroundColor: '#9A3412'
  },
  bowlerChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderColor: 'rgba(255, 255, 255, 0.4)'
  },
  bowlerStatBorder: {
    borderTopColor: 'rgba(255, 255, 255, 0.2)'
  },

  // 3. Full Black Card
  allRounderCard: {
    backgroundColor: '#18181B',
    borderColor: '#27272A'
  },
  allRounderBadge: {
    backgroundColor: '#3F3F46'
  },
  allRounderChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'rgba(255, 255, 255, 0.25)'
  },
  allRounderStatBorder: {
    borderTopColor: 'rgba(255, 255, 255, 0.12)'
  },

  avatarWrap: {
    position: 'relative'
  },
  rankBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#FFFFFF'
  },
  rankBadgeText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontFamily: systemFontMedium
  },
  playerName: {
    fontSize: 11.5,
    fontFamily: systemFontMedium,
    textAlign: 'center'
  },
  textWhite: {
    color: '#FFFFFF'
  },
  roleChip: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 5,
    borderWidth: 1
  },
  roleChipText: {
    fontSize: 9,
    fontFamily: systemFontMedium
  },
  statBottom: {
    width: '100%',
    borderTopWidth: 1,
    paddingTop: 5,
    alignItems: 'center'
  },
  statPrimary: {
    fontSize: 12,
    fontFamily: systemFontMedium
  },
  statUnitLight: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.75)',
    fontFamily: systemFontMedium
  },
  statSecondaryLight: {
    fontSize: 9.5,
    color: 'rgba(255, 255, 255, 0.75)',
    fontFamily: systemFontMedium
  }
});
