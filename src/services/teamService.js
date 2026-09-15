import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured, generateUUID } from './supabaseClient.js';
import { getTournamentsFromStorage, addTeamToTournament } from './tournamentService.js';

const GLOBAL_TEAMS_STORAGE_KEY = '@cricflow_teams_directory_v2';

// Rich Default Ground / Local Teams with Full 11-15 Player Squads
export const SEED_DEFAULT_TEAMS = [
  {
    id: 'st_spl_ssk',
    name: 'Sadokan Super Kings',
    shortName: 'SSK',
    city: 'Sadokan, Nagaur',
    captainName: 'Bastiram',
    captainPhone: '9983228208',
    color: '#1E3A8A',
    logoKey: 'team_spl_ssk',
    logoUri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1789469238/spl_team_ssk_logo.jpg',
    players: [
      { id: 'ssk_1', name: 'Bastiram', role: 'All-Rounder', isCaptain: true, isWicketKeeper: false, phone: '9983228208' },
      { id: 'ssk_2', name: 'Virender', role: 'Wicket Keeper', isCaptain: false, isWicketKeeper: true },
      { id: 'ssk_3', name: 'Ramesh', role: 'Bowler', isCaptain: false },
      { id: 'ssk_4', name: 'Suresh', role: 'Batter', isCaptain: false },
      { id: 'ssk_5', name: 'Dinesh', role: 'All-Rounder', isCaptain: false },
      { id: 'ssk_6', name: 'Amit', role: 'Batter', isCaptain: false },
      { id: 'ssk_7', name: 'Rahul', role: 'Bowler', isCaptain: false },
      { id: 'ssk_8', name: 'Mukesh', role: 'Batter', isCaptain: false },
      { id: 'ssk_9', name: 'Pooja', role: 'All-Rounder', isCaptain: false },
      { id: 'ssk_10', name: 'Kamlesh', role: 'Bowler', isCaptain: false },
      { id: 'ssk_11', name: 'Vikram', role: 'Batter', isCaptain: false }
    ]
  },
  {
    id: 'st_spl_str',
    name: 'Sangwa Strikers',
    shortName: 'STR',
    city: 'Sangwa, Nagaur',
    captainName: 'Hanuman',
    captainPhone: '9876543210',
    color: '#0D9488',
    logoKey: 'team_spl_str',
    logoUri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1789469248/spl_team_str_logo.jpg',
    players: [
      { id: 'str_1', name: 'Hanuman', role: 'All-Rounder', isCaptain: true },
      { id: 'str_2', name: 'Shrawan', role: 'Wicket Keeper', isWicketKeeper: true },
      { id: 'str_3', name: 'Sunil', role: 'Batter' },
      { id: 'str_4', name: 'Gordhan', role: 'Bowler' },
      { id: 'str_5', name: 'Manish', role: 'All-Rounder' },
      { id: 'str_6', name: 'Deva', role: 'Bowler' },
      { id: 'str_7', name: 'Pappu', role: 'Batter' },
      { id: 'str_8', name: 'Raju', role: 'Bowler' },
      { id: 'str_9', name: 'Hari', role: 'All-Rounder' },
      { id: 'str_10', name: 'Om', role: 'Batter' },
      { id: 'str_11', name: 'Teja', role: 'Bowler' }
    ]
  },
  {
    id: 'st_spl_sdr',
    name: 'Sadokan Royals',
    shortName: 'SDR',
    city: 'Sadokan',
    captainName: 'Mahaveer',
    captainPhone: '9414000000',
    color: '#0284C7',
    logoKey: 'team_spl_sdr',
    logoUri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1789469244/spl_team_sdr_logo.jpg',
    players: [
      { id: 'sdr_1', name: 'Mahaveer', role: 'All-Rounder', isCaptain: true },
      { id: 'sdr_2', name: 'Jitendra', role: 'Wicket Keeper', isWicketKeeper: true },
      { id: 'sdr_3', name: 'Praveen', role: 'Batter' },
      { id: 'sdr_4', name: 'Ashok', role: 'Bowler' },
      { id: 'sdr_5', name: 'Gopal', role: 'All-Rounder' },
      { id: 'sdr_6', name: 'Prem', role: 'Bowler' },
      { id: 'sdr_7', name: 'Kalu', role: 'Batter' },
      { id: 'sdr_8', name: 'Sita', role: 'Bowler' },
      { id: 'sdr_9', name: 'Anil', role: 'All-Rounder' },
      { id: 'sdr_10', name: 'Babu', role: 'Batter' },
      { id: 'sdr_11', name: 'Jagdish', role: 'Bowler' }
    ]
  },
  {
    id: 'st_spl_mwc',
    name: 'Marwar Champions',
    shortName: 'MWC',
    city: 'Jodhpur',
    captainName: 'Vijay',
    captainPhone: '9829000000',
    color: '#DC2626',
    logoKey: 'team_spl_mwc',
    logoUri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1789469253/spl_team_mwc_logo.jpg',
    players: [
      { id: 'mwc_1', name: 'Vijay', role: 'Batter', isCaptain: true },
      { id: 'mwc_2', name: 'Kishan', role: 'Wicket Keeper', isWicketKeeper: true },
      { id: 'mwc_3', name: 'Deepak', role: 'Bowler' },
      { id: 'mwc_4', name: 'Sanjay', role: 'All-Rounder' },
      { id: 'mwc_5', name: 'Mohan', role: 'Bowler' },
      { id: 'mwc_6', name: 'Tarun', role: 'Batter' },
      { id: 'mwc_7', name: 'Chetan', role: 'Bowler' },
      { id: 'mwc_8', name: 'Naresh', role: 'All-Rounder' },
      { id: 'mwc_9', name: 'Suraj', role: 'Batter' },
      { id: 'mwc_10', name: 'Sonu', role: 'Bowler' },
      { id: 'mwc_11', name: 'Naveen', role: 'Batter' }
    ]
  },
  {
    id: 'st_spl_ngt',
    name: 'Nagaur Titans',
    shortName: 'NGT',
    city: 'Nagaur City',
    captainName: 'Gaurav',
    captainPhone: '9782000000',
    color: '#7C3AED',
    logoKey: 'team_spl_ngt',
    logoUri: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1789469258/spl_team_ngt_logo.jpg',
    players: [
      { id: 'ngt_1', name: 'Gaurav', role: 'All-Rounder', isCaptain: true },
      { id: 'ngt_2', name: 'Rohit', role: 'Wicket Keeper', isWicketKeeper: true },
      { id: 'ngt_3', name: 'Pawan', role: 'Bowler' },
      { id: 'ngt_4', name: 'Kailash', role: 'Batter' },
      { id: 'ngt_5', name: 'Mukund', role: 'Bowler' },
      { id: 'ngt_6', name: 'Lalit', role: 'All-Rounder' },
      { id: 'ngt_7', name: 'Bhanwar', role: 'Batter' },
      { id: 'ngt_8', name: 'Shyam', role: 'Bowler' },
      { id: 'ngt_9', name: 'Govind', role: 'All-Rounder' },
      { id: 'ngt_10', name: 'Sohan', role: 'Batter' },
      { id: 'ngt_11', name: 'Bheru', role: 'Bowler' }
    ]
  }
];

