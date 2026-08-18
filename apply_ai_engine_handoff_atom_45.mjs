import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import {
    existsSync,
    readFileSync,
    renameSync,
    unlinkSync,
    writeFileSync,
} from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const EXPECTED_HEAD = "cd2e37d1cf489e6e27f07eecbc0764c9214f6f64";
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = process.cwd();

const EXPECTED_BLOBS = {
    "CURRENT_HANDOFF.md": "f3d8a3c28cce0682014c505c5712132ba2f24b7c",
    "docs/WORKING_RULES.md": "530434f867d7b3f1c6b238f9ae7027ed241ddbbb",
    "docs/PROJECT_CONTEXT.md": "b5a3efb3a3cb691c95bc5e608ef7b235246a7aff",
};

const NEW_DOC_PATH = "docs/AI_ASSISTED_ENGINE_SIMPLIFICATION.md";

const HANDOFF_TARGET = "# Space Captain \u2014 Current Handoff\n\nDate: 2026-08-18\n\nAlways re-fetch current `master` before preparing a patch.\n\n## Current state\n\nThe large cognitive-load refactor sprint and the documentation cleanup are complete.\nThe repository is green.\n\nA follow-up read-only audit was then run specifically from an **AI-assisted coding**\nperspective: minimize context reconstruction, hidden dependency paths, and\nplausible-but-wrong code paths.\n\nThe audit found one concrete engine-level cleanup target: a callback dependency\nknot around encounter combat/task orchestration.\n\nThe detailed audit result, target graph, sequencing constraints and atom plan live\nin:\n\n`docs/AI_ASSISTED_ENGINE_SIMPLIFICATION.md`\n\nRead that document before changing encounter runner wiring.\n\n## Active slice\n\nTemporarily pause the gameplay roadmap and simplify the encounter callback knot.\n\nThis is **not** another broad cleanup sprint and **not** an event-bus rewrite.\n\nImmediate next atom:\n\n**EnemyCrewTaskRunner completion callbacks -> synchronous returned completion\nresults handled by EnemyBehaviorRunner.**\n\nKeep the atom narrow. Do not introduce the proposed internal-effect boundary in\nthe same atom.\n\nAfter the engine simplification slice closes, return to the canonical combat\nroadmap. The next gameplay/presentation target remains the **enemy dashboard\nredesign**.\n\n## Important constraints\n\n- Preserve current gameplay and same-step ordering exactly.\n- Do not create a global mutable encounter singleton/service locator.\n- Do not replace the callback knot with a generic event bus.\n- Do not create a queued internal outbox unless a concrete ordering need is\n  demonstrated. The current preferred escape hatch for the few real ownership\n  cycles is a tiny **synchronous typed internal-effect boundary**.\n- Public `EncounterEvent` outbox behavior is separate and should remain intact.\n- `emit` callbacks, injected RNG and real UI/listener/tween callbacks are not\n  cleanup targets merely because they are callbacks.\n- Do not split large readable files on line count. In particular,\n  `BridgeEncounterEngineEventHandler` was a false-positive audit hotspot.\n\n## Temporary/debug context worth preserving\n\n- The opening disruption pulse is a real one-shot mechanic. Automatic use is\n  currently controlled from the app-side combat-start debug boundary while\n  combat behavior is being tested. Do not delete the mechanic as dead code.\n- The disposable bridge debug layer is still intentionally retained. Its cleanup\n  is tracked in `docs/BACKLOG.md`.\n\n## Startup\n\nFollow `docs/WORKING_RULES.md`:\n\n1. read this handoff;\n2. read every Markdown document in `docs/`;\n3. pay special attention to `docs/AI_ASSISTED_ENGINE_SIMPLIFICATION.md`;\n4. re-fetch current `master`;\n5. inspect the exact current source/tests touched by the next atom.\n";
const AUDIT_DOC_TARGET = "# Space Captain \u2014 AI-Assisted Engine Simplification\n\nStatus: **ACTIVE TEMPORARY ENGINE REFACTOR HANDOFF**\n\nAudit baseline: `cd2e37d1cf489e6e27f07eecbc0764c9214f6f64`\n\nDelete or merge this document after the slice is complete. It exists so a fresh\nchat can resume the work without reconstructing the discussion from history.\n\n## Why this slice exists\n\nThe repository already completed a large cognitive-load refactor sprint. This\nfollow-up is narrower.\n\nThe question is not:\n\n> Is the architecture academically clean?\n\nThe question is:\n\n> How much code/context must an AI coding agent reconstruct before it can safely\n> change one behavior?\n\nFor this project, lower AI cognitive cost means:\n\n- fewer files required to understand one behavior;\n- fewer dependencies whose real target is hidden behind callback wrappers;\n- fewer plausible-but-wrong paths for the same concept;\n- obvious owners and mutation paths;\n- synchronous ordering visible from code structure;\n- boring direct code rather than dependency-injection ceremony.\n\nThe normal project rule still dominates: **prefer the simplest implementation\nthat satisfies the current concrete requirement.**\n\n## Audit result\n\nA read-only AST audit scanned:\n\n```text\n296 TypeScript/TSX files\nsrc/app/**\nsrc/engine/**\n```\n\nThe audit intentionally over-reported candidates. Its score is not a quality\nmetric.\n\nImportant manual conclusions:\n\n### GREEN \u2014 do not \"fix\" these because of the audit\n\n- `BridgeEncounterEngineEventHandler` scored highest because it emits many\n  presentation events. It remains a linear, discoverable translation switch.\n  Do not split it merely because it is large.\n- Bridge event subscriptions are mostly real event semantics with matching\n  `on/off` lifecycle. They are not the callback problem being addressed here.\n- `emit: (event: EncounterEvent) => void` is a legitimate public event-outbox\n  sink.\n- `random: () => number` is a legitimate deterministic-test/seed seam.\n- Tween/animation `onComplete` and UI callbacks are real callback semantics.\n- `EncounterSnapshotReader.read(select)` is intentionally a function-based read\n  API.\n- Wide math/rendering signatures are not automatically debt.\n- File/import count alone is not a reason to split code.\n\nAudit sanity checks also found only three anonymous listener subscriptions and no\n`.bind(this)` calls. The problem is not \"callbacks everywhere\".\n\n### YELLOW \u2014 separate presentation concern\n\n`BridgeObjectsAnimationContext` has 10 members, 8 of them functions, and\n`BridgeObjectsView`/`BridgeObjectsAnimationSequencer` build wrapper callbacks\naround shared animation state.\n\nThis may be worth simplifying later, but it is **not part of the current engine\nslice**. Do not mix it into the encounter refactor.\n\n### RED \u2014 encounter callback knot\n\nThe real cognitive debt is concentrated around:\n\n```text\nEncounterEngine\nCombatRunner\nOfficerTaskRunner\nOfficerTaskEffects\nPlayerWeaponRunner\nEnemyBehaviorRunner\nEnemyCrewTaskRunner\n```\n\nSeveral callbacks are not true event/listener boundaries. They are synchronous\ncalls to a stable neighboring owner, threaded through intermediate layers to\navoid object dependency cycles.\n\nThat makes the real target of an operation expensive to discover.\n\n## Current callback knot\n\nSimplified current graph:\n\n```text\n                    EncounterEngine\n                          |\n          +---------------+---------------+\n          |               |               |\n          v               v               v\n  OfficerTaskRunner   CombatRunner   PlayerWeaponRunner\n          ^               ^               ^\n          |               |               |\n          +---- callback knot / cross-owner calls -----+\n                          |\n                  EnemyBehaviorRunner\n                          |\n                  EnemyCrewTaskRunner\n```\n\n### Officer tasks -> combat\n\n`OfficerTaskRunner` / `OfficerTaskEffects` receive callbacks for:\n\n```text\npurgeSpamChannel(channelId)\nclearStickyMine(mineId)\n```\n\nThe real owner is `CombatRunner` and its concrete combat-family runners.\n\n### Combat -> officer tasks\n\nDamage from the current Beam/Sticky-Mine paths can call:\n\n```text\nOfficerTaskRunner.interruptRandomTaskByDamage()\n```\n\nThe callback is currently threaded through `CombatRunner` and concrete physical\nrunners.\n\nThis reverse edge creates an ownership cycle with the previous task -> combat\nedge.\n\n### Player weapons -> combat\n\nPlayer weapon-family runners receive callback wrappers for physical work such as:\n\n```text\nqueuePlayerMissileLaunch(...)\nqueuePlayerStickyMineAttach(...)\n```\n\nThe real owner is `CombatRunner`.\n\n### Player weapons -> officer tasks\n\nPlayer weapon-family runners receive:\n\n```text\ncompleteOfficerTask(taskId)\n```\n\nThe real owner is `OfficerTaskRunner`.\n\n### Enemy behavior -> player weapon SPAM\n\nEnemy Science finishing PURGE SPAM currently threads a callback through:\n\n```text\nCombatRunner\n-> EnemyBehaviorRunner.step(...)\n-> EnemyCrewTaskRunner.advance(...)\n-> advanceActorTasks(...)\n-> advanceTimedTask(...)\n-> advancePurgeSpam(...)\n```\n\nand eventually reaches:\n\n```text\nPlayerWeaponRunner.purgeSpamChannel(...)\n```\n\nThis is the clearest high-cost callback chain.\n\n### EnemyCrewTaskRunner completion callbacks\n\n`EnemyCrewTaskRunner` currently receives completion callbacks for:\n\n```text\nshield deployment completed\nsticky-mine clearing completed\nthreat identification completed\n```\n\nand receives SPAM purge completion as an additional per-`advance()` callback.\n\nThese callbacks are child -> parent completion reporting. They do not need a bus.\n\n### Enemy defense turret -> missile runner\n\n`EnemyDefenseTurretRunner` receives an `interceptPlayerMissile(...)` callback.\n\nThe real owner is the already-existing `CombatMissileRunner`.\n\n## Target communication rules\n\nUse this decision order.\n\n```text\nsame/stable known owner operation\n    -> direct owner method call\n\nchild synchronously reports completion to its parent\n    -> return a result\n\nreal event/listener/lifecycle callback or injected RNG\n    -> callback stays\n\ndirect dependency would create a real ownership cycle\n    -> smallest explicit typed synchronous internal effect\n```\n\nDo not optimize for zero callbacks. Optimize for **obvious semantics**.\n\nA callback should have a reason to be a callback.\n\n## What NOT to build\n\nDo not solve this slice with:\n\n- a global mutable `EncounterRuntime` singleton;\n- a service locator / global dependency bag;\n- a generic engine event bus with hidden subscribers;\n- an ECS;\n- a generic command/message framework;\n- a queue where every ordinary method call becomes a message;\n- one universal `Context`/`Services` object;\n- generic weapon/turret/task lifecycle infrastructure.\n\nA hidden global dependency makes signatures smaller but makes code discovery\nworse. For AI-assisted work that is usually a bad trade.\n\n## Internal effect boundary \u2014 current preferred shape\n\nAfter simpler callback removal, two genuine reverse ownership edges are expected\nto remain:\n\n```text\nCombat -> OfficerTaskRunner\nCombat -> PlayerWeaponRunner\n```\n\nThe preferred escape hatch is **one tiny synchronous typed boundary**, not a\nqueued bus.\n\nInitial effect vocabulary should describe the exact operation currently\nperformed, not a broader fact that accidentally changes semantics.\n\nConceptually:\n\n```ts\ntype EncounterInternalEffect =\n    | {\n          kind: \"interrupt_random_player_officer_task\";\n      }\n    | {\n          kind: \"purge_player_spam_channel\";\n          channelId: string;\n          targetActorId: string;\n      };\n```\n\nThe exact names may change during implementation, but the distinctions are real\nand therefore justify a discriminated union.\n\nOne dispatcher belongs at the encounter composition boundary:\n\n```text\nproducer\n-> typed internal effect\n-> ONE obvious synchronous dispatcher\n-> real owner\n-> return to producer\n```\n\n### Why the effect is synchronous\n\nDo **not** default to:\n\n```text\npush effect\n-> continue the frame\n-> flush later\n```\n\nCurrent combat ordering is gameplay-critical. A queued outbox would require\nmultiple flush checkpoints and would start dictating architecture.\n\nSynchronous dispatch preserves current call-order semantics while still making\nthe cross-owner escape hatch searchable and explicit.\n\n### Important naming warning\n\nDo not generalize the interruption effect to something like\n`PLAYER_SHIP_DAMAGED` without verifying gameplay.\n\nCurrent code threads officer interruption through specific Beam/Sticky-Mine\npaths. Incoming missile damage does not currently use that callback.\n\nA broad \"player damaged\" effect could silently make missiles interrupt officer\ntasks and therefore change gameplay.\n\nPreserve the exact current consequence first.\n\n## Ordering contracts that must not drift\n\n### EncounterEngine step order\n\nCurrent high-level order is:\n\n```text\nPowerCoreRunner\nShieldGeneratorRunner\nPlayerDefenseTurretRunner\nOfficerTaskRunner\nadvance actor Evades\nPlayerWeaponRunner\nplayer Evade lifecycle completion\nCombatRunner\ncancel officer tasks with missing targets\n```\n\nDo not reorder this slice unless a focused lifecycle test proves the change is\nintentional.\n\n### CombatRunner step order\n\nCurrent high-level order is:\n\n```text\nadvance existing enemy shield lifetime\ncapture IDs of combat objects that existed before this combat step\nintegrate pending player missile/mine objects\nresolve only the previously-existing physical combat objects\nadvance enemy behavior / crew / captain decisions\nadvance enemy physical combat systems\nsynchronize enemy crew tasks\n```\n\nThe queued-player-object rule is especially important:\n\nPlayer weapon work happens before `CombatRunner`, but newly queued physical\nmissiles/mines are integrated after the existing-object ID snapshot. Therefore\nthey exist during the combat step but do **not** consume that step's `deltaMs`.\n\nDo not accidentally make a newly launched object advance immediately.\n\n### Enemy behavior ordering\n\nEnemy crew completion currently happens before the same actor's new captain\ndecision in that step.\n\nIf a crew task finishes a defensive/cleanup action, the consequence must be\napplied before the captain decision snapshot that follows.\n\n### Enemy destruction ordering\n\nEnemy destruction is currently synchronous and sensitive to same-step physical\nresolution.\n\nA lethal player hit can remove the actor and clean player combat objects\ntargeting that actor before later same-step resolutions inspect them.\n\nDo not queue/defer enemy destruction casually.\n\nFor this reason `destroyEnemyActor` is explicitly **not** an early target for the\ninternal-effect conversion.\n\n## Target graph\n\nDesired direction after this slice:\n\n```text\n                         EncounterEngine\n                               ^\n                               |\n                     tiny synchronous\n                    internal-effect sink\n                               |\n                         CombatRunner\n                      /      |       \\\n                     /       |        \\\n                    v        v         v\n               missiles    mines     beams\n                    |\n                    +--> EnemyBehaviorRunner\n                              |\n                              v\n                       EnemyCrewTaskRunner\n                              |\n                       returns completions\n\nOfficerTaskRunner -----------------> CombatRunner\n\nPlayerWeaponRunner ----------------> CombatRunner\n       |\n       +----------------------------> OfficerTaskRunner\n```\n\nThe normal graph should be close to a DAG. The very small number of real reverse\nedges cross the explicit internal-effect boundary rather than being hidden as\nmany unrelated callbacks.\n\n## Atom plan\n\nDo not implement several steps at once merely because the target architecture is\nknown.\n\n### Atom 1 \u2014 EnemyCrewTaskRunner reports completions by return value\n\nThis is the immediate next atom.\n\nGoal:\n\nRemove child -> parent completion callbacks from `EnemyCrewTaskRunner`.\n\nCurrent callbacks to eliminate from this child boundary:\n\n```text\nonShieldDeploymentCompleted\nonStickyMineClearingCompleted\nonThreatIdentificationCompleted\nonSpamPurgingCompleted\n```\n\nTarget behavior:\n\n```text\nEnemyBehaviorRunner\n    -> crewTaskRunner.advance(deltaMs)\n    -> receives completed timed task result(s)\n    -> handles each completion synchronously\n    -> only then continues to captain decision logic\n```\n\nFor this atom, keep the existing `EnemyBehaviorRunner` outer dependencies\n(`deployEnemyShield`, `clearPlayerStickyMine`, `purgePlayerSpamChannel`) if doing\nso keeps the change narrow. The goal is to remove callback threading **inside\nEnemyCrewTaskRunner**, not solve the entire knot at once.\n\nIf a small result type is needed to preserve actor identity plus completed task,\nthat is a meaningful type and is allowed. Do not invent extra wrapper layers.\n\nAcceptance:\n\n- no completion callbacks in `EnemyCrewTaskRunnerOptions`;\n- no SPAM completion callback parameter threaded through `advance`,\n  `advanceActorTasks`, `advanceTimedTask`, `advancePurgeSpam`;\n- completion side effects still happen synchronously before captain decision;\n- behavior/tests remain unchanged.\n\n### Atom 2 \u2014 introduce the tiny synchronous internal-effect boundary\n\nOnly after Atom 1 is green.\n\nReplace the two high-cost reverse callback paths:\n\n```text\ninterruptRandomOfficerTask\npurgePlayerSpamChannel\n```\n\nwith the typed synchronous encounter internal-effect boundary.\n\nExpected consequences:\n\n- remove per-step interruption callback parameters from `CombatRunner`;\n- stop threading interruption through Beam/Sticky-Mine method signatures;\n- remove `purgePlayerSpamChannel` from the `CombatRunner.step` /\n  `EnemyBehaviorRunner.step` chain;\n- one searchable dispatcher in `EncounterEngine`;\n- public `EncounterEvent` outbox remains unchanged;\n- no queue/flush/checkpoint system.\n\n### Atom 3 \u2014 direct OfficerTask -> Combat owner dependency\n\nAfter the reverse Combat -> OfficerTask callback is gone, replace:\n\n```text\npurgeSpamChannel callback\nclearStickyMine callback\n```\n\nwith a direct reference to the real combat owner.\n\nExpected simplification:\n\n```text\nOfficerTaskEffects\n-> CombatRunner.purgeSpamChannel(...)\n-> CombatRunner.clearStickyMine(...)\n```\n\nDo not create a new \"combat service interface\" just to avoid importing the real\nowner unless a concrete cycle proves it necessary.\n\n### Atom 4 \u2014 direct PlayerWeapon owner dependencies\n\nAfter `PURGE_PLAYER_SPAM_CHANNEL` no longer creates a reverse object dependency,\nreplace obvious wrappers such as:\n\n```text\nqueuePlayerMissileLaunch\nqueuePlayerStickyMineAttach\ncompleteOfficerTask\n```\n\nwith direct stable owner references where they reduce hops.\n\nPrefer:\n\n```text\nPlayerWeaponRunner -> CombatRunner\nPlayerWeaponRunner -> OfficerTaskRunner\n```\n\nover one callback per method.\n\nDo not force `destroyEnemyActor` into this atom.\n\n### Atom 5 \u2014 local enemy defense-turret dependency\n\nReplace the local:\n\n```text\ninterceptPlayerMissile(...)\n```\n\ncallback with a direct `CombatMissileRunner` dependency if the current source\nstill supports that simple construction order.\n\nThis is a local CombatRunner-owned sibling relationship and does not justify an\nevent bus.\n\n### Atom 6 \u2014 rerun the AI cognitive audit and stop unless RED remains\n\nAfter the previous atoms:\n\n- rerun the same audit;\n- manually inspect remaining callback dependencies;\n- compare number of hops, not merely callback count;\n- stop the engine slice if the remaining callbacks have honest semantics.\n\nPossible later watch points, not automatic work:\n\n```text\ndestroyEnemyActor ordering/wiring\nBridgeObjectsAnimationContext\n```\n\nDo not manufacture more cleanup work.\n\n## Tests and validation strategy\n\nEach atom must preserve behavior.\n\nUse the normal project validation floor from `WORKING_RULES.md`.\n\nFor this slice, focused tests should prioritize the exact ordering contracts\ntouched by the atom, especially:\n\n- enemy crew task completion;\n- enemy SPAM purge;\n- enemy shield deployment completion;\n- enemy sticky-mine clearing completion;\n- enemy threat identification completion;\n- Beam/Sticky-Mine officer interruption;\n- player weapon task completion;\n- player missile/mine launch same-step timing;\n- target-loss/destruction ordering where touched.\n\nRun full tests before push.\n\nRuntime smoke is required if an atom changes gameplay execution paths even when\nthe intended behavior is \"no behavior change\".\n\n## Success condition\n\nThis slice is done when a fresh reader can follow encounter cross-system work\nmostly as:\n\n```text\ndirect owner call\nor\nchild returns result\nor\none explicit typed cross-cycle effect\n```\n\nand no longer needs to climb several layers of callback parameters to discover\nthe real operation.\n\nThen:\n\n1. remove/merge this temporary document;\n2. refresh `CURRENT_HANDOFF.md`;\n3. resume `COMBAT_PLAYTEST_ROADMAP.md` with enemy dashboard redesign.\n";
const WORKING_INSERT = "- Do not genericize similar weapon/turret/Evade lifecycles merely for symmetry.\n\n### Dependency communication\n\nFor synchronous engine code, prefer the communication form that makes the real\nowner easiest to discover:\n\n- A stable known owner operation should normally be a direct owner method call,\n  not a callback wrapper around one method.\n- If a child synchronously reports completion to its single parent, prefer\n  returning a result over building a callback/event path.\n- Keep callbacks when callback semantics are real: listeners/events, lifecycle\n  hooks, injected RNG/test seams, or another concrete inversion boundary.\n- Do not introduce a global mutable service locator/runtime merely to shorten\n  signatures or hide object dependencies.\n- If direct owner references would create a real ownership cycle, prefer the\n  smallest explicit typed **synchronous** internal-effect boundary with one\n  obvious dispatcher. Do not turn that exception into a generic event bus,\n  command framework or queued outbox without a concrete need.\n- Preserve same-step ordering. Queue/flush semantics are not the default\n  replacement for synchronous calls.\n- Do not optimize for zero callbacks. Optimize for obvious ownership and low\n  context reconstruction.\n\n";
const PROJECT_MAP_LINE = "- `AI_ASSISTED_ENGINE_SIMPLIFICATION.md` \u2014 temporary active callback/dependency audit and atom plan.\n";

