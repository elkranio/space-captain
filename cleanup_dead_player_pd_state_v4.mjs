import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const EXPECTED_HEAD =
    '578515f9195de079fbbe886e165e01c2a8f272d5';

const SELF_PATH = path.resolve(process.argv[1]);
const FAILED_V1_PATH = path.join(
    path.dirname(SELF_PATH),
    'cleanup_dead_player_pd_state.mjs',
);
const FAILED_V2_PATH = path.join(
    path.dirname(SELF_PATH),
    'cleanup_dead_player_pd_state_v2.mjs',
);
const FAILED_V3_PATH = path.join(
    path.dirname(SELF_PATH),
    'cleanup_dead_player_pd_state_v3.mjs',
);

function fail(message) {
    throw new Error(message);
}

function runGit(args, options = {}) {
    return execFileSync(
        'git',
        args,
        {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
            ...options,
        },
    ).trimEnd();
}

function normalizeEol(text) {
    return text.replace(/\r\n/g, '\n');
}

function detectEol(text) {
    return text.includes('\r\n')
        ? '\r\n'
        : '\n';
}

function restoreEol(text, eol) {
    return eol === '\r\n'
        ? text.replace(/\n/g, '\r\n')
        : text;
}

function countOccurrences(text, needle) {
    let count = 0;
    let cursor = 0;

    while (true) {
        const index = text.indexOf(
            needle,
            cursor,
        );

        if (index < 0) {
            return count;
        }

        count += 1;
        cursor = index + needle.length;
    }
}

function replaceExact(
    text,
    before,
    after,
    expectedCount,
    label,
) {
    const count =
        countOccurrences(
            text,
            before,
        );

    if (count !== expectedCount) {
        fail(
            `${label}: expected ${expectedCount} exact match(es), found ${count}`,
        );
    }

    return text.split(before).join(after);
}

function replaceRegex(
    text,
    pattern,
    replacement,
    expectedCount,
    label,
) {
    const flags =
        pattern.flags.includes('g')
            ? pattern.flags
            : pattern.flags + 'g';

    const globalPattern =
        new RegExp(
            pattern.source,
            flags,
        );

    const matches = [
        ...text.matchAll(
            globalPattern,
        ),
    ];

    if (matches.length !== expectedCount) {
        fail(
            `${label}: expected ${expectedCount} match(es), found ${matches.length}`,
        );
    }

    return text.replace(
        globalPattern,
        replacement,
    );
}

const repoRoot =
    runGit([
        'rev-parse',
        '--show-toplevel',
    ]);

process.chdir(repoRoot);

const head =
    runGit([
        'rev-parse',
        'HEAD',
    ]);

if (head !== EXPECTED_HEAD) {
    fail(
        'Unexpected HEAD.\n' +
        `Expected: ${EXPECTED_HEAD}\n` +
        `Actual:   ${head}`,
    );
}

const trackedStatus =
    runGit([
        'status',
        '--porcelain=v1',
        '--untracked-files=no',
    ]);

if (trackedStatus.length > 0) {
    fail(
        'Tracked working tree is not clean. Commit/stash tracked changes first:\n' +
        trackedStatus,
    );
}

const require =
    createRequire(
        import.meta.url,
    );

let ts;

try {
    ts = require(
        path.join(
            repoRoot,
            'node_modules',
            'typescript',
        ),
    );
} catch (error) {
    fail(
        'Cannot load local TypeScript parser from node_modules. ' +
        'Run npm install first.\n' +
        String(error),
    );
}

const trackedFiles =
    runGit([
        'ls-files',
        '-z',
    ])
        .split('\0')
        .filter(Boolean);

const fileState =
    new Map();

for (const relativePath of trackedFiles) {
    const absolutePath =
        path.join(
            repoRoot,
            relativePath,
        );

    const raw =
        fs.readFileSync(
            absolutePath,
            'utf8',
        );

    fileState.set(
        relativePath,
        {
            raw,
            eol:
                detectEol(
                    raw,
                ),
            text:
                normalizeEol(
                    raw,
                ),
            deleted: false,
        },
    );
}

function requireFile(relativePath) {
    const state =
        fileState.get(
            relativePath,
        );

    if (!state) {
        fail(
            `Expected tracked file is missing: ${relativePath}`,
        );
    }

    return state;
}

