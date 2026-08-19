import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, generateUUID } from './supabaseClient.js';
import { syncPlayerNameToPastMatches } from './matchService.js';

const AUTH_STORAGE_KEY = '@cricscorer_auth_user';
const PROFILE_STORAGE_KEY = '@cricscorer_player_profile';

/**
 * Get currently logged-in user session from local storage
 */
export async function getCurrentUser() {
  try {
    const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Get player profile (with cricket styles, stats, etc.)
 * Supports auto-linking by user ID or phone number
 */
export async function getPlayerProfile(userId, phone) {
  try {
    // 1. Check local cached profile first
    const raw = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!userId || parsed.id === userId || parsed.auth_user_id === userId || (phone && parsed.phone === phone)) {
        return parsed;
      }
    }

    // 2. Query Supabase local_players by phone or auth_user_id
    if (supabase) {
      try {
        let query = supabase.from('local_players').select('*');
        if (phone) {
          query = query.eq('phone', phone.trim());
        } else if (userId) {
          query = query.or(`auth_user_id.eq.${userId},id.eq.${userId}`);
        } else {
          return null;
        }

        const { data, error } = await query.limit(1);
        if (!error && Array.isArray(data) && data.length > 0) {
          const row = data[0];
          const matchedProfile = {
            id: row.id,
            name: row.name,
            role: row.role || 'All-Rounder',
            battingStyle: row.batting_style || 'Right Hand Bat',
            bowlingStyle: row.bowling_style || 'Right Arm Medium',
            city: row.city || 'Local Ground',
            phone: row.phone || phone || '',
            jerseyNumber: row.jersey_number || '',
            photoUrl: row.photo_url || null,
            auth_user_id: row.auth_user_id || userId,
            isProfileComplete: Boolean(row.name),
            created_at: row.created_at || new Date().toISOString()
          };
          await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(matchedProfile));
          return matchedProfile;
        }
      } catch (err) {
        console.warn('Supabase profile lookup fallback:', err);
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Save / update player profile locally and sync with Supabase
 */
export async function savePlayerProfile(profileData) {
  try {
    const existing = (await getPlayerProfile()) || {};
    const updated = {
      ...existing,
      ...profileData,
      updated_at: new Date().toISOString()
    };
    await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));

    // Sync to Supabase strictly by immutable Player ID (Primary Key)
    if (supabase && updated.name) {
      try {
        const playerId = updated.id || updated.auth_user_id || existing.id || existing.auth_user_id || generateUUID();
        updated.id = playerId;
        await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));

        const fullPayload = {
          id: playerId,
          name: updated.name.trim(),
          role: updated.role || 'All-Rounder',
          batting_style: updated.battingStyle || updated.batting_style || 'Right Hand Bat',
          bowling_style: updated.bowlingStyle || updated.bowling_style || 'Right Arm Medium',
          phone: updated.phone || '',
          city: updated.city || 'Local Ground',
          dob: updated.dob || '',
          jersey_number: updated.jerseyNumber || updated.jersey_number || '',
          photo_url: updated.photoUrl || updated.photo_url || null,
          auth_user_id: updated.auth_user_id || playerId,
          updated_at: updated.updated_at
        };

        const { error } = await supabase.from('local_players').upsert(fullPayload, { onConflict: 'id' });
        if (error) {
          console.warn('Full upsert notice, trying basic payload:', error.message);
          // Fallback to basic columns if custom columns not added yet
          await supabase.from('local_players').upsert({
            id: playerId,
            name: updated.name.trim(),
            role: updated.role || 'All-Rounder',
            photo_url: updated.photoUrl || updated.photo_url || null,
            phone: updated.phone || ''
          }, { onConflict: 'id' });
        }
      } catch (err) {
        console.warn('Supabase local_players upsert notice:', err?.message || err);
      }

      // Automatically sync and link official player name into past match scorecards
      try {
        if (updated.name) {
          syncPlayerNameToPastMatches(updated.name).catch(() => {});
        }
      } catch {}
    }
    return updated;
  } catch (e) {
    console.warn('Error saving player profile:', e);
    return profileData;
  }
}

/**
 * Sign in with Google OAuth 2.0 (Launches real Google Account Consent Window)
 */
export async function signInWithGoogleOAuth() {
  try {
    if (supabase && supabase.auth) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'cricflowmobile://auth/callback',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) {
        throw error;
      }
      return data;
    }
  } catch (e) {
    console.warn('Supabase OAuth notice:', e?.message || e);
    throw e;
  }
}

