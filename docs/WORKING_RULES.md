# Space Captain — Working Rules

Last refreshed: 2026-08-16.

This file is the canonical source of truth for collaboration, patch delivery,
temporary-script cleanup, validation, and handoff workflow.

Permanent process rules belong here. Other project documents should link here
instead of keeping their own copies of the same workflow.

## Document ownership

- `../CURRENT_HANDOFF.md` — transient implementation state and the next working
  atom. Keep it current, but do not turn it into a permanent rulebook.
- `WORKING_RULES.md` — permanent collaboration and patch workflow.
- `PROJECT_CONTEXT.md` — durable product, repository, and coding principles.
- `GAMEPLAY_CONTRACTS.md` — gameplay/domain invariants.
- `SYSTEM_MAP.md` — ownership and architecture map.
- `BACKLOG.md` — planned and deferred work.
- Art/UI documents — domain-specific visual contracts, not workflow rules.

When a permanent workflow rule changes, update this file rather than copying
the rule into several documents.

## Session startup

Before coding or making a new project-design decision:

1. Read `../CURRENT_HANDOFF.md`.
2. Read **every Markdown document in `docs/`**, including this file.
3. Re-fetch current `master` after the documents are loaded.
4. Inspect the current source and tests touched by the next atom.

A commit SHA recorded in a handoff is historical context unless the task
explicitly pins work to that SHA. Do not patch from memory or from a stale
handoff snapshot when current `master` is available.

## Scope and implementation

- Keep one working atom narrow.
- Do not silently fold neighboring or deferred systems into the atom.
- Prefer the smallest change that preserves existing contracts.
- Do not add architecture solely to support a tiny permission or behavior
  change when the existing ownership point already enforces it.
- Prefer code that is easy to re-enter after a break over clever abstraction.
- If the current repository state contradicts the handoff, investigate the
  current state instead of forcing the handoff assumption.

## Temporary patch delivery

Assistant-generated patchers are disposable local tools.

- Prefer guarded `.mjs` patch scripts over large manual patch instructions.
- **Every delivered `.mjs` must be packaged inside a `.zip`. Never provide a
  raw downloadable `.mjs` artifact.**
- The user runs patch scripts from the repository root.
- Use an exact expected HEAD guard whenever the atom was prepared against a
  known clean HEAD.
- Guard every touched source state. Unknown state must fail loudly instead of
  guessing.
- Before writing anything, preflight **all** files touched by the patch and
  compute their complete target contents.
- A patch may accept an exact known partial/dirty state left by a predecessor,
  but only when that state is understood intentionally.
- When practical, rerunning a patch on its exact target state should be safe.
- Preserve the existing source EOL style and exactly one EOF newline.
- Prefer atomic per-file replacement after successful preflight.
- Do not use broad search-and-replace when a narrower guarded transformation
  is available.

If a patch fails, leave the failing script on disk for diagnosis. Do not hide
the failure by deleting evidence or guessing a rollback.

## Replacement patchers and cleanup

When a failed/obsolete patcher is replaced:

- The newest working replacement carries an explicit list of its **known
  predecessor `.mjs` filenames**.
- Only after the replacement has applied successfully and its automated
  validation has passed, it deletes those known predecessor scripts if they
  still exist.
- Cleanup must use exact filenames. **Never delete `*.mjs` by wildcard** and
  never delete unrelated project scripts.
- Do not delete predecessor ZIP archives as part of script cleanup.
- A successful temporary patcher may self-delete after successful writes,
  post-guards, and automated validation.
- Cleanup errors are reported separately and must not make a successful source
  patch look like it failed.
- A future recovery patcher should accept the exact known dirty state left by
  a partial predecessor whenever that state can be recognized safely.

## Validation

Temporary Node patchers must invoke package-manager commands in a
platform-aware way. On Windows, use `npm.cmd` (or an equivalent shell
invocation that resolves `.cmd` files); do not call bare `npm` through
`execFileSync` / `spawnSync` with `shell: false`.
For a TypeScript/gameplay atom, the normal atom-level automated floor is:

```bash
npm run typecheck
npm test -- <focused test path>
git -c core.safecrlf=false diff --check
```

Before commit/push of TypeScript/gameplay changes, also run the full test suite:

```bash
npm test
```

Run additional relevant tests when the change crosses a wider contract.
Runtime smoke is still required for gameplay/visual work where behavior cannot
be proven by tests alone.

After raw texture changes, also run:

```bash
npm run pack:tex
```

Do not run `npm audit fix` as part of unrelated work.

After the script succeeds:

- inspect `git diff`;
- perform any required runtime smoke;
- the user commits and pushes the green result unless GitHub writes were
  explicitly delegated.
