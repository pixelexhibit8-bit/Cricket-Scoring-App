import { useEffect, useRef } from 'react';
import { speakScoreToken } from '../utils/cricketUtils.js';

export function useCricketSpeech({ activeMatch, currentScreen }) {
  const publicAnnouncementFingerprintRef = useRef('');

  useEffect(() => {
    if (currentScreen !== 'liveView') {
      publicAnnouncementFingerprintRef.current = '';
      return;
    }
    if (!activeMatch) return;
    const liveInning = activeMatch.innings?.[(activeMatch.inning || 1) - 1];
    if (!liveInning) return;

    const currentBalls = liveInning.currentOverBalls || [];
    const completedOvers = liveInning.overHistory || [];
    const latestCompletedOver = completedOvers[completedOvers.length - 1];
    const latestToken = currentBalls[currentBalls.length - 1] || latestCompletedOver?.balls?.[latestCompletedOver.balls.length - 1] || '';

    const fingerprint = [
      activeMatch.startedAt,
      activeMatch.inning,
      liveInning.totalLegalBalls,
      liveInning.battingTeam?.runs ?? 0,
      liveInning.battingTeam?.wickets ?? 0,
      currentBalls.length,
      liveInning.lastEvent?.label || ''
    ].join(':');

    if (!publicAnnouncementFingerprintRef.current) {
      publicAnnouncementFingerprintRef.current = fingerprint;
      return;
    }
    if (fingerprint === publicAnnouncementFingerprintRef.current) return;
    publicAnnouncementFingerprintRef.current = fingerprint;

    try {
      speakScoreToken(latestToken);
    } catch (error) {
      // Audio speech ignore error
    }
  }, [activeMatch, currentScreen]);
}

export default useCricketSpeech;
