import * as z from 'zod';
import {
    POWER_CORE_TUNING_SCHEMA,
} from '../../../src/engine/content/schemas/power_cores';
import {
    ENEMY_BEHAVIOR_RULES_SCHEMA,
} from '../../../src/engine/content/schemas/enemy_behavior_rules';
import {
    MISSILE_TUNING_SCHEMA,
} from '../../../src/engine/content/schemas/missiles';
import {
    OFFICER_TASK_TUNING_SCHEMA,
} from '../../../src/engine/content/schemas/officer_task_tuning';
import {
    DEFENSE_TURRET_TUNING_SCHEMA,
} from '../../../src/engine/content/schemas/defense_turrets';
import {
    SHIELD_GENERATOR_TUNING_SCHEMA,
} from '../../../src/engine/content/schemas/shield_generators';
import {
    SHIP_BEHAVIOR_TUNING_SCHEMA,
} from '../../../src/engine/content/schemas/ship_behaviors';
import {
    SHIP_CHASSIS_TUNING_SCHEMA,
} from '../../../src/engine/content/schemas/ship_chassis';
import {
    SHIP_DRIVE_TUNING_SCHEMA,
} from '../../../src/engine/content/schemas/ship_drives';
import {
    SHIP_WEAPON_RULES_SCHEMA,
} from '../../../src/engine/content/schemas/ship_weapon_rules';
import {
    SHIP_WEAPON_TUNING_SCHEMA,
} from '../../../src/engine/content/schemas/ship_weapons';
import {
    STICKY_MINE_TUNING_SCHEMA,
} from '../../../src/engine/content/schemas/sticky_mines';

export const CONTENT_COLLECTION_ID = {
    OFFICER_TASKS:
        'officer_tasks',

    SHIP_WEAPON_RULES:
        'ship_weapon_rules',

    SHIP_WEAPONS:
        'ship_weapons',

    MISSILES:
        'missiles',

    POWER_CORES:
        'power_cores',

    DEFENSE_TURRETS:
        'defense_turrets',

    SHIELD_GENERATORS:
        'shield_generators',

    SHIP_BEHAVIORS:
        'ship_behaviors',

    SHIP_CHASSIS:
        'ship_chassis',

    SHIP_DRIVES:
        'ship_drives',

    STICKY_MINES:
        'sticky_mines',

    ENEMY_BEHAVIOR_RULES:
        'enemy_behavior_rules',
} as const;

export type ContentCollectionId =
    (typeof CONTENT_COLLECTION_ID)[
        keyof typeof CONTENT_COLLECTION_ID
    ];

export const CONTENT_COLLECTION_GROUP = {
    GENERAL:
        'General',

    SHIP_MODULES:
        'Ship Modules',
} as const;

export type ContentCollectionGroup =
    (typeof CONTENT_COLLECTION_GROUP)[
        keyof typeof CONTENT_COLLECTION_GROUP
    ];

const SHIP_MODULE_COLLECTION_IDS =
    new Set<ContentCollectionId>([
        CONTENT_COLLECTION_ID
            .POWER_CORES,

        CONTENT_COLLECTION_ID
            .SHIP_DRIVES,

        CONTENT_COLLECTION_ID
            .SHIELD_GENERATORS,

        CONTENT_COLLECTION_ID
            .DEFENSE_TURRETS,
    ]);

type ContentCollectionDefinition = {
    id: ContentCollectionId;
    label: string;
    dataPath: string;
    schema: z.ZodType;
    canAdd: boolean;
    canDelete: boolean;
};

