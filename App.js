import React, { useEffect } from 'react';
import { StyleSheet, View, StatusBar, LogBox } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';

// ── Components & UI Primitives ──
import { AppNavigator } from './src/navigation/AppNavigator.jsx';
import { CricGlobalToast } from './src/components/CricGlobalToast.jsx';
import { ErrorBoundary } from './src/components/ErrorBoundary.jsx';
import { MatchProvider, useMatch } from './src/context/MatchContext.jsx';
import { theme, themeColors } from './src/theme.js';

LogBox.ignoreLogs([
  '[Supabase Realtime Warning]',
  'channel error: transport failure',
  'Realtime Warning'
]);

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    'SFProDisplay-Regular': require('./assets/fonts/SFProDisplay-Regular.otf'),
    'SFProDisplay-Medium': require('./assets/fonts/SFProDisplay-Medium.otf')
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => { });
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <MatchProvider>
          <AppShell />
        </MatchProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

function AppShell() {
  const { currentScreen } = useMatch();
  const isDarkMatchScreen = currentScreen === 'scorerWizard' || currentScreen === 'finishedView' || currentScreen === 'liveView' || currentScreen === 'playerProfile';
  const shellBackgroundColor = isDarkMatchScreen ? theme.hero.bg : themeColors.appBackground;

  return (
    <View style={[styles.root, { backgroundColor: shellBackgroundColor }]}>
      <StatusBar barStyle={isDarkMatchScreen ? 'light-content' : 'dark-content'} backgroundColor={shellBackgroundColor} />
      <SafeAreaView style={[styles.safe, { backgroundColor: shellBackgroundColor }]} edges={['top', 'left', 'right']}>
        {/* CENTRAL APP NAVIGATOR & ROUTER */}
        <AppNavigator />
      </SafeAreaView>

      {/* Global Floating Toast for entire CricFlow App */}
      <CricGlobalToast />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.hero.bg },
  safe: { flex: 1, backgroundColor: theme.hero.bg }
});
