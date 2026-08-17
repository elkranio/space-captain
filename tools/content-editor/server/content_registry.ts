import * as z from 'zod';
import {
    ENEMY_DEBUG_BEHAVIORS_SCHEMA,
} from '../../../src/app/debug/enemy_debug_behaviors_schema';
import {
    DEBUG_START_SCHEMA,
} from '../../../src/engine/content/schemas/debug_start';
import {
    POWER_CORE_TUNING_SCHEMA,
} from '../../../src/engine/content/schemas/power_cores';
import {
    ENEMY_BEHAVIOR_RULES_SCHEMA,
} from '../../../src/engine/content/schemas/enemy_behavior_rules';
import {
    ENGINEER_OFFICER_TASK_TUNING_SCHEMA,
    HELM_OFFICER_TASK_TUNING_SCHEMA,
    SCIENCE_OFFICER_TASK_TUNING_SCHEMA,
    WEAPONS_OFFICER_TASK_TUNING_SCHEMA,
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
    BEAM_CANNON_TUNING_SCHEMA,
    MISSILE_LAUNCHER_TUNING_SCHEMA,
    SPAM_PROJECTOR_TUNING_SCHEMA,
    STICKY_MINE_DISPENSER_TUNING_SCHEMA,
} from '../../../src/engine/content/schemas/ship_weapons';

export const CONTENT_COLLECTION_ID = {
    DEBUG_START:
        'debug_start',

    ENEMY_DEBUG_BEHAVIORS:
        'enemy_debug_behaviors',

    OFFICER_TASKS_SCIENCE:
        'officer_tasks_science',

    OFFICER_TASKS_WEAPONS:
        'officer_tasks_weapons',

    OFFICER_TASKS_HELM:
        'officer_tasks_helm',

    OFFICER_TASKS_ENGINEER:
        'officer_tasks_engineer',

    MISSILE_LAUNCHERS:
        'missile_launchers',

    BEAM_CANNONS:
        'beam_cannons',

    SPAM_PROJECTORS:
        'spam_projectors',

    STICKY_MINE_DISPENSERS:
        'sticky_mine_dispensers',

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

    ENEMY_BEHAVIOR_RULES:
        'enemy_behavior_rules',
} as const;

export type ContentCollectionId =
    (typeof CONTENT_COLLECTION_ID)[
        keyof typeof CONTENT_COLLECTION_ID
    ];

