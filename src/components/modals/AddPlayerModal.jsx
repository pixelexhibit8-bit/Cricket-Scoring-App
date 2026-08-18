import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { systemFont, systemFontBold, fontWeights } from '../../theme.js';
import { showToast } from '../../services/toastService.js';

export function AddPlayerModal({
  visible,
  onClose,
  onAddPlayer
}) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleReset = () => {
    setFirstName('');
    setLastName('');
    setPhoneNumber('');
    setIsSaving(false);
  };

  const handleClose = () => {
    handleReset();
    if (onClose) onClose();
  };

  const handleSave = async () => {
    const fName = firstName.trim();
    const lName = lastName.trim();
    const phone = phoneNumber.trim();

    if (!fName || !lName) {
      showToast('Please enter both first name and surname', 'error');
      return;
    }
    if (phone.length !== 10) {
      showToast('Please enter a valid 10-digit mobile number', 'error');
      return;
    }

    setIsSaving(true);
    try {
      if (onAddPlayer) {
        await onAddPlayer({
          firstName: fName,
          lastName: lName,
          fullName: `${fName} ${lName}`,
          phone
        });
      }
      handleClose();
    } catch (err) {
      showToast(err.message || 'Could not save player', 'error');
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleClose}
        style={styles.backdrop}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.card}
        >
          {/* Modal Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>
                Add New Player
              </Text>
              <Text style={styles.subTitle}>
                Add player to ground squad & roster
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* TWO-COLUMN NAME & SURNAME INPUTS */}
          <View style={styles.row}>
            <TextInput
              style={styles.inputHalf}
              placeholder="First Name *"
              placeholderTextColor="#94A3B8"
              value={firstName}
              onChangeText={setFirstName}
              maxLength={24}
              autoFocus
            />

            <TextInput
              style={styles.inputHalf}
              placeholder="Surname *"
              placeholderTextColor="#94A3B8"
              value={lastName}
              onChangeText={setLastName}
              maxLength={24}
            />
          </View>

          {/* MOBILE NUMBER INPUT */}
          <View style={styles.phoneRow}>
            <View style={styles.countryCodeBadge}>
              <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder="Mobile Number (10 digits) *"
              placeholderTextColor="#94A3B8"
              value={phoneNumber}
              onChangeText={(val) => setPhoneNumber(val.replace(/\D/g, '').slice(0, 10))}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>

          {/* ACTION BUTTONS */}
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving || !firstName.trim() || !lastName.trim() || phoneNumber.length !== 10}
              style={[
                styles.saveBtn,
                {
                  backgroundColor: (isSaving || !firstName.trim() || !lastName.trim() || phoneNumber.length !== 10) ? '#94A3B8' : '#0284C7'
                }
              ]}
            >
              <Text style={styles.saveBtnText}>
                {isSaving ? 'Saving...' : 'Save Player'}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(7, 27, 44, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  title: {
    fontSize: 17,
    color: '#0F172A',
    fontFamily: systemFontBold
  },
  subTitle: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: systemFont,
    marginTop: 2
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  row: {
    flexDirection: 'row',
    gap: 10
  },
  inputHalf: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    height: 46,
    color: '#0F172A',
    fontSize: 13,
    fontFamily: systemFont
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  countryCodeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    height: 46,
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  countryCodeText: {
    color: '#0F172A',
    fontWeight: fontWeights.bold,
    fontSize: 12,
    fontFamily: systemFont
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    height: 46,
    color: '#0F172A',
    fontSize: 13,
    fontFamily: systemFont
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelBtnText: {
    color: '#64748B',
    fontSize: 12,
    fontFamily: systemFontBold
  },
  saveBtn: {
    flex: 1.6,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: systemFontBold
  }
});

export default AddPlayerModal;
