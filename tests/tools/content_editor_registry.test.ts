import {
    describe,
    expect,
    it,
} from 'vitest';
import enemyDebugBehaviorsData from '../../src/app/debug/data/enemy_debug_behaviors.json';
import debugStartData from '../../src/engine/content/data/debug_start.json';
import powerCoreData from '../../src/engine/content/data/power_cores.json';
import enemyBehaviorRulesData from '../../src/engine/content/data/enemy_behavior_rules.json';
import scienceOfficerTaskData from '../../src/engine/content/data/officer_tasks_science.json';
import weaponsOfficerTaskData from '../../src/engine/content/data/officer_tasks_weapons.json';
import helmOfficerTaskData from '../../src/engine/content/data/officer_tasks_helm.json';
import engineerOfficerTaskData from '../../src/engine/content/data/officer_tasks_engineer.json';
import defenseTurretData from '../../src/engine/content/data/defense_turrets.json';
import shieldGeneratorData from '../../src/engine/content/data/shield_generators.json';
import shipBehaviorData from '../../src/engine/content/data/ship_behaviors.json';
import shipChassisData from '../../src/engine/content/data/ship_chassis.json';
import shipDriveData from '../../src/engine/content/data/ship_drives.json';
import missileLauncherData from '../../src/engine/content/data/missile_launchers.json';
import beamCannonData from '../../src/engine/content/data/beam_cannons.json';
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
                                .DEBUG_START,

                        label:
                            'Ships',

                        canAdd: false,
                        canDelete: false,
                    },
                    {
                        id:
                            CONTENT_COLLECTION_ID
                                .ENEMY_DEBUG_BEHAVIORS,

                        label:
                            'Enemy Behaviors',

                        canAdd: false,
                        canDelete: false,
                    },
                    {
                        id:
                            CONTENT_COLLECTION_ID
                                .OFFICER_TASKS_SCIENCE,

                        label:
                            'Science',

                        canAdd: false,
                        canDelete: false,
                    },
                    {
                        id:
                            CONTENT_COLLECTION_ID
                                .OFFICER_TASKS_WEAPONS,

                        label:
                            'Weapons',

                        canAdd: false,
                        canDelete: false,
                    },
                    {
                        id:
                            CONTENT_COLLECTION_ID
                                .OFFICER_TASKS_HELM,

                        label:
                            'Helm',

                        canAdd: false,
                        canDelete: false,
                    },
                    {
                        id:
                            CONTENT_COLLECTION_ID
                                .OFFICER_TASKS_ENGINEER,

                        label:
                            'Engineer',

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
                                .BEAM_CANNONS,

                        label:
                            'Beam Cannons',

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
                            'Captain Presets',

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
                            'General Rules',

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
                                    .DEBUG_START
                            );
                        })
                        .map((summary) => {
                            return summary.id;
                        }),
                ).toEqual([
                    CONTENT_COLLECTION_ID
                        .DEBUG_START,

                    CONTENT_COLLECTION_ID
                        .ENEMY_DEBUG_BEHAVIORS,
                ]);

                expect(
                    summaries
                        .filter((summary) => {
                            return (
                                summary.group ===
                                CONTENT_COLLECTION_GROUP
                                    .OFFICER_TASKS
                            );
                        })
                        .map((summary) => {
                            return summary.id;
                        }),
                ).toEqual([
                    CONTENT_COLLECTION_ID
                        .OFFICER_TASKS_SCIENCE,

                    CONTENT_COLLECTION_ID
                        .OFFICER_TASKS_WEAPONS,

                    CONTENT_COLLECTION_ID
                        .OFFICER_TASKS_HELM,

                    CONTENT_COLLECTION_ID
                        .OFFICER_TASKS_ENGINEER,
                ]);

                expect(
                    summaries
                        .filter((summary) => {
                            return (
                                summary.group ===
                                CONTENT_COLLECTION_GROUP
                                    .ENEMY_BEHAVIOR
                            );
                        })
                        .map((summary) => {
                            return summary.id;
                        }),
                ).toEqual([
                    CONTENT_COLLECTION_ID
                        .SHIP_BEHAVIORS,

                    CONTENT_COLLECTION_ID
                        .ENEMY_BEHAVIOR_RULES,
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
                        .BEAM_CANNONS,

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
                            .DEBUG_START,
                        debugStartData,
                    ],
                    [
                        CONTENT_COLLECTION_ID
                            .ENEMY_DEBUG_BEHAVIORS,
                        enemyDebugBehaviorsData,
                    ],
                    [
                        CONTENT_COLLECTION_ID
                            .OFFICER_TASKS_SCIENCE,
                        scienceOfficerTaskData,
                    ],
                    [
                        CONTENT_COLLECTION_ID
                            .OFFICER_TASKS_WEAPONS,
                        weaponsOfficerTaskData,
                    ],
                    [
                        CONTENT_COLLECTION_ID
                            .OFFICER_TASKS_HELM,
                        helmOfficerTaskData,
                    ],
                    [
                        CONTENT_COLLECTION_ID
                            .OFFICER_TASKS_ENGINEER,
                        engineerOfficerTaskData,
                    ],
                    [
                        CONTENT_COLLECTION_ID
                            .MISSILE_LAUNCHERS,
                        missileLauncherData,
                    ],
                    [
                        CONTENT_COLLECTION_ID
                            .BEAM_CANNONS,
                        beamCannonData,
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
                const debugStartSchema =
                    getContentCollectionJsonSchema(
                        CONTENT_COLLECTION_ID
                            .DEBUG_START,
                    ) as {
                        properties?: Record<
                            string,
                            {
                                title?: string;
                                properties?: Record<
                                    string,
                                    {
                                        type?:
                                            string |
                                            string[];

                                        anyOf?: Array<{
                                            type?: string;
                                        }>;
                                    }
                                >;
                            }
                        >;
                    };

                expect(
                    Object.keys(
                        debugStartSchema
                            .properties ?? {},
                    ),
                ).toEqual([
                    'player',
                    'enemy',
                ]);

                expect(
                    debugStartSchema
                        .properties
                        ?.player
                        ?.title,
                ).toBe(
                    'Player Ship',
                );

                expect(
                    debugStartSchema
                        .properties
                        ?.enemy
                        ?.title,
                ).toBe(
                    'Enemy Ship',
                );

                const optionalWeaponSchema =
                    debugStartSchema
                        .properties
                        ?.enemy
                        ?.properties
                        ?.weaponSlot2Id;

                const optionalWeaponTypes =
                    Array.isArray(
                        optionalWeaponSchema
                            ?.type,
                    )
                        ? optionalWeaponSchema
                            .type
                        : optionalWeaponSchema
                            ?.anyOf
                            ?.map(
                                (variant) => {
                                    return variant.type;
                                },
                            );

                expect(
                    optionalWeaponTypes,
                ).toEqual(
                    expect.arrayContaining([
                        'string',
                        'null',
                    ]),
                );

                const enemyDebugBehaviorSchema =
                    getContentCollectionJsonSchema(
                        CONTENT_COLLECTION_ID
                            .ENEMY_DEBUG_BEHAVIORS,
                    ) as {
                        properties?: {
                            enemy?: {
                                properties?: {
                                    evadeAtCombatStart?: {
                                        type?: string;
                                    };

                                    disruptPlayerDriveAtCombatStart?: {
                                        type?: string;
                                    };
                                };
                            };
                        };
                    };

                expect(
                    enemyDebugBehaviorSchema
                        .properties
                        ?.enemy
                        ?.properties
                        ?.evadeAtCombatStart
                        ?.type,
                ).toBe(
                    'boolean',
                );

                expect(
                    enemyDebugBehaviorSchema
                        .properties
                        ?.enemy
                        ?.properties
                        ?.disruptPlayerDriveAtCombatStart
                        ?.type,
                ).toBe(
                    'boolean',
                );

                const scienceOfficerSchema =
                    getContentCollectionJsonSchema(
                        CONTENT_COLLECTION_ID
                            .OFFICER_TASKS_SCIENCE,
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

                const helmOfficerSchema =
                    getContentCollectionJsonSchema(
                        CONTENT_COLLECTION_ID
                            .OFFICER_TASKS_HELM,
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
                    scienceOfficerSchema
                        .properties
                        ?.science_purge_spam
                        ?.properties;

                const external =
                    helmOfficerSchema
                        .properties
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

                const captainPresetSchema =
                    getContentCollectionJsonSchema(
                        CONTENT_COLLECTION_ID
                            .SHIP_BEHAVIORS,
                    ) as {
                        properties?: Record<
                            string,
                            {
                                properties?: Record<
                                    string,
                                    {
                                        description?: string;
                                    }
                                >;
                            }
                        >;
                    };

                const captainFields =
                    captainPresetSchema
                        .properties
                        ?.standard_combat_00
                        ?.properties;

                expect(
                    captainFields,
                ).toHaveProperty(
                    'decisionTickDurationMs',
                );

                expect(
                    captainFields,
                ).toHaveProperty(
                    'decisionTickWiggleMs',
                );

                expect(
                    captainFields,
                ).toHaveProperty(
                    'threatTimingWiggleMs',
                );

                expect(
                    captainFields,
                ).toHaveProperty(
                    'aggression',
                );

                expect(
                    captainFields
                        ?.decisionTickDurationMs
                        ?.description,
                ).toContain(
                    'interval between captain decision attempts',
                );

                expect(
                    captainFields
                        ?.decisionTickWiggleMs
                        ?.description,
                ).toContain(
                    'preventing a fixed rhythm',
                );

                expect(
                    captainFields
                        ?.threatTimingWiggleMs
                        ?.description,
                ).toContain(
                    'mitigated in time',
                );

                expect(
                    captainFields
                        ?.aggression
                        ?.description,
                ).toContain(
                    '0-100 tendency',
                );

                expect(
                    Object.keys(
                        captainFields ?? {},
                    ),
                ).toEqual([
                    'decisionTickDurationMs',
                    'decisionTickWiggleMs',
                    'threatTimingWiggleMs',
                    'aggression',
                ]);

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