/**
 * Deduplicate teams by clean normalized name
 */
function deduplicateTeams(teamList = []) {
  if (!Array.isArray(teamList)) return [];
  const map = new Map();

  for (const t of teamList) {
    if (!t || !t.name) continue;
    const key = t.name.trim().toLowerCase();
    const existing = map.get(key);
    if (!existing) {
      map.set(key, t);
    } else {
      // Merge: prefer the one with players list or logo
      const existingPlayers = Array.isArray(existing.players) ? existing.players.length : 0;
      const currentPlayers = Array.isArray(t.players) ? t.players.length : 0;
      if (currentPlayers > existingPlayers || (!existing.logoUri && t.logoUri)) {
        map.set(key, { ...existing, ...t });
      }
    }
  }

  return Array.from(map.values());
}

/**
 * Fetch all registered / saved ground teams across Supabase + AsyncStorage + Tournaments
 */
export async function fetchGlobalTeams() {
  let combined = [];

  // 1. Read from AsyncStorage cache
  try {
    const cachedStr = await AsyncStorage.getItem(GLOBAL_TEAMS_STORAGE_KEY);
    if (cachedStr) {
      const parsed = JSON.parse(cachedStr);
      if (Array.isArray(parsed)) combined.push(...parsed);
    }
  } catch (e) {
    console.warn('[TeamService] AsyncStorage read error:', e);
  }

  // 2. Extract teams from all saved tournaments
  try {
    const tourns = await getTournamentsFromStorage();
    if (Array.isArray(tourns)) {
      tourns.forEach(t => {
        if (Array.isArray(t.teams)) {
          t.teams.forEach(team => {
            if (team && team.name) {
              combined.push({
                ...team,
                city: team.city || t.city || 'Local Ground',
                tournamentOrigin: t.name || t.title || 'Tournament'
              });
            }
          });
        }
      });
    }
  } catch (e) {
    console.warn('[TeamService] Tournament teams extract error:', e);
  }

  // 3. Fallback seeds if list is small
  combined.push(...SEED_DEFAULT_TEAMS);

  // 4. Try Supabase cloud fetch if available
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name', { ascending: true });

      if (!error && Array.isArray(data)) {
        const cloudTeams = data.map(row => ({
          id: row.id,
          name: row.name,
          shortName: row.short_name || row.shortName || (row.name ? row.name.slice(0, 4).toUpperCase() : 'TEAM'),
          city: row.city || '',
          captainName: row.captain_name || row.captainName || '',
          captainPhone: row.captain_phone || row.captainPhone || '',
          color: row.color || '#18181B',
          logoUri: row.logo_url || row.logoUri || null,
          players: Array.isArray(row.players) ? row.players : []
        }));
        combined.push(...cloudTeams);
      }
    } catch (err) {
      // Offline fallback is fine
    }
  }

  const cleanTeams = deduplicateTeams(combined);

  // Update local cache
  try {
    await AsyncStorage.setItem(GLOBAL_TEAMS_STORAGE_KEY, JSON.stringify(cleanTeams));
  } catch {}

  return cleanTeams;
}

