import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    POWER_CORE_TUNING_SCHEMA,
} from '../../src/engine/content/schemas/power_cores';
import {
    CONTENT_COLLECTION_ID,
} from '../../tools/content-editor/server/content_registry';
import {
    getContentRecordDeleteInfo,
    validateContentCollectionReferences,
} from '../../tools/content-editor/server/content_references';

describe(
    'Content editor Power Core CRUD',
    () => {
        it(
            'accepts additional Power Core ids',
            () => {
                expect(
                    POWER_CORE_TUNING_SCHEMA
                        .safeParse({
                            power_core_basic_00: {
                                name:
                                    'MK.I POWER CORE',
                                shortName:
                                    'POWER CORE',

                                capacity: 4,

                                rechargeDurationMs:
                                    24000,
                            },

                            overcharged_00: {
                                name:
                                    'OVERCHARGED CORE',
                                shortName:
                                    'OVERCHARGED',

                                capacity: 6,

                                rechargeDurationMs:
                                    32000,
                            },
                        })
                        .success,
                ).toBe(true);
            },
        );

        it(
            'reports persistent ship preset usages for the built-in Power Core',
            async () => {
                const info =
                    await getContentRecordDeleteInfo(
                        process.cwd(),
                        CONTENT_COLLECTION_ID
                            .POWER_CORES,
                        'power_core_basic_00',
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
            'accepts an additional unused Power Core',
            async () => {
                await expect(
                    validateContentCollectionReferences(
                        process.cwd(),
                        CONTENT_COLLECTION_ID
                            .POWER_CORES,
                        {
                            power_core_basic_00: {
                                name:
                                    'MK.I POWER CORE',

                                capacity: 4,

                                rechargeDurationMs:
                                    24000,
                            },

                            overcharged_00: {
                                name:
                                    'OVERCHARGED CORE',

                                capacity: 6,

                                rechargeDurationMs:
                                    32000,
                            },
                        },
                    ),
                ).resolves.toBeUndefined();
            },
        );

        it(
            'rejects removing a Power Core still used by presets',
            async () => {
                await expect(
                    validateContentCollectionReferences(
                        process.cwd(),
                        CONTENT_COLLECTION_ID
                            .POWER_CORES,
                        {
                            overcharged_00: {
                                name:
                                    'OVERCHARGED CORE',

                                capacity: 6,

                                rechargeDurationMs:
                                    32000,
                            },
                        },
                    ),
                ).rejects.toThrow(
                    'Cannot remove power core "power_core_basic_00"',
                );
            },
        );
    },
);
