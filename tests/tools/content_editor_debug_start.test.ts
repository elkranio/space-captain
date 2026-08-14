import {
    describe,
    expect,
    it,
} from 'vitest';
import beamCannonData from '../../src/engine/content/data/beam_cannons.json';
import debugStartData from '../../src/engine/content/data/debug_start.json';
import missileLauncherData from '../../src/engine/content/data/missile_launchers.json';
import spamProjectorData from '../../src/engine/content/data/spam_projectors.json';
import stickyMineDispenserData from '../../src/engine/content/data/sticky_mine_dispensers.json';
import {
    CONTENT_COLLECTION_ID,
    type ContentCollectionId,
} from '../../tools/content-editor/server/content_registry';
import {
    getContentRecordDeleteInfo,
    validateContentCollectionReferences,
} from '../../tools/content-editor/server/content_references';

const SHIP_WEAPON_COLLECTIONS:
    Array<{
        collectionId:
            ContentCollectionId;

        data:
            object;
    }> = [
        {
            collectionId:
                CONTENT_COLLECTION_ID
                    .MISSILE_LAUNCHERS,

            data:
                missileLauncherData,
        },
        {
            collectionId:
                CONTENT_COLLECTION_ID
                    .BEAM_CANNONS,

            data:
                beamCannonData,
        },
        {
            collectionId:
                CONTENT_COLLECTION_ID
                    .SPAM_PROJECTORS,

            data:
                spamProjectorData,
        },
        {
            collectionId:
                CONTENT_COLLECTION_ID
                    .STICKY_MINE_DISPENSERS,

            data:
                stickyMineDispenserData,
        },
    ];

describe(
    'Content editor Debug Start',
    () => {
        it(
            'accepts the canonical player and enemy loadouts',
            async () => {
                await expect(
                    validateContentCollectionReferences(
                        process.cwd(),
                        CONTENT_COLLECTION_ID
                            .DEBUG_START,
                        debugStartData,
                    ),
                ).resolves.toBeUndefined();
            },
        );

        it(
            'rejects a missing content reference',
            async () => {
                await expect(
                    validateContentCollectionReferences(
                        process.cwd(),
                        CONTENT_COLLECTION_ID
                            .DEBUG_START,
                        {
                            ...debugStartData,

                            player: {
                                ...debugStartData
                                    .player,

                                driveId:
                                    'missing_drive_00',
                            },
                        },
                    ),
                ).rejects.toThrow(
                    'Debug Start player.driveId references missing ship drive "missing_drive_00".',
                );
            },
        );

        it(
            'exposes current Debug Start equipment as delete blockers',
            async () => {
                const playerDriveInfo =
                    await getContentRecordDeleteInfo(
                        process.cwd(),
                        CONTENT_COLLECTION_ID
                            .SHIP_DRIVES,
                        debugStartData
                            .player
                            .driveId,
                    );

                expect(
                    playerDriveInfo.usages,
                ).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({
                            collection:
                                'Debug Start',

                            recordId:
                                'player',
                        }),
                    ]),
                );

                const enemyChassisInfo =
                    await getContentRecordDeleteInfo(
                        process.cwd(),
                        CONTENT_COLLECTION_ID
                            .SHIP_CHASSIS,
                        debugStartData
                            .enemy
                            .chassisId,
                    );

                expect(
                    enemyChassisInfo.usages,
                ).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({
                            collection:
                                'Debug Start',

                            recordId:
                                'enemy',
                        }),
                    ]),
                );

                const playerWeaponId =
                    debugStartData
                        .player
                        .weaponSlot1Id;

                const weaponCollection =
                    SHIP_WEAPON_COLLECTIONS
                        .find(
                            ({
                                data,
                            }) => {
                                return (
                                    Object.prototype
                                        .hasOwnProperty.call(
                                            data,
                                            playerWeaponId,
                                        )
                                );
                            },
                        );

                if (!weaponCollection) {
                    throw new Error(
                        'Configured player weapon is missing from editor weapon collections.',
                    );
                }

                const weaponInfo =
                    await getContentRecordDeleteInfo(
                        process.cwd(),
                        weaponCollection
                            .collectionId,
                        playerWeaponId,
                    );

                expect(
                    weaponInfo.usages,
                ).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({
                            collection:
                                'Debug Start',

                            recordId:
                                'player',
                        }),
                    ]),
                );
            },
        );
    },
);
