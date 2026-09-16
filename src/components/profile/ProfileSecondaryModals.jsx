import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { PlayerAvatar } from '../PlayerAvatar.jsx';
import { showToast } from '../../services/toastService.js';
import { systemFont, systemFontBold, systemFontMedium } from '../../theme.js';

/**
 * 1. Full Player Photo Preview & Quick Edit Modal
 */
export const PhotoPreviewModal = React.memo(function PhotoPreviewModal({
  visible,
  playerName,
  photoUrl,
  isPublicView,
  onClose,
  onPickImage
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={styles.photoOverlay}
      >
        <TouchableOpacity activeOpacity={1} style={styles.photoCard}>
          {/* Header */}
          <View style={styles.photoHeaderRow}>
            <Text style={styles.photoPlayerName}>{playerName}</Text>
            <TouchableOpacity onPress={onClose} style={styles.photoCloseBtn}>
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Large Photo Circle */}
          <View style={styles.photoCircle}>
            <PlayerAvatar
              name={playerName}
              photoUrl={photoUrl}
              size={220}
            />
          </View>

          {/* Actions */}
          <View style={styles.photoActionsRow}>
            {!isPublicView ? (
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  if (onPickImage) onPickImage();
                }}
                style={styles.changePhotoBtn}
                activeOpacity={0.85}
              >
                <Ionicons name="create-outline" size={18} color="#FFFFFF" />
                <Text style={styles.changePhotoBtnText}>Change Photo</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              onPress={onClose}
              style={styles.closePhotoBtn}
              activeOpacity={0.85}
            >
              <Text style={styles.closePhotoBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
});

/**
 * 2. 3-Dots Profile Options Bottom Sheet
 */
export const OptionsMenuModal = React.memo(function OptionsMenuModal({
  visible,
  onClose,
  onEditProfile,
  onRefreshStats,
  onSignOut
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.actionModalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.actionMenuCard}>
          <View style={styles.actionMenuHeader}>
            <Text style={styles.actionMenuTitle}>Profile Settings</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Edit Profile Option */}
          <TouchableOpacity
            style={styles.actionMenuItem}
            onPress={() => {
              onClose();
              onEditProfile();
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.actionMenuIconWrap, { backgroundColor: '#F8F8FA' }]}>
              <Ionicons name="create-outline" size={18} color="#18181B" />
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
              onClose();
              onRefreshStats();
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.actionMenuIconWrap, { backgroundColor: '#F8F8FA' }]}>
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
              onClose();
              onSignOut();
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
  );
});

/**
 * 3. Join Match Via Code Modal (Isolated text input state)
 */
