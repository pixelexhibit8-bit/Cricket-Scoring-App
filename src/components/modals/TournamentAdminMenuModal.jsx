import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  themeColors,
  systemFont,
  systemFontMedium,
  systemFontBold
} from '../../theme.js';

export function TournamentAdminMenuModal({
  visible = false,
  onClose = () => {},
  tournament = null,
  onOpenEdit = () => {},
  onOpenAddTeams = () => {},
  onOpenRounds = () => {},
  onOpenGroups = () => {},
  onOpenStartMatch = () => {},
  onOpenSchedule = () => {},
  onDeleteSchedule = () => {},
  onOpenScorers = () => {},
  onOpenOfficials = () => {},
  onOpenRules = () => {}
}) {
  if (!tournament) return null;

  const tournamentName = tournament.name || tournament.title || tournament.fullName || 'Tournament';

  const menuItems = [
    {
      id: 'edit_tournament',
      title: 'Edit/delete tournament',
      icon: 'pencil-box-outline',
      iconFamily: 'MaterialCommunityIcons',
      onPress: () => {
        onClose();
        setTimeout(onOpenEdit, 250);
      }
    },
    {
      id: 'add_teams',
      title: 'Add teams',
      icon: 'account-multiple-plus-outline',
      iconFamily: 'MaterialCommunityIcons',
      onPress: () => {
        onClose();
        setTimeout(onOpenAddTeams, 250);
      }
    },
    {
      id: 'rounds',
      title: 'Rounds (League matches, Final, etc.)',
      icon: 'tournament',
      iconFamily: 'MaterialCommunityIcons',
      onPress: () => {
        onClose();
        setTimeout(onOpenRounds, 250);
      }
    },
    {
      id: 'groups',
      title: 'Groups (Group A, Group B, etc.)',
      icon: 'account-group-outline',
      iconFamily: 'MaterialCommunityIcons',
      onPress: () => {
        onClose();
        setTimeout(onOpenGroups, 250);
      }
    },
    {
      id: 'start_match',
      title: 'Start a match',
      icon: 'cricket',
      iconFamily: 'MaterialCommunityIcons',
      highlight: true,
      onPress: () => {
        onClose();
        setTimeout(onOpenStartMatch, 250);
      }
    },
    {
      id: 'schedule_matches',
      title: 'Schedule matches',
      icon: 'calendar-clock',
      iconFamily: 'MaterialCommunityIcons',
      onPress: () => {
        onClose();
        setTimeout(onOpenSchedule, 250);
      }
    },
    {
      id: 'delete_schedule',
      title: 'Delete schedule',
      icon: 'calendar-remove-outline',
      iconFamily: 'MaterialCommunityIcons',
      destructive: true,
      onPress: () => {
        Alert.alert(
          'Delete Schedule?',
          'Are you sure you want to clear all unplayed scheduled matches for this tournament?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete Schedule',
              style: 'destructive',
              onPress: () => {
                onClose();
                onDeleteSchedule();
              }
            }
          ]
        );
      }
    },
    {
      id: 'scorers_admins',
      title: 'Add/remove scorers (admins)',
      icon: 'shield-account-outline',
      iconFamily: 'MaterialCommunityIcons',
      onPress: () => {
        onClose();
        setTimeout(onOpenScorers, 250);
      }
    },
    {
      id: 'officials',
      title: 'Live streamers/umpires/commentators',
      icon: 'broadcast',
      iconFamily: 'MaterialCommunityIcons',
      onPress: () => {
        onClose();
        setTimeout(onOpenOfficials, 250);
      }
    },
    {
      id: 'tournament_rules',
      title: 'Tournament rules',
      icon: 'book-open-outline',
      iconFamily: 'MaterialCommunityIcons',
      badge: 'NEW',
      onPress: () => {
        onClose();
        setTimeout(onOpenRules, 250);
      }
    },
    {
      id: 'find_officials',
      title: 'Find scorers/umpires',
      icon: 'search',
      iconFamily: 'Ionicons',
      onPress: () => {
        Alert.alert(
          'CricFlow Official Directory',
          'Looking for local ground scorers, umpires, or commentators for your tournament? Contact CricFlow Ground Desk: +91 9983228208.'
        );
      }
    }
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor={themeColors.surface} />
        <View style={styles.modalContainer}>
          {/* Header Bar */}
          <View style={styles.headerBar}>
            <TouchableOpacity style={styles.backBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={24} color={themeColors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.headerTitle} numberOfLines={1}>{tournamentName}</Text>
              <View style={styles.hostBadge}>
                <MaterialCommunityIcons name="shield-crown-outline" size={11} color="#FFFFFF" />
                <Text style={styles.hostBadgeText}>Tournament Admin Settings</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={themeColors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Menu Items List */}
          <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.menuContainer}>
              {menuItems.map((item, index) => {
                const isLast = index === menuItems.length - 1;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.menuRow, isLast && { borderBottomWidth: 0 }]}
                    onPress={item.onPress}
                    activeOpacity={0.7}
                  >
                    <View style={styles.menuLeft}>
                      <View
                        style={[
                          styles.iconCircle,
                          item.destructive && styles.iconCircleDestructive,
                          item.highlight && styles.iconCircleHighlight
                        ]}
                      >
                        {item.iconFamily === 'Ionicons' ? (
                          <Ionicons
                            name={item.icon}
                            size={20}
                            color={item.destructive ? '#EF4444' : item.highlight ? '#FFFFFF' : '#18181B'}
                          />
                        ) : (
                          <MaterialCommunityIcons
                            name={item.icon}
                            size={20}
                            color={item.destructive ? '#EF4444' : item.highlight ? '#FFFFFF' : '#18181B'}
                          />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.menuTitle,
                          item.destructive && styles.menuTitleDestructive,
                          item.highlight && styles.menuTitleHighlight
                        ]}
                      >
                        {item.title}
                      </Text>
                    </View>

                    <View style={styles.menuRight}>
                      {item.badge && (
                        <View style={styles.newBadge}>
                          <Text style={styles.newBadgeText}>{item.badge}</Text>
                        </View>
                      )}
                      <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Footer Helpline / Help Section */}
            <View style={styles.footerHelpCard}>
              <View style={styles.footerHelpHeader}>
                <Text style={styles.footerHelpTitle}>Tournament Support & Guidance</Text>
                <TouchableOpacity onPress={() => Alert.alert('Help', 'Contact CricFlow ground assistance anytime.')}>
                  <Text style={styles.footerHelpLink}>Help</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.helplineRow}>
                <MaterialCommunityIcons name="phone-outline" size={16} color="#059669" />
                <Text style={styles.helplineText}>CricFlow Helpline: +91 9983228208</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: themeColors.surface
  },
  modalContainer: {
    flex: 1,
    backgroundColor: themeColors.appBackground
  },
  headerBar: {
    height: 58,
    backgroundColor: themeColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'flex-start',
    justifyContent: 'center'
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8
  },
  headerTitle: {
    fontSize: 15,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  hostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#18181B',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginTop: 2
  },
  hostBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontFamily: systemFontMedium
  },
  scrollArea: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16
  },
  menuContainer: {
    backgroundColor: themeColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: themeColors.border,
    overflow: 'hidden'
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: themeColors.surfaceOffWhite,
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconCircleHighlight: {
    backgroundColor: '#18181B'
  },
  iconCircleDestructive: {
    backgroundColor: '#FEF2F2'
  },
  menuTitle: {
    fontSize: 14,
    fontFamily: systemFontMedium,
    color: themeColors.textPrimary,
    flex: 1
  },
  menuTitleHighlight: {
    fontFamily: systemFontBold,
    color: themeColors.textPrimary
  },
  menuTitleDestructive: {
    color: '#EF4444'
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  newBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontFamily: systemFontBold
  },
  footerHelpCard: {
    backgroundColor: themeColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: themeColors.border,
    padding: 16,
    gap: 8
  },
  footerHelpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  footerHelpTitle: {
    fontSize: 12,
    fontFamily: systemFontBold,
    color: themeColors.textSecondary
  },
  footerHelpLink: {
    fontSize: 12,
    fontFamily: systemFontBold,
    color: '#0284C7'
  },
  helplineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2
  },
  helplineText: {
    fontSize: 13,
    fontFamily: systemFontMedium,
    color: themeColors.textPrimary
  }
});

export default TournamentAdminMenuModal;
