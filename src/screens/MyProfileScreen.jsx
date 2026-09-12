import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
  AppState,
  Animated
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PagerView from 'react-native-pager-view';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import {
  systemFont,
  systemFontMedium,
  systemFontBold,
  themeColors
} from '../theme.js';
import { useMatch } from '../context/MatchContext.jsx';
import {
  getCurrentUser,
  getPlayerProfile,
  savePlayerProfile,
  signInWithGoogleOAuth,
  signOutUser,
  calculatePlayerCareerStats,
  isPlayerNameMatch
} from '../services/authService.js';
import { supabase } from '../services/supabaseClient.js';
import { registerPlayerPhoto } from '../services/playerPhotoStore.js';
import { showToast } from '../services/toastService.js';
import { uploadImageToCloudinary } from '../services/cloudinaryService.js';
import { fetchFinishedMatchesFromSupabase } from '../services/matchService.js';
import { ScorerHubCard } from '../components/home/ScorerHubCard.jsx';
import {
  ProfileOverviewTab,
  ProfileBattingTab,
  ProfileBowlingTab,
  ProfileMatchesTab,
  ProfileHeroCard,
  ProfileEditModal,
  PhotoPreviewModal,
  OptionsMenuModal,
  JoinMatchModal,
  ShareAccessModal,
  PhotoSourcePickerModal
} from '../components/profile/index.js';

