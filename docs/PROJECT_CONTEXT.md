# Space Captain — Project Context

Durable project context. Current implementation status and the next active slice live in `../CURRENT_HANDOFF.md`.

## Product

Space Captain is a Phaser 3 + TypeScript combat/adventure roguelite with a first-person captain view and an early-1990s
Sierra / Space Quest VGA visual target.

The player commands a ship through officers rather than directly piloting every system. Combat is built around readable
telegraphed threats, officer availability, counterplay and limited ship resources rather than bullet-hell reflex play.

Basic combat information should be readable without mandatory checkbox work. Officer and Science mechanics should create
tactical advantage, uncertainty or role contention rather than permission to understand the interface.

## Repository boundaries

- Branch: `master`
- Engine/domain: `src/engine/**`
- App/Phaser presentation: `src/app/**`
- Bridge presentation: `src/app/scenes/game/bridge/**`
- Raw art: `assets/raw/images/**`
- Packed art: `assets/live/images/**`
- Canvas: 1280x720
- Atlas key: `atlas`
- Bitmap font: `pixel_operator`

Keep Phaser/app types out of the engine.

Treat p34t/framework configuration as infrastructure. Do not rewrite it opportunistically.

## Coding principles

Optimize for low cognitive load and easy re-entry:

- thin Phaser scenes;
- explicit engine APIs and owners;
- one authoritative gameplay fact and one mutation path;
- simple branching over clever dispatch;
- no meaningless primitive ID wrapper types;
- no broad context bags or callback mazes when direct dependencies are clearer;
- no architecture solely for hypothetical future systems;
- presentation effects stay out of domain truth;
- roughly 120-column formatting without unnecessary vertical expansion.

File length alone is not a refactor reason.

## Documentation map

- `../CURRENT_HANDOFF.md` — transient checkpoint and next active work.
- `WORKING_RULES.md` — collaboration, patch and validation workflow.
- `GAMEPLAY_CONTRACTS.md` — current implemented gameplay/domain contract only.
- `SYSTEM_MAP.md` — durable ownership and data-flow map.
- `COMBAT_PLAYTEST_ROADMAP.md` — near-term combat milestones and playtest gates.
- `BACKLOG.md` — concrete deferred work only.
- `BRIDGE_ART_DIRECTION.md` — durable bridge visual principles.
- `THREAT_PANEL.md` — current threat-dashboard presentation contract.

A separate canonical intended-game-design document will be added after the next mechanics reconciliation pass.
