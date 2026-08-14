import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    DEFENSE_TURRET_TUNING_SCHEMA,
} from '../../src/engine/content/schemas/defense_turrets';
import {
    CONTENT_COLLECTION_ID,
} from '../../tools/content-editor/server/content_registry';
import {
    getContentRecordDeleteInfo,
    validateContentCollectionReferences,
} from '../../tools/content-editor/server/content_references';

describe(
    'Content editor Defense Turret CRUD',
    () => {
        it(
            'accepts additional Defense Turret ids',
            () => {
                expect(
                    DEFENSE_TURRET_TUNING_SCHEMA
                        .safeParse({
                            defense_turret_basic_00: {
                                name:
                                    'BASIC DEFENSE TURRET',

                                loadDurationMs:
                                    3000,

                                cooldownDurationMs:
                                    5000,

                                blindInterceptChance:
                                    0.4,
                            },

                            rapid_00: {
                                name:
                                    'RAPID DEFENSE TURRET',

                                loadDurationMs:
                                    1500,

                                cooldownDurationMs:
                                    3500,

                                blindInterceptChance:
                                    0.6,
                            },
                        })
                        .success,
                ).toBe(true);
            },
        );

        it(
            'reports persistent ship preset usages for the built-in Defense Turret',
            async () => {
                const info =
                    await getContentRecordDeleteInfo(
                        process.cwd(),
                        CONTENT_COLLECTION_ID
                            .DEFENSE_TURRETS,
                        'defense_turret_basic_00',
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

                    ]),
                );
            },
        );

        it(
            'accepts an additional unused Defense Turret',
            async () => {
                await expect(
                    validateContentCollectionReferences(
                        process.cwd(),
                        CONTENT_COLLECTION_ID
                            .DEFENSE_TURRETS,
                        {
                            defense_turret_basic_00: {
                                name:
                                    'BASIC DEFENSE TURRET',

                                loadDurationMs:
                                    3000,

                                cooldownDurationMs:
                                    5000,

                                blindInterceptChance:
                                    0.4,
                            },

                            rapid_00: {
                                name:
                                    'RAPID DEFENSE TURRET',

                                loadDurationMs:
                                    1500,

                                cooldownDurationMs:
                                    3500,

                                blindInterceptChance:
                                    0.6,
                            },
                        },
                    ),
                ).resolves.toBeUndefined();
            },
        );

        it(
            'rejects removing a Defense Turret still used by a ship preset',
            async () => {
                await expect(
                    validateContentCollectionReferences(
                        process.cwd(),
                        CONTENT_COLLECTION_ID
                            .DEFENSE_TURRETS,
                        {
                            rapid_00: {
                                name:
                                    'RAPID DEFENSE TURRET',

                                loadDurationMs:
                                    1500,

                                cooldownDurationMs:
                                    3500,

                                blindInterceptChance:
                                    0.6,
                            },
                        },
                    ),
                ).rejects.toThrow(
                    'Cannot remove defense turret "defense_turret_basic_00"',
                );
            },
        );
    },
);
