import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
  useWindowDimensions,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { systemFont, systemFontBold, systemFontMedium } from '../theme.js';
import { PlayerAvatar } from '../components/PlayerAvatar.jsx';
import { ScalePressable, FadeSlideIn } from '../components/motion/MotionSystem.jsx';

export function RankingsScreen({
  topBatters = [],
  topBowlers = [],
  topAllRounders = [],
  onSelectPlayer,
  refreshing = false,
  onRefresh = null
}) {
  const { width: screenWidth } = useWindowDimensions();
  const [activeCategory, setActiveCategory] = useState('batters'); // 'batters' | 'bowlers' | 'allrounders'

  const rankingTabs = [
    { id: 'batters', label: 'Batters' },
    { id: 'bowlers', label: 'Bowlers' },
    { id: 'allrounders', label: 'All-Rounders' }
  ];

  const activeTabIndex = Math.max(0, rankingTabs.findIndex(t => t.id === activeCategory));
  const pagerScrollX = useRef(new Animated.Value(activeTabIndex * screenWidth)).current;
  const pagerRef = useRef(null);

  const [tabLayouts, setTabLayouts] = useState({});
  const onTabLayout = (id, e) => {
    const { x, width } = e.nativeEvent.layout;
    setTabLayouts(prev => {
      const cur = prev[id];
      if (cur && Math.abs(cur.x - x) < 0.5 && Math.abs(cur.width - width) < 0.5) return prev;
      return { ...prev, [id]: { x, width } };
    });
  };

  const animatedUnderlineX = pagerScrollX.interpolate({
    inputRange: [0, screenWidth, screenWidth * 2],
    outputRange: rankingTabs.map((t, index) => tabLayouts[t.id]?.x != null ? tabLayouts[t.id].x : (index * 95 + 16)),
    extrapolate: 'clamp'
  });

  const animatedUnderlineWidth = pagerScrollX.interpolate({
    inputRange: [0, screenWidth, screenWidth * 2],
    outputRange: rankingTabs.map(t => tabLayouts[t.id]?.width != null ? tabLayouts[t.id].width : 65),
    extrapolate: 'clamp'
  });

  const isDraggingPager = useRef(false);

  const onTabPress = (tabId, index) => {
    setActiveCategory(tabId);
    isDraggingPager.current = true;
    pagerRef.current?.scrollTo({ x: index * screenWidth, animated: true });
    setTimeout(() => { isDraggingPager.current = false; }, 300);
  };

  const handlePagerEnd = (e) => {
    const offset = e.nativeEvent.contentOffset.x;
    const index = Math.round(offset / screenWidth);
    if (rankingTabs[index] && activeCategory !== rankingTabs[index].id) {
      setActiveCategory(rankingTabs[index].id);
    }
  };

  useEffect(() => {
    if (!isDraggingPager.current) {
      const targetOffset = activeTabIndex * screenWidth;
      pagerRef.current?.scrollTo({ x: targetOffset, animated: false });
      pagerScrollX.setValue(targetOffset);
    }
  }, [activeCategory, screenWidth]);

  // Helper to render table for a category
  const renderRankingList = (list, categoryKey) => {
    if (!list || list.length === 0) {
      return (
        <ScrollView
          style={styles.pageScrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#0284C7']}
                tintColor="#0284C7"
              />
            ) : undefined
          }
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
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#0284C7']}
              tintColor="#0284C7"
            />
          ) : undefined
        }
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
            const isTop3 = (player.rank || (idx + 1)) <= 3;
            const isLast = idx === list.length - 1;
            const rankNum = player.rank || (idx + 1);

            return (
              <FadeSlideIn key={`rank-${categoryKey}-${player.name}-${idx}`} delay={Math.min(idx * 25, 200)} distance={6}>
                <ScalePressable
                  activeScale={0.985}
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
                  <PlayerAvatar name={player.name} photoUrl={player.photoUrl} size={40} />

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
                </ScalePressable>
              </FadeSlideIn>
            );
          })}
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {/* ─── CREX STYLE CLEAN TEXT-ONLY UNDERLINE TABS BAR ─── */}
      <View style={styles.tabsBarWrapper}>
        <ScrollView
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

          {/* Smooth Finger-Tracking Animated Underline Indicator */}
          <Animated.View
            style={[
              styles.animatedUnderline,
              {
                left: animatedUnderlineX,
                width: animatedUnderlineWidth
              }
            ]}
          />
        </ScrollView>
      </View>

      {/* ─── HORIZONTAL SWIPEABLE PAGER (BATTERS / BOWLERS / ALL-ROUNDERS) ─── */}
      <Animated.ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        overScrollMode="never"
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: pagerScrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={handlePagerEnd}
        style={{ flex: 1 }}
      >
        {/* 1. BATTERS PAGE */}
        <View style={{ width: screenWidth, flex: 1 }}>
          {renderRankingList(topBatters, 'batters')}
        </View>

        {/* 2. BOWLERS PAGE */}
        <View style={{ width: screenWidth, flex: 1 }}>
          {renderRankingList(topBowlers, 'bowlers')}
        </View>

        {/* 3. ALL-ROUNDERS PAGE */}
        <View style={{ width: screenWidth, flex: 1 }}>
          {renderRankingList(topAllRounders, 'allrounders')}
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  tabsBarWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
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
    fontSize: 15,
    color: '#64748B',
    fontFamily: systemFontMedium,
    letterSpacing: -0.1
  },
  tabButtonTextActive: {
    color: '#0284C7'
  },
  animatedUnderline: {
    position: 'absolute',
    bottom: 0,
    height: 2.5,
    backgroundColor: '#0284C7',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden'
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
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
    borderBottomWidth: 1,
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
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
