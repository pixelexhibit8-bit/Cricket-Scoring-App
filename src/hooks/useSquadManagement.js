import { useState, useEffect } from 'react';
import { generateUUID } from '../services/supabaseClient.js';
import { fetchLocalPlayers, saveLocalPlayer } from '../services/localPlayerService.js';
import { syncPlayersToPhotoRegistry } from '../services/playerPhotoStore.js';
import { showToast } from '../services/toastService.js';
import { capitalizeWords } from '../utils/textUtils.js';
import { MASTER_PLAYERS_DB } from '../../mockData.js';
import { syncMatchToSupabase } from '../services/matchService.js';

export function useSquadManagement({ activeMatch, setActiveMatch }) {
  const [localPlayersList, setLocalPlayersList] = useState([]);
  const [isEditSquadModalOpen, setIsEditSquadModalOpen] = useState(false);
  const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false);
  const [newPlayerRoleInput, setNewPlayerRoleInput] = useState('All-Rounder');
  const [newPlayerPhoneInput, setNewPlayerPhoneInput] = useState('');
  const [selectedLocalImageUri, setSelectedLocalImageUri] = useState(null);
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);

  // Poll / load local players
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
    const intervalId = setInterval(loadPlayers, 3000);
    return () => clearInterval(intervalId);
  }, []);

  const allMidMatchPlayersPool = [...new Set([
    ...(localPlayersList || []).map(p => p.name),
    ...MASTER_PLAYERS_DB.map(p => p.name),
    ...((activeMatch?.playingXI && Object.values(activeMatch.playingXI).flat()) || [])
  ])].filter(Boolean);

  const handleMidMatchMoveToTeam = (playerName, targetTeam) => {
    if (!activeMatch) return;
    const t1Name = activeMatch?.teams?.[0]?.name || activeMatch?.innings?.[0]?.battingTeam?.name || 'Team 1';
    const t2Name = activeMatch?.teams?.[1]?.name || activeMatch?.innings?.[0]?.bowlingTeam?.name || 'Team 2';

    let currentT1 = [...(activeMatch.playingXI?.[t1Name] || [])];
    let currentT2 = [...(activeMatch.playingXI?.[t2Name] || [])];

    currentT1 = currentT1.filter(p => p !== playerName);
    currentT2 = currentT2.filter(p => p !== playerName);

    if (targetTeam === 'team1') {
      currentT1.push(playerName);
      showToast(`${playerName} added to ${t1Name}!`, 'success');
    } else if (targetTeam === 'team2') {
      currentT2.push(playerName);
      showToast(`${playerName} added to ${t2Name}!`, 'success');
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
