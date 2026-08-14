# CricFlow Mobile - Comprehensive QA Report

**Test date:** 08 August 2026  
**Application:** CricFlowMobile 1.0.0  
**Primary target:** Expo SDK 57, React Native 0.86.2, React 19.2.3  
**Source reviewed:** `App.js` (4,864 lines), `mockData.js`, Expo configuration, assets, dependencies  
**Recommendation:** **NO-GO**

## 1. Executive Summary

CricFlow has a usable visual foundation and the principal happy path is present: create/score an innings, record common wickets, move through an innings break, run a chase, declare a winner, and display public score views. Android and iOS export successfully, and Expo's project health checks pass.

The application is not production ready. Testing found failures that can corrupt or permanently lose match data. The most serious problems are:

1. All active and finished match data is memory-only and is lost after an app restart or refresh.
2. The default live-sync design cannot work between real devices and has no authentication or integrity protection.
3. Team ownership breaks for the built-in match, allowing opponent players to bat and bowl for both teams.
4. A wide (`Wd`) is treated as a wicket in over summaries and reconstructed bowling figures.
5. Several normal cricket scoring cases cannot be entered accurately, including multi-run extras and runs off a no-ball.

**Defects logged:** 26  
**Critical:** 3 | **High:** 10 | **Medium:** 11 | **Low:** 2  
**Production readiness score:** **31/100**

## 2. Application Overview

Features discovered during testing:

- Home dashboard with active and recent match cards
- Matches area with Live, Finished, and Rankings tabs
- Weather and scorer profile areas
- Three-step match setup: teams/squads, toss, opening players
- Ball-by-ball scorer with runs, extras, wickets, undo/redo, retire, bowler change, and speech
- Wicket workflows for bowled, caught, LBW, run out, stumped, and hit wicket
- Innings break with target, opening batters, and opening bowler selection
- Public match view with Info, Live, Scorecard, Overs, and Graph tabs
- Playing XI full-screen modal and inning selectors
- Match result, final scorecard, top performers, fall of wickets, partnerships, over history, and graphs
- One-second HTTP polling intended for scorer/public synchronization

## 3. Testing Strategy

Testing combined:

- Source-code and state-model review
- Dependency and supply-chain audit
- Expo configuration and compatibility checks
- Android and iOS production-bundle export smoke tests
- Real-user happy-path testing from first innings through match result
- Power-user testing of undo/redo, mid-over changes, inning selectors, public tabs, and archive reopening
- Cricket-rule edge cases: wides, no-balls, byes, leg-byes, run outs, over completion, strike changes, and chase completion
- Malicious-user review of remote match ingestion, scorer authorization, unbounded input, and exposed credentials
- Responsive visual testing at 320x568, 390x844, and 768x1024
- Restart/reload recovery testing
- Accessibility, performance, and release-readiness review

### Environment And Tools

- Expo CLI / Metro
- Expo Doctor
- Expo dependency checker
- Expo Android and iOS export
- In-app Browser automation against the same Expo/React Native application through React Native Web
- Static PowerShell and `rg` inspection
- `npm audit --omit=dev`

No controllable Android emulator, `adb`, Maestro, or Detox runtime was installed on the test machine. Native bundles were built, but touch-only swipe physics, native Alert callbacks, audible TTS output, background/foreground OS behavior, and physical-device screen-reader behavior remain native-device test gaps.

## 4. Build And Smoke Results

| Check | Result |
|---|---|
| `npx expo-doctor` | Pass, 20/20 checks |
| `npx expo install --check` | Pass, dependencies reported compatible |
| Android Expo export | Pass |
| iOS Expo export | Pass |
| App launch and navigation | Pass in Expo web runtime |
| Runtime crash during tested happy path | None |
| Automated unit/integration/E2E suite | Missing |
| Lint/type-check scripts | Missing |
| Dependency security audit | Fail, 18 known advisories |

## 5. Bugs Found

### QA-001 - Match Data Is Lost After Restart

**Severity:** Critical | **Priority:** P0  
**Evidence:** [bug-data-lost-after-reload.png](qa-evidence/bug-data-lost-after-reload.png)

**Steps to reproduce**

1. Finish the Salem Spartans vs Kovai Kings match.
2. Confirm the 54-0 result appears under Finished matches.
3. Reload the app.

**Expected:** The finished match and its scorecard remain saved. An interrupted live match should also resume.  
**Actual:** The archive disappears and the app restores the hard-coded 46-2 demo match.

**Root cause:** Match, archive, undo, and setup state exist only in React state. `activeMatch` is initialized from a literal demo object at `App.js:696`; `finishedMatches` is derived from one in-memory `selectedMatch` at `App.js:672`. No AsyncStorage, SQLite, server persistence, or recovery journal exists.

