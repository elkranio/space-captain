# Space Captain — Ship Catalog Plan v0

Completed in the local workspace on 2026-09-10: all three atoms below are implemented and validated.
The current format, editor workflow, ownership, reference rules and verification are documented in
[`SHIP_CATALOG.md`](SHIP_CATALOG.md). This plan is retained as the agreed scope/acceptance reference so existing
handoff links remain useful; it is no longer a queue of unfinished work.

## Confirmed direction

Ships are reusable game content, not Debug Start-owned configuration.

A ship definition describes the physical build needed to assemble a ship consistently:

- stable content ID and display name;
- chassis identity;
- equipment installed into valid chassis slots;
- only assembly/start-state data that current runtime construction actually requires.

Do not put encounter-local runtime state into ship content. Integrity damage, cooldown progress, temporary effects and
other encounter-local state remain runtime concerns. Preserve current persistent/runtime ownership instead of using
this migration to redesign ship state.

Player and enemy physical builds use the same ship catalog. A ship definition does not own team, crew or AI behavior.
Those remain actor/scenario concerns and are attached by the code that places the built ship into a concrete role.

Target flow:

```text
Ships content
-> reusable chassis + equipment build

Debug Start
-> playerShipId
-> enemyShipId

scenario / actor assembly
-> resolve ship definition
-> build physical ship state
-> attach player/enemy role, crew and behavior outside the ship definition
```

`Debug Start` should end with one compact `Starting Ships` section containing two ship references:

```text
Player Ship: <ship content reference>
Enemy Ship:  <ship content reference>
```

This lets combat testing switch between prepared builds such as baseline ships, Missile boats or Beam-focused ships
without reconstructing and losing previous slot layouts.

## Atom 1 — content model and runtime migration

Goal: make reusable ship definitions normal content and make Debug Start reference them without changing the current
start scenario behavior.

Before choosing a new type, audit the exact current `ShipPreset`, Debug Start schema/content, ship assemblers,
factories and all production/test consumers. The cleanup campaign deliberately retained `ShipPreset`; this new
product requirement is the first concrete reason to reconsider its role. Prefer evolving the existing contract when
it already represents the needed information over creating a parallel near-duplicate type.

Implementation target:

1. introduce or evolve one reusable ship-definition content contract;
2. create catalog entries matching the current Debug Start Player Ship and Enemy Ship builds;
3. replace embedded Debug Start physical ship configuration with `playerShipId` / `enemyShipId` references;
4. resolve those references at the existing assembly boundary and build the same real player/enemy physical state;
5. keep team, crew and enemy behavior outside the reusable ship definition;
6. migrate tests/fixtures only as required by the new production contract, without restoring optional production
   inputs for test convenience.

Definition of done:

- Debug Start no longer owns embedded chassis/equipment builds;
- current default Player Ship and Enemy Ship start identically to the pre-migration behavior;
- one normal content owner exists for reusable ship builds;
- no second parallel ship-build vocabulary exists without concrete need;
- `npm run typecheck`, focused tests and full `npm test` are green.

## Atom 2 — Ships editor and Starting Ships UI

Goal: expose the reusable catalog as a normal top-level editor section and reduce Debug Start to references.

Implementation target:

1. add a top-level `Ships` content section;
2. edit stable ID/display name, chassis and equipment placement on the chassis slots;
3. reuse/extract the current Debug Start ship editor behavior rather than copying two implementations;
4. replace the old Debug Start `Ships` editing surface with a compact `Starting Ships` section;
5. expose `Player Ship` and `Enemy Ship` as dropdown/reference controls backed by the reusable ship catalog.

Definition of done:

- multiple ship builds can coexist in content;
- changing Debug Start between those builds does not mutate or destroy their saved layouts;
- both player and enemy dropdowns can select any valid reusable ship definition;
- editor save/load preserves the catalog and Debug Start references;
- editor typecheck/tests and relevant runtime validation are green.

## Atom 3 — reference integrity and ship-authoring UX

Goal: make normal ship authoring safe and fast after the structural migration is green.

Implementation target:

1. integrate ship references with the existing content-reference validation/deletion rules;
2. prevent Debug Start from silently retaining a missing Player Ship or Enemy Ship reference;
3. remove old Debug Start-specific chassis/equipment cascade code that became dead after Atom 2;
4. add `Duplicate Ship` if the existing editor ownership allows it cleanly;
5. duplication creates a new stable ship ID while copying chassis/loadout data, without sharing mutable data.

Primary workflow to support:

```text
Baseline Enemy
-> duplicate
-> Missile Boat
-> change a few equipment slots
-> keep both builds available in Starting Ships
```

Definition of done:

- create/edit/duplicate/delete cannot leave invalid ship references unnoticed;
- no obsolete embedded Debug Start ship editor path remains;
- variant creation is fast enough for repeated combat-test loadouts;
- full validation is green.

## Explicit non-goals for v0

Do not use this migration to design:

- player-only versus enemy-only ship catalogs;
- crew templates or crew progression;
- enemy AI/archetype registries;
- encounter-local integrity/cooldown/effect persistence inside content;
- future saved-player-ship progression;
- a generic entity/preset framework;
- automatic balancing or procedural loadout generation.

Those can consume the reusable ship catalog later if concrete gameplay work requires it.
