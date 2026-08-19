import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Keyboard,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  Image,
  useWindowDimensions
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../components/navigation/AppHeader.jsx';
import { AppBottomNav } from '../components/navigation/AppBottomNav.jsx';
import { MatchesScreen } from './MatchesScreen.jsx';
import { RankingsScreen } from './RankingsScreen.jsx';
import { MyProfileScreen } from './MyProfileScreen.jsx';
import { TeamIdentityMark } from '../components/TeamIdentityMark.jsx';
import { PlayerAvatar } from '../components/PlayerAvatar.jsx';
import { MatchListScoreCard } from '../components/MatchListScoreCard.jsx';
import { GroundSpotlightSection } from '../components/GroundSpotlightSection.jsx';
import { SocialConnectCard } from '../components/SocialConnectCard.jsx';
import { ScalePressable, FadeSlideIn } from '../components/motion/MotionSystem.jsx';
import {
  systemFont,
  systemFontMedium,
  systemFontBold,
  fontWeights,
  theme,
  themeColors,
  spacing,
  radius,
  typeScale
} from '../theme.js';
import { getCurrentUser } from '../services/authService.js';

const BANNER_SLIDES = [
  { id: '1', image: require('../../assets/banner_1.jpg') },
  { id: '2', image: require('../../assets/banner_2.jpg') },
  { id: '3', image: require('../../assets/banner_3.jpg') },
];
import { showToast } from '../services/toastService.js';
import {
  formatOvers,
  getScorePartsFromText,
  getFinishedResultCardText,
  getTeamShortCode
} from '../utils/cricketUtils.js';

