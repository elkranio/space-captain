// src/engine/content/catalogs/debug_start.ts

import debugStartData from '../data/debug_start.json';
import {
    DEBUG_START_SCHEMA,
} from '../schemas/debug_start';
import {
    DEFENSE_TURRETS,
} from './defense_turrets';
import {
    POWER_CORES,
} from './power_cores';
import {
    SHIELD_GENERATORS,
} from './shield_generators';
import {
    SHIP_CHASSIS,
} from './ship_chassis';
import {
    SHIP_DRIVES,
} from './ship_drives';
import {
    SHIP_WEAPONS,
} from './ship_weapons';

const parsed =
    DEBUG_START_SCHEMA.parse(
        debugStartData,
    );

function assertReference(
    field: string,
    id: string,
    catalog: object,
): void {
    if (
        Object.prototype
            .hasOwnProperty.call(
                catalog,
                id,
            )
    ) {
        return;
    }

    throw new Error(
        'Unknown Debug Start content reference: ' +
            field +
            '=' +
            id,
    );
}

function assertOptionalReference(
    field: string,
    id: string | null,
    catalog: object,
): void {
    if (id === null) {
        return;
    }

    assertReference(
        field,
        id,
        catalog,
    );
}

assertReference(
    'player.driveId',
    parsed.player.driveId,
    SHIP_DRIVES,
);

assertReference(
    'player.powerCoreId',
    parsed.player.powerCoreId,
    POWER_CORES,
);

assertReference(
    'player.shieldGeneratorId',
    parsed.player.shieldGeneratorId,
    SHIELD_GENERATORS,
);

assertReference(
    'player.defenseTurretId',
    parsed.player.defenseTurretId,
    DEFENSE_TURRETS,
);

for (
    const [
        field,
        weaponId,
    ] of [
        [
            'player.weaponSlot1Id',
            parsed.player.weaponSlot1Id,
        ],
        [
            'player.weaponSlot2Id',
            parsed.player.weaponSlot2Id,
        ],
        [
            'player.weaponSlot3Id',
            parsed.player.weaponSlot3Id,
        ],
        [
            'player.weaponSlot4Id',
            parsed.player.weaponSlot4Id,
        ],
    ] as const
) {
    assertReference(
        field,
        weaponId,
        SHIP_WEAPONS,
    );
}

assertReference(
    'enemy.chassisId',
    parsed.enemy.chassisId,
    SHIP_CHASSIS,
);

assertReference(
    'enemy.driveId',
    parsed.enemy.driveId,
    SHIP_DRIVES,
);

assertOptionalReference(
    'enemy.powerCoreId',
    parsed.enemy.powerCoreId,
    POWER_CORES,
);

assertOptionalReference(
    'enemy.shieldGeneratorId',
    parsed.enemy.shieldGeneratorId,
    SHIELD_GENERATORS,
);

assertOptionalReference(
    'enemy.defenseTurretId',
    parsed.enemy.defenseTurretId,
    DEFENSE_TURRETS,
);

for (
    const [
        field,
        weaponId,
    ] of [
        [
            'enemy.weaponSlot1Id',
            parsed.enemy.weaponSlot1Id,
        ],
        [
            'enemy.weaponSlot2Id',
            parsed.enemy.weaponSlot2Id,
        ],
        [
            'enemy.weaponSlot3Id',
            parsed.enemy.weaponSlot3Id,
        ],
        [
            'enemy.weaponSlot4Id',
            parsed.enemy.weaponSlot4Id,
        ],
    ] as const
) {
    assertOptionalReference(
        field,
        weaponId,
        SHIP_WEAPONS,
    );
}

// Canonical validated debug/sandbox start configuration.
// This is content, not mutable runtime state.
export const DEBUG_START =
    parsed;
