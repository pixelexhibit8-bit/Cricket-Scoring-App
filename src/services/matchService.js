import { supabase, isSupabaseConfigured, generateUUID } from './supabaseClient.js';

export const syncMatchToSupabase = async (match) => {
  if (!match || !isSupabaseConfigured() || !supabase) return null;

  try {
    let matchUuid = match.supabaseId || match.id;
    const isValidUuid = typeof matchUuid === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(matchUuid);
    if (!isValidUuid) {
      matchUuid = generateUUID();
    }

    const nowIso = new Date().toISOString();
    const updatedMatch = { ...match, id: matchUuid, supabaseId: matchUuid, updatedAt: nowIso };

    const team1Name = updatedMatch.teams?.[0]?.name || updatedMatch.team1?.name || updatedMatch.inn1BattingTeam || 'Team 1';
    const team2Name = updatedMatch.teams?.[1]?.name || updatedMatch.team2?.name || updatedMatch.inn1BowlingTeam || 'Team 2';

    let winnerTeamName = updatedMatch.winnerTeamName || null;
    const resText = updatedMatch.resultText || updatedMatch.winner || '';
    if (!winnerTeamName && resText) {
      if (resText.toLowerCase().includes(team1Name.toLowerCase())) winnerTeamName = team1Name;
      else if (resText.toLowerCase().includes(team2Name.toLowerCase())) winnerTeamName = team2Name;
    }

    const payload = {
      id: matchUuid,
      match_title: updatedMatch.matchTitle || updatedMatch.title || `${team1Name} vs ${team2Name}`,
      phase: updatedMatch.phase || 'playing',
      inning: updatedMatch.inning || 1,
      max_overs: updatedMatch.maxOvers || 20,
      target: updatedMatch.target || null,
      team1_name: team1Name,
      team2_name: team2Name,
      winner_team_name: winnerTeamName,
      result_text: resText || null,
      toss_winner: updatedMatch.tossWinner || null,
      toss_decision: updatedMatch.tossDecision || updatedMatch.tossChoice || null,
      scorer_pin: updatedMatch.scorerPin || updatedMatch.scorer_pin || null,
      match_data: updatedMatch,
      updated_at: nowIso
    };

    const { data, error } = await supabase.from('matches').upsert(payload, {
      onConflict: 'id',
      returning: 'representation'
    });

    if (error) {
      console.warn('[Supabase Sync Warning]:', error.message || error);
      return null;
    }
    return data?.[0] || null;
  } catch (err) {
    console.warn('[Supabase Exception]:', err.message || err);
    return null;
  }
};

export const fetchFinishedMatchesFromSupabase = async () => {
  if (!isSupabaseConfigured() || !supabase) return [];

  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error || !Array.isArray(data)) return [];

    return data
      .filter(row => row.phase === 'result' || row.phase === 'finished' || row.phase === 'completed' || row.match_data?.phase === 'result' || row.match_data?.isCompleted)
      .map(row => {
        const match = row.match_data || {};
        const innings = Array.isArray(match.innings) ? match.innings : [];

        // Extract team names from innings or teams array (raw activeMatch format)
        const team1Name = innings[0]?.battingTeam?.name || match.team1?.name || match.teams?.[0]?.name || row.team1_name;
        const team2Name = innings[0]?.bowlingTeam?.name || match.team2?.name || match.teams?.[1]?.name || row.team2_name;
        if (!team1Name && !team2Name) return null;

        const t1Name = team1Name || 'Team 1';
        const t2Name = team2Name || 'Team 2';

        // Skip placeholder team names
        const isPlaceholder = (n) => !n || n === 'Team 1' || n === 'Team 2' || n === 'Team A' || n === 'Team B';
        if (isPlaceholder(t1Name) || isPlaceholder(t2Name)) return null;

        const completedDate = match.completedAt || row.updated_at || row.created_at || new Date().toISOString();

        // Extract scores from raw innings format
        const inn1 = innings.find(i => i?.battingTeam?.name === t1Name) || innings[0];
        const inn2 = innings.find(i => i?.battingTeam?.name === t2Name) || innings[1];

        const buildTeamFromInning = (inn, name, fallbackTeam) => {
          if (inn) {
            const runs = inn.battingTeam?.runs ?? inn.runs ?? 0;
            const wickets = inn.battingTeam?.wickets ?? inn.wickets ?? 0;
            const legalBalls = inn.totalLegalBalls ?? inn.legalBalls ?? 0;
            const ov = Math.floor(legalBalls / 6);
            const b = legalBalls % 6;
            return {
              name,
              runs,
              wickets,
              legalBalls,
              score: `${runs}-${wickets} (${ov}.${b} Ov)`,
              batting: inn.allBatters || inn.batting || [],
              bowling: inn.bowlingStats ? Object.values(inn.bowlingStats) : (inn.bowling || []),
              overHistory: inn.overHistory || [],
              fallOfWickets: inn.fallOfWickets || [],
              partnerships: inn.partnershipHistory || inn.partnerships || []
            };
          }
          return fallbackTeam || { name, runs: 0, score: 'Yet to bat', batting: [], bowling: [] };
        };

        const sourceMatch = innings.length > 0 ? match : (match.sourceMatch || match);
        const team1Built = (match.team1?.runs !== undefined && match.team1?.score) ? match.team1 : buildTeamFromInning(inn1, t1Name, match.team1);
        const team2Built = (match.team2?.runs !== undefined && match.team2?.score) ? match.team2 : buildTeamFromInning(inn2, t2Name, match.team2);

        return {
          ...match,
          id: match.id || row.id,
          supabaseId: row.id,
          title: match.matchTitle || row.match_title || `${t1Name} vs ${t2Name}`,
          matchTitle: match.matchTitle || row.match_title || `${t1Name} vs ${t2Name}`,
          winner: match.resultText || row.result_text || 'Match Completed',
          resultText: match.resultText || row.result_text || 'Match Completed',
          winnerTeamName: match.winnerTeamName || row.winner_team_name || '',
          maxOvers: match.maxOvers || row.max_overs || 20,
          completedAt: completedDate,
          sourceMatch,
          team1: team1Built,
          team2: team2Built
        };
      })
      .filter(Boolean);
  } catch (err) {
    console.warn('[Supabase Exception]:', err.message || err);
    return [];
  }
};


