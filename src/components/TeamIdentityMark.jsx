import React from 'react';
import { View, Image } from 'react-native';
import { getTeamLogoSource } from '../utils/teamUtils';

export const TeamIdentityMark = ({ team, logoSource, size = 42, isLoser = false, isMuted = false, opacity = 1, style }) => {
  const source = logoSource || getTeamLogoSource(team);

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
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
