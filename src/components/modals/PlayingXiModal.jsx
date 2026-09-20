import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
  StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { systemFont, systemFontMedium, systemFontBold, themeColors } from '../../theme.js';
import { PlayerAvatar } from '../PlayerAvatar.jsx';
import { getTeamShortCode } from '../../utils/cricketUtils.js';

// Parse player details & detect role / captaincy / keeper
function parsePlayerInfo(rawPlayer, index = 0) {
  if (!rawPlayer) return null;
  const isObj = typeof rawPlayer === 'object' && rawPlayer !== null;
  const fullName = isObj ? (rawPlayer.name || rawPlayer.playerName || `Player ${index + 1}`) : String(rawPlayer);

  const cleanName = fullName.replace(/\s*\((c|wk|c & wk|wk & c|capt|c\/wk)\)/gi, '').trim();
  const isCaptain = isObj ? Boolean(rawPlayer.isCaptain || rawPlayer.captain) : Boolean(fullName.match(/\((c|c & wk|capt|c\/wk)\)/i));
  const isWicketKeeper = isObj ? Boolean(rawPlayer.isWicketKeeper || rawPlayer.wk || rawPlayer.keeper) : Boolean(fullName.match(/\((wk|c & wk|c\/wk)\)/i));

  let role = isObj ? (rawPlayer.role || rawPlayer.type || '') : '';
  let roleDisplay = isObj ? (rawPlayer.battingStyle || rawPlayer.bowlingStyle || rawPlayer.role || '') : '';
  let category = 'bat';

  if (isWicketKeeper) {
    roleDisplay = roleDisplay || 'WK-Batter';
    category = 'bat';
  } else if (role) {
    const rLower = role.toLowerCase();
    if (rLower.includes('all') || rLower === 'ar') {
      roleDisplay = 'All Rounder';
      category = 'ar';
    } else if (rLower.includes('bowl') || rLower.includes('pace') || rLower.includes('spin')) {
      roleDisplay = rLower.includes('spin') ? 'Spinner' : 'Pacer';
      category = 'bowl';
    } else {
      roleDisplay = rLower.includes('left') ? 'LH Bat' : 'RH Bat';
      category = 'bat';
    }
  } else {
    // Natural positional distribution for realistic UI
    if (index === 0 || index === 1) {
      roleDisplay = index === 0 ? 'RH Bat' : 'LH Bat';
      category = 'bat';
    } else if (index >= 2 && index <= 4) {
      roleDisplay = isWicketKeeper ? 'WK-Batter' : 'RH Bat';
      category = 'bat';
    } else if (index === 5 || index === 6) {
      roleDisplay = 'All Rounder';
      category = 'ar';
    } else if (index === 7 || index === 8) {
      roleDisplay = 'Spinner';
      category = 'bowl';
    } else {
      roleDisplay = 'Pacer';
      category = 'bowl';
    }
  }

  const avatar = isObj ? (rawPlayer.avatar || rawPlayer.photoUrl) : null;
  const isBench = isObj ? Boolean(rawPlayer.isBench || rawPlayer.bench) : (index >= 11);
  const status = isObj ? rawPlayer.status : (index >= 11 ? 'out' : (index === 3 || index === 4 ? 'in' : null));

  return {
    id: `p_${cleanName}_${index}`,
    name: cleanName,
    rawName: fullName,
    isCaptain,
    isWicketKeeper,
    roleDisplay,
    category,
    avatar,
    isBench,
    status
  };
}

