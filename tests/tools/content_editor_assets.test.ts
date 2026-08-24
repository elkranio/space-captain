import {
    mkdtemp,
    mkdir,
    readFile,
    rm,
    writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
    afterEach,
    describe,
    expect,
    it,
} from 'vitest';
import {
    SHIP_SPRITES,
} from '../../src/app/manifests/world/ships/ship_sprite';
import {
    ASSET_BUCKET_ID,
} from '../../tools/content-editor/server/asset_registry';
import {
    AssetOperationError,
    createAsset,
    listAssetRecords,
    replaceAsset,
} from '../../tools/content-editor/server/asset_service';

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
    'Content editor asset service',
    () => {
        it(
            'uses the migrated chassis sprite manifest',
            () => {
                expect(
                    SHIP_SPRITES
                        .generic_00
                        .frameKey,
                ).toBe(
                    'ships/chassis/generic_00',
                );

                expect(
                    SHIP_SPRITES
                        .unknown_00
                        .frameKey,
                ).toBe(
                    'ships/chassis/unknown_00',
                );
            },
        );

        it(
            'creates a PNG and its manifest entry together',
            async () => {
                const root =
                    await createTempRepo();

                await createAsset(
                    root,
                    ASSET_BUCKET_ID
                        .SHIP_CHASSIS,
                    'test_ship_00',
                    createPngBytes(1),
                );

                const records =
                    await listAssetRecords(
                        root,
                        ASSET_BUCKET_ID
                            .SHIP_CHASSIS,
                    );

                expect(
                    records,
                ).toEqual([
                    {
                        id:
                            'test_ship_00',

                        frameKey:
                            'ships/chassis/test_ship_00',

                        rawPath:
                            'assets/raw/images/ships/chassis/test_ship_00.png',

                        previewUrl:
                            '/__assets/ship_chassis/test_ship_00/preview',
                    },
                ]);

                const manifest =
                    JSON.parse(
                        await readFile(
                            path.join(
                                root,
                                'src/app/manifests/ships/ship_sprites.json',
                            ),
                            'utf8',
                        ),
                    ) as unknown;

                expect(
                    manifest,
                ).toEqual({
                    test_ship_00: {
                        frameKey:
                            'ships/chassis/test_ship_00',
                    },
                });
            },
        );

        it(
            'replaces image bytes without changing the manifest',
            async () => {
                const root =
                    await createTempRepo();

                await createAsset(
                    root,
                    ASSET_BUCKET_ID
                        .SHIP_CHASSIS,
                    'test_ship_00',
                    createPngBytes(1),
                );

                const manifestBefore =
                    await readFile(
                        path.join(
                            root,
                            'src/app/manifests/ships/ship_sprites.json',
                        ),
                        'utf8',
                    );

                await replaceAsset(
                    root,
                    ASSET_BUCKET_ID
                        .SHIP_CHASSIS,
                    'test_ship_00',
                    createPngBytes(2),
                );

                const png =
                    await readFile(
                        path.join(
                            root,
                            'assets/raw/images/ships/chassis/test_ship_00.png',
                        ),
                    );

                expect(
                    png.at(-1),
                ).toBe(2);

                expect(
                    await readFile(
                        path.join(
                            root,
                            'src/app/manifests/ships/ship_sprites.json',
                        ),
                        'utf8',
                    ),
                ).toBe(
                    manifestBefore,
                );
            },
        );

        it(
            'rejects duplicate ids and non-PNG uploads',
            async () => {
                const root =
                    await createTempRepo();

                await createAsset(
                    root,
                    ASSET_BUCKET_ID
                        .SHIP_CHASSIS,
                    'test_ship_00',
                    createPngBytes(1),
                );

                await expect(
                    createAsset(
                        root,
                        ASSET_BUCKET_ID
                            .SHIP_CHASSIS,
                        'test_ship_00',
                        createPngBytes(2),
                    ),
                ).rejects.toMatchObject({
                    statusCode: 409,
                });

                await expect(
                    createAsset(
                        root,
                        ASSET_BUCKET_ID
                            .SHIP_CHASSIS,
                        'bad_ship_00',
                        Buffer.from(
                            'not a png',
                        ),
                    ),
                ).rejects.toBeInstanceOf(
                    AssetOperationError,
                );
            },
        );
    },
);

async function createTempRepo():
    Promise<string> {
    const root =
        await mkdtemp(
            path.join(
                os.tmpdir(),
                'space-captain-assets-',
            ),
        );

    tempRoots.push(root);

    const manifestDirectory =
        path.join(
            root,
            'src/app/manifests/ships',
        );

    const rawDirectory =
        path.join(
            root,
            'assets/raw/images/ships/chassis',
        );

    await mkdir(
        manifestDirectory,
        {
            recursive: true,
        },
    );

    await mkdir(
        rawDirectory,
        {
            recursive: true,
        },
    );

    await writeFile(
        path.join(
            manifestDirectory,
            'ship_sprites.json',
        ),
        '{}\n',
        'utf8',
    );

    return root;
}

function createPngBytes(
    marker: number,
): Buffer {
    return Buffer.from([
        0x89,
        0x50,
        0x4e,
        0x47,
        0x0d,
        0x0a,
        0x1a,
        0x0a,
        marker,
    ]);
}
