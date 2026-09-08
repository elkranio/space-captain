# Space Captain — Current Handoff

This is the only live handoff file. Git history owns completed migration/refactor history; keep this file focused on
the current repository state and the next useful boundaries.

## CURRENT OVERRIDE — 2026-09-08 — Power Core mounted-equipment migration

This section is the current operational handoff. It supersedes stale statements later in this file that say
ENEMY SHIP still uses the legacy 4x3 renderer, that Power Core is permanently non-spatial/separate from mounts, or
that enemy schematic migration is the next task. Keep the older sections only as historical context until the next
documentation cleanup.

Baseline at handoff time:

```text
master commit: b7d978f315512788b2e7f169baf8f1b21d988b1e
master tree:   a3503db04091043fb873db1e9ac77e0556a46fea
```

Fresh repository state still wins. At the start of every implementation atom, fetch current `master`, read the
exact touched source/tests and follow `docs/WORKING_RULES.md`.

### What is already landed

- MY SHIP uses the physical chassis schematic: authoritative `600x260` blueprint surface, exact `100x80` slots,
  centered chassis-local coordinates and stable `slotId` mounts.
- ENEMY SHIP has also migrated from the legacy mirrored 4x3 grid to the chassis schematic. The right-side view
  mirrors presentation X / blueprint orientation so the ships face inward; canonical chassis coordinates remain
  domain truth.
- Enemy equipment is resolved by real `slotId`; the dashboard mapper no longer needs fake row/column placement for
  the active renderer.
- HULL and BRIDGE are fixed semantic chassis nodes. Their current runtime presentation is icon-based; do not fold a
  new Hull/Bridge art pass into the Power Core migration.
- Existing Beam equipment-slot selection survived the enemy schematic migration. A broader target hover/tooltip UX
  pass is separate future work.
- Equipment icons are content-driven through `iconId`. Runtime equipment icons render native 1:1 and use the
  accepted shared tile grammar; arbitrary colored icon art must not be state-tinted as the primary status language.

### Active goal

Power Core is the next structural migration. The intended end state is **a real, optional mounted equipment item on
an explicit chassis node**, not a second special ship/header truth living beside generic equipment.

The target invariant is:

```text
Power Core definition/content
-> optional equipment instance in ship/loadout state
-> mounted by stable slotId on a chassis-defined Power Core node
-> normal bridge/query projection from authoritative engine state
-> normal player/enemy chassis presentation
-> normal editor authoring
```

`optional` means a valid ship/loadout may have no installed Power Core. Do not invent what "no core" means for
energy availability, command legality or encounter behavior until the current engine power contract is audited.
Likewise, do not assume whether a broken Core should be targetable, repairable or produce zero power merely because
other equipment does: reuse generic equipment semantics where they are genuinely correct, and make any Power
Core-specific rule explicit in the engine.

The migration must end with one authoritative Power Core state. Temporary compatibility fields/accessors are fine
between atoms, but they must be clearly transitional and removed after downstream consumers move.

### Hard boundaries for this workstream

- Do not redo accepted equipment tile geometry, colors, fonts, hover/action strip or progress-line language.
- Do not redesign Beam targeting, node tooltips or selection UX while moving Power Core structurally.
- Do not add/rework Bridge or Hull icons as part of these atoms.
- Do not move authoritative chassis coordinates into dashboard layout code. Chassis/content owns geometry; the
  enemy view alone mirrors presentation X.
- Do not leak enemy ammo, cooldowns, AI decisions, crew tasks or other private combat state through the public
  enemy dashboard just because Power Core becomes generic equipment.
- Do not delete the old special Power Core contract before every downstream reader/writer has migrated.
- Do not combine engine/content/runtime/editor cleanup into one repo-wide patch. One green atom -> user validates
  and pushes -> next atom starts from newly fetched `master`.

### Atom plan

#### Atom 0 — reconnaissance and invariant map; no behavior change

Before touching the model, map every current Power Core owner and dependency from fresh `master`.

