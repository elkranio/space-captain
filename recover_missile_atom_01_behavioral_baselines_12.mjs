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

function sectionBounds(
    source,
    startNeedle,
    endNeedle,
) {
    const start =
        source.indexOf(startNeedle);

    if (start < 0) {
        fail(
            `Cannot find section start: ${startNeedle}`,
        );
    }

    const end =
        endNeedle
            ? source.indexOf(
                  endNeedle,
                  start +
                      startNeedle.length,
              )
            : source.length;

    if (end < 0) {
        fail(
            `Cannot find section end after: ${startNeedle}`,
        );
    }

    return { start, end };
}

function patchSection(
    rel,
    startNeedle,
    endNeedle,
    transform,
) {
    const source = read(rel);

    const { start, end } =
        sectionBounds(
            source,
            startNeedle,
            endNeedle,
        );

    const section =
        source.slice(start, end);

    const next =
        transform(section);

    if (next === section) {
        fail(
            `No change made in ${rel}: ${startNeedle}`,
        );
    }

    write(
        rel,
        source.slice(0, start) +
            next +
            source.slice(end),
    );
}

function findMatchingBrace(
    source,
    openIndex,
) {
    let depth = 0;
    let quote = null;
    let escaped = false;

    for (
        let i = openIndex;
        i < source.length;
        i += 1
    ) {
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

function addRandomOptionToFirstEngine(
    section,
    expression,
) {
    const engineStart =
        section.indexOf(
            'new EncounterEngine({',
        );

    if (engineStart < 0) {
        fail(
            'Cannot find EncounterEngine in section',
        );
    }

    const open =
        section.indexOf(
            '{',
            engineStart,
        );

    const close =
        findMatchingBrace(
            section,
            open,
        );

    if (close < 0) {
        fail(
            'Cannot match EncounterEngine options',
        );
    }

    const body =
        section.slice(
            open + 1,
            close,
        );

    if (/\brandom\s*:/.test(body)) {
        return section;
    }

    const lineStart =
        section.lastIndexOf(
            '\n',
            close,
        ) + 1;

    const closeIndent =
        /^(\s*)/.exec(
            section.slice(
                lineStart,
                close,
            ),
        )?.[1] ?? '';

    const propertyIndent =
        closeIndent + '    ';

    return (
        section.slice(0, close) +
        `\n${propertyIndent}random: ${expression},\n${closeIndent}` +
        section.slice(close)
    );
}

// ---------------------------------------------------------------------------
// 1. Enemy debug snapshot:
//    report=A, objective truth=B, so mismatch remains true.
// ---------------------------------------------------------------------------

patchSection(
    'tests/engine/encounter/enemy_debug_snapshot.test.ts',
    "'separates crew work, Science report and missile truth'",
    '\n        it(',
    (section) => {
        let next = section;

        const signaturePattern =
            /signature:\s*\r?\n\s*MISSILE_SIGNATURE\.A,/;

        if (!signaturePattern.test(next)) {
            fail(
                'Enemy debug fixture does not contain MISSILE_SIGNATURE.A truth',
            );
        }

        next =
            next.replace(
                signaturePattern,
`signature:
                            MISSILE_SIGNATURE.B,`,
            );

        if (
            next.includes(
                "'INTERCEPT M1 BLUE'",
            )
        ) {
            next =
                next.replace(
                    "'INTERCEPT M1 BLUE'",
                    "'INTERCEPT M1 SIGNATURE_B'",
                );
        }

        return next;
    },
);

// ---------------------------------------------------------------------------
// 2. Enemy PD:
//    the three BASIC_01 scenarios used to rely on "blue missile" static truth.
//    Make the concrete projectile truth explicitly B before enemy logic runs.
// ---------------------------------------------------------------------------

for (const [title, endNeedle] of [
    [
        "'spends a charge on a blind miss and keeps the missile in flight'",
        "\n    it('uses a ready Science report",
    ],
    [
        "'uses a ready Science report instead of the blind fallback",
        "\n\n    it('trusts a hungover Science report",
    ],
    [
        "'trusts a hungover Science report and misses a missile it could blindly hit'",
        '\n\n    it(',
    ],
]) {
    patchSection(
        'tests/engine/encounter/enemy_defense_turret_interception.test.ts',
        title,
        endNeedle,
        (section) => {
            if (
                /projectile\.signature\s*=\s*MISSILE_SIGNATURE\.B;/.test(
                    section,
                )
            ) {
                return section;
            }

            const stepIndex =
                section.indexOf(
                    '        engine.step(0);',
                );

            if (stepIndex < 0) {
                fail(
                    `Cannot find first engine.step(0) in ${title}`,
                );
            }

            return (
                section.slice(
                    0,
                    stepIndex,
                ) +
`        projectile.signature =
            MISSILE_SIGNATURE.B;

` +
                section.slice(
                    stepIndex,
                )
            );
        },
    );
}

// ---------------------------------------------------------------------------
// 3. Science identify:
//    runtime signature comes from RNG, not from enemy preset.
//    Add a per-case random function and pass it into EncounterEngine.
// ---------------------------------------------------------------------------

{
    const rel =
        'tests/engine/encounter/science_identify_threat.test.ts';

    let source = read(rel);

    // Add random values to the two table cases if not already present.
    if (
        !/random:\s*\(\)\s*=>\s*0/.test(
            source,
        )
    ) {
        const aCase =
            /(expectedSignature:\s*\r?\n\s*MISSILE_SIGNATURE\.A,\r?\n)/;

        if (!aCase.test(source)) {
            fail(
                'Science test: cannot find SIGNATURE_A table case',
            );
        }

        source =
            source.replace(
                aCase,
                `$1
            random: () => 0,
`,
            );
    }

    if (
        !/random:\s*\(\)\s*=>\s*1/.test(
            source,
        )
    ) {
        const bCase =
            /(expectedSignature:\s*\r?\n\s*MISSILE_SIGNATURE\.B,\r?\n)/;

        if (!bCase.test(source)) {
            fail(
                'Science test: cannot find SIGNATURE_B table case',
            );
        }

        source =
            source.replace(
                bCase,
                `$1
            random: () => 1,
`,
            );
    }

    // Extend the callback destructure.
    if (
        !/\(\{\s*presetId,\s*expectedSignature,\s*random\s*\}\)/s.test(
            source,
        )
    ) {
        const callbackPattern =
            /\(\{\s*presetId,\s*expectedSignature\s*\}\)\s*=>\s*\{/s;

        if (!callbackPattern.test(source)) {
            fail(
                'Science test: cannot find table callback destructure',
            );
        }

        source =
            source.replace(
                callbackPattern,
                `({
            presetId,
            expectedSignature,
            random,
        }) => {`,
            );
    }

    const bounds =
        sectionBounds(
            source,
            "describe('Science identify threat command'",
            null,
        );

    const section =
        source.slice(
            bounds.start,
            bounds.end,
        );

    const nextSection =
        addRandomOptionToFirstEngine(
            section,
            'random',
        );

    source =
        source.slice(
            0,
            bounds.start,
        ) +
        nextSection +
        source.slice(
            bounds.end,
        );

    write(rel, source);
}

// ---------------------------------------------------------------------------
// 4. Player PD transitional hit/miss tests:
//    selected signature and projectile truth are now independent values.
// ---------------------------------------------------------------------------

patchSection(
    'tests/engine/encounter/weapons_defense_turret_command.test.ts',
    "'spends one charge immediately and destroys a $missileLabel missile when the",
    '\n    it.each([',
    (section) => {
        if (
            /projectiles\[0\][\s\S]{0,80}\.signature\s*=\s*signature;/.test(
                section,
            )
        ) {
            return section;
        }

        const commandsIndex =
            section.indexOf(
                '            const commands =',
            );

        if (commandsIndex < 0) {
            fail(
                'Player PD hit section: cannot find commands boundary',
            );
        }

        return (
            section.slice(
                0,
                commandsIndex,
            ) +
`            state.combat
                .projectiles[0]
                .signature =
                signature;

` +
            section.slice(
                commandsIndex,
            )
        );
    },
);

// Also make the miss table explicit even though it currently passes by accident.
patchSection(
    'tests/engine/encounter/weapons_defense_turret_command.test.ts',
    "'spends one charge and leaves a $missileLabel missile active after a $beamLabel",
    "\n    it('does not offer defense-turret commands",
    (section) => {
        if (
            /projectiles\[0\][\s\S]{0,180}\.signature\s*=\s*signature ===/.test(
                section,
            )
        ) {
            return section;
        }

        const commandIndex =
            section.indexOf(
                '            const beamCommand =',
            );

        if (commandIndex < 0) {
            fail(
                'Player PD miss section: cannot find command boundary',
            );
        }

        return (
            section.slice(
                0,
                commandIndex,
            ) +
`            state.combat
                .projectiles[0]
                .signature =
                signature ===
                DEFENSE_TURRET_SIGNATURE.A
                    ? DEFENSE_TURRET_SIGNATURE.B
                    : DEFENSE_TURRET_SIGNATURE.A;

` +
            section.slice(
                commandIndex,
            )
        );
    },
);

// ---------------------------------------------------------------------------
// Guards.
// ---------------------------------------------------------------------------

{
    const source =
        read(
            'tests/engine/encounter/enemy_debug_snapshot.test.ts',
        );

    const { start, end } =
        sectionBounds(
            source,
            "'separates crew work, Science report and missile truth'",
            '\n        it(',
        );

    const section =
        source.slice(start, end);

    if (
        !/signature:\s*\r?\n\s*MISSILE_SIGNATURE\.B,/.test(
            section,
        )
    ) {
        fail(
            'Enemy debug truth is not explicitly B',
        );
    }
}

{
    const source =
        read(
            'tests/engine/encounter/science_identify_threat.test.ts',
        );

    if (
        !/random:\s*\(\)\s*=>\s*0/.test(
            source,
        ) ||
        !/random:\s*\(\)\s*=>\s*1/.test(
            source,
        )
    ) {
        fail(
            'Science test is not deterministic for both signatures',
        );
    }
}

console.log(
    'Missile atom 01 remaining behavioral baselines 12 applied.',
);
console.log('');
console.log('Run:');
console.log('  npm run typecheck');
console.log('  npm test');