/**
 * Save a team to Global Directory (Local + Cloud)
 */
export async function saveGlobalTeam(teamData) {
  if (!teamData || !teamData.name) return null;

  const cleanName = teamData.name.trim();
  const teamObj = {
    id: teamData.id || generateUUID(),
    name: cleanName,
    shortName: teamData.shortName || cleanName.slice(0, 4).toUpperCase(),
    city: teamData.city ? teamData.city.trim() : 'Local Ground',
    captainName: teamData.captainName ? teamData.captainName.trim() : 'Captain',
    captainPhone: teamData.captainPhone ? teamData.captainPhone.trim() : '',
    color: teamData.color || '#18181B',
    logoUri: teamData.logoUri || null,
    logoKey: teamData.logoKey || null,
    icon: teamData.icon || 'shield-half-full',
    count: `${Array.isArray(teamData.players) ? teamData.players.length : 11} Players`,
    playersCount: Array.isArray(teamData.players) ? teamData.players.length : 11,
    players: Array.isArray(teamData.players) ? teamData.players : []
  };

  // 1. Save to Local Cache
  try {
    const existingList = await fetchGlobalTeams();
    const updatedList = [teamObj, ...existingList.filter(t => t.name.toLowerCase() !== cleanName.toLowerCase())];
    await AsyncStorage.setItem(GLOBAL_TEAMS_STORAGE_KEY, JSON.stringify(updatedList));
  } catch (err) {
    console.warn('[TeamService] Save local cache error:', err);
  }

  // 2. Save to Supabase (if configured)
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase
        .from('teams')
        .upsert({
          id: teamObj.id,
          name: teamObj.name,
          short_name: teamObj.shortName,
          city: teamObj.city,
          captain_name: teamObj.captainName,
          captain_phone: teamObj.captainPhone,
          color: teamObj.color,
          logo_url: teamObj.logoUri,
          players: teamObj.players,
          updated_at: new Date().toISOString()
        });
    } catch (cloudErr) {
      console.warn('[TeamService] Supabase team save error:', cloudErr);
    }
  }

  return teamObj;
}

/**
 * Instant Search Across Global Teams
 */
export function searchGlobalTeams(query = '', allTeams = []) {
  if (!query || !query.trim()) return allTeams;
  const q = query.toLowerCase().trim();
  const qDigits = q.replace(/\D/g, '');

  return allTeams.filter(t => {
    if (!t) return false;
    const nameMatch = (t.name || '').toLowerCase().includes(q);
    const shortMatch = (t.shortName || '').toLowerCase().includes(q);
    const cityMatch = (t.city || '').toLowerCase().includes(q);
    const captMatch = (t.captainName || '').toLowerCase().includes(q);
    const phoneMatch = qDigits.length > 0 && (t.captainPhone || '').replace(/\D/g, '').includes(qDigits);

    // Also search player names inside squad
    const playerMatch = Array.isArray(t.players) && t.players.some(p => {
      const pName = typeof p === 'string' ? p : (p?.name || '');
      return pName.toLowerCase().includes(q);
    });

    return nameMatch || shortMatch || cityMatch || captMatch || phoneMatch || playerMatch;
  });
}

/**
 * Find Tournament by Code (e.g. "CF-SPL26" or "CF-8421" or ID)
 */
export async function getTournamentByJoinCode(joinCode = '') {
  if (!joinCode || !joinCode.trim()) return null;
  const cleanCode = joinCode.trim().toUpperCase();

  const tourns = await getTournamentsFromStorage();
  if (!Array.isArray(tourns)) return null;

  return tourns.find(t => {
    const rawId = (t.id || '').toUpperCase();
    const cleanPrefix = (t.name || t.title || 'TOUR').replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase();
    const cleanSuffix = rawId.slice(-4).toUpperCase();
    const generatedCode = `CF-${cleanPrefix}${cleanSuffix}`;

    return (
      rawId === cleanCode ||
      generatedCode === cleanCode ||
      (t.joinCode && t.joinCode.toUpperCase() === cleanCode) ||
      cleanCode.includes(cleanSuffix)
    );
  }) || null;
}

/**
 * Captain Self-Registration: Register Team using Join Code
 */
export async function registerTeamViaJoinCode(joinCode, teamData) {
  const tournament = await getTournamentByJoinCode(joinCode);
  if (!tournament) {
    throw new Error('Invalid Tournament Join Code. Please check with the organizer.');
  }

  // Save to global directory as well
  await saveGlobalTeam(teamData);

  // Add to tournament
  const updatedTournament = await addTeamToTournament(tournament.id, teamData);
  return {
    tournament: updatedTournament,
    team: teamData
  };
}