Search at minimum for:

```text
powerCore
PowerCore
POWER_CORE
CORE
power / energy capacity / energy spend paths
ship/loadout construction and persistence
bridge snapshots/events/mappers/header views
content definitions/schemas/default data
editor schemas/controls/debug loadout editor
fixtures/factories/tests
```

Answer from source, not memory:

1. Where is the current special Power Core stored on persistent ship/loadout state?
2. Where is encounter-local Core/current energy stored and mutated?
3. Which commands spend Core and which code validates affordability?
4. Is there already a generic equipment definition/instance union that can accept a Power Core kind without a
   parallel hierarchy?
5. How do chassis slot kinds currently restrict mount compatibility, and what is the smallest explicit way to
   represent a dedicated Power Core node?
6. Which player/enemy bridge payloads still expose a special `powerCore`/CORE field?
7. Which header/runtime views and editors consume that special field?
8. Which serializers, factories, fixtures and tests assume every ship has a core?
9. Is integrity already universal enough for a Power Core, or would adding it silently change gameplay?
10. What does current runtime do if Core capacity/current Core is zero, and can that behavior safely represent a
    ship with no installed core?

Deliverable: a short concrete migration map in the chat, then prepare Atom 1 only. Do not refactor during the audit.
If actual code uses different names than this handoff, follow the code.

#### Atom 1 — model/content compatibility foundation

Goal: the content/domain model can represent a Power Core as equipment mounted to a stable chassis slot, while the
existing runtime/UI can still operate through temporary compatibility paths.

Expected shape, adjusted to what Atom 0 actually finds:

- add a Power Core equipment kind/definition to the existing equipment vocabulary instead of creating a parallel
  "core system" hierarchy;
- give Power Core definitions the same content-owned identity and `iconId` mechanism as other equipment;
- add the smallest explicit chassis slot-kind/mount-compatibility rule needed for a dedicated Power Core node;
- allow a chassis/loadout to leave that node empty;
- let ship/loadout construction carry a mounted Power Core equipment instance by `slotId`;
- preserve the current special runtime accessor/field temporarily if later consumers still require it;
- migrate default content/fixtures only as much as needed to keep existing ships behaviorally equivalent.

Do **not** move dashboard rendering or editor UI in this atom. Do **not** remove the old special field yet if engine
or app code still reads it.

Validation floor: focused content/model tests, `npm run typecheck`, full `npm test` before declaring the gameplay
atom complete, and `git -c core.safecrlf=false diff --check`.

#### Atom 2 — engine power/state ownership migration

Goal: gameplay power truth is resolved from the mounted Power Core equipment instead of a parallel special ship
field.

Tasks after Atom 1 is pushed:

- identify the single engine owner for installed Core capacity/output/current usable Core;
- resolve that owner from the mounted Power Core definition/instance;
- migrate Core spending/affordability paths (Player Beam and every other actual consumer found in Atom 0) to the new
  owner without changing unrelated command timing;
- keep compatibility projection only where the app still needs it;
- migrate factories/fixtures/tests that construct ships directly;
- add an explicit **no installed core** scenario;
- add a broken/damaged-core scenario only if Atom 0/1 establishes that Power Core participates in generic integrity;
- prove existing default ships retain their previous Core numbers and spend behavior.

Do not guess a "no core = zero power" rule just because it sounds natural. First preserve/define the engine contract,
then test it explicitly.

#### Atom 3 — bridge/query/public payload migration

Goal: bridge-facing state treats Power Core as mounted equipment and no longer needs a second semantic source.

- project player Power Core through the generic mounted-equipment/chassis payload;
- project enemy Power Core only with presentation-safe public facts already appropriate for enemy equipment
  (identity/definition/slot/integrity if applicable);
- do not expose enemy ammo, cooldowns, AI/task state or hidden power decisions;
- migrate bridge events/snapshots/mappers that currently consume the special Power Core field;
- if one compatibility `powerCore` field must survive for a runtime-view transition, mark it temporary and delete it
  in the next consuming atom rather than letting it become permanent dual truth.

