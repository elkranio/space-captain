# Space Captain — Bridge Rebuild Handoff

Created: 2026-08-15
Reference HEAD: `449524c811cd14b8ec933f74565cb6c8241bfdd0`

**IMMEDIATE NEXT TASK.**

The purpose of the next coding chat is deliberately narrow:

> Put the new bridge art into the game, place the new seated officers, remove old station presentation that conflicts with the new art, verify runtime, stop.

Do not turn this into a dashboard redesign or general bridge refactor.

## Why this rebuild exists

The previous runtime bridge was useful scaffolding but visually read as a large hangar.

A new Space Quest/Sierra-inspired bridge baseline is now accepted:
- compact command bridge;
- large polygonal forward viewscreen;
- four integrated stations;
- broad lower captain-dashboard zone;
- chunky readable VGA-style art.

The user has a cleaned background candidate and new officer sprite work in the local working tree/art workspace.

The exact local filenames may not yet match the naming suggestions below.

**First action in the new coding chat: inspect current GitHub master + local `git status` / asset paths before writing a patch.**

Do not assume today's unpushed art exists on GitHub.

## New visual asset contract

### Bridge background

Expected final background behavior:
- one 1280×720 bridge interior image;
- viewscreen opening is transparent;
- station consoles are already painted into the background;
- station monitor surfaces are blank/dark;
- station role labels are removed.

Existing legacy background:
`assets/raw/images/bridge/interior/generic.png`

Recommended new asset location if the user has not already chosen one:
`assets/raw/images/bridge/interior/generic_01.png`

Do not delete `generic.png` until the port is proven.

### Seated officers

Canonical bridge seated sprite directory:
`assets/raw/images/bridge/officers/`

Current legacy assets:
- `science_seated_00.png`
- `weapons_seated_00.png`
- `helm_seated_00.png`
- `engineer_seated_00.png`

New sprite contract:
- whole transparent sprite;
- chair + body + head already composited;
- no runtime chair/head assembly needed.

Three intended authored states per role:
- idle;
- look left;
- look right.

Suggested names if the user's current files are not already named:

```text
science_seated_01_idle.png
science_seated_01_look_left.png
science_seated_01_look_right.png

weapons_seated_01_idle.png
weapons_seated_01_look_left.png
weapons_seated_01_look_right.png

helm_seated_01_idle.png
helm_seated_01_look_left.png
helm_seated_01_look_right.png

engineer_seated_01_idle.png
engineer_seated_01_look_left.png
engineer_seated_01_look_right.png
```

`look_left` / `look_right` mean the officer's own left/right.

If only the idle sprites are ready enough tonight, the first bridge atom may wire only idle assets. Do not block bridge assembly on unfinished recolors/head-turn polish.

## Current code to inspect first

### Root view

`src/app/scenes/game/bridge/view/BridgeView.ts`

Keep its main lifecycle composition:
- space;
- combat;
- interior;
- attack warning;
- officer layer;
- captain dashboard;
- barks;
- legacy officer context menu.

The rebuild should not rewrite unrelated bridge modules.

### Interior manifest

`src/app/manifests/bridge/interior.ts`

Currently points to:
`bridge/interior/generic`

Update/add the new background entry and use it.

### Seated officer manifest

`src/app/manifests/bridge/seated_officer.ts`

Currently has exactly four legacy `_SEATED_00` IDs.

Add the new authored sprites.

For the first static rebuild, use the new idle state per role.

Do not delete `_00` yet.

### Officer station root

`src/app/scenes/game/bridge/view/officer_stations/BridgeOfficerStationsView.ts`

Current view listens to old presentation events for:
- availability indicators;
- combat hints;
- activity start/clear/progress.

After removing the old visual children, search all event producers/consumers/tests and remove dead presentation plumbing where safe.

Do not remove engine officer state.

### Individual station view

`src/app/scenes/game/bridge/view/officer_stations/station/BridgeOfficerStationView.ts`

Current order:
1. separate station image;
2. hints view;
3. activity view;
4. indicator view;
5. seated officer image;
6. invisible hit area.

This old composition is no longer correct.

New direction:
- station console is already in the bridge background;
- render the new whole chair+body officer sprite at the authored role position;
- retain an invisible hit area for officer clicking/context menu;
- no separate station-base sprite.

The old assumption that station base + officer share a 242×180 authored canvas is obsolete for the new art.

