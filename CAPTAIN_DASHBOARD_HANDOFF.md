# Space Captain — Captain Dashboard Handoff

Updated: 2026-08-15
Reference HEAD: `e7fb792e430d6745ae50c7d7ddb84513fe5bc918`

This is the focused handoff for captain dashboard / combat-context work.

## Current goal

The next visual pass is not final art.

Goal:
- make combat presentation representative enough to judge gameplay;
- reduce “Boeing cockpit / programmer dashboard” cognitive load;
- preserve fast access to real officer commands;
- let multiple simultaneous threats read as pressure rather than spreadsheet clutter.

The lower captain console remains conceptually:

- **OUR SHIP** — stable player systems/actions
- **CURRENT CONTEXT** — enemy + active threats/actions

## Current implementation

Left/stable player side currently covers:
- HULL
- shared DEF / Power Core
- ENGINE
- installed weapons
- current commands/status

Duplicate same-kind installed weapons are supported and keyed by concrete runtime weapon ID.

Right/current context currently covers:
- enemy summary;
- enemy HULL / defenses;
- incoming missiles;
- Beam Cannon attacks;
- sticky mines;
- SPAM.

All action payloads must continue to bind real engine-approved `AvailableOfficerCommand` values.

Views must not recreate availability.

## Compact threat object — SELECTED VISUAL DIRECTION

The old long horizontal threat rows are implementation scaffolding.

The current POC established a better direction:

> one concrete threat = one compact fixed-footprint tactical object.

Primary benefit:
- fast eye recognition;
- 4 threats can fit comfortably in one row;
- 5 can remain viable in a high-pressure state;
- frees substantial dashboard space for enemy/system context;
- number of simultaneous threats becomes visually obvious without reading a table.

Do not aggregate runtime threat identity just to pack the UI.

### Core geometry

Each threat object should keep a stable reading order:

Top:
- square icon cell;
- countdown/time-to-resolution beside it.

Intel line:
- dedicated readable signature/target code strip;
- do not compress this into a tiny decorative line.

Actions:
- one/two compact stable buttons.

The generated POC where the intel strip became too thin is a warning: the intel code is key gameplay information and must remain visually strong.

### Missile states

Unknown:
- icon + `12.6s`;
- `?????` in red;
- `TRACK [S]`;
- `HIT [W]`.

Partial/uncertain:
- icon + `12.6s`;
- e.g. `ABC??` in yellow;
- `TRACK [S]`;
- `HIT [W]`.

Confirmed:
- icon + `12.6s`;
- e.g. `ABCDE` in green;
- Science action disappears;
- `HIT [W]` remains in a stable place.

### Science action naming

Keep the action name stable:

`TRACK [S]`

Do not switch the button to `CONFIRM [S]`.

Rationale:
- same intent/interaction surface;
- changing the label adds state-reading friction;
- the intel code itself communicates progress.

### Intel color grammar

- red = no useful intel;
- yellow = partial/uncertain;
- green = confirmed.

The number of remaining `?` may later communicate confidence/intel depth if a perk/mechanic deliberately exposes that granularity.

Do not add confidence bars/percentages unless gameplay proves them necessary.

### Player-facing signature strings

Future-friendly visual idea:
- short 4–5 character signature codes;
- randomized/generated codes can give screenshots/runs personality;
- funny accidental codes are welcome;
- they must remain player-facing intel and must never expose hidden objective signature truth improperly.

### Beam Cannon in the same language

Beam should use the same threat-object grammar.

Example:
- unknown: `????`;
- partial: `PW??`;
- confirmed: `PWR`, `HULL`, `WPNS`, `SHLD`.

Top:
- Beam threat icon;
- charge countdown.

Actions:
- `TRACK [S]` while additional Science intel is actually available;
- `SHLD [E]` or the real Engineer response in a stable action slot.

This requires a real future Beam target/intel domain contract. Current code does not yet have semantic target nodes.

Do not fake target codes from VFX impact anchors.

## Threat-object architecture rule

Shared visual geometry does **not** automatically justify a generic gameplay/view framework.

Keep:
- concrete threat runtime identity;
- specialized mappers/views where interactions differ;
- engine command truth.

A small shared presentation helper/component may be justified later if the actual final views repeat meaningful layout code, but do not pre-build it around mockup geometry.

## Weapon-start telegraphs

Selected next mechanic cleanup affects the dashboard:

