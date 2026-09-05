# Space Captain — Web Chat Start Here

> **WEB CHAT ONLY.** Codex Local ignores this file unless the user explicitly asks to maintain it.

Connector-efficiency map for ChatGPT Web Chat. This is a routing/cache layer, not a second handoff or gameplay
contract.

## Authority

Use each source for the thing it owns:

- `CURRENT_HANDOFF.md` — current checkpoint / next boundaries;
- `docs/WORKING_RULES.md` — patch workflow, validation and coding rules;
- `docs/GAME_DESIGN.md` — confirmed intended design + clearly labelled working theories;
- `docs/GAMEPLAY_CONTRACTS.md` — current implemented runtime truth;
- `docs/EQUIPMENT.md` — equipment status and idea bank;
- `docs/BACKLOG.md` — concrete deferred work;
- `docs/SYSTEM_MAP.md` — durable ownership/data-flow;
- exact current source/tests — final authority for implementation behavior.

If sources disagree, distinguish **runtime truth** from **intended design** rather than blending them into a guess.

## Web Chat patch flow

1. Read this file + `CURRENT_HANDOFF.md` once at session start.
2. Read only the durable docs relevant to the atom.
3. Fetch exact current `master` source/tests before changing behavior.
4. Before a tracked-text patch, obtain full exact contents for every touched file.
5. Generate a real git diff and validate `git apply --check` against the same preimages.

Full collaboration rules live only in `docs/WORKING_RULES.md`.

## Repository map

```text
src/engine/**
    headless gameplay/domain authority

src/app/**
    Phaser-facing app/presentation

src/app/scenes/game/bridge/**
    bridge controller / mapper / view boundary

assets/raw/images/**
    source art

assets/live/images/**
public/assets/images/**
    packed/generated art
```

Do not route Phaser/app types into `src/engine/**`.

## High-value routers

### Officer commands / availability

Start with:

- `src/engine/defs/officer.ts`;
- `src/engine/encounter/model/command.ts`;
- `src/engine/encounter/commands/`;
- `src/engine/encounter/officer_availability/`;
- `docs/GAMEPLAY_CONTRACTS.md`.

Stable roles are exactly:

```text
scientist
pilot
gunner
engineer
```

### Ship slots / BROKEN / mounts

Stable identity chain:

```text
ship.chassisId + ship.mounts
-> mount.equipmentId -> mount.slotId
-> chassis slot
-> dashboard cell / semantic target
```

Invariants:

- slot identity is stable `slotId`, never weapon-array order;
- installed equipment owns integrity/BROKEN;
- slots own spatial identity only;
- Power Core is separate/non-spatial.

Generic BROKEN gating/repair is still incomplete; verify current code before assuming a family blocks/repairs
correctly.

### Player Beam

Primary routes:

- `src/app/scenes/game/bridge/controller/captain_dashboard/BridgeBeamTargetSelectionController.ts`;
- `src/engine/encounter/model/combat.ts`;
- `src/engine/encounter/commands/handlers/gunner_fire_beam_cannon_command_handler.ts`;
- `src/engine/encounter/combat/beam_cannon/PlayerBeamCannonRunner.ts`;
- enemy dashboard snapshot/mapper/views.

Current engine target vocabulary:

```text
HULL
BRIDGE
SLOT(slotId)
```

Current dashboard targeting exposes equipment slots. `BRIDGE` currently resolves as a HIT with no additional
gameplay consequence. Incoming enemy Beam + player Shield still use temporary `HULL | DRIVE`; enemy Shield remains
whole-ship.

Do not "clean up" BRIDGE out of the engine merely because its consequence is unfinished.

### Sticky Mine

Primary routes:

- `src/engine/content/data/officer_tasks_gunner.json`;
- `src/engine/content/data/sticky_mine_dispensers.json`;
- `src/engine/encounter/combat/sticky_mine/PlayerStickyMineDispenserRunner.ts`;
- `src/engine/encounter/combat/sticky_mine/CombatStickyMineRunner.ts`;
- `src/engine/encounter/officer_tasks/OfficerTaskRunner.ts`.

Stable current contract:

```text
one targeting operation
-> one physical release
-> one ammo spent
-> full cooldown
```

Before release, player cancellation/interruption/target loss is free. There is no salvo/`DISPENSING` lifecycle.

### SPAM

Primary routes:

- `src/engine/encounter/combat/spam/PlayerSpamProjectorRunner.ts`;
- `src/engine/encounter/combat/spam/CombatSpamRunner.ts`;
- enemy crew task runner / purge path;
- crew-performance effect queries.

Current asymmetry matters: enemy PURGE of player SPAM leaves player Scientist committed; player PURGE of enemy SPAM
currently releases enemy Scientist early. Intended design wants both directions committed through original operation
time.

### Damage / control

Fetch exact current code before touching interruption semantics.

Current runtime still has random damage interruption through `canBeInterruptedByDamage` and
`OfficerTaskRunner.interruptRandomTaskByDamage()`. Intended design removes that behavior; future control should be
explicit `INTERRUPT` / `STUN`.

### Threat presentation

Read `docs/THREAT_PANEL.md` + current bridge views.

Current target is **not** an individual compact threat strip. Use:

```text
category danger indicators
+ concrete viewscreen telegraphy
+ detailed inline equipment interaction when exact incoming-target choice is needed
```

Do not revive one persistent card/countdown/progress frame per concrete threat from old docs/mockups.

### Encounter snapshot/event bugs

Start with:

- `src/app/scenes/game/bridge/controller/encounter/BridgeEncounterController.ts`;
- encounter `engine_events/` and `snapshots/` adapters;
- `src/engine/encounter/snapshots/`;
- the concrete engine runner/store that owns the fact.

Remember:

```text
event    = something happened once
snapshot = what is true now
```

## Assets

Current semantic source-art routing:

```text
bridge/**                  bridge-specific art
combat/**                  reusable combat objects/effects
equipment/icons/**         reusable equipment art
icons/resources/**         resource symbols
icons/threats/**           reusable threat symbols when an actual UI needs them
icons/status/**            status symbols
ui/**                      generic controls
world/**                   world objects
```

Frame keys derive recursively from `assets/raw/images/**` and omit `.png` in TypeScript manifests.

## Holdouts

Do not touch these opportunistically:

- `src/config/gameConfig.ts`;
- existing EndScene `console.log`;
- `ScreenWakeLock`;
- `BridgeMissileDebugView` / Missile debug config.

The legacy opening Drive-disruption debug pulse is **not** a holdout; it is now explicit cleanup debt in
`BACKLOG.md`.

## Doc router

- workflow / validation → `WORKING_RULES.md`
- ownership → `SYSTEM_MAP.md`
- intended mechanics → `GAME_DESIGN.md`
- runtime mechanics → `GAMEPLAY_CONTRACTS.md`
- equipment / ideas → `EQUIPMENT.md`
- bridge visual language → `BRIDGE_ART_DIRECTION.md`
- threat presentation → `THREAT_PANEL.md`
- combat gates → `COMBAT_PLAYTEST_ROADMAP.md`
- concrete debt → `BACKLOG.md`
- current checkpoint → `../CURRENT_HANDOFF.md`
