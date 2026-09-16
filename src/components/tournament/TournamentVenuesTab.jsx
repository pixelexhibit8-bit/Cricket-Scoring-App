import React, { useMemo } from 'react';
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

export const TournamentVenuesTab = React.memo(function TournamentVenuesTab({
  tournament,
  onSelectVenue
}) {
  const matches = Array.isArray(tournament?.matches) ? tournament.matches : [];
  const location = tournament?.city || tournament?.host || 'Local Grounds';

  const venuesList = useMemo(() => {
    const list = [];
    if (Array.isArray(tournament?.venues) && tournament.venues.length > 0) {
      tournament.venues.forEach(v => {
        if (v && typeof v === 'string' && !list.includes(v.trim())) {
          list.push(v.trim());
        }
      });
    }

    // Also collect any unique venues from match fixtures
    matches.forEach(m => {
      if (m.venue && typeof m.venue === 'string' && !list.includes(m.venue.trim())) {
        list.push(m.venue.trim());
      }
    });

    if (list.length === 0) {
      const fallbackVenue = tournament?.venue || tournament?.ground || (tournament?.city ? `${tournament.city} Cricket Ground` : (tournament?.host || 'Primary Cricket Ground'));
      list.push(fallbackVenue);
    }

    return list;
  }, [tournament, matches]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Category / Region Header */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.regionHeaderLabel}>{location}</Text>
        <Text style={styles.venueCountBadge}>{venuesList.length} {venuesList.length === 1 ? 'Venue' : 'Venues'}</Text>
      </View>

      {/* Venues List Container */}
      <View style={styles.venuesCardContainer}>
        {venuesList.map((vName, idx) => {
          const vMatches = matches.filter(m => String(m.venue || '').trim().toLowerCase() === String(vName).trim().toLowerCase());
          const matchCount = vMatches.length > 0 ? vMatches.length : (venuesList.length === 1 && matches.length > 0 ? matches.length : Math.max(1, Math.round(matches.length / venuesList.length) || 1));

          return (
            <TouchableOpacity
              key={`venue_${idx}_${vName}`}
              style={[
                styles.venueRowItem,
                idx === venuesList.length - 1 && { borderBottomWidth: 0 }
              ]}
              activeOpacity={0.7}
              onPress={() => onSelectVenue && onSelectVenue({ name: vName, location, matchCount })}
            >
              <View style={styles.venueIconWrapper}>
                <MaterialCommunityIcons name="stadium-variant" size={22} color="#0284C7" />
              </View>
              <View style={styles.venueInfoCol}>
                <Text style={styles.venueTitleName} numberOfLines={1}>{vName}</Text>
                <Text style={styles.venueSubtitle} numberOfLines={1}>
                  {location} • {matchCount} {matchCount === 1 ? 'Match' : 'Matches'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>
          );
        })}
      </View>
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4
  },
  regionHeaderLabel: {
    fontSize: 12.5,
    fontFamily: systemFontMedium,
    color: themeColors.textMuted
  },
  venueCountBadge: {
    fontSize: 12,
    fontFamily: systemFontMedium,
    color: '#0284C7'
  },
  venuesCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 0,
    overflow: 'hidden'
  },
  venueRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 0,
    borderBottomColor: '#F8F8FA'
  },
  venueIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  venueInfoCol: {
    flex: 1
  },
  venueTitleName: {
    fontSize: 14,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  venueSubtitle: {
    fontSize: 12,
    fontFamily: systemFont,
    color: themeColors.textMuted,
    marginTop: 2
  }
});

