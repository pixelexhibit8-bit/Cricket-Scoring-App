import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { PlayerAvatar } from '../PlayerAvatar.jsx';
import { systemFontBold, systemFontMedium, systemFont, themeColors } from '../../theme.js';

export const ProfileHeroCard = React.memo(function ProfileHeroCard({
  playerName = 'Player',
  profile = {},
  onPressPhoto = () => {}
}) {
  const role = profile?.role || 'All-Rounder';
  const city = profile?.city || 'Local Ground';
  const jerseyNumber = profile?.jerseyNumber;

  return (
    <View style={styles.profileHeaderCard}>
      <View style={styles.profileAvatarRow}>
        <TouchableOpacity
          onPress={onPressPhoto}
          style={styles.avatarWrapper}
          activeOpacity={0.85}
        >
          <PlayerAvatar
            name={playerName}
            photoUrl={profile?.photoUrl}
            size={64}
          />
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={18} color="#18181B" />
          </View>
        </TouchableOpacity>

        <View style={styles.infoCol}>
          <View style={styles.nameRow}>
            <Text style={styles.playerNameText} numberOfLines={1}>
              {playerName}
            </Text>
            {jerseyNumber ? (
              <View style={styles.jerseyBadge}>
                <Text style={styles.jerseyBadgeText}>#{jerseyNumber}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.badgesRow}>
            <View style={styles.roleBadge}>
              <MaterialCommunityIcons name="cricket" size={13} color="#FFFFFF" />
              <Text style={styles.roleBadgeText}>{role}</Text>
            </View>

            {city ? (
              <View style={styles.locationBadge}>
                <Ionicons name="location-outline" size={12} color="#64748B" />
                <Text style={styles.locationBadgeText} numberOfLines={1}>{city}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  profileHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 8
  },
  profileAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14
  },
  avatarWrapper: {
    position: 'relative'
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 10
  },
  infoCol: {
    flex: 1
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  playerNameText: {
    fontSize: 18,
    fontFamily: systemFontBold,
    color: '#0F172A',
    flexShrink: 1
  },
  jerseyBadge: {
    backgroundColor: '#F4F4F5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E4E4E7'
  },
  jerseyBadgeText: {
    color: '#18181B',
    fontSize: 11,
    fontFamily: systemFontBold
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap'
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#18181B',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 6
  },
  roleBadgeText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontFamily: systemFontMedium
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#EEEEF0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  locationBadgeText: {
    color: '#64748B',
    fontSize: 11.5,
    fontFamily: systemFontMedium,
    maxWidth: 140
  }
});

export default ProfileHeroCard;
