import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  useWindowDimensions,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { systemFont, systemFontBold, systemFontMedium } from '../../theme.js';
import { TeamIdentityMark } from '../TeamIdentityMark.jsx';
import { getPlayerPhotoFromRegistry } from '../../services/playerPhotoStore.js';
import { getPlayerAvatarTheme, getPlayerInitials } from '../PlayerAvatar.jsx';

export function SquadPreviewModal({
  visible,
  onClose,
  team1Name = 'Team 1',
  team2Name = 'Team 2',
  team1LogoKey = 'csk',
  team2LogoKey = 'rcb',
  team1Roster = [],
  team2Roster = [],
  localPlayersDb = []
}) {
  const { width: screenWidth } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState('team1'); // 'team1' | 'team2'
  const pagerRef = useRef(null);
  const isDraggingPager = useRef(false);

  const getPlayerInfo = (playerItem) => {
    const playerName = typeof playerItem === 'string' ? playerItem : (playerItem?.name || '');
    const clean = String(playerName).trim().toLowerCase();
    
    // 1. Search in local database
    const dbMatch = (localPlayersDb || []).find(p => p && p.name && p.name.trim().toLowerCase() === clean);
    
    // 2. Resolve photo URL
    const rawPhoto = (typeof playerItem === 'object' ? (playerItem?.photoUrl || playerItem?.avatar || playerItem?.photo_url) : null)
      || dbMatch?.avatar
      || dbMatch?.photoUrl
      || dbMatch?.photo_url
      || getPlayerPhotoFromRegistry(playerName)
      || null;

    // 3. Resolve role
    const resolvedRole = (typeof playerItem === 'object' ? playerItem?.role : null)
      || dbMatch?.role
      || 'Player';

    return {
      name: playerName,
      role: resolvedRole,
      photoUrl: rawPhoto,
      phone: dbMatch?.phone || dbMatch?.mobile || ''
    };
  };

  const handleTabPress = (tabKey) => {
    setActiveTab(tabKey);
    isDraggingPager.current = true;
    const targetX = tabKey === 'team1' ? 0 : screenWidth;
    pagerRef.current?.scrollTo({ x: targetX, animated: true });
    setTimeout(() => { isDraggingPager.current = false; }, 300);
  };

  const handleScrollEnd = (e) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(offsetX / screenWidth);
    const newTab = pageIndex === 0 ? 'team1' : 'team2';
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  };

  const renderTeamSquadPage = (teamName, teamLogoKey, roster, accentColor, badgeBorder) => {
    return (
      <View style={{ width: screenWidth, flex: 1, paddingHorizontal: 12 }}>
        {/* Team Hero Header Card */}
        <View style={[styles.heroCard, { borderColor: badgeBorder }]}>
          <TeamIdentityMark team={{ name: teamName, logoKey: teamLogoKey }} size={52} />
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTeamName} numberOfLines={1}>
              {teamName}
            </Text>
            <Text style={[styles.heroBadgeText, { color: accentColor }]}>
              {roster.length} CONFIRMED PLAYERS
            </Text>
          </View>
          <View style={[styles.heroCountPill, { backgroundColor: badgeBorder }]}>
            <Text style={[styles.heroCountPillText, { color: accentColor }]}>
              {roster.length} Players
            </Text>
          </View>
        </View>

        {/* Players Grid with Full Rectangular Sports Cards */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.playersScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {roster.length === 0 ? (
            <View style={styles.emptyView}>
              <Ionicons name="people-outline" size={44} color="#94A3B8" />
              <Text style={styles.emptyText}>No players added to {teamName} yet</Text>
              <Text style={styles.emptySubText}>Add players from the Squad Selection modal</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {roster.map((playerItem, idx) => {
                const info = getPlayerInfo(playerItem);
                const palette = getPlayerAvatarTheme(info.name);
                const initials = getPlayerInitials(info.name);

                return (
                  <View key={`fs-card-${info.name}-${idx}`} style={styles.playerCard}>
                    {/* Box Photo Frame */}
                    <View style={styles.photoBox}>
                      {info.photoUrl ? (
                        <Image
                          source={{ uri: info.photoUrl }}
                          style={styles.fullBoxImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={[styles.initialsBox, { backgroundColor: palette.bg }]}>
                          <Text style={[styles.initialsBoxText, { color: palette.text }]}>
                            {initials}
                          </Text>
                        </View>
                      )}

                      {/* Top-Left Order Tag */}
                      <View style={styles.rankChip}>
                        <Text style={styles.rankChipText}>#{idx + 1}</Text>
                      </View>
                    </View>

                    {/* Name */}
                    <Text
                      style={styles.playerName}
                      numberOfLines={1}
                    >
                      {info.name}
                    </Text>

                    {/* Role Chip */}
                    <View style={styles.roleChip}>
                      <Text style={styles.roleChipText} numberOfLines={1}>
                        {info.role}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Clean Full-Screen Header */}
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={onClose} style={styles.headerLeftBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Playing Squad Banners</Text>

          <View style={{ width: 48 }} />
        </View>

        {/* Swipeable Tabs Row (Team 1 vs Team 2) */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            onPress={() => handleTabPress('team1')}
            activeOpacity={0.8}
            style={[
              styles.tabItem,
              activeTab === 'team1' && styles.tabItemActive
            ]}
          >
            <TeamIdentityMark team={{ name: team1Name, logoKey: team1LogoKey }} size={24} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={[
                  styles.tabTitleText,
                  activeTab === 'team1' ? styles.tabTitleActive : styles.tabTitleInactive
                ]}
                numberOfLines={1}
              >
                {team1Name}
              </Text>
              <Text style={[styles.tabCountText, activeTab === 'team1' && { color: '#0284C7' }]}>
                {team1Roster.length} Players
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleTabPress('team2')}
            activeOpacity={0.8}
            style={[
              styles.tabItem,
              activeTab === 'team2' && styles.tabItemActive
            ]}
          >
            <TeamIdentityMark team={{ name: team2Name, logoKey: team2LogoKey }} size={24} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={[
                  styles.tabTitleText,
                  activeTab === 'team2' ? styles.tabTitleActive : styles.tabTitleInactive
                ]}
                numberOfLines={1}
              >
                {team2Name}
              </Text>
              <Text style={[styles.tabCountText, activeTab === 'team2' && { color: '#0284C7' }]}>
                {team2Roster.length} Players
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Horizontal Swipeable Pager for Teams */}
        <ScrollView
          ref={pagerRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScrollEnd}
          style={{ flex: 1 }}
        >
          {renderTeamSquadPage(team1Name, team1LogoKey, team1Roster, '#0284C7', '#BAE6FD')}
          {renderTeamSquadPage(team2Name, team2LogoKey, team2Roster, '#DC2626', '#FECDD3')}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  headerBar: {
    height: 52,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8
  },
  headerLeftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4
  },
  backBtnText: {
    fontSize: 14,
    fontFamily: systemFontMedium,
    color: '#0F172A'
  },
  headerTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontFamily: systemFontBold
  },
  doneBtn: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontFamily: systemFontBold
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  tabItemActive: {
    backgroundColor: '#F0F9FF',
    borderColor: '#0284C7',
    borderWidth: 1.5
  },
  tabTitleText: {
    fontSize: 13,
    fontFamily: systemFontMedium
  },
  tabTitleActive: {
    color: '#0284C7',
    fontFamily: systemFontBold
  },
  tabTitleInactive: {
    color: '#334155'
  },
  tabCountText: {
    fontSize: 11,
    fontFamily: systemFontMedium,
    color: '#64748B',
    marginTop: 1
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    marginBottom: 8
  },
  heroTeamName: {
    fontSize: 16,
    fontFamily: systemFontBold,
    color: '#0F172A'
  },
  heroBadgeText: {
    fontSize: 11,
    fontFamily: systemFontMedium,
    letterSpacing: 0.4,
    marginTop: 2
  },
  heroCountPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  heroCountPillText: {
    fontSize: 11,
    fontFamily: systemFontBold
  },
  playersScrollContent: {
    paddingVertical: 6,
    paddingBottom: 30
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  playerCard: {
    width: '31.3%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    gap: 4
  },
  photoBox: {
    width: '100%',
    height: 116,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    position: 'relative'
  },
  fullBoxImage: {
    width: '100%',
    height: '100%'
  },
  initialsBox: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  initialsBoxText: {
    fontSize: 26,
    fontFamily: systemFontBold,
    letterSpacing: 0.5
  },
  rankChip: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4
  },
  rankChipText: {
    fontSize: 8.5,
    fontFamily: systemFontMedium,
    color: '#FFFFFF'
  },
  playerName: {
    color: '#0F172A',
    fontSize: 11,
    fontFamily: systemFontMedium,
    textAlign: 'center',
    width: '100%',
    marginTop: 2
  },
  roleChip: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#BAE6FD',
    maxWidth: '100%'
  },
  roleChipText: {
    fontSize: 8.5,
    fontFamily: systemFontMedium,
    color: '#0284C7'
  },
  emptyView: {
    padding: 40,
    alignItems: 'center',
    gap: 8
  },
  emptyText: {
    color: '#0F172A',
    fontSize: 14,
    fontFamily: systemFontBold
  },
  emptySubText: {
    color: '#64748B',
    fontSize: 12,
    fontFamily: systemFont
  }
});

export default SquadPreviewModal;
