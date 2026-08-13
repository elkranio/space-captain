import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

function fail(message) {
    throw new Error(message);
}

function read(rel) {
    const target = path.join(ROOT, rel);

    if (!fs.existsSync(target)) {
        fail(`Missing file: ${rel}`);
    }

    return fs.readFileSync(target, 'utf8');
}

function write(rel, source) {
    fs.writeFileSync(
        path.join(ROOT, rel),
        source,
        'utf8',
    );
}

function findMatchingBrace(source, openIndex) {
    let depth = 0;
    let quote = null;
    let escaped = false;

    for (let i = openIndex; i < source.length; i += 1) {
        const ch = source[i];

        if (quote !== null) {
            if (escaped) {
                escaped = false;
                continue;
            }

            if (ch === '\\') {
                escaped = true;
                continue;
            }

            if (ch === quote) {
                quote = null;
            }

            continue;
        }

        if (
            ch === "'" ||
            ch === '"' ||
            ch === '`'
        ) {
            quote = ch;
            continue;
        }

        if (ch === '{') {
            depth += 1;
            continue;
        }

        if (ch === '}') {
            depth -= 1;

            if (depth === 0) {
                return i;
            }
        }
    }

    return -1;
}

function addRandomToEncounterEngine(
    rel,
    sectionStartNeedle,
) {
    let source = read(rel);

    const sectionStart =
        source.indexOf(
            sectionStartNeedle,
        );

    if (sectionStart < 0) {
        fail(
            `Cannot find section in ${rel}: ${sectionStartNeedle}`,
        );
    }

    const engineStart =
        source.indexOf(
            'new EncounterEngine({',
            sectionStart,
        );

    if (engineStart < 0) {
        fail(
            `Cannot find EncounterEngine in ${rel}`,
        );
    }

    const objectOpen =
        source.indexOf(
            '{',
            engineStart,
        );

    const objectClose =
        findMatchingBrace(
            source,
            objectOpen,
        );

    if (objectClose < 0) {
        fail(
            `Cannot match EncounterEngine options object in ${rel}`,
        );
    }

    const objectBody =
        source.slice(
            objectOpen + 1,
            objectClose,
        );

    if (
        /\brandom\s*:/.test(
            objectBody,
        )
    ) {
        return;
    }

    const closeLineStart =
        source.lastIndexOf(
            '\n',
            objectClose,
        ) + 1;

    const closeIndent =
        /^(\s*)/.exec(
            source.slice(
                closeLineStart,
                objectClose,
            ),
        )?.[1] ?? '';

    const propertyIndent =
        closeIndent + '    ';

    const insertion =
`\n${propertyIndent}random: () => 0,\n${closeIndent}`;

    source =
        source.slice(
            0,
            objectClose,
        ) +
        insertion +
        source.slice(
            objectClose,
        );

    write(rel, source);
}

// Enemy launch baseline: runtime signature A.
addRandomToEncounterEngine(
    'tests/engine/encounter/combat_runner.test.ts',
    "it('runs an enemy missile launcher through targeting, flight, impact and cooldown'",
);

// Player launch baseline: runtime signature A.
addRandomToEncounterEngine(
    'tests/engine/encounter/player_missile_lifecycle.test.ts',
    'function createMissileLifecycleSetup(',
);

// Guards.
for (const [rel, needle] of [
    [
        'tests/engine/encounter/combat_runner.test.ts',
        "it('runs an enemy missile launcher through targeting, flight, impact and cooldown'",
    ],
    [
        'tests/engine/encounter/player_missile_lifecycle.test.ts',
        'function createMissileLifecycleSetup(',
    ],
]) {
    const source = read(rel);
    const start = source.indexOf(needle);
    const engineStart = source.indexOf(
        'new EncounterEngine({',
        start,
    );
    const open = source.indexOf('{', engineStart);
    const close = findMatchingBrace(source, open);
    const body = source.slice(open + 1, close);

    if (!/\brandom\s*:\s*\(\)\s*=>\s*0\s*,/.test(body)) {
        fail(
            `Deterministic random seam missing in ${rel}`,
        );
    }
}

console.log(
    'Missile atom 01 launch baseline recovery 10 applied.',
);
console.log('');
console.log('Run:');
console.log('  npm run typecheck');
console.log('  npm test');
