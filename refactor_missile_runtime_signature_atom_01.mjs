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

function write(rel, content) {
    fs.writeFileSync(file(rel), content, 'utf8');
}

function replaceOnce(rel, before, after) {
    const source = read(rel);
    const count = source.split(before).length - 1;

    if (count !== 1) {
        fail(
            `Expected exactly one match in ${rel}, found ${count}:\n` +
            before.slice(0, 240),
        );
    }

    write(rel, source.replace(before, after));
}

function replaceRegexOnce(rel, pattern, replacement) {
    const source = read(rel);
    const matches = source.match(new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g')) ?? [];

    if (matches.length !== 1) {
        fail(
            `Expected exactly one regex match in ${rel}, found ${matches.length}: ${pattern}`,
        );
    }

    write(rel, source.replace(pattern, replacement));
}

function walk(dir) {
    const result = [];

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const absolute = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            result.push(...walk(absolute));
            continue;
        }

        result.push(absolute);
    }

    return result;
}

function replaceEverywhere(rootRel, replacements) {
    const root = file(rootRel);

    if (!fs.existsSync(root)) {
        return;
    }

    const allowed = new Set(['.ts', '.json']);
    const files = walk(root).filter((target) => allowed.has(path.extname(target)));

    for (const target of files) {
        let source = fs.readFileSync(target, 'utf8');
        let next = source;

        for (const [before, after] of replacements) {
            next = next.split(before).join(after);
        }

        if (next !== source) {
            fs.writeFileSync(target, next, 'utf8');
        }
    }
}

const semanticRenames = [
    ['resolve_enemy_defense_turret_beam_band', 'resolve_enemy_defense_turret_signature'],
    ['resolveEnemyDefenseTurretBeamBand', 'resolveEnemyDefenseTurretSignature'],
    ['ResolveEnemyDefenseTurretBeamBand', 'ResolveEnemyDefenseTurretSignature'],

    ['MISSILE_SPECTRAL_BAND', 'MISSILE_SIGNATURE'],
    ['MissileSpectralBand', 'MissileSignature'],
    ['spectralBand', 'signature'],

    ['DEFENSE_TURRET_BEAM_BAND', 'DEFENSE_TURRET_SIGNATURE'],
    ['DefenseTurretBeamBand', 'DefenseTurretSignature'],
    ['defenseTurretBeamBand', 'defenseTurretSignature'],
    ['loadedBand', 'loadedSignature'],
    ['fallbackBeamBand', 'fallbackSignature'],
    ['beamBand', 'signature'],

    ['WEAPONS_FIRE_RED_BEAM', 'WEAPONS_FIRE_SIGNATURE_A'],
    ['WEAPONS_FIRE_BLUE_BEAM', 'WEAPONS_FIRE_SIGNATURE_B'],
    ['weapons_fire_red_beam', 'weapons_fire_signature_a'],
    ['weapons_fire_blue_beam', 'weapons_fire_signature_b'],
    ['weaponsFireRedBeam', 'weaponsFireSignatureA'],
    ['weaponsFireBlueBeam', 'weaponsFireSignatureB'],

    ['MISSILE_ID.RED_00', 'MISSILE_ID.BASIC_00'],
    ['MISSILE_ID.BLUE_00', 'MISSILE_ID.BASIC_01'],
    ['red_00', 'basic_00'],
    ['blue_00', 'basic_01'],

    ['RED BEAM', 'SIGNATURE A'],
    ['BLUE BEAM', 'SIGNATURE B'],
    ['Red-band Missile', 'Basic Missile'],
    ['Blue-band Missile', 'Basic Missile II'],
    ['RED-BAND MISSILE', 'BASIC MISSILE'],
    ['BLUE-BAND MISSILE', 'BASIC MISSILE II'],
];

// Mechanical vocabulary migration first. Explicit rewrites below then remove
// the static signature leak and establish projectile truth.
replaceEverywhere('src', semanticRenames);
replaceEverywhere('tests', semanticRenames);

const oldResolverPath =
    'src/engine/encounter/combat/defense_turret/resolve_enemy_defense_turret_beam_band.ts';
const newResolverPath =
    'src/engine/encounter/combat/defense_turret/resolve_enemy_defense_turret_signature.ts';

if (fs.existsSync(file(oldResolverPath))) {
    if (fs.existsSync(file(newResolverPath))) {
        fail(`Both old and new turret resolver files exist`);
    }

    fs.renameSync(
        file(oldResolverPath),
        file(newResolverPath),
    );
}

