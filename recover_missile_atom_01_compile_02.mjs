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

function write(rel, content) {
    fs.writeFileSync(abs(rel), content, 'utf8');
}

function walk(dir) {
    const result = [];

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const target = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            result.push(...walk(target));
        } else {
            result.push(target);
        }
    }

    return result;
}

function replaceAllTs(rootRel, transform) {
    const root = abs(rootRel);

    if (!fs.existsSync(root)) {
        return;
    }

    for (const target of walk(root)) {
        if (path.extname(target) !== '.ts') {
            continue;
        }

        const source = fs.readFileSync(target, 'utf8');
        const next = transform(source, target);

        if (next !== source) {
            fs.writeFileSync(target, next, 'utf8');
        }
    }
}

// ---------------------------------------------------------------------------
// 1. Projectile truth type: the previous recovery inserted spawn values but
// missed the actual MissileCombatProjectileState member.
// ---------------------------------------------------------------------------

{
    const rel =
        'src/engine/encounter/model/combat.ts';

    let source = read(rel);

    if (!source.includes('signature: MissileSignature;')) {
        const typeStart =
            source.indexOf(
                'export type MissileCombatProjectileState = {',
            );

        const typeEnd =
            source.indexOf(
                '\n};',
                typeStart,
            );

        if (
            typeStart < 0 ||
            typeEnd < 0
        ) {
            fail(
                'Cannot locate MissileCombatProjectileState',
            );
        }

        const block =
            source.slice(
                typeStart,
                typeEnd,
            );

        const targetMatch =
            /(\r?\n\s+target: CombatTarget;\r?\n)/.exec(
                block,
            );

        if (!targetMatch) {
            fail(
                'Cannot locate target field in MissileCombatProjectileState',
            );
        }

        const insertAt =
            typeStart +
            targetMatch.index +
            targetMatch[0].length;

        const insertion =
`
    // Objective hidden truth of this concrete projectile.
    // missileId identifies ammo model and cannot reveal this value.
    signature: MissileSignature;
`;

        source =
            source.slice(0, insertAt) +
            insertion +
            source.slice(insertAt);

        write(rel, source);
    }
}

// ---------------------------------------------------------------------------
// 2. CombatRunner must pass its deterministic RNG into CombatMissileRunner.
// ---------------------------------------------------------------------------

{
    const rel =
        'src/engine/encounter/combat/CombatRunner.ts';

    let source = read(rel);

    const constructorStart =
        source.indexOf(
            'this.missileRunner =',
        );

    const constructorEnd =
        source.indexOf(
            '});',
            constructorStart,
        );

    if (
        constructorStart < 0 ||
        constructorEnd < 0
    ) {
        fail(
            'Cannot locate CombatMissileRunner construction',
        );
    }

    const block =
        source.slice(
            constructorStart,
            constructorEnd,
        );

    if (!/\brandom\s*,/.test(block)) {
        const identityNeedle =
            /(\s+identities:\r?\n\s+this\.identities,\r?\n)/;

        const match =
            identityNeedle.exec(block);

        if (!match) {
            fail(
                'Cannot locate identities option in CombatMissileRunner construction',
            );
        }

        const localInsertAt =
            match.index +
            match[0].length;

        const nextBlock =
            block.slice(0, localInsertAt) +
`
                random,
` +
            block.slice(localInsertAt);

        source =
            source.slice(
                0,
                constructorStart,
            ) +
            nextBlock +
            source.slice(
                constructorEnd,
            );

        write(rel, source);
    }
}

// ---------------------------------------------------------------------------
// 3. Enemy Science: multiline RED/BLUE survived the old literal replace.
// Rewrite the whole helper so there is no color-era member name left.
// ---------------------------------------------------------------------------

{
    const rel =
        'src/engine/encounter/combat/enemy/intel/EnemyScienceIntelResolver.ts';

    let source = read(rel);

    source =
        source.replaceAll(
            'getWrongSpectralBand',
            'getWrongSignature',
        );

    const helperStart =
        source.indexOf(
            '    private getWrongSignature(',
        );

    if (helperStart >= 0) {
        const classEnd =
            source.lastIndexOf('\n}');

        if (classEnd < helperStart) {
            fail(
                'Cannot locate EnemyScienceIntelResolver class end',
            );
        }

        const newHelper =
`    private getWrongSignature(
        truthfulSignature:
            MissileSignature,
    ): MissileSignature {
        switch (truthfulSignature) {
            case MISSILE_SIGNATURE.A:
                return (
                    MISSILE_SIGNATURE.B
                );

            case MISSILE_SIGNATURE.B:
                return (
                    MISSILE_SIGNATURE.A
                );
        }
    }
`;

        source =
            source.slice(
                0,
                helperStart,
            ) +
            newHelper +
            source.slice(
                classEnd,
            );
    }

    write(rel, source);
}

// ---------------------------------------------------------------------------
// 4. Debug truth must inspect the concrete projectile, never MISSILES catalog.
// ---------------------------------------------------------------------------

