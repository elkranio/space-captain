import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

function fail(message) {
    throw new Error(message);
}

function read(rel) {
    const file = path.join(ROOT, rel);

    if (!fs.existsSync(file)) {
        fail(`Missing file: ${rel}`);
    }

    return fs.readFileSync(file, 'utf8');
}

function write(rel, source) {
    fs.writeFileSync(
        path.join(ROOT, rel),
        source,
        'utf8',
    );
}

// ---------------------------------------------------------------------------
// 1. BridgeCaptainCombatContextMapper.test.ts
// createMissile() returns CombatProjectileState and needs runtime truth.
// ---------------------------------------------------------------------------

{
    const rel =
        'tests/app/BridgeCaptainCombatContextMapper.test.ts';

    let source = read(rel);

    const helperStart =
        source.indexOf(
            'function createMissile({',
        );

    if (helperStart < 0) {
        fail(
            'Cannot find createMissile helper',
        );
    }

    const helperEnd =
        source.indexOf(
            '\n}',
            helperStart,
        );

    if (helperEnd < 0) {
        fail(
            'Cannot find createMissile helper end',
        );
    }

    const helper =
        source.slice(
            helperStart,
            helperEnd,
        );

    if (
        !/\bsignature\s*:/.test(
            helper,
        )
    ) {
        const needle =
`        target: {
            kind:
                COMBAT_TARGET_KIND
                    .PLAYER_SHIP,
        },

        identification,
`;

        const count =
            helper.split(needle)
                .length - 1;

        if (count !== 1) {
            fail(
                `Expected one mapper target/identification block, found ${count}`,
            );
        }

        const nextHelper =
            helper.replace(
                needle,
`        target: {
            kind:
                COMBAT_TARGET_KIND
                    .PLAYER_SHIP,
        },

        signature:
            MISSILE_SIGNATURE.A,

        identification,
`,
            );

        source =
            source.slice(
                0,
                helperStart,
            ) +
            nextHelper +
            source.slice(
                helperEnd,
            );

        write(rel, source);
    }

    if (
        !/\bMISSILE_SIGNATURE\b/.test(
            source,
        )
    ) {
        fail(
            'Mapper fixture uses no MISSILE_SIGNATURE after patch',
        );
    }
}

// ---------------------------------------------------------------------------
// 2. enemy_spam_slowdown.test.ts
// Runtime signature must not be derived from static missile definition.
// ---------------------------------------------------------------------------

{
    const rel =
        'tests/engine/encounter/enemy_spam_slowdown.test.ts';

    let source = read(rel);

    const pattern =
        /(\bsignature:\s*\r?\n\s*)missile\s*\r?\n\s*\.signature,/g;

    const matches =
        [...source.matchAll(pattern)];

    if (matches.length === 1) {
        source =
            source.replace(
                pattern,
                '$1MISSILE_SIGNATURE.A,',
            );

        write(rel, source);
    } else if (
        matches.length === 0 &&
        !/signature:\s*\r?\n\s*MISSILE_SIGNATURE\.A,/.test(
            source,
        )
    ) {
        fail(
            'Cannot find remaining missile.signature fixture in enemy_spam_slowdown.test.ts',
        );
    } else if (
        matches.length > 1
    ) {
        fail(
            `Expected at most one missile.signature fixture, found ${matches.length}`,
        );
    }

    if (
        /\bmissile\s*\r?\n\s*\.signature\b/.test(
            source,
        )
    ) {
        fail(
            'Static missile.signature still survives in enemy_spam_slowdown.test.ts',
        );
    }
}

console.log(
    'Missile atom 01 final compile recovery 06 applied.',
);
console.log('');
console.log('Run:');
console.log('  npm run typecheck');
console.log('');
console.log(
    'If green, run npm test.',
);