/**
 * Sign in with Google (Collects Email, Name, Photo and saves to Supabase Database)
 */
export async function signInWithGoogle({ name, email, photoUrl } = {}) {
  try {
    const userEmail = email || 'player@cricflow.com';
    const userName = name || 'Cricket Player';
    const userPhoto = photoUrl || null;
    const userId = `user_${Date.now()}`;

    const user = {
      id: userId,
      name: userName,
      email: userEmail,
      photoUrl: userPhoto,
      provider: 'google',
      signedInAt: new Date().toISOString()
    };

    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));

    // Check if profile exists, otherwise create default
    let profile = await getPlayerProfile(user.id);
    if (!profile) {
      profile = {
        id: user.id,
        auth_user_id: user.id,
        name: user.name,
        email: user.email,
        photoUrl: user.photoUrl,
        role: 'All-Rounder',
        battingStyle: 'Right Hand Bat',
        bowlingStyle: 'Right Arm Medium',
        city: 'Local Ground',
        phone: '',
        isProfileComplete: false,
        created_at: new Date().toISOString()
      };
      await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    }

    // DIRECT SUPABASE DATABASE ENTRY: Save user's email, name and profile
    if (supabase) {
      try {
        const playerId = profile.id || user.id || generateUUID();
        await supabase.from('local_players').upsert({
          id: playerId,
          name: profile.name || userName,
          role: profile.role || 'All-Rounder',
          city: profile.city || 'Local Ground',
          photo_url: userPhoto,
          phone: userEmail,
          auth_user_id: user.id
        }, { onConflict: 'id' }).catch(() => {});
      } catch (dbErr) {
        console.warn('Supabase email save notice:', dbErr);
      }
    }

    return { user, profile };
  } catch (e) {
    console.warn('Error during Google sign in:', e);
    throw e;
  }
}

import { firebaseConfig } from './firebaseClient.js';

let activePhoneSessionInfo = null;

/**
 * Send Phone OTP via Firebase Free SMS Gateway (1000 Free SMS / Day)
 */
export async function sendPhoneOtp(rawPhone) {
  const cleanPhone = String(rawPhone || '').replace(/\D/g, '').slice(-10);
  if (!cleanPhone || cleanPhone.length < 10) {
    throw new Error('Please enter a valid 10-digit mobile number');
  }

  const fullPhone = `+91${cleanPhone}`;

  try {
    // 1. Send SMS OTP via Google Firebase Auth REST API
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode?key=${firebaseConfig.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: fullPhone,
          clientType: 'CLIENT_TYPE_ANDROID',
          androidInstallApp: true,
          packageName: 'com.cricscorer.app'
        })
      }
    );

    const data = await response.json();

    if (data.sessionInfo) {
      activePhoneSessionInfo = data.sessionInfo;
      await AsyncStorage.setItem('@cricscorer_phone_session', data.sessionInfo).catch(() => {});
      return { success: true, phone: cleanPhone, fullPhone, sessionInfo: data.sessionInfo };
    }

    if (data.error) {
      console.warn('Firebase Phone Auth API response:', data.error.message);
      // If quota or config issue, try Supabase fallback
      if (supabase && supabase.auth) {
        const { error: supaErr } = await supabase.auth.signInWithOtp({ phone: fullPhone });
        if (!supaErr) {
          return { success: true, phone: cleanPhone, fullPhone };
        }
      }
      throw new Error(data.error.message || 'Could not send SMS verification code.');
    }
  } catch (err) {
    // Check Supabase fallback
    if (supabase && supabase.auth) {
      try {
        const { error: supaErr } = await supabase.auth.signInWithOtp({ phone: fullPhone });
        if (!supaErr) {
          return { success: true, phone: cleanPhone, fullPhone };
        }
      } catch (e) {}
    }
    throw new Error(err?.message || 'Could not send SMS verification code. Please try again.');
  }

  return { success: true, phone: cleanPhone, fullPhone };
}

/**
 * Verify Phone OTP via Firebase and auto-link player profile in Supabase Database
 */
