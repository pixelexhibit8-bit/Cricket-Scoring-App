import { useState, useEffect } from 'react';
import { generateUUID } from '../services/supabaseClient.js';
import { fetchLocalPlayers, saveLocalPlayer } from '../services/localPlayerService.js';
import { syncPlayersToPhotoRegistry } from '../services/playerPhotoStore.js';
import { showToast } from '../services/toastService.js';
import { capitalizeWords } from '../utils/textUtils.js';
import { syncMatchToSupabase } from '../services/matchService.js';
import { getPlayerMatchStatus } from '../utils/cricketUtils.js';
import { addPlayerToTournamentTeam } from '../services/tournamentService.js';

export function useSquadManagement({ activeMatch, setActiveMatch }) {
  const [localPlayersList, setLocalPlayersList] = useState([]);
  const [isEditSquadModalOpen, setIsEditSquadModalOpen] = useState(false);
  const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false);
  const [newPlayerRoleInput, setNewPlayerRoleInput] = useState('All-Rounder');
  const [newPlayerPhoneInput, setNewPlayerPhoneInput] = useState('');
  const [selectedLocalImageUri, setSelectedLocalImageUri] = useState(null);
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);

  // Load local players on mount and refresh periodically (30s to save battery)
  useEffect(() => {
    const loadPlayers = () => {
      fetchLocalPlayers().then(players => {
        if (Array.isArray(players)) {
          setLocalPlayersList(players);
          syncPlayersToPhotoRegistry(players);
        }
      }).catch(() => { });
    };
    loadPlayers();
    const intervalId = setInterval(loadPlayers, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const allMidMatchPlayersPool = [...new Set([
    ...(localPlayersList || []).map(p => p?.name).filter(Boolean),
    ...((activeMatch?.playingXI && typeof activeMatch.playingXI === 'object' ? Object.values(activeMatch.playingXI).flat().filter(Boolean) : []))
  ])].filter(Boolean);

  const handleMidMatchMoveToTeam = (playerName, targetTeam) => {
    if (!activeMatch || !playerName) return;

    const t1Name = activeMatch?.teams?.[0]?.name || activeMatch?.innings?.[0]?.battingTeam?.name || 'Team 1';
    const t2Name = activeMatch?.teams?.[1]?.name || activeMatch?.innings?.[0]?.bowlingTeam?.name || 'Team 2';

    const isRemoving = targetTeam === 'pool' || targetTeam === 'remove' || (!targetTeam.startsWith('team') && targetTeam !== t1Name && targetTeam !== t2Name);

    if (isRemoving) {
      const matchStatus = getPlayerMatchStatus(activeMatch, playerName);
      if (!matchStatus.canRemove) {
        showToast(matchStatus.reason || `${playerName} is actively playing in this match and cannot be removed`, 'error');
        return;
      }
    }

    let currentT1 = [...(activeMatch.playingXI?.[t1Name] || activeMatch?.teams?.[0]?.roster || [])];
    let currentT2 = [...(activeMatch.playingXI?.[t2Name] || activeMatch?.teams?.[1]?.roster || [])];

    const isAddingToT1 = targetTeam === 'team1' || targetTeam === t1Name;
    const isAddingToT2 = targetTeam === 'team2' || targetTeam === t2Name;

    // Enforce 11-player limit
    if (isAddingToT1 && currentT1.length >= 11 && !currentT1.includes(playerName)) {
      showToast(`Playing XI for ${t1Name} is full (11/11). Remove an existing player first.`, 'warning', 'Playing XI Full');
      return;
    }
    if (isAddingToT2 && currentT2.length >= 11 && !currentT2.includes(playerName)) {
      showToast(`Playing XI for ${t2Name} is full (11/11). Remove an existing player first.`, 'warning', 'Playing XI Full');
      return;
    }

    currentT1 = currentT1.filter(p => p !== playerName);
    currentT2 = currentT2.filter(p => p !== playerName);

    if (isAddingToT1) {
      currentT1.push(playerName);
      showToast(`${playerName} added to ${t1Name} squad!`, 'success');
      if (activeMatch?.tournamentId) {
        addPlayerToTournamentTeam(activeMatch.tournamentId, t1Name, { name: playerName, role: 'All-Rounder' }).catch(() => {});
      }
    } else if (isAddingToT2) {
      currentT2.push(playerName);
      showToast(`${playerName} added to ${t2Name} squad!`, 'success');
      if (activeMatch?.tournamentId) {
        addPlayerToTournamentTeam(activeMatch.tournamentId, t2Name, { name: playerName, role: 'All-Rounder' }).catch(() => {});
      }
    } else {
      showToast(`${playerName} removed from squad`, 'info');
    }

    const updatedMatch = {
      ...activeMatch,
      playingXI: {
        ...(activeMatch.playingXI || {}),
        [t1Name]: currentT1,
        [t2Name]: currentT2
      },
      teams: (activeMatch.teams || []).map((t, idx) => ({
        ...t,
        roster: idx === 0 ? currentT1 : currentT2
      }))
    };

    setActiveMatch(updatedMatch);
    syncMatchToSupabase(updatedMatch).catch(() => { });
  };

  const handleMidMatchCreatePlayer = async (newPlayerName) => {
    if (!newPlayerName || !newPlayerName.trim()) {
      showToast('Please enter a valid player name', 'error');
      return;
    }
    const cleanName = capitalizeWords(newPlayerName.trim());
    setIsAddingPlayer(true);
    try {
      const playerObj = {
        id: generateUUID(),
        name: cleanName,
        role: newPlayerRoleInput || 'All-Rounder',
        phone: newPlayerPhoneInput?.trim() || '',
        photo_url: selectedLocalImageUri || ''
      };
      await saveLocalPlayer(playerObj);
      setLocalPlayersList(prev => [...(prev || []).filter(p => p.name !== cleanName), playerObj]);

      handleMidMatchMoveToTeam(cleanName, 'team1');

      if (activeMatch?.tournamentId) {
        const t1Name = activeMatch?.teams?.[0]?.name || activeMatch?.innings?.[0]?.battingTeam?.name || 'Team 1';
        addPlayerToTournamentTeam(activeMatch.tournamentId, t1Name, playerObj).catch(() => {});
      }

      setIsAddPlayerModalOpen(false);
      setNewPlayerPhoneInput('');
      setSelectedLocalImageUri(null);
      showToast(`${cleanName} registered & added to squad!`, 'success');
    } catch (err) {
      showToast('Could not save player', 'error');
    } finally {
      setIsAddingPlayer(false);
    }
  };

  return {
    localPlayersList,
    setLocalPlayersList,
    isEditSquadModalOpen,
    setIsEditSquadModalOpen,
    isAddPlayerModalOpen,
    setIsAddPlayerModalOpen,
    newPlayerRoleInput,
    setNewPlayerRoleInput,
    newPlayerPhoneInput,
    setNewPlayerPhoneInput,
    selectedLocalImageUri,
    setSelectedLocalImageUri,
    isAddingPlayer,
    allMidMatchPlayersPool,
    handleMidMatchMoveToTeam,
    handleMidMatchCreatePlayer
  };
}

export default useSquadManagement;