### Station layout

`src/app/scenes/game/bridge/view/officer_stations/bridge_officer_station_layout.ts`

Re-author:
- officer sprite positions;
- hit-area positions/sizes;
- any role mapping needed by the new background.

Prefer explicit four role coordinates.

Do not invent a generic positioning framework.

## Old presentation to remove now

### 1. Monitor hints

`BridgeOfficerStationHintsView`

Old monitor command/combat text is removed for now.

Reason:
- new monitors are blank decorative surfaces;
- captain dashboard is the main combat information surface;
- later monitor animations can be rebuilt specifically for the new art.

If no consumer remains, delete the view and dead event mapping/tests.

### 2. Station activity monitor UI

`BridgeOfficerStationActivityView`

Old implementation currently owns:
- task label;
- progress bar;
- cancel X;
- fake touch-deck/keyboard pulses.

For this rebuild remove that station-monitor presentation.

Important:
- do not remove engine officer tasks;
- do not remove task cancellation semantics from engine;
- if the direct station cancel affordance disappears temporarily, ensure legacy command/context coverage remains coherent and note follow-up if needed.

Do not preserve fake typing pulses anywhere.

### 3. Side availability lamps

`BridgeOfficerStationIndicatorsView`

Old mirrored ready/busy/blocked rectangles are removed.

If the bridge event exists only for these lamps after the rebuild, remove the dead presentation event path.

Do not remove engine availability truth.

## What remains visible on stations

For the first rebuild:
- authored station art in background;
- authored officer chair+body sprite;
- invisible clickable hit area.

That's enough.

No monitor gameplay UI.
No fake typing.
No side lamps.

## Head-turn states — NOT IN FIRST ATOM

The art supports:
- idle;
- look left;
- look right.

Do not wire the behavior in the static rebuild unless it is literally trivial after the bridge is green.

Follow-up atom should define a small presentation-only state seam and connect it to barks/conversations.

Do not put head direction into engine combat state.

## Layering

Desired conceptual layering:

```text
space / combat objects
    ↓
bridge background with transparent viewscreen
    ↓
seated officer sprites
    ↓
captain dashboard / bridge UI / barks / menus as appropriate
```

Actual Phaser layer ordering should preserve the existing working space/combat masking/composition.

Inspect `BridgeView`/`BridgeInteriorView`/scene layers before changing order.

## Viewscreen

The new background has a transparent viewscreen opening.

Existing `BridgeSpaceView` + `BridgeCombatView` should remain responsible for what is seen through it.

Do not bake starfield/enemy/projectiles into the bridge background.

Persistent projectile labels/timers are not wanted in the viewscreen.

## Atlas/build

New/moved raw images require:

```bash
npm run pack:tex
```

Then:

```bash
npm run typecheck
npm test
```

Then runtime smoke.

## Runtime smoke checklist

Before pushing:
- new bridge background fills 1280×720 correctly;
- viewscreen transparency reveals existing space/combat layer;
- enemy ship/projectiles still appear through the viewscreen;
- all four officers sit correctly at their stations;
- no duplicate old station sprites remain;
- no monitor hints remain;
- no task/progress monitor text remains;
- no fake keyboard pulses remain;
- no side ready/busy/blocked lamps remain;
- captain dashboard still renders;
- barks still render;
- officer clicking/context menu still works if intentionally retained;
- combat still progresses normally.

## Tests / cleanup discipline

Before deleting any event/type/view:
- search `src` + `tests`;
- remove true dead presentation plumbing;
- do not retain compatibility shims for visuals that are intentionally gone;
- do not remove engine contracts merely because their old view disappeared.

Do not delete legacy raw bridge assets in the same atom.

## Patch delivery for this task

This task will likely run with newly created/unpushed art in the working tree.

Therefore:
- fetch current GitHub `master`;
- inspect local `git status`;
- guard exact expected HEAD;
- do not blindly require a totally clean worktree if the only dirt is known new art;
- instead guard exact source files the code atom owns and verify the expected new assets exist;
- never overwrite the user's new image files;
- temporary patcher must still be delivered only inside ZIP.

## Stop condition

The atom is done when:
- new static bridge is assembled;
- old conflicting station presentation is gone;
- typecheck/tests are green;
- runtime looks sane.

Then stop.

Do not spend the same night wiring conversations, dashboard redesign, missiles, VFX or enemy captain AI.
