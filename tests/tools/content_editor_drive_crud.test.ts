import liveData from '../../src/engine/content/data/ship_drives.json';
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

const fastDrive = {
    ...liveData.basic_00,
    name: 'FAST DRIVE',
    shortName: 'FAST DRIVE',
};

describe(
    'Content editor ship drive CRUD',
    () => {
        it(
            'reports Debug Start usages for the built-in drive',
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
                ).toEqual([
                    {
                        collection:
                            'Debug Start',

                        recordId:
                            'player',

                        label:
                            'Player Ship',
                    },
                    {
                        collection:
                            'Debug Start',

                        recordId:
                            'enemy',

                        label:
                            'Enemy Ship',
                    },
                ]);
            },
        );

        it(
            'accepts an additional unused drive',
            async () => {
                await expect(
                    validateContentCollectionReferences(
                        process.cwd(),
                        CONTENT_COLLECTION_ID
                            .SHIP_DRIVES,
                        {
                            ...liveData,
                            fast_00: fastDrive,
                        },
                    ),
                ).resolves.toBeUndefined();
            },
        );

        it(
            'rejects removing a drive still used by Debug Start',
            async () => {
                await expect(
                    validateContentCollectionReferences(
                        process.cwd(),
                        CONTENT_COLLECTION_ID
                            .SHIP_DRIVES,
                        {
                            ...Object.fromEntries(Object.entries(liveData).filter(([id]) => id !== 'basic_00')),
                            fast_00: fastDrive,
                        },
                    ),
                ).rejects.toThrow(
                    'Cannot remove ship drive "basic_00"',
                );
            },
        );
    },
);
