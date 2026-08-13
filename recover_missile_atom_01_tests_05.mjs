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
    const out = [];

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const target = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            out.push(...walk(target));
        } else {
            out.push(target);
        }
    }

    return out;
}

function read(target) {
    return fs.readFileSync(target, 'utf8');
}

function write(target, source) {
    fs.writeFileSync(target, source, 'utf8');
}

function modulePath(fromFile, toWithoutExtension) {
    let rel = path.relative(
        path.dirname(fromFile),
        toWithoutExtension,
    ).replaceAll('\\', '/');

    if (!rel.startsWith('.')) {
        rel = './' + rel;
    }

    return rel;
}

function stripMissileSignatureFromWrongImports(source) {
    // Remove MISSILE_SIGNATURE from every named import whose module is NOT
    // defs/missile. Works with single-line and multiline imports.
    return source.replace(
        /import\s*\{([\s\S]*?)\}\s*from\s*(['"])([^'"]+)\2;/g,
        (full, inner, quote, moduleName) => {
            if (!/\bMISSILE_SIGNATURE\b/.test(inner)) {
                return full;
            }

            if (
                /(?:^|\/)defs\/missile$/.test(
                    moduleName,
                )
            ) {
                return full;
            }

            let cleaned = inner
                .replace(
                    /(^|[\r\n]\s*)MISSILE_SIGNATURE\s*,?\s*/g,
                    '$1',
                )
                .replace(
                    /,\s*MISSILE_SIGNATURE\b/g,
                    '',
                )
                .replace(
                    /\bMISSILE_SIGNATURE\s*,/g,
                    '',
                );

            // Normalize accidental "{ , foo }" shapes.
            cleaned = cleaned
                .replace(/\{\s*,/g, '{')
                .replace(/,\s*,/g, ',');

            return `import {${cleaned}} from ${quote}${moduleName}${quote};`;
        },
    );
}

function hasCorrectMissileSignatureImport(source) {
    return /import\s*\{[\s\S]*?\bMISSILE_SIGNATURE\b[\s\S]*?\}\s*from\s*['"][^'"]*(?:^|\/)defs\/missile['"];/.test(
        source,
    );
}

function addDedicatedCorrectImport(target, source) {
    if (!/\bMISSILE_SIGNATURE\b/.test(source)) {
        return source;
    }

    if (hasCorrectMissileSignatureImport(source)) {
        return source;
    }

    const missileModule = path.join(
        ROOT,
        'src',
        'engine',
        'defs',
        'missile',
    );

    const importPath =
        modulePath(
            target,
            missileModule,
        );

    const importLine =
`import {
    MISSILE_SIGNATURE,
} from '${importPath}';
`;

    return importLine + source;
}

function replaceStaticMissileSignatureReads(source) {
    // Covers compact and multiline property access:
    //
    // MISSILES[
    //   MISSILE_ID.BASIC_00
    // ]
    //   .signature
    //
    return source.replace(
        /MISSILES\s*\[\s*([\s\S]*?)\s*\]\s*\.signature/g,
        (_full, key) => {
            return String(key)
                .includes('BASIC_01')
                ? 'MISSILE_SIGNATURE.B'
                : 'MISSILE_SIGNATURE.A';
        },
    );
}

function addSignatureToMapperFactory(source) {
    // The remaining error is a helper returning MissileCombatProjectileState.
    // Find return object near the line that contains:
    // kind: COMBAT_PROJECTILE_KIND.MISSILE
    // and insert signature before identification if absent.
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
                2400
        ) {
            continue;
        }

        const region =
            next.slice(
                kindIndex,
                identificationIndex,
            );

        if (
            !/\bsourceWeaponId\s*:/.test(
                region,
            ) ||
            !/\btarget\s*:/.test(
                region,
            ) ||
            /\bsignature\s*:/.test(
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

        const linePrefix =
            next.slice(
                lineStart,
                identificationIndex,
            );

        const indent =
            /^(\s*)/.exec(
                linePrefix,
            )?.[1] ?? '';

        const insertion =
`${indent}signature:
${indent}    MISSILE_SIGNATURE.A,

`;

        next =
            next.slice(0, lineStart) +
            insertion +
            next.slice(lineStart);
    }

    return next;
}

const testsRoot = abs('tests');

for (const target of walk(testsRoot)) {
    if (path.extname(target) !== '.ts') {
        continue;
    }

    let source = read(target);

    source =
        stripMissileSignatureFromWrongImports(
            source,
        );

    source =
        replaceStaticMissileSignatureReads(
            source,
        );

    source =
        addSignatureToMapperFactory(
            source,
        );

    source =
        addDedicatedCorrectImport(
            target,
            source,
        );

    write(target, source);
}

// ---------------------------------------------------------------------------
// Guards.
// ---------------------------------------------------------------------------

for (const target of walk(testsRoot)) {
    if (path.extname(target) !== '.ts') {
        continue;
    }

    const source = read(target);
    const rel = path
        .relative(ROOT, target)
        .replaceAll('\\', '/');

    const imports =
        [...source.matchAll(
            /import\s*\{([\s\S]*?)\}\s*from\s*(['"])([^'"]+)\2;/g,
        )];

    for (const match of imports) {
        const inner =
            match[1];
        const moduleName =
            match[3];

        if (
            /\bMISSILE_SIGNATURE\b/.test(
                inner,
            ) &&
            !/(?:^|\/)defs\/missile$/.test(
                moduleName,
            )
        ) {
            fail(
                `MISSILE_SIGNATURE still imported from wrong module in ${rel}: ${moduleName}`,
            );
        }
    }

    if (
        /\bMISSILE_SIGNATURE\b/.test(
            source,
        ) &&
        !hasCorrectMissileSignatureImport(
            source,
        )
    ) {
        fail(
            `MISSILE_SIGNATURE used without correct defs/missile import in ${rel}`,
        );
    }

    if (
        /MISSILES\s*\[\s*[\s\S]*?\s*\]\s*\.signature/.test(
            source,
        )
    ) {
        fail(
            `Static MISSILES[...].signature survived in ${rel}`,
        );
    }
}

// Specific guard for the one remaining mapper helper.
{
    const target =
        abs(
            'tests/app/BridgeCaptainCombatContextMapper.test.ts',
        );

    const source =
        read(target);

    const marker =
        source.indexOf(
            'COMBAT_PROJECTILE_KIND',
        );

    if (
        marker >= 0 &&
        !source.includes(
            'signature:',
        )
    ) {
        fail(
            'BridgeCaptainCombatContextMapper missile fixture still has no signature',
        );
    }
}

console.log(
    'Missile atom 01 test import recovery 05 applied.',
);
console.log('');
console.log('Next gate:');
console.log('  npm run typecheck');
console.log('');
console.log(
    'If green: npm test',
);
