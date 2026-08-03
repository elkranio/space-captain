# Space Captain — Bridge V0.1 Migration Handoff

Active visual/application slice.

Read after `PROJECT_CONTEXT.md`.

Last updated:

```text
2026-08-03
```

Base repository checkpoint after the completed Comms cut:

```text
149f84e493f6fc419848fded3c26b4f234d076fb
```

---

# 1. Goal

Replace the old five-seat bridge presentation with a functional four-station
bridge V0.1.

This is not release art.

The purpose is to test combat, task feedback and command navigation on a layout
that resembles the intended final bridge.

Target:

```text
new modular art
→ clean four-role view structure
→ task/status feedback on station monitors
→ preserve all combat/navigation behavior
```

Do not resume enemy defensive AI inside this slice.

Do not implement the final captain dashboard inside this slice.

Do not polish the final Space Quest style before the layout works in runtime.

---

# 2. Locked design decisions

Playable roles:

- Science;
- Helm;
- Weapons;
- Engineer.

Removed role:

```text
Comms
```

Comms removal rationale:

- `REQUEST DOCKING` is a meaningless universal ritual;
- normal docking should be direct when permitted;
- the current `HAIL`/contact prototype has no required gameplay function;
- four roles reduce cognitive load and improve visual orientation.

`HAIL`, its contact sequence and its bridge UI are removed in this migration.
Future contact/dialogue will be designed again from actual content requirements.

Bridge composition:

- strict 1280×720 / 16:9;
- captain POV;
- no visible captain;
- dominant panoramic viewscreen;
- four stations in a shallow chevron;
- Helm and Weapons inner/back pair;
- Science and Engineer outer/front pair;
- no VIP chair in V0.1;
- lower foreground reserved for future captain dashboard;
- temporary debug/status panels remain for now.

Exact center left/right role order must be copied from the accepted working
composite source. Do not infer it from the old bridge.

---

# 3. Accepted V0.1 art logic

## Bridge shell

Contains:

- bridge walls;
- ceiling;
- floor;
- viewscreen frame;
- empty area for four stations;
- empty lower foreground for future dashboard.

Does not contain:

- stations;
- officers;
- captain;
- VIP chair;
- final dashboard;
- enemy ship;
- combat UI;
- baked task/status overlays.

The current shell looks more like a large hangar than the intended final bridge.

This is accepted for V0.1.

A human artist will redraw it later.

Do not restart generative art iteration during the code migration.

## Station base

One reusable transparent station sprite.

Contains:

- compact continuous console body;
- large monitor;
- dark clean idle monitor base;
- touch/control panel;
- small unlit indicator recesses.

Does not contain:

- chair;
- officer;
- role label;
- task icon;
- progress;
- active lights;
- bark;
- selection frame.

## Officer art

Four seated officer sprites are imported as separate bridge-specific assets.

They share the station's `242×180` source canvas so every officer can be placed
over the station at the same position and origin.

The sprites are not portraits and do not reuse old officer-portrait IDs.

---

# 4. Production exports

Before coding, export and save the current accepted assets.

Imported production PNGs:

```text
assets/raw/images/bridge/interior/generic.png
assets/raw/images/bridge/station/base_00.png
assets/raw/images/bridge/officers/science_seated_00.png
assets/raw/images/bridge/officers/weapons_seated_00.png
assets/raw/images/bridge/officers/helm_seated_00.png
assets/raw/images/bridge/officers/engineer_seated_00.png
```

Recommended additional non-atlas reference:

```text
full composite mockup
```

The composite exists only to preserve intended placement and scale.

## Bridge shell export

Requirements:

- exact 1280×720;
- no stations;
- no captain dashboard;
- no officers;
- no enemy/combat objects;
- alpha or clean interior handling appropriate to current bridge layer order;
- no accidental matte around viewscreen/frame edges.

Before final export, inspect current runtime layering.

