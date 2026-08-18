# Space Captain — Working Rules

Last refreshed: 2026-08-18.

This file is the canonical source of truth for coding style, collaboration,
patch delivery, temporary-script cleanup, validation, and handoff workflow.

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

## Code rules

Default decision: **choose the simplest implementation that satisfies the
current concrete requirement.**

### Formatting

- Write TypeScript for a practical `printWidth = 120`.
- Do not wrap short property chains, enum access, arguments, or expressions
  merely to make code more vertical.
- Split an expression when named intermediate steps make the logic easier to
  understand, not because of an imaginary narrow-column limit.
- Prefer early returns over deep nesting.

### Simplicity

- Prefer dumb, explicit, locally understandable code over clever or indirect
  code.
- Ordinary `if`, `switch`, early-return logic and a small amount of obvious
  repetition are preferred over generic dispatch/framework machinery when the
  machinery does not solve a concrete problem.
- Do not build architecture for hypothetical future weapons, mechanics,
  plug-ins, games, or content. Add an abstraction only after a real requirement
  makes it useful.
- Delete obsolete layers/compatibility paths before inventing replacements.

### Types

- Do not create a type merely because TypeScript allows it.
- Meaningless primitive aliases such as `type SomethingId = string` or
  `type FooId = number` are not allowed. Use the primitive directly.
- Avoid alias chains and wrapper types that add no semantics.
- Keep types that encode real structure or protection: discriminated unions,
  meaningful state/payload shapes, narrowed variants, result objects and types
  that prevent real invalid states.

### Ownership and boundaries

- One gameplay fact has one authoritative owner and one clear mutation path.
- Controllers, snapshots and views must not keep a second mutable copy of
  gameplay truth.
- Engine owns gameplay rules. App/controller code may adapt safe engine truth
  for presentation. Views present it and do not decide hit/miss, command
  legality, cooldowns, officer availability or other gameplay outcomes.
- Keep Phaser/app types out of `src/engine/**`.
- Events represent one-time facts; snapshots/queries represent current state.
  Do not create competing event and snapshot truth without a concrete reason.

### Dependencies and abstractions

- Keep dependencies local and explicit. Do not pass broad context bags when a
  small set of direct dependencies is clearer.
- A helper, class, resolver, manager or service must pay rent: it should remove
  real repeated complexity, own a real contract, or create a useful boundary.
  Do not add a layer that merely renames/forwards one obvious call.
- Split files/classes by responsibility, not by line count. A large coherent
  file is preferable to several tiny files that make one behavior harder to
  trace.
- Do not genericize similar weapon/turret/Evade lifecycles merely for symmetry.

### Dependency communication

For synchronous engine code, prefer the communication form that makes the real
owner easiest to discover:

- A stable known owner operation should normally be a direct owner method call,
  not a callback wrapper around one method.
- If a child synchronously reports completion to its single parent, prefer
  returning a result over building a callback/event path.
- Keep callbacks when callback semantics are real: listeners/events, lifecycle
  hooks, injected RNG/test seams, or another concrete inversion boundary.
- Do not introduce a global mutable service locator/runtime merely to shorten
  signatures or hide object dependencies.
- If direct owner references would create a real ownership cycle, prefer the
  smallest explicit typed **synchronous** internal-effect boundary with one
  obvious dispatcher. Do not turn that exception into a generic event bus,
  command framework or queued outbox without a concrete need.
- Preserve same-step ordering. Queue/flush semantics are not the default
  replacement for synchronous calls.
- Do not optimize for zero callbacks. Optimize for obvious ownership and low
  context reconstruction.

### Comments and tests

- Comments explain non-obvious **why**, invariants or boundary decisions. Do not
  keep commented-out old implementations or historical narration in normal
  project code; git is the history.
- Framework/p34t code is not cleanup territory unless current development
  requires touching it.
- Tests protect behavior/contracts, not incidental internal implementation
  shape.
- Balance/tuning values should come from content definitions in tests unless the
  exact numeric value is itself the contract.

### Refactor threshold

Refactor stable code only when there is concrete evidence such as:
- duplicated truth or mutation paths;
- unclear ownership;
- callback/context plumbing that makes behavior hard to trace;
- hostile signatures;
- stale compatibility layers;
- repeated bugs caused by the current structure.

`This could be prettier` and `this file is large` are not sufficient reasons.

## Scope and implementation

- Keep one working atom narrow.
- Do not silently fold neighboring or deferred systems into the atom.
- Prefer the smallest change that preserves existing contracts.
- If the current repository state contradicts the handoff, investigate the
  current state instead of forcing the handoff assumption.

## Patch delivery

For ordinary tracked text/source changes, prefer a standard unified Git patch.

- Re-fetch current `master` and inspect the exact current source before preparing
  the patch.
- Generate the patch with Git from the actual source state. Do not hand-author
  hunk headers, line counts or approximate surrounding context.
- Before delivery, validate the generated patch with `git apply --check` against
  an exact clean copy of the expected source state whenever practical.
- The normal user flow is:

```bash
git apply --check <name>.patch
git apply <name>.patch
```

- If `git apply --check` fails, inspect the exact reported file/hunk and current
  repository state. Do not switch to a bespoke installer merely to dodge a bad
  patch.
- Keep patches narrow and inspectable. The patch file itself is sufficient; it
  does not need a ZIP wrapper.

Use a guarded `.mjs` patcher only when the change genuinely needs executable
migration logic, for example:
- several intentionally supported source variants;
- computed/generated content;
- non-trivial transformation logic;
- atomic multi-step filesystem work that a plain patch cannot express clearly.

When `.mjs` is justified:

- **Every delivered `.mjs` must be packaged inside a `.zip`. Never provide a
  raw downloadable `.mjs` artifact.**
- The user runs it from the repository root.
- Use an exact expected HEAD guard when the atom was prepared against a known
  clean HEAD.
- Guard every touched source state and preflight all writes before changing any
  file.
- Preserve existing EOL style and exactly one EOF newline.
- Prefer atomic per-file replacement.
- Unknown source state must fail loudly instead of guessing.

If a temporary patcher fails, leave it on disk for diagnosis. Replacement
patchers may clean up only explicitly named predecessor `.mjs` files after the
replacement has applied and validated successfully. Never wildcard-delete
project scripts.

## Validation

Temporary Node patchers must invoke package-manager commands in a
platform-aware way. On Windows, `.cmd` launchers such as `npm.cmd` must
run through a shell (`shell: true` or an explicit `cmd.exe` invocation);
do not call bare `npm`, and do not call `npm.cmd` directly through
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

After the patch or script succeeds:

- inspect `git diff`;
- perform any required runtime smoke;
- the user commits and pushes the green result unless GitHub writes were
  explicitly delegated.
