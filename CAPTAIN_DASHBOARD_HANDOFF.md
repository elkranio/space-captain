# Space Captain — Captain Dashboard Handoff

Updated: 2026-08-13
Reference HEAD before this docs atom: `79ec6e607b7f5e7c55077469594e7b4990b337ae`

This is the focused handoff for captain dashboard / combat-context work.

## Design direction

The lower captain console is split conceptually:

- **OUR SHIP** — stable player state/actions
- **CURRENT CONTEXT** — enemy + current threats/actions

The dashboard should feel like restrained early-1990s VGA / Sierra sci-fi:
- dark navy / blue-black
- steel-blue framing
- muted accents
- chunky readable pixels
- low clutter
- not glossy
- not a modern flat HUD
- not a Boeing cockpit
- not a colorful arcade toy

## Current left side

Implemented rows/status cover:
- HULL
- shared DEF capacitor
- ENGINE
- MISSILE
- LASER
- MINES
- SPAM

The UI binds to real engine commands. Do not implement availability rules in the view.

## Current right side

Implemented:
- enemy summary
- enemy HULL
- enemy DEF
- incoming missile threats
- incoming laser threats
- hostile sticky-mine threats
- hostile SPAM channels

All threat/action payloads are mapped from the coherent combat presentation frame plus real engine command availability.

### Missile row

Current prototype provides:
- timer
- missile identity/unknown state
- Science identify action where available
- Weapons red/blue point-defense response where available
- inline red/blue selector for unknown-missile flow

### Laser row

Current prototype provides:
- timer
- laser threat
- disabled Science placeholder
- Engineer deploy-shield action when the real command is available

### Sticky-mine row

Current prototype provides:
- one row per attached hostile mine
- independent fuse timer per runtime mine
- current clear-state flags
- real `CLEAR_STICKY_MINE` actions for any role that engine currently allows
- no domain-level salvo aggregation

### SPAM row

Current prototype provides:
- one row per active hostile SPAM channel
- remaining channel duration
- Science purge action when the real engine command is available

## Button visual semantics

Captain action buttons intentionally do **not** use officer-role colors.

Shared repeated dashboard semantics now live in `captain_dashboard_style.ts`.

Active:
- background `0x193147`
- border `0x7aa0c4`
- white text

Non-interactive / officer busy / current work:
- background `0x101923`
- border `0x26394c`
- text `0x536778`

Red/blue are preserved only where they encode beam choice.

Do not move every local VFX color into the dashboard palette. Beam colors, progress visuals and other mechanic-specific presentation can remain local.

## Countdown formatting

Threat countdown labels share `formatCaptainDashboardCountdown()` from `captain_dashboard_format.ts`.

Do not reintroduce separate missile/laser/mine/SPAM `formatTimer()` helpers.

## Threat geometry is provisional

Do not treat the current repeated horizontal threat row as final UX architecture.

Current rows were chosen to make mechanics readable during implementation. With final art, threats may become much smaller, potentially compact tiles rather than rows.

Therefore:
- do not build a generic row framework;
- do not solve final sizing during mechanic work;
- keep domain/read-model identity independent of visual grouping;
- keep concrete threat views specialized while their interactions differ.

## Snapshot / mapper boundary

`CombatPresentationSnapshot` is the coherent one-frame source used by current bridge synchronization.

For captain context, the mapper receives:
- enemy ship presentation snapshots
- incoming missiles
- laser threats
- sticky-mine snapshots
- SPAM channels
- available commands for all four roles

`BridgeCaptainCombatContextMapper` only binds existing engine-approved commands to threat affordances. It must not invent role availability or target legality.

## Shield presentation

Player/enemy shield views share only common alpha/timing math through `bridge_shield_presentation.ts`.

Do not merge the two view classes:
- player shield is one player-owned visual/lifecycle
- enemy shields are actor-keyed visuals
- scale/position/lifecycle differ

## Context-menu transition

The captain dashboard is the intended main command surface, but the old officer context menu still provides legacy command coverage.

Do not remove it until dashboard + future navigation/engineering surfaces cover the required flows.

Potential future bridge tabs:
- combat
- engineering
- navigation

These are design direction only, not a current implementation contract.

## Patch delivery rules

Mandatory for every coding atom:

1. Deliver patch scripts only inside `.zip`.
2. On full successful validation, the script deletes its own `.mjs`.
3. Fetch fresh `master` HEAD first.
4. Guard expected HEAD.
5. Guard clean tracked state unless explicitly repairing a known dirty atom.
6. Preserve CRLF/EOL style.
7. Normalize touched text files to exactly one newline at EOF.
8. Search all callers/tests before deleting or widening shared APIs.
9. Run `git -c core.safecrlf=false diff --check`.
10. Failed patchers remain for diagnosis.

## Test discipline

When changing captain mapper inputs/payloads:
- search all callers first;
- search all tests first;
- do not assume there is only one mapper test;
- update typed and `unknown as` fixtures too;
- prefer tests that prove mapping uses real commands instead of synthetic UI availability.
