import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    CONTENT_COLLECTION_ID,
} from '../../tools/content-editor/server/content_registry';
import {
    getContentRecordDeleteInfo,
    validateContentCollectionReferences,
} from '../../tools/content-editor/server/content_references';

describe(
    'Content editor ship drive CRUD',
    () => {
        it(
            'reports enemy and player preset usages for the built-in drive',
            async () => {
                const info =
                    await getContentRecordDeleteInfo(
                        process.cwd(),
                        CONTENT_COLLECTION_ID
                            .SHIP_DRIVES,
                        'basic_00',
                    );

                expect(
                    info.usages,
                ).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({
                            collection:
                                'Ship Presets',

                            recordId:
                                'generic_laser_00',
                        }),

                        expect.objectContaining({
                            collection:
                                'Player Ship Presets',

                            recordId:
                                'starter_00',
                        }),
                    ]),
                );

                expect(
                    info.usages.length,
                ).toBeGreaterThan(1);
            },
        );

        it(
            'accepts an additional unused drive',
            async () => {
                await expect(
                    validateContentCollectionReferences(
                        'unused-for-drive-validation',
                        CONTENT_COLLECTION_ID
                            .SHIP_DRIVES,
                        {
                            basic_00: {
                                name:
                                    'BASIC DRIVE',
                            },

                            fast_00: {
                                name:
                                    'FAST DRIVE',
                            },
                        },
                    ),
                ).resolves.toBeUndefined();
            },
        );

        it(
            'rejects removing a drive still used by ship presets',
            async () => {
                await expect(
                    validateContentCollectionReferences(
                        'unused-for-drive-validation',
                        CONTENT_COLLECTION_ID
                            .SHIP_DRIVES,
                        {
                            fast_00: {
                                name:
                                    'FAST DRIVE',
                            },
                        },
                    ),
                ).rejects.toThrow(
                    'Cannot remove ship drive "basic_00"',
                );
            },
        );
    },
);
