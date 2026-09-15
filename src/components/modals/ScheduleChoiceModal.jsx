import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  themeColors,
  systemFont,
  systemFontMedium,
  systemFontBold
} from '../../theme.js';

export function ScheduleChoiceModal({
  visible = false,
  onClose = () => {},
  onSelectAuto = () => {},
  onSelectManual = () => {}
}) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>How do you want to schedule?</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={themeColors.textPrimary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.headerSubtitle}>
            Choose how you would like to generate or schedule match fixtures for your tournament.
          </Text>

          {/* Option 1: Auto Schedule */}
          <TouchableOpacity
            style={styles.optionCard}
            activeOpacity={0.8}
            onPress={() => {
              onClose();
              setTimeout(onSelectAuto, 200);
            }}
          >
            <View style={[styles.iconBox, { backgroundColor: '#F0F9FF' }]}>
              <MaterialCommunityIcons name="lightning-bolt" size={26} color="#0284C7" />
            </View>
            <View style={styles.optionTextCol}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.optionTitle}>Auto schedule</Text>
                <View style={styles.smartBadge}>
                  <Text style={styles.smartBadgeText}>RECOMMENDED</Text>
                </View>
              </View>
              <Text style={styles.optionDescription}>
                Automatically generate balanced round-robin or group match fixtures based on rounds & groups.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          {/* Option 2: Manual Schedule */}
          <TouchableOpacity
            style={styles.optionCard}
            activeOpacity={0.8}
            onPress={() => {
              onClose();
              setTimeout(onSelectManual, 200);
            }}
          >
            <View style={[styles.iconBox, { backgroundColor: '#FAF5FF' }]}>
              <MaterialCommunityIcons name="calendar-edit" size={24} color="#9333EA" />
            </View>
            <View style={styles.optionTextCol}>
              <Text style={styles.optionTitle}>Manual schedule</Text>
              <Text style={styles.optionDescription}>
                Pick Team 1 vs Team 2, Stage/Round, Date, Time slot and Venue manually for individual fixtures.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EEEEF0'
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  closeBtn: {
    padding: 4
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: systemFont,
    color: themeColors.textSecondary,
    marginBottom: 18,
    lineHeight: 18
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFC',
    borderWidth: 1,
    borderColor: '#EEEEF0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  optionTextCol: {
    flex: 1,
    paddingRight: 6
  },
  optionTitle: {
    fontSize: 14.5,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  smartBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  smartBadgeText: {
    fontSize: 9.5,
    fontFamily: systemFontBold,
    color: '#0284C7'
  },
  optionDescription: {
    fontSize: 12,
    fontFamily: systemFont,
    color: themeColors.textMuted,
    marginTop: 3,
    lineHeight: 16
  }
});

export default ScheduleChoiceModal;
