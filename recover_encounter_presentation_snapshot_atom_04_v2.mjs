import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const EXPECTED_HEAD =
    'c1d1ef196982b5f7825f9a255c242905ae791587';

const PARTIAL_TRACKED = [
    'src/engine/encounter/EncounterEngine.ts',
    'src/engine/encounter/model/event.ts',
    'tests/engine/encounter/combat_runner.test.ts',
    'tests/engine/encounter/player_missile_presentation_events.test.ts',
].sort();

const NEW_FILES = [
    'src/engine/encounter/model/missile_event_projectile.ts',
    'src/engine/encounter/snapshots/create_encounter_event_snapshot.ts',
];

const APP_TESTS = {
    runtimeSynchronizer: {
        path:
            'tests/app/BridgeEncounterRuntimeSynchronizer.test.ts',
        expectedBlob:
            '6b6fa6f7a8618521700c85edb1ddfaf61364e070',
    },

    playerMissileEvents: {
        path:
            'tests/app/BridgeEncounterPlayerMissileEvents.test.ts',
        expectedBlob:
            '6cd3654814d388355c69e5f2c39b422491a10c25',
    },

    enemyDefenseTurretEvents: {
        path:
            'tests/app/BridgeEncounterEnemyDefenseTurretEvents.test.ts',
        expectedBlob:
            '26f526db2c4124dfb7791faf86389df754ae616f',
    },

    engineEventHandler: {
        path:
            'tests/app/BridgeEncounterEngineEventHandler.test.ts',
        expectedBlob:
            'dad06adb63bf49c06b075f8d0caf6caf159a2ecb',
    },
};

function fail(message) {
    throw new Error(message);
}

function run(
    command,
    args,
    options = {},
) {
    const result =
        spawnSync(
            command,
            args,
            {
                encoding: 'utf8',
                ...options,
            },
        );

    if (result.error) {
        throw result.error;
    }

    return result;
}

function runChecked(
    command,
    args,
    label,
    options = {},
) {
    const result =
        run(
            command,
            args,
            options,
        );

    if (result.status !== 0) {
        fail(
            label +
            ' failed.\n' +
            (result.stdout || '') +
            (result.stderr || ''),
        );
    }

    return result;
}

function git(args) {
    return runChecked(
        'git',
        args,
        'git ' + args.join(' '),
    ).stdout;
}

function toLf(text) {
    return text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n');
}

function detectEol(text) {
    return text.includes('\r\n')
        ? '\r\n'
        : '\n';
}

function readState(filePath) {
    const original =
        fs.readFileSync(
            filePath,
            'utf8',
        );

    return {
        original,
        lf:
            toLf(original),
    };
}

function writePreservingEol(
    filePath,
    original,
    nextLf,
) {
    const normalized =
        (
            toLf(nextLf)
                .replace(/\n+$/g, '') +
            '\n'
        ).replace(
            /\n/g,
            detectEol(original),
        );

    fs.writeFileSync(
        filePath,
        normalized,
        'utf8',
    );
}

function replaceOnce(
    text,
    before,
    after,
    label,
) {
    const first =
        text.indexOf(before);

    if (first < 0) {
        fail(
            'Missing structural anchor: ' +
            label,
        );
    }

    if (
        text.indexOf(
            before,
            first + before.length,
        ) >= 0
    ) {
        fail(
            'Structural anchor is not unique: ' +
            label,
        );
    }

    return (
        text.slice(0, first) +
        after +
        text.slice(
            first + before.length,
        )
    );
}

function replaceAllExpectedCount(
    text,
    before,
    after,
    expectedCount,
    label,
) {
    const count =
        text.split(before).length - 1;

    if (count !== expectedCount) {
        fail(
            'Unexpected occurrence count for ' +
            label +
            '. Expected ' +
            expectedCount +
            ', received ' +
            count,
        );
    }

    return text
        .split(before)
        .join(after);
}

function assertFileSet(
    actual,
    expected,
    label,
) {
    const normalizedExpected =
        [...expected].sort();

    if (
        JSON.stringify(actual) !==
        JSON.stringify(
            normalizedExpected,
        )
    ) {
        fail(
            label +
            '\nExpected:\n  ' +
            normalizedExpected
                .join('\n  ') +
            '\nReceived:\n  ' +
            actual.join('\n  '),
        );
    }
}

function grepFiles(
    pattern,
    paths,
) {
    const result =
        run(
            'git',
            [
                'grep',
                '-F',
                '-l',
                '--',
                pattern,
                '--',
                ...paths,
            ],
        );

    if (result.status === 1) {
        return [];
    }

    if (result.status !== 0) {
        fail(
            'git grep failed for ' +
            pattern +
            '\n' +
            (result.stdout || '') +
            (result.stderr || ''),
        );
    }

    return result.stdout
        .trim()
        .split(/\r?\n/)
        .filter(Boolean)
        .sort();
}