Validation: mapper/query tests + typecheck/full tests. This atom should still avoid visual redesign.

#### Atom 4 — player runtime chassis presentation

Goal: Power Core appears on MY SHIP as ordinary mounted equipment on its real chassis node.

- render it by the real `slotId` and content `iconId`;
- use the existing universal equipment tile primitives and frozen visual grammar;
- do not create a one-off Power Core tile unless mechanics genuinely require unique interaction behavior;
- preserve existing integrity/state language rather than tinting the icon;
- remove the special MY SHIP header CORE presentation once the chassis tile is the authoritative visible source;
- reclaim/adjust header space only as a tiny consequence of removing that field, not as a dashboard redesign.

Runtime screenshot/smoke is required because tests cannot prove placement/readability.

#### Atom 5 — enemy runtime chassis presentation

Goal: a public enemy Power Core is rendered on ENEMY SHIP through the same mounted-equipment path.

- use the enemy schematic's existing mirrored presentation transform; do not mirror canonical content coordinates;
- render by `slotId` / `iconId` like other enemy equipment;
- preserve the existing public-state boundary;
- remove any remaining special enemy/header Core presentation;
- keep existing Beam slot-selection behavior mechanically unchanged.

Whether the Power Core node is targetable must follow the engine/target contract established by the migration. Do
not use this atom to redesign Beam target hover/tooltips or introduce a new targeting mode.

#### Atom 6 — editor/content authoring migration

Goal: Power Core is authored like equipment instead of through a special editor field.

- expose/select the Power Core definition through the existing equipment/content mechanisms;
- reuse the `equipment_icons` asset bucket / `iconId` selector;
- let the chassis/loadout editor place or omit Power Core according to the domain slot-compatibility rules;
- remove the special Power Core editor control/data field after load/save no longer depends on it;
- ensure "no core" is a valid authored loadout if that is the confirmed domain contract;
- keep validation in content/domain schema rather than adding view-only editor hacks;
- test editor/loadout serialization round-trip.

No runtime visual polish belongs here.

#### Atom 7 — compatibility and legacy cleanup

Only after all previous atoms are pushed and a fresh repo-wide zero-reference audit proves the old contract is dead:

- remove special Power Core ship/loadout fields and types;
- remove compatibility accessors/adapters/projections;
- remove stale bridge/header payload fields;
- remove obsolete content keys/editor schema fields/fixtures;
- update durable docs whose implemented-runtime statements changed;
- search for the old enemy 4x3 renderer/legacy chassis-grid adapter and delete them only if they still physically
  exist and truly have zero references.

Keep unrelated cleanup out. If Power Core cleanup and enemy-grid cleanup are independent enough to make review
messy, split them into 7A / 7B.

Final audit should search both the old Power Core vocabulary and legacy enemy `column`/`row` placement contracts,
then run typecheck/full tests/diff-check.

#### Atom 8 — optional UX/mechanics follow-ups; not part of structural migration

Only after the model is clean, and only when explicitly requested:

- Power Core tooltip/status copy;
- no-core or broken-core affordance;
- Engineer repair interaction if Power Core is meant to be repairable;
- node status micro-icons;
- Beam/node hover + tooltip + target-selection UX pass;
- dedicated Bridge/Hull art revisions.

These are deliberately outside the structural migration so visual/mechanical experiments cannot contaminate the
ownership refactor.

### Definition of done for the Power Core migration

The workstream is complete when all of the following are true:

- a ship may validly have zero or one installed Power Core according to explicit chassis/loadout rules;
- an installed Power Core is an equipment definition/instance mounted by stable `slotId`;
- engine Core gameplay has one authoritative owner derived from that mounted equipment;
- player and enemy bridge projections do not maintain a second independent Power Core truth;
- MY SHIP and ENEMY SHIP render the Core from normal chassis/equipment data;
- editor/content round-trip can add/remove/select the Core through normal equipment authoring;
- old special Power Core fields/accessors/editor controls are gone after a zero-reference audit;
- default shipping content retains intended behavior unless a deliberate gameplay rule changed;
- no enemy-private information was added to the public dashboard contract;
- targeting/tooltip redesign remains a separate follow-up unless explicitly requested.