// ---------------------------------------------------------------------------
// Missile content: model identity is now independent from runtime signature.
// ---------------------------------------------------------------------------

write(
    'src/engine/defs/missile.ts',
`// src/engine/defs/missile.ts

// Hidden runtime property of one concrete missile projectile.
// It is intentionally not part of MissileDefinition.
export const MISSILE_SIGNATURE = {
    A: 'signature_a',
    B: 'signature_b',
} as const;

export type MissileSignature =
    (typeof MISSILE_SIGNATURE)[keyof typeof MISSILE_SIGNATURE];

export const MISSILE_ID = {
    BASIC_00: 'basic_00',
    BASIC_01: 'basic_01',
} as const;

export type MissileId =
    (typeof MISSILE_ID)[keyof typeof MISSILE_ID];

export type MissileDefinition = {
    id: MissileId;
    name: string;

    damage: number;
    flightDurationMs: number;
};
`,
);

write(
    'src/engine/content/data/missiles.json',
`{
    "basic_00": {
        "name": "BASIC MISSILE",
        "damage": 1,
        "flightDurationMs": 12000
    },
    "basic_01": {
        "name": "BASIC MISSILE II",
        "damage": 1,
        "flightDurationMs": 12000
    }
}
`,
);

write(
    'src/engine/content/schemas/missiles.ts',
`// src/engine/content/schemas/missiles.ts

import * as z from 'zod';
import {
    MISSILE_ID,
} from '../../defs/missile';

const MISSILE_NAME_SCHEMA =
    z.string()
        .min(1)
        .meta({
            title: 'Name',
        });

const DAMAGE_SCHEMA =
    z.number()
        .int()
        .nonnegative()
        .meta({
            title: 'Damage',
        });

const FLIGHT_DURATION_SCHEMA =
    z.number()
        .int()
        .nonnegative()
        .meta({
            title:
                'Flight duration',
            unit: 'ms',
            'x-editor-control':
                'duration',
        });

export const MISSILE_TUNING_SCHEMA =
    z.strictObject({
        [MISSILE_ID.BASIC_00]:
            z.strictObject({
                name:
                    MISSILE_NAME_SCHEMA,

                damage:
                    DAMAGE_SCHEMA,

                flightDurationMs:
                    FLIGHT_DURATION_SCHEMA,
            }).meta({
                title:
                    'Basic Missile',
            }),

        [MISSILE_ID.BASIC_01]:
            z.strictObject({
                name:
                    MISSILE_NAME_SCHEMA,

                damage:
                    DAMAGE_SCHEMA,

                flightDurationMs:
                    FLIGHT_DURATION_SCHEMA,
            }).meta({
                title:
                    'Basic Missile II',
            }),
    });

export type MissileTuningData =
    z.infer<
        typeof MISSILE_TUNING_SCHEMA
    >;
`,
);

// Catalog structure survives; only neutral ids remain.
const missileCatalog =
    'src/engine/content/catalogs/missiles.ts';

if (
    read(missileCatalog).includes('signature') ||
    read(missileCatalog).includes('RED_00') ||
    read(missileCatalog).includes('BLUE_00')
) {
    fail(
        'Missile catalog still exposes legacy signature/color data after mechanical rename',
    );
}

// ---------------------------------------------------------------------------
// Defense turret still uses A/B signature matching for this one transition
// atom. Atom 02 removes the choice and replaces it with explicit blind chance.
// ---------------------------------------------------------------------------

const defenseTurretPath =
    'src/engine/defs/defense_turret.ts';

let defenseTurret = read(defenseTurretPath);

defenseTurret = defenseTurret.replace(
`export const DEFENSE_TURRET_SIGNATURE = {
    RED: 'red',
    BLUE: 'blue',
} as const;

export type DefenseTurretSignature =
    (typeof DEFENSE_TURRET_SIGNATURE)[keyof typeof DEFENSE_TURRET_SIGNATURE];
`,
`import {
    MISSILE_SIGNATURE,
    type MissileSignature,
} from './missile';

// Transitional targeting domain.
// Atom 02 removes signature selection from the turret completely.
export const DEFENSE_TURRET_SIGNATURE =
    MISSILE_SIGNATURE;

export type DefenseTurretSignature =
    MissileSignature;
`,
);

