# Space Captain — Codex Instructions

This is a thin local instruction layer. Current state and priorities live in `CURRENT_HANDOFF.md`;
durable collaboration rules live in `docs/WORKING_RULES.md`.

## Before each coding atom

- Read `CURRENT_HANDOFF.md`, `docs/WORKING_RULES.md` and relevant docs.
- Inspect the exact current source and tests before editing. The local repository is authoritative;
  do not assume the handoff is newer than the code.
- Keep atoms narrow. Do not silently expand scope.

## Implementation

- Prefer simple, explicit code over clever abstractions. Target roughly 120 columns.
- `src/engine` is headless gameplay/domain code; no Phaser/app types there.
- Engine owns gameplay truth and legality; app/controllers adapt it; views present it.
- Events mean what happened; snapshots/queries mean what is true now.
- Do not introduce generic service locators, event buses or outboxes just to shorten plumbing.
- Do not touch `src/config/gameConfig.ts` unless required.
- Keep the existing EndScene `console.log`.
- Do not remove `ScreenWakeLock`.
- Keep `BridgeMissileDebugView` unless explicitly tasked otherwise.
- Do not run `npm audit fix` as unrelated cleanup.

## Codex Local workflow

- Edit workspace files directly. Do NOT create `.patch` files unless explicitly asked.
- Follow the Codex Local workflow in `docs/WORKING_RULES.md`; handoff fetch/patch instructions refer to Web Chat.
- Do not commit, push, rebase, reset, clean or otherwise alter git history unless explicitly asked.
- Always show and review `git diff` after changes, including the contents of new untracked files.

## Validation

For TypeScript/gameplay work, run:

```bash
npm run typecheck
npm test -- <focused test path>
git -c core.safecrlf=false diff --check
```

- Before declaring a gameplay atom complete, run full `npm test` unless explicitly told not to.
- For raw texture changes, run `npm run pack:tex`.
