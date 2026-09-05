# Space Captain — Combat Playtest Roadmap

Combat milestones and playtest gates only. Exact next atom lives in `../CURRENT_HANDOFF.md`; concrete implementation
debt lives in `BACKLOG.md`; mechanics live in `GAME_DESIGN.md` / `GAMEPLAY_CONTRACTS.md`.

## Current foundation

Landed foundation includes:

- one full enemy ship per combat;
- free basic threat identity (no mandatory Scientist TRACK/IDENTIFY);
- shared Power Core on the player ship;
- player/enemy Missile, Beam, Sticky Mine and SPAM families;
- deterministic baseline Defense Turret interception;
- player targeted Shield on the temporary `HULL | DRIVE` incoming-Beam model;
- player Evade with real WARMUP/EVADING phases;
- chassis-owned slots + persistent mounts;
- encounter-local equipment integrity with binary BROKEN foundation;
- persistent MY SHIP / ENEMY SHIP dashboards;
- player Beam slot targeting on visible enemy equipment;
- player Beam engine targets `HULL | BRIDGE | SLOT(slotId)`;
- player Beam cooldown after fire/cancel rather than during charging;
- Sticky Mine single-shot lifecycle: one targeting operation -> one release;
- player Mine targeting cancellation before release is free;
- player SPAM keeps Scientist committed after the enemy purges its effect.

Known runtime mismatches are intentionally tracked in `BACKLOG.md` rather than repeated in full here.

## Gate A — first combat becomes structurally coherent and readable

Gate A is about making the existing combat loop internally consistent enough to judge, not adding a large equipment
catalog.

### 1. Remove prototype control/debug distortions

Before balancing combat, remove behavior that makes current tests/play feel unlike the intended system:

- generic random task interruption from ordinary Beam/Mine damage;
- obsolete opening Drive-disruption debug pulse.

Keep explicit future `INTERRUPT` and `STUN` as separate control mechanics rather than deleting the vocabulary.

### 2. Normalize equipment lifecycle timing

Bring nominally identical player/enemy hardware onto the shared after-action cooldown rule.

Priority mismatches include Evade, Shield, enemy Beam, enemy Turret and enemy SPAM. Preserve the already-correct
free pre-release cancellation boundary for Missile and Sticky Mine.

Make enemy SPAM purge follow the same high-commitment Scientist rule as player SPAM.

### 3. Shared semantic target model

Migrate incoming Beam and targeted Shield toward:

```text
HULL
BRIDGE
SLOT(slotId)
```

Remove the enemy whole-ship Shield shortcut when that migration lands.

Player slot targeting is already proven. Hull/Bridge presentation input and a meaningful Bridge-hit control
consequence are separate presentation/gameplay atoms.

### 4. Threat readability without a threat spreadsheet

Use the current presentation direction:

```text
category danger indicators
+ concrete telegraphy on the first-person viewscreen
+ detailed concrete selection in the relevant equipment interaction when needed
```

Do not gate the first balance pass on building one persistent card/countdown per concrete threat.

The player should be able to notice a problem, understand the broad response family and find the concrete target
without opening a generic inspection modal.

### 5. Finish BROKEN / repair behavior

Use the already-landed integrity foundation:

- all breakable equipment loses function at zero integrity;
- Engineer repairs only BROKEN equipment to full;
- damaged-but-operational equipment is not routine repair work;
- player/enemy command/physical paths consult the same operational truth.

### 6. First weak-fight baseline

Test a deliberately weak/basic player ship against a weak/basic enemy.

Acceptance target:

- reasonable play wins almost every time;
- there is no long predictable toothpick-vs-tree attrition;
- a fight may be longer when it remains tense and decision-rich;
- dead air is visible as a problem rather than accepted as pacing;
- both ships and incoming danger remain readable;
- current basic weapons support real plans instead of one family strictly dominating the rest.

Do not target an arbitrary five- or ten-second fight. Very weak generated enemies may die that quickly; normal
fights need only avoid becoming boring after the outcome is already obvious.

### 7. Scientist tactical identity

Scientist already has SPAM/Purge contention. Add more combat content only when it creates a real decision.

Current flavor direction is sustained/high-commitment disruption rather than turning Scientist into another Gunner.
Analysis/interference details are still working theory and should be tested one concrete mechanic at a time.

### 8. Enemy decision tuning

Once shared physical rules are stable, tune enemy defense-vs-offense decisions.

The enemy should not tunnel DPS through meaningful known danger, but exact defense priority/aggression formulas are
not sacred. Judge them by whether the enemy feels alive, constrained and understandable rather than
omniscient/perfect.

### Gate A check

Before leaving Gate A, the player should be able to answer quickly:

- what broad danger is happening to us?
- which role/system can respond?
- what is installed/BROKEN on both ships?
- what can my Beam target?
- what did the last action accomplish?
- am I choosing between offense and defense because of real officer/CORE contention?
- if the fight is long, is something interesting still happening?

Then run a focused combat smoke/playtest and tune from observed dead air, pressure and resource use.

## Gate B — combat develops build space

Gate B expands choices only after the current loop is readable.

### Starting offensive weapon

The game needs a simple baseline starting offensive weapon. Its concrete identity is intentionally unresolved.

Evaluate candidates such as Autocannon/Basic Gun when this gate begins; do not pre-commit CORE, ammo, self-wear or
upgrade rules from the idea bank.

### Weapon/build diversity

Promote new weapon/equipment ideas one at a time when each creates a distinct captain decision through:

- Hull vs module pressure;
- precise vs uncontrolled targeting;
- ammo vs CORE vs other costs;
- officer contention;
- projectile vs immediate timing;
- specialized counterplay.

Scattergun, Torpedo and Plasma remain idea-bank candidates until explicitly promoted.

### Combat Lab

Build lightweight deterministic test tooling when repeated setup comparison becomes painful.

Useful minimum:

- choose player/enemy chassis + loadout/preset;
- choose deterministic RNG seed;
- restart the same setup quickly;
- inspect duration, Hull loss, ammo/CORE use, officer busy time and threat outcomes.

### Gate B check

- several equipment combinations create visibly different decisions;
- weapons differ by more than damage numbers;
- no officer role receives filler buttons merely for symmetry;
- no dominant pattern trivializes the intended officer/CORE contention.

## Gate C — crew layer exploration

Morale, traits, pairwise relationships, R&R and deeper crew progression are current **working theories**, not
already-fixed systems.

Only after combat/build space is worth preserving should Gate C test which of those ideas actually improves the run.
Prefer a small readable crew model over many parallel meters.

## Serious internal combat matrix

After the earlier gates, test representative early/mid/end setups and track at least:

- combat duration;
- Hull lost;
- ammo/CORE/resource use;
- officer busy time;
- threat outcomes;
- damage/effects by source;
- dead-air periods;
- time spent in already-decided but unfinished combat.

The target is not equal win rate. Strong builds may feel strong and weak builds may fail; the important result is
that the fight remains readable and decisions remain meaningful until it ends.
