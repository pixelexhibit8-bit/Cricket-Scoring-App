import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  themeColors,
  systemFont,
  systemFontMedium,
  systemFontBold
} from '../theme.js';
import { useMatch } from '../context/MatchContext.jsx';
import { getCurrentUser, signOutUser, getPlayerProfile } from '../services/authService.js';
import { PhoneLoginModal } from '../components/modals/PhoneLoginModal.jsx';
import { showToast } from '../services/toastService.js';

export function MenuScreen(props = {}) {
  const matchCtx = useMatch();
  const {
    navigation = props.navigation,
    onBack = props.onBack || (() => {
      if (props.navigation && props.navigation.canGoBack()) {
        props.navigation.goBack();
      } else if (matchCtx.setCurrentScreen) {
        matchCtx.setCurrentScreen('home');
      }
    }),
    onLeaderboardPress = props.onLeaderboardPress || (() => {
      if (props.navigation) {
        props.navigation.navigate('Rankings');
      } else if (matchCtx.setCurrentScreen) {
        matchCtx.setCurrentScreen('rankings');
      }
    }),
    onProfilePress = props.onProfilePress || (() => {
      if (props.navigation) {
        props.navigation.navigate('PlayerProfile');
      } else if (matchCtx.setCurrentScreen) {
        matchCtx.setCurrentScreen('playerProfile');
      }
    }),
    onCreateTournamentPress = props.onCreateTournamentPress || (() => {
      if (props.navigation) {
        props.navigation.navigate('CreateTournament');
      } else if (matchCtx.setCurrentScreen) {
        matchCtx.setCurrentScreen('createTournament');
      }
    })
  } = props;

  const [currentUser, setCurrentUser] = useState(null);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [userProfileState, setUserProfileState] = useState({
    name: 'Guest User',
    isLoggedIn: false
  });

  const loadActiveUser = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
      if (user) {
        const p = await getPlayerProfile(user.id, user.phone);
        setUserProfileState({
          name: p?.name || user.name || 'CricFlow Player',
          isLoggedIn: true
        });
      } else {
        setUserProfileState({
          name: 'Guest User',
          isLoggedIn: false
        });
      }
    } catch (e) {}
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadActiveUser();
    }, [loadActiveUser])
  );

  const handleProfileClick = () => {
    if (currentUser) {
      if (onProfilePress) {
        onProfilePress();
      } else if (navigation) {
        navigation.navigate('PlayerProfile');
      }
    } else {
      setPendingAction('profile');
      setLoginModalVisible(true);
    }
  };

  const handleHostTournamentClick = () => {
    if (currentUser) {
      if (onCreateTournamentPress) {
        onCreateTournamentPress();
      } else if (navigation) {
        navigation.navigate('CreateTournament');
      }
    } else {
      setPendingAction('createTournament');
      setLoginModalVisible(true);
    }
  };

  const handleLogoutClick = () => {
    if (!currentUser) {
      setLoginModalVisible(true);
      return;
    }
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOutUser();
          setCurrentUser(null);
          setUserProfileState({
            name: 'Guest User',
            isLoggedIn: false
          });
          showToast('Signed out successfully', 'info');
        }
      }
    ]);
  };

  const handleLoginSuccess = async (result) => {
    setCurrentUser(result?.user || null);
    await loadActiveUser();
    if (pendingAction === 'createTournament') {
      setPendingAction(null);
      if (navigation) {
        navigation.navigate('CreateTournament');
      }
    } else if (pendingAction === 'profile') {
      setPendingAction(null);
      if (navigation) {
        navigation.navigate('PlayerProfile');
      }
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation && navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" translucent={true} backgroundColor="transparent" />
      <View style={styles.container}>
        {/* ── 1. HEADER BAR ── */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleBack}
            activeOpacity={0.7}
            accessibilityLabel="Go Back"
          >
            <Ionicons name="arrow-back" size={24} color={themeColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Menu</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── 2. PROFILE SECTION ── */}
          <TouchableOpacity
            style={styles.profileRow}
            activeOpacity={0.7}
            onPress={handleProfileClick}
          >
            <View style={styles.avatarWrap}>
              <Ionicons name="person-circle-outline" size={48} color="#475569" />
            </View>
            <View style={styles.profileTextWrap}>
              <Text style={styles.profileName} numberOfLines={1}>
                {userProfileState.name}
              </Text>
              {!userProfileState.isLoggedIn ? (
                <Text style={[styles.profileEmail, { color: '#2563EB' }]} numberOfLines={1}>
                  Tap to sign in with mobile OTP
                </Text>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* ── 3. FEATURE NAVIGATION ITEMS ── */}
          <View style={styles.menuGroup}>
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => {
                if (onLeaderboardPress) {
                  onLeaderboardPress();
                } else if (navigation) {
                  navigation.navigate('Rankings');
                }
              }}
            >
              <View style={styles.itemIconWrap}>
                <Ionicons name="stats-chart" size={20} color="#2563EB" />
              </View>
              <Text style={styles.itemLabel}>Rankings</Text>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
              <View style={styles.itemIconWrap}>
                <Ionicons name="calendar" size={20} color="#2563EB" />
              </View>
              <Text style={styles.itemLabel}>Fixtures</Text>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={handleHostTournamentClick}
            >
              <View style={styles.itemIconWrap}>
                <MaterialCommunityIcons name="trophy" size={20} color="#D97706" />
              </View>
              <Text style={styles.itemLabel}>Host a Tournament / Series</Text>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => {
                if (navigation) {
                  navigation.navigate('AllSeriesDirectory');
                }
              }}
            >
              <View style={styles.itemIconWrap}>
                <MaterialCommunityIcons name="trophy-outline" size={20} color="#2563EB" />
              </View>
              <Text style={styles.itemLabel}>All Series</Text>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
              <View style={styles.itemIconWrap}>
                <MaterialCommunityIcons name="account-group" size={20} color="#2563EB" />
              </View>
              <Text style={styles.itemLabel}>Following</Text>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
              <View style={styles.itemIconWrap}>
                <Ionicons name="radio-outline" size={20} color="#DC2626" />
              </View>
              <Text style={styles.itemLabel}>Go Live</Text>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* ── 4. APP SETTINGS SECTION HEADER ── */}
          <View style={styles.sectionHeaderWrap}>
            <Text style={styles.sectionHeaderText}>APP SETTINGS</Text>
          </View>

          {/* ── 5. APP SETTINGS ITEMS ── */}
          <View style={styles.menuGroup}>
            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
              <View style={styles.itemIconWrap}>
                <Ionicons name="settings-outline" size={20} color="#475569" />
              </View>
              <Text style={styles.itemLabel}>Match Settings</Text>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
              <View style={styles.itemIconWrap}>
                <Ionicons name="contrast-outline" size={20} color="#475569" />
              </View>
              <Text style={styles.itemLabel}>App Theme</Text>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
              <View style={styles.itemIconWrap}>
                <Ionicons name="notifications-outline" size={20} color="#475569" />
              </View>
              <Text style={styles.itemLabel}>Notification Settings</Text>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
              <View style={styles.itemIconWrap}>
                <Ionicons name="language-outline" size={20} color="#475569" />
              </View>
              <Text style={styles.itemLabel}>Languages</Text>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
              <View style={styles.itemIconWrap}>
                <Ionicons name="alert-circle-outline" size={20} color="#475569" />
              </View>
              <Text style={styles.itemLabel}>Report a Problem</Text>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
              <View style={styles.itemIconWrap}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#475569" />
              </View>
              <Text style={styles.itemLabel}>Terms & Privacy Policy</Text>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
              <View style={styles.itemIconWrap}>
                <Ionicons name="ellipsis-horizontal-circle-outline" size={20} color="#475569" />
              </View>
              <Text style={styles.itemLabel}>More</Text>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={handleLogoutClick}>
              <View style={styles.itemIconWrap}>
                <Ionicons name={currentUser ? "log-out-outline" : "log-in-outline"} size={20} color="#475569" />
              </View>
              <Text style={styles.itemLabel}>{currentUser ? "Logout" : "Sign In with Mobile OTP"}</Text>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* ── 6. FOOTER VERSION ── */}
          <View style={styles.footerWrap}>
            <Text style={styles.versionText}>v 26.08.04 (645)</Text>
          </View>
        </ScrollView>

        <PhoneLoginModal
          visible={loginModalVisible}
          onClose={() => setLoginModalVisible(false)}
          onSuccess={handleLoginSuccess}
          title={pendingAction === 'createTournament' ? 'Host a Tournament' : 'Sign In to CricFlow'}
          subtitle={pendingAction === 'createTournament' ? 'Please verify your mobile number to host and organize tournaments.' : 'Login with mobile OTP to manage your profile and tournaments.'}
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
    paddingHorizontal: 16
  },
  backBtn: {
    padding: 4,
    marginLeft: -4
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary,
    letterSpacing: -0.2
  },
  scrollContainer: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: 40
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  avatarWrap: {
    marginRight: 14
  },
  profileTextWrap: {
    flex: 1
  },
  profileName: {
    fontSize: 16,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary,
    marginBottom: 2
  },
  profileEmail: {
    fontSize: 12,
    fontFamily: systemFont,
    color: themeColors.textMuted
  },
  divider: {
    height: 1,
    backgroundColor: themeColors.surfaceOffWhite
  },
  menuGroup: {
    backgroundColor: themeColors.surface,
    borderTopWidth: 0,
    borderBottomWidth: 0
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0
  },
  itemIconWrap: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  itemLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: systemFontMedium,
    color: themeColors.textPrimary
  },
  sectionHeaderWrap: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
    backgroundColor: '#F8F8FA'
  },
  sectionHeaderText: {
    fontSize: 11,
    fontFamily: systemFontBold,
    color: themeColors.textMuted,
    letterSpacing: 0.6
  },
  footerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28
  },
  versionText: {
    fontSize: 12,
    fontFamily: systemFont,
    color: '#94A3B8'
  }
});

export default MenuScreen;
