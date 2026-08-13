import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

function fail(message) {
    throw new Error(message);
}

function file(rel) {
    return path.join(ROOT, rel);
}

function read(rel) {
    const target = file(rel);

    if (!fs.existsSync(target)) {
        fail(`Missing file: ${rel}`);
    }

    return fs.readFileSync(target, 'utf8');
}

function write(rel, source) {
    fs.writeFileSync(
        file(rel),
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

        if (quote) {
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

// ---------------------------------------------------------------------------
// 1. BridgeCaptainCombatContextMapper.test.ts
// Robustly patch the createMissile() helper.
// ---------------------------------------------------------------------------

{
    const rel =
        'tests/app/BridgeCaptainCombatContextMapper.test.ts';

    let source = read(rel);

    const fnIndex =
        source.indexOf(
            'function createMissile',
        );

    if (fnIndex < 0) {
        fail(
            'Cannot find createMissile function',
        );
    }

    const bodyOpen =
        source.indexOf(
            '{',
            source.indexOf(
                '): CombatProjectileState',
                fnIndex,
            ),
        );

    if (bodyOpen < 0) {
        fail(
            'Cannot find createMissile body open brace',
        );
    }

    const bodyClose =
        findMatchingBrace(
            source,
            bodyOpen,
        );

    if (bodyClose < 0) {
        fail(
            'Cannot find createMissile body close brace',
        );
    }

    let body =
        source.slice(
            bodyOpen + 1,
            bodyClose,
        );

    if (
        !/\bsignature\s*:/.test(
            body,
        )
    ) {
        const identificationMatch =
            /\n([ \t]*)identification\s*,/.exec(
                body,
            );

        if (!identificationMatch) {
            fail(
                'Cannot find shorthand identification field inside createMissile return object',
            );
        }

        const insertionIndex =
            identificationMatch.index + 1;

        const indent =
            identificationMatch[1];

        body =
            body.slice(
                0,
                insertionIndex,
            ) +
`${indent}signature:
${indent}    MISSILE_SIGNATURE.A,

` +
            body.slice(
                insertionIndex,
            );

        source =
            source.slice(
                0,
                bodyOpen + 1,
            ) +
            body +
            source.slice(
                bodyClose,
            );

        write(rel, source);
    }

    const patched =
        read(rel);

    const patchedFnIndex =
        patched.indexOf(
            'function createMissile',
        );

    const patchedBodyOpen =
        patched.indexOf(
            '{',
            patched.indexOf(
                '): CombatProjectileState',
                patchedFnIndex,
            ),
        );

    const patchedBodyClose =
        findMatchingBrace(
            patched,
            patchedBodyOpen,
        );

    const patchedBody =
        patched.slice(
            patchedBodyOpen + 1,
            patchedBodyClose,
        );

    if (
        !/signature\s*:\s*\r?\n\s*MISSILE_SIGNATURE\.A,/.test(
            patchedBody,
        )
    ) {
        fail(
            'createMissile helper still lacks runtime signature after patch',
        );
    }
}

// ---------------------------------------------------------------------------
// 2. enemy_spam_slowdown.test.ts
// Replace the one remaining old static missile-definition signature read.
// ---------------------------------------------------------------------------

{
    const rel =
        'tests/engine/encounter/enemy_spam_slowdown.test.ts';

    let source = read(rel);

    const oldRead =
        /(\bsignature\s*:\s*)missile\s*(?:\r?\n\s*)?\.signature\b/g;

    const matches =
        [...source.matchAll(oldRead)];

    if (matches.length > 1) {
        fail(
            `Expected at most one remaining missile.signature read, found ${matches.length}`,
        );
    }

    if (matches.length === 1) {
        source =
            source.replace(
                oldRead,
                '$1MISSILE_SIGNATURE.A',
            );

        write(rel, source);
    }

    const patched =
        read(rel);

    if (
        /\bmissile\s*(?:\r?\n\s*)?\.signature\b/.test(
            patched,
        )
    ) {
        fail(
            'enemy_spam_slowdown.test.ts still reads missile.signature',
        );
    }
}

console.log(
    'Missile atom 01 final compile recovery 07 applied.',
);
console.log('');
console.log('Run:');
console.log('  npm run typecheck');
console.log('');
console.log(
    'If green: npm test',
);
