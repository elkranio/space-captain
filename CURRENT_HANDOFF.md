# Space Captain — Current Handoff

This is the only live handoff file. Git history owns completed migration/refactor history; keep this file focused on
the current repository state and the next useful boundaries.

## CURRENT STATE — 2026-09-10

Baseline when this handoff was refreshed:

```text
repository:    elkranio/space-captain
branch:        master
master:        55ef1d8b0e53f9e8837df0553e0b18dfbc07db3f
typecheck:     green after the reusable ship catalog migration
tests:         117 files / 354 tests green after the reusable ship catalog migration
```

Fresh repository state still wins. Web Chat starts every atom from fresh `master`; Codex Local uses the current
workspace. Both workflows must read the exact touched source and tests before editing and follow
`docs/WORKING_RULES.md`.

## Current gameplay/runtime boundaries

### Ship, chassis and equipment

- player and enemy ships carry real `chassisId`;
- chassis own fixed semantic `HULL | BRIDGE` slots plus installable
  `DRIVE | POWER_CORE | WEAPON | DEFENSE | UTILITY` slots;
- persistent mounts preserve stable `slotId -> equipmentId` identity;
- reusable physical builds live in one ship catalog shared by player and enemy assembly;
- Drive is required; Power Core, Defense Turret and Shield Generator are optional singletons; weapons may be empty;
- `EncounterEngine` receives one cohesive persistent `PlayerShipState` and snapshots it into encounter-local state;
- installed equipment owns encounter-local integrity;
- `integrity > 0` is operational and `integrity = 0` is BROKEN;
- generic BROKEN gating and generic Engineer repair are unfinished; Drive retains the only dedicated repair path;
- Power Core is optional mounted equipment on a dedicated `POWER_CORE` slot;
- a Core participates only when its runtime equipment ID is present in `mounts`;
- BROKEN Core pauses recharge generation only: stored charges remain spendable and partial recharge progress freezes.

### Captain dashboards

MY SHIP and ENEMY SHIP use the physical chassis schematic on the canonical `600x260` surface with exact `100x80`
slot geometry and centered chassis-local coordinates.

- ENEMY SHIP mirrors presentation X only; canonical content coordinates remain unchanged;
- installed equipment is resolved by stable slot/mount identity;
- Core chassis tiles show integrity/BROKEN state;
- both ship headers show Core charges/capacity/recharge progress;
- enemy ammo, ordinary system cooldowns, AI decisions and crew tasks remain private;
- accepted dashboard geometry and tile grammar are stable; only address concrete regressions.

### Combat

- player Beam target vocabulary is `HULL | BRIDGE | SLOT(slotId)`;
- current dashboard targeting exposes occupied enemy equipment slots; Hull/Bridge input is still future work;
- incoming enemy Beam and targeted player Shield still use temporary `HULL | DRIVE` targeting;
- enemy Shield is still whole-ship;
- Sticky Mine uses one physical release per command; there is no salvo/`DISPENSING` phase;
- player SPAM keeps the Scientist committed after enemy purge;
- enemy SPAM still releases its Scientist early after player purge;
- ordinary damage does not randomly interrupt officer work;
- future control must use explicit `INTERRUPT` / `STUN` mechanics;
- the old opening Drive-disruption pulse has been removed;
- `evadeAtCombatStart` remains as an independent app-side debug behavior.

Confirmed cooldown rule: full cooldown starts after active work or termination. Remaining runtime alignment work
includes Evade, Shield, enemy Beam, enemy Defense Turret, enemy SPAM and the equivalent enemy Shield path.

Confirmed Evade direction: WARMUP is the commitment edge; completion/cancel/explicit interruption costs one Drive
integrity and then starts full cooldown. The final Drive integrity point may power one last Evade and break afterward.

### Encounter and threat direction

- combat is one full ship against one full ship;
- Hull is persistent run attrition; module damage is encounter-local tactical pressure;
- normal enemy destruction preserves still-relevant committed incoming physical danger;
- negotiated/peaceful combat end clears threats/effects immediately on both sides;
- Escape remains a future timed cancellable Pilot task through the Drive interaction;
- threat presentation uses small category indicators, concrete viewscreen telegraphy and detailed inline target
  selection where needed; do not restore the old permanent compact-threat-strip concept.

## Cleanup status

The broad cleanup campaign is closed on `9230c26a60f3008b9de22606b1b67e7608d675f7`. The final cognitive pass found
one remaining high-value transport smell and removed it: Bridge/tests now pass a cohesive `PlayerShipState` into
`EncounterEngine`; `createEncounterState` is the single decomposition boundary into encounter-local runtime state.
The final atom passed typecheck and the full test suite before push.

