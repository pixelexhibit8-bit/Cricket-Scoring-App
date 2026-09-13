import React, { useEffect } from 'react';
import { View, StatusBar, LogBox, useColorScheme } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';

// ── Components & UI Primitives ──
import { MatchProvider } from './src/context/MatchContext.jsx';
import { AppNavigator } from './src/navigation/AppNavigator.jsx';
import { CricGlobalToast } from './src/components/CricGlobalToast.jsx';
import { ErrorBoundary } from './src/components/ErrorBoundary.jsx';
import { theme, themeColors } from './src/theme.js';

LogBox.ignoreLogs([
  '[Supabase Realtime Warning]',
  'channel error: transport failure',
  'Realtime Warning'
]);

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    'SFProDisplay-Regular': require('./assets/fonts/SFProDisplay-Regular.otf'),
    'SFProDisplay-Medium': require('./assets/fonts/SFProDisplay-Medium.otf')
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => { });
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

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
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const shellBackgroundColor = isDarkMode ? theme.hero.bg : themeColors.appBackground;

  return (
    <View style={{ flex: 1, backgroundColor: shellBackgroundColor }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={shellBackgroundColor} />
      <SafeAreaView style={{ flex: 1, backgroundColor: shellBackgroundColor }} edges={['top', 'left', 'right']}>
        {/* CENTRAL APP NAVIGATOR & ROUTER */}
        <AppNavigator />
      </SafeAreaView>

      {/* Global Floating Toast for entire CricFlow App */}
      <CricGlobalToast />
    </View>
  );
}
