import {
    describe,
    expect,
    it,
} from 'vitest';
import defenseCapacitorData from '../../src/engine/content/data/defense_capacitors.json';
import missileData from '../../src/engine/content/data/missiles.json';
import officerTaskData from '../../src/engine/content/data/officer_tasks.json';
import pointDefenseData from '../../src/engine/content/data/point_defenses.json';
import shieldEmitterData from '../../src/engine/content/data/shield_emitters.json';
import shipBehaviorData from '../../src/engine/content/data/ship_behaviors.json';
import shipWeaponRulesData from '../../src/engine/content/data/ship_weapon_rules.json';
import shipWeaponData from '../../src/engine/content/data/ship_weapons.json';
import {
    CONTENT_COLLECTION_ID,
    getContentCollectionDefinition,
    getContentCollectionJsonSchema,
    getContentCollectionSummaries,
    validateContentCollection,
} from '../../tools/content-editor/server/content_registry';

describe(
    'Content editor registry',
    () => {
        it(
            'exposes only explicitly registered content collections',
            () => {
                expect(
                    getContentCollectionSummaries(),
                ).toEqual([
                    {
                        id:
                            CONTENT_COLLECTION_ID
                                .OFFICER_TASKS,

                        label:
                            'Officer Tasks',

                        canAdd: false,
                        canDelete: false,
                    },
                    {
                        id:
                            CONTENT_COLLECTION_ID
                                .SHIP_WEAPON_RULES,

                        label:
                            'Ship Weapon Rules',

                        canAdd: false,
                        canDelete: false,
                    },
                    {
                        id:
                            CONTENT_COLLECTION_ID
                                .SHIP_WEAPONS,

                        label:
                            'Ship Weapons',

                        canAdd: false,
                        canDelete: false,
                    },
                    {
                        id:
                            CONTENT_COLLECTION_ID
                                .MISSILES,

                        label:
                            'Missiles',

                        canAdd: false,
                        canDelete: false,
                    },
                    {
                        id:
                            CONTENT_COLLECTION_ID
                                .DEFENSE_CAPACITORS,

                        label:
                            'Defense Capacitors',

                        canAdd: false,
                        canDelete: false,
                    },
                    {
                        id:
                            CONTENT_COLLECTION_ID
                                .POINT_DEFENSES,

                        label:
                            'Point Defenses',

                        canAdd: false,
                        canDelete: false,
                    },
                    {
                        id:
                            CONTENT_COLLECTION_ID
                                .SHIELD_EMITTERS,

                        label:
                            'Shield Emitters',

                        canAdd: false,
                        canDelete: false,
                    },
                    {
                        id:
                            CONTENT_COLLECTION_ID
                                .SHIP_BEHAVIORS,

                        label:
                            'Ship Behaviors',

                        canAdd: false,
                        canDelete: false,
                    },
                ]);

                expect(
                    getContentCollectionDefinition(
                        'not_a_collection',
                    ),
                ).toBeUndefined();
            },
        );

        it(
            'validates current collection data through shared runtime schemas',
            () => {
                const cases: Array<
                    [
                        string,
                        unknown,
                    ]
                > = [
                    [
                        CONTENT_COLLECTION_ID
                            .OFFICER_TASKS,
                        officerTaskData,
                    ],
                    [
                        CONTENT_COLLECTION_ID
                            .SHIP_WEAPON_RULES,
                        shipWeaponRulesData,
                    ],
                    [
                        CONTENT_COLLECTION_ID
                            .SHIP_WEAPONS,
                        shipWeaponData,
                    ],
                    [
                        CONTENT_COLLECTION_ID
                            .MISSILES,
                        missileData,
                    ],
                    [
                        CONTENT_COLLECTION_ID
                            .DEFENSE_CAPACITORS,
                        defenseCapacitorData,
                    ],
                    [
                        CONTENT_COLLECTION_ID
                            .POINT_DEFENSES,
                        pointDefenseData,
                    ],
                    [
                        CONTENT_COLLECTION_ID
                            .SHIELD_EMITTERS,
                        shieldEmitterData,
                    ],
                    [
                        CONTENT_COLLECTION_ID
                            .SHIP_BEHAVIORS,
                        shipBehaviorData,
                    ],
                ];

                for (
                    const [
                        collectionId,
                        data,
                    ] of cases
                ) {
                    expect(
                        validateContentCollection(
                            collectionId,
                            data,
                        ),
                    ).toEqual(
                        data,
                    );
                }
            },
        );

        it(
            'generates editor fields from the same schemas',
            () => {
                const officerSchema =
                    getContentCollectionJsonSchema(
                        CONTENT_COLLECTION_ID
                            .OFFICER_TASKS,
                    ) as {
                        properties?: Record<
                            string,
                            {
                                properties?: Record<
                                    string,
                                    unknown
                                >;
                            }
                        >;
                    };

                const timed =
                    officerSchema.properties
                        ?.science_identify_threat
                        ?.properties;

                const external =
                    officerSchema.properties
                        ?.helm_fly_to
                        ?.properties;

                expect(
                    timed,
                ).toHaveProperty(
                    'durationMs',
                );

                expect(
                    external,
                ).not.toHaveProperty(
                    'durationMs',
                );

                const missileSchema =
                    getContentCollectionJsonSchema(
                        CONTENT_COLLECTION_ID
                            .MISSILES,
                    ) as {
                        properties?: Record<
                            string,
                            {
                                properties?: Record<
                                    string,
                                    {
                                        enum?: unknown[];
                                    }
                                >;
                            }
                        >;
                    };

                expect(
                    missileSchema
                        .properties
                        ?.red_00
                        ?.properties
                        ?.spectralBand
                        ?.enum,
                ).toEqual([
                    'red',
                    'blue',
                ]);

                const behaviorSchema =
                    getContentCollectionJsonSchema(
                        CONTENT_COLLECTION_ID
                            .SHIP_BEHAVIORS,
                    ) as {
                        properties?: Record<
                            string,
                            {
                                properties?: Record<
                                    string,
                                    unknown
                                >;
                            }
                        >;
                    };

                expect(
                    behaviorSchema
                        .properties
                        ?.standard_combat_00
                        ?.properties,
                ).toHaveProperty(
                    'offensiveTaskDelayMs',
                );
            },
        );
    },
);