Current source of truth:

```text
repository: elkranio/space-captain
branch: master
```

Codex Local uses the current checkout/working tree as authority. Web Chat must fetch fresh `master` and follow
`docs/WORKING_RULES.md` before preparing a patch.

## Doc map

- `docs/WORKING_RULES.md` — collaboration, patch and validation rules;
- `docs/GAME_DESIGN.md` — confirmed intended design + explicitly labelled working theories;
- `docs/GAMEPLAY_CONTRACTS.md` — current implemented runtime truth;
- `docs/EQUIPMENT.md` — equipment status + idea bank;
- `docs/BACKLOG.md` — concrete deferred work only;
- `docs/COMBAT_PLAYTEST_ROADMAP.md` — combat gates/sequencing;
- `docs/THREAT_PANEL.md` — current threat-presentation direction;
- `docs/SYSTEM_MAP.md` — durable ownership/data-flow boundaries;
- `docs/BRIDGE_ART_DIRECTION.md` — bridge/dashboard visual grammar.

## Landed foundation

### Ship/loadout/integrity

- player and enemy ships carry real `chassisId`;
- chassis own fixed semantic `HULL | BRIDGE` slots plus installable `DRIVE | WEAPON | DEFENSE | UTILITY` slots;
- every slot has a stable ID and centered chassis-local `x` / `y` coordinates;
- persistent mounts preserve `slotId -> equipmentId`;
- installed equipment owns encounter-local integrity;
- `integrity > 0` is operational, `integrity = 0` is BROKEN;
- Power Core is separate, non-spatial, non-breakable and non-targetable;
- generic BROKEN gating + generic Engineer repair are still unfinished; Drive has the existing specific repair path.

### Captain ship dashboards

MY SHIP and ENEMY SHIP are persistent lower dashboards backed by authoritative chassis/mount identity.

MY SHIP exposes own Hull/CORE/equipment state and equipment interactions. ENEMY SHIP exposes presentation-safe enemy
Hull, installed equipment, slot identity and integrity/BROKEN state without leaking hidden AI/ammo/cooldown truth.

MY SHIP now renders a physical chassis schematic from the authoritative chassis payload:

```text
600x260 hull blueprint
+ exact 100x80 slot frames at chassis x/y
+ installed equipment resolved by stable slotId
```

The chassis coordinate origin is `(0, 0)` at the blueprint center; negative X is left and negative Y is up. The
content editor and debug loadout editor use the same coordinates. ENEMY SHIP still uses the temporary legacy 4x3
renderer through an adapter; do not infer player geometry from that grid.

Power Core temporarily remains in the MY SHIP header. The confirmed later direction is a distinct Power Core node
on the fresh schematic system, while keeping it non-breakable, non-targetable and separate from installable mounts.

The existing tile grammar and shared dashboard primitives are stable enough to extend; do not schedule another
generic UI refactor pass without a concrete problem.

### Player Beam

Engine command vocabulary is currently:

```text
HULL
BRIDGE
SLOT(slotId)
```

Current dashboard targeting exposes occupied enemy equipment slots. Hull/Bridge input is not exposed there yet.

Current consequences:

- `HULL` -> Hull damage;
- operational `SLOT` -> module damage, no Hull spill;
- already-BROKEN `SLOT` -> `hullDamage * 2`;
- `BRIDGE` -> valid HIT but currently no gameplay consequence.

Player Beam spends content-defined CORE when charging starts. Player Beam now starts a full cooldown after shot
resolution or cancellation/interruption; do not restore charge/cooldown overlap.

Incoming enemy Beam and player targeted Shield still use temporary `HULL | DRIVE`. Enemy Shield is still whole-ship.
Migrating those paths to shared `HULL | BRIDGE | SLOT(slotId)` semantics remains future work.

