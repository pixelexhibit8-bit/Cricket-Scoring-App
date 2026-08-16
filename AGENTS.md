# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Git Remote Push Prohibition Rule - STRICT (NEVER PUSH TO GITHUB)
- **STRICT**: The AI agent MUST NEVER execute `git push` to remote GitHub or any remote repository under ANY circumstance.
- All version control operations performed by the agent MUST BE STRICTLY LOCAL (`git commit` on local branch only).
- The USER exclusively owns, reviews, and executes all remote pushes to GitHub.

# CricFlow Source Of Truth - STRICT

- Every CricFlow request from the user defaults to the Expo application, even when the user does not say "app", "mobile", or "Expo".
- Work on the web project only when the user explicitly says "web", "website", or "Vite".
- `D:\PE\CricFlowMobile` is the approved primary CricFlow application.
- Treat the existing Expo app architecture, UI patterns, components, and behavior as the source of truth.
- Always implement and verify the Expo application first.
- `D:\PE\CricFlow` is only an optional companion web version. It is acceptable to leave web unchanged unless the user explicitly requests it.
- When web is also updated, mirror the approved Expo UI and behavior faithfully. Never create a separate web design direction.
- Never delay, disturb, or compromise the Expo application to keep web in sync.
- Never report an application change as complete after editing only the Vite web project.
- Before editing, identify which project owns the screen and confirm the framework from its `package.json` and source files.

# Icon Library Rule - STRICT

This is a **Cricket App (CricFlow)**. ALWAYS use the installed icon libraries:

## React Native (CricFlowMobile)
- ALWAYS import from `@expo/vector-icons` — specifically `MaterialCommunityIcons` and `Ionicons`
- `MaterialCommunityIcons` preferred for: `cricket`, `baseball`, `bat`, `trophy`, `star-circle-outline`, `scoreboard`, `account-group`, `weather-sunny`
- `Ionicons` preferred for: `search`, `arrow-back`, `settings-outline`, `sunny-outline`, `radio-outline`, `checkmark-circle-outline`, `trophy-outline`, `cloudy-night-outline`
- NEVER use plain text emojis or Unicode characters as icons in JSX
- NEVER use `lucide-react` in React Native

## Web (CricFlow)
- ALWAYS import from `lucide-react`
- NEVER use plain text emojis or Unicode characters as icons in JSX
- NEVER use `@expo/vector-icons` in web

## Tab Labels
- Tab buttons must have BOTH an icon (from the library) AND a text label
- Sub-filter buttons must have BOTH an icon AND a text label
- No duplicate icons + emoji for the same element

# Typography & Font Weight Rule - STRICT
- In Leaderboard Rankings, lists, table rows, and player details, ALWAYS use clean Regular/Medium typography (`systemFont` / `systemFontMedium`).
- NEVER use heavy bold fonts (`systemFontBold` or `fontWeight: 'bold'`) across table rows, ranking numbers, names, or values.
- Keep the typography sleek, minimal, and modern without aggressive bolding.

# Tab Swipe Interaction - STRICT

- Every page-level tab interface in the Expo app must support horizontal swipe as well as tab presses.
- Reuse the public live-view pager behavior: native paged horizontal scrolling, synced active tab state, and an underline that follows the finger smoothly.
- The animated underline must match the measured width of the tab icon plus label; it must not jump or use a fixed short width.
- Swiping and tapping must stay synchronized, including any scrollable tab strip needed to keep the active tab visible.
- Keep active-tab colors consistent across sibling tabs unless the user explicitly requests different team or category colors.

# Match Lifecycle UI Consistency - STRICT