function editFile(
    relativePath,
    transform,
) {
    const state =
        requireFile(
            relativePath,
        );

    if (state.deleted) {
        fail(
            `Cannot edit deleted file: ${relativePath}`,
        );
    }

    const next =
        transform(
            state.text,
        );

    if (next === state.text) {
        fail(
            `Expected ${relativePath} to change, but transform was a no-op`,
        );
    }

    state.text = next;
}

function deleteFile(relativePath) {
    const state =
        requireFile(
            relativePath,
        );

    state.deleted = true;
}

function applyTextEdits(
    text,
    edits,
    label,
) {
    if (edits.length === 0) {
        return text;
    }

    const sorted =
        [...edits]
            .sort(
                (left, right) =>
                    right.start -
                    left.start,
            );

    let lastStart =
        text.length + 1;

    for (const edit of sorted) {
        if (
            edit.start < 0 ||
            edit.end < edit.start ||
            edit.end > text.length
        ) {
            fail(
                `${label}: invalid edit range ${edit.start}-${edit.end}`,
            );
        }

        if (edit.end > lastStart) {
            fail(
                `${label}: overlapping text edits detected`,
            );
        }

        text =
            text.slice(
                0,
                edit.start,
            ) +
            edit.replacement +
            text.slice(
                edit.end,
            );

        lastStart =
            edit.start;
    }

    return text;
}

function getListItemRemovalRange(
    text,
    node,
) {
    let start =
        node.getFullStart();
    let end =
        node.getEnd();

    let cursor =
        end;

    while (
        text[cursor] === ' ' ||
        text[cursor] === '\t'
    ) {
        cursor += 1;
    }

    if (text[cursor] === ',') {
        cursor += 1;

        while (
            text[cursor] === ' ' ||
            text[cursor] === '\t'
        ) {
            cursor += 1;
        }

        if (text[cursor] === '\n') {
            cursor += 1;
        }

        return {
            start,
            end: cursor,
        };
    }

    cursor =
        start - 1;

    while (
        cursor >= 0 &&
        (
            text[cursor] === ' ' ||
            text[cursor] === '\t' ||
            text[cursor] === '\n'
        )
    ) {
        cursor -= 1;
    }

    if (
        cursor >= 0 &&
        text[cursor] === ','
    ) {
        start = cursor;

        return {
            start,
            end,
        };
    }

    return {
        start,
        end,
    };
}

function getStatementRemovalRange(
    text,
    node,
) {
    let start =
        node.getFullStart();
    let end =
        node.getEnd();

    while (
        text[end] === ' ' ||
        text[end] === '\t'
    ) {
        end += 1;
    }

    if (text[end] === '\n') {
        end += 1;
    }

    return {
        start,
        end,
    };
}

function getPropertyNameText(name) {
    if (
        ts.isIdentifier(name) ||
        ts.isStringLiteral(name)
    ) {
        return name.text;
    }

    return undefined;
}

function isIdentifierNamed(
    node,
    name,
) {
    return (
        ts.isIdentifier(node) &&
        node.text === name
    );
}

function isCreatePointDefenseFixtureCall(node) {
    return (
        ts.isCallExpression(node) &&
        isIdentifierNamed(
            node.expression,
            'createPointDefenseFixture',
        )
    );
}

function isTargetEncounterCall(node) {
    if (ts.isNewExpression(node)) {
        return isIdentifierNamed(
            node.expression,
            'EncounterEngine',
        );
    }

    if (!ts.isCallExpression(node)) {
        return false;
    }

    if (
        isIdentifierNamed(
            node.expression,
            'createEncounterState',
        )
    ) {
        return true;
    }

    if (
        ts.isPropertyAccessExpression(
            node.expression,
        ) &&
        isIdentifierNamed(
            node.expression.expression,
            'EncounterStateStore',
        ) &&
        node.expression.name.text ===
            'fromSpaceNode'
    ) {
        return true;
    }

    return false;
}