**Recommendation:** Persist every accepted delivery transactionally, add schema/version migration, restore on startup, and maintain an append-only match archive. Test force-close recovery after every scoring action.

### QA-002 - Live Public Synchronization Is Not Deployable Or Trustworthy

**Severity:** Critical | **Priority:** P0

**Steps to reproduce**

1. Use the default configuration on a physical phone.
2. Score a delivery and open the public view on another device.
3. Observe requests to `http://localhost:3001/api/match`.

**Expected:** Both devices connect to an authenticated shared match service and receive ordered updates.  
**Actual:** `localhost` resolves to each individual phone. In the test environment the URL returned the Vite HTML page, not match JSON, and errors were silently ignored. No matching API implementation exists in the Expo repository.

**Root cause:** Hard-coded HTTP fallback at `App.js:83`; one-second GET polling at `App.js:847-865`; fire-and-forget POST at `App.js:867-874`. There is no authentication, TLS requirement, match ID, version, sequence number, conflict resolution, timeout, retry queue, or durable acknowledgement.

**Security impact:** If an endpoint is supplied, any caller can overwrite a match. A response is accepted after only checking `matchTitle`, `innings`, and one `battingTeam`, so malformed or hostile arrays/strings can replace trusted state.

**Recommendation:** Build an authenticated HTTPS API with match-scoped authorization, server-side schema validation, monotonic event sequence IDs, idempotency keys, optimistic concurrency, and offline retry. Never use `localhost` as a device default.

### QA-003 - Opponent Players Can Be Assigned To The Wrong Team

**Severity:** Critical | **Priority:** P0  
**Evidence:** [bug-wrong-team-new-batter.png](qa-evidence/bug-wrong-team-new-batter.png), [innings-break.png](qa-evidence/innings-break.png), [final-scorecard.png](qa-evidence/final-scorecard.png), [playing-xi-modal.png](qa-evidence/playing-xi-modal.png)

**Steps to reproduce**

1. Open the seeded Salem Spartans vs Kovai Kings match.
2. Record a wicket for Salem.
3. Open the new-batter selector.
4. Select Prithvi Shaw, an opponent player.
5. Finish the innings and inspect second-innings openers/bowler and the final scorecard.

**Expected:** Only Salem players can replace a Salem batter; only the fielding team's players can bowl.  
**Actual:** Kovai/Sadokan-B players are offered for Salem. The same players can represent both teams. Final scorecards then place players and top performers under incorrect teams.

**Root cause:** The seed match has Salem/Kovai names but no `playingXI`. Roster fallback compares those names with local setup names `Sadokan A/B` at `App.js:818-829`, so it selects the wrong local array. The Playing XI modal has a similar fallback at `App.js:3456-3465`.

**Recommendation:** Store immutable team IDs and player-team membership in every match. Remove name-based joins. Refuse any batter/bowler not owned by the correct playing XI.

### QA-004 - Wide Ball Is Parsed As A Wicket

**Severity:** High | **Priority:** P1  
**Evidence:** [bug-bye-no-strike-rotation.png](qa-evidence/bug-bye-no-strike-rotation.png), [final-scorecard.png](qa-evidence/final-scorecard.png)

**Steps to reproduce**

1. Record `WIDE`, `NO BALL`, `+1 BYE`, then complete the over.
2. Change bowler or finish the match.
3. Inspect over runs, wicket color, reconstructed spell, and summary.

**Expected:** The over contains 3 team runs, zero wickets, and the wide is charged to the bowler.  
**Actual:** `Wd` is styled as a red wicket, omitted from the over run total, and can add a phantom wicket when bowling figures are rebuilt. The tested over showed 2 runs instead of 3.

**Root cause:** Multiple paths use `token.includes('W')`; `Wd` therefore matches wicket logic (`App.js:48`, `App.js:203`, `App.js:1204-1208`, and several render paths).

**Recommendation:** Replace string inference with structured delivery fields such as `{isWicket, wides, noBalls, byes, batterRuns}`. Never derive cricket rules from display tokens.

### QA-005 - Common Extras Cannot Be Scored Correctly

**Severity:** High | **Priority:** P1

**Steps to reproduce**

1. Try to enter two wides, five wides, a no-ball plus boundary, two/three/four byes, or two/three/four leg-byes.
2. Try to mark and enforce a free hit after a front-foot no-ball.

**Expected:** All normal delivery outcomes are representable and produce correct batter, bowler, team, ball, and strike data.  
**Actual:** The console exposes only one-wide, base no-ball, one-bye, one-leg-bye, and five-penalty actions. There is no compound-delivery editor or free-hit state.

