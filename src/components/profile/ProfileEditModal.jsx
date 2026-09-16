import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PlayerAvatar } from '../PlayerAvatar.jsx';
import { DobPickerModal } from '../modals/DobPickerModal.jsx';
import { LocationPickerModal } from '../modals/LocationPickerModal.jsx';
import { capitalizeWords } from '../../utils/textUtils.js';
import { showToast } from '../../services/toastService.js';
import { systemFont, systemFontBold, systemFontMedium } from '../../theme.js';

const ROLES = ['Batter', 'Bowler', 'All-Rounder', 'Wicket Keeper'];
const BATTING_STYLES = ['Right Hand Bat', 'Left Hand Bat'];
const BOWLING_STYLES = [
  'Right Arm Fast',
  'Right Arm Medium',
  'Off Spin',
  'Leg Spin',
  'Left Arm Medium',
  'Left Arm Spin'
];

export const ProfileEditModal = React.memo(function ProfileEditModal({
  visible,
  profile,
  playerName,
  onClose,
  onSave,
  onPickImage
}) {
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('All-Rounder');
  const [editBatting, setEditBatting] = useState('Right Hand Bat');
  const [editBowling, setEditBowling] = useState('Right Arm Medium');
  const [editCity, setEditCity] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editJerseyNumber, setEditJerseyNumber] = useState('');
  const [editDob, setEditDob] = useState('');

  const [dobPickerVisible, setDobPickerVisible] = useState(false);
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);

  useEffect(() => {
    if (visible && profile) {
      setEditName(profile.name || playerName || '');
      setEditRole(profile.role || 'All-Rounder');
      setEditBatting(profile.battingStyle || 'Right Hand Bat');
      setEditBowling(profile.bowlingStyle || 'Right Arm Medium');
      setEditCity(profile.city || '');
      setEditPhone(profile.phone || '');
      setEditJerseyNumber(String(profile.jerseyNumber || profile.jersey_number || ''));
      setEditDob(profile.dob || '');
    }
  }, [visible, profile, playerName]);

  const handleSave = useCallback(() => {
    if (!editName.trim()) {
      showToast('Please enter your player full name', 'error');
      return;
    }
    const cleanPhone = editPhone.trim().replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      showToast('Mobile number is mandatory (10 digits)', 'error');
      return;
    }

    onSave({
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
  }, [
    editName,
    editRole,
    editBatting,
    editBowling,
    editCity,
    editJerseyNumber,
    editPhone,
    editDob,
    profile,
    onSave
  ]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Cricket Profile</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={24} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Photo Avatar Row */}
            <View style={styles.avatarRow}>
              <TouchableOpacity
                onPress={onPickImage}
                style={{ position: 'relative' }}
                activeOpacity={0.85}
              >
                <PlayerAvatar name={editName || playerName} photoUrl={profile?.photoUrl} size={76} />
                <View style={styles.cameraBadge}>
                  <Ionicons name="camera" size={13} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={onPickImage} style={{ marginTop: 6 }}>
                <Text style={styles.changePhotoText}>Change Profile Photo</Text>
              </TouchableOpacity>
            </View>

            {/* Player Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Player Name</Text>
              <TextInput
                style={styles.textInput}
                value={editName}
                onChangeText={(t) => setEditName(capitalizeWords(t))}
                placeholder="Enter name"
                autoCapitalize="words"
              />
            </View>

            {/* Playing Role */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Playing Role</Text>
              <View style={styles.pillSelectorRow}>
                {ROLES.map(role => (
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

            {/* Batting Style */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Batting Style</Text>
              <View style={styles.pillSelectorRow}>
                {BATTING_STYLES.map(b => (
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

            {/* Bowling Style */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bowling Style</Text>
              <View style={styles.pillSelectorRow}>
                {BOWLING_STYLES.map(b => (
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

            {/* Jersey Number */}
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

            {/* Date of Birth Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date of Birth</Text>
              <TouchableOpacity
                onPress={() => setDobPickerVisible(true)}
                style={[styles.textInput, styles.pickerButton]}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="calendar-outline" size={18} color="#18181B" />
                  <Text style={{ color: editDob ? '#0F172A' : '#94A3B8', fontSize: 13, fontFamily: systemFontMedium }}>
                    {editDob ? editDob : 'Select Date of Birth'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* City / District / Ground */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>City / District / Ground</Text>
              <TouchableOpacity
                onPress={() => setLocationPickerVisible(true)}
                style={[styles.textInput, styles.pickerButton]}
                activeOpacity={0.75}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <Ionicons name="location-outline" size={18} color="#18181B" />
                  <Text style={{ color: editCity ? '#0F172A' : '#94A3B8', fontSize: 13, fontFamily: systemFontMedium }} numberOfLines={1}>
                    {editCity || 'Select City, District or Village'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Mobile Number */}
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

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
              <Text style={styles.saveBtnText}>Save Profile Changes</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {/* Location Picker */}
      <LocationPickerModal
        visible={locationPickerVisible}
        currentCity={editCity}
        onClose={() => setLocationPickerVisible(false)}
        onSelectLocation={(loc) => {
          setEditCity(loc.formattedAddress || loc.formatted || loc.city);
        }}
      />

      {/* DOB Picker */}
      <DobPickerModal
        visible={dobPickerVisible}
        initialDate={editDob}
        onClose={() => setDobPickerVisible(false)}
        onSelectDate={(selectedDate) => setEditDob(selectedDate)}
      />
    </Modal>
  );
});

const styles = StyleSheet.create({
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
    borderBottomWidth: 0,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 10
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: systemFontBold,
    color: '#0F172A'
  },
  avatarRow: {
    alignItems: 'center',
    marginBottom: 18,
    marginTop: 4
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#18181B',
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    borderColor: '#FFFFFF'
  },
  changePhotoText: {
    color: '#18181B',
    fontSize: 12.5,
    fontFamily: systemFontMedium
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
    borderWidth: 0,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    fontFamily: systemFontMedium
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12
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
    borderWidth: 0,
    borderColor: '#E2E8F0'
  },
  roleSelectPillActive: {
    backgroundColor: '#18181B',
    borderColor: '#18181B'
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
    backgroundColor: '#18181B',
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
