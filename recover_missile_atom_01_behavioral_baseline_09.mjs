import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

function fail(message) {
    throw new Error(message);
}

function abs(rel) {
    return path.join(ROOT, rel);
}

function read(rel) {
    const target = abs(rel);

    if (!fs.existsSync(target)) {
        fail(`Missing file: ${rel}`);
    }

    return fs.readFileSync(target, 'utf8');
}

function write(rel, source) {
    fs.writeFileSync(abs(rel), source, 'utf8');
}

function replaceRequired(rel, pattern, replacement, label) {
    const source = read(rel);
    const matches = source.match(
        new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g'),
    ) ?? [];

    if (matches.length !== 1) {
        fail(
            `${label}: expected exactly one match in ${rel}, found ${matches.length}`,
        );
    }

    write(
        rel,
        source.replace(pattern, replacement),
    );
}

function replaceInSection(
    rel,
    startNeedle,
    endNeedle,
    transform,
) {
    const source = read(rel);

    const start =
        source.indexOf(startNeedle);

    if (start < 0) {
        fail(
            `Cannot find section start in ${rel}: ${startNeedle}`,
        );
    }

    const end =
        endNeedle
            ? source.indexOf(
                  endNeedle,
                  start + startNeedle.length,
              )
            : source.length;

    if (end < 0) {
        fail(
            `Cannot find section end in ${rel}: ${endNeedle}`,
        );
    }

    const section =
        source.slice(start, end);

    const nextSection =
        transform(section);

    if (nextSection === section) {
        fail(
            `Section transform made no change in ${rel}: ${startNeedle}`,
        );
    }

    write(
        rel,
        source.slice(0, start) +
            nextSection +
            source.slice(end),
    );
}

function insertEncounterRandom(
    source,
    valueExpression,
) {
    if (/\brandom\s*:/.test(source)) {
        return source;
    }

    const engineIndex =
        source.indexOf(
            'new EncounterEngine({',
        );

    if (engineIndex < 0) {
        fail(
            'Cannot find new EncounterEngine({',
        );
    }

    const closeIndex =
        source.indexOf(
            '\n        });',
            engineIndex,
        );

    if (closeIndex < 0) {
        fail(
            'Cannot find EncounterEngine constructor close',
        );
    }

    return (
        source.slice(0, closeIndex) +
        `\n\n            random: ${valueExpression},` +
        source.slice(closeIndex)
    );
}

// ---------------------------------------------------------------------------
// 1. Content editor schema: missile signature is runtime-only now.
// ---------------------------------------------------------------------------

{
    const rel =
        'tests/tools/content_editor_registry.test.ts';

    let source = read(rel);

    const oldAssertion =
        /expect\(\s*missileSchema\s*\.properties\s*\?\.\s*basic_00\s*\?\.\s*properties\s*\?\.\s*signature\s*\?\.\s*enum,\s*\)\.toEqual\(\[\s*'red',\s*'blue',\s*\]\);/m;

    if (!oldAssertion.test(source)) {
        fail(
            'Cannot find old missile signature schema assertion',
        );
    }

    source =
        source.replace(
            oldAssertion,
`expect(
                    missileSchema
                        .properties
                        ?.basic_00
                        ?.properties,
                ).not.toHaveProperty(
                    'signature',
                );

                expect(
                    missileSchema
                        .properties
                        ?.basic_01
                        ?.properties,
                ).not.toHaveProperty(
                    'signature',
                );`,
        );

    write(rel, source);
}

// ---------------------------------------------------------------------------
// 2. Launch tests: pin RNG instead of accepting Math.random() flakiness.
// ---------------------------------------------------------------------------

replaceInSection(
    'tests/engine/encounter/combat_runner.test.ts',
    "it('runs an enemy missile launcher through targeting, flight, impact and cooldown'",
    "\n    it(",
    (section) =>
        insertEncounterRandom(
            section,
            '() => 0',
        ),
);

replaceInSection(
    'tests/engine/encounter/player_missile_lifecycle.test.ts',
    'function createMissileLifecycleSetup(',
    '\nfunction executeFireMissile(',
    (section) =>
        insertEncounterRandom(
            section,
            '() => 0',
        ),
);

