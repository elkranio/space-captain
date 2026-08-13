// src/engine/content/catalogs/ship_weapons.ts

import shipWeaponRulesData from '../data/ship_weapon_rules.json';
import shipWeaponTuningData from '../data/ship_weapons.json';
import {
    SHIP_WEAPON_RULES_SCHEMA,
} from '../schemas/ship_weapon_rules';
import {
    SHIP_WEAPON_TUNING_SCHEMA,
} from '../schemas/ship_weapons';
import {
    SHIP_WEAPON_ID,
    SHIP_WEAPON_KIND,
    type ShipWeaponDefinition,
    type ShipWeaponId,
} from '../../defs/ship_weapon';

const SHIP_WEAPON_RULES =
    SHIP_WEAPON_RULES_SCHEMA.parse(
        shipWeaponRulesData,
    );

const SHIP_WEAPON_TUNING =
    SHIP_WEAPON_TUNING_SCHEMA.parse(
        shipWeaponTuningData,
    );

// Любое enemy weapon сначала проходит одинаковый targeting.
// Это не даёт определить тип атаки по длительности warning lamp.
export const SHIP_WEAPON_TARGETING_DURATION_MS =
    SHIP_WEAPON_RULES
        .enemy_targeting
        .durationMs;

export const SHIP_WEAPONS = {
    [SHIP_WEAPON_ID
        .MISSILE_LAUNCHER_00]: {
        id:
            SHIP_WEAPON_ID
                .MISSILE_LAUNCHER_00,

        kind:
            SHIP_WEAPON_KIND
                .MISSILE_LAUNCHER,

        ...SHIP_WEAPON_TUNING[
            SHIP_WEAPON_ID
                .MISSILE_LAUNCHER_00
        ],
    },

    [SHIP_WEAPON_ID.LASER_00]: {
        id:
            SHIP_WEAPON_ID
                .LASER_00,

        kind:
            SHIP_WEAPON_KIND.LASER,

        ...SHIP_WEAPON_TUNING[
            SHIP_WEAPON_ID.LASER_00
        ],
    },

    [SHIP_WEAPON_ID
        .SPAM_PROJECTOR_00]: {
        id:
            SHIP_WEAPON_ID
                .SPAM_PROJECTOR_00,

        kind:
            SHIP_WEAPON_KIND
                .SPAM_PROJECTOR,

        ...SHIP_WEAPON_TUNING[
            SHIP_WEAPON_ID
                .SPAM_PROJECTOR_00
        ],
    },

    [SHIP_WEAPON_ID
        .STICKY_MINE_DISPENSER_00]: {
        id:
            SHIP_WEAPON_ID
                .STICKY_MINE_DISPENSER_00,

        kind:
            SHIP_WEAPON_KIND
                .STICKY_MINE_DISPENSER,

        ...SHIP_WEAPON_TUNING[
            SHIP_WEAPON_ID
                .STICKY_MINE_DISPENSER_00
        ],
    },
} satisfies Record<
    ShipWeaponId,
    ShipWeaponDefinition
>;