function fail(message) {
    throw new Error(message);
}

function normalizeEol(text) {
    return text.replace(/\r\n/g, "\n");
}

function ensureOneEofNewline(text) {
    return text.replace(/\n+$/g, "") + "\n";
}

function gitBlobSha(text) {
    const content = Buffer.from(text, "utf8");
    const header = Buffer.from(`blob ${content.length}\0`, "utf8");

    return createHash("sha1").update(header).update(content).digest("hex");
}

function replaceExactlyOnce(text, search, replacement, label) {
    const firstIndex = text.indexOf(search);

    if (firstIndex < 0) {
        fail(`Expected source fragment missing: ${label}`);
    }

    if (text.indexOf(search, firstIndex + search.length) >= 0) {
        fail(`Expected source fragment is not unique: ${label}`);
    }

    return text.slice(0, firstIndex) + replacement + text.slice(firstIndex + search.length);
}

function assertCleanTrackedTree() {
    for (const args of [["diff", "--quiet"], ["diff", "--cached", "--quiet"]]) {
        const result = spawnSync("git", args, {
            cwd: ROOT,
            stdio: "inherit",
            shell: false,
        });

        if (result.status !== 0) {
            fail("Tracked working tree is not clean. Commit/stash tracked changes before running Atom 45.");
        }
    }
}