// ---------------------------------------------------------------------------
// 3. Science identify test: choose runtime truth through deterministic RNG.
// The old preset no longer determines the signature.
// ---------------------------------------------------------------------------

replaceInSection(
    'tests/engine/encounter/science_identify_threat.test.ts',
    "describe('Science identify threat command'",
    null,
    (section) => {
        let next = section;

        next = next
            .replace(
                "label: 'RED'",
                "label: 'SIGNATURE_A'",
            )
            .replace(
                "label: 'BLUE'",
                "label: 'SIGNATURE_B'",
            );

        if (!/\brandom\s*:/.test(next)) {
            const engineIndex =
                next.indexOf(
                    'new EncounterEngine({',
                );

            if (engineIndex < 0) {
                fail(
                    'Science test: cannot find EncounterEngine',
                );
            }

            const closeIndex =
                next.indexOf(
                    '\n        });',
                    engineIndex,
                );

            if (closeIndex < 0) {
                fail(
                    'Science test: cannot find EncounterEngine close',
                );
            }

            next =
                next.slice(0, closeIndex) +
`\n
            random: () =>
                expectedBand ===
                MISSILE_SIGNATURE.A
                    ? 0
                    : 1,` +
                next.slice(closeIndex);
        }

        return next;
    },
);

// ---------------------------------------------------------------------------
// 4. Player PD tests: make projectile truth explicit per scenario.
// ---------------------------------------------------------------------------

replaceInSection(
    'tests/engine/encounter/weapons_defense_turret_command.test.ts',
    "'spends one charge immediately and destroys a $missileLabel missile when the beam band matches'",
    "\n    it.each([",
    (section) => {
        const needle =
            '            const commands =';

        const index =
            section.indexOf(needle);

        if (index < 0) {
            fail(
                'Weapons PD hit section: cannot find commands boundary',
            );
        }

        if (
            section.includes(
                'state.combat.projectiles[0].signature =\n                signature;',
            )
        ) {
            return section;
        }

        return (
            section.slice(0, index) +
`            state.combat
                .projectiles[0]
                .signature =
                signature;

` +
            section.slice(index)
        );
    },
);

replaceInSection(
    'tests/engine/encounter/weapons_defense_turret_command.test.ts',
    "'spends one charge and leaves a $missileLabel missile active after a $beamLabel beam miss'",
    "\n    it(",
    (section) => {
        const needle =
            '            const beamCommand =';

        const index =
            section.indexOf(needle);

        if (index < 0) {
            fail(
                'Weapons PD miss section: cannot find beamCommand boundary',
            );
        }

        if (
            section.includes(
                'state.combat\n                .projectiles[0]\n                .signature =',
            )
        ) {
            return section;
        }

        return (
            section.slice(0, index) +
`            state.combat
                .projectiles[0]
                .signature =
                signature ===
                DEFENSE_TURRET_SIGNATURE.A
                    ? DEFENSE_TURRET_SIGNATURE.B
                    : DEFENSE_TURRET_SIGNATURE.A;

` +
            section.slice(index)
        );
    },
);

// ---------------------------------------------------------------------------
// 5. Enemy PD tests: createScenario receives explicit projectile truth.
// ---------------------------------------------------------------------------

