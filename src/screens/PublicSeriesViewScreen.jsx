import React, { useState, useRef, useMemo, useEffect } from 'react';
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
  useWindowDimensions,
  Pressable,
  Share,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PagerView from 'react-native-pager-view';
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
  getTournaments,
  addTeamToTournament,
  addMatchToTournament,
  saveTournamentFixtures,
  autoCalculatePointsTable,
  getMyHostedTournamentIds,
  saveActiveTournamentId,
  getActiveTournamentId,
  subscribeToTournamentsLive
} from '../services/tournamentService.js';
import { navigate } from '../navigation/navigationService.js';
import { AddTeamHubModal } from '../components/modals/AddTeamHubModal.jsx';
import { AutoGenerateFixturesModal } from '../components/modals/AutoGenerateFixturesModal.jsx';
import { getCurrentUser } from '../services/authService.js';
import { getCleanMatchStageBadge } from '../utils/cricketUtils.js';

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
    isOrganiser = props.isOrganiser !== undefined ? props.isOrganiser : (routeParams.isOrganiser ?? Boolean(routeParams.seriesData?.isOrganiser)),
    isTab = props.isTab || false
  } = props;
  const { width: windowWidth } = useWindowDimensions();
  const pagerRef = useRef(null);

  // Tournaments List & User Hosted State
  const [tournamentsList, setTournamentsList] = useState([]);
  const [myHostedIds, setMyHostedIds] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Select Series Modal Drawer State & Search
  const [selectSeriesModalVisible, setSelectSeriesModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Tournament Data State
  const [tournament, setTournament] = useState(() => {
    return seriesData || null;
  });

  // Keep state in sync if props change or load latest/active tournament from storage
  useEffect(() => {
    let isMounted = true;
    const loadTournamentsData = async () => {
      try {
        const [allTourns, hosted, savedActiveId, loggedUser] = await Promise.all([
          getTournaments(),
          getMyHostedTournamentIds(),
          getActiveTournamentId(),
          getCurrentUser()
        ]);
        if (!isMounted) return;

        const list = Array.isArray(allTourns) ? allTourns : [];
        setTournamentsList(list);
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
    };
    loadTournamentsData();
    return () => { isMounted = false; };
  }, [seriesData]);

  // Realtime Live Cloud Sync: Listen for remote tournament updates
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

  // Smart Role Detection: Only authenticated hosts who created this tournament get organiser permissions.
  // Logged-out users and normal spectators always see the Public Spectator View.
  const isUserOrganiser = Boolean(
    currentUser && (
      (currentUser.phone && tournament?.organiserPhone && String(tournament.organiserPhone).trim() === String(currentUser.phone).trim()) ||
      (currentUser.id && tournament?.organiserId && String(tournament.organiserId).trim() === String(currentUser.id).trim()) ||
      (currentUser.email && tournament?.organiserEmail && String(tournament.organiserEmail).trim().toLowerCase() === String(currentUser.email).trim().toLowerCase())
    )
  );

  // Switch Active Tournament
  const handleSelectTournament = (selectedItem) => {
    if (!selectedItem) return;
    setTournament(selectedItem);
    if (selectedItem.id) {
      saveActiveTournamentId(selectedItem.id);
    }
    setSelectSeriesModalVisible(false);
  };

  // Filtered Tournaments in the "Select Series" bottom sheet
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
    return filteredSheetTournaments.filter(t => {
      const matchPhone = currentUser.phone && t.organiserPhone && String(t.organiserPhone).trim() === String(currentUser.phone).trim();
      const matchId = currentUser.id && t.organiserId && String(t.organiserId).trim() === String(currentUser.id).trim();
      const matchEmail = currentUser.email && t.organiserEmail && String(t.organiserEmail).trim().toLowerCase() === String(currentUser.email).trim().toLowerCase();
      return Boolean(matchPhone || matchId || matchEmail);
    });
  }, [filteredSheetTournaments, currentUser]);

  // Tabs: Overview | Matches | Teams | Points Table | Stats | Venues | News | Info
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'matches', label: 'Matches' },
    { id: 'teams', label: 'Teams' },
    { id: 'pointsTable', label: 'Points Table' },
    { id: 'stats', label: 'Stats' },
    { id: 'venues', label: 'Venues' },
    { id: 'news', label: 'News' },
    { id: 'info', label: 'Info' }
  ];

  const [activeTab, setActiveTab] = useState('overview');
  const activeTabIndex = tabs.findIndex(t => t.id === activeTab);

  // Matches Sub-Filter: 'ALL' | 'LIVE' | 'UPCOMING' | 'FINISHED'
  const [matchSubFilter, setMatchSubFilter] = useState('ALL');

  // Toggle state for Team Form on Points Table
  const [teamFormEnabled, setTeamFormEnabled] = useState(false);

  // Measured widths & positions for smooth finger-tracking underline
  const [tabLayouts, setTabLayouts] = useState({});
  const animatedUnderlineX = useRef(new Animated.Value(0)).current;
  const animatedUnderlineWidth = useRef(new Animated.Value(60)).current;

  // Selected Team for Squad Bottom Sheet Drawer
  const [selectedTeamDrawer, setSelectedTeamDrawer] = useState(null);

  // Modals for Organiser Actions
  const [addTeamModalVisible, setAddTeamModalVisible] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newCaptainName, setNewCaptainName] = useState('');

  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [autoFixturesModalVisible, setAutoFixturesModalVisible] = useState(false);
  const [schedTeam1, setSchedTeam1] = useState('');
  const [schedTeam2, setSchedTeam2] = useState('');
  const [schedDateStr, setSchedDateStr] = useState('Tomorrow • 09:00 AM');

  const handleSaveAutoFixtures = async (generatedFixtures) => {
    if (!tournament?.id || !Array.isArray(generatedFixtures)) return;
    const updated = await saveTournamentFixtures(tournament.id, generatedFixtures);
    if (updated) {
      setTournament(updated);
    }
  };

  // Auto-calculated Points Table Data
  const pointsTableData = useMemo(() => {
    if (!tournament) return [];
    const teams = tournament.teams || [];
    const matches = tournament.matches || [];
    if (teams.length === 0) return [];
    return autoCalculatePointsTable(teams, matches);
  }, [tournament?.teams, tournament?.matches]);

  // Squad Players for Bottom Sheet Drawer from selected team
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

  // Dynamic Tournament Leaders (Top Batter, Top Bowler, MVP)
  const tournamentLeaders = useMemo(() => {
    const matches = tournament?.matches || [];
    let topBatter = null;
    let topBowler = null;
    let topMVP = null;

    let maxRuns = -1;
    let maxWkts = -1;

    matches.forEach(m => {
      const raw = m.rawMatchData;
      if (!raw) return;

      const innList = raw.innings || [];
      innList.forEach(inn => {
        const batsmen = inn.batsmen || inn.batters || [];
        batsmen.forEach(b => {
          const r = Number(b.runs || 0);
          if (r > maxRuns) {
            maxRuns = r;
            topBatter = {
              name: b.name || 'Batter',
              team: b.team || m.team1?.name || '',
              runs: r,
              sr: b.balls ? ((r / b.balls) * 100).toFixed(1) : '0.0'
            };
          }
        });

        const bowlers = inn.bowlers || [];
        bowlers.forEach(bw => {
          const w = Number(bw.wickets || bw.wkts || 0);
          if (w > maxWkts) {
            maxWkts = w;
            topBowler = {
              name: bw.name || 'Bowler',
              team: bw.team || m.team2?.name || '',
              wickets: w,
              econ: bw.econ || bw.economy || '0.0'
            };
          }
        });
      });
    });

    if (!topBatter) {
      const captain1 = tournament?.teams?.[0]?.captainName || tournament?.teams?.[0]?.players?.[0]?.name || 'Top Batter';
      topBatter = {
        name: captain1,
        team: tournament?.teams?.[0]?.name || 'Registered Team',
        runs: 0,
        sr: '0.0'
      };
    }

    if (!topBowler) {
      const captain2 = tournament?.teams?.[1]?.captainName || tournament?.teams?.[1]?.players?.[1]?.name || 'Strike Bowler';
      topBowler = {
        name: captain2,
        team: tournament?.teams?.[1]?.name || 'Registered Team',
        wickets: 0,
        econ: '0.0'
      };
    }

    if (!topMVP) {
      const mvpCandidate = tournament?.teams?.[0]?.players?.[1]?.name || tournament?.teams?.[0]?.captainName || 'Tournament MVP';
      const finishedMatchesCount = matches.filter(m => m.status === 'FINISHED').length;
      topMVP = {
        name: mvpCandidate,
        team: tournament?.teams?.[0]?.name || 'Registered Team',
        points: (topBatter.runs ? topBatter.runs * 2 : 0) + (topBowler.wickets ? topBowler.wickets * 25 : 0),
        matchesCount: finishedMatchesCount
      };
    }

    return { topBatter, topBowler, topMVP };
  }, [tournament?.matches, tournament?.teams]);

  const keyStatsTop = useMemo(() => {
    return {
      label: 'Most Runs',
      player: tournamentLeaders.topBatter.name,
      fullName: tournamentLeaders.topBatter.name,
      team: tournamentLeaders.topBatter.team,
      val: tournamentLeaders.topBatter.runs > 0 ? String(tournamentLeaders.topBatter.runs) : '-',
      unit: tournamentLeaders.topBatter.runs > 0 ? 'Runs' : ''
    };
  }, [tournamentLeaders]);

  const keyStatsGrid = useMemo(() => {
    return [
      { label: 'Most Wickets', player: tournamentLeaders.topBowler.name, team: tournamentLeaders.topBowler.team, val: tournamentLeaders.topBowler.wickets > 0 ? String(tournamentLeaders.topBowler.wickets) : '-' },
      { label: 'Best Bowling', player: tournamentLeaders.topBowler.name, team: tournamentLeaders.topBowler.team, val: tournamentLeaders.topBowler.wickets > 0 ? `${tournamentLeaders.topBowler.wickets} wkts` : '-' },
      { label: 'Highest Score', player: tournamentLeaders.topBatter.name, team: tournamentLeaders.topBatter.team, val: tournamentLeaders.topBatter.runs > 0 ? `${tournamentLeaders.topBatter.runs}*` : '-' },
      { label: 'Tournament MVP', player: tournamentLeaders.topMVP.name, team: tournamentLeaders.topMVP.team, val: tournamentLeaders.topMVP.points > 0 ? `${tournamentLeaders.topMVP.points} pts` : '-' }
    ];
  }, [tournamentLeaders]);

  // Handle Share WhatsApp Ground Invite
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

  // Handle Add Team Submission
  const handleAddTeamSubmit = async (teamData) => {
    if (!teamData || !teamData.name) return;

    const updated = await addTeamToTournament(tournament.id, teamData);
    if (updated) {
      setTournament(updated);
    } else {
      setTournament(prev => ({
        ...prev,
        teams: [...(prev.teams || []), { id: `t_${Date.now()}`, ...teamData }]
      }));
    }
  };

  // Handle Schedule Match Submission
  const handleScheduleSubmit = async () => {
    if (!schedTeam1 || !schedTeam2) {
      Alert.alert('Required', 'Please select both teams for the match.');
      return;
    }
    if (schedTeam1 === schedTeam2) {
      Alert.alert('Invalid Selection', 'Please select two different teams.');
      return;
    }

    const matchData = {
      team1: { name: schedTeam1 },
      team2: { name: schedTeam2 },
      dateStr: schedDateStr || 'Upcoming',
      status: 'UPCOMING'
    };

    const updated = await addMatchToTournament(tournament.id, matchData);
    if (updated) {
      setTournament(updated);
    } else {
      setTournament(prev => ({
        ...prev,
        matches: [...(prev.matches || []), { id: `m_${Date.now()}`, ...matchData }]
      }));
    }

    setScheduleModalVisible(false);
  };

  // Start Instant Scoring with full tournament context and team squads
  const handleStartMatchScoring = (match = null) => {
    const t1Name = match?.team1?.name || match?.team1 || tournament?.teams?.[0]?.name || 'Team 1';
    const t2Name = match?.team2?.name || match?.team2 || tournament?.teams?.[1]?.name || 'Team 2';

    const t1Obj = tournament?.teams?.find(t => (t.name || '').trim().toLowerCase() === String(t1Name).trim().toLowerCase());
    const t2Obj = tournament?.teams?.find(t => (t.name || '').trim().toLowerCase() === String(t2Name).trim().toLowerCase());

    const t1Roster = Array.isArray(t1Obj?.players) ? t1Obj.players.map(p => typeof p === 'string' ? p : p.name) : [];
    const t2Roster = Array.isArray(t2Obj?.players) ? t2Obj.players.map(p => typeof p === 'string' ? p : p.name) : [];

    if (navigation) {
      navigation.navigate('QuickMatchSetup', {
        tournamentId: tournament.id,
        tournamentMatchId: match?.id || `tm_${Date.now()}`,
        tournamentName: tournament.name || tournament.title,
        presetTeam1: t1Name,
        presetTeam2: t2Name,
        team1Name: t1Name,
        team2Name: t2Name,
        team1Roster: t1Roster.length > 0 ? t1Roster : undefined,
        team2Roster: t2Roster.length > 0 ? t2Roster : undefined,
        totalOvers: match?.overs || tournament.overs || 5,
        ballType: tournament.ballType || 'tennis',
        pitchType: tournament.pitchType || 'turf',
        venueName: match?.venue || tournament.city || ''
      });
    }
  };

  // Public Viewer: Watch Live Ball-by-Ball
  const handleWatchLive = (match = null) => {
    if (navigation) {
      navigation.navigate('PublicLiveView', {
        matchId: match?.id,
        tournamentId: tournament.id,
        matchData: match
      });
    }
  };

  // Public Viewer: View Finished Match Scorecard
  const handleViewScorecard = (match = null) => {
    if (navigation) {
      navigation.navigate('FinishedMatchView', {
        matchId: match?.id,
        tournamentId: tournament.id,
        matchData: match
      });
    }
  };

  // Back Navigation
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation && navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  // Measure tab layouts for smooth underline animation
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

  const rawMatches = tournament?.matches || [];
  const filteredMatches = useMemo(() => {
    if (matchSubFilter === 'LIVE') return rawMatches.filter(m => m.status === 'LIVE');
    if (matchSubFilter === 'UPCOMING') return rawMatches.filter(m => m.status === 'UPCOMING' || !m.status);
    if (matchSubFilter === 'FINISHED') return rawMatches.filter(m => m.status === 'FINISHED');
    return rawMatches;
  }, [rawMatches, matchSubFilter]);

  if (!tournament || !tournament.id) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor={themeColors.surface} />
        <View style={styles.container}>
          {/* Top Bar */}
          <View style={styles.headerBar}>
            {!isTab ? (
              <TouchableOpacity
                style={styles.backBtn}
                onPress={handleBack}
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

          {/* Clean Fresh Slate Empty View */}
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

        {/* ── 1. TOP CAROUSEL OF SERIES (CREX STYLE) ── */}
        {tournamentsList.length > 0 ? (
          <View style={styles.topCarouselContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.topCarouselContent}
            >
              {tournamentsList.map(tItem => {
                const isSelected = tournament?.id === tItem.id;
                return (
                  <TouchableOpacity
                    key={tItem.id}
                    style={[
                      styles.carouselCard,
                      isSelected && styles.carouselCardSelected
                    ]}
                    onPress={() => handleSelectTournament(tItem)}
                    activeOpacity={0.8}
                  >
                    {tItem.bannerUri || tItem.logoUri ? (
                      <Image
                        source={{ uri: tItem.bannerUri || tItem.logoUri }}
                        style={styles.carouselCardImage}
                      />
                    ) : (
                      <View style={[styles.carouselCardFallback, { backgroundColor: isSelected ? '#18181B' : '#F8FAFC' }]}>
                        <MaterialCommunityIcons
                          name="trophy"
                          size={30}
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
                        <Ionicons name="checkmark-circle" size={19} color="#0284C7" />
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {/* ── 2. ACTIVE SERIES HEADER BAR WITH DROPDOWN CHEVRON ── */}
        <View style={styles.headerBar}>
          {!isTab ? (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={handleBack}
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
                {tournament.name || tournament.title || 'Tournament Hub'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={themeColors.textPrimary} style={{ marginLeft: 4 }} />
            </View>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {tournament.city || tournament.host || 'Local Ground'} • {tournament.duration || tournament.startDate || 'Season 2026'}
            </Text>
          </TouchableOpacity>

          {isUserOrganiser ? (
            <View style={styles.organiserPill}>
              <MaterialCommunityIcons name="shield-crown-outline" size={13} color="#FFFFFF" />
              <Text style={styles.organiserPillText}>Host</Text>
            </View>
          ) : null}
        </View>

        {/* ── 2. SCROLLABLE TAB STRIP WITH SMOOTH ANIMATED UNDERLINE ── */}
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

        {/* ── 3. NATIVE HORIZONTAL SWIPE PAGER ── */}
        <PagerView
          ref={pagerRef}
          style={{ flex: 1 }}
          initialPage={activeTabIndex}
          onPageSelected={handlePageSelected}
        >

          {/* ── TAB 1: OVERVIEW ── */}
          <View key="overview" style={{ flex: 1 }}>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.tabScrollPadding} showsVerticalScrollIndicator={false}>

              {/* Tournament Identity Card (Clean Logo & Identity Header, No Cover Banner) */}
              <View style={styles.heroIdentityCard}>
                <View style={styles.heroBodyPadding}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      {tournament.logoUri ? (
                        <View style={styles.heroLogoWrap}>
                          <Image source={{ uri: tournament.logoUri }} style={styles.heroLogoImage} />
                        </View>
                      ) : (
                        <View style={styles.heroLogoFallback}>
                          <MaterialCommunityIcons name="trophy" size={22} color="#0284C7" />
                        </View>
                      )}
                      <View style={styles.categoryChip}>
                        <Text style={styles.categoryChipText}>{tournament.category || 'OPEN GROUND CRICKET'}</Text>
                      </View>
                    </View>
                    <Text style={styles.durationBadgeText}>{tournament.duration || tournament.startDate || 'Season 2026'}</Text>
                  </View>

                  <Text style={styles.heroTournamentName}>{tournament.fullName || tournament.name || tournament.title}</Text>
                  <Text style={styles.heroTournamentMeta}>
                    {tournament.city || tournament.host || 'Ground'} • {tournament.teams?.length || 0} Teams Registered
                  </Text>

                  {/* Organiser Quick Actions */}
                  {isUserOrganiser ? (
                    <View style={styles.quickActionsRow}>
                      <TouchableOpacity
                        style={styles.quickActionBtnPrimary}
                        onPress={() => handleStartMatchScoring()}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons name="cricket" size={16} color="#FFFFFF" />
                        <Text style={styles.quickActionBtnPrimaryText}>Start Match</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.quickActionBtnOutline}
                        onPress={() => setAddTeamModalVisible(true)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="add" size={16} color={themeColors.primary} />
                        <Text style={styles.quickActionBtnOutlineText}>Add Team</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.quickActionBtnOutline}
                        onPress={handleShareInvite}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="logo-whatsapp" size={15} color="#16A34A" />
                        <Text style={styles.quickActionBtnOutlineText}>Invite</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Organiser Next Scheduled Match Card */}
              {isUserOrganiser && rawMatches.find(m => m.status === 'UPCOMING' || !m.status) ? (() => {
                const nextMatch = rawMatches.find(m => m.status === 'UPCOMING' || !m.status);
                return (
                  <View style={styles.nextMatchHeroCard}>
                    {/* Header info row */}
                    <View style={styles.nextMatchHeaderRow}>
                      <View style={styles.nextMatchTag}>
                        <Text style={styles.nextMatchTagText}>
                          {nextMatch.stage || 'NEXT SCHEDULED FIXTURE'}
                        </Text>
                      </View>
                      <Text style={styles.nextMatchTimeText}>
                        {nextMatch.dateStr || 'Upcoming'} {nextMatch.time ? `• ${nextMatch.time}` : ''}
                      </Text>
                    </View>

                    {/* Teams Matchup Row */}
                    <View style={styles.nextMatchVersusRow}>
                      <View style={styles.nextMatchTeamBlock}>
                        <TeamIdentityMark team={nextMatch.team1} size={32} />
                        <Text style={styles.nextMatchTeamName} numberOfLines={1}>
                          {nextMatch.team1?.name || nextMatch.team1 || 'Team 1'}
                        </Text>
                      </View>
                      <View style={styles.nextMatchVsCircle}>
                        <Text style={styles.nextMatchVsText}>VS</Text>
                      </View>
                      <View style={styles.nextMatchTeamBlock}>
                        <TeamIdentityMark team={nextMatch.team2} size={32} />
                        <Text style={styles.nextMatchTeamName} numberOfLines={1}>
                          {nextMatch.team2?.name || nextMatch.team2 || 'Team 2'}
                        </Text>
                      </View>
                    </View>

                    {/* Action button */}
                    <TouchableOpacity
                      style={styles.nextMatchScoreBtn}
                      onPress={() => handleStartMatchScoring(nextMatch)}
                      activeOpacity={0.85}
                    >
                      <MaterialCommunityIcons name="cricket" size={16} color="#FFFFFF" />
                      <Text style={styles.nextMatchScoreBtnText}>SCORE MATCH</Text>
                    </TouchableOpacity>
                  </View>
                );
              })() : null}

              {/* Featured Matches Section */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Featured Matches</Text>
                <TouchableOpacity activeOpacity={0.7} onPress={() => handleTabPress('matches', 1)}>
                  <Text style={styles.seeAllText}>All Matches</Text>
                </TouchableOpacity>
              </View>

              {rawMatches.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                  {rawMatches.slice(0, 3).map(m => (
                    <View key={m.id} style={styles.featuredMatchCard}>
                      <Text style={styles.matchDateHeader}>{m.dateStr || 'Upcoming'}</Text>
                      <View style={styles.matchTeamRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                          <TeamIdentityMark team={m.team1} size={20} />
                          <Text style={[styles.teamShortText, { flex: 1 }]} numberOfLines={1}>{m.team1?.name || m.team1 || 'Team 1'}</Text>
                        </View>
                        <Text style={styles.teamScoreText}>{m.team1?.score || 'VS'}</Text>
                      </View>
                      <View style={styles.matchTeamRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                          <TeamIdentityMark team={m.team2} size={20} />
                          <Text style={[styles.teamShortText, { flex: 1 }]} numberOfLines={1}>{m.team2?.name || m.team2 || 'Team 2'}</Text>
                        </View>
                        <Text style={styles.teamScoreText}>{m.team2?.score || ''}</Text>
                      </View>
                      {m.result ? (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => handleViewScorecard(m)}
                        >
                          <Text style={styles.resultBadgeText}>{m.result} • Scorecard ›</Text>
                        </TouchableOpacity>
                      ) : isUserOrganiser ? (
                        <TouchableOpacity
                          style={styles.cardScoreActionBtn}
                          onPress={() => handleStartMatchScoring(m)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.cardScoreActionBtnText}>SCORE THIS MATCH</Text>
                        </TouchableOpacity>
                      ) : m.status === 'LIVE' ? (
                        <TouchableOpacity
                          style={[styles.cardScoreActionBtn, { backgroundColor: '#DC2626' }]}
                          onPress={() => handleWatchLive(m)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.cardScoreActionBtnText}>WATCH LIVE</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.featuredUpcomingBadge}>
                          <Text style={styles.featuredUpcomingBadgeText} numberOfLines={1}>
                            {m.venue || 'Upcoming Match'}
                          </Text>
                        </View>
                      )}
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.emptyCard}>
                  <MaterialCommunityIcons name="calendar-blank-outline" size={28} color={themeColors.textSubtle} />
                  <Text style={styles.emptyCardTitle}>No matches scheduled yet</Text>
                  {isUserOrganiser ? (
                    <TouchableOpacity
                      style={styles.emptyActionBtn}
                      onPress={() => setScheduleModalVisible(true)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.emptyActionBtnText}>Schedule First Match</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              )}

              {/* Key Stats Grid */}
              <View style={[styles.sectionHeaderRow, { marginTop: 14 }]}>
                <Text style={styles.sectionTitle}>Tournament Leaders</Text>
                <TouchableOpacity activeOpacity={0.7} onPress={() => handleTabPress('stats', 4)}>
                  <Text style={styles.seeAllText}>Full Stats</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.spotlightLeadersRow}>
                {/* 1. TOP BATTER CARD (Navy Blue) */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.spotlightCard, styles.batterSpotlightCard]}
                  onPress={() => handleTabPress('stats', 4)}
                >
                  <View style={styles.spotlightAvatarWrap}>
                    <PlayerAvatar name={tournamentLeaders.topBatter.name} size={40} />
                    <View style={[styles.spotlightRankBadge, styles.batterRankBadge]}>
                      <Text style={styles.spotlightRankText}>#1</Text>
                    </View>
                  </View>
                  <Text style={[styles.spotlightPlayerName, { color: '#FFFFFF' }]} numberOfLines={1}>
                    {tournamentLeaders.topBatter.name}
                  </Text>
                  <View style={[styles.spotlightRoleChip, styles.batterRoleChip]}>
                    <Text style={[styles.spotlightRoleText, { color: '#BAE6FD' }]}>BATTER</Text>
                  </View>
                  <View style={[styles.spotlightStatBottom, styles.batterStatBorder]}>
                    <Text style={[styles.spotlightStatPrimary, { color: '#FFFFFF' }]}>
                      {tournamentLeaders.topBatter.runs} <Text style={styles.spotlightStatUnit}>Runs</Text>
                    </Text>
                    <Text style={styles.spotlightStatSecondary} numberOfLines={1}>
                      SR: {tournamentLeaders.topBatter.sr}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* 2. TOP BOWLER CARD (Vibrant Orange) */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.spotlightCard, styles.bowlerSpotlightCard]}
                  onPress={() => handleTabPress('stats', 4)}
                >
                  <View style={styles.spotlightAvatarWrap}>
                    <PlayerAvatar name={tournamentLeaders.topBowler.name} size={40} />
                    <View style={[styles.spotlightRankBadge, styles.bowlerRankBadge]}>
                      <Text style={styles.spotlightRankText}>#1</Text>
                    </View>
                  </View>
                  <Text style={[styles.spotlightPlayerName, { color: '#FFFFFF' }]} numberOfLines={1}>
                    {tournamentLeaders.topBowler.name}
                  </Text>
                  <View style={[styles.spotlightRoleChip, styles.bowlerRoleChip]}>
                    <Text style={[styles.spotlightRoleText, { color: '#FFEDD5' }]}>BOWLER</Text>
                  </View>
                  <View style={[styles.spotlightStatBottom, styles.bowlerStatBorder]}>
                    <Text style={[styles.spotlightStatPrimary, { color: '#FFFFFF' }]}>
                      {tournamentLeaders.topBowler.wickets} <Text style={styles.spotlightStatUnit}>Wkts</Text>
                    </Text>
                    <Text style={styles.spotlightStatSecondary} numberOfLines={1}>
                      Eco: {tournamentLeaders.topBowler.econ}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* 3. TOURNAMENT MVP CARD (Sleek Black) */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.spotlightCard, styles.mvpSpotlightCard]}
                  onPress={() => handleTabPress('stats', 4)}
                >
                  <View style={styles.spotlightAvatarWrap}>
                    <PlayerAvatar name={tournamentLeaders.topMVP.name} size={40} />
                    <View style={[styles.spotlightRankBadge, styles.mvpRankBadge]}>
                      <Text style={styles.spotlightRankText}>#1</Text>
                    </View>
                  </View>
                  <Text style={[styles.spotlightPlayerName, { color: '#FFFFFF' }]} numberOfLines={1}>
                    {tournamentLeaders.topMVP.name}
                  </Text>
                  <View style={[styles.spotlightRoleChip, styles.mvpRoleChip]}>
                    <Text style={[styles.spotlightRoleText, { color: '#E2E8F0' }]}>MVP</Text>
                  </View>
                  <View style={[styles.spotlightStatBottom, styles.mvpStatBorder]}>
                    <Text style={[styles.spotlightStatPrimary, { color: '#FFFFFF' }]}>
                      {tournamentLeaders.topMVP.points} <Text style={styles.spotlightStatUnit}>Pts</Text>
                    </Text>
                    <Text style={styles.spotlightStatSecondary} numberOfLines={1}>
                      {tournamentLeaders.topMVP.matchesCount} Matches
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Embedded Points Table Section */}
              <View style={[styles.sectionHeaderRow, { marginTop: 14 }]}>
                <Text style={styles.sectionTitle}>Points Table Preview</Text>
                <TouchableOpacity activeOpacity={0.7} onPress={() => handleTabPress('pointsTable', 3)}>
                  <Text style={styles.seeAllText}>Full Table</Text>
                </TouchableOpacity>
              </View>

              {pointsTableData.length > 0 ? (
                <View style={styles.embeddedPointsTableCard}>
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.tableColHeader, { flex: 1 }]}>Team</Text>
                    <Text style={[styles.tableColHeader, { width: 24, textAlign: 'center' }]}>P</Text>
                    <Text style={[styles.tableColHeader, { width: 24, textAlign: 'center' }]}>W</Text>
                    <Text style={[styles.tableColHeader, { width: 24, textAlign: 'center' }]}>L</Text>
                    <Text style={[styles.tableColHeader, { width: 45, textAlign: 'right' }]}>NRR</Text>
                    <Text style={[styles.tableColHeader, { width: 30, textAlign: 'center' }]}>Pts</Text>
                  </View>

                  {pointsTableData.slice(0, 4).map((row, idx) => (
                    <View key={row.team} style={[styles.tableDataRow, idx === 0 && styles.qualifierRow]}>
                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <TeamIdentityMark team={{ name: row.team, shortName: row.shortName }} size={18} />
                        <Text style={[styles.tableCell, { flex: 1, fontFamily: systemFontMedium }]} numberOfLines={1}>
                          {row.team}
                        </Text>
                      </View>
                      <Text style={[styles.tableCell, { width: 24, textAlign: 'center' }]}>{row.p}</Text>
                      <Text style={[styles.tableCell, { width: 24, textAlign: 'center' }]}>{row.w}</Text>
                      <Text style={[styles.tableCell, { width: 24, textAlign: 'center' }]}>{row.l}</Text>
                      <Text style={[styles.tableCell, { width: 45, textAlign: 'right', fontFamily: systemFontMedium, color: '#059669' }]}>
                        {row.nrr}
                      </Text>
                      <Text style={[styles.tableCell, { width: 30, textAlign: 'center', fontFamily: systemFontBold, color: '#D97706' }]}>
                        {row.pts}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyCard}>
                  <MaterialCommunityIcons name="table" size={24} color={themeColors.textSubtle} />
                  <Text style={styles.emptyCardTitle}>Points Table Auto-Initializes with Teams</Text>
                  <Text style={styles.emptyCardSubtitle}>Add teams to begin tracking tournament standings automatically.</Text>
                </View>
              )}

            </ScrollView>
          </View>

          {/* ── TAB 2: MATCHES ── */}
          <View key="matches" style={{ flex: 1 }}>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.tabScrollPadding} showsVerticalScrollIndicator={false}>
              
              {/* Organiser Action Buttons */}
              {isUserOrganiser ? (
                <View style={[styles.matchesActionBar, { flexWrap: 'wrap', gap: 8 }]}>
                  <TouchableOpacity
                    style={styles.primaryActionBtn}
                    onPress={() => handleStartMatchScoring()}
                    activeOpacity={0.85}
                  >
                    <MaterialCommunityIcons name="cricket" size={18} color="#FFFFFF" />
                    <Text style={styles.primaryActionBtnText}>START A MATCH</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.outlineActionBtn, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}
                    onPress={() => setAutoFixturesModalVisible(true)}
                    activeOpacity={0.85}
                  >
                    <MaterialCommunityIcons name="lightning-bolt" size={16} color="#16A34A" />
                    <Text style={[styles.outlineActionBtnText, { color: '#16A34A' }]}>Auto Schedule</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.outlineActionBtn}
                    onPress={() => setScheduleModalVisible(true)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="calendar-outline" size={16} color={themeColors.primary} />
                    <Text style={styles.outlineActionBtnText}>Manual Match</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {/* Sub-Filters: All | Live | Upcoming | Finished */}
              <View style={styles.matchSubFilterRow}>
                {['ALL', 'LIVE', 'UPCOMING', 'FINISHED'].map(f => {
                  const isSel = matchSubFilter === f;
                  return (
                    <TouchableOpacity
                      key={f}
                      style={[styles.subFilterPill, isSel && styles.subFilterPillActive]}
                      onPress={() => setMatchSubFilter(f)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.subFilterPillText, isSel && styles.subFilterPillTextActive]}>{f}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {filteredMatches.length > 0 ? (
                filteredMatches.map((item, idx) => (
                  <View key={item.id || idx} style={styles.dateMatchCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={{ backgroundColor: '#18181B', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                          <Text style={{ color: '#FFFFFF', fontSize: 9.5, fontFamily: systemFontBold }}>
                            {getCleanMatchStageBadge(item.stage, item.matchNumber || item.matchNo || idx + 1)}
                          </Text>
                        </View>
                        <Text style={styles.groupDateTitle}>
                          {item.dateStr || item.date || 'Upcoming Match'} {item.time ? `• ${item.time}` : ''}
                        </Text>
                      </View>
                      {item.status === 'LIVE' ? (
                        <View style={styles.liveTagBadge}>
                          <View style={styles.liveDot} />
                          <Text style={styles.liveTagText}>LIVE</Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.matchTeamsRow}>
                      <View style={{ flex: 1, gap: 6 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <TeamIdentityMark team={item.team1} size={22} />
                          <Text style={styles.matchTeamTitle} numberOfLines={1}>{item.team1?.name || item.team1 || 'Team 1'}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <TeamIdentityMark team={item.team2} size={22} />
                          <Text style={styles.matchTeamTitle} numberOfLines={1}>{item.team2?.name || item.team2 || 'Team 2'}</Text>
                        </View>
                      </View>

                      {item.result ? (
                        <TouchableOpacity
                          style={styles.timeTagBadgeFinished}
                          onPress={() => handleViewScorecard(item)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.timeTagTextFinished}>SCORECARD ›</Text>
                        </TouchableOpacity>
                      ) : isUserOrganiser ? (
                        <TouchableOpacity
                          style={styles.timeTagBadge}
                          onPress={() => handleStartMatchScoring(item)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.timeTagText}>SCORE MATCH</Text>
                        </TouchableOpacity>
                      ) : item.status === 'LIVE' ? (
                        <TouchableOpacity
                          style={[styles.timeTagBadge, { backgroundColor: '#DC2626' }]}
                          onPress={() => handleWatchLive(item)}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.timeTagText, { color: '#FFFFFF' }]}>WATCH LIVE</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.timeTagBadgeUpcoming}>
                          <Text style={styles.timeTagUpcomingText}>{item.venue || 'Upcoming'}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyCard}>
                  <MaterialCommunityIcons name="cricket" size={32} color={themeColors.textSubtle} />
                  <Text style={styles.emptyCardTitle}>No matches in {matchSubFilter.toLowerCase()}</Text>
                  <Text style={styles.emptyCardSubtitle}>Use Start A Match to begin live scoring on the ground.</Text>
                </View>
              )}
            </ScrollView>
          </View>

          {/* ── TAB 3: TEAMS ── */}
          <View key="teams" style={{ flex: 1 }}>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.tabScrollPadding} showsVerticalScrollIndicator={false}>
              
              {/* Organiser Invite / Add Header Card */}
              {isUserOrganiser ? (
                tournament.teams && tournament.teams.length >= 2 ? (
                  <View style={styles.compactTeamActionsBar}>
                    <TouchableOpacity
                      style={styles.compactInviteBtn}
                      onPress={handleShareInvite}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="logo-whatsapp" size={16} color="#16A34A" />
                      <Text style={styles.compactInviteBtnText}>Invite Captains</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.compactAddBtn}
                      onPress={() => setAddTeamModalVisible(true)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="add-circle-outline" size={16} color={themeColors.primary} />
                      <Text style={styles.compactAddBtnText}>Add Team</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.inviteCaptainCard}>
                    <Text style={styles.inviteCardTitle}>Invite Captains to Add Teams</Text>
                    <Text style={styles.inviteCardSub}>
                      Save time! Share this link with captains, and they will register their team and squads.
                    </Text>

                    <TouchableOpacity
                      style={styles.shareCaptainBtn}
                      onPress={handleShareInvite}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.shareCaptainBtnText}>SHARE WITH CAPTAINS</Text>
                    </TouchableOpacity>

                    <View style={styles.orDividerRow}>
                      <View style={styles.orLine} />
                      <Text style={styles.orText}>OR</Text>
                      <View style={styles.orLine} />
                    </View>

                    <TouchableOpacity
                      style={styles.addManualBtn}
                      onPress={() => setAddTeamModalVisible(true)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.addManualBtnText}>+ ADD TEAM MANUALLY</Text>
                    </TouchableOpacity>
                  </View>
                )
              ) : null}

              <Text style={[styles.sectionTitle, { marginTop: 12 }]}>
                Participating Teams ({tournament.teams?.length || 0})
              </Text>

              {(tournament.teams && tournament.teams.length > 0) ? (
                tournament.teams.map((team, idx) => (
                  <TouchableOpacity
                    key={team.id || idx}
                    style={styles.teamRowCard}
                    activeOpacity={0.7}
                    onPress={() => setSelectedTeamDrawer(team)}
                  >
                    <TeamIdentityMark team={team} size={38} style={{ borderRadius: 8 }} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.teamRowName}>{team.name}</Text>
                      <Text style={styles.teamRowSub}>
                        {team.count || `${(team.players || team.squad || []).length} Players`} {team.captainName || team.captain ? `• Capt: ${team.captainName || team.captain}` : ''}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={themeColors.textSubtle} />
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyCard}>
                  <Ionicons name="people-outline" size={32} color={themeColors.textSubtle} />
                  <Text style={styles.emptyCardTitle}>No teams added yet</Text>
                  <Text style={styles.emptyCardSubtitle}>Add teams manually or share the invite link with captains.</Text>
                </View>
              )}
            </ScrollView>
          </View>

          {/* ── TAB 4: POINTS TABLE ── */}
          <View key="pointsTable" style={{ flex: 1 }}>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.tabScrollPadding} showsVerticalScrollIndicator={false}>
              
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Points Table (Auto-Calculated)</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.toggleLabelText}>Team Form</Text>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setTeamFormEnabled(!teamFormEnabled)}
                    style={[styles.toggleSwitchTrack, teamFormEnabled && styles.toggleSwitchTrackActive]}
                  >
                    <View style={[styles.toggleSwitchThumb, teamFormEnabled && styles.toggleSwitchThumbActive]} />
                  </TouchableOpacity>
                </View>
              </View>

              {pointsTableData.length > 0 ? (
                <View style={styles.sectionCard}>
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.tableColHeader, { flex: 1 }]}>Team</Text>
                    <Text style={[styles.tableColHeader, { width: 24, textAlign: 'center' }]}>P</Text>
                    <Text style={[styles.tableColHeader, { width: 24, textAlign: 'center' }]}>W</Text>
                    <Text style={[styles.tableColHeader, { width: 24, textAlign: 'center' }]}>L</Text>
                    <Text style={[styles.tableColHeader, { width: 24, textAlign: 'center' }]}>NR</Text>
                    <Text style={[styles.tableColHeader, { width: 55, textAlign: 'right' }]}>NRR</Text>
                    <Text style={[styles.tableColHeader, { width: 30, textAlign: 'center' }]}>Pts</Text>
                  </View>

                  {pointsTableData.map((row, idx) => (
                    <View key={row.team} style={[styles.tableDataRow, idx === 0 && styles.qualifierRow]}>
                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <TeamIdentityMark team={{ name: row.team, shortName: row.shortName }} size={22} />
                        <Text style={[styles.tableCell, { flex: 1, fontFamily: systemFontMedium, color: themeColors.textPrimary }]} numberOfLines={1}>
                          {row.team}
                        </Text>
                        {teamFormEnabled && row.form ? (
                          <View style={{ flexDirection: 'row', gap: 2 }}>
                            {row.form.map((f, fIdx) => (
                              <View
                                key={fIdx}
                                style={[
                                  styles.formBadgeCircle,
                                  { backgroundColor: f === 'W' ? '#16A34A' : '#DC2626' }
                                ]}
                              >
                                <Text style={styles.formBadgeText}>{f}</Text>
                              </View>
                            ))}
                          </View>
                        ) : null}
                      </View>
                      <Text style={[styles.tableCell, { width: 24, textAlign: 'center' }]}>{row.p}</Text>
                      <Text style={[styles.tableCell, { width: 24, textAlign: 'center' }]}>{row.w}</Text>
                      <Text style={[styles.tableCell, { width: 24, textAlign: 'center' }]}>{row.l}</Text>
                      <Text style={[styles.tableCell, { width: 24, textAlign: 'center' }]}>{row.nr}</Text>
                      <Text style={[styles.tableCell, { width: 55, textAlign: 'right', fontFamily: systemFontMedium, color: '#059669' }]}>
                        {row.nrr}
                      </Text>
                      <Text style={[styles.tableCell, { width: 30, textAlign: 'center', fontFamily: systemFontBold, color: '#D97706' }]}>
                        {row.pts}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyCard}>
                  <MaterialCommunityIcons name="table-large" size={32} color={themeColors.textSubtle} />
                  <Text style={styles.emptyCardTitle}>Points Table Ready</Text>
                  <Text style={styles.emptyCardSubtitle}>
                    Points Table will calculate automatically as teams are added and matches are scored.
                  </Text>
                </View>
              )}

              {/* Glossary Section */}
              <View style={[styles.sectionHeaderRow, { marginTop: 14 }]}>
                <Text style={styles.glossarySectionHeaderTitle}>Glossary</Text>
              </View>

              <View style={styles.glossaryTwoColContainer}>
                <View style={styles.glossaryCol}>
                  <View style={styles.glossaryRowItem}>
                    <Text style={styles.glossaryKeyBold}>P:</Text>
                    <Text style={styles.glossaryValMuted}> Matches Played</Text>
                  </View>
                  <View style={styles.glossaryRowItem}>
                    <Text style={styles.glossaryKeyBold}>W:</Text>
                    <Text style={styles.glossaryValMuted}> Matches Won (+2 pts)</Text>
                  </View>
                  <View style={styles.glossaryRowItem}>
                    <Text style={styles.glossaryKeyBold}>L:</Text>
                    <Text style={styles.glossaryValMuted}> Matches Lost (0 pts)</Text>
                  </View>
                </View>

                <View style={styles.glossaryCol}>
                  <View style={styles.glossaryRowItem}>
                    <Text style={styles.glossaryKeyBold}>NRR:</Text>
                    <Text style={styles.glossaryValMuted}> Net Run Rate</Text>
                  </View>
                  <View style={styles.glossaryRowItem}>
                    <Text style={styles.glossaryKeyBold}>NR:</Text>
                    <Text style={styles.glossaryValMuted}> No Result (+1 pt)</Text>
                  </View>
                  <View style={styles.glossaryRowItem}>
                    <Text style={styles.glossaryKeyBold}>Pts:</Text>
                    <Text style={styles.glossaryValMuted}> Total Points</Text>
                  </View>
                </View>
              </View>

            </ScrollView>
          </View>

          {/* ── TAB 5: STATS ── */}
          <View key="stats" style={{ flex: 1 }}>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.tabScrollPadding} showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionTitle}>Batting Leaders</Text>
              {keyStatsGrid.slice(2, 4).map(st => (
                <View key={st.label} style={styles.statsLeaderRow}>
                  <PlayerAvatar name={st.player} size={32} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.leaderStatCategory}>{st.label}</Text>
                    <Text style={styles.leaderStatName}>{st.player}</Text>
                  </View>
                  <Text style={styles.leaderStatVal}>{st.val}</Text>
                </View>
              ))}

              <Text style={[styles.sectionTitle, { marginTop: 14 }]}>Bowling Leaders</Text>
              {keyStatsGrid.slice(0, 2).map(st => (
                <View key={st.label} style={styles.statsLeaderRow}>
                  <PlayerAvatar name={st.player} size={32} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.leaderStatCategory}>{st.label}</Text>
                    <Text style={styles.leaderStatName}>{st.player}</Text>
                  </View>
                  <Text style={styles.leaderStatVal}>{st.val}</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* ── TAB 6: VENUES ── */}
          <View key="venues" style={{ flex: 1 }}>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.tabScrollPadding} showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionTitle}>Tournament Grounds</Text>
              <View style={styles.sectionCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 }}>
                  <MaterialCommunityIcons name="stadium-variant" size={24} color={themeColors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.venueTitle}>{tournament.city || 'Sadokan Cricket Ground'}</Text>
                    <Text style={styles.venueSub}>{tournament.pitchType || 'Turf'} Pitch • Day & Night</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>

          {/* ── TAB 7: NEWS ── */}
          <View key="news" style={{ flex: 1 }}>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.tabScrollPadding} showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionTitle}>Tournament Updates</Text>
              <View style={styles.sectionCard}>
                <View style={{ padding: 14, gap: 6 }}>
                  <Text style={styles.newsHeadlineTitle}>{tournament.name || tournament.title} launched on CricFlow</Text>
                  <Text style={styles.newsDateText}>{tournament.startDate || 'Season 2026'} • Ground Bulletin</Text>
                </View>
              </View>
            </ScrollView>
          </View>

          {/* ── TAB 8: INFO ── */}
          <View key="info" style={{ flex: 1 }}>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.tabScrollPadding} showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionTitle}>Tournament Specifications</Text>
              <View style={styles.seriesInfoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Tournament</Text>
                  <Text style={styles.infoVal}>{tournament.fullName || tournament.name || tournament.title}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Location</Text>
                  <Text style={styles.infoVal}>{tournament.city || tournament.host || 'Local Ground'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Format</Text>
                  <Text style={styles.infoVal}>{tournament.format || 'Limited Overs'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Ball Type</Text>
                  <Text style={styles.infoVal}>{tournament.ballType || 'Tennis Red'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Pitch</Text>
                  <Text style={styles.infoVal}>{tournament.pitchType || 'Turf'}</Text>
                </View>
                {tournament.organiserName ? (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Organiser</Text>
                    <Text style={styles.infoVal}>{tournament.organiserName}</Text>
                  </View>
                ) : null}
              </View>
            </ScrollView>
          </View>

        </PagerView>

        {/* ── MODAL 1: SMART ADD TEAM HUB ── */}
        <AddTeamHubModal
          visible={addTeamModalVisible}
          onClose={() => setAddTeamModalVisible(false)}
          tournament={tournament}
          onAddTeam={handleAddTeamSubmit}
        />

        {/* ── MODAL 2: SCHEDULE FIXTURE ── */}
        <Modal
          visible={scheduleModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setScheduleModalVisible(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setScheduleModalVisible(false)}>
            <Pressable style={styles.modalContent} onPress={() => {}}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Schedule Match Fixture</Text>
                <TouchableOpacity onPress={() => setScheduleModalVisible(false)}>
                  <Ionicons name="close" size={24} color={themeColors.textPrimary} />
                </TouchableOpacity>
              </View>

              {(tournament.teams && tournament.teams.length >= 2) ? (
                <>
                  <Text style={styles.inputLabel}>Select Team 1</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginVertical: 6 }}>
                    {tournament.teams.map(t => (
                      <TouchableOpacity
                        key={`t1-${t.id || t.name}`}
                        style={[styles.teamSelectPill, schedTeam1 === t.name && styles.teamSelectPillActive]}
                        onPress={() => setSchedTeam1(t.name)}
                      >
                        <Text style={[styles.teamSelectPillText, schedTeam1 === t.name && styles.teamSelectPillTextActive]}>{t.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <Text style={[styles.inputLabel, { marginTop: 10 }]}>Select Team 2</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginVertical: 6 }}>
                    {tournament.teams.map(t => (
                      <TouchableOpacity
                        key={`t2-${t.id || t.name}`}
                        style={[styles.teamSelectPill, schedTeam2 === t.name && styles.teamSelectPillActive]}
                        onPress={() => setSchedTeam2(t.name)}
                      >
                        <Text style={[styles.teamSelectPillText, schedTeam2 === t.name && styles.teamSelectPillTextActive]}>{t.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <View style={[styles.inputGroup, { marginTop: 10 }]}>
                    <Text style={styles.inputLabel}>Match Date & Time</Text>
                    <TextInput
                      style={styles.modalTextInput}
                      value={schedDateStr}
                      onChangeText={setSchedDateStr}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.modalSubmitBtn}
                    onPress={handleScheduleSubmit}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.modalSubmitBtnText}>CONFIRM & SAVE FIXTURE</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={{ paddingVertical: 14, alignItems: 'center', gap: 8 }}>
                  <Text style={styles.emptyCardSubtitle}>Please add at least 2 teams before creating fixtures.</Text>
                  <TouchableOpacity
                    style={styles.modalSubmitBtn}
                    onPress={() => {
                      setScheduleModalVisible(false);
                      setAddTeamModalVisible(true);
                    }}
                  >
                    <Text style={styles.modalSubmitBtnText}>+ Add Teams First</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Pressable>
          </Pressable>
        </Modal>

        {/* ── MODAL 3: SQUAD DETAILS DRAWER ── */}
        <Modal
          visible={Boolean(selectedTeamDrawer)}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSelectedTeamDrawer(null)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setSelectedTeamDrawer(null)}>
            <Pressable style={styles.modalContent} onPress={() => {}}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TeamIdentityMark team={selectedTeamDrawer} size={28} style={{ borderRadius: 6 }} />
                  <Text style={styles.modalTitle}>{selectedTeamDrawer?.name} Squad</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedTeamDrawer(null)}>
                  <Ionicons name="close" size={24} color={themeColors.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                {squadPlayers.length > 0 ? (
                  squadPlayers.map((player, pIdx) => {
                    return (
                      <View key={player.id || pIdx} style={styles.squadPlayerRow}>
                        <PlayerAvatar name={player.name} size={34} />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.squadPlayerName}>{player.name}</Text>
                            {player.isCaptain ? (
                              <View style={{ backgroundColor: '#18181B', paddingHorizontal: 5, paddingVertical: 1.5, borderRadius: 4 }}>
                                <Text style={{ fontSize: 9, color: '#FFFFFF', fontFamily: systemFontBold }}>C</Text>
                              </View>
                            ) : null}
                            {player.isWicketKeeper ? (
                              <View style={{ backgroundColor: '#0284C7', paddingHorizontal: 5, paddingVertical: 1.5, borderRadius: 4 }}>
                                <Text style={{ fontSize: 9, color: '#FFFFFF', fontFamily: systemFontBold }}>WK</Text>
                              </View>
                            ) : null}
                          </View>
                          <Text style={styles.squadPlayerRole}>{player.role}</Text>
                        </View>
                        {player.runs != null || player.wickets != null ? (
                          <Text style={styles.squadPlayerStat}>
                            {player.runs != null ? `${player.runs} Runs` : `${player.wickets} Wkts`}
                          </Text>
                        ) : null}
                      </View>
                    );
                  })
                ) : (
                  <View style={{ paddingVertical: 24, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="people-outline" size={32} color={themeColors.textSubtle} />
                    <Text style={{ fontSize: 13, fontFamily: systemFont, color: themeColors.textSecondary, marginTop: 8 }}>
                      No squad players registered yet
                    </Text>
                  </View>
                )}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>

        {/* ── MODAL 4: SELECT SERIES BOTTOM SHEET DRAWER (CREX STYLE) ── */}
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
              {/* Top Drag Handle */}
              <View style={styles.sheetHandle} />

              {/* Sheet Header */}
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
                            {item.logoUri || item.bannerUri ? (
                              <Image source={{ uri: item.logoUri || item.bannerUri }} style={styles.sheetItemLogo} />
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
                          {item.logoUri || item.bannerUri ? (
                            <Image source={{ uri: item.logoUri || item.bannerUri }} style={styles.sheetItemLogo} />
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

        {/* ── MODAL 5: AUTO GENERATE FIXTURES MODAL ── */}
        <AutoGenerateFixturesModal
          visible={autoFixturesModalVisible}
          onClose={() => setAutoFixturesModalVisible(false)}
          tournament={tournament}
          onSaveFixtures={handleSaveAutoFixtures}
        />

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
    gap: 12,
    paddingVertical: 10
  },
  carouselCard: {
    width: 120,
    height: 132,
    borderRadius: 12,
    backgroundColor: '#18181B',
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: themeColors.border,
    position: 'relative'
  },
  carouselCardSelected: {
    borderColor: '#0284C7',
    borderWidth: 1.5
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
    marginTop: 6
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5
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
    backgroundColor: themeColors.primary
  },
  tabScrollPadding: {
    padding: 16,
    paddingBottom: 40,
    gap: 12
  },
  heroIdentityCard: {
    backgroundColor: themeColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: themeColors.border,
    overflow: 'hidden'
  },
  heroBodyPadding: {
    padding: 16,
    gap: 10
  },
  heroLogoWrap: {
    alignSelf: 'center'
  },
  heroLogoFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    alignItems: 'center',
    justifyContent: 'center'
  },
  heroLogoImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: themeColors.border,
    backgroundColor: themeColors.surface,
    resizeMode: 'cover'
  },
  categoryChip: {
    backgroundColor: themeColors.surfaceOffWhite,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: themeColors.border
  },
  categoryChipText: {
    fontSize: 10,
    fontFamily: systemFontBold,
    color: themeColors.primary
  },
  durationBadgeText: {
    fontSize: 11,
    fontFamily: systemFont,
    color: themeColors.textMuted
  },
  heroTournamentName: {
    fontSize: 18,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  heroTournamentMeta: {
    fontSize: 12,
    fontFamily: systemFont,
    color: themeColors.textSecondary
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6
  },
  quickActionBtnPrimary: {
    flex: 1.2,
    backgroundColor: '#18181B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: 8
  },
  quickActionBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: systemFontBold
  },
  quickActionBtnOutline: {
    flex: 1,
    backgroundColor: themeColors.surfaceOffWhite,
    borderWidth: 1,
    borderColor: themeColors.borderDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 38,
    borderRadius: 8
  },
  quickActionBtnOutlineText: {
    color: themeColors.textPrimary,
    fontSize: 12,
    fontFamily: systemFontMedium
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  seeAllText: {
    fontSize: 12,
    fontFamily: systemFontMedium,
    color: themeColors.primary
  },
  featuredMatchCard: {
    width: 220,
    backgroundColor: themeColors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: themeColors.border,
    gap: 6
  },
  matchDateHeader: {
    fontSize: 10.5,
    fontFamily: systemFontMedium,
    color: themeColors.textMuted
  },
  matchTeamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  teamShortText: {
    fontSize: 13,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  teamScoreText: {
    fontSize: 12.5,
    fontFamily: systemFontMedium,
    color: themeColors.textPrimary
  },
  resultBadgeText: {
    fontSize: 11,
    fontFamily: systemFontMedium,
    color: '#059669',
    marginTop: 4
  },
  cardScoreActionBtn: {
    backgroundColor: '#18181B',
    paddingVertical: 5,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 4
  },
  cardScoreActionBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: systemFontBold
  },
  spotlightLeadersRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6
  },
  spotlightCard: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderWidth: 1,
    alignItems: 'center',
    gap: 5
  },
  batterSpotlightCard: {
    backgroundColor: '#0F2744',
    borderColor: '#1E3A8A'
  },
  batterRankBadge: {
    backgroundColor: '#0284C7'
  },
  batterRoleChip: {
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    borderColor: 'rgba(56, 189, 248, 0.35)'
  },
  batterStatBorder: {
    borderTopColor: 'rgba(255, 255, 255, 0.12)'
  },
  bowlerSpotlightCard: {
    backgroundColor: '#EA580C',
    borderColor: '#C2410C'
  },
  bowlerRankBadge: {
    backgroundColor: '#9A3412'
  },
  bowlerRoleChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderColor: 'rgba(255, 255, 255, 0.4)'
  },
  bowlerStatBorder: {
    borderTopColor: 'rgba(255, 255, 255, 0.2)'
  },
  mvpSpotlightCard: {
    backgroundColor: '#18181B',
    borderColor: '#27272A'
  },
  mvpRankBadge: {
    backgroundColor: '#3F3F46'
  },
  mvpRoleChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'rgba(255, 255, 255, 0.25)'
  },
  mvpStatBorder: {
    borderTopColor: 'rgba(255, 255, 255, 0.12)'
  },
  spotlightAvatarWrap: {
    position: 'relative'
  },
  spotlightRankBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#FFFFFF'
  },
  spotlightRankText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontFamily: systemFontMedium
  },
  spotlightPlayerName: {
    fontSize: 11.5,
    fontFamily: systemFontMedium,
    textAlign: 'center'
  },
  spotlightRoleChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1
  },
  spotlightRoleText: {
    fontSize: 8.5,
    fontFamily: systemFontBold,
    letterSpacing: 0.5
  },
  spotlightStatBottom: {
    width: '100%',
    borderTopWidth: 1,
    paddingTop: 5,
    marginTop: 2,
    alignItems: 'center'
  },
  spotlightStatPrimary: {
    fontSize: 12,
    fontFamily: systemFontBold
  },
  spotlightStatUnit: {
    fontSize: 9.5,
    fontFamily: systemFont
  },
  spotlightStatSecondary: {
    fontSize: 9.5,
    fontFamily: systemFont,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 1
  },
  embeddedPointsTableCard: {
    backgroundColor: themeColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: themeColors.border,
    overflow: 'hidden'
  },
  sectionCard: {
    backgroundColor: themeColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: themeColors.border,
    overflow: 'hidden'
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: themeColors.surfaceOffWhite,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border
  },
  tableColHeader: {
    fontSize: 11,
    fontFamily: systemFontBold,
    color: themeColors.textMuted
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border
  },
  qualifierRow: {
    borderLeftWidth: 3,
    borderLeftColor: '#16A34A'
  },
  tableCell: {
    fontSize: 12,
    fontFamily: systemFont,
    color: themeColors.textPrimary
  },
  formBadgeCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center'
  },
  formBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontFamily: systemFontBold
  },
  toggleLabelText: {
    fontSize: 11,
    fontFamily: systemFont,
    color: themeColors.textMuted
  },
  toggleSwitchTrack: {
    width: 32,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E2E8F0',
    padding: 2
  },
  toggleSwitchTrackActive: {
    backgroundColor: '#18181B'
  },
  toggleSwitchThumb: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF'
  },
  toggleSwitchThumbActive: {
    marginLeft: 14
  },
  matchesActionBar: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4
  },
  primaryActionBtn: {
    flex: 1.2,
    backgroundColor: '#18181B',
    borderRadius: 10,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: systemFontBold
  },
  outlineActionBtn: {
    flex: 1,
    backgroundColor: themeColors.surface,
    borderRadius: 10,
    height: 42,
    borderWidth: 1,
    borderColor: themeColors.borderDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  outlineActionBtnText: {
    color: themeColors.textPrimary,
    fontSize: 12,
    fontFamily: systemFontMedium
  },
  matchSubFilterRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 4
  },
  subFilterPill: {
    backgroundColor: themeColors.surfaceOffWhite,
    borderWidth: 1,
    borderColor: themeColors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  subFilterPillActive: {
    backgroundColor: '#18181B',
    borderColor: '#18181B'
  },
  subFilterPillText: {
    fontSize: 11,
    fontFamily: systemFontMedium,
    color: themeColors.textSecondary
  },
  subFilterPillTextActive: {
    color: '#FFFFFF',
    fontFamily: systemFontBold
  },
  dateMatchCard: {
    backgroundColor: themeColors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: themeColors.border
  },
  groupDateTitle: {
    fontSize: 11,
    fontFamily: systemFontMedium,
    color: themeColors.textMuted
  },
  liveTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFE4E6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E11D48'
  },
  liveTagText: {
    fontSize: 9,
    fontFamily: systemFontBold,
    color: '#E11D48'
  },
  matchTeamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  matchTeamTitle: {
    fontSize: 14,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  finishedResultText: {
    fontSize: 12,
    fontFamily: systemFontMedium,
    color: '#059669'
  },
  timeTagBadge: {
    backgroundColor: '#18181B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6
  },
  timeTagText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontFamily: systemFontBold
  },
  compactTeamActionsBar: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: themeColors.surface,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: themeColors.border,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  compactInviteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0'
  },
  compactInviteBtnText: {
    color: '#16A34A',
    fontSize: 12,
    fontFamily: systemFontBold
  },
  compactAddBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    backgroundColor: themeColors.surfaceOffWhite,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: themeColors.borderDark
  },
  compactAddBtnText: {
    color: themeColors.textPrimary,
    fontSize: 12,
    fontFamily: systemFontBold
  },
  nextMatchHeroCard: {
    backgroundColor: themeColors.surface,
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: themeColors.border,
    marginBottom: 4
  },
  nextMatchHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
    paddingBottom: 8
  },
  nextMatchTag: {
    backgroundColor: themeColors.surfaceOffWhite,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: themeColors.border
  },
  nextMatchTagText: {
    color: themeColors.textSecondary,
    fontSize: 10.5,
    fontFamily: systemFontBold,
    letterSpacing: 0.3
  },
  nextMatchTimeText: {
    color: themeColors.textMuted,
    fontSize: 11,
    fontFamily: systemFontMedium
  },
  nextMatchVersusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  nextMatchTeamBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 6
  },
  nextMatchTeamName: {
    color: themeColors.textPrimary,
    fontSize: 12.5,
    fontFamily: systemFontMedium,
    textAlign: 'center'
  },
  nextMatchVsCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: themeColors.surfaceOffWhite,
    borderWidth: 1,
    borderColor: themeColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8
  },
  nextMatchVsText: {
    color: themeColors.textMuted,
    fontSize: 10,
    fontFamily: systemFontBold
  },
  nextMatchScoreBtn: {
    backgroundColor: '#18181B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: 8
  },
  nextMatchScoreBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: systemFontBold,
    letterSpacing: 0.3
  },
  inviteCaptainCard: {
    backgroundColor: themeColors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: themeColors.border,
    alignItems: 'center',
    gap: 8
  },
  inviteCardTitle: {
    fontSize: 15,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary,
    textAlign: 'center'
  },
  inviteCardSub: {
    fontSize: 11.5,
    fontFamily: systemFont,
    color: themeColors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 10
  },
  shareCaptainBtn: {
    width: '100%',
    height: 44,
    backgroundColor: '#0F766E',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4
  },
  shareCaptainBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontFamily: systemFontBold,
    letterSpacing: 0.2
  },
  orDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 10,
    marginVertical: 4
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: themeColors.border
  },
  orText: {
    fontSize: 10,
    fontFamily: systemFontBold,
    color: themeColors.textSubtle
  },
  addManualBtn: {
    width: '100%',
    height: 42,
    backgroundColor: themeColors.surface,
    borderWidth: 1,
    borderColor: '#0F766E',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  addManualBtnText: {
    color: '#0F766E',
    fontSize: 12.5,
    fontFamily: systemFontBold
  },
  teamRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: themeColors.border,
    gap: 12
  },
  teamIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  teamRowName: {
    fontSize: 13.5,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  teamRowSub: {
    fontSize: 11,
    fontFamily: systemFont,
    color: themeColors.textMuted
  },
  emptyCard: {
    backgroundColor: themeColors.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: themeColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  emptyCardTitle: {
    fontSize: 13,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  emptyCardSubtitle: {
    fontSize: 11,
    fontFamily: systemFont,
    color: themeColors.textMuted,
    textAlign: 'center'
  },
  emptyActionBtn: {
    backgroundColor: '#18181B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontFamily: systemFontBold
  },
  glossarySectionHeaderTitle: {
    fontSize: 13,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  glossaryTwoColContainer: {
    flexDirection: 'row',
    backgroundColor: themeColors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: themeColors.border
  },
  glossaryCol: {
    flex: 1,
    gap: 6
  },
  glossaryRowItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  glossaryKeyBold: {
    fontSize: 11,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  glossaryValMuted: {
    fontSize: 11,
    fontFamily: systemFont,
    color: themeColors.textMuted
  },
  statsLeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.surface,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: themeColors.border
  },
  leaderStatCategory: {
    fontSize: 10,
    fontFamily: systemFont,
    color: themeColors.textMuted
  },
  leaderStatName: {
    fontSize: 13,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  leaderStatVal: {
    fontSize: 16,
    fontFamily: systemFontBold,
    color: themeColors.primary
  },
  venueTitle: {
    fontSize: 13.5,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  venueSub: {
    fontSize: 11,
    fontFamily: systemFont,
    color: themeColors.textMuted
  },
  newsHeadlineTitle: {
    fontSize: 13.5,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary,
    lineHeight: 18
  },
  newsDateText: {
    fontSize: 11,
    fontFamily: systemFont,
    color: themeColors.textMuted
  },
  seriesInfoCard: {
    backgroundColor: themeColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: themeColors.border,
    padding: 14,
    gap: 10
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: systemFont,
    color: themeColors.textMuted
  },
  infoVal: {
    fontSize: 12,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
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
  // Select Series Bottom Sheet Drawer Styles
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
  featuredUpcomingBadge: {
    backgroundColor: '#F8F8FA',
    borderWidth: 1,
    borderColor: '#EEEEF0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 4
  },
  featuredUpcomingBadgeText: {
    fontSize: 10,
    fontFamily: systemFontMedium,
    color: themeColors.textMuted
  },
  timeTagBadgeFinished: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center'
  },
  timeTagTextFinished: {
    color: '#16A34A',
    fontSize: 10.5,
    fontFamily: systemFontBold
  },
  timeTagBadgeUpcoming: {
    backgroundColor: '#F8F8FA',
    borderWidth: 1,
    borderColor: '#EEEEF0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center'
  },
  timeTagUpcomingText: {
    fontSize: 10,
    fontFamily: systemFontMedium,
    color: themeColors.textMuted
  },
  emptyScreenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 40
  },
  emptyTrophyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20
  },
  emptyScreenTitle: {
    fontSize: 20,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary,
    marginBottom: 8,
    textAlign: 'center'
  },
  emptyScreenSubtitle: {
    fontSize: 13,
    fontFamily: systemFont,
    color: themeColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 26,
    maxWidth: 320
  },
  hostFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#18181B',
    paddingHorizontal: 22,
    height: 48,
    borderRadius: 12
  },
  hostFirstBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: systemFontBold,
    letterSpacing: 0.4
  }
});

export default PublicSeriesViewScreen;
