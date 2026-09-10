# Space Captain — Current Handoff

This is the only live handoff file. Git history owns completed migration/refactor history; keep this file focused on
the current repository state and the next useful boundaries.

## CURRENT STATE — 2026-09-10

Baseline when this handoff was refreshed:

```text
repository:    elkranio/space-captain
branch:        master
master:        1ac3741f5fffafd7c9d43949885aea0887916152
typecheck:     green after the latest cleanup atom
tests:         focused + full suite green after the latest cleanup atom
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

## Active cleanup campaign

`docs/CODE_CLEANUP_PLAN.md` owns the temporary Web Chat cleanup campaign. Phases 0–6 are complete. Phase 7 has
completed a broad green subsystem pass; one final cross-subsystem cognitive audit remains before campaign closure.

Current cleanup results:

- proven dead leaves are removed; production ship construction, snapshot transport, editor ownership and dashboard
  lifecycle boundaries were simplified only where current source proved duplicated or obsolete structure;
- `PlayerShipStore`, `EncounterStateStore`, `BridgePlayerShipDashboardMapper` and the four Bridge encounter
  orchestration/synchronization owners remain deliberate boundaries after audit;
- Phase 6 merged the anchor variants and colocated `ShipDecisionState` with the ship actor contract; the generic actor
  split and remaining small domain definition files were retained where they still communicate useful vocabulary;
- Phase 7 removed proven local cognitive noise in dashboard input plumbing, Beam selection control flow, enemy weapon
  role selection, enemy timed-task progression, weapon-definition narrowing/plumbing and `CombatRunner` forwarding;
- `EncounterSnapshotReader`, `EnemyThreatObserver`, concrete Power Core/Shield/Defense Turret runners,
  crew-performance queries and the meaningful `CombatRunner` phase helpers were audited and retained.

Recommended next Web Chat boundary: from fresh `master`, run the final Phase 7 cognitive audit with a bias toward
subsystems not already classified. Do not reopen an accepted `KEEP` without concrete new evidence. If the final pass
finds no remaining high-value simplification, close the campaign and remove `docs/CODE_CLEANUP_PLAN.md`.

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
- `docs/CODE_CLEANUP_PLAN.md` — temporary cleanup campaign for Web Chat;
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