**Root cause:** The UI models outcomes as one-button tokens, not a structured delivery form. The internal no-ball path would also suppress batter runs because all extras force `batsmanRuns` to zero at `App.js:1073`.

**Recommendation:** Add a delivery composer supporting bat runs, extra type/count, wicket legality, crossing, free hit, and corrections. Cover it with a cricket scoring rules matrix.

### QA-006 - Odd Bye And Leg-Bye Do Not Rotate Strike

**Severity:** High | **Priority:** P1  
**Evidence:** [bug-bye-no-strike-rotation.png](qa-evidence/bug-bye-no-strike-rotation.png)

**Steps to reproduce**

1. Note the striker.
2. Record `+1 BYE` or `+1 LEG BYE` before the over ends.

**Expected:** The batters exchange ends.  
**Actual:** The same batter remains on strike.

**Root cause:** Strike rotation uses `batsmanRuns % 2` at `App.js:1186`, which is zero for byes/leg-byes. It should use completed running/crossing data.

### QA-007 - Mid-Over Bowler Change Resets And Reattributes The Spell

**Severity:** High | **Priority:** P1  
**Evidence:** [bug-mid-over-bowler-reset.png](qa-evidence/bug-mid-over-bowler-reset.png)

**Steps to reproduce**

1. Record one or more deliveries in an over.
2. Tap Change beside the current bowler.
3. Select another bowler.

**Expected:** Either disallow a normal bowler change mid-over, or explicitly split the over while preserving both spells.  
**Actual:** The new bowler starts at 0.0/0 and the existing partial over is later attributed to that bowler.

**Root cause:** `handleNewBowler` reconstructs only from completed `overHistory` and ignores the current partial over (`App.js:1406-1425`).

### QA-008 - Retired Batter Is Not Recorded As Retired

**Severity:** High | **Priority:** P1

**Steps to reproduce**

1. Tap Retire for an on-pitch batter.
2. Select a replacement.
3. Inspect the scorecard and available-batter list.

**Expected:** The batter is marked retired/retired hurt with the correct status and cannot be silently reused unless the selected rule allows return.  
**Actual:** The action only opens the new-batter modal. It does not update dismissal/status, the retired set, pending end, partnership, or history.

**Root cause:** `handleRetireBatsman` only speaks and calls `setWicketPending(true)` (`App.js:1433-1437`).

### QA-009 - Match Setup Accepts Invalid Or Destructive Values

**Severity:** High | **Priority:** P1

**Steps to reproduce**

1. Enter blank or identical team names.
2. Enter blank, zero, negative, decimal, or extremely large overs.
3. Continue to the toss and start flow.

**Expected:** Inline validation blocks invalid names, duplicate team identity, invalid overs, inadequate squads, duplicate players, and oversized input.  
**Actual:** Step 1 always advances. `parseInt` is used only when the match starts, without validation. Identical names overwrite one key in `playingXI`; `NaN` overs can create a match that never ends.

**Root cause:** Unconditional Next action at `App.js:3699`; unchecked parse at `App.js:971`; object keys are team display names at `App.js:976-979`. Text inputs have no `maxLength`.

### QA-010 - Scorer Authorization Is Missing And PIN Is Public

**Severity:** High | **Priority:** P0  
**Evidence:** [profile-screen.png](qa-evidence/profile-screen.png)

**Steps to reproduce**

1. Open Profile.
2. Read `Default Scorer PIN: 1234`.
3. Open Start Scoring without any authentication challenge.

**Expected:** Scorer privileges require authenticated, revocable authorization; secrets are never displayed.  
**Actual:** The PIN is hard-coded in plaintext at `App.js:4205-4206` and is not used to protect scoring or sync.

**Recommendation:** Remove the fake PIN. Implement real account/session or match-scoped scorer authorization with rate limiting and audit logs.

### QA-011 - Finished Match Archive Keeps Only One In-Memory Match

**Severity:** High | **Priority:** P1  
**Evidence:** [finished-matches.png](qa-evidence/finished-matches.png)

**Expected:** Every completed match is appended to a durable archive.  
**Actual:** `finishedMatches` is either `[selectedMatch]` or an empty constant database (`App.js:672`). Completing another match replaces the previous in-memory item.

### QA-012 - Watermarked Stock Artwork Ships As Default Team Logos

**Severity:** High | **Priority:** P1

**Expected:** Original or properly licensed clean assets.  
**Actual:** `assets/default_team_1.png` visibly repeats the `pngtree` watermark; the default assets are displayed throughout public and result views.