function runNpm(args) {
    if (process.platform === 'win32') {
        const comSpec =
            process.env.ComSpec ||
            'C:\\Windows\\System32\\cmd.exe';

        const command =
            ['npm.cmd', ...args]
                .join(' ');

        const result =
            run(
                comSpec,
                [
                    '/d',
                    '/s',
                    '/c',
                    command,
                ],
                {
                    stdio: 'inherit',
                },
            );

        if (result.status !== 0) {
            fail(
                command +
                ' failed with exit code ' +
                result.status,
            );
        }

        return;
    }

    const result =
        run(
            'npm',
            args,
            {
                stdio: 'inherit',
            },
        );

    if (result.status !== 0) {
        fail(
            'npm ' +
            args.join(' ') +
            ' failed with exit code ' +
            result.status,
        );
    }
}

function removeHiddenMissileImportsAndFields(
    filePath,
    options = {},
) {
    const {
        typedFixture = false,
        fixtureNames = [],
    } = options;

    const state =
        readState(filePath);

    let next =
        state.lf;

    if (
        next.startsWith(
            `import {
    MISSILE_SIGNATURE,
} from '../../src/engine/defs/missile';
`,
        )
    ) {
        next =
            next.replace(
                `import {
    MISSILE_SIGNATURE,
} from '../../src/engine/defs/missile';
`,
                '',
            );
    }

    if (
        next.includes(
            `    MISSILE_SIGNATURE_INTEL_STATUS,
`,
        )
    ) {
        next =
            next.replace(
                `    MISSILE_SIGNATURE_INTEL_STATUS,
`,
                '',
            );
    }

    if (
        next.includes(
            `    type MissileCombatProjectileState,
`,
        )
    ) {
        next =
            next.replace(
                `    type MissileCombatProjectileState,
`,
                '',
            );
    }

    const hiddenBlocks = [
`        signature:
                MISSILE_SIGNATURE.A,

            identification: {
            status:
                MISSILE_SIGNATURE_INTEL_STATUS
                    .CONFIRMED,

            hypothesis: 'signature_a',
        },

`,
`        signature:
                MISSILE_SIGNATURE.A,

            identification: {
            status:
                MISSILE_SIGNATURE_INTEL_STATUS
                    .CONFIRMED,

            hypothesis: 'signature_b',
        },

`,
`    signature:
                MISSILE_SIGNATURE.A,

            identification: {
        status: MISSILE_SIGNATURE_INTEL_STATUS.UNKNOWN,
    },

`,
`                            signature:
                MISSILE_SIGNATURE.A,

            identification: {
                                status:
                                    MISSILE_SIGNATURE_INTEL_STATUS
                                        .UNKNOWN,
                            },

`,
    ];

    for (const block of hiddenBlocks) {
        if (next.includes(block)) {
            next =
                next.replace(
                    block,
                    '',
                );
        }
    }

    if (typedFixture) {
        if (
            !next.includes(
                `from '../../src/engine/encounter/model/missile_event_projectile';`,
            )
        ) {
            next =
                replaceOnce(
                    next,
                    `import {
    ENCOUNTER_EVENT,
} from '../../src/engine/encounter/model/event';
`,
                    `import {
    ENCOUNTER_EVENT,
} from '../../src/engine/encounter/model/event';
import type {
    MissileEventProjectileSnapshot,
} from '../../src/engine/encounter/model/missile_event_projectile';
`,
                    filePath +
                    ' safe event projectile import',
                );
        }

        for (
            const fixtureName of
            fixtureNames
        ) {
            const multiline =
                `${fixtureName}:
    MissileCombatProjectileState`;

            const inline =
                `${fixtureName}: MissileCombatProjectileState`;

            const multilineCount =
                next.split(multiline).length - 1;

            const inlineCount =
                next.split(inline).length - 1;

            if (
                multilineCount +
                inlineCount !==
                1
            ) {
                fail(
                    'Unexpected fixture type shape for ' +
                    filePath +
                    ': ' +
                    fixtureName,
                );
            }

            if (multilineCount === 1) {
                next =
                    next.replace(
                        multiline,
                        `${fixtureName}:
    MissileEventProjectileSnapshot`,
                    );
            } else {
                next =
                    next.replace(
                        inline,
                        `${fixtureName}: MissileEventProjectileSnapshot`,
                    );
            }
        }
    }

    if (
        next.includes(
            'MISSILE_SIGNATURE',
        ) ||
        next.includes(
            'MISSILE_SIGNATURE_INTEL_STATUS',
        ) ||
        next.includes(
            'MissileCombatProjectileState',
        )
    ) {
        fail(
            'Hidden missile fixture residue remains in ' +
            filePath,
        );
    }

    writePreservingEol(
        filePath,
        state.original,
        next,
    );
}

