# Project Rules & Architecture Guardrails

## 0. Git Remote Push Prohibition Rule (STRICT - NEVER PUSH TO GITHUB)
- **STRICT**: The AI agent MUST NEVER execute `git push` to remote GitHub or any remote repository under ANY circumstance.
- All version control operations performed by the agent MUST BE STRICTLY LOCAL (`git commit` on local branch only).
- The USER exclusively reviews, tests, and performs all git pushes manually.

## 1. App.js Protection Rule (STRICT - DO NOT TOUCH)
- `App.js` MUST ALWAYS remain a minimal 11-line entry point:
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
- **STRICT**: NEVER add UI components, state hooks, inline styles, or screens directly into `App.js`.
- All state providers MUST go in `src/app/AppProviders.jsx`.
- All screen routing MUST go in `src/app/AppNavigator.jsx`.

## 3. Modular & Lean Code Rule (NO UNNECESSARY FILE BLOAT)
- **STRICT**: NEVER create huge, bloated, monolithic files unnecessarily.
- Keep components small, modular, and focused (< 150-200 lines per file).
- Break large screens into reusable feature components.
- Do not dump inline modals, styles, or large helper functions into screen or entry point files.

## 4. Typography & Font Weight Rule (STRICT)
- In Leaderboard Rankings, lists, table rows, and player cards, ALWAYS use clean Regular/Medium typography (`systemFont` / `systemFontMedium`).
- NEVER use heavy bold fonts (`systemFontBold` or `fontWeight: 'bold'`) across table rows, ranking numbers, names, or values.
- Keep the typography sleek, minimal, and modern without aggressive bolding.

