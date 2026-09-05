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

## Holdouts

Still avoid touching these without a concrete task:

- `src/config/gameConfig.ts`;
- EndScene console logging;
- `ScreenWakeLock`;
- `BridgeMissileDebugView` / Missile debug config.

Two unrelated production follow-ups remain documented in `docs/BACKLOG.md`: zero-duration Power Core validation
mismatch and the asset-deletion `generic` manifest-id protection issue.
