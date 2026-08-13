import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const EXPECTED_HEAD =
    'c1d1ef196982b5f7825f9a255c242905ae791587';

const NEW_EVENT_PROJECTILE_FILE =
    'src/engine/encounter/model/missile_event_projectile.ts';

const NEW_EVENT_SNAPSHOT_FILE =
    'src/engine/encounter/snapshots/create_encounter_event_snapshot.ts';

const FILES = {
    event: {
        path:
            'src/engine/encounter/model/event.ts',

        expectedBlob:
            '7184b815ff2a444b0a679d07fc20d48ccb0274b8',
    },

    engine: {
        path:
            'src/engine/encounter/EncounterEngine.ts',

        expectedBlob:
            'caac78c6cff3ddfe82459fb9a80bd728bb877820',
    },

    combatRunnerTest: {
        path:
            'tests/engine/encounter/combat_runner.test.ts',

        expectedBlob:
            'e6f70c441e6e5abe578acef467d4595707e28ef7',
    },

    missilePresentationTest: {
        path:
            'tests/engine/encounter/player_missile_presentation_events.test.ts',

        expectedBlob:
            '70a4f23606c57a7029b68c12b7858840103ceab8',
    },
};

const EVENT_PROJECTILE_CONTENT = `import type {
    MissileId,
} from '../../defs/missile';
import {
    COMBAT_PROJECTILE_KIND,
    type CombatSource,
    type CombatTarget,
} from './combat';

// Presentation-safe projectile payload for encounter events.
//
// The mutable combat projectile owns hidden objective signature truth and
// observer identification state. Events only expose the physical information
// required to present the discrete missile transition.
export type MissileEventProjectileSnapshot = {
    id: string;
    designation: string;

    kind:
        typeof COMBAT_PROJECTILE_KIND
            .MISSILE;

    source:
        CombatSource;

    sourceWeaponId:
        string;

    target:
        CombatTarget;

    missileId:
        MissileId;

    timeToImpactMs:
        number;

    initialTimeToImpactMs:
        number;
};

// Explicit allowlist instead of Omit: adding a new internal projectile field
// must never make it cross the encounter outbox automatically.
export function createMissileEventProjectileSnapshot(
    projectile:
        MissileEventProjectileSnapshot,
): MissileEventProjectileSnapshot {
    return {
        id:
            projectile.id,

        designation:
            projectile.designation,

        kind:
            projectile.kind,

        source: {
            ...projectile.source,
        },

        sourceWeaponId:
            projectile.sourceWeaponId,

        target: {
            ...projectile.target,
        },

        missileId:
            projectile.missileId,

        timeToImpactMs:
            projectile.timeToImpactMs,

        initialTimeToImpactMs:
            projectile.initialTimeToImpactMs,
    };
}
`;

const EVENT_SNAPSHOT_CONTENT = `import {
    ENCOUNTER_EVENT,
    type EncounterEvent,
} from '../model/event';
import {
    createMissileEventProjectileSnapshot,
    type MissileEventProjectileSnapshot,
} from '../model/missile_event_projectile';
import {
    createDetachedSnapshot,
} from './create_detached_snapshot';

type MissileProjectileEncounterEvent =
    EncounterEvent & {
        projectile:
            MissileEventProjectileSnapshot;
    };

// Single engine-outbox boundary.
//
// Runners may operate on richer mutable domain objects. Before an event leaves
// EncounterEngine, payloads with hidden projectile truth are projected to the
// explicit public event model and the whole event is recursively detached.
export function createEncounterEventSnapshot(
    event:
        EncounterEvent,
): EncounterEvent {
    switch (event.type) {
        case ENCOUNTER_EVENT
            .PLAYER_MISSILE_LAUNCHED:

        case ENCOUNTER_EVENT
            .PLAYER_MISSILE_RESOLVED:

        case ENCOUNTER_EVENT
            .ENEMY_DEFENSE_TURRET_FIRED:

        case ENCOUNTER_EVENT
            .MISSILE_LAUNCHED:

        case ENCOUNTER_EVENT
            .MISSILE_IMPACTED_PLAYER_SHIP:
            return createMissileProjectileEncounterEventSnapshot(
                event,
            );

        default:
            return createDetachedSnapshot(
                event,
            );
    }
}

function createMissileProjectileEncounterEventSnapshot<
    T extends
        MissileProjectileEncounterEvent,
>(
    event:
        T,
): T {
    return createDetachedSnapshot({
        ...event,

        projectile:
            createMissileEventProjectileSnapshot(
                event.projectile,
            ),
    }) as T;
}
`;

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

