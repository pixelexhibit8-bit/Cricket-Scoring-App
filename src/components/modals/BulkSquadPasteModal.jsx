import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  themeColors,
  systemFont,
  systemFontMedium,
  systemFontBold
} from '../../theme.js';
import { parseSquadText } from '../../utils/squadParser.js';
import { PlayerAvatar } from '../PlayerAvatar.jsx';
import { showToast } from '../../services/toastService.js';

const SAMPLE_WHATSAPP_TEXT = `Team: Sadokan Super Kings
1. Bastiram (C) - 9983228208
2. Virender (WK)
3. Ramesh (Bowler)
4. Suresh (Batter)
5. Dinesh (All-Rounder)
6. Amit
7. Rahul
8. Mukesh
9. Pooja
10. Kamlesh
11. Vikram`;

export function BulkSquadPasteModal({
  visible,
  onClose,
  onImportPlayers,
  teamName = ''
}) {
  const [inputText, setInputText] = useState('');

  // Live real-time parsed squad players
  const parsedPlayers = useMemo(() => {
    return parseSquadText(inputText);
  }, [inputText]);

  const handleApplySample = () => {
    setInputText(SAMPLE_WHATSAPP_TEXT);
  };

  const handleClear = () => {
    setInputText('');
  };

  const handleConfirmImport = () => {
    if (parsedPlayers.length === 0) {
      showToast('Please paste or type player names first', 'error');
      return;
    }

    if (onImportPlayers) {
      onImportPlayers(parsedPlayers);
    }
    showToast(`${parsedPlayers.length} players imported into squad!`, 'success');
    setInputText('');
    if (onClose) onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <Pressable style={styles.modalBackdrop} onPress={onClose} />

        <View style={styles.modalSheet}>
          {/* Handle */}
          <View style={styles.modalHandle} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={22} color={themeColors.textPrimary} />
              <View>
                <Text style={styles.headerTitle}>Paste WhatsApp Squad</Text>
                {teamName ? (
                  <Text style={styles.headerSubtitle}>For {teamName}</Text>
                ) : null}
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={themeColors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Quick Actions Row (Paste hint, Sample) */}
          <View style={styles.quickBar}>
            <Text style={styles.quickBarHint}>Paste raw WhatsApp list, comma-separated or numbered names:</Text>
            {inputText.length === 0 ? (
              <TouchableOpacity onPress={handleApplySample} style={styles.samplePillBtn}>
                <Ionicons name="sparkles-outline" size={13} color="#0284C7" />
                <Text style={styles.samplePillText}>Sample Format</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleClear} style={styles.clearPillBtn}>
                <Ionicons name="trash-outline" size={13} color="#DC2626" />
                <Text style={styles.clearPillText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Large Text Input */}
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.textArea}
              placeholder="e.g.&#10;1. Bastiram (C) - 9983228208&#10;2. Virender (WK)&#10;3. Ramesh (Bowler)&#10;4. Suresh (Batter)..."
              placeholderTextColor={themeColors.textSubtle}
              multiline
              numberOfLines={6}
              value={inputText}
              onChangeText={setInputText}
              textAlignVertical="top"
            />
          </View>

          {/* Parsed Players Live Preview */}
          <View style={styles.previewHeaderRow}>
            <Text style={styles.previewSectionTitle}>
              PARSED SQUAD PREVIEW
            </Text>
            <View style={[styles.countBadge, parsedPlayers.length >= 11 ? styles.countBadgeSuccess : styles.countBadgeMuted]}>
              <Ionicons
                name={parsedPlayers.length >= 11 ? 'checkmark-circle' : 'person'}
                size={12}
                color={parsedPlayers.length >= 11 ? '#15803D' : themeColors.textMuted}
              />
              <Text style={[styles.countBadgeText, parsedPlayers.length >= 11 ? styles.countBadgeTextSuccess : styles.countBadgeTextMuted]}>
                {parsedPlayers.length} Players
              </Text>
            </View>
          </View>

          {/* Scrollable Preview List */}
          <ScrollView style={styles.previewScroll} showsVerticalScrollIndicator={false}>
            {parsedPlayers.length > 0 ? (
              parsedPlayers.map((player, idx) => (
                <View key={player.id || idx} style={styles.previewPlayerRow}>
                  <View style={styles.playerNumBadge}>
                    <Text style={styles.playerNumText}>{idx + 1}</Text>
                  </View>
                  <PlayerAvatar name={player.name} size={30} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.playerName}>{player.name}</Text>
                      {player.isCaptain && (
                        <View style={styles.captainChip}>
                          <Text style={styles.captainChipText}>C</Text>
                        </View>
                      )}
                      {player.isWicketKeeper && (
                        <View style={styles.wkChip}>
                          <Text style={styles.wkChipText}>WK</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.playerRoleText}>
                      {player.role}{player.phone ? ` • ${player.phone}` : ''}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyPreviewBox}>
                <Ionicons name="document-text-outline" size={28} color="#CBD5E1" />
                <Text style={styles.emptyPreviewText}>
                  Type or paste squad text above to see instant preview with roles and captain tags.
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Bottom Confirm Button */}
          <View style={styles.footerContainer}>
            <TouchableOpacity
              style={[styles.confirmBtn, parsedPlayers.length === 0 && styles.confirmBtnDisabled]}
              onPress={handleConfirmImport}
              disabled={parsedPlayers.length === 0}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />
              <Text style={styles.confirmBtnText}>
                {parsedPlayers.length > 0
                  ? `Import ${parsedPlayers.length} Players into Squad`
                  : 'Import Squad'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.5)'
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject
  },
  modalSheet: {
    backgroundColor: themeColors.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 20,
    maxHeight: '92%'
  },
  modalHandle: {
    width: 38,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 10
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  headerSubtitle: {
    fontSize: 11.5,
    fontFamily: systemFont,
    color: themeColors.textSecondary
  },
  closeBtn: {
    padding: 4
  },
  quickBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 6
  },
  quickBarHint: {
    fontSize: 11,
    fontFamily: systemFont,
    color: themeColors.textMuted,
    flex: 1
  },
  samplePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  samplePillText: {
    fontSize: 11,
    fontFamily: systemFontBold,
    color: '#0284C7'
  },
  clearPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  clearPillText: {
    fontSize: 11,
    fontFamily: systemFontBold,
    color: '#DC2626'
  },
  inputWrap: {
    backgroundColor: themeColors.surfaceOffWhite,
    borderWidth: 1,
    borderColor: themeColors.borderDark,
    borderRadius: 10,
    padding: 8
  },
  textArea: {
    fontSize: 12.5,
    fontFamily: systemFont,
    color: themeColors.textPrimary,
    minHeight: 90,
    maxHeight: 120,
    lineHeight: 18
  },
  previewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 6
  },
  previewSectionTitle: {
    fontSize: 11,
    fontFamily: systemFontBold,
    color: themeColors.textMuted,
    letterSpacing: 0.5
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6
  },
  countBadgeSuccess: {
    backgroundColor: '#DCFCE7'
  },
  countBadgeMuted: {
    backgroundColor: themeColors.surfaceOffWhite
  },
  countBadgeText: {
    fontSize: 11,
    fontFamily: systemFontBold
  },
  countBadgeTextSuccess: {
    color: '#15803D'
  },
  countBadgeTextMuted: {
    color: themeColors.textMuted
  },
  previewScroll: {
    maxHeight: 180,
    backgroundColor: themeColors.surfaceOffWhite,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: themeColors.border,
    paddingHorizontal: 10
  },
  previewPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border
  },
  playerNumBadge: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6
  },
  playerNumText: {
    fontSize: 11,
    fontFamily: systemFontBold,
    color: themeColors.textMuted
  },
  playerName: {
    fontSize: 13,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  playerRoleText: {
    fontSize: 11,
    fontFamily: systemFont,
    color: themeColors.textMuted
  },
  captainChip: {
    backgroundColor: '#18181B',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4
  },
  captainChipText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontFamily: systemFontBold
  },
  wkChip: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4
  },
  wkChipText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontFamily: systemFontBold
  },
  emptyPreviewBox: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  emptyPreviewText: {
    fontSize: 12,
    fontFamily: systemFont,
    color: themeColors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 20
  },
  footerContainer: {
    marginTop: 12
  },
  confirmBtn: {
    backgroundColor: '#18181B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 10
  },
  confirmBtnDisabled: {
    opacity: 0.5
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: systemFontBold
  }
});
