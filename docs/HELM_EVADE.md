# Space Captain — Helm Evade

Updated: 2026-08-16.

This document defines the first-pass gameplay contract for the Helm `EVADE`
command.

The intended role is a powerful emergency maneuver with a meaningful cost and a
long recovery. It is not a passive dodge stat and it is not a percentage damage
reduction mechanic.

## Core concept

`EVADE` is a Helm/Drive ultimate-style defensive command.

The command:
- spends Power Core energy;
- occupies Helm as a channel task;
- has a short warmup before protection begins;
- provides a deterministic evasion window;
- has a long cooldown;
- can be cancelled by the player;
- can be interrupted;
- does not penalize Science, Weapons or Engineer while active.

During the active evasion window, every evadable attack that would resolve
against the ship is avoided completely.

There is no per-attack dodge percentage in the first version.

## Lifecycle

Conceptually:

```text
READY
  -> command start / resource commit
WARMUP
  -> warmup completes
EVADING
  -> duration ends
COOLDOWN
  -> cooldown ends
READY
```

The exact engine representation may differ if an existing task/system lifecycle
already provides a cleaner implementation, but these gameplay phases must remain
explicit.

## Resource commitment

At command start:
- Power Core cost is spent immediately;
- the full Evade cooldown starts immediately;
- Helm becomes occupied by the Evade task;
- warmup begins.

Power and cooldown are not refunded if Evade is cancelled or interrupted.

This follows the desired general combat rule that committed actions pay their
resource/cooldown cost when the action begins rather than only after a successful
outcome.

Combat weapons and defensive systems use the same commitment semantics: each
cooldown starts at its concrete commitment edge and continues through later
cancellation/interruption. Evade should reuse that established rule.

## Drive dependency

Base Evade requires an operational main drive.

If the drive is broken/disabled, Evade is unavailable.

This is intentionally restrictive because it creates future progression space,
for example:
- a higher-tier drive that can Evade while damaged/broken;
- a Helm perk that allows emergency Evade with a broken drive.

These progression exceptions are not part of V0.

## Warmup

Evade protection does not begin immediately after the command is pressed.

There is a short warmup period before the ship enters `EVADING`.

This creates a real terminal response boundary: an attack that resolves before
warmup completes still hits normally.

Warmup duration should be drive/content-driven rather than a hard-coded command
constant.

Future progression may modify it, including a Helm perk that makes Evade
instant.

## Active evasion window

Once warmup completes, the ship enters `EVADING` for a fixed duration.

Any evadable attack that resolves during this active interval misses completely.

The important timing rule is based on **resolution/impact time**, not attack
start time.

Example:

```text
missile launched
    -> Evade starts
    -> warmup completes
    -> missile impact occurs while EVADING
    -> MISS
```

But:

```text
Evade active
    -> missile launched
    -> Evade ends
    -> missile impact occurs afterwards
    -> normal resolution / possible HIT
```

Evade therefore creates a temporary safety window rather than making every
attack launched during the maneuver permanently invalid.

## Evadable vs non-evadable threats

V0 direction:

Evadable:
- incoming missiles;
- Beam Cannon hits;
- future direct projectile/hit attacks;
- EMP/direct disruption attacks when they are implemented;
- an incoming sticky mine attempting to attach during the active Evade window.

Not evadable:
- SPAM;
- sticky mines that are already attached to the ship;
- other future effects that explicitly do not depend on physically hitting the
  maneuvering ship.

For a sticky mine, Evade matters at attachment resolution. A mine already on the
hull remains a real threat and continues its fuse normally.

## Targetability

Evade does **not** make the ship untargetable.

Enemies may still:
- start targeting/locking;
- charge weapons;
- channel attacks;
- launch projectiles.

The attack only checks Evade when the relevant physical hit/attachment resolves.

This keeps enemy scheduling and telegraphing intact and prevents Evade from
becoming stronger than its intended defensive window.

## Other officers

Ultimate-style Evade does not slow or block Science, Weapons or Engineer.

Only Helm is occupied by the maneuver.

Do not add secondary penalties such as slower weapon targeting unless actual
playtesting later shows that cost, Power usage and cooldown are insufficient to
balance the command.

## Cancellation and interruption

Player cancellation is allowed.

If cancelled during warmup:
- protection never begins;
- Helm is released;
- committed Power remains spent;
- committed cooldown remains active.

If cancelled during `EVADING`:
- protection ends immediately;
- Helm is released;
- Power/cooldown remain committed.

Evade can also be interrupted by gameplay effects.

A Helm stun interrupts the Evade task immediately.

