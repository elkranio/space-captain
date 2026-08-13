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

function replaceTree(rootRel, replacements) {
    const root = abs(rootRel);

    if (!fs.existsSync(root)) {
        return;
    }

    const allowed = new Set(['.ts', '.json']);

    for (const target of walk(root)) {
        if (!allowed.has(path.extname(target))) {
            continue;
        }

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

function replaceRegexRequired(rel, pattern, replacement, label) {
    const source = read(rel);

    if (!pattern.test(source)) {
        fail(`Cannot find ${label} in ${rel}`);
    }

    pattern.lastIndex = 0;
    write(rel, source.replace(pattern, replacement));
}

function ensureContains(rel, token, message) {
    if (!read(rel).includes(token)) {
        fail(message ?? `${rel} is missing ${token}`);
    }
}

// Recovery assumes atom 01 stopped at the first guard after the broad
// mechanical rename. It is deliberately tolerant of CRLF and can also be
// re-run after a successful recovery.

// ---------------------------------------------------------------------------
// 1. Finish defense-turret signature domain migration.
// ---------------------------------------------------------------------------

const defenseTurretPath =
    'src/engine/defs/defense_turret.ts';

let defenseTurret = read(defenseTurretPath);

if (
    !defenseTurret.includes(
        `export const DEFENSE_TURRET_SIGNATURE =\n    MISSILE_SIGNATURE;`,
    ) &&
    !defenseTurret.includes(
        `export const DEFENSE_TURRET_SIGNATURE =\r\n    MISSILE_SIGNATURE;`,
    )
) {
    const oldBlock =
        /export const DEFENSE_TURRET_SIGNATURE = \{\r?\n\s*RED: 'red',\r?\n\s*BLUE: 'blue',\r?\n\} as const;\r?\n\r?\nexport type DefenseTurretSignature =\r?\n\s*\(typeof DEFENSE_TURRET_SIGNATURE\)\[keyof typeof DEFENSE_TURRET_SIGNATURE\];/;

    if (!oldBlock.test(defenseTurret)) {
        fail(
            'Unexpected defense_turret.ts state: cannot find transitional RED/BLUE signature block',
        );
    }

    defenseTurret = defenseTurret.replace(
        oldBlock,
`import {
    MISSILE_SIGNATURE,
    type MissileSignature,
} from './missile';

// Transitional targeting domain.
// Atom 02 removes signature selection from the turret completely.
export const DEFENSE_TURRET_SIGNATURE =
    MISSILE_SIGNATURE;

export type DefenseTurretSignature =
    MissileSignature;`,
    );

    write(defenseTurretPath, defenseTurret);
}

replaceTree('src', [
    ['DEFENSE_TURRET_SIGNATURE.RED', 'DEFENSE_TURRET_SIGNATURE.A'],
    ['DEFENSE_TURRET_SIGNATURE.BLUE', 'DEFENSE_TURRET_SIGNATURE.B'],
    ['MISSILE_SIGNATURE.RED', 'MISSILE_SIGNATURE.A'],
    ['MISSILE_SIGNATURE.BLUE', 'MISSILE_SIGNATURE.B'],
]);

replaceTree('tests', [
    ['DEFENSE_TURRET_SIGNATURE.RED', 'DEFENSE_TURRET_SIGNATURE.A'],
    ['DEFENSE_TURRET_SIGNATURE.BLUE', 'DEFENSE_TURRET_SIGNATURE.B'],
    ['MISSILE_SIGNATURE.RED', 'MISSILE_SIGNATURE.A'],
    ['MISSILE_SIGNATURE.BLUE', 'MISSILE_SIGNATURE.B'],
]);

// ---------------------------------------------------------------------------
// 2. Add objective runtime signature to projectile state.
// ---------------------------------------------------------------------------

const combatModel =
    'src/engine/encounter/model/combat.ts';

let combat = read(combatModel);

if (!combat.includes('signature: MissileSignature;')) {
    const targetNeedle =
        /(\s+target: CombatTarget;\r?\n)(\r?\n\s+\/\/ Знание игрока о свойствах угрозы\.)/;

    if (!targetNeedle.test(combat)) {
        fail(
            'Cannot locate MissileCombatProjectileState target/identification boundary',
        );
    }

    combat = combat.replace(
        targetNeedle,
`$1
    // Objective hidden truth of this concrete projectile.
    // missileId identifies the ammo model and cannot reveal this value.
    signature: MissileSignature;
$2`,
    );

    write(combatModel, combat);
}

// ---------------------------------------------------------------------------
// 3. Assign a signature independently for every spawned missile projectile.
// ---------------------------------------------------------------------------

const missileRunner =
    'src/engine/encounter/combat/weapons/missile/CombatMissileRunner.ts';

let runner = read(missileRunner);

if (!runner.includes('MISSILE_SIGNATURE,')) {
    runner = runner.replace(
        /import type \{ MissileId \} from '\.\.\/\.\.\/\.\.\/\.\.\/defs\/missile';/,
`import {
    MISSILE_SIGNATURE,
    type MissileId,
    type MissileSignature,
} from '../../../../defs/missile';`,
    );
}

if (!runner.includes('random: () => number;')) {
    runner = runner.replace(
        /(\s+identities: CombatRuntimeIdentityFactory;\r?\n)(\s+emit: \(event: EncounterEvent\) => void;)/,
        `$1    random: () => number;\n$2`,
    );
}

if (!runner.includes('private readonly random:')) {
    runner = runner.replace(
        /(\s+private readonly identities:\r?\n\s+CombatRuntimeIdentityFactory;\r?\n)(\r?\n\s+private readonly emit:)/,
`$1
    private readonly random:
        () => number;
$2`,
    );
}

if (!/identities,\r?\n\s*random,\r?\n\s*emit,/.test(runner)) {
    runner = runner.replace(
        /(\s+identities,\r?\n)(\s+emit,\r?\n\s+destroyEnemyActor,)/,
        `$1        random,\n$2`,
    );
}

if (!runner.includes('this.random = random;')) {
    runner = runner.replace(
        /(\s+this\.identities = identities;\r?\n)(\s+this\.emit = emit;)/,
        `$1        this.random = random;\n$2`,
    );
}

// Enemy projectile: create hidden truth next to model lookup.
if (
    !/const missile = MISSILES\[missileId\];\r?\n\s*const signature =\r?\n\s*this\.createMissileSignature\(\);/.test(
        runner,
    )
) {
    runner = runner.replace(
        /const missile = MISSILES\[missileId\];/,
`const missile = MISSILES[missileId];
        const signature =
            this.createMissileSignature();`,
    );
}

// Enemy projectile: persist hidden truth.
const enemyTargetBlock =
    /(target: \{\r?\n\s+kind:\r?\n\s+COMBAT_TARGET_KIND\r?\n\s+\.PLAYER_SHIP,\r?\n\s+\},\r?\n)(\r?\n\s+identification: \{)/;

if (
    !/target: \{\r?\n\s+kind:\r?\n\s+COMBAT_TARGET_KIND\r?\n\s+\.PLAYER_SHIP,\r?\n\s+\},\r?\n\s+signature,/.test(
        runner,
    )
) {
    if (!enemyTargetBlock.test(runner)) {
        fail('Cannot locate enemy projectile target block');
    }

    runner = runner.replace(
        enemyTargetBlock,
        `$1\n                signature,\n$2`,
    );
}

// Player projectile: create hidden truth next to model lookup.
if (
    !/MISSILES\[launch\.missileId\];\r?\n\r?\n\s*const signature =\r?\n\s*this\.createMissileSignature\(\);/.test(
        runner,
    )
) {
    runner = runner.replace(
        /(const missile =\r?\n\s+MISSILES\[launch\.missileId\];)/,
`$1

        const signature =
            this.createMissileSignature();`,
    );
}

// Player projectile: persist hidden truth.
const playerTargetBlock =
    /(target: \{\r?\n\s+kind:\r?\n\s+COMBAT_TARGET_KIND\.ACTOR,\r?\n\r?\n\s+actorId:\r?\n\s+launch\.targetActorId,\r?\n\s+\},\r?\n)(\r?\n\s+identification: \{)/;

if (
    !/COMBAT_TARGET_KIND\.ACTOR,[\s\S]*?actorId:\r?\n\s+launch\.targetActorId,\r?\n\s+\},\r?\n\s+signature,/.test(
        runner,
    )
) {
    if (!playerTargetBlock.test(runner)) {
        fail('Cannot locate player projectile target block');
    }

    runner = runner.replace(
        playerTargetBlock,
        `$1\n                signature,\n$2`,
    );
}

// Player-owned projectile was previously born "identified" from static content.
// For this transition it can keep that knowledge, but the reported value must
// come from the concrete projectile truth.
runner = runner.replace(
    /signature:\r?\n\s+missile\.signature,/,
    'signature,',
);

if (!runner.includes('private createMissileSignature():')) {
    const boundary =
        /\r?\n\s+private advanceIncomingMissile\(/;

    if (!boundary.test(runner)) {
        fail('Cannot locate createMissileSignature insertion boundary');
    }

    runner = runner.replace(
        boundary,
`
    private createMissileSignature():
        MissileSignature {
        return this.random() < 0.5
            ? MISSILE_SIGNATURE.A
            : MISSILE_SIGNATURE.B;
    }

    private advanceIncomingMissile(`,
    );
}

write(missileRunner, runner);

// CombatRunner owns the injected deterministic RNG.
const combatRunner =
    'src/engine/encounter/combat/CombatRunner.ts';

let orchestration = read(combatRunner);

if (
    !/new CombatMissileRunner\(\{[\s\S]*?\n\s+random,\r?\n[\s\S]*?\}\);/.test(
        orchestration,
    )
) {
    const missileConstruction =
        /(this\.missileRunner =\r?\n\s+new CombatMissileRunner\(\{\r?\n[\s\S]*?identities:\r?\n\s+this\.identities,\r?\n)(\r?\n\s+emit:)/;

    if (!missileConstruction.test(orchestration)) {
        fail('Cannot locate CombatMissileRunner construction');
    }

    orchestration = orchestration.replace(
        missileConstruction,
        `$1\n                random,\n$2`,
    );

    write(combatRunner, orchestration);
}

// ---------------------------------------------------------------------------
// 4. Truth consumers must read projectile.signature, never missile definition.
// ---------------------------------------------------------------------------

const playerShipStore =
    'src/engine/encounter/state/player/PlayerShipStore.ts';

let playerStore = read(playerShipStore);

playerStore = playerStore.replace(
    /import \{\r?\n\s+MISSILES,\r?\n\} from '\.\.\/\.\.\/\.\.\/content\/catalogs\/missiles';\r?\n/,
    '',
);

playerStore = playerStore.replace(
    /const signature =\s*MISSILES\[\s*projectile\.missileId\s*\]\.signature;/,
`const signature =
                projectile.signature;`,
);

playerStore = playerStore.replace(
    /const missile =\s*MISSILES\[\s*threat\.missileId\s*\];\s*const outcome =\s*missile\.signature ===\s*signature/,
`const outcome =
            threat.signature ===
            signature`,
);

write(playerShipStore, playerStore);

const enemyScience =
    'src/engine/encounter/combat/enemy/intel/EnemyScienceIntelResolver.ts';

let science = read(enemyScience);

science = science.replace(
    /import \{\r?\n\s+MISSILES,\r?\n\} from '\.\.\/\.\.\/\.\.\/\.\.\/content\/catalogs\/missiles';\r?\n/,
    '',
);

science = science.replace(
    /signature:\s*MISSILES\[\s*projectile\.missileId\s*\]\.signature,/,
`signature:
                projectile.signature,`,
);

write(enemyScience, science);

const enemyTurret =
    'src/engine/encounter/combat/defense_turret/EnemyDefenseTurretRunner.ts';

let turret = read(enemyTurret);

turret = turret.replace(
    /import \{\r?\n\s+MISSILES,\r?\n\} from '\.\.\/\.\.\/\.\.\/content\/catalogs\/missiles';\r?\n/,
    '',
);

turret = turret.replace(
    /const missile =\s*MISSILES\[projectile\.missileId\];\s*const outcome =\s*signature ===\s*missile\.signature/,
`const outcome =
            signature ===
            projectile.signature`,
);

write(enemyTurret, turret);

// ---------------------------------------------------------------------------
// 5. Guards: atom 01 must leave no static signature derivation or color API.
// ---------------------------------------------------------------------------

const requiredRuntimeFiles = [
    combatModel,
    missileRunner,
    playerShipStore,
    enemyScience,
    enemyTurret,
];

for (const rel of requiredRuntimeFiles) {
    if (
        read(rel).includes('MISSILES[') &&
        (
            rel === playerShipStore ||
            rel === enemyScience ||
            rel === enemyTurret
        )
    ) {
        fail(
            `Static missile truth derivation survived in ${rel}`,
        );
    }
}

ensureContains(
    combatModel,
    'signature: MissileSignature;',
    'Projectile runtime signature was not added',
);

ensureContains(
    missileRunner,
    'this.createMissileSignature()',
    'Missile spawn does not create runtime signatures',
);

const forbidden = [
    'MISSILE_SPECTRAL_BAND',
    'MissileSpectralBand',
    'spectralBand',
    'DEFENSE_TURRET_BEAM_BAND',
    'DefenseTurretBeamBand',
    'loadedBand',
    'beamBand',
    `RED: 'red'`,
    `BLUE: 'blue'`,
    'MISSILE_SIGNATURE.RED',
    'MISSILE_SIGNATURE.BLUE',
    'DEFENSE_TURRET_SIGNATURE.RED',
    'DEFENSE_TURRET_SIGNATURE.BLUE',
    'RED-BAND MISSILE',
    'BLUE-BAND MISSILE',
    'WEAPONS_FIRE_RED_BEAM',
    'WEAPONS_FIRE_BLUE_BEAM',
];

for (const rootRel of ['src']) {
    for (const target of walk(abs(rootRel))) {
        if (!['.ts', '.json'].includes(path.extname(target))) {
            continue;
        }

        const source = fs.readFileSync(target, 'utf8');

        for (const token of forbidden) {
            if (source.includes(token)) {
                fail(
                    `Legacy missile color token "${token}" survived in ` +
                    path.relative(ROOT, target),
                );
            }
        }
    }
}

console.log('Missile runtime-signature atom 01 recovery applied.');
console.log('');
console.log('Next gate:');
console.log('  npm run typecheck');
console.log('');
console.log('Send typecheck output before running tests.');