Current generic behavior:
- enemy work emits `PLAYER_SHIP_TARGETING_DETECTED`;
- app starts a generic warning;
- later real weapon event clears it and adds the concrete threat.

Selected direction:
- Missile: telegraph begins with real lock/targeting;
- Beam: telegraph begins with CHARGING;
- SPAM: telegraph begins with CHANNELING;
- Mines: telegraph begins with DISPENSING/launch;
- remove the extra generic pre-warning layer.

The dashboard should display real threats/actions, not clairvoyant “something will happen soon” state.

## Current visual style target

Strong early-1990s VGA / Sierra / Space Quest spirit:
- dark navy / blue-black;
- steel-blue framing;
- chunky readable pixels;
- restrained 256-color feel;
- physical slightly worn ship hardware;
- practical more than decorative;
- lightly comedic where appropriate.

Avoid:
- glossy modern HUD;
- flat web UI;
- military-simulator density;
- Excel rows;
- oversized mobile-style cards;
- carnival color noise.

## Upcoming full gameplay-fidelity pass

After weapon targeting cleanup + Single Mine experiment:

1. redraw/recompose the whole dashboard;
2. update OUR SHIP panel;
3. update CURRENT CONTEXT panel around compact threat objects;
4. improve bridge art so crew visibly sit in a small ship bridge, not an open hangar-like room;
5. redraw missile sprites;
6. add restrained combat juice:
   - hit screen shake;
   - short screen/console flash;
   - readable impacts;
   - enemy death already has presentation animation.

Do not chase final pixel art perfection. This pass exists to support gameplay evaluation.

## Snapshot / mapper boundary

`EncounterPresentationSnapshot` remains the app-facing coherent frame root.

Captain context consumes:
- safe enemy ship presentation;
- threats;
- player-visible intel;
- real available commands.

`BridgeCaptainCombatContextMapper` may bind commands to visual affordances but must not invent:
- role availability;
- target legality;
- hidden signature;
- fake Beam node truth.

## Duplicate weapons

Player dashboard/presentation must support multiple installed weapons of the same kind.

Identity is concrete runtime weapon ID, not weapon kind.

Do not reintroduce singleton assumptions such as “one Missile Launcher row”.

## Orphan missiles

Incoming missile UI must continue to work after source enemy actor destruction.

Do not disable `TRACK` / `HIT` merely because the original actor no longer exists.

The projectile is the current physical threat.

## Enemy destruction

Enemy destruction animation must not freeze threat countdowns or simulation.

The bridge view may animate destruction independently, but:
- no `isEncounterInteractive` lock owned by enemy death;
- no delayed completion event that force-unlocks unrelated interaction state.

## Context-menu transition

Captain dashboard is the intended main command surface.

The old officer context menu remains legacy coverage until dashboard + future Navigation/Engineering surfaces cover required flows.

Potential future tabs:
- Combat;
- Engineering;
- Navigation.

Do not implement tabs solely to compensate for the current oversized threat rows; compact threats may remove much of that pressure.

# NON-NEGOTIABLE PATCH DELIVERY

1. Temporary `.mjs` patchers are delivered **only inside ZIP files**.
2. Never additionally attach the bare `.mjs`.
3. Fetch fresh `master` before preparing each atom.
4. Normal atom guards exact HEAD + clean tracked state.
5. Recovery atom guards the known dirty state/untouched targets explicitly.
6. Preserve EOL and one newline at EOF.
7. Run post-assertions + `git -c core.safecrlf=false diff --check`.
8. Failed patcher remains on disk.
9. Successful patcher deletes:
   - itself;
   - every explicitly named obsolete ancestor patcher from the same failed/recovery lineage.
10. Never use broad `.mjs` cleanup globs. Exact temporary names only. Never delete real project tooling such as `vite.config.mjs`.

Example lineage:
- `atom_14.mjs` fails -> remains;
- `atom_14_v2.mjs` fails -> both remain;
- `atom_14_v3.mjs` succeeds -> deletes `atom_14.mjs`, `atom_14_v2.mjs`, and itself after post-guards.

## Test discipline

When changing combat-context presentation:
- search all mapper/view/controller callers first;
- search all tests first;
- update typed and `unknown as` fixtures;
- prefer tests proving real command binding;
- do not hardcode Debug Start tuning when it is irrelevant to the tested contract;
- add regression tests for source-independent threats and presentation/simulation boundaries when touched.
