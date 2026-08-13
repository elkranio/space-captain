import * as z from 'zod';
import {
    DEFENSE_CAPACITOR_TUNING_SCHEMA,
} from '../../../src/engine/content/schemas/defense_capacitors';
import {
    MISSILE_TUNING_SCHEMA,
} from '../../../src/engine/content/schemas/missiles';
import {
    OFFICER_TASK_TUNING_SCHEMA,
} from '../../../src/engine/content/schemas/officer_task_tuning';
import {
    POINT_DEFENSE_TUNING_SCHEMA,
} from '../../../src/engine/content/schemas/point_defenses';
import {
    SHIELD_EMITTER_TUNING_SCHEMA,
} from '../../../src/engine/content/schemas/shield_emitters';
import {
    SHIP_BEHAVIOR_TUNING_SCHEMA,
} from '../../../src/engine/content/schemas/ship_behaviors';
import {
    SHIP_WEAPON_RULES_SCHEMA,
} from '../../../src/engine/content/schemas/ship_weapon_rules';
import {
    SHIP_WEAPON_TUNING_SCHEMA,
} from '../../../src/engine/content/schemas/ship_weapons';

export const CONTENT_COLLECTION_ID = {
    OFFICER_TASKS:
        'officer_tasks',

    SHIP_WEAPON_RULES:
        'ship_weapon_rules',

    SHIP_WEAPONS:
        'ship_weapons',

    MISSILES:
        'missiles',

    DEFENSE_CAPACITORS:
        'defense_capacitors',

    POINT_DEFENSES:
        'point_defenses',

    SHIELD_EMITTERS:
        'shield_emitters',

    SHIP_BEHAVIORS:
        'ship_behaviors',
} as const;

export type ContentCollectionId =
    (typeof CONTENT_COLLECTION_ID)[
        keyof typeof CONTENT_COLLECTION_ID
    ];

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
            .DEFENSE_CAPACITORS]: {
            id:
                CONTENT_COLLECTION_ID
                    .DEFENSE_CAPACITORS,

            label:
                'Defense Capacitors',

            dataPath:
                'src/engine/content/data/' +
                'defense_capacitors.json',

            schema:
                DEFENSE_CAPACITOR_TUNING_SCHEMA,

            canAdd: false,
            canDelete: false,
        },

        [CONTENT_COLLECTION_ID
            .POINT_DEFENSES]: {
            id:
                CONTENT_COLLECTION_ID
                    .POINT_DEFENSES,

            label:
                'Point Defenses',

            dataPath:
                'src/engine/content/data/' +
                'point_defenses.json',

            schema:
                POINT_DEFENSE_TUNING_SCHEMA,

            canAdd: false,
            canDelete: false,
        },

        [CONTENT_COLLECTION_ID
            .SHIELD_EMITTERS]: {
            id:
                CONTENT_COLLECTION_ID
                    .SHIELD_EMITTERS,

            label:
                'Shield Emitters',

            dataPath:
                'src/engine/content/data/' +
                'shield_emitters.json',

            schema:
                SHIELD_EMITTER_TUNING_SCHEMA,

            canAdd: false,
            canDelete: false,
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
    };

export type ContentCollectionSummary = {
    id: ContentCollectionId;
    label: string;
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
