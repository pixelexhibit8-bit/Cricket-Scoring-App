import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
  useWindowDimensions,
  StatusBar,
  StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PagerView from 'react-native-pager-view';
import { Ionicons } from '@expo/vector-icons';
import { systemFont, systemFontBold, systemFontMedium, themeColors } from '../theme.js';
import { useMatch } from '../context/MatchContext.jsx';
import { PlayerAvatar } from '../components/PlayerAvatar.jsx';
const RankingCategoryTable = React.memo(function RankingCategoryTable({
  list = [],
  categoryKey = 'batters',
  onSelectPlayer
}) {
  if (!list || list.length === 0) {
    return (
      <ScrollView
        style={styles.pageScrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.emptyCard}>
          <Ionicons name="trophy-outline" size={36} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No Rankings Data Found</Text>
          <Text style={styles.emptySub}>
            Scores and wickets from completed ground matches will rank players here
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.pageScrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.tableCard}>
        {/* TABLE HEADER */}
        <View style={styles.tableHeader}>
          <Text style={styles.tableColRank}>#</Text>
          <Text style={styles.tableColPlayer}>PLAYER</Text>
          <Text style={styles.tableColStats}>
            {categoryKey === 'batters' ? 'RUNS (SR)' : categoryKey === 'bowlers' ? 'WKTS (ECO)' : 'MVP PTS'}
          </Text>
        </View>

        {/* TABLE ROWS */}
        {list.map((player, idx) => {
          const isTop3 = idx < 3;
          const isLast = idx === list.length - 1;
          const rankNum = player.rank || (idx + 1);

          return (
            <TouchableOpacity
              key={player.id || player.name || idx}
              activeOpacity={0.7}
              onPress={() => {
                if (onSelectPlayer) {
                  onSelectPlayer(player.name, {
                    role: player.role || (categoryKey === 'batters' ? 'Batter' : categoryKey === 'bowlers' ? 'Bowler' : 'All-Rounder'),
                    photoUrl: player.photoUrl,
                    city: player.city
                  });
                }
              }}
              style={[
                styles.tableRow,
                isLast && { borderBottomWidth: 0 }
              ]}
            >
              {/* Rank Badge */}
              <View style={[
                styles.rankBadge,
                rankNum === 1 ? styles.rankBadgeGold : rankNum === 2 ? styles.rankBadgeSilver : rankNum === 3 ? styles.rankBadgeBronze : styles.rankBadgeNormal
              ]}>
                <Text style={[
                  styles.rankNumText,
                  isTop3 && { color: '#FFFFFF' }
                ]}>
                  {rankNum}
                </Text>
              </View>

              {/* Avatar */}
              <PlayerAvatar name={player.name} photoUrl={player.photoUrl} size={46} />

              {/* Info */}
              <View style={styles.playerInfo}>
                <Text style={styles.playerName} numberOfLines={1}>
                  {player.name}
                </Text>
                <Text style={styles.playerCity} numberOfLines={1}>
                  {player.city || 'Sadokan Ground'} • {player.matches || 1} Matches
                </Text>
              </View>

              {/* Primary Stat */}
              <View style={styles.playerStats}>
                <Text style={styles.primaryStatText}>
                  {categoryKey === 'batters' ? player.runs : categoryKey === 'bowlers' ? player.wickets : player.pts || player.runs}
                </Text>
                <Text style={styles.secondaryStatText}>
                  {categoryKey === 'batters' ? `SR ${player.sr || '0.0'}` : categoryKey === 'bowlers' ? `Eco ${player.econ || '0.0'}` : `${player.runs || 0}R • ${player.wickets || 0}W`}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
});

export function RankingsScreen(props = {}) {
  const matchCtx = useMatch();
  const {
    navigation = props.navigation,
    topBatters = props.topBatters || matchCtx.TOP_BATTERS || [],
    topBowlers = props.topBowlers || matchCtx.TOP_BOWLERS || [],
    topAllRounders = props.topAllRounders || matchCtx.TOP_ALLROUNDERS || [],
    onSelectPlayer = props.onSelectPlayer || ((playerName, meta = {}) => {
      const playerPayload = { name: playerName, ...(meta || {}) };
      if (matchCtx?.setSelectedPlayerProfile) {
        matchCtx.setSelectedPlayerProfile(playerPayload);
      }
      if (navigation?.navigate) {
        navigation.navigate('PlayerProfile', playerPayload);
      } else if (matchCtx?.setCurrentScreen) {
        matchCtx.setCurrentScreen('playerProfile');
      }
    }),
    refreshing = props.refreshing !== undefined ? props.refreshing : (matchCtx.refreshing || false),
    onRefresh = props.onRefresh || matchCtx.handlePullToRefresh || null,
    onBack = props.onBack || (() => {
      if (props.navigation && props.navigation.canGoBack()) {
        props.navigation.goBack();
      } else if (matchCtx.setCurrentScreen) {
        matchCtx.setCurrentScreen('home');
      }
    })
  } = props;
  const handleGoBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation && navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const { width: screenWidth } = useWindowDimensions();
  const [activeCategory, setActiveCategory] = useState('batters'); // 'batters' | 'bowlers' | 'allrounders'

  const rankingTabs = useMemo(() => [
    { id: 'batters', label: 'Batters' },
    { id: 'bowlers', label: 'Bowlers' },
    { id: 'allrounders', label: 'All-Rounders' }
  ], []);

  const activeTabIndex = useMemo(() => {
    return Math.max(0, rankingTabs.findIndex(t => t.id === activeCategory));
  }, [rankingTabs, activeCategory]);

  const pagerPosition = useRef(new Animated.Value(activeTabIndex)).current;
  const pagerRef = useRef(null);
  const tabsScrollRef = useRef(null);
  const isTabPressingRef = useRef(false);

  const [tabLayouts, setTabLayouts] = useState({});
  const onTabLayout = useCallback((id, e) => {
    const { x, width } = e.nativeEvent.layout;
    setTabLayouts(prev => {
      const cur = prev[id];
      if (cur && Math.abs(cur.x - x) < 0.5 && Math.abs(cur.width - width) < 0.5) return prev;
      return { ...prev, [id]: { x, width } };
    });
  }, []);

  const animatedUnderlineTranslateX = useMemo(() => {
    return pagerPosition.interpolate({
      inputRange: [0, 1, 2],
      outputRange: rankingTabs.map((t, index) => {
        const layout = tabLayouts[t.id];
        return layout?.x != null
          ? layout.x + layout.width / 2 - 50
          : (index * 95 + 16 + 32.5 - 50);
      }),
      extrapolate: 'clamp'
    });
  }, [pagerPosition, rankingTabs, tabLayouts]);

  const animatedUnderlineScaleX = useMemo(() => {
    return pagerPosition.interpolate({
      inputRange: [0, 1, 2],
      outputRange: rankingTabs.map(t => {
        const layout = tabLayouts[t.id];
        return (layout?.width != null ? layout.width : 65) / 100;
      }),
      extrapolate: 'clamp'
    });
  }, [pagerPosition, rankingTabs, tabLayouts]);

  const onTabPress = useCallback((tabId, index) => {
    if (activeCategory === tabId) return;
    isTabPressingRef.current = true;
    setActiveCategory(tabId);
    pagerRef.current?.setPage(index);

    if (tabLayouts[tabId]?.x != null) {
      tabsScrollRef.current?.scrollTo({ x: Math.max(0, tabLayouts[tabId].x - 60), animated: true });
    }

    Animated.spring(pagerPosition, {
      toValue: index,
      friction: 8,
      tension: 65,
      useNativeDriver: false
    }).start(() => {
      isTabPressingRef.current = false;
    });
  }, [activeCategory, tabLayouts, pagerPosition]);

  const handlePageSelected = useCallback((e) => {
    const nextIndex = e.nativeEvent.position;
    const selectedTab = rankingTabs[nextIndex];
    if (selectedTab && activeCategory !== selectedTab.id) {
      setActiveCategory(selectedTab.id);
      if (tabLayouts[selectedTab.id]?.x != null) {
        tabsScrollRef.current?.scrollTo({ x: Math.max(0, tabLayouts[selectedTab.id].x - 60), animated: true });
      }
    }
  }, [rankingTabs, activeCategory, tabLayouts]);

  const handlePageScroll = useCallback((e) => {
    if (isTabPressingRef.current) return;
    const { position, offset } = e.nativeEvent;
    pagerPosition.setValue(position + offset);
  }, [pagerPosition]);

  useEffect(() => {
    if (tabLayouts[activeCategory]?.x != null) {
      tabsScrollRef.current?.scrollTo({ x: Math.max(0, tabLayouts[activeCategory].x - 60), animated: true });
    }
  }, [activeCategory, tabLayouts]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.surface }} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" translucent={true} backgroundColor="transparent" />
      {/* ─── TOP HEADER BAR WITH BACK BUTTON ─── */}
      <View style={styles.topHeaderBar}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={handleGoBack}
          activeOpacity={0.7}
          accessibilityLabel="Go Back"
        >
          <Ionicons name="arrow-back" size={24} color={themeColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitleText}>Leaderboard Rankings</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* ─── CREX STYLE CLEAN TEXT-ONLY UNDERLINE TABS BAR ─── */}
      <View style={styles.tabsBarWrapper}>
        <ScrollView
          ref={tabsScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          {rankingTabs.map((t, idx) => {
            const active = activeCategory === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                onLayout={(e) => onTabLayout(t.id, e)}
                onPress={() => onTabPress(t.id, idx)}
                activeOpacity={0.7}
                style={styles.tabButton}
              >
                <Text style={[
                  styles.tabButtonText,
                  active && styles.tabButtonTextActive
                ]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Smooth Finger-Tracking Animated Underline Indicator (GPU Transforms) */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.animatedUnderlineOuter,
              {
                transform: [{ translateX: animatedUnderlineTranslateX }]
              }
            ]}
          >
            <Animated.View
              style={[
                styles.animatedUnderlineInner,
                {
                  transform: [{ scaleX: animatedUnderlineScaleX }]
                }
              ]}
            />
          </Animated.View>
        </ScrollView>
      </View>

      {/* ─── NATIVE HORIZONTAL SWIPEABLE PAGER (BATTERS / BOWLERS / ALL-ROUNDERS) ─── */}
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={activeTabIndex}
        onPageSelected={handlePageSelected}
        onPageScroll={handlePageScroll}
      >
        {/* 1. BATTERS PAGE */}
        <View key="batters" style={{ flex: 1 }}>
          <RankingCategoryTable
            list={topBatters}
            categoryKey="batters"
            onSelectPlayer={onSelectPlayer}
          />
        </View>

        {/* 2. BOWLERS PAGE */}
        <View key="bowlers" style={{ flex: 1 }}>
          <RankingCategoryTable
            list={topBowlers}
            categoryKey="bowlers"
            onSelectPlayer={onSelectPlayer}
          />
        </View>

        {/* 3. ALL-ROUNDERS PAGE */}
        <View key="allrounders" style={{ flex: 1 }}>
          <RankingCategoryTable
            list={topAllRounders}
            categoryKey="allrounders"
            onSelectPlayer={onSelectPlayer}
          />
        </View>
      </PagerView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.appBackground
  },
  topHeaderBar: {
    height: 52,
    backgroundColor: themeColors.surface,
    borderBottomWidth: 0,
    borderBottomColor: themeColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16
  },
  headerBackBtn: {
    padding: 4,
    marginLeft: -4
  },
  headerTitleText: {
    fontSize: 17,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary,
    letterSpacing: -0.2
  },
  tabsBarWrapper: {
    backgroundColor: themeColors.surface,
    borderBottomWidth: 0,
    borderBottomColor: themeColors.border,
    position: 'relative'
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 24
  },
  tabButton: {
    paddingVertical: 13,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tabButtonText: {
    fontSize: 16.5,
    color: '#64748B',
    fontFamily: systemFontMedium,
    letterSpacing: -0.1
  },
  tabButtonTextActive: {
    color: '#18181B',
    fontFamily: systemFontBold
  },
  animatedUnderlineOuter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 100,
    height: 2.5
  },
  animatedUnderlineInner: {
    flex: 1,
    height: 2.5,
    backgroundColor: '#18181B',
    borderRadius: 2
  },
  pageScrollView: {
    flex: 1
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 28
  },
  tableCard: {
    backgroundColor: themeColors.surface,
    borderRadius: 16,
    borderWidth: 0,
    overflow: 'hidden'
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: themeColors.surfaceOffWhite,
    borderBottomWidth: 0,
    borderBottomColor: themeColors.border
  },
  tableColRank: {
    width: 32,
    fontSize: 11,
    fontFamily: systemFontMedium,
    color: '#64748B',
    textTransform: 'uppercase'
  },
  tableColPlayer: {
    flex: 1,
    fontSize: 11,
    fontFamily: systemFontMedium,
    color: '#64748B',
    textTransform: 'uppercase',
    marginLeft: 44
  },
  tableColStats: {
    fontSize: 11,
    fontFamily: systemFontMedium,
    color: '#64748B',
    textTransform: 'uppercase',
    textAlign: 'right'
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderBottomWidth: 0,
    borderBottomColor: '#F1F5F9',
    gap: 10
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  rankBadgeGold: {
    backgroundColor: '#EAB308'
  },
  rankBadgeSilver: {
    backgroundColor: '#94A3B8'
  },
  rankBadgeBronze: {
    backgroundColor: '#B45309'
  },
  rankBadgeNormal: {
    backgroundColor: 'transparent'
  },
  rankNumText: {
    fontSize: 12.5,
    fontFamily: systemFontMedium,
    color: '#64748B'
  },
  playerInfo: {
    flex: 1,
    minWidth: 0
  },
  playerName: {
    fontSize: 14,
    fontFamily: systemFontMedium,
    color: '#0F172A'
  },
  playerCity: {
    fontSize: 11.5,
    fontFamily: systemFont,
    color: '#64748B',
    marginTop: 1
  },
  playerStats: {
    alignItems: 'flex-end',
    minWidth: 70
  },
  primaryStatText: {
    fontSize: 14,
    fontFamily: systemFontMedium,
    color: '#0F172A'
  },
  secondaryStatText: {
    fontSize: 11,
    fontFamily: systemFont,
    color: '#94A3B8',
    marginTop: 1
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    marginTop: 20,
    gap: 10
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: systemFontMedium,
    color: '#0F172A'
  },
  emptySub: {
    fontSize: 12,
    fontFamily: systemFont,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18
  }
});

export default RankingsScreen;
