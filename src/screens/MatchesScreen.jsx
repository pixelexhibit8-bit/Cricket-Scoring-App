import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  RefreshControl,
  Keyboard,
  Animated,
  useWindowDimensions,
  BackHandler,
  Platform,
  LayoutAnimation,
  StyleSheet
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import {
  systemFont,
  systemFontBold,
  systemFontMedium,
  fontWeights,
  theme,
  themeColors,
  typeScale,
  spacing,
  radius
} from '../theme.js';
import { AppHeader } from '../components/navigation/AppHeader.jsx';
import { AppBottomNav } from '../components/navigation/AppBottomNav.jsx';
import { MyProfileScreen } from './MyProfileScreen.jsx';
import { RankingsScreen } from './RankingsScreen.jsx';
import { PlayerAvatar } from '../components/PlayerAvatar.jsx';
import { TeamIdentityMark } from '../components/TeamIdentityMark.jsx';
import { MatchListScoreCard } from '../components/MatchListScoreCard.jsx';
import { GroundSpotlightSection } from '../components/GroundSpotlightSection.jsx';
import { formatOvers, getTossWinnerName, getTossDecisionText, getScorePartsFromText, getFinishedResultCardText } from '../utils/cricketUtils.js';
import { LinearGradient } from 'expo-linear-gradient';
import { ScalePressable, FadeSlideIn } from '../components/motion/MotionSystem.jsx';
import { showToast } from '../services/toastService.js';