{
    const rel =
        'tests/engine/encounter/enemy_defense_turret_interception.test.ts';

    let source = read(rel);

    // Calls: BASIC_00 is explicit A; BASIC_01 scenarios are explicit B.
    source =
        source.replace(
            /createScenario\(\s*MISSILE_ID\.BASIC_00,\s*(\(\) => 0),\s*\)/g,
`createScenario(
            MISSILE_ID.BASIC_00,
            MISSILE_SIGNATURE.A,
            $1,
        )`,
        );

    source =
        source.replace(
            /createScenario\(\s*MISSILE_ID\.BASIC_01,\s*(\(\) => [01]),\s*\)/g,
`createScenario(
            MISSILE_ID.BASIC_01,
            MISSILE_SIGNATURE.B,
            $1,
        )`,
        );

    const helperSignature =
        /function createScenario\(\s*missileId:\s*typeof MISSILE_ID\.BASIC_00 \|\s*typeof MISSILE_ID\.BASIC_01,\s*random: \(\) => number,\s*\) \{/m;

    if (!helperSignature.test(source)) {
        fail(
            'Enemy PD: cannot find createScenario helper signature',
        );
    }

    source =
        source.replace(
            helperSignature,
`function createScenario(
    missileId:
        typeof MISSILE_ID.BASIC_00 |
        typeof MISSILE_ID.BASIC_01,

    projectileSignature:
        MissileCombatProjectileState[
            'signature'
        ],

    random: () => number,
) {`,
        );

    // Replace the auto-inserted fixture truth inside createScenario.
    const helperStart =
        source.indexOf(
            'function createScenario(',
        );

    if (helperStart < 0) {
        fail(
            'Enemy PD: createScenario helper disappeared',
        );
    }

    const head =
        source.slice(0, helperStart);

    let helper =
        source.slice(helperStart);

    const signatureFixture =
        /signature:\s*\r?\n\s*MISSILE_SIGNATURE\.A,/;

    if (!signatureFixture.test(helper)) {
        fail(
            'Enemy PD: cannot find auto-inserted projectile signature',
        );
    }

    helper =
        helper.replace(
            signatureFixture,
`signature:
                projectileSignature,`,
        );

    // Keep player-owned projectile identification consistent with the same
    // explicit runtime truth for these transitional tests.
    helper =
        helper.replace(
            /(\bidentification:\s*\{[\s\S]*?\bsignature:\s*)(?:MISSILE_SIGNATURE\.[AB]|'signature_[ab]')(\s*,)/,
            '$1projectileSignature$2',
        );

    source =
        head + helper;

    source = source
        .replace(
            'loads a blind matching band and intercepts the player missile',
            'loads a blind matching signature and intercepts the player missile',
        )
        .replace(
            'blind fallback band',
            'blind fallback signature',
        )
        .replace(
            'Truth is BLUE. HUNGOVER Science reports RED.',
            'Truth is SIGNATURE_B. HUNGOVER Science reports SIGNATURE_A.',
        );

    write(rel, source);
}

// ---------------------------------------------------------------------------
// 6. Enemy debug snapshot: make mismatch scenario truth explicitly B.
// ---------------------------------------------------------------------------

replaceInSection(
    'tests/engine/encounter/enemy_debug_snapshot.test.ts',
    "'separates crew work, Science report and missile truth'",
    "\n        it(",
    (section) => {
        let next = section;

        const fixture =
            /signature:\s*\r?\n\s*MISSILE_SIGNATURE\.A,/;

        if (!fixture.test(next)) {
            fail(
                'Enemy debug: cannot find auto-inserted projectile signature',
            );
        }

        next =
            next.replace(
                fixture,
`signature:
                            MISSILE_SIGNATURE.B,`,
            );

        next =
            next.replace(
                "'INTERCEPT M1 BLUE'",
                "'INTERCEPT M1 SIGNATURE_B'",
            );

        return next;
    },
);

// ---------------------------------------------------------------------------
// Guards.
// ---------------------------------------------------------------------------

{
    const source =
        read(
            'tests/tools/content_editor_registry.test.ts',
        );

    if (
        /\.basic_00[\s\S]{0,160}\.signature[\s\S]{0,80}\.enum/.test(
            source,
        )
    ) {
        fail(
            'Old content-editor missile signature enum assertion survived',
        );
    }
}

{
    const source =
        read(
            'tests/engine/encounter/enemy_defense_turret_interception.test.ts',
        );

    if (
        /createScenario\(\s*MISSILE_ID\.BASIC_01,\s*\(\) =>/.test(
            source,
        )
    ) {
        fail(
            'Enemy PD BASIC_01 call still omits explicit runtime signature',
        );
    }
}

console.log(
    'Missile atom 01 behavioral baseline recovery 09 applied.',
);
console.log('');
console.log('Run:');
console.log('  npm run typecheck');
console.log('  npm test');
