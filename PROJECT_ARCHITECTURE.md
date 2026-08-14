# CricFlow Mobile - Architecture & AI Developer Specification

> **Notice for AI Assistants**: This document contains the definitive architecture, coding guidelines, typography rules, state management flow, and component registry for **CricFlow Mobile**. Always read and follow these specifications before making changes to the codebase.

---

## 1. Project Overview
- **App Name**: CricFlow Mobile (Bastiram Edition)
- **Tech Stack**: React Native (0.86.2) + Expo (v57) + Supabase Backend + AsyncStorage
- **Target OS**: Android, iOS, Web
- **Quick Match Architecture**: Dedicated, isolated local player database (`local_players`) & standalone scoring for local gaon/school/college/turf matches. Completely separate from official tournament records, giving public users a 100% free instant local scoring feature.

---

## 2. Mandatory Rules for AI Assistants

### 🛑 App.js Protection Rule (STRICT)
- **`App.js` MUST ALWAYS remain a clean 11-line entry point**:
  ```js
  import React from 'react';
  import { AppProviders } from './src/app/AppProviders.jsx';
  import { AppNavigator } from './src/app/AppNavigator.jsx';

  export default function App() {
    return (
      <AppProviders>
        <AppNavigator />
      </AppProviders>
    );
  }
  ```
- **RULE**: NEVER add inline UI components, state variables, or screens directly into `App.js`.
- All context providers belong in `src/app/AppProviders.jsx`.
- All screen routing belongs in `src/app/AppNavigator.jsx`.

### 🔤 Typography & Font Rules (CRITICAL)
- **Primary Font**: **SF Pro Display** (`.otf` files located in `assets/fonts/`).
- **Registered Variants**:
  - `'SFProDisplay-Regular'`
  - `'SFProDisplay-Medium'`
  - `'SFProDisplay-Bold'`
- **RULE**: NEVER combine `fontFamily: 'SFProDisplay-Regular'` with `fontWeight: 'bold'` or `fontWeight: '700'`. Doing so breaks React Native font rendering and forces fallback to system fonts (Mulish/Roboto).
- **Correct Usage**:
  - Regular Text: `fontFamily: systemFont` (`SFProDisplay-Regular`)
  - Medium Text: `fontFamily: systemFontMedium` (`SFProDisplay-Medium`)
  - Bold Text: `fontFamily: systemFontBold` (`SFProDisplay-Bold`)
  - Underline/Active states: Use accent underline indicator (`height: 2.5, backgroundColor: '#0284C7'`) instead of fake-bolding text.

---

## 3. Directory & Component Structure (Domain-Driven)

```
src/
├── components/          # MatchTabBar, MatchListScoreCard, PreInningsScorecard, WormGraph, ManhattanGraph
├── services/            # API client & Supabase match sync
├── theme.js             # Design tokens & typography definitions
└── utils/               # Cricket scoring & speech helpers
```

---

## 4. Key Components Registry

1. **`MatchTabBar.jsx`** ([src/components/MatchTabBar.jsx](file:///D:/PE/CricFlowMobile/src/components/MatchTabBar.jsx)):
   - Renders tab header (`Info`, `Live`, `Scorecard`, `Overs`, `Graphs`).
   - Uses `systemFontMedium` and renders a clean blue accent underline indicator under the active tab.

2. **`MatchListScoreCard.jsx`**:
   - Displays match summaries, team logos, live scores, and match results.

3. **`RealtimeWinBar.jsx`**:
   - Renders live winning probability predictions between Team A and Team B.

4. **`WormGraph.jsx` & `ManhattanGraph.jsx`**:
   - Visualizes run rate progression and over-by-over score distribution.

---

## 5. Development Roadmap & Discussion Decisions

- **State Management**: Centralized in `MatchContext` (`AppProviders.jsx`). Offline state synced automatically with Supabase.
- **Navigation**: Controlled via `currentScreen` state (`home`, `liveView`, `finishedView`, `scorerWizard`).
- **Future Enhancements**:
  - Horizontal swipe gesture integration for `MatchTabBar`.
  - Granular Context splitting (`MatchContext`, `NavigationContext`).

---
*Last Updated: 2026-08-10 by AI Development Lead*
