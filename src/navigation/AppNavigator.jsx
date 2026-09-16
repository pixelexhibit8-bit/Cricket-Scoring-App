import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// ── Screen Imports ──
import { TabNavigator } from './TabNavigator.jsx';
import { ScorerConsoleScreen } from '../screens/ScorerConsoleScreen.jsx';
import { InningBreakScreen } from '../screens/InningBreakScreen.jsx';
import { PublicLiveViewScreen } from '../screens/PublicLiveViewScreen.jsx';
import { FinishedMatchViewScreen } from '../screens/FinishedMatchViewScreen.jsx';
import { MyProfileScreen } from '../screens/MyProfileScreen.jsx';
import { QuickMatchSetupScreen } from '../screens/QuickMatchSetupScreen.jsx';
import { RankingsScreen } from '../screens/RankingsScreen.jsx';
import { MenuScreen } from '../screens/MenuScreen.jsx';
import { CreateTournamentScreen } from '../screens/CreateTournamentScreen.jsx';
import { PublicSeriesViewScreen } from '../screens/PublicSeriesViewScreen.jsx';
import { AllSeriesDirectoryScreen } from '../screens/AllSeriesDirectoryScreen.jsx';

import { navigationRef } from './navigationService.js';

const Stack = createNativeStackNavigator();

// ── Main App Router & Navigator ──

export function AppNavigator() {
  return (
    <View style={styles.rootContainer}>
      {/* 1. REACT NAVIGATION NATIVE STACK CONTAINER */}
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator
          initialRouteName="MainTabs"
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: '#F7F7F7' }
          }}
        >
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen name="QuickMatchSetup" component={QuickMatchSetupScreen} />
          <Stack.Screen name="ScorerConsole" component={ScorerConsoleScreen} />
          <Stack.Screen name="PublicLiveView" component={PublicLiveViewScreen} />
          <Stack.Screen name="FinishedMatchView" component={FinishedMatchViewScreen} />
          <Stack.Screen name="PlayerProfile" component={MyProfileScreen} />
          <Stack.Screen name="InningBreak" component={InningBreakScreen} />
          <Stack.Screen name="Rankings" component={RankingsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Menu" component={MenuScreen} options={{ headerShown: false }} />
          <Stack.Screen name="CreateTournament" component={CreateTournamentScreen} />
          <Stack.Screen name="PublicSeriesView" component={PublicSeriesViewScreen} />
          <Stack.Screen name="AllSeriesDirectory" component={AllSeriesDirectoryScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#F7F7F7'
  }
});

export default AppNavigator;