- Treat scorer live, public live, innings break, result, and finished-match detail as one shared match experience, not separate designs.
- Reuse shared match headers, score sections, stat rows, tab bars, pagers, colors, typography, spacing, and dividers across every lifecycle state.
- A change to a shared match UI primitive must automatically propagate everywhere it appears. Do not copy JSX into a lifecycle-specific variant when a shared component can own it.
- Finished matches must reuse the same `MatchTabBar` and native swipe pager behavior as live matches. Tab press, swipe position, active state, scroll visibility, and measured underline width must remain synchronized.
- Info, Scorecard, Overs, and Graph must stay in the approved light blue, white, and divider-led live theme.
- Completed-match Summary and scorer result must reuse one dark navy result hero with teams left/right, compact final scores, and the result on a separate bottom line. Never show that hero on Info or every finished tab.
- Do not introduce green, decorative, or card-heavy result variants.
- Finished views must render the completed match snapshot. Never show hardcoded teams, scores, players, overs, dates, competitions, or placeholder match data.
- Before the first delivery, the public Scorecard must show the declared batting team at `0-0 (0.0)`, toss winner/decision, the opponent as `Yet to bat`, a not-started visual, and the full Playing XI from the shared match model.
- Both innings selectors must remain tappable throughout the match. While the first innings is live, selecting the second innings must show its team at `0-0 (0.0)`, `Yet to bat`, the not-started state, and that team's full Playing XI.
- The first scorer delivery must automatically replace that pre-innings state with the normal live scorecard; do not maintain a separate public-only match copy.
- Every scorer delivery must write a structured `lastDelivery` into the shared match model. Public Live must replace generic freshness text with the prominent latest outcome (`3 RUNS`, `FOUR`, `WICKET`, `WIDE`, and similar) as soon as that delivery syncs.
- Show the latest delivery outcome itself at display size without a redundant `LAST BALL` caption.
- Keep all non-wicket latest-delivery outcomes green; use red only for wickets.
- On scorer Wicket press, publish `WICKET` immediately before dismissal entry is complete. After the scorer selects the dismissal type and any required fielder/run-out details, replace the pending state with the dismissed batter and full dismissal text without waiting for another delivery.
- Public Live uses one compact metadata line below the score: auto-calculated CRR on the left and only the toss winner name on the right. Do not render the old CRR/Projected/Overs stat strip.
- Do not repeat wicket or event copy in a colored banner above Current Over; the prominent latest-delivery outcome is the single event display.
- Public Live shows compact overs beside the score as `current (limit)`, for example `3.2 (5)`. Do not add a second first-innings progress sentence below it.
- Reuse `TeamIdentityMark` and the shared team model for logos. Any saved `logoUri` or known `logoKey` must automatically appear beside the batting team on Public Live and in the Scorecard hero.
- Team 1 and Team 2 always have bundled PNG fallbacks: `assets/default_team_1.png` and `assets/default_team_2.png`. Render both through equal-sized `contain` boxes with no circular crop, badge, or initials fallback.
- Team identity layout is shared: logo on the left, team name above its score, and the live delivery outcome remains on the right. Apply the same logo resolver to Public Live, Scorecard, innings break, result, Home live match, and Finished views.
- Do not show `Updated just now` during normal scoring. Only surface connection status when the public view is genuinely reconnecting.
- Verify the full lifecycle after match UI work: live scoring, innings break, chase result, scorer result, Home recent result, Matches > Finished, every finished tab by press, and every finished tab by swipe.

# Quick Match / Local Ground Scoring Architecture - STRICT

- Quick Match is an isolated, standalone feature for local gaon, school, college, and turf cricket matches.
- Its player roster (`local_players` database) and match data are completely separate from official tournament records, professional stats, or official player rankings.
- It provides a free, instant, zero-friction local scoring experience for ground users without requiring official tournament setup.

# CricFlow Product Vision & Core Architecture - STRICT

1. **Local Unofficial Ground Matches First (Quick Match)**:
   - Primary focus is free, instant, zero-friction local cricket (gully, turf, gaon, school, college).
   - Must allow adding new players on-the-fly mid-match without forcing upfront formal registration.
   - Separate feature distinction: Local Ground Matches (current priority) vs Official Tournament/League Management (future roadmap).

2. **Offline-First Fast Scoring**:
   - Scoring MUST work 100% offline with zero latency without requiring an active internet connection.
   - Match updates sync to Supabase automatically when online without blocking scorer interaction.

3. **Local Player Career Stats**:
   - Track local player career performance (runs, wickets, strike rate, boundaries, 50s, 100s, economy) over time across ground matches.

4. **Modular Foundation & Reusable Core**:
   - Perfect the Local Ground Match platform first as a solid foundation.
   - Build all UI primitives (Scorecards, Live Pagers, Overs, Graphs, Player Cards) and Database models modularly so they can be seamlessly reused for Official Tournaments & Leagues in Phase 2.
