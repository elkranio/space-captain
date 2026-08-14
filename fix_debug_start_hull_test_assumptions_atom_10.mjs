import {
    readFileSync,
    unlinkSync,
    writeFileSync,
} from 'node:fs';
import path from 'node:path';
import {
    fileURLToPath,
} from 'node:url';
import {
    spawnSync,
} from 'node:child_process';
import ts from 'typescript';

const EXPECTED_HEAD =
    '382f2414ee40e2d15a262314cc56154140f08099';

const FILES = {
    eventHandlerTest:
        'tests/app/BridgeEncounterEngineEventHandler.test.ts',

    persistenceTest:
        'tests/app/BridgeEncounterPersistenceSynchronizer.test.ts',
};

const EXPECTED_HEAD_BLOBS = {
    [FILES.eventHandlerTest]:
        'fbf5729d853b4f544c5d79e1a9d20bed635be765',

    [FILES.persistenceTest]:
        '019800e747593070f95a2e38db7c153bbceb38bc',
};

const repoRoot =
    process.cwd();

const selfPath =
    fileURLToPath(import.meta.url);

function fail(message) {
    throw new Error(message);
}

function run(
    command,
    args,
) {
    const result =
        spawnSync(
            command,
            args,
            {
                cwd: repoRoot,
                encoding: 'utf8',
                shell: false,
            },
        );

    if (result.status !== 0) {
        fail(
            [
                `Command failed: ${command} ${args.join(' ')}`,
                result.stdout,
                result.stderr,
            ]
                .filter(Boolean)
                .join('\n'),
        );
    }

    return result.stdout;
}

function absolute(relativePath) {
    return path.join(
        repoRoot,
        relativePath,
    );
}

function toLf(text) {
    return text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n');
}

function getEol(text) {
    return text.includes('\r\n')
        ? '\r\n'
        : '\n';
}

function normalizeForWrite(
    text,
    eol,
) {
    return (
        toLf(text)
            .replace(/[ \t]+\n/g, '\n')
            .replace(/\n*$/, '') +
        '\n'
    ).replace(
        /\n/g,
        eol,
    );
}

function replaceOnce(
    text,
    oldText,
    newText,
    label,
) {
    const count =
        text.split(oldText)
            .length - 1;

    if (count !== 1) {
        fail(
            `${label}: expected 1 match, found ${count}.`,
        );
    }

    return text.replace(
        oldText,
        newText,
    );
}

function parseTs(
    fileName,
    text,
) {
    const source =
        ts.createSourceFile(
            fileName,
            text,
            ts.ScriptTarget.Latest,
            true,
            ts.ScriptKind.TS,
        );

    if (
        source.parseDiagnostics.length >
        0
    ) {
        fail(
            [
                `TypeScript parse failed: ${fileName}`,
                ...source
                    .parseDiagnostics
                    .map((diagnostic) => {
                        return ts.flattenDiagnosticMessageText(
                            diagnostic.messageText,
                            '\n',
                        );
                    }),
            ].join('\n'),
        );
    }
}

const head =
    run(
        'git',
        [
            'rev-parse',
            'HEAD',
        ],
    ).trim();

if (head !== EXPECTED_HEAD) {
    fail(
        `HEAD mismatch. Expected ${EXPECTED_HEAD}, got ${head}.`,
    );
}

// This is a recovery patch applied over the intentionally dirty
// enemy-destruction no-pause atom. Only require these two test targets
// to still match HEAD exactly.
for (
    const [
        relativePath,
        expectedBlob,
    ] of Object.entries(
        EXPECTED_HEAD_BLOBS,
    )
) {
    const headBlob =
        run(
            'git',
            [
                'rev-parse',
                `HEAD:${relativePath}`,
            ],
        ).trim();

    if (headBlob !== expectedBlob) {
        fail(
            `Unexpected HEAD blob for ${relativePath}. ` +
                `Expected ${expectedBlob}, got ${headBlob}.`,
        );
    }

    const localBlob =
        run(
            'git',
            [
                'hash-object',
                relativePath,
            ],
        ).trim();

    if (localBlob !== expectedBlob) {
        fail(
            `Recovery target already has local edits: ${relativePath}.`,
        );
    }
}

