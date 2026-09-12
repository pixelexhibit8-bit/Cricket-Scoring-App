import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export const TAB_ROUTES = {
  home: 'Home',
  Home: 'Home',
  matches: 'Matches',
  Matches: 'Matches',
  series: 'Series',
  Series: 'Series',
  mainTabs: 'Home',
  MainTabs: 'Home'
};

export const SCREEN_ROUTE_MAP = {
  home: 'Home',
  mainTabs: 'Home',
  scorerWizard: 'ScorerConsole',
  quickMatchSetup: 'QuickMatchSetup',
  liveView: 'PublicLiveView',
  finishedView: 'FinishedMatchView',
  playerProfile: 'PlayerProfile',
  matches: 'Matches',
  rankings: 'Rankings',
  inningBreak: 'InningBreak',
  menu: 'Menu',
  createTournament: 'CreateTournament',
  tournamentHub: 'TournamentHub',
  publicSeriesView: 'PublicSeriesView',
  allSeriesDirectory: 'AllSeriesDirectory',
  series: 'Series'
};

export const ROUTE_SCREEN_MAP = {
  MainTabs: 'home',
  Home: 'home',
  ScorerConsole: 'scorerWizard',
  QuickMatchSetup: 'quickMatchSetup',
  PublicLiveView: 'liveView',
  FinishedMatchView: 'finishedView',
  PlayerProfile: 'playerProfile',
  Matches: 'matches',
  Rankings: 'rankings',
  InningBreak: 'inningBreak',
  Menu: 'menu',
  CreateTournament: 'createTournament',
  TournamentHub: 'tournamentHub',
  PublicSeriesView: 'publicSeriesView',
  AllSeriesDirectory: 'allSeriesDirectory',
  Series: 'series'
};

export function navigate(name, params) {
  if (navigationRef.isReady()) {
    const tabTarget = TAB_ROUTES[name] || TAB_ROUTES[SCREEN_ROUTE_MAP[name]];
    if (tabTarget) {
      navigationRef.navigate('MainTabs', { screen: tabTarget, params });
      return;
    }

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
        routes: [{ name: 'MainTabs' }]
      })
    );
  }
}
