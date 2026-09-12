import AsyncStorage from '@react-native-async-storage/async-storage';

const CREATED_MATCHES_KEY = '@cricflow_my_created_matches_v1';

/**
 * Persistently records that this local device / user created this match.
 */
export async function markMatchAsCreatedByMe(matchId) {
  if (!matchId) return;
  try {
    const raw = await AsyncStorage.getItem(CREATED_MATCHES_KEY);
    const list = raw ? JSON.parse(raw) : [];
    if (!list.includes(matchId)) {
      list.push(matchId);
      await AsyncStorage.setItem(CREATED_MATCHES_KEY, JSON.stringify(list));
    }
  } catch (e) {
    console.warn('[MatchOwnership] Error saving created match ID:', e);
  }
}

/**
 * Returns all match IDs created by this device / user.
 */
export async function getMyCreatedMatchIds() {
  try {
    const raw = await AsyncStorage.getItem(CREATED_MATCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Checks whether the current user is the creator (or authorized scorer) of the given match.
 */
export function isUserMatchCreator(match, currentUser, myCreatedIds = []) {
  if (!match) return false;

  const matchId = match.id || match.supabaseId;

  // 1. Explicit in-memory local creator flag
  if (match._isLocalCreator || match.isCreatedLocally) {
    return true;
  }

  // 2. Match ID was created on this local device
  if (matchId && Array.isArray(myCreatedIds) && myCreatedIds.includes(matchId)) {
    return true;
  }

  // 3. User is logged in and their ID matches creatorId
  if (currentUser?.id && match.creatorId && (match.creatorId === currentUser.id || match.creatorId === currentUser.uid)) {
    return true;
  }

  // 4. User is logged in and their name matches creatorName (case-insensitive)
  if (currentUser?.name && match.creatorName && match.creatorName.trim().toLowerCase() === currentUser.name.trim().toLowerCase()) {
    return true;
  }

  // 5. User is logged in and listed in coScorers
  if (currentUser?.id && Array.isArray(match.coScorers) && match.coScorers.includes(currentUser.id)) {
    return true;
  }

  return false;
}
