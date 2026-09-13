import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient.js';

const TOURNAMENTS_STORAGE_KEY = 'cricflow.tournaments.v2';
const MY_HOSTED_TOURNAMENTS_KEY = 'cricflow.my_hosted_tournaments.v2';
const ACTIVE_TOURNAMENT_KEY = 'cricflow.active_tournament_id.v2';

/**
 * Format calculation for Net Run Rate (NRR)
 * NRR = (Total Runs Scored / Total Overs Faced) - (Total Runs Conceded / Total Overs Bowled)
 */
export function calculateNetRunRate(runsScored = 0, ballsFaced = 0, runsConceded = 0, ballsBowled = 0) {
  const oversFaced = ballsFaced > 0 ? (Math.floor(ballsFaced / 6) + (ballsFaced % 6) / 6) : 0;
  const oversBowled = ballsBowled > 0 ? (Math.floor(ballsBowled / 6) + (ballsBowled % 6) / 6) : 0;

  if (oversFaced === 0 && oversBowled === 0) return '+0.000';

  const forRate = oversFaced > 0 ? (runsScored / oversFaced) : 0;
  const againstRate = oversBowled > 0 ? (runsConceded / oversBowled) : 0;
  const nrr = forRate - againstRate;

  const sign = nrr >= 0 ? '+' : '';
  return `${sign}${nrr.toFixed(3)}`;
}

/**
 * Auto-Calculate Points Table from Teams and Finished Matches
 */
export function autoCalculatePointsTable(teams = [], matches = []) {
  if (!teams || teams.length === 0) return [];

  const tableMap = {};

  // 1. Initialize 0 stats for every team
  teams.forEach(t => {
    const teamName = typeof t === 'string' ? t : (t.name || t.shortName || 'Team');
    const teamCode = t.shortName || t.shortCode || teamName.slice(0, 4).toUpperCase();
    tableMap[teamName] = {
      team: teamName,
      shortName: teamCode,
      p: 0, // Played
      w: 0, // Won
      l: 0, // Lost
      nr: 0, // No Result / Tie
      pts: 0, // Total Points (Win = 2, Tie/NR = 1)
      runsScored: 0,
      ballsFaced: 0,
      runsConceded: 0,
      ballsBowled: 0,
      nrr: '+0.000',
      form: [] // Last 5 matches ['W', 'L', 'W']
    };
  });

  // 2. Compute from finished matches
  (matches || []).forEach(m => {
    if (!m || (m.status !== 'FINISHED' && m.phase !== 'finished' && m.phase !== 'result')) return;

    const t1Name = m.team1?.name || m.team1;
    const t2Name = m.team2?.name || m.team2;

    if (!tableMap[t1Name] || !tableMap[t2Name]) return;

    tableMap[t1Name].p += 1;
    tableMap[t2Name].p += 1;

    const winnerName = m.winnerTeamName || m.winner;
    if (winnerName === t1Name) {
      tableMap[t1Name].w += 1;
      tableMap[t1Name].pts += 2;
      tableMap[t1Name].form.unshift('W');

      tableMap[t2Name].l += 1;
      tableMap[t2Name].form.unshift('L');
    } else if (winnerName === t2Name) {
      tableMap[t2Name].w += 1;
      tableMap[t2Name].pts += 2;
      tableMap[t2Name].form.unshift('W');

      tableMap[t1Name].l += 1;
      tableMap[t1Name].form.unshift('L');
    } else {
      // Tie or No Result
      tableMap[t1Name].nr += 1;
      tableMap[t1Name].pts += 1;
      tableMap[t1Name].form.unshift('NR');

      tableMap[t2Name].nr += 1;
      tableMap[t2Name].pts += 1;
      tableMap[t2Name].form.unshift('NR');
    }

    // Keep only last 5 form results
    tableMap[t1Name].form = tableMap[t1Name].form.slice(0, 5);
    tableMap[t2Name].form = tableMap[t2Name].form.slice(0, 5);
  });

  // 3. Format NRR and sort by PTS desc, then NRR desc
  const list = Object.values(tableMap).map(row => {
    row.nrr = calculateNetRunRate(row.runsScored, row.ballsFaced, row.runsConceded, row.ballsBowled);
    return row;
  });

  list.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    return parseFloat(b.nrr) - parseFloat(a.nrr);
  });

  return list;
}

