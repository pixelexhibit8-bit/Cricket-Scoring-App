import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../../components/navigation/AppHeader.jsx';
import {
  HomeBannerCarousel,
  LiveMatchCardItem,
  UpcomingFixtureCardItem,
  FinishedMatchCardItem,
  SearchResultsSection,
  ScorerHubCard,
  SocialConnectCard
} from '../../components/home/index.js';
import { GroundSpotlightSection } from '../../components/GroundSpotlightSection.jsx';
import { FadeSlideIn } from '../../components/motion/MotionSystem.jsx';
import { JoinMatchModal } from '../../components/modals/JoinMatchModal.jsx';
import { ShareScoringAccessModal } from '../../components/modals/ShareScoringAccessModal.jsx';
import { navigate } from '../../navigation/navigationService.js';
import { useMatch } from '../../context/MatchContext.jsx';
import {
  spacing
} from '../../theme.js';
import { getCurrentUser } from '../../services/authService.js';
import { showToast } from '../../services/toastService.js';
import {
  getMyCreatedMatchIds,
  isUserMatchCreator
} from '../../services/matchOwnership.js';
import { styles } from './styles.js';




// ─────────────────────────────────────────────────────────────────────────────
// 3. MAIN HOMESCREEN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function HomeScreen(props = {}) {
  const matchCtx = useMatch();
  const mergedProps = {
    ...matchCtx,
    ...props,
    onJoinMatchByCode: props.onJoinMatchByCode || matchCtx.handleJoinMatchByCode
  };

  const {
    bottomNavTab = 'home',
    setBottomNavTab,
    setMatchesSubTab,
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
    upcomingMatches = [],
    handleStartUpcomingMatch = null,
    onJoinMatchByCode
  } = mergedProps;

  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [myCreatedMatchIds, setMyCreatedMatchIds] = useState([]);

  const { width: screenWidth } = useWindowDimensions();
  const bannerWidth = Math.max(screenWidth - spacing.md * 2, 280);

  // Fetch current logged-in user and created matches on refresh or tab activation
  useEffect(() => {
    let isMounted = true;
    const fetchUserAndOwnership = async () => {
      const u = await getCurrentUser();
      const createdIds = await getMyCreatedMatchIds();
      if (isMounted) {
        setCurrentUser(u);
        setMyCreatedMatchIds(createdIds);
      }
    };
    fetchUserAndOwnership();
    return () => { isMounted = false; };
  }, [refreshing, bottomNavTab]);

  // Quick Match action handler
  const handleStartQuickMatch = useCallback(() => {
    if (!currentUser) {
      showToast({
        type: 'warning',
        message: 'Please sign in first to score matches & protect match records.'
      });
      navigate('playerProfile');
      return;
    }
    if (openScorerScreen) {
      openScorerScreen();
    }
  }, [currentUser, openScorerScreen]);

  // Memoized Live Matches pool
  const allLive = useMemo(() => {
    if (visibleLiveMatches.length > 0) return visibleLiveMatches;
    if (activeMatch && activeMatch.phase !== 'result' && activeMatch.phase !== 'finished' && !activeMatch.isCompleted) {
      return [activeMatch];
    }
    return [];
  }, [visibleLiveMatches, activeMatch]);

  const isCreatorOfActiveMatch = useMemo(() => {
    return isUserMatchCreator(activeMatch, currentUser, myCreatedMatchIds);
  }, [activeMatch, currentUser, myCreatedMatchIds]);

  const hasActiveMatch = Boolean(
    activeMatch &&
    activeMatch.phase !== 'result' &&
    activeMatch.phase !== 'finished' &&
    !activeMatch.isCompleted &&
    isCreatorOfActiveMatch
  );

  // Memoized Recent Finished Matches
  const displayedFinished = useMemo(() => {
    const pool = recentFinishedMatches.length > 0 ? recentFinishedMatches : finishedArchive;
    return pool.slice(0, 3);
  }, [recentFinishedMatches, finishedArchive]);

  // ── Unified Instant Search Logic (Memoized) ──
  const trimmedQuery = (searchQuery || '').trim().toLowerCase();
  const isSearching = trimmedQuery.length > 0;

  // Memoized filtered live matches
  const filteredLiveMatches = useMemo(() => {
    if (!isSearching) return [];
    return allLive.filter((m) => {
      const title = (m.matchTitle || m.title || '').toLowerCase();
      const t1 = (m.team1?.name || m.teams?.[0]?.name || '').toLowerCase();
      const t2 = (m.team2?.name || m.teams?.[1]?.name || '').toLowerCase();
      return title.includes(trimmedQuery) || t1.includes(trimmedQuery) || t2.includes(trimmedQuery);
    });
  }, [allLive, trimmedQuery, isSearching]);

  // Memoized filtered finished matches
  const allFinishedPool = useMemo(() => {
    return finishedArchive && finishedArchive.length > 0 ? finishedArchive : recentFinishedMatches;
  }, [finishedArchive, recentFinishedMatches]);

  const filteredFinishedMatches = useMemo(() => {
    if (!isSearching) return [];
    return allFinishedPool.filter((m) => {
      const title = (m.matchTitle || m.title || m.match_title || '').toLowerCase();
      const t1 = (m.team1?.name || m.teams?.[0]?.name || m.inn1BattingTeam || '').toLowerCase();
      const t2 = (m.team2?.name || m.teams?.[1]?.name || m.inn1BowlingTeam || '').toLowerCase();
      return title.includes(trimmedQuery) || t1.includes(trimmedQuery) || t2.includes(trimmedQuery);
    });
  }, [allFinishedPool, trimmedQuery, isSearching]);

  // Memoized filtered players pool
  const allPlayersPool = useMemo(() => {
    const pool = [];
    const seenPlayerNames = new Set();
    [...TOP_BATTERS, ...TOP_BOWLERS, ...TOP_ALLROUNDERS].forEach((p) => {
      const pName = p.name || p.playerName || p.fullName;
      if (pName && !seenPlayerNames.has(pName.toLowerCase())) {
        seenPlayerNames.add(pName.toLowerCase());
        pool.push(p);
      }
    });
    return pool;
  }, [TOP_BATTERS, TOP_BOWLERS, TOP_ALLROUNDERS]);

  const filteredPlayers = useMemo(() => {
    if (!isSearching) return [];
    return allPlayersPool.filter((p) => {
      const pName = (p.name || p.playerName || '').toLowerCase();
      const role = (p.role || '').toLowerCase();
      const team = (p.team || p.city || '').toLowerCase();
      return pName.includes(trimmedQuery) || role.includes(trimmedQuery) || team.includes(trimmedQuery);
    });
  }, [allPlayersPool, trimmedQuery, isSearching]);

  const totalSearchCount = filteredLiveMatches.length + filteredFinishedMatches.length + filteredPlayers.length;

  // Navigation callbacks
  const handleSelectLiveMatch = useCallback((m) => {
    if (setActiveMatch) setActiveMatch(m);
    if (setCurrentScreen) setCurrentScreen('liveView');
  }, [setActiveMatch, setCurrentScreen]);

  const handleSelectFinishedMatch = useCallback((m) => {
    if (setSelectedMatch) setSelectedMatch(m);
    if (setCurrentScreen) setCurrentScreen('finishedView');
  }, [setSelectedMatch, setCurrentScreen]);

  const handleSelectPlayerProfile = useCallback((p) => {
    if (setSelectedPlayerProfile) setSelectedPlayerProfile(p);
    if (setCurrentScreen) setCurrentScreen('playerProfile');
  }, [setSelectedPlayerProfile, setCurrentScreen]);

  const handleSpotlightSelectPlayer = useCallback((name, meta) => {
    handleSelectPlayerProfile({ name, ...meta });
  }, [handleSelectPlayerProfile]);

  const handleSpotlightViewAll = useCallback(() => {
    navigate('rankings');
  }, []);

  const handleClearSearch = useCallback(() => {
    if (setSearchQuery) setSearchQuery('');
  }, [setSearchQuery]);

  const handleResumeScoring = useCallback((match) => {
    const targetMatch = match || activeMatch;
    const isCreator = isUserMatchCreator(targetMatch, currentUser, myCreatedMatchIds);
    if (!isCreator) {
      showToast('Only the match creator can resume scoring this match.', 'warning', 'Scorer Access Restricted');
      return;
    }
    if (openScorerScreen) openScorerScreen(targetMatch);
  }, [activeMatch, currentUser, myCreatedMatchIds, openScorerScreen]);

  const handleOpenShareModal = useCallback(() => {
    setShareModalVisible(true);
  }, []);

  const handleOpenJoinModal = useCallback(() => {
    setJoinModalVisible(true);
  }, []);

  return (
    <View style={styles.container}>
      {/* REUSABLE TOP APP HEADER */}
      <AppHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onMenuPress={() => navigate('menu')}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
          <SearchResultsSection
            searchQuery={searchQuery}
            totalSearchCount={totalSearchCount}
            filteredLiveMatches={filteredLiveMatches}
            filteredFinishedMatches={filteredFinishedMatches}
            filteredPlayers={filteredPlayers}
            onClearSearch={handleClearSearch}
            onSelectLiveMatch={handleSelectLiveMatch}
            onSelectFinishedMatch={handleSelectFinishedMatch}
            onSelectPlayerProfile={handleSelectPlayerProfile}
          />
        ) : (
          /* ── REGULAR HOME DASHBOARD ── */
          <>
            {/* ── NATIVE AUTO-PLAY BANNER CAROUSEL (ISOLATED) ── */}
            <HomeBannerCarousel bannerWidth={bannerWidth} />

            {/* SCORER HUB CARD */}
            <ScorerHubCard
              hasActiveMatch={hasActiveMatch}
              activeMatch={activeMatch}
              onResumeScoring={handleResumeScoring}
              onStartQuickMatch={handleStartQuickMatch}
              onOpenShareModal={handleOpenShareModal}
              onOpenJoinModal={handleOpenJoinModal}
            />

            {/* FEATURED LIVE MATCH SECTION */}
            {allLive.length > 0 && (
              <FadeSlideIn distance={12} delay={50}>
                <View style={styles.sectionHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#E11D48' }} />
                    <Text style={styles.sectionTitleLive}>
                      {allLive.length > 1 ? `LIVE MATCHES (${allLive.length})` : 'FEATURED LIVE MATCH'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      if (setBottomNavTab) setBottomNavTab('matches');
                      if (setMatchesSubTab) setMatchesSubTab('live');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.sectionLink}>View all ({allLive.length})</Text>
                  </TouchableOpacity>
                </View>
                {allLive.map((m, idx) => (
                  <LiveMatchCardItem
                    key={`home-live-${m.id || m.supabaseId || idx}`}
                    match={m}
                    onPress={() => handleSelectLiveMatch(m)}
                  />
                ))}
              </FadeSlideIn>
            )}

            {/* UPCOMING FIXTURES SECTION */}
            {upcomingMatches.length > 0 && (
              <FadeSlideIn distance={12} delay={75}>
                <View style={styles.sectionHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="calendar-outline" size={16} color="#0284C7" />
                    <Text style={styles.sectionTitle}>
                      {`UPCOMING FIXTURES (${upcomingMatches.length})`}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      if (setBottomNavTab) setBottomNavTab('matches');
                      if (setMatchesSubTab) setMatchesSubTab('upcoming');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.sectionLink}>View all ({upcomingMatches.length})</Text>
                  </TouchableOpacity>
                </View>
                {upcomingMatches.slice(0, 3).map((fixture, idx) => (
                  <UpcomingFixtureCardItem
                    key={`home-up-${fixture.id || idx}`}
                    fixture={fixture}
                    onPress={() => {
                      if (setBottomNavTab) setBottomNavTab('matches');
                      if (setMatchesSubTab) setMatchesSubTab('upcoming');
                    }}
                    onScorePress={handleStartUpcomingMatch}
                  />
                ))}
              </FadeSlideIn>
            )}

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
                displayedFinished.map((match, idx) => (
                  <FinishedMatchCardItem
                    key={`home-fin-${match.id || 'm'}-${idx}`}
                    match={match}
                    onPress={() => handleSelectFinishedMatch(match)}
                  />
                ))
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
                onSelectPlayer={handleSpotlightSelectPlayer}
                onViewAll={handleSpotlightViewAll}
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
      </ScrollView>

      {/* REUSABLE JOIN MATCH MODAL */}
      <JoinMatchModal
        visible={joinModalVisible}
        onClose={() => setJoinModalVisible(false)}
        onJoinMatchByCode={onJoinMatchByCode}
      />

      {/* REUSABLE SHARE SCORER ACCESS MODAL */}
      <ShareScoringAccessModal
        visible={shareModalVisible}
        onClose={() => setShareModalVisible(false)}
        activeMatch={activeMatch}
      />
    </View>
  );
}

export default HomeScreen;
