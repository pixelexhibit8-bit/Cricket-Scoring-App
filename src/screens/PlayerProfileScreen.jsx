import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Animated,
  StyleSheet,
  SafeAreaView
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { PlayerAvatar } from '../components/PlayerAvatar.jsx';

const { width: screenWidth } = Dimensions.get('window');

// Default sample data for Ravindra Jadeja (from CREX design reference)
const JADEJA_DEMO_PLAYER = {
  id: 'jadeja-888',
  firstName: 'Ravindra',
  lastName: 'JADEJA',
  fullName: 'Ravindra Anirudhsinh Jadeja',
  country: 'IND',
  flagEmoji: '🇮🇳',
  age: 37,
  role: 'All-Rounder',
  rankings: [
    { label: '#1 All Rounder in Test', icon: 'medal-outline' },
    { label: '#16 Bowler in Test', icon: 'trophy-outline' }
  ],
  photoUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400&auto=format&fit=crop&q=80',
  recentFormBatting: [
    { score: '45 (35)*', vs: 'vs GT, T20', date: '29 May' },
    { score: '12 (9)*', vs: 'vs SRH, T20', date: '24 May' },
    { score: '19 (11)*', vs: 'vs MI, T20', date: '18 May' },
    { score: '31 (16)', vs: 'vs RCB, T20', date: '12 May' }
  ],
  recentFormBowling: [
    { figures: '0-28', vs: 'vs GT, T20', date: '29 May' },
    { figures: '2-21', vs: 'vs SRH, T20', date: '24 May' },
    { figures: '0-24', vs: 'vs MI, T20', date: '18 May' },
    { figures: '3-18', vs: 'vs RCB, T20', date: '12 May' }
  ],
  updates: [
    { id: 'u1', image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=300&auto=format&fit=crop&q=80', title: 'Jadeja stars in Test victory' },
    { id: 'u2', image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=300&auto=format&fit=crop&q=80', title: 'CSK Celebrates Trophy with Jadeja' },
    { id: 'u3', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80', title: 'Bumrah & Jadeja Return to Squad' }
  ],
  battingCareer: {
    format: 'left handed',
    stats: [
      { format: 'ODI', mat: 197, inn: 132, runs: 2756, hs: '87', avg: '32.4', sr: '85.2', fifties: 13, hundreds: 0 },
      { format: 'T20I', mat: 74, inn: 41, runs: 515, hs: '46*', avg: '21.4', sr: '127.1', fifties: 0, hundreds: 0 },
      { format: 'Test', mat: 72, inn: 105, runs: 3036, hs: '175*', avg: '36.1', sr: '57.4', fifties: 20, hundreds: 4 },
      { format: 'IPL', mat: 240, inn: 181, runs: 2959, hs: '62*', avg: '26.8', sr: '129.5', fifties: 3, hundreds: 0 }
    ]
  },
  bowlingCareer: {
    format: 'left-arm orthodox spin',
    stats: [
      { format: 'ODI', mat: 197, inn: 189, wkts: 220, bbm: '5/36', avg: '36.5', eco: '4.88', sr: '44.8', threeW: 12, fiveW: 2 },
      { format: 'T20I', mat: 74, inn: 71, wkts: 54, bbm: '3/15', avg: '28.4', eco: '7.10', sr: '24.0', threeW: 3, fiveW: 0 },
      { format: 'Test', mat: 72, inn: 136, wkts: 294, bbm: '7/42', avg: '24.1', eco: '2.44', sr: '59.3', threeW: 21, fiveW: 15 },
      { format: 'IPL', mat: 240, inn: 211, wkts: 160, bbm: '5/16', avg: '29.7', eco: '7.61', sr: '23.4', threeW: 7, fiveW: 1 }
    ]
  },
  info: {
    born: 'December 6, 1988 (Navagam Ghed, Gujarat)',
    battingStyle: 'Left Handed Bat',
    bowlingStyle: 'Slow Left Arm Orthodox',
    teams: 'India, Chennai Super Kings, Gujarat Lions, Rajasthan Royals',
    hometown: 'Jamnagar, Gujarat'
  }
};

const PROFILE_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'matches', label: 'Matches' },
  { id: 'news', label: 'News' },
  { id: 'info', label: 'Player Info' }
];

export const PlayerProfileScreen = ({ player = JADEJA_DEMO_PLAYER, onBack }) => {
  const activePlayerData = player?.name ? player : JADEJA_DEMO_PLAYER;

  const [activeTab, setActiveTab] = useState('overview');
  const [statMode, setStatMode] = useState('batting'); // 'batting' or 'bowling'
  const [selectedFormat, setSelectedFormat] = useState('Test');

  const pagerScrollX = useRef(new Animated.Value(0)).current;
  const pagerRef = useRef(null);

  // Normalize name parts
  const displayName = activePlayerData.name || activePlayerData.fullName || `${activePlayerData.firstName || ''} ${activePlayerData.lastName || ''}`.trim() || 'Ravindra JADEJA';
  const nameParts = displayName.split(' ');
  const firstName = activePlayerData.firstName || nameParts.slice(0, -1).join(' ') || nameParts[0] || 'Player';
  const lastName = activePlayerData.lastName || (nameParts.length > 1 ? nameParts[nameParts.length - 1].toUpperCase() : '');

  const isBattingMode = statMode === 'batting';
  const careerData = isBattingMode
    ? (activePlayerData.battingCareer || JADEJA_DEMO_PLAYER.battingCareer)
    : (activePlayerData.bowlingCareer || JADEJA_DEMO_PLAYER.bowlingCareer);

  const recentFormList = isBattingMode
    ? (activePlayerData.recentFormBatting || JADEJA_DEMO_PLAYER.recentFormBatting)
    : (activePlayerData.recentFormBowling || JADEJA_DEMO_PLAYER.recentFormBowling);

  const handleTabPress = (tabId) => {
    setActiveTab(tabId);
    const index = PROFILE_TABS.findIndex(t => t.id === tabId);
    if (index >= 0 && pagerRef.current) {
      pagerRef.current.scrollTo({ x: index * screenWidth, animated: true });
    }
  };

  const handlePagerScrollEnd = (event) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    if (PROFILE_TABS[nextIndex] && PROFILE_TABS[nextIndex].id !== activeTab) {
      setActiveTab(PROFILE_TABS[nextIndex].id);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* CREX-Style Dark Hero Header */}
      <View style={styles.heroContainer}>
        {/* Top Action Bar */}
        <View style={styles.heroTopBar}>
          <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.followBtn}>
            <Text style={styles.followBtnText}>Follow</Text>
          </TouchableOpacity>
        </View>

        {/* Player Banner Info */}
        <View style={styles.heroContent}>
          <View style={styles.heroTextSection}>
            <Text style={styles.firstNameText}>{firstName}</Text>
            {lastName ? <Text style={styles.lastNameText}>{lastName}</Text> : null}
            <View style={styles.metaRow}>
              <Text style={{ fontSize: 13 }}>{activePlayerData.flagEmoji || '🇮🇳'} </Text>
              <Text style={styles.metaText}>{activePlayerData.country || 'IND'} • {activePlayerData.age || '37'} yrs</Text>
            </View>
          </View>

          <View style={styles.heroImageWrapper}>
            {(activePlayerData.photoUrl || activePlayerData.avatar) ? (
              <Image source={{ uri: activePlayerData.photoUrl || activePlayerData.avatar }} style={styles.heroPhoto} resizeMode="cover" />
            ) : (
              <PlayerAvatar name={displayName} size={84} />
            )}
          </View>
        </View>

        {/* Tab Strip Header */}
        <View style={styles.tabStrip}>
          {PROFILE_TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => handleTabPress(tab.id)}
                style={styles.tabItem}
              >
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
                {active ? <View style={styles.activeUnderline} /> : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Swipeable Pager for Main Content */}
      <Animated.ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: pagerScrollX } } }],
          { useNativeDriver: true }
        )}
        onMomentumScrollEnd={handlePagerScrollEnd}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {/* ==================== TAB 1: OVERVIEW ==================== */}
        <View style={{ width: screenWidth, flex: 1 }}>
          <ScrollView contentContainerStyle={styles.tabScrollContent} showsVerticalScrollIndicator={false}>
            {/* Roles & Ranking Badges */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgeStrip}>
              <View style={styles.rolePill}>
                <Ionicons name="create-outline" size={14} color="#0F172A" />
                <Text style={styles.rolePillText}>{activePlayerData.role || 'All Rounder'}</Text>
              </View>
              {(activePlayerData.rankings || JADEJA_DEMO_PLAYER.rankings).map((r, i) => (
                <View key={i} style={styles.rankingPill}>
                  <Text style={styles.rankingPillText}>{r.label}</Text>
                </View>
              ))}
            </ScrollView>

            {/* Recent Form Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Form <Text style={styles.sectionSubTitle}>(last played recent)</Text></Text>
              <TouchableOpacity><Text style={styles.seeMoreText}>See More</Text></TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsScroll}>
              {recentFormList.map((item, idx) => (
                <View key={idx} style={styles.formCard}>
                  <Text style={styles.formCardMain}>{isBattingMode ? item.score : item.figures}</Text>
                  <Text style={styles.formCardSub}>{item.vs}</Text>
                </View>
              ))}
            </ScrollView>

            {/* Latest Updates Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Latest Updates</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsScroll}>
              {(activePlayerData.updates || JADEJA_DEMO_PLAYER.updates).map((u) => (
                <View key={u.id} style={styles.updateCard}>
                  <Image source={{ uri: u.image }} style={styles.updateImage} />
                </View>
              ))}
            </ScrollView>

            {/* Career Section Header with Floating Bat / Ball Toggle */}
            <View style={[styles.sectionHeader, { marginTop: 16 }]}>
              <Text style={styles.sectionTitle}>
                {isBattingMode ? 'Batting Career' : 'Bowling Career'} <Text style={styles.sectionSubTitle}>({careerData.format})</Text>
              </Text>
            </View>

            {/* Format Filter Pills */}
            <View style={styles.formatFilterStrip}>
              {['Test', 'ODI', 'T20I', 'IPL'].map((fmt) => {
                const selected = selectedFormat === fmt;
                return (
                  <TouchableOpacity
                    key={fmt}
                    onPress={() => setSelectedFormat(fmt)}
                    style={[styles.formatChip, selected && styles.formatChipSelected]}
                  >
                    <Text style={[styles.formatChipText, selected && styles.formatChipTextSelected]}>
                      {fmt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Career Table Grid */}
            <View style={styles.tableCard}>
              <View style={styles.tableHeader}>
                <Text style={[styles.thCell, { flex: 1.2 }]}>FORMAT</Text>
                <Text style={styles.thCell}>MAT</Text>
                <Text style={styles.thCell}>INN</Text>
                <Text style={styles.thCell}>{isBattingMode ? 'RUNS' : 'WKTS'}</Text>
                <Text style={styles.thCell}>{isBattingMode ? 'AVG' : 'ECO'}</Text>
              </View>

              {careerData.stats.map((row) => {
                const isHighlighted = row.format === selectedFormat;
                return (
                  <View key={row.format} style={[styles.tableRow, isHighlighted && styles.tableRowActive]}>
                    <Text style={[styles.tdCell, { flex: 1.2, fontWeight: '700', color: isHighlighted ? '#0284C7' : '#0F172A' }]}>{row.format}</Text>
                    <Text style={styles.tdCell}>{row.mat}</Text>
                    <Text style={styles.tdCell}>{row.inn}</Text>
                    <Text style={[styles.tdCell, { fontWeight: '700', color: '#0F172A' }]}>{isBattingMode ? row.runs : row.wkts}</Text>
                    <Text style={styles.tdCell}>{isBattingMode ? row.avg : row.eco}</Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>

          {/* Floating Batting / Bowling Mode Toggle Button */}
          <View style={styles.floatingToggleContainer}>
            <TouchableOpacity
              onPress={() => setStatMode(statMode === 'batting' ? 'bowling' : 'batting')}
              style={styles.floatingToggleBtn}
              activeOpacity={0.9}
            >
              <View style={[styles.toggleIconPill, isBattingMode && styles.toggleIconPillActive]}>
                <MaterialCommunityIcons name="cricket" size={18} color={isBattingMode ? '#FFFFFF' : '#64748B'} />
              </View>
              <View style={[styles.toggleIconPill, !isBattingMode && styles.toggleIconPillActive]}>
                <MaterialCommunityIcons name="baseball" size={18} color={!isBattingMode ? '#FFFFFF' : '#64748B'} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ==================== TAB 2: MATCHES ==================== */}
        <View style={{ width: screenWidth, flex: 1 }}>
          <ScrollView contentContainerStyle={styles.tabScrollContent}>
            <Text style={styles.sectionTitle}>Recent Matches Played</Text>
            {recentFormList.map((m, idx) => (
              <View key={idx} style={styles.matchItemCard}>
                <View style={styles.matchItemLeft}>
                  <Text style={styles.matchItemVs}>{m.vs}</Text>
                  <Text style={styles.matchItemDate}>{m.date} 2026</Text>
                </View>
                <View style={styles.matchItemBadge}>
                  <Text style={styles.matchItemScore}>{isBattingMode ? m.score : m.figures}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* ==================== TAB 3: NEWS ==================== */}
        <View style={{ width: screenWidth, flex: 1 }}>
          <ScrollView contentContainerStyle={styles.tabScrollContent}>
            <Text style={styles.sectionTitle}>Player Headlines</Text>
            {(activePlayerData.updates || JADEJA_DEMO_PLAYER.updates).map((u) => (
              <View key={u.id} style={styles.newsCard}>
                <Image source={{ uri: u.image }} style={styles.newsImage} />
                <Text style={styles.newsTitle}>{u.title}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* ==================== TAB 4: PLAYER INFO ==================== */}
        <View style={{ width: screenWidth, flex: 1 }}>
          <ScrollView contentContainerStyle={styles.tabScrollContent}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <View style={styles.infoCard}>
              <InfoRow label="Full Name" value={activePlayerData.fullName || displayName} />
              <InfoRow label="Born" value={activePlayerData.info?.born || 'Not specified'} />
              <InfoRow label="Batting Style" value={activePlayerData.info?.battingStyle || 'Right Handed Bat'} />
              <InfoRow label="Bowling Style" value={activePlayerData.info?.bowlingStyle || 'Right Arm Medium'} />
              <InfoRow label="Primary Teams" value={activePlayerData.info?.teams || 'CricFlow XI'} />
              <InfoRow label="Hometown" value={activePlayerData.info?.hometown || 'Local Ground'} isLast />
            </View>
          </ScrollView>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const InfoRow = ({ label, value, isLast }) => (
  <View style={[styles.infoRow, isLast && { borderBottomWidth: 0 }]}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  // Hero Header
  heroContainer: { backgroundColor: '#091E36', paddingTop: 10, paddingBottom: 0 },
  heroTopBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, minHeight: 44 },
  iconBtn: { padding: 6 },
  followBtn: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  followBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

  heroContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
  heroTextSection: { flex: 1, paddingBottom: 6 },
  firstNameText: { color: '#CBD5E1', fontSize: 18, fontWeight: '400', letterSpacing: 0.5 },
  lastNameText: { color: '#FFFFFF', fontSize: 26, fontWeight: '800', letterSpacing: 0.8, marginTop: -2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  metaText: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },

  heroImageWrapper: { width: 90, height: 90, borderRadius: 45, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E293B' },
  heroPhoto: { width: 90, height: 90, borderRadius: 45 },

  // Tabs
  tabStrip: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', marginTop: 10 },
  tabItem: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  tabLabel: { color: '#94A3B8', fontSize: 13, fontWeight: '600' },
  tabLabelActive: { color: '#FFFFFF', fontWeight: '800' },
  activeUnderline: { position: 'absolute', bottom: 0, height: 3, width: '60%', backgroundColor: '#E11D48', borderRadius: 2 },

  // Scroll Tab Content
  tabScrollContent: { padding: 16, paddingBottom: 80, gap: 14 },
  badgeStrip: { gap: 10, paddingVertical: 4 },
  rolePill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  rolePillText: { fontSize: 12, fontWeight: '700', color: '#0F172A' },
  rankingPill: { backgroundColor: '#F0F9FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#BAE6FD' },
  rankingPillText: { fontSize: 12, fontWeight: '700', color: '#0284C7' },

  // Section Headers
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  sectionSubTitle: { fontSize: 12, fontWeight: '500', color: '#64748B' },
  seeMoreText: { fontSize: 12, fontWeight: '700', color: '#0284C7' },

  // Recent Form Cards
  cardsScroll: { gap: 12, paddingVertical: 6 },
  formCard: { width: 120, height: 80, backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 12, justifyContent: 'center', alignItems: 'center' },
  formCardMain: { fontSize: 17, fontWeight: '800', color: '#0284C7' },
  formCardSub: { fontSize: 11, fontWeight: '600', color: '#64748B', marginTop: 4 },

  // Updates
  updateCard: { width: 140, height: 160, borderRadius: 14, overflow: 'hidden', backgroundColor: '#CBD5E1' },
  updateImage: { width: '100%', height: '100%', borderRadius: 14 },

  // Format Selector
  formatFilterStrip: { flexDirection: 'row', gap: 8, marginVertical: 4 },
  formatChip: { flex: 1, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', backgroundColor: '#FFFFFF' },
  formatChipSelected: { backgroundColor: '#0284C7', borderColor: '#0284C7' },
  formatChipText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  formatChipTextSelected: { color: '#FFFFFF' },

  // Table
  tableCard: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#F8FAFC', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  thCell: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '800', color: '#64748B' },
  tableRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  tableRowActive: { backgroundColor: '#F0F9FF' },
  tdCell: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '600', color: '#334155' },

  // Floating Batting/Bowling Toggle
  floatingToggleContainer: { position: 'absolute', right: 20, bottom: 20, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6 },
  floatingToggleBtn: { flexDirection: 'row', backgroundColor: '#091E36', borderRadius: 30, padding: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  toggleIconPill: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  toggleIconPillActive: { backgroundColor: '#0284C7' },

  // News Tab
  newsCard: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden', gap: 10, paddingBottom: 12 },
  newsImage: { width: '100%', height: 160 },
  newsTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A', paddingHorizontal: 14 },

  // Matches Tab
  matchItemCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  matchItemLeft: { gap: 4 },
  matchItemVs: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  matchItemDate: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  matchItemBadge: { backgroundColor: '#F0F9FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  matchItemScore: { fontSize: 14, fontWeight: '800', color: '#0284C7' },

  // Info Tab
  infoCard: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  infoLabel: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  infoValue: { fontSize: 13, fontWeight: '700', color: '#0F172A', flex: 1, textAlign: 'right' }
});

export default PlayerProfileScreen;
