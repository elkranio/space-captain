# Space Captain — Captain Dashboard Handoff

Updated: 2026-08-12
Reference HEAD before this docs atom: `fb170a1ea88d8feb49a5c5ff7655982e55edf7c6`

This is the focused handoff for captain dashboard / combat-context work.

## Design direction

The lower captain console is split conceptually:

- **OUR SHIP** — stable player state/actions
- **CURRENT CONTEXT** — enemy + current threats/actions

The dashboard should feel like restrained early-1990s VGA / Sierra sci-fi:
- dark navy / blue-black
- steel-blue framing
- muted accents
- chunky readable pixels
- low clutter
- not glossy
- not a modern flat HUD
- not a Boeing cockpit
- not a colorful arcade toy

## Current left side

Implemented rows/status cover:
- HULL
- shared DEF capacitor
- ENGINE
- MISSILE
- LASER
- MINES
- SPAM

The UI binds to real engine commands. Do not implement availability rules in the view.

## Current right side

Implemented:
- enemy summary
- enemy HULL
- enemy DEF
- incoming missile threats
- incoming laser threats

### Missile row behavior

Current prototype provides:
- timer
- missile identity/unknown state
- Science identify action where available
- Weapons red/blue point-defense response where available
- inline red/blue selector behavior for unknown missile flow

### Laser row behavior

Current prototype provides:
- timer
- laser threat
- disabled Science placeholder
- Engineer deploy-shield action when the real command is available

## Button visual semantics

Captain action buttons intentionally do **not** use officer-role colors.

Active:
- background `0x193147`
- border `0x7aa0c4`
- white text

Non-interactive / officer busy / current work:
- background `0x101923`
- border `0x26394c`
- text `0x536778`

Red/blue are preserved only in the beam selector because they encode gameplay choice.

## Threat geometry is provisional

Do not treat the current repeated horizontal threat row as final UX architecture.

Current rows were chosen to make mechanics readable during implementation. With real final art, threats may become much smaller, potentially compact tiles rather than rows.

Therefore:
- do not build a generic row framework;
- do not solve final sizing now;
- keep new mine presentation simple and structurally easy to replace;
- keep domain/read-model identity independent of visual grouping.

## Immediate next atom: enemy sticky mines

The mine domain already exists. The missing captain slice is presentation/transport.

Fresh repo facts at the reference HEAD:
- sandbox enemy is still laser-only: `GENERIC_DEFENSE_SANDBOX_00`
- a mine-only enemy preset already exists: `GENERIC_STICKY_MINES_00`
- enemy policy can already choose sticky-mine dispenser as Weapons work
- scheduler already starts weapon targeting
- `CombatStickyMineRunner` already creates individual hostile mines, fuses and detonations
- `getStickyMineSnapshots()` already returns hostile mines attached to player one-by-one
- old bridge mine presentation already receives those snapshots
- captain combat mapper currently accepts missiles + lasers only

Target behavior:
- current sandbox enemy attacks with sticky mines instead of laser
- every attached mine appears independently in captain combat context
- every displayed mine keeps its own engine-owned fuse timer
- clear actions come from existing real engine command availability
- no salvo aggregation in domain/read model
- minimal placeholder row/tile is fine

Do not combine this with:
- spam captain threat UI
- final threat-grid redesign
- generic targeting registry
- mine-physics rewrite
- broad context-menu removal

## Patch delivery rules

Mandatory for every coding atom:

1. **Deliver the patch script only inside a `.zip`.**
2. **After successful work and validation, the script deletes its own `.mjs` file.**

Also:
- fetch fresh `master` HEAD first;
- guard expected HEAD;
- guard tracked clean state;
- preserve CRLF;
- validate exact/current code before transforms;
- run `git -c core.safecrlf=false diff --check`;
- failed patchers remain for diagnosis.

## Test discipline

When changing captain mapper inputs/payloads:
- search all callers first;
- search all tests first;
- do not assume there is only one mapper test;
- update typed and `unknown as` fixtures too;
- prefer tests that prove mapping uses real commands instead of synthetic UI availability.
