import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  themeColors,
  systemFont,
  systemFontMedium,
  systemFontBold
} from '../../theme.js';
import { sendPhoneOtp, verifyPhoneOtp } from '../../services/authService.js';
import { showToast } from '../../services/toastService.js';

export function PhoneLoginModal({
  visible = false,
  onClose,
  onSuccess,
  title = 'Sign In to CricFlow',
  subtitle = 'Login or create your player profile to host tournaments, manage teams & sync stats.'
}) {
  const [step, setStep] = useState(1); // 1: Phone input, 2: OTP input
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resendTimer, setResendTimer] = useState(30);

  const otpInputRef = useRef(null);

  // Reset modal state when closed or opened
  useEffect(() => {
    if (visible) {
      setStep(1);
      setPhoneNumber('');
      setOtpCode('');
      setErrorMessage('');
      setLoading(false);
      setResendTimer(30);
    }
  }, [visible]);

  // Resend countdown timer
  useEffect(() => {
    let timer;
    if (step === 2 && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, resendTimer]);

  const handleSendOtp = async () => {
    const clean = phoneNumber.replace(/\D/g, '').slice(-10);
    if (!clean || clean.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number');
      return;
    }

    setErrorMessage('');
    setLoading(true);
    try {
      await sendPhoneOtp(clean);
      setStep(2);
      setResendTimer(30);
      showToast(`OTP sent to +91 ${clean}`, 'info');
      setTimeout(() => {
        if (otpInputRef.current) {
          otpInputRef.current.focus();
        }
      }, 300);
    } catch (err) {
      setErrorMessage(err?.message || 'Could not send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const cleanOtp = otpCode.trim();
    if (!cleanOtp || cleanOtp.length < 4) {
      setErrorMessage('Please enter the 6-digit OTP');
      return;
    }

    setErrorMessage('');
    setLoading(true);
    try {
      const result = await verifyPhoneOtp(phoneNumber, cleanOtp);
      showToast('Login successful!', 'success');
      if (onSuccess) {
        onSuccess(result);
      }
      if (onClose) {
        onClose();
      }
    } catch (err) {
      setErrorMessage(err?.message || 'Invalid OTP. Please enter 998322');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || loading) return;
    setErrorMessage('');
    setLoading(true);
    try {
      await sendPhoneOtp(phoneNumber);
      setResendTimer(30);
      showToast('New OTP sent successfully', 'info');
    } catch (err) {
      setErrorMessage(err?.message || 'Could not resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.modalContainer}>
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.brandIconWrap}>
              <MaterialCommunityIcons name="cricket" size={24} color="#18181B" />
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={20} color={themeColors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Title & Description */}
          <Text style={styles.titleText}>{title}</Text>
          <Text style={styles.subtitleText}>{subtitle}</Text>

          {/* Error Banner */}
          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color="#DC2626" />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          ) : null}

          {step === 1 ? (
            /* ── STEP 1: PHONE NUMBER INPUT ── */
            <View style={styles.formWrap}>
              <Text style={styles.inputLabel}>Mobile Number</Text>
              <View style={styles.phoneInputRow}>
                <View style={styles.countryCodeBadge}>
                  <Text style={styles.countryCodeText}>+91</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="Enter 10-digit number"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phoneNumber}
                  onChangeText={text => {
                    setPhoneNumber(text);
                    if (errorMessage) setErrorMessage('');
                  }}
                  autoFocus
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  (phoneNumber.length < 10 || loading) && styles.primaryBtnDisabled
                ]}
                onPress={handleSendOtp}
                disabled={phoneNumber.length < 10 || loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.primaryBtnText}>GET OTP</Text>
                    <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>

              <Text style={styles.termsNotice}>
                By continuing, you agree to CricFlow Terms & Privacy Policy.
              </Text>
            </View>
          ) : (
            /* ── STEP 2: OTP VERIFICATION INPUT ── */
            <View style={styles.formWrap}>
              <View style={styles.phoneInfoRow}>
                <Text style={styles.phoneInfoText}>
                  Code sent to <Text style={styles.phoneInfoHighlight}>+91 {phoneNumber.slice(-10)}</Text>
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setStep(1);
                    setOtpCode('');
                    setErrorMessage('');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.editPhoneBtn}>Edit</Text>
                </TouchableOpacity>
              </View>

              {/* Fixed OTP Demo Hint Badge */}
              <View style={styles.demoOtpBadge}>
                <Ionicons name="key-outline" size={14} color="#0284C7" />
                <Text style={styles.demoOtpBadgeText}>
                  Test OTP: <Text style={styles.demoOtpHighlight}>998322</Text>
                </Text>
              </View>

              <Text style={styles.inputLabel}>Enter 6-Digit OTP</Text>
              <TextInput
                ref={otpInputRef}
                style={styles.otpInput}
                placeholder="998322"
                placeholderTextColor="#CBD5E1"
                keyboardType="number-pad"
                maxLength={6}
                value={otpCode}
                onChangeText={text => {
                  setOtpCode(text);
                  if (errorMessage) setErrorMessage('');
                }}
              />

              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  (otpCode.length < 4 || loading) && styles.primaryBtnDisabled
                ]}
                onPress={handleVerifyOtp}
                disabled={otpCode.length < 4 || loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.primaryBtnText}>VERIFY & CONTINUE</Text>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.resendRow}>
                {resendTimer > 0 ? (
                  <Text style={styles.resendTimerText}>
                    Resend code in {resendTimer}s
                  </Text>
                ) : (
                  <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
                    <Text style={styles.resendActionText}>Resend OTP</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject
  },
  modalContainer: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  brandIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  titleText: {
    fontFamily: systemFontMedium,
    fontSize: 20,
    color: '#0F172A',
    marginBottom: 6
  },
  subtitleText: {
    fontFamily: systemFont,
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 18
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 0,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
    gap: 8
  },
  errorBannerText: {
    flex: 1,
    fontFamily: systemFont,
    fontSize: 12,
    color: '#DC2626'
  },
  formWrap: {
    width: '100%'
  },
  inputLabel: {
    fontFamily: systemFontMedium,
    fontSize: 12,
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
    marginBottom: 16
  },
  countryCodeBadge: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#F1F5F9',
    borderRightWidth: 0
  },
  countryCodeText: {
    fontFamily: systemFontMedium,
    fontSize: 15,
    color: '#0F172A'
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: systemFontMedium,
    fontSize: 16,
    color: '#0F172A',
    letterSpacing: 1.2
  },
  phoneInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  phoneInfoText: {
    fontFamily: systemFont,
    fontSize: 13,
    color: '#64748B'
  },
  phoneInfoHighlight: {
    fontFamily: systemFontMedium,
    color: '#0F172A'
  },
  editPhoneBtn: {
    fontFamily: systemFontMedium,
    fontSize: 13,
    color: '#2563EB'
  },
  demoOtpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 14,
    gap: 6,
    alignSelf: 'flex-start'
  },
  demoOtpBadgeText: {
    fontFamily: systemFont,
    fontSize: 12,
    color: '#0369A1'
  },
  demoOtpHighlight: {
    fontFamily: systemFontBold,
    color: '#0284C7'
  },
  otpInput: {
    borderWidth: 0,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontFamily: systemFontBold,
    fontSize: 22,
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 18
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#18181B',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8
  },
  primaryBtnDisabled: {
    opacity: 0.5
  },
  primaryBtnText: {
    fontFamily: systemFontBold,
    fontSize: 13,
    color: '#FFFFFF',
    letterSpacing: 0.8
  },
  termsNotice: {
    fontFamily: systemFont,
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 15
  },
  resendRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14
  },
  resendTimerText: {
    fontFamily: systemFont,
    fontSize: 12,
    color: '#94A3B8'
  },
  resendActionText: {
    fontFamily: systemFontMedium,
    fontSize: 13,
    color: '#2563EB'
  }
});