function collectDeadPlayerPointDefenseEdits(
    relativePath,
    text,
) {
    const sourceFile =
        ts.createSourceFile(
            relativePath,
            text,
            ts.ScriptTarget.Latest,
            true,
            ts.ScriptKind.TS,
        );

    const edits = [];

    function addListItem(node) {
        const range =
            getListItemRemovalRange(
                text,
                node,
            );

        edits.push({
            ...range,
            replacement: '',
        });
    }

    function addStatement(node) {
        const range =
            getStatementRemovalRange(
                text,
                node,
            );

        edits.push({
            ...range,
            replacement: '',
        });
    }

    function visit(node) {
        if (
            isTargetEncounterCall(node)
        ) {
            const args =
                node.arguments ?? [];

            const firstArgument =
                args[0];

            if (
                firstArgument &&
                ts.isObjectLiteralExpression(
                    firstArgument,
                )
            ) {
                for (
                    const property of
                    firstArgument.properties
                ) {
                    if (
                        getPropertyNameText(
                            property.name,
                        ) ===
                        'pointDefense'
                    ) {
                        addListItem(
                            property,
                        );
                    }
                }
            }
        }

        if (
            ts.isPropertyAssignment(node) &&
            getPropertyNameText(
                node.name,
            ) ===
                'pointDefense' &&
            isCreatePointDefenseFixtureCall(
                node.initializer,
            )
        ) {
            addListItem(
                node,
            );
        }

        if (
            relativePath.startsWith(
                'tests/',
            ) &&
            ts.isPropertyAssignment(node) &&
            getPropertyNameText(
                node.name,
            ) ===
                'pointDefense' &&
            ts.isObjectLiteralExpression(
                node.initializer,
            )
        ) {
            const initializerText =
                node.initializer.getText(
                    sourceFile,
                );

            if (
                initializerText.includes(
                    "'point_defense_player_00'",
                ) ||
                initializerText.includes(
                    '"point_defense_player_00"',
                ) ||
                /\bPOINT_DEFENSE_ID\b/.test(
                    initializerText,
                )
            ) {
                addListItem(
                    node,
                );
            }
        }

        if (
            ts.isPropertySignature(node) &&
            getPropertyNameText(
                node.name,
            ) ===
                'pointDefense' &&
            node.type &&
            node.type.getText(
                sourceFile,
            ) ===
                'PointDefenseState'
        ) {
            addListItem(
                node,
            );
        }

        if (
            ts.isBindingElement(node) &&
            ts.isIdentifier(
                node.name,
            ) &&
            node.name.text ===
                'pointDefense' &&
            node.initializer &&
            isCreatePointDefenseFixtureCall(
                node.initializer,
            )
        ) {
            addListItem(
                node,
            );
        }

        if (
            ts.isVariableStatement(
                node,
            ) &&
            node.declarationList
                .declarations
                .length === 1
        ) {
            const [declaration] =
                node.declarationList
                    .declarations;

            if (
                ts.isIdentifier(
                    declaration.name,
                ) &&
                declaration.name.text ===
                    'pointDefense' &&
                declaration.initializer &&
                isCreatePointDefenseFixtureCall(
                    declaration.initializer,
                )
            ) {
                addStatement(
                    node,
                );
            }
        }

        if (
            relativePath.startsWith(
                'tests/',
            ) &&
            ts.isExpressionStatement(
                node,
            )
        ) {
            const statementText =
                node.getText(
                    sourceFile,
                );

            if (
                statementText.startsWith(
                    'expect(',
                ) &&
                (
                    /\.combat\s*\.\s*pointDefense\b/s.test(
                        statementText,
                    ) ||
                    /\.ship\s*\.\s*pointDefense\b/s.test(
                        statementText,
                    )
                )
            ) {
                addStatement(
                    node,
                );
            }
        }

        ts.forEachChild(
            node,
            visit,
        );
    }

    visit(
        sourceFile,
    );

    const unique =
        new Map();

    for (const edit of edits) {
        unique.set(
            `${edit.start}:${edit.end}`,
            edit,
        );
    }

    return [
        ...unique.values(),
    ];
}