If the current space/viewscreen content is rendered beneath the bridge shell:

```text
viewscreen interior in shell
→ transparent
```

If the current architecture uses a solid background with combat objects above:

```text
preserve the current contract
```

Do not bake starfield/ships/VFX into the shell without checking the existing
view order.

## Station export

Requirements:

- transparent background;
- tightly but safely trimmed;
- no floor shadow that assumes one specific placement;
- no officer/chair;
- no active monitor content;
- no active lights;
- monitor inner rectangle remains easy to overlay;
- touch panel remains readable at final runtime scale.

## Source file

Keep the editable source with separate layers for:

- shell;
- station;
- placement guide;
- optional officer demonstrations;
- optional dashboard guide.

Do not use the flattened composite as the only source of truth.

---

# 5. Asset naming

Locked atlas frame IDs:

```text
bridge/interior/generic
bridge/station/base_00
bridge/officers/science_seated_00
bridge/officers/weapons_seated_00
bridge/officers/helm_seated_00
bridge/officers/engineer_seated_00
```

One base station should serve all four roles.

---

# 6. Runtime layer model

Target view stack:

```text
space / viewscreen world
→ bridge shell
→ combat/navigation objects and VFX in the correct viewscreen layer
→ station bases
→ station monitor overlays
→ station activity / interaction overlays
→ barks
→ temporary debug status panels
→ menus / global UI
```

Exact z-order must follow the existing scene architecture after fresh inspection.

Do not let the bridge shell cover:

- enemy ship;
- incoming/outgoing missiles;
- sticky mines;
- laser charge/beam;
- navigation objects;
- target zones;
- threat indicators.

Do not let station overlays become domain state.

---

# 7. Station view contract

Prefer one reusable station view configured by role.

Prepared station view input should eventually contain:

```text
role
position / depth configuration
selected
availability state
current task
task icon key
progress visibility
progress ratio
touch activity
bark payload
```

The view must not read `GAME_RUNTIME` directly.

The view must not decide whether a command is available.

The view displays prepared state only.

## Monitor states

Idle:

```text
dark idle display
```

Active task without progress:

```text
task icon
+ activity treatment
```

Active task with progress:

```text
task icon
+ progress bar
```

Interrupted / blocked:

```text
clear local state
```

Do not bake these into station art.

## Touch panel

The panel may show small runtime interaction pulses while a task is active.

V0.1 animation can be simple:

- one or two short touch flashes;
- deterministic or looping;
- no character hands required;
- no complex animation state machine.

Do not create a new gameplay event merely for cosmetic touch timing.

Derive it from current task/activity presentation state.

## Barks

Barks may use a role-specific anchor near/above the station.

The seated officer sprite is presentation only and does not own bark state.

Ensure barks do not cover:

- task icon;
- progress;
- another station;
- viewscreen combat focal area.

---

# 8. Comms cut

The dedicated behavior/domain atom removes Comms before the station-view
migration.

Required design outcome:

```text
remove REQUEST DOCKING
remove HAIL/contact flow and rebuild it later if required
remove Comms from playable bridge roles
normal DOCK is direct when eligible
```

Likely affected areas to inspect fresh:

- officer-role definitions and role arrays;
- starter crew/presets;
- command availability;
- command handlers;
- docking clearance and contact tasks;
- bridge layout/configuration;
- officer menu shortcuts;
- tests and full state snapshots;
- barks/activity mappings.

Do not rename Comms to another role merely to retain five seats.

Do not invent a replacement role before it has several strong repeatable
commands.

Do not combine the Comms cut with enemy AI changes.

---

# 9. Implementation atoms

## Atom 0 — inventory only — complete

Read fresh `master`.

Locate:

- texture packer source root;
- bridge art source paths;
- atlas manifest entries;
- current bridge background view;
- seat/officer/station views;
- role layout configuration;
- activity/progress views;
- bark anchors;
- temporary debug panels;
- viewscreen object/VFX bounds;
- scene layer order.

