import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured, generateUUID } from './supabaseClient.js';
import { registerPlayerPhoto, syncPlayersToPhotoRegistry, resolveDirectImageUrl } from './playerPhotoStore.js';

const LOCAL_PLAYERS_STORAGE_KEY = '@cricflow_local_players_db_v1';

/**
 * Fetch all local players (Combines Supabase local_players table + AsyncStorage fallback with smart deduplication)
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

  // Helper to deduplicate players by unique id or exact name + phone
  const deduplicatePlayers = (players) => {
    if (!Array.isArray(players)) return [];
    const seen = new Map();
    for (const p of players) {
      if (!p || !p.name) continue;
      const key = p.id || `${p.name.trim().toLowerCase()}_${p.phone ? p.phone.trim() : ''}`;
      
      const existing = seen.get(key);
      if (!existing) {
        seen.set(key, p);
      } else {
        // Keep the more complete record (e.g. has photo or formatted name)
        const preferCurrent = (p.photoUrl && !existing.photoUrl) || (p.name.length >= existing.name.length);
        if (preferCurrent) {
          seen.set(key, { ...existing, ...p });
        }
      }
    }
    return Array.from(seen.values());
  };

  // 2. If Supabase responded successfully, deduplicate and update local cache
  if (localDbPlayers !== null) {
    const cleanPlayers = deduplicatePlayers(localDbPlayers);
    try {
      await AsyncStorage.setItem(LOCAL_PLAYERS_STORAGE_KEY, JSON.stringify(cleanPlayers));
    } catch {}
    syncPlayersToPhotoRegistry(cleanPlayers);
    return cleanPlayers;
  }

  // 3. Offline Fallback: If network is unreachable, read from AsyncStorage cache
  let cachedPlayers = [];
  try {
    const cachedStr = await AsyncStorage.getItem(LOCAL_PLAYERS_STORAGE_KEY);
    cachedPlayers = cachedStr ? JSON.parse(cachedStr) : [];
  } catch (err) {}

  const cleanCached = deduplicatePlayers(cachedPlayers);
  syncPlayersToPhotoRegistry(cleanCached);
  return cleanCached;
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

  // 1. Save to Supabase strictly by immutable Player ID (Primary Key)
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
        }, { onConflict: 'id' });
    } catch (err) {
      console.warn('[LocalPlayerService] Supabase save warning:', err.message || err);
    }
  }

  // 2. Save to AsyncStorage cache by ID
  try {
    const existing = await fetchLocalPlayers();
    const updated = [playerObj, ...existing.filter(p => p.id !== playerObj.id)];
    await AsyncStorage.setItem(LOCAL_PLAYERS_STORAGE_KEY, JSON.stringify(updated));
    registerPlayerPhoto(playerObj.name, playerObj.photoUrl);
    return playerObj;
  } catch (err) {
    console.warn('[LocalPlayerService] AsyncStorage save error:', err);
    registerPlayerPhoto(playerObj.name, playerObj.photoUrl);
    return playerObj;
  }
};

/**
 * Aggregate match scorecard stats into local_players career stats
 */
export const aggregateMatchToPlayerStats = async (finishedMatch) => {
  if (!finishedMatch) return;
  try {
    const existingPlayers = await fetchLocalPlayers();
    const playerMap = new Map();
    existingPlayers.forEach(p => {
      if (p?.name) playerMap.set(p.name.trim().toLowerCase(), p);
    });

    const batters = [
      ...(finishedMatch.team1?.batting || []),
      ...(finishedMatch.team2?.batting || [])
    ];

    const bowlers = [
      ...(finishedMatch.team1?.bowling || []),
      ...(finishedMatch.team2?.bowling || [])
    ];

    const matchParticipants = new Set();

    batters.forEach(b => {
      if (!b?.name) return;
      const key = b.name.trim().toLowerCase();
      matchParticipants.add(key);
      let p = playerMap.get(key) || { id: generateUUID(), name: b.name.trim(), role: 'Batter' };
      const currentStats = p.stats || { matches: 0, runs: 0, balls: 0, fours: 0, sixes: 0, highestScore: 0, fifties: 0, hundreds: 0, wickets: 0, overs: 0, runsConceded: 0, maidens: 0 };
      
      const runs = Number(b.runs) || 0;
      const balls = Number(b.balls) || 0;
      const f4 = Number(b.fours) || 0;
      const f6 = Number(b.sixes) || 0;

      p.stats = {
        ...currentStats,
        runs: (currentStats.runs || 0) + runs,
        balls: (currentStats.balls || 0) + balls,
        fours: (currentStats.fours || 0) + f4,
        sixes: (currentStats.sixes || 0) + f6,
        highestScore: Math.max(currentStats.highestScore || 0, runs),
        fifties: (currentStats.fifties || 0) + (runs >= 50 && runs < 100 ? 1 : 0),
        hundreds: (currentStats.hundreds || 0) + (runs >= 100 ? 1 : 0),
      };
      playerMap.set(key, p);
    });

    bowlers.forEach(bowl => {
      if (!bowl?.name) return;
      const key = bowl.name.trim().toLowerCase();
      matchParticipants.add(key);
      let p = playerMap.get(key) || { id: generateUUID(), name: bowl.name.trim(), role: 'Bowler' };
      const currentStats = p.stats || { matches: 0, runs: 0, balls: 0, fours: 0, sixes: 0, highestScore: 0, fifties: 0, hundreds: 0, wickets: 0, overs: 0, runsConceded: 0, maidens: 0 };

      const ov = parseFloat(bowl.overs) || 0;
      const wk = Number(bowl.wickets) || 0;
      const rc = Number(bowl.runs) || 0;
      const md = Number(bowl.maidens) || 0;

      p.stats = {
        ...currentStats,
        overs: Number(((currentStats.overs || 0) + ov).toFixed(1)),
        wickets: (currentStats.wickets || 0) + wk,
        runsConceded: (currentStats.runsConceded || 0) + rc,
        maidens: (currentStats.maidens || 0) + md,
      };
      playerMap.set(key, p);
    });

    matchParticipants.forEach(key => {
      const p = playerMap.get(key);
      if (p) {
        p.stats = {
          ...p.stats,
          matches: (p.stats?.matches || 0) + 1
        };
      }
    });

    const updatedList = Array.from(playerMap.values());
    await AsyncStorage.setItem(LOCAL_PLAYERS_STORAGE_KEY, JSON.stringify(updatedList));
  } catch (err) {
    console.warn('[LocalPlayerService] Error aggregating player stats:', err);
  }
};
