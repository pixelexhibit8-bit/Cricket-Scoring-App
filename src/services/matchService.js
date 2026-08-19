import { supabase, isSupabaseConfigured, generateUUID } from './supabaseClient.js';
import { CURRENT_BUILD_TOKEN } from '../config/appBuild.js';

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
    let resText = updatedMatch.resultText || updatedMatch.winner || '';

    // If resultText is empty or generic 'Match Completed', calculate real result dynamically:
    if (!resText || resText === 'Match Completed' || !winnerTeamName) {
      const inn1 = updatedMatch.innings?.[0] || updatedMatch.team1;
      const inn2 = updatedMatch.innings?.[1] || updatedMatch.team2;
      const t1Runs = Number(inn1?.battingTeam?.runs ?? inn1?.runs ?? 0);
      const t2Runs = Number(inn2?.battingTeam?.runs ?? inn2?.runs ?? 0);
      const t2Wkts = Number(inn2?.battingTeam?.wickets ?? inn2?.wickets ?? 0);
      const maxWkts = (inn2?.allBatters?.length > 1 ? inn2.allBatters.length - 1 : (updatedMatch.maxWickets || 10));

      if (updatedMatch.phase === 'result' || updatedMatch.phase === 'finished' || updatedMatch.isCompleted || (inn2 && t2Runs > 0)) {
        if (t2Runs > t1Runs) {
          winnerTeamName = team2Name;
          const wLeft = Math.max(1, maxWkts - t2Wkts);
          resText = `${team2Name} won by ${wLeft} wicket${wLeft !== 1 ? 's' : ''}`;
        } else if (t1Runs > t2Runs) {
          winnerTeamName = team1Name;
          const rDiff = t1Runs - t2Runs;
          resText = `${team1Name} won by ${rDiff} run${rDiff !== 1 ? 's' : ''}`;
        } else if (t1Runs === t2Runs && t1Runs > 0) {
          resText = 'Match tied';
          winnerTeamName = null;
        }
      }
    }

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
      match_data: { ...updatedMatch, app_build_token: CURRENT_BUILD_TOKEN, winnerTeamName, resultText: resText },
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
      .filter(row => {
        const isFinished = row.phase === 'result' || row.phase === 'finished' || row.phase === 'completed' || row.match_data?.phase === 'result' || row.match_data?.isCompleted;
        const isCurrentBuild = row.match_data?.app_build_token === CURRENT_BUILD_TOKEN;
        return isFinished && isCurrentBuild;
      })
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

            const battingList = Array.isArray(inn.allBatters) && inn.allBatters.length > 0
              ? inn.allBatters
              : (Array.isArray(inn.batting) && inn.batting.length > 0
                ? inn.batting
                : (inn.battingStats ? (Array.isArray(inn.battingStats) ? inn.battingStats : Object.values(inn.battingStats)) : []));

            const bowlingList = Array.isArray(inn.bowling) && inn.bowling.length > 0
              ? inn.bowling
              : (inn.bowlingStats ? (Array.isArray(inn.bowlingStats) ? inn.bowlingStats : Object.values(inn.bowlingStats)) : []);

            return {
              name,
              runs,
              wickets,
              legalBalls,
              score: `${runs}-${wickets} (${ov}.${b} Ov)`,
              batting: battingList,
              bowling: bowlingList,
              overHistory: inn.overHistory || [],
              fallOfWickets: inn.fallOfWickets || [],
              partnerships: inn.partnershipHistory || inn.partnerships || []
            };
          }
          return fallbackTeam || { name, runs: 0, score: 'Yet to bat', batting: [], bowling: [] };
        };

        const sourceMatch = innings.length > 0 ? match : (match.sourceMatch || match);
        const team1Built = buildTeamFromInning(inn1, t1Name, match.team1);
        const team2Built = buildTeamFromInning(inn2, t2Name, match.team2);

        let computedWinner = match.resultText || row.result_text || '';
        let computedWinnerTeamName = match.winnerTeamName || row.winner_team_name || '';

        const t1Runs = Number(team1Built?.runs || 0);
        const t2Runs = Number(team2Built?.runs || 0);
        const t2Wkts = Number(team2Built?.wickets || 0);
        const maxWkts = team2Built?.batting?.length > 1 ? team2Built.batting.length - 1 : (match.maxWickets || 10);

        if (!computedWinner || computedWinner === 'Match Completed' || !computedWinnerTeamName) {
          if (t2Runs > t1Runs) {
            computedWinnerTeamName = t2Name;
            const wLeft = Math.max(1, maxWkts - t2Wkts);
            computedWinner = `${t2Name} won by ${wLeft} wicket${wLeft !== 1 ? 's' : ''}`;
          } else if (t1Runs > t2Runs) {
            computedWinnerTeamName = t1Name;
            const rDiff = t1Runs - t2Runs;
            computedWinner = `${t1Name} won by ${rDiff} run${rDiff !== 1 ? 's' : ''}`;
          } else if (t1Runs === t2Runs && t1Runs > 0) {
            computedWinner = 'Match tied';
            computedWinnerTeamName = '';
          }
        }

        const completedDate = match.completedAt || match.startedAt || row.updated_at || row.created_at || new Date().toISOString();
        const dObj = new Date(completedDate);
        let dateLabel = 'Match Results';
        if (!isNaN(dObj.getTime())) {
          const dayName = dObj.toLocaleDateString('en-GB', { weekday: 'long' });
          const dayMonthYear = dObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
          dateLabel = `${dayName}, ${dayMonthYear}`;
        }

        return {
          ...match,
          id: match.id || row.id,
          supabaseId: row.id,
          title: match.matchTitle || row.match_title || `${t1Name} vs ${t2Name}`,
          matchTitle: match.matchTitle || row.match_title || `${t1Name} vs ${t2Name}`,
          winner: computedWinner || 'Match Completed',
          resultText: computedWinner || 'Match Completed',
          winnerTeamName: computedWinnerTeamName || '',
          maxOvers: match.maxOvers || row.max_overs || 20,
          team1: team1Built,
          team2: team2Built,
          team1Name: t1Name,
          team2Name: t2Name,
          dateLabel,
          dateText: dateLabel,
          innings: innings.length > 0 ? innings : [
            { battingTeam: team1Built, allBatters: team1Built.batting, bowlingStats: team1Built.bowling },
            { battingTeam: team2Built, allBatters: team2Built.batting, bowlingStats: team2Built.bowling }
          ],
          completedAt: completedDate,
          sourceMatch
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

export const fetchLiveMatchesFromSupabase = async () => {
  if (!isSupabaseConfigured() || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .neq('phase', 'result')
      .order('updated_at', { ascending: false });

    if (error || !Array.isArray(data)) return [];

    return data
      .filter(row => {
        const isFinished = row.phase === 'result'
          || row.phase === 'finished'
          || row.phase === 'completed'
          || row.match_data?.phase === 'result'
          || row.match_data?.isCompleted;
        const isCurrentBuild = row.match_data?.app_build_token === CURRENT_BUILD_TOKEN;
        return !isFinished && isCurrentBuild && row.match_data;
      })
      .map(row => {
        const md = row.match_data || {};
        return {
          ...md,
          id: md.id || row.id,
          supabaseId: row.id
        };
      })
      .filter(m => Boolean(m && (m.team1?.name || m.teams?.[0]?.name || m.inn1BattingTeam)));
  } catch (err) {
    console.warn('[Supabase Exception fetchLiveMatches]:', err.message || err);
    return [];
  }
};

export const fetchLiveMatchFromSupabase = async () => {
  const matches = await fetchLiveMatchesFromSupabase();
  return matches[0] || null;
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
          if (matchData && matchData.app_build_token === CURRENT_BUILD_TOKEN) {
            onUpdate(matchData, payload?.eventType, payload?.new);
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
      const matchesBuild = row.match_data?.app_build_token === CURRENT_BUILD_TOKEN;
      if (!matchesBuild) return false;

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

/**
 * Automatically updates past match records in Supabase so that ground spellings / aliases
 * are replaced with the official registered player name.
 */
export const syncPlayerNameToPastMatches = async (officialName) => {
  if (!isSupabaseConfigured() || !supabase || !officialName) return;
  const cleanOfficial = officialName.trim();
  if (!cleanOfficial) return;

  try {
    const { data: matches, error } = await supabase.from('matches').select('*');
    if (error || !Array.isArray(matches)) return;

    for (const row of matches) {
      let md = typeof row.match_data === 'string' ? JSON.parse(row.match_data) : row.match_data;
      if (!md) continue;
      let changed = false;

      // 1. Update playingXI
      if (md.playingXI && typeof md.playingXI === 'object') {
        Object.keys(md.playingXI).forEach(teamKey => {
          const list = md.playingXI[teamKey];
          if (Array.isArray(list)) {
            md.playingXI[teamKey] = list.map(pName => {
              const nameStr = typeof pName === 'string' ? pName : pName?.name;
              if (nameStr && nameStr !== cleanOfficial) {
                // Check if phonetic / alias match
                const n1 = nameStr.toLowerCase().trim().replace(/[^a-z0-9]/g, '').replace(/h/g, '');
                const n2 = cleanOfficial.toLowerCase().trim().replace(/[^a-z0-9]/g, '').replace(/h/g, '');
                if (n1 === n2 || (n1.length > 3 && (n2.includes(n1) || n1.includes(n2)))) {
                  changed = true;
                  return cleanOfficial;
                }
              }
              return pName;
            });
          }
        });
      }

      // 2. Update innings stats
      if (Array.isArray(md.innings)) {
        md.innings.forEach(inn => {
          // Bowling stats
          if (inn.bowlingStats && typeof inn.bowlingStats === 'object') {
            Object.keys(inn.bowlingStats).forEach(bowlerKey => {
              if (bowlerKey !== cleanOfficial) {
                const n1 = bowlerKey.toLowerCase().trim().replace(/[^a-z0-9]/g, '').replace(/h/g, '');
                const n2 = cleanOfficial.toLowerCase().trim().replace(/[^a-z0-9]/g, '').replace(/h/g, '');
                if (n1 === n2 || (n1.length > 3 && (n2.includes(n1) || n1.includes(n2)))) {
                  const stat = inn.bowlingStats[bowlerKey];
                  stat.name = cleanOfficial;
                  inn.bowlingStats[cleanOfficial] = stat;
                  delete inn.bowlingStats[bowlerKey];
                  changed = true;
                }
              }
            });
          }
          // Batting stats
          if (inn.battingStats && typeof inn.battingStats === 'object') {
            Object.keys(inn.battingStats).forEach(batterKey => {
              if (batterKey !== cleanOfficial) {
                const n1 = batterKey.toLowerCase().trim().replace(/[^a-z0-9]/g, '').replace(/h/g, '');
                const n2 = cleanOfficial.toLowerCase().trim().replace(/[^a-z0-9]/g, '').replace(/h/g, '');
                if (n1 === n2 || (n1.length > 3 && (n2.includes(n1) || n1.includes(n2)))) {
                  const stat = inn.battingStats[batterKey];
                  stat.name = cleanOfficial;
                  inn.battingStats[cleanOfficial] = stat;
                  delete inn.battingStats[batterKey];
                  changed = true;
                }
              }
            });
          }
          // All batters list (completed innings scorecard)
          if (Array.isArray(inn.allBatters)) {
            inn.allBatters.forEach(b => {
              if (b && b.name && b.name !== cleanOfficial) {
                const n1 = b.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '').replace(/h/g, '');
                const n2 = cleanOfficial.toLowerCase().trim().replace(/[^a-z0-9]/g, '').replace(/h/g, '');
                if (n1 === n2 || (n1.length > 3 && (n2.includes(n1) || n1.includes(n2)))) {
                  b.name = cleanOfficial;
                  changed = true;
                }
              }
              if (b && b.dismissal && typeof b.dismissal === 'string') {
                const n2 = cleanOfficial.toLowerCase().trim().replace(/[^a-z0-9]/g, '').replace(/h/g, '');
                if (b.dismissal.toLowerCase().includes('dasrath') || b.dismissal.toLowerCase().includes('sangwa')) {
                  const dClean = b.dismissal.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/h/g, '');
                  if (dClean.includes(n2)) {
                    b.dismissal = b.dismissal.replace(/dasrath\s*sangwa/gi, cleanOfficial);
                    changed = true;
                  }
                }
              }
            });
          }
        });
      }

      if (changed) {
        await supabase
          .from('matches')
          .update({ match_data: md })
          .eq('id', row.id);
      }
    }
  } catch (err) {
    console.warn('[syncPlayerNameToPastMatches error]:', err.message || err);
  }
};

export const fetchMatchByAccessCode = async (code) => {
  if (!code || !isSupabaseConfigured() || !supabase) return null;
  const cleanCode = code.trim().toUpperCase();

  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(20);

    if (!error && Array.isArray(data) && data.length > 0) {
      const matched = data.find(m => {
        const md = m.match_data || m;
        const c1 = (md.matchCode || '').toUpperCase();
        const c2 = (md.scorerPin || '').toUpperCase();
        const c3 = (m.id || '').toUpperCase();
        return c1 === cleanCode || c2 === cleanCode || c3.endsWith(cleanCode) || (cleanCode.length >= 4 && c3.includes(cleanCode));
      });

      if (matched) {
        return matched.match_data || matched;
      }
    }
    return null;
  } catch (err) {
    console.warn('Error fetching match by access code:', err);
    return null;
  }
};
