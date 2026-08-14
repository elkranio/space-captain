# Space Captain — Backlog

Living backlog only. Completed historical phases belong in git history, not in the active task list.

Updated: 2026-08-15
Reference HEAD: `e7fb792e430d6745ae50c7d7ddb84513fe5bc918`

## Current selected work

### 1. Weapon-specific targeting semantics — NEXT

Current problem:
- universal 3000 ms targeting is a stale layer;
- the same `SHIP_WEAPON_TARGETING_DURATION_MS` currently affects player/enemy weapons across families;
- generic enemy warning announces an attack before the weapon’s real observable action begins.

Selected target:
- Missile Launcher keeps real TARGETING/LOCKING;
- Beam Cannon starts directly in CHARGING;
- SPAM starts directly in CHANNELING;
- Sticky Mine Dispenser starts directly in DISPENSING;
- warning/telegraph starts with the real weapon phase;
- remove obsolete generic “something is coming” warning ownership;
- preserve operator occupancy/crew-performance rules according to the concrete phase.

Do not fake this by setting targeting duration to zero and retaining a meaningless phase.

Before patch:
- fresh-fetch `master`;
- search player + enemy runners;
- search `SHIP_WEAPON_TARGETING_DURATION_MS`;
- search `PLAYER_SHIP_TARGETING_DETECTED`;
- search bridge warning start/clear events/views;
- inspect tests that explicitly step through 3000 ms targeting.

### 2. Single Mine content experiment

After targeting cleanup:

- keep current salvo Sticky Mine Dispenser;
- add a second `Single Mine` / `Single Mine Dispenser` content record in the same family;
- baseline experiment: `salvoSize = 1`;
- tune operation/cooldown so repeated single commands are practical but not spam-click mandatory;
- put both variants into an easy Debug Start comparison loadout;
- do not create a new weapon kind/runner unless actual mechanic divergence demands it.

Question to answer by play:
- one command -> salvo pressure;
- versus repeated short deliberate one-mine commits.

### 3. Gameplay-fidelity visual pass

After the two mechanic atoms above, spend the planned weekend on a representative combat presentation.

This is **not final art production**.

Targets:
- redesign full captain dashboard;
- redesign OUR SHIP panel;
- redesign CURRENT CONTEXT / enemy panel;
- replace current long threat rows with compact threat objects;
- bring bridge closer to Space Quest / small starship bridge and away from current hangar feeling;
- redraw placeholder missile sprites;
- add basic hit juice:
  - short screen shake;
  - short impact flash/blink;
  - restrained readable VFX;
- improve enemy/player impact feedback enough to judge combat feel.

Goal:
> stop judging fun through synthetic programmer UI.

Do not spend the pass polishing final pixel art details that AI cannot reliably finish.

## Compact threat object — selected visual direction

One concrete threat = one compact fixed-footprint object.

Desired structure:
- top: square threat icon + countdown;
- second/intel line: short code;
- action area: stable compact buttons.

Missile intel example:
- unknown: `?????` red;
- uncertain: `ABC??` yellow;
- confirmed: `ABCDE` green.

Science:
- keep button label stable as `TRACK [S]` while more analysis is available;
- remove Science action once intel is terminal/confirmed;
- do not rename `TRACK` to `CONFIRM` merely because state advanced.

Missile response:
- `HIT [W]` stable action slot.

Beam uses the same visual grammar:
- unknown target: `????`;
- partial: `PW??`;
- confirmed: e.g. `PWR`, `HULL`, `WPNS`;
- Engineer response: e.g. `SHLD [E]`.

Desired density:
- about 4 threats comfortably across the combat context;
- 5 should remain viable in a high-pressure case;
- one/two rows only when encounter pressure genuinely demands it.

Important:
- the latest generated POC proved the concept;
- its middle intel strip became too visually weak in one pass;
- preserve a clearly readable signature/intel band in the next mockups;
- tiles should feel Space Quest/Sierra VGA, not modern military HUD.

Potential future:
- 4–5 character generated signature codes;
- degree of revealed characters can expose confidence/intel depth if a perk/mechanic deliberately supports it;
- funny emergent strings are welcome but must not compromise readability.

