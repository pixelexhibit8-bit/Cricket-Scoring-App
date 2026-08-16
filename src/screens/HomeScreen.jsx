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
  LayoutAnimation
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { systemFont, systemFontBold, systemFontMedium, fontWeights, theme, typeScale } from '../theme.js';
import { AppBottomNav } from '../components/navigation/AppBottomNav.jsx';
import { AboutAppScreen } from '../components/AboutAppScreen.jsx';
import { MyProfileScreen } from './MyProfileScreen.jsx';
import { PlayerAvatar } from '../components/PlayerAvatar.jsx';
import { TeamIdentityMark } from '../components/TeamIdentityMark.jsx';
import { LinearGradient } from 'expo-linear-gradient';
import { ScalePressable, FadeSlideIn } from '../components/motion/MotionSystem.jsx';
import { showToast } from '../services/toastService.js';

export function HomeScreen({
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
  searchNeedle = '',
  setSelectedPlayerName,
  setCurrentScreen,
  renderSetupPlayerPhoto,
  activeMatchVisible,
  renderActiveMatchListCard,
  recentFinishedMatches = [],
  renderFinishedMatchListCard,
  visibleFinishedMatches = [],
  activeMatch,
  upcomingMatches = [],
  onStartUpcomingMatch = null,
  TOP_BATTERS = [],
  TOP_BOWLERS = [],
  TOP_ALLROUNDERS = [],
  localPlayersList = [],
  MASTER_PLAYERS_DB = [],
  getSetupPlayerProfile,
  setSelectedPlayerProfile,
  onOpenPlayerProfile,
  styles,
  isScorerUnlocked,
  finishedArchive = [],
  setSelectedMatch,
  onJoinMatchByCode
}) {
  const { width: screenWidth } = useWindowDimensions();
  const homePagerRef = useRef(null);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const handlePlayerPress = (name, extraProps = {}) => {
    const dbFound = localPlayersList.find(p => p && p.name && p.name.trim().toLowerCase() === String(name).trim().toLowerCase())
      || MASTER_PLAYERS_DB.find(p => p && p.name && p.name.trim().toLowerCase() === String(name).trim().toLowerCase());
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
  const homeTabs = [
    { id: 'home', label: 'For you' },
    { id: 'live', label: activeMatchVisible ? 'Live (1)' : 'Live (0)' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'finished', label: 'Finished' },
    { id: 'playerStats', label: 'Rankings' }
  ];
  const activeTabIndex = Math.max(0, homeTabs.findIndex(t => t.id === matchesSubTab));
  const homePagerScrollX = useRef(new Animated.Value(activeTabIndex * screenWidth)).current;

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
    inputRange: [0, screenWidth, screenWidth * 2, screenWidth * 3, screenWidth * 4],
    outputRange: homeTabs.map((t, index) => tabLayouts[t.id]?.x != null ? tabLayouts[t.id].x : (index * 75 + 16)),
    extrapolate: 'clamp'
  });

  const animatedUnderlineWidth = homePagerScrollX.interpolate({
    inputRange: [0, screenWidth, screenWidth * 2, screenWidth * 3, screenWidth * 4],
    outputRange: homeTabs.map(t => tabLayouts[t.id]?.width != null ? tabLayouts[t.id].width : 50),
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
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* MODERN UNIFIED CLEAN TOP HEADER (CREX STYLE LIGHT THEME) */}
      <View style={{
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 14,
        paddingTop: Platform.OS === 'ios' ? 12 : 14,
        paddingBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        minHeight: 60
      }}>
        {isSearchExpanded || Boolean(searchQuery) ? (
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#F1F5F9',
              borderRadius: 9,
              paddingHorizontal: 10,
              height: 36,
              borderWidth: 1,
              borderColor: '#0284C7'
            }}>
              <Ionicons name="search" size={15} color="#0284C7" style={{ marginRight: 6 }} />
              <TextInput
                style={{
                  flex: 1,
                  color: '#0F172A',
                  fontSize: 12.5,
                  fontFamily: systemFontMedium,
                  paddingVertical: 0
                }}
                placeholder="Search matches, players..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
                autoFocus
              />
              {Boolean(searchQuery) && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={{ padding: 4 }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={15} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setIsSearchExpanded(false);
                if (setSearchQuery) setSearchQuery('');
                Keyboard.dismiss();
              }}
              style={{ paddingHorizontal: 6, paddingVertical: 6 }}
              activeOpacity={0.7}
            >
              <Text style={{ color: '#0284C7', fontSize: 12.5, fontFamily: systemFontMedium }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* LOGO & APP BRAND */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Image source={require('../../assets/logo.png')} style={{ width: 34, height: 34, resizeMode: 'contain' }} />
              <Text style={{ fontSize: 18.5, color: '#0F172A', fontFamily: systemFontBold, letterSpacing: -0.2 }}>
                Cric<Text style={{ color: '#0284C7' }}>Flow</Text>
              </Text>
            </View>

            {/* BALANCED SEARCH BAR RIGHT ALIGNED NEAR NOTIFICATION */}
            <TouchableOpacity
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setIsSearchExpanded(true);
              }}
              activeOpacity={0.75}
              style={{
                width: 185,
                marginLeft: 'auto',
                marginRight: 6,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#F1F5F9',
                borderRadius: 9,
                paddingHorizontal: 10,
                height: 36,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                gap: 6
              }}
            >
              <Ionicons name="search" size={15} color="#64748B" />
              <Text style={{ color: '#64748B', fontSize: 12, fontFamily: systemFontMedium, flex: 1 }} numberOfLines={1}>
                Search match, player...
              </Text>
            </TouchableOpacity>

            {/* NOTIFICATION BELL ICON */}
            <TouchableOpacity
              onPress={() => showToast ? showToast('You have no new notifications', 'info', 'Notifications') : null}
              activeOpacity={0.7}
              style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                backgroundColor: '#F8FAFC',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: '#E2E8F0',
                position: 'relative'
              }}
            >
              <Ionicons name="notifications-outline" size={18} color="#334155" />
              <View style={{
                position: 'absolute',
                top: 7,
                right: 7,
                width: 6.5,
                height: 6.5,
                borderRadius: 3.5,
                backgroundColor: '#0284C7',
                borderWidth: 1,
                borderColor: '#FFFFFF'
              }} />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* MATCHES SUB-TABS (CREX STYLE CLEAN TEXT-ONLY UNDERLINE TABS) */}
      {(bottomNavTab === 'matches' || bottomNavTab === 'home' || !bottomNavTab) && (
        <View style={{
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#E2E8F0',
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
                    fontSize: 15.5,
                    color: active ? '#0284C7' : '#475569',
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
              height: 3,
              borderRadius: 2,
              backgroundColor: '#0284C7',
              transform: [{ translateX: animatedUnderlineX }]
            }} />
          </ScrollView>
        </View>
      )}

      {/* BODY (SEARCH RESULTS, ABOUT TAB, OR MATCHES SWIPE PAGER) */}
      {Boolean(searchQuery && searchQuery.trim().length > 0) ? (
        <ScrollView
          style={{ flex: 1, backgroundColor: '#F8FAFC' }}
          contentContainerStyle={[styles.tabContent, { paddingBottom: 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {(() => {
            const q = searchQuery.toLowerCase().trim();
            const qClean = q.replace(/\D/g, '');

            // 1. Search Players
            const allPlayersMap = new Map();
            (localPlayersList || []).forEach(p => { if (p?.name) allPlayersMap.set(p.name.trim().toLowerCase(), p); });
            (MASTER_PLAYERS_DB || []).forEach(p => { if (p?.name && !allPlayersMap.has(p.name.trim().toLowerCase())) allPlayersMap.set(p.name.trim().toLowerCase(), p); });
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

            const isLiveMatchMatch = activeMatch && (() => {
              const t1 = (activeMatch.innings?.[0]?.battingTeam?.name || activeMatch.teams?.[0]?.name || '').toLowerCase();
              const t2 = (activeMatch.innings?.[0]?.bowlingTeam?.name || activeMatch.teams?.[1]?.name || '').toLowerCase();
              const title = (activeMatch.matchTitle || '').toLowerCase();
              const venue = (activeMatch.venueName || '').toLowerCase();
              return t1.includes(q) || t2.includes(q) || title.includes(q) || venue.includes(q);
            })();

            const totalResults = matchedPlayers.length + matchedFinished.length + (isLiveMatchMatch ? 1 : 0);

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
                {(isLiveMatchMatch || matchedFinished.length > 0) && (
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, paddingHorizontal: 2 }}>
                      <Ionicons name="trophy-outline" size={15} color="#0284C7" />
                      <Text style={[styles.sectionLabel, { marginBottom: 0 }]}>
                        MATCHES ({ (isLiveMatchMatch ? 1 : 0) + matchedFinished.length })
                      </Text>
                    </View>
                    {isLiveMatchMatch && renderActiveMatchListCard && renderActiveMatchListCard()}
                    {matchedFinished.map(f => renderFinishedMatchListCard && renderFinishedMatchListCard(f))}
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
        </ScrollView>
      ) : bottomNavTab === 'profile' ? (
        <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
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
      ) : bottomNavTab === 'about' ? (
        <ScrollView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          <AboutAppScreen />
        </ScrollView>
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
              style={{ flex: 1, backgroundColor: '#F8FAFC' }}
              contentContainerStyle={styles.tabContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              scrollEventThrottle={16}
              removeClippedSubviews={true}
              overScrollMode="never"
              decelerationRate="normal"
              nestedScrollEnabled={true}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handlePullToRefresh}
                  colors={['#0284C7']}
                  tintColor="#0284C7"
                />
              }
            >
              {/* Top Featured / Live Match Banner */}
              {activeMatchVisible && (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 2 }}>
                    <Text style={{ fontSize: 11, color: '#64748B', fontFamily: systemFontMedium, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                      FEATURED LIVE MATCH
                    </Text>
                    <View style={{ backgroundColor: '#EF4444', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                      <Text style={{ color: '#FFFFFF', fontSize: 9.5, fontFamily: systemFontMedium }}>LIVE</Text>
                    </View>
                  </View>
                  {renderActiveMatchListCard && renderActiveMatchListCard()}
                </>
              )}

              {/* Ground Spotlight (Top Batsman, Bowler, All-Rounder) */}
              {(TOP_BATTERS.length > 0 || TOP_BOWLERS.length > 0 || TOP_ALLROUNDERS.length > 0) && (
                <View style={{ marginTop: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 2 }}>
                    <Text style={{ fontSize: 11, color: '#64748B', fontFamily: systemFontMedium, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                      GROUND SPOTLIGHT
                    </Text>
                    <TouchableOpacity onPress={() => onTabPress('playerStats', 3)}>
                      <Text style={{ color: '#0284C7', fontSize: 11.5, fontFamily: systemFontMedium }}>View All ➜</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {/* Top Batsman Card */}
                    {TOP_BATTERS[0] ? (
                      <TouchableOpacity
                        onPress={() => handlePlayerPress(TOP_BATTERS[0].name, { role: 'Top Batsman', photoUrl: TOP_BATTERS[0].photoUrl })}
                        activeOpacity={0.75}
                        style={{
                          flex: 1,
                          backgroundColor: '#FFFFFF',
                          borderRadius: 14,
                          paddingVertical: 10,
                          paddingHorizontal: 6,
                          borderWidth: 1,
                          borderColor: '#E2E8F0',
                          alignItems: 'center',
                          gap: 5
                        }}
                      >
                        <View style={{ position: 'relative' }}>
                          <PlayerAvatar name={TOP_BATTERS[0].name} photoUrl={TOP_BATTERS[0].photoUrl} size={38} />
                          <View style={{ position: 'absolute', bottom: -2, right: -2, backgroundColor: '#0284C7', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 5, borderWidth: 1.5, borderColor: '#FFFFFF' }}>
                            <Text style={{ color: '#FFFFFF', fontSize: 8.5, fontFamily: systemFontMedium }}>#1</Text>
                          </View>
                        </View>
                        <Text style={{ fontSize: 11.5, color: '#0F172A', fontFamily: systemFontMedium, textAlign: 'center' }} numberOfLines={1}>
                          {TOP_BATTERS[0].name}
                        </Text>
                        <View style={{ backgroundColor: '#F0F9FF', paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 5, borderWidth: 1, borderColor: '#BAE6FD' }}>
                          <Text style={{ fontSize: 9, color: '#0284C7', fontFamily: systemFontMedium }}>BATTER</Text>
                        </View>
                        <View style={{ width: '100%', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 5, alignItems: 'center' }}>
                          <Text style={{ fontSize: 12, color: '#0F172A', fontFamily: systemFontMedium }}>{TOP_BATTERS[0].runs} Runs</Text>
                          <Text style={{ fontSize: 9.5, color: '#64748B', fontFamily: systemFontMedium }} numberOfLines={1}>SR: {TOP_BATTERS[0].sr || '0.0'}</Text>
                        </View>
                      </TouchableOpacity>
                    ) : null}

                    {/* Top Bowler Card */}
                    {TOP_BOWLERS[0] ? (
                      <TouchableOpacity
                        onPress={() => handlePlayerPress(TOP_BOWLERS[0].name, { role: 'Top Bowler', photoUrl: TOP_BOWLERS[0].photoUrl })}
                        activeOpacity={0.75}
                        style={{
                          flex: 1,
                          backgroundColor: '#FFFFFF',
                          borderRadius: 14,
                          paddingVertical: 10,
                          paddingHorizontal: 6,
                          borderWidth: 1,
                          borderColor: '#E2E8F0',
                          alignItems: 'center',
                          gap: 5
                        }}
                      >
                        <View style={{ position: 'relative' }}>
                          <PlayerAvatar name={TOP_BOWLERS[0].name} photoUrl={TOP_BOWLERS[0].photoUrl} size={38} />
                          <View style={{ position: 'absolute', bottom: -2, right: -2, backgroundColor: '#7C3AED', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 5, borderWidth: 1.5, borderColor: '#FFFFFF' }}>
                            <Text style={{ color: '#FFFFFF', fontSize: 8.5, fontFamily: systemFontMedium }}>#1</Text>
                          </View>
                        </View>
                        <Text style={{ fontSize: 11.5, color: '#0F172A', fontFamily: systemFontMedium, textAlign: 'center' }} numberOfLines={1}>
                          {TOP_BOWLERS[0].name}
                        </Text>
                        <View style={{ backgroundColor: '#FDF4FF', paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 5, borderWidth: 1, borderColor: '#F5D0FE' }}>
                          <Text style={{ fontSize: 9, color: '#7C3AED', fontFamily: systemFontMedium }}>BOWLER</Text>
                        </View>
                        <View style={{ width: '100%', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 5, alignItems: 'center' }}>
                          <Text style={{ fontSize: 12, color: '#0F172A', fontFamily: systemFontMedium }}>{TOP_BOWLERS[0].wickets} Wkts</Text>
                          <Text style={{ fontSize: 9.5, color: '#64748B', fontFamily: systemFontMedium }} numberOfLines={1}>Eco: {TOP_BOWLERS[0].econ || '0.0'}</Text>
                        </View>
                      </TouchableOpacity>
                    ) : null}

                    {/* Top All-Rounder Card */}
                    {TOP_ALLROUNDERS[0] ? (
                      <TouchableOpacity
                        onPress={() => handlePlayerPress(TOP_ALLROUNDERS[0].name, { role: 'All-Rounder', photoUrl: TOP_ALLROUNDERS[0].photoUrl })}
                        activeOpacity={0.75}
                        style={{
                          flex: 1,
                          backgroundColor: '#FFFFFF',
                          borderRadius: 14,
                          paddingVertical: 10,
                          paddingHorizontal: 6,
                          borderWidth: 1,
                          borderColor: '#E2E8F0',
                          alignItems: 'center',
                          gap: 5
                        }}
                      >
                        <View style={{ position: 'relative' }}>
                          <PlayerAvatar name={TOP_ALLROUNDERS[0].name} photoUrl={TOP_ALLROUNDERS[0].photoUrl} size={38} />
                          <View style={{ position: 'absolute', bottom: -2, right: -2, backgroundColor: '#059669', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 5, borderWidth: 1.5, borderColor: '#FFFFFF' }}>
                            <Text style={{ color: '#FFFFFF', fontSize: 8.5, fontFamily: systemFontMedium }}>#1</Text>
                          </View>
                        </View>
                        <Text style={{ fontSize: 11.5, color: '#0F172A', fontFamily: systemFontMedium, textAlign: 'center' }} numberOfLines={1}>
                          {TOP_ALLROUNDERS[0].name}
                        </Text>
                        <View style={{ backgroundColor: '#F0FDF4', paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 5, borderWidth: 1, borderColor: '#BBF7D0' }}>
                          <Text style={{ fontSize: 9, color: '#059669', fontFamily: systemFontMedium }}>ALL-R</Text>
                        </View>
                        <View style={{ width: '100%', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 5, alignItems: 'center' }}>
                          <Text style={{ fontSize: 12, color: '#0F172A', fontFamily: systemFontMedium }}>{TOP_ALLROUNDERS[0].runs}R • {TOP_ALLROUNDERS[0].wickets}W</Text>
                          <Text style={{ fontSize: 9.5, color: '#64748B', fontFamily: systemFontMedium }} numberOfLines={1}>{TOP_ALLROUNDERS[0].matches || 1} Matches</Text>
                        </View>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              )}

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
                      {groups[dKey].map(m => renderFinishedMatchListCard && renderFinishedMatchListCard(m))}
                    </View>
                  ));
                })()
              ) : null}
            </ScrollView>
          </View>

          {/* 1. LIVE MATCHES PAGE */}
          <View style={{ width: screenWidth, flex: 1 }}>
            <ScrollView
              style={{ flex: 1, backgroundColor: '#F8FAFC' }}
              contentContainerStyle={styles.tabContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              scrollEventThrottle={16}
              removeClippedSubviews={true}
              overScrollMode="never"
              decelerationRate="normal"
              nestedScrollEnabled={true}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handlePullToRefresh}
                  colors={['#0284C7']}
                  tintColor="#0284C7"
                />
              }
            >

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 2 }}>
                <Text style={{ fontSize: 11.5, fontFamily: systemFontMedium, color: '#64748B', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                  {activeMatchVisible ? 'LIVE MATCH' : 'FEATURED MATCH'}
                </Text>
              </View>

              {activeMatchVisible ? (
                renderActiveMatchListCard && renderActiveMatchListCard()
              ) : (
                <View style={styles.idleCard}>
                  <View style={styles.idleIconBg}><MaterialCommunityIcons name="cricket" size={28} color="#0284C7" /></View>
                  <Text style={styles.idleTitle}>No Live Match Currently</Text>
                  <Text style={{ color: '#94A3B8', fontSize: 11, fontFamily: systemFontMedium, marginTop: 4 }}>Live match scorecards will appear here</Text>
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
                      {groups[dKey].map(m => renderFinishedMatchListCard && renderFinishedMatchListCard(m))}
                    </View>
                  ));
                })()
              ) : null}
            </ScrollView>
          </View>

          {/* 2. UPCOMING MATCHES PAGE */}
          <View style={{ width: screenWidth, flex: 1 }}>
            <ScrollView
              style={{ flex: 1, backgroundColor: '#F8FAFC' }}
              contentContainerStyle={styles.tabContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              scrollEventThrottle={16}
              removeClippedSubviews={true}
              overScrollMode="never"
              decelerationRate="normal"
              nestedScrollEnabled={true}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handlePullToRefresh}
                  colors={['#0284C7']}
                  tintColor="#0284C7"
                />
              }
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 2 }}>
                <Text style={{ fontSize: 11, fontWeight: fontWeights.bold, color: '#64748B', fontFamily: systemFont, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                  SCHEDULED UPCOMING MATCHES ({upcomingMatches?.length || 0})
                </Text>
              </View>

              {(!upcomingMatches || upcomingMatches.length === 0) ? (
                <View style={styles.idleCard}>
                  <View style={styles.idleIconBg}>
                    <Ionicons name="calendar-outline" size={28} color="#0284C7" />
                  </View>
                  <Text style={styles.idleTitle}>No Upcoming Matches Scheduled</Text>
                  <Text style={{ color: '#94A3B8', fontSize: 11, fontFamily: systemFontMedium, marginTop: 4, textAlign: 'center' }}>
                    Scheduled matches and upcoming fixtures will appear here
                  </Text>
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
              style={{ flex: 1, backgroundColor: '#F8FAFC' }}
              contentContainerStyle={styles.tabContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              scrollEventThrottle={16}
              removeClippedSubviews={true}
              overScrollMode="never"
              decelerationRate="normal"
              nestedScrollEnabled={true}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handlePullToRefresh}
                  colors={['#0284C7']}
                  tintColor="#0284C7"
                />
              }
            >
              {(() => {
                if (!visibleFinishedMatches || visibleFinishedMatches.length === 0) {
                  return (
                    <View style={[styles.idleCard, { borderRadius: 12 }]}>
                      <View style={styles.idleIconBg}>
                        <MaterialCommunityIcons name="trophy-outline" size={28} color="#0284C7" />
                      </View>
                      <Text style={styles.idleTitle}>No Finished Matches Yet</Text>
                      <Text style={{ color: '#94A3B8', fontSize: 11, fontFamily: systemFontMedium, marginTop: 4, textAlign: 'center' }}>Completed matches will be saved date-wise here</Text>
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
                    {groups[dateKey].map(f => renderFinishedMatchListCard && renderFinishedMatchListCard(f))}
                  </View>
                ));
              })()}
            </ScrollView>
          </View>

          {/* 3. RANKINGS LEADERBOARD PAGE */}
          <View style={{ width: screenWidth, flex: 1 }}>
            <ScrollView
              style={{ flex: 1, backgroundColor: '#F8FAFC' }}
              contentContainerStyle={styles.tabContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              scrollEventThrottle={16}
              removeClippedSubviews={true}
              overScrollMode="never"
              decelerationRate="normal"
              nestedScrollEnabled={true}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handlePullToRefresh}
                  colors={['#0284C7']}
                  tintColor="#0284C7"
                />
              }
            >
              <Text style={styles.sectionLabel}>PLAYER LEADERBOARD RANKINGS</Text>

              {/* Sub-Category Pills: Batters, Bowlers, All-rounders */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                {[
                  { id: 'batters', label: 'Batters', icon: 'cricket', isMCI: true },
                  { id: 'bowlers', label: 'Bowlers', icon: 'baseball', isMCI: true },
                  { id: 'allrounders', label: 'All-Rounders', icon: 'star-circle-outline', isMCI: true }
                ].map(cat => {
                  const isActive = statsCategory === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      activeOpacity={0.7}
                      onPress={() => setStatsCategory(cat.id)}
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        paddingVertical: 9,
                        paddingHorizontal: 8,
                        borderRadius: 10,
                        backgroundColor: isActive ? '#0284C7' : '#FFFFFF',
                        borderWidth: 1,
                        borderColor: isActive ? '#0284C7' : '#E2E8F0'
                      }}
                    >
                      {cat.isMCI ? (
                        <MaterialCommunityIcons name={cat.icon} size={15} color={isActive ? '#FFFFFF' : '#64748B'} />
                      ) : (
                        <Ionicons name={cat.icon} size={15} color={isActive ? '#FFFFFF' : '#64748B'} />
                      )}
                      <Text style={{
                        fontSize: 12,
                        fontFamily: systemFontMedium,
                        color: isActive ? '#FFFFFF' : '#64748B'
                      }} numberOfLines={1}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* BATTERS RANKINGS */}
              {statsCategory === 'batters' && (TOP_BATTERS && TOP_BATTERS.length > 0) && (
                <View style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  overflow: 'hidden',
                  marginBottom: 16
                }}>
                  {/* CARD TABLE HEADER */}
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 9,
                    backgroundColor: '#F8FAFC',
                    borderBottomWidth: 1,
                    borderBottomColor: '#E2E8F0'
                  }}>
                    <Text style={{ fontSize: 11, color: '#64748B', fontFamily: systemFontMedium, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Rank & Player
                    </Text>
                    <Text style={{ fontSize: 11, color: '#64748B', fontFamily: systemFontMedium, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Runs (SR)
                    </Text>
                  </View>

                  {TOP_BATTERS.map((b, idx) => {
                    const isLast = idx === TOP_BATTERS.length - 1;
                    return (
                      <FadeSlideIn key={`bat-${b.name}-${b.rank}`} delay={Math.min(idx * 30, 240)} distance={6}>
                        <ScalePressable
                          activeScale={0.985}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 12,
                            paddingHorizontal: 16,
                            borderBottomWidth: isLast ? 0 : 1,
                            borderBottomColor: '#F1F5F9'
                          }}
                          onPress={() => handlePlayerPress(b.name, { role: b.role, photoUrl: b.photoUrl, city: b.city })}
                        >
                          <Text style={{
                            width: 28,
                            fontSize: 15,
                            color: b.rank <= 3 ? '#0F172A' : '#64748B',
                            fontFamily: systemFontMedium
                          }}>
                            {b.rank}
                          </Text>
                          <PlayerAvatar name={b.name} photoUrl={b.photoUrl} size={44} />
                          <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={{ fontSize: 14.5, color: '#0F172A', fontFamily: systemFontMedium }} numberOfLines={1}>
                              {b.name}
                            </Text>
                            <Text style={{ fontSize: 12, color: '#64748B', marginTop: 1, fontFamily: systemFont }} numberOfLines={1}>
                              {b.city || 'Sadokan'}
                            </Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ fontSize: 14.5, color: '#0F172A', fontFamily: systemFontMedium }}>
                              {b.runs}
                            </Text>
                            <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 1, fontFamily: systemFont }}>
                              SR {b.sr}
                            </Text>
                          </View>
                        </ScalePressable>
                      </FadeSlideIn>
                    );
                  })}
                </View>
              )}

              {/* BOWLERS RANKINGS */}
              {statsCategory === 'bowlers' && (TOP_BOWLERS && TOP_BOWLERS.length > 0) && (
                <View style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  overflow: 'hidden',
                  marginBottom: 16
                }}>
                  {/* CARD TABLE HEADER */}
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 9,
                    backgroundColor: '#F8FAFC',
                    borderBottomWidth: 1,
                    borderBottomColor: '#E2E8F0'
                  }}>
                    <Text style={{ fontSize: 11, color: '#64748B', fontFamily: systemFontMedium, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Rank & Player
                    </Text>
                    <Text style={{ fontSize: 11, color: '#64748B', fontFamily: systemFontMedium, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Wickets (Eco)
                    </Text>
                  </View>

                  {TOP_BOWLERS.map((b, idx) => {
                    const isLast = idx === TOP_BOWLERS.length - 1;
                    return (
                      <FadeSlideIn key={`bowl-${b.name}-${b.rank}`} delay={Math.min(idx * 30, 240)} distance={6}>
                        <ScalePressable
                          activeScale={0.985}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 12,
                            paddingHorizontal: 16,
                            borderBottomWidth: isLast ? 0 : 1,
                            borderBottomColor: '#F1F5F9'
                          }}
                          onPress={() => handlePlayerPress(b.name, { role: b.role, photoUrl: b.photoUrl, city: b.city })}
                        >
                          <Text style={{
                            width: 28,
                            fontSize: 15,
                            color: b.rank <= 3 ? '#0F172A' : '#64748B',
                            fontFamily: systemFontMedium
                          }}>
                            {b.rank}
                          </Text>
                          <PlayerAvatar name={b.name} photoUrl={b.photoUrl} size={44} />
                          <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={{ fontSize: 14.5, color: '#0F172A', fontFamily: systemFontMedium }} numberOfLines={1}>
                              {b.name}
                            </Text>
                            <Text style={{ fontSize: 12, color: '#64748B', marginTop: 1, fontFamily: systemFont }} numberOfLines={1}>
                              {b.city || 'Sadokan'}
                            </Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ fontSize: 14.5, color: '#0F172A', fontFamily: systemFontMedium }}>
                              {b.wickets} Wkts
                            </Text>
                            <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 1, fontFamily: systemFont }}>
                              ECO {b.econ}
                            </Text>
                          </View>
                        </ScalePressable>
                      </FadeSlideIn>
                    );
                  })}
                </View>
              )}

              {/* ALL-ROUNDERS RANKINGS */}
              {statsCategory === 'allrounders' && (TOP_ALLROUNDERS && TOP_ALLROUNDERS.length > 0) && (
                <View style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  overflow: 'hidden',
                  marginBottom: 16
                }}>
                  {/* CARD TABLE HEADER */}
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 9,
                    backgroundColor: '#F8FAFC',
                    borderBottomWidth: 1,
                    borderBottomColor: '#E2E8F0'
                  }}>
                    <Text style={{ fontSize: 11, color: '#64748B', fontFamily: systemFontMedium, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Rank & Player
                    </Text>
                    <Text style={{ fontSize: 11, color: '#64748B', fontFamily: systemFontMedium, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      MVP Points
                    </Text>
                  </View>

                  {TOP_ALLROUNDERS.map((b, idx) => {
                    const isLast = idx === TOP_ALLROUNDERS.length - 1;
                    return (
                      <FadeSlideIn key={`all-${b.name}-${b.rank}`} delay={Math.min(idx * 30, 240)} distance={6}>
                        <ScalePressable
                          activeScale={0.985}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 12,
                            paddingHorizontal: 16,
                            borderBottomWidth: isLast ? 0 : 1,
                            borderBottomColor: '#F1F5F9'
                          }}
                          onPress={() => handlePlayerPress(b.name, { role: b.role, photoUrl: b.photoUrl, city: b.city })}
                        >
                          <Text style={{
                            width: 28,
                            fontSize: 15,
                            color: b.rank <= 3 ? '#0F172A' : '#64748B',
                            fontFamily: systemFontMedium
                          }}>
                            {b.rank}
                          </Text>
                          <PlayerAvatar name={b.name} photoUrl={b.photoUrl} size={44} />
                          <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={{ fontSize: 14.5, color: '#0F172A', fontFamily: systemFontMedium }} numberOfLines={1}>
                              {b.name}
                            </Text>
                            <Text style={{ fontSize: 12, color: '#64748B', marginTop: 1, fontFamily: systemFont }} numberOfLines={1}>
                              {b.city || 'Sadokan'}
                            </Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ fontSize: 14.5, color: '#0F172A', fontFamily: systemFontMedium }}>
                              {b.pts}
                            </Text>
                            <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 1, fontFamily: systemFont }}>
                              MVP Points
                            </Text>
                          </View>
                        </ScalePressable>
                      </FadeSlideIn>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          </View>
        </Animated.ScrollView>
      )}

      {/* INDUSTRIAL STANDARD BOTTOM NAVIGATION BAR */}
      <AppBottomNav
        activeTab={bottomNavTab}
        onTabChange={(tabId) => {
          if (tabId === 'matches' || tabId === 'home') {
            if (setMatchesSubTab) setMatchesSubTab('live');
          }
          if (setBottomNavTab) setBottomNavTab(tabId);
        }}
      />
    </View>
  );
}

export default HomeScreen;