/**
 * Map raw Supabase database row to CricFlow tournament object
 */
function mapSupabaseRowToTournament(row) {
  if (!row) return null;
  const raw = (typeof row.raw_data === 'object' && row.raw_data) ? row.raw_data : {};
  return {
    ...raw,
    id: row.id,
    name: row.name || raw.name || raw.title || 'Tournament',
    title: row.title || row.name || raw.name || 'Tournament',
    fullName: row.full_name || row.name || raw.fullName || 'Tournament',
    city: row.city || raw.city || 'Local Ground',
    host: row.host || raw.host || row.city || 'Local Ground',
    category: row.category || raw.category || 'OPEN',
    format: row.format || raw.format || 'LIMITED OVERS',
    ballType: row.ball_type || raw.ballType || 'tennis',
    pitchType: row.pitch_type || raw.pitchType || 'turf',
    organiserName: row.organiser_name || raw.organiserName || '',
    organiserPhone: row.organiser_phone || raw.organiserPhone || '',
    organiserEmail: row.organiser_email || raw.organiserEmail || '',
    startDate: row.start_date || raw.startDate || '',
    endDate: row.end_date || raw.endDate || '',
    duration: row.duration || raw.duration || `${row.start_date || ''} - ${row.end_date || ''}`.trim(),
    needMoreTeams: Boolean(row.need_more_teams ?? raw.needMoreTeams),
    needOfficials: Boolean(row.need_officials ?? raw.needOfficials),
    bannerUri: row.banner_uri || raw.bannerUri || null,
    logoUri: row.logo_uri || raw.logoUri || null,
    teams: Array.isArray(row.teams) ? row.teams : (raw.teams || []),
    matches: Array.isArray(row.matches) ? row.matches : (raw.matches || []),
    pointsTable: Array.isArray(row.points_table) ? row.points_table : (raw.pointsTable || []),
    stats: (typeof row.stats === 'object' && row.stats) ? row.stats : (raw.stats || {}),
    createdAt: row.created_at || raw.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || raw.updatedAt || new Date().toISOString()
  };
}

/**
 * Fetch all tournaments from Local Storage (Offline-First)
 */
