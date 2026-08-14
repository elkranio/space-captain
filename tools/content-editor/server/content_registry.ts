import * as z from 'zod';
import {
    POWER_CORE_TUNING_SCHEMA,
} from '../../../src/engine/content/schemas/power_cores';
import {
    ENEMY_BEHAVIOR_RULES_SCHEMA,
} from '../../../src/engine/content/schemas/enemy_behavior_rules';
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

type ContentCollectionDefinition = {
    id: ContentCollectionId;
    label: string;
    group: ContentCollectionGroup;
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

            group:
                CONTENT_COLLECTION_GROUP
                    .GENERAL,

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

            group:
                CONTENT_COLLECTION_GROUP
                    .GENERAL,

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

            group:
                CONTENT_COLLECTION_GROUP
                    .GENERAL,

            dataPath:
                'src/engine/content/data/' +
                'ship_weapons.json',

            schema:
                SHIP_WEAPON_TUNING_SCHEMA,

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

            group:
                CONTENT_COLLECTION_GROUP
                    .SHIP_MODULES,

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

            group:
                CONTENT_COLLECTION_GROUP
                    .SHIP_MODULES,

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

            group:
                CONTENT_COLLECTION_GROUP
                    .SHIP_MODULES,

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

            group:
                CONTENT_COLLECTION_GROUP
                    .GENERAL,

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

            group:
                CONTENT_COLLECTION_GROUP
                    .GENERAL,

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

            group:
                CONTENT_COLLECTION_GROUP
                    .SHIP_MODULES,

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

            group:
                CONTENT_COLLECTION_GROUP
                    .GENERAL,

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

            group:
                CONTENT_COLLECTION_GROUP
                    .GENERAL,

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

export class ContentCollectionMutationError
    extends Error {
    public constructor(
        message: string,
    ) {
        super(message);

        this.name =
            'ContentCollectionMutationError';
    }
}

export function getContentCollectionSummaries():
    ContentCollectionSummary[] {
    return Object.values(
        CONTENT_COLLECTIONS,
    ).map((collection) => {
        return {
            id: collection.id,
            label: collection.label,

            group:
                collection.group,

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

export function validateContentCollectionMutation(
    id: string,
    currentData: unknown,
    nextData: unknown,
): void {
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

    const currentIds =
        new Set(
            getContentRecordIds(
                currentData,
                id,
            ),
        );

    const nextIds =
        new Set(
            getContentRecordIds(
                nextData,
                id,
            ),
        );

    if (!definition.canAdd) {
        for (
            const recordId of
            nextIds
        ) {
            if (
                currentIds.has(
                    recordId,
                )
            ) {
                continue;
            }

            throw new ContentCollectionMutationError(
                (
                    'Cannot add record "' +
                    recordId +
                    '" to content collection "' +
                    definition.label +
                    '": adding records is disabled.'
                ),
            );
        }
    }

    if (!definition.canDelete) {
        for (
            const recordId of
            currentIds
        ) {
            if (
                nextIds.has(
                    recordId,
                )
            ) {
                continue;
            }

            throw new ContentCollectionMutationError(
                (
                    'Cannot delete record "' +
                    recordId +
                    '" from content collection "' +
                    definition.label +
                    '": deleting records is disabled.'
                ),
            );
        }
    }
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

function getContentRecordIds(
    input: unknown,
    collectionId: string,
): string[] {
    if (
        typeof input !== 'object' ||
        input === null ||
        Array.isArray(input)
    ) {
        throw new Error(
            (
                'Content collection "' +
                collectionId +
                '" must contain an object.'
            ),
        );
    }

    return Object.keys(
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
