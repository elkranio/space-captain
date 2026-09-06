# Space Captain — Current Handoff

This is the only live handoff file. Git history owns completed migration/refactor history; keep this file focused on
the current repository state and the next useful boundaries.

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
- chassis own stable `DRIVE | WEAPON | DEFENSE | UTILITY` slots and grid positions;
- persistent mounts preserve `slotId -> equipmentId`;
- installed equipment owns encounter-local integrity;
- `integrity > 0` is operational, `integrity = 0` is BROKEN;
- Power Core is separate, non-spatial, non-breakable and non-targetable;
- generic BROKEN gating + generic Engineer repair are still unfinished; Drive has the existing specific repair path.

### Captain ship dashboards

MY SHIP and ENEMY SHIP are persistent lower dashboards backed by authoritative chassis/mount identity.

MY SHIP exposes own Hull/CORE/equipment state and equipment interactions. ENEMY SHIP exposes presentation-safe enemy
Hull, installed equipment, slot identity and integrity/BROKEN state without leaking hidden AI/ammo/cooldown truth.

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

## Immediate next task: chassis schematic dashboard

The bridge visual integration is accepted. Do not start another broad bridge-art pass unless a concrete regression
appears.

The next implementation task is replacing the old 4x3 equipment-grid presentation with a physical chassis
schematic. Do this before adding more equipment varieties.

Locked presentation contract:

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

Current chassis data already owns stable slots, kinds and `column` / `row`. Those fields encode the old grid model.

Migrate that geometry rather than adding a second parallel layout truth:

- chassis content/domain data owns slot positions and purposes;
- geometry is chassis-local, not screen coordinates;
- the view maps chassis-local positions into dashboard bounds;
- Hull / Bridge / Drive geometry belongs to the same chassis definition as installable slots;
- the editor must be able to add/remove/move slots and assign their purpose;
- do not put authoritative slot positions in `captain_dashboard_layout.ts`.

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

Once the schematic path works end-to-end, delete obsolete 4x3/grid-specific rendering, targeting geometry and
layout helpers. Do not keep both systems after the new one is proven.

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
