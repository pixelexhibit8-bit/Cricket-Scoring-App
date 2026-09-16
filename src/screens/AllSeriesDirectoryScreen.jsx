import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Modal,
  Pressable,
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
        if (matchCtx.setBottomNavTab) matchCtx.setBottomNavTab('home');
        if (matchCtx.setCurrentScreen) matchCtx.setCurrentScreen('home');
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
  const filterCategories = ['All', 'T20', 'Limited Overs', 'Turf / Box', 'Open'];

  // Custom Tournaments from Database / Storage
  const [customTournaments, setCustomTournaments] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loginModalVisible, setLoginModalVisible] = useState(false);

  const loadTournaments = React.useCallback(async () => {
    try {
      const list = await getTournaments();
      if (Array.isArray(list)) {
        setCustomTournaments(list);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    loadTournaments();
  }, [loadTournaments]);

  const handlePullRefresh = React.useCallback(async () => {
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

  const filteredTournaments = customTournaments.filter(t => {
    if (activeCategory === 'All') return true;
    const cat = (t.category || t.format || '').toLowerCase();
    return cat.includes(activeCategory.toLowerCase());
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" translucent={true} backgroundColor="transparent" />
      <View style={styles.container}>

        {/* ── 1. TOP HEADER BAR ── */}
        <View style={styles.headerBar}>
          {/* Centered Title (absolute positioned so it never gets skewed) */}
          <View style={styles.headerTitleWrap} pointerEvents="none">
            <Text style={styles.headerTitle}>Tournaments & Series</Text>
          </View>

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
            <View style={{ width: 36, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="trophy" size={22} color={themeColors.textPrimary} />
            </View>
          )}

          <TouchableOpacity
            style={styles.hostBtn}
            activeOpacity={0.8}
            onPress={handleHostTournament}
          >
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text style={styles.hostBtnText}>Host</Text>
          </TouchableOpacity>
        </View>

        {/* ── 2. FILTER CHIPS BAR ── */}
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

        {/* ── 3. SCROLLABLE CONTENT AREA ── */}
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
            <View style={styles.monthSectionGroup}>
              <Text style={styles.monthGroupTitle}>Active Tournaments ({filteredTournaments.length})</Text>

              <View style={styles.seriesRowsList}>
                {filteredTournaments.map(t => (
                  <TouchableOpacity
                    key={t.id}
                    style={styles.seriesListRow}
                    activeOpacity={0.7}
                    onPress={() => handleSeriesClick(t)}
                  >
                    <View style={[styles.seriesLogoSquare, { backgroundColor: '#18181B10' }]}>
                      <MaterialCommunityIcons name="trophy" size={24} color="#18181B" />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.seriesRowName}>{t.name || t.title || t.fullName}</Text>
                      <Text style={styles.seriesRowDates}>
                        {t.city || 'Local Ground'} • {t.duration || t.startDate || 'Upcoming'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={themeColors.textSubtle} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyIconCircle}>
                <MaterialCommunityIcons name="trophy-outline" size={38} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>No Tournaments Created Yet</Text>
              <Text style={styles.emptySubtitle}>
                Host your own local ground, corporate, turf, or club tournament to manage teams, fixtures, and auto-calculated points tables.
              </Text>
              <TouchableOpacity
                style={styles.emptyActionBtn}
                activeOpacity={0.8}
                onPress={handleHostTournament}
              >
                <MaterialCommunityIcons name="trophy" size={18} color="#FFFFFF" />
                <Text style={styles.emptyActionBtnText}>HOST A TOURNAMENT</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

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
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
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
    fontFamily: systemFontMedium,
    color: themeColors.textPrimary,
    letterSpacing: -0.2
  },
  hostBtn: {
    backgroundColor: '#18181B',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    zIndex: 1
  },
  hostBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: systemFontMedium
  },
  filterBarWrapper: {
    backgroundColor: themeColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
    paddingVertical: 8,
    paddingHorizontal: 12
  },
  filterChipsContent: {
    gap: 8,
    alignItems: 'center'
  },
  filterChipPill: {
    backgroundColor: themeColors.surfaceOffWhite,
    borderWidth: 1,
    borderColor: themeColors.border,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20
  },
  filterChipPillActive: {
    backgroundColor: '#18181B',
    borderColor: '#18181B'
  },
  filterChipText: {
    fontSize: 12,
    fontFamily: systemFontMedium,
    color: themeColors.textSecondary
  },
  filterChipTextActive: {
    color: '#FFFFFF'
  },
  scrollContainer: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16
  },
  monthSectionGroup: {
    gap: 10
  },
  monthGroupTitle: {
    fontSize: 15,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary,
    marginTop: 4,
    marginBottom: 2
  },
  seriesRowsList: {
    backgroundColor: themeColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: themeColors.border,
    overflow: 'hidden'
  },
  seriesListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
    gap: 12
  },
  seriesLogoSquare: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  seriesRowName: {
    fontSize: 14,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary,
    marginBottom: 2
  },
  seriesRowDates: {
    fontSize: 12,
    fontFamily: systemFont,
    color: themeColors.textMuted
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    backgroundColor: themeColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: themeColors.border,
    marginTop: 20
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F8F8FA',
    borderWidth: 1,
    borderColor: themeColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary,
    marginBottom: 8,
    textAlign: 'center'
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: systemFont,
    color: themeColors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20
  },
  emptyActionBtn: {
    backgroundColor: '#18181B',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: systemFontBold,
    letterSpacing: 0.3
  }
});

export default AllSeriesDirectoryScreen;
