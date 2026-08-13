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

function insertBeforeNearest(
    source,
    startNeedle,
    targetNeedle,
    insertion,
) {
    const start = source.indexOf(startNeedle);

    if (start < 0) {
        fail(`Cannot find start: ${startNeedle}`);
    }

    const target =
        source.indexOf(
            targetNeedle,
            start,
        );

    if (target < 0) {
        fail(
            `Cannot find target "${targetNeedle}" after "${startNeedle}"`,
        );
    }

    const between =
        source.slice(
            start,
            target,
        );

    if (between.includes(insertion.trim())) {
        return source;
    }

    return (
        source.slice(0, target) +
        insertion +
        source.slice(target)
    );
}

function replaceFirstAfter(
    source,
    startNeedle,
    pattern,
    replacement,
) {
    const start = source.indexOf(startNeedle);

    if (start < 0) {
        fail(`Cannot find start: ${startNeedle}`);
    }

    const tail =
        source.slice(start);

    if (!pattern.test(tail)) {
        fail(
            `Cannot find pattern after: ${startNeedle}`,
        );
    }

    pattern.lastIndex = 0;

    const nextTail =
        tail.replace(
            pattern,
            replacement,
        );

    return (
        source.slice(0, start) +
        nextTail
    );
}

// ---------------------------------------------------------------------------
// 1. Enemy debug snapshot:
// report stays A, objective projectile truth must be B.
// ---------------------------------------------------------------------------

{
    const rel =
        'tests/engine/encounter/enemy_debug_snapshot.test.ts';

    let source = read(rel);

    source =
        replaceFirstAfter(
            source,
            "'separates crew work, Science report and missile truth'",
            /signature:\s*\r?\n\s*MISSILE_SIGNATURE\.A,/,
`signature:
                            MISSILE_SIGNATURE.B,`,
        );

    // The presentation label now exposes the transitional signature name.
    const titleIndex =
        source.indexOf(
            "'separates crew work, Science report and missile truth'",
        );

    const blueLabelIndex =
        source.indexOf(
            "'INTERCEPT M1 BLUE'",
            titleIndex,
        );

    if (blueLabelIndex >= 0) {
        source =
            source.slice(0, blueLabelIndex) +
            "'INTERCEPT M1 SIGNATURE_B'" +
            source.slice(
                blueLabelIndex +
                    "'INTERCEPT M1 BLUE'".length,
            );
    }

    write(rel, source);
}

// ---------------------------------------------------------------------------
// 2. Enemy PD tests:
// BASIC_01 no longer implies truth B. Set concrete projectile truth explicitly
// before any enemy decision/Science logic runs.
// ---------------------------------------------------------------------------

{
    const rel =
        'tests/engine/encounter/enemy_defense_turret_interception.test.ts';

    let source = read(rel);

    const scenarios = [
        "'spends a charge on a blind miss and keeps the missile in flight'",
        "'uses a ready Science report instead of the blind fallback",
        "'trusts a hungover Science report and misses a missile it could blindly hit'",
    ];

    for (const title of scenarios) {
        source =
            insertBeforeNearest(
                source,
                title,
                '        engine.step(0);',
`        projectile.signature =
            MISSILE_SIGNATURE.B;

`,
            );
    }

    write(rel, source);
}

// ---------------------------------------------------------------------------
// 3. Science identify test:
// each table case chooses the runtime truth via injected RNG.
// ---------------------------------------------------------------------------