**Risk:** Brand damage and likely licensing/commercial-use exposure.

### QA-013 - Dependency Audit Reports 18 Known Vulnerabilities

**Severity:** High | **Priority:** P1

`npm audit --omit=dev` reports **11 high** and **7 moderate** advisories across Expo/Metro/configuration tooling, React Native transitive packages, `image-size`, `uuid`, and `xcode`. No critical advisory was reported. NPM's suggested automatic changes are incompatible major/downgrade changes and must not be applied blindly.

**Recommendation:** Reconcile with official Expo SDK releases/advisories, upgrade through supported Expo versions, generate an SBOM, and gate CI on reviewed vulnerabilities.

### QA-014 - Over Completion Does Not Produce The Required Public Event

**Severity:** Medium | **Priority:** P1  
**Evidence:** [bug-over-complete-not-announced.png](qa-evidence/bug-over-complete-not-announced.png)

**Expected:** The main event reads `Over`.  
**Actual:** It remains `DOT BALL` after the sixth legal ball.

**Root cause:** The renderer prioritizes `pendingPublicEvent`/`lastDelivery` (`App.js:1599`) while over completion is stored separately as `lastEvent` at `App.js:1140`.

### QA-015 - Partial Final Over Is Missing From Overs And Graphs

**Severity:** Medium | **Priority:** P1

**Steps to reproduce**

1. Win a chase partway through an over.
2. Open final Overs and Graph tabs.

**Expected:** The match-ending partial over is included.  
**Actual:** The tested chase ended at 1.3, but the over list/graph contained only completed Over 1. The result summary separately displayed the final three balls.

**Root cause:** Those tabs render `overHistory`, which receives an entry only after six legal balls.

### QA-016 - Home Displays The Wrong Toss Winner

**Severity:** Medium | **Priority:** P1  
**Evidence:** [bug-data-lost-after-reload.png](qa-evidence/bug-data-lost-after-reload.png)

**Expected:** `Salem Spartans won toss & elected to bat`.  
**Actual:** Home displays `Toss: Sadokan A, Elected to BAT`.

**Root cause:** Home uses local wizard state (`tossWinner/team1Name`) instead of `activeMatch.tossResult` at `App.js:3959` and `App.js:4070`.

### QA-017 - Global Search Input Has No Behavior

**Severity:** Medium | **Priority:** P2

Entering a player, team, or ground changes only `searchQuery`; no filtering, results, navigation, or empty state occurs. The value is never read outside the input (`App.js:673`, `App.js:3834`).

### QA-018 - Bowlers Ranking Tab Is Empty

**Severity:** Medium | **Priority:** P2

**Steps to reproduce:** Matches > Rankings > Bowlers.  
**Expected:** The defined `TOP_BOWLERS` records appear.  
**Actual:** The list is blank.

**Root cause:** Rendering exists only for `batters` and `allrounders` at `App.js:4147-4160`.

### QA-019 - Weather Is Labeled Live But Uses Misleading Defaults

**Severity:** Medium | **Priority:** P2  
**Evidence:** [weather-screen.png](qa-evidence/weather-screen.png)

**Expected:** Weather is tied to the match venue/device location and every displayed field comes from a current response with an offline state.  
**Actual:** Coordinates are fixed to Delhi. Condition, humidity, and `PERFECT FOR CRICKET` remain hard-coded even if the request fails; only temperature and wind are updated (`App.js:803-810`, `App.js:4173-4183`).

### QA-020 - Responsive Layout Truncates Important Match Data

**Severity:** Medium | **Priority:** P2  
**Evidence:** [match-result.png](qa-evidence/match-result.png), [compact-320-home.png](qa-evidence/compact-320-home.png), [tablet-768-home.png](qa-evidence/tablet-768-home.png)

At 390px the result scores are ellipsized (`53-3 (5.0...`) and at 320px the active team name becomes `Sale...`. At 768px the UI stretches across the tablet while the team name remains truncated because it still uses a fixed 85px width. Tablet support is enabled in `app.json`.

### QA-021 - Accessibility Semantics Are Missing

**Severity:** Medium | **Priority:** P1

No explicit `accessibilityLabel`, `accessibilityRole`, `accessibilityHint`, `accessibilityState`, or `testID` was found despite 223 interactive declarations. Browser accessibility output exposed most controls as generic nodes. Icon-only controls, tabs, selected states, scoring buttons, and modals are therefore unreliable for screen readers and automation.

### QA-022 - Performance And Battery Risk From Polling And Full-Page Mounting

**Severity:** Medium | **Priority:** P2