function cleanupUnusedWhitelistedImports(
    relativePath,
    text,
) {
    const sourceFile =
        ts.createSourceFile(
            relativePath,
            text,
            ts.ScriptTarget.Latest,
            true,
            ts.ScriptKind.TS,
        );

    const whitelist =
        new Set([
            'createPointDefenseFixture',
            'PointDefenseState',
            'POINT_DEFENSE_ID',
        ]);

    const edits = [];

    for (
        const statement of
        sourceFile.statements
    ) {
        if (
            !ts.isImportDeclaration(
                statement,
            ) ||
            !statement.importClause ||
            !statement.importClause
                .namedBindings ||
            !ts.isNamedImports(
                statement.importClause
                    .namedBindings,
            )
        ) {
            continue;
        }

        const namedImports =
            statement.importClause
                .namedBindings;

        const removable = [];

        for (
            const element of
            namedImports.elements
        ) {
            const localName =
                element.name.text;

            if (
                !whitelist.has(
                    localName,
                )
            ) {
                continue;
            }

            const beforeImport =
                text.slice(
                    0,
                    statement.getFullStart(),
                );

            const afterImport =
                text.slice(
                    statement.getEnd(),
                );

            const outsideImport =
                beforeImport +
                afterImport;

            const identifierPattern =
                new RegExp(
                    `\\b${localName}\\b`,
                );

            if (
                !identifierPattern.test(
                    outsideImport,
                )
            ) {
                removable.push(
                    element,
                );
            }
        }

        if (
            removable.length === 0
        ) {
            continue;
        }

        if (
            removable.length ===
                namedImports.elements
                    .length &&
            !statement.importClause.name
        ) {
            const range =
                getStatementRemovalRange(
                    text,
                    statement,
                );

            edits.push({
                ...range,
                replacement: '',
            });

            continue;
        }

        for (
            const element of
            removable
        ) {
            const range =
                getListItemRemovalRange(
                    text,
                    element,
                );

            edits.push({
                ...range,
                replacement: '',
            });
        }
    }

    return applyTextEdits(
        text,
        edits,
        `${relativePath} import cleanup`,
    );
}

// ---------------------------------------------------------------------------
// Production dead-state cleanup
// ---------------------------------------------------------------------------

editFile(
    'src/engine/defs/point_defense.ts',
    (text) => {
        text =
            replaceRegex(
                text,
                /\/\/ Installed point-defense identity\.\n\/\/\n\/\/ Point defense no longer owns an energy\/ammo pool\.\n\/\/ Defensive energy lives exclusively in DEFENSE CAPACITOR\.\nexport type PointDefenseState = \{\n(?:.|\n)*?\n\};\n\n/,
                '',
                1,
                'remove dead PointDefenseState base type',
            );

        text =
            replaceExact(
                text,
                `export type ShipPointDefenseState =\n    PointDefenseState & {\n    phase: PointDefensePhase;\n`,
                `export type ShipPointDefenseState = {\n    // Runtime id конкретной установки.\n    id: string;\n\n    // Stable immutable content definition.\n    pointDefenseId:\n        PointDefenseId;\n\n    phase: PointDefensePhase;\n`,
                1,
                'flatten ShipPointDefenseState identity',
            );

        text =
            replaceExact(
                text,
                `    targetProjectileId: string | null;\n};\n`,
                `    targetProjectileId: string | null;\n};\n`,
                1,
                'validate flattened ShipPointDefenseState tail',
            );

        return text;
    },
);

editFile(
    'src/engine/defs/player.ts',
    (text) => {
        text =
            replaceRegex(
                text,
                /import type \{ PointDefenseState \} from '\.\/point_defense';\n/,
                '',
                1,
                'remove PlayerShipState PointDefenseState import',
            );

        text =
            replaceRegex(
                text,
                /\n        pointDefense:\n            PointDefenseState;\n/,
                '',
                1,
                'remove PlayerShipState.pointDefense',
            );

        return text;
    },
);

editFile(
    'src/engine/content/presets/player_ships.ts',
    (text) => {
        text =
            replaceRegex(
                text,
                /import \{\n    POINT_DEFENSE_ID,\n    type PointDefenseId,\n\} from '\.\.\/\.\.\/defs\/point_defense';\n/,
                '',
                1,
                'remove player preset PD import',
            );

        text =
            replaceRegex(
                text,
                /\n    pointDefense: \{\n        id: string;\n\n        pointDefenseId:\n            PointDefenseId;\n    \};\n/,
                '',
                1,
                'remove PlayerShipPreset.pointDefense',
            );

        text =
            replaceRegex(
                text,
                /\n        pointDefense: \{\n            id:\n                'point_defense_player_00',\n\n            pointDefenseId:\n                POINT_DEFENSE_ID\n                    \.BASIC_00,\n        \},\n/,
                '',
                1,
                'remove starter installed player PD',
            );

        return text;
    },
);

