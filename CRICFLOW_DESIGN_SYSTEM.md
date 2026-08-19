# 🏏 CricFlow Mobile Design System (V1)
> **Single Source of Truth for Colors, Typography, Components, Spacing, Icons, and Screen Architecture.**  
> *Any developer or AI building a new screen or modal in CricFlow MUST strictly follow this document without inventing new ad-hoc styles.*

---

## 📑 Table of Contents
1. [Core Design Philosophy](#1-core-design-philosophy)
2. [Typography & Fonts](#2-typography--fonts)
3. [Type Scale & Line Heights](#3-type-scale--line-heights)
4. [Color System & Theme Tokens](#4-color-system--theme-tokens)
5. [Spacing & Layout System](#5-spacing--layout-system)
6. [Border Radius & Shapes](#6-border-radius--shapes)
7. [Shadows & Elevation Hierarchy](#7-shadows--elevation-hierarchy)
8. [Icon System & Library Rules](#8-icon-system--library-rules)
9. [Buttons & Touch Targets](#9-buttons--touch-targets)
10. [Cards & Containers](#10-cards--containers)
11. [Inputs & Form Controls](#11-inputs--form-controls)
12. [Badges & Ball Outcome Tokens](#12-badges--ball-outcome-tokens)
13. [Modals & Overlay Dialogs](#13-modals--overlay-dialogs)
14. [Navigation, Headers & App Shell](#14-navigation-headers--app-shell)
15. [Tabs & Native Swipeable Pagers](#15-tabs--native-swipeable-pagers)
16. [Component Interactive States](#16-component-interactive-states)
17. [Dark vs Light Screen Surfaces](#17-dark-vs-light-screen-surfaces)
18. [Screen Boilerplate Template](#18-screen-boilerplate-template)
19. [Strict DOs and DON'Ts](#19-strict-dos-and-donts)

---

## 1. 🏛️ Core Design Philosophy

* **Industrial Clean & Border-Led:** We use crisp, thin 1px borders (`#E2E8F0`, `#123A56`, `#CBD5E1`) and flat cards instead of heavy blurry drop-shadows.
* **CREX Match Atmosphere:** Dark, deep navy match headers (`#071B2C`) for live & finished matches combined with crisp, high-contrast light surfaces (`#F8FAFC`, `#FFFFFF`) for lists, scorecards, and management views.
* **Minimal Sleek Typography:** We avoid aggressive, heavy bolding in tables, rankings, and stats rows. Names, overs, economy, and rankings strictly use sleek Medium/Regular typography.
* **Zero Unicode Emojis in JSX:** All icons must be rendered using vector icons from `@expo/vector-icons` (`MaterialCommunityIcons` & `Ionicons`).

---

## 2. 🔤 Typography & Fonts

CricFlow uses custom **SF Pro Display** fonts loaded at app startup in [`App.js`](file:///d:/PE/CricFlowMobile/App.js).

| Token Name | Font File | Intended Usage |
|---|---|---|
| `systemFont` / `fonts.regular` | `SFProDisplay-Regular.otf` | Paragraphs, meta text, secondary labels, commentary, ball details |
| `systemFontMedium` / `fonts.medium` | `SFProDisplay-Medium.otf` | Player names, rankings rows, tab labels, table values, bowler overs |
| `systemFontBold` / `fonts.bold` | `SFProDisplay-Bold.otf` | Primary hero scores, page titles, action buttons, ball badges |

### ⚠️ Android Custom Font Rule (CRITICAL)
In React Native Android, custom fonts already embed their weight.
* **DO:** `fontFamily: systemFontMedium` or `fontFamily: systemFontBold`.
* **DON'T:** Combine `fontFamily: systemFontBold` with `fontWeight: 'bold'` on Android, as this triggers synthetic double-bold rendering artifacts.

---

## 3. 📏 Type Scale & Line Heights

```javascript
import { typeScale } from '../theme.js';
```

| Token | Size | Line Height | Usage |
|---|:---:|:---:|---|
| `typeScale.micro` | `11px` | `14px` | Over numbers, timestamp chips, legal ball labels |
| `typeScale.caption` | `12px` | `16px` | Section subtitles, secondary captions, hints |
| `typeScale.label` | `13px` | `17px` | Table headers, form field labels, badge text |
| `typeScale.body` | `14px` | `20px` | Standard body text, player details, modal copy |
| `typeScale.name` | `15px` | `20px` | Player names, squad roster items, list titles |
| `typeScale.title` | `17px` | `22px` | Card headers, modal titles, sheet headers |
| `typeScale.pageTitle` | `19px` | `24px` | Top app header titles, section headings |
| `typeScale.score` | `30px` | `34px` | Public live scorecard hero score (`142-4`) |
| `typeScale.scorerScore`| `38px` | `42px` | Scorer console big live score |
| `typeScale.heroScore` | `46px` | `50px` | Large prominent match header score |
| `typeScale.keypad` | `26px-36px` | `36px`| Touchpad number keys (0, 1, 2, 3) |

---

## 4. 🎨 Color System & Theme Tokens

```javascript
import { theme, themeColors } from '../theme.js';
```

### 4.1. Core Brand & Light Theme (Standard Screens)
```javascript
theme.light = {
  bg: '#F8FAFC',              // Main screen background
  cardBg: '#FFFFFF',          // Card & list item background
  cardBorder: '#E2E8F0',      // Standard subtle card border
  cardBorderDark: '#CBD5E1',  // Emphasized card / input border
  textPrimary: '#0F172A',     // Primary title & score text
  textSecondary: '#475569',   // Body & label text
  textMuted: '#64748B',       // Subtitles & helper text
  textSubtle: '#94A3B8',      // Inactive tabs & placeholder text
  primary: '#0284C7',         // Primary CricFlow brand blue
  primaryDark: '#0369A1',     // Active / pressed blue state
  primaryLight: '#E0F2FE',    // Light blue pill & chip background
  primarySurface: '#F0F9FF',  // Subtle selected row background
};
```

### 4.2. CREX Dark Match Hero Theme (Live & Finished Match Headers)
```javascript
theme.hero = {
  bg: '#071B2C',              // Deep navy match hero background
  cardBg: '#0B2238',          // Hero inner score card background
  border: '#123A56',          // Hero card border
  divider: '#1E4D6B',         // Vertical & horizontal match dividers
  text: '#FFFFFF',            // High contrast white text
  subtext: '#9FC4D7',         // Muted ice-blue meta & over text
};
```

### 4.3. Scorer Console Theme (High-Contrast Scoring UI)
```javascript
theme.scorer = {
  bg: '#0F172A',              // Slate dark scorer background
  card: '#1E293B',            // Dark pad card background
  border: '#334155',          // Pad divider border
  text: '#FFFFFF',            // High contrast white text
  textMuted: '#94A3B8',       // Muted pad text
  accentSky: '#38BDF8',       // Bright interactive elements
  undoBg: '#78350F',          // Undo button amber background
  undoBorder: '#F59E0B',      // Undo border
  undoText: '#FDE68A',        // Undo text
};
```

### 4.4. Ball Outcomes & Semantic Badges
```javascript
theme.outcomes = {
  dot: '#E2E8F0',             // Dot ball background
  dotText: '#0F172A',         // Dot ball text
  four: '#2563EB',            // 4 FOUR boundary blue
  six: '#7C3AED',             // 6 SIX boundary purple
  wicket: '#EF4444',          // Wicket red badge
  wicketDark: '#E11D48',      // Wicket button red
  wide: '#B45309',            // Wide ball amber
  noBall: '#D97706',          // No ball orange
  winTeamA: '#2563EB',        // Win bar team A
  winTeamB: '#059669',        // Win bar team B
  accentGold: '#F59E0B',      // Trophy / POTM gold
};
```

---

## 5. 📐 Spacing & Layout System

```javascript
import { spacing } from '../theme.js';
```

| Token | Value | Standard Usage |
|---|:---:|---|
| `spacing.xs` | `4px` | Micro gaps between icon and label, chip padding |
| `spacing.sm` | `8px` | Gap between list items, card inner vertical spacing |
| `spacing.md` | `12px`| Standard row gap, small card padding |
| `spacing.lg` | `16px`| Screen horizontal padding, standard card padding |
| `spacing.xl` | `20px`| Section separation margin, modal internal padding |
| `spacing.xxl` | `24px`| Major dashboard section gaps |
| `spacing.xxxl`| `32px`| Empty state padding, auth splash margin |

---

## 6. 🔲 Border Radius & Shapes

```javascript
import { radius } from '../theme.js';
```

| Token | Value | Standard Usage |
|---|:---:|---|
| `radius.xs` | `4px` | Over ball chips, sub-stat chips |
| `radius.sm` | `6px` | Compact tag badges, status pills |
| `radius.md` | `8px` | Secondary buttons, dropdown triggers |
| `radius.lg` | `12px`| Standard cards, input fields, timeline containers |
| `radius.xl` | `14px`| Match score cards, player info cards |
| `radius.xxl`| `16px`| Modal dialog shells, floating toast cards |
| `radius.pill`| `999px`| Circular avatars, pill action buttons, coin flip |

---

## 7. 🌫️ Shadows & Elevation Hierarchy

CricFlow enforces a **border-led flat design** for maximum performance and crisp rendering across Android and iOS:
* **Cards & Table Rows:** `borderWidth: 1, borderColor: '#E2E8F0', elevation: 0`.
* **Floating Bottom Navigation:** `elevation: 8, borderTopWidth: 1, borderTopColor: '#E2E8F0'`.
* **Global Toast & Popups:** `elevation: 12, shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 12`.

---

## 8. 🔮 Icon System & Library Rules (STRICT)

1. **Always import from `@expo/vector-icons`:**
   * `MaterialCommunityIcons` for: `cricket`, `baseball`, `bat`, `trophy`, `scoreboard`, `account-group`, `weather-sunny`.
   * `Ionicons` for: `search`, `arrow-back`, `settings-outline`, `flash`, `checkmark-circle`, `close`, `refresh`, `chevron-forward`.
2. **NEVER use plain-text Unicode Emojis in JSX.**
3. **Tab & Filter Labels MUST have BOTH an icon AND a text label.**

---

## 9. 🔘 Buttons & Touch Targets

### Standard Button Structure
```jsx
// Primary Action Button
<TouchableOpacity
  activeOpacity={0.8}
  style={{
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 44
  }}
>
  <MaterialCommunityIcons name="cricket" size={18} color="#FFFFFF" />
  <Text style={{ color: '#FFFFFF', fontSize: 13.5, fontFamily: systemFontBold }}>
    START QUICK MATCH
  </Text>
</TouchableOpacity>
```

---

## 10. 🃏 Cards & Containers

### Standard Content Card
```jsx
<View style={{
  backgroundColor: '#FFFFFF',
  borderRadius: 14,
  borderWidth: 1,
  borderColor: '#E2E8F0',
  padding: 14,
  overflow: 'hidden'
}}>
  {/* Card Content */}
</View>
```

---

## 11. ⌨️ Inputs & Form Controls

```jsx
<TextInput
  style={{
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: systemFont,
    color: '#0F172A'
  }}
  placeholderTextColor="#94A3B8"
/>
```

---

## 12. 🏷️ Badges & Ball Outcome Tokens

| Outcome | Color | Background | Text Style |
|---|---|---|---|
| **0 (Dot)** | `#0F172A` | `#E2E8F0` | `11px systemFontBold tabular-nums` |
| **1, 2, 3 (Runs)** | `#334155` | `#F1F5F9` | `11px systemFontBold tabular-nums` |
| **4 (Four)** | `#FFFFFF` | `#2563EB` | `11px systemFontBold tabular-nums` |
| **6 (Six)** | `#FFFFFF` | `#7C3AED` | `11px systemFontBold tabular-nums` |
| **W (Wicket)** | `#FFFFFF` | `#EF4444` | `11px systemFontBold tabular-nums` |
| **Wd / Nb (Extras)** | `#92400E` | `#FEF3C7` | `10px systemFontBold tabular-nums` |

---

## 13. 🪟 Modals & Overlay Dialogs

* **Backdrop:** `backgroundColor: 'rgba(7, 27, 44, 0.72)'`.
* **Shell Card:** `backgroundColor: '#FFFFFF'`, `borderRadius: 16`, `maxWidth: 420`, `padding: 16`.
* **Modal Header:** Title on left (`systemFontBold`, 16px), circular Close Button on right (`Ionicons name="close"`, 20px).

---

## 14. 🔝 Navigation, Headers & App Shell

* **Root App Shell:** [`App.js`](file:///d:/PE/CricFlowMobile/App.js) sets root background dynamically (`#071B2C` for live/finished matches; `#FFFFFF` for standard screens).
* **Top Header:** [`AppHeader.jsx`](file:///d:/PE/CricFlowMobile/src/components/navigation/AppHeader.jsx) handles search, logo, and action icons.
* **Bottom Nav:** [`AppBottomNav.jsx`](file:///d:/PE/CricFlowMobile/src/components/navigation/AppBottomNav.jsx) handles Home, Matches, Rankings, Profile with active blue tint (`#0284C7`).

---

## 15. 📑 Tabs & Native Swipeable Pagers

Every tabbed screen (Live match, Finished match, Rankings) MUST use [`MatchTabBar.jsx`](file:///d:/PE/CricFlowMobile/src/components/MatchTabBar.jsx) with:
* Native horizontal paging enabled (`pagingEnabled`).
* Finger-tracking animated underline indicator matching measured tab text width.
* Synchronized state on tab press and swipe momentum.

---

## 16. 🔄 Component Interactive States

* **Pressed State:** Use `ScalePressable` from [`MotionSystem.jsx`](file:///d:/PE/CricFlowMobile/src/components/motion/MotionSystem.jsx) with `activeScale={0.97}`.
* **Disabled State:** `opacity: 0.45`, `pointerEvents: 'none'`.
* **Loading State:** `<ActivityIndicator size="small" color="#0284C7" />`.

---

## 17. 🌑 Dark vs Light Screen Surfaces

| Screen Name | Root Background | Header Style | Card Theme |
|---|---|---|---|
| **HomeScreen** | `#F8FAFC` | Light AppHeader | `#FFFFFF` with `#E2E8F0` border |
| **MatchesScreen** | `#F8FAFC` | Light AppHeader | `#FFFFFF` with `#E2E8F0` border |
| **RankingsScreen** | `#F8FAFC` | Light MatchTabBar | `#FFFFFF` table with `#F1F5F9` dividers |
| **PublicLiveViewScreen** | `#071B2C` (Top) / `#F8FAFC` | Dark CREX Hero | Light Scorecards / Dark Graph surfaces |
| **FinishedMatchViewScreen**| `#071B2C` (Top) / `#F8FAFC` | Dark Result Hero | Light Summary & Scorecards |
| **ScorerConsoleScreen** | `#071B2C` (Top) / `#EBF0F5` | Dark CREX Hero | Off-white cards + Clean Touchpad |
| **MyProfileScreen** | `#F8FAFC` | Light Profile Header | `#FFFFFF` with stats cards |
| **QuickMatchSetupScreen** | `#071B2C` (Shell) / `#FFFFFF` | Step Banner | Clean forms & team selectors |

---

## 18. 📦 Screen Boilerplate Template

When creating any new screen, use this clean template:

```jsx
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  systemFont,
  systemFontMedium,
  systemFontBold,
  theme
} from '../theme.js';

export function ExampleScreen({ onBack }) {
  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={theme.light.textPrimary} />
          </TouchableOpacity>
        ) : null}
        <Text style={styles.headerTitle}>Screen Title</Text>
      </View>

      {/* Content Scroll */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Section Title</Text>
          <Text style={styles.cardBody}>Content formatted with systemFont.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.light.bg
  },
  header: {
    backgroundColor: theme.light.cardBg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.light.cardBorder,
    gap: 12
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: systemFontBold,
    color: theme.light.textPrimary
  },
  scroll: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    gap: 12
  },
  card: {
    backgroundColor: theme.light.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.light.cardBorder,
    padding: 14
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: systemFontBold,
    color: theme.light.textPrimary,
    marginBottom: 4
  },
  cardBody: {
    fontSize: 13.5,
    fontFamily: systemFont,
    color: theme.light.textSecondary,
    lineHeight: 19
  }
});

export default ExampleScreen;
```

---

## 19. 🚫 Strict DOs and DON'Ts

| DO ✅ | DON'T ❌ |
|---|---|
| Import fonts from `src/theme.js` (`systemFont`, `systemFontMedium`, `systemFontBold`). | Do NOT use default system fonts or arbitrary font family names. |
| Use sleek Medium/Regular typography in tables and ranking lists. | Do NOT apply aggressive bolding (`systemFontBold`) across table rows. |
| Use `@expo/vector-icons` (`MaterialCommunityIcons` & `Ionicons`). | Do NOT use raw Unicode emojis or characters as icons in JSX. |
| Reuse [`MatchTabBar.jsx`](file:///d:/PE/CricFlowMobile/src/components/MatchTabBar.jsx) for all page-level tabs with native swipe pagers. | Do NOT invent non-swipeable, static tab strips. |
| Use 1px border-led flat hierarchy (`#E2E8F0`, `#CBD5E1`). | Do NOT apply heavy, blurry drop shadows on standard cards. |
| Test touch targets with a minimum height of `44px`. | Do NOT create tiny, cramped buttons that are hard to tap on ground devices. |
