import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  themeColors,
  systemFont,
  systemFontMedium,
  systemFontBold
} from '../theme.js';

export function MenuScreen({
  navigation,
  onBack,
  onLeaderboardPress,
  onProfilePress,
  onCreateTournamentPress,
  userProfile = {
    name: 'Bastiram Suthar',
    phoneOrEmail: 'bastisuthar@gmail.com'
  }
}) {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation && navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={themeColors.surface} />
      <View style={styles.container}>
        {/* ── 1. HEADER BAR ── */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleBack}
            activeOpacity={0.7}
            accessibilityLabel="Go Back"
          >
            <Ionicons name="arrow-back" size={24} color={themeColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Menu</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── 2. PROFILE SECTION ── */}
          <TouchableOpacity
            style={styles.profileRow}
            activeOpacity={0.7}
            onPress={() => {
              if (onProfilePress) {
                onProfilePress();
              } else if (navigation) {
                navigation.navigate('PlayerProfile');
              }
            }}
          >
            <View style={styles.avatarWrap}>
              <Ionicons name="person-circle-outline" size={48} color="#475569" />
            </View>
            <View style={styles.profileTextWrap}>
              <Text style={styles.profileName} numberOfLines={1}>
                {userProfile.name}
              </Text>
              <Text style={styles.profileEmail} numberOfLines={1}>
                {userProfile.phoneOrEmail}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* ── 3. FEATURE NAVIGATION ITEMS ── */}
          <View style={styles.menuGroup}>
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => {
                if (onLeaderboardPress) {
                  onLeaderboardPress();
                } else if (navigation) {
                  navigation.navigate('Rankings');
                }
              }}
            >
              <View style={styles.itemIconWrap}>
                <Ionicons name="stats-chart" size={20} color="#2563EB" />
              </View>
              <Text style={styles.itemLabel}>Rankings</Text>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
              <View style={styles.itemIconWrap}>
                <Ionicons name="calendar" size={20} color="#2563EB" />
              </View>
              <Text style={styles.itemLabel}>Fixtures</Text>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => {
                if (onCreateTournamentPress) {
                  onCreateTournamentPress();
                } else if (navigation) {
                  navigation.navigate('CreateTournament');
                }
              }}
            >
              <View style={styles.itemIconWrap}>
                <MaterialCommunityIcons name="trophy" size={20} color="#D97706" />
              </View>
              <Text style={styles.itemLabel}>Host a Tournament / Series</Text>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => {
                if (navigation) {
                  navigation.navigate('AllSeriesDirectory');
                }
              }}
            >
              <View style={styles.itemIconWrap}>
                <MaterialCommunityIcons name="trophy-outline" size={20} color="#2563EB" />
              </View>
              <Text style={styles.itemLabel}>All Series</Text>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
              <View style={styles.itemIconWrap}>
                <MaterialCommunityIcons name="account-group" size={20} color="#2563EB" />
              </View>
              <Text style={styles.itemLabel}>Following</Text>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
              <View style={styles.itemIconWrap}>
                <Ionicons name="radio-outline" size={20} color="#DC2626" />
              </View>
              <Text style={styles.itemLabel}>Go Live</Text>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* ── 4. APP SETTINGS SECTION HEADER ── */}
          <View style={styles.sectionHeaderWrap}>
            <Text style={styles.sectionHeaderText}>APP SETTINGS</Text>
          </View>

          {/* ── 5. APP SETTINGS ITEMS ── */}
          <View style={styles.menuGroup}>
            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
              <View style={styles.itemIconWrap}>
                <Ionicons name="settings-outline" size={20} color="#475569" />
              </View>
              <Text style={styles.itemLabel}>Match Settings</Text>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
              <View style={styles.itemIconWrap}>
                <Ionicons name="contrast-outline" size={20} color="#475569" />
              </View>
              <Text style={styles.itemLabel}>App Theme</Text>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
              <View style={styles.itemIconWrap}>
                <Ionicons name="notifications-outline" size={20} color="#475569" />
              </View>
              <Text style={styles.itemLabel}>Notification Settings</Text>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
              <View style={styles.itemIconWrap}>
                <Ionicons name="language-outline" size={20} color="#475569" />
              </View>
              <Text style={styles.itemLabel}>Languages</Text>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
              <View style={styles.itemIconWrap}>
                <Ionicons name="alert-circle-outline" size={20} color="#475569" />
              </View>
              <Text style={styles.itemLabel}>Report a Problem</Text>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
              <View style={styles.itemIconWrap}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#475569" />
              </View>
              <Text style={styles.itemLabel}>Terms & Privacy Policy</Text>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
              <View style={styles.itemIconWrap}>
                <Ionicons name="ellipsis-horizontal-circle-outline" size={20} color="#475569" />
              </View>
              <Text style={styles.itemLabel}>More</Text>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
              <View style={styles.itemIconWrap}>
                <Ionicons name="log-out-outline" size={20} color="#475569" />
              </View>
              <Text style={styles.itemLabel}>Logout</Text>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* ── 6. FOOTER VERSION ── */}
          <View style={styles.footerWrap}>
            <Text style={styles.versionText}>v 26.08.04 (645)</Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: themeColors.surface
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F8FA'
  },
  headerBar: {
    height: 52,
    backgroundColor: themeColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16
  },
  backBtn: {
    padding: 4,
    marginLeft: -4
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary,
    letterSpacing: -0.2
  },
  scrollContainer: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: 40
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  avatarWrap: {
    marginRight: 14
  },
  profileTextWrap: {
    flex: 1
  },
  profileName: {
    fontSize: 16,
    fontFamily: systemFontBold,
    color: themeColors.textPrimary,
    marginBottom: 2
  },
  profileEmail: {
    fontSize: 12,
    fontFamily: systemFont,
    color: themeColors.textMuted
  },
  divider: {
    height: 1,
    backgroundColor: themeColors.border
  },
  menuGroup: {
    backgroundColor: themeColors.surface,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: themeColors.border
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  itemIconWrap: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  itemLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: systemFontMedium,
    color: themeColors.textPrimary
  },
  sectionHeaderWrap: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
    backgroundColor: '#F8F8FA'
  },
  sectionHeaderText: {
    fontSize: 11,
    fontFamily: systemFontBold,
    color: themeColors.textMuted,
    letterSpacing: 0.6
  },
  footerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28
  },
  versionText: {
    fontSize: 12,
    fontFamily: systemFont,
    color: '#94A3B8'
  }
});

export default MenuScreen;