### Sticky Mine Dispenser

Single-Mine migration is complete for both sides:

```text
Gunner MINE AIM / TARGETING
-> exactly one physical Mine release / attachment attempt
-> Gunner free
-> full dispenser cooldown
-> attached Mine runs its own fuse
```

There is no salvo, `DISPENSING` phase, release counter or launch interval.

Before physical release, Mine targeting is intentionally free to cancel/lose target/be interrupted: no ammo and no
cooldown. Release spends one ammo and starts full cooldown even if Evade makes the attachment miss.

Each attached Mine is independent. CLEAR is Engineer-only.

### SPAM

Player SPAM already has the intended high-commitment behavior: if the enemy purges the effect, the player Scientist
stays occupied until the original channel operation ends.

Enemy SPAM is currently asymmetric: player PURGE ends the enemy channel lifecycle and releases the enemy Scientist
early. That is a confirmed runtime gap, not intended design.

### Cooldown state

Confirmed shared rule: cooldown starts after active work/termination.

Already aligned or close enough on the player side: Missile, single Mine, Beam, Defense Turret, normal SPAM
completion.

Known overlap still to fix: Evade, Shield, enemy Beam, enemy Turret, enemy SPAM and any equivalent enemy Shield
path.

## Confirmed cleanup debt

### Random damage interruption

Current runtime still contains `canBeInterruptedByDamage` and random task cancellation. Penetrating enemy Beam and
enemy Sticky Mine detonation invoke it; incoming Missile does not.

This entire generic damage-interruption behavior is obsolete. Ordinary damage must not interrupt work. Future
control uses explicit `INTERRUPT` / `STUN` mechanics.

### Opening disruption pulse

The old opening Drive-disruption debug cheat still exists through app debug settings, engine API/state, event/VFX
support and `CombatEngagementRunner`.

Remove it completely in a dedicated cleanup atom. It is not gameplay and is no longer needed as the solution to
combat escape.

## Confirmed combat direction

- captain is not a fifth officer;
- basic combat information is free;
- combat is one full ship against one full ship;
- Hull is persistent run attrition, module damage is encounter-local tactical pressure;
- same equipment follows the same player/enemy physical rules;
- Defense Turret is deterministic anti-Missile in the baseline;
- Beam is precision CORE pressure;
- Sticky Mine is one release per command and Engineer workload pressure;
- SPAM is high-commitment Scientist disruption;
- Evade is expensive universal defense: WARMUP is the commitment edge, eventual termination costs 1 Drive integrity
  and then starts full cooldown;
- explicit `INTERRUPT` / `STUN` may terminate current tasks; ordinary damage does not;
- normal enemy destruction preserves still-relevant committed incoming physical danger;
- negotiated/peaceful combat end clears all threats/effects immediately on both sides;
- Escape is a future timed cancellable Pilot task through the Drive interaction.

## Threat presentation direction

Do not build the old individual compact-threat-strip concept.

Current target is:

```text
small category danger indicators
+ concrete telegraphy on the viewscreen
+ detailed concrete target selection inside the relevant equipment interaction when needed
```

No permanent one-cell-per-threat dashboard, mandatory seconds-to-impact numbers or mitigation frames are required.
`docs/THREAT_PANEL.md` owns this presentation contract.

## Working theories, not implementation contracts

Keep these ideas recorded, but do not treat them as already designed systems:

- contract loop with jump budget and report-to-outpost structure;
- spatial node map / jump radius;
- local exploration inside a node without spending contract jumps;
- Morale, pairwise relationships, traits and deeper crew progression;
- future Scientist analysis/interference kit;
- exact starting gun mechanics;
- Autocannon / Scattergun / Torpedo / Plasma and other idea-bank weapon details.

The game does need a simple starting offensive weapon; its exact family/cost/ammo/wear model is not decided.

