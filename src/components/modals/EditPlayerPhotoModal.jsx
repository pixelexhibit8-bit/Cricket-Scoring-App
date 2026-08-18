import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { systemFont, systemFontBold, systemFontMedium, fontWeights } from '../../theme.js';
import { PlayerAvatar } from '../PlayerAvatar.jsx';
import { showToast } from '../../services/toastService.js';
import { uploadImageToCloudinary } from '../../services/cloudinaryService.js';

export function EditPlayerPhotoModal({
  visible,
  targetPlayer,
  onClose,
  onSaveSuccess
}) {
  const playerName = typeof targetPlayer === 'string' ? targetPlayer : targetPlayer?.name || '';
  const initialPhoto = targetPlayer?.photoUrl || targetPlayer?.avatar || '';
  const initialPhone = targetPlayer?.phone || targetPlayer?.mobile || '';

  const [selectedImageUri, setSelectedImageUri] = useState(null);
  const [phoneInput, setPhoneInput] = useState(initialPhone);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setSelectedImageUri(null);
      setPhoneInput(typeof targetPlayer === 'object' ? (targetPlayer?.phone || '') : '');
    }
  }, [visible, targetPlayer]);

  const pickImageFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showToast('Please allow gallery access to select a photo', 'error');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const dataUri = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        setSelectedImageUri(dataUri);
      }
    } catch (err) {
      showToast(err.message || 'Could not pick image', 'error');
    }
  };

  const takePhotoFromCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showToast('Please allow camera access to capture a photo', 'error');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const dataUri = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        setSelectedImageUri(dataUri);
      }
    } catch (err) {
      showToast(err.message || 'Could not take photo', 'error');
    }
  };

  const handleSave = async () => {
    if (!playerName) return;
    setIsSaving(true);

    try {
      let finalUrl = initialPhoto;
      if (selectedImageUri) {
        const uploaded = await uploadImageToCloudinary(selectedImageUri);
        if (uploaded) finalUrl = uploaded;
      }

      if (onSaveSuccess) {
        await onSaveSuccess({
          name: playerName,
          photoUrl: finalUrl,
          phone: phoneInput.trim()
        });
      }
      showToast('Player details updated successfully!', 'success');
      onClose();
    } catch (err) {
      showToast(err.message || 'Could not save photo', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!visible || !playerName) return null;

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
        style={styles.backdrop}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.card}
        >
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              Set Photo: {playerName}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.avatarContainer}>
            {selectedImageUri ? (
              <Image source={{ uri: selectedImageUri }} style={styles.previewImage} />
            ) : (
              <PlayerAvatar name={playerName} photoUrl={initialPhoto} size={64} />
            )}
          </View>

          <Text style={styles.subText}>
            Upload Photo from Camera or Phone Gallery:
          </Text>

          <View style={styles.pickerRow}>
            <TouchableOpacity
              onPress={takePhotoFromCamera}
              style={styles.pickerBtn}
            >
              <Ionicons name="camera" size={16} color="#0284C7" />
              <Text style={styles.pickerBtnText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={pickImageFromGallery}
              style={styles.pickerBtn}
            >
              <Ionicons name="images" size={16} color="#0284C7" />
              <Text style={styles.pickerBtnText}>Gallery</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Mobile Number (Optional):
            </Text>
            <TextInput
              style={styles.phoneInput}
              placeholder="Mobile No. (e.g. 9829012345)..."
              placeholderTextColor="#94A3B8"
              value={phoneInput}
              onChangeText={setPhoneInput}
              keyboardType="phone-pad"
              maxLength={15}
            />
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelBtnText}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              style={[
                styles.saveBtn,
                { backgroundColor: isSaving ? '#94A3B8' : '#0284C7' }
              ]}
            >
              <Text style={styles.saveBtnText}>
                {isSaving ? 'UPLOADING...' : 'SAVE PHOTO'}
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
    maxWidth: 360,
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
    fontSize: 15,
    color: '#0F172A',
    fontFamily: systemFontBold,
    flex: 1
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 4
  },
  previewImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#0284C7'
  },
  subText: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: systemFontMedium,
    textAlign: 'center'
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center'
  },
  pickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F0F9FF',
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD'
  },
  pickerBtnText: {
    fontSize: 12,
    fontWeight: fontWeights.bold,
    color: '#0284C7',
    fontFamily: systemFont
  },
  inputGroup: {
    gap: 4
  },
  inputLabel: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: systemFontMedium
  },
  phoneInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    height: 42,
    color: '#0F172A',
    fontSize: 12,
    fontFamily: systemFont
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4
  },
  cancelBtn: {
    flex: 1,
    height: 42,
    borderRadius: 8,
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
    flex: 1.2,
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: systemFontBold
  }
});

export default EditPlayerPhotoModal;