export const JoinMatchModal = React.memo(function JoinMatchModal({
  visible,
  onClose,
  onJoinMatchByCode
}) {
  const [matchCode, setMatchCode] = useState('');

  const handleJoin = useCallback(async () => {
    const code = matchCode.trim();
    if (!code) {
      showToast('Please enter a match code', 'error');
      return;
    }
    if (onJoinMatchByCode) {
      const success = await onJoinMatchByCode(code);
      if (success) {
        onClose();
        setMatchCode('');
        showToast('Scoring connected for match!', 'success');
      } else {
        showToast(`No live match found for "${code}"`, 'error');
      }
    } else {
      onClose();
      showToast(`Searching match ${code}...`, 'success');
    }
  }, [matchCode, onJoinMatchByCode, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={styles.dialogOverlay}
      >
        <TouchableOpacity activeOpacity={1} style={styles.dialogCard}>
          <View style={styles.dialogHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="key" size={20} color="#18181B" />
              <Text style={styles.dialogTitle}>Enter Match Code</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <Text style={styles.dialogSubtext}>
            Enter the 6-character match code shared by the match creator to score or view live.
          </Text>

          <View style={styles.codeInputWrapper}>
            <Ionicons name="barcode-outline" size={20} color="#18181B" />
            <TextInput
              style={styles.codeTextInput}
              placeholder="e.g. CF-8421"
              placeholderTextColor="#94A3B8"
              value={matchCode}
              onChangeText={setMatchCode}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            {Boolean(matchCode) && (
              <TouchableOpacity onPress={() => setMatchCode('')} style={{ padding: 4 }}>
                <Ionicons name="close-circle" size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={handleJoin}
            style={styles.dialogPrimaryBtn}
          >
            <Text style={styles.dialogPrimaryBtnText}>Join Match</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
});

/**
 * 4. Share Scorer Access Modal
 */
export const ShareAccessModal = React.memo(function ShareAccessModal({
  visible,
  activeMatch,
  onClose,
  onStartQuickMatch
}) {
  const isMatchLive = activeMatch && (activeMatch.phase === 'playing' || activeMatch.phase === 'inningBreak');
  const code = activeMatch?.matchCode || activeMatch?.scorerPin || ('CF-' + (activeMatch?.id || '8421').slice(-4).toUpperCase());

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={styles.dialogOverlay}
      >
        <TouchableOpacity activeOpacity={1} style={styles.dialogCard}>
          <View style={styles.dialogHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="share-social" size={20} color="#18181B" />
              <Text style={styles.dialogTitle}>Share Scoring Access</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {isMatchLive ? (
            <>
              <Text style={styles.dialogSubtext}>
                Share this access code with your co-scorer or umpire on the ground for <Text style={{ color: '#0F172A', fontFamily: systemFontBold }}>{activeMatch.matchTitle || 'Live Match'}</Text>.
              </Text>

              <View style={styles.codeDisplayBox}>
                <Text style={styles.codeDisplayText}>{code}</Text>
                <Text style={styles.codeDisplaySub}>Valid for current active match</Text>
              </View>

              <TouchableOpacity
                onPress={() => {
                  onClose();
                  showToast(`Scorer code ${code} copied!`, 'success');
                }}
                style={styles.dialogPrimaryBtn}
              >
                <Text style={styles.dialogPrimaryBtnText}>Copy Access Code</Text>
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
                  onClose();
                  if (onStartQuickMatch) onStartQuickMatch();
                }}
                style={styles.dialogSecondaryBtn}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 12, fontFamily: systemFontBold }}>Start New Match</Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
});

/**
 * 5. Photo Source Selection Modal (Camera vs Gallery)
 */
export const PhotoSourcePickerModal = React.memo(function PhotoSourcePickerModal({
  visible,
  onClose,
  onPickFromCamera,
  onPickFromGallery
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.actionModalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.actionMenuCard}>
          <View style={styles.actionMenuHeader}>
            <Text style={styles.actionMenuTitle}>Select Profile Photo</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Camera Option */}
          <TouchableOpacity
            style={styles.actionMenuItem}
            onPress={() => {
              onClose();
              onPickFromCamera();
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.actionMenuIconWrap, { backgroundColor: '#F8F8FA' }]}>
              <Ionicons name="camera" size={20} color="#18181B" />
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
            onPress={() => {
              onClose();
              onPickFromGallery();
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.actionMenuIconWrap, { backgroundColor: '#F8F8FA' }]}>
              <Ionicons name="images" size={20} color="#18181B" />
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
  );
});

const styles = StyleSheet.create({
  photoOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 27, 44, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  photoCard: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center'
  },
  photoHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24
  },
  photoPlayerName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: systemFontBold
  },
  photoCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  photoCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    overflow: 'hidden',
    borderWidth: 0,
    borderColor: '#18181B',
    backgroundColor: '#0F2942',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 12
  },
  photoActionsRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
    marginTop: 28
  },
  changePhotoBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#18181B',
    paddingVertical: 13,
    borderRadius: 12
  },
  changePhotoBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: systemFontBold
  },
  closePhotoBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 13,
    borderRadius: 12
  },
  closePhotoBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: systemFontBold
  },

  // Action Menu / Bottom Sheet
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
    borderBottomWidth: 0,
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
    borderBottomWidth: 0,
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

  // Dialog Overlays (Join / Share)
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 27, 44, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  dialogCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    gap: 14,
    borderWidth: 0,
    borderColor: '#EEEEF0'
  },
  dialogHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  dialogTitle: {
    fontSize: 16,
    color: '#0F172A',
    fontFamily: systemFontBold
  },
  dialogSubtext: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: systemFontMedium
  },
  codeInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8FA',
    borderRadius: 12,
    borderWidth: 0,
    borderColor: '#EEEEF0',
    paddingHorizontal: 14,
    height: 48,
    gap: 10
  },
  codeTextInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: systemFontBold,
    color: '#0F172A',
    paddingVertical: 0
  },
  dialogPrimaryBtn: {
    backgroundColor: '#18181B',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  dialogPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: systemFontBold
  },
  dialogSecondaryBtn: {
    backgroundColor: '#18181B',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 4
  },
  codeDisplayBox: {
    backgroundColor: '#F8F8FA',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 0,
    borderColor: '#EEEEF0'
  },
  codeDisplayText: {
    fontSize: 24,
    letterSpacing: 4,
    color: '#18181B',
    fontFamily: systemFontBold
  },
  codeDisplaySub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 4,
    fontFamily: systemFontMedium
  }
});
