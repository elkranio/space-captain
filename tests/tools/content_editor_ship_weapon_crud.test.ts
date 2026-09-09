import {
    describe,
    expect,
    it,
} from 'vitest';
import missileLauncherData from '../../src/engine/content/data/missile_launchers.json';
import {
    CONTENT_COLLECTION_ID,
    validateContentCollectionMutation,
} from '../../tools/content-editor/server/content_registry';
import {
    getContentRecordDeleteInfo,
    validateContentCollectionReferences,
} from '../../tools/content-editor/server/content_references';

const heavyLauncher = {
    ...missileLauncherData.missile_launcher_00,
    name: 'HEAVY LAUNCHER',
    shortName: 'HEAVY LAUNCHER',
    damage: 2,
    flightDurationMs: 14000,
    ammoCapacity: 3,
    cooldownDurationMs: 18000,
};

describe(
    'Content editor ship weapon CRUD',
    () => {
        it(
            'reports Debug Start usages for mounted weapon families',
            async () => {
                const cases = [
                    [
                        CONTENT_COLLECTION_ID
                            .MISSILE_LAUNCHERS,
                        'missile_launcher_00',
                    ],
                    [
                        CONTENT_COLLECTION_ID
                            .BEAM_CANNONS,
                        'beam_cannon_00',
                    ],
                    [
                        CONTENT_COLLECTION_ID
                            .STICKY_MINE_DISPENSERS,
                        'sticky_mine_dispenser_00',
                    ],
                ] as const;

                for (
                    const [
                        collectionId,
                        recordId,
                    ] of cases
                ) {
                    const info =
                        await getContentRecordDeleteInfo(
                            process.cwd(),
                            collectionId,
                            recordId,
                        );

                    expect(
                        info.usages,
                    ).toContainEqual({
                        collection:
                            'Debug Start',

                        recordId:
                            'player',

                        label:
                            'Player Ship',
                    });
                }
            },
        );

        it(
            'allows adding an unused launcher record',
            async () => {
                const nextData = {
                    ...missileLauncherData,
                    heavy_launcher_00: heavyLauncher,
                };

                expect(() => {
                    validateContentCollectionMutation(
                        CONTENT_COLLECTION_ID
                            .MISSILE_LAUNCHERS,
                        missileLauncherData,
                        nextData,
                    );
                }).not.toThrow();

                await expect(
                    validateContentCollectionReferences(
                        process.cwd(),
                        CONTENT_COLLECTION_ID
                            .MISSILE_LAUNCHERS,
                        nextData,
                    ),
                ).resolves.toBeUndefined();
            },
        );

        it(
            'rejects removing a weapon still used by Debug Start',
            async () => {
                await expect(
                    validateContentCollectionReferences(
                        process.cwd(),
                        CONTENT_COLLECTION_ID
                            .MISSILE_LAUNCHERS,
                        {},
                    ),
                ).rejects.toThrow(
                    'Cannot remove missile launcher "missile_launcher_00"',
                );
            },
        );

        it(
            'rejects duplicate ids across weapon families',
            async () => {
                await expect(
                    validateContentCollectionReferences(
                        process.cwd(),
                        CONTENT_COLLECTION_ID
                            .MISSILE_LAUNCHERS,
                        {
                            ...missileLauncherData,
                            beam_cannon_00: {
                                ...missileLauncherData.missile_launcher_00,
                                name: 'NOT REALLY A LAUNCHER',
                            },
                        },
                    ),
                ).rejects.toThrow(
                    'Ship weapon id "beam_cannon_00" is already defined in another weapon family.',
                );
            },
        );
    },
);
