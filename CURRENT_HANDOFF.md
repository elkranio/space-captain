# Space Captain — Current Handoff

Updated: 2026-08-20

Always re-fetch current `master` before preparing a patch.

Handoff marker after the completed threat-readability slice:

`5968c8bfe53b11db457517df88b0a8394cc655af`

Treat that SHA only as historical context. Fresh `master` is authoritative.

## Where we are

The captain threat-dashboard readability task is closed.

All four production threat tiles use the compact `163x66` grammar:

- Missile
- Beam Cannon
- Sticky Mine
- Spam

The next active slice is **targeted Beam defense / node targeting**.

Detailed task:

`docs/TARGETED_SHIELDS_TASK.md`

The old Beam design handoff and the completed threat-tile/progress-bar task docs
were moved out of active `docs/` into `ideas/_archive/`. Do not use them as
current implementation truth.

## Closed threat-dashboard state

The threat grid supports up to six compact tiles in the shared 3x2 layout.

Decision timing is button-local rather than one generic threat bar.

Current rules:

- Missile `TRACK`: cream deadline strip for completing TRACK and then HIT.
- Missile `HIT`: cream deadline strip for completing interception.
- Beam `TRACK`: cream deadline strip that reserves TRACK time plus the
  subsequent Shield deployment time.
- Beam `SHIELD`: red too-early segment -> cream valid deployment window ->
  blinking red terminal marker.
- Sticky Mine `CLEAR`: cream latest-safe-start strip -> blinking red terminal
  marker.
- Spam: intentionally no timing strip.

All task-based thresholds come from the engine presentation timing read model and
use the current crew-progress multiplier, so SPAM slowdown changes the real
wall-clock windows.

Timing strips are advisory. They do not redefine engine command legality.

## Current Beam / Drive foundation

Incoming enemy Beam attacks already have real hidden target truth.

Current target domain:

- `HULL`
- `DRIVE`

`BRIDGE` is not a Beam target.

The enemy currently chooses HULL/DRIVE randomly when the concrete Beam attack is
created. Keep that baseline unless a later AI pass explicitly changes it.

Science TRACK exposes only observer intel:

- UNKNOWN
- uncertain `HULL? / DRIVE?`
- confirmed `HULL / DRIVE`

Hidden `targetNode` remains engine-only.

Beam definitions separate:

- `hullDamage`
- `moduleDamage`

Current penetrating damage contract:

```text
HULL target
    -> hullDamage

DRIVE 2/2 or 1/2
    -> moduleDamage to Drive
    -> no hull damage

DRIVE breaks on this hit
    -> still no hull damage
    -> moduleDamage overkill does not spill

already BROKEN DRIVE
    -> hullDamage * 2
```

Drive integrity is encounter-local:

```text
2/2 -> operational
1/2 -> operational, not repairable
0/2 -> BROKEN / DISABLED, repair available
repair -> 2/2
```

Hull damage persists between encounters. Module integrity is intended to reset
between encounters; the explicit encounter-end reset remains deferred work.

Penetrating Beam hits still use the current general player-task interruption
behavior. Probability/traits for interruption are deferred until deeper weapon
work.

## Current Shield state before the next slice

Player and enemy Shields are still whole-ship fields.

`ActiveShieldState` currently contains emitter identity + lifetime only.

Current Beam defense order is:

```text
EVADING -> MISS
else active whole-ship Shield -> ABSORBED and Shield consumed
else penetrating HIT
```

Player Shield deployment:

- Engineer task;
- shared Power Core cost is committed at deployment start;
- generator cooldown is committed at deployment start;
- cancelling later frees Engineer but does not refund energy/cooldown.

Enemy Shield already has:

- its own runner/lifetime;
- Engineer deployment work;
- timing-aware `EnemyDecisionPolicy` that waits for the useful Beam window.

What it does NOT have yet is a protected node.

## Next implementation order

### Atom 1 — player targeted Shield engine contract

Do engine/domain first. No picker UI in this atom.

Target vocabulary for the first slice is exactly the current Beam node vocabulary:

- `HULL`
- `DRIVE`

The selected node must travel through the real Engineer deploy command/task flow
and end up on the active Shield.

Targeted defensive resolution:

