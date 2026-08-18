import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { systemFont, systemFontBold } from '../../theme.js';
import { PRESET_TEAM_LOGOS } from '../../utils/teamUtils.js';

export function TeamLogoPickerModal({
  visible,
  onClose,
  targetTeam = 'team1',
  teamName = '',
  team1LogoKey = 'csk',
  team2LogoKey = 'rcb',
  onSelectLogo
}) {
  const currentSelectedKey = targetTeam === 'team1' ? team1LogoKey : team2LogoKey;
  const otherSelectedKey = targetTeam === 'team1' ? team2LogoKey : team1LogoKey;

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
            <View>
              <Text style={styles.title}>
                Choose Team Logo
              </Text>
              <Text style={styles.subTitle}>
                Select a badge for {teamName || (targetTeam === 'team1' ? 'Team 1' : 'Team 2')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* 10 Team Badges Grid (5 x 2) with Duplicate Lock */}
          <View style={styles.grid}>
            {PRESET_TEAM_LOGOS.map((preset) => {
              const isSelected = currentSelectedKey === preset.id;
              const isUsedByOtherTeam = otherSelectedKey === preset.id;

              return (
                <TouchableOpacity
                  key={preset.id}
                  activeOpacity={isUsedByOtherTeam ? 1 : 0.7}
                  disabled={isUsedByOtherTeam}
                  onPress={() => {
                    if (isUsedByOtherTeam) return;
                    if (onSelectLogo) onSelectLogo(preset, targetTeam);
                    if (onClose) onClose();
                  }}
                  style={[
                    styles.logoItem,
                    { opacity: isUsedByOtherTeam ? 0.35 : 1 }
                  ]}
                >
                  <View
                    style={[
                      styles.logoCircle,
                      {
                        borderColor: isSelected ? '#0284C7' : (isUsedByOtherTeam ? '#CBD5E1' : '#E2E8F0')
                      }
                    ]}
                  >
                    <Image
                      source={preset.url ? { uri: preset.url } : preset.source}
                      style={{ width: 44, height: 44 }}
                      resizeMode="contain"
                    />
                    {isUsedByOtherTeam && (
                      <View style={styles.lockOverlay}>
                        <Ionicons name="lock-closed" size={12} color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.logoLabel,
                      { color: isSelected ? '#0284C7' : (isUsedByOtherTeam ? '#94A3B8' : '#334155') }
                    ]}
                    numberOfLines={1}
                  >
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
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
    gap: 16
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  title: {
    fontSize: 16,
    color: '#0F172A',
    fontFamily: systemFontBold
  },
  subTitle: {
    fontSize: 11,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between'
  },
  logoItem: {
    width: '17%',
    alignItems: 'center',
    gap: 4
  },
  logoCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  logoLabel: {
    fontSize: 10,
    fontFamily: systemFontBold,
    textAlign: 'center'
  }
});

export default TeamLogoPickerModal;
