import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { PlayerAvatar } from '../PlayerAvatar.jsx';
import { systemFontBold, systemFontMedium } from '../../theme.js';

export const ProfileHeroCard = React.memo(function ProfileHeroCard({
  playerName,
  profile,
  onPressPhoto
}) {
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
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.playerNameText} numberOfLines={1}>{playerName}</Text>
            {profile?.jerseyNumber ? (
              <View style={styles.jerseyBadge}>
                <Text style={styles.jerseyBadgeText}>#{profile.jerseyNumber}</Text>
              </View>
            ) : null}
            <Ionicons name="checkmark-circle" size={17} color="#0284C7" />
          </View>

          <Text style={styles.playerRoleText}>
            {profile?.role || 'All-Rounder'} • {profile?.city || 'Local Ground'}
          </Text>

          <View style={styles.styleBadgesRow}>
            <View style={styles.styleBadgeItem}>
              <MaterialCommunityIcons name="cricket" size={12} color="#18181B" />
              <Text style={styles.styleBadgeText}>{profile?.battingStyle || 'Right Hand Bat'}</Text>
            </View>
            <View style={[styles.styleBadgeItem, styles.bowlingBadgeItem]}>
              <MaterialCommunityIcons name="baseball" size={12} color="#64748B" />
              <Text style={[styles.styleBadgeText, { color: '#475569' }]}>
                {profile?.bowlingStyle || 'Right Arm Medium'}
              </Text>
            </View>
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
    borderWidth: 0,
    marginHorizontal: 14,
    marginTop: 12,
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
  playerNameText: {
    fontSize: 17,
    fontFamily: systemFontBold,
    color: '#0F172A'
  },
  jerseyBadge: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  jerseyBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: systemFontMedium
  },
  playerRoleText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: systemFontMedium,
    marginTop: 2
  },
  styleBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap'
  },
  styleBadgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 0
  },
  bowlingBadgeItem: {
    backgroundColor: '#F8FAFC'
  },
  styleBadgeText: {
    fontSize: 11,
    fontFamily: systemFontMedium,
    color: '#0284C7'
  }
});
