import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    SHIELD_GENERATOR_TUNING_SCHEMA,
} from '../../src/engine/content/schemas/shield_generators';
import {
    CONTENT_COLLECTION_ID,
} from '../../tools/content-editor/server/content_registry';
import {
    getContentRecordDeleteInfo,
    validateContentCollectionReferences,
} from '../../tools/content-editor/server/content_references';

describe(
    'Content editor Shield Generator CRUD',
    () => {
        it(
            'accepts additional Shield Generator ids',
            () => {
                expect(
                    SHIELD_GENERATOR_TUNING_SCHEMA
                        .safeParse({
                            shield_generator_basic_00: {
                                name:
                                    'BASIC SHIELD GENERATOR',

                                shieldDurationMs:
                                    5000,

                                cooldownDurationMs:
                                    5000,
                            },

                            reinforced_00: {
                                name:
                                    'REINFORCED SHIELD GENERATOR',

                                shieldDurationMs:
                                    8000,

                                cooldownDurationMs:
                                    12000,
                            },
                        })
                        .success,
                ).toBe(true);
            },
        );

        it(
            'reports enemy and player preset usages for the built-in Shield Generator',
            () => {
                const info =
                    getContentRecordDeleteInfo(
                        CONTENT_COLLECTION_ID
                            .SHIELD_GENERATORS,
                        'shield_generator_basic_00',
                    );

                expect(
                    info.usages,
                ).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({
                            collection:
                                'Ship Presets',

                            recordId:
                                'generic_defense_sandbox_00',
                        }),

                        expect.objectContaining({
                            collection:
                                'Player Ship Presets',

                            recordId:
                                'starter_00',
                        }),
                    ]),
                );
            },
        );

        it(
            'accepts an additional unused Shield Generator',
            async () => {
                await expect(
                    validateContentCollectionReferences(
                        'unused-for-shield-generator-validation',
                        CONTENT_COLLECTION_ID
                            .SHIELD_GENERATORS,
                        {
                            shield_generator_basic_00: {
                                name:
                                    'BASIC SHIELD GENERATOR',

                                shieldDurationMs:
                                    5000,

                                cooldownDurationMs:
                                    5000,
                            },

                            reinforced_00: {
                                name:
                                    'REINFORCED SHIELD GENERATOR',

                                shieldDurationMs:
                                    8000,

                                cooldownDurationMs:
                                    12000,
                            },
                        },
                    ),
                ).resolves.toBeUndefined();
            },
        );

        it(
            'rejects removing a Shield Generator still used by presets',
            async () => {
                await expect(
                    validateContentCollectionReferences(
                        'unused-for-shield-generator-validation',
                        CONTENT_COLLECTION_ID
                            .SHIELD_GENERATORS,
                        {
                            reinforced_00: {
                                name:
                                    'REINFORCED SHIELD GENERATOR',

                                shieldDurationMs:
                                    8000,

                                cooldownDurationMs:
                                    12000,
                            },
                        },
                    ),
                ).rejects.toThrow(
                    'Cannot remove shield generator "shield_generator_basic_00"',
                );
            },
        );
    },
);
