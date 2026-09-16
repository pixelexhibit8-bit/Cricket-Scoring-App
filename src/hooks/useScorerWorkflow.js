import React, { useState, useEffect, useMemo } from 'react';
import { generateUUID } from '../services/supabaseClient.js';
import { getCurrentUser } from '../services/authService.js';
import { syncMatchToSupabase } from '../services/matchService.js';
import { showToast } from '../services/toastService.js';
import {
  syncFinishedMatchToTournament,
  syncLiveMatchToTournament
} from '../services/tournamentService.js';
import {
  markMatchAsCreatedByMe,
  getMyCreatedMatchIds,
  isUserMatchCreator
} from '../services/matchOwnership.js';
import {
  DEFAULT_UMPIRE_NAME,
  makeTeamCode,
  makeInning,
  makeBowlingFigure,
  buildFinishedMatch,
  getSearchBlob,
  getCleanPlayerNames
} from '../utils/cricketUtils.js';

export function useScorerWorkflow({
  activeMatch,
  setActiveMatch,
  setLiveMatches,
  liveMatches = [],
  finishedArchive = [],
  setFinishedArchive,
  selectedMatch,
  setSelectedMatch,
  currentScreen,
  setCurrentScreen,
  setBottomNavTab,
  searchQuery = '',
  localPlayersList = [],
  playerPool = []
}) {
  const [isScorerUnlocked, setIsScorerUnlocked] = useState(false);
  const [scorerPinModalVisible, setScorerPinModalVisible] = useState(false);
  const [matchCompleteModalVisible, setMatchCompleteModalVisible] = useState(false);
  const [rematchSetup, setRematchSetup] = useState(null);

  // Auto-open Match Complete modal when match phase is result
  useEffect(() => {
    if (activeMatch && (activeMatch.phase === 'result' || activeMatch.resultText) && currentScreen === 'scorerWizard') {
      setMatchCompleteModalVisible(true);
    }
  }, [activeMatch?.phase, activeMatch?.resultText, currentScreen]);

  // ── Scorer Access Lock Enforcement ──
  const openScorerScreen = async (matchToScore = null) => {
    const user = await getCurrentUser();
    if (!user) {
      showToast('Please login from Profile to start a ground match', 'error', 'Login Required');
      if (setBottomNavTab) setBottomNavTab('profile');
      if (setCurrentScreen) setCurrentScreen('home');
      return;
    }

    const target = matchToScore || activeMatch;
    const isLive = target && (target.phase === 'playing' || target.phase === 'inningBreak' || (!target.phase && target.innings?.length > 0));

    if (isLive) {
      const myCreatedIds = await getMyCreatedMatchIds();
      const isCreator = isUserMatchCreator(target, user, myCreatedIds);
      if (!isCreator) {
        showToast('Only the match creator has scoring access for this match.', 'warning', 'Scorer Access Restricted');
        return;
      }
      if (setActiveMatch) setActiveMatch(target);
      setIsScorerUnlocked(true);
      setScorerPinModalVisible(false);
      if (setCurrentScreen) setCurrentScreen('scorerWizard');
    } else {
      handleStartNewMatchSetup();
    }
  };

  const handleScorerPinSuccess = () => {
    setIsScorerUnlocked(true);
    setScorerPinModalVisible(false);
    if (setCurrentScreen) setCurrentScreen('scorerWizard');
  };

  const handleStartNewMatchSetup = () => {
    if (activeMatch && (activeMatch.innings?.[0]?.totalLegalBalls || 0) > 0) {
      const finishedSnapshot = buildFinishedMatch(activeMatch);
      if (finishedSnapshot && setFinishedArchive) {
        setFinishedArchive(prev => [finishedSnapshot, ...(prev || [])]);
      }
    }
    if (setActiveMatch) setActiveMatch(null);
    setIsScorerUnlocked(true);
    setScorerPinModalVisible(false);
    if (setCurrentScreen) setCurrentScreen('quickMatchSetup');
  };

  const handleStartQuickMatch = (config) => {
    const {
      tournamentId,
      tournamentMatchId,
      tournamentName,
      team1Name: t1,
      team2Name: t2,
      team1LogoKey: lk1,
      team2LogoKey: lk2,
      team1Roster: r1 = [],
      team2Roster: r2 = [],
      ballType: bType,
      totalOvers: oversNum,
      pitchType: pType,
      umpireName: uName,
      venueName: vName,
      tossWinner: winner,
      tossDecision: decision,
      striker,
      nonStriker,
      bowler
    } = config;

    let bat1 = winner === t1 ? (decision === 'BAT' ? t1 : t2) : (decision === 'BAT' ? t2 : t1);
    let bowl1 = bat1 === t1 ? t2 : t1;
    const team1Logo = lk1 || t1.toLowerCase();
    const team2Logo = lk2 || t2.toLowerCase();
    const inn1BatLogo = bat1 === t1 ? team1Logo : team2Logo;
    const inn1BowlLogo = bowl1 === t1 ? team1Logo : team2Logo;

    const inn1 = makeInning(bat1, bowl1);
    inn1.battingTeam.logoKey = inn1BatLogo;
    inn1.bowlingTeam.logoKey = inn1BowlLogo;
    inn1.striker = { name: striker, runs: 0, balls: 0, fours: 0, sixes: 0, dismissal: 'Not out', isOut: false };
    inn1.nonStriker = { name: nonStriker || '', runs: 0, balls: 0, fours: 0, sixes: 0, dismissal: 'Not out', isOut: false };
    inn1.row1Name = striker;
    inn1.bowler = { name: bowler, runs: 0, wickets: 0, overs: '0.0' };
    inn1.bowlingStats = { [bowler]: makeBowlingFigure({ name: bowler }) };
    inn1.battingStats = {
      [striker]: { name: striker, runs: 0, balls: 0, fours: 0, sixes: 0, dismissal: 'Not out', isOut: false },
      ...(nonStriker ? { [nonStriker]: { name: nonStriker, runs: 0, balls: 0, fours: 0, sixes: 0, dismissal: 'Not out', isOut: false } } : {})
    };

    const matchUUID = generateUUID();
    const autoMatchCode = 'CF-' + Math.floor(1000 + Math.random() * 9000).toString();
    getCurrentUser().then(user => {
      const creatorId = user?.id || 'local_scorer';
      const creatorName = user?.name || 'Local Scorer';
      markMatchAsCreatedByMe(matchUUID);
      const newMatch = {
        id: matchUUID,
        supabaseId: matchUUID,
        creatorId,
        creatorName,
        tournamentId: tournamentId || null,
        tournamentMatchId: tournamentMatchId || null,
        tournamentName: tournamentName || null,
        _isLocalCreator: true,
        matchCode: autoMatchCode,
        matchTitle: `${t1} vs ${t2}`,
        maxOvers: oversNum,
        venue: vName || 'Local Ground',
        ballType: bType || 'tennis',
        pitchType: pType || 'turf',
        phase: 'playing',
        inning: 1,
        currentInningIndex: 0,
        startedAt: new Date().toISOString(),
        tossWinner: winner,
        tossDecision: decision,
        tossResult: `${winner} won the toss and elected to ${decision}`,
        tossChoice: decision,
        umpireName: uName || DEFAULT_UMPIRE_NAME,
        scorerPin: config.scorerPin || autoMatchCode,
        team1: { name: t1, code: makeTeamCode(t1), logoKey: team1Logo },
        team2: { name: t2, code: makeTeamCode(t2), logoKey: team2Logo },
        teams: [
          { name: t1, code: makeTeamCode(t1), logoKey: team1Logo },
          { name: t2, code: makeTeamCode(t2), logoKey: team2Logo }
        ],
        playingXI: {
          [t1]: r1,
          [t2]: r2
        },
        innings: [inn1]
      };

      if (setActiveMatch) setActiveMatch(newMatch);
      syncMatchToSupabase(newMatch).catch(() => {});
      if (tournamentId) {
        syncLiveMatchToTournament(tournamentId, newMatch).catch(() => {});
      }
      if (setLiveMatches) {
        setLiveMatches(prev => {
          const filtered = (prev || []).filter(m => {
            if (!m) return false;
            if (m.id === newMatch.id || m.supabaseId === newMatch.id) return false;
            if (tournamentId && m.tournamentId && String(m.tournamentId) === String(tournamentId)) {
              if (tournamentMatchId && m.tournamentMatchId && String(m.tournamentMatchId) === String(tournamentMatchId)) return false;
              const mT1 = String(m.team1?.name || m.teams?.[0]?.name || '').trim().toLowerCase();
              const mT2 = String(m.team2?.name || m.teams?.[1]?.name || '').trim().toLowerCase();
              const nT1 = String(t1).trim().toLowerCase();
              const nT2 = String(t2).trim().toLowerCase();
              if ((mT1 === nT1 && mT2 === nT2) || (mT1 === nT2 && mT2 === nT1)) return false;
            }
            return true;
          });
          return [newMatch, ...filtered];
        });
      }
      setIsScorerUnlocked(true);
      if (setCurrentScreen) setCurrentScreen('scorerWizard');
    });
  };

  const handleRematch = (matchToRematch) => {
    const target = matchToRematch || (activeMatch && (activeMatch.phase === 'result' || activeMatch.resultText) ? buildFinishedMatch(activeMatch) : null) || selectedMatch || finishedArchive[0];
    if (!target) return;

    const t1 = target.team1?.name || target.teams?.[0]?.name || 'Team 1';
    const t2 = target.team2?.name || target.teams?.[1]?.name || 'Team 2';
    const r1 = target.sourceMatch?.playingXI?.[t1] || target.playingXI?.[t1] || (target.team1?.batting || []).map(p => p.name).filter(Boolean) || [];
    const r2 = target.sourceMatch?.playingXI?.[t2] || target.playingXI?.[t2] || (target.team2?.batting || []).map(p => p.name).filter(Boolean) || [];

    const finishedSnapshot = target.sourceMatch ? target : buildFinishedMatch(target, {
      [t1]: r1,
      [t2]: r2
    });
    if (finishedSnapshot && (finishedSnapshot.title || finishedSnapshot.id)) {
      if (setFinishedArchive) {
        setFinishedArchive(prev => {
          const filtered = (prev || []).filter(m => (m.id !== finishedSnapshot.id && m.title !== finishedSnapshot.title));
          return [finishedSnapshot, ...filtered];
        });
      }
      if (setSelectedMatch) setSelectedMatch(finishedSnapshot);
    }

    setRematchSetup({
      team1Name: t1,
      team2Name: t2,
      team1Roster: r1,
      team2Roster: r2,
      totalOvers: target.maxOvers || 5,
      ballType: target.ballType || 'tennis',
      pitchType: target.pitchType || 'turf',
      umpireName: target.umpireName || DEFAULT_UMPIRE_NAME,
      startAtStep: 2
    });
    if (setCurrentScreen) setCurrentScreen('quickMatchSetup');
  };

  // ── Match List Filtering ──
  const searchNeedle = (searchQuery || '').trim().toLowerCase();
  const isDummyTeamName = (n) => !n || n === 'Team 1' || n === 'Team 2' || n === 'TM' || n === 'Team A' || n === 'Team B';

  const filterLiveMatch = (m) => {
    if (!m || m.phase === 'result' || m.phase === 'finished' || m.phase === 'completed' || m.isCompleted) return false;
    if (m.resultText || m.result || m.winner || m.winnerTeamName) return false;
    const t1Name = m.teams?.[0]?.name || m.team1?.name || m.innings?.[0]?.battingTeam?.name || m.inn1BattingTeam;
    const t2Name = m.teams?.[1]?.name || m.team2?.name || m.innings?.[0]?.bowlingTeam?.name || m.inn1BowlingTeam;
    if (isDummyTeamName(t1Name) || isDummyTeamName(t2Name)) return false;
    if (searchNeedle && !getSearchBlob(m).includes(searchNeedle)) return false;
    return true;
  };

  const visibleLiveMatches = useMemo(() => {
    const rawList = Array.isArray(liveMatches) ? [...liveMatches] : [];
    if (activeMatch && filterLiveMatch(activeMatch)) {
      const exists = rawList.some(m =>
        (m.id && m.id === activeMatch.id) ||
        (m.supabaseId && m.supabaseId === activeMatch.supabaseId) ||
        (m.tournamentId && activeMatch.tournamentId && String(m.tournamentId) === String(activeMatch.tournamentId) && (
          (m.tournamentMatchId && activeMatch.tournamentMatchId && String(m.tournamentMatchId) === String(activeMatch.tournamentMatchId)) ||
          (m.team1?.name && activeMatch.team1?.name && m.team2?.name && activeMatch.team2?.name &&
            String(m.team1.name).toLowerCase() === String(activeMatch.team1.name).toLowerCase() &&
            String(m.team2.name).toLowerCase() === String(activeMatch.team2.name).toLowerCase())
        ))
      );
      if (!exists) rawList.unshift(activeMatch);
    }

    const seen = new Set();
    const uniqueList = [];
    for (const m of rawList) {
      if (!filterLiveMatch(m)) continue;
      const idKey = m.id || m.supabaseId;
      const t1Norm = String(m.team1?.name || m.teams?.[0]?.name || '').trim().toLowerCase();
      const t2Norm = String(m.team2?.name || m.teams?.[1]?.name || '').trim().toLowerCase();
      const pairKey = (t1Norm && t2Norm) ? `${m.tournamentId || 'local'}_${[t1Norm, t2Norm].sort().join('_vs_')}` : null;

      if (idKey && seen.has(idKey)) continue;
      if (pairKey && seen.has(pairKey)) continue;

      if (idKey) seen.add(idKey);
      if (pairKey) seen.add(pairKey);
      uniqueList.push(m);
    }
    return uniqueList;
  }, [liveMatches, activeMatch, searchNeedle]);

  const activeMatchVisible = visibleLiveMatches.length > 0;

  const finishedMatches = Array.isArray(finishedArchive) ? finishedArchive : [];
  const visibleFinishedMatches = (searchNeedle
    ? finishedMatches.filter(match => getSearchBlob(match).includes(searchNeedle))
    : finishedMatches)
    .filter(m => Boolean(m && (m.team1?.name || m.teams?.[0]?.name)))
    .sort((a, b) => {
      const timeA = new Date(a.completedAt || a.dateText || 0).getTime();
      const timeB = new Date(b.completedAt || b.dateText || 0).getTime();
      return timeB - timeA;
    });

  const recentFinishedMatches = visibleFinishedMatches.slice(0, 3);
  const localPlayerNames = (localPlayersList || []).map(p => p && p.name).filter(Boolean);
  const setupPlayerNames = getCleanPlayerNames([...localPlayerNames, ...playerPool]);

  const getSetupPlayerProfile = (playerName) => {
    if (!playerName) return null;
    const cleanName = String(playerName).trim().toLowerCase();

    const local = localPlayersList.find(p => p && p.name && p.name.trim().toLowerCase() === cleanName);
    if (local) {
      return {
        name: local.name,
        avatar: local.photoUrl || local.photo_url || local.avatar || null,
        role: local.role || 'Player'
      };
    }

    return null;
  };

  return {
    isScorerUnlocked,
    setIsScorerUnlocked,
    scorerPinModalVisible,
    setScorerPinModalVisible,
    matchCompleteModalVisible,
    setMatchCompleteModalVisible,
    rematchSetup,
    setRematchSetup,
    openScorerScreen,
    handleScorerPinSuccess,
    handleStartNewMatchSetup,
    handleStartQuickMatch,
    handleRematch,
    visibleLiveMatches,
    activeMatchVisible,
    visibleFinishedMatches,
    recentFinishedMatches,
    setupPlayerNames,
    getSetupPlayerProfile
  };
}

export default useScorerWorkflow;
