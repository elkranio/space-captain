import {
    mkdtemp,
    mkdir,
    rm,
    writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import debugStartData from '../../src/engine/content/data/debug_start.json';
import {
    afterEach,
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

const tempRoots:
    string[] = [];

afterEach(
    async () => {
        await Promise.all(
            tempRoots.splice(0)
                .map(
                    async (root) => {
                        await rm(
                            root,
                            {
                                recursive: true,
                                force: true,
                            },
                        );
                    },
                ),
        );
    },
);

describe(
    'Content editor chassis references',
    () => {
        it(
            'accepts an additional chassis when its sprite exists',
            async () => {
                const root =
                    await createTempRepo([
                        'generic_00',
                        'heavy_00',
                    ]);

                await expect(
                    validateContentCollectionReferences(
                        root,
                        CONTENT_COLLECTION_ID
                            .SHIP_CHASSIS,
                        {
                            generic_00: {
                                name:
                                    'Generic',

                                spriteId:
                                    'generic_00',

                                maxHull: 3,
                            },

                            heavy_00: {
                                name:
                                    'Heavy',

                                spriteId:
                                    'heavy_00',

                                maxHull: 5,
                            },
                        },
                    ),
                ).resolves.toBeUndefined();
            },
        );

        it(
            'rejects a chassis whose sprite is missing',
            async () => {
                const root =
                    await createTempRepo([
                        'generic_00',
                    ]);

                await expect(
                    validateContentCollectionReferences(
                        root,
                        CONTENT_COLLECTION_ID
                            .SHIP_CHASSIS,
                        {
                            generic_00: {
                                name:
                                    'Generic',

                                spriteId:
                                    'generic_00',

                                maxHull: 3,
                            },

                            heavy_00: {
                                name:
                                    'Heavy',

                                spriteId:
                                    'heavy_00',

                                maxHull: 5,
                            },
                        },
                    ),
                ).rejects.toThrow(
                    'references missing sprite "heavy_00"',
                );
            },
        );

        it(
            'reports ship presets that use the built-in chassis',
            async () => {
                const info =
                    await getContentRecordDeleteInfo(
                        process.cwd(),
                        CONTENT_COLLECTION_ID
                            .SHIP_CHASSIS,
                        'generic_00',
                    );

                expect(
                    info.usages.length,
                ).toBeGreaterThan(0);

                expect(
                    info.usages,
                ).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({
                            collection:
                                'Ship Presets',

                            recordId:
                                'generic_beam_cannon_00',
                        }),
                    ]),
                );
            },
        );

        it(
            'rejects removing a chassis still referenced by ship presets',
            async () => {
                const root =
                    await createTempRepo([
                        'generic_00',
                        'heavy_00',
                    ]);

                await expect(
                    validateContentCollectionReferences(
                        root,
                        CONTENT_COLLECTION_ID
                            .SHIP_CHASSIS,
                        {
                            heavy_00: {
                                name:
                                    'Heavy',

                                spriteId:
                                    'heavy_00',

                                maxHull: 5,
                            },
                        },
                    ),
                ).rejects.toThrow(
                    'Cannot remove ship chassis "generic_00"',
                );
            },
        );
    },
);

async function createTempRepo(
    spriteIds: string[],
): Promise<string> {
    const root =
        await mkdtemp(
            path.join(
                os.tmpdir(),
                'space-captain-chassis-',
            ),
        );

    tempRoots.push(root);

    const manifestDirectory =
        path.join(
            root,
            'src/app/manifests/world/ships',
        );

    await mkdir(
        manifestDirectory,
        {
            recursive: true,
        },
    );

    const manifest =
        Object.fromEntries(
            spriteIds.map(
                (spriteId) => {
                    return [
                        spriteId,
                        {
                            frameKey:
                                'world/ships/chassis/' +
                                spriteId,
                        },
                    ];
                },
            ),
        );

    await writeFile(
        path.join(
            manifestDirectory,
            'ship_sprites.json',
        ),
        (
            JSON.stringify(
                manifest,
                null,
                4,
            ) +
            '\n'
        ),
        'utf8',
    );

    const contentDataDirectory =
        path.join(
            root,
            'src/engine/content/data',
        );

    await mkdir(
        contentDataDirectory,
        {
            recursive: true,
        },
    );

    await writeFile(
        path.join(
            contentDataDirectory,
            'debug_start.json',
        ),
        (
            JSON.stringify(
                debugStartData,
                null,
                4,
            ) +
            '\n'
        ),
        'utf8',
    );

    return root;
}