editFile(
    'src/engine/content/new_game/create_new_game_player.ts',
    (text) => {
        return replaceRegex(
            text,
            /\n        pointDefense: \{\n            id:\n                preset\n                    \.pointDefense\n                    \.id,\n\n            pointDefenseId:\n                preset\n                    \.pointDefense\n                    \.pointDefenseId,\n        \},\n/,
            '',
            1,
            'remove new-game player PD construction',
        );
    },
);

editFile(
    'src/engine/encounter/EncounterEngine.ts',
    (text) => {
        text =
            replaceRegex(
                text,
                /import type \{ PointDefenseState \} from '\.\.\/defs\/point_defense';\n/,
                '',
                1,
                'remove EncounterEngine PointDefenseState import',
            );

        text =
            replaceRegex(
                text,
                /\n    pointDefense: PointDefenseState;\n/,
                '',
                1,
                'remove EncounterEngineOptions.pointDefense',
            );

        text =
            replaceRegex(
                text,
                /\n        pointDefense,\n        defenseCapacitor,\n/,
                '\n        defenseCapacitor,\n',
                1,
                'remove EncounterEngine constructor pointDefense binding',
            );

        text =
            replaceRegex(
                text,
                /\n                pointDefense,\n                defenseCapacitor,\n/,
                '\n                defenseCapacitor,\n',
                1,
                'remove EncounterEngine state-store pointDefense plumbing',
            );

        return text;
    },
);

editFile(
    'src/engine/encounter/state/create_encounter_state.ts',
    (text) => {
        text =
            replaceRegex(
                text,
                /import type \{ PointDefenseState \} from '\.\.\/\.\.\/defs\/point_defense';\n/,
                '',
                1,
                'remove createEncounterState PointDefenseState import',
            );

        text =
            replaceRegex(
                text,
                /\n    pointDefense: PointDefenseState;\n/,
                '',
                1,
                'remove CreateEncounterStateInput.pointDefense',
            );

        text =
            replaceRegex(
                text,
                /\n    pointDefense,\n    defenseCapacitor,\n/,
                '\n    defenseCapacitor,\n',
                1,
                'remove createEncounterState pointDefense binding',
            );

        text =
            replaceRegex(
                text,
                /\n            pointDefense: \{\n                \.\.\.pointDefense,\n            \},\n/,
                '',
                1,
                'remove EncounterCombatState player PD snapshot',
            );

        return text;
    },
);

editFile(
    'src/engine/encounter/model/combat.ts',
    (text) => {
        text =
            replaceRegex(
                text,
                /import type \{ PointDefenseState \} from '\.\.\/\.\.\/defs\/point_defense';\n/,
                '',
                1,
                'remove dead player PointDefenseState import from combat model',
            );

        text =
            replaceRegex(
                text,
                /\n    pointDefense: PointDefenseState;\n/,
                '',
                1,
                'remove EncounterCombatState.pointDefense',
            );

        return text;
    },
);

editFile(
    'src/app/scenes/game/bridge/controller/encounter/BridgeEncounterController.ts',
    (text) => {
        return replaceRegex(
            text,
            /\n            pointDefense: run\.player\.ship\.pointDefense,\n/,
            '',
            1,
            'remove bridge player PD encounter plumbing',
        );
    },
);

editFile(
    'src/engine/encounter/combat/defense/spend_defense_capacitor_charge.ts',
    (text) => {
        return replaceExact(
            text,
            `// One mutation rule for every defensive consumer.\n//\n// Spending a charge restarts the sequential recharge\n// of the next charge. This is intentionally shared by\n// player and enemy PD now, and by the rebuilt shield later.\n`,
            `// One mutation rule for every defensive consumer.\n//\n// Spending a charge restarts the sequential recharge\n// of the next charge. Defensive consumers share this\n// resource instead of owning separate energy pools.\n`,
            1,
            'neutralize speculative shield comment in capacitor spend rule',
        );
    },
);