{
    const rel =
        'tests/engine/encounter/science_identify_threat.test.ts';

    let source = read(rel);

    // Case A.
    if (!/MISSILE_SIGNATURE\.A,[\s\S]{0,160}random:\s*\(\)\s*=>\s*0/.test(source)) {
        const aPattern =
            /(expected(?:Signature|Band):\s*\r?\n?\s*MISSILE_SIGNATURE\.A,\r?\n)/;

        if (!aPattern.test(source)) {
            fail(
                'Science test: cannot find SIGNATURE_A table case',
            );
        }

        source =
            source.replace(
                aPattern,
                `$1
            random: () => 0,
`,
            );
    }

    // Case B.
    if (!/MISSILE_SIGNATURE\.B,[\s\S]{0,160}random:\s*\(\)\s*=>\s*1/.test(source)) {
        const bPattern =
            /(expected(?:Signature|Band):\s*\r?\n?\s*MISSILE_SIGNATURE\.B,\r?\n)/;

        if (!bPattern.test(source)) {
            fail(
                'Science test: cannot find SIGNATURE_B table case',
            );
        }

        source =
            source.replace(
                bPattern,
                `$1
            random: () => 1,
`,
            );
    }

    // Add `random` to the it.each callback destructure.
    if (
        !/\(\{[\s\S]{0,220}\brandom\b[\s\S]{0,220}\}\)\s*=>\s*\{/.test(
            source,
        )
    ) {
        const callbackPattern =
            /\(\{\s*presetId,\s*(expected(?:Signature|Band))\s*\}\)\s*=>\s*\{/s;

        const match =
            callbackPattern.exec(source);

        if (!match) {
            fail(
                'Science test: cannot find it.each callback destructure',
            );
        }

        const expectedName =
            match[1];

        source =
            source.replace(
                callbackPattern,
`({
            presetId,
            ${expectedName},
            random,
        }) => {`,
            );
    }

    // Pass callback random to EncounterEngine.
    const testStart =
        source.indexOf(
            "describe('Science identify threat command'",
        );

    const engineStart =
        source.indexOf(
            'new EncounterEngine({',
            testStart,
        );

    if (engineStart < 0) {
        fail(
            'Science test: cannot find EncounterEngine',
        );
    }

    const open =
        source.indexOf(
            '{',
            engineStart,
        );

    const close =
        findMatchingBrace(
            source,
            open,
        );

    if (close < 0) {
        fail(
            'Science test: cannot match EncounterEngine options',
        );
    }

    const body =
        source.slice(
            open + 1,
            close,
        );

    if (!/\brandom\s*,/.test(body)) {
        const lineStart =
            source.lastIndexOf(
                '\n',
                close,
            ) + 1;

        const closeIndent =
            /^(\s*)/.exec(
                source.slice(
                    lineStart,
                    close,
                ),
            )?.[1] ?? '';

        const propertyIndent =
            closeIndent + '    ';

        source =
            source.slice(0, close) +
            `\n${propertyIndent}random,\n${closeIndent}` +
            source.slice(close);
    }

    write(rel, source);
}

// ---------------------------------------------------------------------------
// 4. Player PD hit table:
// explicit projectile truth equals selected transitional signature.
// ---------------------------------------------------------------------------

{
    const rel =
        'tests/engine/encounter/weapons_defense_turret_command.test.ts';

    let source = read(rel);

    const title =
        "'spends one charge immediately and destroys a $missileLabel missile when";

    const start =
        source.indexOf(title);

    if (start < 0) {
        fail(
            'Player PD hit table title not found',
        );
    }

    const commandsIndex =
        source.indexOf(
            '            const commands =',
            start,
        );

    if (commandsIndex < 0) {
        fail(
            'Player PD hit table commands boundary not found',
        );
    }

    const between =
        source.slice(
            start,
            commandsIndex,
        );

    if (
        !/projectiles\[0\][\s\S]{0,120}\.signature\s*=\s*signature;/.test(
            between,
        )
    ) {
        source =
            source.slice(0, commandsIndex) +
`            state.combat
                .projectiles[0]
                .signature =
                signature;

` +
            source.slice(commandsIndex);
    }

    write(rel, source);
}

// ---------------------------------------------------------------------------
// Guards for the six observed failures.
// ---------------------------------------------------------------------------

{
    const source =
        read(
            'tests/engine/encounter/enemy_debug_snapshot.test.ts',
        );

    const start =
        source.indexOf(
            "'separates crew work, Science report and missile truth'",
        );

    const tail =
        source.slice(
            start,
            start + 5000,
        );

    if (
        !/signature:\s*\r?\n\s*MISSILE_SIGNATURE\.B,/.test(
            tail,
        )
    ) {
        fail(
            'Enemy debug projectile truth is not B',
        );
    }
}

{
    const source =
        read(
            'tests/engine/encounter/enemy_defense_turret_interception.test.ts',
        );

    for (const title of [
        "'spends a charge on a blind miss and keeps the missile in flight'",
        "'uses a ready Science report instead of the blind fallback",
        "'trusts a hungover Science report and misses a missile it could blindly hit'",
    ]) {
        const start =
            source.indexOf(title);

        const step =
            source.indexOf(
                '        engine.step(0);',
                start,
            );

        const between =
            source.slice(
                start,
                step,
            );

        if (
            !/projectile\.signature\s*=\s*MISSILE_SIGNATURE\.B;/.test(
                between,
            )
        ) {
            fail(
                `Enemy PD scenario lacks explicit B truth: ${title}`,
            );
        }
    }
}

console.log(
    'Missile atom 01 behavioral recovery 13 applied.',
);
console.log('');
console.log('Run:');
console.log('  npm run typecheck');
console.log('  npm test');
