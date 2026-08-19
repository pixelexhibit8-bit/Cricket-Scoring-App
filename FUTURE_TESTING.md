# Future Testing Notes (Automated Testing)

## Status: 🟡 Postponed (Future Phase)

### Overview
Automated unit testing (Jest / React Native Testing Library) for core scoring and calculation logic.

---

### Why Not Now?
* App is in active rapid UI iteration and feature development (Quick Match, match lifecycles, theme design).
* Adding tests now creates high maintenance overhead without added value during rapid prototyping.

---

### When To Implement?
* When match scoring engine and core calculation rules are 100% frozen and stable.

---

### Target Scope (Minimal Focus)
When implementing in the future, write unit tests **only for pure calculation logic**, not heavy UI:
1. **Scoring Engine calculations**: Runs, balls, wickets, over transitions (`0.5 -> 1.0`).
2. **Strike rotation logic**: Singles, boundaries, over changes, run-outs.
3. **Extras math**: Wide, No-ball, Byes, Leg-byes.
4. **Rate calculations**: CRR, RRR, DLS/Target chase math, NRR.

---

### Recommended Tooling (When Needed)
* **Jest** (`jest-expo` / `ts-jest`) for scoring engine unit tests.
