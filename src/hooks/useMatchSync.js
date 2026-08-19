import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  syncMatchToSupabase,
  fetchFinishedMatchesFromSupabase,
  fetchPlayersFromSupabase,
  fetchLiveMatchFromSupabase,
  fetchLiveMatchesFromSupabase,
  subscribeToSupabaseLiveMatches,
  fetchMatchByAccessCode
} from '../services/matchService.js';
import { buildFinishedMatch } from '../utils/cricketUtils.js';
import { aggregateMatchToPlayerStats } from '../services/localPlayerService.js';
import { showToast } from '../services/toastService.js';

const STORAGE_KEY = '@cricflow_app_state_v3';

export function useMatchSync({
  currentScreen,
  setCurrentScreen,
  setBottomNavTab
}) {
  const [activeMatch, setActiveMatch] = useState(null);
  const [liveMatches, setLiveMatches] = useState([]);
  const [finishedArchive, setFinishedArchive] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [playerPool, setPlayerPool] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [liveSyncState, setLiveSyncState] = useState('connected');
  const [storageReady, setStorageReady] = useState(false);

  // 1. Initial Load: Fetch remote players & finished matches from Supabase
  useEffect(() => {
    fetchPlayersFromSupabase().then(dbPlayers => {
      if (Array.isArray(dbPlayers) && dbPlayers.length > 0) {
        setPlayerPool(dbPlayers.map(p => p.name));
      }
    }).catch(() => { });

    fetchFinishedMatchesFromSupabase().then(dbMatches => {
      if (Array.isArray(dbMatches) && dbMatches.length > 0) {
        setFinishedArchive(prev => {
          const map = new Map();
          (prev || []).forEach(m => {
            if (m?.title || m?.id) map.set(m.id || m.title, m);
          });
          (dbMatches || []).filter(m => Boolean(m && (m.team1?.name || m.teams?.[0]?.name))).forEach(m => {
            const key = m.id || m.title;
            if (key) {
              const existing = map.get(key);
              if (!existing || (m.team1?.batting?.length || 0) > (existing.team1?.batting?.length || 0)) {
                map.set(key, m);
              }
            }
          });
          return Array.from(map.values());
        });
      }
    }).catch(() => { });
  }, []);

  // 2. Realtime WebSocket Subscription (zero delay push)
  // Use a ref so the callback always reads the latest screen without re-subscribing
  const currentScreenRef = useRef(currentScreen);
  useEffect(() => { currentScreenRef.current = currentScreen; }, [currentScreen]);

  useEffect(() => {
    const onLiveUpdate = (matchData, eventType, fullRow) => {
      if (!matchData || (!matchData.matchTitle && !matchData.title)) return;
      const matchId = matchData.id || matchData.supabaseId || fullRow?.id;
      const isFinished = matchData.phase === 'result' || matchData.phase === 'finished' || matchData.isCompleted;

      // Update live matches list
      setLiveMatches(prev => {
        const list = Array.isArray(prev) ? [...prev] : [];
        const index = list.findIndex(m => (m.id && m.id === matchId) || (m.supabaseId && m.supabaseId === matchId));
        if (isFinished) {
          if (index !== -1) list.splice(index, 1);
          return list;
        }
        if (index !== -1) {
          list[index] = { ...list[index], ...matchData };
        } else {
          list.unshift(matchData);
        }
        return list;
      });

      // If finished, refresh finished archive
      if (isFinished) {
        fetchFinishedMatchesFromSupabase().then(dbMatches => {
          if (Array.isArray(dbMatches) && dbMatches.length > 0) {
            setFinishedArchive(dbMatches);
          }
        }).catch(() => { });
      }

      // Update activeMatch if viewing (read latest screen from ref)
      if (currentScreenRef.current !== 'scorerWizard') {
        setActiveMatch(prev => {
          if (!prev) return matchData;
          if ((prev.id && prev.id === matchId) || (prev.supabaseId && prev.supabaseId === matchId)) {
            return { ...prev, ...matchData };
          }
          return prev;
        });
      }
    };

    const unsubscribe = subscribeToSupabaseLiveMatches(onLiveUpdate);

    fetchLiveMatchesFromSupabase().then(liveList => {
      if (Array.isArray(liveList) && liveList.length > 0) {
        setLiveMatches(liveList);
        setActiveMatch(prev => prev || liveList[0]);
      }
    }).catch(() => { });

    return () => {
      unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 3. Local Storage restore & sync
  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (!mounted || !raw) return;
        const saved = JSON.parse(raw);
        if (Array.isArray(saved?.finishedMatches) && saved.finishedMatches.length > 0) {
          setFinishedArchive(saved.finishedMatches);
        }
        if (saved?.selectedMatch?.id) {
          setSelectedMatch(saved.selectedMatch);
        }
        if (saved?.activeMatch?.matchTitle && Array.isArray(saved.activeMatch.innings)) {
          const restored = saved.activeMatch;
          if (restored.phase === 'result' || restored.resultText) {
            const finishedSnapshot = buildFinishedMatch(restored);
            if (finishedSnapshot && (finishedSnapshot.title || finishedSnapshot.id)) {
              setFinishedArchive(prev => [finishedSnapshot, ...(prev || [])]);
              setSelectedMatch(finishedSnapshot);
            }
          } else {
            setActiveMatch(restored);
          }
        }
      })
      .catch(() => { })
      .finally(() => {
        if (mounted) setStorageReady(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // 4. Save state to AsyncStorage on update
  useEffect(() => {
    if (!storageReady) return;
    const payload = JSON.stringify({
      activeMatch: activeMatch || null,
      selectedMatch: selectedMatch || null,
      finishedMatches: finishedArchive || []
    });
    AsyncStorage.setItem(STORAGE_KEY, payload).catch(() => { });
  }, [activeMatch, selectedMatch, finishedArchive, storageReady]);

  // 5. Scorer Broadcast: Auto-sync activeMatch to Supabase
  useEffect(() => {
    if (activeMatch && currentScreen === 'scorerWizard') {
      syncMatchToSupabase(activeMatch).catch(() => { });
    }
  }, [activeMatch, currentScreen]);

  // 6. Handle Match Finished aggregation
  useEffect(() => {
    if (activeMatch?.phase === 'result') {
      const finishedMatch = buildFinishedMatch(activeMatch);
      setSelectedMatch(current => current?.id === finishedMatch.id ? current : finishedMatch);
      setFinishedArchive(current => {
        const existingIndex = current.findIndex(match => match.id === finishedMatch.id);
        if (existingIndex >= 0) {
          const next = [...current];
          next[existingIndex] = finishedMatch;
          return next;
        }
        return [finishedMatch, ...current];
      });
      aggregateMatchToPlayerStats(finishedMatch).catch(() => { });
    }
  }, [activeMatch?.phase]);

  // 7. Pull to Refresh handler
  const handlePullToRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [liveDataList, finishedData] = await Promise.all([
        fetchLiveMatchesFromSupabase(),
        fetchFinishedMatchesFromSupabase()
      ]);
      if (Array.isArray(liveDataList)) {
        setLiveMatches(liveDataList);
        setActiveMatch(prev => {
          if (!prev) return liveDataList[0] || null;
          const found = liveDataList.find(m => (m.id && m.id === prev.id) || (m.supabaseId && m.supabaseId === prev.supabaseId));
          return found || prev;
        });
      }
      if (finishedData && Array.isArray(finishedData)) {
        setFinishedArchive(finishedData);
      }
    } catch (e) {
      // Refresh error ignored
    } finally {
      setRefreshing(false);
    }
  }, []);

  // 8. Join Match by Code
  const handleJoinMatchByCode = async (code) => {
    try {
      const match = await fetchMatchByAccessCode(code);
      if (match) {
        setActiveMatch(match);
        if (match.phase === 'result' || match.phase === 'finished') {
          setSelectedMatch(match);
          if (setCurrentScreen) setCurrentScreen('finishedView');
        } else {
          if (setCurrentScreen) setCurrentScreen('liveView');
        }
        showToast('Joined match live successfully!', 'success', 'Match Found');
      } else {
        showToast('No match found for this 6-digit code', 'error', 'Invalid Code');
      }
    } catch (err) {
      showToast('Could not fetch match code', 'error', 'Connection Error');
    }
  };

  return {
    activeMatch,
    setActiveMatch,
    liveMatches,
    setLiveMatches,
    finishedArchive,
    setFinishedArchive,
    selectedMatch,
    setSelectedMatch,
    playerPool,
    refreshing,
    handlePullToRefresh,
    handleJoinMatchByCode,
    liveSyncState
  };
}

export default useMatchSync;
