import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient.js';

const TOURNAMENTS_STORAGE_KEY = 'cricflow.tournaments.v1';

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
 * Fetch all tournaments from Local Storage (and Supabase if connected)
 */
export async function getTournaments() {
  try {
    const raw = await AsyncStorage.getItem(TOURNAMENTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('[TournamentService] Failed to load tournaments:', err);
    return [];
  }
}

/**
 * Save / Create a new tournament
 */
export async function saveTournament(tournamentData) {
  try {
    if (!tournamentData || !tournamentData.id) {
      tournamentData.id = `t_${Date.now()}`;
    }

    const existingList = await getTournaments();
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

    // Optional Supabase Background Sync
    if (supabase) {
      supabase.from('tournaments').upsert({
        id: tournamentData.id,
        name: tournamentData.name || tournamentData.title,
        city: tournamentData.city,
        category: tournamentData.category,
        format: tournamentData.format,
        ball_type: tournamentData.ballType,
        pitch_type: tournamentData.pitchType,
        organiser_name: tournamentData.organiserName,
        organiser_phone: tournamentData.organiserPhone,
        raw_data: tournamentData
      }).then(() => {}).catch(() => {});
    }

    return tournamentData;
  } catch (err) {
    console.error('[TournamentService] Save error:', err);
    return tournamentData;
  }
}

/**
 * Add a Team to Tournament & Auto-Initialize in Points Table
 */
export async function addTeamToTournament(tournamentId, teamData) {
  try {
    const list = await getTournaments();
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
    return target;
  } catch (err) {
    console.error('[TournamentService] Add team error:', err);
    return null;
  }
}

/**
 * Add a Match / Fixture to Tournament
 */
export async function addMatchToTournament(tournamentId, matchData) {
  try {
    const list = await getTournaments();
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
    target.matches = [...currentMatches, newMatch];
    target.updatedAt = new Date().toISOString();

    await AsyncStorage.setItem(TOURNAMENTS_STORAGE_KEY, JSON.stringify(list));
    return target;
  } catch (err) {
    console.error('[TournamentService] Add match error:', err);
    return null;
  }
}
