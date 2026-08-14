import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { systemFont, fontWeights } from '../theme.js';
import { getPlayerPhotoFromRegistry, resolveDirectImageUrl } from '../services/playerPhotoStore.js';

export const PlayerAvatar = ({ name, photoUrl, size = 36, style }) => {
  const [loadError, setLoadError] = useState(false);
  const [resolvedUri, setResolvedUri] = useState('');

  const rawUrl = photoUrl || getPlayerPhotoFromRegistry(name);

  useEffect(() => {
    let active = true;
    setLoadError(false);
    if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
      setResolvedUri('');
      return;
    }

    resolveDirectImageUrl(rawUrl).then(direct => {
      if (active) setResolvedUri(direct);
    }).catch(() => {
      if (active) setResolvedUri(rawUrl.trim());
    });

    return () => { active = false; };
  }, [rawUrl]);

  const targetUri = resolvedUri || (typeof rawUrl === 'string' ? rawUrl.trim() : '');
  const isValidUrl = targetUri.startsWith('http://') || targetUri.startsWith('https://') || targetUri.startsWith('data:') || targetUri.startsWith('file:');

  if (isValidUrl && !loadError) {
    return (
      <View style={[{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: '#E2E8F0' }, style]}>
        <Image
          source={{ uri: targetUri }}
          style={{ width: '100%', height: '100%', borderRadius: size / 2 }}
          resizeMode="cover"
          onError={() => setLoadError(true)}
        />
      </View>
    );
  }

  // CricHeroes Style Grayscale Silhouette / App Logo Fallback
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#E2E8F0',
          alignItems: 'center',
          justify: 'center',
          overflow: 'hidden'
        },
        style
      ]}
    >
      <Image
        source={require('../../assets/logo.png')}
        style={{
          width: '70%',
          height: '70%',
          opacity: 0.45,
          tintColor: '#64748B'
        }}
        resizeMode="contain"
      />
    </View>
  );
};

export default PlayerAvatar;
