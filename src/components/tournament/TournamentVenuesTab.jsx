import React from 'react';
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
  const location = tournament?.host || tournament?.city || 'Local Ground';
  const venueName = tournament?.venue || tournament?.ground || (tournament?.city ? `${tournament.city} Cricket Ground` : 'Kensington Oval');
  const matchesCount = matches.length > 0 ? matches.length : 8;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Category / Region Header */}
      <Text style={styles.regionHeaderLabel}>{location}</Text>

      {/* Venues List Container */}
      <View style={styles.venuesCardContainer}>
        <TouchableOpacity
          style={styles.venueRowItem}
          activeOpacity={0.7}
          onPress={() => onSelectVenue && onSelectVenue({ name: venueName, location })}
        >
          <View style={styles.venueInfoCol}>
            <Text style={styles.venueTitleName}>{venueName}</Text>
            <Text style={styles.venueSubtitle}>
              {location}, {matchesCount} Matches
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>
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
  regionHeaderLabel: {
    fontSize: 12.5,
    fontFamily: systemFontMedium,
    color: themeColors.textMuted,
    marginBottom: 8,
    paddingLeft: 4
  },
  venuesCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    overflow: 'hidden'
  },
  venueRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16
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
