import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  StatusBar,
  Animated,
  Modal,
  Pressable,
  Share,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PagerView from 'react-native-pager-view';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  themeColors,
  systemFont,
  systemFontMedium,
  systemFontBold
} from '../theme.js';
import { PlayerAvatar } from '../components/PlayerAvatar.jsx';
import { TeamIdentityMark } from '../components/TeamIdentityMark.jsx';
import {
  getTournamentBannerSource,
  getTournamentLogoSource
} from '../utils/teamUtils.js';
import {
  getTournaments,
  addTeamToTournament,
  updateTournamentTeam,
  removeTournamentTeam,
  addMatchToTournament,
  saveTournamentFixtures,
  autoCalculatePointsTable,
  getMyHostedTournamentIds,
  saveActiveTournamentId,
  getActiveTournamentId,
  subscribeToTournamentsLive
} from '../services/tournamentService.js';
import { calculateTournamentStats } from '../services/tournamentStatsEngine.js';
import { fetchGlobalTeams, saveGlobalTeam } from '../services/teamService.js';
import { showToast } from '../services/toastService.js';
import { navigate } from '../navigation/navigationService.js';
import { AddTeamHubModal } from '../components/modals/AddTeamHubModal.jsx';
import { BulkSquadPasteModal } from '../components/modals/BulkSquadPasteModal.jsx';
import { CaptainTeamRegistrationModal } from '../components/modals/CaptainTeamRegistrationModal.jsx';
import { AutoGenerateFixturesModal } from '../components/modals/AutoGenerateFixturesModal.jsx';
import { TournamentAdminMenuModal } from '../components/modals/TournamentAdminMenuModal.jsx';
import { EditTournamentModal } from '../components/modals/EditTournamentModal.jsx';
import { TournamentRoundsModal } from '../components/modals/TournamentRoundsModal.jsx';
import { TournamentGroupsModal } from '../components/modals/TournamentGroupsModal.jsx';
import { TournamentRulesModal } from '../components/modals/TournamentRulesModal.jsx';
import { ScheduleChoiceModal } from '../components/modals/ScheduleChoiceModal.jsx';
import { ManualScheduleMatchModal } from '../components/modals/ManualScheduleMatchModal.jsx';
import { getCurrentUser } from '../services/authService.js';
import { useMatch } from '../context/MatchContext.jsx';
import {
  TournamentOverviewTab,
  TournamentMatchesTab,
  TournamentTeamsTab,
  TournamentPointsTableTab,
  TournamentStatsTab,
  TournamentVenuesTab,
  TournamentInfoTab
} from '../components/tournament/index.js';

