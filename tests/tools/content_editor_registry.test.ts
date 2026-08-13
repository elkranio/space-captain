import {
    describe,
    expect,
    it,
} from 'vitest';
import missileData from '../../src/engine/content/data/missiles.json';
import officerTaskData from '../../src/engine/content/data/officer_tasks.json';
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
                expect(
                    validateContentCollection(
                        CONTENT_COLLECTION_ID
                            .OFFICER_TASKS,

                        officerTaskData,
                    ),
                ).toEqual(
                    officerTaskData,
                );

                expect(
                    validateContentCollection(
                        CONTENT_COLLECTION_ID
                            .SHIP_WEAPON_RULES,

                        shipWeaponRulesData,
                    ),
                ).toEqual(
                    shipWeaponRulesData,
                );

                expect(
                    validateContentCollection(
                        CONTENT_COLLECTION_ID
                            .SHIP_WEAPONS,

                        shipWeaponData,
                    ),
                ).toEqual(
                    shipWeaponData,
                );

                expect(
                    validateContentCollection(
                        CONTENT_COLLECTION_ID
                            .MISSILES,

                        missileData,
                    ),
                ).toEqual(
                    missileData,
                );
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
            },
        );
    },
);
