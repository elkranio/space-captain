import liveData from '../../src/engine/content/data/defense_turrets.json';
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

const rapidTurret = {
    ...liveData.defense_turret_basic_00,
    name: 'RAPID DEFENSE TURRET',
    shortName: 'RAPID TURRET',
    loadDurationMs: 1500,
    cooldownDurationMs: 3500,
};

describe(
    'Content editor Defense Turret CRUD',
    () => {
        it(
            'accepts additional Defense Turret ids',
            () => {
                expect(
                    DEFENSE_TURRET_TUNING_SCHEMA
                        .safeParse({
                            ...liveData,
                            rapid_00: rapidTurret,
                        })
                        .success,
                ).toBe(true);
            },
        );

        it(
            'reports Debug Start usages for the built-in Defense Turret',
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
                    [
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
                    ],
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
                            ...liveData,
                            rapid_00: rapidTurret,
                        },
                    ),
                ).resolves.toBeUndefined();
            },
        );

        it(
            'rejects removing a Defense Turret still used by Debug Start',
            async () => {
                await expect(
                    validateContentCollectionReferences(
                        process.cwd(),
                        CONTENT_COLLECTION_ID
                            .DEFENSE_TURRETS,
                        {
                            ...Object.fromEntries(Object.entries(liveData).filter(([id]) => id !== 'defense_turret_basic_00')),
                            rapid_00: rapidTurret,
                        },
                    ),
                ).rejects.toThrow(
                    'Cannot remove defense turret "defense_turret_basic_00"',
                );
            },
        );
    },
);
