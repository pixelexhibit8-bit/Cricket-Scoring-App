import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient.js';

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
        await supabase.from('local_players').upsert({
          name: profile.name || userName,
          role: profile.role || 'All-Rounder',
          city: profile.city || 'Local Ground',
          photo_url: userPhoto,
          phone: userEmail // Stores email / contact in Supabase
        }, { onConflict: 'name' }).catch(() => {});
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
    return true;
  } catch {
    return false;
  }
}

/**
 * Calculate dynamic career statistics for a player from finished matches
 */
export function calculatePlayerCareerStats(playerName, finishedMatches = []) {
  if (!playerName || !Array.isArray(finishedMatches)) {
    return getBlankCareerStats();
  }

  const pNameLower = playerName.trim().toLowerCase();
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

  let oversBowled = 0;
  let maidens = 0;
  let runsConceded = 0;
  let wickets = 0;
  let bestWkts = 0;
  let bestRuns = 999;
  const participatedMatches = [];

  finishedMatches.forEach(m => {
    if (!m) return;
    let didParticipate = false;

    // Check innings 1 & 2
    const checkTeamBatting = (battingList = []) => {
      const bat = battingList.find(b => b && b.name && b.name.trim().toLowerCase() === pNameLower);
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
        if (bat.dismissal === 'not out' || !bat.dismissal) notOuts++;
      }
    };

    const checkTeamBowling = (bowlingList = []) => {
      const bowl = bowlingList.find(b => b && b.name && b.name.trim().toLowerCase() === pNameLower);
      if (bowl) {
        didParticipate = true;
        const ov = Number(bowl.overs) || 0;
        const md = Number(bowl.maidens) || 0;
        const rc = Number(bowl.runs) || 0;
        const wk = Number(bowl.wickets) || 0;

        oversBowled += ov;
        maidens += md;
        runsConceded += rc;
        wickets += wk;

        if (wk > bestWkts || (wk === bestWkts && rc < bestRuns)) {
          bestWkts = wk;
          bestRuns = rc;
        }
      }
    };

    if (m.team1?.batting) checkTeamBatting(m.team1.batting);
    if (m.team2?.batting) checkTeamBatting(m.team2.batting);
    if (m.team1?.bowling) checkTeamBowling(m.team1.bowling);
    if (m.team2?.bowling) checkTeamBowling(m.team2.bowling);

    // Also check Playing XI squads
    const inSquad1 = (m.team1?.players || []).some(p => (typeof p === 'string' ? p : p?.name)?.trim().toLowerCase() === pNameLower);
    const inSquad2 = (m.team2?.players || []).some(p => (typeof p === 'string' ? p : p?.name)?.trim().toLowerCase() === pNameLower);

    if (didParticipate || inSquad1 || inSquad2) {
      matchesPlayed++;
      participatedMatches.push(m);
    }
  });

  const strikeRate = ballsFaced > 0 ? ((totalRuns / ballsFaced) * 100).toFixed(1) : '0.0';
  const dismissals = inningsBatted - notOuts;
  const battingAvg = dismissals > 0 ? (totalRuns / dismissals).toFixed(1) : (totalRuns > 0 ? `${totalRuns}.0` : '0.0');
  const economy = oversBowled > 0 ? (runsConceded / oversBowled).toFixed(2) : '0.00';
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
    oversBowled: Number(oversBowled.toFixed(1)),
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
