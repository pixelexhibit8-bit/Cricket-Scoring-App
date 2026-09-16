import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  StatusBar,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  themeColors,
  systemFont,
  systemFontMedium,
  systemFontBold
} from '../theme.js';
import { getTournaments } from '../services/tournamentService.js';
import { getCurrentUser } from '../services/authService.js';
import { getTournamentLogoSource } from '../utils/teamUtils.js';
import { PhoneLoginModal } from '../components/modals/PhoneLoginModal.jsx';
import { useMatch } from '../context/MatchContext.jsx';

export function AllSeriesDirectoryScreen(props = {}) {
  const matchCtx = useMatch();
  const {
    navigation = props.navigation,
    onBack = props.onBack || (() => {
      if (props.navigation && props.navigation.canGoBack()) {
        props.navigation.goBack();
      } else {
        if (matchCtx?.setBottomNavTab) matchCtx.setBottomNavTab('home');
        if (matchCtx?.setCurrentScreen) matchCtx.setCurrentScreen('home');
      }
    }),
    onSelectSeries = props.onSelectSeries || ((sItem) => {
      if (props.navigation) {
        props.navigation.navigate('PublicSeriesView', { seriesData: sItem });
      }
    }),
    isTab = props.isTab || false
  } = props;

  // Active Category Filter Chip State
  const [activeCategory, setActiveCategory] = useState('All');
  const filterCategories = useMemo(() => ['All', 'T20', 'Limited Overs', 'Turf / Box', 'Open'], []);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Custom Tournaments from Database / Storage
  const [tournamentsList, setTournamentsList] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loginModalVisible, setLoginModalVisible] = useState(false);

  const loadTournaments = useCallback(async () => {
    try {
      const list = await getTournaments();
      if (Array.isArray(list)) {
        setTournamentsList(list);
      }
    } catch (e) {
      console.warn('Failed to load tournaments in directory:', e);
    }
  }, []);

  useEffect(() => {
    loadTournaments();
  }, [loadTournaments]);

  const handlePullRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTournaments();
    setRefreshing(false);
  }, [loadTournaments]);

  // Handle Back Button
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation && navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  // Handle Select Series
  const handleSeriesClick = (seriesItem) => {
    if (onSelectSeries) {
      onSelectSeries(seriesItem);
    } else if (navigation) {
      navigation.navigate('PublicSeriesView', { seriesData: seriesItem });
    }
  };

  const handleHostTournament = async () => {
    const user = await getCurrentUser();
    if (!user) {
      setLoginModalVisible(true);
    } else if (navigation) {
      navigation.navigate('CreateTournament');
    }
  };

  const handleLoginSuccess = () => {
    if (navigation) {
      navigation.navigate('CreateTournament');
    }
  };

  // Filtered Tournaments based on Category and Search Query
  const filteredTournaments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return tournamentsList.filter(t => {
      // 1. Category Filter
      if (activeCategory !== 'All') {
        const cat = (t.category || t.format || '').toLowerCase();
        if (!cat.includes(activeCategory.toLowerCase())) return false;
      }

      // 2. Search Query Filter
      if (query) {
        const title = (t.fullName || t.name || t.title || '').toLowerCase();
        const city = (t.city || t.host || '').toLowerCase();
        const venue = (t.venue || (Array.isArray(t.venues) ? t.venues.join(' ') : '')).toLowerCase();
        const format = (t.format || t.category || '').toLowerCase();
        const ball = (t.ballType || '').toLowerCase();
        const organiser = (t.organiserName || t.organizer || '').toLowerCase();

        const matches = title.includes(query) ||
          city.includes(query) ||
          venue.includes(query) ||
          format.includes(query) ||
          ball.includes(query) ||
          organiser.includes(query);

        if (!matches) return false;
      }

      return true;
    });
  }, [tournamentsList, activeCategory, searchQuery]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" translucent={true} backgroundColor="transparent" />
      <View style={styles.container}>

        {/* ── 1. TOP HEADER BAR ── */}
        <View style={styles.headerBar}>
          {!isTab ? (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={handleBack}
              activeOpacity={0.7}
              accessibilityLabel="Go Back"
            >
              <Ionicons name="arrow-back" size={24} color={themeColors.textPrimary} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 36, alignItems: 'flex-start', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="trophy" size={22} color={themeColors.textPrimary} />
            </View>
          )}

          <View style={styles.headerTitleWrap} pointerEvents="none">
            <Text style={styles.headerTitle}>Tournaments & Series</Text>
          </View>

          <View style={{ width: 36 }} />
        </View>

        {/* ── 2. FILTER CATEGORIES BAR ── */}
        <View style={styles.filterBarWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipsContent}
          >
            {filterCategories.map(cat => {
              const isSelected = activeCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.filterChipPill, isSelected && styles.filterChipPillActive]}
                  onPress={() => setActiveCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── 3. ACTIVE REAL-TIME SEARCH BAR ── */}
        <View style={styles.searchSectionWrapper}>
          <View style={styles.searchBoxContainer}>
            <Ionicons name="search-outline" size={18} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search tournaments, cities, venues..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
            {searchQuery.trim().length > 0 ? (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* ── 4. SCROLLABLE TOURNAMENTS LIST ── */}
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handlePullRefresh}
              colors={['#18181B']}
              tintColor="#18181B"
            />
          }
        >
          {filteredTournaments.length > 0 ? (
            <View style={styles.tournamentListBlock}>
              <View style={styles.listHeaderRow}>
                <Text style={styles.listHeaderTitle}>
                  {searchQuery.trim() ? `Search Results (${filteredTournaments.length})` : `All Tournaments (${filteredTournaments.length})`}
                </Text>
              </View>

              <View style={styles.cardsContainer}>
                {filteredTournaments.map((t, idx) => {
                  const logoSource = getTournamentLogoSource(t);
                  const title = t.fullName || t.name || t.title || 'Cricket Tournament';
                  const city = t.city || t.host || 'Local Ground';
                  const dateStr = t.duration || t.startDate || 'Upcoming';
                  const format = t.format || t.category || (t.overs ? `${t.overs} Overs` : 'T20');
                  const ball = t.ballType ? `${t.ballType.charAt(0).toUpperCase() + t.ballType.slice(1)} Ball` : 'Tennis Ball';
                  const teamCount = Array.isArray(t.teams) ? t.teams.length : 0;
                  const matchCount = Array.isArray(t.matches) ? t.matches.length : 0;

                  return (
                    <TouchableOpacity
                      key={t.id || `tourn_${idx}`}
                      style={styles.tournamentCard}
                      activeOpacity={0.85}
                      onPress={() => handleSeriesClick(t)}
                    >
                      {/* Top Row: Logo + Title & Location */}
                      <View style={styles.cardHeaderRow}>
                        <View style={styles.logoWrapper}>
                          <Image
                            source={logoSource}
                            style={styles.tournamentLogoImage}
                            resizeMode="contain"
                          />
                        </View>

                        <View style={styles.titleColumn}>
                          <Text style={styles.tournamentTitleText} numberOfLines={1}>
                            {title}
                          </Text>

                          <View style={styles.metaRow}>
                            <Ionicons name="location-outline" size={13} color="#64748B" />
                            <Text style={styles.metaText} numberOfLines={1}>
                              {city}
                            </Text>
                            <Text style={styles.metaDot}>•</Text>
                            <Ionicons name="calendar-outline" size={13} color="#64748B" />
                            <Text style={styles.metaText} numberOfLines={1}>
                              {dateStr}
                            </Text>
                          </View>
                        </View>

                        <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                      </View>

                      {/* Bottom Tags Row */}
                      <View style={styles.tagsContainer}>
                        <View style={styles.formatTag}>
                          <Text style={styles.formatTagText}>{format}</Text>
                        </View>

                        <View style={styles.tagPill}>
                          <MaterialCommunityIcons name="cricket" size={12} color="#64748B" />
                          <Text style={styles.tagPillText}>{ball}</Text>
                        </View>

                        {teamCount > 0 ? (
                          <View style={styles.tagPill}>
                            <Ionicons name="people-outline" size={12} color="#64748B" />
                            <Text style={styles.tagPillText}>{teamCount} Teams</Text>
                          </View>
                        ) : null}

                        {matchCount > 0 ? (
                          <View style={styles.tagPill}>
                            <MaterialCommunityIcons name="scoreboard-outline" size={12} color="#64748B" />
                            <Text style={styles.tagPillText}>{matchCount} Matches</Text>
                          </View>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyIconCircle}>
                <MaterialCommunityIcons name="trophy-outline" size={38} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery.trim() ? 'No Matching Tournaments Found' : 'No Tournaments Created Yet'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery.trim()
                  ? `No series matching "${searchQuery}". Try a different tournament name, city, or venue.`
                  : 'Host your own local ground, corporate, turf, or club tournament to manage teams, fixtures, and auto-calculated points tables.'}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* ── 5. STICKY BOTTOM HOST CTA BAR ── */}
        <View style={styles.bottomCtaBar}>
          <TouchableOpacity
            style={styles.hostBottomBtn}
            activeOpacity={0.85}
            onPress={handleHostTournament}
          >
            <MaterialCommunityIcons name="trophy" size={18} color="#FFFFFF" />
            <Text style={styles.hostBottomBtnText}>Host a Tournament / Series</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <PhoneLoginModal
          visible={loginModalVisible}
          onClose={() => setLoginModalVisible(false)}
          onSuccess={handleLoginSuccess}
          title="Host a Tournament"
          subtitle="Please verify your mobile number to host tournaments and manage points tables."
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: themeColors.surface
  },
  container: {
    flex: 1,
    backgroundColor: themeColors.appBackground
  },
  headerBar: {
    height: 52,
    backgroundColor: themeColors.surface,
    borderBottomWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    position: 'relative'
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'flex-start',
    justifyContent: 'center',
    zIndex: 1
  },
  headerTitleWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary,
    letterSpacing: -0.2
  },
  filterBarWrapper: {
    backgroundColor: themeColors.surface,
    paddingBottom: 8,
    borderBottomWidth: 0
  },
  filterChipsContent: {
    paddingHorizontal: 16,
    gap: 8
  },
  filterChipPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 0
  },
  filterChipPillActive: {
    backgroundColor: '#18181B'
  },
  filterChipText: {
    fontSize: 12.5,
    fontFamily: systemFontMedium,
    color: '#475569'
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontFamily: systemFontBold
  },
  searchSectionWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: themeColors.surface
  },
  searchBoxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
    borderWidth: 0
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: systemFontMedium,
    color: themeColors.textPrimary,
    paddingVertical: 0
  },
  scrollContainer: {
    flex: 1
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24
  },
  tournamentListBlock: {
    gap: 10
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  listHeaderTitle: {
    fontSize: 14,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  cardsContainer: {
    gap: 12
  },
  tournamentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 0,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  logoWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 0
  },
  tournamentLogoImage: {
    width: 44,
    height: 44,
    borderRadius: 10
  },
  titleColumn: {
    flex: 1,
    gap: 4
  },
  tournamentTitleText: {
    fontSize: 15.5,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  metaText: {
    fontSize: 12,
    fontFamily: systemFont,
    color: '#64748B',
    flexShrink: 1
  },
  metaDot: {
    fontSize: 12,
    color: '#CBD5E1',
    marginHorizontal: 2
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
    paddingTop: 2
  },
  formatTag: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 0
  },
  formatTagText: {
    fontSize: 11,
    fontFamily: systemFontBold,
    color: '#16A34A'
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 0
  },
  tagPillText: {
    fontSize: 11,
    fontFamily: systemFontMedium,
    color: '#64748B'
  },
  emptyStateContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 20,
    borderWidth: 0
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary,
    textAlign: 'center'
  },
  emptySubtitle: {
    fontSize: 12.5,
    fontFamily: systemFont,
    color: themeColors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280
  },
  bottomCtaBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 3
  },
  hostBottomBtn: {
    backgroundColor: '#18181B',
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 0
  },
  hostBottomBtnText: {
    fontSize: 14,
    fontFamily: systemFontBold,
    color: '#FFFFFF'
  }
});

export default AllSeriesDirectoryScreen;