export async function verifyPhoneOtp(rawPhone, otpToken) {
  const cleanPhone = String(rawPhone || '').replace(/\D/g, '').slice(-10);
  const token = String(otpToken || '').trim();

  if (!token || token.length < 4) {
    throw new Error('Please enter the 6-digit OTP code sent to your mobile');
  }

  const fullPhone = `+91${cleanPhone}`;
  let verifiedUserId = null;

  // Retrieve active sessionInfo
  let sessionInfo = activePhoneSessionInfo;
  if (!sessionInfo) {
    sessionInfo = await AsyncStorage.getItem('@cricscorer_phone_session').catch(() => null);
  }

  // 1. Verify OTP with Firebase
  if (sessionInfo) {
    try {
      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber?key=${firebaseConfig.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionInfo: sessionInfo,
            code: token
          })
        }
      );

      const data = await response.json();
      if (data.localId) {
        verifiedUserId = data.localId;
      } else if (data.error) {
        console.warn('Firebase verify error:', data.error.message);
      }
    } catch (err) {
      console.warn('Firebase verify attempt failed:', err);
    }
  }

  // 2. Fallback to Supabase verify if needed
  if (!verifiedUserId && supabase && supabase.auth) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: fullPhone,
        token: token,
        type: 'sms'
      });
      if (!error && data?.user) {
        verifiedUserId = data.user.id;
      }
    } catch (e) {}
  }

  if (!verifiedUserId) {
    throw new Error('Invalid or expired OTP code. Please enter the exact code received on your phone.');
  }

  const userId = verifiedUserId;

  // 3. Lookup existing player profile by phone in Supabase database (local_players)
  let existingProfile = null;
  try {
    if (supabase) {
      const { data: profileData } = await supabase
        .from('local_players')
        .select('*')
        .eq('phone', cleanPhone)
        .limit(1);
      if (Array.isArray(profileData) && profileData.length > 0) {
        existingProfile = profileData[0];
      }
    }
  } catch (e) {
    console.warn('Profile search in Supabase by phone:', e);
  }

  const userName = existingProfile?.name || 'Cricket Player';

  const userObj = {
    id: userId,
    name: userName,
    phone: cleanPhone,
    provider: 'firebase_phone',
    signedInAt: new Date().toISOString()
  };

  await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userObj));

  const profile = {
    id: existingProfile?.id || userId,
    auth_user_id: userId,
    name: existingProfile?.name || '',
    phone: cleanPhone,
    role: existingProfile?.role || 'All-Rounder',
    battingStyle: existingProfile?.batting_style || 'Right Hand Bat',
    bowlingStyle: existingProfile?.bowling_style || 'Right Arm Medium',
    city: existingProfile?.city || 'Sadokan',
    jerseyNumber: existingProfile?.jersey_number || '',
    dob: existingProfile?.dob || '',
    photoUrl: existingProfile?.photo_url || null,
    isProfileComplete: Boolean(existingProfile?.name),
    created_at: existingProfile?.created_at || new Date().toISOString()
  };

  await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));

  // Sync / Upsert profile in Supabase
  try {
    if (supabase) {
      await supabase.from('local_players').upsert({
        id: profile.id,
        name: profile.name || userName,
        phone: cleanPhone,
        role: profile.role,
        city: profile.city
      }).catch(() => {});
    }
  } catch (e) {}

  return { user: userObj, profile, isExistingPlayer: Boolean(existingProfile?.name) };
}

export const signInWithGoogleMock = signInWithGoogle;

/**
 * Sign out user securely
 */
