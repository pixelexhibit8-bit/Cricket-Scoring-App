import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/home/index.jsx';
import { MatchesScreen } from '../screens/MatchesScreen.jsx';
import { PublicSeriesViewScreen } from '../screens/PublicSeriesViewScreen.jsx';
import { AppBottomNav } from '../components/navigation/AppBottomNav.jsx';
import { useMatch } from '../context/MatchContext.jsx';

const Tab = createBottomTabNavigator();

function SeriesTabScreen(props) {
  return <PublicSeriesViewScreen {...props} isTab={true} />;
}

function MatchesTabScreen(props) {
  return <MatchesScreen {...props} hideBottomNav={true} />;
}

export function TabNavigator() {
  const matchCtx = useMatch();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={(props) => <AppBottomNav {...props} />}
      screenListeners={{
        state: (e) => {
          const state = e.data?.state;
          if (state) {
            const currentRoute = state.routes[state.index]?.name;
            if (currentRoute && matchCtx?.setBottomNavTab) {
              const tabId = currentRoute.toLowerCase();
              if (matchCtx.bottomNavTab !== tabId) {
                matchCtx.setBottomNavTab(tabId);
              }
            }
          }
        }
      }}
      screenOptions={{
        headerShown: false
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Matches" component={MatchesTabScreen} />
      <Tab.Screen name="Series" component={SeriesTabScreen} />
    </Tab.Navigator>
  );
}

export default TabNavigator;