export function MatchesScreen({
  openScorerScreen,
  searchQuery,
  setSearchQuery,
  bottomNavTab = 'matches',
  setBottomNavTab,
  matchesSubTab = 'home',
  setMatchesSubTab,
  statsCategory,
  setStatsCategory,
  refreshing,
  handlePullToRefresh,
  setupPlayerNames = [],
  setSelectedPlayerName,
  setCurrentScreen,
  activeMatchVisible,
  visibleLiveMatches = [],
  renderActiveMatchListCard,
  recentFinishedMatches = [],
  renderFinishedMatchListCard,
  visibleFinishedMatches = [],
  activeMatch,
  setActiveMatch,
  upcomingMatches = [],
  onStartUpcomingMatch = null,
  TOP_BATTERS = [],
  TOP_BOWLERS = [],
  TOP_ALLROUNDERS = [],
  localPlayersList = [],
  getSetupPlayerProfile,
  setSelectedPlayerProfile,
  finishedArchive = [],
  setSelectedMatch,
  onJoinMatchByCode,
  hideBottomNav = false
}) {
  const { width: screenWidth } = useWindowDimensions();
  const homePagerRef = useRef(null);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const handlePlayerPress = (name, extraProps = {}) => {
    const dbFound = localPlayersList.find(p => p && p.name && p.name.trim().toLowerCase() === String(name).trim().toLowerCase());
    const profile = dbFound || (getSetupPlayerProfile ? getSetupPlayerProfile(name) : { name, role: extraProps.role || 'Local Player', photoUrl: extraProps.photoUrl, city: extraProps.city });

    if (setSelectedPlayerName) setSelectedPlayerName(name);
    if (setSelectedPlayerProfile) setSelectedPlayerProfile(profile);
    if (setCurrentScreen) setCurrentScreen('playerProfile');
  };

  const getFinishedMatchDateKey = (m) => {
    if (!m) return 'Match Results';
    const rawDateStr = m.dateLabel || m.completedAt || m.startedAt || m.created_at || m.updated_at || m.dateText;
    if (rawDateStr) {
      const d = new Date(rawDateStr);
      if (!isNaN(d.getTime())) {
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        const isToday = d.toDateString() === today.toDateString();
        const isYesterday = d.toDateString() === yesterday.toDateString();
        const day = d.getDate();
        const monthFull = d.toLocaleDateString('en-GB', { month: 'long' });
        const shortDay = d.toLocaleDateString('en-GB', { weekday: 'short' });
        if (isToday) return `Today, ${day} ${monthFull}`;
        if (isYesterday) return `Yesterday, ${day} ${monthFull}`;
        return `${shortDay}, ${day} ${monthFull}`;
      }
    }
    if (m.dateText && m.dateText !== 'Recent Matches' && m.dateText !== 'Recent Match') {
      return m.dateText.split('•')[0].trim();
    }
    return 'Match Results';
  };

  const renderActiveCard = (targetMatch = null, index = 0) => {
    const m = targetMatch || activeMatch;
    if (!m) return null;

    const t1 = m.teams?.[0] || m.team1 || { name: m.innings?.[0]?.battingTeam?.name || m.inn1BattingTeam || 'Team 1' };
    const t2 = m.teams?.[1] || m.team2 || { name: m.innings?.[0]?.bowlingTeam?.name || m.inn1BowlingTeam || 'Team 2' };
    const inn1 = m.innings?.[0];
    const inn2 = m.innings?.[1];

    const oversNum = m.maxOvers || m.totalOvers || 20;
    const venueText = m.venue ? ` - ${m.venue}` : '';
    const subtitle = `${oversNum}-over match${venueText}`;

    const t1Score = inn1?.battingTeam ? `${inn1.battingTeam.runs ?? 0}-${inn1.battingTeam.wickets ?? 0}` : '0-0';
    const t1Overs = inn1 ? formatOvers(inn1.totalLegalBalls || 0) : '0.0';
    const t2Score = inn2?.battingTeam ? `${inn2.battingTeam.runs ?? 0}-${inn2.battingTeam.wickets ?? 0}` : '';
    const t2Overs = inn2 ? formatOvers(inn2.totalLegalBalls || 0) : '';

    const currentInning = m.inning === 2 ? (inn2 || inn1) : (inn1 || inn2);
    const activeBattingTeamName = currentInning?.battingTeam?.name || t1.name;

    const tossWin = getTossWinnerName(m) || m.tossWinner || t1.name;
    const tossDec = getTossDecisionText(m, m.tossDecision || 'BAT');

    return (
      <View key={`${m.id || m.supabaseId || m.matchCode || 'live-card'}-${index}`} style={{ marginBottom: 8 }}>
        <MatchListScoreCard
          subtitle={subtitle}
          teamOne={t1}
          teamTwo={t2}
          teamOneScore={t1Score}
          teamOneOvers={t1Overs}
          teamTwoScore={t2Score}
          teamTwoOvers={t2Overs}
          activeTeamName={activeBattingTeamName}
          statusLabel="Live"
          statusColor="#E11D48"
          statusDotColor="#E11D48"
          footerText={`Toss: ${tossWin}, Elected to ${tossDec}`}
          onPress={() => {
            if (setActiveMatch) setActiveMatch(m);
            if (setCurrentScreen) setCurrentScreen('liveView');
          }}
        />
      </View>
    );
  };

  const renderFinishedCard = (match, index = 0) => {
    if (!match) return null;
    const teamOneScore = getScorePartsFromText(match.team1?.score);
    const teamTwoScore = getScorePartsFromText(match.team2?.score);
    const resultCardText = getFinishedResultCardText(match);
    const resultColor = match.winnerTeamName === match.team1?.name ? '#0369A1' : '#92400E';

    const oversText = `${match.maxOvers || 5} Overs`;
    const ballTypeText = match.ballType ? ` • ${match.ballType.charAt(0).toUpperCase() + match.ballType.slice(1)} Ball` : ' • Tennis Ball';
    const venueText = match.venue ? ` • ${match.venue}` : ' • Sadokan Ground';
    const subtitleText = `${oversText}${ballTypeText}${venueText}`;

    return (
      <View key={`${match.id || match.title || 'match'}-${index}`} style={{ marginBottom: 8 }}>
        <MatchListScoreCard
          subtitle={subtitleText}
          teamOne={match.team1}
          teamTwo={match.team2}
          teamOneScore={teamOneScore.score}
          teamOneOvers={teamOneScore.overs}
          teamTwoScore={teamTwoScore.score}
          teamTwoOvers={teamTwoScore.overs}
          winnerTeamName={match.winnerTeamName}
          resultTitle={resultCardText.title}
          resultDetail={resultCardText.detail}
          resultColor={resultColor}
          topRightIcon={null}
          onPress={() => {
            if (setSelectedMatch) setSelectedMatch(match);
            if (setCurrentScreen) setCurrentScreen('finishedView');
          }}
        />
      </View>
    );
  };
  const liveCount = (visibleLiveMatches || []).length;
  const homeTabs = [
    { id: 'home', label: 'For you' },
    { id: 'live', label: `Live (${liveCount})` },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'finished', label: 'Finished' }
  ];
  const activeTabIndex = Math.max(0, homeTabs.findIndex(t => t.id === matchesSubTab));
  const homePagerScrollX = useRef(new Animated.Value(activeTabIndex * screenWidth)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  const [tabLayouts, setTabLayouts] = useState({});
  const onTabLayout = (id, e) => {
    const { x, width } = e.nativeEvent.layout;
    setTabLayouts(prev => {
      const cur = prev[id];
      if (cur && Math.abs(cur.x - x) < 0.5 && Math.abs(cur.width - width) < 0.5) return prev;
      return { ...prev, [id]: { x, width } };
    });
  };

  const animatedUnderlineX = homePagerScrollX.interpolate({
    inputRange: [0, screenWidth, screenWidth * 2, screenWidth * 3],
    outputRange: homeTabs.map((t, index) => tabLayouts[t.id]?.x != null ? tabLayouts[t.id].x : (index * 85 + 16)),
    extrapolate: 'clamp'
  });

  const animatedUnderlineWidth = homePagerScrollX.interpolate({
    inputRange: [0, screenWidth, screenWidth * 2, screenWidth * 3],
    outputRange: homeTabs.map(t => tabLayouts[t.id]?.width != null ? tabLayouts[t.id].width : 55),
    extrapolate: 'clamp'
  });

  const isDraggingPager = useRef(false);

  const onTabPress = (tabId, index) => {
    setMatchesSubTab(tabId);
    isDraggingPager.current = true;
    homePagerRef.current?.scrollTo({ x: index * screenWidth, animated: true });
    setTimeout(() => { isDraggingPager.current = false; }, 300);
  };

  const handleHomePagerEnd = (e) => {
    const offset = e.nativeEvent.contentOffset.x;
    const index = Math.round(offset / screenWidth);
    if (homeTabs[index] && matchesSubTab !== homeTabs[index].id) {
      setMatchesSubTab(homeTabs[index].id);
    }
  };

  useEffect(() => {
    if (!isDraggingPager.current) {
      const targetOffset = activeTabIndex * screenWidth;
      homePagerRef.current?.scrollTo({ x: targetOffset, animated: false });
      homePagerScrollX.setValue(targetOffset);
    }
  }, [matchesSubTab, screenWidth]);

  // Handle Android Hardware Back Button
  useEffect(() => {
    const onBackPress = () => {
      if (isSearchExpanded || (searchQuery && searchQuery.trim().length > 0)) {
        setIsSearchExpanded(false);
        if (setSearchQuery) setSearchQuery('');
        return true;
      }
      if (bottomNavTab !== 'matches' && bottomNavTab !== 'home') {
        if (setBottomNavTab) setBottomNavTab('matches');
        if (setMatchesSubTab) setMatchesSubTab('home');
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [searchQuery, bottomNavTab, isSearchExpanded]);

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.appBackground }}>
      {/* REUSABLE TOP APP HEADER (Full width Search below Brand, Dynamic Collapse) */}
      <AppHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        scrollY={scrollY}
      />

      {/* MATCHES SUB-TABS (CREX STYLE CLEAN TEXT-ONLY UNDERLINE TABS) */}
      {(bottomNavTab === 'matches' || bottomNavTab === 'home' || !bottomNavTab) && (
        <View style={{
          backgroundColor: themeColors.surface,
          borderBottomWidth: 1,
          borderBottomColor: themeColors.border,
          position: 'relative'
        }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, flexDirection: 'row', gap: 22 }}
          >
            {homeTabs.map((t, idx) => {
              const active = matchesSubTab === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  onLayout={(e) => onTabLayout(t.id, e)}
                  onPress={() => onTabPress(t.id, idx)}
                  activeOpacity={0.7}
                  style={{
                    paddingVertical: 13,
                    paddingHorizontal: 3,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Text style={{
                    fontSize: 15,
                    color: active ? themeColors.primary : themeColors.textMuted,
                    fontFamily: systemFontMedium,
                    letterSpacing: -0.1
                  }}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Animated Smooth Underline Matching Exact Text Width */}
            <Animated.View style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: animatedUnderlineWidth,
              height: 2.5,
              borderRadius: 2,
              backgroundColor: themeColors.primary,
              transform: [{ translateX: animatedUnderlineX }]
            }} />
          </ScrollView>
        </View>
      )}

      {/* BODY (SEARCH RESULTS, ABOUT TAB, OR MATCHES SWIPE PAGER) */}
      {Boolean(searchQuery && searchQuery.trim().length > 0) ? (
        <Animated.ScrollView
          style={{ flex: 1, backgroundColor: themeColors.appBackground }}
          contentContainerStyle={[styles.tabContent, { paddingBottom: 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
        >
          {(() => {
            const q = searchQuery.toLowerCase().trim();
            const qClean = q.replace(/\D/g, '');

            // 1. Search Players
            const allPlayersMap = new Map();
            (localPlayersList || []).forEach(p => { if (p?.name) allPlayersMap.set(p.name.trim().toLowerCase(), p); });
            (setupPlayerNames || []).forEach(name => {
              if (name && !allPlayersMap.has(name.trim().toLowerCase())) {
                allPlayersMap.set(name.trim().toLowerCase(), { name, role: 'Local Player' });
              }
            });

            const matchedPlayers = Array.from(allPlayersMap.values()).filter(p => {
              const name = (p.name || '').toLowerCase();
              const role = (p.role || '').toLowerCase();
              const city = (p.city || '').toLowerCase();
              const phone = String(p.phone || p.mobile || '').replace(/\D/g, '');
              return name.includes(q) || role.includes(q) || city.includes(q) || (qClean.length > 0 && phone.includes(qClean));
            });

            // 2. Search Finished & Live Matches
            const matchedFinished = (visibleFinishedMatches || []).filter(m => {
              const t1 = (m.teams?.[0]?.name || m.innings?.[0]?.battingTeam?.name || m.inn1BattingTeam || '').toLowerCase();
              const t2 = (m.teams?.[1]?.name || m.innings?.[0]?.bowlingTeam?.name || m.inn1BowlingTeam || '').toLowerCase();
              const title = (m.matchTitle || m.title || '').toLowerCase();
              const venue = (m.venue || m.venueName || m.ground || '').toLowerCase();
              return t1.includes(q) || t2.includes(q) || title.includes(q) || venue.includes(q);
            });

            const matchedLive = (visibleLiveMatches || []).filter(m => {
              const t1 = (m.teams?.[0]?.name || m.innings?.[0]?.battingTeam?.name || m.inn1BattingTeam || '').toLowerCase();
              const t2 = (m.teams?.[1]?.name || m.innings?.[0]?.bowlingTeam?.name || m.inn1BowlingTeam || '').toLowerCase();
              const title = (m.matchTitle || m.title || '').toLowerCase();
              const venue = (m.venue || m.venueName || m.ground || '').toLowerCase();
              return t1.includes(q) || t2.includes(q) || title.includes(q) || venue.includes(q);
            });

            const totalResults = matchedPlayers.length + matchedFinished.length + matchedLive.length;

            if (totalResults === 0) {
              return (
                <View style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: 24, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', gap: 10, marginTop: 10 }}>
                  <Ionicons name="search-outline" size={32} color="#94A3B8" />
                  <Text style={{ fontSize: 15, fontFamily: systemFontMedium, color: '#0F172A' }}>
                    No results found
                  </Text>
                  <Text style={{ fontSize: 12, color: '#64748B', textAlign: 'center', fontFamily: systemFont, lineHeight: 18 }}>
                    No player, team, ground, or match found matching "{searchQuery}"
                  </Text>
                </View>
              );
            }

            return (
              <View style={{ gap: 16 }}>
                {/* MATCHES SECTION */}
                {(matchedLive.length > 0 || matchedFinished.length > 0) && (
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, paddingHorizontal: 2 }}>
                      <Ionicons name="trophy-outline" size={15} color="#0284C7" />
                      <Text style={[styles.sectionLabel, { marginBottom: 0 }]}>
                        MATCHES ({matchedLive.length + matchedFinished.length})
                      </Text>
                    </View>
                    {matchedLive.map((m, idx) => (renderActiveMatchListCard || renderActiveCard)(m, idx))}
                    {matchedFinished.map((f, idx) => (renderFinishedMatchListCard || renderFinishedCard)(f, idx))}
                  </View>
                )}

                {/* PLAYERS SECTION */}
                {matchedPlayers.length > 0 && (
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, paddingHorizontal: 2 }}>
                      <Ionicons name="people-outline" size={15} color="#0284C7" />
                      <Text style={[styles.sectionLabel, { marginBottom: 0 }]}>
                        PLAYERS ({matchedPlayers.length})
                      </Text>
                    </View>
                    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' }}>
                      {matchedPlayers.slice(0, 15).map((p, idx) => {
                        const isLast = idx === Math.min(matchedPlayers.length - 1, 14);
                        return (
                          <TouchableOpacity
                            key={`search-p-${p.name}-${idx}`}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              paddingHorizontal: 14,
                              paddingVertical: 12,
                              gap: 12,
                              borderBottomWidth: isLast ? 0 : 1,
                              borderBottomColor: '#F1F5F9'
                            }}
                            onPress={() => handlePlayerPress(p.name, { role: p.role, photoUrl: p.photoUrl, city: p.city })}
                          >
                            <PlayerAvatar name={p.name} photoUrl={p.photoUrl} size={42} />
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 14, fontFamily: systemFontMedium, color: '#0F172A' }}>
                                {p.name}
                              </Text>
                              <Text style={{ fontSize: 11.5, color: '#64748B', fontFamily: systemFont, marginTop: 2 }}>
                                {p.role || 'Local Player'} {p.city ? `• ${p.city}` : ''}
                              </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            );
          })()}
        </Animated.ScrollView>
      ) : bottomNavTab === 'rankings' ? (
        <View style={{ flex: 1, backgroundColor: themeColors.appBackground }}>
          <RankingsScreen
            topBatters={TOP_BATTERS}
            topBowlers={TOP_BOWLERS}
            topAllRounders={TOP_ALLROUNDERS}
            onSelectPlayer={handlePlayerPress}
            refreshing={refreshing}
            onRefresh={handlePullToRefresh}
          />
        </View>
      ) : bottomNavTab === 'profile' ? (
        <View style={{ flex: 1, backgroundColor: themeColors.appBackground }}>
          <MyProfileScreen
            finishedMatches={finishedArchive || []}
            activeMatch={activeMatch}
            onStartQuickMatch={openScorerScreen}
            onJoinMatchByCode={onJoinMatchByCode}
            onSelectMatch={(m) => {
              if (setSelectedMatch) setSelectedMatch(m);
              if (setCurrentScreen) setCurrentScreen('finishedView');
            }}
          />
        </View>
      ) : (
        <Animated.ScrollView
          ref={homePagerRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          overScrollMode="never"
          bounces={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: homePagerScrollX } } }],
            { useNativeDriver: false }
          )}
          onMomentumScrollEnd={handleHomePagerEnd}
          style={{ flex: 1 }}
        >
          {/* 0. FOR YOU (HOME DISCOVERY) PAGE */}
          <View style={{ width: screenWidth, flex: 1 }}>
            <ScrollView
              style={{ flex: 1, backgroundColor: themeColors.appBackground }}
              contentContainerStyle={styles.tabContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              scrollEventThrottle={16}
              removeClippedSubviews={true}
              overScrollMode="never"
              decelerationRate="normal"
              nestedScrollEnabled={true}
            >
              {/* Top Featured / Live Match Banner */}
              {visibleLiveMatches.length > 0 && (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 2 }}>
                    <Text style={{ fontSize: 11, color: '#64748B', fontFamily: systemFontMedium, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                      {visibleLiveMatches.length > 1 ? `FEATURED LIVE MATCHES (${visibleLiveMatches.length})` : 'FEATURED LIVE MATCH'}
                    </Text>
                    <View style={{ backgroundColor: '#EF4444', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                      <Text style={{ color: '#FFFFFF', fontSize: 9.5, fontFamily: systemFontMedium }}>LIVE</Text>
                    </View>
                  </View>
                  {visibleLiveMatches.map((m, idx) => (renderActiveMatchListCard || renderActiveCard)(m, idx))}
                </>
              )}

              {/* Ground Spotlight (Top Batsman, Bowler, All-Rounder) - REUSABLE COLORFUL COMPONENT */}
              <GroundSpotlightSection
                topBatters={TOP_BATTERS}
                topBowlers={TOP_BOWLERS}
                topAllRounders={TOP_ALLROUNDERS}
                onSelectPlayer={(name, meta) => handlePlayerPress(name, meta)}
                onViewAll={() => {
                  if (setBottomNavTab) setBottomNavTab('rankings');
                }}
              />

              {/* Recent Finished Matches Grouped by Exact Date */}
              {recentFinishedMatches && recentFinishedMatches.length > 0 ? (
                (() => {
                  const groups = {};
                  recentFinishedMatches.slice(0, 4).forEach(m => {
                    const dKey = getFinishedMatchDateKey(m);
                    if (!groups[dKey]) groups[dKey] = [];
                    groups[dKey].push(m);
                  });

                  return Object.keys(groups).map(dKey => (
                    <View key={`foryou-grp-${dKey}`} style={{ marginTop: 10, marginBottom: 2 }}>
                      <Text style={{ fontSize: 13.5, fontFamily: systemFontMedium, color: '#1E293B', marginBottom: 8, paddingHorizontal: 2 }}>
                        {dKey}
                      </Text>
                      {groups[dKey].map((m, idx) => (renderFinishedMatchListCard || renderFinishedCard)(m, idx))}
                    </View>
                  ));
                })()
              ) : null}
            </ScrollView>
          </View>

          {/* 1. LIVE MATCHES PAGE */}
          <View style={{ width: screenWidth, flex: 1 }}>
            <ScrollView
              style={{ flex: 1, backgroundColor: themeColors.appBackground }}
              contentContainerStyle={styles.tabContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              scrollEventThrottle={16}
              removeClippedSubviews={true}
              overScrollMode="never"
              decelerationRate="normal"
              nestedScrollEnabled={true}
            >

              {visibleLiveMatches.length > 0 ? (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 2 }}>
                    <Text style={{ fontSize: 11.5, fontFamily: systemFontMedium, color: '#64748B', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                      LIVE MATCHES ({visibleLiveMatches.length})
                    </Text>
                    <View style={{ backgroundColor: '#EF4444', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                      <Text style={{ color: '#FFFFFF', fontSize: 9.5, fontFamily: systemFontMedium }}>LIVE</Text>
                    </View>
                  </View>
                  {visibleLiveMatches.map((m, idx) => (renderActiveMatchListCard || renderActiveCard)(m, idx))}
                </>
              ) : (
                <View style={styles.liteEmptyState}>
                  <MaterialCommunityIcons name="satellite-uplink" size={48} color="#CBD5E1" />
                  <Text style={styles.liteEmptyText}>
                    No match is live currently, explore Upcoming for fixtures
                  </Text>
                  <TouchableOpacity
                    onPress={() => onTabPress('upcoming', 2)}
                    activeOpacity={0.8}
                    style={styles.liteEmptyBtn}
                  >
                    <Text style={styles.liteEmptyBtnText}>Upcoming Fixtures ›</Text>
                  </TouchableOpacity>
                </View>
              )}

              {recentFinishedMatches && recentFinishedMatches.length > 0 ? (
                (() => {
                  const groups = {};
                  recentFinishedMatches.forEach(m => {
                    const dKey = getFinishedMatchDateKey(m);
                    if (!groups[dKey]) groups[dKey] = [];
                    groups[dKey].push(m);
                  });

                  return Object.keys(groups).map(dKey => (
                    <View key={`live-grp-${dKey}`} style={{ marginTop: 10, marginBottom: 2 }}>
                      <Text style={{ fontSize: 13.5, fontFamily: systemFontMedium, color: '#1E293B', marginBottom: 8, paddingHorizontal: 2 }}>
                        {dKey}
                      </Text>
                      {groups[dKey].map((m, idx) => (renderFinishedMatchListCard || renderFinishedCard)(m, idx))}
                    </View>
                  ));
                })()
              ) : null}
            </ScrollView>
          </View>

          {/* 2. UPCOMING MATCHES PAGE */}
          <View style={{ width: screenWidth, flex: 1 }}>
            <ScrollView
              style={{ flex: 1, backgroundColor: themeColors.appBackground }}
              contentContainerStyle={styles.tabContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              scrollEventThrottle={16}
              removeClippedSubviews={true}
              overScrollMode="never"
              decelerationRate="normal"
              nestedScrollEnabled={true}
            >
              {(!upcomingMatches || upcomingMatches.length === 0) ? (
                <View style={styles.liteEmptyState}>
                  <Ionicons name="calendar-outline" size={48} color="#CBD5E1" />
                  <Text style={styles.liteEmptyText}>
                    No upcoming matches scheduled currently
                  </Text>
                  {openScorerScreen ? (
                    <TouchableOpacity
                      onPress={openScorerScreen}
                      activeOpacity={0.8}
                      style={styles.liteEmptyBtn}
                    >
                      <Text style={styles.liteEmptyBtnText}>Start New Match ›</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : (
                (() => {
                  const groups = {};
                  upcomingMatches.forEach(m => {
                    const dKey = m.dateText || (m.matchDate ? m.matchDate.split(',')[0] : 'Upcoming Matches');
                    if (!groups[dKey]) groups[dKey] = [];
                    groups[dKey].push(m);
                  });

                  return Object.keys(groups).map(dateKey => (
                    <View key={`up-grp-${dateKey}`} style={{ marginTop: 10, marginBottom: 2 }}>
                      <Text style={{ fontSize: 13.5, fontFamily: systemFontMedium, color: '#1E293B', marginBottom: 8, paddingHorizontal: 2 }}>
                        {dateKey}
                      </Text>
                      {groups[dateKey].map((m, idx) => {
                        const t1Name = m.team1Name || m.team1?.name || m.teams?.[0]?.name || 'Team A';
                        const t2Name = m.team2Name || m.team2?.name || m.teams?.[1]?.name || 'Team B';
                        const t1Logo = m.team1LogoKey || m.team1?.logoKey || 'csk';
                        const t2Logo = m.team2LogoKey || m.team2?.logoKey || 'rcb';
                        const schedTime = m.timeText || (m.matchDate && m.matchDate.includes('•') ? m.matchDate.split('•')[1]?.trim() : 'Scheduled');
                        const venue = m.venueName || m.venue || 'Sadokan Ground';
                        const overs = m.totalOvers || m.maxOvers || 5;

                        return (
                          <View
                            key={`upcoming-${m.id || idx}`}
                            style={{
                              backgroundColor: '#FFFFFF',
                              borderRadius: 16,
                              padding: 16,
                              marginBottom: 10,
                              borderWidth: 1,
                              borderColor: '#F1F5F9',
                              gap: 12
                            }}
                          >
                            {/* Card Header Subtitle (Like Reference Screenshot) */}
                            <Text style={{ fontSize: 12, color: '#94A3B8', fontFamily: systemFontMedium }} numberOfLines={1}>
                              {overs}-Over Match • Tennis Ball • {venue}
                            </Text>

                            {/* Center Matchup Row */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                              {/* Left Teams Column */}
                              <View style={{ flex: 1, gap: 12 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                  <TeamIdentityMark team={{ name: t1Name, logoKey: t1Logo }} size={26} />
                                  <Text style={{ fontSize: 15.5, color: '#0F172A', fontFamily: systemFontMedium }} numberOfLines={1}>
                                    {t1Name}
                                  </Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                  <TeamIdentityMark team={{ name: t2Name, logoKey: t2Logo }} size={26} />
                                  <Text style={{ fontSize: 15.5, color: '#0F172A', fontFamily: systemFontMedium }} numberOfLines={1}>
                                    {t2Name}
                                  </Text>
                                </View>
                              </View>

                              {/* Divider */}
                              <View style={{ width: 1, height: 50, backgroundColor: '#F1F5F9', marginHorizontal: 14 }} />

                              {/* Right Column: Time & Start Button */}
                              <View style={{ minWidth: 105, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                <Text style={{ fontSize: 14, fontFamily: systemFontMedium, color: '#0284C7' }}>
                                  {schedTime}
                                </Text>
                                {onStartUpcomingMatch ? (
                                  <TouchableOpacity
                                    onPress={() => onStartUpcomingMatch(m)}
                                    activeOpacity={0.8}
                                    style={{
                                      backgroundColor: '#0284C7',
                                      paddingHorizontal: 12,
                                      paddingVertical: 6,
                                      borderRadius: 8,
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      gap: 4
                                    }}
                                  >
                                    <MaterialCommunityIcons name="cricket" size={13} color="#FFFFFF" />
                                    <Text style={{ color: '#FFFFFF', fontSize: 11, fontFamily: systemFontMedium }}>
                                      SCORE
                                    </Text>
                                  </TouchableOpacity>
                                ) : null}
                              </View>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  ));
                })()
              )}
            </ScrollView>
          </View>

          {/* 3. FINISHED MATCHES PAGE */}
          <View style={{ width: screenWidth, flex: 1 }}>
            <ScrollView
              style={{ flex: 1, backgroundColor: themeColors.appBackground }}
              contentContainerStyle={styles.tabContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              scrollEventThrottle={16}
              removeClippedSubviews={true}
              overScrollMode="never"
              decelerationRate="normal"
              nestedScrollEnabled={true}
            >
              {(() => {
                if (!visibleFinishedMatches || visibleFinishedMatches.length === 0) {
                  return (
                    <View style={styles.liteEmptyState}>
                      <Ionicons name="trophy-outline" size={48} color="#CBD5E1" />
                      <Text style={styles.liteEmptyText}>
                        No finished matches yet, completed match records will appear here
                      </Text>
                      {openScorerScreen ? (
                        <TouchableOpacity
                          onPress={openScorerScreen}
                          activeOpacity={0.8}
                          style={styles.liteEmptyBtn}
                        >
                          <Text style={styles.liteEmptyBtnText}>Start New Match ›</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  );
                }
                const groups = {};
                visibleFinishedMatches.forEach(m => {
                  const dateKey = getFinishedMatchDateKey(m);
                  if (!groups[dateKey]) groups[dateKey] = [];
                  groups[dateKey].push(m);
                });

                return Object.keys(groups).map(dateKey => (
                  <View key={`fin-grp-${dateKey}`} style={{ marginTop: 10, marginBottom: 2 }}>
                    <Text style={{ fontSize: 13.5, fontFamily: systemFontMedium, color: '#1E293B', marginBottom: 8, paddingHorizontal: 2 }}>
                      {dateKey}
                    </Text>
                    {groups[dateKey].map((f, idx) => (renderFinishedMatchListCard || renderFinishedCard)(f, idx))}
                  </View>
                ));
              })()}
            </ScrollView>
          </View>
        </Animated.ScrollView>
      )}

      {/* INDUSTRIAL STANDARD BOTTOM NAVIGATION BAR */}
      {!hideBottomNav && (
        <AppBottomNav
          activeTab={bottomNavTab}
          onTabChange={(tabId) => {
            if (setBottomNavTab) setBottomNavTab(tabId);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabContent: {
    padding: spacing.md,
    gap: spacing.sm + 2
  },
  sectionLabel: {
    fontSize: 10,
    color: theme.light.textMuted,
    letterSpacing: 0.8,
    marginBottom: 6,
    fontFamily: systemFontBold
  },
  idleCard: {
    backgroundColor: theme.light.cardBg,
    borderRadius: radius.xxl,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.light.cardBorder,
    gap: spacing.sm
  },
  idleIconBg: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: theme.light.primaryLight,
    justifyContent: 'center',
    alignItems: 'center'
  },
  idleTitle: {
    fontSize: typeScale.name,
    color: theme.light.textPrimary,
    fontFamily: systemFontBold
  },
  liteEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 44,
    paddingHorizontal: spacing.xxl,
    gap: spacing.md
  },
  liteEmptyText: {
    fontSize: 14.5,
    color: theme.light.textMuted,
    fontFamily: systemFontMedium,
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 280
  },
  liteEmptyBtn: {
    backgroundColor: theme.light.primarySurface,
    paddingHorizontal: spacing.lg,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginTop: spacing.xs
  },
  liteEmptyBtnText: {
    color: theme.light.primary,
    fontSize: 12.5,
    fontFamily: systemFontMedium
  }
});

export default MatchesScreen;