function replaceExpectedCount(
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

    const trackedStatus =
        git([
            'status',
            '--porcelain',
            '--untracked-files=no',
        ]);

    if (trackedStatus.length > 0) {
        fail(
            'Tracked worktree is not clean:\n' +
            trackedStatus,
        );
    }

    for (
        const newFile of [
            NEW_EVENT_PROJECTILE_FILE,
            NEW_EVENT_SNAPSHOT_FILE,
        ]
    ) {
        if (fs.existsSync(newFile)) {
            fail(
                'New atom file already exists: ' +
                newFile,
            );
        }
    }

    for (
        const file of
        Object.values(FILES)
    ) {
        const blob =
            git([
                'hash-object',
                '--',
                file.path,
            ]).trim();

        if (
            blob !==
            file.expectedBlob
        ) {
            fail(
                'Unexpected file snapshot for ' +
                file.path +
                '\nExpected blob: ' +
                file.expectedBlob +
                '\nReceived blob: ' +
                blob,
            );
        }
    }

    {
        const eventState =
            readState(
                FILES.event.path,
            );

        const count =
            eventState.lf
                .split(
                    'MissileCombatProjectileState',
                )
                .length - 1;

        if (count !== 8) {
            fail(
                'Unexpected MissileCombatProjectileState occurrence count in event.ts. ' +
                'Expected 8 (1 import + 7 payloads), received ' +
                count,
            );
        }
    }

    fs.writeFileSync(
        NEW_EVENT_PROJECTILE_FILE,
        EVENT_PROJECTILE_CONTENT,
        'utf8',
    );

    fs.writeFileSync(
        NEW_EVENT_SNAPSHOT_FILE,
        EVENT_SNAPSHOT_CONTENT,
        'utf8',
    );

    {
        const state =
            readState(
                FILES.event.path,
            );

        let next =
            state.lf;

        next =
            replaceOnce(
                next,
                `    MissileCombatProjectileState,
`,
                ``,
                'remove internal missile projectile event import',
            );

        next =
            replaceOnce(
                next,
                `import type { OfficerTaskState } from './officer_task';
`,
                `import type {
    MissileEventProjectileSnapshot,
} from './missile_event_projectile';
import type { OfficerTaskState } from './officer_task';
`,
                'safe missile event projectile import',
            );

        next =
            replaceExpectedCount(
                next,
                'MissileCombatProjectileState',
                'MissileEventProjectileSnapshot',
                7,
                'missile event projectile payload type',
            );

        writePreservingEol(
            FILES.event.path,
            state.original,
            next,
        );
    }

    {
        const state =
            readState(
                FILES.engine.path,
            );

        let next =
            state.lf;

        next =
            replaceOnce(
                next,
                `import { createDetachedSnapshot } from './snapshots/create_detached_snapshot';
`,
                `import {
    createEncounterEventSnapshot,
} from './snapshots/create_encounter_event_snapshot';
`,
                'engine event snapshot import',
            );

        next =
            replaceOnce(
                next,
                `        this.events.push(
            createDetachedSnapshot(event),
        );
`,
                `        this.events.push(
            createEncounterEventSnapshot(
                event,
            ),
        );
`,
                'engine event outbox sanitizer',
            );

        writePreservingEol(
            FILES.engine.path,
            state.original,
            next,
        );
    }

    {
        const state =
            readState(
                FILES.combatRunnerTest.path,
            );

        let next =
            state.lf;

        const hiddenEventBlock =
`                    signature:
                MISSILE_SIGNATURE.A,

            identification: {
                        status: MISSILE_SIGNATURE_INTEL_STATUS.UNKNOWN,
                    },

`;

        next =
            replaceExpectedCount(
                next,
                hiddenEventBlock,
                '',
                2,
                'combat runner hidden missile event fields',
            );

        writePreservingEol(
            FILES.combatRunnerTest.path,
            state.original,
            next,
        );
    }

    {
        const state =
            readState(
                FILES.missilePresentationTest.path,
            );

        let next =
            state.lf;

        next =
            replaceOnce(
                next,
                `        if (
            !launchEvent ||
            launchEvent.projectile.target.kind !==
                COMBAT_TARGET_KIND.ACTOR
        ) {
            throw new Error(
                'Expected outgoing player missile launch event',
            );
        }

        launchEvent.projectile.target.actorId =
`,
                `        if (
            !launchEvent ||
            launchEvent.projectile.target.kind !==
                COMBAT_TARGET_KIND.ACTOR
        ) {
            throw new Error(
                'Expected outgoing player missile launch event',
            );
        }

        expect(
            launchEvent.projectile,
        ).not.toHaveProperty(
            'signature',
        );

        expect(
            launchEvent.projectile,
        ).not.toHaveProperty(
            'identification',
        );

        launchEvent.projectile.target.actorId =
`,
                'outgoing missile event hidden-field assertions',
            );

        writePreservingEol(
            FILES.missilePresentationTest.path,
            state.original,
            next,
        );
    }

    const changedTracked =
        git([
            'diff',
            '--name-only',
        ])
            .trim()
            .split(/\r?\n/)
            .filter(Boolean)
            .sort();

    assertFileSet(
        changedTracked,
        Object.values(FILES)
            .map(
                (file) =>
                    file.path,
            ),
        'Unexpected tracked changed-file set.',
    );

    const eventText =
        toLf(
            fs.readFileSync(
                FILES.event.path,
                'utf8',
            ),
        );

    if (
        eventText.includes(
            'MissileCombatProjectileState',
        )
    ) {
        fail(
            'Public EncounterEvent still references MissileCombatProjectileState.',
        );
    }

    const safeProjectileText =
        toLf(
            fs.readFileSync(
                NEW_EVENT_PROJECTILE_FILE,
                'utf8',
            ),
        );

    if (
        safeProjectileText.includes(
            'signature:',
        ) ||
        safeProjectileText.includes(
            'identification:',
        )
    ) {
        fail(
            'Safe missile event projectile accidentally exposes hidden fields.',
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
                'App layer still reads hidden missile event field ' +
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
        '\nEncounter presentation snapshot atom 04 passed.',
    );

    console.log(
        'Tracked changes:\n  ' +
        changedTracked.join('\n  '),
    );

    console.log(
        'New files:\n  ' +
        [
            NEW_EVENT_PROJECTILE_FILE,
            NEW_EVENT_SNAPSHOT_FILE,
        ].join('\n  '),
    );

    try {
        fs.unlinkSync(
            new URL(import.meta.url),
        );
    } catch (error) {
        console.warn(
            'Atom passed, but patcher could not self-delete:',
            error,
        );
    }
} catch (error) {
    console.error(error);
    process.exitCode = 1;
}
