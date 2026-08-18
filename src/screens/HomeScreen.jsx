import React from 'react';
import {
  View,
  Keyboard,
  TouchableWithoutFeedback,
  StyleSheet
} from 'react-native';
import { AppHeader } from '../components/navigation/AppHeader.jsx';
import { AppBottomNav } from '../components/navigation/AppBottomNav.jsx';
import { MatchesScreen } from './MatchesScreen.jsx';
import { RankingsScreen } from './RankingsScreen.jsx';
import { MyProfileScreen } from './MyProfileScreen.jsx';

export function HomeScreen(props) {
  const {
    bottomNavTab = 'home',
    setBottomNavTab,
    openScorerScreen,
    searchQuery = '',
    setSearchQuery,
    TOP_BATTERS = [],
    TOP_BOWLERS = [],
    TOP_ALLROUNDERS = [],
    refreshing = false,
    handlePullToRefresh = null,
    setSelectedPlayerProfile,
    setCurrentScreen,
    finishedArchive = [],
    activeMatch,
    setSelectedMatch,
    onJoinMatchByCode
  } = props;

  // 1. If bottom tab is "matches" -> Render MatchesScreen
  if (bottomNavTab === 'matches') {
    return <MatchesScreen {...props} />;
  }

  // 2. If bottom tab is "rankings" -> Render RankingsScreen with bottom nav
  if (bottomNavTab === 'rankings') {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <RankingsScreen
          topBatters={TOP_BATTERS}
          topBowlers={TOP_BOWLERS}
          topAllRounders={TOP_ALLROUNDERS}
          onSelectPlayer={(playerName, meta) => {
            if (setSelectedPlayerProfile) setSelectedPlayerProfile({ name: playerName, ...meta });
            if (setCurrentScreen) setCurrentScreen('playerProfile');
          }}
          refreshing={refreshing}
          onRefresh={handlePullToRefresh}
        />
        <AppBottomNav
          activeTab={bottomNavTab}
          onTabChange={(tabId) => {
            if (setBottomNavTab) setBottomNavTab(tabId);
          }}
        />
      </View>
    );
  }

  // 3. If bottom tab is "profile" -> Render MyProfileScreen with bottom nav
  if (bottomNavTab === 'profile') {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <MyProfileScreen
          finishedMatches={finishedArchive || []}
          activeMatch={activeMatch}
          onStartQuickMatch={openScorerScreen}
          onJoinMatchByCode={onJoinMatchByCode}
          onSelectMatch={(m) => {
            if (setSelectedMatch) setSelectedMatch(m);
            if (setCurrentScreen) setCurrentScreen('finishedView');
          }}
        />
        <AppBottomNav
          activeTab={bottomNavTab}
          onTabChange={(tabId) => {
            if (setBottomNavTab) setBottomNavTab(tabId);
          }}
        />
      </View>
    );
  }

  // 4. Clean Blank Home Screen (Tap anywhere to dismiss keyboard)
  return (
    <View style={styles.container}>
      {/* REUSABLE TOP APP HEADER */}
      <AppHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        placeholder="Search CricFlow..."
      />

      {/* BLANK CANVAS (Tap anywhere dismisses keyboard) */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.body} />
      </TouchableWithoutFeedback>

      {/* INDUSTRIAL STANDARD BOTTOM NAVIGATION BAR */}
      <AppBottomNav
        activeTab={bottomNavTab}
        onTabChange={(tabId) => {
          if (setBottomNavTab) setBottomNavTab(tabId);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  body: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  }
});

export default HomeScreen;
