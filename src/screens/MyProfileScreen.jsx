import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
  Linking,
  AppState,
  RefreshControl
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import {
  systemFont,
  systemFontMedium,
  systemFontBold,
  themeColors,
  typeScale,
  fontWeights
} from '../theme.js';
import {
  getCurrentUser,
  getPlayerProfile,
  savePlayerProfile,
  signInWithGoogleOAuth,
  signInWithGoogle,
  signInWithGoogleMock,
  signOutUser,
  sendPhoneOtp,
  verifyPhoneOtp,
  calculatePlayerCareerStats,
  isPlayerNameMatch
} from '../services/authService.js';
import { supabase } from '../services/supabaseClient.js';
import { registerPlayerPhoto } from '../services/playerPhotoStore.js';
import { PlayerAvatar } from '../components/PlayerAvatar.jsx';
import { DobPickerModal } from '../components/modals/DobPickerModal.jsx';
import { CricToast } from '../components/CricToast.jsx';
import { uploadImageToCloudinary } from '../services/cloudinaryService.js';

export function MyProfileScreen({
  finishedMatches = [],
  activeMatch = null,
  onSelectMatch,
  onStartQuickMatch = null,
  onJoinMatchByCode = null,
  targetPlayer = null,
  onBack = null,
  readOnly = false
}) {
  const targetPlayerName = typeof targetPlayer === 'string'
    ? targetPlayer
    : (targetPlayer?.name || targetPlayer?.fullName || targetPlayer?.playerName || '');
  const isPublicView = Boolean(targetPlayer) || readOnly;
  const [currentUser, setCurrentUser] = useState(null);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [inputMatchCode, setInputMatchCode] = useState('');
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

  // Floating Toast State
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
  };

  const loadMatchesForCareer = async () => {
    try {
      let combined = Array.isArray(finishedMatches) ? [...finishedMatches] : [];
      if (supabase) {
        const { data: dbMatches } = await supabase
          .from('matches')
          .select('*')
          .order('created_at', { ascending: false });
        if (Array.isArray(dbMatches) && dbMatches.length > 0) {
          dbMatches.forEach(m => {
            const matchId = m.id;
            const matchTitle = m.match_title;
            const idx = combined.findIndex(c => (c.id && c.id === matchId) || (c.title && c.title === matchTitle) || (c.matchTitle && c.matchTitle === matchTitle));
            if (idx >= 0) {
              combined[idx] = m;
            } else {
              combined.unshift(m);
            }
          });
        }
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
  };

  useEffect(() => {
    loadMatchesForCareer();
  }, [finishedMatches, targetPlayer]);

  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('All-Rounder');
  const [editBatting, setEditBatting] = useState('Right Hand Bat');
  const [editBowling, setEditBowling] = useState('Right Arm Medium');
  const [editCity, setEditCity] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editJerseyNumber, setEditJerseyNumber] = useState('');
  const [editDob, setEditDob] = useState('');
  const [dobPickerVisible, setDobPickerVisible] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [optionsMenuVisible, setOptionsMenuVisible] = useState(false);

  // Quick Google Sign-In Input
  const [quickPlayerName, setQuickPlayerName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');

  const handleAuthenticatedUser = async (authUser) => {
    if (!authUser) return;
    try {
      const name = authUser.user_metadata?.full_name || authUser.user_metadata?.name || quickPlayerName.trim() || 'Cricket Player';
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
          phone: quickPhone.trim(),
          isProfileComplete: Boolean(quickPhone.trim())
        });
      }

      setProfile(p);
      setEditName(p.name || userObj.name);
      setEditRole(p.role || 'All-Rounder');
      setEditBatting(p.battingStyle || 'Right Hand Bat');
      setEditBowling(p.bowlingStyle || 'Right Arm Medium');
      setEditCity(p.city || '');
      setEditPhone(p.phone || quickPhone.trim() || '');
      setEditJerseyNumber(p.jerseyNumber || '');

      // Only open Edit drawer for 1st-time user if mobile number / profile is missing
      if (isNewAccount && !p.phone) {
        setIsEditing(true);
      } else {
        setIsEditing(false);
      }
    } catch (err) {
      console.warn('Error handling authenticated user:', err);
    }
  };

  const checkSupabaseAuthSession = async () => {
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
  };

  useEffect(() => {
    loadUserSession();
    loadMatchesForCareer();

    // 1. Listen for Supabase OAuth state change
    let authListener;
    if (supabase && supabase.auth) {
      const res = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          await handleAuthenticatedUser(session.user);
        }
      });
      authListener = res?.data?.subscription;
    }

    // 2. Listen for app foregrounding (when user returns from browser)
    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        checkSupabaseAuthSession();
      }
    });

    // 3. Listen for deep link URL
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
  }, [targetPlayer, quickPlayerName, quickPhone]);

  const loadUserSession = async () => {
    if (targetPlayer) {
      const pName = typeof targetPlayer === 'string'
        ? targetPlayer
        : (targetPlayer.name || targetPlayer.fullName || targetPlayer.playerName || 'Cricket Player');
      
      const directPhoto = targetPlayer.photoUrl || targetPlayer.avatar || targetPlayer.photo_url || '';
      
      // Fetch rich profile from Supabase local_players table
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
            // Fallback smart name match
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
        if (p) {
          setEditName(p.name || user.name || '');
          setEditRole(p.role || 'All-Rounder');
          setEditBatting(p.battingStyle || 'Right Hand Bat');
          setEditBowling(p.bowlingStyle || 'Right Arm Medium');
          setEditCity(p.city || '');
          setEditPhone(p.phone || '');
          setEditJerseyNumber(p.jerseyNumber || p.jersey_number || '');
          setEditDob(p.dob || '');
          if (p.name && p.photoUrl) {
            registerPlayerPhoto(p.name, p.photoUrl);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadMatchesForCareer(),
        loadUserSession()
      ]);
      showToast('Profile refreshed', 'success');
    } catch (e) {
      console.warn('Refresh error:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const [photoSourcePickerVisible, setPhotoSourcePickerVisible] = useState(false);

  const processAndUploadPhoto = async (asset) => {
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
  };

  const handlePickFromCamera = async () => {
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
  };

  const handlePickFromGallery = async () => {
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
  };

  const handlePickImage = () => {
    setPhotoSourcePickerVisible(true);
  };

  // Phone Auth State
  const [authPhone, setAuthPhone] = useState('');
  const [authOtp, setAuthOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSendOtp = async () => {
    const cleanPhone = authPhone.trim().replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      showToast('Please enter a valid 10-digit mobile number', 'error');
      return;
    }
    setLoading(true);
    try {
      await sendPhoneOtp(cleanPhone);
      setOtpSent(true);
      setResendTimer(30);
      setAuthOtp('');
      showToast(`OTP sent to +91 ${cleanPhone.slice(-10)}`, 'success');
    } catch (e) {
      showToast(e?.message || 'Could not send OTP. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!authOtp || authOtp.trim().length < 4) {
      showToast('Please enter the verification code', 'error');
      return;
    }
    setLoading(true);
    try {
      const cleanPhone = authPhone.trim().replace(/\D/g, '');
      const { user, profile: verifiedProfile, isExistingPlayer } = await verifyPhoneOtp(cleanPhone, authOtp.trim());

      setCurrentUser(user);
      setProfile(verifiedProfile);
      setEditName(verifiedProfile.name || '');
      setEditPhone(cleanPhone);
      setEditRole(verifiedProfile.role || 'All-Rounder');
      setEditBatting(verifiedProfile.battingStyle || 'Right Hand Bat');
      setEditBowling(verifiedProfile.bowlingStyle || 'Right Arm Medium');
      setEditCity(verifiedProfile.city || '');
      setEditJerseyNumber(verifiedProfile.jerseyNumber || '');

      if (isExistingPlayer && verifiedProfile.name) {
        showToast(`Welcome back, ${verifiedProfile.name}! Career stats linked!`, 'success');
      } else {
        showToast('Mobile verified successfully! Please complete your player profile.', 'success');
        setIsEditing(true);
      }
    } catch (e) {
      showToast(e?.message || 'Invalid verification code. Please try again', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);

      // 1. Try real Google OAuth 2.0 Browser Authentication
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

      // 2. Direct Fallback if in Expo Go / standalone simulation
      const fallbackUser = {
        id: `google_${Date.now()}`,
        name: quickPlayerName.trim() || 'Google Cricketer',
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
  };

  const handleInstantLogin = async (customName = 'Basti Ram Suthar') => {
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
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      showToast('Please enter your player full name', 'error');
      return;
    }
    const cleanPhone = editPhone.trim().replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      showToast('Mobile number is mandatory (10 digits)', 'error');
      return;
    }
    setLoading(true);
    try {
      const updated = await savePlayerProfile({
        name: editName.trim(),
        role: editRole,
        battingStyle: editBatting,
        bowlingStyle: editBowling,
        city: editCity.trim() || 'Local Ground',
        jerseyNumber: editJerseyNumber.trim(),
        phone: cleanPhone,
        dob: editDob || profile?.dob || '',
        photoUrl: profile?.photoUrl || null,
        isProfileComplete: true
      });
      setProfile(updated);
      setIsEditing(false);
      showToast('Profile updated successfully!', 'success');
    } catch (e) {
      showToast('Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of your cricketer account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOutUser();
          setCurrentUser(null);
          setProfile(null);
          setOtpSent(false);
          setAuthPhone('');
          setAuthOtp('');
        }
      }
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator size="large" color="#0284C7" />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  // ─── 1. SIGN IN SCREEN (OFFICIAL GOOGLE AUTHENTICATION) ───
  if (!currentUser && !isPublicView) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <ScrollView style={styles.container} contentContainerStyle={styles.authContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.authCard}>
            {/* CricScorer Brand Logo */}
            <Image source={require('../../assets/logo.png')} style={{ width: 88, height: 88, resizeMode: 'contain', marginBottom: 14 }} />
            <Text style={styles.authTitle}>Welcome to CricScorer</Text>
            <Text style={styles.authSub}>
              Sign in with your Google account or 1-tap fast login to track your career stats, match records and rankings.
            </Text>

            {/* Feature Perks */}
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

            {/* Official Google Login Button (Authentic Multi-Color G Logo) */}
            <TouchableOpacity
              style={{
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
              }}
              onPress={handleGoogleSignIn}
              activeOpacity={0.85}
            >
              <Image
                source={require('../../assets/google_logo.png')}
                style={{ width: 22, height: 22, resizeMode: 'contain' }}
              />
              <Text style={{ color: '#1E293B', fontSize: 15, fontFamily: systemFontMedium }}>
                Continue with Google
              </Text>
            </TouchableOpacity>

            {/* Dev Mode Instant Login (Automatically hidden in production/release builds) */}
            {__DEV__ && (
              <TouchableOpacity
                style={{
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
                }}
                onPress={() => handleInstantLogin('Basti Ram Suthar')}
                activeOpacity={0.85}
              >
                <Ionicons name="flash" size={16} color="#38BDF8" />
                <Text style={{ color: '#FFFFFF', fontSize: 13.5, fontFamily: systemFontBold }}>
                  ⚡ Quick Test Login (Dev Mode)
                </Text>
              </TouchableOpacity>
            )}

            <Text style={styles.authTerms}>
              Fast 1-tap sign in. No phone number or password required.
            </Text>
          </View>
        </ScrollView>

        <CricToast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(prev => ({ ...prev, visible: false }))}
        />
      </View>
    );
  }

  // ─── 2. PLAYER PROFILE VIEW (SELF OR PUBLIC) ───
  const playerName = targetPlayerName || profile?.name || currentUser?.name || 'Local Player';
  const stats = calculatePlayerCareerStats(playerName, matchesList.length > 0 ? matchesList : finishedMatches);

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      {onBack ? (
        <View style={{ backgroundColor: '#071B2C', paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: '#123A56' }}>
          <TouchableOpacity onPress={onBack} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="arrow-back" size={22} color="#E0F2FE" />
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontFamily: systemFontBold }}>{playerName}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.profileContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#0284C7']}
            tintColor="#0284C7"
          />
        }
      >
      {/* HERO PROFILE CARD */}
      <View style={styles.profileHeaderCard}>
        <View style={styles.profileAvatarRow}>
          {/* Clean Avatar (Tap to View Full Photo) */}
          <TouchableOpacity
            onPress={() => setPhotoModalVisible(true)}
            style={styles.avatarWrapper}
            activeOpacity={0.85}
          >
            <PlayerAvatar
              name={playerName}
              photoUrl={profile?.photoUrl}
              size={64}
            />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, paddingRight: 6 }}>
                <Text style={styles.playerNameText} numberOfLines={1}>{playerName}</Text>
                {profile?.jerseyNumber ? (
                  <View style={styles.jerseyBadge}>
                    <Text style={styles.jerseyBadgeText}>#{profile.jerseyNumber}</Text>
                  </View>
                ) : null}
                <Ionicons name="checkmark-circle" size={17} color="#0284C7" />
              </View>

              {/* 3-DOTS INDUSTRIAL ACTION MENU (Only for profile owner) */}
              {!isPublicView ? (
                <TouchableOpacity
                  onPress={() => setOptionsMenuVisible(true)}
                  style={styles.threeDotsBtn}
                  activeOpacity={0.7}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="ellipsis-vertical" size={20} color="#64748B" />
                </TouchableOpacity>
              ) : null}
            </View>

            <Text style={styles.playerRoleText}>
              {profile?.role || 'All-Rounder'} • {profile?.city || 'Local Ground'}
            </Text>

            {/* Batting & Bowling Styles (Sleek Horizontal Badges) */}
            <View style={styles.styleBadgesRow}>
              <View style={styles.styleBadgeItem}>
                <MaterialCommunityIcons name="cricket" size={12} color="#0284C7" />
                <Text style={styles.styleBadgeText}>{profile?.battingStyle || 'Right Hand Bat'}</Text>
              </View>
              <View style={[styles.styleBadgeItem, styles.bowlingBadgeItem]}>
                <MaterialCommunityIcons name="baseball" size={12} color="#64748B" />
                <Text style={[styles.styleBadgeText, { color: '#475569' }]}>{profile?.bowlingStyle || 'Right Arm Medium'}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* GROUND MATCH SCORING & CO-SCORER HUB (Only for profile owner) */}
      {!isPublicView && (
        <View style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          gap: 12
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialCommunityIcons name="scoreboard-outline" size={18} color="#0284C7" />
              <Text style={{ fontSize: 11, color: '#64748B', letterSpacing: 0.5, fontFamily: systemFontBold }}>
                GROUND MATCH SCORING
              </Text>
            </View>
            <View style={{ backgroundColor: '#F0F9FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: '#BAE6FD' }}>
              <Text style={{ fontSize: 10, color: '#0284C7', fontFamily: systemFontBold }}>Verified Scorer</Text>
            </View>
          </View>

          {/* Primary Action: Start Quick Match */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              if (onStartQuickMatch) onStartQuickMatch();
            }}
            style={{
              backgroundColor: '#0284C7',
              borderRadius: 12,
              height: 44,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            <MaterialCommunityIcons name="cricket" size={18} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontSize: 13, fontFamily: systemFontBold }}>
              START NEW QUICK MATCH
            </Text>
          </TouchableOpacity>

          {/* Secondary Co-Scorer Actions */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setJoinModalVisible(true)}
              style={{
                flex: 1,
                backgroundColor: '#F8FAFC',
                borderRadius: 10,
                paddingVertical: 9,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 6,
                borderWidth: 1,
                borderColor: '#E2E8F0'
              }}
            >
              <Ionicons name="key-outline" size={14} color="#0284C7" />
              <Text style={{ color: '#334155', fontSize: 11.5, fontFamily: systemFontMedium }}>Enter Match Code</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShareModalVisible(true)}
              style={{
                flex: 1,
                backgroundColor: '#F8FAFC',
                borderRadius: 10,
                paddingVertical: 9,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 6,
                borderWidth: 1,
                borderColor: '#E2E8F0'
              }}
            >
              <Ionicons name="share-social-outline" size={14} color="#0284C7" />
              <Text style={{ color: '#334155', fontSize: 11.5, fontFamily: systemFontMedium }}>Share Access</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* QUICK CAREER OVERVIEW (4 TILES) */}
      <Text style={styles.sectionHeader}>CAREER SUMMARY</Text>
      <View style={styles.summaryGrid}>
        {/* Matches */}
        <View style={styles.summaryCard}>
          <MaterialCommunityIcons name="scoreboard-outline" size={48} color="#0F172A" style={{ position: 'absolute', right: -8, bottom: -8, opacity: 0.06 }} />
          <Text style={styles.summaryVal}>{stats.matchesPlayed}</Text>
          <Text style={styles.summaryLbl}>Matches</Text>
        </View>

        {/* Total Runs */}
        <View style={styles.summaryCard}>
          <MaterialCommunityIcons name="cricket" size={48} color="#0284C7" style={{ position: 'absolute', right: -8, bottom: -8, opacity: 0.08 }} />
          <Text style={[styles.summaryVal, { color: '#0284C7' }]}>{stats.totalRuns}</Text>
          <Text style={styles.summaryLbl}>Total Runs</Text>
        </View>

        {/* High Score */}
        <View style={styles.summaryCard}>
          <Ionicons name="trophy-outline" size={44} color="#059669" style={{ position: 'absolute', right: -6, bottom: -6, opacity: 0.08 }} />
          <Text style={[styles.summaryVal, { color: '#059669' }]}>{stats.highestScore}</Text>
          <Text style={styles.summaryLbl}>High Score</Text>
        </View>

        {/* Wickets */}
        <View style={styles.summaryCard}>
          <MaterialCommunityIcons name="baseball" size={48} color="#7C3AED" style={{ position: 'absolute', right: -8, bottom: -8, opacity: 0.08 }} />
          <Text style={[styles.summaryVal, { color: '#7C3AED' }]}>{stats.wickets}</Text>
          <Text style={styles.summaryLbl}>Wickets</Text>
        </View>
      </View>

      {/* DETAILED BATTING RECORD */}
      <View style={styles.statsCard}>
        {/* Subtle Batsman Background Watermark Graphic */}
        <MaterialCommunityIcons
          name="cricket"
          size={135}
          color="#0284C7"
          style={{ position: 'absolute', right: -15, bottom: -25, opacity: 0.05, transform: [{ rotate: '-12deg' }] }}
        />
        <View style={styles.statsCardHeader}>
          <MaterialCommunityIcons name="cricket" size={18} color="#0284C7" />
          <Text style={styles.statsCardTitle}>Batting Performance</Text>
        </View>
        <View style={styles.statRowGrid}>
          <View style={styles.statCol}>
            <Text style={styles.statColVal}>{stats.inningsBatted}</Text>
            <Text style={styles.statColLbl}>Innings</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statColVal}>{stats.strikeRate}</Text>
            <Text style={styles.statColLbl}>Strike Rate</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statColVal}>{stats.battingAvg}</Text>
            <Text style={styles.statColLbl}>Average</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statColVal}>{stats.fours}</Text>
            <Text style={styles.statColLbl}>Fours (4s)</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statColVal}>{stats.sixes}</Text>
            <Text style={styles.statColLbl}>Sixes (6s)</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statColVal}>{stats.fifties}</Text>
            <Text style={styles.statColLbl}>50s</Text>
          </View>
        </View>
      </View>

      {/* DETAILED BOWLING RECORD */}
      <View style={styles.statsCard}>
        {/* Subtle Bowler Background Watermark Graphic */}
        <MaterialCommunityIcons
          name="baseball"
          size={135}
          color="#7C3AED"
          style={{ position: 'absolute', right: -15, bottom: -25, opacity: 0.05, transform: [{ rotate: '12deg' }] }}
        />
        <View style={styles.statsCardHeader}>
          <MaterialCommunityIcons name="baseball" size={18} color="#7C3AED" />
          <Text style={styles.statsCardTitle}>Bowling Performance</Text>
        </View>
        <View style={styles.statRowGrid}>
          <View style={styles.statCol}>
            <Text style={styles.statColVal}>{stats.oversBowled}</Text>
            <Text style={styles.statColLbl}>Overs</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statColVal}>{stats.wickets}</Text>
            <Text style={styles.statColLbl}>Wickets</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statColVal}>{stats.economy}</Text>
            <Text style={styles.statColLbl}>Economy</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statColVal}>{stats.maidens}</Text>
            <Text style={styles.statColLbl}>Maidens</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statColVal}>{stats.bestBowling}</Text>
            <Text style={styles.statColLbl}>Best Bowling</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statColVal}>{stats.runsConceded}</Text>
            <Text style={styles.statColLbl}>Runs Given</Text>
          </View>
        </View>
      </View>

      {/* MY MATCHES HISTORY */}
      <Text style={styles.sectionHeader}>MATCHES PLAYED ({stats.participatedMatches.length})</Text>
      {stats.participatedMatches.length === 0 ? (
        <View style={styles.emptyMatchesCard}>
          <Ionicons name="trophy-outline" size={28} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No Matches Recorded Yet</Text>
          <Text style={styles.emptySub}>
            When you play in a match on CricScorer, your individual batting and bowling cards will appear here.
          </Text>
        </View>
      ) : (
        stats.participatedMatches.map((m, idx) => {
          const matchTitle = m.match_title || m.matchTitle || m.title || (m.team1_name && m.team2_name ? `${m.team1_name} vs ${m.team2_name}` : '') || (m.match_data?.matchTitle || (m.match_data?.team1?.name && m.match_data?.team2?.name ? `${m.match_data.team1.name} vs ${m.match_data.team2.name}` : '')) || (m.team1?.name && m.team2?.name ? `${m.team1.name} vs ${m.team2.name}` : 'Cricket Match');
          const matchResult = m.result_text || m.resultText || m.match_data?.resultText || m.winner || 'Match Completed';
          const matchDate = m.dateText || m.dateLabel || (m.created_at ? new Date(m.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent Match');

          return (
            <TouchableOpacity
              key={`match_history_${m.id || 'item'}_${idx}`}
              style={styles.matchHistoryItem}
              onPress={() => {
                if (onSelectMatch) {
                  const fullMatch = m.match_data ? { ...m.match_data, id: m.id, title: matchTitle, matchTitle, resultText: matchResult, dateText: matchDate } : m;
                  onSelectMatch(fullMatch);
                }
              }}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.matchTitle}>{matchTitle}</Text>
                <Text style={styles.matchDate}>{matchDate}</Text>
                <Text style={styles.matchResultText} numberOfLines={1}>{matchResult}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#0284C7" />
            </TouchableOpacity>
          );
        })
      )}

      {/* EDIT PROFILE MODAL */}
      <Modal visible={isEditing} animationType="slide" transparent onRequestClose={() => setIsEditing(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Cricket Profile</Text>
              <TouchableOpacity onPress={() => setIsEditing(false)}>
                <Ionicons name="close-circle" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Photo Change in Edit Modal */}
              <View style={{ alignItems: 'center', marginBottom: 18, marginTop: 4 }}>
                <TouchableOpacity
                  onPress={handlePickImage}
                  style={{ position: 'relative' }}
                  activeOpacity={0.85}
                >
                  <PlayerAvatar name={editName || playerName} photoUrl={profile?.photoUrl} size={76} />
                  <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#0284C7', width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' }}>
                    <Ionicons name="camera" size={13} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={handlePickImage} style={{ marginTop: 6 }}>
                  <Text style={{ color: '#0284C7', fontSize: 12.5, fontFamily: systemFontMedium }}>Change Profile Photo</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Player Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Enter name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Playing Role</Text>
                <View style={styles.pillSelectorRow}>
                  {['Batter', 'Bowler', 'All-Rounder', 'Wicket Keeper'].map(role => (
                    <TouchableOpacity
                      key={role}
                      style={[styles.roleSelectPill, editRole === role && styles.roleSelectPillActive]}
                      onPress={() => setEditRole(role)}
                    >
                      <Text style={[styles.roleSelectPillText, editRole === role && styles.roleSelectPillTextActive]}>{role}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Batting Style</Text>
                <View style={styles.pillSelectorRow}>
                  {['Right Hand Bat', 'Left Hand Bat'].map(b => (
                    <TouchableOpacity
                      key={b}
                      style={[styles.roleSelectPill, editBatting === b && styles.roleSelectPillActive]}
                      onPress={() => setEditBatting(b)}
                    >
                      <Text style={[styles.roleSelectPillText, editBatting === b && styles.roleSelectPillTextActive]}>{b}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bowling Style</Text>
                <View style={styles.pillSelectorRow}>
                  {['Right Arm Fast', 'Right Arm Medium', 'Off Spin', 'Leg Spin', 'Left Arm Medium', 'Left Arm Spin'].map(b => (
                    <TouchableOpacity
                      key={b}
                      style={[styles.roleSelectPill, editBowling === b && styles.roleSelectPillActive]}
                      onPress={() => setEditBowling(b)}
                    >
                      <Text style={[styles.roleSelectPillText, editBowling === b && styles.roleSelectPillTextActive]}>{b}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Jersey Number</Text>
                <TextInput
                  style={styles.textInput}
                  value={editJerseyNumber}
                  onChangeText={setEditJerseyNumber}
                  placeholder="e.g. 7, 18, 45"
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>

              {/* Date of Birth Picker (Premium Industry Standard) */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Date of Birth</Text>
                <TouchableOpacity
                  onPress={() => setDobPickerVisible(true)}
                  style={[styles.textInput, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 }]}
                  activeOpacity={0.8}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="calendar-outline" size={18} color="#0284C7" />
                    <Text style={{ color: editDob ? '#0F172A' : '#94A3B8', fontSize: 13, fontFamily: systemFontMedium }}>
                      {editDob ? editDob : 'Select Date of Birth'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>City / Ground</Text>
                <TextInput
                  style={styles.textInput}
                  value={editCity}
                  onChangeText={setEditCity}
                  placeholder="Enter city or ground"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Mobile Number <Text style={{ color: '#EF4444' }}>* (Mandatory)</Text>
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="10-digit mobile number"
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} activeOpacity={0.8}>
                <Text style={styles.saveBtnText}>Save Profile Changes</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      </ScrollView>

      {/* Premium Date of Birth Modal */}
      <DobPickerModal
        visible={dobPickerVisible}
        initialDate={editDob}
        onClose={() => setDobPickerVisible(false)}
        onSelectDate={(selectedDate) => setEditDob(selectedDate)}
      />

      {/* Full Player Photo Preview & Quick Edit Modal */}
      <Modal
        visible={photoModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPhotoModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setPhotoModalVisible(false)}
          style={{ flex: 1, backgroundColor: 'rgba(7, 27, 44, 0.92)', justifyContent: 'center', alignItems: 'center', padding: 24 }}
        >
          <TouchableOpacity activeOpacity={1} style={{ width: '100%', maxWidth: 360, alignItems: 'center' }}>
            {/* Header */}
            <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 17, fontFamily: systemFontBold }}>
                {playerName}
              </Text>
              <TouchableOpacity
                onPress={() => setPhotoModalVisible(false)}
                style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Large High-Res Photo Circle */}
            <View style={{ width: 220, height: 220, borderRadius: 110, overflow: 'hidden', borderWidth: 3, borderColor: '#0284C7', backgroundColor: '#0F2942', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 18, elevation: 12 }}>
              <PlayerAvatar
                name={playerName}
                photoUrl={profile?.photoUrl}
                size={220}
              />
            </View>

            {/* Quick Change / Update Photo Button for Logged-In User */}
            <View style={{ width: '100%', flexDirection: 'row', gap: 10, marginTop: 28 }}>
              {!isPublicView ? (
                <TouchableOpacity
                  onPress={() => {
                    setPhotoModalVisible(false);
                    handlePickImage();
                  }}
                  style={{
                    flex: 1.4,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    backgroundColor: '#0284C7',
                    paddingVertical: 13,
                    borderRadius: 12
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="create-outline" size={18} color="#FFFFFF" />
                  <Text style={{ color: '#FFFFFF', fontSize: 13, fontFamily: systemFontBold }}>Change Photo</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                onPress={() => setPhotoModalVisible(false)}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  paddingVertical: 13,
                  borderRadius: 12
                }}
                activeOpacity={0.85}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 13, fontFamily: systemFontBold }}>Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 3-DOTS INDUSTRIAL ACTION MENU BOTTOM SHEET */}
      <Modal
        visible={optionsMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setOptionsMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.actionModalOverlay}
          activeOpacity={1}
          onPress={() => setOptionsMenuVisible(false)}
        >
          <View style={styles.actionMenuCard}>
            <View style={styles.actionMenuHeader}>
              <Text style={styles.actionMenuTitle}>Profile Settings</Text>
              <TouchableOpacity
                onPress={() => setOptionsMenuVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>


            {/* Edit Profile Option */}
            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={() => {
                setOptionsMenuVisible(false);
                setIsEditing(true);
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.actionMenuIconWrap, { backgroundColor: '#F0F9FF' }]}>
                <Ionicons name="create-outline" size={18} color="#0284C7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionMenuLabel}>Edit Profile</Text>
                <Text style={styles.actionMenuSub}>Photo, role, batting & bowling style, city</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>

            {/* Refresh Stats Option */}
            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={() => {
                setOptionsMenuVisible(false);
                handleRefresh();
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.actionMenuIconWrap, { backgroundColor: '#F8FAFC' }]}>
                <Ionicons name="refresh-outline" size={18} color="#475569" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionMenuLabel}>Refresh Stats</Text>
                <Text style={styles.actionMenuSub}>Sync career matches, runs & wickets</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>

            {/* Sign Out Option */}
            <TouchableOpacity
              style={[styles.actionMenuItem, { borderBottomWidth: 0 }]}
              onPress={() => {
                setOptionsMenuVisible(false);
                handleSignOut();
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.actionMenuIconWrap, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="log-out-outline" size={18} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionMenuLabel, { color: '#EF4444' }]}>Sign Out</Text>
                <Text style={styles.actionMenuSub}>Log out of your cricketer account</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#FECACA" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* JOIN MATCH VIA CODE MODAL */}
      <Modal
        visible={joinModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setJoinModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setJoinModalVisible(false)}
          style={{ flex: 1, backgroundColor: 'rgba(7, 27, 44, 0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 }}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={{ width: '100%', maxWidth: 360, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 20, gap: 14, borderWidth: 1, borderColor: '#E2E8F0' }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="key" size={20} color="#0284C7" />
                <Text style={{ fontSize: 16, color: '#0F172A', fontFamily: systemFontBold }}>Enter Match Code</Text>
              </View>
              <TouchableOpacity onPress={() => setJoinModalVisible(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, color: '#64748B', fontFamily: systemFontMedium }}>
              Enter the 6-character match code shared by the match creator to score or view live.
            </Text>

            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#F8FAFC',
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: '#CBD5E1',
              paddingHorizontal: 14,
              height: 48,
              gap: 10
            }}>
              <Ionicons name="barcode-outline" size={20} color="#0284C7" />
              <TextInput
                style={{
                  flex: 1,
                  fontSize: 15,
                  fontFamily: systemFontBold,
                  color: '#0F172A',
                  paddingVertical: 0
                }}
                placeholder="e.g. CF-8421"
                placeholderTextColor="#94A3B8"
                value={inputMatchCode}
                onChangeText={setInputMatchCode}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              {Boolean(inputMatchCode) && (
                <TouchableOpacity onPress={() => setInputMatchCode('')} style={{ padding: 4 }}>
                  <Ionicons name="close-circle" size={16} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              onPress={async () => {
                if (!inputMatchCode.trim()) {
                  showToast('Please enter a match code', 'error');
                  return;
                }
                if (onJoinMatchByCode) {
                  const success = await onJoinMatchByCode(inputMatchCode.trim());
                  if (success) {
                    setJoinModalVisible(false);
                    setInputMatchCode('');
                    showToast(`Scoring connected for match!`, 'success');
                  } else {
                    showToast(`No live match found for "${inputMatchCode.trim()}"`, 'error');
                  }
                } else {
                  setJoinModalVisible(false);
                  showToast(`Searching match ${inputMatchCode.trim()}...`, 'success');
                }
              }}
              style={{ backgroundColor: '#0284C7', borderRadius: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontFamily: systemFontBold }}>Join Match</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* SHARE SCORER ACCESS MODAL */}
      <Modal
        visible={shareModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setShareModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShareModalVisible(false)}
          style={{ flex: 1, backgroundColor: 'rgba(7, 27, 44, 0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 }}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={{ width: '100%', maxWidth: 360, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 20, gap: 14, borderWidth: 1, borderColor: '#E2E8F0' }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="share-social" size={20} color="#0284C7" />
                <Text style={{ fontSize: 16, color: '#0F172A', fontFamily: systemFontBold }}>Share Scoring Access</Text>
              </View>
              <TouchableOpacity onPress={() => setShareModalVisible(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {activeMatch && (activeMatch.phase === 'playing' || activeMatch.phase === 'inningBreak') ? (
              <>
                <Text style={{ fontSize: 12, color: '#64748B', fontFamily: systemFontMedium }}>
                  Share this access code with your co-scorer or umpire on the ground for <Text style={{ color: '#0F172A', fontFamily: systemFontBold }}>{activeMatch.matchTitle || 'Live Match'}</Text>.
                </Text>

                <View style={{ backgroundColor: '#F0F9FF', padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#BAE6FD' }}>
                  <Text style={{ fontSize: 24, letterSpacing: 4, color: '#0284C7', fontFamily: systemFontBold }}>
                    {activeMatch.matchCode || activeMatch.scorerPin || ('CF-' + (activeMatch.id || '8421').slice(-4).toUpperCase())}
                  </Text>
                  <Text style={{ fontSize: 10, color: '#0369A1', marginTop: 4, fontFamily: systemFontMedium }}>Valid for current active match</Text>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    setShareModalVisible(false);
                    const code = activeMatch.matchCode || activeMatch.scorerPin || ('CF-' + (activeMatch.id || '8421').slice(-4).toUpperCase());
                    showToast(`Scorer code ${code} copied!`, 'success');
                  }}
                  style={{ backgroundColor: '#0284C7', borderRadius: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 13, fontFamily: systemFontBold }}>Copy Access Code</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={{ gap: 12, alignItems: 'center', paddingVertical: 8 }}>
                <MaterialCommunityIcons name="cricket" size={32} color="#94A3B8" />
                <Text style={{ fontSize: 13, color: '#0F172A', fontFamily: systemFontBold, textAlign: 'center' }}>
                  No Active Match Currently
                </Text>
                <Text style={{ fontSize: 11, color: '#64748B', fontFamily: systemFont, textAlign: 'center' }}>
                  Start a quick match first. While the match is live, you can share its unique code from here anytime!
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShareModalVisible(false);
                    if (onStartQuickMatch) onStartQuickMatch();
                  }}
                  style={{ backgroundColor: '#0284C7', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16, marginTop: 4 }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 12, fontFamily: systemFontBold }}>Start New Match</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* PHOTO SOURCE SELECTION MODAL (CAMERA vs GALLERY) */}
      <Modal
        visible={photoSourcePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPhotoSourcePickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.actionModalOverlay}
          activeOpacity={1}
          onPress={() => setPhotoSourcePickerVisible(false)}
        >
          <View style={styles.actionMenuCard}>
            <View style={styles.actionMenuHeader}>
              <Text style={styles.actionMenuTitle}>Select Profile Photo</Text>
              <TouchableOpacity
                onPress={() => setPhotoSourcePickerVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Camera Option */}
            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={handlePickFromCamera}
              activeOpacity={0.7}
            >
              <View style={[styles.actionMenuIconWrap, { backgroundColor: '#F0F9FF' }]}>
                <Ionicons name="camera" size={20} color="#0284C7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionMenuLabel}>Take Photo</Text>
                <Text style={styles.actionMenuSub}>Use your phone camera to click a new picture</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>

            {/* Gallery Option */}
            <TouchableOpacity
              style={[styles.actionMenuItem, { borderBottomWidth: 0 }]}
              onPress={handlePickFromGallery}
              activeOpacity={0.7}
            >
              <View style={[styles.actionMenuIconWrap, { backgroundColor: '#F8FAFC' }]}>
                <Ionicons name="images" size={20} color="#0284C7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionMenuLabel}>Choose from Gallery</Text>
                <Text style={styles.actionMenuSub}>Select an existing photo from device albums</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modern CricFlow Floating Toast */}
      <CricToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={() => setToast(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC'
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
  authBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14
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
  inputGroup: {
    width: '100%',
    marginBottom: 12
  },
  inputLabel: {
    fontSize: 11,
    fontFamily: systemFontBold,
    color: '#475569',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.3
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    fontFamily: systemFontMedium
  },
  googleBtn: {
    width: '100%',
    backgroundColor: '#0284C7',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 6
  },
  googleBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
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

  // ── Profile Main Screen Styles ──
  profileContent: {
    padding: 14,
    paddingBottom: 40,
    gap: 14
  },
  profileHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  profileAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14
  },
  avatarWrapper: {
    position: 'relative'
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0284C7',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF'
  },
  playerNameText: {
    fontSize: 17,
    fontFamily: systemFontBold,
    color: '#0F172A'
  },
  jerseyBadge: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  jerseyBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: systemFontMedium
  },
  threeDotsBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  playerRoleText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: systemFontMedium,
    marginTop: 2
  },
  styleBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap'
  },
  styleBadgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BAE6FD'
  },
  bowlingBadgeItem: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0'
  },
  styleBadgeText: {
    fontSize: 11,
    fontFamily: systemFontMedium,
    color: '#0284C7'
  },

  // 3-Dots Action Menu Bottom Sheet Styles
  actionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 27, 44, 0.65)',
    justifyContent: 'flex-end'
  },
  actionMenuCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 36,
    gap: 4
  },
  actionMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 6
  },
  actionMenuTitle: {
    fontSize: 16,
    fontFamily: systemFontBold,
    color: '#0F172A'
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC'
  },
  actionMenuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionMenuLabel: {
    fontSize: 14,
    fontFamily: systemFontBold,
    color: '#1E293B'
  },
  actionMenuSub: {
    fontSize: 11,
    fontFamily: systemFont,
    color: '#64748B',
    marginTop: 1
  },

  sectionHeader: {
    fontSize: 11,
    fontFamily: systemFontBold,
    color: '#64748B',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 4
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 8
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    position: 'relative'
  },
  summaryVal: {
    fontSize: 18,
    fontFamily: systemFontBold,
    color: '#0F172A'
  },
  summaryLbl: {
    fontSize: 10,
    fontFamily: systemFontMedium,
    color: '#64748B',
    marginTop: 2
  },

  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    position: 'relative'
  },
  statsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8
  },
  statsCardTitle: {
    fontSize: 13,
    fontFamily: systemFontBold,
    color: '#0F172A'
  },
  statRowGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 10
  },
  statCol: {
    width: '33.33%',
    alignItems: 'center'
  },
  statColVal: {
    fontSize: 15,
    fontFamily: systemFontBold,
    color: '#0F172A'
  },
  statColLbl: {
    fontSize: 10,
    fontFamily: systemFontMedium,
    color: '#64748B',
    marginTop: 2
  },

  emptyMatchesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6
  },
  emptyTitle: {
    fontSize: 13,
    fontFamily: systemFontBold,
    color: '#0F172A',
    marginTop: 4
  },
  emptySub: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: systemFont,
    textAlign: 'center',
    lineHeight: 16
  },
  matchHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8
  },
  matchTitle: {
    fontSize: 13,
    fontFamily: systemFontBold,
    color: '#0F172A'
  },
  matchDate: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: systemFont,
    marginTop: 2
  },
  matchResultText: {
    fontSize: 11,
    fontFamily: systemFontBold,
    color: '#059669',
    marginTop: 4
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%'
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 10
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: systemFontBold,
    color: '#0F172A'
  },
  pillSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4
  },
  roleSelectPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  roleSelectPillActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7'
  },
  roleSelectPillText: {
    fontSize: 11,
    fontFamily: systemFontMedium,
    color: '#475569'
  },
  roleSelectPillTextActive: {
    color: '#FFFFFF',
    fontFamily: systemFontBold
  },
  saveBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 20
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: systemFontBold
  }
});

export default MyProfileScreen;
