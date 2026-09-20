import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { systemFontMedium, systemFontBold } from '../../theme.js';
import { useMatch } from '../../context/MatchContext.jsx';

import { ScalePressable } from '../motion/MotionSystem.jsx';

export function AppBottomNav(props) {
  const { activeTab, onTabChange, state, navigation } = props;
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 6 : 4);

  const matchCtx = useMatch();
  const activeTournament = matchCtx?.activeTournament;

  const dynamicSeriesLabel = useMemo(() => {
    if (!activeTournament) return 'Series';
    if (activeTournament.shortCode) return String(activeTournament.shortCode).toUpperCase();
    if (activeTournament.shortName) return String(activeTournament.shortName).toUpperCase();

    const name = String(activeTournament.name || activeTournament.title || '').trim();
    if (!name) return 'Series';

    const words = name.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return words.map(w => w[0].toUpperCase()).join('').slice(0, 4);
    }
    return name.length <= 6 ? name : name.slice(0, 4).toUpperCase();
  }, [activeTournament]);

  const isReactNavigation = Boolean(state && navigation);
  const currentTab = isReactNavigation
    ? (state.routes[state.index]?.name || 'Home').toLowerCase()
    : (activeTab || 'home').toLowerCase();

  const tabs = [
    {
      id: 'home',
      label: 'Home',
      routeName: 'Home',
      activeIcon: 'home',
      inactiveIcon: 'home-outline',
      isMCI: false
    },
    {
      id: 'matches',
      label: 'Matches',
      routeName: 'Matches',
      activeIcon: 'cricket',
      inactiveIcon: 'cricket',
      isMCI: true
    },
    {
      id: 'series',
      label: dynamicSeriesLabel,
      routeName: 'Series',
      activeIcon: 'trophy',
      inactiveIcon: 'trophy-outline',
      isMCI: true
    }
  ];

  const handleTabPress = (tab) => {
    if (isReactNavigation) {
      const route = state.routes.find(
        (r) => r.name.toLowerCase() === tab.id.toLowerCase()
      );
      if (route) {
        const isFocused = state.index === state.routes.indexOf(route);
        const event = navigation.emit({
          type: 'tabPress',
          target: route.key,
          canPreventDefault: true,
        });

        if (!isFocused && !event.defaultPrevented) {
          navigation.navigate(route.name);
        }
      }
    } else if (onTabChange) {
      onTabChange(tab.id);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: bottomPadding }]}>
      <View style={styles.navRow}>
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <ScalePressable
              key={tab.id}
              onPress={() => handleTabPress(tab)}
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
    borderTopWidth: 0,
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.02,
    shadowRadius: 3
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
    fontSize: 12.5,
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