export async function signOutUser() {
  try {
    if (supabase && supabase.auth) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Continue clearing local storage
      }
    }
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    await AsyncStorage.removeItem(PROFILE_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

/**
 * Calculate dynamic career statistics for a player from finished matches
 */
/**
 * Smart matching for player names (handles case, spaces, and minor spelling differences like Dasrath / Dashrath)
 */
export function isPlayerNameMatch(name1, name2) {
  if (!name1 || !name2) return false;
  const n1 = String(name1).toLowerCase().trim().replace(/\s+/g, ' ').replace(/[^a-z0-9 ]/g, '');
  const n2 = String(name2).toLowerCase().trim().replace(/\s+/g, ' ').replace(/[^a-z0-9 ]/g, '');
  if (n1 === n2) return true;
  if (!n1 || !n2) return false;

  const noSpace1 = n1.replace(/\s+/g, '');
  const noSpace2 = n2.replace(/\s+/g, '');
  if (noSpace1 === noSpace2) return true;

  // Handle common phonetic/spelling variation with 'h' e.g., 'dasrath' vs 'dashrath'
  if (noSpace1.replace(/h/g, '') === noSpace2.replace(/h/g, '')) return true;

  // If one name starts with the other or contains the full first+last without space (e.g. 'Bastiram' in 'Basti Ram Suthar')
  if (noSpace1.length >= 4 && noSpace2.length >= 4) {
    if (noSpace1.startsWith(noSpace2) || noSpace2.startsWith(noSpace1)) return true;
    if (noSpace1.includes(noSpace2) || noSpace2.includes(noSpace1)) return true;
  }

  const tokens1 = n1.split(' ').filter(Boolean);
  const tokens2 = n2.split(' ').filter(Boolean);

  // If one token matches (e.g. 'Bastiram' in ['Basti', 'Ram', 'Suthar'] when collapsed)
  if (tokens1.some(t => noSpace2.includes(t) && t.length >= 4)) return true;
  if (tokens2.some(t => noSpace1.includes(t) && t.length >= 4)) return true;

  // Token-by-token comparison with minor edit distance
  if (tokens1.length === tokens2.length) {
    const allMatch = tokens1.every((t1, i) => {
      const t2 = tokens2[i];
      if (t1 === t2) return true;
      if (t1.replace(/h/g, '') === t2.replace(/h/g, '')) return true;
      if (Math.abs(t1.length - t2.length) <= 1) {
        let diff = 0;
        let i1 = 0, i2 = 0;
        while (i1 < t1.length && i2 < t2.length) {
          if (t1[i1] !== t2[i2]) {
            diff++;
            if (t1.length > t2.length) i1++;
            else if (t2.length > t1.length) i2++;
            else { i1++; i2++; }
          } else {
            i1++; i2++;
          }
        }
        return diff <= 2;
      }
      return false;
    });
    if (allMatch) return true;
  }

  return false;
}

/**
 * Calculate dynamic career statistics for a player from finished matches
 */
export function calculatePlayerCareerStats(playerName, finishedMatches = []) {
  if (!playerName || !Array.isArray(finishedMatches)) {
    return getBlankCareerStats();
  }

  let matchesPlayed = 0;
  let inningsBatted = 0;
  let totalRuns = 0;
  let ballsFaced = 0;
  let highestScore = 0;
  let fours = 0;
  let sixes = 0;
  let fifties = 0;
  let hundreds = 0;
  let notOuts = 0;

  let totalBallsBowled = 0;
  let maidens = 0;
  let runsConceded = 0;
  let wickets = 0;
  let bestWkts = 0;
  let bestRuns = 999;
  const participatedMatches = [];

  finishedMatches.forEach(rawM => {
    if (!rawM) return;
    const m = typeof rawM.match_data === 'string'
      ? (() => { try { return JSON.parse(rawM.match_data); } catch { return rawM; } })()
      : (rawM.match_data || rawM);

    let didParticipate = false;

    // Check batting stats
    const checkBatting = (battingListOrObj) => {
      if (!battingListOrObj) return;
      const list = Array.isArray(battingListOrObj)
        ? battingListOrObj
        : Object.entries(battingListOrObj).map(([k, v]) => ({ name: v.name || k, ...v }));
      const bat = list.find(b => b && b.name && isPlayerNameMatch(b.name, playerName));
      if (bat) {
        didParticipate = true;
        inningsBatted++;
        const runs = Number(bat.runs) || 0;
        const balls = Number(bat.balls) || 0;
        const f4 = Number(bat.fours) || 0;
        const f6 = Number(bat.sixes) || 0;

        totalRuns += runs;
        ballsFaced += balls;
        fours += f4;
        sixes += f6;
        if (runs > highestScore) highestScore = runs;
        if (runs >= 100) hundreds++;
        else if (runs >= 50) fifties++;
        if (bat.dismissal === 'not out' || bat.dismissal === 'Not out' || !bat.dismissal || bat.isOut === false) {
          notOuts++;
        }
      }
    };

    // Check bowling stats
    const checkBowling = (bowlingListOrObj) => {
      if (!bowlingListOrObj) return;
      const list = Array.isArray(bowlingListOrObj)
        ? bowlingListOrObj
        : Object.entries(bowlingListOrObj).map(([k, v]) => ({ name: v.name || k, ...v }));
      const bowl = list.find(b => b && b.name && isPlayerNameMatch(b.name, playerName));
      if (bowl) {
        didParticipate = true;
        const ovStr = String(bowl.overs || '0');
        const [fullOvs, partialBalls] = ovStr.includes('.') ? ovStr.split('.').map(Number) : [Number(ovStr) || 0, 0];
        const matchBallsBowled = (Number(fullOvs) || 0) * 6 + (Number(partialBalls) || 0);
        const md = Number(bowl.maidens) || 0;
        const rc = Number(bowl.runs) || 0;
        const wk = Number(bowl.wickets) || 0;

        totalBallsBowled += matchBallsBowled;
        maidens += md;
        runsConceded += rc;
        wickets += wk;

        if (wk > bestWkts || (wk === bestWkts && rc < bestRuns)) {
          bestWkts = wk;
          bestRuns = rc;
        }
      }
    };

    // 1. Check innings arrays / objects
    if (m.innings && Array.isArray(m.innings)) {
      m.innings.forEach(inn => {
        if (inn.allBatters) checkBatting(inn.allBatters);
        if (inn.batters) checkBatting(inn.batters);
        if (inn.battingStats) checkBatting(inn.battingStats);
        if (inn.bowlingStats) checkBowling(inn.bowlingStats);
        if (inn.batting) checkBatting(inn.batting);
        if (inn.bowling) checkBowling(inn.bowling);
      });
    }

    // 2. Check team1 / team2 structures
    if (m.team1?.batting) checkBatting(m.team1.batting);
    if (m.team2?.batting) checkBatting(m.team2.batting);
    if (m.team1?.bowling) checkBowling(m.team1.bowling);
    if (m.team2?.bowling) checkBowling(m.team2.bowling);

    // 3. Check Playing XI / squads
    let inSquad = false;
    if (m.playingXI && typeof m.playingXI === 'object') {
      Object.values(m.playingXI).forEach(teamRoster => {
        if (Array.isArray(teamRoster)) {
          if (teamRoster.some(p => isPlayerNameMatch(typeof p === 'string' ? p : p?.name, playerName))) {
            inSquad = true;
          }
        }
      });
    }
    if (m.team1?.players && Array.isArray(m.team1.players)) {
      if (m.team1.players.some(p => isPlayerNameMatch(typeof p === 'string' ? p : p?.name, playerName))) {
        inSquad = true;
      }
    }
    if (m.team2?.players && Array.isArray(m.team2.players)) {
      if (m.team2.players.some(p => isPlayerNameMatch(typeof p === 'string' ? p : p?.name, playerName))) {
        inSquad = true;
      }
    }

    if (didParticipate || inSquad) {
      matchesPlayed++;
      participatedMatches.push(rawM);
    }
  });

  const strikeRate = ballsFaced > 0 ? ((totalRuns / ballsFaced) * 100).toFixed(1) : '0.0';
  const dismissals = inningsBatted - notOuts;
  const battingAvg = dismissals > 0 ? (totalRuns / dismissals).toFixed(1) : (totalRuns > 0 ? `${totalRuns}.0` : '0.0');
  const fullOvers = Math.floor(totalBallsBowled / 6);
  const remBalls = totalBallsBowled % 6;
  const oversBowledDisplay = remBalls > 0 ? `${fullOvers}.${remBalls}` : `${fullOvers}.0`;
  const economy = totalBallsBowled > 0 ? ((runsConceded / totalBallsBowled) * 6).toFixed(2) : '0.00';
  const bestBowling = bestWkts > 0 || bestRuns < 999 ? `${bestWkts}/${bestRuns === 999 ? 0 : bestRuns}` : '-';

  return {
    matchesPlayed,
    inningsBatted,
    totalRuns,
    ballsFaced,
    highestScore,
    fours,
    sixes,
    fifties,
    hundreds,
    notOuts,
    strikeRate,
    battingAvg,
    oversBowled: Number(oversBowledDisplay),
    totalBallsBowled,
    maidens,
    runsConceded,
    wickets,
    bestBowling,
    economy,
    participatedMatches
  };
}

function getBlankCareerStats() {
  return {
    matchesPlayed: 0,
    inningsBatted: 0,
    totalRuns: 0,
    ballsFaced: 0,
    highestScore: 0,
    fours: 0,
    sixes: 0,
    fifties: 0,
    hundreds: 0,
    notOuts: 0,
    strikeRate: '0.0',
    battingAvg: '0.0',
    oversBowled: 0,
    maidens: 0,
    runsConceded: 0,
    wickets: 0,
    bestBowling: '-',
    economy: '0.00',
    participatedMatches: []
  };
}

