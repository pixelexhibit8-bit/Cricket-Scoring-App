/**
 * CricFlow Tournament Stats Engine
 * Computes tournament-wide aggregate statistics, leaderboards, and player metrics
 * from matches, scorecards, innings, and rosters.
 */

/**
 * Calculates complete tournament statistics from matches and team rosters.
 * @param {Object} tournament - Tournament object containing matches and teams.
 * @returns {Object} Calculated stats object with aggregate counts and leaderboards.
 */
export function calculateTournamentStats(tournament) {
  if (!tournament) {
    return getEmptyStats();
  }

  const matches = Array.isArray(tournament.matches) ? tournament.matches : [];
  const teams = Array.isArray(tournament.teams) ? tournament.teams : [];

  // Maps for player aggregates: playerName -> playerStats
  const battingMap = new Map();
  const bowlingMap = new Map();

  let totalSixes = 0;
  let totalFours = 0;

  // 1. Process all finished or live matches with scorecard data
  matches.forEach(m => {
    if (!m) return;
    const raw = m.rawMatchData || m;
    const inningsList = Array.isArray(raw.innings)
      ? raw.innings
      : (Array.isArray(m.innings) ? m.innings : (raw.inningsList || []));

    inningsList.forEach(inn => {
      if (!inn) return;
      const battingTeamName = inn.battingTeam?.name || inn.battingTeamName || '';
      const bowlingTeamName = inn.bowlingTeam?.name || inn.bowlingTeamName || '';

      // --- Batting extraction (checks allBatters, batsmen, batters, striker, nonStriker) ---
      let batters = [];
      if (Array.isArray(inn.allBatters)) {
        batters = inn.allBatters;
      } else if (inn.allBatters && typeof inn.allBatters === 'object') {
        batters = Object.values(inn.allBatters);
      } else if (Array.isArray(inn.batsmen)) {
        batters = inn.batsmen;
      } else if (Array.isArray(inn.batters)) {
        batters = inn.batters;
      } else {
        batters = [inn.striker, inn.nonStriker].filter(Boolean);
      }

      batters.forEach(b => {
        if (!b) return;
        const name = String(b.name || b.playerName || '').trim();
        if (!name) return;

        const runs = Number(b.runs || 0);
        const balls = Number(b.balls || b.ballsFaced || 0);
        const fours = Number(b.fours || b.foursCount || b['4s'] || 0);
        const sixes = Number(b.sixes || b.sixesCount || b['6s'] || 0);
        const isOut = Boolean(b.isOut || (b.dismissal && !String(b.dismissal).toLowerCase().includes('not out') && !String(b.dismissal).toLowerCase().includes('did not')));

        totalSixes += sixes;
        totalFours += fours;

        const current = battingMap.get(name) || {
          name,
          team: b.team || battingTeamName || getTeamForPlayer(name, teams),
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          innings: 0,
          outs: 0,
          highestScore: 0,
          highestScoreNotOut: false
        };

        current.runs += runs;
        current.balls += balls;
        current.fours += fours;
        current.sixes += sixes;
        current.innings += (balls > 0 || isOut) ? 1 : 0;
        if (isOut) current.outs += 1;

        if (runs > current.highestScore || (runs === current.highestScore && !isOut)) {
          current.highestScore = runs;
          current.highestScoreNotOut = !isOut;
        }

        battingMap.set(name, current);
      });

      // --- Bowling extraction (checks bowlers, bowling, allBowlers, bowler) ---
      let bowlers = [];
      if (Array.isArray(inn.bowlers)) {
        bowlers = inn.bowlers;
      } else if (Array.isArray(inn.bowling)) {
        bowlers = inn.bowling;
      } else if (Array.isArray(inn.allBowlers)) {
        bowlers = inn.allBowlers;
      } else if (inn.allBowlers && typeof inn.allBowlers === 'object') {
        bowlers = Object.values(inn.allBowlers);
      } else if (inn.bowler) {
        bowlers = [inn.bowler];
      }

      bowlers.forEach(bw => {
        if (!bw) return;
        const name = String(bw.name || bw.playerName || '').trim();
        if (!name) return;

        const wickets = Number(bw.wickets || bw.wkts || bw.w || 0);
        const runsConceded = Number(bw.runs || bw.runsConceded || bw.rc || bw.r || 0);
        const dots = Number(bw.dots || bw.dotBalls || 0);
        const maidens = Number(bw.maidens || bw.m || 0);

        // Calculate legal balls
        let ballsBowled = 0;
        if (bw.balls != null) {
          ballsBowled = Number(bw.balls);
        } else if (bw.overs != null) {
          const ovStr = String(bw.overs);
          const [completedOv, ballRemainder] = ovStr.split('.');
          ballsBowled = (parseInt(completedOv || '0', 10) * 6) + parseInt(ballRemainder || '0', 10);
        }

        const current = bowlingMap.get(name) || {
          name,
          team: bw.team || bowlingTeamName || getTeamForPlayer(name, teams),
          wickets: 0,
          runsConceded: 0,
          ballsBowled: 0,
          dots: 0,
          maidens: 0,
          innings: 0,
          bestWickets: -1,
          bestRuns: 999
        };

        current.wickets += wickets;
        current.runsConceded += runsConceded;
        current.ballsBowled += ballsBowled;
        current.dots += dots;
        current.maidens += maidens;
        current.innings += ballsBowled > 0 ? 1 : 0;

        // Single innings best figures
        if (wickets > current.bestWickets || (wickets === current.bestWickets && runsConceded < current.bestRuns)) {
          current.bestWickets = wickets;
          current.bestRuns = runsConceded;
        }

        bowlingMap.set(name, current);
      });
    });

    // Also check direct team batting / bowling arrays on match
    ['team1', 'team2'].forEach(tKey => {
      const teamObj = raw[tKey] || m[tKey];
      if (!teamObj) return;

      const teamName = teamObj.name || '';
      if (Array.isArray(teamObj.batting)) {
        teamObj.batting.forEach(b => {
          if (!b?.name) return;
          const name = String(b.name).trim();
          const runs = Number(b.runs || 0);
          const balls = Number(b.balls || 0);
          const fours = Number(b.fours || b['4s'] || 0);
          const sixes = Number(b.sixes || b['6s'] || 0);
          const isOut = Boolean(b.isOut || (b.dismissal && !String(b.dismissal).toLowerCase().includes('not out')));

          if (!battingMap.has(name)) {
            totalSixes += sixes;
            totalFours += fours;
            battingMap.set(name, {
              name,
              team: teamName || getTeamForPlayer(name, teams),
              runs,
              balls,
              fours,
              sixes,
              innings: 1,
              outs: isOut ? 1 : 0,
              highestScore: runs,
              highestScoreNotOut: !isOut
            });
          }
        });
      }

      if (Array.isArray(teamObj.bowling)) {
        teamObj.bowling.forEach(bw => {
          if (!bw?.name) return;
          const name = String(bw.name).trim();
          const wickets = Number(bw.wickets || bw.wkts || 0);
          const runsConceded = Number(bw.runs || bw.runsConceded || 0);

          let ballsBowled = 0;
          if (bw.overs != null) {
            const [ov, bRem] = String(bw.overs).split('.');
            ballsBowled = (parseInt(ov || '0', 10) * 6) + parseInt(bRem || '0', 10);
          }

          if (!bowlingMap.has(name)) {
            bowlingMap.set(name, {
              name,
              team: teamName || getTeamForPlayer(name, teams),
              wickets,
              runsConceded,
              ballsBowled,
              dots: Number(bw.dots || 0),
              maidens: Number(bw.maidens || 0),
              innings: 1,
              bestWickets: wickets,
              bestRuns: runsConceded
            });
          }
        });
      }
    });
  });

  // 2. If no matches have been played with scorecard data, return clean unplayed empty stats
  const hasMatchesPlayed = battingMap.size > 0 || bowlingMap.size > 0;
  if (!hasMatchesPlayed) {
    return getEmptyStats();
  }

  // Convert to arrays and format metrics
  const allBatters = Array.from(battingMap.values()).map(b => {
    const strikeRate = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(2) : '0.00';
    const average = b.outs > 0 ? (b.runs / b.outs).toFixed(2) : (b.runs > 0 ? String(b.runs) : '-');
    return {
      ...b,
      strikeRate,
      average,
      highestScoreText: b.highestScore > 0 ? `${b.highestScore}${b.highestScoreNotOut ? '*' : ''}` : '-'
    };
  });

  const allBowlers = Array.from(bowlingMap.values()).map(bw => {
    const oversBowled = bw.ballsBowled > 0 ? `${Math.floor(bw.ballsBowled / 6)}.${bw.ballsBowled % 6}` : '0.0';
    const oversFloat = bw.ballsBowled > 0 ? (Math.floor(bw.ballsBowled / 6) + (bw.ballsBowled % 6) / 6) : 0;
    const economy = oversFloat > 0 ? (bw.runsConceded / oversFloat).toFixed(2) : '0.00';
    const bestFigureText = bw.bestWickets >= 0 ? `${bw.bestRuns}-${bw.bestWickets}` : '-';

    return {
      ...bw,
      oversBowled,
      economy,
      bestFigureText
    };
  });

  // Sort Batting Leaders
  const mostRunsList = [...allBatters].sort((a, b) => b.runs - a.runs || parseFloat(b.strikeRate) - parseFloat(a.strikeRate));
  const bestStrikeRateList = [...allBatters]
    .filter(b => b.balls >= 1 || b.runs > 0)
    .sort((a, b) => parseFloat(b.strikeRate) - parseFloat(a.strikeRate) || b.runs - a.runs);
  const highestScoreList = [...allBatters].sort((a, b) => b.highestScore - a.highestScore || b.runs - a.runs);
  const mostSixesList = [...allBatters].sort((a, b) => b.sixes - a.sixes || b.runs - a.runs);
  const mostFoursList = [...allBatters].sort((a, b) => b.fours - a.fours || b.runs - a.runs);

  // Sort Bowling Leaders
  const mostWicketsList = [...allBowlers].sort((a, b) => b.wickets - a.wickets || parseFloat(a.economy) - parseFloat(b.economy));
  const bestFiguresList = [...allBowlers].sort((a, b) => b.bestWickets - a.bestWickets || a.bestRuns - b.bestRuns);
  const bestEconomyList = [...allBowlers]
    .filter(bw => bw.ballsBowled >= 6 || bw.wickets > 0)
    .sort((a, b) => parseFloat(a.economy) - parseFloat(b.economy) || b.wickets - a.wickets);
  const mostDotsList = [...allBowlers].sort((a, b) => b.dots - a.dots || b.wickets - a.wickets);

  // Pick top leaders
  const topBatter = mostRunsList[0] || { name: '-', team: '', runs: 0, strikeRate: '0.00' };
  const topStrikeRate = bestStrikeRateList[0] || topBatter;
  const topHighestScore = highestScoreList[0] || topBatter;
  const topSixes = mostSixesList[0] || topBatter;
  const topFours = mostFoursList[0] || topBatter;

  const topBowler = mostWicketsList[0] || { name: '-', team: '', wickets: 0, economy: '0.00', bestFigureText: '-' };
  const topBestFigures = bestFiguresList[0] || topBowler;
  const topEconomy = bestEconomyList[0] || topBowler;
  const topDots = mostDotsList[0] || topBowler;

  return {
    hasMatchesPlayed: true,
    hasData: true,
    totalSixes: Math.max(totalSixes, topSixes.sixes || 0),
    totalFours: Math.max(totalFours, topFours.fours || 0),
    batting: {
      mostRuns: {
        player: topBatter.name,
        team: topBatter.team,
        value: topBatter.runs > 0 ? String(topBatter.runs) : '-',
        runs: topBatter.runs,
        strikeRate: topBatter.strikeRate,
        raw: topBatter
      },
      bestStrikeRate: {
        player: topStrikeRate.name,
        team: topStrikeRate.team,
        value: parseFloat(topStrikeRate.strikeRate) > 0 ? String(topStrikeRate.strikeRate) : '-',
        strikeRate: topStrikeRate.strikeRate,
        raw: topStrikeRate
      },
      highestScore: {
        player: topHighestScore.name,
        team: topHighestScore.team,
        value: topHighestScore.highestScore > 0 ? String(topHighestScore.highestScore) : '-',
        text: topHighestScore.highestScoreText,
        raw: topHighestScore
      },
      mostSixes: {
        player: topSixes.name,
        team: topSixes.team,
        value: topSixes.sixes > 0 ? String(topSixes.sixes) : '-',
        sixes: topSixes.sixes,
        raw: topSixes
      },
      mostFours: {
        player: topFours.name,
        team: topFours.team,
        value: topFours.fours > 0 ? String(topFours.fours) : '-',
        fours: topFours.fours,
        raw: topFours
      }
    },
    bowling: {
      mostWickets: {
        player: topBowler.name,
        team: topBowler.team,
        value: topBowler.wickets > 0 ? String(topBowler.wickets) : '-',
        wickets: topBowler.wickets,
        economy: topBowler.economy,
        raw: topBowler
      },
      bestFigures: {
        player: topBestFigures.name,
        team: topBestFigures.team,
        value: topBestFigures.bestWickets > 0 ? topBestFigures.bestFigureText : '-',
        raw: topBestFigures
      },
      bestEconomy: {
        player: topEconomy.name,
        team: topEconomy.team,
        value: topEconomy.wickets > 0 || topEconomy.ballsBowled > 0 ? topEconomy.economy : '-',
        raw: topEconomy
      },
      mostDotBalls: {
        player: topDots.name,
        team: topDots.team,
        value: topDots.dots > 0 ? String(topDots.dots) : '-',
        raw: topDots
      }
    },
    allBatters: mostRunsList,
    allBowlers: mostWicketsList
  };
}