## Combat fun pass — after representative UI exists

Do not immediately build progression.

Play the same small combat repeatedly and look for real symptoms:
- obvious procedural response chains;
- too much dead time;
- too many simultaneous demands;
- Weapons commitment feeling strategic vs merely annoying;
- Science always being an automatic first click;
- no reason to intentionally accept damage;
- player spending all attention on one panel;
- insufficient offensive/defensive conflict.

The first real success criterion:
> one battle is good enough that the player wants to restart it immediately.

Only then broaden run balance/build variety.

## Near combat systems

After the immediate combat-feel sequence:
- player Defense Turret break/repair;
- Power Core BROKEN:
  - charges -> 0;
  - recharge progress -> 0;
  - consumers unavailable while broken;
- Shield Generator break mutation;
- Active Shield disappears when generator breaks;
- Engineer repair commands for defensive installations;
- Beam Cannon semantic node targeting:
  - HULL;
  - WPNS;
  - PWR;
  - SHLD;
  - other real systems only after domain target state exists;
- Beam hit can break/disable hardpoints and occupy enemy Engineer;
- officer disruption/targeting if still desired after system targeting works;
- enemy repair behavior.

Do not implement semantic nodes from visual impact coordinates.

## Beam Cannon tuning questions

Current design hypothesis:
- no ammo/resource economy;
- powerful utility/precision;
- cost = long Weapons commitment.

Test before changing:
- does long Weapons occupation create good “finish shot vs answer threat” pressure?
- or does it simply remove offensive agency for too long?

First tuning lever:
- charge duration/operator release/cancellation cost.

Do not first convert Beam Cannon into an autonomous post-aim weapon.

## Missile follow-ups

- decide final name/semantics of Missile `TARGETING` vs `LOCKING`;
- tune minimal Weapons commitment;
- tune flight duration against Science + Defense Turret response time;
- future Helm evade remains separate and must not couple to hidden signature;
- decide later whether equipment/technology modifies blind intercept chance.

## Dashboard / UX later

- retire old officer context menu only after dashboard/navigation/engineering surfaces cover commands;
- keep direct task cancellation near officer activity;
- clear leave/escape flow;
- possible tabs:
  - Combat;
  - Engineering;
  - Navigation;
- possible auto-switch:
  - Combat on engagement;
  - Navigation after combat.

Do not implement tabs solely to compensate for the current oversized threat rows; compact threats may remove much of that pressure.

## Bridge / art later

- final bridge asset production only after gameplay/layout stabilizes;
- preserve 1280×720;
- four visible officers:
  - Science;
  - Weapons;
  - Helm;
  - Engineer;
- VIP seat remains future hook;
- reduce arcade color noise;
- retain lived-in low-status service-ship / Space Quest feel.

## Content/editor state

Completed and not current priority:
- Ship Modules CRUD;
- four Ship Weapons CRUD families;
- Officer Tasks split;
- Enemy Behavior content;
- Debug Start;
- generic content references.

Return to content tooling when a combat experiment actually needs it.

## Audio

Later gameplay-fidelity win:
- short weapon/impact/alert sounds;
- officer acknowledgements/result/failure barks;
- voice as UI feedback, not constant chatter.

## Low-priority technical notes

Do not schedule unless a concrete problem appears:
- long cohesive `CombatRunner`, `EncounterEngine`, `EncounterStateStore` are not refactor targets by line count;
- declarative event unions are not a problem;
- specialized threat views are not a problem;
- duplicate snapshot detachment at current data sizes is not a priority.

## Refactor policy

Refactor only when at least one is concrete:
- context travels too far;
- ownership is unclear;
- gameplay rule is duplicated;
- state is reconstructed in multiple places;
- callbacks form real spaghetti;
- method/type signatures become cognitively hostile;
- stale semantic layers obscure current behavior;
- editor plumbing repeats without meaning.

Current valid cleanup target:
- universal weapon targeting semantics, because the shared pre-phase no longer represents the actual weapon mechanics.
