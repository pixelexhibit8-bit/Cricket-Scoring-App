import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
  Modal,
  useWindowDimensions,
  Pressable,
  Share,
  Alert
} from 'react-native';
import PagerView from 'react-native-pager-view';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  themeColors,
  systemFont,
  systemFontMedium,
  systemFontBold
} from '../theme.js';
import { PlayerAvatar } from '../components/PlayerAvatar.jsx';
import {
  getTournaments,
  addTeamToTournament,
  addMatchToTournament,
  autoCalculatePointsTable
} from '../services/tournamentService.js';
import { navigate } from '../navigation/navigationService.js';
import { AddTeamHubModal } from '../components/modals/AddTeamHubModal.jsx';

export function PublicSeriesViewScreen({ navigation, onBack, seriesData, isOrganiser = false, isTab = false }) {
  const { width: windowWidth } = useWindowDimensions();
  const pagerRef = useRef(null);

  // Tournament Data State
  const [tournament, setTournament] = useState(() => {
    return seriesData || {
      id: 'local_series',
      title: 'Ground Tournament',
      fullName: 'Local Cricket Tournament',
      city: 'Local Ground',
      duration: 'Ongoing',
      format: 'Limited Overs',
      category: 'OPEN',
      ballType: 'tennis_red',
      pitchType: 'TURF',
      teams: [],
      matches: []
    };
  });

  // Keep state in sync if props change or load latest tournament from storage
  useEffect(() => {
    if (seriesData) {
      setTournament(prev => ({
        ...prev,
        ...seriesData,
        teams: (seriesData.teams && seriesData.teams.length > 0) ? seriesData.teams : (prev.teams || []),
        matches: (seriesData.matches && seriesData.matches.length > 0) ? seriesData.matches : (prev.matches || [])
      }));
    } else {
      getTournaments().then(list => {
        if (list && list.length > 0) {
          const latest = list[0];
          setTournament(prev => ({
            ...prev,
            ...latest,
            teams: (latest.teams && latest.teams.length > 0) ? latest.teams : (prev.teams || []),
            matches: (latest.matches && latest.matches.length > 0) ? latest.matches : (prev.matches || [])
          }));
        }
      }).catch(() => {});
    }
  }, [seriesData]);

  const isUserOrganiser = isOrganiser || Boolean(seriesData?.isOrganiser) || Boolean(tournament?.isOrganiser);

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
  const [schedTeam1, setSchedTeam1] = useState('');
  const [schedTeam2, setSchedTeam2] = useState('');
  const [schedDateStr, setSchedDateStr] = useState('Tomorrow • 09:00 AM');

  // Auto-calculated Points Table Data
  const pointsTableData = useMemo(() => {
    const teams = tournament.teams || [];
    const matches = tournament.matches || [];
    if (teams.length === 0) return [];
    return autoCalculatePointsTable(teams, matches);
  }, [tournament.teams, tournament.matches]);

  // Squad Players for Bottom Sheet Drawer
  const mockSquadPlayers = [
    { id: 'p_1', name: 'Shivi Sharma', role: 'Batter (Capt)', runs: 128, sr: 144.2 },
    { id: 'p_2', name: 'Nazma Sultana', role: 'Bowler', wickets: 4, econ: 5.38 },
    { id: 'p_3', name: 'Apeksha Anand', role: 'All-Rounder', runs: 64, wickets: 2 },
    { id: 'p_4', name: 'Sumiti Soni', role: 'Bowler', wickets: 3, econ: 6.10 },
    { id: 'p_5', name: 'Tanisha Singh', role: 'Batter', runs: 82, sr: 138.4 },
    { id: 'p_6', name: 'Nidhi Mahto', role: 'Wicket-Keeper', runs: 45, sr: 125.0 }
  ];

  // Key Stats
  const keyStatsTop = {
    label: 'Most Runs',
    player: 'Shivi Sharma',
    fullName: 'Shivi Sharma',
    team: tournament.teams?.[0]?.name || 'Top Batter',
    val: '184',
    unit: 'runs',
    color: '#FFF1F2',
    borderColor: '#FFE4E6'
  };

  const keyStatsGrid = [
    { label: 'Most Wickets', player: 'Nazma Sultana', team: tournament.teams?.[1]?.name || 'Top Bowler', val: '8', unit: 'wickets', color: '#FFF1F2', borderColor: '#FFE4E6' },
    { label: 'Best Bowling', player: 'Sumiti Soni', team: tournament.teams?.[2]?.name || 'Bowler', val: '4-12', unit: '', color: '#F0FDF4', borderColor: '#DCFCE7' },
    { label: 'Highest Score', player: 'Apeksha Anand', team: tournament.teams?.[0]?.name || 'Batter', val: '89*', unit: 'runs', color: '#FFF1F2', borderColor: '#FFE4E6' },
    { label: 'Most Sixes', player: 'Tanisha Singh', team: tournament.teams?.[1]?.name || 'Batter', val: '7', unit: 'sixes', color: '#F0FDF4', borderColor: '#DCFCE7' }
  ];

  // Handle Share WhatsApp Ground Invite
  const handleShareInvite = async () => {
    try {
      const tourName = tournament.name || tournament.title || 'Cricket Tournament';
      const city = tournament.city || tournament.host || 'Local Ground';
      const msg = `🏏 Join *${tourName}* on CricFlow!\n📍 Location: ${city}\n📅 Dates: ${tournament.startDate || tournament.duration || 'Upcoming'}\n\nCaptains can register their teams and track live ball-by-ball scoring on CricFlow.`;
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

  // Start Instant Scoring
  const handleStartMatchScoring = (match = null) => {
    if (navigation) {
      navigation.navigate('QuickMatchSetup', {
        tournamentId: tournament.id,
        tournamentName: tournament.name || tournament.title,
        presetTeam1: match?.team1?.name || tournament.teams?.[0]?.name,
        presetTeam2: match?.team2?.name || tournament.teams?.[1]?.name
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

  const rawMatches = tournament.matches || [];
  const filteredMatches = useMemo(() => {
    if (matchSubFilter === 'LIVE') return rawMatches.filter(m => m.status === 'LIVE');
    if (matchSubFilter === 'UPCOMING') return rawMatches.filter(m => m.status === 'UPCOMING' || !m.status);
    if (matchSubFilter === 'FINISHED') return rawMatches.filter(m => m.status === 'FINISHED');
    return rawMatches;
  }, [rawMatches, matchSubFilter]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={themeColors.surface} />
      <View style={styles.container}>

        {/* ── 1. TOP HEADER BAR ── */}
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
          ) : (
            <View style={{ width: 28, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="trophy" size={22} color={themeColors.textPrimary} />
            </View>
          )}

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {tournament.name || tournament.title || 'Tournament Hub'}
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {tournament.city || tournament.host || 'Local Ground'} • {tournament.format || '10-Over Limited'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {/* Quick Browse All Series Directory */}
            <TouchableOpacity
              style={styles.shareHeaderBtn}
              onPress={() => {
                if (navigation) {
                  navigation.navigate('AllSeriesDirectory');
                } else {
                  navigate('allSeriesDirectory');
                }
              }}
              activeOpacity={0.7}
              accessibilityLabel="All Series Directory"
            >
              <MaterialCommunityIcons name="format-list-bulleted-square" size={20} color={themeColors.textPrimary} />
            </TouchableOpacity>

            {isUserOrganiser ? (
              <View style={styles.organiserPill}>
                <MaterialCommunityIcons name="shield-crown-outline" size={13} color="#FFFFFF" />
                <Text style={styles.organiserPillText}>Host</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.shareHeaderBtn}
              onPress={handleShareInvite}
              activeOpacity={0.7}
            >
              <Ionicons name="share-social-outline" size={20} color={themeColors.textPrimary} />
            </TouchableOpacity>
          </View>
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

              {/* Tournament Identity Card (Supports Cover Banner & Circular Logo) */}
              <View style={styles.heroIdentityCard}>
                {tournament.bannerUri ? (
                  <View style={styles.heroBannerWrap}>
                    <Image source={{ uri: tournament.bannerUri }} style={styles.heroBannerImage} />
                  </View>
                ) : null}

                <View style={[styles.heroBodyPadding, tournament.bannerUri && { paddingTop: 0 }]}>
                  {tournament.logoUri ? (
                    <View style={[styles.heroLogoWrap, tournament.bannerUri && styles.heroLogoOverlap]}>
                      <Image source={{ uri: tournament.logoUri }} style={styles.heroLogoImage} />
                    </View>
                  ) : null}

                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: (tournament.logoUri && tournament.bannerUri) ? 4 : 0 }}>
                    <View style={styles.categoryChip}>
                      <Text style={styles.categoryChipText}>{tournament.category || 'OPEN GROUND CRICKET'}</Text>
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
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <MaterialCommunityIcons name="shield-half-full" size={16} color="#64748B" />
                          <Text style={styles.teamShortText}>{m.team1?.name || m.team1 || 'Team 1'}</Text>
                        </View>
                        <Text style={styles.teamScoreText}>{m.team1?.score || 'VS'}</Text>
                      </View>
                      <View style={styles.matchTeamRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <MaterialCommunityIcons name="shield-half-full" size={16} color="#64748B" />
                          <Text style={styles.teamShortText}>{m.team2?.name || m.team2 || 'Team 2'}</Text>
                        </View>
                        <Text style={styles.teamScoreText}>{m.team2?.score || ''}</Text>
                      </View>
                      {m.result ? (
                        <Text style={styles.resultBadgeText}>{m.result}</Text>
                      ) : (
                        <TouchableOpacity
                          style={styles.cardScoreActionBtn}
                          onPress={() => handleStartMatchScoring(m)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.cardScoreActionBtnText}>SCORE THIS MATCH</Text>
                        </TouchableOpacity>
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

              <View style={styles.statsGridContainer}>
                <View style={[styles.topKeyStatCard, { backgroundColor: keyStatsTop.color, borderColor: keyStatsTop.borderColor }]}>
                  <PlayerAvatar name={keyStatsTop.player} size={38} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.statCategoryLabel}>{keyStatsTop.label}</Text>
                    <Text style={styles.statPlayerNameBold}>{keyStatsTop.player}</Text>
                    <Text style={styles.statPlayerTeamSub}>{keyStatsTop.team}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.topStatValueNum}>{keyStatsTop.val}</Text>
                    <Text style={styles.topStatUnitText}>{keyStatsTop.unit}</Text>
                  </View>
                </View>

                <View style={styles.gridTwoColRow}>
                  {keyStatsGrid.map((st) => (
                    <View key={st.label} style={[styles.gridKeyStatCard, { backgroundColor: st.color, borderColor: st.borderColor }]}>
                      <View style={styles.gridCardHeaderRow}>
                        <PlayerAvatar name={st.player} size={24} />
                        <View style={{ flex: 1, marginLeft: 6 }}>
                          <Text style={styles.statCategoryLabelSmall}>{st.label}</Text>
                        </View>
                      </View>

                      <View style={styles.gridCardBodyRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.statPlayerNameBold}>{st.player}</Text>
                          <Text style={styles.statPlayerTeamSub}>{st.team}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.gridStatValueNum}>{st.val}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
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
                      <Text style={[styles.tableCell, { flex: 1, fontFamily: systemFontMedium }]} numberOfLines={1}>
                        {row.team}
                      </Text>
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
                <View style={styles.matchesActionBar}>
                  <TouchableOpacity
                    style={styles.primaryActionBtn}
                    onPress={() => handleStartMatchScoring()}
                    activeOpacity={0.85}
                  >
                    <MaterialCommunityIcons name="cricket" size={18} color="#FFFFFF" />
                    <Text style={styles.primaryActionBtnText}>START A MATCH</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.outlineActionBtn}
                    onPress={() => setScheduleModalVisible(true)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="calendar-outline" size={16} color={themeColors.primary} />
                    <Text style={styles.outlineActionBtnText}>Schedule Fixture</Text>
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
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={styles.groupDateTitle}>{item.dateStr || 'Upcoming Match'}</Text>
                      {item.status === 'LIVE' ? (
                        <View style={styles.liveTagBadge}>
                          <View style={styles.liveDot} />
                          <Text style={styles.liveTagText}>LIVE</Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.matchTeamsRow}>
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={styles.matchTeamTitle}>{item.team1?.name || item.team1 || 'Team 1'}</Text>
                        <Text style={styles.matchTeamTitle}>{item.team2?.name || item.team2 || 'Team 2'}</Text>
                      </View>

                      {item.result ? (
                        <Text style={styles.finishedResultText}>{item.result}</Text>
                      ) : (
                        <TouchableOpacity
                          style={styles.timeTagBadge}
                          onPress={() => handleStartMatchScoring(item)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.timeTagText}>SCORE MATCH</Text>
                        </TouchableOpacity>
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
                    <View style={[styles.teamIconBadge, { backgroundColor: '#F8F8FA' }]}>
                      <MaterialCommunityIcons name={team.icon || 'shield-half-full'} size={22} color={themeColors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.teamRowName}>{team.name}</Text>
                      <Text style={styles.teamRowSub}>
                        {team.count || '11 Players'} {team.captainName ? `• Capt: ${team.captainName}` : ''}
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
                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.tableCell, { fontFamily: systemFontMedium, color: themeColors.textPrimary }]} numberOfLines={1}>
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
                  <MaterialCommunityIcons name="shield-half-full" size={22} color={themeColors.primary} />
                  <Text style={styles.modalTitle}>{selectedTeamDrawer?.name} Squad</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedTeamDrawer(null)}>
                  <Ionicons name="close" size={24} color={themeColors.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                {mockSquadPlayers.map((player) => (
                  <View key={player.id} style={styles.squadPlayerRow}>
                    <PlayerAvatar name={player.name} size={34} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.squadPlayerName}>{player.name}</Text>
                      <Text style={styles.squadPlayerRole}>{player.role}</Text>
                    </View>
                    <Text style={styles.squadPlayerStat}>
                      {player.runs != null ? `${player.runs} Runs` : `${player.wickets} Wkts`}
                    </Text>
                  </View>
                ))}
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
  headerBar: {
    height: 54,
    backgroundColor: themeColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16
  },
  backBtn: {
    padding: 4,
    marginLeft: -4
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8
  },
  headerTitle: {
    fontSize: 15,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary,
    letterSpacing: -0.2
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: systemFont,
    color: themeColors.textMuted
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
    fontFamily: systemFontBold
  },
  shareHeaderBtn: {
    padding: 6
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
  heroBannerWrap: {
    width: '100%',
    height: 120,
    backgroundColor: themeColors.surfaceOffWhite,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border
  },
  heroBannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
  heroBodyPadding: {
    padding: 16,
    gap: 8
  },
  heroLogoWrap: {
    alignSelf: 'flex-start'
  },
  heroLogoOverlap: {
    marginTop: -36,
    marginBottom: 4
  },
  heroLogoImage: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 3,
    borderColor: '#FFFFFF',
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
  statsGridContainer: {
    gap: 10
  },
  topKeyStatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1
  },
  statCategoryLabel: {
    fontSize: 10,
    fontFamily: systemFontMedium,
    color: themeColors.textMuted
  },
  statPlayerNameBold: {
    fontSize: 13,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  statPlayerTeamSub: {
    fontSize: 11,
    fontFamily: systemFont,
    color: themeColors.textMuted
  },
  topStatValueNum: {
    fontSize: 18,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  topStatUnitText: {
    fontSize: 10,
    fontFamily: systemFont,
    color: themeColors.textMuted
  },
  gridTwoColRow: {
    flexDirection: 'row',
    gap: 10
  },
  gridKeyStatCard: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4
  },
  gridCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  statCategoryLabelSmall: {
    fontSize: 9.5,
    fontFamily: systemFontMedium,
    color: themeColors.textMuted
  },
  gridCardBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  gridStatValueNum: {
    fontSize: 14,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
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
  }
});

export default PublicSeriesViewScreen;
