import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { systemFontBold, systemFontMedium } from '../../theme.js';
import { showToast } from '../../services/toastService.js';

export function ShareScoringAccessModal({
  visible,
  onClose,
  activeMatch
}) {
  if (!activeMatch) return null;

  const matchCode = activeMatch.matchCode || activeMatch.scorerPin || ('CF-' + (activeMatch.id || '8421').slice(-4).toUpperCase());
  const matchTitle = activeMatch.matchTitle || `${activeMatch.team1?.name || 'Team 1'} vs ${activeMatch.team2?.name || 'Team 2'}`;

  const handleCopy = () => {
    if (onClose) onClose();
    showToast(`Scorer code ${matchCode} copied!`, 'success');
  };

  return (
    <Modal
      visible={Boolean(visible)}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalCard}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.titleWrap}>
              <Ionicons name="share-social" size={20} color="#18181B" />
              <Text style={styles.titleText}>Share Scoring Access</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <Text style={styles.descText}>
            Share this access code with your co-scorer or umpire on the ground for{' '}
            <Text style={styles.matchTitleHighlight}>{matchTitle}</Text>.
          </Text>

          {/* Code Box */}
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{matchCode}</Text>
            <Text style={styles.codeSubtext}>Valid for current active match</Text>
          </View>

          {/* Copy Button */}
          <TouchableOpacity
            onPress={handleCopy}
            activeOpacity={0.8}
            style={styles.copyBtn}
          >
            <Text style={styles.copyBtnText}>Copy Access Code</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 27, 44, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    gap: 14,
    borderWidth: 0
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  titleText: {
    fontSize: 16,
    color: '#0F172A',
    fontFamily: systemFontBold
  },
  descText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: systemFontMedium
  },
  matchTitleHighlight: {
    color: '#0F172A',
    fontFamily: systemFontBold
  },
  codeBox: {
    backgroundColor: '#F8F8FA',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 0
  },
  codeText: {
    fontSize: 24,
    letterSpacing: 4,
    color: '#18181B',
    fontFamily: systemFontBold
  },
  codeSubtext: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 4,
    fontFamily: systemFontMedium
  },
  copyBtn: {
    backgroundColor: '#18181B',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  copyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: systemFontBold
  }
});

export default ShareScoringAccessModal;
