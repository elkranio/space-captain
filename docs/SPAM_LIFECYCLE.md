# Space Captain — SPAM Lifecycle

This file is the canonical design/implementation handoff for the next SPAM gameplay atom.

It deliberately separates **current implemented truth** from the **confirmed target lifecycle**. Current runtime
truth remains in `GAMEPLAY_CONTRACTS.md`; do not claim the target lifecycle is landed until code/tests prove it.

## Why TASK 1-3 were prerequisites

The officer-execution ownership campaign was done to make this mechanic possible cleanly.

The old Officer Task shape mixed equipment/action timing, officer busy progress and cancellation policy. That made
the old SPAM naturally collapse three different lifecycles into one long Scientist task.

TASK 1-3 established the required boundary:

```text
equipment / action owns base parameters
-> officer execution owns current officer work + resolved progress
-> committed equipment/effects may continue after officer work ends
-> cancellation legality is gameplay code, not editable content
```

SPAM is the first mechanic that needs the split explicitly:

```text
projector nominal lifecycle
!= target-side harmful effect
!= Scientist availability / neural recovery
```

Do not put projector ACTIVE duration, cooldown or Scientist recovery back into Officer Task tuning. Do not introduce
a generic action/phase DSL, service locator or universal state machine for this one mechanic.

## Fiction: neural launch and psychic feedback

The Scientist does **not** consciously channel SPAM for the entire effect.

The Scientist uses a neural interface to configure and target the payload, then commits the launch. COMMIT kicks
psychic/neural feedback back into the operator — neural backlash/strain from forcing the payload through the
interface.

Player-facing fiction: after launch the Scientist is temporarily a "vegetable".

The gameplay meaning is precise:

- Scientist leaves `WORKING` at COMMIT;
- Scientist enters a separate `NEURAL_RECOVERY` officer status;
- during `NEURAL_RECOVERY` Scientist is unavailable for other Science work;
- `NEURAL_RECOVERY` is not generic `STUN`;
- the already-launched SPAM does not depend on Scientist recovery;
- future Scientist traits may modify recovery independently;
- a defending Scientist who performs PURGE does not receive neural recovery from PURGE.

Future portrait/animation work may distinguish IDLE / WORKING / STUNNED / NEURAL_RECOVERY. That art is not part of
the first lifecycle atom; warn before implementation needs new portrait sprites.

## Ownership after COMMIT

After COMMIT these clocks must remain independent:

| Concern | Owner | Rule |
| --- | --- | --- |
| PREPARE / nominal ACTIVE / COOLDOWN | SPAM Projector content + runtime | committed next-ready timeline is fixed |
| harmful target-side slowdown | SPAM channel/effect runtime | may end early through PURGE |
| attacker Scientist availability | officer `NEURAL_RECOVERY` status | independent from effect/projector ACTIVE |
| defender PURGE work | `crew_actions.scientist_purge_spam` | time-taking Science work using crew progress |

Exact new SPAM field names and balance values are an implementation decision from fresh source. Do not invent or
retune them in advance.

## Confirmed lifecycle

### PREPARE / TARGETING

This is officer-owned work.

```text
Scientist WORKING
projector PREPARE / TARGETING
harmful target effect: absent
neural recovery: absent
```

Rules:

- Scientist is busy;
- player may cancel before COMMIT;
- future explicit `INTERRUPT` / `STUN` may stop unfinished PREPARE;
- pre-COMMIT cancellation launches no payload;
- pre-COMMIT cancellation causes no neural recovery;
- shared equipment progress uses PREPARE: yellow, grows left -> right.

Enemy SPAM preparation should be telegraphed through enemy Science PEGS/activity plus visible enemy loadout. It does
not need a dedicated threat lamp; lamps are for immediate concrete defensive interrupts such as Missile/Beam danger.

### COMMIT

COMMIT is an instant semantic boundary.

At COMMIT:

- payload launches;
- harmful target-side SPAM effect starts;
- projector nominal ACTIVE timeline is established;
- projector next-ready/cooldown timeline is fixed;
- Scientist officer execution ends;
- attacker Scientist enters `NEURAL_RECOVERY`.

There is no normal manual cancel after COMMIT. Later ordinary damage, `STUN` or other Scientist status must not
recall a payload that already committed.

### Nominal ACTIVE

Three things now run independently:

```text
projector nominal ACTIVE
target-side harmful effect
Scientist NEURAL_RECOVERY
```

Normal unpurged case:

- harmful effect slows target crew work;
- projector ACTIVE runs to its nominal end;
- neural recovery runs for its own duration;
- either recovery or nominal ACTIVE may finish first;
- ACTIVE equipment progress is bright cyan/blue remaining time shrinking right -> left;
- after nominal ACTIVE the projector enters full COOLDOWN;
- COOLDOWN is muted dark-blue progress growing left -> right.

## PURGE semantics

PURGE is defending-Scientist work, not attacker equipment cancellation.

Current crew-progress slowdown is desirable here: while harmful SPAM is active, PURGE itself may take longer because
the defending crew is slowed.