function getTeamForPlayer(playerName, teams = []) {
  if (!playerName || teams.length === 0) return '';
  const norm = playerName.trim().toLowerCase();
  for (const t of teams) {
    const players = Array.isArray(t.players) ? t.players : (Array.isArray(t.squad) ? t.squad : []);
    const found = players.some(p => {
      const pName = typeof p === 'string' ? p : p.name;
      return String(pName || '').trim().toLowerCase() === norm;
    });
    if (found) return t.name || t.shortName || '';
  }
  return teams[0]?.name || '';
}

function getEmptyStats() {
  return {
    hasMatchesPlayed: false,
    hasData: false,
    totalSixes: 0,
    totalFours: 0,
    batting: {
      mostRuns: { player: '-', team: '', value: '-' },
      bestStrikeRate: { player: '-', team: '', value: '-' },
      highestScore: { player: '-', team: '', value: '-' },
      mostSixes: { player: '-', team: '', value: '-' },
      mostFours: { player: '-', team: '', value: '-' }
    },
    bowling: {
      mostWickets: { player: '-', team: '', value: '-' },
      bestFigures: { player: '-', team: '', value: '-' },
      bestEconomy: { player: '-', team: '', value: '-' },
      mostDotBalls: { player: '-', team: '', value: '-' }
    },
    allBatters: [],
    allBowlers: []
  };
}