export const fetchPlayersFromSupabase = async () => {
  if (!isSupabaseConfigured() || !supabase) return [];

  try {
    const { data, error } = await supabase.from('players').select('*');
    if (error || !Array.isArray(data)) return [];
    return data.map(p => ({
      id: p.id,
      name: p.name,
      role: p.role || 'Player',
      team: p.team || '',
      avatar: p.avatar_url || p.avatar || null
    }));
  } catch (err) {
    return [];
  }
};

export const syncPlayerToSupabase = async (player) => {
  if (!player || !player.name || !isSupabaseConfigured() || !supabase) return null;

  try {
    const playerId = player.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(player.id)
      ? player.id
      : generateUUID();

    const { data, error } = await supabase.from('players').upsert({
      id: playerId,
      name: player.name,
      role: player.role || 'Player',
      team: player.team || '',
      avatar_url: player.avatar || null,
    }, { onConflict: 'id' });

    if (error) return null;
    return data?.[0] || null;
  } catch (err) {
    return null;
  }
};

export const fetchLiveMatchFromSupabase = async () => {
  if (!isSupabaseConfigured() || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .neq('phase', 'result')
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error || !Array.isArray(data) || !data.length) return null;
    return data[0].match_data || null;
  } catch (err) {
    return null;
  }
};

// TRUE REAL-TIME WebSocket subscription using @supabase/supabase-js
// Zero delay — Supabase pushes changes instantly via WebSocket
export const subscribeToSupabaseLiveMatches = (onUpdate) => {
  if (!isSupabaseConfigured() || !supabase || typeof onUpdate !== 'function') {
    return () => {};
  }

  try {
    const channelName = `matches_live_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const channel = supabase.channel(channelName);

    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        (payload) => {
          const matchData = payload?.new?.match_data;
          if (matchData && matchData.phase !== 'result') {
            onUpdate(matchData);
          }
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (e) {}
    };
  } catch (err) {
    console.warn('[Supabase Realtime Init Error]:', err.message || err);
    return () => {};
  }
};

export const fetchMatchesByPinFromSupabase = async (pin) => {
  if (!isSupabaseConfigured() || !supabase || !pin) return [];
  const cleanPin = String(pin).trim();
  if (!cleanPin) return [];

  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .neq('phase', 'result')
      .order('updated_at', { ascending: false });

    if (error || !Array.isArray(data)) return [];

    return data.filter(row => {
      const isFinished = row.phase === 'result'
        || row.phase === 'finished'
        || row.phase === 'completed'
        || Boolean(row.result_text)
        || row.match_data?.phase === 'result'
        || Boolean(row.match_data?.resultText)
        || Boolean(row.match_data?.winner);

      if (isFinished) return false;

      const matchPin = row.scorer_pin || row.match_data?.scorerPin || row.match_data?.scorer_pin;
      return String(matchPin).trim() === cleanPin;
    }).map(row => row.match_data || null).filter(Boolean);
  } catch (err) {
    return [];
  }
};

export const fetchMatchByPinFromSupabase = async (pin) => {
  const matches = await fetchMatchesByPinFromSupabase(pin);
  return matches[0] || null;
};
