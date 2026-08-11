# Space Captain — Gameplay Contracts

Reviewed: `2026-08-11`
Checkpoint: `5a37de2d24c8212c8ff1251ab097f75b293e5f9b`

## Core interaction — LOCKED DIRECTION

```text
situation/system/context
→ visible responses
→ officer role shown
→ officer work
→ bridge result
```

Depth comes from contention, information, time, commitment and resources.

## Persistent/current state — CURRENT

Persistent player ship includes:

- hull;
- drive;
- shared defense capacitor;
- installed weapon ammo/phase state;
- navigation.

Old persistent shield-generator state is removed.

Combat objects, enemy crew tasks and temporary intel are encounter-local.

## Shared defense capacitor — LOCKED CURRENT

```text
DEFENSE CAPACITOR
UI: DEF
capacity: 4
recharge: 24000 ms/charge
sequential
```

Point defense spends shared DEF.

Future Engineer shield behavior, if implemented, should spend the same resource
instead of creating a second shield-generator pool.

## Point defense — CURRENT

- Weapons-operated;
- responds to incoming missiles;
- uses shared player DEF;
- band logic remains relevant to missile spectral behavior;
- stale event naming may still say “point defense charge”.

Do not infer a separate player PD resource from that name.

## Player missile — CURRENT

```text
ready launcher + ammo + target
→ Weapons targeting
→ launch spends missile
→ autonomous cooldown
→ projectile resolves independently
```

Enemy PD may intercept.

## Player laser — LOCKED CURRENT

```text
ready laser + target actor
→ Weapons targeting
→ charging
→ deterministic HULL hit
→ cooldown
```

No:

```text
LEFT/CENTER/RIGHT
targetZone
directional shield blocking
```

## Incoming enemy laser — LOCKED CURRENT

```text
TARGETING
→ CHARGING
→ deterministic player HULL hit
→ COOLDOWN
```

Science should not identify a nonexistent laser property.

Future semantic intended-target intel must be a new explicit contract.

## Sticky mines — CURRENT

Player command launches separate mine objects. Dashboard may group visually, but
domain targets stay exact/individual. Clearing pressure is officer allocation.

## Player spam — CURRENT

Operated by SCIENCE.

Baseline:

```text
channel: 20000 ms
enemy crew progress multiplier: 0.5
cooldown: 15000 ms
```

Science remains occupied through channel; enemy Science may purge.

## Enemy information principle — LOCKED

Do not expose unrestricted objective truth where gameplay calls for observation/intel.

Missile identification remains meaningful.

Old player-laser directional report semantics were removed.

Debug telemetry is not captain knowledge.

## Enemy destruction — LOCKED

```text
enemy hull 0
→ clean target-dependent objects as required
→ remove encounter actor
→ remove persistent node actor
→ stop active enemy work
→ show destruction
→ encounter may continue
```

Independent already-launched hostile objects may continue by their own lifecycle.

## Dashboard — LOCKED DIRECTION

```text
LEFT  → player ship
RIGHT → current context
```

Current left:

```text
HULL
DEF
ENGINE
MISSILE
LASER
MINES
SPAM
```

Officer context menus are temporary until navigation/cancellation/remaining commands
have replacements.

## Semantic laser targeting — LOCKED NEXT DESIGN

Not implemented yet.

Targets:

```text
HULL
ENGINE
WEAPONS
BRIDGE
VULNERABLE NODE
```

Semantics:

- HULL: normal hull damage.
- ENGINE: disable engine only, no hull.
- WEAPONS: one semantic node; internally disable/damage one working installed weapon, no hull.
- BRIDGE: officer/bridge disruption, no hull.
- VULNERABLE NODE: Science-discovered, one successful hit, x2 hull, then disappears.

v0.1 hits deterministic.

Everything besides hull destruction should be temporary/repairable enough to avoid
permanent snowballing. Game over remains hull-based.

## Target-selection UX — LOCKED NEXT DESIGN

```text
laser action
→ only HULL available: direct command
→ meaningful choices available: open picker
→ opening picker spends nothing
→ choose target
→ officer task begins
```

No picker when there is no real choice.

## Science analysis — LOCKED NEXT DIRECTION

Science scans should reveal one meaningful “fat” result from an eligible pool,
for example:

- schematic/system target knowledge;
- vulnerable node;
- temporary broad threat identification;
- authored capability intel.

A schematic may unlock `ENGINE + WEAPONS + BRIDGE` targeting knowledge.
Vulnerability may be found independently.

Exact command/content is not implemented yet.

## Local Space map — NOT A CONTRACT

Old top-center Local Space icon/popup is legacy presentation and is scheduled for removal.

Navigation source of truth remains in domain state. Current `FLY_TO` is not coupled
to the old map view.

## Evasive maneuver / escape — UNRESOLVED

Global Helm evasive maneuver remains proposed only.

Escape/break contact must remain easy to reach eventually, likely through navigation
context, but exact gameplay rules are not locked.