export const CONTENT_COLLECTION_GROUP = {
    DEBUG_START:
        'Debug Start',

    GENERAL:
        'General',

    OFFICER_TASKS:
        'Officer Tasks',

    ENEMY_BEHAVIOR:
        'Enemy Behavior',

    SHIP_MODULES:
        'Ship Modules',

    SHIP_WEAPONS:
        'Ship Weapons',
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
            .DEBUG_START]: {
            id:
                CONTENT_COLLECTION_ID
                    .DEBUG_START,

            label:
                'Ships',

            group:
                CONTENT_COLLECTION_GROUP
                    .DEBUG_START,

            dataPath:
                'src/engine/content/data/' +
                'debug_start.json',

            schema:
                DEBUG_START_SCHEMA,

            canAdd: false,
            canDelete: false,
        },

        [CONTENT_COLLECTION_ID
            .ENEMY_DEBUG_BEHAVIORS]: {
            id:
                CONTENT_COLLECTION_ID
                    .ENEMY_DEBUG_BEHAVIORS,

            label:
                'Enemy Behaviors',

            group:
                CONTENT_COLLECTION_GROUP
                    .DEBUG_START,

            dataPath:
                'src/app/debug/data/' +
                'enemy_debug_behaviors.json',

            schema:
                ENEMY_DEBUG_BEHAVIORS_SCHEMA,

            canAdd: false,
            canDelete: false,
        },

        [CONTENT_COLLECTION_ID
            .OFFICER_TASKS_SCIENCE]: {
            id:
                CONTENT_COLLECTION_ID
                    .OFFICER_TASKS_SCIENCE,

            label: 'Science',

            group:
                CONTENT_COLLECTION_GROUP
                    .OFFICER_TASKS,

            dataPath:
                'src/engine/content/data/' +
                'officer_tasks_science.json',

            schema:
                SCIENCE_OFFICER_TASK_TUNING_SCHEMA,

            canAdd: false,
            canDelete: false,
        },

        [CONTENT_COLLECTION_ID
            .OFFICER_TASKS_WEAPONS]: {
            id:
                CONTENT_COLLECTION_ID
                    .OFFICER_TASKS_WEAPONS,

            label: 'Weapons',

            group:
                CONTENT_COLLECTION_GROUP
                    .OFFICER_TASKS,

            dataPath:
                'src/engine/content/data/' +
                'officer_tasks_weapons.json',

            schema:
                WEAPONS_OFFICER_TASK_TUNING_SCHEMA,

            canAdd: false,
            canDelete: false,
        },

        [CONTENT_COLLECTION_ID
            .OFFICER_TASKS_HELM]: {
            id:
                CONTENT_COLLECTION_ID
                    .OFFICER_TASKS_HELM,

            label: 'Helm',

            group:
                CONTENT_COLLECTION_GROUP
                    .OFFICER_TASKS,

            dataPath:
                'src/engine/content/data/' +
                'officer_tasks_helm.json',

            schema:
                HELM_OFFICER_TASK_TUNING_SCHEMA,

            canAdd: false,
            canDelete: false,
        },

        [CONTENT_COLLECTION_ID
            .OFFICER_TASKS_ENGINEER]: {
            id:
                CONTENT_COLLECTION_ID
                    .OFFICER_TASKS_ENGINEER,

            label: 'Engineer',

            group:
                CONTENT_COLLECTION_GROUP
                    .OFFICER_TASKS,

            dataPath:
                'src/engine/content/data/' +
                'officer_tasks_engineer.json',

            schema:
                ENGINEER_OFFICER_TASK_TUNING_SCHEMA,

            canAdd: false,
            canDelete: false,
        },

        [CONTENT_COLLECTION_ID
            .MISSILE_LAUNCHERS]: {
            id:
                CONTENT_COLLECTION_ID
                    .MISSILE_LAUNCHERS,

            label:
                'Missile Launchers',

            group:
                CONTENT_COLLECTION_GROUP
                    .SHIP_WEAPONS,

            dataPath:
                'src/engine/content/data/' +
                'missile_launchers.json',

            schema:
                MISSILE_LAUNCHER_TUNING_SCHEMA,

            canAdd: true,
            canDelete: true,
        },

        [CONTENT_COLLECTION_ID
            .BEAM_CANNONS]: {
            id:
                CONTENT_COLLECTION_ID
                    .BEAM_CANNONS,

            label:
                'Beam Cannons',

            group:
                CONTENT_COLLECTION_GROUP
                    .SHIP_WEAPONS,

            dataPath:
                'src/engine/content/data/' +
                'beam_cannons.json',

            schema:
                BEAM_CANNON_TUNING_SCHEMA,

            canAdd: true,
            canDelete: true,
        },

        [CONTENT_COLLECTION_ID
            .SPAM_PROJECTORS]: {
            id:
                CONTENT_COLLECTION_ID
                    .SPAM_PROJECTORS,

            label:
                'Spam Projectors',

            group:
                CONTENT_COLLECTION_GROUP
                    .SHIP_WEAPONS,

            dataPath:
                'src/engine/content/data/' +
                'spam_projectors.json',

            schema:
                SPAM_PROJECTOR_TUNING_SCHEMA,

            canAdd: true,
            canDelete: true,
        },

        [CONTENT_COLLECTION_ID
            .STICKY_MINE_DISPENSERS]: {
            id:
                CONTENT_COLLECTION_ID
                    .STICKY_MINE_DISPENSERS,

            label:
                'Sticky Mine Dispensers',

            group:
                CONTENT_COLLECTION_GROUP
                    .SHIP_WEAPONS,

            dataPath:
                'src/engine/content/data/' +
                'sticky_mine_dispensers.json',

            schema:
                STICKY_MINE_DISPENSER_TUNING_SCHEMA,

            canAdd: true,
            canDelete: true,
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
                'Captain Presets',

            group:
                CONTENT_COLLECTION_GROUP
                    .ENEMY_BEHAVIOR,

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
            .ENEMY_BEHAVIOR_RULES]: {
            id:
                CONTENT_COLLECTION_ID
                    .ENEMY_BEHAVIOR_RULES,

            label:
                'General Rules',

            group:
                CONTENT_COLLECTION_GROUP
                    .ENEMY_BEHAVIOR,

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