function readGuarded(path) {
    const absolutePath = resolve(ROOT, path);

    if (!existsSync(absolutePath)) {
        fail(`Expected file is missing: ${path}`);
    }

    const raw = readFileSync(absolutePath, "utf8");
    const normalized = normalizeEol(raw);
    const actualBlob = gitBlobSha(normalized);
    const expectedBlob = EXPECTED_BLOBS[path];

    if (actualBlob !== expectedBlob) {
        fail(
            `Unexpected source state for ${path}\n` +
                `Expected git blob: ${expectedBlob}\n` +
                `Actual git blob:   ${actualBlob}`,
        );
    }

    return {
        path,
        absolutePath,
        eol: raw.includes("\r\n") ? "\r\n" : "\n",
        normalized,
    };
}

function writeAtomically(file, normalizedTarget) {
    const target = file.eol === "\n" ? normalizedTarget : normalizedTarget.replace(/\n/g, "\r\n");
    const tempPath = `${file.absolutePath}.atom45.tmp`;

    writeFileSync(tempPath, target, "utf8");
    renameSync(tempPath, file.absolutePath);
}

function main() {
    if (!existsSync(resolve(ROOT, ".git"))) {
        fail("Run this script from the Space Captain repository root");
    }

    const head = execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: ROOT,
        encoding: "utf8",
    }).trim();

    if (head !== EXPECTED_HEAD) {
        fail(`Unexpected HEAD. Expected ${EXPECTED_HEAD}, got ${head}`);
    }

    console.log(`HEAD guard OK: ${head}`);
    assertCleanTrackedTree();

    if (existsSync(resolve(ROOT, NEW_DOC_PATH))) {
        fail(`${NEW_DOC_PATH} already exists; refusing to overwrite an unknown state`);
    }

    const handoff = readGuarded("CURRENT_HANDOFF.md");
    const workingRules = readGuarded("docs/WORKING_RULES.md");
    const projectContext = readGuarded("docs/PROJECT_CONTEXT.md");

    let workingTarget = workingRules.normalized;
    workingTarget = replaceExactlyOnce(
        workingTarget,
        "- `BACKLOG.md` — planned and deferred work.\n",
        "- `BACKLOG.md` — planned and deferred work.\n" +
            "- `AI_ASSISTED_ENGINE_SIMPLIFICATION.md` — temporary active engineering audit/handoff; delete or merge it when the slice closes.\n",
        "working rules document ownership",
    );
    workingTarget = replaceExactlyOnce(
        workingTarget,
        "- Do not genericize similar weapon/turret/Evade lifecycles merely for symmetry.\n\n",
        WORKING_INSERT,
        "dependency communication rules",
    );

    let projectTarget = projectContext.normalized;
    projectTarget = replaceExactlyOnce(
        projectTarget,
        "- `SYSTEM_MAP.md` — current ownership/architecture map.\n",
        "- `SYSTEM_MAP.md` — current ownership/architecture map.\n" + PROJECT_MAP_LINE,
        "project documentation map",
    );

    const targets = new Map([
        ["CURRENT_HANDOFF.md", ensureOneEofNewline(HANDOFF_TARGET)],
        ["docs/WORKING_RULES.md", ensureOneEofNewline(workingTarget)],
        ["docs/PROJECT_CONTEXT.md", ensureOneEofNewline(projectTarget)],
    ]);

    // All source guards and target transforms are complete before the first write.
    for (const [path, target] of targets) {
        const file =
            path === "CURRENT_HANDOFF.md"
                ? handoff
                : path === "docs/WORKING_RULES.md"
                  ? workingRules
                  : projectContext;

        writeAtomically(file, target);
    }

    writeFileSync(resolve(ROOT, NEW_DOC_PATH), ensureOneEofNewline(AUDIT_DOC_TARGET), "utf8");

    const requiredChecks = [
        ["CURRENT_HANDOFF.md", "AI_ASSISTED_ENGINE_SIMPLIFICATION.md"],
        ["docs/WORKING_RULES.md", "### Dependency communication"],
        ["docs/PROJECT_CONTEXT.md", "AI_ASSISTED_ENGINE_SIMPLIFICATION.md"],
        [NEW_DOC_PATH, "### Atom 1 — EnemyCrewTaskRunner reports completions by return value"],
        [NEW_DOC_PATH, "interrupt_random_player_officer_task"],
        [NEW_DOC_PATH, "purge_player_spam_channel"],
        [NEW_DOC_PATH, "Do not queue/defer enemy destruction casually."],
    ];

    for (const [path, needle] of requiredChecks) {
        const text = readFileSync(resolve(ROOT, path), "utf8");

        if (!text.includes(needle)) {
            fail(`Post-write guard failed for ${path}: missing ${needle}`);
        }
    }

    console.log("\n=== DIFF CHECK ===");
    const diffCheck = spawnSync("git", ["-c", "core.safecrlf=false", "diff", "--check"], {
        cwd: ROOT,
        stdio: "inherit",
        shell: false,
    });

    if (diffCheck.status !== 0) {
        fail(`diff --check failed with exit code ${String(diffCheck.status)}`);
    }

    console.log("\n=== DIFF STAT ===");
    spawnSync("git", ["diff", "--stat"], {
        cwd: ROOT,
        stdio: "inherit",
        shell: false,
    });

    console.log("\nAtom 45 applied successfully.");
    console.log("Updated handoff + permanent dependency rules + detailed active AI-assisted engine audit plan.");

    try {
        unlinkSync(SCRIPT_PATH);
    } catch (error) {
        console.warn("Docs patch succeeded, but self-cleanup failed:", error);
    }
}

main();
