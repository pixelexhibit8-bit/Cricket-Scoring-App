import React from 'react';
import { View, Image } from 'react-native';
import { getTeamLogoSource } from '../utils/teamUtils';

export const TeamIdentityMark = ({ team, logoSource, size = 42 }) => {
  const source = logoSource || getTeamLogoSource(team);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Image source={source} resizeMode="contain" style={{ width: size, height: size }} />
    </View>
  );
};

export default TeamIdentityMark;
