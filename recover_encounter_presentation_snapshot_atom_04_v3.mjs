import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const EXPECTED_HEAD =
    'c1d1ef196982b5f7825f9a255c242905ae791587';

const EXPECTED_DIRTY_TRACKED = [
    'src/engine/encounter/EncounterEngine.ts',
    'src/engine/encounter/model/event.ts',
    'tests/app/BridgeEncounterEnemyDefenseTurretEvents.test.ts',
    'tests/app/BridgeEncounterPlayerMissileEvents.test.ts',
    'tests/app/BridgeEncounterRuntimeSynchronizer.test.ts',
    'tests/engine/encounter/combat_runner.test.ts',
    'tests/engine/encounter/player_missile_presentation_events.test.ts',
].sort();

const NEW_FILES = [
    'src/engine/encounter/model/missile_event_projectile.ts',
    'src/engine/encounter/snapshots/create_encounter_event_snapshot.ts',
];

const TARGET = {
    path:
        'tests/app/BridgeEncounterEngineEventHandler.test.ts',

    expectedBlob:
        'dad06adb63bf49c06b075f8d0caf6caf159a2ecb',
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
        EXPECTED_DIRTY_TRACKED,
        'Unexpected atom 04 recovery-v2 partial state.',
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

    const targetBlob =
        git([
            'hash-object',
            '--',
            TARGET.path,
        ]).trim();

    if (
        targetBlob !==
        TARGET.expectedBlob
    ) {
        fail(
            'Unexpected pristine target snapshot for ' +
            TARGET.path +
            '\nExpected blob: ' +
            TARGET.expectedBlob +
            '\nReceived blob: ' +
            targetBlob,
        );
    }

    // Prove the first three app fixtures were already migrated by v2.
    for (
        const forbidden of [
            'MissileCombatProjectileState',
            'MISSILE_SIGNATURE',
            'MISSILE_SIGNATURE_INTEL_STATUS',
        ]
    ) {
        const files =
            grepFiles(
                forbidden,
                [
                    'tests/app/BridgeEncounterRuntimeSynchronizer.test.ts',
                    'tests/app/BridgeEncounterPlayerMissileEvents.test.ts',
                    'tests/app/BridgeEncounterEnemyDefenseTurretEvents.test.ts',
                ],
            );

        if (files.length > 0) {
            fail(
                'Previous recovery did not fully migrate app fixtures for ' +
                forbidden +
                ':\n  ' +
                files.join('\n  '),
            );
        }
    }

    {
        const state =
            readState(
                TARGET.path,
            );

        let next =
            state.lf;

        next =
            replaceOnce(
                next,
                `import {
    MISSILE_SIGNATURE,
} from '../../src/engine/defs/missile';
`,
                ``,
                'engine handler test hidden signature import',
            );

        next =
            replaceOnce(
                next,
                `    MISSILE_SIGNATURE_INTEL_STATUS,
    type MissileCombatProjectileState,
`,
                ``,
                'engine handler test hidden combat imports',
            );

        // Anchor on the complete event import block, which also contains
        // OFFICER_TASK_* and PLAYER_SHIELD_* symbols.
        next =
            replaceOnce(
                next,
                `} from '../../src/engine/encounter/model/event';
`,
                `} from '../../src/engine/encounter/model/event';
import type {
    MissileEventProjectileSnapshot,
} from '../../src/engine/encounter/model/missile_event_projectile';
`,
                'engine handler test safe projectile import',
            );

        next =
            replaceOnce(
                next,
                `const launchedProjectile: MissileCombatProjectileState = {
`,
                `const launchedProjectile: MissileEventProjectileSnapshot = {
`,
                'launched projectile safe type',
            );

        next =
            replaceOnce(
                next,
                `const impactedProjectile: MissileCombatProjectileState = {
`,
                `const impactedProjectile: MissileEventProjectileSnapshot = {
`,
                'impacted projectile safe type',
            );

        next =
            replaceOnce(
                next,
                `    signature:
                MISSILE_SIGNATURE.A,

            identification: {
        status: MISSILE_SIGNATURE_INTEL_STATUS.UNKNOWN,
    },

`,
                ``,
                'engine handler test hidden projectile fields',
            );

        if (
            next.includes(
                'MissileCombatProjectileState',
            ) ||
            next.includes(
                'MISSILE_SIGNATURE',
            ) ||
            next.includes(
                'MISSILE_SIGNATURE_INTEL_STATUS',
            )
        ) {
            fail(
                'Hidden missile fixture residue remains in ' +
                TARGET.path,
            );
        }

        writePreservingEol(
            TARGET.path,
            state.original,
            next,
        );
    }

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
            ...EXPECTED_DIRTY_TRACKED,
            TARGET.path,
        ],
        'Unexpected atom 04 recovery-v3 changed-file set.',
    );

    for (
        const forbidden of [
            'MissileCombatProjectileState',
            'MISSILE_SIGNATURE',
            'MISSILE_SIGNATURE_INTEL_STATUS',
        ]
    ) {
        const appTestFiles =
            grepFiles(
                forbidden,
                [
                    'tests/app',
                ],
            );

        if (appTestFiles.length > 0) {
            fail(
                'App tests still model hidden missile truth for ' +
                forbidden +
                ':\n  ' +
                appTestFiles.join('\n  '),
            );
        }
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
        '\nEncounter presentation snapshot atom 04 recovery v3 passed.',
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
