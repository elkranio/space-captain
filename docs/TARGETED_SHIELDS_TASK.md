# TASK — TARGETED BEAM SHIELDS

## Goal

Turn the current whole-ship temporary Shield into a semantic node defense, then
give the enemy the same mechanic.

First supported protected nodes:

- `HULL`
- `DRIVE`

This slice exists to create a readable target/defense loop. It is not a generic
ship-sector simulation.

## Current baseline

Incoming enemy Beam already has hidden objective `targetNode`:

- HULL
- DRIVE

Science exposes safe observer intel only.

Player Drive already has encounter-local integrity and real Beam consequences.

Player and enemy Active Shields are still whole-ship fields. A current active
Shield absorbs any Beam that reaches it.

Enemy AI already understands Beam timing well enough to deploy a Shield inside
the useful lifetime/deployment window. The missing choice is **where** to put it.

Player Beam is currently still actor-wide/hull-only. Enemy targeted Shield
should not be completed until the player attack also carries a semantic target.

## Core targeted-Shield contract

A temporary Shield protects exactly one semantic Beam node.

```text
activeShield.targetNode = HULL | DRIVE
```

Use an existing domain type if it fits cleanly. Do not create parallel enums
with identical values merely to make the names symmetrical.

Resolution order remains:

```text
1. Evade
2. matching active Shield
3. penetrating Beam consequence
```

### Matching node

If Beam target and Shield target match:

- Beam outcome is ABSORBED;
- no hull/module/interruption consequence occurs;
- Shield is consumed.

### Non-matching node

If Beam target and Shield target differ:

- Shield does not absorb the Beam;
- Beam resolves against its actual target;
- Shield is NOT consumed, because it was never hit;
- Shield continues until a matching hit or natural expiry.

### Evade

If Evade makes the Beam miss:

- Beam outcome is MISS;
- Shield is not consumed.

## Player implementation slices

### A. Engine/domain

The selected node must travel through the real deploy flow:

```text
available Engineer command
    -> selected command target
    -> Engineer officer task
    -> deployment completion
    -> ActiveShieldState.targetNode
```

Do not store the selected target only in app/controller state.

Preserve current commitment rules:

- Power Core charge committed at deployment start;
- generator cooldown committed at deployment start;
- later cancellation does not refund either;
- cancellation still frees Engineer.

Tests should cover at least:

- deploy HULL creates HULL Shield;
- deploy DRIVE creates DRIVE Shield;
- matching Beam absorbs + consumes;
- wrong-node Beam penetrates + Shield survives;
- Evade miss leaves Shield alive;
- expiry still clears Shield;
- cancellation behavior remains unchanged.

### B. Captain dashboard picker

The Beam threat `SHIELD` action opens a small inline target selector.

Initial information only:

- HULL current/max;
- DRIVE integrity/max;
- CLOSE.

Do not add speculative subsystem data.

Presentation rules:

- picker is a dashboard presentation state;
- engine command availability remains authoritative;
- selecting a row sends the real node-targeted Engineer command;
- CLOSE has no engine side effect;
- mapper/read model should provide view-ready current/max values;
- view should not reach into content catalogs to reconstruct max integrity.

### C. Player visual state

Make selected protection readable while:

- Engineer is deploying;
- Shield is active.

The exact art is provisional. Prefer a small explicit node marker/highlight over
a broad dashboard redesign.

## Player Beam prerequisite for enemy targeted defense

Current player Beam runner still targets only `targetActorId` and applies hull
damage after enemy Evade/whole-ship Shield resolution.

Before enemy Shield can choose HULL vs DRIVE, player Beam needs a concrete enemy
node target.

Do this as its own atom.

Questions to resolve from current code/UI, not assumption:

- what enemy node data is already safe/visible to the player?
- does target choice belong directly to the Beam fire command?
- what is the smallest useful enemy target vocabulary supported by real state?
- how should unknown enemy information constrain choices?

Do not add generic WEAPON/SHIELD/BRIDGE targets before those nodes have real
identity and consequences.

## Enemy targeted Shield

The enemy must use the same physical Shield semantics.

Current enemy decision flow already contains:

```text
perceived Beam threat
    -> timing-aware shield candidate
    -> Engineer DEPLOY_SHIELD work
    -> EnemyShieldRunner.deploy(...)
```

Extend it with a chosen protected node.

### Epistemic rule

Enemy choice must be based on perceived/observer Beam target information.

Do not let `EnemyDecisionPolicy` or a decision snapshot read hidden objective
player Beam truth that enemy Science has not earned.

If enemy knowledge can be uncertain, the selected Shield target may be wrong.
That is desirable gameplay, just like missile defense can act on imperfect intel.

### Enemy physical resolution

Player Beam should mirror the player-defense rule:

```text
enemy EVADING
    -> MISS

else enemy activeShield.targetNode == playerBeam.targetNode
    -> ABSORBED + consume Shield

else
    -> penetrate selected node
    -> wrong-node Shield survives
```

## Enemy visual

Expose only information the player is allowed to know, but active physical
Shield placement itself should be readable.

At minimum the player needs to distinguish which currently exposed enemy node is
protected.

Keep physical VFX and dashboard telemetry consistent; do not create two mutable
sources of shield truth.

## Non-goals

- change enemy offensive Beam target RNG;
- add BRIDGE as a target;
- add officer stun;
- add WEAPON/SHIELD module damage;
- partial Shield damage;
- Shield facings/sectors;
- multiple simultaneous player Shields;
- smarter long-horizon enemy planning;
- final art polish.

## Validation

For each gameplay atom:

```bash
npm run typecheck
npm test -- <focused tests>
git -c core.safecrlf=false diff --check
```

Before push:

```bash
npm test
```

Runtime smoke is required once the picker/visual layer lands.
