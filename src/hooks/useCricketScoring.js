import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as Speech from 'expo-speech';
import {
  makeInning,
  makeBowlingFigure,
  makeLastDelivery,
  normalizeBowlingFigure,
  formatOvers,
  sumDeliveryTokens,
  getTokenBowlerRuns,
  countLegalTokens,
  countWicketTokens,
  getBowlerFigureFromInning,
  speakBall
} from '../utils/cricketUtils.js';

export function useCricketScoring({
  activeMatch,
  setActiveMatch,
  getRosterForTeam,
  getBattingRoster,
  getBowlingRoster
}) {
  // History Stacks for UNDO & REDO
  const [matchHistoryStack, setMatchHistoryStack] = useState([]);
  const [matchRedoStack, setMatchRedoStack] = useState([]);

  // Wicket & Dismissal States
  const [wicketPending, setWicketPending] = useState(false);
  const [wicketEntryPending, setWicketEntryPending] = useState(false);
  const [newBatsmanName, setNewBatsmanName] = useState('');
  const [pendingFielderDismissal, setPendingFielderDismissal] = useState('');
  const [runOutPending, setRunOutPending] = useState(false);
  const [runOutDismissed, setRunOutDismissed] = useState('');
  const [runOutEnd, setRunOutEnd] = useState('');
  const [runOutRuns, setRunOutRuns] = useState(0);

  // Bowler Change States
  const [bowlerChangePending, setBowlerChangePending] = useState(false);
  const [nextBowlerName, setNextBowlerName] = useState('');

  // Inning 2 Opener States
  const [inn2Striker, setInn2Striker] = useState('');
  const [inn2NonStriker, setInn2NonStriker] = useState('');
  const [inn2Bowler, setInn2Bowler] = useState('');

  // Inning End Evaluation
  const checkInningEnd = useCallback((inn, maxOv, maxWk) => {
    const oversUp = inn.totalLegalBalls >= maxOv * 6;
    const allOut = inn.battingTeam.wickets >= maxWk;
    return oversUp || allOut;
  }, []);

  // Record a Delivery (Runs, Wides, No-Balls, Wickets, Byes, Leg Byes, Penalty)
  const handleRecordBall = useCallback((runs, extraType = null, isWicket = false, byeType = null, wicketDetails = null) => {
    if (!activeMatch || activeMatch.phase !== 'playing') return;

    // Push snapshot to history stack for UNDO & reset REDO
    const historySnapshot = JSON.parse(JSON.stringify(activeMatch));
    delete historySnapshot.pendingPublicEvent;
    setMatchHistoryStack(prevStack => [...prevStack.slice(-20), historySnapshot]);
    setMatchRedoStack([]);

    // Voice announcement
    try { speakBall(runs, extraType, isWicket); } catch (e) { }

    let overJustCompleted = false;

    setActiveMatch(prev => {
      if (!prev) return prev;
      const innings = prev.innings.map(x => ({ ...x }));
      const inn = { ...innings[prev.inning - 1] };
      innings[prev.inning - 1] = inn;

      let addedRuns = runs;
      let ballLabel = String(runs);
      let isLegal = true;
      const isRunOut = isWicket && wicketDetails?.type === 'runOut';
      const bowlerName = inn.bowler?.name || 'Bowler';
      const dismissedEndKey = isRunOut && wicketDetails?.dismissed === 'nonStriker' ? 'nonStriker' : 'striker';
      const dismissedOriginal = inn[dismissedEndKey];
      const dismissedName = dismissedOriginal?.name;
      const dismissalText = wicketDetails?.dismissalText || (isRunOut
        ? `run out (${wicketDetails.end === 'striker' ? 'striker end' : 'non-striker end'})`
        : `b ${bowlerName}`);
      const bowlerGetsWicket = isWicket && wicketDetails?.bowlerCredited !== false;
      const partnershipPlayerNames = [inn.striker?.name, inn.nonStriker?.name].filter(Boolean);

      if (extraType === 'wd') { addedRuns += 1; ballLabel = runs > 0 ? `${runs}Wd` : 'Wd'; isLegal = false; }
      else if (extraType === 'nb') { addedRuns += 1; ballLabel = runs > 0 ? `${runs}Nb` : 'Nb'; isLegal = false; }
      else if (byeType === 'b') { ballLabel = `${runs || 1}B`; }
      else if (byeType === 'lb') { ballLabel = `${runs || 1}LB`; }
      else if (byeType === 'penalty') { addedRuns = 5; ballLabel = '5Pen'; isLegal = false; }
      if (isWicket) { ballLabel = isRunOut && runs > 0 ? `${runs}W` : 'W'; addedRuns = runs; }

      inn.lastDelivery = {
        ...makeLastDelivery({
          ballLabel,
          runs,
          addedRuns,
          extraType,
          byeType,
          isWicket
        }),
        detail: isWicket ? `${dismissedName || 'Batter'} - ${dismissalText}` : ''
      };

      // Team runs & wickets
      inn.battingTeam = { ...inn.battingTeam, runs: inn.battingTeam.runs + addedRuns };
      if (isWicket) {
        inn.battingTeam = { ...inn.battingTeam, wickets: inn.battingTeam.wickets + 1 };
        if (dismissedName && !(inn.dismissedPlayers || []).includes(dismissedName)) {
          inn.dismissedPlayers = [...(inn.dismissedPlayers || []), dismissedName];
        }
      }

      // Legal balls count -> overs
      const newLegalBalls = inn.totalLegalBalls + (isLegal ? 1 : 0);
      inn.totalLegalBalls = newLegalBalls;
      const ballsThisOver = newLegalBalls % 6;
      const overComplete = isLegal && ballsThisOver === 0 && newLegalBalls > 0;
      if (overComplete) overJustCompleted = true;

      // Bowler figures
      const bowlerRunsScored = (byeType === 'b' || byeType === 'lb' || byeType === 'penalty') ? 0 : addedRuns;
      const previousBowlerFigure = normalizeBowlingFigure(
        (inn.bowlingStats || {})[bowlerName] || { ...inn.bowler, balls: inn.bowlerLegalBalls },
        bowlerName
      );
      const updatedBowlerFigure = makeBowlingFigure({
        name: bowlerName,
        balls: previousBowlerFigure.balls + (isLegal ? 1 : 0),
        runs: previousBowlerFigure.runs + bowlerRunsScored,
        wickets: previousBowlerFigure.wickets + (bowlerGetsWicket ? 1 : 0)
      });
      inn.bowlingStats = { ...(inn.bowlingStats || {}), [bowlerName]: updatedBowlerFigure };
      inn.bowlerLegalBalls = updatedBowlerFigure.balls;
      inn.bowler = {
        name: bowlerName,
        runs: updatedBowlerFigure.runs,
        wickets: updatedBowlerFigure.wickets,
        overs: updatedBowlerFigure.overs
      };

      // Striker stats
      const batsmanRuns = extraType === 'nb' ? runs : (extraType || byeType) ? 0 : runs;
      const newStriker = {
        ...inn.striker,
        runs: inn.striker.runs + batsmanRuns,
        balls: inn.striker.balls + (isLegal ? 1 : 0),
        fours: inn.striker.fours + (runs === 4 && !extraType && !byeType ? 1 : 0),
        sixes: inn.striker.sixes + (runs === 6 && !extraType && !byeType ? 1 : 0),
      };
      const crossedFifty = inn.striker.runs < 50 && newStriker.runs >= 50;
      const updatedNonStriker = (inn.nonStriker && inn.nonStriker.name)
        ? { ...inn.nonStriker }
        : ((inn.allBatters || []).find(b => !b.isOut && b.name !== newStriker.name) || { name: 'Non-Striker', runs: 0, balls: 0 });
      const dismissedPlayer = dismissedEndKey === 'nonStriker' ? updatedNonStriker : newStriker;
      const nextPartnershipRuns = (inn.partnershipRuns || 0) + addedRuns;
      const nextPartnershipBalls = (inn.partnershipBalls || 0) + (isLegal ? 1 : 0);
      const nextPartnershipContributions = { ...(inn.partnershipContributions || {}) };

      partnershipPlayerNames.forEach(name => {
        nextPartnershipContributions[name] = {
          runs: nextPartnershipContributions[name]?.runs || 0,
          balls: nextPartnershipContributions[name]?.balls || 0
        };
      });
      if (newStriker?.name) {
        const strikerContribution = nextPartnershipContributions[newStriker.name] || { runs: 0, balls: 0 };
        nextPartnershipContributions[newStriker.name] = {
          runs: strikerContribution.runs + batsmanRuns,
          balls: strikerContribution.balls + (isLegal ? 1 : 0)
        };
      }

      if (isWicket) {
        inn.lastWicket = {
          name: dismissedPlayer?.name || 'Batter',
          runs: dismissedPlayer?.runs || 0,
          balls: dismissedPlayer?.balls || 0,
          teamScore: inn.battingTeam.runs,
          teamWickets: inn.battingTeam.wickets,
          over: formatOvers(newLegalBalls),
          dismissal: dismissalText
        };
        const firstPartner = partnershipPlayerNames[0] || dismissedPlayer?.name || '';
        const secondPartner = partnershipPlayerNames[1] || '';
        inn.partnershipHistory = [...(inn.partnershipHistory || []), {
          wicketNumber: inn.battingTeam.wickets,
          p1: firstPartner,
          r1: nextPartnershipContributions[firstPartner]?.runs || 0,
          b1: nextPartnershipContributions[firstPartner]?.balls || 0,
          p2: secondPartner,
          r2: nextPartnershipContributions[secondPartner]?.runs || 0,
          b2: nextPartnershipContributions[secondPartner]?.balls || 0,
          totalRuns: nextPartnershipRuns,
          totalBalls: nextPartnershipBalls,
          teamScore: inn.battingTeam.runs,
          over: formatOvers(newLegalBalls),
          dismissedName: dismissedPlayer?.name || '',
          status: 'out'
        }];
        inn.partnershipRuns = 0;
        inn.partnershipBalls = 0;
        inn.partnershipContributions = {};
      } else {
        inn.partnershipRuns = nextPartnershipRuns;
        inn.partnershipBalls = nextPartnershipBalls;
        inn.partnershipContributions = nextPartnershipContributions;
      }

      if (isWicket) inn.lastEvent = { type: 'wicket', label: 'Wicket' };
      else if (crossedFifty) inn.lastEvent = { type: 'fifty', label: 'Fifty' };
      else if (overComplete) inn.lastEvent = { type: 'over', label: 'Over' };
      else inn.lastEvent = null;

      const allBatters = (inn.allBatters?.length
        ? inn.allBatters
        : [inn.striker, inn.nonStriker].filter(player => player?.name)
      ).map(player => ({ ...player }));
      const strikerIndex = allBatters.findIndex(player => player.name === newStriker.name);
      const strikerRow = {
        ...newStriker,
        dismissal: isWicket && dismissedEndKey === 'striker' ? dismissalText : 'Not out',
        isOut: isWicket && dismissedEndKey === 'striker'
      };
      if (strikerIndex >= 0) allBatters[strikerIndex] = strikerRow;
      else allBatters.push(strikerRow);
      if (updatedNonStriker?.name) {
        const nonStrikerIndex = allBatters.findIndex(player => player.name === updatedNonStriker.name);
        const nonStrikerRow = {
          ...updatedNonStriker,
          dismissal: isWicket && dismissedEndKey === 'nonStriker' ? dismissalText : 'Not out',
          isOut: isWicket && dismissedEndKey === 'nonStriker'
        };
        if (nonStrikerIndex >= 0) allBatters[nonStrikerIndex] = nonStrikerRow;
        else allBatters.push(nonStrikerRow);
      }
      inn.allBatters = allBatters;

      if (isWicket) {
        let strikerEndPlayer = newStriker;
        let nonStrikerEndPlayer = updatedNonStriker;

        if (isRunOut) {
          const survivingPlayer = dismissedEndKey === 'striker' ? updatedNonStriker : newStriker;
          if (wicketDetails.end === 'striker') {
            strikerEndPlayer = dismissedPlayer;
            nonStrikerEndPlayer = survivingPlayer;
          } else {
            strikerEndPlayer = survivingPlayer;
            nonStrikerEndPlayer = dismissedPlayer;
          }
        }

        inn.striker = overComplete ? nonStrikerEndPlayer : strikerEndPlayer;
        inn.nonStriker = overComplete ? strikerEndPlayer : nonStrikerEndPlayer;
        inn.pendingBatterEnd = inn.striker?.name === dismissedName ? 'striker' : 'nonStriker';
      } else {
        const strikeRotationRuns = (byeType === 'b' || byeType === 'lb') ? (runs || 1) : runs;
        const oddRun = strikeRotationRuns % 2 === 1;
        const doSwap = (oddRun && !overComplete) || (!oddRun && overComplete);
        if (doSwap) {
          inn.striker = updatedNonStriker;
          inn.nonStriker = newStriker;
        } else {
          inn.striker = newStriker;
          inn.nonStriker = updatedNonStriker;
        }
      }

      // Save completed over to overHistory log & manage currentOverBalls timeline
      const prevWasOverComplete = inn.isOverComplete;
      const currentBallsBase = prevWasOverComplete ? [] : (inn.currentOverBalls || []);
      const currentOverBowlerWicketsBase = prevWasOverComplete ? 0 : (inn.currentOverBowlerWickets || 0);
      const newCurrentBalls = [...currentBallsBase, ballLabel];
      const newCurrentOverBowlerWickets = currentOverBowlerWicketsBase + (bowlerGetsWicket ? 1 : 0);

      if (overComplete) {
        const overRuns = sumDeliveryTokens(newCurrentBalls);
        const overBowlerRuns = sumDeliveryTokens(newCurrentBalls, getTokenBowlerRuns);
        const overLegalBalls = countLegalTokens(newCurrentBalls);
        const overWkts = countWicketTokens(newCurrentBalls);
        const overNum = Math.floor(newLegalBalls / 6);
        inn.overHistory = [...(inn.overHistory || []), {
          overNum,
          runs: overRuns,
          wickets: overWkts,
          legalBalls: overLegalBalls,
          bowlerRuns: overBowlerRuns,
          bowlerWickets: newCurrentOverBowlerWickets,
          bowlerName,
          balls: newCurrentBalls
        }];
        inn.currentOverBalls = newCurrentBalls;
        inn.currentOverBowlerWickets = newCurrentOverBowlerWickets;
        inn.isOverComplete = true;
      } else {
        inn.currentOverBalls = newCurrentBalls;
        inn.currentOverBowlerWickets = newCurrentOverBowlerWickets;
        inn.isOverComplete = false;
      }

      // Inning end check & result evaluation
      const roster = getRosterForTeam ? getRosterForTeam(inn.battingTeam.name, []) : [];
      const totalSquadPlayers = roster.length > 0
        ? roster.length
        : (inn.allBatters?.length > 1 ? inn.allBatters.length : 11);
      const mw = Math.max(1, totalSquadPlayers - 1);
      const innEnded = checkInningEnd(inn, prev.maxOvers, mw);
      const inn1Runs = Number(innings[0]?.battingTeam?.runs || 0);
      const effectiveTarget = prev.target || (inn1Runs + 1);
      const chaseCompleted = prev.inning === 2 && inn.battingTeam.runs >= effectiveTarget;

      if (chaseCompleted) {
        inn.status = 'complete';
        const wicketsLeft = Math.max(1, mw - inn.battingTeam.wickets);
        const resultText = `${inn.battingTeam.name} won by ${wicketsLeft} wicket${wicketsLeft !== 1 ? 's' : ''}!`;
        try { Speech.speak('Match over! ' + resultText, { language: 'en-IN' }); } catch (e) { }
        return { ...prev, innings, phase: 'result', winnerTeamName: inn.battingTeam.name, resultText, pendingPublicEvent: null };
      }

      if (innEnded && prev.inning === 1) {
        inn.status = 'complete';
        try { Speech.speak('Over! End of inning 1!', { language: 'en-IN' }); } catch (e) { }
        return { ...prev, innings, phase: 'inningBreak', target: inn.battingTeam.runs + 1, pendingPublicEvent: null };
      } else if (innEnded && prev.inning === 2) {
        inn.status = 'complete';
        const inn2Runs = Number(inn.battingTeam.runs || 0);
        let resultText = '';
        let winnerTeamName = null;
        if (inn2Runs >= effectiveTarget) {
          const wicketsLeft = Math.max(1, mw - inn.battingTeam.wickets);
          resultText = `${inn.battingTeam.name} won by ${wicketsLeft} wicket${wicketsLeft !== 1 ? 's' : ''}!`;
          winnerTeamName = inn.battingTeam.name;
        } else if (inn2Runs === inn1Runs) {
          resultText = 'Match tied!';
          winnerTeamName = null;
        } else {
          const diff = Math.max(1, inn1Runs - inn2Runs);
          const defTeam = innings[0]?.battingTeam?.name || 'Defending Team';
          resultText = `${defTeam} won by ${diff} run${diff !== 1 ? 's' : ''}!`;
          winnerTeamName = defTeam;
        }
        try { Speech.speak('Match over! ' + resultText, { language: 'en-IN' }); } catch (e) { }
        return { ...prev, innings, phase: 'result', winnerTeamName, resultText, pendingPublicEvent: null };
      }

      // Wicket fell - need new batsman
      if (isWicket && !innEnded) {
        return { ...prev, innings, _pendingWicket: true, _pendingNewBowler: overComplete, pendingPublicEvent: null };
      }

      // Over complete - need new bowler
      if (overComplete && !innEnded) {
        return { ...prev, innings, _pendingNewBowler: true, pendingPublicEvent: null };
      }

      return { ...prev, innings, pendingPublicEvent: null };
    });

    // Trigger wicket or bowler change modal
    setTimeout(() => {
      setActiveMatch(prev => {
        if (!prev) return prev;
        if (prev._pendingWicket) {
          setWicketPending(true);
          return { ...prev, _pendingWicket: false };
        }
        if (prev._pendingNewBowler) {
          setNextBowlerName('');
          setBowlerChangePending(true);
          return { ...prev, _pendingNewBowler: false };
        }
        return prev;
      });
    }, 80);
  }, [activeMatch, checkInningEnd, getRosterForTeam, setActiveMatch]);

  // Select New Batsman
  const selectNewBatsman = useCallback((name) => {
    const cleanName = name?.trim();
    if (!cleanName) return;
    const battingRoster = getBattingRoster ? getBattingRoster() : [];
    const bowlingRoster = getBowlingRoster ? getBowlingRoster() : [];
    if (!battingRoster.includes(cleanName) && bowlingRoster.includes(cleanName)) {
      Alert.alert('New Batter', `${cleanName} belongs to the fielding team.`);
      return;
    }
    const needsNewBowler = Boolean(activeMatch?._pendingNewBowler);
    setActiveMatch(prev => {
      if (!prev) return prev;
      const innings = prev.innings.map(x => ({ ...x }));
      const inn = { ...innings[prev.inning - 1] };
      const playingXI = { ...(prev.playingXI || {}) };
      const battingTeamName = inn.battingTeam.name;
      if (!playingXI[battingTeamName]?.includes(cleanName)) {
        playingXI[battingTeamName] = [...(playingXI[battingTeamName] || []), cleanName];
      }
      const newBatter = { name: cleanName, runs: 0, balls: 0, fours: 0, sixes: 0 };
      const batterEnd = inn.pendingBatterEnd || 'striker';
      inn[batterEnd] = newBatter;
      inn.pendingBatterEnd = null;
      if (!(inn.allBatters || []).some(player => player.name === cleanName)) {
        inn.allBatters = [...(inn.allBatters || []), { ...newBatter, dismissal: 'Not out', isOut: false }];
      }
      innings[prev.inning - 1] = inn;
      return { ...prev, innings, playingXI, _pendingNewBowler: false };
    });
    try { Speech.speak(`${cleanName} is coming in to bat`, { language: 'en-IN' }); } catch (e) { }
    setNewBatsmanName('');
    setWicketPending(false);
    if (needsNewBowler) {
      setNextBowlerName('');
      setBowlerChangePending(true);
    }
  }, [activeMatch, getBattingRoster, getBowlingRoster, setActiveMatch]);

  const handleNewBatsman = useCallback(() => {
    selectNewBatsman(newBatsmanName);
  }, [newBatsmanName, selectNewBatsman]);

  // Wicket Trigger & Handling
  const handleWicketPress = useCallback(() => {
    setPendingFielderDismissal('');
    setActiveMatch(prev => prev ? {
      ...prev,
      pendingPublicEvent: {
        token: 'W',
        label: 'WICKET',
        type: 'wicket',
        detail: ''
      }
    } : prev);
    setWicketEntryPending(true);
  }, [setActiveMatch]);

  const cancelWicketEntry = useCallback(() => {
    setPendingFielderDismissal('');
    setWicketEntryPending(false);
    setRunOutPending(false);
    setActiveMatch(prev => prev?.pendingPublicEvent?.type === 'wicket'
      ? { ...prev, pendingPublicEvent: null }
      : prev);
  }, [setActiveMatch]);

  const handleSelectWicketType = useCallback((type) => {
    const curInning = activeMatch?.innings?.[activeMatch.inning - 1];
    const bowlerName = curInning?.bowler?.name || 'Bowler';

    if (type === 'runOut') {
      setWicketEntryPending(false);
      setRunOutDismissed('');
      setRunOutEnd('');
      setRunOutRuns(0);
      setRunOutPending(true);
      return;
    }

    if (type === 'caught' || type === 'stumped') {
      setPendingFielderDismissal(type);
      return;
    }

    const dismissalText = {
      bowled: `b ${bowlerName}`,
      lbw: `lbw b ${bowlerName}`,
      hitWicket: `hit wicket b ${bowlerName}`
    }[type];

    setWicketEntryPending(false);
    handleRecordBall(0, null, true, null, {
      type,
      dismissed: 'striker',
      dismissalText,
      bowlerCredited: true
    });
  }, [activeMatch, handleRecordBall]);

  const handleSelectDismissalFielder = useCallback((fielderName) => {
    const curInning = activeMatch?.innings?.[activeMatch.inning - 1];
    const bowlerName = curInning?.bowler?.name || 'Bowler';
    const dismissalText = pendingFielderDismissal === 'caught'
      ? fielderName === bowlerName
        ? `c & b ${bowlerName}`
        : `c ${fielderName} b ${bowlerName}`
      : `st ${fielderName} b ${bowlerName}`;

    setWicketEntryPending(false);
    setPendingFielderDismissal('');
    handleRecordBall(0, null, true, null, {
      type: pendingFielderDismissal,
      dismissed: 'striker',
      dismissalText,
      bowlerCredited: true
    });
  }, [activeMatch, handleRecordBall, pendingFielderDismissal]);

  const handleConfirmRunOut = useCallback(() => {
    if (!runOutDismissed || !runOutEnd) return;
    setRunOutPending(false);
    handleRecordBall(runOutRuns, null, true, null, {
      type: 'runOut',
      dismissed: runOutDismissed,
      end: runOutEnd,
      bowlerCredited: false
    });
  }, [handleRecordBall, runOutDismissed, runOutEnd, runOutRuns]);

  // Bowler Change
  const handleNewBowler = useCallback((overrideName) => {
    const name = (typeof overrideName === 'string' && overrideName.trim())
      ? overrideName.trim()
      : nextBowlerName.trim();
    if (!name) return;
    const bowlingRoster = getBowlingRoster ? getBowlingRoster() : [];
    const battingRoster = getBattingRoster ? getBattingRoster() : [];
    if (!bowlingRoster.includes(name) && battingRoster.includes(name)) {
      Alert.alert('Change Bowler', `${name} belongs to the batting team.`);
      return;
    }
    const innBeforeChange = activeMatch?.innings?.[activeMatch.inning - 1];
    if ((innBeforeChange?.currentOverBalls || []).length > 0 && !innBeforeChange?.isOverComplete) {
      Alert.alert('Change Bowler', 'Normal bowler change is allowed only after the over is complete.');
      return;
    }
    setActiveMatch(prev => {
      if (!prev) return prev;
      const innings = prev.innings.map(x => ({ ...x }));
      const inn = { ...innings[prev.inning - 1] };
      if ((inn.currentOverBalls || []).length > 0 && !inn.isOverComplete) {
        Alert.alert('Change Bowler', 'Normal bowler change is allowed only after the over is complete.');
        return prev;
      }
      const playingXI = { ...(prev.playingXI || {}) };
      const bowlingTeamName = inn.bowlingTeam.name;
      if (!playingXI[bowlingTeamName]?.includes(name)) {
        playingXI[bowlingTeamName] = [...(playingXI[bowlingTeamName] || []), name];
      }

      const savedBowlerFigure = getBowlerFigureFromInning(inn, name);
      inn.bowlingStats = { ...(inn.bowlingStats || {}), [name]: savedBowlerFigure };
      inn.bowler = {
        name,
        runs: savedBowlerFigure.runs,
        wickets: savedBowlerFigure.wickets,
        overs: savedBowlerFigure.overs
      };
      inn.bowlerLegalBalls = savedBowlerFigure.balls;
      innings[prev.inning - 1] = inn;
      return { ...prev, innings, playingXI };
    });
    try { Speech.speak(`${name} will bowl the next over`, { language: 'en-IN' }); } catch (e) { }
    setNextBowlerName('');
    setBowlerChangePending(false);
  }, [activeMatch, getBattingRoster, getBowlingRoster, nextBowlerName, setActiveMatch]);

  // Retire Batsman
  const handleRetireBatsman = useCallback(() => {
    const curInning = activeMatch?.innings?.[activeMatch.inning - 1];
    const strikerName = curInning?.striker?.name;
    if (!activeMatch || !strikerName) return;
    setMatchHistoryStack(prevStack => [...prevStack.slice(-20), JSON.parse(JSON.stringify(activeMatch))]);
    setMatchRedoStack([]);
    setActiveMatch(prev => {
      if (!prev) return prev;
      const innings = prev.innings.map(x => ({ ...x }));
      const inn = { ...innings[prev.inning - 1] };
      const retiredPlayer = { ...inn.striker, dismissal: 'Retired hurt', isOut: true, retired: true };
      inn.dismissedPlayers = [...new Set([...(inn.dismissedPlayers || []), strikerName])];
      inn.allBatters = (inn.allBatters?.length ? inn.allBatters : [inn.striker, inn.nonStriker].filter(Boolean))
        .map(player => player.name === strikerName ? retiredPlayer : player);
      if (!inn.allBatters.some(player => player.name === strikerName)) inn.allBatters.push(retiredPlayer);
      inn.partnershipHistory = [...(inn.partnershipHistory || []), {
        wicketNumber: (inn.battingTeam.wickets || 0) + 1,
        p1: inn.striker?.name || '',
        r1: inn.partnershipContributions?.[inn.striker?.name]?.runs || 0,
        b1: inn.partnershipContributions?.[inn.striker?.name]?.balls || 0,
        p2: inn.nonStriker?.name || '',
        r2: inn.partnershipContributions?.[inn.nonStriker?.name]?.runs || 0,
        b2: inn.partnershipContributions?.[inn.nonStriker?.name]?.balls || 0,
        totalRuns: inn.partnershipRuns || 0,
        totalBalls: inn.partnershipBalls || 0,
        teamScore: inn.battingTeam.runs,
        over: formatOvers(inn.totalLegalBalls || 0),
        dismissedName: strikerName,
        status: 'retired'
      }];
      inn.partnershipRuns = 0;
      inn.partnershipBalls = 0;
      inn.partnershipContributions = {};
      inn.pendingBatterEnd = 'striker';
      innings[prev.inning - 1] = inn;
      return { ...prev, innings };
    });
    try { Speech.speak('Batsman retired. Select next batsman.', { language: 'en-IN' }); } catch (e) { }
    setNewBatsmanName('');
    setWicketPending(true);
  }, [activeMatch, setActiveMatch]);

  // Swap Strike
  const handleSwapStrike = useCallback(() => {
    const inn = activeMatch?.innings?.[activeMatch.inning - 1];
    const deliveryAlreadyRecorded = (inn?.totalLegalBalls || 0) > 0
      || (inn?.currentOverBalls || []).length > 0
      || (inn?.overHistory || []).length > 0;
    if (!inn?.striker?.name || !inn?.nonStriker?.name || activeMatch.phase !== 'playing' || deliveryAlreadyRecorded) return;

    Alert.alert(
      'Swap strike?',
      `${inn.nonStriker.name} will take strike. Score and ball data will stay unchanged.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Swap',
          onPress: () => {
            setMatchHistoryStack(prevStack => [...prevStack.slice(-20), JSON.parse(JSON.stringify(activeMatch))]);
            setMatchRedoStack([]);
            setActiveMatch(prev => {
              if (!prev) return prev;
              const innings = prev.innings.map(inning => ({ ...inning }));
              const currentInning = { ...innings[prev.inning - 1] };
              const previousStriker = currentInning.striker;
              currentInning.striker = currentInning.nonStriker;
              currentInning.nonStriker = previousStriker;
              innings[prev.inning - 1] = currentInning;
              return { ...prev, innings };
            });
          }
        }
      ]
    );
  }, [activeMatch, setActiveMatch]);

  // Undo Delivery
  const handleUndo = useCallback(() => {
    if (!matchHistoryStack || matchHistoryStack.length === 0) {
      Alert.alert('Undo Ball', 'No previous ball recorded to undo.');
      return;
    }
    const previousState = matchHistoryStack[matchHistoryStack.length - 1];
    setMatchHistoryStack(prev => prev.slice(0, -1));
    setMatchRedoStack(prev => [...prev, JSON.parse(JSON.stringify(activeMatch))]);
    setActiveMatch(previousState);
    try { Speech.speak('Last ball undone', { language: 'en-IN' }); } catch (e) { }
  }, [activeMatch, matchHistoryStack, setActiveMatch]);

  // Redo Delivery
  const handleRedo = useCallback(() => {
    if (!matchRedoStack || matchRedoStack.length === 0) {
      Alert.alert('Redo Ball', 'No action available to redo.');
      return;
    }
    const nextState = matchRedoStack[matchRedoStack.length - 1];
    setMatchRedoStack(prev => prev.slice(0, -1));
    setMatchHistoryStack(prev => [...prev, JSON.parse(JSON.stringify(activeMatch))]);
    setActiveMatch(nextState);
    try { Speech.speak('Last ball redone', { language: 'en-IN' }); } catch (e) { }
  }, [activeMatch, matchRedoStack, setActiveMatch]);

  // Inning 2 Setup
  const handleSelectInning2Opener = useCallback((name) => {
    if (!name) return;
    if (name === inn2Striker) {
      setInn2Striker('');
      return;
    }
    if (name === inn2NonStriker) {
      setInn2NonStriker('');
      return;
    }
    if (!inn2Striker) {
      setInn2Striker(name);
      return;
    }
    if (!inn2NonStriker) {
      setInn2NonStriker(name);
      return;
    }
    setInn2NonStriker(name);
  }, [inn2NonStriker, inn2Striker]);

  const handleStartInning2 = useCallback(() => {
    if (!inn2Striker || !inn2NonStriker || !inn2Bowler) {
      Alert.alert('Second Innings', 'Select both openers and opening bowler.');
      return;
    }
    if (inn2Striker === inn2NonStriker) {
      Alert.alert('Second Innings', 'Opening batters must be different players.');
      return;
    }
    const firstInning = activeMatch?.innings?.[0];
    const secondBattingRoster = getRosterForTeam ? getRosterForTeam(firstInning?.bowlingTeam.name, []) : [];
    const secondBowlingRoster = getRosterForTeam ? getRosterForTeam(firstInning?.battingTeam.name, []) : [];
    if (!secondBattingRoster.includes(inn2Striker) || !secondBattingRoster.includes(inn2NonStriker) || !secondBowlingRoster.includes(inn2Bowler)) {
      Alert.alert('Second Innings', 'Selected players must belong to the correct teams.');
      return;
    }
    setActiveMatch(prev => {
      if (!prev) return prev;
      const inn1 = prev.innings[0];
      const team1Logo = prev.team1?.logoKey || prev.teams?.[0]?.logoKey || 'csk';
      const team2Logo = prev.team2?.logoKey || prev.teams?.[1]?.logoKey || 'rcb';
      const inn2BatLogo = inn1.bowlingTeam.name === prev.teams?.[0]?.name ? team1Logo : team2Logo;
      const inn2BowlLogo = inn1.battingTeam.name === prev.teams?.[0]?.name ? team1Logo : team2Logo;
      const inn2 = makeInning(inn1.bowlingTeam.name, inn1.battingTeam.name);
      inn2.battingTeam.logoKey = inn2BatLogo;
      inn2.bowlingTeam.logoKey = inn2BowlLogo;
      inn2.striker = { name: inn2Striker, runs: 0, balls: 0, fours: 0, sixes: 0 };
      inn2.nonStriker = { name: inn2NonStriker, runs: 0, balls: 0, fours: 0, sixes: 0 };
      inn2.bowler = { name: inn2Bowler, runs: 0, wickets: 0, overs: '0.0' };
      inn2.bowlingStats = { [inn2Bowler]: makeBowlingFigure({ name: inn2Bowler }) };
      inn2.allBatters = [inn2.striker, inn2.nonStriker].filter(player => player.name).map(player => ({ ...player, dismissal: 'Not out', isOut: false }));
      try { Speech.speak('Second innings started. Target is ' + (prev.target || (inn1.battingTeam.runs + 1)) + ' runs.', { language: 'en-IN' }); } catch (e) { }
      return { ...prev, innings: [inn1, inn2], inning: 2, phase: 'playing' };
    });
    setInn2Striker('');
    setInn2NonStriker('');
    setInn2Bowler('');
  }, [activeMatch, getRosterForTeam, inn2Bowler, inn2NonStriker, inn2Striker, setActiveMatch]);

  return {
    // States
    matchHistoryStack,
    matchRedoStack,
    wicketPending,
    setWicketPending,
    wicketEntryPending,
    setWicketEntryPending,
    newBatsmanName,
    setNewBatsmanName,
    pendingFielderDismissal,
    setPendingFielderDismissal,
    runOutPending,
    setRunOutPending,
    runOutDismissed,
    setRunOutDismissed,
    runOutEnd,
    setRunOutEnd,
    runOutRuns,
    setRunOutRuns,
    bowlerChangePending,
    setBowlerChangePending,
    nextBowlerName,
    setNextBowlerName,
    inn2Striker,
    setInn2Striker,
    inn2NonStriker,
    setInn2NonStriker,
    inn2Bowler,
    setInn2Bowler,

    // Actions
    handleRecordBall,
    selectNewBatsman,
    handleNewBatsman,
    handleWicketPress,
    cancelWicketEntry,
    handleSelectWicketType,
    handleSelectDismissalFielder,
    handleConfirmRunOut,
    handleNewBowler,
    handleRetireBatsman,
    handleSwapStrike,
    handleUndo,
    handleRedo,
    handleSelectInning2Opener,
    handleStartInning2
  };
}
