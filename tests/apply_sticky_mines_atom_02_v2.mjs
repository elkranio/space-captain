import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.cwd();
const pendingWrites = new Map();

function absolute(relativePath) {
    return path.join(root, relativePath);
}

function read(relativePath) {
    if (pendingWrites.has(relativePath)) {
        return pendingWrites.get(relativePath);
    }

    return fs.readFileSync(
        absolute(relativePath),
        'utf8',
    ).replace(/\r\n/g, '\n');
}

function stage(relativePath, content) {
    pendingWrites.set(relativePath, content);
}

function replaceOnce(
    content,
    search,
    replacement,
    label,
) {
    const firstIndex = content.indexOf(search);

    if (firstIndex < 0) {
        throw new Error(
            `Patch target not found: ${label}`,
        );
    }

    if (
        content.indexOf(
            search,
            firstIndex + search.length,
        ) >= 0
    ) {
        throw new Error(
            `Patch target is not unique: ${label}`,
        );
    }

    return (
        content.slice(0, firstIndex) +
        replacement +
        content.slice(firstIndex + search.length)
    );
}

// -----------------------------------------------------------------------------
// Ship weapon definitions and runtime state
// -----------------------------------------------------------------------------

const shipWeaponPath =
    'src/engine/defs/ship_weapon.ts';

let shipWeapon = read(shipWeaponPath);

shipWeapon = replaceOnce(
    shipWeapon,
    `export const SHIP_WEAPON_KIND = {
    MISSILE_LAUNCHER: 'missile_launcher',
    LASER: 'laser',
    SPAM_PROJECTOR: 'spam_projector',
} as const;
`,
    `export const SHIP_WEAPON_KIND = {
    MISSILE_LAUNCHER: 'missile_launcher',
    LASER: 'laser',
    SPAM_PROJECTOR: 'spam_projector',
    STICKY_MINE_DISPENSER: 'sticky_mine_dispenser',
} as const;
`,
    'add sticky-mine dispenser weapon kind',
);

shipWeapon = replaceOnce(
    shipWeapon,
    `export const SHIP_WEAPON_ID = {
    MISSILE_LAUNCHER_00: 'missile_launcher_00',
    LASER_00: 'laser_00',
    SPAM_PROJECTOR_00: 'spam_projector_00',
} as const;
`,
    `export const SHIP_WEAPON_ID = {
    MISSILE_LAUNCHER_00: 'missile_launcher_00',
    LASER_00: 'laser_00',
    SPAM_PROJECTOR_00: 'spam_projector_00',
    STICKY_MINE_DISPENSER_00: 'sticky_mine_dispenser_00',
} as const;
`,
    'add sticky-mine dispenser weapon id',
);

shipWeapon = replaceOnce(
    shipWeapon,
    `export type SpamProjectorDefinition = ShipWeaponDefinitionBase & {
    kind: typeof SHIP_WEAPON_KIND.SPAM_PROJECTOR;

    channelDurationMs: number;

    officerTaskProgressMultiplier: number;
};

export type ShipWeaponDefinition =
    | MissileLauncherDefinition
    | LaserWeaponDefinition
    | SpamProjectorDefinition;
`,
    `export type SpamProjectorDefinition = ShipWeaponDefinitionBase & {
    kind: typeof SHIP_WEAPON_KIND.SPAM_PROJECTOR;

    channelDurationMs: number;

    officerTaskProgressMultiplier: number;
};

export type StickyMineDispenserDefinition =
    ShipWeaponDefinitionBase & {
        kind:
            typeof SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER;

        burstSize: number;
        launchIntervalMs: number;

        fuseDurationMs: number;
        damage: number;
    };

export type ShipWeaponDefinition =
    | MissileLauncherDefinition
    | LaserWeaponDefinition
    | SpamProjectorDefinition
    | StickyMineDispenserDefinition;
`,
    'add sticky-mine dispenser definition',
);

shipWeapon = replaceOnce(
    shipWeapon,
    `export type SpamProjectorState = ShipWeaponBaseState & {
    kind: typeof SHIP_WEAPON_KIND.SPAM_PROJECTOR;

    activeChannelId: string | null;
};

export type ShipWeaponState =
    | MissileLauncherState
    | LaserWeaponState
    | SpamProjectorState;
`,
    `export type SpamProjectorState = ShipWeaponBaseState & {
    kind: typeof SHIP_WEAPON_KIND.SPAM_PROJECTOR;

    activeChannelId: string | null;
};

export type StickyMineDispenserState =
    ShipWeaponBaseState & {
        kind:
            typeof SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER;

        // Сбрасывается при начале новой очереди.
        dispensedMineCount: number;
    };

export type ShipWeaponState =
    | MissileLauncherState
    | LaserWeaponState
    | SpamProjectorState
    | StickyMineDispenserState;
`,
    'add sticky-mine dispenser runtime state',
);