Current `FLY_TO` / `JUMP` / `DOCK` whole-bridge-idle behavior is prototype navigation logic. Do not change it during
current combat work; revisit it as a separate travel-design task.

## Suggested next narrow atoms

After this documentation reconciliation, useful independent code atoms are:

1. remove generic random damage interruption;
2. remove the opening disruption pulse/debug support;
3. finish remaining cooldown-after-action corrections;
4. make enemy SPAM purge keep its Scientist committed;
5. migrate incoming Beam / targeted Shield / enemy Shield toward `HULL | BRIDGE | SLOT(slotId)`;
6. finish generic BROKEN gating + Engineer repair;
7. implement the lighter danger-indicator / viewscreen / inline-interaction threat presentation;
8. run the first weak-player vs weak-enemy timing/balance smoke.

These are alternatives/sequence candidates, not authorization to implement all of them in one patch.

## Current checkpoint: player chassis schematic

The bridge visual integration is accepted. Do not start another broad bridge-art pass unless a concrete regression
appears.

Atom 3 replaces the player 4x3 equipment grid with the physical chassis schematic.

Implemented boundaries:

- `BridgePlayerShipChassisView` owns blueprint, exact slot-frame and equipment layers;
- the player dashboard payload carries detached chassis geometry and equipment `slotId` references;
- equipment interactions, Beam selection, progress and BROKEN/readiness state remain on the existing tile views;
- chassis data, schema, fixtures and both editors use centered coordinates;
- current chassis coordinates were migrated without changing their intended on-surface placement;
- player-only legacy grid rendering was removed; the enemy legacy renderer remains until its own migration;
- no new sprite was required: the renderer uses the existing hull blueprint and
  `equipment/ui/equipment_slot` atlas frame.

Primary routes for visual follow-up:

- `src/app/scenes/game/bridge/view/captain_dashboard/player_ship/equipment/BridgePlayerShipChassisView.ts`;
- `src/app/scenes/game/bridge/controller/captain_dashboard/BridgePlayerShipDashboardMapper.ts`;
- `src/app/scenes/game/bridge/events/bridge_event.ts`;
- `src/engine/content/data/ship_chassis.json`;
- `src/engine/content/schemas/ship_chassis.ts`;
- `tools/content-editor/src/ship_slot_editor.ts`;
- `tools/content-editor/src/debug_start_ship_loadout_editor.ts`.

Validation completed for the atom:

```text
npm run typecheck
npm test                 -> 118 files / 329 tests passed
npm run build
git diff --check
```

The only missing check is visual runtime inspection. The Work environment could build the game but could not open
its localhost preview. After the patch lands, inspect MY SHIP and both editors in the real runtime before tuning
positions or colors.

### Next narrow boundary

1. Run the player schematic and editor visual smoke on fresh `master`.
2. Fix only concrete layout/rendering regressions found there.
3. Then migrate ENEMY SHIP from its legacy 4x3 adapter to chassis geometry as a separate atom. Preserve existing
   equipment target selection; add Hull/Bridge targeting input only as an explicit follow-up.

Do not fold Power Core-node redesign, generic BROKEN repair, incoming Beam target migration or new equipment into
that renderer atom.

### Locked presentation contract

```text
chassis art
+ fixed Hull target slot
+ fixed Bridge target slot
+ fixed Drive slot
+ chassis-defined installable equipment slots
+ installed equipment content
```

- Hull has a dedicated chassis target slot so it stays easy to click even on a dense ship.
- Bridge is also a fixed chassis target slot.
- Hull and Bridge participate in the common slot geometry/editor system but never accept installable equipment.
- Drive remains the single fixed `DRIVE` equipment slot.
- Remaining installable slots keep stable IDs and slot kinds.
- Empty installable slots are visible mounting locations, not generic empty spreadsheet cells.
- Player and enemy presentation may mirror chassis geometry, but text/glyph content stays readable and unmirrored.
- Power Core stays separate, non-spatial, non-breakable and non-targetable.

### Geometry ownership

