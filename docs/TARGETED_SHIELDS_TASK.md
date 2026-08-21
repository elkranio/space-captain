# TASK — TARGETED BEAM SHIELDS

## Status — 2026-08-21

Player side is partially complete:

- **A. Player engine/domain targeted Shield — DONE**
- **B. Captain HULL/DRIVE picker — DONE**
- **C. Player dashboard visual for deploying/active target — OPEN**
- **Player Beam semantic enemy-node target — OPEN**
- **Enemy targeted Shield choice/resolution — OPEN**
- **Enemy targeted Shield visual — OPEN**

Keep this task active until the remaining items are done.

## Goal

Use semantic node defense for player Beam protection, then give the enemy the same mechanic.

First supported protected nodes:

- `HULL`
- `DRIVE`

This slice exists to create a readable target/defense loop. It is not a generic ship-sector simulation.

## Current baseline

Incoming enemy Beam has objective `targetNode`:

- HULL
- DRIVE

The player-facing Science TRACK layer has been removed. Incoming Beam target node is now directly available to player
presentation once the concrete threat exists.

Player Drive already has encounter-local integrity and real Beam consequences.

### Player current Shield

Player Active Shield is already node-targeted.

The selected node travels through the real engine flow:

```text
available Engineer command
    -> PLAYER_SHIP_NODE command target
    -> Engineer deploy-shield officer task
    -> deployment completion
    -> ActiveShieldState.targetNode
```

Player physical resolution is already:

```text
1. Evade
2. matching active Shield
3. penetrating Beam consequence
```

Wrong-node Shield survives because it was not hit.

### Enemy current Shield

Enemy targeted placement is not implemented yet.

Enemy current Active Shield remains the older whole-ship behavior until the enemy slice below lands.

Enemy AI already understands enough Beam timing to deploy a Shield. The missing targeted mechanic is **where** to put it
and how player Beam target truth is perceived.

### Player Beam prerequisite

Player Beam is still actor-wide/hull-only. Enemy targeted Shield should not be completed until the player attack also
carries a semantic target.

## Core targeted-Shield contract

A targeted temporary Shield protects exactly one semantic Beam node.

```text
activeShield.targetNode = HULL | DRIVE
```

Use an existing domain type if it fits cleanly. Do not create parallel enums with identical values merely to make names
symmetrical.

Resolution order:

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
- Shield is NOT consumed;
- Shield continues until a matching hit or natural expiry.

### Evade

If Evade makes the Beam miss:

- Beam outcome is MISS;
- Shield is not consumed.

## Player implementation slices

### A. Engine/domain — DONE

Implemented flow:

```text
available Engineer command
    -> selected command target
    -> Engineer officer task
    -> deployment completion
    -> ActiveShieldState.targetNode
```

Preserved commitment rules:

- Power Core charge committed at deployment start;
- generator cooldown committed at deployment start;
- later cancellation does not refund either;
- cancellation still frees Engineer.

Coverage includes targeted deploy and matching/wrong-node/Evade/expiry/cancellation semantics.

### B. Captain dashboard picker — DONE

Beam `SHIELD` opens an inline HULL/DRIVE target selector owned by captain combat-context presentation.

Current important behavior:

- exact real Engineer node-targeted commands come from app mapping;
- selecting HULL/DRIVE emits that command;
- cancel/close returns to threat context;
- active Shield deploy can still be cancelled;
- picker auto-closes when the relevant Beam/availability context disappears;
- target markers use the concrete known incoming Beam target node;
- picker never retargets an already selected/deploying Shield.

Do not regress this while replacing the outer threat tile visuals.

### C. Player visual state — OPEN

Make selected protection readable while:

- Engineer is deploying;
- Shield is active.

Prefer integrating this into the upcoming `OUR SHIP` dashboard functional redesign rather than polishing the outgoing
provisional ship rows.

The visual must consume authoritative task/active-Shield state, not keep a second dashboard-only target.

## Player Beam prerequisite for enemy targeted defense — OPEN

Current player Beam runner still targets only an enemy actor and applies its current hull-oriented consequence after enemy
defense resolution.

Before enemy Shield can choose HULL vs DRIVE, player Beam needs a concrete enemy semantic target.

Do this as its own atom.

Questions to resolve from current code/UI, not assumption:

- which enemy nodes are real and safely visible/inspectable?
- does target choice belong directly to the Beam fire command?
- what is the smallest useful target vocabulary supported by real enemy state?
- how should future Science-discovered special properties influence target choice without gating basic anatomy?

Do not add generic WEAPON/SHIELD/BRIDGE targets before those nodes have real identity and consequences.

## Enemy targeted Shield — OPEN

The enemy must eventually use the same physical targeted-Shield semantics.

Current enemy decision flow already contains roughly:

```text
perceived Beam threat
    -> timing-aware shield candidate
    -> Engineer DEPLOY_SHIELD work
    -> EnemyShieldRunner.deploy(...)
```

Extend it with a chosen protected node after player Beam has semantic target truth.

### Epistemic rule

Enemy choice must be based on perceived/observer information available to the enemy.

Do not let `EnemyDecisionPolicy` or a decision snapshot read hidden player attack truth that the enemy has not earned.

If future enemy knowledge can be uncertain, the selected Shield target may be wrong. That is desirable gameplay when the
uncertainty itself is meaningful.

### Enemy physical resolution

Player Beam should eventually mirror the player-defense rule:

```text
enemy EVADING
    -> MISS

else enemy activeShield.targetNode == playerBeam.targetNode
    -> ABSORBED + consume Shield

else
    -> penetrate selected node
    -> wrong-node Shield survives
```

## Enemy visual — OPEN

Expose only information the player is allowed to know, but active physical Shield placement itself should be readable.

At minimum the player needs to distinguish which currently exposed enemy node is protected.

Keep physical VFX and dashboard telemetry consistent; do not create two mutable sources of Shield truth.

## Non-goals

- change enemy offensive Beam target RNG;
- add BRIDGE as a target;
- add officer stun;
- add WEAPON/SHIELD module damage before those nodes exist;
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

Runtime smoke is required for presentation layers.
