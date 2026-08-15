import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { systemFont, fontWeights } from '../theme.js';
import { getPlayerPhotoFromRegistry, resolveDirectImageUrl } from '../services/playerPhotoStore.js';

export const DEFAULT_PLAYER_AVATAR_URL = 'https://res.cloudinary.com/aov9a8tl/image/upload/v1786749377/Logo_Grey.png';

/**
 * On-the-fly Cloudinary Image Optimizer & Dynamic Resizer
 * Adds automatic format (WebP/AVIF), auto compression (q_auto), and exact width scaling (w_XX).
 */
export const optimizeCloudinaryUrl = (url, size = 36) => {
  if (!url || typeof url !== 'string') return url;
  if (!url.includes('cloudinary.com') || url.includes('/w_')) return url;

  const targetWidth = Math.min(600, Math.max(64, Math.round(size * 2))); // 2x for Retina sharpness
  const transformation = `w_${targetWidth},c_fill,q_auto,f_auto`;
  return url.replace('/image/upload/', `/image/upload/${transformation}/`);
};

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
    const optimizedUri = optimizeCloudinaryUrl(targetUri, size);
    return (
      <View style={[{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: '#E2E8F0' }, style]}>
        <Image
          source={{ uri: optimizedUri }}
          style={{ width: '100%', height: '100%', borderRadius: size / 2 }}
          resizeMode="cover"
          onError={() => setLoadError(true)}
        />
      </View>
    );
  }

  // Cloudinary Logo_Grey Default Fallback for all players without custom DP
  const defaultOptimizedUrl = optimizeCloudinaryUrl(DEFAULT_PLAYER_AVATAR_URL, size);

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#E2E8F0',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        },
        style
      ]}
    >
      <Image
        source={{ uri: defaultOptimizedUrl }}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: size / 2
        }}
        resizeMode="cover"
        defaultSource={require('../../assets/logo.png')}
      />
    </View>
  );
};

export default PlayerAvatar;