editFile(
    'src/engine/defs/defense_capacitor.ts',
    (text) => {
        return replaceExact(
            text,
            `// Один charge позже смогут конкурирующе тратить:\n// - point defense;\n// - shield.\n//\n`,
            `// Shared defensive resource.\n// Все defensive consumers тратят charges из одного pool.\n//\n`,
            1,
            'neutralize speculative shield consumer list',
        );
    },
);

editFile(
    'GAMEPLAY_CONTRACTS.md',
    (text) => {
        text =
            replaceExact(
                text,
                `Point defense spends shared DEF.\n\nFuture Engineer shield behavior, if implemented, should spend the same resource\ninstead of creating a second shield-generator pool.\n`,
                `Point defense spends shared DEF.\n\nAny future defensive consumer should spend the same resource instead of creating\nits own parallel energy pool.\n`,
                1,
                'neutralize future shield contract',
            );

        text =
            replaceExact(
                text,
                `- band logic remains relevant to missile spectral behavior;\n- stale event naming may still say “point defense charge”.\n\nDo not infer a separate player PD resource from that name.\n`,
                `- band logic remains relevant to missile spectral behavior.\n`,
                1,
                'remove obsolete stale-event naming note',
            );

        return text;
    },
);

editFile(
    'SYSTEM_MAP.md',
    (text) => {
        return replaceExact(
            text,
            `player       → hull/drive/DEF/PD/weapons/player knowledge\n`,
            `player       → hull/drive/DEF/weapons/player knowledge\n`,
            1,
            'remove dead player PD state from system map ownership',
        );
    },
);

// ---------------------------------------------------------------------------
// Test/call-site cleanup discovered from the current tracked tree.
// ---------------------------------------------------------------------------

for (const relativePath of trackedFiles) {
    if (
        !relativePath.endsWith(
            '.ts',
        )
    ) {
        continue;
    }

    const state =
        fileState.get(
            relativePath,
        );

    if (
        !state ||
        state.deleted
    ) {
        continue;
    }

    const edits =
        collectDeadPlayerPointDefenseEdits(
            relativePath,
            state.text,
        );

    if (edits.length > 0) {
        state.text =
            applyTextEdits(
                state.text,
                edits,
                `${relativePath} dead player PD cleanup`,
            );
    }
}

// Remove now-unused dead imports after all TS call-site edits.
for (const relativePath of trackedFiles) {
    if (
        !relativePath.endsWith(
            '.ts',
        )
    ) {
        continue;
    }

    const state =
        fileState.get(
            relativePath,
        );

    if (
        !state ||
        state.deleted
    ) {
        continue;
    }

    state.text =
        cleanupUnusedWhitelistedImports(
            relativePath,
            state.text,
        );
}

deleteFile(
    'tests/fixtures/engine/point_defense_fixtures.ts',
);

// ---------------------------------------------------------------------------
// Pre-write validation: no dead installed-player-PD contract may survive.
// Enemy PD and player anti-missile behavior must remain.
// ---------------------------------------------------------------------------

function getFinalTrackedText() {
    let combined = '';

    for (const [
        relativePath,
        state,
    ] of fileState) {
        if (state.deleted) {
            continue;
        }

        combined +=
            `\n/* FILE: ${relativePath} */\n` +
            state.text;
    }

    return combined;
}

const finalText =
    getFinalTrackedText();

const forbidden = [
    {
        pattern:
            /\bPointDefenseState\b/,
        label:
            'dead PointDefenseState base type/reference',
    },
    {
        pattern:
            /\bcreatePointDefenseFixture\b/,
        label:
            'dead player point-defense fixture reference',
    },
    {
        pattern:
            /point_defense_player_(?:00|test_00)/,
        label:
            'dead installed player point-defense runtime id',
    },
    {
        pattern:
            /point_defense_fixtures/,
        label:
            'dead player point-defense fixture import/path',
    },
    {
        pattern:
            /\.combat\s*\.\s*pointDefense\b/s,
        label:
            'dead EncounterCombatState.pointDefense access',
    },
    {
        pattern:
            /\.ship\s*\.\s*pointDefense\b/s,
        label:
            'dead PlayerShipState.pointDefense access',
    },
    {
        pattern:
            /rebuilt shield later/,
        label:
            'speculative rebuilt-shield comment',
    },
    {
        pattern:
            /stale event naming may still say/,
        label:
            'obsolete stale PD event naming note',
    },
];

