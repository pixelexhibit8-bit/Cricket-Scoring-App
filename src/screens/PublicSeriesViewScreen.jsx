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
import { calculateTournamentStats } from '../services/tournamentStatsEngine.js';
import { navigate } from '../navigation/navigationService.js';
import { AddTeamHubModal } from '../components/modals/AddTeamHubModal.jsx';
import { AutoGenerateFixturesModal } from '../components/modals/AutoGenerateFixturesModal.jsx';
import { getCurrentUser } from '../services/authService.js';
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

  // Tournaments List & Hosted State
  const [tournamentsList, setTournamentsList] = useState([]);
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

  // Modals for Organiser Actions
  const [addTeamModalVisible, setAddTeamModalVisible] = useState(false);
  const [autoFixturesModalVisible, setAutoFixturesModalVisible] = useState(false);
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [schedTeam1, setSchedTeam1] = useState('');
  const [schedTeam2, setSchedTeam2] = useState('');
  const [schedDateStr, setSchedDateStr] = useState('Tomorrow • 07:30 PM');

  // Load tournaments data
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

  // Smart Organiser Detection
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
    return filteredSheetTournaments.filter(t => {
      const matchPhone = currentUser.phone && t.organiserPhone && String(t.organiserPhone).trim() === String(currentUser.phone).trim();
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

  // Watch Live
  const handleWatchLive = (match = null) => {
    if (navigation) {
      navigation.navigate('PublicLiveView', {
        matchId: match?.id,
        tournamentId: tournament.id,
        matchData: match
      });
    }
  };

  // Finished Scorecard
  const handleViewScorecard = (match = null) => {
    if (navigation) {
      navigation.navigate('FinishedMatchView', {
        matchId: match?.id,
        tournamentId: tournament.id,
        matchData: match
      });
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

  // Auto Fixtures Save
  const handleSaveAutoFixtures = async (generatedFixtures) => {
    if (!tournament?.id || !Array.isArray(generatedFixtures)) return;
    const updated = await saveTournamentFixtures(tournament.id, generatedFixtures);
    if (updated) {
      setTournament(updated);
    }
  };

  // Schedule Match Submission
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
        matches: [...(prev?.matches || []), { id: `m_${Date.now()}`, ...matchData }]
      }));
    }

    setScheduleModalVisible(false);
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
            <View style={styles.organiserPill}>
              <MaterialCommunityIcons name="shield-crown-outline" size={13} color="#FFFFFF" />
              <Text style={styles.organiserPillText}>Host</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.shareHeaderBtn}
              activeOpacity={0.7}
              accessibilityLabel="Notifications"
            >
              <Ionicons name="notifications-outline" size={22} color={themeColors.textPrimary} />
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
              onOpenManualSchedule={() => setScheduleModalVisible(true)}
            />
          </View>

          {/* TAB 3: TEAMS */}
          <View key="teams" style={{ flex: 1 }}>
            <TournamentTeamsTab
              tournament={tournament}
              onSelectTeam={(team) => setSelectedTeamDrawer(team)}
              onAddTeam={() => setAddTeamModalVisible(true)}
              onShareInvite={handleShareInvite}
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
        />

        {/* ── MODAL 2: AUTO GENERATE FIXTURES MODAL ── */}
        <AutoGenerateFixturesModal
          visible={autoFixturesModalVisible}
          onClose={() => setAutoFixturesModalVisible(false)}
          tournament={tournament}
          onSaveFixtures={handleSaveAutoFixtures}
        />

        {/* ── MODAL 3: SCHEDULE FIXTURE MODAL ── */}
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
                  <Text style={styles.emptySubtitle}>Please add at least 2 teams before creating fixtures.</Text>
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

        {/* ── MODAL 4: SQUAD DETAILS DRAWER ── */}
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
                  <TeamIdentityMark team={selectedTeamDrawer} size={28} />
                  <Text style={styles.modalTitle}>{selectedTeamDrawer?.name} Squad</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedTeamDrawer(null)}>
                  <Ionicons name="close" size={24} color={themeColors.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
                {squadPlayers.length > 0 ? (
                  squadPlayers.map((player, pIdx) => {
                    return (
                      <View key={player.id || pIdx} style={styles.squadPlayerRow}>
                        <PlayerAvatar name={player.name} size={34} />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.squadPlayerName}>{player.name}</Text>
                            {player.isCaptain ? (
                              <View style={styles.captainBadge}>
                                <Text style={styles.captainBadgeText}>C</Text>
                              </View>
                            ) : null}
                            {player.isWicketKeeper ? (
                              <View style={styles.wkBadge}>
                                <Text style={styles.wkBadgeText}>WK</Text>
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
                    <Ionicons name="people-outline" size={32} color="#94A3B8" />
                    <Text style={{ fontSize: 13, fontFamily: systemFont, color: themeColors.textSecondary, marginTop: 8 }}>
                      No squad players registered yet
                    </Text>
                  </View>
                )}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>

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
  }
});

export default PublicSeriesViewScreen;
