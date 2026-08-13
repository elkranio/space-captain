import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const rel =
    'tests/engine/encounter/weapons_defense_turret_command.test.ts';
const target =
    path.join(ROOT, rel);

if (!fs.existsSync(target)) {
    throw new Error(`Missing file: ${rel}`);
}

let source =
    fs.readFileSync(target, 'utf8');

const title =
    "'spends one charge and leaves a $missileLabel missile active after a $beamLabel";

const start =
    source.indexOf(title);

if (start < 0) {
    throw new Error('Cannot find defense-turret miss table');
}

const beamCommandIndex =
    source.indexOf(
        '            const beamCommand =',
        start,
    );

if (beamCommandIndex < 0) {
    throw new Error('Cannot find beamCommand in miss table');
}

const before =
    source.slice(
        start,
        beamCommandIndex,
    );

if (
    !/projectiles\[0\][\s\S]{0,220}\.signature\s*=\s*signature\s*===/.test(
        before,
    )
) {
    const insertion =
`            state.combat
                .projectiles[0]
                .signature =
                signature ===
                DEFENSE_TURRET_SIGNATURE.A
                    ? DEFENSE_TURRET_SIGNATURE.B
                    : DEFENSE_TURRET_SIGNATURE.A;

`;

    source =
        source.slice(
            0,
            beamCommandIndex,
        ) +
        insertion +
        source.slice(
            beamCommandIndex,
        );

    fs.writeFileSync(
        target,
        source,
        'utf8',
    );
}

console.log(
    'Missile atom 01 final miss baseline applied.',
);
console.log('');
console.log('Run:');
console.log('  npm run typecheck');
console.log('  npm test');