try {
    const head =
        git([
            'rev-parse',
            'HEAD',
        ]).trim();

    if (head !== EXPECTED_HEAD) {
        fail(
            'Unexpected HEAD.\n' +
            'Expected: ' +
            EXPECTED_HEAD +
            '\nReceived: ' +
            head,
        );
    }

    const dirtyTracked =
        git([
            'diff',
            '--name-only',
        ])
            .trim()
            .split(/\r?\n/)
            .filter(Boolean)
            .sort();

    assertFileSet(
        dirtyTracked,
        PARTIAL_TRACKED,
        'Unexpected atom 04 partial tracked state.',
    );

    for (
        const newFile of
        NEW_FILES
    ) {
        if (!fs.existsSync(newFile)) {
            fail(
                'Expected atom 04 new file is missing: ' +
                newFile,
            );
        }
    }

    for (
        const target of
        Object.values(APP_TESTS)
    ) {
        const blob =
            git([
                'hash-object',
                '--',
                target.path,
            ]).trim();

        if (
            blob !==
            target.expectedBlob
        ) {
            fail(
                'Unexpected pristine app test snapshot for ' +
                target.path +
                '\nExpected blob: ' +
                target.expectedBlob +
                '\nReceived blob: ' +
                blob,
            );
        }
    }

    const eventText =
        toLf(
            fs.readFileSync(
                'src/engine/encounter/model/event.ts',
                'utf8',
            ),
        );

    if (
        !eventText.includes(
            'MissileEventProjectileSnapshot',
        ) ||
        eventText.includes(
            'MissileCombatProjectileState',
        )
    ) {
        fail(
            'event.ts is not in the expected atom 04 partial state.',
        );
    }

    const engineText =
        toLf(
            fs.readFileSync(
                'src/engine/encounter/EncounterEngine.ts',
                'utf8',
            ),
        );

    if (
        !engineText.includes(
            'createEncounterEventSnapshot',
        )
    ) {
        fail(
            'EncounterEngine outbox is not in the expected atom 04 partial state.',
        );
    }

    // Runtime synchronizer inline event fixture.
    removeHiddenMissileImportsAndFields(
        APP_TESTS.runtimeSynchronizer.path,
    );

    // Dedicated app event-mapping fixtures should themselves use the public
    // event projectile type, not a richer structural subtype.
    removeHiddenMissileImportsAndFields(
        APP_TESTS.playerMissileEvents.path,
        {
            typedFixture: true,
            fixtureNames: [
                'const projectile',
            ],
        },
    );

    removeHiddenMissileImportsAndFields(
        APP_TESTS.enemyDefenseTurretEvents.path,
        {
            typedFixture: true,
            fixtureNames: [
                'const projectile',
            ],
        },
    );

    removeHiddenMissileImportsAndFields(
        APP_TESTS.engineEventHandler.path,
        {
            typedFixture: true,
            fixtureNames: [
                'const launchedProjectile',
                'const impactedProjectile',
            ],
        },
    );

    const finalDirtyTracked =
        git([
            'diff',
            '--name-only',
        ])
            .trim()
            .split(/\r?\n/)
            .filter(Boolean)
            .sort();

    assertFileSet(
        finalDirtyTracked,
        [
            ...PARTIAL_TRACKED,
            ...Object.values(
                APP_TESTS,
            ).map(
                (target) =>
                    target.path,
            ),
        ],
        'Unexpected atom 04 recovery changed-file set.',
    );

    const forbiddenAppImports = [
        ...grepFiles(
            'MissileCombatProjectileState',
            [
                'tests/app',
            ],
        ),

        ...grepFiles(
            'MISSILE_SIGNATURE',
            [
                'tests/app',
            ],
        ),
    ];

    if (
        forbiddenAppImports.length > 0
    ) {
        fail(
            'App tests still model hidden missile truth:\n  ' +
            [...new Set(
                forbiddenAppImports,
            )]
                .sort()
                .join('\n  '),
        );
    }

    for (
        const forbidden of [
            '.projectile.signature',
            '.projectile.identification',
        ]
    ) {
        const callers =
            grepFiles(
                forbidden,
                [
                    'src/app',
                    'tests/app',
                ],
            );

        if (callers.length > 0) {
            fail(
                'App boundary still reads hidden missile event field ' +
                forbidden +
                ':\n  ' +
                callers.join('\n  '),
            );
        }
    }

    runChecked(
        'git',
        [
            '-c',
            'core.safecrlf=false',
            'diff',
            '--check',
        ],
        'git diff --check',
        {
            stdio: 'inherit',
        },
    );

    runNpm([
        'run',
        'typecheck',
    ]);

    runNpm([
        'test',
    ]);

    console.log(
        '\nEncounter presentation snapshot atom 04 recovery v2 passed.',
    );

    try {
        fs.unlinkSync(
            new URL(import.meta.url),
        );
    } catch (error) {
        console.warn(
            'Recovery passed, but patcher could not self-delete:',
            error,
        );
    }
} catch (error) {
    console.error(error);
    process.exitCode = 1;
}