defenseTurret = defenseTurret
    .replaceAll('DEFENSE_TURRET_SIGNATURE.RED', 'DEFENSE_TURRET_SIGNATURE.A')
    .replaceAll('DEFENSE_TURRET_SIGNATURE.BLUE', 'DEFENSE_TURRET_SIGNATURE.B')
    .replace(
        '// loadedSignature and targetProjectileId remain null outside an active load.',
        '// loadedSignature and targetProjectileId remain null outside an active load.',
    );

write(defenseTurretPath, defenseTurret);

// Any remaining RED/BLUE members in turret source would preserve the old color model.
if (
    read(defenseTurretPath).includes(`RED: 'red'`) ||
    read(defenseTurretPath).includes(`BLUE: 'blue'`)
) {
    fail('Legacy defense-turret color constants survived');
}

// Mechanical rename changed references to .RED/.BLUE but not member names.
replaceEverywhere('src', [
    ['DEFENSE_TURRET_SIGNATURE.RED', 'DEFENSE_TURRET_SIGNATURE.A'],
    ['DEFENSE_TURRET_SIGNATURE.BLUE', 'DEFENSE_TURRET_SIGNATURE.B'],
]);
replaceEverywhere('tests', [
    ['DEFENSE_TURRET_SIGNATURE.RED', 'DEFENSE_TURRET_SIGNATURE.A'],
    ['DEFENSE_TURRET_SIGNATURE.BLUE', 'DEFENSE_TURRET_SIGNATURE.B'],
]);

// ---------------------------------------------------------------------------
// Runtime projectile truth.
// ---------------------------------------------------------------------------

const combatModel =
    'src/engine/encounter/model/combat.ts';

replaceOnce(
    combatModel,
`    target: CombatTarget;

    // Знание игрока о свойствах угрозы.
`,
`    target: CombatTarget;

    // Objective hidden truth of this concrete projectile.
    // missileId identifies the ammo model and cannot reveal this value.
    signature: MissileSignature;

    // Знание игрока о свойствах угрозы.
`,
);

const missileRunner =
    'src/engine/encounter/combat/weapons/missile/CombatMissileRunner.ts';

replaceOnce(
    missileRunner,
`import type { MissileId } from '../../../../defs/missile';`,
`import {
    MISSILE_SIGNATURE,
    type MissileId,
    type MissileSignature,
} from '../../../../defs/missile';`,
);

replaceOnce(
    missileRunner,
`    identities: CombatRuntimeIdentityFactory;
    emit: (event: EncounterEvent) => void;
`,
`    identities: CombatRuntimeIdentityFactory;
    random: () => number;
    emit: (event: EncounterEvent) => void;
`,
);

replaceOnce(
    missileRunner,
`    private readonly emit:
        (event: EncounterEvent) => void;
`,
`    private readonly random:
        () => number;

    private readonly emit:
        (event: EncounterEvent) => void;
`,
);

replaceOnce(
    missileRunner,
`        identities,
        emit,
        destroyEnemyActor,
`,
`        identities,
        random,
        emit,
        destroyEnemyActor,
`,
);

replaceOnce(
    missileRunner,
`        this.identities = identities;
        this.emit = emit;
`,
`        this.identities = identities;
        this.random = random;
        this.emit = emit;
`,
);

const missileLookupNeedle =
`        const missile = MISSILES[missileId];
`;

replaceOnce(
    missileRunner,
    missileLookupNeedle,
`        const missile = MISSILES[missileId];
        const signature =
            this.createMissileSignature();
`,
);

replaceOnce(
    missileRunner,
`                target: {
                    kind:
                        COMBAT_TARGET_KIND
                            .PLAYER_SHIP,
                },

                identification: {
`,
`                target: {
                    kind:
                        COMBAT_TARGET_KIND
                            .PLAYER_SHIP,
                },

                signature,

                identification: {
`,
);

replaceOnce(
    missileRunner,
`        const missile =
            MISSILES[launch.missileId];

        const projectile:
`,
`        const missile =
            MISSILES[launch.missileId];

        const signature =
            this.createMissileSignature();

        const projectile:
`,
);

replaceOnce(
    missileRunner,
`                target: {
                    kind:
                        COMBAT_TARGET_KIND.ACTOR,

                    actorId:
                        launch.targetActorId,
                },

                identification: {
`,
`                target: {
                    kind:
                        COMBAT_TARGET_KIND.ACTOR,

                    actorId:
                        launch.targetActorId,
                },

                signature,

                identification: {
`,
);

replaceOnce(
    missileRunner,
`                    signature:
                        missile.signature,
`,
`                    signature,
`,
);