When PURGE completes:

- the **harmful target-side slowdown ends immediately**;
- target crew returns to normal progress;
- attacker projector nominal ACTIVE continues to its original end;
- attacker next-ready/cooldown timing is unchanged;
- attacker Scientist `NEURAL_RECOVERY` is unchanged;
- defending Scientist finishes PURGE normally and does not enter neural recovery.

This distinction is critical:

> "SPAM keeps running after PURGE" means the attacker's **nominal equipment operation** keeps running.
> The harmful debuff does **not** continue affecting the target after PURGE.

PURGE must never refund/release attacker recovery or accelerate the projector.

## Presentation contract

### Already landed — do not redo

The shared equipment progress foundation already exists:

- `BridgeEquipmentProgressBarView`;
- centralized PREPARE / ACTIVE / COOLDOWN / REPAIR presentation;
- PREPARE: yellow, grows left -> right;
- ACTIVE: bright cyan/blue remaining time, shrinks right -> left;
- COOLDOWN: muted dark blue, grows left -> right;
- REPAIR/bad-state remaining: red, shrinks right -> left;
- Missile Launcher already uses the shared bar;
- current SPAM `CHANNELING` maps to shared ACTIVE;
- old SPAM `PURGED` equipment-tile text/state is already removed.

One thin equipment line is reused for equipment phases. Do not add a second equipment clock or restore `PURGED`
tile text.

### Purged-but-nominally-ACTIVE visual

Current problem: after PURGE the existing SPAM link/beam/color animation stops or disappears, visually implying that
the attacker equipment operation ended early.

Target behavior:

```text
normal ACTIVE link
    -> cyan / existing active animation

PURGE completes
    -> harmful target effect ends
    -> link remains visible through original nominal ACTIVE end
    -> link becomes red / clearly neutralized
    -> cyan/rainbow cycling may stop; lower alpha is acceptable if useful

nominal ACTIVE ends
    -> link disappears normally
    -> projector proceeds to COOLDOWN
```

The equipment tile remains ordinary ACTIVE throughout the nominal interval and keeps the same ACTIVE progress. There
is no equipment phase named `PURGED`.

### Scientist recovery UI

`NEURAL_RECOVERY` belongs to the officer, not the SPAM tile.

Expose it as a separate Scientist status/progress treatment under Scientist role/PEGS UI. It must not be a second
equipment progress bar.

Future portrait states may be IDLE / WORKING / STUNNED / NEURAL_RECOVERY. `WORKING` derives from current
officer-owned execution; `STUNNED` and `NEURAL_RECOVERY` derive from officer status. Do not encode all of them into
Officer Task kind.

## Current implementation baseline

Already implemented:

- TASK 1-3 ownership cleanup;
- equipment timing ownership and code-owned cancellation;
- old role Officer Task tuning/editor removal;
- standalone PURGE duration in `crew_actions.scientist_purge_spam`;
- current SPAM slowdown/effect and PURGE;
- viewscreen ads;
- shared equipment progress presentation;
- current SPAM `CHANNELING` -> ACTIVE mapping;
- removed `PURGED` tile text.

Not implemented yet:

- explicit SPAM PREPARE / COMMIT split;
- separate attacker `NEURAL_RECOVERY`;
- player Scientist release from `WORKING` at COMMIT;
- target-effect lifetime decoupled from projector nominal ACTIVE;
- red/neutralized link persistence after PURGE;
- player/enemy lifecycle symmetry.

## Non-goals for the first lifecycle atom

Do not combine this atom with:

- generic stun/interrupt infrastructure;
- generic action/phase state machine or DSL;
- non-combat navigation/order redesign;
- new SPAM CORE/energy cost;
- speculative balance tuning;
- generic BROKEN/repair completion;
- viewscreen-ad transparency rebalance;
- new Scientist portrait assets unless explicitly requested.

SPAM is intentionally strong/heavy. Do not pre-nerf crew slowdown before playtesting the split lifecycle.

## Acceptance invariants

Implementation is not complete unless tests prove:

1. PREPARE occupies Scientist and can be cancelled without payload or neural recovery.
2. COMMIT ends officer execution, launches the effect and starts `NEURAL_RECOVERY`.
3. Post-COMMIT manual cancellation is unavailable.
4. Projector nominal ACTIVE and neural recovery continue independently.
5. PURGE work uses crew-progress semantics and can be slowed by active SPAM.
6. PURGE ends target slowdown but does not change projector nominal end/next-ready/cooldown.
7. PURGE does not shorten attacker neural recovery.
8. Defending Scientist does not receive neural recovery for PURGE.
9. Later attacker Scientist status/interruption does not recall committed payload.
10. Purged SPAM remains visually represented until nominal ACTIVE ends with red/neutralized feedback.
11. Equipment tile keeps ordinary ACTIVE progress; no `PURGED` tile state/text returns.
12. Shared progress colors/directions remain centralized rather than reimplemented in SPAM view code.
