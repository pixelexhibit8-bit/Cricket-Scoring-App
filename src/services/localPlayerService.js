import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured, generateUUID } from './supabaseClient.js';
import { MASTER_PLAYERS_DB } from '../../mockData.js';
import { registerPlayerPhoto, syncPlayersToPhotoRegistry } from './playerPhotoStore.js';

const LOCAL_PLAYERS_STORAGE_KEY = '@cricflow_local_players_db_v1';

// Preset avatar collection for local ground players
export const PRESET_PLAYER_AVATARS = [
  { id: 'avatar_bat_1', label: 'Batsman', url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=150&auto=format&fit=crop&q=80' },
  { id: 'avatar_bowl_1', label: 'Pacer', url: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=150&auto=format&fit=crop&q=80' },
  { id: 'avatar_all_1', label: 'Captain', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
  { id: 'avatar_wk_1', label: 'Keeper', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' },
  { id: 'avatar_spin_1', label: 'Spinner', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' }
];

// Initial pre-seeded local players (Clean slate for real ground players)
const DEFAULT_LOCAL_PLAYERS = [];

/**
 * Fetch all local players (Combines Supabase local_players table + AsyncStorage fallback)
 */
export const fetchLocalPlayers = async () => {
  let localDbPlayers = null;

  // 1. Try Supabase fetch if configured (Authoritative Cloud Source of Truth)
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('local_players')
        .select('*')
        .order('name', { ascending: true });

      if (!error && Array.isArray(data)) {
        localDbPlayers = data.map(row => ({
          id: row.id,
          name: row.name,
          role: row.role || 'All-Rounder',
          photoUrl: row.photo_url || row.photoUrl || '',
          phone: row.phone || ''
        }));
      }
    } catch (err) {
      console.warn('[LocalPlayerService] Supabase fetch fallback to local cache:', err.message || err);
    }
  }

  // 2. If Supabase responded successfully, update local cache to match authoritative cloud state (Deletions are respected!)
  if (localDbPlayers !== null) {
    try {
      await AsyncStorage.setItem(LOCAL_PLAYERS_STORAGE_KEY, JSON.stringify(localDbPlayers));
    } catch {}
    syncPlayersToPhotoRegistry(localDbPlayers);
    return localDbPlayers;
  }

  // 3. Offline Fallback: If network is unreachable, read from AsyncStorage cache
  let cachedPlayers = [];
  try {
    const cachedStr = await AsyncStorage.getItem(LOCAL_PLAYERS_STORAGE_KEY);
    cachedPlayers = cachedStr ? JSON.parse(cachedStr) : [];
  } catch (err) {}

  syncPlayersToPhotoRegistry(cachedPlayers);
  return cachedPlayers;
};

export const resolveDirectImageUrl = async (url) => {
  if (!url || typeof url !== 'string') return '';
  const clean = url.trim();
  if (!clean) return '';

  // Direct image URLs (ending with .jpg, .png, etc.) or i.ibb.co CDN links
  if (/\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(clean) || clean.includes('i.ibb.co/')) {
    return clean;
  }

  // Auto-resolve ImgBB webpage links (e.g. https://ibb.co/Sw9nSftR) to direct raw image URL
  if (clean.includes('ibb.co/')) {
    try {
      const oembedUrl = `${clean.replace(/\/$/, '')}/oembed.json`;
      const res = await fetch(oembedUrl);
      if (res.ok) {
        const json = await res.json();
        if (json && json.url) return json.url;
      }
    } catch (e) {}
  }

  return clean;
};

/**
 * Add a new local player (Saves to both Supabase local_players table and AsyncStorage)
 */
export const saveLocalPlayer = async (newPlayer) => {
  if (!newPlayer || !newPlayer.name) return null;

  const rawPhoto = typeof newPlayer.photoUrl === 'string' ? newPlayer.photoUrl.trim() : '';
  const resolvedPhotoUrl = await resolveDirectImageUrl(rawPhoto);

  const playerObj = {
    id: newPlayer.id || generateUUID(),
    name: newPlayer.name.trim(),
    role: newPlayer.role || 'All-Rounder',
    photoUrl: resolvedPhotoUrl,
    phone: newPlayer.phone ? newPlayer.phone.trim() : ''
  };

  // 1. Save to Supabase if configured
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase
        .from('local_players')
        .upsert({
          id: playerObj.id,
          name: playerObj.name,
          role: playerObj.role,
          photo_url: playerObj.photoUrl,
          phone: playerObj.phone
        }, { onConflict: 'name' });
    } catch (err) {
      console.warn('[LocalPlayerService] Supabase save warning:', err.message || err);
    }
  }

  // 2. Save to AsyncStorage cache
  try {
    const existing = await fetchLocalPlayers();
    const updated = [playerObj, ...existing.filter(p => p.name.toLowerCase() !== playerObj.name.toLowerCase())];
    await AsyncStorage.setItem(LOCAL_PLAYERS_STORAGE_KEY, JSON.stringify(updated));
    registerPlayerPhoto(playerObj.name, playerObj.photoUrl);
    return playerObj;
  } catch (err) {
    console.warn('[LocalPlayerService] AsyncStorage save error:', err);
    registerPlayerPhoto(playerObj.name, playerObj.photoUrl);
    return playerObj;
  }
};
