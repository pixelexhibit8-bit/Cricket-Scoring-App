import React from 'react';
import { View, Text, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getTeamLogoSource, resolveTeamWithRoster, isPlaceholderTeam } from '../utils/teamUtils';
import { systemFontBold } from '../theme';

export const TeamIdentityMark = ({
  team,
  tournamentTeams = [],
  logoSource,
  size = 42,
  isLoser = false,
  isMuted = false,
  opacity = 1,
  style
}) => {
  const resolved = resolveTeamWithRoster(team, tournamentTeams);
  const isPlaceholder = resolved?.isPlaceholder || isPlaceholderTeam(team);
  const source = logoSource || (isPlaceholder ? null : getTeamLogoSource(resolved, tournamentTeams));

  if (isPlaceholder || !source) {
    return (
      <View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: '#0F172A',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 0,
            borderColor: '#334155',
            opacity: isMuted ? 0.6 : opacity
          },
          style
        ]}
      >
        <MaterialCommunityIcons
          name="shield-outline"
          size={Math.max(12, Math.round(size * 0.52))}
          color="#94A3B8"
        />
      </View>
    );
  }

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          overflow: 'hidden',
          backgroundColor: 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isMuted ? 0.6 : opacity
        },
        style
      ]}
    >
      <Image source={source} resizeMode="contain" style={{ width: '100%', height: '100%' }} />
    </View>
  );
};

export default TeamIdentityMark;