If interruption happens during warmup, the ship never reaches `EVADING`.
If interruption happens during the active window, evasion protection ends at
that moment.

Existing attached mines or future non-evadable effects may therefore indirectly
break an Evade by stunning/interfering with Helm.

## Defensive-system interaction

Evade does not cancel, refund or consume defensive systems merely because an
incoming attack misses.

Resolution order should preserve this rule:

### Beam example

```text
Beam resolves
    -> ship EVADING?
        yes -> MISS
        no  -> Active Shield?
                   yes -> ABSORBED
                   no  -> HIT
```

If an Active Shield already exists and the Beam misses because of Evade, the
shield remains active normally until:
- its normal expiry; or
- a later attack actually hits it and is absorbed.

Likewise, beginning shield deployment before an Evade does not cancel that work
for free. Any already committed Power/resource cost remains committed according
to the Shield Generator's own rules.

The same principle applies to other defensive resources: an avoided attack
should not consume a defense that was never actually hit, but Evade must not
retroactively refund a defensive action the player already chose to start.

## Power Core cost

Evade should be expensive because one activation can potentially avoid several
otherwise unrelated threats.

The initial numerical cost is intentionally not locked here. A relatively high
cost should be tested first.

Power cost should be content/drive-driven so higher-tier drives and Helm perks
can create progression later.

## Drive tuning surface

The drive should eventually provide the base values for at least:

```text
evadeWarmupMs
evadeDurationMs
evadeCooldownMs
evadePowerCost
```

Exact property names can follow the current content/schema conventions.

This gives the drive meaningful combat identity beyond simply being operational
or broken.

Future drives may vary in:
- warmup;
- active duration;
- cooldown;
- Power efficiency;
- ability to Evade while damaged/broken.

## Helm progression hooks

Potential future Helm perks include:
- instant Evade warmup;
- longer Evade duration;
- shorter cooldown;
- lower Power Core cost;
- ability to Evade with a broken drive.

These are progression hooks, not required V0 mechanics.

## Threat dashboard integration

Evade should use one global control rather than duplicate an `EVADE` button on
every threat tile.

Likely placement is near the player's drive/Helm status on the player dashboard,
but final dashboard layout is a separate UI design task.

Threat tiles should still communicate how Evade affects them.

During an active Evade, the UI should be able to distinguish threats that will
resolve inside the current evasion window from threats that will resolve after it
ends.

Example:

```text
MISSILE A   impact in 1.2s   -> covered by current Evade
BEAM        fires in 2.4s     -> covered by current Evade
MISSILE B   impact in 4.7s   -> not covered if Evade ends first
```

The exact visual treatment is not fixed yet. It may be an icon, tint, outline or
other compact state rather than explanatory text.

A later UI improvement may preview affected threat tiles while the global Evade
control is focused/hovered, but this is not required for V0.

The view must not recreate timing legality independently. Any authoritative
coverage/availability information should come from engine/read-model truth.

## Enemy Evade

The enemy uses the same gameplay mechanic rather than a separate AI-only dodge
rule.

When the enemy is Evading, the player must be able to see this state before
attacks resolve so misses do not feel arbitrary.

Enemy AI should eventually evaluate Evade by threat value, not simply activate
it whenever any attack exists.

High-value reasons include:
- avoiding otherwise lethal damage;
- covering multiple dangerous threats in one window;
- avoiding a severe stun/system-break effect;
- surviving when other defensive responses are unavailable.

The exact policy belongs to the enemy decision implementation, not this V0
mechanic contract.

## Presentation direction

Player and enemy Evade should share the same semantic language but do not need
identical pixels because the camera presentation differs.

Enemy ship:
- visible lateral/diagonal maneuver;
- strong thruster burst;
- optional short afterimage/motion cue;
- no excessive spinning or arcade acrobatics.

Player ship:
- viewscreen/world motion implying a hard maneuver;
- star/parallax shift;
- restrained bridge/viewscreen sway;
- matching maneuver audio/UI cue.

Both sides should have a clear `EVADING` state in the appropriate dashboard/read
model.

Final VFX are deferred until the authoritative mechanic works.

## V0 balance philosophy

Evade is intentionally powerful and deterministic.

Balance it first through:
- Power Core cost;
- warmup;
- active duration;
- long cooldown;
- Helm occupancy;
- risk of cancellation/interruption;
- opportunity cost of spending the ultimate at the wrong time.

Do not initially balance it with:
- random dodge rolls;
- partial damage reduction;
- penalties to other officers;
- hidden accuracy modifiers.

If it proves too strong in real play, tune the explicit costs/timings before
adding secondary complexity.