Output:

- exact file list;
- final asset paths;
- final frame IDs;
- no code changes.

## Atom 1 — asset import — complete

- add shell PNG;
- add station PNG;
- add manifest/packer entries;
- build atlas;
- verify frame dimensions;
- no view redesign;
- no Comms removal.

Acceptance:

```text
npm run pack:tex
npm run typecheck
npm test
```

No runtime behavior change.

## Atom 2 — Comms gameplay cut — complete

- remove request-docking flow;
- make docking direct when eligible;
- remove HAIL, contact sequence and contact UI;
- remove Comms from playable role collections;
- update tests;
- make Helm DOCK direct at the current station.

Keep this atom behavior-focused.

Do not add the command palette.

## Atom 3 — bridge shell — complete

- replace old bridge background/shell;
- remap `BRIDGE_VIEWSCREEN_RECT` to the shell's transparent bounding box:

```text
x 225, y 38, width 829, height 258
```

- preserve viewscreen content/VFX visibility;
- preserve navigation/combat object positions unless intentionally remapped;
- keep temporary status panels;
- add focused view/layout tests where practical.

Runtime acceptance:

- space visible through viewscreen;
- enemy and threats visible;
- no shell overlap;
- 1280×720 crop correct.

## Atom 4 — four station bases — complete in the current atom

- add one reusable station-base view;
- place four instances;
- place four matching seated-officer sprites over the bases;
- exact shallow-chevron placement from composite;
- stable role hit areas;
- remove old fifth-seat presentation;
- rename the click contract from seat to station;
- preserve officer command flow;
- centralize station, menu and bark placement.

Do not add officer animation or extra visual variants in this atom.

## Atom 5 — station activity

- monitor idle/task states;
- icon;
- optional progress;
- touch-panel cosmetic animation;
- selected/ready/busy/blocked treatment;
- fine-tune bark anchors during runtime acceptance if needed.

Reuse existing task/read-model data where possible.

Do not add a second gameplay state for visual progress.

## Atom 6 — cleanup

- remove obsolete old station manifests/assets and frames;
- remove dead layout constants;
- update docs;
- runtime acceptance.

Do not delete old assets until no view/test references them.

---

# 10. Runtime acceptance matrix

Navigation:

- initial bridge;
- anchored object;
- FLY TO;
- DOCK;
- JUMP;
- leave/return.

Officer/task:

- select each of four stations;
- role availability;
- task start/end;
- cancellable task;
- interruption;
- visible progress;
- task without progress;
- bark positioning.

Combat:

- enemy missile;
- enemy laser;
- enemy sticky mines;
- player missile;
- player laser;
- player sticky mines;
- point defense;
- shield deployment;
- enemy destruction;
- remaining launched threats after destruction.

UI:

- temporary status panels still readable;
- old command menu remains functional until palette replacement;
- station monitor does not conflict with menu;
- no fifth/Comms interaction target remains after cut.

Resolution:

```text
1280×720
```

Check actual 1:1 scale, not only enlarged screenshots.

---

# 11. Non-goals

Not part of this slice:

- final Sierra-quality bridge redraw;
- final captain dashboard;
- final command palette;
- final officer animations;
- VIP seat;
- new enemy defense;
- combat balance pass;
- tactical pause;
- gamepad implementation;
- role-specific station geometry;
- new generic UI framework.

---

# 12. Completion criteria

The migration is complete when:

```text
four gameplay roles only
+ new shell visible
+ four modular stations visible
+ task/progress readable on station monitors
+ commands/tasks still function
+ combat/navigation presentation preserved
+ old fifth-seat presentation removed
+ temporary debug dashboard preserved
+ tests/typecheck/runtime green
```

After this, explicitly choose:

```text
command palette
or
resume enemy defensive behavior
```

Do not drift into both at once.
