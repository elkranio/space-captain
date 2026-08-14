import {
    describe,
    expect,
    it,
} from 'vitest';
import powerCoreData from '../../src/engine/content/data/power_cores.json';
import enemyBehaviorRulesData from '../../src/engine/content/data/enemy_behavior_rules.json';
import officerTaskData from '../../src/engine/content/data/officer_tasks.json';
import defenseTurretData from '../../src/engine/content/data/defense_turrets.json';
import shieldGeneratorData from '../../src/engine/content/data/shield_generators.json';
import shipBehaviorData from '../../src/engine/content/data/ship_behaviors.json';
import shipChassisData from '../../src/engine/content/data/ship_chassis.json';
import shipDriveData from '../../src/engine/content/data/ship_drives.json';
import shipWeaponRulesData from '../../src/engine/content/data/ship_weapon_rules.json';
import missileLauncherData from '../../src/engine/content/data/missile_launchers.json';
import laserEmitterData from '../../src/engine/content/data/laser_emitters.json';
import spamProjectorData from '../../src/engine/content/data/spam_projectors.json';
import stickyMineDispenserData from '../../src/engine/content/data/sticky_mine_dispensers.json';
import {
    CONTENT_COLLECTION_GROUP,
    CONTENT_COLLECTION_ID,
    getContentCollectionDefinition,
    getContentCollectionJsonSchema,
    getContentCollectionSummaries,
    validateContentCollection,
    validateContentCollectionMutation,
} from '../../tools/content-editor/server/content_registry';

describe(
    'Content editor registry',
    () => {
        it(
            'exposes only explicitly registered content collections',
            () => {
                const summaries =
                    getContentCollectionSummaries();

                expect(
                    summaries.map(
                        (summary) => {
                            return {
                                id: summary.id,
                                label:
                                    summary.label,
                                canAdd:
                                    summary.canAdd,
                                canDelete:
                                    summary.canDelete,
                            };
                        },
                    ),
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
                                .MISSILE_LAUNCHERS,

                        label:
                            'Missile Launchers',

                        canAdd: true,
                        canDelete: true,
                    },
                    {
                        id:
                            CONTENT_COLLECTION_ID
                                .LASER_EMITTERS,

                        label:
                            'Laser Emitters',

                        canAdd: true,
                        canDelete: true,
                    },
                    {
                        id:
                            CONTENT_COLLECTION_ID
                                .SPAM_PROJECTORS,

                        label:
                            'Spam Projectors',

                        canAdd: true,
                        canDelete: true,
                    },
                    {
                        id:
                            CONTENT_COLLECTION_ID
                                .STICKY_MINE_DISPENSERS,

                        label:
                            'Sticky Mine Dispensers',

                        canAdd: true,
                        canDelete: true,
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
                                .ENEMY_BEHAVIOR_RULES,

                        label:
                            'Enemy Behavior Rules',

                        canAdd: false,
                        canDelete: false,
                    },
                ]);

                expect(
                    summaries
                        .filter((summary) => {
                            return (
                                summary.group ===
                                CONTENT_COLLECTION_GROUP
                                    .SHIP_MODULES
                            );
                        })
                        .map((summary) => {
                            return summary.id;
                        }),
                ).toEqual([
                    CONTENT_COLLECTION_ID
                        .POWER_CORES,

                    CONTENT_COLLECTION_ID
                        .DEFENSE_TURRETS,

                    CONTENT_COLLECTION_ID
                        .SHIELD_GENERATORS,

                    CONTENT_COLLECTION_ID
                        .SHIP_DRIVES,
                ]);

                expect(
                    summaries
                        .filter((summary) => {
                            return (
                                summary.group ===
                                CONTENT_COLLECTION_GROUP
                                    .SHIP_WEAPONS
                            );
                        })
                        .map((summary) => {
                            return summary.id;
                        }),
                ).toEqual([
                    CONTENT_COLLECTION_ID
                        .MISSILE_LAUNCHERS,

                    CONTENT_COLLECTION_ID
                        .LASER_EMITTERS,

                    CONTENT_COLLECTION_ID
                        .SPAM_PROJECTORS,

                    CONTENT_COLLECTION_ID
                        .STICKY_MINE_DISPENSERS,
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
                            .MISSILE_LAUNCHERS,
                        missileLauncherData,
                    ],
                    [
                        CONTENT_COLLECTION_ID
                            .LASER_EMITTERS,
                        laserEmitterData,
                    ],
                    [
                        CONTENT_COLLECTION_ID
                            .SPAM_PROJECTORS,
                        spamProjectorData,
                    ],
                    [
                        CONTENT_COLLECTION_ID
                            .STICKY_MINE_DISPENSERS,
                        stickyMineDispenserData,
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
            'enforces add and delete capabilities at the collection mutation boundary',
            () => {
                const editablePowerCores = {
                    ...powerCoreData,

                    experimental_00: {
                        name:
                            'EXPERIMENTAL CORE',
                    },
                } as Record<
                    string,
                    unknown
                >;

                expect(() => {
                    validateContentCollectionMutation(
                        CONTENT_COLLECTION_ID
                            .POWER_CORES,
                        powerCoreData,
                        editablePowerCores,
                    );
                }).not.toThrow();

                const firstPowerCoreId =
                    Object.keys(
                        editablePowerCores,
                    )[0];

                if (!firstPowerCoreId) {
                    throw new Error(
                        'Power Core fixture is empty.',
                    );
                }

                delete editablePowerCores[
                    firstPowerCoreId
                ];

                expect(() => {
                    validateContentCollectionMutation(
                        CONTENT_COLLECTION_ID
                            .POWER_CORES,
                        powerCoreData,
                        editablePowerCores,
                    );
                }).not.toThrow();
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
