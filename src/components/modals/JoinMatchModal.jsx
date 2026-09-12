import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { systemFontBold, systemFontMedium, themeColors } from '../../theme.js';
import { showToast } from '../../services/toastService.js';

export function JoinMatchModal({
  visible,
  onClose,
  onJoinMatchByCode
}) {
  const [inputMatchCode, setInputMatchCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setInputMatchCode('');
    setIsSubmitting(false);
    if (onClose) onClose();
  };

  const handleJoin = async () => {
    const trimmed = inputMatchCode.trim();
    if (!trimmed) {
      showToast('Please enter a match code', 'error');
      return;
    }

    if (onJoinMatchByCode) {
      setIsSubmitting(true);
      try {
        const success = await onJoinMatchByCode(trimmed);
        if (success) {
          handleClose();
          showToast('Scoring connected for match!', 'success');
        } else {
          showToast(`No live match found for "${trimmed}"`, 'error');
        }
      } catch (err) {
        showToast('Failed to join match. Please try again.', 'error');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      handleClose();
      showToast(`Searching match ${trimmed}...`, 'success');
    }
  };

  return (
    <Modal
      visible={Boolean(visible)}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleClose}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalCard}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.titleWrap}>
              <Ionicons name="key" size={20} color="#18181B" />
              <Text style={styles.titleText}>Enter Match Code</Text>
            </View>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <Text style={styles.descText}>
            Enter the 6-character match code shared by the match creator to score or view live.
          </Text>

          {/* Input Box */}
          <View style={styles.inputContainer}>
            <Ionicons name="barcode-outline" size={20} color="#18181B" />
            <TextInput
              style={styles.inputField}
              placeholder="e.g. CF-8421"
              placeholderTextColor="#94A3B8"
              value={inputMatchCode}
              onChangeText={setInputMatchCode}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleJoin}
            />
            {Boolean(inputMatchCode) && (
              <TouchableOpacity onPress={() => setInputMatchCode('')} style={styles.clearBtn}>
                <Ionicons name="close-circle" size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Action Button */}
          <TouchableOpacity
            onPress={handleJoin}
            disabled={isSubmitting}
            activeOpacity={0.8}
            style={[styles.joinBtn, isSubmitting && { opacity: 0.6 }]}
          >
            <Text style={styles.joinBtnText}>
              {isSubmitting ? 'Joining...' : 'Join Match'}
            </Text>
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
    borderWidth: 1,
    borderColor: '#EEEEF0'
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEEEF0',
    paddingHorizontal: 14,
    height: 48,
    gap: 10
  },
  inputField: {
    flex: 1,
    fontSize: 15,
    fontFamily: systemFontBold,
    color: '#0F172A',
    paddingVertical: 0
  },
  clearBtn: {
    padding: 4
  },
  joinBtn: {
    backgroundColor: '#18181B',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  joinBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: systemFontBold
  }
});

export default JoinMatchModal;
