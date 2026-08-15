import React from 'react';
import { View, Image } from 'react-native';
import { getTeamLogoSource } from '../utils/teamUtils';

export const TeamIdentityMark = ({ team, logoSource, size = 42, isLoser = false, isMuted = false, opacity = 1 }) => {
  const source = logoSource || getTeamLogoSource(team);
  const resolvedOpacity = (isLoser || isMuted) ? 0.35 : opacity;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', opacity: resolvedOpacity }}>
      <Image source={source} resizeMode="contain" style={{ width: size, height: size }} />
    </View>
  );
};

export default TeamIdentityMark;