export function MyProfileScreen(props = {}) {
  const matchCtx = useMatch();
  const {
    finishedMatches = props.finishedMatches || matchCtx.finishedArchive || [],
    activeMatch = props.activeMatch !== undefined ? props.activeMatch : matchCtx.activeMatch,
    onSelectMatch = props.onSelectMatch || ((m) => {
      if (matchCtx.setSelectedMatch) matchCtx.setSelectedMatch(m);
      if (matchCtx.setCurrentScreen) matchCtx.setCurrentScreen('finishedView');
    }),
    onStartQuickMatch = props.onStartQuickMatch || matchCtx.openScorerScreen,
    onJoinMatchByCode = props.onJoinMatchByCode || matchCtx.handleJoinMatchByCode,
    targetPlayer = props.targetPlayer !== undefined ? props.targetPlayer : matchCtx.selectedPlayerProfile,
    onBack = props.onBack || (() => {
      if (props.navigation && props.navigation.canGoBack()) {
        props.navigation.goBack();
      } else if (matchCtx.setCurrentScreen) {
        matchCtx.setCurrentScreen('home');
      }
    }),
    readOnly = props.readOnly || false
  } = props;

  const targetPlayerName = typeof targetPlayer === 'string'
    ? targetPlayer
    : (targetPlayer?.name || targetPlayer?.fullName || targetPlayer?.playerName || '');
  const isPublicView = Boolean(targetPlayer) || readOnly;

  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(targetPlayer ? {
    name: targetPlayerName || 'Cricket Player',
    role: targetPlayer?.role || 'All-Rounder',
    battingStyle: targetPlayer?.battingStyle || 'Right Hand Bat',
    bowlingStyle: targetPlayer?.bowlingStyle || 'Right Arm Medium',
    city: targetPlayer?.city || 'Sadokan',
    jerseyNumber: targetPlayer?.jerseyNumber || '',
    dob: targetPlayer?.dob || '',
    photoUrl: targetPlayer?.photoUrl || targetPlayer?.avatar || ''
  } : null);
  const [loading, setLoading] = useState(!targetPlayer);
  const [matchesList, setMatchesList] = useState(Array.isArray(finishedMatches) ? finishedMatches : []);
  const [profileTab, setProfileTab] = useState('overview');

  // Modals visibility state
  const [isEditing, setIsEditing] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [optionsMenuVisible, setOptionsMenuVisible] = useState(false);
  const [photoSourcePickerVisible, setPhotoSourcePickerVisible] = useState(false);

  // Quick Google Sign-In Input
  const [quickPlayerName, setQuickPlayerName] = useState('');
  const quickPlayerNameRef = useRef(quickPlayerName);
  quickPlayerNameRef.current = quickPlayerName;

  const playerName = targetPlayerName || profile?.name || currentUser?.name || 'Local Player';

  // 1. MEMOIZE MATCHES POOL & CAREER STATS CALCULATION (Critical Performance Hook)
  const careerMatchesPool = useMemo(() => {
    return matchesList.length > 0 ? matchesList : (Array.isArray(finishedMatches) ? finishedMatches : []);
  }, [matchesList, finishedMatches]);

  const stats = useMemo(() => {
    return calculatePlayerCareerStats(playerName, careerMatchesPool);
  }, [playerName, careerMatchesPool]);

  // 2. MEMOIZE TABS CONFIGURATION
  const profileTabs = useMemo(() => [
    { id: 'overview', label: 'Overview' },
    { id: 'batting', label: 'Batting' },
    { id: 'bowling', label: 'Bowling' },
    { id: 'matches', label: `Matches (${stats.participatedMatches?.length || 0})` },
    ...(!isPublicView ? [{ id: 'scorer', label: 'Scorer Hub' }] : [])
  ], [stats.participatedMatches?.length, isPublicView]);

  const activeTabIndex = useMemo(() => {
    const idx = profileTabs.findIndex(t => t.id === profileTab);
    return Math.max(0, idx);
  }, [profileTabs, profileTab]);

  const pagerPosition = useRef(new Animated.Value(activeTabIndex)).current;
  const pagerRef = useRef(null);
  const tabsScrollRef = useRef(null);
  const [tabLayouts, setTabLayouts] = useState({});

  // 3. MEMOIZE TAB LAYOUT & ANIMATION NODES (GPU TRANSFORMS)
  const isTabPressingRef = useRef(false);

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
      inputRange: profileTabs.map((_, i) => i),
      outputRange: profileTabs.map((t, index) => {
        const layout = tabLayouts[t.id];
        return layout?.x != null
          ? layout.x + layout.width / 2 - 50
          : (index * 85 + 16 + 30 - 50);
      }),
      extrapolate: 'clamp'
    });
  }, [pagerPosition, profileTabs, tabLayouts]);

  const animatedUnderlineScaleX = useMemo(() => {
    return pagerPosition.interpolate({
      inputRange: profileTabs.map((_, i) => i),
      outputRange: profileTabs.map(t => {
        const layout = tabLayouts[t.id];
        return (layout?.width != null ? layout.width : 60) / 100;
      }),
      extrapolate: 'clamp'
    });
  }, [pagerPosition, profileTabs, tabLayouts]);

  // 4. MEMOIZE EVENT HANDLERS & CALLBACKS (FLUID SWIPE + ZERO-LAG SPRING PRESS)
  const onTabPress = useCallback((tabId, index) => {
    if (profileTab === tabId) return;
    isTabPressingRef.current = true;
    setProfileTab(tabId);
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
  }, [profileTab, tabLayouts, pagerPosition]);

  const handlePageSelected = useCallback((e) => {
    isTabPressingRef.current = false;
    const pos = e.nativeEvent.position;
    const selectedTab = profileTabs[pos];
    if (selectedTab && selectedTab.id !== profileTab) {
      setProfileTab(selectedTab.id);
      if (tabLayouts[selectedTab.id]?.x != null) {
        tabsScrollRef.current?.scrollTo({ x: Math.max(0, tabLayouts[selectedTab.id].x - 60), animated: true });
      }
    }
  }, [profileTabs, profileTab, tabLayouts]);

  const handlePageScroll = useCallback((e) => {
    if (isTabPressingRef.current) return;
    const { position, offset } = e.nativeEvent;
    pagerPosition.setValue(position + offset);
  }, [pagerPosition]);

  useEffect(() => {
    if (tabLayouts[profileTab]?.x != null) {
      tabsScrollRef.current?.scrollTo({ x: Math.max(0, tabLayouts[profileTab].x - 60), animated: true });
    }
  }, [profileTab, tabLayouts]);

  // 5. ASYNC DATA LOADERS (MEMOIZED)
  const loadMatchesForCareer = useCallback(async () => {
    try {
      let combined = Array.isArray(finishedMatches) ? [...finishedMatches] : [];
      try {
        const dbMatches = await fetchFinishedMatchesFromSupabase();
        if (Array.isArray(dbMatches) && dbMatches.length > 0) {
          dbMatches.forEach(m => {
            const matchId = m.id || m.supabaseId;
            const matchTitle = m.match_title || m.title || m.matchTitle;
            const idx = combined.findIndex(c => (c.id && c.id === matchId) || (c.title && c.title === matchTitle) || (c.matchTitle && c.matchTitle === matchTitle));
            if (idx >= 0) {
              combined[idx] = m;
            } else {
              combined.unshift(m);
            }
          });
        }
      } catch (e) {
        console.warn('Finished matches fetch notice:', e);
      }
      const raw = await AsyncStorage.getItem('cricflow.mobile.match-state.v2');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed?.finishedMatches)) {
          parsed.finishedMatches.forEach(m => {
            if (!combined.some(c => (c.id && c.id === m.id) || (c.title && c.title === m.title))) {
              combined.push(m);
            }
          });
        }
      }
      if (combined.length > 0) {
        setMatchesList(combined);
      }
    } catch (err) {
      console.warn('Failed to load matches for career:', err);
    }
  }, [finishedMatches]);

  const handleAuthenticatedUser = useCallback(async (authUser) => {
    if (!authUser) return;
    try {
      const name = authUser.user_metadata?.full_name || authUser.user_metadata?.name || quickPlayerNameRef.current.trim() || 'Cricket Player';
      const email = authUser.email || '';
      const photoUrl = authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null;

      const userObj = {
        id: authUser.id || `user_${Date.now()}`,
        name,
        email,
        photoUrl,
        provider: 'google',
        signedInAt: new Date().toISOString()
      };

      await AsyncStorage.setItem('@cricscorer_auth_user', JSON.stringify(userObj));
      setCurrentUser(userObj);

      let p = await getPlayerProfile(userObj.id);
      const isNewAccount = !p || !p.phone;

      if (!p) {
        p = await savePlayerProfile({
          name: userObj.name,
          auth_user_id: userObj.id,
          photoUrl: userObj.photoUrl,
          phone: '',
          isProfileComplete: false
        });
      }

      setProfile(p);
      if (isNewAccount && !p.phone) {
        setIsEditing(true);
      } else {
        setIsEditing(false);
      }
    } catch (err) {
      console.warn('Error handling authenticated user:', err);
    }
  }, []);

  const checkSupabaseAuthSession = useCallback(async () => {
    if (supabase && supabase.auth) {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          await handleAuthenticatedUser(data.session.user);
        }
      } catch (err) {
        console.warn('Session check error:', err);
      }
    }
  }, [handleAuthenticatedUser]);

  const loadUserSession = useCallback(async () => {
    if (targetPlayer) {
      const pName = typeof targetPlayer === 'string'
        ? targetPlayer
        : (targetPlayer.name || targetPlayer.fullName || targetPlayer.playerName || 'Cricket Player');

      const directPhoto = targetPlayer.photoUrl || targetPlayer.avatar || targetPlayer.photo_url || '';

      try {
        let dbP = null;
        if (supabase) {
          const { data } = await supabase
            .from('local_players')
            .select('*')
            .ilike('name', pName.trim())
            .limit(1)
            .maybeSingle();
          if (data) {
            dbP = data;
          } else {
            const { data: allPlayers } = await supabase
              .from('local_players')
              .select('*')
              .limit(100);
            if (Array.isArray(allPlayers)) {
              dbP = allPlayers.find(pl => isPlayerNameMatch(pl.name, pName));
            }
          }
        }

        const finalPhoto = dbP?.photo_url || dbP?.photoUrl || directPhoto || '';
        const finalBatting = dbP?.batting_style || dbP?.battingStyle || targetPlayer.battingStyle || 'Right Hand Bat';
        const finalBowling = dbP?.bowling_style || dbP?.bowlingStyle || targetPlayer.bowlingStyle || 'Right Arm Medium';
        const finalRole = dbP?.role || targetPlayer.role || 'All-Rounder';
        const finalCity = dbP?.city || targetPlayer.city || 'Sadokan';
        const finalJersey = dbP?.jersey_number || dbP?.jerseyNumber || targetPlayer.jerseyNumber || '';
        const finalDob = dbP?.dob || targetPlayer.dob || '';

        if (finalPhoto) {
          registerPlayerPhoto(pName, finalPhoto);
        }

        setProfile({
          name: dbP?.name || pName,
          role: finalRole,
          battingStyle: finalBatting,
          bowlingStyle: finalBowling,
          city: finalCity,
          jerseyNumber: finalJersey,
          dob: finalDob,
          photoUrl: finalPhoto
        });
      } catch (e) {
        setProfile({
          name: pName,
          role: targetPlayer.role || 'All-Rounder',
          battingStyle: targetPlayer.battingStyle || 'Right Hand Bat',
          bowlingStyle: targetPlayer.bowlingStyle || 'Right Arm Medium',
          city: targetPlayer.city || 'Sadokan',
          jerseyNumber: targetPlayer.jerseyNumber || '',
          dob: targetPlayer.dob || '',
          photoUrl: directPhoto || ''
        });
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
      if (user) {
        const p = await getPlayerProfile(user.id);
        setProfile(p);
        if (p?.name && p?.photoUrl) {
          registerPlayerPhoto(p.name, p.photoUrl);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [targetPlayer]);

  // Auth Listener & App Lifecycle Effect (Fixed keystroke re-render bug)
  useEffect(() => {
    loadUserSession();
    loadMatchesForCareer();

    let authListener;
    if (supabase && supabase.auth) {
      const res = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          await handleAuthenticatedUser(session.user);
        }
      });
      authListener = res?.data?.subscription;
    }

    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        checkSupabaseAuthSession();
      }
    });

    const linkSub = Linking.addEventListener('url', async (event) => {
      if (event?.url && event.url.includes('access_token=') && supabase) {
        try {
          const hash = event.url.split('#')[1];
          if (hash) {
            const params = new URLSearchParams(hash);
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');
            if (accessToken) {
              const { data } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || ''
              });
              if (data?.user) {
                await handleAuthenticatedUser(data.user);
              }
            }
          }
        } catch (e) {
          console.warn('Deep link parse error:', e);
        }
      }
    });

    return () => {
      authListener?.unsubscribe?.();
      appStateSub.remove();
      linkSub.remove();
    };
  }, [targetPlayer, loadUserSession, loadMatchesForCareer, handleAuthenticatedUser, checkSupabaseAuthSession]);

  const handleRefresh = useCallback(async () => {
    try {
      await Promise.all([
        loadMatchesForCareer(),
        loadUserSession()
      ]);
    } catch (e) {
      console.warn('Refresh error:', e);
    }
  }, [loadMatchesForCareer, loadUserSession]);

  // Photo Upload Handlers
  const processAndUploadPhoto = useCallback(async (asset) => {
    if (!asset) return;
    try {
      const dataUri = asset.base64
        ? `data:image/jpeg;base64,${asset.base64}`
        : asset.uri;

      showToast('Uploading profile photo...', 'info');

      let finalPhotoUrl = asset.uri;
      const uploadedUrl = await uploadImageToCloudinary(dataUri);
      if (uploadedUrl) {
        finalPhotoUrl = uploadedUrl;
      }

      const currentName = profile?.name || currentUser?.name || 'Local Player';
      registerPlayerPhoto(currentName, finalPhotoUrl);
      setProfile(prev => ({ ...prev, photoUrl: finalPhotoUrl }));
      await savePlayerProfile({ photoUrl: finalPhotoUrl });
      showToast('Profile photo updated successfully!', 'success');
    } catch (e) {
      console.warn('Image pick error:', e);
      showToast('Could not update photo', 'error');
    }
  }, [profile?.name, currentUser?.name]);

  const handlePickFromCamera = useCallback(async () => {
    setPhotoSourcePickerVisible(false);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showToast('Camera permission is required to take photo', 'error');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.75,
        base64: true
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await processAndUploadPhoto(result.assets[0]);
      }
    } catch (e) {
      console.warn('Camera error:', e);
      showToast('Could not open camera', 'error');
    }
  }, [processAndUploadPhoto]);

  const handlePickFromGallery = useCallback(async () => {
    setPhotoSourcePickerVisible(false);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showToast('Gallery permission is required to choose photo', 'error');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.75,
        base64: true
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await processAndUploadPhoto(result.assets[0]);
      }
    } catch (e) {
      console.warn('Gallery error:', e);
      showToast('Could not open gallery', 'error');
    }
  }, [processAndUploadPhoto]);

  const handlePickImage = useCallback(() => {
    setPhotoSourcePickerVisible(true);
  }, []);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      setLoading(true);
      try {
        const oAuthData = await signInWithGoogleOAuth();
        if (oAuthData?.url) {
          await Linking.openURL(oAuthData.url);
          setLoading(false);
          return;
        }
      } catch (oauthErr) {
        console.warn('OAuth URL launch fallback:', oauthErr);
      }

      const fallbackUser = {
        id: `google_${Date.now()}`,
        name: quickPlayerNameRef.current.trim() || 'Google Cricketer',
        email: 'cricketer@gmail.com',
        photoUrl: null,
        provider: 'google',
        signedInAt: new Date().toISOString()
      };

      await handleAuthenticatedUser({
        id: fallbackUser.id,
        email: fallbackUser.email,
        user_metadata: { full_name: fallbackUser.name, avatar_url: null }
      });
      showToast('Signed in successfully!', 'success');
    } catch (e) {
      showToast('Unable to sign in. Please try again', 'error');
    } finally {
      setLoading(false);
    }
  }, [handleAuthenticatedUser]);

  const handleInstantLogin = useCallback(async (customName = 'Basti Ram Suthar') => {
    try {
      setLoading(true);
      const instantUser = {
        id: 'usr_expo_scorer_01',
        name: customName,
        email: 'scorer@cricflow.app',
        phone: '9983228208',
        photoUrl: 'https://res.cloudinary.com/aov9a8tl/image/upload/v1786783565/bo80oa5ztg1ub1uf0tet.jpg',
        provider: 'instant',
        signedInAt: new Date().toISOString()
      };

      await handleAuthenticatedUser({
        id: instantUser.id,
        email: instantUser.email,
        user_metadata: { full_name: instantUser.name, avatar_url: null }
      });
      showToast(`Welcome ${customName}! Logged in as Verified Scorer.`, 'success');
    } catch (e) {
      showToast('Unable to sign in. Please try again', 'error');
    } finally {
      setLoading(false);
    }
  }, [handleAuthenticatedUser]);

  const handleSaveProfile = useCallback(async (profileData) => {
    setLoading(true);
    try {
      const updated = await savePlayerProfile(profileData);
      setProfile(updated);
      setIsEditing(false);
      showToast('Profile updated successfully!', 'success');
    } catch (e) {
      showToast('Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSignOut = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of your cricketer account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOutUser();
          setCurrentUser(null);
          setProfile(null);
        }
      }
    ]);
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator size="large" color="#0284C7" />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  // ─── 1. SIGN IN SCREEN ───
  if (!currentUser && !isPublicView) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        {onBack ? (
          <View style={styles.headerBar}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={onBack}
              activeOpacity={0.7}
              accessibilityLabel="Go Back"
            >
              <Ionicons name="arrow-back" size={24} color={themeColors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Sign In</Text>
            <View style={styles.headerRightWrap} />
          </View>
        ) : null}
        <ScrollView style={styles.container} contentContainerStyle={styles.authContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.authCard}>
            <Image source={require('../../assets/logo.png')} style={{ width: 88, height: 88, resizeMode: 'contain', marginBottom: 14 }} />
            <Text style={styles.authTitle}>Welcome to CricScorer</Text>
            <Text style={styles.authSub}>
              Sign in with your Google account or 1-tap fast login to track your career stats, match records and rankings.
            </Text>

            <View style={styles.benefitList}>
              <View style={styles.benefitItem}>
                <MaterialCommunityIcons name="cricket" size={16} color="#0284C7" />
                <Text style={styles.benefitText}>Track all local ground runs, wickets & averages</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="trophy-outline" size={16} color="#D97706" />
                <Text style={styles.benefitText}>Compete on player leaderboards & MVP awards</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="cloud-done-outline" size={16} color="#16A34A" />
                <Text style={styles.benefitText}>Lifetime cloud backup linked to your account</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.googleBtn}
              onPress={handleGoogleSignIn}
              activeOpacity={0.85}
            >
              <Image
                source={require('../../assets/google_logo.png')}
                style={{ width: 22, height: 22, resizeMode: 'contain' }}
              />
              <Text style={styles.googleBtnText}>
                Continue with Google
              </Text>
            </TouchableOpacity>

            {__DEV__ && (
              <TouchableOpacity
                style={styles.devBtn}
                onPress={() => handleInstantLogin('Basti Ram Suthar')}
                activeOpacity={0.85}
              >
                <Ionicons name="flash" size={16} color="#38BDF8" />
                <Text style={styles.devBtnText}>
                  Quick Test Login (Dev Mode)
                </Text>
              </TouchableOpacity>
            )}

            <Text style={styles.authTerms}>
              Fast 1-tap sign in. No phone number or password required.
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ─── 2. MAIN PROFILE SCREEN ───
  return (
    <View style={{ flex: 1, backgroundColor: themeColors.appBackground }}>
      {/* SCREEN HEADER BAR */}
      <View style={styles.headerBar}>
        {onBack ? (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go Back"
          >
            <Ionicons name="arrow-back" size={24} color={themeColors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}

        <Text style={styles.headerTitle}>
          {isPublicView ? 'Player Profile' : 'My Profile'}
        </Text>

        <View style={styles.headerRightWrap}>
          {!isPublicView ? (
            <TouchableOpacity
              onPress={() => setOptionsMenuVisible(true)}
              style={styles.headerActionBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel="Options Menu"
            >
              <Ionicons name="ellipsis-vertical" size={20} color={themeColors.textPrimary} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 36 }} />
          )}
        </View>
      </View>

      {/* HERO PROFILE CARD (MEMOIZED) */}
      <ProfileHeroCard
        playerName={playerName}
        profile={profile}
        onPressPhoto={() => setPhotoModalVisible(true)}
      />

      {/* TABS BAR (CREX / RANKINGS STYLE TEXT-ONLY UNDERLINE) */}
      <View style={styles.tabsBarWrapper}>
        <ScrollView
          ref={tabsScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          {profileTabs.map((t, idx) => {
            const active = profileTab === t.id;
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

      {/* NATIVE HORIZONTAL SWIPEABLE PAGER (ViewPager2) */}
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={activeTabIndex}
        onPageSelected={handlePageSelected}
        onPageScroll={handlePageScroll}
      >
        {/* 1. OVERVIEW PAGE (MEMOIZED) */}
        <View key="overview" style={{ flex: 1 }}>
          <ProfileOverviewTab stats={stats} />
        </View>

        {/* 2. BATTING PAGE (MEMOIZED) */}
        <View key="batting" style={{ flex: 1 }}>
          <ProfileBattingTab stats={stats} />
        </View>

        {/* 3. BOWLING PAGE (MEMOIZED) */}
        <View key="bowling" style={{ flex: 1 }}>
          <ProfileBowlingTab stats={stats} />
        </View>

        {/* 4. MATCHES PAGE (MEMOIZED & VIRTUALIZED) */}
        <View key="matches" style={{ flex: 1 }}>
          <ProfileMatchesTab
            participatedMatches={stats.participatedMatches}
            onSelectMatch={onSelectMatch}
          />
        </View>

        {/* 5. SCORER HUB PAGE (REUSES SCORERHUB CARD) */}
        {!isPublicView ? (
          <View key="scorer" style={{ flex: 1 }}>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 14, paddingBottom: 28 }}
              showsVerticalScrollIndicator={false}
            >
              <ScorerHubCard
                hasActiveMatch={Boolean(activeMatch && activeMatch.phase !== 'result' && activeMatch.phase !== 'finished' && !activeMatch.isCompleted)}
                activeMatch={activeMatch}
                onResumeScoring={onStartQuickMatch}
                onStartQuickMatch={onStartQuickMatch}
                onOpenShareModal={() => setShareModalVisible(true)}
                onOpenJoinModal={() => setJoinModalVisible(true)}
              />
            </ScrollView>
          </View>
        ) : (
          <View key="scorer-disabled" style={{ display: 'none' }} />
        )}
      </PagerView>

      {/* EDIT PROFILE MODAL (ENCAPSULATED STATE) */}
      <ProfileEditModal
        visible={isEditing}
        profile={profile}
        playerName={playerName}
        onClose={() => setIsEditing(false)}
        onSave={handleSaveProfile}
        onPickImage={handlePickImage}
      />

      {/* FULL PHOTO PREVIEW MODAL */}
      <PhotoPreviewModal
        visible={photoModalVisible}
        playerName={playerName}
        photoUrl={profile?.photoUrl}
        isPublicView={isPublicView}
        onClose={() => setPhotoModalVisible(false)}
        onPickImage={handlePickImage}
      />

      {/* 3-DOTS ACTION MENU MODAL */}
      <OptionsMenuModal
        visible={optionsMenuVisible}
        onClose={() => setOptionsMenuVisible(false)}
        onEditProfile={() => setIsEditing(true)}
        onRefreshStats={handleRefresh}
        onSignOut={handleSignOut}
      />

      {/* JOIN MATCH VIA CODE MODAL */}
      <JoinMatchModal
        visible={joinModalVisible}
        onClose={() => setJoinModalVisible(false)}
        onJoinMatchByCode={onJoinMatchByCode}
      />

      {/* SHARE SCORER ACCESS MODAL */}
      <ShareAccessModal
        visible={shareModalVisible}
        activeMatch={activeMatch}
        onClose={() => setShareModalVisible(false)}
        onStartQuickMatch={onStartQuickMatch}
      />

      {/* PHOTO SOURCE SELECTION MODAL */}
      <PhotoSourcePickerModal
        visible={photoSourcePickerVisible}
        onClose={() => setPhotoSourcePickerVisible(false)}
        onPickFromCamera={handlePickFromCamera}
        onPickFromGallery={handlePickFromGallery}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    height: 52,
    backgroundColor: themeColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'flex-start',
    justifyContent: 'center'
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: systemFontMedium,
    color: themeColors.textPrimary,
    textAlign: 'center'
  },
  headerRightWrap: {
    width: 36,
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  container: {
    flex: 1,
    backgroundColor: themeColors.appBackground
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: themeColors.appBackground
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: systemFontMedium
  },
  authContainer: {
    flexGrow: 1,
    padding: 16,
    paddingVertical: 24,
    justifyContent: 'center',
    alignItems: 'center'
  },
  authCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  authTitle: {
    fontSize: 18,
    fontFamily: systemFontBold,
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6
  },
  authSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: systemFont,
    marginBottom: 16
  },
  benefitList: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  benefitText: {
    fontSize: 12,
    color: '#334155',
    fontFamily: systemFontMedium,
    flex: 1
  },
  googleBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 4
  },
  googleBtnText: {
    color: '#1E293B',
    fontSize: 15,
    fontFamily: systemFontMedium
  },
  devBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#071B2C',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#38BDF8',
    marginTop: 10,
    elevation: 2
  },
  devBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontFamily: systemFontBold
  },
  authTerms: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 15,
    fontFamily: systemFont
  },

  // Tabs Bar & Pager Styles
  tabsBarWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    position: 'relative'
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 20
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tabButtonText: {
    fontSize: 14,
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
  }
});

export default MyProfileScreen;
