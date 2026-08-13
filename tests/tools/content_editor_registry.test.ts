import {
    describe,
    expect,
    it,
} from 'vitest';
import powerCoreData from '../../src/engine/content/data/power_cores.json';
import enemyBehaviorRulesData from '../../src/engine/content/data/enemy_behavior_rules.json';
import missileData from '../../src/engine/content/data/missiles.json';
import officerTaskData from '../../src/engine/content/data/officer_tasks.json';
import defenseTurretData from '../../src/engine/content/data/defense_turrets.json';
import shieldGeneratorData from '../../src/engine/content/data/shield_generators.json';
import shipBehaviorData from '../../src/engine/content/data/ship_behaviors.json';
import shipChassisData from '../../src/engine/content/data/ship_chassis.json';
import shipDriveData from '../../src/engine/content/data/ship_drives.json';
import shipWeaponRulesData from '../../src/engine/content/data/ship_weapon_rules.json';
import shipWeaponData from '../../src/engine/content/data/ship_weapons.json';
import stickyMineData from '../../src/engine/content/data/sticky_mines.json';
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
                                .POWER_CORES,

                        label:
                            'Power Cores',

                        canAdd: true,
                        canDelete: true,
                    },
                    {
                        id:
                            CONTENT_COLLECTION_ID
                                .DEFENSE_TURRETS,

                        label:
                            'Defense Turrets',

                        canAdd: true,
                        canDelete: true,
                    },
                    {
                        id:
                            CONTENT_COLLECTION_ID
                                .SHIELD_GENERATORS,

                        label:
                            'Shield Generators',

                        canAdd: true,
                        canDelete: true,
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
                    {
                        id:
                            CONTENT_COLLECTION_ID
                                .SHIP_CHASSIS,

                        label:
                            'Ship Chassis',

                        canAdd: true,
                        canDelete: true,
                    },
                    {
                        id:
                            CONTENT_COLLECTION_ID
                                .SHIP_DRIVES,

                        label:
                            'Drives',

                        canAdd: true,
                        canDelete: true,
                    },
                    {
                        id:
                            CONTENT_COLLECTION_ID
                                .STICKY_MINES,

                        label:
                            'Sticky Mines',

                        canAdd: false,
                        canDelete: false,
                    },
                    {
                        id:
                            CONTENT_COLLECTION_ID
                                .ENEMY_BEHAVIOR_RULES,

                        label:
                            'Enemy Behavior Rules',

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
                            .POWER_CORES,
                        powerCoreData,
                    ],
                    [
                        CONTENT_COLLECTION_ID
                            .DEFENSE_TURRETS,
                        defenseTurretData,
                    ],
                    [
                        CONTENT_COLLECTION_ID
                            .SHIELD_GENERATORS,
                        shieldGeneratorData,
                    ],
                    [
                        CONTENT_COLLECTION_ID
                            .SHIP_BEHAVIORS,
                        shipBehaviorData,
                    ],
                    [
                        CONTENT_COLLECTION_ID
                            .SHIP_CHASSIS,
                        shipChassisData,
                    ],
                    [
                        CONTENT_COLLECTION_ID
                            .SHIP_DRIVES,
                        shipDriveData,
                    ],
                    [
                        CONTENT_COLLECTION_ID
                            .STICKY_MINES,
                        stickyMineData,
                    ],
                    [
                        CONTENT_COLLECTION_ID
                            .ENEMY_BEHAVIOR_RULES,
                        enemyBehaviorRulesData,
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
                        ?.basic_00
                        ?.properties,
                ).not.toHaveProperty(
                    'signature',
                );

                expect(
                    missileSchema
                        .properties
                        ?.basic_01
                        ?.properties,
                ).not.toHaveProperty(
                    'signature',
                );

                const chassisSchema =
                    getContentCollectionJsonSchema(
                        CONTENT_COLLECTION_ID
                            .SHIP_CHASSIS,
                    ) as {
                        additionalProperties?: {
                            properties?: Record<
                                string,
                                {
                                    ['x-editor-asset-bucket']?:
                                        string;
                                }
                            >;
                        };
                    };

                expect(
                    chassisSchema
                        .additionalProperties
                        ?.properties
                        ?.spriteId
                        ?.[
                            'x-editor-asset-bucket'
                        ],
                ).toBe(
                    'ship_chassis',
                );

                const behaviorRulesSchema =
                    getContentCollectionJsonSchema(
                        CONTENT_COLLECTION_ID
                            .ENEMY_BEHAVIOR_RULES,
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
                    behaviorRulesSchema
                        .properties
                        ?.shield_placement
                        ?.properties,
                ).toHaveProperty(
                    'impactReserveMs',
                );
            },
        );
    },
);