Current chassis data owns stable slots, kinds and centered `x` / `y`. Do not add a second parallel layout truth:

- chassis content/domain data owns slot positions and purposes;
- geometry is chassis-local, not screen coordinates;
- the view maps chassis-local positions into dashboard bounds;
- Hull / Bridge / Drive geometry belongs to the same chassis definition as installable slots;
- the editor must be able to add/remove/move slots and assign their purpose;
- do not put authoritative slot positions in `captain_dashboard_layout.ts`.

Canonical surface and slot geometry:

```text
surface: 600x260
slot:    100x80
origin:  blueprint center
X:       negative left, positive right
Y:       negative up, positive down
```

Stable slot IDs are required now even though topology is future work. Later effects such as "damage a neighboring
slot" should use explicit chassis links/topology, not runtime screen-distance calculations.

Start from:

- `src/engine/defs/ship_slot.ts`;
- `src/engine/content/schemas/ship_chassis.ts`;
- `src/engine/content/data/ship_chassis.json`.

Keep the representation explicit and dumb. We do not need a generic layout engine.

### Universal equipment tile

Baseline tile is roughly `90x70` at the 1280x720 game resolution.

Accepted tile grammar:

- the physical slot owns the thick beveled frame; equipment content does not draw a second thin card frame;
- main equipment icon;
- quiet divider;
- bottom-left telemetry glyph + value, e.g. Missile glyph + ammo;
- bottom-right integrity pips;
- hover action hint such as `G FIRE`, `E REPAIR`, `G CANCEL`;
- officer letter uses that role's color.

Slot-state grammar:

- `READY` -> ordinary blue slot frame;
- `BROKEN` -> whole slot frame red; dim the equipment icon but do not red-tint arbitrary art;
- active work (`AIMING`, `CHARGING`, `RELOADING`, etc.) -> base blue frame plus progress tracer on the inner contour;
- `REPAIRING` -> broken red contour progressively returns to normal blue as repair advances;
- no large warning badge over the icon.

Colors can be tuned after mechanics/rendering are stable.

### Targeting on the schematic

Existing semantic vocabulary remains:

```text
HULL
BRIDGE
SLOT(slotId)
```

Presentation mapping:

- Hull target slot -> `HULL`;
- Bridge target slot -> `BRIDGE`;
- occupied targetable equipment slot -> `SLOT(slotId)`.

Hull/Bridge use the same visual slot grammar for clickability, but remain semantic targets rather than installable
equipment.

Player grid-specific rendering is gone. Delete the remaining enemy 4x3 adapter and grid-specific presentation only
when ENEMY SHIP has migrated and its targeting path is proven end-to-end.

### Chassis art constraints

Current player schematic target is approximately `600x260` inside the left dashboard.

Art workflow is deliberately split:

```text
hull-only chassis art
+ exact programmatic/UI bay overlays
```

Do not bake exact bay frames into generated hull art: generation distorts their sizes and positions. The hull art
may carry plating, ribs and recessed channels while the UI owns exact reusable bay frames.

Current visual direction:

- top-down, rear left / nose right;
- chunky modular industrial ship, not fish/zeppelin shaped;
- blue-steel VGA/pixel-art rendering;
- avoid exposed pipe spaghetti;
- current schematic already fills the player dashboard well; do not enlarge it based on space belonging to the
  enemy dashboard.

### Bridge visual baseline: do not regress

- current viewscreen geometry is accepted;
- panorama display scale is locked at `1.0`; `2.0` was visibly over-zoomed;
- current ship/beacon scale and placement are accepted;
- only revisit bridge art/layout if runtime work exposes a concrete problem.

## Holdouts

Still avoid touching these without a concrete task:

- `src/config/gameConfig.ts`;
- EndScene console logging;
- `ScreenWakeLock`;
- `BridgeMissileDebugView` / Missile debug config.

Two unrelated production follow-ups remain documented in `docs/BACKLOG.md`: zero-duration Power Core validation
mismatch and the asset-deletion `generic` manifest-id protection issue.