stage(shipWeaponPath, shipWeapon);

// -----------------------------------------------------------------------------
// Content catalog
// -----------------------------------------------------------------------------

const shipWeaponsCatalogPath =
    'src/engine/content/catalogs/ship_weapons.ts';

let shipWeaponsCatalog =
    read(shipWeaponsCatalogPath);

shipWeaponsCatalog = replaceOnce(
    shipWeaponsCatalog,
    `    [SHIP_WEAPON_ID.SPAM_PROJECTOR_00]: {
        id: SHIP_WEAPON_ID.SPAM_PROJECTOR_00,

        name: 'SPAM PROJECTOR',

        kind: SHIP_WEAPON_KIND.SPAM_PROJECTOR,

        channelDurationMs: 20000,

        officerTaskProgressMultiplier: 0.5,

        cooldownDurationMs: 15000,
    },
`,
    `    [SHIP_WEAPON_ID.SPAM_PROJECTOR_00]: {
        id: SHIP_WEAPON_ID.SPAM_PROJECTOR_00,

        name: 'SPAM PROJECTOR',

        kind: SHIP_WEAPON_KIND.SPAM_PROJECTOR,

        channelDurationMs: 20000,

        officerTaskProgressMultiplier: 0.5,

        cooldownDurationMs: 15000,
    },

    [SHIP_WEAPON_ID.STICKY_MINE_DISPENSER_00]: {
        id:
            SHIP_WEAPON_ID.STICKY_MINE_DISPENSER_00,

        name: 'STICKY MINE DISPENSER',

        kind:
            SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER,

        burstSize: 6,
        launchIntervalMs: 2000,

        fuseDurationMs: 7500,
        damage: 1,

        cooldownDurationMs: 15000,
    },
`,
    'add sticky-mine dispenser content',
);

stage(
    shipWeaponsCatalogPath,
    shipWeaponsCatalog,
);

// -----------------------------------------------------------------------------
// Encounter combat state
// -----------------------------------------------------------------------------

const combatModelPath =
    'src/engine/encounter/model/combat.ts';

let combatModel = read(combatModelPath);

combatModel = replaceOnce(
    combatModel,
    `export type ActiveShieldState = {
    zone: LaserTargetZone;

    elapsedMs: number;
    durationMs: number;
};

export type EncounterCombatState = {
`,
    `export type ActiveShieldState = {
    zone: LaserTargetZone;

    elapsedMs: number;
    durationMs: number;
};

// После прикрепления мина живёт независимо
// от дальнейшего состояния launcher.
// Поэтому fuse и damage хранятся в runtime state.
export type StickyMineState = {
    id: string;

    sourceActorId: string;
    sourceWeaponId: string;

    timeToDetonationMs: number;
    initialTimeToDetonationMs: number;

    damage: number;
};

export type EncounterCombatState = {
`,
    'add sticky-mine runtime model',
);

combatModel = replaceOnce(
    combatModel,
    `    projectiles: CombatProjectileState[];
    laserAttacks: LaserAttackState[];
};
`,
    `    projectiles: CombatProjectileState[];
    laserAttacks: LaserAttackState[];

    stickyMines: StickyMineState[];
};
`,
    'add sticky mines to encounter combat state',
);

stage(combatModelPath, combatModel);

const createEncounterStatePath =
    'src/engine/encounter/state/create_encounter_state.ts';

let createEncounterState =
    read(createEncounterStatePath);

createEncounterState = replaceOnce(
    createEncounterState,
    `            projectiles: [],
            laserAttacks: [],
`,
    `            projectiles: [],
            laserAttacks: [],
            stickyMines: [],
`,
    'initialize empty sticky-mine collection',
);

stage(
    createEncounterStatePath,
    createEncounterState,
);

// -----------------------------------------------------------------------------
// Safe intermediate CombatRunner contract
// -----------------------------------------------------------------------------

const combatRunnerPath =
    'src/engine/encounter/combat/CombatRunner.ts';

let combatRunner = read(combatRunnerPath);

combatRunner = replaceOnce(
    combatRunner,
    `    private canTargetWeapon(weapon: ShipWeaponState): boolean {
        if (weapon.phase !== SHIP_WEAPON_PHASE.READY) {
            return false;
        }

        switch (weapon.kind) {
            case SHIP_WEAPON_KIND.MISSILE_LAUNCHER:
                return weapon.loadedMissileId !== null && weapon.ammoCount > 0;

            case SHIP_WEAPON_KIND.LASER:
                return true;

            case SHIP_WEAPON_KIND.SPAM_PROJECTOR:
                return weapon.activeChannelId === null;
        }
    }
`,
    `    private canTargetWeapon(weapon: ShipWeaponState): boolean {
        if (weapon.phase !== SHIP_WEAPON_PHASE.READY) {
            return false;
        }

        switch (weapon.kind) {
            case SHIP_WEAPON_KIND.MISSILE_LAUNCHER:
                return weapon.loadedMissileId !== null && weapon.ammoCount > 0;

            case SHIP_WEAPON_KIND.LASER:
                return true;

            case SHIP_WEAPON_KIND.SPAM_PROJECTOR:
                return weapon.activeChannelId === null;

            case SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER:
                // Lifecycle подключается следующим атомом.
                return false;
        }
    }
`,
    'disable sticky-mine targeting before lifecycle exists',
);

