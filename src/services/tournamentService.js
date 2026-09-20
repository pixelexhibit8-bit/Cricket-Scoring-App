import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient.js';
import { resolveTeamWithRoster } from '../utils/teamUtils.js';
import { getCurrentUser } from './authService.js';

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

  if (oversFaced === 0 && oversBowled === 0) return '-';

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

  const norm = (str) => String(str || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

  const tableMap = {};
  const teamLookup = new Map(); // normalized key -> standard teamName

  // 1. Initialize 0 stats for every team
  teams.forEach(t => {
    const teamName = typeof t === 'string' ? t : (t.name || t.shortName || 'Team');
    const teamCode = t.shortName || t.shortCode || teamName.slice(0, 4).toUpperCase();
    const teamKey = norm(teamName);
    const shortKey = norm(t.shortName || t.shortCode || '');

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
      nrr: '-',
      form: [] // Last 5 matches ['W', 'L', 'W']
    };

    teamLookup.set(teamKey, teamName);
    if (shortKey) teamLookup.set(shortKey, teamName);
    if (t.id) teamLookup.set(norm(t.id), teamName);
  });

  const resolveTeamName = (val) => {
    if (!val) return null;
    if (typeof val === 'object') {
      const byName = resolveTeamName(val.name);
      if (byName) return byName;
      const byShort = resolveTeamName(val.shortName || val.code);
      if (byShort) return byShort;
      const byId = resolveTeamName(val.id);
      if (byId) return byId;
    }
    const k = norm(val);
    if (teamLookup.has(k)) return teamLookup.get(k);
    for (const [knownKey, standardName] of teamLookup.entries()) {
      if (k.includes(knownKey) || knownKey.includes(k)) {
        return standardName;
      }
    }
    return null;
  };

  // 2. Compute from finished matches
  (matches || []).forEach(m => {
    if (!m) return;
    const isFinished = m.status === 'FINISHED' || m.phase === 'result' || m.phase === 'finished' || Boolean(m.result) || Boolean(m.resultText) || Boolean(m.winner);
    if (!isFinished) return;

    const t1Resolved = resolveTeamName(m.team1);
    const t2Resolved = resolveTeamName(m.team2);

    if (!t1Resolved || !t2Resolved || t1Resolved === t2Resolved) return;
    if (!tableMap[t1Resolved] || !tableMap[t2Resolved]) return;

    tableMap[t1Resolved].p += 1;
    tableMap[t2Resolved].p += 1;

    // Detect Winner
    const rawWinner = String(m.winnerTeamName || m.winner || m.resultText || m.result || '').trim();
    const wNorm = norm(rawWinner);
    const t1Norm = norm(t1Resolved);
    const t2Norm = norm(t2Resolved);

    let winnerResolved = null;
    if (m.winnerTeamName && resolveTeamName(m.winnerTeamName)) {
      winnerResolved = resolveTeamName(m.winnerTeamName);
    } else if (wNorm.includes(t1Norm) || (t1Norm.length >= 4 && wNorm.includes(t1Norm.slice(0, 4)))) {
      winnerResolved = t1Resolved;
    } else if (wNorm.includes(t2Norm) || (t2Norm.length >= 4 && wNorm.includes(t2Norm.slice(0, 4)))) {
      winnerResolved = t2Resolved;
    } else if (m.team1?.runs != null && m.team2?.runs != null) {
      if (Number(m.team1.runs) > Number(m.team2.runs)) winnerResolved = t1Resolved;
      else if (Number(m.team2.runs) > Number(m.team1.runs)) winnerResolved = t2Resolved;
    }

    if (winnerResolved === t1Resolved) {
      tableMap[t1Resolved].w += 1;
      tableMap[t1Resolved].pts += 2;
      tableMap[t1Resolved].form.unshift('W');

      tableMap[t2Resolved].l += 1;
      tableMap[t2Resolved].form.unshift('L');
    } else if (winnerResolved === t2Resolved) {
      tableMap[t2Resolved].w += 1;
      tableMap[t2Resolved].pts += 2;
      tableMap[t2Resolved].form.unshift('W');

      tableMap[t1Resolved].l += 1;
      tableMap[t1Resolved].form.unshift('L');
    } else {
      // Tie or No Result
      tableMap[t1Resolved].nr += 1;
      tableMap[t1Resolved].pts += 1;
      tableMap[t1Resolved].form.unshift('NR');

      tableMap[t2Resolved].nr += 1;
      tableMap[t2Resolved].pts += 1;
      tableMap[t2Resolved].form.unshift('NR');
    }

    // Keep only last 5 form results
    tableMap[t1Resolved].form = tableMap[t1Resolved].form.slice(0, 5);
    tableMap[t2Resolved].form = tableMap[t2Resolved].form.slice(0, 5);

    // Compute Net Run Rate (NRR) data
    const maxOvers = Number(m.rawMatchData?.maxOvers || m.maxOvers || m.overs || 0) || 20;

    const parseScoreData = (inning, teamFallback, allocatedOvers) => {
      let runs = 0;
      let wickets = 0;
      let legalBalls = 0;
      let isAllOut = false;

      if (inning) {
        runs = Number(inning.battingTeam?.runs ?? inning.runs ?? 0);
        wickets = Number(inning.battingTeam?.wickets ?? inning.wickets ?? (Array.isArray(inning.dismissedPlayers) ? inning.dismissedPlayers.length : 0));
        legalBalls = Number(inning.totalLegalBalls ?? inning.legalBalls ?? 0);
        if (!legalBalls && inning.overs) {
          const parts = String(inning.overs).split('.');
          legalBalls = (parseInt(parts[0], 10) || 0) * 6 + (parseInt(parts[1], 10) || 0);
        }
        if (inning.isAllOut || wickets >= 10) {
          isAllOut = true;
        }
      } else if (teamFallback) {
        runs = Number(teamFallback.runs || 0);
        wickets = Number(teamFallback.wickets || 0);
        legalBalls = Number(teamFallback.legalBalls || 0);
        if (teamFallback.score) {
          const match = String(teamFallback.score).match(/(\d+)\s*[-/]\s*(\d+)/);
          if (match) {
            runs = parseInt(match[1], 10) || 0;
            wickets = parseInt(match[2], 10) || 0;
          }
          const overMatch = String(teamFallback.score).match(/\((\d+(?:\.\d+)?)\)/);
          if (overMatch && !legalBalls) {
            const parts = overMatch[1].split('.');
            legalBalls = (parseInt(parts[0], 10) || 0) * 6 + (parseInt(parts[1], 10) || 0);
          }
        }
        if (wickets >= 10) isAllOut = true;
      }

      // Standard ICC Rule: If all out, balls counted is full allocated quota
      const fullQuotaBalls = allocatedOvers * 6;
      const effectiveBalls = (isAllOut && fullQuotaBalls > 0)
        ? Math.max(legalBalls, fullQuotaBalls)
        : (legalBalls || (fullQuotaBalls > 0 ? fullQuotaBalls : 30));

      return { runs, wickets, legalBalls, effectiveBalls };
    };

    const inn1 = m.rawMatchData?.innings?.[0] || m.innings?.[0];
    const inn2 = m.rawMatchData?.innings?.[1] || m.innings?.[1];

    // Determine which team batted in Innings 1 and which in Innings 2
    let inn1BatTeam = null;
    let inn2BatTeam = null;

    if (inn1?.battingTeam) {
      inn1BatTeam = resolveTeamName(inn1.battingTeam);
    }
    if (inn2?.battingTeam) {
      inn2BatTeam = resolveTeamName(inn2.battingTeam);
    }

    if (!inn1BatTeam && !inn2BatTeam) {
      inn1BatTeam = t1Resolved;
      inn2BatTeam = t2Resolved;
    } else if (inn1BatTeam && !inn2BatTeam) {
      inn2BatTeam = (inn1BatTeam === t1Resolved) ? t2Resolved : t1Resolved;
    } else if (!inn1BatTeam && inn2BatTeam) {
      inn1BatTeam = (inn2BatTeam === t1Resolved) ? t2Resolved : t1Resolved;
    }

    const inn1BowlTeam = (inn1BatTeam === t1Resolved) ? t2Resolved : t1Resolved;
    const inn2BowlTeam = (inn2BatTeam === t1Resolved) ? t2Resolved : t1Resolved;

    const d1 = parseScoreData(inn1, (inn1BatTeam === t1Resolved ? m.team1 : m.team2), maxOvers);
    const d2 = parseScoreData(inn2, (inn2BatTeam === t1Resolved ? m.team1 : m.team2), maxOvers);

    if (d1.runs > 0 || d1.effectiveBalls > 0) {
      if (tableMap[inn1BatTeam]) {
        tableMap[inn1BatTeam].runsScored += d1.runs;
        tableMap[inn1BatTeam].ballsFaced += d1.effectiveBalls;
      }
      if (tableMap[inn1BowlTeam]) {
        tableMap[inn1BowlTeam].runsConceded += d1.runs;
        tableMap[inn1BowlTeam].ballsBowled += d1.effectiveBalls;
      }
    }

    if (d2.runs > 0 || d2.effectiveBalls > 0) {
      if (tableMap[inn2BatTeam]) {
        tableMap[inn2BatTeam].runsScored += d2.runs;
        tableMap[inn2BatTeam].ballsFaced += d2.effectiveBalls;
      }
      if (tableMap[inn2BowlTeam]) {
        tableMap[inn2BowlTeam].runsConceded += d2.runs;
        tableMap[inn2BowlTeam].ballsBowled += d2.effectiveBalls;
      }
    }
  });

  // 3. Format NRR and sort by PTS desc, then NRR desc
  const list = Object.values(tableMap).map(row => {
    row.nrr = calculateNetRunRate(row.runsScored, row.ballsFaced, row.runsConceded, row.ballsBowled);
    return row;
  });

  list.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    const aNrrVal = a.nrr === '-' ? 0 : (parseFloat(a.nrr) || 0);
    const bNrrVal = b.nrr === '-' ? 0 : (parseFloat(b.nrr) || 0);
    if (bNrrVal !== aNrrVal) return bNrrVal - aNrrVal;
    return String(a.team || '').localeCompare(String(b.team || ''));
  });

  // 4. Calculate Qualification ('Q') and Elimination ('E')
  const teamsCount = list.length;
  const effectiveCutoff = teamsCount >= 5 ? 4 : (teamsCount >= 3 ? 2 : 1);
  const totalMatchesPlayed = list.reduce((acc, r) => acc + (Number(r.p) || 0), 0);

  const totalMatchesForTeam = {};
  (matches || []).forEach(m => {
    if (!m) return;
    const isPlayoff = String(m.round || m.stage || m.type || '').toLowerCase().match(/semi|final|playoff|eliminator|qualifier/);
    if (isPlayoff) return;
    const t1 = resolveTeamName(m.team1);
    const t2 = resolveTeamName(m.team2);
    if (t1) totalMatchesForTeam[t1] = (totalMatchesForTeam[t1] || 0) + 1;
    if (t2) totalMatchesForTeam[t2] = (totalMatchesForTeam[t2] || 0) + 1;
  });

  const maxMatchesPerTeam = Math.max(...list.map(r => totalMatchesForTeam[r.team] || r.p || 0), 0);
  const isTournamentLeagueComplete = totalMatchesPlayed > 0 && list.every(r => (totalMatchesForTeam[r.team] || r.p) <= r.p);

  list.forEach((row, idx) => {
    const rank = idx + 1;
    const played = Number(row.p || 0);
    const scheduled = totalMatchesForTeam[row.team] || maxMatchesPerTeam || played;
    const remaining = Math.max(0, scheduled - played);
    const maxPossiblePts = row.pts + (remaining * 2);

    if (totalMatchesPlayed > 0 && played > 0) {
      if (isTournamentLeagueComplete) {
        if (rank <= effectiveCutoff) {
          row.isQualified = true;
          row.qualified = true;
        } else {
          row.isEliminated = true;
          row.eliminated = true;
        }
      } else {
        if (rank <= effectiveCutoff) {
          const nonQualifiers = list.slice(effectiveCutoff);
          if (nonQualifiers.length > 0) {
            const maxOfNonQualifiers = Math.max(...nonQualifiers.map(nq => {
              const nqScheduled = totalMatchesForTeam[nq.team] || maxMatchesPerTeam || nq.p;
              const nqRemaining = Math.max(0, nqScheduled - nq.p);
              return nq.pts + (nqRemaining * 2);
            }));
            if (row.pts > maxOfNonQualifiers) {
              row.isQualified = true;
              row.qualified = true;
            }
          }
        } else {
          const cutoffTeam = list[effectiveCutoff - 1];
          if (cutoffTeam && maxPossiblePts < cutoffTeam.pts) {
            row.isEliminated = true;
            row.eliminated = true;
          }
        }
      }
    }
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
    organiserId: row.organiser_id || raw.organiserId || raw.organiser_id || '',
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

import { buildRajasthanLeagueTournament } from './seedRajasthanLeague.js';
import { buildSadokanPremierLeagueTournament } from './seedSadokanPremierLeague.js';

export const TOURNAMENT_SCHEMA_VERSION = 6;

/**
 * Get synchronous initial tournament list for 0ms frame-1 rendering
 */
export function getInitialTournamentsSync() {
  try {
    return [buildRajasthanLeagueTournament(), buildSadokanPremierLeagueTournament()];
  } catch (e) {
    return [];
  }
}

/**
 * Fetch all tournaments from Local Storage (Offline-First)
 */
export async function getTournamentsFromStorage() {
  try {
    const raw = await AsyncStorage.getItem(TOURNAMENTS_STORAGE_KEY);
    let list = [];
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed;
    }

    let changed = false;

    // Guarantee Rajasthan League 2026 is always available with 0 matches
    const rpl = buildRajasthanLeagueTournament();
    const existingRplIdx = list.findIndex(t => t.id === rpl.id || t.name === rpl.name);
    if (existingRplIdx === -1) {
      list = [rpl, ...list];
      changed = true;
    } else {
      const existingRpl = list[existingRplIdx];
      if ((existingRpl.schemaVersion || 0) < TOURNAMENT_SCHEMA_VERSION || (existingRpl.matches && existingRpl.matches.length > 0)) {
        list[existingRplIdx] = rpl;
        changed = true;
      }
    }

    // Guarantee Sadokan Premier League 2026 is always available with 0 matches
    const spl = buildSadokanPremierLeagueTournament();
    const existingSplIdx = list.findIndex(t => t.id === spl.id || t.name === spl.name);
    if (existingSplIdx === -1) {
      list = [...list, spl];
      changed = true;
    } else {
      const existingSpl = list[existingSplIdx];
      if ((existingSpl.schemaVersion || 0) < TOURNAMENT_SCHEMA_VERSION || (existingSpl.matches && existingSpl.matches.length > 0)) {
        list[existingSplIdx] = spl;
        changed = true;
      }
    }

    // Sanitize any other custom user tournaments to clear old match data
    list = list.map(t => {
      let mod = false;
      const copy = { ...t };
      if (copy.matches && copy.matches.length > 0) {
        copy.matches = [];
        mod = true;
      }
      if (!Array.isArray(copy.venues) || copy.venues.length === 0) {
        copy.venues = [copy.venue || copy.ground || copy.city || copy.host || 'Primary Cricket Ground'];
        mod = true;
      }
      if (!Array.isArray(copy.rounds) || copy.rounds.length === 0) {
        copy.rounds = ['Group / League Matches', 'Semi Final', 'Final'];
        mod = true;
      }
      if (!copy.rules) {
        copy.rules = {
          wideRuns: 1,
          noBallRuns: 1,
          isLegalWide: false,
          isLegalNoBall: false,
          wagonWheelEnabled: true,
          wagonWheelDotBalls: false,
          wagonWheelSingles: false,
          impactPlayerEnabled: false,
          maxBowlerQuota: 2,
          runsPerWicketPenalty: 0
        };
        mod = true;
      }
      if (!copy.structure) {
        copy.structure = copy.tournamentType || 'league';
        mod = true;
      }
      if (mod) changed = true;
      return copy;
    });

    if (changed) {
      await AsyncStorage.setItem(TOURNAMENTS_STORAGE_KEY, JSON.stringify(list));
    }

    return list;
  } catch (err) {
    return [buildRajasthanLeagueTournament(), buildSadokanPremierLeagueTournament()];
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
      let cloudTournaments = data.map(mapSupabaseRowToTournament).filter(Boolean);
      const rpl = buildRajasthanLeagueTournament();
      const spl = buildSadokanPremierLeagueTournament();

      const rplIdx = cloudTournaments.findIndex(t => t.id === rpl.id || t.name === rpl.name);
      if (rplIdx === -1) {
        cloudTournaments = [rpl, ...cloudTournaments];
      } else {
        cloudTournaments[rplIdx] = rpl;
      }

      const splIdx = cloudTournaments.findIndex(t => t.id === spl.id || t.name === spl.name);
      if (splIdx === -1) {
        cloudTournaments = [...cloudTournaments, spl];
      } else {
        cloudTournaments[splIdx] = spl;
      }

      // Guarantee all tournaments have 0 matches
      cloudTournaments = cloudTournaments.map(t => ({
        ...t,
        matches: []
      }));

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
 * Dynamically resolved against the authenticated user account (Phone / ID / Email)
 */
export async function getMyHostedTournamentIds() {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const list = await getTournamentsFromStorage();
    const userPhone = user.phone ? String(user.phone).trim() : null;
    const cleanUserPhone = userPhone ? userPhone.replace(/\D/g, '').slice(-10) : '';
    const userId = user.id ? String(user.id).trim() : null;
    const userEmail = user.email ? String(user.email).trim().toLowerCase() : null;
    const isBastiRam = cleanUserPhone === '9983228208' || userId === 'usr_9983228208' || String(user.name || '').toLowerCase().includes('basti ram');

    const myTournaments = list.filter(t => {
      if (isBastiRam && (t.id === 't_spl_2026_sadokan' || t.id === 't-rj-2026' || String(t.name || '').includes('Sadokan') || String(t.name || '').includes('Rajasthan'))) {
        return true;
      }
      const cleanTournPhone = t.organiserPhone ? String(t.organiserPhone).replace(/\D/g, '').slice(-10) : '';
      const matchPhone = Boolean(cleanUserPhone && cleanTournPhone && cleanUserPhone === cleanTournPhone);
      const matchId = userId && t.organiserId && String(t.organiserId).trim() === userId;
      const matchEmail = userEmail && t.organiserEmail && String(t.organiserEmail).trim().toLowerCase() === userEmail;
      return Boolean(matchPhone || matchId || matchEmail);
    });

    return myTournaments.map(t => t.id);
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
          raw_data: {
            ...tournamentData,
            organiserId: tournamentData.organiserId || null,
            organiserPhone: tournamentData.organiserPhone || null,
            organiserEmail: tournamentData.organiserEmail || null
          },
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
 * Update an existing Team in a Tournament (Roster, Captain, Details)
 */
export async function updateTournamentTeam(tournamentId, teamId, updatedTeamData) {
  try {
    const list = await getTournamentsFromStorage();
    const target = list.find(t => t.id === tournamentId);
    if (!target || !Array.isArray(target.teams)) return null;

    const teamIndex = target.teams.findIndex(t => t.id === teamId || t.name.toLowerCase() === (updatedTeamData.name || '').toLowerCase());
    if (teamIndex === -1) return null;

    const existingTeam = target.teams[teamIndex];
    const mergedTeam = {
      ...existingTeam,
      ...updatedTeamData,
      count: `${Array.isArray(updatedTeamData.players) ? updatedTeamData.players.length : (existingTeam.players?.length || 11)} Players`,
      playersCount: Array.isArray(updatedTeamData.players) ? updatedTeamData.players.length : (existingTeam.players?.length || 11)
    };

    target.teams[teamIndex] = mergedTeam;
    target.updatedAt = new Date().toISOString();

    await AsyncStorage.setItem(TOURNAMENTS_STORAGE_KEY, JSON.stringify(list));

    // Supabase Cloud Sync
    if (supabase) {
      try {
        await supabase
          .from('tournaments')
          .update({
            teams: target.teams,
            updated_at: new Date().toISOString()
          })
          .eq('id', tournamentId);
      } catch (cloudErr) {
        console.warn('[TournamentService] Supabase team update error:', cloudErr);
      }
    }

    return target;
  } catch (err) {
    console.error('[TournamentService] Update team error:', err);
    return null;
  }
}

/**
 * Remove a Team from a Tournament
 */
export async function removeTournamentTeam(tournamentId, teamId) {
  try {
    const list = await getTournamentsFromStorage();
    const target = list.find(t => t.id === tournamentId);
    if (!target || !Array.isArray(target.teams)) return null;

    const updatedTeams = target.teams.filter(t => t.id !== teamId && t.name !== teamId);
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
        console.warn('[TournamentService] Supabase team remove error:', cloudErr);
      }
    }

    return target;
  } catch (err) {
    console.error('[TournamentService] Remove team error:', err);
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
 * Replace / Set all scheduled fixtures for a tournament (Local + Supabase Sync)
 */
export async function saveTournamentFixtures(tournamentId, fixtures = []) {
  try {
    const list = await getTournamentsFromStorage();
    const target = list.find(t => t.id === tournamentId);
    if (!target) return null;

    target.matches = fixtures;
    target.updatedAt = new Date().toISOString();

    await AsyncStorage.setItem(TOURNAMENTS_STORAGE_KEY, JSON.stringify(list));

    // Supabase Cloud Sync
    if (supabase) {
      try {
        await supabase
          .from('tournaments')
          .update({
            matches: fixtures,
            updated_at: new Date().toISOString()
          })
          .eq('id', tournamentId);
      } catch (cloudErr) {
        console.warn('[TournamentService] Supabase fixtures sync error:', cloudErr);
      }
    }

    return target;
  } catch (err) {
    console.error('[TournamentService] saveTournamentFixtures error:', err);
    return null;
  }
}


/**
 * Real-time WebSocket subscription for tournaments table
 */
export function subscribeToTournamentsLive(onUpdate) {
  if (!supabase || typeof onUpdate !== 'function') {
    return () => { };
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
      } catch (e) { }
    };
  } catch (err) {
    console.warn('[TournamentService Realtime Init Error]:', err);
    return () => { };
  }
}

/**
 * Sync a finished match back to its parent tournament
 * Updates matches list, recalculates points table, and syncs to Supabase
 */
export async function syncFinishedMatchToTournament(tournamentId, finishedMatch) {
  if (!tournamentId || !finishedMatch) return null;
  try {
    let list = await getTournamentsFromStorage();
    let target = list.find(t => t.id === tournamentId);

    // If target not in local cache, fetch from Supabase
    if (!target && supabase) {
      try {
        const { data } = await supabase.from('tournaments').select('*').eq('id', tournamentId).single();
        if (data) {
          target = mapSupabaseRowToTournament(data);
          if (target) {
            list = [target, ...list];
          }
        }
      } catch (e) { }
    }

    if (!target) return null;

    const currentMatches = Array.isArray(target.matches) ? target.matches : [];
    const matchId = finishedMatch.tournamentMatchId || finishedMatch.id;

    const t1Name = finishedMatch.team1?.name || finishedMatch.team1Name || finishedMatch.inn1BattingTeam || 'Team 1';
    const t2Name = finishedMatch.team2?.name || finishedMatch.team2Name || finishedMatch.inn1BowlingTeam || 'Team 2';
    const t1Norm = String(t1Name).trim().toLowerCase();
    const t2Norm = String(t2Name).trim().toLowerCase();

    // Match by ID, tournamentMatchId, or by team combination!
    const matchIndex = currentMatches.findIndex(m => {
      if (m.id && (m.id === matchId || m.id === finishedMatch.id)) return true;
      if (m.tournamentMatchId && m.tournamentMatchId === matchId) return true;
      const m1 = String(m.team1?.name || m.team1 || '').trim().toLowerCase();
      const m2 = String(m.team2?.name || m.team2 || '').trim().toLowerCase();
      return (m1 === t1Norm && m2 === t2Norm) || (m1 === t2Norm && m2 === t1Norm);
    });

    const t1Score = finishedMatch.team1?.score || (finishedMatch.innings?.[0]?.battingTeam?.runs != null ? `${finishedMatch.innings[0].battingTeam.runs}/${finishedMatch.innings[0].battingTeam.wickets || 0} (${finishedMatch.innings[0].overs || '0.0'})` : '');
    const t2Score = finishedMatch.team2?.score || (finishedMatch.innings?.[1]?.battingTeam?.runs != null ? `${finishedMatch.innings[1].battingTeam.runs}/${finishedMatch.innings[1].battingTeam.wickets || 0} (${finishedMatch.innings[1].overs || '0.0'})` : '');

    const existingMatch = matchIndex >= 0 ? currentMatches[matchIndex] : null;

    // Resolve team names
    const existingT1Name = existingMatch?.team1?.name || (typeof existingMatch?.team1 === 'string' ? existingMatch.team1 : null) || t1Name;
    const existingT2Name = existingMatch?.team2?.name || (typeof existingMatch?.team2 === 'string' ? existingMatch.team2 : null) || t2Name;

    const getScoreForTeam = (teamName, fallbackScore) => {
      if (!teamName) return fallbackScore || '';
      const tNorm = String(teamName).trim().toLowerCase();
      const inn = (finishedMatch.rawMatchData?.innings || finishedMatch.innings)?.find(i => {
        const batName = String(i.battingTeam?.name || i.battingTeam || '').trim().toLowerCase();
        return batName && (batName === tNorm || batName.includes(tNorm) || tNorm.includes(batName));
      });
      if (inn && inn.battingTeam?.runs != null) {
        return `${inn.battingTeam.runs}/${inn.battingTeam.wickets || 0} (${inn.overs || '0.0'})`;
      }
      return fallbackScore || '';
    };

    const finalT1Score = getScoreForTeam(existingT1Name, finishedMatch.team1?.score);
    const finalT2Score = getScoreForTeam(existingT2Name, finishedMatch.team2?.score);

    const updatedMatchObj = {
      ...(existingMatch || {}),
      id: existingMatch?.id || matchId,
      matchNumber: existingMatch?.matchNumber || existingMatch?.matchNo || currentMatches.length + 1,
      stage: existingMatch?.stage || 'LEAGUE',
      team1: {
        ...(typeof existingMatch?.team1 === 'object' ? existingMatch.team1 : {}),
        name: existingT1Name,
        score: finalT1Score || t1Score || ''
      },
      team2: {
        ...(typeof existingMatch?.team2 === 'object' ? existingMatch.team2 : {}),
        name: existingT2Name,
        score: finalT2Score || t2Score || ''
      },
      dateStr: finishedMatch.matchDate || finishedMatch.dateStr || existingMatch?.dateStr || 'Completed',
      status: 'FINISHED',
      phase: 'result',
      winnerTeamName: finishedMatch.winnerTeamName || '',
      winner: finishedMatch.winnerTeamName || finishedMatch.resultText || finishedMatch.winner || '',
      result: finishedMatch.resultText || finishedMatch.winner || 'Match Completed',
      venue: finishedMatch.venue || target.city || 'Local Ground',
      rawMatchData: finishedMatch
    };

    let newMatchesList;
    if (matchIndex >= 0) {
      newMatchesList = [...currentMatches];
      newMatchesList[matchIndex] = updatedMatchObj;
    } else {
      newMatchesList = [...currentMatches, updatedMatchObj];
    }

    target.matches = newMatchesList;

    // Auto-calculate Points Table with newly finished match
    const updatedPointsTable = autoCalculatePointsTable(target.teams || [], newMatchesList);
    target.pointsTable = updatedPointsTable;
    target.updatedAt = new Date().toISOString();

    if (target.raw_data && typeof target.raw_data === 'object') {
      target.raw_data.matches = newMatchesList;
      target.raw_data.pointsTable = updatedPointsTable;
    }

    await AsyncStorage.setItem(TOURNAMENTS_STORAGE_KEY, JSON.stringify(list));

    // Supabase Cloud Sync
    if (supabase) {
      try {
        await supabase
          .from('tournaments')
          .update({
            matches: newMatchesList,
            points_table: updatedPointsTable,
            updated_at: new Date().toISOString()
          })
          .eq('id', tournamentId);
      } catch (cloudErr) {
        console.warn('[TournamentService] Supabase sync error on finished match:', cloudErr);
      }
    }

    return target;
  } catch (err) {
    console.error('[TournamentService] syncFinishedMatchToTournament error:', err);
    return null;
  }
}

/**
 * Sync a live match state to its parent tournament
 */
export async function syncLiveMatchToTournament(tournamentId, liveMatch) {
  if (!tournamentId || !liveMatch) return null;
  try {
    const list = await getTournamentsFromStorage();
    const target = list.find(t => String(t.id) === String(tournamentId));
    if (!target) return null;

    const currentMatches = Array.isArray(target.matches) ? target.matches : [];
    const matchId = liveMatch.tournamentMatchId || liveMatch.id;

    const t1Name = liveMatch.team1?.name || liveMatch.teams?.[0]?.name || 'Team 1';
    const t2Name = liveMatch.team2?.name || liveMatch.teams?.[1]?.name || 'Team 2';

    let t1Score = liveMatch.team1?.score || '';
    let t2Score = liveMatch.team2?.score || '';
    let t1Overs = liveMatch.team1?.overs || '';
    let t2Overs = liveMatch.team2?.overs || '';

    if (Array.isArray(liveMatch.innings)) {
      if (liveMatch.innings[0]?.battingTeam) {
        const inn1 = liveMatch.innings[0];
        t1Score = `${inn1.battingTeam.runs ?? 0}-${inn1.battingTeam.wickets ?? 0}`;
        t1Overs = `${inn1.overs ?? '0.0'}`;
      }
      if (liveMatch.innings[1]?.battingTeam) {
        const inn2 = liveMatch.innings[1];
        t2Score = `${inn2.battingTeam.runs ?? 0}-${inn2.battingTeam.wickets ?? 0}`;
        t2Overs = `${inn2.overs ?? '0.0'}`;
      } else if (liveMatch.phase === 'playing' || liveMatch.phase === 'inningBreak') {
        t2Score = 'Yet to bat';
      }
    }

    const matchIndex = currentMatches.findIndex(m => {
      if (m.id && (m.id === matchId || m.tournamentMatchId === matchId)) return true;
      if (m.tournamentMatchId && m.tournamentMatchId === matchId) return true;
      const mT1 = String(m.team1?.name || m.team1 || '').trim().toLowerCase();
      const mT2 = String(m.team2?.name || m.team2 || '').trim().toLowerCase();
      const lT1 = String(t1Name).trim().toLowerCase();
      const lT2 = String(t2Name).trim().toLowerCase();
      return (mT1 && mT2 && ((mT1 === lT1 && mT2 === lT2) || (mT1 === lT2 && mT2 === lT1)));
    });

    const liveMatchObj = {
      id: matchId,
      tournamentMatchId: matchId,
      team1: { name: t1Name, score: t1Score ? `${t1Score} (${t1Overs})` : (liveMatch.team1?.score || '') },
      team2: { name: t2Name, score: t2Score ? (t2Score === 'Yet to bat' ? 'Yet to bat' : `${t2Score} (${t2Overs})`) : (liveMatch.team2?.score || '') },
      dateStr: liveMatch.matchDate || 'Live Now',
      status: 'LIVE',
      phase: liveMatch.phase || 'playing',
      venue: liveMatch.venue || target.city || 'Local Ground',
      rawMatchData: liveMatch
    };

    let newMatchesList;
    if (matchIndex >= 0) {
      newMatchesList = [...currentMatches];
      newMatchesList[matchIndex] = { ...newMatchesList[matchIndex], ...liveMatchObj };
    } else {
      newMatchesList = [...currentMatches, liveMatchObj];
    }

    target.matches = newMatchesList;
    target.updatedAt = new Date().toISOString();

    await AsyncStorage.setItem(TOURNAMENTS_STORAGE_KEY, JSON.stringify(list));

    if (supabase) {
      supabase.from('tournaments').update({
        matches: newMatchesList,
        updated_at: new Date().toISOString()
      }).eq('id', target.id).then(() => { }).catch(() => { });
    }

    return target;
  } catch (err) {
    return null;
  }
}

/**
 * Fetch all upcoming scheduled tournament matches across all tournaments
 */
export async function getAllUpcomingTournamentMatches() {
  try {
    const tournaments = await getTournaments();
    const allUpcoming = [];

    (tournaments || []).forEach(tourn => {
      const matches = Array.isArray(tourn.matches) ? tourn.matches : [];
      matches.forEach((m, idx) => {
        const isFinished = m.status === 'FINISHED' || m.phase === 'result' || Boolean(m.result) || Boolean(m.resultText);
        const isLive = m.status === 'LIVE' || m.phase === 'playing' || m.phase === 'inningBreak';
        if (!isFinished && !isLive) {
          const t1Resolved = resolveTeamWithRoster(m.team1 || { name: 'Team 1' }, tourn.teams || []);
          const t2Resolved = resolveTeamWithRoster(m.team2 || { name: 'Team 2' }, tourn.teams || []);

          allUpcoming.push({
            ...m,
            id: m.id || `up_${tourn.id}_${m.matchNo || idx + 1}`,
            tournamentId: tourn.id,
            tournamentName: tourn.name || tourn.title || 'Tournament Fixture',
            seriesName: tourn.name || tourn.title || 'Tournament',
            matchTitle: m.matchTitle || `${t1Resolved.name} vs ${t2Resolved.name}`,
            title: m.matchTitle || `${t1Resolved.name} vs ${t2Resolved.name}`,
            team1: t1Resolved,
            team2: t2Resolved,
            stage: m.stage || 'ROUND-ROBIN',
            status: 'UPCOMING',
            venue: m.venue || tourn.city || 'Sadokan Ground',
            dateText: m.dateStr || m.date || 'Upcoming Fixture',
            matchDate: m.dateStr || m.date || 'Upcoming',
            time: m.time || '10:00 AM',
            overs: m.overs || tourn.overs || 5,
            maxOvers: m.overs || tourn.overs || 5,
            isTournamentFixture: true,
            tournament: tourn
          });
        }
      });
    });

    return allUpcoming;
  } catch (err) {
    console.warn('[TournamentService] getAllUpcomingTournamentMatches error:', err);
    return [];
  }
}

/**
 * Delete a tournament (Offline storage + Supabase Cloud Delete)
 */
export async function deleteTournament(tournamentId) {
  try {
    if (!tournamentId) return false;

    // 1. Remove from local storage
    const existingList = await getTournamentsFromStorage();
    const updatedList = existingList.filter(t => t.id !== tournamentId);
    await AsyncStorage.setItem(TOURNAMENTS_STORAGE_KEY, JSON.stringify(updatedList));

    // 2. Remove from hosted IDs
    const hostedIds = await getMyHostedTournamentIds();
    const updatedHosted = hostedIds.filter(id => id !== tournamentId);
    await AsyncStorage.setItem(MY_HOSTED_TOURNAMENTS_KEY, JSON.stringify(updatedHosted));

    // 3. Clear active tournament if it was the deleted one
    const activeId = await getActiveTournamentId();
    if (activeId === tournamentId) {
      if (updatedList.length > 0) {
        await saveActiveTournamentId(updatedList[0].id);
      } else {
        await AsyncStorage.removeItem(ACTIVE_TOURNAMENT_ID_KEY);
      }
    }

    // 4. Delete from Supabase Cloud
    if (supabase) {
      try {
        await supabase.from('tournaments').delete().eq('id', tournamentId);
      } catch (cloudErr) {
        console.warn('[TournamentService] Supabase delete error:', cloudErr);
      }
    }

    return true;
  } catch (err) {
    console.error('[TournamentService] deleteTournament error:', err);
    return false;
  }
}

/**
 * Add a player to a specific team in a tournament and sync across storage and Supabase
 */
export async function addPlayerToTournamentTeam(tournamentId, teamNameOrId, playerObj) {
  try {
    if (!tournamentId || !teamNameOrId || !playerObj) return null;
    const playerName = typeof playerObj === 'string' ? playerObj.trim() : (playerObj.name || '').trim();
    if (!playerName) return null;

    const list = await getTournamentsFromStorage();
    const target = list.find(t => t.id === tournamentId);
    if (!target || !Array.isArray(target.teams)) return null;

    const targetKey = String(teamNameOrId).trim().toLowerCase();
    const teamIndex = target.teams.findIndex(t => (t.id && String(t.id).toLowerCase() === targetKey) || (t.name && String(t.name).trim().toLowerCase() === targetKey));
    if (teamIndex === -1) return null;

    const existingTeam = target.teams[teamIndex];
    const currentPlayers = Array.isArray(existingTeam.players) ? [...existingTeam.players] : (Array.isArray(existingTeam.squad) ? [...existingTeam.squad] : []);

    // Check if player already exists in this team
    const alreadyExists = currentPlayers.some(p => {
      const pName = typeof p === 'string' ? p.trim() : (p?.name || '').trim();
      return pName.toLowerCase() === playerName.toLowerCase();
    });

    if (!alreadyExists) {
      const normalizedPlayer = typeof playerObj === 'string'
        ? { id: `tp_${Date.now()}_${currentPlayers.length + 1}`, name: playerName, role: 'All-Rounder', phone: '', isCaptain: false, isWicketKeeper: false }
        : {
          id: playerObj.id || `tp_${Date.now()}_${currentPlayers.length + 1}`,
          name: playerName,
          role: playerObj.role || 'All-Rounder',
          phone: playerObj.phone || playerObj.mobile || '',
          photoUrl: playerObj.photoUrl || playerObj.avatar || '',
          isCaptain: Boolean(playerObj.isCaptain),
          isWicketKeeper: Boolean(playerObj.isWicketKeeper)
        };

      currentPlayers.push(normalizedPlayer);
    }

    const updatedTeam = {
      ...existingTeam,
      players: currentPlayers,
      count: `${currentPlayers.length} Players`,
      playersCount: currentPlayers.length
    };

    target.teams[teamIndex] = updatedTeam;
    target.updatedAt = new Date().toISOString();

    await AsyncStorage.setItem(TOURNAMENTS_STORAGE_KEY, JSON.stringify(list));

    if (supabase) {
      try {
        await supabase
          .from('tournaments')
          .update({
            teams: target.teams,
            updated_at: new Date().toISOString()
          })
          .eq('id', tournamentId);
      } catch (cloudErr) {
        console.warn('[TournamentService] Supabase addPlayerToTournamentTeam error:', cloudErr);
      }
    }

    return target;
  } catch (err) {
    console.error('[TournamentService] addPlayerToTournamentTeam error:', err);
    return null;
  }
}

/**
 * Remove a player from a specific team in a tournament
 */
export async function removePlayerFromTournamentTeam(tournamentId, teamNameOrId, playerName) {
  try {
    if (!tournamentId || !teamNameOrId || !playerName) return null;
    const targetName = String(playerName).trim().toLowerCase();

    const list = await getTournamentsFromStorage();
    const target = list.find(t => t.id === tournamentId);
    if (!target || !Array.isArray(target.teams)) return null;

    const targetKey = String(teamNameOrId).trim().toLowerCase();
    const teamIndex = target.teams.findIndex(t => (t.id && String(t.id).toLowerCase() === targetKey) || (t.name && String(t.name).trim().toLowerCase() === targetKey));
    if (teamIndex === -1) return null;

    const existingTeam = target.teams[teamIndex];
    const currentPlayers = Array.isArray(existingTeam.players) ? [...existingTeam.players] : (Array.isArray(existingTeam.squad) ? [...existingTeam.squad] : []);

    const updatedPlayers = currentPlayers.filter(p => {
      const pName = typeof p === 'string' ? p.trim() : (p?.name || '').trim();
      return pName.toLowerCase() !== targetName;
    });

    const updatedTeam = {
      ...existingTeam,
      players: updatedPlayers,
      count: `${updatedPlayers.length} Players`,
      playersCount: updatedPlayers.length
    };

    target.teams[teamIndex] = updatedTeam;
    target.updatedAt = new Date().toISOString();

    await AsyncStorage.setItem(TOURNAMENTS_STORAGE_KEY, JSON.stringify(list));

    if (supabase) {
      try {
        await supabase
          .from('tournaments')
          .update({
            teams: target.teams,
            updated_at: new Date().toISOString()
          })
          .eq('id', tournamentId);
      } catch (cloudErr) {
        console.warn('[TournamentService] Supabase removePlayerFromTournamentTeam error:', cloudErr);
      }
    }

    return target;
  } catch (err) {
    console.error('[TournamentService] removePlayerFromTournamentTeam error:', err);
    return null;
  }
}