Current ownership conclusions remain deliberate:

- `PlayerShipStore` stays the cohesive player-ship mutation owner;
- `EncounterStateStore` stays the encounter-state facade;
- `BridgePlayerShipDashboardMapper` stays one projection owner rather than splitting for LOC;
- `BridgePlayerShipChassisView` keeps one collection owner for weapon-tile lifecycle;
- `BridgeEncounterController`, `BridgeEncounterEngineEventHandler`, `BridgeEncounterSnapshotSynchronizer` and
  `BridgeEncounterPersistenceSynchronizer` stay separate because orchestration, one-shot effects, current-state
  projection and persistence are different contracts;
- `EncounterSnapshotReader`, `EnemyThreatObserver`, concrete Power Core/Shield/Defense Turret runners,
  crew-performance queries and meaningful `CombatRunner` phase helpers remain justified boundaries;
- do not introduce a generic event bus, service locator, queued outbox or universal command layer to shorten plumbing.

Do not start another broad cleanup campaign by default. Refactor these areas only when fresh source provides concrete
cognitive or correctness evidence. Git history owns the completed campaign archaeology.

## Reusable ship catalog

`docs/SHIP_CATALOG.md` owns the durable current contract. The three planned migration atoms are complete on
`55ef1d8b0e53f9e8837df0553e0b18dfbc07db3f`:

- `src/engine/content/data/ships.json` owns reusable physical ship builds for both player and enemy assembly;
- Debug Start owns only `playerShipId` / `enemyShipId` references and no embedded physical loadouts;
- `ShipPreset` remains the physical assembly contract consumed by `ShipFactory`; there is no parallel runtime builder;
- the content editor has a top-level Ships authoring surface, duplication and compact Starting Ships selectors;
- ship/chassis/equipment reference integrity is enforced across all saved builds, not only current Debug Start choices;
- team, crew, actor/scenario identity and AI behavior remain outside reusable ship definitions.

The migration passed typecheck, 117 test files / 354 tests and browser smoke covering the main authoring and
reference flows. Do not reopen the completed migration plan; future gameplay should consume the reusable catalog
boundary directly.

## Other useful gameplay atoms

Choose independently; do not combine these with cleanup unless the cleanup is strictly required by the atom:

1. finish remaining cooldown-after-action corrections;
2. make enemy SPAM purge keep its Scientist committed;
3. migrate incoming Beam / targeted Shield / enemy Shield toward `HULL | BRIDGE | SLOT(slotId)`;
4. finish generic BROKEN gating and Engineer repair;
5. implement Evade Drive wear;
6. continue threat readability and weak-player-vs-weak-enemy combat smoke.

## Doc map

- `docs/WORKING_RULES.md` — durable collaboration, patch and validation rules;
- `docs/SHIP_CATALOG.md` — reusable ship content, editor workflow and reference-integrity contract;
- `docs/GAME_DESIGN.md` — confirmed intended design and explicitly labelled working theories;
- `docs/GAMEPLAY_CONTRACTS.md` — current implemented runtime truth;
- `docs/EQUIPMENT.md` — equipment status and idea bank;
- `docs/BACKLOG.md` — concrete deferred work only;
- `docs/COMBAT_PLAYTEST_ROADMAP.md` — combat gates and sequencing;
- `docs/THREAT_PANEL.md` — current threat-presentation direction;
- `docs/SYSTEM_MAP.md` — durable ownership and data-flow boundaries;
- `docs/BRIDGE_ART_DIRECTION.md` — bridge/dashboard visual grammar.

## Working theories, not implementation contracts

- contract loop with jump budget and report-to-outpost structure;
- spatial node map / jump radius;
- local exploration inside a node without spending contract jumps;
- Morale, pairwise relationships, traits and deeper crew progression;
- future Scientist analysis/interference kit;
- exact starting gun mechanics;
- Autocannon / Scattergun / Torpedo / Plasma and other idea-bank weapon details.

The game needs a simple starting offensive weapon; its exact family/cost/ammo/wear model is not decided. Current
`FLY_TO` / `JUMP` / `DOCK` whole-bridge-idle behavior is prototype navigation logic and should be revisited as a
separate travel-design task.

## Holdouts

Do not touch these without a concrete task:

- `src/config/gameConfig.ts`;
- EndScene console logging;
- `ScreenWakeLock`;
- `BridgeMissileDebugView` and Missile debug config;
- framework/p34t `src/system/Utils.ts`, `AudioManager.ts` and `StorageManager.ts` unless active work requires them.

Two unrelated correctness follow-ups remain in `docs/BACKLOG.md`: the zero-duration Power Core validation mismatch
and the asset-deletion `generic` manifest-ID protection issue.