{
    const rel =
        'src/engine/encounter/debug/get_enemy_debug_snapshots.ts';

    let source = read(rel);

    source = source.replace(
        /const truth =\s*projectile\s*\?\s*MISSILES\[\s*projectile\.missileId\s*\]\.signature\s*:\s*undefined;/,
`const truth =
        projectile
            ? projectile.signature
            : undefined;`,
    );

    if (
        !source.includes('MISSILES[')
    ) {
        source = source.replace(
            /import \{\r?\n\s+MISSILES,\r?\n\} from ['"][^'"]*content\/catalogs\/missiles['"];\r?\n/,
            '',
        );
    }

    write(rel, source);
}

// ---------------------------------------------------------------------------
// 5. Compile migration in tests.
// These replacements do NOT define final PD behavior; they only remove stale
// color vocabulary and static missile-definition signature assumptions.
// ---------------------------------------------------------------------------

replaceAllTs(
    'tests',
    (source) => {
        let next = source;

        next = next.replace(
            /(MISSILE_SIGNATURE\s*)\.RED\b/g,
            '$1.A',
        );

        next = next.replace(
            /(MISSILE_SIGNATURE\s*)\.BLUE\b/g,
            '$1.B',
        );

        next = next.replace(
            /(DEFENSE_TURRET_SIGNATURE\s*)\.RED\b/g,
            '$1.A',
        );

        next = next.replace(
            /(DEFENSE_TURRET_SIGNATURE\s*)\.BLUE\b/g,
            '$1.B',
        );

        next = next.replace(
            /(\bsignature\s*:\s*)'red'/g,
            "$1'signature_a'",
        );

        next = next.replace(
            /(\bsignature\s*:\s*)'blue'/g,
            "$1'signature_b'",
        );

        // Old tests sometimes derive a runtime value from static content.
        // Atom 01 explicitly forbids that. A concrete fixture signature is
        // sufficient until the behavior assertions are updated after compile.
        next = next.replace(
            /\bmissile\.signature\b/g,
            "'signature_a'",
        );

        next = next.replace(
            /MISSILES\[\s*([^\]]+)\s*\]\.signature/g,
            "'signature_a'",
        );

        return next;
    },
);

// The content test should now assert exactly what atom 01 means:
// missile definitions contain no signature.
{
    const rel =
        'tests/engine/content/weapon_missile_tuning.test.ts';

    let source = read(rel);

    const startNeedle =
        `        it(
            'preserves current runtime missile definitions',`;

    const start =
        source.indexOf(startNeedle);

    if (start >= 0) {
        const nextTest =
            source.indexOf(
                `        it(`,
                start +
                startNeedle.length,
            );

        if (nextTest < 0) {
            fail(
                'Cannot locate next test after missile definition test',
            );
        }

        const replacement =
`        it(
            'preserves current runtime missile definitions',
            () => {
                expect(
                    MISSILES[
                        MISSILE_ID.BASIC_00
                    ],
                ).toEqual({
                    id:
                        MISSILE_ID.BASIC_00,

                    name:
                        'BASIC MISSILE',

                    damage: 1,

                    flightDurationMs:
                        12000,
                });

                expect(
                    MISSILES[
                        MISSILE_ID.BASIC_01
                    ],
                ).toEqual({
                    id:
                        MISSILE_ID.BASIC_01,

                    name:
                        'BASIC MISSILE II',

                    damage: 1,

                    flightDurationMs:
                        12000,
                });
            },
        );

`;

        source =
            source.slice(0, start) +
            replacement +
            source.slice(nextTest);

        write(rel, source);
    }
}

// ---------------------------------------------------------------------------
// 6. Guards for the exact compile failures this recovery owns.
// ---------------------------------------------------------------------------

const combatModel =
    read(
        'src/engine/encounter/model/combat.ts',
    );

if (
    !combatModel.includes(
        'signature: MissileSignature;',
    )
) {
    fail(
        'MissileCombatProjectileState still has no runtime signature',
    );
}

const combatRunner =
    read(
        'src/engine/encounter/combat/CombatRunner.ts',
    );

{
    const start =
        combatRunner.indexOf(
            'this.missileRunner =',
        );

    const end =
        combatRunner.indexOf(
            '});',
            start,
        );

    const block =
        combatRunner.slice(
            start,
            end,
        );

    if (!/\brandom\s*,/.test(block)) {
        fail(
            'CombatRunner still does not pass random to CombatMissileRunner',
        );
    }
}

const srcForbidden = [
    'MISSILE_SIGNATURE.RED',
    'MISSILE_SIGNATURE.BLUE',
    'DEFENSE_TURRET_SIGNATURE.RED',
    'DEFENSE_TURRET_SIGNATURE.BLUE',
];

for (
    const rootRel of
    ['src', 'tests']
) {
    const root = abs(rootRel);

    for (const target of walk(root)) {
        if (
            !['.ts', '.json']
                .includes(
                    path.extname(target),
                )
        ) {
            continue;
        }

        const source =
            fs.readFileSync(
                target,
                'utf8',
            );

        for (
            const token of
            srcForbidden
        ) {
            if (
                source.includes(token)
            ) {
                fail(
                    `Stale signature member "${token}" survived in ` +
                    path.relative(
                        ROOT,
                        target,
                    ),
                );
            }
        }
    }
}

console.log(
    'Missile atom 01 compile recovery 02 applied.',
);
console.log('');
console.log('Next gate:');
console.log('  npm run typecheck');
console.log('');
console.log(
    'If new errors appear, send that output before tests.',
);