- Public clients poll every second and call `setActiveMatch` even when data is unchanged.
- Scorer state changes can POST the entire match object.
- All five public pages are mounted inside one horizontal pager, including long scorecards and graphs.
- `App.js` is a 293 KB monolith, increasing rerender and regression risk.
- Image assets include a 1.97 MB logo and two team images near 1 MB each.

### QA-023 - Seeded Fall-Of-Wicket Rows Are Incomplete

**Severity:** Medium | **Priority:** P2  
**Evidence:** [final-scorecard.png](qa-evidence/final-scorecard.png)

The first two fall-of-wicket rows display only `Wicket` and scores, with no batter, dismissal, or over, while later wickets are detailed. The seed partnership records omit fields expected by the finished-scorecard builder.

### QA-024 - No Automated Quality Gate Exists

**Severity:** Medium | **Priority:** P1

`package.json` contains only start/android/ios/web scripts. There are no unit, integration, E2E, lint, type-check, coverage, or CI checks. The delivery parser and innings state machine are high-risk logic and currently have no regression protection.

### QA-025 - Store/Release Identity Is Incomplete

**Severity:** Low | **Priority:** P2

The Expo config has no Android package name, iOS bundle identifier, build numbers, runtime/update policy, or release profiles. Exports work, but the project is not configured for a controlled store release.

### QA-026 - Duplicate Start-Scoring Actions Add Ambiguity

**Severity:** Low | **Priority:** P3  
**Evidence:** [home-after-result.png](qa-evidence/home-after-result.png)

After a match, Home shows Start Scoring in the header and another `+ Start Scoring Match` in the empty live section. Both represent the same primary action.

## 6. Important Passing Scenarios

- Standard 0/1/2/3/4/6 delivery buttons update score and legal balls.
- An odd batter run swaps strike.
- Wide and no-ball do not consume a legal ball and are charged during the active spell.
- Bowled, caught, LBW, stumped, hit-wicket, and run-out entry screens are present.
- Caught dismissal collects a fielder and public view shows the dismissal detail.
- Tested non-striker run out with one completed run handled the selected end and did not credit the bowler.
- Undo and redo restored the tested delivery states.
- First innings ended at the configured five overs and generated target 54 from 53.
- Chase completion at 54-0 correctly declared Kovai Kings winner by 10 wickets.
- Result was visible in Finished matches during the same runtime.
- Public view showed the latest `3 RUNS` event immediately in the shared runtime.
- Public scorecard allowed inspecting a second innings before it started.
- Info, Live, Scorecard, Overs, and Graph tab presses worked.
- Expo Doctor, dependency compatibility, Android export, and iOS export passed.

## 7. Quality Assessment

| Area | Score | Assessment |
|---|---:|---|
| Core scoring correctness | 32/100 | Major extras, roster, retirement, and bowler-stat defects |
| Data integrity/recovery | 5/100 | No persistence; reload loses the match |
| Live/public reliability | 20/100 | Shared UI works locally, transport design is not deployable |
| Security | 15/100 | No authorization, exposed fake PIN, untrusted state ingestion |
| UX/visual consistency | 63/100 | Stronger live design, but responsive and state-specific inconsistencies remain |
| Accessibility | 20/100 | Semantics and native assistive testing absent |
| Performance | 45/100 | Acceptable smoke behavior, high scaling/battery risk |
| Build health | 72/100 | Expo checks/exports pass; release configuration and advisories remain |
| Testability/maintainability | 18/100 | Monolithic state machine with no automated tests |

**Overall production readiness: 31/100**

## 8. Recommended Fix Order

1. Add transactional local persistence and restart recovery before further UI work.
2. Replace token parsing with a structured, unit-tested delivery and innings engine.
3. Introduce immutable IDs for matches, teams, players, innings, and deliveries; enforce roster ownership.
4. Implement the full extras/free-hit/run-out/retirement rules matrix.
5. Replace the sync mechanism with an authenticated, versioned HTTPS event service.
6. Add setup validation and remove the seeded production match.
7. Add Jest unit tests for scoring rules and state transitions, then Maestro/Detox native E2E tests for scorer/public flows.
8. Fix archive behavior, partial-over projections, event banners, rankings, weather truthfulness, and responsive layouts.
9. Add accessibility semantics and run TalkBack/VoiceOver checks on physical devices.
10. Replace watermarked assets, review dependency advisories, and complete store configuration.

## 9. Final Recommendation

**NO-GO for production, public beta, or real-match scoring.**

The app is suitable only for continued internal prototyping. A release should be reconsidered after all Critical and High defects are fixed, automated cricket-rule coverage is in place, restart recovery passes, and the complete scorer/public flow is rerun on physical Android and iOS devices.