for (const rule of forbidden) {
    if (
        rule.pattern.test(
            finalText,
        )
    ) {
        const offenders = [];

        for (const [
            relativePath,
            state,
        ] of fileState) {
            if (
                state.deleted ||
                !rule.pattern.test(
                    state.text,
                )
            ) {
                continue;
            }

            offenders.push(
                relativePath,
            );
        }

        fail(
            `Cleanup incomplete: ${rule.label} remains in: ` +
            offenders.join(', '),
        );
    }
}

const requiredSurvivors = [
    {
        path:
            'src/engine/defs/point_defense.ts',
        needle:
            'export type ShipPointDefenseState = {',
        label:
            'enemy ship point-defense runtime state',
    },
    {
        path:
            'src/engine/generation/ship_system/ShipPointDefenseFactory.ts',
        needle:
            'ShipPointDefenseState',
        label:
            'enemy/generic ship PD factory',
    },
    {
        path:
            'src/engine/generation/ship/ShipFactory.ts',
        needle:
            'pointDefense?: ShipPointDefenseState;',
        label:
            'generic/enemy ship PD installation',
    },
    {
        path:
            'src/engine/encounter/commands/handlers/weapons_point_defense_command_handler.ts',
        needle:
            'PLAYER_DEFENSE_CAPACITOR_CHARGE_SPENT',
        label:
            'player anti-missile command using shared DEF',
    },
    {
        path:
            'src/engine/encounter/state/player/PlayerShipStore.ts',
        needle:
            'public firePointDefense(',
        label:
            'player anti-missile resolution behavior',
    },
];

for (const survivor of requiredSurvivors) {
    const state =
        requireFile(
            survivor.path,
        );

    if (
        state.deleted ||
        !state.text.includes(
            survivor.needle,
        )
    ) {
        fail(
            `Required survivor missing: ${survivor.label} (${survivor.path})`,
        );
    }
}

const changedPaths = [];
const deletedPaths = [];

for (const [
    relativePath,
    state,
] of fileState) {
    if (state.deleted) {
        deletedPaths.push(
            relativePath,
        );
        continue;
    }

    const normalizedOriginal =
        normalizeEol(
            state.raw,
        );

    if (
        state.text !==
        normalizedOriginal
    ) {
        changedPaths.push(
            relativePath,
        );
    }
}

if (
    changedPaths.length === 0 &&
    deletedPaths.length === 0
) {
    fail(
        'Patch produced no changes',
    );
}

// All transforms and semantic inventories validated above.
// Only now touch the working tree.
for (const relativePath of changedPaths) {
    const state =
        requireFile(
            relativePath,
        );

    fs.writeFileSync(
        path.join(
            repoRoot,
            relativePath,
        ),
        restoreEol(
            state.text,
            state.eol,
        ),
        'utf8',
    );
}

for (const relativePath of deletedPaths) {
    fs.unlinkSync(
        path.join(
            repoRoot,
            relativePath,
        ),
    );
}

try {
    execFileSync(
        'git',
        [
            'diff',
            '--check',
        ],
        {
            cwd:
                repoRoot,
            stdio:
                'inherit',
        },
    );
} catch {
    fail(
        'git diff --check failed',
    );
}

console.log(
    'Dead installed-player-PD cleanup applied.',
);
console.log(
    `Changed ${changedPaths.length} file(s), deleted ${deletedPaths.length} legacy fixture file(s).`,
);
console.log(
    'Enemy PD and player anti-missile beam behavior were intentionally preserved.',
);

for (const patcherPath of [
    SELF_PATH,
    FAILED_V1_PATH,
    FAILED_V2_PATH,
    FAILED_V3_PATH,
]) {
    if (!fs.existsSync(patcherPath)) {
        continue;
    }

    try {
        fs.unlinkSync(
            patcherPath,
        );
    } catch (error) {
        console.warn(
            'Patch succeeded, but could not delete patcher:',
            patcherPath,
            String(error),
        );
    }
}
