# Space Captain — Refactor / Audit Handoff

Immediate coding handoff.

Checkpoint:

```text
master
5a37de2d24c8212c8ff1251ab097f75b293e5f9b
```

## Objective

Do not add new combat mechanics yet.

```text
legacy cleanup
→ god objects / unnecessary segmentation
→ naming/model truth
→ transport/spaghetti/callback graph
→ final consistency
→ semantic laser targeting
```

Legacy cleanup is effectively complete.

## Immediate write atom: remove Local Space / GameOverlay

Old UI:

- small Local Space icon centered near top of game;
- opens popup representation/list of current node;
- old presentation, not navigation source of truth.

Confirmed current UX fact:

```text
FLY_TO is NOT triggered through Local Space.
FLY_TO currently lives through the officer context-menu path.
```

Intended removal scope, after fresh exact inventory:

```text
remove:
- Local Space icon/button
- Local Space popup/panel/current-node representation
- GameOverlay scene/controller/event/layer/view code if only used by this feature
- Local Space-only manifests/theme/constants/tests
- now-unreferenced Local Space-only asset references
```

Do NOT remove:

```text
- SpaceNode/world domain data
- navigation state
- anchors/beacons used by gameplay
- HELM_FLY_TO
- targetAnchorId / targetNodeId contracts required by navigation
- fly/dock/jump command handlers
- universe generation
```

Rule:

```text
delete dead presentation adapters;
keep domain source of truth.
```

Do not leave dead bridge events/snapshots just to reuse them later. Future navigation
dashboard should project fresh data from domain/navigation state.

## Acceptance

After atom:

- no top-center Local Space icon;
- no popup node map/list;
- no permanent GameOverlay scene if it has no other purpose;
- no Local Space-only imports/events/manifests;
- navigation domain compiles;
- current officer-context-menu `FLY_TO` still works;
- no replacement navigation UI in this atom.

Checks:

```bash
npm run typecheck
npm test
```

Runtime smoke bridge + current `FLY_TO`.

## Legacy cleanup already completed

Removed:

- unreachable `BridgeUiView`;
- old player ship-status transport/readback;
- dashboard `GameRuntime` reread;
- dead enemy debug presentation;
- dead enemy telemetry presentation;
- player shield generator;
- enemy/generic shield generator;
- shield field presentation/manifests;
- incoming laser `BLOCKED`;
- `LEFT/CENTER/RIGHT` laser target zones;
- `LaserTargetZone` / `targetZone`;
- laser directional Science identification;
- stale spatial-laser tests/comments.

Do not recreate compatibility shims.

## Current defense/laser truth

Defense:

```text
DEFENSE CAPACITOR
capacity 4
24s sequential recharge
```

Point defense spends shared DEF.

Laser:

```text
TARGETING → CHARGING → deterministic HULL hit → COOLDOWN
```

Incoming laser no longer consumes RNG for a spatial zone.
Science does not identify a property that no longer exists.

## First high-context candidates after Local Space

Audit highlighted:

```text
BridgeEncounterEngineEventHandler
~870 lines
~51 emits
~32 switch cases

BridgeEncounterController
~536 lines
~26 methods
~9 event listeners
```

Stronger candidates than merely-large contract/facade files.

Also:

```text
bridge_event.ts
~979 lines
```

Do not split `bridge_event.ts` merely because it is long.

`EncounterEngine` currently looks like a legitimate public facade/composition root;
size alone is not evidence of a god object.

## How to audit a god object

Before changing:

1. Identify distinct responsibilities.
2. Check whether state mutation, event routing, mapping, persistence and lifecycle
   are mixed in one class.
3. Identify which responsibilities force unrelated files to be open together.
4. Prefer deleting responsibilities before extracting them.
5. Refactor only if concepts/hops decrease.

Good:

```text
fewer reasons to edit one class
fewer dependencies
fewer mapping hops
clearer source of truth
simpler signatures
```

Bad:

```text
same logic
→ five tiny classes
→ coordinator still knows everything
```

## First investigation

Fresh-read:

```text
BridgeEncounterEngineEventHandler.ts
BridgeEncounterController.ts
bridge_event.ts
```

Plus immediately-owned synchronizers/helpers.

Questions:

- event translation mixed with persistence?
- navigation lifecycle mixed with combat presentation?
- duplicated read-model reconstruction?
- controller accumulating policy beyond composition/routing?
- contexts passed far then rebuilt?
- Local Space removal already shrinks any of these?

## Naming/model-truth pass queued next

Known debt:

```text
ENCOUNTER_EVENT.PLAYER_POINT_DEFENSE_CHARGE_SPENT
remainingCharges
```

Player resource is shared DEF now.

Legacy sweep found 19 naming matches.

Do not mass-rename `remainingCharges`: enemy PD contexts may still be semantically correct.

Likely player-event direction:

```text
PLAYER_DEFENSE_CAPACITOR_CHARGE_SPENT
```

Inventory exact uses first.

## Semantic targeting remains blocked

Do not start until audit closes.

Future vocabulary:

```text
HULL
ENGINE
WEAPONS
BRIDGE
VULNERABLE NODE
```

## Process warning

Previous chat had two 20+ minute tool-orchestration loops and failed to deliver the
Local Space patch.

Next atom should be deliberately narrow:

```text
fresh HEAD
→ exact Local Space inventory
→ exact external refs
→ guarded removal patch
→ stop
```

Do not repeat the broad audit.
