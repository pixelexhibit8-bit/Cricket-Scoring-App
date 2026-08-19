import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { systemFontMedium, systemFontBold } from '../../theme.js';

import { ScalePressable } from '../motion/MotionSystem.jsx';

export function AppBottomNav({ activeTab, onTabChange }) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 6 : 4);

  const tabs = [
    {
      id: 'home',
      label: 'Home',
      activeIcon: 'home',
      inactiveIcon: 'home-outline',
      isMCI: false
    },
    {
      id: 'matches',
      label: 'Matches',
      activeIcon: 'cricket',
      inactiveIcon: 'cricket',
      isMCI: true
    },
    {
      id: 'rankings',
      label: 'Rankings',
      activeIcon: 'trophy',
      inactiveIcon: 'trophy-outline',
      isMCI: false
    },
    {
      id: 'profile',
      label: 'My Profile',
      activeIcon: 'person',
      inactiveIcon: 'person-outline',
      isMCI: false
    }
  ];

  return (
    <View style={[styles.container, { paddingBottom: bottomPadding }]}>
      <View style={styles.navRow}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id || (tab.id === 'home' && !activeTab);
          return (
            <ScalePressable
              key={tab.id}
              onPress={() => onTabChange(tab.id)}
              style={styles.tabButton}
              activeScale={0.92}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              {tab.isMCI ? (
                <MaterialCommunityIcons
                  name={tab.activeIcon}
                  size={24}
                  color={isActive ? '#18181B' : '#94A3B8'}
                />
              ) : (
                <Ionicons
                  name={isActive ? tab.activeIcon : tab.inactiveIcon}
                  size={24}
                  color={isActive ? '#18181B' : '#94A3B8'}
                />
              )}
              <Text
                style={[
                  styles.tabLabel,
                  isActive ? styles.tabLabelActive : styles.tabLabelInactive
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </ScalePressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    elevation: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 4
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 52,
    paddingHorizontal: 12
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 4
  },
  tabLabel: {
    fontSize: 11,
    letterSpacing: 0.2
  },
  tabLabelActive: {
    color: '#18181B',
    fontFamily: systemFontBold
  },
  tabLabelInactive: {
    color: '#94A3B8',
    fontFamily: systemFontMedium
  }
});

export default AppBottomNav;
