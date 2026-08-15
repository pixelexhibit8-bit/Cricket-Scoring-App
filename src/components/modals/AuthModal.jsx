import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  TouchableWithoutFeedback,
  Linking
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  systemFont,
  systemFontMedium,
  systemFontBold,
  fontWeights
} from '../../theme.js';
import {
  sendPhoneOtp,
  verifyPhoneOtp,
  signInWithGoogleOAuth,
  signInWithGoogleMock,
  getPlayerProfile,
  savePlayerProfile
} from '../../services/authService.js';
import { supabase } from '../../services/supabaseClient.js';
import { ScalePressable } from '../motion/MotionSystem.jsx';

export function AuthModal({
  visible,
  onClose,
  onSuccessLogin,
  title = 'Welcome to CricScorer',
  subtitle = 'Sign in to track your lifetime runs, wickets & career match records.'
}) {
  const [authPhone, setAuthPhone] = useState('');
  const [authOtp, setAuthOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (visible) {
      setAuthPhone('');
      setAuthOtp('');
      setOtpSent(false);
      setLoading(false);
      setResendTimer(0);
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [visible]);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSendOtp = async () => {
    const clean = authPhone.trim().replace(/\D/g, '');
    if (!clean || clean.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await sendPhoneOtp(clean);
      setOtpSent(true);
      setResendTimer(30);
      setAuthOtp('');
      setSuccessMessage(`OTP sent to +91 ${clean.slice(-10)}`);
    } catch (e) {
      setErrorMessage(e?.message || 'Could not send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!authOtp || authOtp.trim().length < 4) {
      setErrorMessage('Please enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    try {
      const cleanPhone = authPhone.trim().replace(/\D/g, '');
      const result = await verifyPhoneOtp(cleanPhone, authOtp.trim());
      if (typeof onSuccessLogin === 'function') {
        onSuccessLogin(result.user, result.profile);
      }
      onClose();
    } catch (e) {
      setErrorMessage(e?.message || 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      try {
        const oAuthData = await signInWithGoogleOAuth();
        if (oAuthData?.url) {
          await Linking.openURL(oAuthData.url);
          setLoading(false);
          return;
        }
      } catch (oauthErr) {
        console.warn('OAuth launch error:', oauthErr);
      }

      // Fallback for simulation/preview
      const fallbackUser = {
        id: `google_${Date.now()}`,
        name: 'Cricket Player',
        email: 'cricket.player@gmail.com',
        provider: 'google',
        signedInAt: new Date().toISOString()
      };
      let p = await getPlayerProfile(fallbackUser.id);
      if (!p) {
        p = await savePlayerProfile({
          name: fallbackUser.name,
          auth_user_id: fallbackUser.id,
          phone: '',
          isProfileComplete: false
        });
      }
      if (typeof onSuccessLogin === 'function') {
        onSuccessLogin(fallbackUser, p);
      }
      onClose();
    } catch (err) {
      setErrorMessage(err?.message || 'Google sign-in could not be completed.');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardContainer}
          >
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.card}>
                {/* Close Button */}
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeBtn}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="close" size={20} color="#64748B" />
                </TouchableOpacity>

                {/* Cric Scorer Logo */}
                <Image
                  source={require('../../../assets/logo.png')}
                  style={styles.logo}
                />

                {/* Title & Subtitle */}
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>

                {/* Error Banner */}
                {errorMessage ? (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={16} color="#DC2626" />
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                ) : null}

                {/* Success Banner */}
                {successMessage ? (
                  <View style={styles.successBox}>
                    <Ionicons name="checkmark-circle" size={16} color="#059669" />
                    <Text style={styles.successText}>{successMessage}</Text>
                  </View>
                ) : null}

                {!otpSent ? (
                  <>
                    {/* Phone Input Box */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>MOBILE PHONE NUMBER</Text>
                      <View style={styles.phoneInputRow}>
                        <View style={styles.flagBox}>
                          <Text style={styles.flagText}>🇮🇳 +91</Text>
                        </View>
                        <TextInput
                          style={styles.textInput}
                          placeholder="Enter 10-digit number"
                          value={authPhone}
                          onChangeText={(t) => {
                            setAuthPhone(t);
                            if (errorMessage) setErrorMessage('');
                          }}
                          keyboardType="phone-pad"
                          placeholderTextColor="#94A3B8"
                          maxLength={10}
                        />
                      </View>
                    </View>

                    {/* Get OTP Button */}
                    <ScalePressable
                      style={styles.primaryBtn}
                      onPress={handleSendOtp}
                      disabled={loading}
                      activeScale={0.98}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="chatbubble-ellipses-outline" size={18} color="#FFFFFF" />
                          <Text style={styles.primaryBtnText}>Get OTP / Continue</Text>
                        </>
                      )}
                    </ScalePressable>

                    {/* OR Divider */}
                    <View style={styles.dividerRow}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerText}>OR</Text>
                      <View style={styles.dividerLine} />
                    </View>

                    {/* Google Login Button */}
                    <ScalePressable
                      style={styles.googleBtn}
                      onPress={handleGoogleSignIn}
                      disabled={loading}
                      activeScale={0.98}
                    >
                      <MaterialCommunityIcons name="google" size={18} color="#4285F4" />
                      <Text style={styles.googleBtnText}>Sign In with Google</Text>
                    </ScalePressable>
                  </>
                ) : (
                  <>
                    {/* OTP Input Form */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>ENTER VERIFICATION CODE</Text>
                      <TextInput
                        style={styles.otpInput}
                        placeholder="• • • • • •"
                        value={authOtp}
                        onChangeText={(t) => {
                          setAuthOtp(t);
                          if (errorMessage) setErrorMessage('');
                        }}
                        keyboardType="number-pad"
                        placeholderTextColor="#94A3B8"
                        maxLength={6}
                        autoFocus
                      />
                    </View>

                    {/* Verify Button */}
                    <ScalePressable
                      style={styles.primaryBtn}
                      onPress={handleVerifyOtp}
                      disabled={loading}
                      activeScale={0.98}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                          <Text style={styles.primaryBtnText}>Verify & Continue</Text>
                        </>
                      )}
                    </ScalePressable>

                    <View style={styles.otpFooter}>
                      <TouchableOpacity
                        onPress={() => {
                          setOtpSent(false);
                          setErrorMessage('');
                        }}
                        style={{ paddingVertical: 6 }}
                      >
                        <Text style={styles.linkText}>← Change Number</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        disabled={resendTimer > 0}
                        onPress={handleSendOtp}
                        style={{ paddingVertical: 6 }}
                      >
                        <Text
                          style={[
                            styles.linkText,
                            resendTimer > 0 && { color: '#94A3B8' }
                          ]}
                        >
                          {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                {/* Footer Note */}
                <Text style={styles.footerNote}>
                  Your profile details and stats will be linked automatically across all ground matches.
                </Text>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20
  },
  keyboardContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center'
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 12
  },
  title: {
    fontSize: 19,
    color: '#0F172A',
    fontFamily: systemFontMedium,
    textAlign: 'center',
    marginBottom: 6
  },
  subtitle: {
    fontSize: 12.5,
    color: '#64748B',
    fontFamily: systemFont,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 10
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    width: '100%',
    marginBottom: 12
  },
  errorText: {
    flex: 1,
    color: '#DC2626',
    fontSize: 12,
    fontFamily: systemFont
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    width: '100%',
    marginBottom: 12
  },
  successText: {
    flex: 1,
    color: '#059669',
    fontSize: 12,
    fontFamily: systemFont
  },
  inputGroup: {
    width: '100%',
    marginBottom: 14
  },
  inputLabel: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: systemFontMedium,
    marginBottom: 6,
    letterSpacing: 0.5
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%'
  },
  flagBox: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  flagText: {
    color: '#0F172A',
    fontSize: 13,
    fontFamily: systemFontMedium
  },
  textInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    fontFamily: systemFont
  },
  otpInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#0284C7',
    borderRadius: 12,
    paddingVertical: 12,
    fontSize: 20,
    letterSpacing: 8,
    color: '#0F172A',
    fontFamily: systemFontMedium,
    textAlign: 'center'
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: '#0284C7',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontFamily: systemFontMedium
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
    width: '100%',
    gap: 10
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0'
  },
  dividerText: {
    color: '#94A3B8',
    fontSize: 11,
    fontFamily: systemFontMedium
  },
  googleBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  googleBtnText: {
    color: '#1E293B',
    fontSize: 14,
    fontFamily: systemFontMedium
  },
  otpFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 10
  },
  linkText: {
    color: '#0284C7',
    fontSize: 12,
    fontFamily: systemFontMedium
  },
  footerNote: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontFamily: systemFont,
    textAlign: 'center',
    lineHeight: 15,
    marginTop: 14,
    paddingHorizontal: 8
  }
});
