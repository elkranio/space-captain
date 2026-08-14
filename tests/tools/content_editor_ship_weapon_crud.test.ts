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

describe(
    'Content editor ship weapon CRUD',
    () => {
        it(
            'reports preset usages for every built-in weapon family',
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
                            .SPAM_PROJECTORS,
                        'spam_projector_00',
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
                        info.usages.length,
                    ).toBeGreaterThan(0);
                }
            },
        );

        it(
            'allows adding an unused launcher record',
            async () => {
                const nextData = {
                    ...missileLauncherData,

                    heavy_launcher_00: {
                        name:
                            'HEAVY LAUNCHER',

                        damage: 2,
                        flightDurationMs:
                            14000,
                        ammoCapacity: 3,
                        cooldownDurationMs:
                            18000,
                    },
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
            'rejects removing a weapon still used by ship presets',
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
                                name:
                                    'NOT REALLY A LAUNCHER',

                                damage: 1,
                                flightDurationMs:
                                    12000,
                                ammoCapacity: 5,
                                cooldownDurationMs:
                                    15000,
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