export function HomeScreen(props) {
  const {
    bottomNavTab = 'home',
    setBottomNavTab,
    openScorerScreen,
    searchQuery = '',
    setSearchQuery,
    TOP_BATTERS = [],
    TOP_BOWLERS = [],
    TOP_ALLROUNDERS = [],
    refreshing = false,
    handlePullToRefresh = null,
    setSelectedPlayerProfile,
    setCurrentScreen,
    finishedArchive = [],
    activeMatch,
    setActiveMatch,
    setSelectedMatch,
    visibleLiveMatches = [],
    recentFinishedMatches = [],
    onJoinMatchByCode
  } = props;

  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [isJoinCodeExpanded, setIsJoinCodeExpanded] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const { width: screenWidth } = useWindowDimensions();
  const bannerWidth = Math.max(screenWidth - spacing.md * 2, 280);
  const [bannerIndex, setBannerIndex] = useState(0);
  const bannerFlatListRef = useRef(null);

  // Auto-play Banner Carousel (3.5s interval)
  useEffect(() => {
    if (BANNER_SLIDES.length <= 1) return;
    const interval = setInterval(() => {
      setBannerIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % BANNER_SLIDES.length;
        if (bannerFlatListRef.current) {
          bannerFlatListRef.current.scrollToOffset({
            offset: nextIndex * bannerWidth,
            animated: true
          });
        }
        return nextIndex;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [bannerWidth]);

  React.useEffect(() => {
    let isMounted = true;
    const fetchUser = async () => {
      const u = await getCurrentUser();
      if (isMounted) setCurrentUser(u);
    };
    fetchUser();
    return () => { isMounted = false; };
  }, [refreshing, bottomNavTab]);

  const handleStartQuickMatch = () => {
    if (!currentUser) {
      showToast({
        type: 'warning',
        message: 'Please sign in first to score matches & protect match records.'
      });
      if (setBottomNavTab) {
        setBottomNavTab('profile');
      }
      return;
    }
    if (openScorerScreen) {
      openScorerScreen();
    }
  };

  // 1. If bottom tab is "matches" -> Render MatchesScreen
  if (bottomNavTab === 'matches') {
    return <MatchesScreen {...props} />;
  }

  // 2. If bottom tab is "rankings" -> Render RankingsScreen with bottom nav
  if (bottomNavTab === 'rankings') {
    return (
      <View style={{ flex: 1, backgroundColor: themeColors.appBackground }}>
        <RankingsScreen
          topBatters={TOP_BATTERS}
          topBowlers={TOP_BOWLERS}
          topAllRounders={TOP_ALLROUNDERS}
          onSelectPlayer={(playerName, meta) => {
            if (setSelectedPlayerProfile) setSelectedPlayerProfile({ name: playerName, ...meta });
            if (setCurrentScreen) setCurrentScreen('playerProfile');
          }}
          refreshing={refreshing}
          onRefresh={handlePullToRefresh}
        />
        <AppBottomNav
          activeTab={bottomNavTab}
          onTabChange={(tabId) => {
            if (setBottomNavTab) setBottomNavTab(tabId);
          }}
        />
      </View>
    );
  }

  // 3. If bottom tab is "profile" -> Render MyProfileScreen with bottom nav
  if (bottomNavTab === 'profile') {
    return (
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
        <AppBottomNav
          activeTab={bottomNavTab}
          onTabChange={(tabId) => {
            if (setBottomNavTab) setBottomNavTab(tabId);
          }}
        />
      </View>
    );
  }

  // Identify Live Matches
  const allLive = visibleLiveMatches.length > 0
    ? visibleLiveMatches
    : (activeMatch && activeMatch.phase !== 'result' && activeMatch.phase !== 'finished' && !activeMatch.isCompleted
      ? [activeMatch]
      : []);

  const primaryLiveMatch = allLive[0] || null;

  // Identify Recent Finished Matches
  const displayedFinished = (recentFinishedMatches.length > 0 ? recentFinishedMatches : finishedArchive).slice(0, 3);

  const topBatter = TOP_BATTERS[0] || null;
  const topBowler = TOP_BOWLERS[0] || null;
  const topAllRounder = TOP_ALLROUNDERS[0] || null;

  // ── Unified Instant Search Logic ──
  const trimmedQuery = (searchQuery || '').trim().toLowerCase();
  const isSearching = trimmedQuery.length > 0;

  // Filter Live Matches
  const filteredLiveMatches = isSearching
    ? allLive.filter((m) => {
        const title = (m.matchTitle || m.title || '').toLowerCase();
        const t1 = (m.team1?.name || m.teams?.[0]?.name || '').toLowerCase();
        const t2 = (m.team2?.name || m.teams?.[1]?.name || '').toLowerCase();
        return title.includes(trimmedQuery) || t1.includes(trimmedQuery) || t2.includes(trimmedQuery);
      })
    : [];

  // Filter Finished Matches
  const allFinishedPool = finishedArchive && finishedArchive.length > 0 ? finishedArchive : recentFinishedMatches;
  const filteredFinishedMatches = isSearching
    ? allFinishedPool.filter((m) => {
        const title = (m.matchTitle || m.title || m.match_title || '').toLowerCase();
        const t1 = (m.team1?.name || m.teams?.[0]?.name || m.inn1BattingTeam || '').toLowerCase();
        const t2 = (m.team2?.name || m.teams?.[1]?.name || m.inn1BowlingTeam || '').toLowerCase();
        return title.includes(trimmedQuery) || t1.includes(trimmedQuery) || t2.includes(trimmedQuery);
      })
    : [];

  // Filter Players Pool
  const allPlayersPool = [];
  const seenPlayerNames = new Set();
  [...TOP_BATTERS, ...TOP_BOWLERS, ...TOP_ALLROUNDERS].forEach((p) => {
    const pName = p.name || p.playerName || p.fullName;
    if (pName && !seenPlayerNames.has(pName.toLowerCase())) {
      seenPlayerNames.add(pName.toLowerCase());
      allPlayersPool.push(p);
    }
  });

  const filteredPlayers = isSearching
    ? allPlayersPool.filter((p) => {
        const pName = (p.name || p.playerName || '').toLowerCase();
        const role = (p.role || '').toLowerCase();
        const team = (p.team || p.city || '').toLowerCase();
        return pName.includes(trimmedQuery) || role.includes(trimmedQuery) || team.includes(trimmedQuery);
      })
    : [];

  const totalSearchCount = filteredLiveMatches.length + filteredFinishedMatches.length + filteredPlayers.length;

  const handleJoinSubmit = () => {
    const code = joinCodeInput.trim().toUpperCase();
    if (!code) return;
    if (onJoinMatchByCode) {
      onJoinMatchByCode(code);
    }
    setJoinCodeInput('');
    setIsJoinCodeExpanded(false);
  };

  // 4. Rich Native Home Dashboard
  return (
    <View style={styles.container}>
      {/* REUSABLE TOP APP HEADER WITH SMOOTH COLLAPSIBLE SEARCH */}
      <AppHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        scrollY={scrollY}
      />

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          handlePullToRefresh ? (
            <RefreshControl
              refreshing={Boolean(refreshing)}
              onRefresh={handlePullToRefresh}
              colors={['#0284C7']}
              tintColor="#0284C7"
            />
          ) : undefined
        }
      >
        {isSearching ? (
          /* ── INSTANT SEARCH RESULTS VIEW ── */
          <FadeSlideIn distance={12} delay={0}>
            <View style={{ gap: spacing.md }}>
              {/* SEARCH RESULTS SUMMARY */}
              <View style={styles.searchSummaryRow}>
                <Text style={styles.searchSummaryText}>
                  Found {totalSearchCount} result{totalSearchCount === 1 ? '' : 's'} for "{searchQuery}"
                </Text>
                <TouchableOpacity
                  onPress={() => (setSearchQuery ? setSearchQuery('') : null)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.searchClearText}>Clear</Text>
                </TouchableOpacity>
              </View>

              {totalSearchCount === 0 ? (
                <View style={styles.emptyCard}>
                  <Ionicons name="search-outline" size={36} color={themeColors.textSubtle} />
                  <Text style={styles.emptyCardTitle}>No matches or players found</Text>
                  <Text style={styles.emptyCardSubtitle}>
                    Try searching with a different player name, team, or match title.
                  </Text>
                </View>
              ) : null}

              {/* FILTERED LIVE MATCHES */}
              {filteredLiveMatches.length > 0 ? (
                <View style={{ gap: spacing.xs }}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitleLive}>LIVE MATCHES ({filteredLiveMatches.length})</Text>
                  </View>
                  {filteredLiveMatches.map((m, idx) => (
                    <ScalePressable
                      key={`search-live-${m.id || idx}`}
                      activeScale={0.98}
                      onPress={() => {
                        if (setActiveMatch) setActiveMatch(m);
                        if (setCurrentScreen) setCurrentScreen('liveView');
                      }}
                      style={[styles.liveMatchCard, { marginBottom: 10 }]}
                    >
                      <View style={styles.liveCardHeader}>
                        <Text style={styles.liveMatchTitle} numberOfLines={1}>
                          {m.matchTitle || m.title || `${m.team1?.name || 'Team 1'} vs ${m.team2?.name || 'Team 2'}`}
                        </Text>
                        <View style={styles.liveTag}>
                          <Text style={styles.liveTagText}>LIVE</Text>
                        </View>
                      </View>
                    </ScalePressable>
                  ))}
                </View>
              ) : null}

              {/* FILTERED FINISHED MATCHES */}
              {filteredFinishedMatches.length > 0 ? (
                <View style={{ gap: spacing.xs }}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>MATCH RESULTS ({filteredFinishedMatches.length})</Text>
                  </View>
                  {filteredFinishedMatches.map((match, idx) => {
                    const teamOneScore = getScorePartsFromText(match.team1?.score);
                    const teamTwoScore = getScorePartsFromText(match.team2?.score);
                    const resultCardText = getFinishedResultCardText(match);
                    const resultColor = match.winnerTeamName === match.team1?.name ? '#0369A1' : '#92400E';
                    const subtitleText = `${match.maxOvers || 5} Overs • ${match.venue || 'Sadokan Ground'}`;

                    return (
                      <View key={`search-fin-${match.id || 'm'}-${idx}`} style={{ marginBottom: 10 }}>
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
                  })}
                </View>
              ) : null}

              {/* FILTERED PLAYERS */}
              {filteredPlayers.length > 0 ? (
                <View style={{ gap: spacing.xs }}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>PLAYERS ({filteredPlayers.length})</Text>
                  </View>
                  <View style={styles.searchPlayerListCard}>
                    {filteredPlayers.map((player, idx) => (
                      <TouchableOpacity
                        key={`search-pl-${player.name || idx}`}
                        style={[
                          styles.searchPlayerRow,
                          idx < filteredPlayers.length - 1 && styles.searchPlayerBorder
                        ]}
                        onPress={() => {
                          if (setSelectedPlayerProfile) setSelectedPlayerProfile(player);
                          if (setCurrentScreen) setCurrentScreen('playerProfile');
                        }}
                        activeOpacity={0.7}
                      >
                        <PlayerAvatar name={player.name} size={36} photoUrl={player.photoUrl || player.photo_url} />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={styles.searchPlayerName}>{player.name}</Text>
                          <Text style={styles.searchPlayerRole}>
                            {player.role || 'Cricket Player'} {player.city || player.team ? `• ${player.city || player.team}` : ''}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={themeColors.textSubtle} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : null}
            </View>
          </FadeSlideIn>
        ) : (
          /* ── REGULAR HOME DASHBOARD ── */
          <>
            {/* ── NATIVE AUTO-PLAY BANNER CAROUSEL ── */}
            <View style={styles.carouselWrap}>
              <FlatList
                ref={bannerFlatListRef}
                data={BANNER_SLIDES}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                snapToInterval={bannerWidth}
                decelerationRate="fast"
                bounces={false}
                onMomentumScrollEnd={(e) => {
                  const contentOffset = e.nativeEvent.contentOffset.x;
                  const newIndex = Math.round(contentOffset / bannerWidth);
                  setBannerIndex(Math.max(0, Math.min(newIndex, BANNER_SLIDES.length - 1)));
                }}
                renderItem={({ item }) => (
                  <View style={[styles.bannerSlideItem, { width: bannerWidth }]}>
                    <Image
                      source={item.image}
                      style={styles.bannerImage}
                      resizeMode="cover"
                    />
                  </View>
                )}
              />

              {/* DOT INDICATORS */}
              <View style={styles.dotsRow}>
                {BANNER_SLIDES.map((_, i) => (
                  <View
                    key={`dot-${i}`}
                    style={[styles.dot, i === bannerIndex && styles.dotActive]}
                  />
                ))}
              </View>
            </View>

            {/* HERO QUICK MATCH ACTIONS (AUTH-PROTECTED) */}
            <FadeSlideIn distance={12} delay={0}>
              <View style={styles.heroActionCard}>
                <View style={styles.heroTextContainer}>
                  <Text style={styles.heroTitle}>
                    {currentUser ? 'LOCAL GROUND CRICKET' : 'SCORER SIGN-IN REQUIRED'}
                  </Text>
                  <Text style={styles.heroSubtitle}>
                    {currentUser
                      ? 'Instant real-time scoring for turf, box & club matches'
                      : 'Sign in to create matches, score games & keep match records secure'}
                  </Text>
                </View>

                <View style={styles.heroButtonsRow}>
                  <ScalePressable
                    activeScale={0.96}
                    onPress={handleStartQuickMatch}
                    style={styles.primaryActionButton}
                  >
                    <MaterialCommunityIcons
                      name={currentUser ? 'cricket' : 'login'}
                      size={16}
                      color={themeColors.heroText}
                    />
                    <Text style={styles.primaryActionText}>
                      {currentUser ? 'Start Quick Match' : 'Sign In to Score'}
                    </Text>
                  </ScalePressable>

                  <ScalePressable
                    activeScale={0.96}
                    onPress={() => setIsJoinCodeExpanded(!isJoinCodeExpanded)}
                    style={styles.secondaryActionButton}
                  >
                    <Ionicons name="enter-outline" size={15} color={themeColors.heroText} />
                    <Text style={styles.secondaryActionText}>Join Match</Text>
                  </ScalePressable>
                </View>

                {/* EXPANDABLE JOIN CODE INPUT */}
                {isJoinCodeExpanded ? (
                  <View style={styles.joinCodeBox}>
                    <TextInput
                      value={joinCodeInput}
                      onChangeText={setJoinCodeInput}
                      placeholder="Enter Match Code (e.g. CF-1234)"
                      placeholderTextColor={themeColors.heroSubtext}
                      autoCapitalize="characters"
                      style={styles.joinCodeInput}
                      returnKeyType="go"
                      onSubmitEditing={handleJoinSubmit}
                    />
                    <TouchableOpacity
                      onPress={handleJoinSubmit}
                      style={styles.joinCodeSubmitBtn}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="arrow-forward" size={15} color={themeColors.heroText} />
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            </FadeSlideIn>



            {/* RECENT MATCHES SECTION */}
            <FadeSlideIn distance={12} delay={100}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>RECENT MATCHES</Text>
                {finishedArchive.length > 0 ? (
                  <TouchableOpacity
                    onPress={() => {
                      if (setBottomNavTab) setBottomNavTab('matches');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.sectionLink}>See all ({finishedArchive.length})</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {displayedFinished.length > 0 ? (
                displayedFinished.map((match, idx) => {
                  const teamOneScore = getScorePartsFromText(match.team1?.score);
                  const teamTwoScore = getScorePartsFromText(match.team2?.score);
                  const resultCardText = getFinishedResultCardText(match);
                  const resultColor = match.winnerTeamName === match.team1?.name ? '#0369A1' : '#92400E';
                  const subtitleText = `${match.maxOvers || 5} Overs • ${match.venue || 'Sadokan Ground'}`;

                  return (
                    <View key={`home-fin-${match.id || 'm'}-${idx}`} style={{ marginBottom: 10 }}>
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
                })
              ) : (
                <View style={styles.emptyCard}>
                  <MaterialCommunityIcons name="cricket" size={36} color="#CBD5E1" />
                  <Text style={styles.emptyCardTitle}>No finished matches yet</Text>
                  <Text style={styles.emptyCardSubtitle}>
                    Score your first ground match to start tracking team results and career stats.
                  </Text>
                  <TouchableOpacity
                    onPress={openScorerScreen}
                    style={styles.emptyCardBtn}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.emptyCardBtnText}>+ Start Match</Text>
                  </TouchableOpacity>
                </View>
              )}
            </FadeSlideIn>

            {/* REUSABLE COLORFUL GROUND SPOTLIGHT */}
            <FadeSlideIn distance={12} delay={150}>
              <GroundSpotlightSection
                topBatters={TOP_BATTERS}
                topBowlers={TOP_BOWLERS}
                topAllRounders={TOP_ALLROUNDERS}
                onSelectPlayer={(name, meta) => {
                  if (setSelectedPlayerProfile) setSelectedPlayerProfile({ name, ...meta });
                  if (setCurrentScreen) setCurrentScreen('playerProfile');
                }}
                onViewAll={() => {
                  if (setBottomNavTab) setBottomNavTab('rankings');
                }}
              />
            </FadeSlideIn>

            {/* CREX-STYLE SOCIAL CONNECT SECTION */}
            <FadeSlideIn distance={12} delay={200}>
              <SocialConnectCard
                instagramHandle="cricflow.live_"
                instagramUrl="https://instagram.com/cricflow.live_"
                xHandle="cricflow_live"
                xUrl="https://x.com/cricflow_live"
              />
            </FadeSlideIn>
          </>
        )}

        <View style={{ height: 20 }} />
      </Animated.ScrollView>

      {/* INDUSTRIAL STANDARD BOTTOM NAVIGATION BAR */}
      <AppBottomNav
        activeTab={bottomNavTab}
        onTabChange={(tabId) => {
          if (setBottomNavTab) setBottomNavTab(tabId);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.light.cardBg
  },
  scrollView: {
    flex: 1,
    backgroundColor: theme.light.bg
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.lg
  },
  carouselWrap: {
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden'
  },
  bannerSlideItem: {
    height: 168,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#0F172A'
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: themeColors.border
  },
  dotActive: {
    backgroundColor: themeColors.textPrimary,
    width: 20,
    borderRadius: 4
  },
  heroActionCard: {
    backgroundColor: theme.hero.bg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.hero.border,
    gap: 14
  },
  heroTextContainer: {
    gap: 4
  },
  heroTitle: {
    fontSize: 16,
    color: theme.hero.text,
    fontFamily: systemFontMedium,
    letterSpacing: -0.1
  },
  heroSubtitle: {
    fontSize: 12,
    color: theme.hero.subtext,
    fontFamily: systemFont,
    lineHeight: 17
  },
  heroButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%'
  },
  primaryActionButton: {
    flex: 1,
    backgroundColor: 'rgba(250, 248, 245, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(250, 248, 245, 0.3)',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  primaryActionText: {
    color: theme.hero.text,
    fontSize: 13,
    fontFamily: systemFontMedium
  },
  secondaryActionButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(250, 248, 245, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  secondaryActionText: {
    color: theme.hero.text,
    fontSize: 13,
    fontFamily: systemFontMedium
  },
  joinCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: theme.hero.divider
  },
  joinCodeInput: {
    flex: 1,
    color: theme.hero.text,
    fontSize: 13,
    fontFamily: systemFontMedium,
    paddingVertical: 4
  },
  joinCodeSubmitBtn: {
    backgroundColor: 'rgba(250, 248, 245, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(250, 248, 245, 0.25)',
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  sectionTitle: {
    fontSize: 11.5,
    color: theme.light.textMuted,
    letterSpacing: 0.8,
    fontFamily: systemFontBold
  },
  sectionTitleLive: {
    fontSize: 11.5,
    color: theme.light.primary,
    letterSpacing: 0.8,
    fontFamily: systemFontBold
  },
  sectionLink: {
    fontSize: typeScale.caption,
    color: theme.light.primary,
    fontFamily: systemFontMedium
  },
  liveIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E'
  },
  liveMatchCard: {
    backgroundColor: theme.light.cardBg,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    gap: spacing.lg - 2
  },
  liveCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  liveMatchTitle: {
    fontSize: typeScale.label,
    color: theme.light.textPrimary,
    fontFamily: systemFontBold,
    flex: 1
  },
  liveTag: {
    backgroundColor: theme.light.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm
  },
  liveTagText: {
    fontSize: 10,
    color: theme.light.primary,
    fontFamily: systemFontBold
  },
  liveScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 6
  },
  liveTeamCol: {
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1
  },
  liveTeamName: {
    fontSize: typeScale.body,
    color: theme.light.textPrimary,
    fontFamily: systemFontBold
  },
  liveTeamNameMuted: {
    fontSize: typeScale.body,
    color: theme.light.textMuted,
    fontFamily: systemFontMedium
  },
  liveScoreBig: {
    fontSize: 22,
    color: theme.light.primary,
    fontFamily: systemFontBold,
    fontVariant: ['tabular-nums']
  },
  liveOversSmall: {
    fontSize: typeScale.micro,
    color: theme.light.textMuted,
    fontFamily: systemFontMedium
  },
  liveScoreMuted: {
    fontSize: typeScale.caption,
    color: theme.light.textSubtle,
    fontFamily: systemFontMedium
  },
  liveVsText: {
    fontSize: typeScale.caption,
    color: theme.light.cardBorderDark,
    fontFamily: systemFontBold
  },
  liveCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  liveFooterBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    backgroundColor: theme.light.primarySurface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#BAE6FD'
  },
  liveFooterBtnText: {
    color: theme.light.primary,
    fontSize: typeScale.caption,
    fontFamily: systemFontBold
  },
  liveFooterBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    backgroundColor: theme.light.primary,
    borderRadius: radius.md
  },
  liveFooterBtnPrimaryText: {
    color: theme.hero.text,
    fontSize: typeScale.caption,
    fontFamily: systemFontBold
  },
  emptyCard: {
    backgroundColor: theme.light.cardBg,
    borderRadius: radius.xxl,
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.light.cardBorder,
    gap: spacing.sm
  },
  emptyCardTitle: {
    fontSize: typeScale.name,
    color: theme.light.textPrimary,
    fontFamily: systemFontBold,
    marginTop: spacing.xs
  },
  emptyCardSubtitle: {
    fontSize: typeScale.caption,
    color: theme.light.textMuted,
    fontFamily: systemFontMedium,
    textAlign: 'center',
    lineHeight: 17,
    maxWidth: 260
  },
  emptyCardBtn: {
    backgroundColor: theme.light.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    marginTop: 6
  },
  emptyCardBtnText: {
    color: theme.hero.text,
    fontSize: 12.5,
    fontFamily: systemFontBold
  },
  performersRow: {
    flexDirection: 'row',
    gap: 10
  },
  performerCard: {
    flex: 1,
    backgroundColor: theme.light.cardBg,
    borderRadius: radius.xl,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.light.cardBorder,
    gap: 6
  },
  performerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: theme.light.primarySurface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 2
  },
  performerBadgeText: {
    fontSize: 9,
    color: theme.light.primary,
    fontFamily: systemFontBold
  },
  performerName: {
    fontSize: 12.5,
    color: theme.light.textPrimary,
    fontFamily: systemFontBold
  },
  performerStat: {
    fontSize: typeScale.name,
    color: theme.light.primary,
    fontFamily: systemFontBold
  },
  performerStatLabel: {
    fontSize: typeScale.micro,
    color: theme.light.textMuted,
    fontFamily: systemFont
  },
  searchSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    paddingVertical: 4
  },
  searchSummaryText: {
    fontSize: 13,
    color: themeColors.textSecondary,
    fontFamily: systemFontMedium
  },
  searchClearText: {
    fontSize: 13,
    color: themeColors.textPrimary,
    fontFamily: systemFontBold
  },
  searchPlayerListCard: {
    backgroundColor: themeColors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: themeColors.border,
    overflow: 'hidden'
  },
  searchPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12
  },
  searchPlayerBorder: {
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border
  },
  searchPlayerName: {
    fontSize: 13.5,
    color: themeColors.textPrimary,
    fontFamily: systemFontMedium
  },
  searchPlayerRole: {
    fontSize: 12,
    color: themeColors.textMuted,
    fontFamily: systemFont,
    marginTop: 1
  }
});

export default HomeScreen;