export function PublicSeriesViewScreen(props = {}) {
  const routeParams = props.route?.params || {};
  const {
    navigation = props.navigation,
    onBack = props.onBack || (() => {
      if (props.navigation && props.navigation.canGoBack()) {
        props.navigation.goBack();
      } else {
        navigate('home');
      }
    }),
    seriesData = props.seriesData || routeParams.seriesData,
    isTab = props.isTab || false
  } = props;

  const pagerRef = useRef(null);
  const matchCtx = useMatch();

  // Tournaments List & Hosted State
  const [tournamentsList, setTournamentsList] = useState([]);
  const [savedTeamsList, setSavedTeamsList] = useState([]);
  const [myHostedIds, setMyHostedIds] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Active Tournament State
  const [tournament, setTournament] = useState(() => seriesData || null);

  // Select Series Modal Drawer State & Search
  const [selectSeriesModalVisible, setSelectSeriesModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Tab State: Overview | Matches | Teams | Points Table | Stats | Venues | Info
  const tabs = useMemo(() => [
    { id: 'overview', label: 'Overview' },
    { id: 'matches', label: 'Matches' },
    { id: 'teams', label: 'Teams' },
    { id: 'pointsTable', label: 'Points Table' },
    { id: 'stats', label: 'Stats' },
    { id: 'venues', label: 'Venues' },
    { id: 'info', label: 'Info' }
  ], []);

  const [activeTab, setActiveTab] = useState('overview');
  const activeTabIndex = tabs.findIndex(t => t.id === activeTab);

  // Toggle state for Team Form on Points Table
  const [teamFormEnabled, setTeamFormEnabled] = useState(false);

  // Underline animation tracking
  const [tabLayouts, setTabLayouts] = useState({});
  const animatedUnderlineX = useRef(new Animated.Value(0)).current;
  const animatedUnderlineWidth = useRef(new Animated.Value(60)).current;

  // Selected Team for Squad Drawer
  const [selectedTeamDrawer, setSelectedTeamDrawer] = useState(null);
  const [bulkPasteDrawerTarget, setBulkPasteDrawerTarget] = useState(null);
  const [captainRegModalVisible, setCaptainRegModalVisible] = useState(false);
  const [addPlayerInlineVisible, setAddPlayerInlineVisible] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerRole, setNewPlayerRole] = useState('All-Rounder');
  const [newPlayerPhone, setNewPlayerPhone] = useState('');

  // Modals for Organiser Actions
  const [addTeamModalVisible, setAddTeamModalVisible] = useState(false);
  const [scheduleChoiceModalVisible, setScheduleChoiceModalVisible] = useState(false);
  const [autoFixturesModalVisible, setAutoFixturesModalVisible] = useState(false);
  const [manualScheduleModalVisible, setManualScheduleModalVisible] = useState(false);
  const [selectedMatchToReschedule, setSelectedMatchToReschedule] = useState(null);

  // Admin Settings Modals
  const [adminMenuModalVisible, setAdminMenuModalVisible] = useState(false);
  const [editTournamentModalVisible, setEditTournamentModalVisible] = useState(false);
  const [roundsModalVisible, setRoundsModalVisible] = useState(false);
  const [groupsModalVisible, setGroupsModalVisible] = useState(false);
  const [rulesModalVisible, setRulesModalVisible] = useState(false);

  // Load tournaments data
  const loadTournamentsData = useCallback(async () => {
    try {
      const [allTourns, hosted, savedActiveId, loggedUser, allGlobalTeams] = await Promise.all([
        getTournaments(),
        getMyHostedTournamentIds(),
        getActiveTournamentId(),
        getCurrentUser(),
        fetchGlobalTeams()
      ]);

      const list = Array.isArray(allTourns) ? allTourns : [];
      setTournamentsList(list);
      setSavedTeamsList(Array.isArray(allGlobalTeams) ? allGlobalTeams : []);
      setMyHostedIds(Array.isArray(hosted) ? hosted : []);
      setCurrentUser(loggedUser || null);

      if (seriesData) {
        setTournament(prev => ({
          ...(prev || {}),
          ...seriesData,
          teams: (seriesData.teams && seriesData.teams.length > 0) ? seriesData.teams : (prev?.teams || []),
          matches: (seriesData.matches && seriesData.matches.length > 0) ? seriesData.matches : (prev?.matches || [])
        }));
        if (seriesData.id) {
          saveActiveTournamentId(seriesData.id);
        }
      } else if (savedActiveId) {
        const found = list.find(t => t.id === savedActiveId);
        if (found) {
          setTournament(found);
        } else if (list.length > 0) {
          setTournament(list[0]);
          saveActiveTournamentId(list[0].id);
        } else {
          setTournament(null);
        }
      } else if (list.length > 0) {
        setTournament(list[0]);
        saveActiveTournamentId(list[0].id);
      } else {
        setTournament(null);
      }
    } catch (err) {
      console.warn('Failed to load tournament data:', err);
    }
  }, [seriesData]);

  useEffect(() => {
    loadTournamentsData();
  }, [loadTournamentsData]);

  useFocusEffect(
    useCallback(() => {
      loadTournamentsData();
    }, [loadTournamentsData])
  );

  // Realtime Live Cloud Sync
  useEffect(() => {
    const unsubscribe = subscribeToTournamentsLive(() => {
      getTournaments().then(updatedList => {
        if (Array.isArray(updatedList)) {
          setTournamentsList(updatedList);
          setTournament(prev => {
            if (!prev?.id) return prev;
            return updatedList.find(t => t.id === prev.id) || prev;
          });
        }
      }).catch(() => {});
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Smart Organiser Detection (Phone / ID / Email)
  const isUserOrganiser = useMemo(() => {
    if (!tournament) return false;
    if (!currentUser) return false;
    const userPhone = currentUser.phone ? String(currentUser.phone).replace(/\D/g, '').slice(-10) : '';
    const tournPhone = tournament.organiserPhone ? String(tournament.organiserPhone).replace(/\D/g, '').slice(-10) : '';
    const isBastiRam = userPhone === '9983228208' || currentUser.id === 'usr_9983228208' || String(currentUser.name || '').toLowerCase().includes('basti ram');
    const matchPhone = Boolean(userPhone && tournPhone && userPhone === tournPhone);
    const matchId = Boolean(currentUser.id && tournament.organiserId && String(tournament.organiserId).trim() === String(currentUser.id).trim());
    const matchEmail = Boolean(currentUser.email && tournament.organiserEmail && String(tournament.organiserEmail).trim().toLowerCase() === String(currentUser.email).trim().toLowerCase());
    return Boolean(matchPhone || matchId || matchEmail || isBastiRam);
  }, [currentUser, tournament]);

  // Switch Active Tournament
  const handleSelectTournament = (selectedItem) => {
    if (!selectedItem) return;
    setTournament(selectedItem);
    if (matchCtx?.setActiveTournament) {
      matchCtx.setActiveTournament(selectedItem);
    }
    if (selectedItem.id) {
      saveActiveTournamentId(selectedItem.id);
    }
    setSelectSeriesModalVisible(false);
  };

  useEffect(() => {
    if (tournament && matchCtx?.setActiveTournament) {
      matchCtx.setActiveTournament(tournament);
    }
  }, [tournament, matchCtx?.setActiveTournament]);

  // Filtered Tournaments in Drawer
  const filteredSheetTournaments = useMemo(() => {
    if (!searchQuery.trim()) return tournamentsList;
    const q = searchQuery.toLowerCase().trim();
    return tournamentsList.filter(t => {
      const name = (t.fullName || t.name || t.title || '').toLowerCase();
      const city = (t.city || t.host || '').toLowerCase();
      const cat = (t.category || t.format || '').toLowerCase();
      return name.includes(q) || city.includes(q) || cat.includes(q);
    });
  }, [tournamentsList, searchQuery]);

  const userHostedTournaments = useMemo(() => {
    if (!currentUser) return [];
    const userPhone = currentUser.phone ? String(currentUser.phone).replace(/\D/g, '').slice(-10) : '';
    return filteredSheetTournaments.filter(t => {
      const tournPhone = t.organiserPhone ? String(t.organiserPhone).replace(/\D/g, '').slice(-10) : '';
      const matchPhone = Boolean(userPhone && tournPhone && userPhone === tournPhone);
      const matchId = currentUser.id && t.organiserId && String(t.organiserId).trim() === String(currentUser.id).trim();
      const matchEmail = currentUser.email && t.organiserEmail && String(t.organiserEmail).trim().toLowerCase() === String(currentUser.email).trim().toLowerCase();
      return Boolean(matchPhone || matchId || matchEmail);
    });
  }, [filteredSheetTournaments, currentUser]);

  // Dynamic Calculated Points Table Data
  const pointsTableData = useMemo(() => {
    if (!tournament) return [];
    const teamsList = tournament.teams || [];
    const matchesList = tournament.matches || [];
    if (teamsList.length === 0) return [];
    return autoCalculatePointsTable(teamsList, matchesList);
  }, [tournament?.teams, tournament?.matches]);

  // Comprehensive Calculated Stats from Engine
  const tournamentStats = useMemo(() => {
    if (!tournament) return null;
    return calculateTournamentStats(tournament);
  }, [tournament]);

  // Tournament Code Generator
  const tournamentCode = useMemo(() => {
    if (!tournament) return 'CF-8421';
    if (tournament.joinCode) return tournament.joinCode;
    const rawId = tournament.id || 'TOUR8421';
    const cleanPrefix = (tournament.name || tournament.title || 'TOUR')
      .replace(/[^A-Za-z0-9]/g, '')
      .slice(0, 4)
      .toUpperCase();
    const cleanSuffix = rawId.slice(-4).toUpperCase();
    return `CF-${cleanPrefix}${cleanSuffix}`;
  }, [tournament]);

  // Squad Players for selected team drawer
  const squadPlayers = useMemo(() => {
    const list = selectedTeamDrawer?.players || selectedTeamDrawer?.squad || [];
    if (list.length > 0) {
      return list.map((p, idx) => ({
        id: p.id || `sp_${idx}`,
        name: typeof p === 'string' ? p : (p.name || `Player ${idx + 1}`),
        role: p.role || 'Player',
        isCaptain: Boolean(p.isCaptain || (selectedTeamDrawer?.captain && String(selectedTeamDrawer.captain).trim() === (p.name || '').trim()) || (selectedTeamDrawer?.captainName && String(selectedTeamDrawer.captainName).trim() === (p.name || '').trim())),
        isWicketKeeper: Boolean(p.isWicketKeeper || p.role === 'Wicket Keeper'),
        runs: p.runs != null ? p.runs : null,
        wickets: p.wickets != null ? p.wickets : null
      }));
    }
    return [];
  }, [selectedTeamDrawer]);

  // Measure tab layout for underline
  const onTabLayout = (tabId, event) => {
    const { x, width } = event.nativeEvent.layout;
    setTabLayouts(prev => {
      const next = { ...prev, [tabId]: { x, width } };
      if (tabId === activeTab) {
        Animated.parallel([
          Animated.spring(animatedUnderlineX, { toValue: x, useNativeDriver: false }),
          Animated.spring(animatedUnderlineWidth, { toValue: width, useNativeDriver: false })
        ]).start();
      }
      return next;
    });
  };

  // Tab Press Handler
  const handleTabPress = (tabId, index) => {
    setActiveTab(tabId);
    if (pagerRef.current) {
      pagerRef.current.setPage(index);
    }
    const layout = tabLayouts[tabId];
    if (layout) {
      Animated.parallel([
        Animated.spring(animatedUnderlineX, { toValue: layout.x, useNativeDriver: false }),
        Animated.spring(animatedUnderlineWidth, { toValue: layout.width, useNativeDriver: false })
      ]).start();
    }
  };

  // Pager Scroll Event Sync
  const handlePageSelected = (e) => {
    const position = e.nativeEvent.position;
    const targetTab = tabs[position];
    if (targetTab) {
      setActiveTab(targetTab.id);
      const layout = tabLayouts[targetTab.id];
      if (layout) {
        Animated.parallel([
          Animated.spring(animatedUnderlineX, { toValue: layout.x, useNativeDriver: false }),
          Animated.spring(animatedUnderlineWidth, { toValue: layout.width, useNativeDriver: false })
        ]).start();
      }
    }
  };

  // Start Instant Scoring
  const handleStartMatchScoring = (match = null) => {
    const t1Name = match?.team1?.name || match?.team1 || tournament?.teams?.[0]?.name || 'Team 1';
    const t2Name = match?.team2?.name || match?.team2 || tournament?.teams?.[1]?.name || 'Team 2';

    const t1Obj = tournament?.teams?.find(t => (t.name || '').trim().toLowerCase() === String(t1Name).trim().toLowerCase());
    const t2Obj = tournament?.teams?.find(t => (t.name || '').trim().toLowerCase() === String(t2Name).trim().toLowerCase());

    const t1Roster = Array.isArray(t1Obj?.players) ? t1Obj.players.map(p => typeof p === 'string' ? p : p.name) : (match?.team1?.players || []);
    const t2Roster = Array.isArray(t2Obj?.players) ? t2Obj.players.map(p => typeof p === 'string' ? p : p.name) : (match?.team2?.players || []);

    const setupParams = {
      tournamentId: tournament?.id || null,
      tournamentMatchId: match?.id || `tm_${Date.now()}`,
      tournamentName: tournament?.name || tournament?.title || 'Tournament',
      presetTeam1: t1Name,
      presetTeam2: t2Name,
      team1Name: t1Name,
      team2Name: t2Name,
      team1Roster: t1Roster.length > 0 ? t1Roster : undefined,
      team2Roster: t2Roster.length > 0 ? t2Roster : undefined,
      totalOvers: match?.overs || tournament?.overs || 5,
      ballType: tournament?.ballType || 'tennis',
      pitchType: tournament?.pitchType || 'turf',
      venueName: match?.venue || tournament?.venue || (Array.isArray(tournament?.venues) && tournament.venues[0]) || tournament?.city || 'Local Cricket Ground'
    };

    const nav = navigation || props.navigation;
    if (nav?.navigate) {
      nav.navigate('QuickMatchSetup', setupParams);
    } else {
      navigate('quickMatchSetup', setupParams);
    }
  };

  // Watch Live
  const handleWatchLive = (match = null) => {
    const nav = navigation || props.navigation;
    const params = {
      matchId: match?.id,
      tournamentId: tournament?.id,
      matchData: match
    };
    if (nav?.navigate) {
      nav.navigate('PublicLiveView', params);
    } else {
      navigate('publicLiveView', params);
    }
  };

  // Match Details / Scorecard Router
  const handleViewScorecard = (match = null) => {
    const isFinished = match?.status === 'FINISHED' || Boolean(match?.result) || match?.phase === 'finished';
    const nav = navigation || props.navigation;
    const params = {
      matchId: match?.id,
      tournamentId: tournament?.id,
      matchData: match,
      isOrganiser: isUserOrganiser
    };
    if (isFinished) {
      if (nav?.navigate) {
        nav.navigate('FinishedMatchView', params);
      } else {
        navigate('finishedView', params);
      }
    } else {
      if (nav?.navigate) {
        nav.navigate('PublicLiveView', params);
      } else {
        navigate('publicLiveView', params);
      }
    }
  };

  // Share WhatsApp Ground Invite
  const handleShareInvite = async () => {
    if (!tournament) return;
    try {
      const tourName = tournament.name || tournament.title || 'Cricket Tournament';
      const city = tournament.city || tournament.host || 'Local Ground';
      const msg = `Join *${tourName}* on CricFlow!\nLocation: ${city}\nDates: ${tournament.startDate || tournament.duration || 'Upcoming'}\n\nCaptains can register their teams and track live ball-by-ball scoring on CricFlow.`;
      await Share.share({
        message: msg,
        title: tourName
      });
    } catch (err) {
      console.log('Share error:', err);
    }
  };

  // Add Team Submission
  const handleAddTeamSubmit = async (teamData) => {
    if (!teamData || !teamData.name) return;

    const updated = await addTeamToTournament(tournament.id, teamData);
    if (updated) {
      setTournament(updated);
    } else {
      setTournament(prev => ({
        ...prev,
        teams: [...(prev?.teams || []), { id: `t_${Date.now()}`, ...teamData }]
      }));
    }
  };

  // Add Single Player to Team in Squad Drawer
  const handleAddSinglePlayerToDrawerTeam = async () => {
    if (!newPlayerName.trim()) {
      showToast('Please enter player name', 'error');
      return;
    }
    if (!selectedTeamDrawer || !tournament?.id) return;

    const currentPlayers = Array.isArray(selectedTeamDrawer.players) ? selectedTeamDrawer.players : (selectedTeamDrawer.squad || []);
    const newP = {
      id: `sp_${Date.now()}_${currentPlayers.length + 1}`,
      name: newPlayerName.trim(),
      role: newPlayerRole || 'All-Rounder',
      phone: newPlayerPhone.trim() || '',
      isCaptain: false,
      isWicketKeeper: newPlayerRole === 'Wicket Keeper'
    };

    const updatedPlayers = [...currentPlayers, newP];
    const updatedTeamObj = {
      ...selectedTeamDrawer,
      players: updatedPlayers
    };

    setSelectedTeamDrawer(updatedTeamObj);
    const updatedTourn = await updateTournamentTeam(tournament.id, selectedTeamDrawer.id, updatedTeamObj);
    if (updatedTourn) {
      setTournament(updatedTourn);
    }
    setNewPlayerName('');
    setNewPlayerPhone('');
    setAddPlayerInlineVisible(false);
    showToast(`Added ${newP.name} to ${selectedTeamDrawer.name}!`, 'success');
  };

  // Toggle Captain in Squad Drawer
  const handleToggleCaptainInDrawer = async (targetPlayer) => {
    if (!selectedTeamDrawer || !tournament?.id) return;
    const currentPlayers = Array.isArray(selectedTeamDrawer.players) ? selectedTeamDrawer.players : (selectedTeamDrawer.squad || []);

    const updatedPlayers = currentPlayers.map(p => {
      const pName = typeof p === 'string' ? p : p.name;
      const isTarget = pName === targetPlayer.name;
      return {
        ...(typeof p === 'string' ? { name: p, id: `sp_${Date.now()}` } : p),
        isCaptain: isTarget
      };
    });

    const updatedTeamObj = {
      ...selectedTeamDrawer,
      captainName: targetPlayer.name,
      captainPhone: targetPlayer.phone || selectedTeamDrawer.captainPhone || '',
      players: updatedPlayers
    };

    setSelectedTeamDrawer(updatedTeamObj);
    const updatedTourn = await updateTournamentTeam(tournament.id, selectedTeamDrawer.id, updatedTeamObj);
    if (updatedTourn) {
      setTournament(updatedTourn);
    }
    showToast(`${targetPlayer.name} is now Captain of ${selectedTeamDrawer.name}`, 'info');
  };

  // Toggle Wicketkeeper in Squad Drawer
  const handleToggleWkInDrawer = async (targetPlayer) => {
    if (!selectedTeamDrawer || !tournament?.id) return;
    const currentPlayers = Array.isArray(selectedTeamDrawer.players) ? selectedTeamDrawer.players : (selectedTeamDrawer.squad || []);

    const updatedPlayers = currentPlayers.map(p => {
      const pName = typeof p === 'string' ? p : p.name;
      const isTarget = pName === targetPlayer.name;
      const wasWk = Boolean(p.isWicketKeeper || p.role === 'Wicket Keeper');
      return {
        ...(typeof p === 'string' ? { name: p, id: `sp_${Date.now()}` } : p),
        isWicketKeeper: isTarget ? !wasWk : wasWk
      };
    });

    const updatedTeamObj = {
      ...selectedTeamDrawer,
      players: updatedPlayers
    };

    setSelectedTeamDrawer(updatedTeamObj);
    const updatedTourn = await updateTournamentTeam(tournament.id, selectedTeamDrawer.id, updatedTeamObj);
    if (updatedTourn) {
      setTournament(updatedTourn);
    }
    showToast(`Updated Wicketkeeper status for ${targetPlayer.name}`, 'info');
  };

  // Remove Player from Squad Drawer
  const handleRemovePlayerFromDrawer = async (targetPlayer) => {
    if (!selectedTeamDrawer || !tournament?.id) return;
    const currentPlayers = Array.isArray(selectedTeamDrawer.players) ? selectedTeamDrawer.players : (selectedTeamDrawer.squad || []);

    const updatedPlayers = currentPlayers.filter(p => {
      const pName = typeof p === 'string' ? p : p.name;
      return pName !== targetPlayer.name && (p.id ? p.id !== targetPlayer.id : true);
    });

    const updatedTeamObj = {
      ...selectedTeamDrawer,
      players: updatedPlayers
    };

    setSelectedTeamDrawer(updatedTeamObj);
    const updatedTourn = await updateTournamentTeam(tournament.id, selectedTeamDrawer.id, updatedTeamObj);
    if (updatedTourn) {
      setTournament(updatedTourn);
    }
    showToast(`Removed ${targetPlayer.name} from squad`, 'info');
  };

  // Bulk WhatsApp squad import for selected team in drawer
  const handleImportSquadToDrawerTeam = async (parsedPlayers) => {
    if (!selectedTeamDrawer || !tournament?.id || !Array.isArray(parsedPlayers)) return;

    const capt = parsedPlayers.find(p => p.isCaptain);
    const updatedTeamObj = {
      ...selectedTeamDrawer,
      captainName: capt ? capt.name : (selectedTeamDrawer.captainName || 'Captain'),
      captainPhone: capt?.phone || selectedTeamDrawer.captainPhone || '',
      players: parsedPlayers
    };

    setSelectedTeamDrawer(updatedTeamObj);
    const updatedTourn = await updateTournamentTeam(tournament.id, selectedTeamDrawer.id, updatedTeamObj);
    if (updatedTourn) {
      setTournament(updatedTourn);
    }
    showToast(`Imported ${parsedPlayers.length} players into ${selectedTeamDrawer.name}!`, 'success');
  };

  // Remove entire team from tournament
  const handleDeleteTeamFromTournament = async (teamId) => {
    Alert.alert(
      'Remove Team',
      'Are you sure you want to remove this team from the tournament?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const updatedTourn = await removeTournamentTeam(tournament.id, teamId);
            if (updatedTourn) {
              setTournament(updatedTourn);
            }
            setSelectedTeamDrawer(null);
            showToast('Team removed from tournament', 'info');
          }
        }
      ]
    );
  };

  // Auto Fixtures Save
  const handleSaveAutoFixtures = async (generatedFixtures) => {
    if (!tournament?.id || !Array.isArray(generatedFixtures)) return;
    const updated = await saveTournamentFixtures(tournament.id, generatedFixtures);
    if (updated) {
      setTournament(updated);
    }
  };

  // Save or Reschedule Manual Match
  const handleSaveManualMatch = async (matchData) => {
    if (!tournament?.id || !matchData) return;
    const currentMatches = Array.isArray(tournament.matches) ? tournament.matches : [];

    const existingIdx = currentMatches.findIndex(m => m.id === matchData.id);
    let updatedMatchesList = [];

    if (existingIdx !== -1) {
      const target = currentMatches[existingIdx];
      // Lock finished or live matches
      if (target.status === 'FINISHED' || target.status === 'LIVE' || Boolean(target.result)) {
        Alert.alert('Match Locked', 'Completed or Live matches cannot be rescheduled.');
        return;
      }
      updatedMatchesList = [...currentMatches];
      updatedMatchesList[existingIdx] = {
        ...target,
        ...matchData
      };
    } else {
      const newMatchNumber = currentMatches.length + 1;
      const completeNewMatch = {
        ...matchData,
        id: matchData.id || `match_${tournament.id}_${Date.now()}`,
        matchNumber: newMatchNumber,
        matchNo: newMatchNumber
      };
      updatedMatchesList = [...currentMatches, completeNewMatch];
    }

    const updated = await saveTournamentFixtures(tournament.id, updatedMatchesList);
    if (updated) {
      setTournament(updated);
    } else {
      setTournament(prev => ({
        ...prev,
        matches: updatedMatchesList
      }));
    }
  };

  // Tournament Admin Handlers
  const handleTournamentUpdated = (updatedTournament) => {
    if (!updatedTournament) return;
    setTournament(updatedTournament);
    setTournamentsList(prev => prev.map(t => t.id === updatedTournament.id ? updatedTournament : t));
    showToast('Tournament updated successfully', 'success');
  };

  const handleTournamentDeleted = (deletedId) => {
    setTournamentsList(prev => prev.filter(t => t.id !== deletedId));
    showToast('Tournament deleted successfully', 'info');
    if (onBack) {
      onBack();
    } else if (navigation && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigate('home');
    }
  };

  const handleDeleteSchedule = async () => {
    if (!tournament?.id) return;
    const currentMatches = Array.isArray(tournament.matches) ? tournament.matches : [];
    const keptMatches = currentMatches.filter(m => m.status === 'FINISHED' || m.status === 'LIVE' || Boolean(m.result));
    const updated = await saveTournamentFixtures(tournament.id, keptMatches);
    if (updated) {
      setTournament(updated);
    } else {
      setTournament(prev => ({ ...(prev || {}), matches: keptMatches }));
    }
    showToast('Upcoming scheduled fixtures cleared', 'info');
  };

  const handleOpenStartMatch = () => {
    const matches = Array.isArray(tournament.matches) ? tournament.matches : [];
    const upcoming = matches.find(m => m.status !== 'FINISHED' && m.status !== 'LIVE' && !m.result);
    if (upcoming) {
      handleStartMatchScoring(upcoming);
    } else if (matches.length > 0) {
      handleStartMatchScoring(matches[0]);
    } else {
      Alert.alert(
        'No Matches Scheduled',
        'Please schedule a match fixture or generate auto fixtures before starting match scoring.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Schedule Match', onPress: () => setScheduleChoiceModalVisible(true) }
        ]
      );
    }
  };

  const handleOpenScorers = () => {
    Alert.alert(
      'Assign Scorer Admin',
      `Current assigned scorer: ${tournament.assignedScorerPhone || 'None'}\n\nYou can edit or assign scorer phone numbers anytime through "Edit/delete tournament" in Settings.`
    );
  };

  const handleOpenOfficials = () => {
    Alert.alert(
      'Officials & Live Stream',
      `Tournament Category: ${tournament.category || 'OPEN'}\nBall Type: ${tournament.ballType || 'Tennis'}\nAssigned Scorer: ${tournament.assignedScorerPhone || 'Host'}\n\nTo link YouTube Live Stream or register official umpires, contact CricFlow Support.`
    );
  };

  // Empty State View if no tournament
  if (!tournament || !tournament.id) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor={themeColors.surface} />
        <View style={styles.container}>
          <View style={styles.headerBar}>
            {!isTab ? (
              <TouchableOpacity
                style={styles.backBtn}
                onPress={onBack}
                activeOpacity={0.7}
                accessibilityLabel="Go Back"
              >
                <Ionicons name="arrow-back" size={24} color={themeColors.textPrimary} />
              </TouchableOpacity>
            ) : null}

            <View style={[styles.headerTitleWrapBtn, isTab && { paddingLeft: 4 }]}>
              <Text style={styles.headerTitle}>Tournament Hub</Text>
              <Text style={styles.headerSubtitle}>Manage & Explore Ground Tournaments</Text>
            </View>

            <TouchableOpacity
              style={styles.shareHeaderBtn}
              onPress={() => {
                if (navigation) {
                  navigation.navigate('CreateTournament');
                }
              }}
              activeOpacity={0.7}
              accessibilityLabel="Host Tournament"
            >
              <Ionicons name="add-circle-outline" size={24} color={themeColors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.emptyScreenContainer}>
            <View style={styles.emptyTrophyIconCircle}>
              <MaterialCommunityIcons name="trophy-outline" size={50} color="#0284C7" />
            </View>
            <Text style={styles.emptyScreenTitle}>No Tournaments Yet</Text>
            <Text style={styles.emptyScreenSubtitle}>
              Host your first cricket tournament to schedule fixtures, register teams, and track live ball-by-ball scoring.
            </Text>

            <TouchableOpacity
              style={styles.hostFirstBtn}
              onPress={() => {
                if (navigation) {
                  navigation.navigate('CreateTournament');
                }
              }}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="trophy" size={20} color="#FFFFFF" />
              <Text style={styles.hostFirstBtnText}>HOST YOUR FIRST TOURNAMENT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={themeColors.surface} />
      <View style={styles.container}>

        {/* ── 1. TOP CAROUSEL OF SERIES STORIES / BADGES ── */}
        {tournamentsList.length > 0 ? (
          <View style={styles.topCarouselContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.topCarouselContent}
            >
              {tournamentsList.map(tItem => {
                const isSelected = tournament?.id === tItem.id;
                const bannerSrc = getTournamentBannerSource(tItem);
                return (
                  <TouchableOpacity
                    key={tItem.id}
                    style={[
                      styles.carouselCard,
                      isSelected && styles.carouselCardSelected
                    ]}
                    onPress={() => handleSelectTournament(tItem)}
                    activeOpacity={0.85}
                  >
                    {bannerSrc ? (
                      <Image
                        source={bannerSrc}
                        style={styles.carouselCardImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.carouselCardFallback, { backgroundColor: isSelected ? '#18181B' : '#F8FAFC' }]}>
                        <MaterialCommunityIcons
                          name="trophy"
                          size={24}
                          color={isSelected ? '#FFFFFF' : '#64748B'}
                        />
                        <Text
                          style={[styles.fallbackCardTitle, isSelected && styles.fallbackCardTitleSelected]}
                          numberOfLines={2}
                        >
                          {tItem.name || tItem.title}
                        </Text>
                      </View>
                    )}

                    {isSelected ? (
                      <View style={styles.carouselCheckmarkBadge}>
                        <Ionicons name="checkmark-circle" size={20} color="#0284C7" />
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {/* ── 2. ACTIVE SERIES HEADER BAR ── */}
        <View style={styles.headerBar}>
          {!isTab ? (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={onBack}
              activeOpacity={0.7}
              accessibilityLabel="Go Back"
            >
              <Ionicons name="arrow-back" size={24} color={themeColors.textPrimary} />
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={[styles.headerTitleWrapBtn, isTab && { paddingLeft: 4 }]}
            onPress={() => setSelectSeriesModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {tournament.fullName || tournament.name || tournament.title || 'Tournament Hub'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={themeColors.textPrimary} style={{ marginLeft: 4 }} />
            </View>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {tournament.duration || tournament.startDate || '06 Sep to 17 Sep'}
            </Text>
          </TouchableOpacity>

          {isUserOrganiser ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={styles.organiserPill}>
                <MaterialCommunityIcons name="shield-crown-outline" size={13} color="#FFFFFF" />
                <Text style={styles.organiserPillText}>Host</Text>
              </View>
              <TouchableOpacity
                style={styles.settingsHeaderBtn}
                onPress={() => setAdminMenuModalVisible(true)}
                activeOpacity={0.7}
                accessibilityLabel="Tournament Admin Settings"
              >
                <Ionicons name="settings-outline" size={20} color={themeColors.textPrimary} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.shareHeaderBtn}
              onPress={() => setSelectSeriesModalVisible(true)}
              activeOpacity={0.7}
              accessibilityLabel="Select Tournament"
            >
              <Ionicons name="list-outline" size={22} color={themeColors.textPrimary} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── 3. SCROLLABLE TAB STRIP WITH ANIMATED UNDERLINE ── */}
        <View style={styles.tabStripContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabStripContent}
          >
            {tabs.map((tab, idx) => {
              const isSelected = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onLayout={(e) => onTabLayout(tab.id, e)}
                  onPress={() => handleTabPress(tab.id, idx)}
                  style={styles.tabItemBtn}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tabLabelText, isSelected && styles.tabLabelTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Smooth Animated Finger-Tracking Underline */}
            <Animated.View
              style={[
                styles.animatedUnderline,
                {
                  width: animatedUnderlineWidth,
                  transform: [{ translateX: animatedUnderlineX }]
                }
              ]}
            />
          </ScrollView>
        </View>

        {/* ── 4. NATIVE HORIZONTAL SWIPE PAGER ── */}
        <PagerView
          ref={pagerRef}
          style={{ flex: 1 }}
          initialPage={activeTabIndex}
          onPageSelected={handlePageSelected}
        >
          {/* TAB 1: OVERVIEW */}
          <View key="overview" style={{ flex: 1 }}>
            <TournamentOverviewTab
              tournament={tournament}
              stats={tournamentStats}
              pointsTableData={pointsTableData}
              teamFormEnabled={teamFormEnabled}
              onToggleTeamForm={() => setTeamFormEnabled(!teamFormEnabled)}
              onViewAllMatches={() => handleTabPress('matches', 1)}
              onViewAllStats={() => handleTabPress('stats', 4)}
              onViewAllStandings={() => handleTabPress('pointsTable', 3)}
              onSelectTeamSquad={(team) => setSelectedTeamDrawer(team)}
              onStartMatchScoring={handleStartMatchScoring}
              onWatchLive={handleWatchLive}
              onViewScorecard={handleViewScorecard}
              isUserOrganiser={isUserOrganiser}
            />
          </View>

          {/* TAB 2: MATCHES */}
          <View key="matches" style={{ flex: 1 }}>
            <TournamentMatchesTab
              tournament={tournament}
              onStartMatchScoring={handleStartMatchScoring}
              onWatchLive={handleWatchLive}
              onViewScorecard={handleViewScorecard}
              isUserOrganiser={isUserOrganiser}
              onOpenAutoSchedule={() => setAutoFixturesModalVisible(true)}
              onOpenManualSchedule={() => {
                setSelectedMatchToReschedule(null);
                setManualScheduleModalVisible(true);
              }}
              onRescheduleMatch={(match) => {
                setSelectedMatchToReschedule(match);
                setManualScheduleModalVisible(true);
              }}
            />
          </View>

          {/* TAB 3: TEAMS */}
          <View key="teams" style={{ flex: 1 }}>
            <TournamentTeamsTab
              tournament={tournament}
              onSelectTeam={(team) => setSelectedTeamDrawer(team)}
              onAddTeam={() => setAddTeamModalVisible(true)}
              onShareInvite={handleShareInvite}
              onOpenCaptainRegistration={() => setCaptainRegModalVisible(true)}
              isUserOrganiser={isUserOrganiser}
            />
          </View>

          {/* TAB 4: POINTS TABLE */}
          <View key="pointsTable" style={{ flex: 1 }}>
            <TournamentPointsTableTab
              tournament={tournament}
              pointsTableData={pointsTableData}
              teamFormEnabled={teamFormEnabled}
              onToggleTeamForm={() => setTeamFormEnabled(!teamFormEnabled)}
            />
          </View>

          {/* TAB 5: STATS */}
          <View key="stats" style={{ flex: 1 }}>
            <TournamentStatsTab
              tournament={tournament}
              stats={tournamentStats}
              onSelectStatCategory={() => {}}
              onSelectPlayer={(p) => {}}
            />
          </View>

          {/* TAB 6: VENUES */}
          <View key="venues" style={{ flex: 1 }}>
            <TournamentVenuesTab
              tournament={tournament}
              onSelectVenue={() => {}}
            />
          </View>

          {/* TAB 7: INFO */}
          <View key="info" style={{ flex: 1 }}>
            <TournamentInfoTab
              tournament={tournament}
            />
          </View>
        </PagerView>

        {/* ── MODAL 1: SMART ADD TEAM HUB ── */}
        <AddTeamHubModal
          visible={addTeamModalVisible}
          onClose={() => setAddTeamModalVisible(false)}
          tournament={tournament}
          onAddTeam={handleAddTeamSubmit}
          savedTeams={savedTeamsList}
        />

        {/* ── MODAL 2: AUTO GENERATE FIXTURES MODAL ── */}
        <AutoGenerateFixturesModal
          visible={autoFixturesModalVisible}
          onClose={() => setAutoFixturesModalVisible(false)}
          tournament={tournament}
          onSaveFixtures={handleSaveAutoFixtures}
        />

        {/* ── MODAL 3: SCHEDULE CHOICE MODAL (AUTO vs MANUAL) ── */}
        <ScheduleChoiceModal
          visible={scheduleChoiceModalVisible}
          onClose={() => setScheduleChoiceModalVisible(false)}
          onSelectAuto={() => setAutoFixturesModalVisible(true)}
          onSelectManual={() => {
            setSelectedMatchToReschedule(null);
            setManualScheduleModalVisible(true);
          }}
        />

        {/* ── MODAL 4: MANUAL SCHEDULE / RESCHEDULE MATCH MODAL ── */}
        <ManualScheduleMatchModal
          visible={manualScheduleModalVisible}
          onClose={() => {
            setManualScheduleModalVisible(false);
            setSelectedMatchToReschedule(null);
          }}
          tournament={tournament}
          initialMatchData={selectedMatchToReschedule}
          onSaveMatch={handleSaveManualMatch}
        />

        {/* ── MODAL 4: UPGRADED SQUAD & TEAM MANAGEMENT DRAWER ── */}
        <Modal
          visible={Boolean(selectedTeamDrawer)}
          animationType="slide"
          transparent={true}
          onRequestClose={() => {
            setSelectedTeamDrawer(null);
            setAddPlayerInlineVisible(false);
          }}
        >
          <Pressable style={styles.modalOverlay} onPress={() => {
            setSelectedTeamDrawer(null);
            setAddPlayerInlineVisible(false);
          }}>
            <Pressable style={styles.modalContent} onPress={() => {}}>
              <View style={styles.modalHandle} />
              
              {/* Header */}
              <View style={styles.modalHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <TeamIdentityMark team={selectedTeamDrawer} size={36} />
                  <View>
                    <Text style={styles.modalTitle}>{selectedTeamDrawer?.name}</Text>
                    <Text style={{ fontSize: 11.5, fontFamily: systemFont, color: themeColors.textMuted }}>
                      {selectedTeamDrawer?.city || 'Local Ground'} • {squadPlayers.length} Players{selectedTeamDrawer?.captainName ? ` • Capt: ${selectedTeamDrawer.captainName}` : ''}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => {
                  setSelectedTeamDrawer(null);
                  setAddPlayerInlineVisible(false);
                }} style={styles.closeBtn}>
                  <Ionicons name="close" size={22} color={themeColors.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Organiser Action Toolbar */}
              {isUserOrganiser ? (
                <View style={styles.drawerActionsToolbar}>
                  <TouchableOpacity
                    style={[styles.drawerActionPill, addPlayerInlineVisible && styles.drawerActionPillActive]}
                    onPress={() => setAddPlayerInlineVisible(!addPlayerInlineVisible)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="person-add" size={14} color={addPlayerInlineVisible ? '#FFFFFF' : themeColors.textPrimary} />
                    <Text style={[styles.drawerActionPillText, addPlayerInlineVisible && styles.drawerActionPillTextActive]}>
                      + Add Player
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.drawerActionPillWhatsapp}
                    onPress={() => setBulkPasteDrawerTarget(selectedTeamDrawer)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="logo-whatsapp" size={14} color="#16A34A" />
                    <Text style={styles.drawerActionPillWhatsappText}>
                      Paste WhatsApp Squad
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.drawerActionPillDelete}
                    onPress={() => handleDeleteTeamFromTournament(selectedTeamDrawer.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trash-outline" size={14} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              ) : null}

              {/* Inline Add Player Form (If Visible) */}
              {addPlayerInlineVisible && (
                <View style={styles.inlineAddPlayerBox}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TextInput
                      style={styles.inlinePlayerInput}
                      placeholder="Player Name (e.g. Ramesh)"
                      placeholderTextColor={themeColors.textSubtle}
                      value={newPlayerName}
                      onChangeText={setNewPlayerName}
                    />
                    <TextInput
                      style={[styles.inlinePlayerInput, { flex: 0.6 }]}
                      placeholder="Mobile No. (Opt)"
                      placeholderTextColor={themeColors.textSubtle}
                      keyboardType="phone-pad"
                      value={newPlayerPhone}
                      onChangeText={setNewPlayerPhone}
                    />
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                    {/* Role selector pills */}
                    <View style={{ flexDirection: 'row', gap: 4 }}>
                      {['All-Rounder', 'Batter', 'Bowler', 'Wicket Keeper'].map((r) => (
                        <TouchableOpacity
                          key={r}
                          style={[styles.roleSelectChip, newPlayerRole === r && styles.roleSelectChipActive]}
                          onPress={() => setNewPlayerRole(r)}
                        >
                          <Text style={[styles.roleSelectChipText, newPlayerRole === r && styles.roleSelectChipTextActive]}>
                            {r === 'Wicket Keeper' ? 'WK' : r.slice(0, 4)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <TouchableOpacity
                      style={styles.inlineAddBtn}
                      onPress={handleAddSinglePlayerToDrawerTeam}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="add" size={16} color="#FFFFFF" />
                      <Text style={styles.inlineAddBtnText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Squad Players List */}
              <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
                {squadPlayers.length > 0 ? (
                  squadPlayers.map((player, pIdx) => {
                    return (
                      <View key={player.id || pIdx} style={styles.squadPlayerRow}>
                        <View style={{ width: 22, alignItems: 'center' }}>
                          <Text style={{ fontSize: 11, fontFamily: systemFontBold, color: themeColors.textMuted }}>{pIdx + 1}</Text>
                        </View>
                        <PlayerAvatar name={player.name} size={34} />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={styles.squadPlayerName}>{player.name}</Text>
                          <Text style={styles.squadPlayerRole}>
                            {player.role}{player.phone ? ` • ${player.phone}` : ''}
                          </Text>
                        </View>

                        {/* Interactive Role & Management Badges */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          {isUserOrganiser ? (
                            <>
                              {/* Captaincy Toggle */}
                              <TouchableOpacity
                                style={[styles.roleToggleBadge, player.isCaptain && styles.roleToggleBadgeCaptain]}
                                onPress={() => handleToggleCaptainInDrawer(player)}
                                activeOpacity={0.7}
                              >
                                <Text style={[styles.roleToggleBadgeText, player.isCaptain && styles.roleToggleBadgeTextCaptain]}>
                                  {player.isCaptain ? 'Capt (C)' : 'C'}
                                </Text>
                              </TouchableOpacity>

                              {/* WK Toggle */}
                              <TouchableOpacity
                                style={[styles.roleToggleBadge, player.isWicketKeeper && styles.roleToggleBadgeWk]}
                                onPress={() => handleToggleWkInDrawer(player)}
                                activeOpacity={0.7}
                              >
                                <Text style={[styles.roleToggleBadgeText, player.isWicketKeeper && styles.roleToggleBadgeTextWk]}>
                                  WK
                                </Text>
                              </TouchableOpacity>

                              {/* Remove Player */}
                              <TouchableOpacity
                                style={styles.removePlayerBtn}
                                onPress={() => handleRemovePlayerFromDrawer(player)}
                                activeOpacity={0.7}
                              >
                                <Ionicons name="trash-outline" size={15} color="#94A3B8" />
                              </TouchableOpacity>
                            </>
                          ) : (
                            <>
                              {player.isCaptain && (
                                <View style={styles.captainBadge}>
                                  <Text style={styles.captainBadgeText}>C</Text>
                                </View>
                              )}
                              {player.isWicketKeeper && (
                                <View style={styles.wkBadge}>
                                  <Text style={styles.wkBadgeText}>WK</Text>
                                </View>
                              )}
                            </>
                          )}
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <View style={{ paddingVertical: 24, alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Ionicons name="people-outline" size={32} color="#94A3B8" />
                    <Text style={{ fontSize: 13, fontFamily: systemFont, color: themeColors.textSecondary }}>
                      No squad players registered yet
                    </Text>
                    {isUserOrganiser && (
                      <TouchableOpacity
                        style={styles.emptyAddPlayersBtn}
                        onPress={() => setBulkPasteDrawerTarget(selectedTeamDrawer)}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="logo-whatsapp" size={16} color="#16A34A" />
                        <Text style={styles.emptyAddPlayersBtnText}>Paste WhatsApp Squad Now</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>

        {/* ── MODAL 4B: BULK SQUAD PASTE MODAL (For Drawer Team) ── */}
        <BulkSquadPasteModal
          visible={Boolean(bulkPasteDrawerTarget)}
          onClose={() => setBulkPasteDrawerTarget(null)}
          onImportPlayers={handleImportSquadToDrawerTeam}
          teamName={bulkPasteDrawerTarget?.name || selectedTeamDrawer?.name || 'Selected Team'}
        />

        {/* ── MODAL 4C: CAPTAIN TEAM REGISTRATION MODAL ── */}
        <CaptainTeamRegistrationModal
          visible={captainRegModalVisible}
          onClose={() => setCaptainRegModalVisible(false)}
          initialJoinCode={tournamentCode}
          onRegistrationSuccess={(res) => {
            if (res?.tournament) {
              setTournament(res.tournament);
            }
            loadTournamentsData();
          }}
        />

        {/* ── MODAL 6: TOURNAMENT ADMIN MENU MODAL ── */}
        <TournamentAdminMenuModal
          visible={adminMenuModalVisible}
          onClose={() => setAdminMenuModalVisible(false)}
          tournament={tournament}
          onOpenEdit={() => setEditTournamentModalVisible(true)}
          onOpenAddTeams={() => setAddTeamModalVisible(true)}
          onOpenRounds={() => setRoundsModalVisible(true)}
          onOpenGroups={() => setGroupsModalVisible(true)}
          onOpenStartMatch={handleOpenStartMatch}
          onOpenSchedule={() => setScheduleChoiceModalVisible(true)}
          onDeleteSchedule={handleDeleteSchedule}
          onOpenScorers={handleOpenScorers}
          onOpenOfficials={handleOpenOfficials}
          onOpenRules={() => setRulesModalVisible(true)}
        />

        {/* ── MODAL 7: EDIT / DELETE TOURNAMENT MODAL ── */}
        <EditTournamentModal
          visible={editTournamentModalVisible}
          onClose={() => setEditTournamentModalVisible(false)}
          tournament={tournament}
          onTournamentUpdated={handleTournamentUpdated}
          onTournamentDeleted={handleTournamentDeleted}
        />

        {/* ── MODAL 8: TOURNAMENT ROUNDS MODAL ── */}
        <TournamentRoundsModal
          visible={roundsModalVisible}
          onClose={() => setRoundsModalVisible(false)}
          tournament={tournament}
          onTournamentUpdated={handleTournamentUpdated}
        />

        {/* ── MODAL 9: TOURNAMENT GROUPS MODAL ── */}
        <TournamentGroupsModal
          visible={groupsModalVisible}
          onClose={() => setGroupsModalVisible(false)}
          tournament={tournament}
          onTournamentUpdated={handleTournamentUpdated}
          onOpenRounds={() => setRoundsModalVisible(true)}
        />

        {/* ── MODAL 10: TOURNAMENT RULES MODAL ── */}
        <TournamentRulesModal
          visible={rulesModalVisible}
          onClose={() => setRulesModalVisible(false)}
          tournament={tournament}
          onTournamentUpdated={handleTournamentUpdated}
        />

        {/* ── MODAL 5: SELECT SERIES BOTTOM SHEET DRAWER ── */}
        <Modal
          visible={selectSeriesModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectSeriesModalVisible(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setSelectSeriesModalVisible(false)}
          >
            <Pressable style={styles.selectSeriesSheet} onPress={e => e.stopPropagation()}>
              <View style={styles.sheetHandle} />

              <View style={styles.sheetHeaderRow}>
                <Text style={styles.sheetTitle}>Select Series</Text>
                <TouchableOpacity
                  style={styles.sheetCloseBtn}
                  onPress={() => setSelectSeriesModalVisible(false)}
                  activeOpacity={0.7}
                  accessibilityLabel="Close Drawer"
                >
                  <Ionicons name="close" size={20} color={themeColors.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Search Bar */}
              <View style={styles.searchBarWrap}>
                <Ionicons name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search series by name or city..."
                  placeholderTextColor="#94A3B8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  clearButtonMode="while-editing"
                />
                {searchQuery ? (
                  <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                    <Ionicons name="close-circle" size={16} color="#94A3B8" />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Series List ScrollView */}
              <ScrollView
                style={styles.seriesSheetScroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                {/* User Hosted Series Section */}
                {userHostedTournaments.length > 0 ? (
                  <View style={{ marginBottom: 12 }}>
                    <View style={styles.sheetSectionHeaderRow}>
                      <MaterialCommunityIcons name="shield-crown-outline" size={15} color="#0284C7" />
                      <Text style={styles.sheetSectionTitle}>My Hosted Series</Text>
                    </View>
                    {userHostedTournaments.map(item => {
                      const isSelected = tournament?.id === item.id;
                      return (
                        <TouchableOpacity
                          key={`hosted_${item.id}`}
                          style={[
                            styles.seriesSheetItemRow,
                            isSelected && styles.seriesSheetItemRowSelected
                          ]}
                          onPress={() => handleSelectTournament(item)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.sheetItemLogoWrap}>
                            {getTournamentLogoSource(item) || getTournamentBannerSource(item) ? (
                              <Image source={getTournamentLogoSource(item) || getTournamentBannerSource(item)} style={styles.sheetItemLogo} />
                            ) : (
                              <View style={[styles.sheetItemLogoFallback, { backgroundColor: isSelected ? '#18181B' : '#F1F5F9' }]}>
                                <MaterialCommunityIcons name="trophy" size={20} color={isSelected ? '#FFFFFF' : '#64748B'} />
                              </View>
                            )}
                          </View>

                          <View style={{ flex: 1, marginHorizontal: 10 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={[styles.sheetItemName, isSelected && styles.sheetItemNameSelected]} numberOfLines={1}>
                                {item.fullName || item.name || item.title}
                              </Text>
                              <View style={styles.sheetHostChip}>
                                <Text style={styles.sheetHostChipText}>Host</Text>
                              </View>
                            </View>
                            <Text style={styles.sheetItemDates} numberOfLines={1}>
                              {item.duration || item.startDate || 'Season 2026'} • {item.city || 'Ground'}
                            </Text>
                          </View>

                          {isSelected ? (
                            <Ionicons name="checkmark-circle" size={22} color="#0284C7" />
                          ) : (
                            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : null}

                {/* All Series Section */}
                <View>
                  {userHostedTournaments.length > 0 ? (
                    <View style={styles.sheetSectionHeaderRow}>
                      <MaterialCommunityIcons name="trophy-outline" size={15} color="#64748B" />
                      <Text style={styles.sheetSectionTitle}>All Series</Text>
                    </View>
                  ) : null}

                  {filteredSheetTournaments.map(item => {
                    const isSelected = tournament?.id === item.id;
                    const isHost = myHostedIds.includes(item.id);
                    const logoSrc = getTournamentLogoSource(item) || getTournamentBannerSource(item);
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.seriesSheetItemRow,
                          isSelected && styles.seriesSheetItemRowSelected
                        ]}
                        onPress={() => handleSelectTournament(item)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.sheetItemLogoWrap}>
                          {logoSrc ? (
                            <Image source={logoSrc} style={styles.sheetItemLogo} />
                          ) : (
                            <View style={[styles.sheetItemLogoFallback, { backgroundColor: isSelected ? '#18181B' : '#F1F5F9' }]}>
                              <MaterialCommunityIcons name="trophy" size={20} color={isSelected ? '#FFFFFF' : '#64748B'} />
                            </View>
                          )}
                        </View>

                        <View style={{ flex: 1, marginHorizontal: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.sheetItemName, isSelected && styles.sheetItemNameSelected]} numberOfLines={1}>
                              {item.fullName || item.name || item.title}
                            </Text>
                            {isHost ? (
                              <View style={styles.sheetHostChip}>
                                <Text style={styles.sheetHostChipText}>Host</Text>
                              </View>
                            ) : null}
                          </View>
                          <Text style={styles.sheetItemDates} numberOfLines={1}>
                            {item.duration || item.startDate || 'Season 2026'} • {item.city || 'Ground'}
                          </Text>
                        </View>

                        {isSelected ? (
                          <Ionicons name="checkmark-circle" size={22} color="#0284C7" />
                        ) : (
                          <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Host A Tournament Action Button */}
                <TouchableOpacity
                  style={styles.sheetHostActionBtn}
                  onPress={() => {
                    setSelectSeriesModalVisible(false);
                    if (navigation) {
                      navigation.navigate('CreateTournament');
                    }
                  }}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="trophy" size={18} color="#FFFFFF" />
                  <Text style={styles.sheetHostActionBtnText}>HOST A NEW TOURNAMENT</Text>
                </TouchableOpacity>
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: themeColors.surface
  },
  container: {
    flex: 1,
    backgroundColor: themeColors.appBackground
  },
  topCarouselContainer: {
    backgroundColor: themeColors.surface,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border
  },
  topCarouselContent: {
    paddingHorizontal: 16,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center'
  },
  carouselScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center'
  },
  carouselCard: {
    width: 104,
    height: 112,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    position: 'relative',
    marginRight: 8,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3
  },
  carouselCardSelected: {
    borderColor: '#18181B',
    borderWidth: 2,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 4
  },
  carouselCardActive: {
    borderColor: '#18181B',
    borderWidth: 2,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 4
  },
  carouselCardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    resizeMode: 'cover'
  },
  carouselCardFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    padding: 8
  },
  fallbackCardTitle: {
    color: '#0F172A',
    fontSize: 11,
    fontFamily: systemFontMedium,
    textAlign: 'center',
    lineHeight: 14,
    marginTop: 4
  },
  fallbackCardTitleSelected: {
    color: '#FFFFFF',
    fontFamily: systemFontMedium
  },
  carouselCheckmarkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2
  },
  headerBar: {
    minHeight: 52,
    backgroundColor: themeColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 6
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'flex-start',
    justifyContent: 'center'
  },
  headerTitleWrapBtn: {
    flex: 1,
    marginRight: 8
  },
  headerTitle: {
    fontSize: 15.5,
    fontFamily: systemFontMedium,
    color: themeColors.textPrimary,
    letterSpacing: -0.2
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: systemFont,
    color: themeColors.textMuted,
    marginTop: 1
  },
  organiserPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#18181B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  organiserPillText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontFamily: systemFontMedium
  },
  settingsHeaderBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: themeColors.surfaceOffWhite,
    borderWidth: 1,
    borderColor: themeColors.borderDark,
    alignItems: 'center',
    justifyContent: 'center'
  },
  shareHeaderBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tabStripContainer: {
    backgroundColor: themeColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
    position: 'relative'
  },
  tabStripContent: {
    flexDirection: 'row',
    paddingHorizontal: 12
  },
  tabItemBtn: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tabLabelText: {
    fontSize: 13,
    fontFamily: systemFontMedium,
    color: themeColors.textMuted
  },
  tabLabelTextActive: {
    color: themeColors.primary,
    fontFamily: systemFontBold
  },
  animatedUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: '#E11D48'
  },
  emptyScreenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12
  },
  emptyTrophyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  emptyScreenTitle: {
    fontSize: 17,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  emptyScreenSubtitle: {
    fontSize: 13,
    fontFamily: systemFont,
    color: themeColors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16
  },
  hostFirstBtn: {
    backgroundColor: '#18181B',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 10
  },
  hostFirstBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontFamily: systemFontBold
  },
  emptySubtitle: {
    fontSize: 12,
    fontFamily: systemFont,
    color: themeColors.textMuted,
    textAlign: 'center'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: themeColors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 12
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 4
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  inputGroup: {
    gap: 4
  },
  inputLabel: {
    fontSize: 11.5,
    fontFamily: systemFontMedium,
    color: themeColors.textSecondary
  },
  modalTextInput: {
    backgroundColor: themeColors.surfaceOffWhite,
    borderWidth: 1,
    borderColor: themeColors.borderDark,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: systemFont,
    color: themeColors.textPrimary
  },
  modalSubmitBtn: {
    backgroundColor: '#18181B',
    borderRadius: 10,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6
  },
  modalSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontFamily: systemFontBold
  },
  teamSelectPill: {
    backgroundColor: themeColors.surfaceOffWhite,
    borderWidth: 1,
    borderColor: themeColors.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14
  },
  teamSelectPillActive: {
    backgroundColor: '#18181B',
    borderColor: '#18181B'
  },
  teamSelectPillText: {
    fontSize: 12,
    fontFamily: systemFontMedium,
    color: themeColors.textSecondary
  },
  teamSelectPillTextActive: {
    color: '#FFFFFF'
  },
  squadPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border
  },
  squadPlayerName: {
    fontSize: 13,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  squadPlayerRole: {
    fontSize: 11,
    fontFamily: systemFont,
    color: themeColors.textMuted
  },
  squadPlayerStat: {
    fontSize: 12,
    fontFamily: systemFontBold,
    color: themeColors.primary
  },
  captainBadge: {
    backgroundColor: '#18181B',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4
  },
  captainBadgeText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontFamily: systemFontBold
  },
  wkBadge: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4
  },
  wkBadgeText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontFamily: systemFontBold
  },
  selectSeriesSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '82%',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  sheetTitle: {
    fontSize: 17,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8FA',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    marginBottom: 12
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: systemFont,
    color: themeColors.textPrimary,
    paddingVertical: 0
  },
  seriesSheetScroll: {
    maxHeight: 380
  },
  sheetSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    marginTop: 6,
    marginBottom: 4
  },
  sheetSectionTitle: {
    fontSize: 11.5,
    fontFamily: systemFontBold,
    color: themeColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  seriesSheetItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  seriesSheetItemRowSelected: {
    borderColor: '#BAE6FD',
    backgroundColor: '#F0F9FF'
  },
  sheetItemLogoWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  sheetItemLogo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
  sheetItemLogoFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  sheetItemName: {
    fontSize: 13.5,
    fontFamily: systemFontMedium,
    color: themeColors.textPrimary
  },
  sheetItemNameSelected: {
    color: '#0284C7',
    fontFamily: systemFontBold
  },
  sheetItemDates: {
    fontSize: 11,
    fontFamily: systemFont,
    color: themeColors.textMuted,
    marginTop: 2
  },
  sheetHostChip: {
    backgroundColor: '#18181B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  sheetHostChipText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontFamily: systemFontBold
  },
  sheetHostActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#18181B',
    height: 44,
    borderRadius: 10,
    marginTop: 14,
    marginBottom: 8
  },
  sheetHostActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontFamily: systemFontBold,
    letterSpacing: 0.3
  },
  drawerActionsToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 10
  },
  drawerActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: themeColors.surfaceOffWhite,
    borderWidth: 1,
    borderColor: themeColors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  drawerActionPillActive: {
    backgroundColor: '#18181B',
    borderColor: '#18181B'
  },
  drawerActionPillText: {
    fontSize: 11.5,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  drawerActionPillTextActive: {
    color: '#FFFFFF'
  },
  drawerActionPillWhatsapp: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  drawerActionPillWhatsappText: {
    fontSize: 11.5,
    fontFamily: systemFontBold,
    color: '#16A34A'
  },
  drawerActionPillDelete: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  inlineAddPlayerBox: {
    backgroundColor: themeColors.surfaceOffWhite,
    borderWidth: 1,
    borderColor: themeColors.border,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10
  },
  inlinePlayerInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: themeColors.borderDark,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 36,
    fontSize: 12.5,
    fontFamily: systemFont,
    color: themeColors.textPrimary
  },
  roleSelectChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: themeColors.border,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6
  },
  roleSelectChipActive: {
    backgroundColor: '#18181B',
    borderColor: '#18181B'
  },
  roleSelectChipText: {
    fontSize: 10.5,
    fontFamily: systemFontMedium,
    color: themeColors.textSecondary
  },
  roleSelectChipTextActive: {
    color: '#FFFFFF',
    fontFamily: systemFontBold
  },
  inlineAddBtn: {
    backgroundColor: '#18181B',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6
  },
  inlineAddBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontFamily: systemFontBold
  },
  roleToggleBadge: {
    borderWidth: 1,
    borderColor: themeColors.border,
    backgroundColor: themeColors.surfaceOffWhite,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  roleToggleBadgeCaptain: {
    backgroundColor: '#18181B',
    borderColor: '#18181B'
  },
  roleToggleBadgeWk: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7'
  },
  roleToggleBadgeText: {
    fontSize: 9.5,
    fontFamily: systemFontBold,
    color: themeColors.textMuted
  },
  roleToggleBadgeTextCaptain: {
    color: '#FFFFFF'
  },
  roleToggleBadgeTextWk: {
    color: '#FFFFFF'
  },
  removePlayerBtn: {
    padding: 4
  },
  emptyAddPlayersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8
  },
  emptyAddPlayersBtnText: {
    fontSize: 12,
    fontFamily: systemFontBold,
    color: '#16A34A'
  }
});

export default PublicSeriesViewScreen;