combatRunner = replaceOnce(
    combatRunner,
    `    private completeWeaponTargeting(actor: ShipEncounterActorState, weapon: ShipWeaponState): void {
        switch (weapon.kind) {
            case SHIP_WEAPON_KIND.MISSILE_LAUNCHER:
                this.launchMissile(actor, weapon);
                return;

            case SHIP_WEAPON_KIND.LASER:
                this.startLaserCharging(actor, weapon);
                return;

            case SHIP_WEAPON_KIND.SPAM_PROJECTOR:
                this.startSpamChannel(actor, weapon);
                return;
        }
    }
`,
    `    private completeWeaponTargeting(actor: ShipEncounterActorState, weapon: ShipWeaponState): void {
        switch (weapon.kind) {
            case SHIP_WEAPON_KIND.MISSILE_LAUNCHER:
                this.launchMissile(actor, weapon);
                return;

            case SHIP_WEAPON_KIND.LASER:
                this.startLaserCharging(actor, weapon);
                return;

            case SHIP_WEAPON_KIND.SPAM_PROJECTOR:
                this.startSpamChannel(actor, weapon);
                return;

            case SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER:
                throw new Error(
                    'Sticky-mine dispenser lifecycle is not enabled: ' +
                        actor.id + '/' + weapon.id,
                );
        }
    }
`,
    'guard sticky-mine targeting completion',
);

stage(combatRunnerPath, combatRunner);

// -----------------------------------------------------------------------------
// Regression test
// -----------------------------------------------------------------------------

const testPath =
    'tests/engine/StickyMineModel.test.ts';

if (fs.existsSync(absolute(testPath))) {
    throw new Error(
        `Refusing to overwrite existing file: ${testPath}`,
    );
}

stage(
    testPath,
    `// tests/engine/StickyMineModel.test.ts

import { describe, expect, it } from 'vitest';
import {
    SHIP_WEAPONS,
} from '../../src/engine/content/catalogs/ship_weapons';
import {
    SHIP_WEAPON_ID,
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type StickyMineDispenserState,
} from '../../src/engine/defs/ship_weapon';
import type {
    StickyMineState,
} from '../../src/engine/encounter/model/combat';

describe('Sticky mine model', () => {
    it('defines the initial sticky-mine burst tuning', () => {
        const definition =
            SHIP_WEAPONS[
                SHIP_WEAPON_ID
                    .STICKY_MINE_DISPENSER_00
            ];

        expect(definition).toMatchObject({
            name: 'STICKY MINE DISPENSER',

            kind:
                SHIP_WEAPON_KIND
                    .STICKY_MINE_DISPENSER,

            burstSize: 6,
            launchIntervalMs: 2000,

            fuseDurationMs: 7500,
            damage: 1,

            cooldownDurationMs: 15000,
        });
    });

    it('keeps dispenser progress and attached mine state explicit', () => {
        const dispenser: StickyMineDispenserState = {
            id: 'enemy_sticky_mine_dispenser',

            weaponId:
                SHIP_WEAPON_ID
                    .STICKY_MINE_DISPENSER_00,

            kind:
                SHIP_WEAPON_KIND
                    .STICKY_MINE_DISPENSER,

            phase: SHIP_WEAPON_PHASE.READY,
            phaseElapsedMs: 0,

            dispensedMineCount: 0,
        };

        const mine: StickyMineState = {
            id: 'sticky_mine_1',

            sourceActorId: 'enemy_ship',
            sourceWeaponId: dispenser.id,

            timeToDetonationMs: 7500,
            initialTimeToDetonationMs: 7500,

            damage: 1,
        };

        expect(dispenser.dispensedMineCount).toBe(0);
        expect(mine.timeToDetonationMs).toBe(7500);
        expect(mine.damage).toBe(1);
    });
});
`,
);

// -----------------------------------------------------------------------------
// Write only after every patch target has been validated
// -----------------------------------------------------------------------------

for (const [relativePath, content] of pendingWrites) {
    const filePath = absolute(relativePath);

    fs.mkdirSync(
        path.dirname(filePath),
        { recursive: true },
    );

    fs.writeFileSync(
        filePath,
        content,
        'utf8',
    );
}

console.log(
    'Applied sticky mines atom 02: content and runtime model.',
);
console.log(
    `Changed files: ${pendingWrites.size}`,
);
console.log(
    'Sticky-mine dispenser remains disabled until atom 03.',
);

fs.rmSync(fileURLToPath(import.meta.url));