```text
Beam target matches Shield target
    -> ABSORBED
    -> Shield consumed

Beam target does not match Shield target
    -> Beam penetrates normally
    -> Shield remains active until a matching hit or expiry
```

Preserve defense ordering:

```text
EVADING first
then matching Shield
then target consequence
```

A Beam missed by Evade does not consume Shield.

Do not add sectors, facings, partial absorption or generic shield-target
frameworks in this atom.

### Atom 2 — player Shield target picker

After engine tests are green, change the captain-dashboard interaction.

Pressing the Beam threat `SHIELD` action should open a small inline dashboard
selection state rather than immediately starting deployment.

Initial picker content:

```text
SHIELD TARGET

HULL    current / max
DRIVE   integrity / max

CLOSE
```

Requirements:

- selecting HULL/DRIVE starts the real Engineer deploy command for that node;
- `CLOSE` only closes presentation and has no engine side effect;
- view receives view-ready hull/Drive values; it does not import gameplay tuning
  or decide availability;
- keep this provisional/functional rather than spending time on final art.

### Atom 3 — player Shield visual state

The player must be able to tell which node is being protected.

At minimum distinguish:

- deployment in progress and selected node;
- active Shield and protected node.

Use the existing captain dashboard/viewscreen language. Do not redesign the
whole dashboard around this one feature.

### Atom 4 — player Beam semantic target prerequisite

This is required before enemy targeted Shield can be meaningful.

Current `PlayerBeamCannonRunner` still targets an enemy actor as a whole and
resolves only Evade -> whole-ship Shield -> hull.

Before implementing enemy node defense, give the player's Beam a concrete
semantic enemy target.

Start with the smallest useful enemy target vocabulary supported by real enemy
state. Do not add WEAPON/SHIELD/BRIDGE targets until their identity/consequence
model exists.

The exact player target-selection UX should be decided against the then-current
enemy dashboard/Science information. Do not invent a large subsystem picker in
advance.

### Atom 5 — enemy targeted Shield choice

Reuse the same protected-node semantics, not a separate enemy-only mechanic.

Current enemy policy already selects Shield deployment from a perceived Beam
threat and useful timing window. Extend that flow so the chosen defense also
contains a node.

Critical epistemic rule:

> enemy Shield placement must use enemy-observer/perceived Beam target
> information, not hidden objective player-attack truth bypassing Science/intel.

The result should be analogous to enemy missile defense: the captain acts on
what the enemy currently believes about the incoming threat.

Likely source anchors:

- `EnemyDecisionPolicy`;
- enemy captain decision/threat snapshots;
- enemy Beam observation/intel;
- `EnemyWorkExecutor`;
- enemy Engineer task payload;
- `EnemyShieldRunner`.

Keep decision policy separate from physical hit resolution.

### Atom 6 — enemy Shield visual

The player needs a readable indication of which enemy node is protected.

Functional clarity first. The player should be able to answer:

- does the enemy currently have an active Shield?
- which node does it protect?
- did my Beam hit the protected node, miss via Evade, or penetrate elsewhere?

Do not duplicate authoritative enemy state in Phaser.

## Explicit non-goals for this slice

- smarter enemy offensive Beam target selection;
- BRIDGE target/stun system;
- WEAPON or SHIELD module damage;
- Beam vulnerability traits;
- node-damage spill traits;
- Beam interruption probability/weapon archetype pass;
- Evade cancellation UI;
- final polished dashboard redesign;
- generic subsystem/sector framework.

## Files to read first in the new chat

Per `docs/WORKING_RULES.md`, read every Markdown file in `docs/`.

For the active slice pay special attention to:

- `CURRENT_HANDOFF.md`
- `docs/TARGETED_SHIELDS_TASK.md`
- `docs/GAMEPLAY_CONTRACTS.md`
- `docs/SYSTEM_MAP.md`
- `docs/THREAT_PANEL.md`
- `docs/COMBAT_PLAYTEST_ROADMAP.md`

Then re-fetch fresh `master` and inspect exact source/tests.

## First action in the new chat

Start with **Atom 1: player targeted Shield engine contract**.

Before changing code, inspect the exact current shapes of:

- `ActiveShieldState`;
- Engineer deploy-shield command target;
- Engineer deploy-shield officer task payload;
- Shield deployment completion;
- incoming Beam absorption;
- current cancellation tests.

Do not start with the picker UI.