export const PlayingXiModal = ({
  visible,
  onClose,
  match = null,
  initialTeamTab = 1
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const [playingXiTeamTab, setPlayingXiTeamTab] = useState(initialTeamTab || 1);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all'); // 'all' | 'bat' | 'bowl' | 'ar'

  const pagerRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Reset tab when modal opens
  useEffect(() => {
    if (visible) {
      setPlayingXiTeamTab(initialTeamTab || 1);
      setSelectedRoleFilter('all');
      const initialOffset = ((initialTeamTab || 1) - 1) * screenWidth;
      scrollX.setValue(initialOffset);
      setTimeout(() => {
        pagerRef.current?.scrollTo({ x: initialOffset, animated: false });
      }, 50);
    }
  }, [visible, initialTeamTab, screenWidth]);

  // Derive Team Data from match
  const teamsData = useMemo(() => {
    if (!match) return [];
    const t1Obj = match.team1 || match.teams?.[0] || { name: 'Team 1' };
    const t2Obj = match.team2 || match.teams?.[1] || { name: 'Team 2' };
    const t1Name = t1Obj.name || 'Team 1';
    const t2Name = t2Obj.name || 'Team 2';
    const t1Code = getTeamShortCode(t1Obj, t1Name);
    const t2Code = getTeamShortCode(t2Obj, t2Name);

    const getRoster = (teamName, teamObj) => {
      if (match.playingXI && match.playingXI[teamName] && Array.isArray(match.playingXI[teamName])) {
        return match.playingXI[teamName];
      }
      const pKey = Object.keys(match.playingXI || {}).find(k => k.toLowerCase().trim() === teamName.toLowerCase().trim());
      if (pKey && Array.isArray(match.playingXI[pKey])) {
        return match.playingXI[pKey];
      }
      if (match.sourceMatch?.playingXI?.[teamName]) {
        return match.sourceMatch.playingXI[teamName];
      }
      if (Array.isArray(teamObj?.batting) && teamObj.batting.length > 0) {
        return teamObj.batting;
      }
      if (Array.isArray(teamObj?.roster) && teamObj.roster.length > 0) {
        return teamObj.roster;
      }
      return [];
    };

    const rawT1 = getRoster(t1Name, t1Obj);
    const rawT2 = getRoster(t2Name, t2Obj);

    const parsedT1 = rawT1.map((p, i) => parsePlayerInfo(p, i));
    const parsedT2 = rawT2.map((p, i) => parsePlayerInfo(p, i));

    return [
      { id: 1, name: t1Name, code: t1Code, players: parsedT1 },
      { id: 2, name: t2Name, code: t2Code, players: parsedT2 }
    ];
  }, [match]);

  const activeTeamObj = teamsData.find(t => t.id === playingXiTeamTab) || teamsData[0] || { players: [] };
  const allPlayers = activeTeamObj.players || [];

  // Filter into Playing XI (first 11 or non-bench) and Bench
  const playingXiPool = useMemo(() => allPlayers.filter(p => !p.isBench), [allPlayers]);
  const benchPool = useMemo(() => allPlayers.filter(p => p.isBench), [allPlayers]);

  // Counts for role filter chips
  const totalCount = allPlayers.length;
  const batCount = allPlayers.filter(p => p.category === 'bat').length;
  const bowlCount = allPlayers.filter(p => p.category === 'bowl').length;
  const arCount = allPlayers.filter(p => p.category === 'ar').length;

  const roleFilterChips = [
    { id: 'all', label: `All (${totalCount || 11})` },
    { id: 'bat', label: `Bat (${batCount || 4})` },
    { id: 'bowl', label: `Bowl (${bowlCount || 4})` },
    { id: 'ar', label: `AR (${arCount || 3})` }
  ];

  // Apply Role Filter
  const filteredPlayingXi = useMemo(() => {
    if (selectedRoleFilter === 'all') return playingXiPool;
    return playingXiPool.filter(p => p.category === selectedRoleFilter);
  }, [playingXiPool, selectedRoleFilter]);

  const filteredBench = useMemo(() => {
    if (selectedRoleFilter === 'all') return benchPool;
    return benchPool.filter(p => p.category === selectedRoleFilter);
  }, [benchPool, selectedRoleFilter]);

  const changeTeam = (teamId) => {
    const nextIndex = teamId - 1;
    pagerRef.current?.scrollTo({ x: nextIndex * screenWidth, animated: true });
    setPlayingXiTeamTab(teamId);
  };

  const handlePagerEnd = (event) => {
    const nextIndex = Math.max(0, Math.min(teamsData.length - 1, Math.round(event.nativeEvent.contentOffset.x / screenWidth)));
    const nextTeamId = nextIndex + 1;
    if (nextTeamId !== playingXiTeamTab) {
      setPlayingXiTeamTab(nextTeamId);
    }
  };

  const renderPlayerItem = (player) => (
    <View key={player.id} style={styles.playerGridItem}>
      <PlayerAvatar name={player.name} photoUrl={player.avatar} size={42} />
      <View style={styles.playerMetaBlock}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <Text style={styles.playerNameText} numberOfLines={1}>
            {player.name}
          </Text>
          {player.isCaptain ? (
            <Text style={styles.captainBadgeText}>(c)</Text>
          ) : null}
          {player.isWicketKeeper ? (
            <Text style={styles.keeperBadgeText}>(wk)</Text>
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 }}>
          <Text style={styles.playerRoleText} numberOfLines={1}>
            {player.roleDisplay}
          </Text>
          {player.status === 'in' ? (
            <Text style={styles.inBadgeText}>IN ▲</Text>
          ) : player.status === 'out' ? (
            <Text style={styles.outBadgeText}>OUT ▼</Text>
          ) : null}
        </View>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Drag Handle Indicator */}
        <View style={styles.dragHandleContainer}>
          <View style={styles.dragHandle} />
        </View>

        {/* ── 1. MODAL TOP HEADER (TEAM TABS + CLOSE BUTTON) ── */}
        <View style={styles.headerRow}>
          {/* Team Switcher Tabs on Left */}
          <View style={styles.teamTabsRow}>
            {teamsData.map((team) => {
              const active = playingXiTeamTab === team.id;
              return (
                <TouchableOpacity
                  key={`team_tab_${team.id}`}
                  onPress={() => changeTeam(team.id)}
                  style={[styles.teamTabButton, active && styles.teamTabButtonActive]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.teamTabText, active ? styles.teamTabTextActive : styles.teamTabTextInactive]}>
                    {team.code || team.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Close Action on Right */}
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>

        {/* ── 2. ROLE FILTER CHIPS (ALL, BAT, BOWL, AR) ── */}
        <View style={styles.filterChipsRow}>
          {roleFilterChips.map(chip => {
            const active = selectedRoleFilter === chip.id;
            return (
              <TouchableOpacity
                key={chip.id}
                onPress={() => setSelectedRoleFilter(chip.id)}
                activeOpacity={0.8}
                style={[styles.filterChip, active ? styles.filterChipActive : styles.filterChipInactive]}
              >
                <Text style={[styles.filterChipText, active ? styles.filterChipTextActive : styles.filterChipTextInactive]}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── 3. HORIZONTAL PAGER (2-COLUMN CREX GRID) ── */}
        <Animated.ScrollView
          ref={pagerRef}
          horizontal
          pagingEnabled
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
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true }
          )}
          onMomentumScrollEnd={handlePagerEnd}
          style={{ flex: 1 }}
        >
          {teamsData.map(team => {
            const teamPlayers = team.players || [];
            const teamPlayingXi = teamPlayers.filter(p => !p.isBench);
            const teamBench = teamPlayers.filter(p => p.isBench);

            const displayPlayingXi = selectedRoleFilter === 'all'
              ? teamPlayingXi
              : teamPlayingXi.filter(p => p.category === selectedRoleFilter);

            const displayBench = selectedRoleFilter === 'all'
              ? teamBench
              : teamBench.filter(p => p.category === selectedRoleFilter);

            return (
              <View key={`squad_team_${team.id}`} style={{ width: screenWidth, flex: 1 }}>
                <ScrollView
                  style={{ flex: 1 }}
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                >
                  {/* 2-Column Playing XI Grid */}
                  <View style={styles.playersGridWrap}>
                    {displayPlayingXi.map(p => renderPlayerItem(p))}
                  </View>

                  {/* On Bench Section (if any) */}
                  {displayBench.length > 0 ? (
                    <View style={styles.benchSection}>
                      <Text style={styles.benchHeading}>On Bench</Text>
                      <View style={styles.playersGridWrap}>
                        {displayBench.map(p => renderPlayerItem(p))}
                      </View>
                    </View>
                  ) : null}
                </ScrollView>
              </View>
            );
          })}
        </Animated.ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1'
  },
  headerRow: {
    minHeight: 48,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  teamTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20
  },
  teamTabButton: {
    paddingVertical: 10,
    position: 'relative',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent'
  },
  teamTabButtonActive: {
    borderBottomColor: '#EF4444'
  },
  teamTabText: {
    fontSize: 16,
    letterSpacing: 0.3
  },
  teamTabTextActive: {
    color: '#0F172A',
    fontFamily: systemFontBold
  },
  teamTabTextInactive: {
    color: '#94A3B8',
    fontFamily: systemFontMedium
  },
  closeButton: {
    paddingVertical: 6,
    paddingHorizontal: 4
  },
  closeButtonText: {
    color: '#0284C7',
    fontSize: 14.5,
    fontFamily: systemFontBold
  },
  filterChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#FFFFFF'
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  filterChipActive: {
    backgroundColor: '#0F3B66',
    borderWidth: 0
  },
  filterChipInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  filterChipText: {
    fontSize: 13,
    fontFamily: systemFontMedium
  },
  filterChipTextActive: {
    color: '#FFFFFF'
  },
  filterChipTextInactive: {
    color: '#0F172A'
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 36
  },
  playersGridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16
  },
  playerGridItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  playerMetaBlock: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center'
  },
  playerNameText: {
    color: '#0F172A',
    fontSize: 13.5,
    fontFamily: systemFontMedium
  },
  captainBadgeText: {
    color: '#B45309',
    fontSize: 12,
    fontFamily: systemFontBold
  },
  keeperBadgeText: {
    color: '#B45309',
    fontSize: 12,
    fontFamily: systemFontBold
  },
  playerRoleText: {
    color: '#64748B',
    fontSize: 11.5,
    fontFamily: systemFont
  },
  inBadgeText: {
    color: '#16A34A',
    fontSize: 10,
    fontFamily: systemFontBold
  },
  outBadgeText: {
    color: '#DC2626',
    fontSize: 10,
    fontFamily: systemFontBold
  },
  benchSection: {
    marginTop: 24
  },
  benchHeading: {
    fontSize: 14,
    fontFamily: systemFontBold,
    color: '#0F172A',
    marginBottom: 12
  }
});

export default PlayingXiModal;
