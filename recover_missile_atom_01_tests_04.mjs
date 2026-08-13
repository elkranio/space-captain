import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

function fail(message) {
    throw new Error(message);
}

function abs(rel) {
    return path.join(ROOT, rel);
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

function readFile(target) {
    return fs.readFileSync(target, 'utf8');
}

function writeFile(target, source) {
    fs.writeFileSync(target, source, 'utf8');
}

function toModulePath(fromFile, targetFileWithoutExtension) {
    let rel = path.relative(
        path.dirname(fromFile),
        targetFileWithoutExtension,
    );

    rel = rel.replaceAll('\\', '/');

    if (!rel.startsWith('.')) {
        rel = './' + rel;
    }

    return rel;
}

function ensureMissileSignatureImport(target, source) {
    if (!/\bMISSILE_SIGNATURE\b/.test(source)) {
        return source;
    }

    // Already imported somewhere.
    const imported =
        /import\s*\{[\s\S]*?\bMISSILE_SIGNATURE\b[\s\S]*?\}\s*from\s*['"][^'"]+defs\/missile['"];/.test(
            source,
        );

    if (imported) {
        return source;
    }

    // Prefer extending an existing import from defs/missile.
    const missileImport =
        /import\s*\{([\s\S]*?)\}\s*from\s*(['"])([^'"]*defs\/missile)\2;/m;

    const match = missileImport.exec(source);

    if (match) {
        const full = match[0];
        const inner = match[1];

        const nextInner =
            `\n    MISSILE_SIGNATURE,` +
            inner;

        return source.replace(
            full,
            full.replace(
                inner,
                nextInner,
            ),
        );
    }

    // No existing missile import: calculate the path from this test file.
    const missileModule =
        path.join(
            ROOT,
            'src',
            'engine',
            'defs',
            'missile',
        );

    const modulePath =
        toModulePath(
            target,
            missileModule,
        );

    return (
        `import {\n` +
        `    MISSILE_SIGNATURE,\n` +
        `} from '${modulePath}';\n` +
        source
    );
}

function replaceStaticSignatureReads(source) {
    // Runtime signature no longer exists in MISSILES content.
    // Any test that used the old static signature simply needs an explicit
    // deterministic fixture value for atom 01.
    return source.replace(
        /MISSILES\s*\[\s*([^\]]+?)\s*\]\s*\.signature/g,
        (_match, key) => {
            const normalized =
                String(key);

            if (
                normalized.includes(
                    'BASIC_01',
                )
            ) {
                return 'MISSILE_SIGNATURE.B';
            }

            return 'MISSILE_SIGNATURE.A';
        },
    );
}

function addMissingProjectileFixtureSignatures(source) {
    // Insert runtime truth before `identification` in missile projectile
    // literals that still lack the required field.
    //
    // We deliberately operate on bounded regions from a missile-kind marker
    // to the next identification field; this avoids touching unrelated objects.
    const marker =
        /kind:\s*(?:\r?\n\s*)?COMBAT_PROJECTILE_KIND(?:\r?\n\s*)?\.MISSILE,/g;

    const matches =
        [...source.matchAll(marker)]
            .reverse();

    let next = source;

    for (const match of matches) {
        const kindIndex =
            match.index ?? -1;

        if (kindIndex < 0) {
            continue;
        }

        const identificationIndex =
            next.indexOf(
                'identification:',
                kindIndex,
            );

        if (
            identificationIndex < 0 ||
            identificationIndex -
                kindIndex >
                1800
        ) {
            continue;
        }

        const region =
            next.slice(
                kindIndex,
                identificationIndex,
            );

        if (
            /\bsignature\s*:/.test(
                region,
            )
        ) {
            continue;
        }

        // Make sure this really looks like the missile projectile state,
        // not an enum-like test object.
        if (
            !/\bsourceWeaponId\s*:/.test(
                region,
            ) ||
            !/\btarget\s*:/.test(
                region,
            )
        ) {
            continue;
        }

        const lineStart =
            next.lastIndexOf(
                '\n',
                identificationIndex,
            ) + 1;

        const indentMatch =
            /^(\s*)/.exec(
                next.slice(
                    lineStart,
                    identificationIndex,
                ),
            );

        const indent =
            indentMatch?.[1] ?? '';

        const insertion =
            `${indent}signature:\n` +
            `${indent}    MISSILE_SIGNATURE.A,\n\n`;

        next =
            next.slice(
                0,
                lineStart,
            ) +
            insertion +
            next.slice(
                lineStart,
            );
    }

    return next;
}

const testsRoot =
    abs('tests');

for (const target of walk(testsRoot)) {
    if (path.extname(target) !== '.ts') {
        continue;
    }

    let source =
        readFile(target);

    let next =
        replaceStaticSignatureReads(
            source,
        );

    next =
        addMissingProjectileFixtureSignatures(
            next,
        );

    next =
        ensureMissileSignatureImport(
            target,
            next,
        );

    if (next !== source) {
        writeFile(
            target,
            next,
        );
    }
}

// ---------------------------------------------------------------------------
// Guards for the exact failures from typecheck.
// ---------------------------------------------------------------------------

for (const target of walk(testsRoot)) {
    if (path.extname(target) !== '.ts') {
        continue;
    }

    const source =
        readFile(target);

    if (
        /MISSILES\s*\[\s*[^\]]+?\s*\]\s*\.signature/.test(
            source,
        )
    ) {
        fail(
            'Static MISSILES[...].signature survived in ' +
            path.relative(
                ROOT,
                target,
            ),
        );
    }

    if (
        /\bMISSILE_SIGNATURE\b/.test(
            source,
        ) &&
        !/import\s*\{[\s\S]*?\bMISSILE_SIGNATURE\b[\s\S]*?\}\s*from\s*['"][^'"]+defs\/missile['"];/.test(
            source,
        )
    ) {
        fail(
            'MISSILE_SIGNATURE is used without import in ' +
            path.relative(
                ROOT,
                target,
            ),
        );
    }

    const marker =
        /kind:\s*(?:\r?\n\s*)?COMBAT_PROJECTILE_KIND(?:\r?\n\s*)?\.MISSILE,/g;

    for (
        const match of
        source.matchAll(marker)
    ) {
        const kindIndex =
            match.index ?? -1;

        if (kindIndex < 0) {
            continue;
        }

        const identificationIndex =
            source.indexOf(
                'identification:',
                kindIndex,
            );

        if (
            identificationIndex < 0 ||
            identificationIndex -
                kindIndex >
                1800
        ) {
            continue;
        }

        const region =
            source.slice(
                kindIndex,
                identificationIndex,
            );

        if (
            /\bsourceWeaponId\s*:/.test(
                region,
            ) &&
            /\btarget\s*:/.test(
                region,
            ) &&
            !/\bsignature\s*:/.test(
                region,
            )
        ) {
            fail(
                'Missile projectile fixture still lacks signature in ' +
                path.relative(
                    ROOT,
                    target,
                ),
            );
        }
    }
}

console.log(
    'Missile atom 01 test compile recovery 04 applied.',
);
console.log('');
console.log('Next gate:');
console.log('  npm run typecheck');
console.log('');
console.log(
    'If green, run npm test and send the failures.',
);