replaceOnce(
    missileRunner,
`    private advanceIncomingMissile(
`,
`    private createMissileSignature():
        MissileSignature {
        return this.random() < 0.5
            ? MISSILE_SIGNATURE.A
            : MISSILE_SIGNATURE.B;
    }

    private advanceIncomingMissile(
`,
);

const combatRunner =
    'src/engine/encounter/combat/CombatRunner.ts';

replaceOnce(
    combatRunner,
`                identities:
                    this.identities,

                emit:
                    this.emit,
`,
`                identities:
                    this.identities,

                random,

                emit:
                    this.emit,
`,
);

// ---------------------------------------------------------------------------
// Truth consumers: no one may derive signature from missileId anymore.
// ---------------------------------------------------------------------------

const playerShipStore =
    'src/engine/encounter/state/player/PlayerShipStore.ts';

let playerStore = read(playerShipStore);

playerStore = playerStore.replace(
`import {
    MISSILES,
} from '../../../content/catalogs/missiles';
`,
'',
);

playerStore = playerStore.replace(
/const signature =\s*MISSILES\[\s*projectile\.missileId\s*\]\.signature;/,
`const signature =
                projectile.signature;`,
);

playerStore = playerStore.replace(
/const missile =\s*MISSILES\[\s*threat\.missileId\s*\];\s*\n\s*const outcome =\s*\n\s*missile\.signature ===\s*\n\s*signature/,
`const outcome =
            threat.signature ===
            signature`,
);

write(playerShipStore, playerStore);

if (read(playerShipStore).includes('MISSILES[')) {
    fail(
        'PlayerShipStore still derives missile truth from MISSILES catalog',
    );
}

const enemyScience =
    'src/engine/encounter/combat/enemy/intel/EnemyScienceIntelResolver.ts';

let science = read(enemyScience);

science = science.replace(
`import {
    MISSILES,
} from '../../../../content/catalogs/missiles';
`,
'',
);

science = science.replace(
/signature:\s*MISSILES\[\s*projectile\.missileId\s*\]\.signature,/,
`signature:
                projectile.signature,`,
);

write(enemyScience, science);

if (read(enemyScience).includes('MISSILES[')) {
    fail(
        'EnemyScienceIntelResolver still derives missile truth from MISSILES catalog',
    );
}

const enemyTurret =
    'src/engine/encounter/combat/defense_turret/EnemyDefenseTurretRunner.ts';

let turretRunner = read(enemyTurret);

turretRunner = turretRunner.replace(
`import {
    MISSILES,
} from '../../../content/catalogs/missiles';
`,
'',
);

turretRunner = turretRunner.replace(
/const missile =\s*MISSILES\[projectile\.missileId\];\s*\n\s*const outcome =\s*\n\s*signature ===\s*\n\s*missile\.signature/,
`const outcome =
            signature ===
            projectile.signature`,
);

write(enemyTurret, turretRunner);

if (read(enemyTurret).includes('MISSILES[')) {
    fail(
        'EnemyDefenseTurretRunner still derives missile truth from MISSILES catalog',
    );
}

// ---------------------------------------------------------------------------
// Final guard: runtime engine must not contain old color/spectral vocabulary.
// Tests were mechanically renamed too; behavioral baselines will be adjusted
// after the engine typecheck gate.
// ---------------------------------------------------------------------------

const forbiddenSrcTokens = [
    'MISSILE_SPECTRAL_BAND',
    'MissileSpectralBand',
    'spectralBand',
    'DEFENSE_TURRET_BEAM_BAND',
    'DefenseTurretBeamBand',
    'loadedBand',
    'beamBand',
    'RED-BAND MISSILE',
    'BLUE-BAND MISSILE',
    'WEAPONS_FIRE_RED_BEAM',
    'WEAPONS_FIRE_BLUE_BEAM',
];

const srcFiles = walk(file('src'))
    .filter((target) => ['.ts', '.json'].includes(path.extname(target)));

for (const target of srcFiles) {
    const source = fs.readFileSync(target, 'utf8');

    for (const token of forbiddenSrcTokens) {
        if (source.includes(token)) {
            fail(
                `Legacy missile color token "${token}" survived in ` +
                path.relative(ROOT, target),
            );
        }
    }
}

console.log('Missile runtime-signature atom 01 applied.');
console.log('');
console.log('Next gate:');
console.log('  npm run typecheck');
console.log('');
console.log('Do not tune tests yet if typecheck fails; send the errors first.');
