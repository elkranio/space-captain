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

function ensureMissileSignatureImport(source, importPath) {
    if (source.includes('MISSILE_SIGNATURE')) {
        return source;
    }

    const importRe =
        new RegExp(
            `import \\{([\\s\\S]*?)\\} from ['"]${importPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"];`,
        );

    const match = importRe.exec(source);

    if (match) {
        const before = match[0];
        const inner = match[1];

        const after =
            before.replace(
                inner,
                `\n    MISSILE_SIGNATURE,${inner}`,
            );

        return source.replace(before, after);
    }

    // If there is no existing missile import, prepend a dedicated one.
    return (
        `import {\n    MISSILE_SIGNATURE,\n} from '${importPath}';\n` +
        source
    );
}

// ---------------------------------------------------------------------------
// 1. Add runtime truth field to the correct type block only.
// ---------------------------------------------------------------------------

{
    const rel =
        'src/engine/encounter/model/combat.ts';

    let source = read(rel);

    const start =
        source.indexOf(
            'export type MissileCombatProjectileState = {',
        );

    const end =
        source.indexOf(
            '\n};',
            start,
        );

    if (start < 0 || end < 0) {
        fail(
            'Cannot locate MissileCombatProjectileState block',
        );
    }

    const block =
        source.slice(start, end);

    if (
        !/\n\s+signature:\s*MissileSignature;/.test(
            block,
        )
    ) {
        const targetMatch =
            /(\r?\n\s+target: CombatTarget;\r?\n)/.exec(
                block,
            );

        if (!targetMatch) {
            fail(
                'Cannot locate target field inside MissileCombatProjectileState',
            );
        }

        const insertAt =
            start +
            targetMatch.index +
            targetMatch[0].length;

        source =
            source.slice(0, insertAt) +
`
    // Objective hidden truth of this concrete projectile.
    // missileId identifies ammo model and cannot reveal this value.
    signature: MissileSignature;
` +
            source.slice(insertAt);

        write(rel, source);
    }
}

// ---------------------------------------------------------------------------
// 2. Remove stale unused import from content test.
// ---------------------------------------------------------------------------

{
    const rel =
        'tests/engine/content/weapon_missile_tuning.test.ts';

    let source = read(rel);

    source = source.replace(
        /^\s*MISSILE_SIGNATURE,\r?\n/m,
        '',
    );

    write(rel, source);
}

// ---------------------------------------------------------------------------
// 3. Replace remaining static missile-definition signature assumptions.
// ---------------------------------------------------------------------------

{
    const rel =
        'tests/engine/encounter/enemy_spam_slowdown.test.ts';

    let source = read(rel);

    source = source.replace(
        /MISSILES\[\s*MISSILE_ID\.BASIC_00\s*\]\s*\.signature/g,
        'MISSILE_SIGNATURE.A',
    );

    source = source.replace(
        /MISSILES\[\s*MISSILE_ID\.BASIC_01\s*\]\s*\.signature/g,
        'MISSILE_SIGNATURE.B',
    );

    if (source.includes('MISSILE_SIGNATURE.')) {
        source =
            ensureMissileSignatureImport(
                source,
                '../../../src/engine/defs/missile',
            );
    }

    write(rel, source);
}

// ---------------------------------------------------------------------------
// 4. Test fixtures: runtime missile projectile now requires signature.
// Add a deterministic A signature only to obvious missile projectile literals
// that don't already contain one.
// ---------------------------------------------------------------------------

const testsRoot = abs('tests');

for (const target of walk(testsRoot)) {
    if (path.extname(target) !== '.ts') {
        continue;
    }

    let source =
        fs.readFileSync(target, 'utf8');

    let changed = false;

    // Find object literals that clearly declare missile projectile kind.
    // We inspect a bounded region around the kind declaration and insert the
    // field before `identification` when it is absent.
    const kindPattern =
        /kind:\s*\r?\n?\s*COMBAT_PROJECTILE_KIND(?:\r?\n\s*)?\.MISSILE,/g;

    const matches = [
        ...source.matchAll(kindPattern),
    ].reverse();

    for (const match of matches) {
        const kindIndex =
            match.index ?? 0;

        const objectStart =
            source.lastIndexOf(
                '{',
                kindIndex,
            );

        const identificationIndex =
            source.indexOf(
                'identification:',
                kindIndex,
            );

        if (
            objectStart < 0 ||
            identificationIndex < 0 ||
            identificationIndex -
                kindIndex >
                1500
        ) {
            continue;
        }

        const region =
            source.slice(
                objectStart,
                identificationIndex,
            );

        if (
            /\bsignature\s*:/.test(
                region,
            )
        ) {
            continue;
        }

        // This fixture uses the new runtime truth. Keep it deterministic.
        source =
            source.slice(
                0,
                identificationIndex,
            ) +
`signature:
                MISSILE_SIGNATURE.A,

            ` +
            source.slice(
                identificationIndex,
            );

        changed = true;
    }

    if (!changed) {
        continue;
    }

    // Most encounter tests already import MISSILE_ID from this module.
    const rel =
        path.relative(
            ROOT,
            target,
        ).replaceAll('\\', '/');

    let importPath;

    if (
        rel.startsWith(
            'tests/engine/encounter/',
        )
    ) {
        importPath =
            '../../../src/engine/defs/missile';
    } else if (
        rel.startsWith(
            'tests/app/',
        )
    ) {
        importPath =
            '../../src/engine/defs/missile';
    } else {
        fail(
            `Need missile import path for changed fixture: ${rel}`,
        );
    }

    source =
        ensureMissileSignatureImport(
            source,
            importPath,
        );

    fs.writeFileSync(
        target,
        source,
        'utf8',
    );
}

// ---------------------------------------------------------------------------
// Guards.
// ---------------------------------------------------------------------------

{
    const rel =
        'src/engine/encounter/model/combat.ts';

    const source = read(rel);

    const start =
        source.indexOf(
            'export type MissileCombatProjectileState = {',
        );

    const end =
        source.indexOf(
            '\n};',
            start,
        );

    const block =
        source.slice(start, end);

    if (
        !/\n\s+signature:\s*MissileSignature;/.test(
            block,
        )
    ) {
        fail(
            'Runtime signature still missing from MissileCombatProjectileState',
        );
    }
}

const forbiddenStaticTruth =
    /\.missileId\s*\]\s*\.signature|MISSILES\[[\s\S]{0,120}\]\s*\.signature/;

for (const target of walk(abs('src'))) {
    if (path.extname(target) !== '.ts') {
        continue;
    }

    const source =
        fs.readFileSync(
            target,
            'utf8',
        );

    if (
        forbiddenStaticTruth.test(
            source,
        )
    ) {
        fail(
            'Static missile signature derivation survived in ' +
            path.relative(
                ROOT,
                target,
            ),
        );
    }
}

console.log(
    'Missile atom 01 compile recovery 03 applied.',
);
console.log('');
console.log('Next gate:');
console.log('  npm run typecheck');
console.log('');
console.log(
    'Send the output before running tests.',
);