const CONTENT_COLLECTIONS:
    Record<
        ContentCollectionId,
        ContentCollectionDefinition
    > = {
        [CONTENT_COLLECTION_ID
            .OFFICER_TASKS]: {
            id:
                CONTENT_COLLECTION_ID
                    .OFFICER_TASKS,

            label: 'Officer Tasks',

            dataPath:
                'src/engine/content/data/' +
                'officer_tasks.json',

            schema:
                OFFICER_TASK_TUNING_SCHEMA,

            canAdd: false,
            canDelete: false,
        },

        [CONTENT_COLLECTION_ID
            .SHIP_WEAPON_RULES]: {
            id:
                CONTENT_COLLECTION_ID
                    .SHIP_WEAPON_RULES,

            label:
                'Ship Weapon Rules',

            dataPath:
                'src/engine/content/data/' +
                'ship_weapon_rules.json',

            schema:
                SHIP_WEAPON_RULES_SCHEMA,

            canAdd: false,
            canDelete: false,
        },

        [CONTENT_COLLECTION_ID
            .SHIP_WEAPONS]: {
            id:
                CONTENT_COLLECTION_ID
                    .SHIP_WEAPONS,

            label:
                'Ship Weapons',

            dataPath:
                'src/engine/content/data/' +
                'ship_weapons.json',

            schema:
                SHIP_WEAPON_TUNING_SCHEMA,

            canAdd: false,
            canDelete: false,
        },

        [CONTENT_COLLECTION_ID
            .MISSILES]: {
            id:
                CONTENT_COLLECTION_ID
                    .MISSILES,

            label: 'Missiles',

            dataPath:
                'src/engine/content/data/' +
                'missiles.json',

            schema:
                MISSILE_TUNING_SCHEMA,

            canAdd: false,
            canDelete: false,
        },

        [CONTENT_COLLECTION_ID
            .POWER_CORES]: {
            id:
                CONTENT_COLLECTION_ID
                    .POWER_CORES,

            label:
                'Power Cores',

            dataPath:
                'src/engine/content/data/' +
                'power_cores.json',

            schema:
                POWER_CORE_TUNING_SCHEMA,

            canAdd: true,
            canDelete: true,
        },

        [CONTENT_COLLECTION_ID
            .DEFENSE_TURRETS]: {
            id:
                CONTENT_COLLECTION_ID
                    .DEFENSE_TURRETS,

            label:
                'Defense Turrets',

            dataPath:
                'src/engine/content/data/' +
                'defense_turrets.json',

            schema:
                DEFENSE_TURRET_TUNING_SCHEMA,

            canAdd: true,
            canDelete: true,
        },

        [CONTENT_COLLECTION_ID
            .SHIELD_GENERATORS]: {
            id:
                CONTENT_COLLECTION_ID
                    .SHIELD_GENERATORS,

            label:
                'Shield Generators',

            dataPath:
                'src/engine/content/data/' +
                'shield_generators.json',

            schema:
                SHIELD_GENERATOR_TUNING_SCHEMA,

            canAdd: true,
            canDelete: true,
        },

        [CONTENT_COLLECTION_ID
            .SHIP_BEHAVIORS]: {
            id:
                CONTENT_COLLECTION_ID
                    .SHIP_BEHAVIORS,

            label:
                'Ship Behaviors',

            dataPath:
                'src/engine/content/data/' +
                'ship_behaviors.json',

            schema:
                SHIP_BEHAVIOR_TUNING_SCHEMA,

            canAdd: false,
            canDelete: false,
        },

        [CONTENT_COLLECTION_ID
            .SHIP_CHASSIS]: {
            id:
                CONTENT_COLLECTION_ID
                    .SHIP_CHASSIS,

            label:
                'Ship Chassis',

            dataPath:
                'src/engine/content/data/' +
                'ship_chassis.json',

            schema:
                SHIP_CHASSIS_TUNING_SCHEMA,

            canAdd: true,
            canDelete: true,
        },

        [CONTENT_COLLECTION_ID
            .SHIP_DRIVES]: {
            id:
                CONTENT_COLLECTION_ID
                    .SHIP_DRIVES,

            label:
                'Drives',

            dataPath:
                'src/engine/content/data/' +
                'ship_drives.json',

            schema:
                SHIP_DRIVE_TUNING_SCHEMA,

            canAdd: true,
            canDelete: true,
        },

        [CONTENT_COLLECTION_ID
            .STICKY_MINES]: {
            id:
                CONTENT_COLLECTION_ID
                    .STICKY_MINES,

            label:
                'Sticky Mines',

            dataPath:
                'src/engine/content/data/' +
                'sticky_mines.json',

            schema:
                STICKY_MINE_TUNING_SCHEMA,

            canAdd: false,
            canDelete: false,
        },

        [CONTENT_COLLECTION_ID
            .ENEMY_BEHAVIOR_RULES]: {
            id:
                CONTENT_COLLECTION_ID
                    .ENEMY_BEHAVIOR_RULES,

            label:
                'Enemy Behavior Rules',

            dataPath:
                'src/engine/content/data/' +
                'enemy_behavior_rules.json',

            schema:
                ENEMY_BEHAVIOR_RULES_SCHEMA,

            canAdd: false,
            canDelete: false,
        },
    };

export type ContentCollectionSummary = {
    id: ContentCollectionId;
    label: string;
    group: ContentCollectionGroup;
    canAdd: boolean;
    canDelete: boolean;
};

export function getContentCollectionSummaries():
    ContentCollectionSummary[] {
    return Object.values(
        CONTENT_COLLECTIONS,
    ).map((collection) => {
        return {
            id: collection.id,
            label: collection.label,

            group:
                SHIP_MODULE_COLLECTION_IDS
                    .has(
                        collection.id,
                    )
                    ? CONTENT_COLLECTION_GROUP
                        .SHIP_MODULES
                    : CONTENT_COLLECTION_GROUP
                        .GENERAL,

            canAdd: collection.canAdd,
            canDelete:
                collection.canDelete,
        };
    });
}

export function getContentCollectionDefinition(
    id: string,
): Readonly<ContentCollectionDefinition> | undefined {
    if (
        !Object.prototype
            .hasOwnProperty.call(
                CONTENT_COLLECTIONS,
                id,
            )
    ) {
        return undefined;
    }

    return CONTENT_COLLECTIONS[
        id as ContentCollectionId
    ];
}

export function validateContentCollection(
    id: string,
    input: unknown,
): unknown {
    const definition =
        getContentCollectionDefinition(
            id,
        );

    if (!definition) {
        throw new Error(
            'Unknown content collection: ' +
            id,
        );
    }

    return definition.schema.parse(
        input,
    );
}

export function getContentCollectionJsonSchema(
    id: string,
): unknown {
    const definition =
        getContentCollectionDefinition(
            id,
        );

    if (!definition) {
        throw new Error(
            'Unknown content collection: ' +
            id,
        );
    }

    return z.toJSONSchema(
        definition.schema,
    );
}
