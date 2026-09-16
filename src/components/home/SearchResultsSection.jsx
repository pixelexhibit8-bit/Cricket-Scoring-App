import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PlayerAvatar } from '../PlayerAvatar.jsx';
import { MatchListScoreCard } from '../MatchListScoreCard.jsx';
import { ScalePressable, FadeSlideIn } from '../motion/MotionSystem.jsx';
import {
  themeColors,
  spacing,
  radius,
  typeScale,
  systemFont,
  systemFontMedium,
  systemFontBold,
  theme
} from '../../theme.js';
import {
  getScorePartsFromText,
  getFinishedResultCardText
} from '../../utils/cricketUtils.js';

import { FinishedMatchCardItem } from './FinishedMatchCardItem.jsx';

const SearchPlayerCardItem = React.memo(function SearchPlayerCardItem({ player, isLast, onPress }) {
  if (!player) return null;

  return (
    <TouchableOpacity
      style={[styles.searchPlayerRow, !isLast && styles.searchPlayerBorder]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <PlayerAvatar name={player.name} size={36} photoUrl={player.photoUrl || player.photo_url} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.searchPlayerName}>{player.name}</Text>
        <Text style={styles.searchPlayerRole}>
          {player.role || 'Cricket Player'} {player.city || player.team ? `• ${player.city || player.team}` : ''}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={themeColors.textSubtle} />
    </TouchableOpacity>
  );
});

export const SearchResultsSection = React.memo(function SearchResultsSection({
  searchQuery = '',
  totalSearchCount = 0,
  filteredLiveMatches = [],
  filteredFinishedMatches = [],
  filteredPlayers = [],
  onClearSearch,
  onSelectLiveMatch,
  onSelectFinishedMatch,
  onSelectPlayerProfile
}) {
  return (
    <FadeSlideIn distance={12} delay={0}>
      <View style={{ gap: spacing.md }}>
        {/* SEARCH RESULTS SUMMARY */}
        <View style={styles.searchSummaryRow}>
          <Text style={styles.searchSummaryText}>
            Found {totalSearchCount} result{totalSearchCount === 1 ? '' : 's'} for "{searchQuery}"
          </Text>
          <TouchableOpacity
            onPress={onClearSearch}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.searchClearText}>Clear</Text>
          </TouchableOpacity>
        </View>

        {/* EMPTY RESULTS CARD */}
        {totalSearchCount === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="search-outline" size={36} color={themeColors.textSubtle} />
            <Text style={styles.emptyCardTitle}>No matches or players found</Text>
            <Text style={styles.emptyCardSubtitle}>
              Try searching with a different player name, team, or match title.
            </Text>
          </View>
        ) : null}

        {/* FILTERED LIVE MATCHES */}
        {filteredLiveMatches.length > 0 ? (
          <View style={{ gap: spacing.xs }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitleLive}>LIVE MATCHES ({filteredLiveMatches.length})</Text>
            </View>
            {filteredLiveMatches.map((m, idx) => (
              <ScalePressable
                key={`search-live-${m.id || idx}`}
                activeScale={0.98}
                onPress={() => onSelectLiveMatch && onSelectLiveMatch(m)}
                style={[styles.liveMatchCard, { marginBottom: 10 }]}
              >
                <View style={styles.liveCardHeader}>
                  <Text style={styles.liveMatchTitle} numberOfLines={1}>
                    {m.matchTitle || m.title || `${m.team1?.name || 'Team 1'} vs ${m.team2?.name || 'Team 2'}`}
                  </Text>
                  <View style={styles.liveTag}>
                    <Text style={styles.liveTagText}>LIVE</Text>
                  </View>
                </View>
              </ScalePressable>
            ))}
          </View>
        ) : null}

        {/* FILTERED FINISHED MATCHES */}
        {filteredFinishedMatches.length > 0 ? (
          <View style={{ gap: spacing.xs }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>MATCH RESULTS ({filteredFinishedMatches.length})</Text>
            </View>
            {filteredFinishedMatches.map((match, idx) => (
              <FinishedMatchCardItem
                key={`search-fin-${match.id || 'm'}-${idx}`}
                match={match}
                index={idx}
                onPress={() => onSelectFinishedMatch && onSelectFinishedMatch(match)}
              />
            ))}
          </View>
        ) : null}

        {/* FILTERED PLAYERS */}
        {filteredPlayers.length > 0 ? (
          <View style={{ gap: spacing.xs }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>PLAYERS ({filteredPlayers.length})</Text>
            </View>
            <View style={styles.searchPlayerListCard}>
              {filteredPlayers.map((player, idx) => (
                <SearchPlayerCardItem
                  key={`search-pl-${player.name || idx}`}
                  player={player}
                  isLast={idx === filteredPlayers.length - 1}
                  onPress={() => onSelectPlayerProfile && onSelectPlayerProfile(player)}
                />
              ))}
            </View>
          </View>
        ) : null}
      </View>
    </FadeSlideIn>
  );
});

const styles = StyleSheet.create({
  searchSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    paddingVertical: 4
  },
  searchSummaryText: {
    fontSize: 13,
    color: themeColors.textSecondary,
    fontFamily: systemFontMedium
  },
  searchClearText: {
    fontSize: 13,
    color: themeColors.textPrimary,
    fontFamily: systemFontBold
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xxl,
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    gap: spacing.sm
  },
  emptyCardTitle: {
    fontSize: typeScale.name,
    color: theme.light.textPrimary,
    fontFamily: systemFontBold,
    marginTop: spacing.xs
  },
  emptyCardSubtitle: {
    fontSize: typeScale.caption,
    color: theme.light.textMuted,
    fontFamily: systemFontMedium,
    textAlign: 'center',
    lineHeight: 17,
    maxWidth: 260
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: 4
  },
  sectionTitle: {
    fontSize: 11.5,
    color: theme.light.textMuted,
    letterSpacing: 0.8,
    fontFamily: systemFontBold
  },
  sectionTitleLive: {
    fontSize: 11.5,
    color: theme.light.primary,
    letterSpacing: 0.8,
    fontFamily: systemFontBold
  },
  liveMatchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 0,
    gap: 12
  },
  liveCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  liveMatchTitle: {
    fontSize: typeScale.label,
    color: theme.light.textPrimary,
    fontFamily: systemFontBold,
    flex: 1
  },
  liveTag: {
    backgroundColor: theme.light.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm
  },
  liveTagText: {
    fontSize: 10,
    color: theme.light.primary,
    fontFamily: systemFontBold
  },
  searchPlayerListCard: {
    backgroundColor: themeColors.surface,
    borderRadius: radius.lg,
    borderWidth: 0,
    overflow: 'hidden'
  },
  searchPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12
  },
  searchPlayerBorder: {
    borderBottomWidth: 0,
    borderBottomColor: themeColors.border
  },
  searchPlayerName: {
    fontSize: 13.5,
    color: themeColors.textPrimary,
    fontFamily: systemFontMedium
  },
  searchPlayerRole: {
    fontSize: 12,
    color: themeColors.textMuted,
    fontFamily: systemFont,
    marginTop: 1
  }
});

export default SearchResultsSection;