export async function getTournamentsFromStorage() {
  try {
    const raw = await AsyncStorage.getItem(TOURNAMENTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

/**
 * Fetch all tournaments (Reads local first, then syncs with Supabase cloud)
 */
export async function getTournaments() {
  const localList = await getTournamentsFromStorage();

  if (!supabase) {
    return localList;
  }

  try {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      const cloudTournaments = data.map(mapSupabaseRowToTournament).filter(Boolean);
      // Sync local storage with latest cloud snapshot
      await AsyncStorage.setItem(TOURNAMENTS_STORAGE_KEY, JSON.stringify(cloudTournaments));
      return cloudTournaments;
    } else if (error) {
      console.warn('[TournamentService] Supabase fetch error, fallback to local:', error.message);
    }
  } catch (err) {
    console.warn('[TournamentService] Network error fetching tournaments:', err);
  }

  return localList;
}

/**
 * Get IDs of tournaments hosted by the current user
 */
export async function getMyHostedTournamentIds() {
  try {
    const raw = await AsyncStorage.getItem(MY_HOSTED_TOURNAMENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

/**
 * Mark a tournament ID as hosted by current user
 */
export async function saveHostedTournamentId(tournamentId) {
  if (!tournamentId) return;
  try {
    const current = await getMyHostedTournamentIds();
    if (!current.includes(tournamentId)) {
      const updated = [tournamentId, ...current];
      await AsyncStorage.setItem(MY_HOSTED_TOURNAMENTS_KEY, JSON.stringify(updated));
    }
  } catch (err) {
    console.warn('[TournamentService] Failed to save hosted tournament ID:', err);
  }
}

/**
 * Check if a tournament is hosted by the current user
 */
export async function isTournamentHostedByMe(tournamentId) {
  if (!tournamentId) return false;
  const ids = await getMyHostedTournamentIds();
  return ids.includes(tournamentId);
}

/**
 * Retrieve active tournament ID from storage
 */
export async function getActiveTournamentId() {
  try {
    return await AsyncStorage.getItem(ACTIVE_TOURNAMENT_KEY);
  } catch (err) {
    return null;
  }
}

/**
 * Save active tournament ID into storage
 */
export async function saveActiveTournamentId(tournamentId) {
  if (!tournamentId) return;
  try {
    await AsyncStorage.setItem(ACTIVE_TOURNAMENT_KEY, tournamentId);
  } catch (err) {
    console.warn('[TournamentService] Failed to save active tournament ID:', err);
  }
}

/**
 * Save / Create a new tournament (Offline storage + Supabase Cloud Upsert)
 */
export async function saveTournament(tournamentData) {
  try {
    if (!tournamentData || !tournamentData.id) {
      tournamentData.id = `t_${Date.now()}`;
    }

    // 1. Immediately update Local Storage (instant UI response)
    const existingList = await getTournamentsFromStorage();
    const index = existingList.findIndex(t => t.id === tournamentData.id);

    let updatedList;
    if (index >= 0) {
      updatedList = [...existingList];
      updatedList[index] = { ...existingList[index], ...tournamentData, updatedAt: new Date().toISOString() };
    } else {
      updatedList = [
        {
          ...tournamentData,
          createdAt: new Date().toISOString(),
          teams: tournamentData.teams || [],
          matches: tournamentData.matches || []
        },
        ...existingList
      ];
    }

    await AsyncStorage.setItem(TOURNAMENTS_STORAGE_KEY, JSON.stringify(updatedList));

    // 2. Persist to Supabase Cloud
    if (supabase) {
      try {
        const payload = {
          id: tournamentData.id,
          name: tournamentData.name || tournamentData.title,
          title: tournamentData.title || tournamentData.name,
          full_name: tournamentData.fullName || tournamentData.name,
          city: tournamentData.city || 'Local Ground',
          host: tournamentData.host || 'Local Ground',
          category: tournamentData.category || 'OPEN',
          format: tournamentData.format || 'LIMITED OVERS',
          ball_type: tournamentData.ballType || 'tennis',
          pitch_type: tournamentData.pitchType || 'turf',
          organiser_name: tournamentData.organiserName || '',
          organiser_phone: tournamentData.organiserPhone || '',
          organiser_email: tournamentData.organiserEmail || '',
          start_date: tournamentData.startDate || '',
          end_date: tournamentData.endDate || '',
          duration: tournamentData.duration || '',
          need_more_teams: Boolean(tournamentData.needMoreTeams),
          need_officials: Boolean(tournamentData.needOfficials),
          banner_uri: tournamentData.bannerUri || null,
          logo_uri: tournamentData.logoUri || null,
          teams: tournamentData.teams || [],
          matches: tournamentData.matches || [],
          points_table: tournamentData.pointsTable || [],
          stats: tournamentData.stats || {},
          raw_data: tournamentData,
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase.from('tournaments').upsert(payload);
        if (error) {
          console.warn('[TournamentService] Supabase upsert error:', error.message);
        } else {
          console.log('[TournamentService] Successfully persisted to Supabase:', tournamentData.id);
        }
      } catch (cloudErr) {
        console.warn('[TournamentService] Supabase sync network error:', cloudErr);
      }
    }

    return tournamentData;
  } catch (err) {
    console.error('[TournamentService] Save error:', err);
    return tournamentData;
  }
}

/**
 * Add a Team to Tournament & Auto-Initialize in Points Table (Local + Supabase Sync)
 */
export async function addTeamToTournament(tournamentId, teamData) {
  try {
    const list = await getTournamentsFromStorage();
    const target = list.find(t => t.id === tournamentId);
    if (!target) return null;

    const teamName = teamData.name.trim();
    const newTeam = {
      id: teamData.id || `team_${Date.now()}`,
      name: teamName,
      shortName: teamData.shortName || teamName.slice(0, 4).toUpperCase(),
      captainName: teamData.captainName || '',
      captainPhone: teamData.captainPhone || '',
      city: teamData.city || '',
      logoUri: teamData.logoUri || null,
      icon: teamData.icon || 'shield-half-full',
      color: teamData.color || '#18181B',
      cardBg: teamData.cardBg || '#F8F8FA',
      count: teamData.count || `${teamData.players?.length || 11} Players`,
      playersCount: teamData.players?.length || teamData.playersCount || 11,
      players: teamData.players || []
    };

    const currentTeams = target.teams || [];
    const updatedTeams = [...currentTeams, newTeam];
    target.teams = updatedTeams;
    target.updatedAt = new Date().toISOString();

    await AsyncStorage.setItem(TOURNAMENTS_STORAGE_KEY, JSON.stringify(list));

    // Supabase Cloud Sync
    if (supabase) {
      try {
        await supabase
          .from('tournaments')
          .update({
            teams: updatedTeams,
            updated_at: new Date().toISOString()
          })
          .eq('id', tournamentId);
      } catch (cloudErr) {
        console.warn('[TournamentService] Supabase team update error:', cloudErr);
      }
    }

    return target;
  } catch (err) {
    console.error('[TournamentService] Add team error:', err);
    return null;
  }
}

/**
 * Add a Match / Fixture to Tournament (Local + Supabase Sync)
 */
export async function addMatchToTournament(tournamentId, matchData) {
  try {
    const list = await getTournamentsFromStorage();
    const target = list.find(t => t.id === tournamentId);
    if (!target) return null;

    const newMatch = {
      id: matchData.id || `match_${Date.now()}`,
      team1: matchData.team1,
      team2: matchData.team2,
      dateStr: matchData.dateStr || 'Upcoming',
      status: matchData.status || 'UPCOMING',
      overs: matchData.overs || target.overs || 10,
      venue: matchData.venue || target.city || 'Local Ground'
    };

    const currentMatches = target.matches || [];
    const updatedMatches = [...currentMatches, newMatch];
    target.matches = updatedMatches;
    target.updatedAt = new Date().toISOString();

    await AsyncStorage.setItem(TOURNAMENTS_STORAGE_KEY, JSON.stringify(list));

    // Supabase Cloud Sync
    if (supabase) {
      try {
        await supabase
          .from('tournaments')
          .update({
            matches: updatedMatches,
            updated_at: new Date().toISOString()
          })
          .eq('id', tournamentId);
      } catch (cloudErr) {
        console.warn('[TournamentService] Supabase match update error:', cloudErr);
      }
    }

    return target;
  } catch (err) {
    console.error('[TournamentService] Add match error:', err);
    return null;
  }
}

/**
 * Real-time WebSocket subscription for tournaments table
 */
export function subscribeToTournamentsLive(onUpdate) {
  if (!supabase || typeof onUpdate !== 'function') {
    return () => {};
  }

  try {
    const channelName = `tourns_live_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const channel = supabase.channel(channelName);

    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tournaments' },
        (payload) => {
          onUpdate(payload);
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (e) {}
    };
  } catch (err) {
    console.warn('[TournamentService Realtime Init Error]:', err);
    return () => {};
  }
}
