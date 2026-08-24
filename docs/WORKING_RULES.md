# Space Captain — Working Rules

Permanent collaboration and implementation rules. Do not duplicate them in task or handoff documents.

## Session startup

Before a new coding atom:

1. Read `../CURRENT_HANDOFF.md` and the Markdown documents in `docs/`.
2. Re-fetch current `master`.
3. Inspect the exact current source and tests touched by the atom.

Current repository state wins over stale handoff assumptions.

## Code rules

Default to the simplest implementation that satisfies the concrete requirement.

- Target roughly 120 columns; do not vertically explode readable code.
- Prefer explicit `if`, `switch` and early-return logic over clever generic machinery.
- Keep meaningful discriminated unions and payload types; avoid primitive aliases that add no protection.
- One gameplay fact has one authoritative owner and one clear mutation path.
- Engine owns gameplay rules and command legality. App/controller code adapts truth for presentation;
  views present it.
- Keep Phaser/app types out of `src/engine/**`.
- Events mean **what happened**; snapshots/queries mean **what is true now**.
- Keep dependencies local and explicit. A helper/service/manager must remove real complexity or own a real contract.
- Split by responsibility, not by line count.
- Prefer direct synchronous owner calls/results when ownership is clear. Use callbacks/events only when
  their semantics are real.
- Do not introduce a global service locator, generic event bus or queued outbox merely to shorten signatures.
- Preserve same-step ordering unless an actual gameplay requirement says otherwise.
- Comments explain non-obvious why/invariants; git owns history.
- Framework/p34t code is not cleanup territory unless current work requires it.
- Tests protect behavior/contracts, not incidental implementation shape.

Refactor stable code only when there is concrete cognitive or correctness cost: duplicated truth, unclear ownership,
callback/context plumbing, hostile signatures, stale layers or repeated bugs.

## Scope

Keep each working atom narrow. Do not silently fold neighboring or speculative systems into it.

If a new sprite/raw asset is required for an atom, say so before coding that atom.

## Patch delivery

For tracked text/source changes, use a Git patch generated from the exact current source state.

- Re-fetch current `master` before preparing the patch.
- For ordinary edits, obtain the **full exact current contents of every touched file** before building the patch.
- Do not use reconstructed, sparse, line-positioned, synthetic-padding or approximate preimages for normal source edits.
- Generate hunks with a real `git diff`; do not hand-author hunk headers or approximate context.
- Structural moves should use full exact preimages plus real `git mv`/`git diff`.
- If a full exact preimage cannot be obtained, fetch it or reduce the patch scope instead of fabricating context.
- Validate with `git apply --check` against a clean copy of the same exact preimages before delivery.
- The user normally applies, validates, commits and pushes.

Normal flow:

```bash
git apply --check <name>.patch
git apply <name>.patch
```

Do not replace a failed normal patch with an ad-hoc installer merely to dodge a bad hunk.

A guarded executable patcher is reserved for transformations that genuinely require executable migration
logic. If one is needed, it must fail loudly on unknown source state and preflight all writes.

## Validation

For TypeScript/gameplay work, the normal floor is:

```bash
npm run typecheck
npm test -- <focused test path>
git -c core.safecrlf=false diff --check
```

Before pushing gameplay changes, also run the full suite:

```bash
npm test
```

Also:

- run runtime smoke for gameplay/visual changes that tests cannot prove;
- after raw texture changes run `npm run pack:tex`;
- inspect `git diff` before commit;
- do not run `npm audit fix` as unrelated cleanup.
