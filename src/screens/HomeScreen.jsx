import React, { useRef, useEffect } from 'react';
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
  BackHandler
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { systemFont, systemFontBold, systemFontMedium, fontWeights, theme, typeScale } from '../theme.js';
import { AppBottomNav } from '../components/navigation/AppBottomNav.jsx';
import { AboutAppScreen } from '../components/AboutAppScreen.jsx';
import { MyProfileScreen } from './MyProfileScreen.jsx';
import { PlayerAvatar } from '../components/PlayerAvatar.jsx';
import { LinearGradient } from 'expo-linear-gradient';
import { ScalePressable, FadeSlideIn } from '../components/motion/MotionSystem.jsx';

export function HomeScreen({
  openScorerScreen,
  searchQuery,
  setSearchQuery,
  bottomNavTab = 'matches',
  setBottomNavTab,
  matchesSubTab = 'live',
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
  setSelectedMatch
}) {
  const { width: screenWidth } = useWindowDimensions();
  const homePagerRef = useRef(null);

  const handlePlayerPress = (name, extraProps = {}) => {
    const dbFound = localPlayersList.find(p => p && p.name && p.name.trim().toLowerCase() === String(name).trim().toLowerCase())
      || MASTER_PLAYERS_DB.find(p => p && p.name && p.name.trim().toLowerCase() === String(name).trim().toLowerCase());
    const profile = dbFound || (getSetupPlayerProfile ? getSetupPlayerProfile(name) : { name, role: extraProps.role || 'Local Player', photoUrl: extraProps.photoUrl, city: extraProps.city });
    
    if (setSelectedPlayerName) setSelectedPlayerName(name);
    if (setSelectedPlayerProfile) setSelectedPlayerProfile(profile);
    if (setCurrentScreen) setCurrentScreen('playerProfile');
  };
  const homeTabs = [
    { id: 'live', label: 'Live', icon: 'radio-outline' },
    { id: 'finished', label: 'Finished', icon: 'trophy-outline' },
    { id: 'playerStats', label: 'Rankings', icon: 'stats-chart-outline' }
  ];
  const activeTabIndex = Math.max(0, homeTabs.findIndex(t => t.id === matchesSubTab));
  const homePagerScrollX = useRef(new Animated.Value(activeTabIndex * screenWidth)).current;

  const tabWidth = screenWidth / 3;
  const indicatorTranslateX = homePagerScrollX.interpolate({
    inputRange: [0, screenWidth, screenWidth * 2],
    outputRange: [0, tabWidth, tabWidth * 2],
    extrapolate: 'clamp'
  });

  const onTabPress = (tabId, index) => {
    setMatchesSubTab(tabId);
    homePagerRef.current?.scrollTo({ x: index * screenWidth, animated: true });
  };

  const handleHomePagerEnd = (e) => {
    const offset = e.nativeEvent.contentOffset.x;
    const index = Math.round(offset / screenWidth);
    if (homeTabs[index] && matchesSubTab !== homeTabs[index].id) {
      setMatchesSubTab(homeTabs[index].id);
    }
  };

  useEffect(() => {
    const targetOffset = activeTabIndex * screenWidth;
    homePagerRef.current?.scrollTo({ x: targetOffset, animated: false });
    homePagerScrollX.setValue(targetOffset);
  }, [matchesSubTab, bottomNavTab, screenWidth]);

  // Handle Android Hardware Back Button
  useEffect(() => {
    const onBackPress = () => {
      if (searchQuery && searchQuery.trim().length > 0) {
        if (setSearchQuery) setSearchQuery('');
        return true;
      }
      if (bottomNavTab !== 'matches' && bottomNavTab !== 'home') {
        if (setBottomNavTab) setBottomNavTab('matches');
        if (setMatchesSubTab) setMatchesSubTab('live');
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [searchQuery, bottomNavTab]);

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Image source={require('../../assets/logo.png')} style={styles.logoImg} />
          <Text style={{ fontSize: 18, color: '#FFFFFF', fontFamily: systemFontBold }}>
            Cric <Text style={{ color: '#38BDF8' }}>Scorer</Text>
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 20,
              backgroundColor: activeMatch && (activeMatch.phase === 'playing' || activeMatch.phase === 'inningBreak') && isScorerUnlocked
                ? '#059669'
                : '#0284C7',
            }}
            onPress={openScorerScreen}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={activeMatch && (activeMatch.phase === 'playing' || activeMatch.phase === 'inningBreak') && isScorerUnlocked
                ? "scoreboard"
                : "key-outline"
              }
              size={15}
              color="#FFFFFF"
            />
            <Text style={{
              color: '#FFFFFF',
              fontSize: 12,
              fontFamily: systemFontBold,
            }}>
              {activeMatch && (activeMatch.phase === 'playing' || activeMatch.phase === 'inningBreak') && isScorerUnlocked
                ? 'Scorer Console'
                : 'Scorer Login'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={17} color="#0284C7" style={{ marginLeft: 12 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search player, team, ground..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94A3B8"
            returnKeyType="search"
          />
          {Boolean(searchQuery) && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                Keyboard.dismiss();
              }}
              style={{ padding: 8, marginRight: 4 }}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* MATCHES SUB-TABS (SCORECARD SWIPER STYLE UNDERLINE TABS) */}
      {(bottomNavTab === 'matches' || bottomNavTab === 'home' || !bottomNavTab) && (
        <View style={{
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#E2E8F0',
          position: 'relative'
        }}>
          <View style={{ flexDirection: 'row' }}>
            {homeTabs.map((t, idx) => {
              const active = matchesSubTab === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => onTabPress(t.id, idx)}
                  activeOpacity={0.7}
                  style={{
                    width: tabWidth,
                    paddingVertical: 12,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons
                      name={t.icon}
                      size={16}
                      color={active ? '#0284C7' : '#64748B'}
                    />
                    <Text style={{
                      fontSize: 14.5,
                      color: active ? '#0284C7' : '#64748B',
                      fontFamily: active ? systemFontBold : systemFontMedium
                    }}>
                      {t.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Animated Smooth Underline Indicator */}
          <Animated.View style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: tabWidth,
            height: 3,
            alignItems: 'center',
            transform: [{ translateX: indicatorTranslateX }]
          }}>
            <View style={{ width: 44, height: 3, borderRadius: 2, backgroundColor: '#0284C7' }} />
          </Animated.View>
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
          contentOffset={{ x: activeTabIndex * screenWidth, y: 0 }}
          onLayout={() => {
            const targetOffset = activeTabIndex * screenWidth;
            homePagerRef.current?.scrollTo({ x: targetOffset, animated: false });
            homePagerScrollX.setValue(targetOffset);
          }}
          snapToInterval={screenWidth}
          snapToAlignment="start"
          disableIntervalMomentum
          directionalLockEnabled
          nestedScrollEnabled
          bounces={false}
          overScrollMode="never"
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: homePagerScrollX } } }],
            { useNativeDriver: false }
          )}
          onMomentumScrollEnd={handleHomePagerEnd}
          style={{ flex: 1 }}
        >
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
                <Text style={{ fontSize: 12, fontWeight: fontWeights.bold, color: '#64748B', fontFamily: systemFont, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                  {activeMatchVisible ? 'LIVE MATCH' : 'FEATURED MATCH'}
                </Text>
              </View>

              {activeMatchVisible ? (
                renderActiveMatchListCard && renderActiveMatchListCard()
              ) : (
                <View style={styles.idleCard}>
                  <View style={styles.idleIconBg}><MaterialCommunityIcons name="cricket" size={28} color="#0284C7" /></View>
                  <Text style={styles.idleTitle}>No Live Match Currently</Text>
                  <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: fontWeights.medium, marginTop: 4, fontFamily: systemFont }}>Live match scorecards will appear here</Text>
                </View>
              )}

              {recentFinishedMatches && recentFinishedMatches.length > 0 ? (
                <>
                  <Text style={[styles.sectionLabel, { marginTop: 14 }]}>RECENT MATCH RESULTS</Text>
                  {recentFinishedMatches.map(m => renderFinishedMatchListCard && renderFinishedMatchListCard(m))}
                </>
              ) : null}
            </ScrollView>
          </View>

          {/* 2. FINISHED MATCHES PAGE */}
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
                    <View style={[styles.idleCard, { borderRadius: 8 }]}>
                      <Text style={styles.idleTitle}>No Finished Match Yet</Text>
                      <Text style={{ color: '#94A3B8', fontSize: 11, fontFamily: systemFont }}>Completed matches will be saved date-wise here</Text>
                    </View>
                  );
                }
                const groups = {};
                visibleFinishedMatches.forEach(m => {
                  const dateLabel = m.dateLabel || (m.dateText ? m.dateText.split(',')[0] : 'Recent Matches');
                  if (!groups[dateLabel]) groups[dateLabel] = [];
                  groups[dateLabel].push(m);
                });

                return Object.keys(groups).map(dateKey => (
                  <View key={dateKey} style={{ marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, paddingHorizontal: 4 }}>
                      <Ionicons name="calendar-outline" size={14} color="#0284C7" />
                      <Text style={{ fontSize: 12, fontWeight: fontWeights.bold, color: '#0F172A', fontFamily: systemFont }}>{dateKey}</Text>
                      <View style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0', marginLeft: 4 }} />
                    </View>
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

              {/* COLUMN HEADER (CRICBUZZ / ICC STYLE) */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 10,
                marginTop: 2
              }}>
                <Text style={{ fontSize: 12, fontWeight: fontWeights.bold, color: '#94A3B8', fontFamily: systemFontMedium, letterSpacing: 0.3 }}>
                  Rank
                </Text>
                <Text style={{ fontSize: 12, fontWeight: fontWeights.bold, color: '#94A3B8', fontFamily: systemFontMedium, letterSpacing: 0.3 }}>
                  {statsCategory === 'batters' ? 'Runs (SR)' : (statsCategory === 'bowlers' ? 'Wkts (ECO)' : 'MVP Points')}
                </Text>
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
                          <PlayerAvatar name={b.name} photoUrl={b.photoUrl} size={48} />
                          <View style={{ flex: 1, marginLeft: 14 }}>
                            <Text style={{ fontSize: 15, color: '#0F172A', fontFamily: systemFontMedium }} numberOfLines={1}>
                              {b.name}
                            </Text>
                            <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2, fontFamily: systemFont }} numberOfLines={1}>
                              {b.city || 'Sadokan'}
                            </Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ fontSize: 15, color: '#0F172A', fontFamily: systemFontMedium }}>
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
                          <PlayerAvatar name={b.name} photoUrl={b.photoUrl} size={48} />
                          <View style={{ flex: 1, marginLeft: 14 }}>
                            <Text style={{ fontSize: 15, color: '#0F172A', fontFamily: systemFontMedium }} numberOfLines={1}>
                              {b.name}
                            </Text>
                            <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2, fontFamily: systemFont }} numberOfLines={1}>
                              {b.city || 'Sadokan'}
                            </Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ fontSize: 15, color: '#0F172A', fontFamily: systemFontMedium }}>
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
                          <PlayerAvatar name={b.name} photoUrl={b.photoUrl} size={48} />
                          <View style={{ flex: 1, marginLeft: 14 }}>
                            <Text style={{ fontSize: 15, color: '#0F172A', fontFamily: systemFontMedium }} numberOfLines={1}>
                              {b.name}
                            </Text>
                            <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2, fontFamily: systemFont }} numberOfLines={1}>
                              {b.city || 'Sadokan'}
                            </Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ fontSize: 15, color: '#0F172A', fontFamily: systemFontMedium }}>
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
