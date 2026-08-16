import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { systemFont, systemFontBold, fontWeights } from '../theme.js';
import { getPlayerPhotoFromRegistry, resolveDirectImageUrl } from '../services/playerPhotoStore.js';

// Curated harmonious color palettes for player initials (Deterministic per player)
const AVATAR_PALETTES = [
  { bg: '#E0F2FE', text: '#0284C7', border: '#BAE6FD' }, // Sky Blue
  { bg: '#EDE9FE', text: '#7C3AED', border: '#DDD6FE' }, // Violet
  { bg: '#D1FAE5', text: '#059669', border: '#A7F3D0' }, // Emerald
  { bg: '#FFE4E6', text: '#E11D48', border: '#FECDD3' }, // Rose
  { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' }, // Amber
  { bg: '#E0E7FF', text: '#4F46E5', border: '#C7D2FE' }, // Indigo
  { bg: '#CCFBF1', text: '#0D9488', border: '#99F6E4' }, // Teal
  { bg: '#FCE7F3', text: '#DB2777', border: '#FBCFE8' }, // Pink
  { bg: '#F1F5F9', text: '#334155', border: '#CBD5E1' }  // Slate
];

export const getPlayerAvatarTheme = (name = '') => {
  if (!name || typeof name !== 'string') return AVATAR_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
};

export const getPlayerInitials = (name = '') => {
  if (!name || typeof name !== 'string') return '';
  const clean = name.trim().replace(/[^a-zA-Z0-9\s]/g, '');
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

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

  // Tier 1: Real Photo (Camera / Gallery / Cloudinary URL)
  if (isValidUrl && !loadError) {
    const optimizedUri = optimizeCloudinaryUrl(targetUri, size);
    return (
      <View style={[{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: '#E2E8F0', borderWidth: 1, borderColor: '#CBD5E1' }, style]}>
        <Image
          source={{ uri: optimizedUri }}
          style={{ width: '100%', height: '100%', borderRadius: size / 2 }}
          resizeMode="cover"
          onError={() => setLoadError(true)}
        />
      </View>
    );
  }

  // Tier 2: Industry-Standard Dynamic Initials Badge with Deterministic Palette
  const initials = getPlayerInitials(name);
  const palette = getPlayerAvatarTheme(name);
  const fontSize = Math.max(10, Math.round(size * (initials.length > 1 ? 0.36 : 0.44)));

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: palette.bg,
          borderWidth: 1,
          borderColor: palette.border,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        },
        style
      ]}
    >
      {initials ? (
        <Text
          style={{
            color: palette.text,
            fontSize,
            lineHeight: size,
            textAlign: 'center',
            includeFontPadding: false,
            fontFamily: systemFontBold,
            fontWeight: fontWeights.bold
          }}
          numberOfLines={1}
        >
          {initials}
        </Text>
      ) : (
        <Ionicons name="person" size={Math.round(size * 0.52)} color={palette.text} />
      )}
    </View>
  );
};

export default PlayerAvatar;
