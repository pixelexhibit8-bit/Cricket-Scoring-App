import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export const SCREEN_ROUTE_MAP = {
  home: 'Home',
  scorerWizard: 'ScorerConsole',
  quickMatchSetup: 'QuickMatchSetup',
  liveView: 'PublicLiveView',
  finishedView: 'FinishedMatchView',
  playerProfile: 'PlayerProfile',
  matches: 'Matches',
  rankings: 'Rankings',
  inningBreak: 'InningBreak'
};

export const ROUTE_SCREEN_MAP = {
  Home: 'home',
  ScorerConsole: 'scorerWizard',
  QuickMatchSetup: 'quickMatchSetup',
  PublicLiveView: 'liveView',
  FinishedMatchView: 'finishedView',
  PlayerProfile: 'playerProfile',
  Matches: 'matches',
  Rankings: 'rankings',
  InningBreak: 'inningBreak'
};

export function navigate(name, params) {
  if (navigationRef.isReady()) {
    const targetRoute = SCREEN_ROUTE_MAP[name] || name;
    navigationRef.navigate(targetRoute, params);
  }
}

export function goBack() {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
  }
}

export function resetToHome() {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Home' }]
      })
    );
  }
}
