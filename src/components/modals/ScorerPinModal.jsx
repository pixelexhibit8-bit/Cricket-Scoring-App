import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { systemFont, systemFontMedium, systemFontBold, shadows } from '../../theme.js';
import { fetchMatchesByPinFromSupabase } from '../../services/matchService.js';
import { AppButton } from '../common/AppButton.jsx';

export function ScorerPinModal({ visible, activeMatch, onClose, onSuccessContinueMatch, onSuccessRemoteMatch, onSelectStartNewMatch }) {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [matchedMatches, setMatchedMatches] = useState([]);
  const inputRef = useRef(null);

  const isMatchLive = Boolean(activeMatch && (activeMatch.phase === 'playing' || activeMatch.phase === 'inningBreak') && !activeMatch.resultText);
  const isMatchFinished = Boolean(activeMatch && (activeMatch.phase === 'result' || activeMatch.resultText));
  const TARGET_PIN = isMatchLive ? (activeMatch?.scorerPin || '').trim() : '';

  useEffect(() => {
    if (visible) {
      setPin('');
      setErrorMsg('');
      setIsSearching(false);
      setMatchedMatches([]);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleSelectRemoteMatch = (matchObj) => {
    setErrorMsg('');
    setPin('');
    setMatchedMatches([]);
    if (typeof onSuccessRemoteMatch === 'function') {
      onSuccessRemoteMatch(matchObj);
    } else {
      onSuccessContinueMatch();
    }
  };

  const handlePinChange = async (val) => {
    const numericVal = val.replace(/[^\d]/g, '').slice(0, 6);
    setPin(numericVal);
    if (errorMsg) setErrorMsg('');
    setMatchedMatches([]);

    if (numericVal.length === 6) {
      // 1. Check if user is entering the PIN of an already completed match
      if (isMatchFinished && activeMatch?.scorerPin && numericVal === activeMatch.scorerPin.trim()) {
        setErrorMsg('This match is already completed. PIN has expired.');
        return;
      }

      // 2. Local active match is live & ongoing: verify PIN
      if (isMatchLive && TARGET_PIN && numericVal === TARGET_PIN) {
        setErrorMsg('');
        setPin('');
        onSuccessContinueMatch();
        return;
      }

      // 3. Query Supabase database ONLY for active live ongoing matches
      setIsSearching(true);
      try {
        const matches = await fetchMatchesByPinFromSupabase(numericVal);
        setIsSearching(false);

        if (matches && matches.length === 1) {
          handleSelectRemoteMatch(matches[0]);
        } else if (matches && matches.length > 1) {
          setMatchedMatches(matches);
        } else {
          setErrorMsg('Invalid PIN. No active live match found.');
        }
      } catch (err) {
        setIsSearching(false);
        setErrorMsg('Verification failed. Try again.');
      }
    }
  };

  const handleStartNewMatch = () => {
    setPin('');
    setErrorMsg('');
    onSelectStartNewMatch();
  };

  const handleClose = () => {
    setPin('');
    setErrorMsg('');
    setIsSearching(false);
    onClose();
  };

  const team1Name = activeMatch?.team1?.name || activeMatch?.teams?.[0]?.name || 'Team 1';
  const team2Name = activeMatch?.team2?.name || activeMatch?.teams?.[1]?.name || 'Team 2';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

        <View style={styles.modalCard}>
          {/* Top Header Row with Icon & Close */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleContainer}>
              <View style={styles.iconBadge}>
                <MaterialCommunityIcons name="shield-key-outline" size={20} color="#0284C7" />
              </View>
              <Text style={styles.title}>Scorer Verification</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Enter 6-digit match PIN to unlock scoring console
          </Text>

          {/* Active Live Match Pill (If Running) */}
          {isMatchLive && (
            <View style={styles.matchPill}>
              <View style={styles.liveDot} />
              <Text style={styles.matchPillText} numberOfLines={1}>
                {team1Name} vs {team2Name}
              </Text>
            </View>
          )}

          {/* 6-Digit Passcode Box & Invisible Input Layer */}
          <TouchableOpacity
            style={styles.passcodeContainer}
            activeOpacity={1}
            onPress={() => inputRef.current?.focus()}
          >
            <View style={styles.boxesRow} pointerEvents="none">
              {[0, 1, 2, 3, 4, 5].map((idx) => {
                const char = pin[idx];
                const isFilled = Boolean(char);
                const isCurrent = pin.length === idx;
                return (
                  <View
                    key={idx}
                    style={[
                      styles.box,
                      isFilled && styles.boxFilled,
                      isCurrent && styles.boxActive
                    ]}
                  >
                    {isFilled ? (
                      <Text style={styles.boxText}>{char}</Text>
                    ) : (
                      <View style={styles.boxPlaceholder} />
                    )}
                  </View>
                );
              })}
            </View>

            {/* Hidden Input Layer */}
            <TextInput
              ref={inputRef}
              style={styles.hiddenInput}
              value={pin}
              onChangeText={handlePinChange}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus={true}
              caretHidden
            />
          </TouchableOpacity>

          {/* Multi-Match Selection List if PIN Collision occurs */}
          {matchedMatches.length > 1 && (
            <View style={{ width: '100%', marginTop: 14, gap: 8 }}>
              <Text style={{ fontSize: 11, color: '#0284C7', fontFamily: systemFontBold, textAlign: 'center' }}>
                {matchedMatches.length} Live Matches Found. Select Match to Score:
              </Text>
              {matchedMatches.map((mObj, index) => {
                const t1 = mObj.teams?.[0]?.name || mObj.team1?.name || 'Team 1';
                const t2 = mObj.teams?.[1]?.name || mObj.team2?.name || 'Team 2';
                return (
                  <TouchableOpacity
                    key={mObj.id || index}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#F8FAFC',
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: '#E2E8F0'
                    }}
                    onPress={() => handleSelectRemoteMatch(mObj)}
                    activeOpacity={0.8}
                  >
                    <Text style={{ fontSize: 13, color: '#0F172A', fontFamily: systemFontBold, flex: 1 }} numberOfLines={1}>
                      {t1} vs {t2}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="#0284C7" />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Loading Indicator or Error / Hint Status */}
          {isSearching ? (
            <View style={styles.statusRow}>
              <ActivityIndicator size="small" color="#0284C7" />
              <Text style={{ fontSize: 11, color: '#0284C7', fontFamily: systemFontMedium }}>Verifying PIN with database...</Text>
            </View>
          ) : errorMsg ? (
            <View style={styles.statusRow}>
              <Ionicons name="alert-circle-outline" size={15} color="#DC2626" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : matchedMatches.length <= 1 ? (
            <Text style={styles.hintText}>PIN auto-verifies on 6th digit</Text>
          ) : null}

          {/* Bottom Actions Row */}
          <View style={styles.actionsRow}>
            <AppButton
              title="Start New Match"
              icon="add-circle-outline"
              iconType="ionicons"
              variant="outline"
              size="md"
              onPress={handleStartNewMatch}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.medium,
    elevation: 8
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: 16,
    color: '#0F172A',
    fontFamily: systemFontBold,
    letterSpacing: 0.2
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: systemFontMedium,
    marginBottom: 16,
    lineHeight: 17
  },
  matchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 16,
    alignSelf: 'flex-start'
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981'
  },
  matchPillText: {
    fontSize: 11,
    color: '#0369A1',
    fontFamily: systemFontBold
  },
  passcodeContainer: {
    width: '100%',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 4
  },
  boxesRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center'
  },
  box: {
    width: 42,
    height: 48,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center'
  },
  boxFilled: {
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF'
  },
  boxActive: {
    borderColor: '#0284C7',
    borderWidth: 2,
    backgroundColor: '#F0F9FF'
  },
  boxText: {
    fontSize: 19,
    color: '#0F172A',
    fontFamily: systemFontBold
  },
  boxPlaceholder: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1'
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.01,
    color: 'transparent'
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14
  },
  errorText: {
    fontSize: 11,
    color: '#DC2626',
    fontFamily: systemFontBold
  },
  hintText: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: systemFontMedium,
    textAlign: 'center',
    marginTop: 14
  },
  actionsRow: {
    marginTop: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center'
  },
  newMatchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    width: '100%'
  },
  newMatchText: {
    fontSize: 13,
    color: '#0284C7',
    fontFamily: systemFontBold
  }
});

export default ScorerPinModal;
