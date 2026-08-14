import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  StatusBar,
  Animated,
  Dimensions,
  TouchableWithoutFeedback
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

const systemFont = 'SFProDisplay-Regular';
const systemFontMedium = 'SFProDisplay-Medium';
const systemFontBold = 'SFProDisplay-Bold';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH;

export function MenuDrawerScreen({
  visible,
  onClose,
  userName = 'Bastiram Suthar',
  userEmail = 'bastisuthar@gmail.com',
  onNavigate
}) {
  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: DRAWER_WIDTH,
        duration: 200,
        useNativeDriver: true
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      })
    ]).start(() => {
      onClose();
    });
  };

  const handleSelect = (screenId) => {
    handleClose();
    if (typeof onNavigate === 'function') {
      setTimeout(() => {
        onNavigate(screenId);
      }, 200);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        {/* Backdrop overlay (dim background) */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>

        {/* Drawer content sliding smoothly from Right */}
        <Animated.View
          style={[
            styles.drawerContainer,
            { transform: [{ translateX: slideAnim }] }
          ]}
        >
          <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
            {/* Header */}
            <View style={styles.header}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <TouchableOpacity onPress={handleClose} activeOpacity={0.7} style={{ padding: 4 }}>
                  <Ionicons name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Menu</Text>
              </View>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Profile Card */}
              <TouchableOpacity
                style={styles.profileCard}
                activeOpacity={0.8}
                onPress={() => handleSelect('auth')}
              >
                <View style={styles.avatarCircle}>
                  <Ionicons name="person" size={24} color="#64748B" />
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.userName} numberOfLines={1}>{userName}</Text>
                  <Text style={styles.userEmail} numberOfLines={1}>{userEmail}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>

              {/* Main Menu Options */}
              <View style={styles.menuGroup}>
                <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={() => handleSelect('scorerWizard')}>
                  <MaterialCommunityIcons name="cricket" size={22} color="#0284C7" style={styles.menuIcon} />
                  <Text style={styles.menuText}>Start Match</Text>
                  <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={() => handleSelect('tournament')}>
                  <Ionicons name="trophy-outline" size={21} color="#EAB308" style={styles.menuIcon} />
                  <Text style={styles.menuText}>Start Tournament</Text>
                  <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={() => handleSelect('rankings')}>
                  <Ionicons name="bar-chart-outline" size={21} color="#0284C7" style={styles.menuIcon} />
                  <Text style={styles.menuText}>Rankings</Text>
                  <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={() => handleSelect('fixtures')}>
                  <Ionicons name="calendar-outline" size={21} color="#2563EB" style={styles.menuIcon} />
                  <Text style={styles.menuText}>Fixtures</Text>
                  <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={() => handleSelect('tournament')}>
                  <Ionicons name="ribbon-outline" size={21} color="#D97706" style={styles.menuIcon} />
                  <Text style={styles.menuText}>All Series</Text>
                  <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuRowLast} activeOpacity={0.7} onPress={() => handleSelect('about')}>
                  <Ionicons name="information-circle-outline" size={21} color="#64748B" style={styles.menuIcon} />
                  <Text style={styles.menuText}>About App</Text>
                  <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                </TouchableOpacity>
              </View>

              {/* Section Header */}
              <Text style={styles.sectionHeader}>APP SETTINGS</Text>

              {/* Settings Options */}
              <View style={styles.menuGroup}>
                <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={() => handleSelect('matchSettings')}>
                  <Ionicons name="settings-outline" size={21} color="#475569" style={styles.menuIcon} />
                  <Text style={styles.menuText}>Match Settings</Text>
                  <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={() => handleSelect('theme')}>
                  <Ionicons name="contrast-outline" size={21} color="#475569" style={styles.menuIcon} />
                  <Text style={styles.menuText}>App Theme</Text>
                  <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={() => handleSelect('notifications')}>
                  <Ionicons name="notifications-outline" size={21} color="#475569" style={styles.menuIcon} />
                  <Text style={styles.menuText}>Notification Settings</Text>
                  <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={() => handleSelect('languages')}>
                  <Ionicons name="language-outline" size={21} color="#475569" style={styles.menuIcon} />
                  <Text style={styles.menuText}>Languages</Text>
                  <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={() => handleSelect('autoplay')}>
                  <Ionicons name="play-circle-outline" size={21} color="#475569" style={styles.menuIcon} />
                  <Text style={styles.menuText}>Video Autoplay</Text>
                  <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuRowLast} activeOpacity={0.7} onPress={() => handleSelect('report')}>
                  <Ionicons name="alert-circle-outline" size={21} color="#E11D48" style={styles.menuIcon} />
                  <Text style={[styles.menuText, { color: '#E11D48' }]}>Report a Problem</Text>
                  <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 27, 44, 0.65)'
  },
  drawerContainer: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: '#F8FAFC',
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 12
  },
  safeArea: {
    flex: 1
  },
  header: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justify: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justify: 'center',
    backgroundColor: '#F1F5F9'
  },
  headerTitle: {
    fontSize: 18,
    color: '#0F172A',
    fontFamily: systemFontBold
  },
  scroll: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
    gap: 16
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justify: 'center'
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2
  },
  userName: {
    fontSize: 16,
    color: '#0F172A',
    fontFamily: systemFontBold
  },
  userEmail: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: systemFontMedium
  },
  sectionHeader: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: systemFontBold,
    letterSpacing: 0.8,
    marginTop: 6,
    marginBottom: -4,
    paddingLeft: 4
  },
  menuGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden'
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  menuRowLast: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: 16
  },
  menuIcon: {
    width: 32
  },
  menuText: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    fontFamily: systemFontBold
  }
});
