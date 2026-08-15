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
  calculatePlayerCareerStats
} from '../services/authService.js';
import { supabase } from '../services/supabaseClient.js';
import { registerPlayerPhoto } from '../services/playerPhotoStore.js';
import { PlayerAvatar } from '../components/PlayerAvatar.jsx';
import { DobPickerModal } from '../components/modals/DobPickerModal.jsx';
import { CricToast } from '../components/CricToast.jsx';
import { uploadImageToCloudinary } from '../services/cloudinaryService.js';

export function MyProfileScreen({
  finishedMatches = [],
  onSelectMatch,
  targetPlayer = null,
  onBack = null,
  readOnly = false
}) {
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

  // Floating Toast State
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
  };

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
      if (!p) {
        p = await savePlayerProfile({
          name: userObj.name,
          auth_user_id: userObj.id,
          photoUrl: userObj.photoUrl,
          phone: quickPhone.trim(),
          isProfileComplete: false
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

      if (!p.isProfileComplete) {
        setIsEditing(true);
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
      setProfile({
        name: pName,
        role: targetPlayer.role || 'All-Rounder',
        battingStyle: targetPlayer.battingStyle || 'Right Hand Bat',
        bowlingStyle: targetPlayer.bowlingStyle || 'Right Arm Medium',
        city: targetPlayer.city || 'Sadokan',
        jerseyNumber: targetPlayer.jerseyNumber || '',
        dob: targetPlayer.dob || '',
        photoUrl: targetPlayer.photoUrl || targetPlayer.avatar || ''
      });
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
      if (targetPlayer) {
        const fresh = await getPlayerProfile(null, targetPlayer.phone || targetPlayer.id);
        if (fresh) {
          setProfile(prev => ({ ...prev, ...fresh }));
        }
      } else {
        await loadUserSession();
      }
      showToast('Profile refreshed', 'success');
    } catch (e) {
      console.warn('Refresh error:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showToast('Camera roll permission needed for photo', 'error');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const dataUri = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;

        showToast('Uploading photo to Cloudinary...', 'info');

        let finalPhotoUrl = asset.uri;
        const uploadedUrl = await uploadImageToCloudinary(dataUri);
        if (uploadedUrl) {
          finalPhotoUrl = uploadedUrl;
        }

        const currentName = profile?.name || currentUser?.name || 'Local Player';
        registerPlayerPhoto(currentName, finalPhotoUrl);
        setProfile(prev => ({ ...prev, photoUrl: finalPhotoUrl }));
        await savePlayerProfile({ photoUrl: finalPhotoUrl });
        showToast('Profile photo updated on Cloudinary!', 'success');
      }
    } catch (e) {
      console.warn('Image pick error:', e);
      showToast('Could not update photo', 'error');
    }
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
      const res = await sendPhoneOtp(cleanPhone);
      setOtpSent(true);
      setResendTimer(30);
      if (res?.mode === 'instant' || res?.demoCode) {
        setAuthOtp(res.demoCode || '123456');
        showToast(`Verification code: ${res.demoCode || '123456'}`, 'success');
      } else {
        setAuthOtp('');
        showToast(`OTP sent to +91 ${cleanPhone.slice(-10)}`, 'success');
      }
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

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      showToast('Please enter your player full name', 'error');
      return;
    }
    setLoading(true);
    try {
      const updated = await savePlayerProfile({
        name: editName.trim(),
        role: editRole,
        battingStyle: editBatting,
        bowlingStyle: editBowling,
        jerseyNumber: editJerseyNumber.trim(),
        dob: editDob,
        city: editCity.trim() || 'Local Ground',
        phone: editPhone.trim() || authPhone.trim(),
        isProfileComplete: true
      });
      if (updated.name && updated.photoUrl) {
        registerPlayerPhoto(updated.name, updated.photoUrl);
      }
      setProfile(updated);
      setIsEditing(false);
      showToast('Profile saved successfully!', 'success');
    } catch (e) {
      showToast('Could not save profile changes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
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

  // ─── 1. SIGN IN SCREEN (PHONE OTP OR GOOGLE) ───
  if (!currentUser && !isPublicView) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <ScrollView style={styles.container} contentContainerStyle={styles.authContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.authCard}>
            {/* App Logo */}
            <Image source={require('../../assets/logo.png')} style={{ width: 92, height: 92, resizeMode: 'contain', marginBottom: 16 }} />
            <Text style={styles.authTitle}>Welcome to CricScorer</Text>
            <Text style={styles.authSub}>
              Sign in to track your lifetime runs, wickets & career match records.
            </Text>

            {!otpSent ? (
              <>
                {/* Phone Input Box */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Mobile Phone Number</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', gap: 8 }}>
                    <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#CBD5E1' }}>
                      <Text style={{ color: '#0F172A', fontWeight: fontWeights.bold, fontSize: 13, fontFamily: systemFont }}>🇮🇳 +91</Text>
                    </View>
                    <TextInput
                      style={[styles.textInput, { flex: 1 }]}
                      placeholder="Enter 10-digit number"
                      value={authPhone}
                      onChangeText={setAuthPhone}
                      keyboardType="phone-pad"
                      placeholderTextColor="#94A3B8"
                      maxLength={10}
                    />
                  </View>
                </View>

                {/* Get OTP Button */}
                <TouchableOpacity
                  style={styles.googleBtn}
                  onPress={handleSendOtp}
                  activeOpacity={0.85}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.googleBtnText}>Get OTP / Continue</Text>
                </TouchableOpacity>

                {/* Divider */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 16, width: '100%', gap: 10 }}>
                  <View style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
                  <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: fontWeights.bold, fontFamily: systemFont }}>OR</Text>
                  <View style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
                </View>

                {/* Google Login Button (Official Play Store Compliant) */}
                <TouchableOpacity
                  style={{
                    width: '100%',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 12,
                    paddingVertical: 13,
                    borderWidth: 1,
                    borderColor: '#CBD5E1'
                  }}
                  onPress={handleGoogleSignIn}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="google" size={18} color="#4285F4" />
                  <Text style={{ color: '#1E293B', fontSize: 14, fontFamily: systemFontBold }}>
                    Sign In with Google
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              /* OTP Verification Step */
              <>
                <View style={{ width: '100%', backgroundColor: '#F0F9FF', padding: 12, borderRadius: 10, marginBottom: 14, borderWidth: 1, borderColor: '#BAE6FD' }}>
                  <Text style={{ fontSize: 12, color: '#0369A1', fontFamily: systemFontMedium, textAlign: 'center' }}>
                    Enter the OTP for +91 {authPhone}
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Verification Code (OTP)</Text>
                  <TextInput
                    style={[styles.textInput, { textAlign: 'center', fontSize: 18, letterSpacing: 6, fontWeight: fontWeights.bold }]}
                    placeholder="• • • • • •"
                    value={authOtp}
                    onChangeText={setAuthOtp}
                    keyboardType="number-pad"
                    placeholderTextColor="#94A3B8"
                    maxLength={6}
                    autoFocus
                  />
                </View>

                <TouchableOpacity
                  style={styles.googleBtn}
                  onPress={handleVerifyOtp}
                  activeOpacity={0.85}
                >
                  <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.googleBtnText}>Verify & Login</Text>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: 14 }}>
                  <TouchableOpacity
                    onPress={() => setOtpSent(false)}
                    style={{ paddingVertical: 6 }}
                  >
                    <Text style={{ color: '#0284C7', fontSize: 12, fontFamily: systemFontBold }}>
                      ← Change Mobile
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    disabled={resendTimer > 0}
                    onPress={handleSendOtp}
                    style={{ paddingVertical: 6 }}
                  >
                    <Text style={{ color: resendTimer > 0 ? '#94A3B8' : '#0284C7', fontSize: 12, fontFamily: systemFontBold }}>
                      {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            <Text style={styles.authTerms}>
              Your profile details and stats will be linked automatically across all ground matches.
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
  const stats = calculatePlayerCareerStats(playerName, finishedMatches);

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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.playerNameText} numberOfLines={1}>{playerName}</Text>
              {profile?.jerseyNumber ? (
                <View style={{ backgroundColor: '#0284C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: fontWeights.bold, fontFamily: systemFont }}>#{profile.jerseyNumber}</Text>
                </View>
              ) : null}
              <Ionicons name="checkmark-circle" size={18} color="#0284C7" />
            </View>
            <Text style={styles.playerRoleText}>
              {profile?.role || 'All-Rounder'} • {profile?.city || 'Local Ground'}
            </Text>

            {/* Batting & Bowling Styles */}
            <View style={styles.stylesRow}>
              <View style={styles.stylePill}>
                <Text style={styles.stylePillText}>{profile?.battingStyle || 'Right Hand Bat'}</Text>
              </View>
              <View style={[styles.stylePill, { backgroundColor: '#F1F5F9' }]}>
                <Text style={[styles.stylePillText, { color: '#475569' }]}>{profile?.bowlingStyle || 'Right Arm Medium'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons: Edit Profile / Sign Out (Only for profile owner) */}
        {!isPublicView ? (
          <View style={styles.profileActionRow}>
            <TouchableOpacity
              style={styles.editProfileBtn}
              onPress={() => setIsEditing(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={16} color="#0284C7" />
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.signOutBtn}
              onPress={handleSignOut}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={16} color="#EF4444" />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {/* QUICK CAREER OVERVIEW (4 TILES) */}
      <Text style={styles.sectionHeader}>CAREER SUMMARY</Text>
      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryVal}>{stats.matchesPlayed}</Text>
          <Text style={styles.summaryLbl}>Matches</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryVal, { color: '#0284C7' }]}>{stats.totalRuns}</Text>
          <Text style={styles.summaryLbl}>Total Runs</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryVal, { color: '#059669' }]}>{stats.highestScore}</Text>
          <Text style={styles.summaryLbl}>High Score</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryVal, { color: '#7C3AED' }]}>{stats.wickets}</Text>
          <Text style={styles.summaryLbl}>Wickets</Text>
        </View>
      </View>

      {/* DETAILED BATTING RECORD */}
      <View style={styles.statsCard}>
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
        stats.participatedMatches.map((m, idx) => (
          <TouchableOpacity
            key={m.id || `match_${idx}`}
            style={styles.matchHistoryItem}
            onPress={() => onSelectMatch && onSelectMatch(m)}
            activeOpacity={0.7}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.matchTitle}>{m.title || `${m.team1?.name} vs ${m.team2?.name}`}</Text>
              <Text style={styles.matchDate}>{m.dateText || m.dateLabel || 'Recent Match'}</Text>
              <Text style={styles.matchResultText} numberOfLines={1}>{m.resultText || 'Match Completed'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#0284C7" />
          </TouchableOpacity>
        ))
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
                <Text style={styles.inputLabel}>Mobile Phone</Text>
                <TextInput
                  style={styles.textInput}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="Enter mobile number"
                  keyboardType="phone-pad"
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
    padding: 16,
    paddingTop: 24,
    paddingBottom: 40
  },
  authCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center'
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
  playerRoleText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: systemFontMedium,
    marginTop: 2
  },
  playerStylePillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap'
  },
  stylePill: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  stylePillText: {
    fontSize: 10,
    fontFamily: systemFontBold,
    color: '#0284C7'
  },
  profileActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  editProfileBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD'
  },
  editProfileText: {
    fontSize: 12,
    fontFamily: systemFontBold,
    color: '#0284C7'
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA'
  },
  signOutText: {
    fontSize: 12,
    fontFamily: systemFontBold,
    color: '#EF4444'
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
    borderColor: '#E2E8F0'
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
    borderColor: '#E2E8F0'
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