const staged =
    new Map();

const eols =
    new Map();

function stage(
    relativePath,
    transform,
) {
    const original =
        readFileSync(
            absolute(relativePath),
            'utf8',
        );

    eols.set(
        relativePath,
        getEol(original),
    );

    const next =
        transform(
            toLf(original),
        );

    parseTs(
        relativePath,
        next,
    );

    staged.set(
        relativePath,
        next,
    );
}

stage(
    FILES.eventHandlerTest,
    (text) => {
        let next =
            replaceOnce(
                text,
`    it('maps targeting and missile launch to bridge presentation events', () => {
        const runtime = new GameRuntime();

        const emit = vi.fn();
`,
`    it('maps targeting and missile launch to bridge presentation events', () => {
        const runtime = new GameRuntime();

        const initialHull =
            runtime.getCurrentRun()
                .player.ship.hull;

        const emit = vi.fn();
`,
                'event handler initial hull snapshot',
            );

        next =
            replaceOnce(
                next,
`        expect(runtime.getCurrentRun().player.ship.hull).toBe(3);
`,
`        expect(
            runtime.getCurrentRun()
                .player.ship.hull,
        ).toBe(initialHull);
`,
                'event handler hardcoded hull expectation',
            );

        return next;
    },
);

stage(
    FILES.persistenceTest,
    (text) => {
        let next =
            replaceOnce(
                text,
`                const runtime =
                    new GameRuntime();

                const synchronizer =
`,
`                const runtime =
                    new GameRuntime();

                const initialHull =
                    runtime.getCurrentRun()
                        .player.ship.hull;

                const synchronizer =
`,
                'persistence initial hull snapshot',
            );

        next =
            replaceOnce(
                next,
`                expect(
                    runtime.getCurrentRun()
                        .player.ship.hull,
                ).toBe(3);
`,
`                expect(
                    runtime.getCurrentRun()
                        .player.ship.hull,
                ).toBe(initialHull);
`,
                'persistence hardcoded hull expectation',
            );

        return next;
    },
);

for (
    const [
        relativePath,
        content,
    ] of staged
) {
    if (
        content.includes(
            '.player.ship.hull).toBe(3)',
        ) ||
        content.includes(
            '.player.ship.hull,\n                ).toBe(3)',
        )
    ) {
        fail(
            `Hardcoded starter hull expectation remains in ${relativePath}.`,
        );
    }

    if (
        !content.includes(
            'initialHull',
        )
    ) {
        fail(
            `Initial hull snapshot missing in ${relativePath}.`,
        );
    }
}

// Write only after both transforms + parse guards succeed.
for (
    const [
        relativePath,
        content,
    ] of staged
) {
    writeFileSync(
        absolute(relativePath),
        normalizeForWrite(
            content,
            eols.get(relativePath) ??
                '\n',
        ),
        'utf8',
    );
}

const diffCheck =
    spawnSync(
        'git',
        [
            '-c',
            'core.safecrlf=false',
            'diff',
            '--check',
        ],
        {
            cwd: repoRoot,
            encoding: 'utf8',
            shell: false,
        },
    );

if (
    diffCheck.status !== 0
) {
    fail(
        [
            'git diff --check failed.',
            diffCheck.stdout,
            diffCheck.stderr,
        ]
            .filter(Boolean)
            .join('\n'),
    );
}

console.log(
    [
        'Debug Start hull test assumptions removed.',
        '',
        'Both tests now assert that hull stays unchanged,',
        'instead of assuming a specific Debug Start maxHull.',
        '',
        'Run:',
        '  npm run typecheck',
        '  npm test',
    ].join('\n'),
);

unlinkSync(
    selfPath,
);
